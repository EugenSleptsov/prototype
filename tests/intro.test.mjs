// Заставка по шагам: имя → линия жизни Вселенной (уезжает вниз) → управление и «Начать».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const st = g => g.ev(`['name', 'line', 'ready'].filter(s => document.getElementById('intro').classList.contains('st-' + s)).join()`);

test('заставка: новый игрок — сперва имя; пустое не принимается; после имени — линия жизни, клик — управление и «Начать»', () => {
  const g = loadGame({ seed: 1 });
  assert.equal(st(g), 'name');
  assert.equal(g.ev('nameDone()'), false, 'пустое имя — нет');
  assert.equal(st(g), 'name');
  g.ev(`document.getElementById('pname').value = '  Аня '`);
  assert.equal(g.ev('nameDone()'), true);
  assert.equal(st(g), 'line', 'линия жизни крупно в центре');
  assert.equal(g.ev(`document.getElementById('whon').textContent`), 'Аня', 'имя — наверху');
  assert.equal(g.ev(`localStorage.getItem('proto.name')`), 'Аня');
  assert.match(g.ev(`document.getElementById('path').innerHTML`), /Частицы.*Адроны.*Организмы/);
  g.ev(`document.getElementById('intro').onclick({ target: { closest: () => null } })`);
  assert.equal(st(g), 'ready', 'линия внизу, по центру — управление и кнопки');
  g.ev(`document.getElementById('go').onclick()`);
  assert.equal(g.ev('G.started'), true);
});

test('заставка: имя уже было — сразу управление и «Начать», линия жизни внизу; сменить имя — по кнопке сверху', () => {
  const g = loadGame({ seed: 1, storage: { 'proto.name': 'Боб' } });
  assert.equal(st(g), 'ready');
  assert.equal(g.ev(`document.getElementById('whon').textContent`), 'Боб');
  g.ev(`document.getElementById('who').onclick()`);
  assert.equal(st(g), 'name');
  g.ev(`document.getElementById('pname').value = 'Вера'; nameDone()`);
  assert.equal(st(g), 'ready', 'смена имени — без повторного показа линии');
  assert.equal(g.ev(`localStorage.getItem('proto.name')`), 'Вера');
});
