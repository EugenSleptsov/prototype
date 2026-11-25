// После адверсарного ревью: законы-тумблеры честны (выключенный не платит, научил заново — снова работает),
// ✦ не фармятся и не капают после конца забега, законы не проходят последний шаг за игрока, читы `]` доводят уровень.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}

test('законы: выключенный закон себе не пишет; научил заново — снова включён; журнал строки не растёт без предела', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.rs.syn = 1; Uni.learn(G.stage, 'syn', '☀', 'Нуклеосинтез', UNI_LVL)`);
  g.ev(`Uni.toggle(G.stage, 'syn')`);
  const r0 = g.ev(`G.stage.uni[0].kn`), k0 = g.ev('G.stage.kn');
  g.ev(`Uni.pay(G.stage, 'syn', 5)`);
  assert.equal(g.ev(`G.stage.uni[0].kn`), r0, 'строка выключенного закона стоит');
  assert.equal(g.ev('G.stage.kn'), k0 + 5, 'но ✦ уровня — честно');
  g.ev(`Uni.learn(G.stage, 'syn', '☀', 'Нуклеосинтез', UNI_LVL)`);
  assert.equal(g.ev(`Uni.off(G.stage, 'syn')`), false, 'научил заново — работает');
  g.ev(`for (let i = 0; i < 2000; i++) Uni.pay(G.stage, 'syn', 1)`);
  assert.ok(g.ev(`G.stage.uni[0].log.length`) <= 400);
});

test('забег кончен — счёт стоит: ни ✦ уровня, ни доход законов в очки уже не идут', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.rs.syn = 1; Uni.learn(G.stage, 'syn', '☀', 'Нуклеосинтез', 60)`);
  g.step(2);
  g.ev('G.ended = true');
  const s = g.ev('G.score');
  g.ev('G.stage.kn += 50'); g.step(120);
  assert.equal(g.ev('G.score'), s);
});

test('частицы: «Свет» выключен — и в эпохах 2–3 Вселенная не держит запас квантов; в эпоху 4 — то же для глюонов', () => {
  const g = toStage('particles');
  const cap = (ep, off) => g.ev(`(() => { const S = G.stage, e = S.ep, o = S.uniOff; S.ep = ${ep}; S.uniOff = new Set(${JSON.stringify(off)}); const c = S.qCap(); S.ep = e; S.uniOff = o; return c; })()`);
  assert.ok(cap(1, []) > 0);
  assert.equal(cap(1, ['ph']), g.ev('G.stage.gOn') ? cap(1, ['ph', 'g']) + cap(1, ['ph']) : 0);
  assert.equal(cap(3, ['ph', 'g']), 0, 'ни света, ни глюонов');
  assert.equal(cap(3, ['ph']), g.ev('G_MAX4'), 'только глюоны');
});

test('частицы: тройки кварков считаются точно — ddd не барион, а d̄-раскладку жадность не теряет', () => {
  const g = toStage('particles');
  const T = list => g.ev(`baryonTrios(${JSON.stringify(list)})`);
  assert.equal(T([0, 1, 2, 0, 1, 2].map(col => ({ fl: 'd', col }))), 0, 'одни d — ни одного бариона');
  assert.equal(T([{ fl: 'u', col: 0 }, { fl: 'd', col: 0 }, { fl: 'u', col: 1 }, { fl: 'd', col: 1 }, { fl: 'd', col: 2 }, { fl: 'd', col: 2 }]), 2, 'два нейтрона');
  assert.equal(T([0, 1, 2].map(col => ({ fl: 'u', col }))), 0, 'uuu — Δ⁺⁺, не нуклон');
});

test('ядра: гелий считается только в круге вокруг кадра — дальний не в счёт, приближение не меняет долю', () => {
  const g = toStage('nuclei');
  g.ev(`(() => { const S = G.stage; for (const o of S.o) o.dead = true; S.o = []; S.dissolve = () => {}; })()`);
  g.ev(`for (let i = 0; i < 8; i++) G.stage.o.push(G.stage.mk(2, 2, cam.x + Y_R + 6 + i, cam.y))`);
  assert.equal(g.ev('G.stage.Y()'), 0, 'гелий далеко за кадром');
  g.ev(`for (let i = 0; i < 4; i++) G.stage.o.push(G.stage.mk(2, 2, cam.x + i, cam.y + 1))`);
  assert.ok(g.ev('G.stage.Y()') > 0);
});

test('адроны: законы лепят барионы, но последний шаг — и твой: 5 нуклонов полем', () => {
  const g = toStage('quarks');
  g.ev(`(() => { const S = G.stage; for (const o of S.q) o.dead = true; S.q = []; S.groups.clear(); S.qgp = []; S.flow = () => {}; S.pairs = () => {};
    S.handN = 5; S.made.p = 3; S.made.n = 2; S.st.snaps = 1; S.st.handFlips = 1; S.rs.conf = S.rs.np = 1;
    globalThis.__G = [];
    for (let i = 0; i < 12; i++) { const fl = i < 10 ? ['u', 'u', 'd'] : ['u', 'd', 'd'], m = fl.map((f, c) => S.mk(P.x + i * 1.5 + c * .3, P.y + 4, c, false, f)), id = S.gid++, grp = { id, m, kind: i < 10 ? 'p' : 'n', t: 9, born: S.t };
      for (const o of m) o.g = id; S.groups.set(id, grp); __G.push(grp); } })()`);
  assert.equal(g.ev('G.stage.steps()[5].d'), false, '12 барионов Вселенной — мало');
  g.ev('for (const grp of __G.slice(0, 5)) for (const o of grp.m) o.own = 1');
  assert.equal(g.ev('G.stage.steps()[5].d'), true);
});

test('адроны: антибарионов нет; повтор экзотики платит лишь первые разы', () => {
  const g = toStage('quarks');
  assert.equal(g.ev(`(() => { const S = G.stage, m = [0, 1, 2].map(c => S.mk(P.x, P.y, c, true, 'u')); return S.valid(m); })()`), false);
  assert.equal(g.ev('EXO_REP') >= 1, true);
});

test('атомы: «Рекомбинация» сама прозрачности не даёт — после ~65 % доводишь ты', () => {
  const g = toStage('atoms');
  g.ev(`(() => { const S = G.stage; S.st.brakes = 1; S.st.relaxed = 1; for (const Z of AT_NEED) S.seenN.add(Z); S.rs.rec = 1; Uni.learn(S, 'rec', '◎', 'Рекомбинация', UNI_LVL); })()`);
  g.step(60 * 50);
  assert.equal(g.ev('G.stage.doneAt'), null, `нейтральных ${Math.round(g.ev('G.stage.neutral()') * 100)} %`);
  assert.ok(g.ev('G.stage.neutral()') < g.ev('A_GOAL'));
});

for (const key of ['quarks', 'nuclei', 'atoms']) test(`чит ]: ${key} — уровень и правда доходит до конца`, () => {
  const g = toStage(key);
  g.ev('G.stage.cheat()');
  g.step(30);
  assert.notEqual(g.ev('G.stage.doneAt'), null, g.ev('G.stage.steps().map(s => +s.d).join("")'));
});

test('частицы: «Рождение» поколений — по лестнице: μ только после e, τ после μ; c, s — после u и d; цвет кнопки — поколение', () => {
  const g = toStage('particles');
  g.ev(`(() => { const S = G.stage; S.ep = 1; S.rs.coll = 1; S.kn += 9999; for (const sp of ['e', 'u', 'd', 'mu', 'ta', 's', 'c']) { Codex.see(sp); Codex.run.add(sp); } })()`);
  const list = () => g.ev(`G.stage.resList().map(r => r.k)`);
  assert.ok(list().includes('e') && !list().includes('mu') && !list().includes('ta') && !list().includes('c'), list().join());
  assert.equal(g.ev(`G.stage.buyNext('ta')`), 'e', 'к τ — сначала e');
  assert.match(g.ev(`G.stage.ladder('ta')`), /«Рождение e», потом «Рождение μ», потом «Рождение τ»/);
  g.ev(`G.stage.rs.e = 1`);
  assert.ok(list().includes('mu') && !list().includes('ta'));
  g.ev(`G.stage.rs.u = 1`);
  assert.ok(!list().includes('c'), 'c — после u и d');
  g.ev(`G.stage.rs.d = 1; G.stage.rs.mu = 1`);
  assert.ok(list().includes('c') && list().includes('s') && list().includes('ta'));
  const html = g.ev(`(() => { const el = document.getElementById('shop'); G.started = true; el._h = ''; G.stage._pk = null; G.stage.renderShop(el); return el.innerHTML; })()`);
  assert.match(html, /class="res[^"]* g2"/, 'второе поколение — жёлтое');
});
