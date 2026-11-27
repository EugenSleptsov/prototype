// «Молекулы», этап 3 — кульминация: формамид и глицин в каталоге (опознаются по каркасу, а не по составу), глицин
// собирается в плоской геометрии (кусок садится и перевёрнутым), венец — сцена и ★, финал — портрет бульона и забега.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toMols(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'molecules') g.ev('advance(); G.trans = 99');
  g.step(120);
  g.ev(`G.stage.tide = () => {}; G.stage.autoChem = () => {}`);
  // join — связать атом ia куска A с атомом ib куска B (кратность n), перебирая свободные связи; at — атом вдали от всех; idx — k-й атом el со свободной связью
  g.ev(`globalThis.__j = { S: G.stage,
    join(A, ia, B, ib, n = 1) { const S = this.S; for (let a = 0; a < A.atoms[ia].b.length; a++) if (A.atoms[ia].b[a] < 0) for (let b = 0; b < B.atoms[ib].b.length; b++) if (B.atoms[ib].b[b] < 0) if (S.merge(A, ia, a, B, ib, b, 'hand', n)) return A.dead ? B : A; return null; },
    at(el, x = 0) { const m = this.S.newMol(el, P.x + x, P.y + 400); m.age = 2; return m; },
    idx(M, el, k = 0) { return M.atoms.map((a, i) => a.el === el && a.b.some(x => x < 0) ? i : -1).filter(i => i >= 0)[k]; },
    // каждая связь смотрит туда, где сосед (и после посадки перевёрнутым)
    sound(M) { const S = this.S; return M.bonds.every(([i, j, si, sj]) => { const d = Math.atan2(M.wp[j][1] - M.wp[i][1], M.wp[j][0] - M.wp[i][0]);
      return M.atoms[i].b[si] === j && M.atoms[j].b[sj] === i && (S.order(M, i, j) > 1 || (Math.abs(angDiff(S.slotAng(M, i, si), d)) < .05 && Math.abs(angDiff(S.slotAng(M, j, sj), d + Math.PI)) < .05)); }); },
    gly() { const J = this; let N = J.join(J.at('N', 200), 0, J.at('H', 230), 0); N = J.join(N, J.idx(N, 'N'), J.at('H', 260), 0);
      let Ca = J.join(J.at('C', 300), 0, J.at('H', 330), 0); Ca = J.join(Ca, J.idx(Ca, 'C'), J.at('H', 360), 0);
      const A = J.join(N, J.idx(N, 'N'), Ca, J.idx(Ca, 'C'));
      let C = J.join(J.at('C', 400), 0, J.at('O', 430), 0, 2); const O = J.join(J.at('O', 460), 0, J.at('H', 490), 0);
      C = J.join(C, J.idx(C, 'C'), O, J.idx(O, 'O'));
      return J.join(A, J.idx(A, 'C'), C, J.idx(C, 'C')); } }`);
  return g;
}
const J = (g, e) => JSON.parse(g.ev(`JSON.stringify(${e})`));

test('каталог: формамид и глицин опознаются по каркасу; тот же состав с другим строением — не из бульона', () => {
  const g = toMols();
  const r = J(g, `(() => { const { S } = __j, J = __j; for (const m of S.m) m.dead = true; S.m = [];
    let F = J.join(J.at('C'), 0, J.at('O', 30), 0, 2); F = J.join(F, J.idx(F, 'C'), J.at('H', 60), 0); F = J.join(F, J.idx(F, 'C'), J.at('N', 90), 0);
    F = J.join(F, J.idx(F, 'N'), J.at('H', 120), 0); F = J.join(F, J.idx(F, 'N'), J.at('H', 150), 0);
    // H₂C=N–OH (формальдоксим): тоже CH₃NO, но каркас C=N–O
    let X = J.join(J.at('C', 500), 0, J.at('N', 530), 0, 2); X = J.join(X, J.idx(X, 'N'), J.at('O', 560), 0);
    X = J.join(X, J.idx(X, 'O'), J.at('H', 590), 0); X = J.join(X, J.idx(X, 'C'), J.at('H', 620), 0); X = J.join(X, J.idx(X, 'C'), J.at('H', 650), 0);
    const Gl = J.gly();
    return { F: S.ident(F) && S.ident(F).f, X: [S.formula(X), S.freeSlots(X), S.ident(X)], G: Gl && S.ident(Gl) && S.ident(Gl).f, sound: J.sound(Gl),
      vF: S.soupVal(F, 'hand'), vG: S.soupVal(Gl, 'hand'), org: ORGANIC.includes('HCONH₂') && ORGANIC.includes(CROWN) }; })()`);
  assert.equal(r.F, 'HCONH₂');
  assert.deepEqual(r.X, ['CH₃NO', 0, null], 'формальдоксим — не формамид');
  assert.equal(r.G, 'NH₂CH₂COOH', 'NH₂–CH₂ садится на –C(=O)OH');
  assert.ok(r.sound, 'связи глицина смотрят на соседей');
  assert.equal(r.vF, 180); assert.equal(r.vG, 300, 'глицин — вдесятеро против метана');
  assert.ok(r.org);
});

test('стерика: не влез — кусок садится перевёрнутым, и связи после этого смотрят на соседей', () => {
  const g = toMols();
  // случайные сборки глицина: все варианты, что остаются частью цели, в случайном порядке; считаем тупики из-за тесноты
  const r = J(g, `(() => { const { S } = __j, F = CROWN, cp = COMP.find(x => x.f === F); let ok = 0, tight = 0, mir = 0, bad = 0;
    const pl0 = S.place; S.place = function () { const p = pl0.apply(this, arguments); if (p && p.mir) mir++; return p; };
    for (let t = 0; t < 120; t++) {
      for (const m of S.m) m.dead = true; S.m = [];
      const els = []; for (const e in cp.c) for (let i = 0; i < cp.c[e]; i++) els.push(e);
      let ms = els.map((e, i) => { const m = S.newMol(e, P.x + i * 40, P.y + 400); m.age = 2; m.a = Math.random() * TAU; S.recompute(m); return m; }), opts = [];
      for (let guard = 0; ms.length > 1 && guard < 60; guard++) {
        opts = [];
        for (const A of ms) for (const B of ms) if (A !== B) for (let i = 0; i < A.atoms.length; i++) for (let j = 0; j < B.atoms.length; j++)
          for (let a = 0; a < A.atoms[i].b.length; a++) if (A.atoms[i].b[a] < 0) for (let b = 0; b < B.atoms[j].b.length; b++) if (B.atoms[j].b[b] < 0)
            for (const n of [1, 2]) { const pa = S.piece(A), pb = S.piece(B), off = pa.el.length;
              if (n <= Math.min(S.freeAt(A, i), S.freeAt(B, j)) && partOf(F, { el: [...pa.el, ...pb.el], b: [...pa.b, ...pb.b.map(x => [x[0] + off, x[1] + off, x[2]]), [i, j + off, n]] })) opts.push([A, i, a, B, j, b, n]); }
        let done = false;
        for (const o of opts.sort(() => Math.random() - .5)) if (S.merge(...o.slice(0, 6), 'hand', o[6])) { done = true; break; }
        ms = S.m.filter(m => !m.dead); if (!done) break;
      }
      for (const M of ms) if (!__j.sound(M)) bad++;
      if (ms.length === 1 && S.ident(ms[0]) && S.ident(ms[0]).f === F) ok++; else if (opts.length) tight++;
    }
    S.place = pl0; return { ok, tight, mir, bad }; })()`);
  assert.equal(r.bad, 0, 'после посадки перевёрнутым связи не врут');
  assert.ok(r.mir > 0, 'перевёрнутым садились');
  assert.ok(r.tight <= 8, `тупиков из-за тесноты — единицы из 120: ${r.tight}`);
  assert.ok(r.ok >= 40, `глицин собирается: ${r.ok} из 120 (остальное — свои логические тупики бота)`);
});

test('венец: первый глицин — сцена «Венец уровня», ★ «венец: глицин», в бульон за 300', () => {
  const g = toMols();
  g.ev(`(() => { const S = G.stage; S.res.add('H₂O'); S.stars = [S.starPool().find(s => s.t === 'венец: глицин'), S.starPool()[0]]; })()`);
  g.ev(`(() => { const { S } = __j; const M = __j.gly(); M.atoms[1].star = true; })()`);
  const r = J(g, `(() => { const S = G.stage; return { crown: S.crownAt !== null, found: S.found.includes(CROWN), soup: S.st.soupV, card: document.getElementById('card').innerHTML }; })()`);
  assert.ok(r.crown && r.found);
  assert.match(r.card, /Венец уровня/);
  g.step(2);
  assert.equal(g.ev(`G.stage.stars[0].st`), 1, '★ «венец: глицин» выполнена');
  assert.equal(g.ev(`G.stage.soupList.find(x => x.f === CROWN).v`), 300, 'глицин в бульоне; звезда пришла уже после связи — ×1 (метка ставится до сборки)');
});

test('финал: портрет бульона (самое ценное — в центре), рекорд бульона, забег по уровням, итоги — внутри экрана конца', () => {
  const g = toMols();
  g.ev(`(() => { const S = G.stage; S.res.add('H₂O'); const M = __j.gly(); })()`);
  g.ev(`(() => { const S = G.stage, J = __j; let W = J.join(J.at('O', 700), 0, J.at('H', 730), 0); W = J.join(W, J.idx(W, 'O'), J.at('H', 760), 0); S.cheated = false; S.finish(true); })()`);
  const r = J(g, `({ h: document.getElementById('endh').textContent, art: document.getElementById('endart').innerHTML, run: document.getElementById('endrun').innerHTML,
    tl: document.getElementById('endtl').innerHTML, txt: document.getElementById('endtext').textContent })`);
  assert.equal(r.h, 'Облако сжалось');
  assert.match(r.art, /<svg[^>]*aria-label="Портрет бульона: NH₂CH₂COOH, H₂O"/);
  assert.match(r.art, /глицин NH₂CH₂COOH · 300/, 'в центре — самое ценное, с названием');
  assert.match(r.art, /первый бульон в этом браузере/);
  assert.match(r.run, /Молекулы/);
  assert.match(r.tl, /ВРЕМЯ ВЫШЛО/, 'итоги уровня — в экране конца');
  assert.doesNotMatch(r.tl, /с собой/, 'на последнем уровне ✦ нести некуда');
  assert.match(r.txt, /Венец — глицин/);
  assert.doesNotMatch(r.txt, /скоро/, '«органика скоро» — один раз, в разметке');
  // второй забег — сравнение с лучшим бульоном
  const g2 = toMols(); g2.ev(`localStorage.setItem('proto.lb.v1', ${JSON.stringify(JSON.stringify({ 'soup.molecules': [{ n: 'Игрок', s: 1000, t: 200, d: 1 }] }))})`);
  g2.ev(`(() => { const S = G.stage, J = __j; S.res.add('H₂O'); let W = J.join(J.at('O', 700), 0, J.at('H', 730), 0); W = J.join(W, J.idx(W, 'O'), J.at('H', 760), 0); S.cheated = false; S.finish(true); })()`);
  assert.match(g2.ev(`document.getElementById('endart').innerHTML`), /лучший бульон — 1000/);
});
