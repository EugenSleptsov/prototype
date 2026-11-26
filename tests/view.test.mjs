// Зум и сдвиг кадра меняют только то, что видно: счётчики целей, доход и размер мира меряются по кадру-эталону
// (масштаб этапа без зума игрока), а не по экрану.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const zoomTo = (g, z) => { g.ev(`G.zoom = ${z}`); g.step(240); return g.ev('cam.z'); };

test('кадр: мир частиц и кадр-эталон не зависят от зума', () => {
  const g = loadGame({ seed: 4 });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light);
  const z1 = zoomTo(g, 1), r1 = g.ev('refRadius()'), w1 = g.ev('G.stage.wr()'), n1 = g.ev('G.stage.nQ()');
  const z2 = zoomTo(g, g.ev('ZOOM_MIN'));
  assert.ok(z2 < z1 * .7, `зум отъехал: ${z1.toFixed(1)} → ${z2.toFixed(1)}`);
  assert.ok(g.ev('viewRadius()') > r1 * 1.4, 'на экране видно больше');
  assert.ok(Math.abs(g.ev('refRadius()') - r1) < 1e-9, 'а кадр-эталон тот же');
  assert.equal(g.ev('G.stage.wr()'), w1, 'мир не растёт');
  assert.equal(g.ev('G.stage.nQ()'), n1, 'квантов Вселенная держит столько же');
});

test('кадр: вспышка e⁺e⁻ за экраном тоже даёт ⚡', () => {
  const g = loadGame({ seed: 4 });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  g.ev('G.stage.en = 0');
  g.ev('G.stage.eFlash(P.x + 400, P.y)');
  assert.equal(g.ev('G.stage.en'), 1, 'далеко за кадром — та же +1 ⚡');
});

test('кадр: доля нейтральных атомов не меняется от зума', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  g.step(240);
  // свои ионы: нейтральные в центре, голые — у края кадра-эталона и за ним
  g.ev(`(() => { const S = G.stage; for (const i of S.ions) i.dead = true; S.ions = []; S.el = []; S.ph = []; S.phT = -1e9; S.tide = () => {};
    const [hw] = halfView(refZ());
    const n = Math.ceil(S.zFloor()) + 2; // кадр не пуст: иначе недостающие ионы считаются голыми
    for (let k = 0; k < n; k++) { const i = S.ion(1, P.x + (k % 8) * .3, P.y + Math.floor(k / 8) * .3, 1); i.vx = i.vy = 0; i.ne = 1; S.ions.push(i); }
    for (let k = 0; k < 6; k++) { const i = S.ion(1, P.x + hw * 1.6 + k * .3, P.y, 1); i.vx = i.vy = 0; i.ne = 0; S.ions.push(i); } })()`);
  const at = z => { g.ev(`G.zoom = ${z}`); g.ev('for (let i = 0; i < 240; i++) { cam.z += (zoomFor(G.stage) - cam.z) * .1; }'); return g.ev('G.stage.neutral()'); };
  const n1 = at(1), n2 = at(g.ev('ZOOM_MIN')), n3 = at(g.ev('ZOOM_MAX'));
  assert.equal(n1, 1, 'в кадре-эталоне все нейтральны');
  assert.equal(n2, n1, 'отдалил — голые ионы вдали не в счёт');
  assert.equal(n3, n1, 'приблизил — нейтральные у края всё равно в счёте');
});
