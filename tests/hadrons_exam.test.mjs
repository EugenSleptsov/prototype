// «Адроны», экзамен главы 15 (REVIEW_NEON_4 №2, критично): «5 своих» — сложенные рукой уже на экзамене. Нуклоны глав
// 10–11 белые и не вымерзают — раньше они закрывали «своих» заранее, и после «Конфайнмента» цель брал закон без рук.
// Закон не съедает материал твоих нуклонов: пока по цвету в тёплом диске кварков не больше, чем тебе сложить, не бросает.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function hadrons() {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Spot.clear()');
  g.step(30);
  return g;
}
const empty = g => g.ev(`(() => { const S = G.stage; S.o = []; S.pi = []; S.floats = []; P.vx = P.vy = 0; S.stuck = () => false; })()`);
const B = (name, q, dx = 0, dy = 0) => `globalThis.${name} = G.stage.mk(${JSON.stringify(q.map(([col, fl]) => ({ col, fl, anti: false })))}, G.stage.C.x + ${dx}, G.stage.C.y + ${dy}); ${name}.age = 9; ${name}.vx = ${name}.vy = 0`;
// нуклон рукой — как в игре: через nucleon(), в текущей главе
const hand = (g, name, dx) => { g.ev(B(name, [[0, 'u'], [1, 'u'], [2, 'd']], dx, 0)); g.ev(`${name}.byHand = ${name}.mine = true; G.stage.nucleon(${name}, 'hand')`); };

test('экзамен: нуклоны, сложенные рукой в главах 10–11, — урок, не «свои» экзамена; сложенные в главе 15 — свои', () => {
  const g = hadrons(); empty(g);
  g.ev('G.stage.chap = CH_FLAV');
  for (let i = 0; i < 5; i++) hand(g, '__old' + i, i - 2);
  assert.equal(g.ev('__old0.hc'), g.ev('CH_FLAV'));
  g.ev('G.stage.skipChapters()');
  assert.equal(g.ev('G.stage.ownN()'), 0, 'пять нуклонов «Аромата» на экзамене не считаются');
  assert.equal(g.ev('G.stage.steps()[5].items[1][0]'), 'своих 0/5');
  hand(g, '__new', 3);
  assert.equal(g.ev('G.stage.ownN()'), 1);
  assert.equal(g.ev('G.stage.steps()[5].items[1][0]'), 'своих 1/5');
  assert.match(g.ev('G.stage.steps()[5].h'), /сложенных рогаткой уже сейчас/);
});

test('экзамен: закон без рук цель не берёт — 12 нуклонов Вселенной и 5 старых своих мало', () => {
  const g = hadrons(); empty(g);
  g.ev('G.stage.chap = CH_FLAV');
  for (let i = 0; i < 5; i++) hand(g, '__old' + i, i - 2);
  g.ev('G.stage.skipChapters()');
  for (let i = 0; i < 7; i++) g.ev(B('__u' + i, [[0, 'u'], [1, 'd'], [2, 'd']], (i % 4) * 1.5 - 2, 2 + (i / 4 | 0) * 1.5));
  assert.equal(g.ev('G.stage.liveNP().p + G.stage.liveNP().n'), 12);
  assert.equal(g.ev('G.stage.steps()[5].d'), false);
  for (let i = 0; i < 5; i++) hand(g, '__n' + i, i - 2 + .5);
  assert.equal(g.ev('G.stage.steps()[5].d'), true, 'свои сложены на экзамене — цель взята');
});

test('экзамен: закон оставляет кварки на твои нуклоны — мало материала, не бросает; привалило — бросает', () => {
  const g = hadrons(); empty(g);
  g.ev('G.stage.skipChapters(); G.stage.rs.conf = 1; G.stage.cool = 0');
  // по 3 кварка каждого цвета, тебе сложить 5 — весь этот материал твой
  for (let i = 0; i < 9; i++) g.ev(B('__q' + i, [[i % 3, i % 2 ? 'u' : 'd']], (i % 3) * .9 - 1, (i / 3 | 0) * .9 - 1));
  assert.equal(g.ev('G.stage.reserve()'), true);
  g.ev('G.stage.autoCd = 0; G.stage.autoThrow(1 / 60)');
  assert.equal(g.ev('G.stage.o.some(o => o.thrown === "auto")'), false, 'закон не бросил');
  // приток: по 4 ещё — материала больше, чем тебе нужно
  for (let i = 0; i < 12; i++) g.ev(B('__r' + i, [[i % 3, i % 2 ? 'u' : 'd']], (i % 4) * .9 - 1.5, 1.5 + (i / 4 | 0) * .9));
  assert.equal(g.ev('G.stage.reserve()'), false);
  g.ev('G.stage.autoCd = 0; G.stage.autoThrow(1 / 60)');
  assert.equal(g.ev('G.stage.o.some(o => o.thrown === "auto")'), true, 'закон бросил');
  // до экзамена запаса нет: закон «Закона» (глава 14) бросает как раньше
  g.ev('G.stage.chap = CH_LAW');
  assert.equal(g.ev('G.stage.reserve()'), false);
});
