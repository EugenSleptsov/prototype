// «Атомы» не бесконечны (игрок: «набрать 90 невозможно, остаюсь на 80»): цель 90 % та же, но с охоты (HUNT_AT)
// или с A_LATE идут часы A_COOL — потом туманность остывает сама: конец без бонуса, дальше — «Молекулы».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function atoms() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Cine.tick(99)');
  g.step(120);
  return g;
}

test('атомы: часы остывания не идут, пока до охоты далеко и времени мало', () => {
  const g = atoms();
  assert.ok(g.ev('G.stage.neutral()') < g.ev('HUNT_AT'));
  g.step(60 * 5);
  assert.equal(g.ev('G.stage.coolAt'), null);
  assert.equal(g.ev('G.stage.doneAt'), null);
});

test('атомы: застрял ниже 90 % — с A_LATE часы, стоп-кадр; вышли — остыла сама, без бонуса, дальше «Молекулы»', () => {
  const g = atoms();
  g.ev('G.stage.clock = A_LATE + .1'); g.step(1);
  assert.ok(g.ev('G.stage.coolAt') !== null, 'часы пошли');
  assert.equal(g.ev('Spot.on'), true); assert.equal(g.ev('Spot.txt'), 'Туманность остывает');
  g.ev('Spot.end()');
  // на экране — сколько осталось
  const txt = g.ev(`(() => { const L = []; const f = label; label = (t, ...r) => { L.push(t); }; G.stage.overlay(1); label = f; return L.join('|'); })()`);
  assert.match(txt, /остынет сама через 1:30/);
  g.step(60 * 2);
  assert.equal(g.ev('G.stage.doneAt'), null, 'пока часы идут — играешь');
  g.ev('G.stage.clock = G.stage.coolAt + A_COOL'); g.step(1);
  assert.equal(g.ev('G.stage.failed'), true);
  assert.ok(g.ev('G.stage.doneAt') !== null);
  assert.equal(g.ev('G.stage.steps()[4].d'), false, 'цель не засчитана: 90 % не снижены');
  assert.match(g.ev('JSON.stringify(G.stage.tally().rows)'), /доля нейтральных/);
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.key'), 'molecules', 'уровень кончился — не бесконечный');
});

test('атомы: часы идут с охоты; успел к 90 % — пройден с бонусом', () => {
  const g = atoms();
  g.ev('globalThis.__n0 = G.stage.neutral; G.stage.neutral = () => .8'); g.step(1);
  assert.ok(g.ev('G.stage.coolAt') !== null, 'выше HUNT_AT — часы');
  g.ev('G.stage.cheat()'); g.ev('G.stage.neutral = __n0'); g.step(1);
  assert.ok(g.ev('G.stage.doneAt') !== null);
  assert.equal(g.ev('G.stage.failed'), false);
  g.ev('G.stage.clock = G.stage.coolAt + A_COOL + 5'); g.step(1);
  assert.equal(g.ev('G.stage.failed'), false, 'часы после цели не трогают');
});

// REVIEW_NEON_4 §4 п. 2: часы называют всё несделанное; после провала туманность застыла; шкала — вниз
const hud = g => g.ev(`(() => { const L = []; const f = label; label = (t, ...r) => { L.push(t); }; G.stage.overlay(1); label = f; return L.join('|'); })()`);

test('атомы: 92 %, но не одет C — часы и стоп-кадр так и говорят (не «успей до 90 %»)', () => {
  const g = atoms();
  g.ev('globalThis.__n0 = G.stage.neutral; const S = G.stage; S.neutral = () => .92; S.st.brakes = S.st.relaxed = 1; S.rs.rec = 1; for (const Z of AT_NEED) if (Z !== 6) S.seenN.add(Z)');
  g.play(2);
  assert.ok(g.ev('G.stage.coolAt') !== null);
  assert.equal(g.ev('G.stage.left()'), 'одеть C', 'доля уже есть — в списке её нет');
  assert.match(g.ev('Spot.on && Spot.sub'), /успей: одеть C/);
  g.ev('Spot.end()');
  assert.match(hud(g), /остынет сама через 1:\d\d · осталось: одеть C/);
  g.ev('G.stage.neutral = () => .8966');
  assert.equal(g.ev('G.stage.left()'), 'одеть C · 89 % → 90 %');
  assert.equal(g.ev('JSON.stringify(G.stage.steps()[4].p)'), '[89,90]', '89,66 % — это 89, не «90 из 90»');
  g.ev('G.stage.neutral = __n0');
});

test('атомы: после «остыла сама» — ни захвата, ни ✦, ни «НОВЫЙ АТОМ»; не осевший электрон сорвался, в «Молекулы» такой не идёт', () => {
  const g = atoms();
  g.ev('G.stage.clock = A_LATE + .1'); g.step(1); g.ev('Spot.clear()');
  // кислород: все электроны, кроме последнего — он только что пойман и дрожит
  g.ev(`(() => { const S = G.stage, o = S.ions.find(i => i.Z === 8) || S.ions[0]; globalThis.__io = o; S.seenN.delete(o.Z); o.ne = o.Z; o.ex = 1; o.exT = 99; o.exH = 1; o.x = P.x; o.y = P.y; })()`);
  g.ev('G.stage.clock = G.stage.coolAt + A_COOL'); g.step(1);
  assert.equal(g.ev('G.stage.failed'), true);
  assert.equal(g.ev('__io.ne'), g.ev('__io.Z') - 1, 'дрожащий электрон сорвался');
  assert.match(g.ev('JSON.stringify(G.stage.floats)'), /не успел/);
  const kn = g.ev('G.stage.kn'), caps = g.ev('G.stage.caps.hand + G.stage.caps.auto');
  // заторможенный электрон прямо на голом ионе — раньше ловился, осаживался и платил «НОВЫЙ АТОМ +10»
  g.ev(`(() => { const S = G.stage; for (let k = 0; k < 4; k++) S.el.push({ x: __io.x + .1, y: __io.y, vx: __io.vx, vy: __io.vy, k: 1, slow: 5, brk: 9, by: 'hand', age: 1 }); })()`);
  g.step(60);
  assert.equal(g.ev('G.stage.caps.hand + G.stage.caps.auto'), caps, 'захвата нет');
  assert.equal(g.ev('G.stage.kn'), kn, '✦ нет');
  assert.equal(g.ev('G.stage.seenN.has(__io.Z)'), false, '«НОВЫЙ АТОМ» нет');
  const at = g.ev('JSON.stringify(G.stage.tally().rows.find(r => r[0] === "нейтральных атомов")[1])');
  assert.equal(at, JSON.stringify(`${g.ev('G.stage.aEnd[0]')} из ${g.ev('G.stage.aEnd[1]')}`), 'итог — те же атомы, что в доле, на миг конца');
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.key'), 'molecules');
  assert.equal(g.ev(`G.stage.m.some(m => m.src === __io)`), false, 'голый ион — не реагент');
});
