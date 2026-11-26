// Регрессии из ревью: звёздный синтез не ест собранный углерод, рогатка варит бульон молекул,
// лавка не теряет пункт «для задания», ×4 ускоряет всю игру уровня частиц.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  return g;
}

test('звёзды: «Звёздный синтез» не бросает ⁴He в собранные к сверхновой ¹²C', () => {
  const g = toStage('stars');
  g.ev('G.stage.ignite(P.x, P.y)');
  // в недрах — ровно два ¹²C и гелий рядом; кислорода нет — он ещё нужен
  const put = (Z, N, dx) => `Object.assign({}, __t, { Z: ${Z}, N: ${N}, x: P.x + ${dx}, y: P.y, vx: 0, vy: 0, age: 5, dead: false, held: false, fly: 0, thrown: null })`;
  const setup = (nC) => g.ev(`(() => { const S = G.stage; globalThis.__t = S.o[0];
    S.o = [${[...Array(nC)].map((_, i) => put(6, 6, i * 1.5)).join(', ')}, ${put(2, 2, -1.5)}];
    S.rs.syn = 1; S.autoCd = 0; S.autoFuse(1 / 60); return S.o.filter(o => o.thrown === 'auto').length; })()`);
  assert.equal(setup(2), 0, 'два ¹²C — ровно сколько нужно: не трогаем');
  assert.equal(setup(3), 1, 'третий ¹²C — лишний: из него делаем ¹⁶O');
});

test('молекулы: после «Синтеза» собранное рогаткой тоже идёт в «Первичный бульон»', () => {
  const g = toStage('molecules');
  g.ev(`(() => { const S = G.stage; S.freeSlots = () => 0; S.counts = () => ({ H: 2, O: 1 }); })()`);
  g.ev(`G.stage.afterMerge(G.stage.m[0], 'hand', 0, 0)`);
  assert.equal(g.ev('G.stage.st.soup'), 0, 'до исследования рогатка в бульон не идёт');
  g.ev(`G.stage.res.add('H₂O'); G.stage.afterMerge(G.stage.m[0], 'hand', 0, 0); G.stage.afterMerge(G.stage.m[0], 'auto', 0, 0)`);
  assert.equal(g.ev('G.stage.st.soup'), 2);
  assert.equal(g.ev(`G.stage.steps().find(s => s.t === 'Первичный бульон').p[0]`), 2);
});

test('лавка частиц: пункт «для задания» не отрезается, даже если исследований много', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  g.ev(`(() => { const S = G.stage; S.ep = 1; S.rs.coll = 1; S.rs.e = S.rs.u = S.rs.d = S.rs.q1 = S.rs.mu = 1; S.kn += 9999; for (const sp of ['e', 'u', 'd', 'mu', 'nm', 's', 'c', 'ta', 'b', 'g', 'H']) { Codex.see(sp); Codex.run.add(sp); } })()`); // первое поколение и μ научены — в лавке второе и третье
  const all = g.ev(`G.stage.resList().map(r => r.k)`);
  assert.ok(all.length > g.ev('RES_MAX'), 'исследований больше, чем мест в лавке');
  const last = all[all.length - 1];
  g.ev(`G.stage._pk = '${last}'`);
  const items = g.ev(`G.stage.shopItems().filter(x => x.r).map(x => x.r.k)`);
  assert.equal(items[0], last, 'нужное для задания — первым');
  assert.ok(items.length <= g.ev('RES_MAX'));
});

test('×4: вся игра уровня частиц вчетверо быстрее — и время, и остывание', () => {
  const run = (ff) => {
    const g = loadGame({ seed: 4 });
    g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
    g.ev(`G.stage.ff = ${ff}; globalThis.__t0 = G.stage.t; globalThis.__T0 = G.stage.T`);
    g.step(60);
    return g.ev('[G.stage.t - __t0, Math.log(__T0 / G.stage.T)]');
  };
  const [t1, c1] = run(1), [t4, c4] = run(4);
  assert.ok(Math.abs(t4 / t1 - 4) < .01, `время уровня ×${(t4 / t1).toFixed(2)}`);
  assert.ok(c1 > 0 && Math.abs(c4 / c1 - 4) < .3, `остывание ×${(c4 / c1).toFixed(2)}`);
});

test('заставка: уровень на пути можно выбрать — забег начнётся с него и играется', () => {
  for (const [i, key] of [[1, 'quarks'], [2, 'nuclei'], [3, 'stars'], [4, 'atoms'], [5, 'molecules']]) {
    const g = loadGame();
    g.ev(`G.fromI = ${i}; document.getElementById('go').onclick()`);
    assert.equal(g.ev('G.stage.key'), key);
    assert.equal(g.ev('G.started'), true);
    g.step(240, true); // ни одного исключения: уровень живёт без предыдущего
    assert.equal(g.ev('G.stage.key'), key);
  }
});
