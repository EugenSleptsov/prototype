// Законы — тумблеры (выключил — Вселенная этого не делает; уровень завершён — все снова включены);
// частицы: второй квант выбираешь сам (ближайший любого вида, с короткой подсветкой), горячие области на карте;
// мир за краем кадра уже заполнен — сдвинул карту, там не пусто.
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
const lit = () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); ['e', 'u', 'd', 'g'].forEach(k => Codex.see(k)); G.stage.pairs = 1; G.stage.kn += 2000; Cine.clear(); Cine.tick(99)`);
  return g;
};
const buy = (g, k) => g.ev(`(() => { const S = G.stage, it = S.shopItems(), i = it.findIndex(x => x.r && x.r.k === '${k}'); S.buy(i); Cine.clear(); Cine.tick(99); })()`);

test('тумблер закона: «Нуклеосинтез» выключен — Вселенная гелий не несёт и ✦ строка не капает; финиш — снова включён', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.rs.syn = 1; Uni.learn(G.stage, 'syn', '☀', 'Нуклеосинтез', UNI_LVL); G.stage.t = 0`);
  g.ev(`G.stage.o.push(G.stage.mk(2, 2, P.x + 1, P.y)); G.stage.o.push(G.stage.mk(2, 2, P.x - 1, P.y))`); // гелий вокруг — доля Y > 0
  const he = () => g.ev(`(() => { let n = 0; for (let i = 0; i < 300; i++) { const o = G.stage.cosmic(P.x + 99, P.y, 0, 0); o.dead = true; if (o.Z === 2) n++; } return n; })()`);
  assert.ok(he() > 0, 'закон работает — гелий приходит');
  g.ev(`Uni.toggle(G.stage, 'syn')`);
  assert.equal(g.ev(`Uni.off(G.stage, 'syn')`), true);
  assert.equal(he(), 0, 'выключен — только p и n');
  assert.equal(g.ev(`Uni.on(G.stage, 'syn')`), false);
  const html = g.ev(`(() => { const el = document.getElementById('uni'); G.started = true; Uni.render(el); return el.innerHTML; })()`);
  assert.match(html, /class="ur[^"]* dis/, 'строка — выключенная');
  assert.match(html, /выключен \(щелчок включает\)/);
  const kn = g.ev(`G.stage.uni[0].kn`);
  g.ev(`for (let i = 0; i < 60 * 40; i++) Uni.tick(G.stage, 1 / 60)`);
  assert.equal(g.ev(`G.stage.uni[0].kn`), kn, 'ровный доход стоит');
  g.ev(`G.stage.doneAt = 1; Uni.tick(G.stage, 1 / 60)`);
  assert.equal(g.ev(`Uni.off(G.stage, 'syn')`), false, 'уровень завершён — закон снова включён');
  g.ev(`Uni.toggle(G.stage, 'syn')`);
  assert.equal(g.ev(`Uni.off(G.stage, 'syn')`), false, 'на финише не выключить');
});

test('тумблер закона: частицы — «Генерация e» выключена, Вселенная e не рождает; включил — снова', () => {
  const g = lit();
  buy(g, 'coll'); buy(g, 'e');
  assert.equal(g.ev(`Codex.auto.has('e')`), true);
  g.ev(`Uni.toggle(G.stage, 'e')`);
  assert.equal(g.ev(`Codex.auto.has('e')`), false);
  assert.equal(g.ev(`G.stage.rs.e`), 1, 'научено остаётся — лавка не предложит заново');
  assert.ok(!g.ev(`G.stage.shopItems().some(x => x.r && x.r.k === 'e')`));
  g.ev(`Uni.toggle(G.stage, 'coll')`);
  assert.equal(g.ev(`(() => { const S = G.stage; S.spCd = 0; S.hz = []; const a = S.mk('ph', false, P.x + 3, P.y, 0, 1), b = S.mk('ph', false, P.x + 3.1, P.y, 0, 1); a.born = b.born = 1; const n = S.p.length; S.spontaneous(1 / 60); return S.p.length === n && !a.dead; })()`), true, '«Столкновения» выключены — кванты не сталкиваются сами');
  g.ev(`Uni.toggle(G.stage, 'e'); Uni.toggle(G.stage, 'coll')`);
  assert.equal(g.ev(`Codex.auto.has('e') && !Uni.off(G.stage, 'coll')`), true);
});

// поле с одним пойманным фотоном у детектора; рядом — глюон (ближе) и второй фотон (дальше)
function pickSetup() {
  const g = lit();
  g.ev(`(() => { const S = G.stage; S.tut = null; S.hz = []; for (const o of S.p) o.dead = true; S.p = [];
    const mk = (sp, dx) => { const o = S.mk(sp, false, P.x + dx, P.y, 0, 1); o.born = 1; o.v = 0; return o; };
    globalThis.__a = mk('ph', -.3); globalThis.__g = mk('g', .4); globalThis.__b = mk('ph', .9);
    __a.cap = true; S.focus = { cap: [__a], q: 0, E: 0, lv: 0, ang: 0, t: 0 }; S.populate = () => {}; S.spontaneous = () => {}; })()`);
  return g;
}
test('частицы: второй квант — ближайший любого вида, не «того же», и не сразу: есть миг довести детектор', () => {
  const g = pickSetup();
  g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('G.stage.focus.cap.length'), 1, 'сразу не берёт — подсветка');
  assert.equal(g.ev('G.stage.focus.cand === __g'), true, 'кандидат — ближайший, глюон');
  for (let i = 0; i < 25; i++) g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('G.stage.focus.cap.map(o => o.sp).sort().join()'), 'g,ph', 'γ + g — как и хотел');
});
test('частицы: подвёл детектор к другому кванту — кандидат сменился, взят он', () => {
  const g = pickSetup();
  g.ev('G.stage.tickFocus(1 / 60)');
  g.ev('P.x += 1.1'); // теперь фотон __b у самого центра
  for (let i = 0; i < 30; i++) g.ev('G.stage.tickFocus(1 / 60)');
  assert.equal(g.ev('G.stage.focus.cap.includes(__b)'), true);
  assert.ok(!g.ev('__g.cap'), 'глюон не взят');
});

test('частицы: свет рождается в основном в горячей области — у неё гуще, вдали остывает; там жёстче, удар в ней набирается быстрее', () => {
  const g = lit();
  const r = g.ev(`(() => { const S = G.stage; S.tut = null; S.autoT = 99; S.hz = [{ x: P.x + 6, y: P.y, r: HZ_R, t: 10, L: 99 }]; const z = S.hz[0];
    for (const o of S.p) o.dead = true; S.p = []; P.x += 3; // детектор рядом с областью
    // кванты летят со скоростью света: область — их источник, вдали свет остывает; доля у области — в среднем за 12 с
    let n = 0, nZ = 0;
    for (let i = 0; i < 60 * 20; i++) { update(1 / 60); if (i < 60 * 8 || i % 30) continue;
      const ph = S.p.filter(o => !o.dead && o.sp === 'ph' && !(o.fade >= 0)); n += ph.length; nZ += ph.filter(o => Math.hypot(o.x - z.x, o.y - z.y) < z.r).length; }
    const zA = Math.PI * z.r ** 2, wA = Math.PI * S.wr() ** 2;
    // жёсткость: квант из области против обычного
    const avg = hp => { let s = 0, n = 0; for (let i = 0; i < 3000; i++) { const k = S.p.length; S.spawnQuantum(true, hp); const o = S.p[k]; if (o && o.sp === 'ph') { s += o.p; n++; } } return s / n; };
    return { share: nZ / n, area: zA / wA, pIn: avg([z.x, z.y]), pOut: avg(null) }; })()`);
  assert.ok(r.share > r.area * 1.5, `в области ${Math.round(r.share * 100)} % квантов при ${Math.round(r.area * 100)} % площади`);
  assert.ok(r.pIn > r.pOut * 1.3, `свет жёстче: ${r.pIn.toFixed(2)} против ${r.pOut.toFixed(2)}`);
  const q = inZone => g.ev(`(() => { const S = G.stage; for (const o of S.p) o.dead = true; S.p = []; S.en = 99;
    if (${inZone}) { S.hz[0].x = P.x; S.hz[0].y = P.y; } else { S.hz[0].x = P.x + 50; }
    const a = S.mk('ph', false, P.x, P.y, 0, 1), b = S.mk('ph', false, P.x, P.y, 0, 1); a.born = b.born = 1; a.cap = b.cap = true;
    S.focus = { cap: [a, b], q: 0, E: 0, lv: 0, ang: 0, t: 0 }; for (let i = 0; i < 30; i++) S.tickFocus(1 / 60); return S.focus.q; })()`);
  assert.ok(q(true) > q(false) * 1.3, 'в горячей области шкала удара бежит быстрее');
});

test('частицы: горячие области появляются сами, живут и остывают; в эпоху 4 их нет', () => {
  const g = lit();
  g.ev('G.stage.tut = null; G.stage.hz = []; G.stage.hzCd = 0');
  g.step(60 * 20);
  assert.ok(g.ev('G.stage.hz.length') >= 1, 'на карте есть горячая область');
  assert.ok(g.ev('G.stage.hz.every(z => z.r === HZ_R && z.L > 20)'));
  g.ev('G.stage.hz.forEach(z => z.t = z.L - .01)'); g.step(2);
  assert.ok(g.ev('G.stage.hz.every(z => z.t < 1)'), 'старые остыли — на их месте могут вспыхнуть новые');
  g.ev('G.stage.ep = 3'); g.step(2);
  assert.equal(g.ev('G.stage.hz.length'), 0);
});

test('частицы: после закона «Глюоны» — цветные вихри, глюоны рождаются в основном в них (и не вязнут); без закона их нет', () => {
  const g = lit();
  g.ev('G.stage.tut = null; G.stage.autoT = 99; G.stage.cz = []; G.stage.czCd = 0');
  g.step(60 * 5);
  assert.equal(g.ev('G.stage.rs.g'), 0); assert.equal(g.ev('G.stage.cz.length'), 0, 'до закона цветных вихрей нет');
  buy(g, 'g');
  assert.ok(g.ev('G.stage.rs.g') > 0, 'закон «Глюоны» куплен');
  g.step(60 * 15);
  assert.ok(g.ev('G.stage.cz.length') >= 1, 'на карте есть цветной вихрь');
  assert.ok(g.ev('G.stage.cz.every(z => G.stage.hz.every(h => Math.hypot(h.x - z.x, h.y - z.y) >= HZ_R * 3 - 1e-9))'), 'вихрь не налезает на горячую');
  const r = g.ev(`(() => { const S = G.stage; const z = S.cz.find(q => S.hzK(q) > .5) || S.cz[0]; z.t = Math.max(z.t, HZ_IN); z.L = 999; S.cz = [z]; S.czCd = 999; // одна область — мерить долю у неё
    let n = 0, nZ = 0;
    for (let i = 0; i < 60 * 20; i++) { update(1 / 60); if (i < 60 * 8 || i % 30) continue;
      const gl = S.p.filter(o => !o.dead && o.sp === 'g' && !(o.fade >= 0)); n += gl.length; nZ += S.cz.length ? gl.filter(o => S.cz.some(q => Math.hypot(o.x - q.x, o.y - q.y) < q.r)).length : 0; }
    const zA = Math.PI * HZ_R ** 2, wA = Math.PI * S.wr() ** 2;
    return { share: nZ / n, area: zA / wA, n }; })()`);
  assert.ok(r.n > 0 && r.share > r.area * 2, `в вихре ${Math.round(r.share * 100)} % глюонов при ${Math.round(r.area * 100)} % площади`);
  g.ev(`Uni.off(G.stage, 'g') || G.stage.uniOff.add('g')`); g.step(2);
  assert.equal(g.ev('G.stage.cz.length'), 0, 'закон выключен — вихрей нет');
});

for (const key of ['nuclei', 'atoms']) test(`мир без края: ${key} — за краем кадра уже Вселенная: сдвинул карту — в кадре не пусто`, () => {
  const g = toStage(key);
  g.step(60 * 10);
  const arr = key === 'nuclei' ? 'o' : 'ions', want = key === 'nuclei' ? 'popWant(N_DENS, N_CAP)' : 'popWant(A_DENS, A_CAP)';
  // за краем — та же плотность, что в кадре
  const r = g.ev(`(() => { const [hw, hh] = halfView(), m = haloM(); let a = 0, b = 0;
    for (const o of G.stage.${arr}) { if (o.dead) continue; if (inView(o.x, o.y)) a++; else if (inView(o.x, o.y, m)) b++; }
    const Aa = 4 * hw * hh, Ab = 4 * (hw + m) * (hh + m) - Aa; return { din: a / Aa, dout: b / Ab }; })()`);
  assert.ok(r.dout > r.din * .5, `плотность за краем ${r.dout.toFixed(3)} против ${r.din.toFixed(3)} в кадре`);
  // сдвиг карты на полкадра за полсекунды
  g.ev(`keys.add('KeyD')`); g.step(30); g.ev(`keys.delete('KeyD')`);
  const have = g.ev(`G.stage.${arr}.filter(o => !o.dead && inView(o.x, o.y)).length`), need = g.ev(want);
  assert.ok(have >= need * .6, `в кадре ${have} из ${need}`);
});
