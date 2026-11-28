// «Синтез» «Молекул» (REVIEW_NEON_4 «Молекулы» №1, №5): бросок Вселенной знает, ради какого закона брошен, и ставит
// кратность, нужную цели (включённый «Синтез CH₃OH» перехватывал бросок под CO₂ и ставил C–O); законы эфира и этанола
// не лепят вечных тупиков; склеенное игроком защищено 8 с, как взятое в руку.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function mols(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'molecules') g.ev('advance(); G.trans = 99');
  g.ev('Cine.clear(); Spot.clear()');
  g.step(60);
  // пустой мир без притока: только то, что положит тест
  g.ev(`(() => { const S = G.stage; S.tide = () => {}; for (const m of S.m) m.dead = true; S.m = []; })()`);
  return g;
}
const laws = (g, fs) => g.ev(`(() => { const S = G.stage; for (const f of ${JSON.stringify(fs)}) { S.found.includes(f) || S.found.push(f); S.res.add(f); } })()`);
const put = (g, els) => g.ev(`(() => { const S = G.stage; ${JSON.stringify(els)}.forEach((e, k) => { const m = S.newMol(e, P.x + (k % 5 - 2) * 22, P.y + (Math.floor(k / 5) - 2.5) * 22); m.age = 2; m.vx = m.vy = 0; }); })()`);
// что собрано за s секунд: насыщенные соединения и висящие обрывки. Притока нет, и разлетевшееся за кадр Вселенная не трогает —
// куски держит «коробка» в кадре (отражение скорости у края), иначе тест мерил бы разлёт, а не химию
const brew = (g, s) => JSON.parse(g.ev(`(() => { const S = G.stage, made = {}; const am = S.afterMerge.bind(S);
  S.afterMerge = function (h, src, x, y) { am(h, src, x, y); if (!this.freeSlots(h)) { const c = this.ident(h); const k = c ? c.f : this.formula(h) + '?'; made[k] = (made[k] || 0) + 1; } };
  for (let i = 0; i < 60 * ${s}; i++) { for (const m of S.m) { if (Math.abs(m.x - P.x) > 110 && (m.x - P.x) * m.vx > 0) m.vx *= -1; if (Math.abs(m.y - P.y) > 65 && (m.y - P.y) * m.vy > 0) m.vy *= -1; } update(1 / 60); if (Spot.on) Spot.end(); if (Cine.on) Cine.clear(); }
  const frag = S.m.filter(m => !m.dead && m.atoms.length > 1 && S.freeSlots(m)).map(m => S.piece(m).b.map(b => S.piece(m).el[b[0]] + b[2] + S.piece(m).el[b[1]]).join(','));
  return JSON.stringify({ made, frag }); })()`));

test('«Синтез»: включённый CH₃OH не перехватывает бросок под CO₂ — тот ставит C=O, а не C–O', () => {
  let co2 = 0; const bad = [];
  for (const seed of [3, 5, 7]) {
    const g = mols(seed);
    laws(g, ['CH₃OH', 'CO₂']);
    put(g, ['C', 'O', 'O', 'C', 'O', 'O', 'C', 'O', 'O']); // водорода нет: метанол не достроить, CO₂ — можно
    // каждый бросок под CO₂ — какой связью сцепился
    g.ev(`(() => { const S = G.stage, mg = S.merge.bind(S); S.lawLog = [];
      S.merge = function (A, ia, sa, B, ib, sb, src, n) { const w = (A.auto > 0 && A.law) || (B.auto > 0 && B.law); if (src === 'auto') S.lawLog.push([w, n]); return mg(A, ia, sa, B, ib, sb, src, n); }; })()`);
    const r = brew(g, 90);
    co2 += r.made['CO₂'] || 0;
    for (const [w, n] of JSON.parse(g.ev('JSON.stringify(G.stage.lawLog)'))) if (w === 'CO₂' && n !== 2) bad.push(n);
  }
  assert.ok(co2 >= 3, `CO₂ собрано ${co2} (раньше 0 — бросок под CO₂ брал закон CH₃OH и ставил C–O)`);
  assert.deepEqual(bad, [], 'бросок под CO₂ — всегда двойная связь');
});

test('«Синтез»: бросок под цель ставит её кратность и для разных связей одной молекулы (формамид: C=O и C–N)', () => {
  const g = mols();
  const r = JSON.parse(g.ev(`(() => { const S = G.stage, C = S.newMol('C', 0, 0), O = S.newMol('O', 30, 0), N = S.newMol('N', 60, 0);
    return JSON.stringify([S.bondFor('HCONH₂', C, 0, O, 0), S.bondFor('HCONH₂', C, 0, N, 0), S.bondFor('CO₂', C, 0, O, 0), S.bondFor('CH₃OH', C, 0, O, 0), S.bondFor('CH₃OH', C, 0, N, 0)]); })()`));
  assert.deepEqual(r, [2, 1, 2, 1, 0]);
});

test('«Синтез» эфира: обрывок C–O — не вечный тупик, и последний H доходит до углерода — эфир собирается', () => {
  let made = 0;
  for (const seed of [3, 5, 7]) {
    const g = mols(seed);
    laws(g, ['CH₃OCH₃']);
    put(g, ['C', 'O', 'C', ...Array(22).fill('H')]); // лишний водород: последние M_HKEEP = 6 Вселенная оставляет игроку
    // раньше годилась пара кусков, только если связь любых их свободных атомов — часть цели; у C–O так не бывает никогда
    assert.notEqual(g.ev(`(() => { const S = G.stage, C = S.newMol('C', 900, 900), O = S.newMol('O', 960, 900), H = S.newMol('H', 990, 990);
      S.merge(C, 0, 0, O, 0, 0, null, 1); const CO = S.m.find(m => !m.dead && m.atoms.length === 2 && m.x > 800); const at = S.pairFor('CH₃OCH₃', CO, H);
      CO.dead = true; H.dead = true; return at; })()`), null, 'C–O + H — есть пара, ведущая к эфиру');
    made += brew(g, 150).made['CH₃OCH₃'] || 0;
  }
  // последнюю связь углерода в плоской раскладке заслоняют водороды соседней группы: бросок в центр куска бился о них всегда
  assert.equal(made, 3, `эфира собрано ${made} из 3`);
});

test('«Синтез»: твоя склейка защищена 8 с — закон не уводит CH из-под руки', () => {
  const g = mols();
  laws(g, ['CH₄']);
  const r = JSON.parse(g.ev(`(() => { const S = G.stage;
    const C = S.newMol('C', P.x, P.y), H = S.newMol('H', P.x - 30, P.y); C.age = H.age = 5; C.w = H.w = 0;
    for (let k = 0; k < 8; k++) { const h = S.newMol('H', P.x + 40 + (k % 4) * 12, P.y - 30 + Math.floor(k / 4) * 60); h.age = 5; h.w = 0; }
    C.a = Math.PI - C.atoms[0].base; C.wp = C.atoms.map((_, i) => S.wpos(C, i));
    S.hold(H); H.held = false; S.predict(H, 40, 0); S.launch(H, 40, 0);
    let t0 = null, nAt6 = null;
    for (let i = 0; i < 60 * 12; i++) { update(1 / 60); if (Spot.on) Spot.end(); if (Cine.on) Cine.clear();
      const cm = S.m.find(m => !m.dead && m.atoms.some(a => a.el === 'C')), nH = cm ? cm.atoms.length - 1 : -1;
      if (nH >= 1 && t0 === null) t0 = S.t;
      if (t0 !== null && nAt6 === null && S.t - t0 > 6) nAt6 = nH; }
    return JSON.stringify({ t0, nAt6 }); })()`));
  assert.ok(r.t0 !== null, 'CH сложен рукой');
  assert.equal(r.nAt6, 1, 'раньше закон добавлял H через 1,5 с');
});
