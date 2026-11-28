// Перенос итогов (REVIEW_NEON_4 тема Г): искра «твоей звезды» — только у C, N, O (H со «Звёзд» её получал, H₂O стоила
// 45 вместо 30); ★ «3 в бульоне — из твоих звёзд» не предлагается, когда таких атомов меньше трёх; «Ядра» с Y ≈ 1 —
// в том числе проваленные — не оставляют первую звезду без протонов.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function to(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Spot.clear()');
  g.step(60);
  return g;
}

test('«Молекулы»: искра «твоей звезды» — только у C, N, O, не у водорода со «Звёзд»', () => {
  const g = to('atoms');
  g.ev(`(() => { const S = G.stage; for (const i of S.ions) i.dead = true;
    S.ions = [1, 1, 1, 6, 8].map((Z, k) => { const i = S.ion(Z, P.x + k, P.y, 1); i.ne = Z; i.mine = true; return i; }); })()`);
  g.ev('advance(); G.trans = 99');
  assert.equal(g.ev('G.stage.key'), 'molecules');
  const star = g.ev(`JSON.stringify(G.stage.m.filter(m => m.atoms.some(a => a.star)).map(m => m.atoms[0].el).sort())`);
  assert.equal(star, JSON.stringify(['C', 'O']), 'раньше искру получали и три H');
  assert.equal(g.ev('G.stage.starN'), 2);
});

test('«Молекулы»: ★ «3 в бульоне — из твоих звёзд» не выпадает, когда атомов твоих звёзд меньше трёх', () => {
  const g = to('molecules');
  g.ev('G.stage.starN = 2');
  const can = g.ev(`G.stage.starPool().find(s => /из твоих звёзд/.test(s.t)).can()`);
  assert.equal(can, false, 'раньше хватало двух');
  g.ev('G.stage.starN = 3');
  assert.equal(g.ev(`G.stage.starPool().find(s => /из твоих звёзд/.test(s.t)).can()`), true);
});

for (const failed of [false, true]) {
  test(`«Звёзды»: гелий с «Ядер» ${failed ? '(проваленных) ' : ''}≈ 100 % — в облаке не больше 70 %, в недрах первой звезды есть протоны`, () => {
    const g = to('nuclei');
    g.ev(`G.stage.Y = () => 1; G.stage.doneAt = 0; G.stage.failed = ${failed}; advance()`);
    assert.equal(g.ev('G.stage.key'), 'stars');
    assert.equal(g.ev('G.stage.Yin'), 1, 'Y перенесён как есть');
    assert.equal(g.ev('G.stage.heP'), g.ev('ST_HEMAX'), 'раньше 1: в недрах ни одного протона, азот невозможен');
    g.ev('G.prev = null; G.trans = 99; update(1 / 60)');
    assert.ok(g.ev(`G.stage.floats.some(f => /гелий из «Ядер»: 100 % — в облаке 70 %/.test(f.txt))`), 'срез показан');
  });
}
