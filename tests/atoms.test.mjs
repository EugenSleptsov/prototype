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

test('атомы: каскад — фотон линии осаживает такой же возбуждённый атом', () => {
  const g = atoms();
  g.ev(ionAt('__a', 1, 0, 1)); g.ev(ionAt('__b', 1, 3, 1));
  g.ev(`__a.ex = __b.ex = 1; __a.exT = __b.exT = 3; __a.by = __b.by = 'hand'; G.stage.relax(__a, 'hand');
    const p = G.stage.ph.find(p => p.res === 1); p.x = __a.x + .5; p.y = __a.y; p.vx = 14; p.vy = 0;`);
  g.step(20);
  assert.equal(g.ev('__b.ex'), 0);
  assert.equal(g.ev('G.stage.st.cascade'), 1);
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
