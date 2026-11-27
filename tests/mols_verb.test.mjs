// «Молекулы», этап 1 «глагол без обмана»: прицел учитывает стерику (что обещал — то и вышло), связь и отскок слышны,
// «Синтез» строит только части того, что варит (без тупиковых обрывков), гелий в химию не идёт.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toMols(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'molecules') g.ev('advance(); G.trans = 99');
  g.step(120);
  return g;
}
const J = (g, e) => JSON.parse(g.ev(`JSON.stringify(${e})`));

test('молекулы: пунктир честен — «связь» связывает, «тесно» не связывает (случайные броски кусков с каркасом)', () => {
  const g = toMols();
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}`);
  const r = J(g, `(() => { const S = G.stage, out = { tight: 0, tightBad: 0, bond: 0, bondBad: 0 };
    const chain = (els, x, y) => { let M = S.newMol(els[0], x, y); M.age = 2;
      for (let k = 1; k < els.length; k++) { const N = S.newMol(els[k], x + 40, y); N.age = 2; const last = M.atoms.length - 1; let done = false;
        for (let a = 0; a < M.atoms[last].b.length && !done; a++) if (M.atoms[last].b[a] < 0) for (let b = 0; b < N.atoms[0].b.length && !done; b++)
          if (N.atoms[0].b[b] < 0) { if (Math.random() < .5 && a < M.atoms[last].b.length - 1) continue; done = S.merge(M, last, a, N, 0, b, null, 1); }
        M = S.m.find(m => !m.dead && m.atoms.length === k + 1) || M; }
      return M; };
    const kinds = [['C'], ['C', 'C'], ['O', 'C'], ['C', 'O'], ['N', 'C'], ['C', 'C', 'C'], ['C', 'C', 'O']];
    // теснота после этапа 3 редка (не влез — садится перевёрнутым): бросаем, пока не встретится дважды
    for (let t = 0; t < 2500 && (t < 300 || out.tight < 2); t++) {
      for (const m of S.m) m.dead = true; S.m = [];
      const B = chain(kinds[Math.floor(Math.random() * kinds.length)], P.x, P.y), A = chain(kinds[Math.floor(Math.random() * 3)], P.x - 200, P.y - 200);
      for (const m of S.m) { m.vx = m.vy = m.w = 0; }
      B.a = Math.random() * 7; B.wp = B.atoms.map((_, i) => S.wpos(B, i));
      const ang = Math.random() * 7, d = 34 + B.R; A.x = B.x - Math.cos(ang) * d; A.y = B.y - Math.sin(ang) * d; A.a = Math.random() * 7; A.wp = A.atoms.map((_, i) => S.wpos(A, i));
      const v = 30 + Math.random() * 20, da = (Math.random() - .5) * .5, vx = Math.cos(ang + da) * v, vy = Math.sin(ang + da) * v;
      S.hold(A); A.held = false; const p = S.predict(A, vx, vy); S.launch(A, vx, vy);
      for (let i = 0; i < 90; i++) { B.vx = B.vy = B.w = 0; update(1 / 60); if (A.dead || B.dead) break; }
      const bonded = A.dead || B.dead;
      if (/^(связь|двойная|тройная)/.test(p.label)) { out.bond++; if (!bonded) out.bondBad++; }
      if (/^тесно/.test(p.label)) { out.tight++; if (bonded) out.tightBad++; }
    }
    return out; })()`);
  assert.ok(r.tight > 0, 'теснота встречается: ' + JSON.stringify(r));
  assert.equal(r.tightBad, 0, '«тесно» не связывает');
  assert.ok(r.bondBad <= r.bond * .03, 'обещанная связь выходит (было 6 % промахов): ' + JSON.stringify(r));
});

test('молекулы: часть соединения — по строению, а не по составу', () => {
  const g = toMols();
  const part = (f, el, b) => g.ev(`partOf('${f}', ${JSON.stringify({ el, b })})`);
  assert.equal(part('HCN', ['C', 'H'], [[0, 1, 1]]), true, 'CH — к HCN');
  assert.equal(part('HCN', ['N', 'H'], [[0, 1, 1]]), false, 'NH — тупик: азоту нужна тройная');
  assert.equal(part('HCN', ['C', 'N', 'H'], [[0, 1, 2], [1, 2, 1]]), false, 'HN=C — тупик');
  assert.equal(part('HCN', ['C', 'N', 'H'], [[0, 1, 3], [0, 2, 1]]), true, 'H–C≡N');
  assert.equal(part('H₂CO', ['O', 'H'], [[0, 1, 1]]), false, 'OH — не к формальдегиду');
  assert.equal(part('H₂CO', ['C', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1]]), false, 'CH₃ — уже не к формальдегиду');
  assert.equal(part('C₂H₅OH', ['C', 'O', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), false, 'CH₃–O — эфир или метанол, не этанол');
  assert.equal(part('CH₃OCH₃', ['C', 'O', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]), true);
  assert.equal(part('H₂O', ['H'], []), true); assert.equal(part('O₂', ['H'], []), false);
  assert.equal(part('H₂', ['H', 'H'], [[0, 1, 1]]), true); assert.equal(part('H₂O', ['H', 'H'], [[0, 1, 1]]), false, 'H₂ — не к воде');
});

test('молекулы: «Синтез» не лепит тупиков — после 150 с автопилота каждый кусок либо соединение, либо часть того, что варится', () => {
  for (const seed of [3, 7]) {
    const g = toMols(seed);
    const r = J(g, `(() => { const S = G.stage; for (const f of ['HCN', 'H₂CO', 'C₂H₄', 'CH₃OH', 'H₂O']) { S.found.includes(f) || S.found.push(f); S.res.add(f); }
      for (let k = 0; k < 6; k++) for (const e of ['C', 'C', 'N', 'O']) { const m = S.newMol(e, P.x + (Math.random() - .5) * 120, P.y + (Math.random() - .5) * 90); m.age = 2; }
      for (let i = 0; i < 60 * 150; i++) update(1 / 60);
      const live = S.m.filter(m => !m.dead && m.atoms.length > 1);
      return { made: S.st.auto, dead: live.filter(m => S.freeSlots(m) ? ![...S.res].some(f => partOf(f, S.piece(m))) : !S.ident(m)).map(m => S.formula(m)) }; })()`);
    assert.ok(r.made >= 5, `Вселенная варит: ${r.made}`);
    assert.deepEqual(r.dead, [], `тупики (сид ${seed})`);
  }
});

test('молекулы: связь звенит (кратная — выше), твой отскок слышен', () => {
  const g = toMols();
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}; globalThis.__snd = []; Sfx.play = (n, v) => __snd.push([n, v])`);
  const duel = (ea, eb, v, d = 30) => g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
    const A = S.newMol('${ea}', P.x - ${d}, P.y), B = S.newMol('${eb}', P.x, P.y); A.age = B.age = 2; A.w = B.w = 0;
    B.a = Math.PI - B.atoms[0].base; B.wp = B.atoms.map((_, i) => S.wpos(B, i));
    S.hold(A); A.held = false; S.predict(A, ${v}, 0); S.launch(A, ${v}, 0); __snd = [];
    for (let i = 0; i < 90; i++) { B.w = 0; update(1 / 60); } return 1; })()`);
  duel('O', 'O', 48);
  assert.deepEqual(J(g, '__snd.find(s => s[0] === "bond")'), ['bond', 2], 'двойная O=O');
  duel('H', 'H', 12, 16);
  assert.ok(J(g, '__snd.some(s => s[0] === "bounce")'), 'слабый — глухой отскок');
  assert.equal(g.ev('typeof Sfx.S.bond + typeof Sfx.S.bounce'), 'functionfunction');
});

test('молекулы: гелий из «Атомов» в химию не идёт; водорода в кадре меньше', () => {
  const g = toMols();
  assert.equal(g.ev('G.stage.m.some(m => m.atoms.some(a => !CHEM[a.el].s.length))'), false);
  assert.ok(g.ev('M_DENS') <= .0008 && g.ev('M_CAP') <= 40);
});
