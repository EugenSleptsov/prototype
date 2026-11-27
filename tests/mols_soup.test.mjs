// «Молекулы», этап 2 — зачем переигрывать: ценность бульона (сложное дороже, законом — вполовину, из твоей звезды — дороже),
// окно облака (сжимается в звезду — не успел, без бонуса), золотая метка атомов твоих звёзд, ★ про умение.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.step(120);
  return g;
}
const J = (g, e) => JSON.parse(g.ev(`JSON.stringify(${e})`));
// кусок для soupVal: элементы, связи [i, j] по одной на кратность, атомы звезды
const mol = (el, b, star = []) => JSON.stringify({ atoms: el.map((e, i) => ({ el: e, star: star.includes(i) })), bonds: b });

test('бульон: ценность растёт со сложностью; законом — вполовину; из твоей звезды — дороже', () => {
  const g = toStage('molecules');
  const v = (m, src = 'hand') => g.ev(`G.stage.soupVal(${m}, '${src}')`);
  const ch4 = mol(['C', 'H', 'H', 'H', 'H'], [[0, 1], [0, 2], [0, 3], [0, 4]]);
  const meoh = mol(['C', 'O', 'H', 'H', 'H', 'H'], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5]]);
  const hcn = mol(['C', 'N', 'H'], [[0, 1], [0, 1], [0, 1], [0, 2]]);
  const co2 = mol(['O', 'C', 'O'], [[0, 1], [0, 1], [1, 2], [1, 2]]);
  assert.equal(v(ch4), 30); assert.equal(v(meoh), 90); assert.equal(v(hcn), 150); assert.equal(v(co2), 210);
  assert.equal(v(meoh, 'auto'), 45, 'законом — вполовину');
  assert.equal(v(mol(['C', 'O', 'H', 'H', 'H', 'H'], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5]], [0])), 135, 'углерод твоей звезды — ×1,5');
});

test('бульон: собранное идёт в бульон с ценностью, разобранное — уходит с ней; больше десяти не бывает', () => {
  const g = toStage('molecules');
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}; G.stage.res.add('H₂O')`);
  const r = J(g, `(() => { const S = G.stage, O = S.newMol('O', P.x, P.y), H1 = S.newMol('H', P.x + 20, P.y), H2 = S.newMol('H', P.x - 20, P.y);
    O.atoms[0].star = true; S.merge(O, 0, 0, H1, 0, 0, 'hand', 1); const W = S.m.find(m => !m.dead && m.atoms.length === 2);
    S.merge(W, 0, W.atoms[0].b.indexOf(-1), H2, 0, 0, 'hand', 1); const M = S.m.find(m => !m.dead && m.atoms.length === 3);
    const a = { soup: S.st.soup, v: S.st.soupV, star: S.st.soupStar, list: S.soupList.map(x => x.f) };
    S.splitBond(M, 0); return [a, { soup: S.st.soup, v: S.st.soupV, star: S.st.soupStar, list: S.soupList.length }]; })()`);
  assert.deepEqual(r[0], { soup: 1, v: 45, star: 1, list: ['H₂O'] }, 'вода из кислорода твоей звезды: 30 × 1,5');
  assert.deepEqual(r[1], { soup: 0, v: 0, star: 0, list: 0 });
  g.ev(`G.stage.st.soup = M_SOUP - 1`);
  g.ev(`(() => { const S = G.stage; for (let k = 0; k < 2; k++) { const O = S.newMol('O', P.x + 60 * k, P.y + 80); S.merge(O, 0, 0, S.newMol('H', 0, 0), 0, 0, 'hand', 1);
    const W = S.m.find(m => !m.dead && m.atoms.length === 2 && S.freeSlots(m)); S.merge(W, 0, W.atoms[0].b.indexOf(-1), S.newMol('H', 0, 0), 0, 0, 'hand', 1); } })()`);
  assert.equal(g.ev('G.stage.st.soup'), g.ev('M_SOUP'), 'бульон не переполняется');
});

test('окно: облако сжимается — не успел, уровень кончается без бонуса, а сваренное идёт в очки', () => {
  const g = toStage('molecules');
  const s0 = g.ev('G.score');
  g.ev(`(() => { const S = G.stage; S.st.soupV = 120; S.st.soup = 4; S.soupList = [{ f: 'CH₃OH', n: 'метанол', v: 120, src: 'hand', star: true }]; S.clock = S.life - M_WARN - .5; })()`);
  g.step(60);
  assert.equal(g.ev('G.stage.warned'), true, 'за 30 с — предупреждение');
  g.ev('G.stage.clock = G.stage.life - .2'); g.step(30);
  assert.equal(g.ev('G.stage.failed'), true);
  assert.equal(g.ev('G.ended'), true, 'последний уровень: конец забега');
  const lv = g.ev('G.score') - s0;
  assert.ok(lv >= 120 && lv < 120 + g.ev('LVL_BONUS'), `бульон в очках, бонуса уровня нет: ${lv}`);
  const txt = g.ev(`document.getElementById('endtext').textContent`);
  assert.match(txt, /Облако сжалось: в бульоне 4 из 10 · ценность 120/);
  assert.match(txt, /Из вещества твоих звёзд: метанол/);
  assert.match(g.ev(`document.getElementById('tally').innerHTML`), /ВРЕМЯ ВЫШЛО/);
});

test('окно: бульон сварен вовремя — бонус уровня и ценность бульона строкой итогов', () => {
  const g = toStage('molecules');
  const s0 = g.ev('G.score');
  g.ev(`(() => { const S = G.stage; S.cheat(); S.st.soupV = 300; })()`); g.step(2);
  assert.equal(g.ev('G.stage.failed'), false);
  assert.ok(g.ev('G.score') - s0 >= 300 + g.ev('LVL_BONUS'));
  assert.match(g.ev(`document.getElementById('tally').innerHTML`), /бульон 10 \/ 10<\/span><b>\+300/);
  assert.match(g.ev(`document.getElementById('endtext').textContent`), /^Первичный бульон готов · ценность 300/);
});

test('свои атомы: C, N, O из твоих звёзд приходят с золотой меткой и держат её в молекуле', () => {
  const g = toStage('atoms');
  g.ev(`G.stage.ions.forEach((i, k) => { if (i.Z >= 6) { i.ne = i.Z; i.mine = k % 2 === 0; } })`);
  const want = g.ev(`G.stage.ions.filter(i => i.Z >= 6 && CHEM[atSym(i.Z)] && CHEM[atSym(i.Z)].s.length && i.mine && !i.dead).length`);
  g.ev('advance()');
  assert.equal(g.ev('G.stage.key'), 'molecules');
  assert.equal(g.ev('G.stage.starN'), want);
  assert.equal(g.ev('G.stage.m.filter(m => m.atoms[0].star).length'), want);
  if (want) {
    const kept = g.ev(`(() => { const S = G.stage, A = S.m.find(m => m.atoms[0].star), H = S.newMol('H', A.x + 20, A.y);
      S.merge(A, 0, 0, H, 0, 0, 'hand', 1); return S.m.some(m => !m.dead && m.atoms.length === 2 && m.atoms.some(a => a.star)); })()`);
    assert.equal(kept, true);
  }
});

test('★ — про умение: метана и аммиака в пуле нет, тройная связь рогаткой засчитывается', () => {
  const g = toStage('molecules');
  const pool = J(g, 'G.stage.starPool().map(s => s.t)');
  assert.ok(!pool.some(t => /метан|аммиак/.test(t)), pool.join(' · '));
  assert.ok(pool.includes('тройная связь рогаткой') && pool.some(t => /^бульон за 3:00/.test(t)));
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}`);
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
    const A = S.newMol('N', P.x - 30, P.y), B = S.newMol('N', P.x, P.y); A.age = B.age = 2; A.w = B.w = 0;
    B.a = Math.PI - B.atoms[0].base; B.wp = B.atoms.map((_, i) => S.wpos(B, i));
    S.hold(A); A.held = false; S.predict(A, 60, 0); S.launch(A, 60, 0);
    for (let i = 0; i < 90; i++) { B.w = 0; update(1 / 60); } })()`);
  assert.equal(g.ev('G.stage.st.triple'), 1, 'N≡N рогаткой');
  assert.equal(g.ev(`G.stage.starPool().find(s => s.t === 'тройная связь рогаткой').ok()`), true);
});

test('пунктир у самого барьера не обещает связь: «на грани» — может отскочить', () => {
  const g = toStage('molecules');
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}`);
  const label = v => g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
    const A = S.newMol('C', P.x - 30, P.y), B = S.newMol('C', P.x, P.y); A.age = B.age = 2; A.w = B.w = 0;
    B.a = Math.PI - B.atoms[0].base; B.wp = B.atoms.map((_, i) => S.wpos(B, i));
    S.hold(A); const p = S.predict(A, ${v}, 0); A.held = false; return p.label; })()`);
  assert.match(label(30), /^на грани барьера/, 'в полёте бросок теряет ~2,2: до барьера доходит 27,8');
  assert.match(label(32), /^связь C–C/);
  assert.match(label(20), /^слабо/);
});
