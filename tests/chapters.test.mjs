// Главы «Частиц» (урок 42): эпоха 1 — главы 1–6 по шагам задания, эпохи 2–4 — глава на эпоху (7 Хиггс, 8 Распады,
// 9 Аннигиляция). Лента главы без паузы; впервые — дольше, в повторном забеге — коротко. Норматива времени нет нигде,
// ★ «быстрее» нет. Передышка между эпохами впервые длиннее. Впервые первая волна эпохи 4 — учебная.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const html = g => g.ev(`document.getElementById('cinein').innerHTML`);
// эпоха i сразу: свет есть, лента «Глава» — через 4,5 с после плашки эпохи
const toEpoch = (i, storage) => {
  const g = loadGame({ storage });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); G.stage.startEpoch(${i}); Cine.clear(); Cine.tick(99)`);
  return g;
};
// кадр-пауза знания (впервые в жизни) идёт раньше — лента главы ждёт в очереди; паузу закрываем кликом
const ribbon = g => { for (let k = 0; k < 60 * 8; k++) { g.step(1); g.ev('if (Cine.stop) { Cine.t = 1; Cine.skip(); }'); if (g.ev('Cine.on && Cine.free && /Глава/.test(document.getElementById("cinein").innerHTML)')) return html(g); } return ''; };

for (const [i, ch, name] of [[1, 7, 'Хиггс'], [2, 8, 'Распады'], [3, 9, 'Аннигиляция']]) {
  test(`глава ${ch} «${name}»: эпоха ${i + 1} — лента после плашки эпохи, без паузы; шапка «ЭПОХА ${i + 1} · ГЛАВА ${ch}»; в повторном забеге лента короче`, () => {
    const g = toEpoch(i);
    assert.equal(g.ev('G.stage.chapOf()'), ch);
    g.step(60 * 2);
    assert.equal(g.ev('G.stage.chap') < ch, true, 'пока идёт плашка эпохи — ленты главы нет');
    const h = ribbon(g);
    assert.match(h, new RegExp(`Глава ${ch}`)); assert.match(h, new RegExp(name));
    assert.equal(g.ev('Cine.stop'), false, 'лента не останавливает игру');
    assert.equal(g.ev('Cine.dur'), 6.5, 'впервые — дольше');
    assert.equal(g.ev(`Known.has('chap:${ch}')`), true);
    // второй забег: глава знакома — лента короткая
    const g2 = toEpoch(i, Object.fromEntries(g.store));
    assert.match(ribbon(g2), new RegExp(`Глава ${ch}`));
    assert.equal(g2.ev('Cine.dur'), 3, 'знакомая глава — коротко');
  });
}

test('шапка задания: эпохи 2–4 — «ЭПОХА N · ГЛАВА M»', () => {
  const g = toEpoch(1);
  const kick = g.ev(`(() => { let k = ''; const f = hudTask; hudTask = (a, tk, kicker, ...r) => { k = kicker; }; G.stage.drawClock(1); hudTask = f; return k; })()`);
  assert.equal(kick, 'ЭПОХА 2 · ГЛАВА 7');
});

test('норматива нет: в итогах эпохи нет строки «быстрее», ★ «быстрее» нет ни в одной эпохе', () => {
  const g = toEpoch(1);
  for (const i of [0, 1, 2, 3]) assert.ok(!g.ev(`G.stage.starPool(${i}).some(s => /быстрее/.test(s.t))`), `эпоха ${i + 1}`);
  const rows = g.ev(`(() => { let r = null; const n = Tally.note; Tally.note = function (k, nm, rows, ...x) { r = rows; return n.call(this, k, nm, rows, ...x); };
    const S = G.stage; S.doneAt = 10; S.showResult(); Tally.note = n; return JSON.stringify(r); })()`);
  assert.ok(!/быстрее/.test(rows), rows);
  assert.equal(g.ev('typeof PAR'), 'undefined');
});

test('передышка между эпохами: впервые — дольше (итоги, Вселенная работает сама), глава знакома — коротко', () => {
  const g = toEpoch(1);
  g.ev(`G.stage.steps = () => [{ t: 'x', s: '', d: true }]; G.stage.checkGoals()`);
  assert.equal(g.ev('G.stage.epGap'), g.ev('GAP_NEW'), 'глава 8 впервые');
  const g2 = toEpoch(1, { 'proto.known': JSON.stringify(['gest:school', 'chap:8']) });
  g2.ev(`G.stage.steps = () => [{ t: 'x', s: '', d: true }]; G.stage.checkGoals()`);
  assert.equal(g2.ev('G.stage.epGap'), g2.ev('GAP'));
});

test('глава 9: впервые первая волна учебная — две медленные античастицы и подсказка про щит; потом — обычная', () => {
  const g = toEpoch(3);
  const said = [];
  g.ev(`(() => { const S = G.stage, f = S.float; globalThis.__said = []; S.float = function (x, y, t, ...r) { __said.push(t); return f.call(this, x, y, t, ...r); }; })()`);
  assert.equal(g.ev('G.stage.wave.edu'), true);
  assert.ok(g.ev('G.stage.wave.cd') > 8, 'учебная волна — после ленты главы');
  for (let k = 0; k < 60 * 14 && !g.ev('G.stage.wave.cur'); k++) g.step(1);
  assert.equal(g.ev('G.stage.wave.n'), 1);
  assert.equal(g.ev('G.stage.wave.cur.list.length'), 2, 'учебная — две античастицы');
  said.push(...g.ev('__said'));
  assert.ok(said.some(t => /учебная волна/.test(t)), String(said));
  g.step(2);
  const slow = g.ev('Math.max(...G.stage.wave.cur.list.map(o => G.stage.speed(o)))');
  assert.ok(slow <= g.ev('WAVE_V') / 2, `учебная — вдвое медленнее обычной: ${slow}`);
  // повторный забег: глава 9 знакома — первая волна обычная
  const g2 = toEpoch(3, { 'proto.known': JSON.stringify(['gest:school', 'chap:9']) });
  assert.equal(g2.ev('G.stage.wave.edu'), false);
  assert.equal(g2.ev('G.stage.wave.cd'), 8);
  for (let k = 0; k < 60 * 10 && !g2.ev('G.stage.wave.cur'); k++) g2.step(1);
  assert.equal(g2.ev('G.stage.wave.cur.list.length'), 4, 'первая обычная волна — четыре');
});

test('глава 9: щит понятен — один круг держит и бьёт; разрядился в руке — бьёт сам; без заряда не поднимается; волна быстрая', () => {
  const g = toEpoch(3);
  // волна: обычная — ~2,3 ед/с (от края кадра до ядра ~4 с), учебная — вдвое медленнее
  assert.ok(g.ev('WAVE_V') >= 2 && g.ev('WAVE_V_EDU') <= g.ev('WAVE_V') / 2);
  const hold = (secs, js = '') => g.ev(`(() => { const S = G.stage; S.p.forEach(o => { if (SM[o.sp].kind === 'quark') o.dead = true; }); ${js};
    globalThis.__aq = S.mk('u', true, P.x + S.shR() * 1.5, P.y, Math.PI, .1); __aq.born = 1; __aq.cd = 9; __aq.wave = true;
    mouse.clicked = true; mouse.down = true; for (let i = 0; i < 60 * ${secs}; i++) update(1 / 60);
    return { sh: S.shield, off: !!(S.focus && S.focus.off), d: Math.hypot(__aq.x - P.x, __aq.y - P.y), dead: __aq.dead, R: S.shR(), pR: S.pulseR(), core: S.coreR() }; })()`);
  // щит — стена: антикварк волны толчётся у края, до ядра не доходит; удар достаёт его там
  let r = hold(2, 'G.stage.shield = 1');
  assert.ok(!r.dead && r.d > r.R * .8 && r.d < r.pR && r.sh > .4, JSON.stringify(r));
  g.ev('mouse.down = false; update(1 / 60)');
  assert.ok(g.ev('__aq.rep') > 1.5, 'отпустил — ударная волна отбросила его');
  // продержал до нуля — щит сам ударил и затих (а не погас молча)
  g.ev('mouse.down = false; for (let i = 0; i < 60; i++) update(1 / 60)');
  r = hold(4.5, 'G.stage.shield = 1');
  assert.equal(r.sh, 0); assert.equal(r.off, true);
  g.ev('mouse.down = false; update(1 / 60)');
  // без заряда — не поднимается: антикварк проходит к ядру
  r = hold(2.5, 'G.stage.shield = .1');
  assert.equal(r.off, true); assert.ok(r.sh >= .1 - 1e-9, 'не тратится'); assert.ok(r.dead || r.d < r.core, JSON.stringify(r));
  g.ev('mouse.down = false; update(1 / 60)');
});
