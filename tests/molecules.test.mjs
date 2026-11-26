// «Молекулы»: барьер и геометрия ощутимы — слабый бросок отскакивает, удар мимо свободной связи цели не связывает,
// пунктир говорит то же, что выйдет; в задании — органика с каркасом C–C, C–O или C–N; бот с прицелом проходит уровень.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toMols(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'molecules') g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}
// пустое поле и два атома: A брошен в B со скоростью v; у B свободная связь повёрнута от линии удара на turn рад
const duel = (ea, eb, v, turn) => `(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
  const A = S.newMol('${ea}', P.x - 30, P.y), B = S.newMol('${eb}', P.x, P.y); A.age = B.age = 2; A.w = B.w = 0;
  B.a = Math.PI - B.atoms[0].base + ${turn}; B.wp = B.atoms.map((_, i) => S.wpos(B, i));
  S.hold(A); A.held = false; const p = S.predict(A, ${v}, 0); S.launch(A, ${v}, 0); globalThis.__AB = [A, B];
  return { label: p.label, cone: p.cone && p.cone[3], need: p.need }; })()`;
const quiet = `G.stage.tide = () => {}; G.stage.autoChem = () => {}`; // только эти двое: Вселенная не мешает
const bonded = g => g.ev('G.stage.m.some(m => !m.dead && m.bonds.length > 0)');
const fly = g => { for (let i = 0; i < 120 && !bonded(g); i++) g.ev('__AB[1].w = 0; update(1 / 60)'); return bonded(g); };

test('молекулы: энергия активации — заметная доля рогатки, H–H < C–H < C–C, C–O, C–N', () => {
  const g = toMols();
  const ea = (a, b) => g.ev(`EA('${a}', '${b}') / M_VMAX`);
  assert.ok(ea('H', 'H') >= .25 && ea('H', 'H') < ea('C', 'H'), `H–H ${ea('H', 'H')}`);
  assert.ok(ea('C', 'H') < ea('C', 'C') && ea('C', 'C') <= .4);
  assert.equal(ea('C', 'O'), ea('C', 'C')); assert.equal(ea('N', 'C'), ea('C', 'C'));
  assert.ok(g.ev('EA("C", "C") < BREAK_V && M_AUTO_V > EA("C", "C") && M_AUTO_V < BREAK_V'), 'Вселенная бросает выше барьера и не рвёт');
});

test('молекулы: слабый бросок — отскок, сильный — связь; пунктир говорит заранее', () => {
  const g = toMols(); g.ev(quiet);
  let r = g.ev(duel('H', 'H', 12, 0));
  assert.match(r.label, /слабо: барьер/);
  assert.ok(r.need > 12 && r.need < 40, `нужно ${r.need}`);
  assert.equal(fly(g), false, 'слабый удар не связал');
  r = g.ev(duel('H', 'H', 30, 0));
  assert.equal(r.label, 'связь H–H'); assert.equal(r.cone, true);
  assert.equal(fly(g), true, 'сильный — связал');
});

test('молекулы: цель не доворачивается — удар мимо её свободной связи не связывает', () => {
  const g = toMols(); g.ev(quiet);
  let r = g.ev(duel('H', 'O', 35, 1.3)); // у кислорода две связи под 104,5°: обе смотрят мимо удара
  assert.match(r.label, /мимо свободной связи/);
  assert.equal(r.cone, false);
  assert.equal(fly(g), false);
  r = g.ev(duel('H', 'O', 35, .3));
  assert.equal(r.label, 'связь H–O');
  assert.equal(fly(g), true, 'в допуске — связь');
});

test('молекулы: «магнетизм» связей доворачивает только броски Вселенной, твой — нет', () => {
  const g = toMols(); g.ev(quiet);
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
    const A = S.newMol('H', P.x - 14, P.y), B = S.newMol('H', P.x, P.y); A.age = B.age = 2; A.w = B.w = 0;
    A.a = -A.atoms[0].base; B.a = Math.PI - B.atoms[0].base + .5; A.wp = [S.wpos(A, 0)]; B.wp = [S.wpos(B, 0)]; globalThis.__AB = [A, B]; })()`);
  const a0 = g.ev('__AB[1].a');
  g.ev('__AB[0].hand = 3; G.stage.magnet(1 / 60)');
  assert.equal(g.ev('__AB[1].a'), a0, 'твой бросок цель не поворачивает');
  assert.ok(g.ev('G.stage.hints.length') > 0, 'но пунктир-подсказка есть');
  g.ev('__AB[0].hand = 0; __AB[0].auto = 3; G.stage.magnet(1 / 60)');
  assert.notEqual(g.ev('__AB[1].a'), a0, 'бросок Вселенной — доворачивает');
});

test('молекулы: последний водород Вселенная не берёт', () => {
  const g = toMols();
  g.ev(`(() => { const S = G.stage; S.res.add('H₂'); for (const m of S.m) m.dead = true; S.m = [];
    for (let i = 0; i < 4; i++) { const h = S.newMol('H', P.x + i * 12, P.y); h.age = 2; } S.autoCd = 0; S.autoChem(1 / 60); })()`);
  assert.equal(g.ev('G.stage.m.filter(m => m.auto > 0).length'), 0, '4 свободных H — не трогает');
  g.ev(`(() => { const S = G.stage; for (let i = 0; i < 6; i++) { const h = S.newMol('H', P.x + i * 12, P.y + 20); h.age = 2; } S.autoCd = 0; S.autoChem(1 / 60); })()`);
  assert.ok(g.ev('G.stage.m.filter(m => m.auto > 0).length') > 0, 'водорода много — сводит H с H');
});

test('молекулы: в задании — органика с каркасом (C–C, C–O или C–N)', () => {
  const g = toMols();
  const step = () => g.ev(`G.stage.steps().find(s => /органик/.test(s.t))`);
  assert.ok(step(), 'шаг есть'); assert.equal(step().d, false);
  g.ev(`G.stage.found.push('CH₄', 'NH₃', 'H₂O', 'H₂O₂')`);
  assert.equal(step().d, false, 'метан — не каркас');
  g.ev(`G.stage.found.push('CH₃OH')`);
  assert.equal(step().d, true);
  const g2 = toMols(); g2.ev('G.stage.cheat()');
  assert.ok(g2.ev(`G.stage.steps().filter(s => s.t !== 'Первичный бульон').every(s => s.d)`), 'чит закрывает и органику');
});

// бот-игрок: целится по пунктиру (перебирает угол и натяжение, бьёт в середину удачного), строит открытое и органику
const BOT = `globalThis.__mbot = (secs) => { const S = G.stage; let cd = 0;
  const sum = (a, b) => { const c = S.counts(a), d = S.counts(b); for (const k in d) c[k] = (c[k] || 0) + d[k]; return c; };
  for (let i = 0; i < 60 * secs && S.doneAt === null; i++) {
    if (S.res.size < 2 && S.shopItems().length && S.bal() >= S.mCost()) S.buy(0);
    if ((cd -= 1 / 60) <= 0) { cd = 1.5;
      const f = S.bodies().filter(m => S.freeSlots(m) && inRef(m.x, m.y, -10) && !(m.hand > 0) && !(m.auto > 0));
      const org = S.found.length >= 3 && !ORGANIC.some(x => S.found.includes(x));
      let pair = null, bs = -1e9;
      for (const gl of COMP.filter(c => !S.found.includes(c.f))) for (const A of f) for (const B of f) {
        if (A === B) continue; const s = sum(A, B); if (!fits(s, gl.c)) continue;
        const ex = ckey(s) === ckey(gl.c); if (!ex && S.freeSlots(A) + S.freeSlots(B) - 2 < 1) continue;
        const d = Math.hypot(A.x - B.x, A.y - B.y); if (d > 60) continue;
        const sc = (ex ? 100 : 0) + (org && ORGANIC.includes(gl.f) ? 150 : 0) + A.atoms.length + B.atoms.length - d / 20;
        if (sc > bs) { bs = sc; pair = A.m <= B.m ? [A, B] : [B, A]; }
      }
      if (!pair) { const H = f.filter(m => m.atoms.length === 1); if (H.length > 1) pair = [H[0], H[1]]; }
      if (pair) { const [A, B] = pair, base = Math.atan2(B.y - A.y, B.x - A.x), okA = []; S.hold(A); A.held = false;
        for (let da = -.5; da <= .5; da += .04) { const ks = [];
          for (let k = .35; k <= .95; k += .05) { const v = k ** SLING_POW * M_VMAX, p = S.predict(A, Math.cos(base + da) * v, Math.sin(base + da) * v); if (p.label && p.label.startsWith('связь')) ks.push(k); }
          if (ks.length) okA.push([da, ks[Math.min(ks.length - 1, 2)]]); }
        if (okA.length) { const [da, k] = okA[okA.length >> 1], v = k ** SLING_POW * M_VMAX, vx = Math.cos(base + da) * v, vy = Math.sin(base + da) * v; S.predict(A, vx, vy); S.launch(A, vx, vy); } }
    }
    update(1 / 60);
  }
  return { done: S.doneAt !== null, t: Math.round(S.clock), found: S.found.join(', ') };
};`;

test('молекулы: бот с прицелом проходит уровень (органика, законы, бульон)', () => {
  const g = toMols(11); // сид — после пролога-рогатки поток случайностей другой; 3, 5, 11 проходят за 85–241 с, 7 — за 438
  g.ev(BOT);
  const r = g.ev('__mbot(400)');
  assert.equal(r.done, true, `не прошёл за 400 с: ${JSON.stringify(r)}`);
  assert.ok(g.ev('ORGANIC.some(f => G.stage.found.includes(f))'), r.found);
});

test('молекулы: кратные связи — сильнее удар, выше кратность: O=O — кислород, N≡N — азот; рвутся по одной', () => {
  const g = toMols(); g.ev(quiet);
  let r = g.ev(duel('O', 'O', 35, 0));
  assert.equal(r.label, 'связь O–O', 'над барьером, но ниже двойной — одинарная');
  assert.equal(fly(g), true);
  assert.equal(g.ev('G.stage.m.find(m => !m.dead && m.bonds.length).bonds.length'), 1);
  assert.equal(g.ev(`G.stage.found.includes('O₂')`), false, 'O–O с двумя свободными — ещё не кислород');
  r = g.ev(duel('O', 'O', 48, 0));
  assert.equal(r.label, 'двойная связь O=O');
  assert.equal(fly(g), true);
  const mol = 'G.stage.m.find(m => !m.dead && m.bonds.length)';
  assert.equal(g.ev(`${mol}.bonds.length`), 2, 'две связи между теми же атомами');
  assert.equal(g.ev(`G.stage.freeSlots(${mol})`), 0);
  assert.equal(g.ev(`G.stage.found.includes('O₂')`), true, 'O₂ открыт');
  // долгое нажатие ослабляет двойную до одинарной — молекула цела
  g.ev(`globalThis.__mol = ${mol}`);
  assert.match(g.ev(`(() => { const [i, j] = __mol.bonds[0]; const p = __mol.wp[i], q = __mol.wp[j]; return G.stage.lpAt(__mol, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2).label; })()`), /ослабить O=O → –/);
  g.ev(`(() => { const [i, j] = __mol.bonds[0]; const p = __mol.wp[i], q = __mol.wp[j]; G.stage.lp(__mol, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); })()`);
  assert.equal(g.ev('__mol.dead'), false); assert.equal(g.ev('__mol.bonds.length'), 1, 'O=O → O–O');
  assert.equal(g.ev('G.stage.freeSlots(__mol)'), 2);
  r = g.ev(duel('N', 'N', 60, 0));
  assert.equal(r.label, 'тройная связь N≡N');
  assert.equal(fly(g), true);
  assert.equal(g.ev(`G.stage.found.includes('N₂')`), true, 'N₂ открыт');
  r = g.ev(duel('H', 'O', 60, 0));
  assert.doesNotMatch(r.label, /двойная|тройная/, 'у водорода одна связь — только одинарная');
});

test('молекулы: Вселенная, научившись соединению с кратной связью, бьёт под неё (CO₂: O=C=O)', () => {
  const g = toMols(); g.ev('G.stage.tide = () => {}'); // не quiet: G.stage — это сам Mols, quiet затёр бы его autoChem
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = []; S.res.add('CO₂');
    for (const [e, dx] of [['C', 0], ['O', -40], ['O', 40]]) { const m = S.newMol(e, P.x + dx, P.y); m.age = 2; m.w = 0; } })()`);
  for (let i = 0; i < 60 * 30 && !g.ev(`G.stage.found.includes('CO₂')`); i++) g.ev('G.stage.tide = () => {}; update(1 / 60)');
  assert.equal(g.ev(`G.stage.found.includes('CO₂')`), true, 'Вселенная собрала O=C=O');
});
