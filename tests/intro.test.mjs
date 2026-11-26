// Заставка по шагам: линия жизни Вселенной (уезжает вниз) → управление и «Начать»; имя — не на входе.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const st = g => g.ev(`['name', 'line', 'ready'].filter(s => document.getElementById('intro').classList.contains('st-' + s)).join()`);

test('заставка: новый игрок — имя не спрашиваем: линия жизни, клик — управление и «Начать»; имя — фишкой сверху', () => {
  const g = loadGame({ seed: 1 });
  assert.equal(st(g), 'line', 'линия жизни крупно в центре — без экрана имени');
  assert.match(g.ev(`document.getElementById('path').innerHTML`), /Частицы.*Адроны.*Организмы/);
  assert.equal(g.ev(`document.getElementById('whon').textContent`), 'Игрок');
  g.ev(`document.getElementById('intro').onclick({ target: { closest: () => null } })`);
  assert.equal(st(g), 'ready', 'линия внизу, по центру — управление и кнопки');
  g.ev(`document.getElementById('go').onclick()`);
  assert.equal(g.ev('G.started'), true);
  assert.equal(g.ev(`localStorage.getItem('proto.name')`), null, 'имя «Игрок» не записано как выбранное');
});

test('имя позже: пока его нет, общая таблица ждёт; вписал — свои строки переименованы, ждавшее ушло под именем', () => {
  const g = loadGame({ seed: 1 });
  g.ev(`Online.on = () => true; globalThis.__sent = []; Online.req = (p, o) => { __sent.push(JSON.parse(o.body)); return Promise.resolve(null); }`);
  g.ev(`Online.send('heat', 1234); LB.add('run.x', { n: LB.name(), s: 7, t: 10, d: 0 })`);
  assert.equal(g.ev('__sent.length'), 0, 'безымянное в общую таблицу не уходит');
  assert.equal(g.ev('Online.pending.length'), 1);
  assert.equal(g.ev('nameDone()'), false, 'пустое имя — нет');
  g.ev(`document.getElementById('who').onclick(); document.getElementById('pname').value = '  Аня '; nameDone()`);
  assert.equal(st(g), 'ready');
  assert.equal(g.ev(`localStorage.getItem('proto.name')`), 'Аня');
  assert.equal(g.ev('JSON.stringify(__sent.map(x => [x.board, x.name, x.score]))'), JSON.stringify([['heat', 'Аня', 1234]]));
  assert.equal(g.ev(`LB.best('run.x').n`), 'Аня', 'строка браузера — под новым именем');
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

test('сенсор: ⟲ ⟳ видны, только пока в руке молекула из нескольких атомов', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'molecules') g.ev('advance(); G.trans = 99');
  g.ev(`document.body.classList.add('touch')`);
  const vis = () => g.ev(`document.getElementById('t-rl').style.display !== 'none' && document.getElementById('t-rr').style.display !== 'none'`);
  g.ev('G.stage.sl.held = null; touchBar()');
  assert.equal(vis(), false, 'в руке ничего — кнопок нет');
  g.ev(`G.stage.sl.held = { atoms: [{}] }; touchBar()`);
  assert.equal(vis(), false, 'один атом — поворачивать нечего');
  g.ev(`G.stage.sl.held = { atoms: [{}, {}, {}] }; touchBar()`);
  assert.equal(vis(), true, 'фрагмент — можно довернуть');
});

test('пустота — старт по первому нажатию, без пузырей про ✦, кодекс и лестницу', () => {
  const g = loadGame({ seed: 3 });
  assert.ok(g.ev('VOID_MIN') <= .5, 'предыстория не держит игрока');
  const src = g.ev(`G.stage.reveal.toString()`);
  for (const k of ["'kn'", "'codex'", "'ladder'"]) assert.ok(!src.includes(`Hint.once(${k}`), k);
});
