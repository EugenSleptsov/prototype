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
  g.ev('Spot.skip && Spot.skip()');
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
