// «Атомы»: возбуждённая орбита (осадить следом), оболочки (гелий и K не берёт жёсткий свет), перехват УФ следом, каскад.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function atoms() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  g.step(240);
  // пустой кадр: свои ионы и электроны — только из теста; свет не летит
  g.ev(`for (const i of G.stage.ions) i.dead = true; G.stage.ions = []; G.stage.el = []; G.stage.ph = []; G.stage.phT = -1e9; G.stage.tide = () => {}`);
  return g;
}
const ionAt = (name, Z, dx = 0, ne = 0) => `globalThis.${name} = G.stage.ion(${Z}, P.x + ${dx}, P.y, 1); ${name}.vx = ${name}.vy = 0; ${name}.ne = ${ne}; G.stage.ions.push(${name})`;
const catchE = io => `G.stage.capture(${io}, { by: 'hand' })`;

test('атомы: пойманный электрон — на возбуждённой орбите; атом засчитан, когда след его осадит', () => {
  const g = atoms();
  g.ev(ionAt('__h', 1)); g.ev(catchE('__h'));
  assert.equal(g.ev('__h.ne'), 1); assert.equal(g.ev('__h.ex'), 1);
  assert.equal(g.ev('G.stage.seenN.has(1)'), false, 'пока дрожит — ещё не атом');
  const kn = g.ev('G.stage.kn');
  // след через атом, проведённый уже после захвата
  g.ev(`__h.exAt = G.T - 1; G.stage.tr = [{ x: __h.x - 1, y: __h.y + .2, t: G.T }, { x: __h.x + 1, y: __h.y + .2, t: G.T }]; mouse.down = false; G.stage.update(1 / 60, true)`);
  assert.equal(g.ev('__h.ex'), 0);
  assert.equal(g.ev('G.stage.st.relaxed'), 1);
  assert.equal(g.ev('G.stage.seenN.has(1)'), true);
  assert.equal(g.ev('G.stage.kn') - kn, 1 + 4 + 10, 'осадил +1, атом руками +4, новый +10');
  assert.ok(g.ev(`G.stage.ph.some(p => p.res === 1)`), 'испустил фотон своей линии');
});

test('атомы: сам спрыгивает за EX_T; поймала Вселенная — ✦ в её строку', () => {
  const g = atoms();
  g.ev(`G.stage.rs.rec = 1; Uni.learn(G.stage, 'rec', '◎', 'Рекомбинация', 0)`);
  g.ev(ionAt('__h', 1)); g.ev(`G.stage.capture(__h, { by: 'auto' })`);
  const kn = g.ev('G.stage.kn');
  g.step(Math.ceil(60 * 3.4));
  assert.equal(g.ev('__h.ex'), 0);
  assert.equal(g.ev('G.stage.st.relaxed'), 0, 'это не игрок');
  assert.equal(g.ev('G.stage.kn') - kn, 2 + 10);
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'rec').kn`), 12);
});

test('атомы: жёсткий свет — гелий и закрытую K-оболочку не берёт, водород и внешние — выбивает', () => {
  const g = atoms();
  g.ev(ionAt('__he', 2, 0, 2)); g.ev(ionAt('__o', 8, 6, 2)); g.ev(ionAt('__h', 1, -6, 1)); g.ev(ionAt('__c', 6, 12, 4));
  const uv = (io, E = 20) => `G.stage.ph.push({ x: ${io}.x - .3, y: ${io}.y, vx: 13, vy: 0, t: 0, hard: true, E: ${E}, life: 3 })`;
  for (const io of ['__he', '__o', '__h', '__c']) g.ev(uv(io));
  g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('__he.ne'), 2, 'гелий держит');
  assert.equal(g.ev('__o.ne'), 2, 'K-оболочка держит');
  assert.equal(g.ev('__h.ne'), 0, 'водород выбит');
  assert.equal(g.ev('__c.ne'), 3, 'внешний электрон углерода выбит');
  assert.ok(g.ev('G.stage.st.shield') >= 1);
  // мягкий фотон основной орбите не страшен, возбуждённой — может сбить
  g.ev(`__h.ne = 1; __h.ex = 0; G.stage.ph = [{ x: __h.x - .3, y: __h.y, vx: 22, vy: 0, t: 0, hard: false, E: 2, life: 2 }]; G.stage.update(1 / 60, true)`);
  assert.equal(g.ev('__h.ne'), 1);
  g.ev(`const r = Math.random; Math.random = () => .1; __h.ex = 1; __h.exT = 3; G.stage.ph = [{ x: __h.x - .3, y: __h.y, vx: 22, vy: 0, t: 0, hard: false, E: 2, life: 2 }]; G.stage.update(1 / 60, true); Math.random = r`);
  assert.equal(g.ev('__h.ne'), 0, 'возбуждённый — сбит и видимым светом');
});

test('атомы: след поперёк луча УФ — рассеян (+1 ✦), до иона не долетает', () => {
  const g = atoms();
  g.ev(ionAt('__h', 1, 0, 1));
  g.ev(`G.stage.ph.push(globalThis.__p = { x: __h.x - 3, y: __h.y, vx: 13, vy: 0, t: 0, hard: true, E: 20, life: 3 });
    G.stage.tr = [{ x: __h.x - 2.9, y: __h.y - 1, t: G.T }, { x: __h.x - 2.9, y: __h.y + 1, t: G.T }]`);
  const kn = g.ev('G.stage.kn');
  g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('__p.hard'), false);
  assert.equal(g.ev('G.stage.st.cut'), 1);
  assert.equal(g.ev('G.stage.kn') - kn, 1);
  g.ev('G.stage.tr = []'); g.step(30);
  assert.equal(g.ev('__h.ne'), 1, 'водород цел');
});

test('атомы: каскад — фотон линии осаживает такой же возбуждённый атом и летит дальше с копией (вынужденное излучение: два фотона)', () => {
  const g = atoms();
  g.ev(ionAt('__a', 1, 0, 1)); g.ev(ionAt('__b', 1, 3, 1));
  g.ev(`__a.ex = __b.ex = 1; __a.exT = __b.exT = 3; __a.by = __b.by = 'hand'; G.stage.relax(__a, 'hand');
    const p = G.stage.ph.find(p => p.res === 1); p.x = __a.x + .5; p.y = __a.y; p.vx = 14; p.vy = 0;`);
  g.ev('globalThis.__p0 = G.stage.ph.find(p => p.res === 1)');
  g.step(20);
  assert.equal(g.ev('__b.ex'), 0);
  assert.equal(g.ev('G.stage.st.cascade'), 1);
  assert.equal(g.ev('G.stage.ph.includes(__p0) && !__p0.dead'), true, 'налетевший фотон не поглощён');
  const pair = JSON.parse(g.ev(`JSON.stringify(G.stage.ph.filter(p => p.res === 1).map(p => [p.vx, p.vy, p.hand]))`));
  assert.equal(pair.length, 2, 'от __b — два фотона линии H');
  for (const [vx, vy, hand] of pair) { assert.ok(Math.abs(vx - 14) < 1e-6 && Math.abs(vy) < 1e-6, `тот же курс: ${vx}, ${vy}`); assert.equal(hand, true); }
  // цепочку начала Вселенная (спрыгнул сам) — не твой каскад
  g.ev(`__a.ne = __b.ne = 1; __a.ex = __b.ex = 1; __a.exT = 3; __b.exT = 3; __a.by = __b.by = 'auto'; G.stage.ph = []; G.stage.relax(__a, 'self'); { const q = G.stage.ph.find(p => p.res === 1); q.x = __a.x + .5; q.y = __a.y; q.vx = 14; q.vy = 0; }`);
  g.step(20);
  assert.equal(g.ev('__b.ex'), 0, 'осадил');
  assert.equal(g.ev('G.stage.st.cascade'), 1, 'но в счёт игрока не идёт');
});

test('атомы: туман — по доле нейтральных, а не по времени', () => {
  const g = atoms();
  g.ev(ionAt('__o', 8, 0, 0));
  const fog = () => g.ev('G.stage.fog()');
  const f0 = fog();
  assert.ok(f0 > .1, 'голые ионы — мутно: ' + f0);
  g.ev('__o.ne = 8');
  assert.equal(fog(), 0, 'все нейтральны — прозрачно');
});

test('атомы: «Разлёт туманности» — после первого перечёркнутого луча, необязательный; часть УФ уходит мимо атомов (✦ — Вселенной)', () => {
  const g = atoms();
  assert.equal(g.ev(`G.stage.shopItems().some(it => it.k === 'red')`), false, 'пока не перечёркивал — нет');
  g.ev('G.stage.st.cut = 1; G.stage.kn += 100');
  assert.equal(g.ev(`G.stage.shopItems().find(it => it.k === 'red').opt`), true);
  g.ev(`G.stage.buy(G.stage.shopItems().findIndex(it => it.k === 'red'))`);
  assert.equal(g.ev('G.stage.rs.red'), 1);
  g.ev(`G.stage.ph.push(globalThis.__p = { x: P.x + 5, y: P.y + 5, vx: 13, vy: 0, t: 0, hard: true, E: 20, life: 3.4, red: .5 })`);
  g.step(40);
  assert.equal(g.ev('__p.hard'), false, 'ушёл из туманности — безвреден');
  assert.equal(g.ev('__p.esc'), true);
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'red').name`), 'Разлёт туманности');
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'red').kn`), 1);
  assert.equal(g.ev('G.stage.st.cut'), 1, 'это не перехват игрока');
});

test('атомы: зажал на ионе — держишь его: атом идёт за пальцем, но сам не тормозит и не осаживает', () => {
  const g = atoms();
  g.ev(ionAt('__c', 6, 0, 0));
  // быстрый электрон рядом с ионом
  g.ev(`G.stage.el.push({ x: __c.x + 1.5, y: __c.y, vx: 0, vy: 9, k: 1, slow: 0, brk: 0, by: null, age: 1 })`);
  g.ev(`(() => { const [x, y] = W2S(__c.x + .3, __c.y); mouse.x = x; mouse.y = y; mouse.down = true; })()`);
  g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('G.stage.hold === __c'), true, 'нажал на атом — держишь его, а не ведёшь след');
  assert.equal(g.ev('G.stage.tr.length'), 0);
  assert.equal(g.ev('G.stage.st.held'), 1);
  assert.equal(g.ev('G.stage.st.brakes'), 0, 'зажатый атом электрон не тормозит');
  // дрожащий электрон зажатого атома сам не осаживается — это делает след
  g.ev(catchE('__c'));
  for (let i = 0; i < 40; i++) g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('__c.ex'), 1, 'подержал — всё ещё дрожит');
  assert.equal(g.ev('G.stage.st.relaxed'), 0);
  // тащишь: атом идёт за пальцем
  const x0 = g.ev('__c.x');
  g.ev(`(() => { const [x, y] = W2S(__c.x + 3, __c.y); mouse.x = x; mouse.y = y; })()`);
  for (let i = 0; i < 60; i++) g.ev('G.stage.update(1 / 60, true)');
  assert.ok(g.ev('__c.x') - x0 > 2, `атом протащен: ${g.ev('__c.x') - x0}`);
  assert.equal(g.ev('G.stage.st.best'), 0, '«один росчерк — 3 электрона» — только следом');
  g.ev('mouse.down = false; G.stage.update(1 / 60, true)');
  assert.equal(g.ev('G.stage.hold'), null, 'отпустил');
});

test('атомы: зажатый голый ион сквозь быстрые электроны — не ловит их; заторможенный следом рядом — садится', () => {
  const g = atoms();
  g.ev(ionAt('__c', 8, 0, 0));
  // строй быстрых электронов навстречу иону
  g.ev(`for (let i = 1; i <= 6; i++) G.stage.el.push({ x: __c.x + 1.5 * i, y: __c.y + (i % 2 ? .2 : -.2), vx: -9, vy: 0, k: 1, slow: 0, brk: 0, by: null, age: 1 })`);
  g.ev(`(() => { const [x, y] = W2S(__c.x + .2, __c.y); mouse.x = x; mouse.y = y; mouse.down = true; })()`);
  g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('G.stage.hold === __c'), true);
  // тащишь сквозь строй
  let dmin = 99;
  for (let i = 0; i < 90; i++) {
    g.ev(`(() => { const [x, y] = W2S(P.x + ${(i / 90 * 7).toFixed(3)}, P.y); mouse.x = x; mouse.y = y; })()`);
    g.ev('G.stage.update(1 / 60, true)');
    dmin = Math.min(dmin, g.ev('Math.min(...G.stage.el.filter(e => !e.dead).map(e => Math.hypot(e.x - __c.x, e.y - __c.y)), 99)'));
  }
  assert.ok(dmin < 1, 'электроны прошли сквозь ион: ' + dmin);
  assert.ok(g.ev('__c.x - P.x') > 4, 'атом прошёл сквозь строй: ' + g.ev('__c.x - P.x'));
  assert.equal(g.ev('__c.ne'), 0, 'быстрые не садятся на протащенный ион');
  assert.equal(g.ev('G.stage.st.brakes'), 0, 'и не тормозят');
  assert.equal(g.ev('G.stage.el.filter(e => !e.dead && e.slow > 0).length'), 0);
  // заторможенный следом электрон рядом с зажатым ионом — садится на него, засчитан как твой
  g.ev('G.stage.el = []');
  g.ev(`G.stage.el.push(globalThis.__e = { x: __c.x + 1.6, y: __c.y, vx: 3, vy: 0, k: 1, slow: 0, brk: 0, by: null, age: 1 }); G.stage.brake(__e, 'hand')`);
  g.ev(`(() => { const [x, y] = W2S(__c.x, __c.y); mouse.x = x; mouse.y = y; })()`);
  for (let i = 0; i < 120 && g.ev('__c.ne') === 0; i++) g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('__c.ne'), 1, 'заторможенный сел на зажатый ион');
  assert.equal(g.ev('G.stage.caps.hand'), 1, 'электрон — твой (тормозил след)');
  assert.equal(g.ev('G.stage.st.best'), 0, 'торможение вызовом — не росчерк');
});

test('атомы: нажал мимо атомов — обычный след', () => {
  const g = atoms();
  g.ev(ionAt('__c', 6, 0, 0));
  g.ev(`(() => { const [x, y] = W2S(__c.x + 3, __c.y); mouse.x = x; mouse.y = y; mouse.down = true; })()`);
  g.ev('G.stage.update(1 / 60, true)');
  assert.equal(g.ev('G.stage.hold'), null);
  assert.equal(g.ev('G.stage.tr.length'), 1);
});
