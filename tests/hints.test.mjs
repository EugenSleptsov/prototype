// Подсказок — к нулю: что игрок уже видел, игра помнит навсегда (между забегами и после обучения).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// второй забег — с тем же хранилищем браузера
const again = g => loadGame({ seed: 2, storage: Object.fromEntries(g.store) });

test('подсказки: урок-сообщение и стоп-кадр — один раз за всю игру, и в следующем забеге их нет', () => {
  const g = loadGame({ seed: 1 });
  g.ev(`tipMsg('t:a', 'урок А')`);
  assert.equal(g.ev('lastMsg'), 'урок А');
  g.ev(`lastMsg = ''; tipMsg('t:a', 'урок А')`);
  assert.equal(g.ev('lastMsg'), '', 'второй раз — молчит');
  g.ev(`Spot.show({ x: 0, y: 0 }, 'кадр 1', '')`);
  assert.equal(g.ev('Spot.on'), true);
  const h = again(g);
  h.ev(`tipMsg('t:a', 'урок А')`);
  assert.equal(h.ev('lastMsg'), '', 'новый забег помнит урок');
  h.ev(`Spot.show({ x: 0, y: 0 }, 'кадр 2', '')`);
  assert.equal(h.ev('Spot.on'), false, 'тот же стоп-кадр (числа не различаем) — не показываем');
  assert.equal(h.ev(`Hint.once('k', 'x'); Hint.q.length`), 1);
  assert.equal(again(h).ev(`Hint.once('k', 'x'); Hint.q.length`), 0, 'Hint.once — тоже навсегда');
});

test('подсказки: строка-подсказка живёт TIP_T секунд за всю историю игрока, потом молчит — и в новом забеге', () => {
  const g = loadGame({ seed: 1 });
  const show = gg => gg.ev(`(() => { let n = 0; for (let i = 0; i < 60 * 4; i++) { G.T += 1 / 60; if (Tips.ok('держи 3 ⚡')) n++; } return n; })()`);
  const a = show(g);
  assert.ok(a > 200, 'первые секунды — видна');
  const b = show(g), c = show(g), d = show(g), T = g.ev('TIP_T');
  assert.ok(a + b + c + d <= T * 60 + 2 && d === 0, `всего — не больше TIP_T: ${a} + ${b} + ${c} + ${d}`);
  assert.equal(g.ev(`Tips.ok('держи 5 ⚡')`), false, 'числа в тексте не различаем');
  assert.equal(show(again(g)), 0, 'новый забег — тоже молчит');
});

test('подсказки: строка управления — только первые секунды первого визита на уровень', () => {
  const g = loadGame({ seed: 1 });
  g.ev(PREP.start); g.ev(`G.stage.controls = 'управление'; G.stage.t = G.stage.clock = 1`);
  g.step(30, true);
  assert.notEqual(g.ev(`document.getElementById('controls').style.display`), 'none', 'в начале — видна');
  g.ev(`G.stage.t = CTL_T + 1; G.stage.clock = CTL_T + 1`); g.step(12, true);
  assert.equal(g.ev(`document.getElementById('controls').style.display`), 'none', 'потом — скрыта');
  const h = again(g);
  h.ev(PREP.start); h.ev(`G.stage.controls = 'управление'; G.stage.t = G.stage.clock = 1`); h.step(30, true);
  assert.equal(h.ev(`document.getElementById('controls').style.display`), 'none', 'второй забег — сразу без неё');
});

test('подсказки: строка «как» у шага задания — пока шаг ни разу не сделан (и в новом забеге)', () => {
  const run = (gg, d) => gg.ev(`(() => { G.started = true; const seen = [], wt = wrapText; wrapText = (t, ...r) => { seen.push(t); return wt(t, ...r); };
    const tk = globalThis.__tk || (globalThis.__tk = {}); hudTask(1, tk, 'K', [{ t: 'Шаг 2', h: 'как-2', s: 'ok', d: ${d} }, { t: 'Ещё', h: 'как-ещё', s: 'ok', d: false }], [], '');
    wrapText = wt; return seen.join('|'); })()`);
  const g = loadGame({ seed: 1 });
  assert.match(run(g, false), /как-2/, 'шаг не сделан — строка «как» видна');
  run(g, true);
  assert.equal(g.ev(`Known.has('step:Шаг #')`), true, 'сделан — запомнили');
  assert.doesNotMatch(run(again(g), false), /как-2/, 'в новом забеге тот же шаг — без строки «как»');
});
