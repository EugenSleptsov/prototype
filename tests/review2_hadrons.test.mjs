// «Адроны» после второго ревью: сбережённое в «Частицах» греет плазму (остынет позже, строка на старте, «твоих вымерзло»);
// цветное в холоде рукой не взять — только сбить нуклоном-шаром; тупик видит запертые пары, нехватку d и своих;
// каскад b → c → s → u — три шага, «трижды».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function hadrons() {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.step(30);
  return g;
}
// пустая плазма: тела — только из теста; тупик заглушён, кроме тестов тупика (own — свой stuck)
const empty = (g, own = false) => g.ev(`(() => { const S = G.stage; S.o = []; S.pi = []; S.floats = []; P.vx = P.vy = 0; ${own ? 'S.st.mesons = 1; S.kn = S.spent;' : 'S.stuck = () => false;'} })()`);
// тело из кварков в точке (dx, dy от центра плазмы): q = [[цвет, аромат, анти?]…]
const B = (name, q, dx = 0, dy = 0) => `globalThis.${name} = G.stage.mk(${JSON.stringify(q.map(([col, fl, anti]) => ({ col, fl, anti: !!anti })))}, G.stage.C.x + ${dx}, G.stage.C.y + ${dy}); ${name}.age = 9; ${name}.vx = ${name}.vy = 0`;
// сбережённое «Частицами»: n кварков у детектора, цвета по кругу
const saved = n => `({ key: 'particles', rs: {}, handoff: ${JSON.stringify(Array.from({ length: n }, (_, i) => ({ x: Math.cos(i) * .4, y: Math.sin(i) * .4, vx: 0, vy: 0, fl: i % 3 ? 'u' : 'd', col: i % 3 })))} })`;

test('Частицы → Адроны: каждый сбережённый кварк греет плазму — она остынет позже; строка на старте', () => {
  const g = hadrons();
  g.ev(`G.stage.enter(${saved(20)})`);
  assert.equal(g.ev('G.stage.nSaved'), 20);
  assert.equal(g.ev('G.stage.coolT'), g.ev('Q_COOL + Math.round(Math.min(HEAT_MAX, 20 * HEAT_PER))'));
  assert.ok(g.ev('G.stage.coolT') > g.ev('Q_COOL'), 'твоё вещество — дольше горячо');
  assert.match(g.ev('G.stage.heatMsg'), /Из «Частиц»: 20 твоих кварков — плазма горячее: остынет за 2:30 \(\+30 с\)/);
  // на часах — тот же срок; плазма ещё горячая там, где без сбережённого уже остыла бы
  g.ev('G.stage.cool = Q_COOL');
  assert.ok(g.ev('G.stage.hotR()') > 0);
  g.ev('G.stage.cool = 0; globalThis.__msg = []; globalThis.__m0 = msg; msg = (t, d) => { __msg.push(t); __m0(t, d); }');
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.heatMsg'), null, 'строку показали');
  assert.ok(g.ev('__msg.some(t => /20 твоих кварков/.test(t))'));
  // потолок: сколько ни сбереги — не дольше HEAT_MAX
  g.ev(`G.stage.enter(${saved(200)})`);
  assert.equal(g.ev('G.stage.coolT'), g.ev('Q_COOL + HEAT_MAX'));
  // ничего не сберёг — без запаса тепла, и это сказано
  g.ev(`G.stage.enter(${saved(0)})`);
  assert.equal(g.ev('G.stage.coolT'), g.ev('Q_COOL'));
  assert.match(g.ev('G.stage.heatMsg'), /не сбережено ни одного кварка/);
  g.ev('G.stage.cool = Q_COOL');
  assert.equal(g.ev('G.stage.hotR()'), 0);
  // с титула (без прошлого уровня) — как было: 2 минуты, без строки, плазма полна
  g.ev('G.stage.enter(null)');
  assert.equal(g.ev('G.stage.coolT'), g.ev('Q_COOL'));
  assert.equal(g.ev('G.stage.heatMsg'), null);
  assert.ok(g.ev('G.stage.o.filter(o => o.kind === "q").length') >= g.ev('Q_TOTAL'), 'материала на цель хватает');
});

test('Частицы → Адроны: вымерзшие твои кварки — в итоге уровня («твоих»), тепло сбережённых — тоже', () => {
  const g = hadrons();
  g.ev(`G.stage.enter(${saved(6)})`); g.step(10);
  empty(g);
  const R = g.ev('G.stage.hotR()');
  g.ev(B('__m', [[0, 'u']], R + 1.5)); g.ev('__m.mine = true');
  g.ev(B('__x', [[1, 'u']], -R - 1.5));
  g.step(60 * 3.5);
  assert.equal(g.ev('G.stage.st.frozen'), 2);
  assert.equal(g.ev('G.stage.st.frozenMine'), 1, 'вымерз один твой');
  const rows = g.ev('JSON.stringify(G.stage.tally().rows)');
  assert.match(rows, /"вымерзло кварков · твоих","2 · 1"/);
  assert.match(rows, /"тепло твоих кварков","6 → \+9 с"/);
});

test('бильярд после ревью: цветное в холоде рукой не взять — только нуклон-шар; прицел и подсказка это говорят', () => {
  const g = hadrons(); empty(g);
  const R = g.ev('G.stage.hotR()');
  g.ev(B('__in', [[0, 'u']], 0, R - 1.5)); g.ev(B('__c', [[1, 'u']], R + 1)); g.ev(B('__pr', [[0, 'u'], [2, 'd']], 0, -R - 1.2));
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], R + 2.6));
  assert.ok(g.ev('G.stage.bodies().includes(__in)'), 'в тепле — берётся');
  assert.ok(!g.ev('G.stage.bodies().includes(__c)'), 'кварк в холоде — нет');
  assert.ok(!g.ev('G.stage.bodies().includes(__pr)'), 'пара в холоде — нет');
  assert.ok(g.ev('G.stage.bodies().includes(__n)'), 'нуклон и за краем — шар');
  assert.match(g.ev('G.stage.predict(__n, -8, 0).label'), /вернёт в тепло/);
  // нажал на замерзающий — не взялся, и сказано почему
  g.ev(`(() => { const [x, y] = W2S(__c.x, __c.y); mouse.x = x; mouse.y = y; mouse.down = true; })()`);
  g.step(2); g.ev('mouse.down = false'); g.step(2);
  assert.equal(g.ev('G.stage.sl.held'), null);
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === 'в холоде рукой не взять: сбей шаром')`), g.ev('JSON.stringify(G.stage.floats.map(f => f.txt))'));
  // спасает удар шаром
  g.ev('G.stage.launch(__n, -8, 0)'); g.step(40);
  assert.ok(g.ev('G.stage.st.saved') >= 1);
  assert.equal(g.ev('__c.dead'), false);
});

test('бильярд после ревью: край ушёл из-под руки — в холоде цветное не удержать (держанием не спасти)', () => {
  const g = hadrons(); empty(g);
  const R = g.ev('G.stage.hotR()');
  g.ev(B('__q', [[0, 'u']], R - .2));
  g.ev(`(() => { const [x, y] = W2S(__q.x, __q.y); mouse.x = x; mouse.y = y; mouse.down = true; })()`);
  g.step(1);
  assert.equal(g.ev('G.stage.sl.held === __q'), true, 'в тепле — взял');
  g.ev('G.stage.cool = G.stage.coolT * .3'); // диск сжался, кнопка всё ещё зажата
  g.step(2);
  assert.equal(g.ev('__q.held'), false);
  assert.equal(g.ev('G.stage.sl.held'), null);
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === 'в холоде рукой не удержать')`));
  g.ev('mouse.down = false');
  g.step(60 * 3.2);
  assert.equal(g.ev('__q.dead'), true, 'отпущенный в холоде — вымерз');
});

test('тупик после ревью: все кварки заперты в парах, а шара разбить их нет — уровень кончается', () => {
  const g = hadrons(); empty(g, true);
  // 6 RG, 6 GB, 6 BR: по 12 кварков каждого цвета — счёт по цветам «хватает», но ни одной одиночки
  const cols = [[0, 1], [1, 2], [2, 0]];
  for (let i = 0; i < 18; i++) { const [a, b] = cols[i % 3]; g.ev(B('__p' + i, [[a, 'u'], [b, 'd']], (i % 6) - 2.5, (i / 6 | 0) * 1.2 - 1.2)); }
  assert.equal(g.ev('G.stage.o.filter(o => o.kind === "pair").length'), 18);
  assert.equal(g.ev('G.stage.stuck()'), true);
  assert.match(g.ev('G.stage.stuckWhy()'), /заперты в парах/);
  // мезона ещё не было — вакуум родит одиночку: не тупик
  g.ev('G.stage.st.mesons = 0'); assert.equal(g.ev('G.stage.stuck()'), false); g.ev('G.stage.st.mesons = 1');
  // одиночка недостающего цвета — пару можно закрыть, а барион — шар: не тупик
  g.ev(B('__s', [[2, 'u']], 0, 3)); assert.equal(g.ev('G.stage.stuck()'), false); g.ev('__s.dead = true; G.stage.o = G.stage.o.filter(o => !o.dead)');
  // готовый нуклон разобьёт пару — не тупик
  g.ev(B('__n', [[0, 'u'], [1, 'u'], [2, 'd']], 0, -3)); assert.equal(g.ev('G.stage.stuck()'), false);
  // и тупик правда кончает уровень, с причиной
  g.ev('__n.dead = true; G.stage.o = G.stage.o.filter(o => !o.dead)');
  g.step(60 * 3.5);
  assert.notEqual(g.ev('G.stage.doneAt'), null);
  assert.equal(g.ev('G.stage.failed'), true);
  assert.ok(g.ev(`G.stage.floats.some(f => /заперты в парах/.test(f.txt))`));
});

test('тупик после ревью: на нейтроны не осталось d (Δ⁺⁺ даёт только p⁺); Δ⁻ и гиперон dds — нейтроны', () => {
  const g = hadrons(); empty(g, true);
  for (let i = 0; i < 10; i++) { g.ev(B('__P' + i, [[0, 'u'], [1, 'u'], [2, 'd']], (i % 5) - 2, (i / 5 | 0) * 1.4 - 2)); g.ev(`__P${i}.byHand = true`); }
  for (let i = 0; i < 9; i++) g.ev(B('__u' + i, [[i % 3, 'u']], (i % 5) - 2, 1.5 + (i / 5 | 0)));
  // по счёту цветов хватило бы (10 + 3 ≥ 12), но из одних u нейтрон не сложить
  assert.equal(g.ev('G.stage.stuck()'), true);
  assert.match(g.ev('G.stage.stuckWhy()'), /d-кварков/);
  // Δ⁺⁺ — только протон: не спасает
  g.ev(B('__dpp', [[0, 'u'], [1, 'u'], [2, 'u']], 0, -3)); assert.equal(g.ev('__dpp.kind'), 'delta');
  assert.equal(g.ev('G.stage.fate(__dpp)'), 'p'); assert.match(g.ev('G.stage.stuckWhy()'), /d-кварков/);
  // Δ⁻ и Σ⁻ (dds → udd) станут нейтронами — уже не тупик; Λ⁰ (uds) — протон
  g.ev(B('__dm', [[0, 'd'], [1, 'd'], [2, 'd']], 2, -3)); g.ev(B('__sg', [[0, 'd'], [1, 'd'], [2, 's']], -2, -3)); g.ev(B('__lm', [[0, 'u'], [1, 'd'], [2, 's']], -3, -3));
  assert.equal(g.ev('G.stage.fate(__dm)'), 'n'); assert.equal(g.ev('G.stage.fate(__sg)'), 'n'); assert.equal(g.ev('G.stage.fate(__lm)'), 'p');
  assert.equal(g.ev('G.stage.stuck()'), false);
  g.ev('__dm.dead = __sg.dead = __lm.dead = true; G.stage.o = G.stage.o.filter(o => !o.dead)');
  // d двух цветов в плазме — нейтроны снова собираются
  g.ev(B('__d1', [[0, 'd']], 3, 0)); g.ev(B('__d2', [[1, 'd']], 3, 1)); g.ev(B('__d3', [[1, 'd']], 3, 2)); g.ev(B('__d4', [[2, 'd']], 3, 3));
  assert.equal(g.ev('G.stage.stuck()'), false);
});

test('тупик после ревью: своих нуклонов уже не набрать — тупик, хотя нуклонов хватит', () => {
  const g = hadrons(); empty(g, true);
  for (let i = 0; i < 11; i++) g.ev(B('__N' + i, [[0, 'u'], [1, i < 3 ? 'd' : 'u'], [2, 'd']], (i % 5) - 2, (i / 5 | 0) * 1.4 - 2));
  for (let i = 0; i < 9; i++) g.ev(B('__q' + i, [[i % 3, i % 2 ? 'u' : 'd']], (i % 5) - 2, 2.5 + (i / 5 | 0)));
  assert.match(g.ev('G.stage.stuckWhy()'), /своих/, 'все 11 — Вселенной, а сложить рукой можно лишь 3');
  g.ev('__N0.byHand = __N1.byHand = true');
  assert.equal(g.ev('G.stage.stuck()'), false, '2 своих + 3 рукой = 5');
});

test('каскад b → c → s → u: три слабых распада — прелестный кварк «трижды» стал легче', () => {
  const g = hadrons(); empty(g);
  g.ev(`globalThis.__once = []; G.stage.once = (k, t) => __once.push([k, t])`);
  g.ev(B('__b', [[0, 'u'], [1, 'd'], [2, 'b']]));
  g.ev(`G.stage.onWhite(__b, 'hand'); __b.byHand = true`);
  assert.equal(g.ev('__b.kind'), 'hyp');
  for (let i = 0; i < 3; i++) g.ev('G.stage.decayHyp(__b)');
  assert.equal(g.ev('__b.kind'), 'p');
  const t = g.ev(`(__once.find(x => x[0] === 'bcasc') || [])[1] || ''`);
  assert.match(t, /^Каскад b → c → s → u: три слабых распада/);
  assert.match(t, /трижды/); assert.doesNotMatch(t, /дважды/);
});
