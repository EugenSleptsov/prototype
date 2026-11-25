// ✦ летят в копилку: «+N ✦» в мире — искры к счётчику «знания»; счётчик догоняет баланс, когда они долетели.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const lit = () => {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); update(1 / 60); render()`); // счётчик нарисован — есть куда лететь
  return g;
};

test('копилка: «+N ✦» — искры летят к счётчику, он показывает баланс без того, что в полёте', () => {
  const g = lit();
  g.ev(`Fly.q = []; Fly.lag = 0; G.stage.kn += 6; G.stage.float(P.x + 2, P.y, '+6 ✦')`);
  const n = g.ev('Fly.q.length'), b = g.ev('G.stage.bal()');
  assert.ok(n >= 1 && n <= 5, `искр: ${n}`);
  assert.equal(g.ev('Fly.shown(G.stage.bal())'), b - 6, 'пока летят — на счётчике меньше');
  g.ev('for (let i = 0; i < 90; i++) { update(1 / 60); render(); }');
  assert.equal(g.ev('Fly.q.length'), 0, 'долетели');
  assert.equal(g.ev('Fly.shown(G.stage.bal())'), g.ev('G.stage.bal()'), 'счётчик догнал баланс');
  assert.ok(g.ev('G.T - Fly.pulse') < 1.5, 'счётчик вспыхнул');
});

test('копилка: надпись без ✦ и экран без счётчика — ничего не летит, баланс сразу верный', () => {
  const g = lit();
  g.ev(`Fly.q = []; Fly.lag = 0; G.stage.float(P.x, P.y, 'НОВОЕ: γ')`);
  assert.equal(g.ev('Fly.q.length'), 0);
  g.ev('for (let i = 0; i < 60; i++) update(1 / 60)'); // без render: счётчик не рисуется
  g.ev(`G.stage.kn += 3; G.stage.float(P.x, P.y, '+3 ✦')`);
  assert.equal(g.ev('Fly.q.length'), 0);
  assert.equal(g.ev('Fly.shown(G.stage.bal())'), g.ev('G.stage.bal()'));
});

test('копилка: новый уровень — без чужих искр', () => {
  const g = lit();
  g.ev(`G.stage.float(P.x, P.y, '+9 ✦')`);
  assert.ok(g.ev('Fly.lag') > 0);
  g.ev('advance(); G.trans = 99; update(1 / 60)');
  assert.equal(g.ev('Fly.q.length'), 0); assert.equal(g.ev('Fly.lag'), 0);
});
