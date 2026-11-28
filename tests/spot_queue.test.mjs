// Стоп-кадры — одной очередью в ядре (REVIEW_NEON_4, тема А). Тесты шагают play(): как в игре, ленты (Cine) и стоп-кадр
// (Spot) тикают и держат мир — step() их не видит, поэтому прошлые поломки тестами не ловились.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function started() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev('Cine.clear(); Spot.clear()');
  return g;
}
const until = (g, js, n = 60 * 20) => { for (let i = 0; i < n; i++) { if (g.ev(js)) return true; g.play(1); } return false; };

test('стоп-кадр под лентой без паузы не встаёт и мир не держит; лента сошла — показан', () => {
  const g = started();
  g.ev('Cine.show("лента", 2, 0, true); Spot.show({ x: P.x, y: P.y }, "Понятие А", "объяснение")');
  const T0 = g.ev('G.T');
  g.play(60);
  assert.equal(g.ev('Spot.on'), false, 'под лентой — в очереди');
  assert.ok(g.ev('G.T') - T0 > .9, 'мир идёт, пока идёт лента (раньше стоял невидимый стоп-кадр)');
  assert.equal(g.ev(`Known.has('spot:Понятие А')`), false, 'не показан — не «знаком»');
  g.play(70);
  assert.equal(g.ev('Spot.on && Spot.txt'), 'Понятие А');
  const T1 = g.ev('G.T'); g.play(30);
  assert.equal(g.ev('G.T'), T1, 'показан — время стоит');
});

test('стоп-кадр не встаёт посреди зажатия — ждёт, пока отпустишь', () => {
  const g = started();
  g.ev('mouse.down = true; Spot.show({ x: P.x, y: P.y }, "Понятие Б", "")'); g.play(20);
  assert.equal(g.ev('Spot.on'), false);
  g.ev('mouse.down = false'); g.play(1);
  assert.equal(g.ev('Spot.on && Spot.txt'), 'Понятие Б');
});

test('лента пришла поверх показанного стоп-кадра — он возвращается в очередь и показывается после неё', () => {
  const g = started();
  g.ev('Spot.show({ x: P.x, y: P.y }, "Понятие В", "", 5)'); g.play(1);
  assert.equal(g.ev('Spot.on'), true);
  g.ev('Cine.show("лента", 1, 0, true)'); g.play(1);
  assert.equal(g.ev('Spot.on'), false); assert.equal(g.ev('Spot.q.length'), 1);
  assert.ok(until(g, 'Spot.on'), 'после ленты — снова'); assert.equal(g.ev('Spot.txt'), 'Понятие В');
});

test('цель погибла или уровень сменился — стоп-кадр из очереди снят', () => {
  const g = started();
  g.ev('globalThis.__o = { x: P.x, y: P.y }; mouse.down = true; Spot.show(__o, "Понятие Г", ""); Spot.show({ x: 0, y: 0 }, "Понятие Д", "")');
  g.ev('__o.dead = true; advance(); G.trans = 99; mouse.down = false'); g.play(2);
  assert.equal(g.ev('Spot.q.length'), 0); assert.equal(g.ev('Spot.on'), false);
});

test('«Адроны»: стоп-кадр «Антикварк» больше не сгорает под лентой главы 12 — показан, когда она сошла', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Spot.clear()'); g.step(60 * 3);
  // главы 10–11 — нуклоны рогаткой (как в hadrons_chapters.test), лента главы 12 идёт как в игре
  const nuc = k => g.ev(`(() => { const S = G.stage, o = S.mk(${JSON.stringify(k === 'p' ? ['u', 'u', 'd'] : ['u', 'd', 'd'])}.map((fl, col) => ({ col, fl, anti: false })), S.C.x, S.C.y); o.age = 9; o.byHand = o.mine = true; S.nucleon(o, 'hand'); })()`);
  nuc('p'); nuc('n'); nuc('p'); g.step(2); nuc('p'); g.step(2); nuc('n'); g.ev('Cine.clear(); Spot.clear()'); g.play(2);
  assert.equal(g.ev('G.stage.chap'), 12); assert.equal(g.ev('Cine.on'), true);
  assert.ok(until(g, 'Spot.on', 60 * 12), 'показан'); assert.equal(g.ev('Spot.txt'), 'Антикварк');
  assert.equal(g.ev('Cine.on'), false, 'уже после ленты');
});

test('смена уровня снимает ленты без паузы прошлого уровня: главы «Адронов» не идут поверх «Ядер»', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Cine.show("<b>Глава 14</b>", 6.5, 0, true); Cine.show("<b>Глава 15</b>", 6.5, 0, true); Cine.show("пауза-открытие", 6)');
  g.ev('advance()');
  assert.equal(g.ev('G.stage.key'), 'nuclei');
  const all = g.ev(`[Cine.on ? document.getElementById('cinein').innerHTML : '', ...Cine.q.map(x => x.html)].join('|')`);
  assert.doesNotMatch(all, /Глава 1[45]/); assert.match(all, /пауза-открытие/, 'открытие (пауза) досматривается');
});

test('«Атомы»: стоп-кадр остывания не встаёт посреди натянутой рогатки — после броска', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Cine.tick(99); Spot.clear()'); g.step(120);
  g.ev('mouse.down = true; G.stage.clock = A_LATE + .1'); g.play(3);
  assert.ok(g.ev('G.stage.coolAt') !== null, 'часы пошли');
  assert.equal(g.ev('Spot.on'), false, 'зажато — стоп-кадр ждёт');
  g.ev('mouse.down = false'); g.play(2);
  assert.equal(g.ev('Spot.on && Spot.txt'), 'Туманность остывает');
});

test('«Звёзды»: стоп-кадр ждёт, пока камера доедет (после нового облака мир сжат, камера едет с недр)', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'stars') g.ev('advance(); G.trans = 99');
  g.step(240);
  assert.equal(g.ev('G.stage.spotOk()'), true);
  g.ev('cam.z = zoomFor(G.stage) * 2.8');
  assert.equal(g.ev('G.stage.spotOk()'), false);
});

test('«Частицы»: «Щит и ядро» объясняется и тому, кто уже зажал по ленте главы 9; вершина распада — только золотая', () => {
  const g = started();
  const ex = js => g.ev(`(() => { const S = G.stage; Spot.clear(); Cine.clear(); ${js}; S.tickExplain(1 / 60); return Spot.on ? Spot.txt : null; })()`);
  assert.equal(ex('S.ep = 3; S.chap = 9; S.epDone = false; S.learn.shield = true'), 'Щит и ядро');
  // эпоха 3: распад того, что уже не нужно снимать (не золотой) — не объясняется
  g.ev('globalThis.__w = G.stage.wanted');
  assert.equal(ex(`S.ep = 2; S.chap = 8; S.tracks = []; S.wanted = () => false; const b = S.mk('b', false, P.x + 1, P.y, 0, 1); S.event([S.mk('c', false, P.x + 1, P.y, 0, 1)], P.x + 1, P.y, b)`), null);
  assert.equal(ex(`S.wanted = __w; S.tracks = []; const b = S.mk('b', false, P.x + 1, P.y, 0, 1); S.event([S.mk('c', false, P.x + 1, P.y, 0, 1)], P.x + 1, P.y, b)`), 'Вершина распада');
});
