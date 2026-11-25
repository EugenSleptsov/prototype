// Баги логики из аудита: ⁴He + ⁴He в «Ядрах», нейтральность «Атомов» при улетевших ядрах, финал «Молекул»,
// ручной поворот молекулы при прицеливании, зависшая «отмена вторым пальцем».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}

test('ядра: ⁴He + ⁴He — не реакция (без «нового» гелия и ✦), ⁷Li + p → две альфы — по-прежнему', () => {
  const g = toStage('nuclei');
  const he = '{ Z: 2, N: 2 }';
  assert.equal(g.ev(`G.stage.judge(${he}, ${he}, 15, true).kind`), 'no');
  assert.equal(g.ev(`G.stage.outcome({ Z: 3, N: 4 }, { Z: 1, N: 0 }, true).out.length`), 2);
  // автоматика больше не выбирает пару ⁴He + ⁴He
  g.ev(`G.stage.rs.syn = 1; for (const o of G.stage.o) o.dead = true; G.stage.o = [];
    const a = G.stage.mk(2, 2, P.x, P.y), b = G.stage.mk(2, 2, P.x + 2, P.y); a.age = b.age = 2; G.stage.autoCd = 0; G.stage.autoFuse(1 / 60)`);
  assert.equal(g.ev(`G.stage.o.filter(o => o.thrown === 'auto').length`), 0);
});

test('атомы: доля нейтральных — по ионам у кадра, улетевшее далеко голое ядро её не держит', () => {
  const g = toStage('atoms');
  g.ev(`for (const i of G.stage.ions) i.dead = true; G.stage.ions = [];
    const a = G.stage.ion(8, P.x, P.y, 1); a.ne = 8; G.stage.ions.push(a);
    const far = G.stage.ion(8, P.x + viewRadius() * 6, P.y, 1); far.mine = true; G.stage.ions.push(far)`);
  assert.equal(g.ev('G.stage.neutral()'), 1);
  g.ev('P.x += viewRadius() * 6; cam.x = P.x');
  assert.equal(g.ev('G.stage.neutral()'), 0, 'там, где голое ядро, — 0');
});

test('молекулы: финал — итоги уровня и ✦ последнего кадра в очках', () => {
  const g = toStage('molecules');
  g.ev('G.stage.cheat(); G.stage.st.soup = 99; Cine.clear(); Cine.tick(99)');
  g.ev('update(1 / 60)');
  assert.equal(g.ev('G.ended'), true);
  assert.match(g.ev(`document.getElementById('tally').innerHTML`), /Молекулы/);
  assert.equal(g.ev('G.knSeen'), g.ev('G.stage.kn'), 'все ✦ — в очках');
});

test('молекулы: повернул Q / E при прицеливании — прицел не доворачивает обратно', () => {
  const g = toStage('molecules');
  g.ev(`for (const m of G.stage.m) m.dead = true; G.stage.m = [];
    const S = G.stage, C = S.newMol('C', P.x, P.y); C.age = 2; globalThis.__C = C;
    const [sx, sy] = W2S(C.x, C.y); mouse.x = sx; mouse.y = sy; mouse.has = true; mouse.down = true; update(1 / 60)`);
  assert.equal(g.ev('G.stage.sl.held === __C'), true, 'взял');
  g.ev(`keys.add('KeyQ'); update(1 / 60); keys.delete('KeyQ')`);
  assert.equal(g.ev('__C.manRot'), true);
  const a0 = g.ev('__C.a');
  g.ev('G.stage.predict(__C, 20, 7)');
  assert.equal(g.ev('__C.a'), a0, 'угол не перезаписан');
  g.ev('G.stage.hold(__C)'); assert.equal(g.ev('__C.manRot'), false, 'новый захват — снова автоповорот');
});

test('рогатка: щипок без тела в руке не отменяет следующий бросок', () => {
  const g = toStage('nuclei');
  g.ev('mouse.cancel = true; G.stage.sl.update()');
  assert.equal(g.ev('mouse.cancel'), false);
});

test('кварки: Δ собрать можно (uuu), но поле сперва берёт тот, с кем выйдет протон', () => {
  const g = toStage('quarks');
  g.ev(`(() => { const S = G.stage; for (const o of S.q) o.dead = true; S.q = [];
    const a = S.mk(P.x, P.y, 0, false, 'u'), b = S.mk(P.x, P.y, 1, false, 'u'); a.cap = b.cap = true;
    globalThis.__u = S.mk(P.x + .2, P.y, 2, false, 'u'); globalThis.__d = S.mk(P.x + .5, P.y, 2, false, 'd'); __u.age = __d.age = 1;
    S.focus = { cap: [a, b], had: [], ang: 0, t: 0, tog: 0, tog2: 0 }; S.tickFocus(1 / 60); })()`);
  assert.equal(g.ev('__d.cap'), true, 'ближе u, но взят d — выйдет uud');
  assert.ok(!g.ev('__u.cap'));
  g.ev(`(() => { const S = G.stage; __d.cap = false; __d.dead = true; S.focus.cap = S.focus.cap.filter(o => o !== __d); S.tickFocus(1 / 60); })()`);
  assert.equal(g.ev('__u.cap'), true, 'другого нет — берёт и u: Δ достижим');
});

test('ядра: тупик (нет нейтронов) — конец через несколько секунд, без бонуса уровня и ★ «до конца»', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.t = 61; G.stage.stuck = () => true`); // тупик: в кадре ни нейтронов, ни «недостроенного»
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.doneAt'), null, 'миг тупика — ещё не конец');
  g.step(60 * 2);
  assert.notEqual(g.ev('G.stage.doneAt'), null, 'уровень кончился');
  assert.equal(g.ev('G.stage.failed'), true);
  assert.ok(g.ev(`G.stage.stars.filter(s => s.atEnd).every(s => s.st !== 1)`), '«до конца без ошибок» не засчитан');
});

test('частицы: ⚡ кончилась на разгоне вещества — один «пшик», а не каждый кадр', () => {
  const g = toStage('particles');
  const dry = g.ev(`(() => { const S = G.stage; const d0 = S.st.dry; S.en = 0;
    S.focus = { cap: [], q: 0, E: 0, lv: 0, ang: 0, t: 0 };
    const a = S.mk('e', false, P.x, P.y, 0, 1), b = S.mk('e', true, P.x, P.y, 0, 1); a.cap = b.cap = true; a.born = b.born = 1; S.focus.cap = [a, b];
    const on = S.enOn; S.enOn = () => true; for (let i = 0; i < 30; i++) S.tickFocus(1 / 60); S.enOn = on; return S.st.dry - d0; })()`);
  assert.equal(dry, 1);
});
