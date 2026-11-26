// «Звёзды»: масса комка — выбор игрока (отпустить в золотой полосе; легче — давление разносит, тяжелее — свет сдувает газ),
// масса звезды меняет недра (жар, барьер, срок жизни); гелий облака — твоя Y с «Ядер».
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
// в точке кадра (экран 400, 300) — ровно n облачков газа, остальной газ кадра убран; курсор — там же
const lump = n => `(() => { const S = G.stage; S.gas = S.gas.filter(q => !inView(q.x, q.y, 3)); const [wx, wy] = S2W(400, 300);
  for (let i = 0; i < ${n}; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 1.2; S.gas.push(S.puff(wx + Math.cos(a) * d, wy + Math.sin(a) * d, 0, 0, 1)); }
  S.gasTide = () => {}; mouse.x = 400; mouse.y = 300; mouse.has = true; return [wx, wy]; })()`;
const nearAt = ([x, y]) => `G.stage.gas.filter(q => Math.hypot(q.x - ${x}, q.y - ${y}) < ST_NEAR).length`;

test('звёзды: отпустил в золотой полосе — звезда массы комка', () => {
  const g = toStage('stars');
  const n = g.ev('Math.round((G.stage.lo + G.stage.hi) / 2)');
  g.ev(lump(n));
  g.ev('mouse.down = true; update(1 / 60)');
  assert.equal(g.ev('G.stage.near'), n, 'весы видят весь комок');
  assert.equal(g.ev('G.stage.phase'), 'gas', 'пока держишь — не зажигается');
  g.ev('mouse.down = false; update(1 / 60)');
  assert.equal(g.ev('G.stage.phase'), 'core');
  const mu = g.ev('G.stage.mu');
  assert.ok(Math.abs(mu - .5) < .05, `mu ${mu}`);
  assert.equal(g.ev('G.stage.Ms'), g.ev(`G.stage.massOf(${mu})`));
  assert.ok(g.ev('G.stage.Ms') > 20 && g.ev('G.stage.Ms') < 40);
});

test('звёзды: легче полосы — комок не зажигается и расплывается сам (тепловое давление)', () => {
  const g = toStage('stars');
  const n = g.ev('G.stage.lo - 8'), at = g.ev(lump(n));
  g.ev('mouse.down = true; update(1 / 60); mouse.down = false; update(1 / 60)');
  assert.equal(g.ev('G.stage.phase'), 'gas');
  assert.ok(g.ev(`G.stage.floats.some(f => /мало массы/.test(f.txt))`));
  g.step(120);
  const left = g.ev(nearAt(at));
  assert.ok(left < n * .5, `за 2 с в комке осталось ${left} из ${n}`);
});

test('звёзды: перебор — свет протозвезды сдувает газ, звезды нет', () => {
  const g = toStage('stars');
  const n = g.ev('G.stage.hi + 15'), at = g.ev(lump(n));
  g.ev('mouse.down = true'); g.step(60);
  assert.ok(g.ev('G.stage.st.blow') >= 1, 'сдуло');
  assert.equal(g.ev('G.stage.phase'), 'gas');
  assert.ok(g.ev(nearAt(at)) < g.ev('G.stage.lo'), 'в комке меньше полосы');
  g.ev('mouse.down = false; update(1 / 60)');
  assert.equal(g.ev('G.stage.phase'), 'gas', 'отпустил после перебора — не зажглась');
});

test('звёзды: лёгкая живёт дольше, но недра прохладнее; тяжёлая — горячая и короткая', () => {
  const a = '{ Z: 2, N: 2 }', c = '{ Z: 6, N: 6 }';
  const star = mu => { const g = toStage('stars'); g.ev(`G.stage.ignite(P.x, P.y, ${mu})`); return g; };
  const L = star(0), H = star(1);
  for (const [k, cmp] of [['life', 1], [`vBar(${a}, ${a})`, 1], [`vBar(${c}, ${a})`, 1], ['hBurn', 1]]) {
    const l = L.ev(`G.stage.${k}`), h = H.ev(`G.stage.${k}`);
    assert.ok((l - h) * cmp > 0, `${k}: лёгкая ${l}, тяжёлая ${h}`);
  }
  assert.ok(L.ev(`G.stage.vMax(${a}, ${a}) - G.stage.vBar(${a}, ${a})`) < H.ev(`G.stage.vMax(${a}, ${a}) - G.stage.vBar(${a}, ${a})`), 'окно слияния у лёгкой уже');
  assert.ok(L.ev(`G.stage.vMax(${c}, ${a})`) > L.ev(`G.stage.vBar(${c}, ${a})`), 'кислород у лёгкой труден, но возможен');
  assert.ok(L.ev(`G.stage.vBar(${c}, ${a})`) < L.ev('G.stage.vmax()'), '…и достижим рогаткой');
  assert.equal(L.ev('G.stage.Ms'), 8); assert.equal(H.ev('G.stage.Ms'), 100);
  // догорела — сверхновая без бонуса уровня
  H.ev('G.stage.clock = G.stage.ignAt + G.stage.life + .1; update(1 / 60)');
  assert.notEqual(H.ev('G.stage.doneAt'), null);
  assert.equal(H.ev('G.stage.failed'), true);
});

test('звёзды: не зажёг — облако схлопнулось само лёгкой звездой (позже прежнего)', () => {
  const g = toStage('stars');
  g.ev('G.stage.clock = ST_AUTO - 1'); g.step(30);
  assert.equal(g.ev('G.stage.phase'), 'gas');
  g.step(60);
  assert.equal(g.ev('G.stage.phase'), 'core');
  assert.equal(g.ev('G.stage.mu'), 0); assert.equal(g.ev('G.stage.Ms'), 8);
});

test('звёзды: подсказка «зажать и вести» гаснет по нажатиям, а не сама', () => {
  const g = toStage('stars');
  g.step(60);
  assert.ok(!(g.ev(`Tips.d['stars:gas']`) > 0), 'без нажатия — подсказка жива');
  for (let i = 0; i < 2; i++) { g.ev('mouse.x = 400; mouse.y = 300; mouse.has = true; mouse.down = true'); g.step(5); g.ev('mouse.down = false'); g.step(5); }
  assert.equal(g.ev(`Tips.d['stars:gas']`), 2);
});

test('звёзды: гелий облака — Y игрока с «Ядер», литий виден отдельно; с нуля — 25 %', () => {
  const g = toStage('nuclei');
  g.ev(`G.stage.Y = () => .4; const li = G.stage.mk(3, 4, P.x + 1, P.y); li.age = 1; G.stage.doneAt = 0; advance()`);
  assert.equal(g.ev('G.stage.key'), 'stars');
  assert.equal(g.ev('G.stage.heP'), .4); assert.equal(g.ev('G.stage.Yin'), .4);
  const share = g.ev('(() => { let n = 0; for (let i = 0; i < 4000; i++) n += +G.stage.puff(0, 0, 0, 0, 0).he; return n / 4000; })()');
  assert.ok(Math.abs(share - .4) < .03, `доля He ${share}`);
  assert.ok(g.ev('G.stage.gas.some(q => q.li && q.he)'), 'Li — своё облачко (в недрах сгорит в гелий)');
  assert.match(g.ev('G.stage.hud().sub'), /гелий 40 % с «Ядер»/);
  g.ev('G.prev = null; G.trans = 99; update(1 / 60)');
  assert.ok(g.ev(`G.stage.floats.some(f => /гелий из «Ядер»: 40 %/.test(f.txt))`), 'итог «Ядер» показан');
  const h = loadGame({ seed: 4 });
  h.ev(`G.fromI = 3; document.getElementById('go').onclick()`);
  assert.equal(h.ev('G.stage.key'), 'stars');
  assert.equal(h.ev('G.stage.heP'), .25); assert.equal(h.ev('G.stage.Yin'), null);
});
