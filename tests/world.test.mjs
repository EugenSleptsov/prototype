// Мир без края на уровнях после частиц: Вселенная вокруг игрока, а переходы — твоими же телами и без скачка на экране.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// забег до этапа key (переходы — мгновенно)
function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.step(240); // камера доехала до масштаба этапа
  return g;
}
// чем этап хранит свои тела и сколько их держать в кадре
const WORLD = {
  quarks: ['o', null],
  nuclei: ['o', 'popWant(N_DENS, N_CAP)'],
  stars: ['gas', 'popWant(ST_GAS_D, ST_GAS_CAP)'],
  atoms: ['ions', 'popWant(A_DENS, A_CAP)'],
  molecules: ['m', 'popWant(M_DENS, M_CAP)'],
};

for (const key of ['nuclei', 'stars', 'atoms', 'molecules']) {
  test(`мир без края: ${key} — ушёл далеко, вокруг снова Вселенная, твоё не пропало`, () => {
    const g = toStage(key);
    const [arr, want] = WORLD[key];
    g.ev(`G.stage.${arr}.forEach((o, i) => o.__id = i); globalThis.__mine = G.stage.${arr}.filter(o => o.mine).map(o => o.__id); globalThis.__other = G.stage.${arr}.filter(o => !o.mine).map(o => o.__id)`);
    // далеко-далеко: десять полей зрения вправо
    g.ev('P.x += viewRadius() * 10; cam.x = P.x; cam.y = P.y');
    let bornInView = 0;
    for (let i = 0; i < 20 * 60; i++) { // 20 с; каждое новое тело рождается за краем кадра
      g.step(1);
      bornInView += g.ev(`G.stage.${arr}.filter(o => o.age === 1 / 60 && !o.src && inView(o.x, o.y)).length`);
    }
    assert.equal(bornInView, 0, 'Вселенная приносит из-за края, а не рождает в кадре');
    const have = g.ev(`G.stage.${arr}.filter(o => !o.dead && inView(o.x, o.y)).length`), need = g.ev(want);
    assert.ok(have >= need * .5, `в кадре ${have} из ${need}`);
    const left = g.ev(`G.stage.${arr}.map(o => o.__id).filter(id => id !== undefined)`);
    assert.ok(g.ev('__other.length') === 0 || !g.ev('__other').some(id => left.includes(id)), 'чужое вдали растворилось');
    if (key !== 'molecules' && key !== 'stars') assert.ok(g.ev('__mine').every(id => left.includes(id)), 'твоё не растворяется');
  });
}

test('мир без края: тела не тянет обратно к месту старта', () => {
  const g = toStage('nuclei');
  g.ev('globalThis.__o = G.stage.o[0]; __o.x = P.x + 30; __o.y = P.y; __o.vx = __o.vy = 0; __o.mine = true');
  g.step(5 * 60);
  assert.ok(g.ev('Math.abs(__o.x - (P.x + 30))') < 4, `ядро уехало: ${g.ev('__o.x - P.x')}`);
});

// экранные координаты тел: [sx, sy]
const scr = (g, expr) => g.ev(`(${expr}).map(o => W2S(o.x, o.y).map(v => Math.round(v * 10) / 10))`);

test('переход ядра → звёзды: газ — твои ядра, теперь атомы, на тех же местах', () => {
  const g = toStage('nuclei');
  const before = scr(g, 'G.stage.o');
  g.ev('G.stage.doneAt = 0; advance()');
  assert.equal(g.ev('G.stage.key'), 'stars');
  const mine = scr(g, 'G.stage.gas.filter(q => q.src)');
  assert.deepEqual(mine, before, 'каждое ядро стало облачком газа там же');
  g.step(90);
  // уходящее ядро гаснет там, где проявляется облачко
  assert.ok(g.ev('G.stage.gas.filter(q => q.src).every(q => Math.hypot(q.src.x - q.x, q.src.y - q.y) < .05)'));
});

test('звезда зажглась: мир растягивается, а на экране ничего не прыгает', () => {
  const g = toStage('stars');
  const before = scr(g, 'G.stage.gas');
  g.ev('G.stage.ignite(P.x, P.y)');
  const after = scr(g, 'G.stage.gas');
  assert.deepEqual(after, before);
  assert.ok(g.ev('G.stage.o.length') >= 18, 'газ комка стал ядрами недр');
  assert.ok(g.ev('G.stage.o.filter(o => o.age === 0).every(o => G.stage.gas.some(q => q.core && Math.hypot(q.x - o.x, q.y - o.y) < 1e-9))'), 'ядро — там, где было облачко комка');
});

test('переход звёзды → атомы: ионы — ядра сверхновой там, куда их вынесло', () => {
  const g = toStage('stars');
  g.ev('G.stage.cheat(); G.stage.supernova()');
  g.step(2.7 * 60);
  assert.equal(g.ev('G.stage.key'), 'atoms');
  const n = g.ev('G.prev.o.filter(o => o.Z >= 1).length');
  assert.equal(g.ev('G.stage.ions.filter(i => i.src).length'), n);
  assert.ok(g.ev('G.stage.ions.filter(i => i.src).every(i => Math.hypot(i.src.x - i.x, i.src.y - i.y) < .3)'));
});

test('переход атомы → молекулы: масштаб ×5, но на экране ничего не прыгает', () => {
  const g = toStage('atoms');
  g.ev('G.stage.ions.forEach((i, k) => { i.ne = k % 3 ? i.Z : 0; })'); // каждый третий — голый ион: в химию не идёт
  const before = scr(g, 'G.stage.ions.filter(i => CHEM[atSym(i.Z)] && i.ne >= i.Z)'), z = g.ev('cam.z');
  assert.ok(before.length > 3);
  g.ev('advance()');
  assert.equal(g.ev('G.stage.key'), 'molecules');
  const after = scr(g, 'G.stage.m.filter(m => m.src)');
  assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) for (const k of [0, 1]) assert.ok(Math.abs(after[i][k] - before[i][k]) < .2, `атом ${i}: ${before[i]} → ${after[i]}`);
  assert.ok(Math.abs(g.ev('cam.z') * 5 - z) < 1e-6, 'камера отъехала ровно на ×5');
  // уходящий этап рисуется своей камерой: в его единицах ион там же, где новый атом
  g.step(60);
  assert.ok(g.ev('G.stage.m.filter(m => m.src).every(m => { const [x, y] = toPrev(m.x, m.y); return Math.hypot(m.src.x - x, m.src.y - y) < .05; })'));
});
