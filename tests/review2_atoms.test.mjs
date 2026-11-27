// «Атомы» после второго ревью: подсказка захвата — только след (№7); финал 65 → 90 % — охота, а не ожидание:
// приток из-за края нейтрален, как кадр, последние голые ионы отмечены, за краем — стрелки (№12); прошлый уровень весом:
// C, N, O, что звезда не выковала, — пыль соседних сверхновых, позже и реже, строка на старте — что из твоей звезды (№6).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  return g;
}
// доля тяжёлых среди ионов Вселенной (cosmicZ) на n пробах
const heavyShare = (g, n = 6000) => g.ev(`(() => { let h = 0; for (let i = 0; i < ${n}; i++) if (G.stage.cosmicZ() >= 6) h++; return h / ${n}; })()`);
// войти в «Атомы» с выдуманной звездой: ядра Z в кадре (prev.o — всё, что «Атомы» берут со «Звёзд»)
const enterWith = Zs => `G.stage.enter({ o: [${Zs.map((Z, k) => `{ Z: ${Z}, x: P.x + ${k % 5 - 2} * 2, y: P.y + ${Math.floor(k / 5)} * 2, vx: 0, vy: 0 }`).join(', ')}] })`;

test('№7: первый захват — «осадить следом через атом», без «зажать атом» (удержание не осаживает)', () => {
  const g = toStage('atoms'); g.step(60);
  const t = g.ev(`(() => { const L = [], t0 = tipMsg; tipMsg = (k, s) => L.push(s); try {
    const S = G.stage, io = S.ion(1, P.x, P.y, 1); S.ions.push(io); S.msgs.delete('ex'); S.capture(io, { by: 'hand' }); } finally { tipMsg = t0; }
    return L.join(' | '); })()`);
  assert.match(t, /следом через атом/);
  assert.doesNotMatch(t, /зажать|держ/);
});

test('№12: выше REC_TOP ион из-за края одет на долю нейтральных — и без закона; ниже — как раньше', () => {
  const g = toStage('atoms'); g.step(60);
  const r = g.ev(`(() => { const S = G.stage, n0 = S.neutral; S.neutral = () => .85;
    const O = Array.from({ length: 400 }, () => S.inflow(S.ion(8, 0, 0, 0))), H = Array.from({ length: 400 }, () => S.inflow(S.ion(1, 0, 0, 0)));
    S.neutral = () => .5; const low = Array.from({ length: 200 }, () => S.inflow(S.ion(8, 0, 0, 0)));
    S.rs.rec = 1; const rec = Array.from({ length: 400 }, () => S.inflow(S.ion(8, 0, 0, 0))); S.rs.rec = 0; S.neutral = n0;
    return { oMean: O.reduce((s, i) => s + i.ne, 0) / O.length / 8, oMin: Math.min(...O.map(i => i.ne)), oK: O.every(i => i.kDone),
      hN: H.filter(i => i.ne === 1).length / H.length, low: low.every(i => i.ne === 0),
      recAll: rec.every(i => i.ne === 0 || i.ne === 8), recN: rec.filter(i => i.ne === 8).length / rec.length }; })()`);
  assert.ok(Math.abs(r.oMean - .85) < .03, `O: ${r.oMean}`);
  assert.ok(r.oMin >= 6, 'голого O⁸⁺ (и O³⁺) выше REC_TOP не приплывает');
  assert.ok(r.oK, 'K-оболочку закрыл не ты — награды за неё не будет');
  assert.ok(Math.abs(r.hN - .85) < .06, `H: ${r.hN}`);
  assert.ok(r.low, 'без «Рекомбинации» ниже REC_TOP приток голый');
  assert.ok(r.recAll && Math.abs(r.recN - .5) < .08, `с законом ниже REC_TOP — целиком одет с долей нейтральных: ${r.recN}`);
});

test('№12: набранные ~90 % дрейф из-за края не откатывает (ободок доливается одетыми ионами)', () => {
  const g = toStage('atoms'); g.step(240);
  g.ev(`(() => { const S = G.stage; S.phT = -1e9; S.ph = []; S.el = []; for (const i of S.ions) { i.ne = i.Z; i.ex = 0; }
    let k = 0; for (const i of S.ions) if (!inView(i.x, i.y) || ++k > 20) i.dead = true; // ободок пуст, в кадре — 20: Вселенная дольёт
    S.ions = S.ions.filter(i => !i.dead); globalThis.__old = new Set(S.ions); })()`);
  const n0 = g.ev('G.stage.neutral()');
  g.step(120);
  const r = g.ev(`(() => { const S = G.stage, nw = S.ions.filter(i => !i.dead && !__old.has(i));
    return { k: nw.length, share: nw.reduce((s, i) => s + i.ne, 0) / Math.max(1, nw.reduce((s, i) => s + i.Z, 0)), n: S.neutral() }; })()`);
  assert.ok(r.k >= 5, `приплыло ${r.k}`);
  assert.ok(r.share > .85, `приплывшие одеты на ${Math.round(r.share * 100)} %`);
  assert.ok(r.n > n0 - .06 && r.n > .85, `доля ${n0} → ${r.n}`);
});

test('№12: выше HUNT_AT голые ионы в счёте доли отмечены, за краем — стрелки; дальше A_REFM — нет', () => {
  const g = toStage('atoms'); g.step(240);
  g.ev(`(() => { const S = G.stage; S.phT = -1e9; S.ph = []; S.el = []; S.tide = () => {}; S.zFloor = () => 0;
    for (const i of S.ions) { i.ne = i.Z; i.ex = 0; }
    const [hw] = halfView(refZ());
    for (let k = 0; k < 12; k++) { const h = S.ion(1, cam.x + k - 6, cam.y + 1, 9); h.ne = 1; h.vx = h.vy = 0; S.ions.push(h); } // кадр не пуст
    globalThis.__in = S.ion(8, cam.x + hw + 2, cam.y, 9); globalThis.__far = S.ion(8, cam.x + hw + A_REFM + 3, cam.y, 9);
    for (const o of [__in, __far]) { o.vx = o.vy = 0; o.ne = 5; S.ions.push(o); } })()`);
  assert.ok(g.ev('G.stage.neutral()') > g.ev('HUNT_AT'));
  assert.equal(g.ev('G.stage.huntList().includes(__in)'), true, 'за краем экрана, но в счёте доли');
  assert.equal(g.ev('G.stage.huntList().includes(__far)'), false, 'дальше A_REFM за кадром — в долю не идёт');
  const L = g.ev(`(() => { const L = [], e0 = edgeArrows; edgeArrows = (pts, n) => L.push(...pts.map(p => p[2])); try { G.stage.drawPlayer(1); } finally { edgeArrows = e0; } return L; })()`);
  assert.ok(L.includes('O³⁺'), JSON.stringify(L));
  assert.match(g.ev('G.stage.steps()[4].h'), /отмечены/);
  g.step(1);
  // нейтральных мало — охоты нет, задание прежнее
  g.ev('for (const i of G.stage.ions) i.ne = 0');
  assert.equal(g.ev('G.stage.huntList().length'), 0);
  assert.doesNotMatch(g.ev('G.stage.steps()[4].h'), /отмечены/);
});

test('№6: звезда не выковала C, N, O — их нет на старте, пыль соседних сверхновых — через DUST_T и реже', () => {
  const g = toStage('atoms');
  assert.equal(g.ev('G.stage.alien.join()'), '6,7,8');
  assert.equal(g.ev('G.stage.ions.filter(i => i.Z >= 6).length'), 0, 'подарка на старте нет');
  assert.match(g.ev('G.stage.origin'), /не выковала C, N, O.*пыль соседних сверхновых/);
  g.step(150);
  assert.ok(g.ev(`G.stage.msgs.has('origin')`), 'строка на старте показана');
  assert.match(g.ev('G.stage.steps()[2].h'), /C, N, O — не из твоей звезды: пыль соседних сверхновых через \d+ с/);
  assert.equal(heavyShare(g), 0, 'до DUST_T тяжёлых в притоке нет');
  assert.equal(g.ev('G.stage.ions.filter(i => i.Z >= 6).length'), 0);
  g.ev('G.stage.clock = DUST_T');
  const h = heavyShare(g);
  assert.ok(h > .015 && h < .05, `после DUST_T — реже своих (≈0,1·DUST_K): ${h}`);
  g.ev('G.stage.phT = -1e9; G.stage.ph = []'); g.step(1);
  const d = JSON.parse(g.ev(`JSON.stringify(G.stage.ions.filter(i => i.dust).map(i => [i.Z, i.ne]))`));
  assert.deepEqual(d.map(x => x[0]).sort((a, b) => a - b), [6, 7, 8], 'пыль принесла по одному');
  assert.ok(d.every(([Z, ne]) => ne < Z), 'каждый — с электроном, который ловить тебе');
  assert.match(g.ev('lastMsg'), /Пыль соседних сверхновых/);
  // N пропал из виду — следующий через DUST_GAP; одел азот — больше не несут
  g.ev('for (const i of G.stage.ions) if (i.dust && i.Z === 7) i.dead = true');
  g.step(60);
  assert.equal(g.ev('G.stage.ions.filter(i => !i.dead && i.dust && i.Z === 7).length'), 0, 'не раньше DUST_GAP');
  g.ev('G.stage.clock += DUST_GAP'); g.step(1);
  assert.equal(g.ev('G.stage.ions.filter(i => !i.dead && i.dust && i.Z === 7).length'), 1);
  g.ev('G.stage.seenN.add(7); for (const i of G.stage.ions) if (i.Z === 7) i.dead = true; G.stage.clock += DUST_GAP'); g.step(1);
  assert.equal(g.ev('G.stage.ions.filter(i => !i.dead && i.dust && i.Z === 7).length'), 0, 'азот одет — пыль его больше не несёт');
});

test('№6: без своей звезды уровень проходим — пыль приносит C, N, O, их можно одеть', () => {
  const g = toStage('atoms'); g.step(60);
  g.ev('G.stage.clock = DUST_T; G.stage.phT = -1e9; G.stage.ph = []'); g.step(1);
  g.ev(`(() => { const S = G.stage; for (const io of S.ions.filter(i => i.dust)) while (io.ne < io.Z) { S.capture(io, { by: 'hand' }); S.relax(io, 'hand'); } })()`);
  assert.ok(g.ev('[6, 7, 8].every(Z => G.stage.seenN.has(Z))'));
});

test('№6: звезда выковала C, N, O — чужих нет, строка «из твоей звезды», тяжёлые в притоке сразу', () => {
  const g = toStage('stars');
  g.ev('G.stage.cheat(); G.stage.supernova()');
  g.step(2.7 * 60);
  assert.equal(g.ev('G.stage.key'), 'atoms');
  assert.equal(g.ev('G.stage.alien.join()'), '');
  assert.match(g.ev('G.stage.origin'), /^Из твоей звезды: C, N, O/);
  const h = heavyShare(g);
  assert.ok(h > .08 && h < .12, `${h}`);
  assert.doesNotMatch(g.ev('G.stage.steps()[2].h'), /пыль/);
});

test('№6: выковал только C — N, O пылью; с титула (звезды не было) — набор по умолчанию, без строки и без задержки', () => {
  const g = toStage('atoms');
  g.ev(enterWith([6, 6, 2, 1, 1, 1]));
  assert.equal(g.ev('G.stage.alien.join()'), '7,8');
  assert.match(g.ev('G.stage.origin'), /Из твоей звезды: C .*N, O она не выковала/);
  assert.equal(g.ev('G.stage.ions.filter(i => i.Z === 7 || i.Z === 8).length'), 0);
  assert.ok(g.ev('G.stage.ions.some(i => i.Z === 6)'));
  g.ev('G.stage.enter(null)');
  assert.equal(g.ev('G.stage.alien.join()'), '');
  assert.equal(g.ev('G.stage.origin'), '');
  assert.ok(g.ev('[1, 2, 6, 7, 8].every(Z => G.stage.ions.some(i => i.Z === Z))'), 'каждого нужного — хотя бы по одному');
  const h = heavyShare(g);
  assert.ok(h > .08 && h < .12, `${h}`);
});
