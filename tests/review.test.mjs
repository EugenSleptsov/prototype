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

test('ядра: доля гелия не зависит ни от зума, ни от места карты — гелий на пробу Вселенной; фоновый гелий не в счёт', () => {
  const g = toStage('nuclei');
  g.ev(`(() => { const S = G.stage; for (const o of S.o) o.dead = true; S.o = []; })()`);
  g.ev(`for (let i = 0; i < 2; i++) G.stage.mk(2, 2, cam.x + 40 + i, cam.y); for (let i = 0; i < 2; i++) G.stage.mk(2, 2, cam.x + i, cam.y + 1)`);
  const y0 = g.ev('G.stage.Y()');
  assert.ok(Math.abs(y0 - 16 / g.ev('Y_B')) < 1e-9, `и дальний гелий, и ближний: ${y0}`);
  for (const z of [.5, 2]) { g.ev(`G.zoom = ${z}`); g.step(60 * 3); assert.ok(Math.abs(g.ev('G.stage.Y()') - y0) < 1e-9, `зум ×${z}`); }
  g.ev('G.zoom = 1; panBy(-60 * cam.z, 0)'); g.step(60 * 3);
  assert.ok(Math.abs(g.ev('G.stage.Y()') - y0) < 1e-9, 'карта уехала — гелий не растворился, доля та же');
  g.ev(`G.stage.mk(2, 2, cam.x, cam.y).cos = true`);
  assert.ok(Math.abs(g.ev('G.stage.Y()') - y0) < 1e-9, 'гелий из-за края (фон Вселенной) — не в счёт');
});

test('адроны: антибарионов нет — антикварк гасит только один кварк своего цвета', () => {
  const g = toStage('quarks');
  assert.equal(g.ev(`(() => { const S = G.stage, a = S.mk([{ col: 0, fl: 'u', anti: true }], 0, 0), b = S.mk([{ col: 1, fl: 'u', anti: true }], 0, 0); return S.judge(a, b).ok; })()`), false);
  assert.equal(g.ev(`(() => { const S = G.stage, a = S.mk([{ col: 0, fl: 'u', anti: true }], 0, 0), b = S.mk([{ col: 0, fl: 'u', anti: false }, { col: 1, fl: 'd', anti: false }], 0, 0); return S.judge(a, b).why; })()`), 'antipair');
});

test('атомы: «Рекомбинация» сама прозрачности не даёт — после ~65 % электроны тормозит след игрока; в задании нет «дальше ты»', () => {
  const g = toStage('atoms');
  g.ev(`(() => { const S = G.stage; S.st.brakes = 1; S.st.relaxed = 1; for (const Z of AT_NEED) S.seenN.add(Z); S.rs.rec = 1; Uni.learn(S, 'rec', '◎', 'Рекомбинация', UNI_LVL); })()`);
  g.step(60 * 50);
  assert.equal(g.ev('G.stage.doneAt'), null, `нейтральных ${Math.round(g.ev('G.stage.neutral()') * 100)} %`);
  assert.ok(g.ev('G.stage.neutral()') < g.ev('A_GOAL'));
  assert.doesNotMatch(g.ev('G.stage.steps().map(s => s.h).join()'), /дальше ты|сама —/);
});

test('атомы: подпись гелия — над его оболочкой и на тёмной плашке (на светлом свечении не теряется)', () => {
  const g = toStage('atoms');
  const r = g.ev(`(() => { const S = G.stage, io = S.ion(2, P.x, P.y, 1); io.ne = 2; io.age = 9; S.ions = [io]; S.el = [];
    const L = [], t0 = tag; tag = (t, x, y) => L.push([t, y]); try { S.draw(1); } finally { tag = t0; }
    const [, sy] = W2S(io.x, io.y), z = cam.z, rr = (.3 + .06 * 2) * z;
    return { L, edge: sy - (.55 * z + rr) };
  })()`);
  const he = r.L.find(t => t[0] === 'He');
  assert.ok(he, JSON.stringify(r.L));
  assert.ok(he[1] < r.edge - 6, `подпись ${he[1]} выше кольца оболочки ${r.edge}`);
});

for (const key of ['quarks', 'nuclei', 'atoms']) test(`чит ]: ${key} — уровень и правда доходит до конца`, () => {
  const g = toStage(key);
  g.ev('G.stage.cheat()');
  g.step(30);
  assert.notEqual(g.ev('G.stage.doneAt'), null, g.ev('G.stage.steps().map(s => +s.d).join("")'));
});

test('частицы: «Генерация» лептонов — по лестнице (μ после e, τ после μ); кварки — законы поколений «Кварки I → II → III»; цвет кнопки — поколение', () => {
  const g = toStage('particles');
  g.ev(`(() => { const S = G.stage; S.ep = 1; S.rs.coll = 1; S.kn += 9999; for (const sp of ['e', 'u', 'd', 'mu', 'ta', 's', 'c']) { Codex.see(sp); Codex.run.add(sp); } })()`);
  const list = () => g.ev(`G.stage.resList().map(r => r.k)`);
  assert.ok(list().includes('e') && !list().includes('mu') && !list().includes('ta') && list().includes('q1') && !list().includes('q2'), list().join());
  assert.ok(!list().some(k => ['u', 'd', 'c', 's'].includes(k)), 'кварки — не по одному');
  assert.equal(g.ev("G.stage.buyNext('s')"), 'q1'); assert.equal(g.ev("G.stage.ladder('s')"), '«Кварки I», потом «Кварки II»');
  assert.equal(g.ev(`G.stage.buyNext('ta')`), 'e', 'к τ — сначала e');
  assert.match(g.ev(`G.stage.ladder('ta')`), /«Лептоны I», потом «Лептоны II», потом «Лептоны III»/);
  g.ev(`G.stage.rs.e = 1`);
  assert.ok(list().includes('mu') && !list().includes('ta'));
  g.ev(`G.stage.rs.q1 = 1; G.stage.rs.mu = 1`);
  assert.ok(list().includes('q2') && !list().includes('q3') && list().includes('ta'), list().join());
  const html = g.ev(`(() => { const el = document.getElementById('shop'); G.started = true; el._h = ''; G.stage._pk = null; G.stage.renderShop(el); return el.innerHTML; })()`);
  assert.match(html, /class="res[^"]* g2"/, 'второе поколение — жёлтое');
});

// кузница: распад научённого тяжёлого — лёгкое в запас; асимметрия — только при трёх поколениях кварков
function field(g) {
  g.ev(`(() => { ['e', 'u', 'd', 'g', 'H', 'W', 'Z', 'c', 's', 'b', 'mu', 'ta'].forEach(k => { Codex.see(k); Codex.run.add(k); }); const S = G.stage; S.tut = null; S.rs.coll = 1; S.ep = 2; S.hig = 1; S.T = 40; S.udRes = []; S.eRes = 0; Cine.clear(); Cine.tick(99); })()`);
}
const teach = (g, ks) => g.ev(`(() => { const S = G.stage; for (const k of ${JSON.stringify(ks)}) { S.rs[k] = 1; Codex.auto.add(k); Uni.learn(S, k, k, k, 3); } })()`);
const decay = (g, sp, anti = false) => g.ev(`(() => { const S = G.stage, o = S.mk('${sp}', ${anti}, P.x + 3, P.y, 0, .5); S.decay(o); return S.udRes.length + ',' + S.eRes; })()`);

test('кузница: распад научённого тяжёлого кварка — лёгкий кварк в запас; антикварк и ненаученный — нет; потолок растёт с поколениями', () => {
  const g = toStage('particles'); field(g);
  assert.equal(decay(g, 'c'), '0,0', 'нет закона «Генерация c» — кузницы нет');
  teach(g, ['u', 'd', 'c']);
  assert.equal(decay(g, 'c'), '1,0');
  assert.equal(decay(g, 'c', true), '1,0', 'антикварк — не вещество');
  assert.equal(g.ev('G.stage.udCap()'), g.ev('UD_MAX + UD_STEP'));
  g.ev('G.stage.udRes = Array(G.stage.udCap()).fill("u")');
  assert.equal(decay(g, 'c'), g.ev('UD_MAX + UD_STEP') + ',0', 'потолок');
  teach(g, ['s', 'b']);
  assert.equal(g.ev('G.stage.udCap()'), g.ev('UD_MAX + 2 * UD_STEP'), 'третье поколение — потолок выше');
  teach(g, ['e', 'mu']);
  assert.match(decay(g, 'mu'), /,1$/, 'μ → e⁻ к атомам');
});

test('кузница: выкованное сверх UD_MAX в детектор эпохи 4 не ложится — уходит в «Адроны»; электроны — в «Атомы» холодными', () => {
  const g = toStage('particles'); field(g);
  g.ev(`(() => { const S = G.stage; S.udRes = Array(15).fill(0).map((_, i) => i % 2 ? 'u' : 'd'); S.stock = 0; S.stockQ = []; S.eRes = 5; S.startEpoch(3); })()`);
  assert.equal(g.ev('G.stage.stockQ.length'), g.ev('UD_MAX'), 'задание эпохи 4 — по-прежнему твоё');
  assert.equal(g.ev('G.stage.forgedQ.length'), 15 - g.ev('UD_MAX'));
  g.ev('G.stage.endLevel(); G.trans = 99');
  assert.equal(g.ev('G.stage.key'), 'quarks');
  assert.ok(g.ev('G.stage.o.filter(o => o.mine).length') >= 15, 'выкованное — материал «Адронов»');
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  assert.equal(g.ev('G.stage.eForge'), 5);
  assert.ok(g.ev('G.stage.el.filter(e => e.slow > 0).length') >= 5, 'холодные электроны у ионов');
});

test('асимметрия: в эпохе 4 лестница «Генерация» до b не нужна — сразу «⚖ Асимметрия», задание без «научи»', () => {
  const g = toStage('particles'); field(g);
  g.ev(`(() => { const S = G.stage; S.startEpoch(3); S.stockQ = [0, 1, 2, 0, 1, 2].map(col => ({ fl: col ? 'u' : 'd', col })); S.kn += 9999; })()`);
  assert.equal(g.ev('G.stage.resList().map(r => r.k).join()'), 'cp', 'ни одной «Генерации» не куплено — всё равно сразу асимметрия');
  assert.equal(g.ev('G.stage.steps()[1].res'), 'cp');
  assert.doesNotMatch(g.ev('G.stage.steps()[1].h'), /[Нн]ауч|учи/);
  assert.match(g.ev(`G.stage.resList()[0].about(0)`), /три поколения/);
});

test('эпоха 3: цепочка b — в задании всегда', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const g = loadGame({ seed }); g.ev(PREP.start);
    assert.ok(g.ev(`G.stage.need2.includes('b')`), `seed ${seed}`);
  }
});

test('«Свет» II — не больше света, а горячие источники: в эпохе 1 впервые зажигает их, дальше — вдвое больше', () => {
  const g = toStage('particles');
  g.ev('G.stage.tut = null; Cine.clear(); Cine.tick(99)');
  g.ev('G.stage.rs.ph = 1');
  assert.equal(g.ev('G.stage.hzN()'), 0, 'эпоха 1, закон I: источников нет');
  const cap1 = g.ev('G.stage.phN(1)');
  g.ev('G.stage.rs.ph = 2');
  assert.equal(g.ev('G.stage.phN(2)'), cap1, 'света столько же');
  assert.equal(g.ev('G.stage.hzN()'), g.ev('HZ_N'), '«Свет II» в эпохе 1 — первые HZ_N источников');
  g.ev('G.stage.hz = []; G.stage.hzCd = 0'); g.step(60 * 40);
  assert.ok(g.ev('G.stage.hz.length') >= 1, `источников ${g.ev('G.stage.hz.length')}`);
  g.ev('G.stage.rs.ph = 1');
  assert.match(g.ev(`(() => { const r = G.stage.resList().find(r => r.k === 'ph'); return r ? r.about(1) : ''; })()`), /горячих источника у детектора/);
  g.ev('G.stage.ep = 1; G.stage.rs.ph = 1');
  assert.equal(g.ev('G.stage.hzN()'), g.ev('HZ_N'));
  g.ev('G.stage.rs.ph = 2');
  assert.equal(g.ev('G.stage.hzN()'), 2 * g.ev('HZ_N'), 'дальше — вдвое больше');
});

test('счётчик «Во Вселенной»: число e±, μ±, τ± и γ в мире', () => {
  const g = toStage('particles');
  g.ev(`(() => { const S = G.stage; for (const o of S.p) o.dead = true; S.p = []; for (let i = 0; i < 3; i++) S.pair('mu', P.x + 2, P.y + i, .3); S.mk('e', false, P.x, P.y + 3, 0, .3); })()`);
  assert.equal(g.ev(`G.stage.metric('mu').n`), 6, 'μ⁺ и μ⁻ — вместе');
  assert.equal(g.ev(`G.stage.metric('e').n`), 1);
  assert.equal(g.ev(`G.stage.metric('ta').n`), 0);
  g.ev(`G.stage.p.find(o => o.sp === 'e').fade = 1`);
  assert.equal(g.ev(`G.stage.metric('e').n`), 0, 'гаснущий — уже не в счёт');
});

test('кванты: в кадре не остывают — за улетающим можно погнаться; мир полон — области молчат', () => {
  const g = toStage('particles');
  const r = g.ev(`(() => { const S = G.stage; S.tut = null; S.hzCd = 1e9; for (const o of S.p) o.dead = true; S.p = []; S.populate = () => {}; // одна область — эта, новых не вспыхивает
    S.hz = [{ x: P.x + 15, y: P.y, r: HZ_R, t: 10, L: 999 }]; // в мире, но далеко от квантов
    const mk = (dx) => { const o = S.mk('ph', false, P.x + dx, P.y, 0, 0); o.born = 1; o.v = 0; o.ql = Q_LIFE; return o; };
    const off = () => halfView()[1] + 1.5; // чуть за краем кадра, но в мире
    const near = mk(3.5), far = mk(0); far.y = P.y + off();
    for (let i = 0; i < 60 * (Q_LIFE + 5); i++) { near.x = P.x + 3.5; near.y = P.y; far.x = P.x; far.y = P.y + off(); far.v = near.v = 0; update(1 / 60); }
    const gone = o => o.dead || o.fade >= 0, fNear = gone(near), fFar = gone(far);
    // мир полон: квантов больше qCap · Q_FULL — горячая область у детектора не испускает
    for (const o of S.p) o.dead = true; S.p = []; S.hz[0].x = P.x; S.hz[0].em = 0;
    const N = Math.ceil(S.qCap() * Q_FULL) + 2; for (let i = 0; i < N; i++) { const o = mk(i * .01); o.y = P.y + off(); }
    for (let i = 0; i < 120; i++) update(1 / 60);
    return { fNear, fFar, full: S.qFull(), born: S.p.filter(o => !o.dead && o.sp === 'ph').length - N };
  })()`);
  assert.equal(r.fFar, true, 'за кадром остыл за Q_LIFE');
  assert.equal(r.fNear, false, 'в кадре ещё живёт');
  assert.equal(r.full, true);
  assert.ok(r.born <= 0, `мир полон — область не добавила квантов (${r.born})`);
});

test('слева одна панель: пока меряешь свет — «Поймано γ», измерил — «Во Вселенной» на её месте', () => {
  const g = loadGame({ seed: 3 }); g.ev(PREP.start); g.ev(PREP.pump()); g.step(60 * 3);
  const drawn = () => g.ev(`(() => { const L = []; const f = ctx.fillText; ctx.fillText = (t, ...a) => { L.push(String(t)); return f.call(ctx, t, ...a); };
    try { G.stage.drawCaught(1); G.stage.drawMeter(1); } finally { ctx.fillText = f; } return L.join('|'); })()`);
  assert.equal(g.ev('G.stage.caughtOn()'), true, 'свет ещё не измерен');
  assert.match(drawn(), /ПОЙМАНО γ/); assert.doesNotMatch(drawn(), /ВО ВСЕЛЕННОЙ/);
  g.ev(`for (const c of G.stage.madeCls()) G.stage.measure(c)`);
  assert.doesNotMatch(drawn(), /ПОЙМАНО γ/); assert.match(drawn(), /ВО ВСЕЛЕННОЙ/);
});

test('лишние частицы уходят только за экраном: на глазах ничего не пропадает в пустоте', () => {
  const g = toStage('particles');
  const r = g.ev(`(() => { const S = G.stage; for (const o of S.p) o.dead = true; S.p = []; Codex.auto.add('e');
    const [hw, hh] = halfView(), mk = (x, y) => { const o = S.mk('e', false, x, y, 0, .3); o.born = 1; return o; };
    const near = [], far = [];
    for (let i = 0; i < 12; i++) near.push(mk(P.x + (i - 6) * .4, P.y + 1));
    for (let i = 0; i < 12; i++) far.push(mk(P.x, P.y + hh + 3 + i * .1));
    S.populate(1 / 60);
    return { near: near.filter(o => !o.dead && !(o.fade >= 0)).length, far: far.filter(o => !o.dead).length }; })()`);
  assert.equal(r.near, 12, 'в кадре все живы');
  assert.ok(r.far < 12, `за экраном лишние ушли (осталось ${r.far})`);
});
