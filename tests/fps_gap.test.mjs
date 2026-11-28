// Передышка между эпохами «Частиц» не зависит от частоты экрана (REVIEW_NEON_4 тема Д): пол передышки
// min(startT, T)·0,999 пересчитывался каждый шаг и ронял T на 0,1 % за кадр — на 240 Гц эпоха 3 начиналась с 21 ГэВ
// вместо 63, эпоха 4 длилась 23 с вместо 80,6. Теперь пол берётся один раз, на входе в передышку.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

/** пройти передышку после эпохи ep с частотой hz: T на старте следующей эпохи и через 10 с после неё */
function gap(ep, T0, hz) {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev('Cine.clear(); Spot.clear()');
  assert.equal(g.ev('G.stage.key'), 'particles');
  g.ev(`(() => { const S = G.stage; S.startEpoch(${ep}); Cine.clear(); Spot.clear(); S.T = ${T0}; S.epDone = true; S.epGap = GAP_NEW; })()`);
  const start = g.ev(`(() => { const S = G.stage; for (let i = 0; i < ${hz} * 30 && S.ep === ${ep}; i++) { __step(1, 1 / ${hz}); Cine.clear(); Spot.clear(); } return S.ep === ${ep + 1} ? S.T : null; })()`);
  const later = g.ev(`(() => { const S = G.stage; for (let i = 0; i < ${hz} * 10; i++) { __step(1, 1 / ${hz}); Cine.clear(); Spot.clear(); } return S.T; })()`);
  return { start, later };
}

for (const [ep, T0, what] of [[1, 95, 'эпоха 3 начинается с той же T'], [2, 3.4, 'эпоха 4 начинается с 3 ГэВ и остывает так же']]) {
  test(`«Частицы», передышка после эпохи ${ep + 1}: ${what} на 60 и 240 Гц`, () => {
    const a = gap(ep, T0, 60), b = gap(ep, T0, 240);
    assert.ok(a.start !== null && b.start !== null, 'следующая эпоха началась');
    assert.ok(Math.abs(a.start - b.start) / a.start < .01, `старт: ${a.start.toFixed(2)} на 60 Гц и ${b.start.toFixed(2)} на 240`);
    assert.ok(Math.abs(a.later - b.later) / a.later < .02, `через 10 с: ${a.later.toFixed(2)} на 60 Гц и ${b.later.toFixed(2)} на 240`);
    if (ep === 1) assert.ok(a.start > T0 * .99, `передышка держит T (${a.start.toFixed(1)} из ${T0})`);
    else assert.ok(Math.abs(a.start - 3) < .01, `эпоха 4 с 3 ГэВ — ${a.start.toFixed(3)}`);
  });
}
