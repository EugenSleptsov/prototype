// «Звёзды»: луп (просьба игрока) — не накопил C, N, O к сверхновой, уровень не кончается: пепел звезды — облако новой,
// снова сбор газа; C, N, O прошлой — в облаке (во второй звезде они снова ядра). Успел с первой звезды — много очков.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStars(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'stars') g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}
// зажечь звезду из комка у P (пепел рядом — в комке)
const IGN = mu => `(() => { const S = G.stage; S.gas = S.gas.filter(q => q.m || !inView(q.x, q.y, 3));
  for (const q of S.gas) if (q.m) { q.x = P.x + Math.random() - .5; q.y = P.y + Math.random() - .5; }
  const n = Math.round(lerp(S.lo, S.hi, ${mu}));
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 1.2; S.gas.push(S.puff(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 0, 0, 1)); }
  S.ignite(P.x, P.y, ${mu}); })()`;
const give = (k, n) => `(() => { const S = G.stage, [Z, N] = '${k}'.split(',').map(Number); for (let i = 0; i < ${n}; i++) { const o = S.mk(Z, N, P.x + rnd(-2, 2), P.y + rnd(-2, 2)); o.age = 1; o.mine = true; } })()`;

test('не успел к сверхновой — новая звезда из пепла: снова сбор облака, C прошлой — в облаке и в недрах новой', () => {
  const g = toStars();
  g.ev(IGN(1)); g.ev(give('6,6', 1)); const he0 = g.ev('G.stage.heP');
  g.ev('G.stage.life = G.stage.clock - G.stage.ignAt + .05');
  g.step(10);
  assert.equal(g.ev('G.stage.failed'), true); assert.notEqual(g.ev('G.stage.doneAt'), null);
  g.step(60 * 3.5);
  assert.equal(g.ev('G.stage.key'), 'stars', 'уровень не кончился');
  assert.equal(g.ev('G.stage.phase'), 'gas'); assert.equal(g.ev('G.stage.starN'), 1);
  assert.equal(g.ev('G.stage.failed'), false); assert.equal(g.ev('G.stage.doneAt'), null); assert.equal(g.ev('G.stage.advanced'), false);
  assert.equal(g.ev('G.stage.o.length'), 0);
  assert.ok(g.ev('G.stage.gas.some(q => q.m === "6,6")'), 'углерод прошлой звезды — пепел в облаке');
  assert.ok(g.ev('G.stage.heP') >= he0 - 1e-9, 'облако не беднее гелием');
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.phase'), 'gas', 'облако не схлопнулось само сразу (отсчёт — с начала сбора)');
  // вторая звезда: пепел в комке — снова ¹²C в недрах
  g.ev(IGN(.5));
  assert.equal(g.ev('G.stage.phase'), 'core');
  assert.ok(g.ev('G.stage.cnt("6,6")') >= 1, 'углерод прошлой звезды — в недрах новой');
  g.ev(give('6,6', 2)); g.ev(give('8,8', 2)); g.ev(give('7,7', 1)); g.ev('G.stage.seen.add("6,6"); G.stage.seen.add("8,8"); G.stage.seen.add("7,7"); G.stage.seen.add("4,4"); G.stage.rs.syn = 1');
  g.step(5);
  assert.equal(g.ev('G.stage.failed'), false); assert.notEqual(g.ev('G.stage.doneAt'), null);
  assert.equal(g.ev('G.stage.first'), false, 'не с первой — без бонуса');
  assert.ok(g.ev('JSON.stringify(G.stage.tally().rows)').includes('звёзд до цели'));
  g.step(60 * 3.5);
  assert.equal(g.ev('G.stage.key'), 'atoms', 'успел — дальше, к атомам');
});

test('успел с первой звезды — много очков сверху и строка в итогах', () => {
  const g = toStars();
  g.ev(IGN(.5));
  const s0 = g.ev('G.score');
  g.ev(give('6,6', 2)); g.ev(give('8,8', 2)); g.ev(give('7,7', 1)); g.ev('G.stage.seen.add("6,6"); G.stage.seen.add("8,8"); G.stage.seen.add("7,7"); G.stage.seen.add("4,4"); G.stage.rs.syn = 1');
  g.step(5);
  assert.equal(g.ev('G.stage.first'), true);
  const mile = g.ev('G.stage.mile.st * STEP_PTS + G.stage.mile.star * STAR_PTS');
  assert.equal(g.ev('G.score') - s0 - mile, g.ev('ST_FIRST'), 'бонус первой звезды — сверх вех');
  assert.ok(g.ev('ST_FIRST') >= 2 * g.ev('LVL_BONUS'));
  assert.ok(g.ev('JSON.stringify(G.stage.tally().rows)').includes('с первой звезды'));
});
