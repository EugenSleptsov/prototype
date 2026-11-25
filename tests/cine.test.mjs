// Кадр-пауза важного знания: открытие впервые в жизни, первый закон и начало уровня останавливают время
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

test('кадр-пауза: первый закон — пауза, следующие — без неё', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph']) });
  g.ev(`Codex.see('ph'); G.stage.kn += 500; Cine.clear(); Cine.tick(99)`);
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.r && it.r.k === 'ph'))`);
  assert.equal(g.ev('Cine.on'), true);
  assert.match(html(g), /Закон сформирован/);
  g.ev('Cine.tick(99)');
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.r))`);
  assert.equal(g.ev('Cine.on'), false);
});

test('кадр-пауза: начало нового уровня — один раз, с путём Вселенной и строкой «зачем»', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev('Cine.clear(); Cine.tick(99); advance(); G.trans = 99');
  assert.equal(g.ev('G.stage.key'), 'quarks');
  g.step(150, true);
  assert.equal(g.ev('Cine.on'), true);
  assert.match(html(g), /Адроны/);
  assert.match(html(g), /class="on">Адроны/, 'на пути подсвечен текущий уровень');
  assert.match(html(g), /без них не будет ни одного ядра/);
  g.ev('Cine.tick(99)');
  g.step(30, true);
  assert.equal(g.ev('Cine.on'), false, 'заголовок уровня не повторяется');
});

test('кадр-пауза: закон глюонов — пауза с тем, что теперь сталкивать: g + γ и g + g', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph', 'g']) });
  g.ev(`Codex.see('ph'); G.stage.kn += 500; G.stage.buy(G.stage.shopItems().findIndex(it => it.r && it.r.k === 'ph')); Cine.clear(); Cine.tick(99)`);
  g.ev(`Codex.see('g'); Cine.clear(); Cine.tick(99); document.getElementById('card').style.opacity = 0`);
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.r && it.r.k === 'g'))`);
  assert.equal(g.ev('Cine.on'), true, 'закон глюонов — важное знание');
  const h = html(g);
  assert.match(h, /Закон сформирован/);
  assert.match(h, /Сталкивай их с фотонами и друг с другом/);
  assert.equal((h.match(/class="rx"/g) || []).length, 3, 'значок закона и две схемы');
  assert.match(h, />γ<\/span><i>\+<\/i><span class="cs boson">g</, 'g + γ');
  assert.match(h, />g<\/span><i>\+<\/i><span class="cs boson">g</, 'g + g');
  assert.match(h, /<svg/, 'жест: зажми у двух — отпусти');
});

test('карточка открытия глюона: дальше — закон глюонов', () => {
  const g = lit({ protoCodex: JSON.stringify(['ph']) });
  g.ev(`Codex.see('ph'); Cine.clear(); Cine.tick(99); Codex.see('g')`);
  assert.match(html(g), /Дальше — сформируй закон глюонов/);
  assert.equal(g.ev(`G.stage.seeNext('e')`), '', 'у других — без этой строки');
});
