// Кадр-пауза важного знания: открытие впервые в жизни и первое «Научить» останавливают время
// на ленте поперёк экрана; повторное открытие в новом забеге — без паузы. Клик — дальше, но не сразу.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const lit = (storage) => {
  const g = loadGame({ storage });
  g.ev(PREP.start); g.ev(PREP.pump());
  g.ev('Cine.clear(); Cine.tick(99)');
  return g;
};
const html = g => g.ev(`document.getElementById('cinein').innerHTML`);

test('кадр-пауза: открытие впервые в жизни — пауза с лентой, потом замедление; клик раньше 0,6 с не смахивает', () => {
  const g = lit({});
  g.ev(`Codex.see('e', G.stage.rxOf('e'))`);
  assert.equal(g.ev('Cine.on'), true);
  assert.match(html(g), /Новое знание/);
  assert.match(html(g), /электрон/);
  g.ev('Cine.skip()');
  assert.equal(g.ev('Cine.on'), true, 'тот же клик, что родил частицу, паузу не закрывает');
  g.ev('Cine.tick(.7); Cine.skip()');
  assert.equal(g.ev('Cine.on'), false);
  assert.ok(g.ev('G.slowT') > 0, 'после паузы время ещё миг идёт медленно');
});

test('кадр-пауза: уже знакомое (другой забег) — без паузы; два новых сразу — по очереди', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph', 'e']) });
  g.ev(`Codex.see('e', G.stage.rxOf('e'))`);
  assert.equal(g.ev('Cine.on'), false, 'знакомое — маленькая сцена, без остановки');
  g.ev(`Codex.see('u'); Codex.see('g')`);
  assert.equal(g.ev('Cine.on'), true);
  assert.equal(g.ev('Cine.q.length'), 1, 'второе ждёт в очереди');
  g.ev('Cine.tick(99)');
  assert.equal(g.ev('Cine.on'), true, 'следующее открытие — сразу за первым');
  g.ev('Cine.tick(99)');
  assert.equal(g.ev('Cine.on'), false);
});

test('кадр-пауза: первое «Научить» — пауза, следующие — без неё', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph']) });
  g.ev(`Codex.see('ph'); G.stage.kn += 500; Cine.clear(); Cine.tick(99)`);
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.r && it.r.k === 'ph'))`);
  assert.equal(g.ev('Cine.on'), true);
  assert.match(html(g), /Вселенная научилась/);
  g.ev('Cine.tick(99)');
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.r))`);
  assert.equal(g.ev('Cine.on'), false);
});
