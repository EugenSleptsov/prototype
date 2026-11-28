// «Адроны» — главы 10–15, как эпоха 1 «Частиц» (просьба игрока: уровень пролетал за минуту и ничему не учил):
// одна мысль на главу, лента без паузы, новое понятие — стоп-кадр. До «Холода» плазма горячая и держит всё,
// антикварки приходят в «Антицвете», нуклон-шар и приток — с «Холода», закон — в «Законе», экзамен — 15.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function hadrons(storage) {
  const g = loadGame({ seed: 3, storage });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Cine.tick(99)');
  g.step(60 * 3);
  return g;
}
const html = g => g.ev(`document.getElementById('cinein').innerHTML`);
// лента главы ch — в показе или в очереди
const ribbon = (g, ch) => g.ev(`[document.getElementById('cinein').innerHTML, ...Cine.q.map(x => x.html)].find(h => h.includes('Глава ${ch}')) || ''`);
// нуклон рогаткой: p — ● ● ◆, n — ● ◆ ◆
const nuc = (g, k) => g.ev(`(() => { const S = G.stage, o = S.mk(${JSON.stringify(k === 'p' ? ['u', 'u', 'd'] : ['u', 'd', 'd'])}.map((fl, col) => ({ col, fl, anti: false })), S.C.x, S.C.y); o.age = 9; o.byHand = o.mine = true; S.nucleon(o, 'hand'); })()`);

test('главы «Адронов»: 10 «Цвет» — плазма горячая: не остывает, держит и цветное у края, антикварков нет, шар и лавка — позже', () => {
  const g = hadrons();
  assert.equal(g.ev('G.stage.chap'), 10);
  assert.match(ribbon(g, 10), /Цвет/);
  assert.equal(g.ev('G.stage.o.filter(o => o.kind === "aq").length'), 0, 'антикварков ещё нет');
  assert.equal(g.ev('G.stage.cool'), 0, 'не остывает');
  // цветное, брошенное за край, плазма возвращает: ничего не вымерзает
  g.ev(`(() => { const S = G.stage; globalThis.__q = S.mk([{ col: 0, fl: 'u', anti: false }], S.C.x + Q_R0 + 1, S.C.y); __q.age = 9; })()`);
  g.step(60 * 5);
  assert.equal(g.ev('__q.dead'), false); assert.equal(g.ev('G.stage.st.frozen'), 0);
  assert.ok(g.ev('Math.hypot(__q.x - G.stage.C.x, __q.y - G.stage.C.y)') < g.ev('Q_R0'), 'вернулся в плазму');
  nuc(g, 'p');
  assert.ok(!g.ev('G.stage.bodies().some(o => o.kind === "p")'), 'нуклон — шар только с «Холода»');
  assert.equal(g.ev('G.stage.shopItems().length'), 0, 'лавка пуста');
  assert.match(g.ev('JSON.stringify(G.stage.steps()[0])'), /"p":\[1,3\]/);
  assert.equal(g.ev('G.stage.stuck()'), false);
});

test('главы «Адронов»: по шагам 10 → 15 — у каждой своя лента и своё понятие', () => {
  const g = hadrons();
  nuc(g, 'p'); nuc(g, 'n'); nuc(g, 'p'); g.step(2);
  // 11 «Аромат»: p⁺ и n⁰ до главы не в счёт — нужны новые, уже зная формы
  assert.equal(g.ev('G.stage.chap'), 11); assert.match(ribbon(g, 11), /Аромат/);
  assert.equal(g.ev('G.stage.steps()[1].d'), false);
  nuc(g, 'p'); g.step(2); assert.equal(g.ev('G.stage.chap'), 11);
  nuc(g, 'n'); g.step(2);
  // 12 «Антицвет»: антикварки пришли, стоп-кадр «Антикварк» ждёт в очереди
  assert.equal(g.ev('G.stage.chap'), 12); assert.match(ribbon(g, 12), /Антицвет/);
  assert.equal(g.ev('G.stage.o.filter(o => o.kind === "aq").length'), g.ev('ANTI_N'));
  assert.ok(g.ev('G.stage.spq.some(s => s.t === "Антикварк")'));
  assert.equal(g.ev('G.stage.cool'), 0, 'ещё горячо');
  g.ev('G.stage.st.mesons = MESON_N'); g.step(2);
  // 13 «Холод»: плазма остывает, шар берётся, приток — в лавке, закона ещё нет
  assert.equal(g.ev('G.stage.chap'), 13); assert.match(ribbon(g, 13), /Холод/);
  g.step(60);
  assert.ok(g.ev('G.stage.cool') > .9, 'остывает');
  assert.ok(g.ev('G.stage.bodies().some(o => o.kind === "p" || o.kind === "n")'), 'нуклон — шар');
  assert.equal(g.ev('G.stage.shopItems().map(x => x.k).join()'), 'gen');
  g.ev('G.stage.st.cueQ = 1'); g.step(2);
  // 14 «Закон»: «Конфайнмент» в лавке
  assert.equal(g.ev('G.stage.chap'), 14); assert.match(ribbon(g, 14), /Закон/);
  assert.ok(g.ev('G.stage.shopItems().some(x => x.k === "conf")'));
  g.ev(`(() => { const S = G.stage; S.kn += 100; S.buy(S.shopItems().findIndex(x => x.k === 'conf')); })()`); g.step(2);
  // 15 — экзамен; шапка задания — номер главы
  assert.equal(g.ev('G.stage.chap'), 15); assert.match(ribbon(g, 15), /Вещество для ядер/);
  const kick = g.ev(`(() => { let k = ''; const f = hudTask; hudTask = (a, tk, kicker, ...r) => { k = kicker; }; G.stage.overlay(1); hudTask = f; return k; })()`);
  assert.equal(kick, 'УРОВЕНЬ 2 · ГЛАВА 15');
  assert.ok(!g.ev('G.stage.starPool().some(s => /быстрее/.test(s.t))'), 'норматива нет');
});

test('главы «Адронов»: шар — шаг «Холода»: нуклоном рогаткой по цветному; знакомая глава — короткая лента', () => {
  const g = hadrons();
  g.ev('G.stage.chap = CH_COLD');
  g.ev(`(() => { const S = G.stage; S.o = []; globalThis.__n = S.mk([{ col: 0, fl: 'u', anti: false }, { col: 1, fl: 'u', anti: false }, { col: 2, fl: 'd', anti: false }], S.C.x - 2, S.C.y); __n.age = 9; __n.vx = __n.vy = 0;
    globalThis.__q = S.mk([{ col: 0, fl: 'u', anti: false }], S.C.x, S.C.y); __q.age = 9; __q.vx = __q.vy = 0; S.launch(__n, 8, 0); })()`);
  g.step(30);
  assert.equal(g.ev('G.stage.st.cueQ'), 1);
  const g2 = hadrons({ 'proto.known': JSON.stringify(['gest:school', 'chap:10']) });
  assert.equal(g2.ev('Cine.q.concat(Cine.on ? [{ dur: Cine.dur, html: document.getElementById("cinein").innerHTML }] : []).find(x => x.html.includes("Глава 10")).dur'), g2.ev('CH_T_KNOWN'));
});

test('главы «Адронов»: новое понятие — стоп-кадр: первая пара рогаткой — «Пара — ещё не белое», когда руки свободны', () => {
  const g = hadrons();
  g.ev(`(() => { const S = G.stage; S.o = []; globalThis.__a = S.mk([{ col: 0, fl: 'u', anti: false }], S.C.x - 2, S.C.y); __a.age = 9;
    globalThis.__b = S.mk([{ col: 1, fl: 'u', anti: false }], S.C.x, S.C.y); __b.age = 9; __b.vx = __b.vy = 0; S.launch(__a, 8, 0); })()`);
  g.ev('Cine.clear(); Cine.tick(99)');
  g.step(20);
  assert.equal(g.ev('Spot.on'), true); assert.equal(g.ev('Spot.txt'), 'Пара — ещё не белое');
  assert.equal(g.ev(`Known.has('spot:Пара — ещё не белое')`), true, 'раз за игру');
});
