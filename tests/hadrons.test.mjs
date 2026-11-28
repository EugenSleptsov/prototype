// «Адроны» — всё должно стать белым: рогаткой кварк в кварк другого цвета (пара → барион), антикварк в свой цвет (мезон);
// одинаковый цвет отскакивает; за краем остывающей плазмы цветное вымерзает; Δ и гипероны распадаются в нуклоны;
// «Конфайнмент» — Вселенная бросает сама; конец уровня — нуклоны уходят в ядра.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function hadrons(rs) {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  if (rs) { while (g.ev('G.stage.key') !== 'particles') g.ev('advance(); G.trans = 99'); g.ev(`Object.assign(G.stage.rs, ${JSON.stringify(rs)})`); }
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('G.stage.skipChapters()'); // механика — сразу экзамен (главы — hadrons_chapters.test.mjs)
  g.step(30);
  return g;
}
// пустая плазма: тела — только из теста
const empty = g => g.ev(`(() => { const S = G.stage; S.o = []; S.pi = []; P.vx = P.vy = 0; S.stuck = () => false; })()`);
// тело из кварков в точке (dx, dy от центра плазмы): q = [[цвет, аромат, анти?]…]
const B = (name, q, dx = 0, dy = 0) => `globalThis.${name} = G.stage.mk(${JSON.stringify(q.map(([col, fl, anti]) => ({ col, fl, anti: !!anti })))}, G.stage.C.x + ${dx}, G.stage.C.y + ${dy}); ${name}.age = 9; ${name}.vx = ${name}.vy = 0`;
const kinds = g => g.ev('G.stage.o.map(o => o.kind).sort().join()');

test('адроны: в плазме — поровну трёх цветов, антикварки парами со своим кварком', () => {
  const g = hadrons();
  const c = g.ev(`[0, 1, 2].map(c => G.stage.o.reduce((s, o) => s + o.m.filter(q => !q.anti && q.col === c).length, 0))`);
  assert.equal(c[0], c[1]); assert.equal(c[1], c[2]);
  assert.ok(c[0] * 3 >= g.ev('Q_TOTAL'), c.join());
  assert.equal(g.ev('G.stage.o.filter(o => o.kind === "aq").length'), g.ev('ANTI_N'));
  assert.ok(g.ev('G.stage.hotR()') > 0 && g.ev('viewRadius()') >= g.ev('Q_R0'), 'вся плазма видна');
});

test('адроны: что выйдет — пара, барион, мезон; одинаковый цвет и чужой антицвет — отскок', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__r', [[0, 'u']], -1)); g.ev(B('__g', [[1, 'u']], 0)); g.ev(B('__r2', [[0, 'd']], 1)); g.ev(B('__ab', [[2, 'u', 1]], 2)); g.ev(B('__b', [[2, 'd']], 3));
  const J = (a, b) => g.ev(`(() => { const j = G.stage.judge(${a}, ${b}); return [j.ok, j.kind || j.why, j.label].join('|'); })()`);
  assert.match(J('__r', '__g'), /^true\|pair\|.*синий/);
  assert.match(J('__r', '__r2'), /^false\|same\|одинаковый цвет: нужен зелёный или синий/);
  assert.match(J('__ab', '__b'), /^true\|meson\|→ π⁻ белый/, 'd ū — π⁻');
  assert.match(J('__ab', '__r'), /^false\|anticol\|антисиний гасит только синий/);
  g.ev(B('__p', [[0, 'u'], [1, 'u']], 5));
  assert.match(J('__b', '__p'), /^true\|p\|→ p⁺ белый/);
  assert.match(J('__r2', '__p'), /^false\|same/);
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], 7));
  assert.equal(g.ev('__n.kind'), 'n');
  assert.match(J('__b', '__n'), /^false\|white\|n⁰ уже белый/);
});

test('адроны: рогаткой кварк в кварк — пара, третий цвет в пару — твой протон: +10 ✦, в кодексе', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__a', [[0, 'u']], -2)); g.ev(B('__b', [[1, 'u']], 0));
  g.ev('G.stage.launch(__a, 8, 0)');
  g.step(30);
  assert.equal(kinds(g), 'pair');
  assert.ok(g.ev('Codex.has("h:qq")'));
  g.ev(`(() => { const p = G.stage.o.find(o => o.kind === 'pair'); p.vx = p.vy = 0; ${B('__c', [[2, 'd']])}; __c.x = p.x; __c.y = p.y - 2; })()`);
  g.ev('G.stage.launch(__c, 0, 8)');
  const kn = g.ev('G.stage.kn');
  g.step(30);
  assert.equal(kinds(g), 'p');
  assert.equal(g.ev('G.stage.handN'), 1);
  assert.equal(g.ev('G.stage.made.p'), 1);
  assert.ok(g.ev('G.stage.kn') - kn >= 10);
  assert.equal(g.ev('G.stage.o[0].byHand && G.stage.o[0].mine'), true);
});

test('адроны: бросок одинакового цвета отскакивает, ничего не слипается', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__a', [[0, 'u']], -2)); g.ev(B('__b', [[0, 'd']], 0));
  g.ev('G.stage.launch(__a, 8, 0)');
  g.step(30);
  assert.equal(kinds(g), 'q,q');
  assert.equal(g.ev('G.stage.st.bounce'), 1);
});

test('адроны: антикварк в свой цвет — мезон: белый миг, потом вспышка; шаг «Погасить антикварк»', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__a', [[1, 'u', 1]], -2)); g.ev(B('__b', [[1, 'd']], 0));
  g.ev('G.stage.launch(__a, 8, 0)');
  g.step(20);
  assert.equal(kinds(g), 'meson');
  assert.equal(g.ev('G.stage.o[0].pk'), 'pi-');
  assert.equal(g.ev('G.stage.steps()[2].p[0]'), 1, 'шаг «Погасить антикварк»: 1 из MESON_N');
  assert.equal(g.ev('G.stage.white()') > 0, true);
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.o.length'), 0, 'пион вспыхнул');
  assert.equal(g.ev('G.stage.goneWhite'), 2, 'но его кварки — в счёт белого');
});

test('адроны: цветное за краем плазмы вымерзает (u уходит в π⁺ — пара из вакуума); белое — нет', () => {
  const g = hadrons(); empty(g);
  const far = 'G.stage.hotR() + 1.5';
  g.ev(`${B('__q', [[0, 'u']])}; __q.x = G.stage.C.x + ${far}`);
  g.ev(`${B('__p', [[0, 'u'], [1, 'u'], [2, 'd']])}; __p.x = G.stage.C.x - (${far})`);
  g.ev('G.stage.passive = () => {}');
  g.step(30);
  assert.ok(g.ev('__q.cold') > 0 && !g.ev('__q.dead'), 'ещё держится');
  g.step(150);
  assert.equal(g.ev('__q.dead'), true);
  assert.equal(g.ev('G.stage.st.frozen'), 1);
  assert.ok(g.ev("G.stage.pi.some(p => p.pk === 'pi+')"), 'u с антикварком из вакуума — π⁺');
  // второй из вакуумной пары — d того же цвета — остался и идёт внутрь: один кварк не превращается в один пион
  const left = g.ev(`(() => { const o = G.stage.o.find(o => !o.dead && o.m.length === 1 && o !== __q); return o && { col: o.m[0].col, fl: o.m[0].fl, anti: o.m[0].anti, d: Math.hypot(o.x - G.stage.C.x, o.y - G.stage.C.y), in: (o.x - G.stage.C.x) * o.vx < 0 }; })()`);
  assert.ok(left, 'в плазме остался кварк');
  assert.deepEqual([left.col, left.fl, left.anti], [0, 'd', false], 'того же цвета, u → d (заряд: u = π⁺ + d)');
  assert.equal(g.ev('__p.dead'), false, 'белому холод не страшен');
});

test('адроны: Δ⁺⁺ (● ● ●) распадается в p⁺ и π⁺ — нуклон всё равно твой', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__a', [[0, 'u'], [1, 'u']], 0)); g.ev(B('__b', [[2, 'u']], -2));
  g.ev('G.stage.launch(__b, 8, 0)');
  g.step(20);
  assert.equal(g.ev('G.stage.o[0].kind + G.stage.o[0].dq'), 'delta++');
  assert.equal(g.ev('Codex.has("h:delta")'), true);
  g.step(120);
  assert.equal(kinds(g), 'p');
  assert.equal(g.ev('G.stage.handN'), 1);
  assert.equal(g.ev('G.stage.st.delta'), 1);
});

test('адроны: «Конфайнмент» — Вселенная сама бросает к соседям, нуклоны платят в строку закона', () => {
  const g = hadrons(); empty(g);
  for (let i = 0; i < 4; i++) { g.ev(B('__a', [[0, 'u']], i * 1.4 - 3, -1)); g.ev(B('__b', [[1, 'u']], i * 1.4 - 3, 0)); g.ev(B('__c', [[2, 'd']], i * 1.4 - 3, 1)); }
  g.ev(`(() => { const S = G.stage; S.handN = HAND_Q; S.kn += 100; S.buy(0); })()`);
  assert.equal(g.ev('G.stage.rs.conf'), 1);
  g.step(60 * 25);
  assert.ok(g.ev('G.stage.autoN') >= 2, `нуклонов Вселенной ${g.ev('G.stage.autoN')}`);
  assert.ok(g.ev('G.stage.uni[0].kn') > 0);
  assert.equal(g.ev('G.stage.handN'), 2, 'чужое — не твоё');
});

test('адроны: всё сделано — уровень кончается, нуклоны уходят в ядра на своих местах', () => {
  const g = hadrons(); empty(g);
  for (let i = 0; i < 12; i++) { g.ev(B('__x', i < 10 ? [[0, 'u'], [1, 'u'], [2, 'd']] : [[0, 'u'], [1, 'd'], [2, 'd']], (i % 4) * 1.5 - 2, Math.floor(i / 4) * 1.5 - 2)); g.ev('__x.byHand = __x.mine = true'); }
  g.ev(`(() => { const S = G.stage; S.handN = 12; S.made.p = 10; S.made.n = 2; S.st.mesons = MESON_N; S.st.cueQ = 1; S.rs.conf = 1; })()`);
  assert.equal(g.ev('G.stage.steps().map(s => +s.d).join("")'), '111111');
  g.step(10);
  assert.notEqual(g.ev('G.stage.doneAt'), null);
  assert.equal(g.ev('G.stage.failed'), false);
  g.step(120);
  assert.equal(g.ev('G.stage.key'), 'nuclei');
  assert.equal(g.ev('G.stage.o.filter(o => o.mine && o.src).length'), 12);
});

test('адроны: последний шаг — и твой: 12 нуклонов Вселенной мало, нужно 5 своих', () => {
  const g = hadrons(); empty(g);
  for (let i = 0; i < 12; i++) g.ev(B('__x', i < 10 ? [[0, 'u'], [1, 'u'], [2, 'd']] : [[0, 'u'], [1, 'd'], [2, 'd']], (i % 4) * 1.5 - 2, Math.floor(i / 4) * 1.5 - 2));
  assert.equal(g.ev('G.stage.steps()[5].d'), false);
  g.ev('G.stage.o.slice(0, 5).forEach(o => o.byHand = true)');
  assert.equal(g.ev('G.stage.steps()[5].d'), true);
});

test('адроны: плазма остыла — цветное вымерзает, цель не выполнена, но уровень идёт дальше', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__q', [[0, 'u']])); g.ev(B('__p', [[0, 'u'], [1, 'u'], [2, 'd']], 2));
  g.ev('G.stage.cool = Q_COOL - .05');
  g.step(10);
  assert.notEqual(g.ev('G.stage.doneAt'), null);
  assert.equal(g.ev('G.stage.failed'), true);
  assert.equal(g.ev('__q.dead'), true);
  g.step(200);
  assert.equal(g.ev('G.stage.key'), 'nuclei');
  assert.equal(g.ev('G.stage.o.filter(o => o.src).length'), 1, 'протон всё равно ушёл к ядрам');
});

// ---------- тяжёлые кварки («Кварки II / III» в частицах) → гипероны ----------
test('гипероны: «Кварки II» — в плазме ▲ s и ■ c, «Кварки III» — ещё ⬢ b; без законов — только u и d', () => {
  const fl = g => g.ev('[...new Set(G.stage.o.flatMap(o => o.m.map(q => q.fl)))].sort().join("")');
  assert.equal(fl(hadrons()), 'du');
  assert.equal(fl(hadrons({ q1: 1, q2: 1 })), 'cdsu');
  assert.equal(fl(hadrons({ q1: 1, q2: 1, q3: 1 })), 'bcdsu');
});

test('гипероны: каскад Λb⁰ → Λc⁺ → Λ⁰ → p⁺ (b → c → s → u), каждый шаг — пион и запись в кодексе', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__h', [[0, 'u'], [1, 'd'], [2, 'b']])); g.ev('__h.byHand = true; __h.hadB = true');
  const seq = [g.ev('__h.sym')], pions = [];
  for (let i = 0; i < 3; i++) { g.ev('G.stage.pi = []; G.stage.decayHyp(__h)'); seq.push(g.ev('G.stage.symOf(__h)')); pions.push(g.ev('G.stage.pi.map(p => p.pk).join()')); }
  assert.equal(seq.join(' → '), 'Λb⁰ → Λc⁺ → Λ⁰ → p⁺');
  assert.equal(pions.join(), 'pi-,pi+,pi-');
  for (const k of ['lamc', 'lam']) assert.equal(g.ev(`Codex.has('h:${k}')`), true, k);
  assert.equal(g.ev('G.stage.st.bCasc'), 1);
  assert.equal(g.ev('G.stage.handN'), 1, 'нуклон из твоего гиперона — твой');
});

test('гипероны: у uus странный кварк становится d (Σ⁺ → p⁺ + π⁰); тяжёлый с антикварком — не мезон', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__h', [[0, 'u'], [1, 'u'], [2, 's']]));
  assert.equal(g.ev('__h.sym'), 'Σ⁺');
  g.ev('G.stage.decayHyp(__h)');
  assert.equal(g.ev('__h.kind'), 'p');
  g.ev(B('__s', [[0, 's']], 2)); g.ev(B('__au', [[0, 'u', 1]], 3));
  assert.equal(g.ev('G.stage.judge(__au, __s).why'), 'heavy');
});

test('p⁺ и n⁰ различимы: свой цвет кольца и подписи на плашке', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__p', [[0, 'u'], [1, 'u'], [2, 'd']], -1)); g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], 1));
  const tags = g.ev(`(() => { const L = [], t0 = tag; tag = (t, x, y, px, c) => L.push([t, c.join()]); try { G.stage.draw(1); } finally { tag = t0; } return L; })()`);
  const p = tags.find(t => t[0] === 'p⁺'), n = tags.find(t => t[0] === 'n⁰');
  assert.ok(p && n, JSON.stringify(tags));
  assert.notEqual(p[1], n[1]);
});

test('адроны: белое схлопывается — кварки стягиваются к центру, цветное (пара) не сжимается', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__p', [[0, 'u'], [1, 'u'], [2, 'd']], 0)); g.ev(B('__q', [[0, 'u'], [1, 'd']], 3));
  const D = n => g.ev(`+Math.hypot(${n}.m[0].x - ${n}.x, ${n}.m[0].y - ${n}.y).toFixed(3)`);
  assert.equal(D('__p'), .3);
  g.step(60);
  assert.equal(g.ev('__p.sq'), 1);
  assert.equal(D('__p'), +(0.3 * g.ev('SQ_K')).toFixed(3));
  assert.equal(g.ev('__p.rad'), g.ev('SQ_RAD'));
  assert.equal(g.ev('__q.sq'), 0); assert.equal(D('__q'), .22);
});

test('бильярд: нуклон берётся рогаткой (Δ и мезон — нет), бьёт кварк и не слипается с ним', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], -3)); g.ev(B('__d', [[0, 'u'], [1, 'u'], [2, 'u']], 3, 3)); g.ev(B('__q', [[0, 'u']], -1.5));
  g.ev('__d.t = 99');
  assert.ok(g.ev('G.stage.bodies().includes(__n)'));
  assert.ok(!g.ev('G.stage.bodies().includes(__d)'), 'Δ живёт миг — не берётся');
  g.ev('G.stage.launch(__n, 8, 0)');
  g.step(20);
  assert.equal(kinds(g), 'delta,n,q');
  assert.ok(g.ev('__q.vx') > 3, 'кварк сбит вперёд');
  assert.ok(g.ev('__n.vx') < g.ev('__q.vx'), 'шар потерял скорость');
  assert.equal(g.ev('G.stage.st.strikes'), 1);
});

test('бильярд: карамболь — нуклоном кварк в пару, вышел твой протон (+4 ✦ сверху), прицел показывает заранее', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], -3)); g.ev(B('__q', [[2, 'd']], -1.5)); g.ev(B('__p', [[0, 'u'], [1, 'u']], 0.5));
  const a = g.ev('(() => { const a = G.stage.predict(__n, 8, 0); return [a.label, !!a.then, a.hit]; })()');
  assert.match(a[0], /^карамболь → p⁺ белый/); assert.ok(a[1] && a[2]);
  const kn = g.ev('G.stage.kn');
  g.ev('G.stage.launch(__n, 8, 0)');
  g.step(40);
  assert.equal(kinds(g), 'n,p');
  assert.equal(g.ev('G.stage.st.carom'), 1);
  assert.equal(g.ev('G.stage.handN'), 1, 'карамболь — твой барион');
  assert.ok(g.ev('G.stage.kn') - kn >= 14, '+10 за барион и +4 за карамболь');
});

test('бильярд: от края плазмы шар отскакивает; кварк, сбитый из холода в тепло, — спасён', () => {
  const g = hadrons(); empty(g);
  const R = g.ev('G.stage.hotR()');
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], R - 1.5));
  g.ev('G.stage.launch(__n, 8, 0)');
  g.step(30);
  assert.ok(g.ev('__n.vx') < 0, 'отразился внутрь');
  assert.ok(g.ev('G.stage.st.bank') >= 1);
  assert.ok(g.ev(`Math.hypot(__n.x - G.stage.C.x, __n.y - G.stage.C.y)`) < R + .5);
  empty(g);
  g.ev(B('__m', [[0, 'u'], [1, 'd'], [2, 'd']], R + 2.6)); g.ev(B('__c', [[1, 'u']], R + 1)); g.ev('__c.cold = .3');
  assert.match(g.ev('G.stage.predict(__m, -8, 0).label'), /вернёт в тепло/);
  g.ev('G.stage.launch(__m, -8, 0)');
  g.step(40);
  assert.equal(g.ev('G.stage.st.saved'), 1);
  assert.equal(g.ev('G.stage.st.frozen'), 0);
});

test('приток плазмы: с главы «Холод» — в лавке, повторяемый; по 2 кварка каждого цвета (было 5), цена выше и растёт', () => {
  const g = hadrons();
  g.ev('G.stage.chap = CH_COLD - 1');
  assert.ok(!g.ev('G.stage.shopItems().some(x => x.k === "gen")'), 'пока плазма горячая — нет');
  g.ev('G.stage.chap = CH_GOAL; G.stage.kn += 100');
  const it = g.ev('G.stage.shopItems()');
  const i = it.findIndex(x => x.k === 'gen');
  assert.ok(i >= 0 && it[i].opt, 'не для задания — по желанию');
  const n0 = g.ev('G.stage.o.length'), q0 = g.ev('G.stage.Q0'), c0 = it[i].c, sp = g.ev('G.stage.spent');
  g.ev(`G.stage.buy(${i})`);
  assert.equal(g.ev('G.stage.o.length'), n0 + 6);
  assert.equal(g.ev('G.stage.Q0'), q0 + 6);
  assert.equal(g.ev('G.stage.spent') - sp, c0);
  const add = g.ev(`G.stage.o.slice(-6).map(o => [o.kind, o.m[0].col, Math.hypot(o.x - G.stage.C.x, o.y - G.stage.C.y) < G.stage.hotR()])`);
  assert.equal(add.map(a => a[1]).sort().join(), '0,0,1,1,2,2');
  assert.ok(add.every(a => a[0] === 'q' && a[2]), 'кварки — в горячем диске');
  const c1 = g.ev('G.stage.shopItems().find(x => x.k === "gen").c');
  assert.equal(c0, 12); assert.equal(c1, 17);
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(x => x.k === 'gen'))`);
  assert.equal(g.ev('G.stage.st.gen'), 2);
  assert.equal(g.ev('[2, 3, 4, 5, 6].map(k => (G.stage.st.gen = k, G.stage.genCost())).join()'), '24,33,44,57,72', 'квадратично');
  g.ev('G.stage.st.gen = 2');
  g.ev('G.stage.kn = G.stage.spent');
  const n2 = g.ev('G.stage.o.length');
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(x => x.k === 'gen'))`);
  assert.equal(g.ev('G.stage.o.length'), n2, 'без ✦ не покупается');
});

test('адроны после разбора: Δ не выгоднее чистого нуклона; брошенное мимо уходит в холод', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__a', [[0, 'u'], [1, 'u']], 0)); g.ev(B('__b', [[2, 'u']], -2));
  let kn = g.ev('G.stage.kn');
  g.ev('G.stage.launch(__b, 8, 0)'); g.step(150);
  const dGain = g.ev('G.stage.kn') - kn;
  g.ev('G.stage.o = []'); g.ev(B('__c', [[0, 'u'], [1, 'u']], 0)); g.ev(B('__d', [[2, 'd']], -2));
  kn = g.ev('G.stage.kn');
  g.ev('G.stage.launch(__d, 8, 0)'); g.step(30);
  const pGain = g.ev('G.stage.kn') - kn;
  assert.ok(dGain < pGain, `Δ → p⁺ даёт ${dGain}, чистый p⁺ — ${pGain}`);
  empty(g);
  const R = g.ev('G.stage.hotR()');
  g.ev(`${B('__e', [[0, 'u']])}; __e.x = G.stage.C.x + ${R} - .5; __e.vx = 5; globalThis.randn = () => 0`);
  let far = 0; for (let i = 0; i < 6; i++) { g.step(10); far = Math.max(far, g.ev('__e.x - G.stage.C.x') - R); }
  assert.ok(far > .3, `брошенный наружу кварк уходит за край (на ${far.toFixed(2)})`);
  g.ev(`__e.x = G.stage.C.x + G.stage.hotR() - .1; __e.vx = 0; __e.vy = 0`); g.step(5);
  assert.ok(g.ev('__e.vx') < 0, 'от теплового дрейфа у края — слабая тяга внутрь');
});

test('адроны после разбора: антикварков не осталось, мезона нет — вакуум рождает пару; тупик — по самому редкому цвету', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__q', [[0, 'u']], 2));
  g.step(60 * 5);
  assert.ok(g.ev('G.stage.st.vac') >= 1);
  assert.ok(g.ev('G.stage.o.some(o => o.kind === "aq")'), 'антикварк есть — шаг «погасить» выполним');
  const h = hadrons(); // свой stuck (empty() его глушит)
  h.ev('G.stage.st.mesons = 1; G.stage.o = []; G.stage.pi = []');
  for (let i = 0; i < 30; i++) h.ev(B('__r' + i, [[0, i % 2 ? 'u' : 'd']], (i % 6) - 3, (i / 6 | 0) - 2));
  h.ev('G.stage.kn = G.stage.spent');
  assert.equal(h.ev('G.stage.stuck()'), true, '30 красных — ни одного бариона');
});

test('бильярд после разбора: быстрый удар нуклона разбивает пару, прицел говорит заранее', () => {
  const g = hadrons(); empty(g);
  g.ev(B('__n', [[0, 'u'], [1, 'd'], [2, 'd']], -3)); g.ev(B('__p', [[0, 'u'], [1, 'd']], 0));
  assert.equal(g.ev('G.stage.predict(__n, 11, 0).label'), 'разобьёт пару');
  g.ev('G.stage.launch(__n, 11, 0)'); g.step(30);
  assert.equal(kinds(g), 'n,q,q');
  assert.equal(g.ev('G.stage.st.split'), 1);
});
