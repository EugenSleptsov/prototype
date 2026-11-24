// Уровни с рогаткой (ядра, звёзды, атомы, молекулы): карта двигается, резинка длинная, слабый бросок точный.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// забег до уровня «Ядра» (третий этап лестницы)
function toNuclei() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'nuclei') g.ev('advance(); G.trans = 99');
  g.step(30);
  return g;
}

test('рогатка: WASD и стрелки двигают карту', () => {
  const g = toNuclei();
  const x0 = g.ev('P.x'), vr = g.ev('viewRadius()');
  g.ev(`keys.add('KeyD')`); g.step(60); g.ev(`keys.delete('KeyD')`);
  const dx = g.ev('P.x') - x0;
  assert.ok(dx > vr * .9 && dx < vr * 1.3, `за секунду сдвиг ${dx}, поле зрения ${vr}`);
  const y0 = g.ev('P.y'); g.ev(`keys.add('ArrowUp')`); g.step(30); g.ev(`keys.delete('ArrowUp')`);
  assert.ok(g.ev('P.y') < y0);
});

test('рогатка: тяга мимо тел двигает карту и ничего не бросает', () => {
  const g = toNuclei();
  g.ev('P.x += 200; cam.x = P.x; P.y = cam.y'); // далеко от ядер — под пальцем пусто
  g.ev('mouse.x = 400; mouse.y = 300; mouse.has = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.sl.held'), null);
  const x0 = g.ev('P.x'), z = g.ev('cam.z');
  g.ev('mouse.x = 500'); g.step(1);
  g.ev('mouse.down = false'); g.step(1);
  assert.ok(Math.abs(g.ev('P.x') - (x0 - 100 / z)) < 1e-6, 'точка мира под пальцем осталась под ним');
  assert.equal(g.ev('G.stage.sl.shots'), 0);
  assert.equal(g.ev('G.stage.sl.pan'), null);
});

test('рогатка: резинка длиннее, слабый бросок мягче (k^1.5)', () => {
  const g = toNuclei();
  assert.ok(g.ev('G.stage.full() * cam.z') >= 170);
  const v = g.ev(`(() => { const S = G.stage, sl = S.sl; sl.held = S.bodies()[0]; sl.pull = [S.full() * .5, 0]; const k = sl.kick(); sl.held = null; return Math.hypot(k[0], k[1]) / S.vmax(); })()`);
  assert.ok(Math.abs(v - .5 ** 1.5) < 1e-9, `половина резинки → ${v} от полной скорости`);
});
