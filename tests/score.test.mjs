// Очки забега — за вехи, не за ✦: ✦ — только валюта уровня (копить или тратить — честный выбор), законы не печатают очки.
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

test('очки: ✦ уровня и доход законов в очки не идут', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.rs.syn = 1; Uni.learn(G.stage, 'syn', '☀', 'Нуклеосинтез', 60)`);
  g.step(2);
  const s = g.ev('G.score');
  g.ev('G.stage.steps = () => []; G.stage.stars = []; G.stage.kn += 500'); g.step(120);
  assert.equal(g.ev('G.score'), s);
});

test('очки: шаг задания — STEP_PTS, испытание ★ — STAR_PTS, один раз за забег; в итогах — строки вех, без «отдано Вселенной»', () => {
  const g = toStage('quarks');
  const s0 = g.ev('G.score');
  g.ev(`G.stage.steps = () => [{ t: 'первый шаг', d: true }, { t: 'второй шаг', d: false }]; G.stage.stars = [{ t: 'звезда', st: 1 }, { t: 'нет', st: -1 }]`);
  g.step(3);
  assert.equal(g.ev('G.score') - s0, g.ev('STEP_PTS + STAR_PTS'));
  g.step(30);
  assert.equal(g.ev('G.score') - s0, g.ev('STEP_PTS + STAR_PTS'), 'повторно не платится');
  g.ev(`G.stage.steps = () => [{ t: 'первый шаг', d: true }, { t: 'второй шаг', d: true }]`); g.step(1);
  assert.equal(g.ev('G.score') - s0, g.ev('2 * STEP_PTS + STAR_PTS'));
  g.ev('advance(); G.trans = 99');
  const html = g.ev(`document.getElementById('tally').innerHTML`);
  assert.match(html, /шаги задания × 2/);
  assert.match(html, /испытания ★ × 1/);
  assert.doesNotMatch(html, /отдано Вселенной/);
  assert.equal(g.ev('typeof AUTO_BONUS'), 'undefined');
});
