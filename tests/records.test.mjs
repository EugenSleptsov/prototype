// Матрица рекордов: строка — забег, столбцы — уровни и Σ; режим «по уровням» и «накопительный».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

test('рекорды: забег с начала пишет очки каждого уровня, сумма — очки забега', () => {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`G.stage.steps = () => [{ t: 'шаг', d: true }]`); g.step(2);
  for (let i = 0; i < 5; i++) g.ev('advance(); G.trans = 99'), g.step(3);
  g.ev(`Tally.show(G.stage); endGame('конец')`);
  const runs = g.ev(`JSON.parse(localStorage.getItem(LB_KEY)).runs`);
  assert.equal(runs.length, 1);
  const r = runs[0];
  assert.equal(r.lv.length, 6);
  assert.ok(r.lv.every(v => typeof v === 'number'), 'у каждого уровня число: ' + JSON.stringify(r.lv));
  assert.equal(r.lv.reduce((a, b) => a + b, 0), r.s, 'Σ = сумма уровней');
  assert.ok(r.lv[0] >= g.ev('STEP_PTS'), 'шаг «Частиц» — в первом столбце');
  const html = g.ev(`document.getElementById('endon').querySelector('#endloc').innerHTML`);
  assert.match(html, /накопительный/);
  assert.match(html, /<b>6<\/b>Мол/);
});

test('рекорды: забег не с начала в таблицу не идёт', () => {
  const g = loadGame({ seed: 5 });
  g.ev(`G.fromI = 5; document.getElementById('go').onclick()`); g.step(3);
  g.ev(`Tally.show(G.stage); endGame('конец')`);
  assert.equal(g.ev(`(JSON.parse(localStorage.getItem(LB_KEY) || '{}').runs || []).length`), 0);
});

test('рекорды: накопительный режим — сумма с первого уровня, пропуск уровня — пусто', () => {
  const g = loadGame({ seed: 1 });
  const cell = (lv, c, cum) => g.ev(`mxCell({ n: 'a', lv: ${JSON.stringify(lv)}, s: 99, t: 1, d: 1 }, ${c}, ${cum})`);
  assert.equal(cell([100, 200, 300, null, null, null], 2, false), 300);
  assert.equal(cell([100, 200, 300, null, null, null], 2, true), 600);
  assert.equal(cell([100, 200, 300, null, null, null], 3, true), null);
  assert.equal(cell([100, 200, 300, null, null, null], 6, true), 99, 'Σ — очки забега');
  assert.equal(g.ev(`mxCell({ n: 'a', lv: null, s: 7, t: 1, d: 1 }, 0, false)`), null, 'старая сумма без уровней');
});

test('рекорды: сортировка по столбцу, в общей — лучший забег каждого игрока по этому столбцу', () => {
  const g = loadGame({ seed: 1 });
  const J = e => JSON.parse(g.ev(`JSON.stringify(${e})`));
  g.ev(`globalThis.__l = [
    { n: 'Аня', lv: [500, 100, 0, 0, 0, 900], s: 1500, t: 900, d: 1 },
    { n: 'аня', lv: [100, 900, 0, 0, 0, 100], s: 1100, t: 800, d: 2 },
    { n: 'Боря', lv: [800, 800, 0, 0, 0, 0], s: 1600, t: 700, d: 3 },
  ]`);
  assert.deepEqual(J(`mxSort(__l, 6, false).map(r => r.d)`), [3, 1, 2]);
  assert.deepEqual(J(`mxSort(__l, 5, false).map(r => r.d)`), [1, 2, 3], 'по «Молекулам»');
  assert.deepEqual(J(`mxSort(__l, 1, true).map(r => r.d)`), [3, 2, 1], 'накопительно к «Адронам»: 1600, 1000, 600');
  assert.deepEqual(J(`mxBest(__l, 1, false).map(r => r.d)`), [2, 3], 'Аня одна, лучшим забегом по «Адронам»');
  const html = g.ev(`mxHtml(mxSort(__l, 5, false), 5, false, r => r.d === 2, 'тест')`);
  assert.match(html, /твоё место #2 по столбцу «Молекулы»/);
  assert.match(html, /class="sc top">900</, 'лучший в выбранном столбце — золотом');
});

test('рекорды: браузер хранит то, что входит в десятку хоть одного столбца', () => {
  const g = loadGame({ seed: 1 });
  g.ev(`for (let i = 0; i < 30; i++) Runs.add({ n: 'x', lv: [i, i, i, i, i, i === 3 ? 9999 : i], s: i, t: 60, d: i })`);
  const ds = JSON.parse(g.ev(`JSON.stringify(Runs.load().map(r => r.d))`));
  assert.ok(ds.includes(3), 'рекорд «Молекул» остался, хоть сумма мала');
  assert.ok(ds.includes(29));
  assert.ok(!ds.includes(10), 'середина без рекордов ушла');
});
