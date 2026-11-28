// Экран снова решал игру (REVIEW_NEON_4 тема Б, урок 47): волна «Частиц», γ «Ядер», приток тяжёлых «Молекул» — от зума;
// зона «Атомов» поворачивалась вместе с телефоном и растворялась, когда карта уезжала; «Звёзды» схлопывали облако в
// центре газа всего мира. Теперь всё это — по кадру-эталону (масштаб этапа без зума) и по месту, где ты играешь.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function to(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Spot.clear()');
  g.step(240);
  return g;
}
const zoom = (g, z) => g.ev(`G.zoom = ${z}; for (let i = 0; i < 240; i++) cam.z += (zoomFor(G.stage) - cam.z) * .1; cam.z`);

test('«Атомы»: поворот телефона не поворачивает зону счёта — доля та же', () => {
  const g = to('atoms');
  // нейтральные в центре; голые — справа, внутри широкой зоны (W > H), но за краем узкой
  g.ev(`(() => { const S = G.stage; for (const i of S.ions) i.dead = true; S.ions = []; S.el = []; S.ph = []; S.phT = -1e9; S.tide = () => {};
    const n = Math.ceil(S.zFloor()) + 2;
    for (let k = 0; k < n; k++) { const i = S.ion(1, S.zc.x + (k % 8) * .3, S.zc.y + Math.floor(k / 8) * .3, 1); i.vx = i.vy = 0; i.ne = 1; S.ions.push(i); }
    for (let k = 0; k < 6; k++) { const i = S.ion(1, S.zc.x + S.zh[0] * .9, S.zc.y + k * .3, 1); i.vx = i.vy = 0; i.ne = 0; S.ions.push(i); } })()`);
  assert.ok(g.ev('G.W > G.H'), 'кадр широкий');
  const n0 = g.ev('G.stage.neutral()');
  assert.ok(n0 < 1, 'голые справа в счёте');
  g.ev('const w = G.W; G.W = G.H; G.H = w'); // повернул телефон
  assert.equal(g.ev('G.stage.neutral()'), n0, 'раньше зона поворачивалась — голые выпадали, доля прыгала');
});

test('«Атомы»: увёл карту далеко и вернулся — туманность, где считается доля, на месте', () => {
  const g = to('atoms');
  const n0 = g.ev('G.stage.neutral()'), k0 = g.ev('G.stage.ions.filter(i => G.stage.counted(i)).length');
  assert.ok(k0 > 5);
  g.ev('P.x += viewRadius() * 10; cam.x = P.x'); g.step(120);
  assert.equal(g.ev('G.stage.ions.filter(i => G.stage.counted(i)).length'), k0, 'не растворилась');
  g.ev('P.x = G.stage.zc.x; cam.x = P.x'); g.step(1);
  assert.ok(Math.abs(g.ev('G.stage.neutral()') - n0) < .05, 'доля та же (раньше — 0 % и после возврата)');
});

test('«Частицы»: волна антивещества рождается не ближе кадра-эталона — приблизил, а до щита столько же', () => {
  const g = to('particles');
  zoom(g, g.ev('ZOOM_MAX'));
  assert.ok(g.ev('viewRadius() < refRadius() * .6'), 'приблизил');
  g.ev('G.stage.wave = { n: 1, cd: 0, dir: 0, cur: null, edu: false }; G.stage.tickWave(1 / 60)');
  const d = g.ev('Math.min(...G.stage.wave.cur.list.map(o => Math.hypot(o.x - P.x, o.y - P.y)))'), want = g.ev('Math.min(refRadius(), G.stage.wr() - .3)');
  assert.ok(d >= want - 1e-6, `волна в ${d.toFixed(1)} — нужно не ближе ${want.toFixed(1)}`);
});

test('«Ядра»: γ приходят из-за края кадра-эталона при любом зуме', () => {
  const g = to('nuclei');
  for (const z of [g.ev('ZOOM_MIN'), 1, g.ev('ZOOM_MAX')]) {
    zoom(g, z);
    g.ev('G.stage.g = []; G.stage.gT = 1.5'); g.step(1);
    const ds = g.ev('G.stage.g.map(q => Math.hypot(q.x - P.x, q.y - P.y))'), R = g.ev('refRadius() * 1.05');
    assert.ok(ds.length > 0);
    for (const d of ds) assert.ok(Math.abs(d - R) < 1, `зум ${z}: γ в ${d.toFixed(1)}, эталон ${R.toFixed(1)}`);
  }
});

test('«Молекулы»: тяжёлый атом притока — у края кадра-эталона, где его видят needEl и «Синтез»', () => {
  const g = to('molecules');
  zoom(g, g.ev('ZOOM_MIN'));
  assert.ok(g.ev('viewRadius() > refRadius() * 1.4'), 'отдалил');
  g.ev(`(() => { const S = G.stage; S.needEl = () => 'C'; S.dripT = 0; S.tide(1 / 60); })()`);
  const m = 'G.stage.m.filter(m => m.gift === G.stage.t)';
  assert.equal(g.ev(`${m}.length`), 1);
  assert.equal(g.ev(`${m}.every(m => inRef(m.x, m.y, 20))`), true, 'needEl его видит — следующий не позовёт');
});

test('«Звёзды»: облако схлопывается само там, где ты собираешь, а не в центре газа всего мира', () => {
  const g = to('stars');
  // далеко за кадром — большое облако чужого газа: центр всего газа мира уехал к нему
  g.ev(`(() => { const S = G.stage; for (let i = 0; i < 300; i++) S.gas.push(S.puff(cam.x + 200 + Math.random(), cam.y + Math.random(), 0, 0, 0)); })()`);
  g.ev(`globalThis.__ig = null; G.stage.ignite = (x, y) => { __ig = [x, y]; }; G.stage.gasAt = 0; G.stage.clock = ST_AUTO + 1; G.stage.tickGas(1 / 60, true)`);
  const at = g.ev('__ig');
  assert.ok(at, 'схлопнулось');
  assert.ok(g.ev(`Math.hypot(${at[0]} - cam.x, ${at[1]} - cam.y) < refRadius()`), `звезда в ${JSON.stringify(at)} — далеко от камеры`);
});
