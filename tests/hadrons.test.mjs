// «Адроны»: очаги плазмы (не слипаются, плавят), пионы (π± перезаряжает нуклон, π⁰ сжигает кварк),
// разрыв струны дикварка, Δ → нуклон + пион (каскад), «Баланс n/p», конец уровня — барионы уходят к ядрам.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function hadrons() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.step(30);
  // пустой кадр: свои кварки — только из теста; Вселенная ничего не приносит, очагов нет
  g.ev(`(() => { const S = G.stage; for (const o of S.q) o.dead = true; S.q = []; S.groups.clear(); S.qgp = []; S.hotN = 9;
    S.flow = () => {}; S.pairs = () => {}; P.vx = P.vy = 0; mouse.has = false; })()`);
  return g;
}
// кварк в точке (dx, dy от детектора)
const qAt = (name, col, fl, dx = 0, dy = 0, anti = false) => `globalThis.${name} = G.stage.mk(P.x + ${dx}, P.y + ${dy}, ${col}, ${anti}, '${fl}'); ${name}.age = 1`;
// готовая группа из кварков (без начисления — как будто слиплась давно)
const grp = (name, kind, qs) => `(() => { const S = G.stage, m = [${qs}], id = S.gid++, g = { id, m, kind: '${kind}', t: 9, hand: 0, born: S.t }; for (const o of m) o.g = id; S.groups.set(id, g); globalThis.${name} = g; })()`;
const field = cap => `G.stage.focus = { cap: [${cap}], had: [], ang: 0, t: 0, tog: 0, tog2: 0 }; for (const o of G.stage.focus.cap) o.cap = true`;

test('адроны: в очаге плазмы тройка R·G·B не слипается; вынес из очага — барион', () => {
  const g = hadrons();
  g.ev(`G.stage.qgp = [{ x: P.x, y: P.y, r0: 2, t0: -9, L: 999 }]`);
  g.ev(qAt('__a', 0, 'u')); g.ev(qAt('__b', 1, 'u')); g.ev(qAt('__c', 2, 'd'));
  g.ev(field('__a, __b, __c'));
  for (let i = 0; i < 60; i++) g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('G.stage.groups.size'), 0, 'горячо — свободны');
  g.ev(`P.x += 4; G.stage.focus.tog = 0`);
  for (let i = 0; i < 200; i++) g.ev('G.stage.tickFocus(1 / 60)'); // поле везёт тройку за детектором
  assert.equal(g.ev('[...G.stage.groups.values()].map(g => g.kind).join()'), 'p');
  assert.equal(g.ev('G.stage.handN'), 1);
});

test('адроны: протон, занесённый в очаг, плавится обратно на кварки', () => {
  const g = hadrons();
  g.ev(qAt('__a', 0, 'u')); g.ev(qAt('__b', 1, 'u', .3)); g.ev(qAt('__c', 2, 'd', .15, .25)); g.ev(grp('__p', 'p', '__a, __b, __c'));
  g.ev(`G.stage.qgp = [{ x: P.x, y: P.y, r0: 2, t0: -9, L: 999 }]`);
  for (let i = 0; i < 40; i++) g.ev('G.stage.updGroups(1 / 60, true)');
  assert.equal(g.ev('G.stage.groups.size'), 0);
  assert.equal(g.ev('G.stage.st.melts'), 1);
  assert.equal(g.ev('__a.g'), 0);
});

test('адроны: поле собирает π⁺ (● + ◇ того же цвета) и несёт его — π⁺ + n⁰ → p⁺', () => {
  const g = hadrons();
  g.ev(qAt('__u', 0, 'u', .1)); g.ev(qAt('__ad', 0, 'd', -.1, 0, true));
  g.ev(field('__u'));
  g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('__ad.cap'), true, 'антикварк другой формы того же цвета — в поле');
  const kn = g.ev('G.stage.kn');
  for (let i = 0; i < 40; i++) g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('G.stage.focus.had.map(g => g.kind).join()'), 'pi+', 'пион собран и остался в поле');
  assert.equal(g.ev('G.stage.kn') - kn, 4);
  g.ev('Spot.end()');
  // нейтрон рядом — поле подтягивает, перезарядка
  g.ev(qAt('__x', 0, 'u', .5)); g.ev(qAt('__y', 1, 'd', .7)); g.ev(qAt('__z', 2, 'd', .6, .2)); g.ev(grp('__n', 'n', '__x, __y, __z'));
  for (let i = 0; i < 60 && !g.ev('G.stage.st.flips'); i++) { g.ev('G.stage.tickFocus(1 / 60); G.stage.pionHits()'); }
  assert.equal(g.ev('__n.kind'), 'p');
  assert.equal(g.ev('__n.m.filter(o => o.fl === "u").length'), 2);
  assert.equal(g.ev('G.stage.st.handFlips'), 1);
  assert.equal(g.ev('__u.dead && __ad.dead'), true, 'пион поглощён');
});

test('адроны: поле не соберёт π⁰ (одна форма), а сам π⁰ из твоего кварка сгорает — потеря', () => {
  const g = hadrons();
  g.ev(qAt('__u', 0, 'u', .1)); g.ev(qAt('__au', 0, 'u', -.1, 0, true));
  g.ev(field('__u')); g.ev('G.stage.tickFocus(1 / 60)');
  assert.ok(!g.ev('__au.cap'), 'ū к u поле не берёт');
  g.ev('G.stage.focus = null; __u.cap = false; __u.own = 1');
  g.ev('G.stage.binding()');
  assert.equal(g.ev('[...G.stage.groups.values()].map(g => g.kind).join()'), 'pi0');
  for (let i = 0; i < 90; i++) g.ev('G.stage.updGroups(1 / 60, true)');
  assert.equal(g.ev('G.stage.st.pi0Lost'), 1);
  assert.equal(g.ev('__u.dead'), true);
});

test('адроны: отпусти два кварка — дикварк; чиркнул поперёк струны — барион и улетающий антикварк', () => {
  const g = hadrons();
  g.ev(qAt('__a', 0, 'u', -.15)); g.ev(qAt('__b', 1, 'u', .15));
  g.ev(field('__a, __b')); g.ev('G.stage.release()');
  assert.equal(g.ev('[...G.stage.groups.values()].map(g => g.kind).join()'), 'forming');
  const kn = g.ev('G.stage.kn');
  g.ev(`G.stage.press = { cuts: 0 }; G.stage.blade(P.x, P.y - 1, P.x, P.y + 1)`);
  assert.equal(g.ev('G.stage.st.snaps'), 1);
  assert.equal(g.ev('[...G.stage.groups.values()].map(g => g.kind).join()'), 'p', 'uu + d из вакуума = протон');
  assert.ok(g.ev('G.stage.q.some(o => o.anti && o.col === 2 && o.fl === "d")'), 'антикварк d̄ недостающего цвета');
  assert.equal(g.ev('G.stage.kn') - kn, 4 + 10, 'разрыв +4, барион руками +10');
});

test('адроны: Δ⁺⁺ — чиркнул к нейтрону: p⁺ остаётся, π⁺ летит и перезаряжает n⁰ — каскад', () => {
  const g = hadrons();
  g.ev(qAt('__a', 0, 'u')); g.ev(qAt('__b', 1, 'u', .3)); g.ev(qAt('__c', 2, 'u', .15, .25));
  g.ev(`__a.hand = __b.hand = __c.hand = 2; G.stage.join(__a, __b); G.stage.join(__a, __c); globalThis.__D = G.stage.groups.get(__a.g)`);
  assert.equal(g.ev('__D.kind + __D.dq'), 'delta++');
  g.ev(qAt('__x', 0, 'u', 3)); g.ev(qAt('__y', 1, 'd', 3.3)); g.ev(qAt('__z', 2, 'd', 3.15, .25)); g.ev(grp('__n', 'n', '__x, __y, __z'));
  g.ev(`G.stage.press = { cuts: 0 }; G.stage.blade(P.x - .6, P.y + .1, P.x + .6, P.y + .1)`);
  assert.equal(g.ev('__D.kind'), 'p');
  assert.ok(g.ev('[...G.stage.groups.values()].some(g => g.kind === "pi+" && g.fromDelta)'));
  g.step(60);
  assert.equal(g.ev('__n.kind'), 'p', 'пион долетел');
  assert.equal(g.ev('G.stage.st.cascade'), 1);
});

test('адроны: «Баланс n/p» — лишние нейтроны сами становятся протонами, до нужной доли', () => {
  const g = hadrons();
  for (let i = 0; i < 6; i++) { g.ev(qAt('__x', 0, 'u', i * 2, 5)); g.ev(qAt('__y', 1, 'd', i * 2 + .3, 5)); g.ev(qAt('__z', 2, 'd', i * 2 + .15, 5.25)); g.ev(grp('__n', 'n', '__x, __y, __z')); }
  for (let i = 0; i < 4; i++) { g.ev(qAt('__x', 0, 'u', i * 2, 8)); g.ev(qAt('__y', 1, 'u', i * 2 + .3, 8)); g.ev(qAt('__z', 2, 'd', i * 2 + .15, 8.25)); g.ev(grp('__p', 'p', '__x, __y, __z')); }
  g.ev(`G.stage.rs.np = 1; Uni.learn(G.stage, 'np', '⚖', 'Баланс n/p', 3)`);
  for (let i = 0; i < 30; i++) { g.ev('G.stage.npCd = 0; G.stage.npTick(1 / 60)'); }
  const { p, n } = g.ev('G.stage.liveNP()');
  assert.equal(p + n, 10);
  assert.ok(p / 10 >= g.ev('NP_LO') && n >= 2, `p ${p} n ${n} — в коридоре, пара нейтронов ядрам осталась`);
  assert.equal(g.ev('G.stage.inCorridor()'), true);
  assert.ok(g.ev(`G.stage.uni[0].kn`) > 0, 'в строку закона');
});

test('адроны: всё сделано — уровень кончается, протоны и нейтроны уходят в ядра', () => {
  const g = hadrons();
  for (let i = 0; i < 12; i++) { const u2 = i >= 2; g.ev(qAt('__x', 0, 'u', i * 1.5, 4)); g.ev(qAt('__y', 1, u2 ? 'u' : 'd', i * 1.5 + .3, 4)); g.ev(qAt('__z', 2, 'd', i * 1.5 + .15, 4.25)); g.ev(grp('__g', u2 ? 'p' : 'n', '__x, __y, __z')); }
  g.ev(`(() => { const S = G.stage; S.handN = 5; S.made.p = 3; S.made.n = 2; S.st.snaps = 1; S.st.handFlips = 1; S.rs.conf = S.rs.np = 1; })()`);
  assert.equal(g.ev('G.stage.steps().map(s => +s.d).join("")'), '111111');
  g.step(10);
  assert.notEqual(g.ev('G.stage.doneAt'), null);
  g.step(120);
  assert.equal(g.ev('G.stage.key'), 'nuclei');
  assert.equal(g.ev('G.stage.o.filter(o => o.mine && o.src).length'), 12, 'все 12 барионов — нуклонами');
});
