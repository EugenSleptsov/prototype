// Учит действием, а не текстом: пустой клик не тратит ⚡, важное родилось — стоп-кадр со стрелкой,
// жест «зажми у двух» не вышел — его сразу показывают снова. Тексты законов — без «без тебя».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const lit = (storage) => {
  const g = loadGame({ seed: 7, storage });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light); g.ev(PREP.hit);
  g.ev(`Cine.clear(); Cine.tick(99); Spot.end()`);
  return g;
};
// вокруг детектора — пусто (или только то, что поставили)
const clear = `for (const o of G.stage.p) if (Math.hypot(o.x - P.x, o.y - P.y) < G.stage.hr() * 2) o.dead = true; G.stage.tracks = [];`;
// зажать поле на полсекунды там, где ловить нечего (кванты рядом гасим каждый кадр), и отпустить
const holdEmpty = `mouse.clicked = true; mouse.down = true; for (let i = 0; i < 30; i++) { for (const o of G.stage.p) if (Math.hypot(o.x - P.x, o.y - P.y) < G.stage.fr() * 3) o.dead = true; update(1 / 60); } mouse.down = false; update(1 / 60)`;

test('пустой клик и клик по знакомому свету — ⚡ цела, подсказка: свет ловится кругом сам', () => {
  const g = lit();
  g.ev(`${clear} G.stage.en = 5; G.stage.shotCd = 0; G.stage.snapshot()`);
  assert.equal(g.ev('G.stage.en'), 5, 'пусто — без траты');
  assert.equal(g.ev('G.stage.st.empty'), 1);
  g.ev(`G.stage.shotCd = 0; const o = G.stage.mk('ph', false, P.x + .1, P.y, 0, 1); o.born = 1; G.stage.snapshot()`);
  assert.equal(g.ev('G.stage.en'), 5, 'знакомый фотон в круге — снимать нечего');
  assert.ok(g.ev(`G.stage.floats.some(f => /свет ловится кругом сам/.test(f.txt))`), 'подсказка: кликать по свету не нужно');
  g.ev(`G.stage.shotCd = 0; const q = G.stage.mk('e', false, P.x - .1, P.y, 0, 1); q.born = 1; G.stage.snapshot()`);
  assert.equal(g.ev('G.stage.en'), 4, 'новое в круге — снимок стоит 1 ⚡');
});

test('тексты законов — без «без тебя»', () => {
  const g = loadGame({ seed: 7 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  assert.doesNotMatch(g.ev(`document.getElementById('cinein').innerHTML`), /без тебя/);
  assert.doesNotMatch(g.ev(`G.stage.steps().map(s => s.h + s.t).join()`), /без тебя/);
});

test('стоп-кадр: глюон третьей струи впервые в жизни — время стоит, стрелка к нему; второй раз — нет', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph', 'e']) });
  g.ev(`G.stage.pairs = 1; Codex.see('e')`);
  const r = g.ev(`__hit('ph', 'ph', LV_N)`);
  assert.ok(r.born.includes('g'), `родилось: ${r.born}`);
  assert.equal(g.ev('Spot.on'), true);
  assert.match(g.ev('Spot.txt'), /глюон/);
  assert.equal(g.ev(`Spot.o.sp`), 'g', 'стрелка — на глюон');
  g.ev('Spot.skip()'); assert.equal(g.ev('Spot.on'), true, 'клик в первые 0,5 с не смахивает');
  g.ev('Spot.tick(.6); Spot.skip()'); assert.equal(g.ev('Spot.on'), false);
  g.ev(`__hit('ph', 'ph', LV_N)`);
  assert.equal(g.ev('Spot.on'), false, 'один раз за забег');
});

test('стоп-кадр: уже знакомое по прошлым забегам — без остановки', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph', 'e', 'g']) });
  g.ev(`G.stage.pairs = 1`);
  g.ev(`__hit('ph', 'ph', LV_N)`);
  assert.equal(g.ev('Spot.on'), false);
});

test('жест не вышел (зажал — пары нет): подсказка с жестом и курсор-подсказка — сразу', () => {
  const g = lit();
  assert.equal(g.ev('G.stage.fieldOn()'), true);
  g.ev(`G.stage.learn.smash = false; G.stage.coach.idle = 0; ${holdEmpty}`);
  assert.ok(g.ev('G.stage.t - G.stage.missT') < .1, 'промах замечен');
  assert.ok(g.ev('G.stage.coach.idle') >= g.ev('COACH_IDLE') - .1, 'курсор-подсказка — без ожидания');
  g.ev(`G.stage.learn.smash = true; G.stage.missT = -99; ${holdEmpty}`);
  assert.equal(g.ev('G.stage.missT'), -99, 'жест освоен — промах не учит заново');
});
