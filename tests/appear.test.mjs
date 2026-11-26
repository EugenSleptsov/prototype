// Новое проявляется плавно: рождённое Вселенной за APPEAR_T с проявляется и подрастает; продукт реакции — сразу.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

test('появление: кривая — с нуля до полного за APPEAR_T, плавно; масштаб от 55 %', () => {
  const g = loadGame();
  assert.equal(g.ev('appear(0)'), 0);
  assert.equal(g.ev('appear(APPEAR_T)'), 1);
  assert.ok(g.ev('appear(APPEAR_T * .1)') < .05, 'начало — мягко');
  assert.ok(Math.abs(g.ev('appear(APPEAR_T / 2)') - .5) < 1e-9);
  assert.equal(g.ev('popIn(0)'), .55); assert.equal(g.ev('popIn(1)'), 1);
});

test('появление: квант, рождённый Вселенной, проявляется постепенно; продукт реакции виден сразу', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump());
  g.ev(`globalThis.__a = G.stage.mk('ph', false, P.x + 3, P.y + 3, 0, G.stage.T); globalThis.__b = G.stage.mk('e', false, P.x - 3, P.y + 3, 0, 1); __b.born = .6;`);
  g.step(6);
  const va = g.ev('__a.vis'), vb = g.ev('__b.vis');
  assert.ok(va > 0 && va < .2, `новорождённый — только начал проявляться: ${va}`);
  assert.ok(vb >= g.ev('APPEAR_T'), 'продукт реакции — сразу целиком');
  g.step(60);
  assert.ok(g.ev('appear(__a.vis)') === 1, 'через секунду — полностью');
});
