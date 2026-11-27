// Второе ревью, № 6 и № 7 — «Молекулы»: диметиловый эфир CH₃–O–CH₃ — своё соединение каталога (органика, не этанол);
// твои нейтральные C, N, O из «Атомов» — фора на старте, а недостающие тяжёлые Вселенная приносит по одному и не сразу.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toAtoms(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  return g;
}
const toMols = (seed = 3) => { const g = toAtoms(seed); g.ev('advance(); G.trans = 99'); g.step(240); return g; };
const J = (g, expr) => JSON.parse(g.ev(`JSON.stringify(${expr})`)); // объект из игры — в объект теста (иначе deepEqual видит чужие прототипы)
// собрать молекулу рукой без бросков: связь за связью (merge), водород — во все свободные связи
const BUILD = `globalThis.__build = (plan) => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
  const mol = S.newMol(plan[0], P.x, P.y); mol.age = 2; mol.w = 0;
  for (const [i, el, kk] of plan.slice(1)) { const k = kk ?? mol.atoms[i].b.findIndex(x => x < 0), a = S.newMol(el, P.x + 40, P.y); a.age = 2;
    if (!S.merge(mol, i, k, a, 0, 0, 'hand')) throw new Error('не встало: ' + el); }
  for (let i = 0; i < mol.atoms.length; i++) for (let k = 0; k < mol.atoms[i].b.length; k++) if (mol.atoms[i].b[k] < 0) {
    const h = S.newMol('H', P.x + 40, P.y); h.age = 2; if (!S.merge(mol, i, k, h, 0, 0, 'hand')) h.dead = true; }
  S.m = S.m.filter(m => !m.dead); return { f: S.formula(mol), id: S.ident(mol) && S.ident(mol).f, free: S.freeSlots(mol) }; };`;
const heavyFree = `G.stage.m.filter(m => !m.dead && m.atoms.length === 1 && 'CNO'.includes(m.atoms[0].el))`;

test('второе ревью № 7: диметиловый эфир CH₃–O–CH₃ — соединение каталога и органика; этанол — отдельно', () => {
  const g = toMols(); g.ev('G.stage.tide = () => {}; G.stage.autoChem = () => {}'); g.ev(BUILD);
  const step = () => g.ev(`G.stage.steps().find(s => /органик/.test(s.t)).d`);
  assert.equal(step(), false);
  // O в середине, оба углерода на нём: две связи C–O, связи C–C нет
  const e = J(g, `__build(['O', [0, 'C'], [0, 'C']])`);
  assert.deepEqual(e, { f: 'C₂H₆O', id: 'CH₃OCH₃', free: 0 }, JSON.stringify(e));
  assert.ok(g.ev(`G.stage.found.includes('CH₃OCH₃')`), 'эфир открыт');
  assert.equal(g.ev(`G.stage.found.includes('C₂H₅OH')`), false, 'эфир — не этанол');
  assert.equal(step(), true, 'эфир закрывает шаг органики (две связи C–O)');
  assert.match(g.ev(`G.stage.floats.map(f => f.txt).join(' | ')`), /НОВОЕ: CH₃OCH₃ · диметиловый эфир/);
  // C–C–O (кислород — против связи C–C, иначе водороды тесно): этанол — своё соединение, эфир его не подменяет
  const a = J(g, `__build(['C', [0, 'C'], [1, 'O', 2]])`);
  assert.deepEqual(a, { f: 'C₂H₆O', id: 'C₂H₅OH', free: 0 }, JSON.stringify(a));
  assert.ok(g.ev(`G.stage.found.includes('C₂H₅OH')`), 'этанол открыт');
  // в Кодексе у обоих — факт и подсказка, чем они различаются
  const card = f => g.ev(`(() => { const c = COMP.find(x => x.f === '${f}'); return [MOL_FACT[c.f] || '', molHow(c)]; })()`);
  assert.match(card('CH₃OCH₃')[0], /межзвёздных/); assert.match(card('CH₃OCH₃')[1], /оба — на кислороде/);
  assert.match(card('C₂H₅OH')[1], /связаны между собой/);
  assert.ok(g.ev(`ORGANIC.includes('CH₃OCH₃') && ORGANIC.includes('C₂H₅OH')`));
});

test('второе ревью № 6: твои C, N, O из «Атомов» — фора на старте и строка о ней; Вселенная их сразу не досыпает', () => {
  const g = toAtoms();
  // все ионы «Атомов» голые, кроме девяти нейтральных у тебя: C ×3, N ×2, O ×4
  g.ev(`(() => { const S = G.stage; for (const i of S.ions) i.ne = 0; let k = 0;
    for (const [Z, n] of [[6, 3], [7, 2], [8, 4]]) for (let j = 0; j < n; j++, k++) S.ions.push(Object.assign(S.ion(Z, P.x + (k % 3 - 1) * 1.2, P.y + ((k / 3 | 0) - 1) * 1.2, 1), { ne: Z })); })()`);
  g.ev('advance(); G.trans = 99');
  assert.equal(g.ev('G.stage.key'), 'molecules');
  assert.deepEqual(J(g, 'G.stage.brought'), { C: 3, N: 2, O: 4 });
  assert.equal(g.ev(`${heavyFree}.length`), 9, 'в бульоне — ровно твои тяжёлые: Вселенная своих не подложила');
  assert.ok(g.ev(`${heavyFree}.every(m => m.mine)`));
  g.step(2);
  const fl = g.ev(`G.stage.floats.map(f => f.txt)`);
  assert.ok(fl.includes('из «Атомов»: C ×3 · N ×2 · O ×4'), fl.join(' | '));
  assert.ok(fl.includes('всё своё: от Вселенной — водород, тяжёлые редко'), fl.join(' | '));
  // израсходовал своё — следующий тяжёлый придёт не раньше M_DRIP с
  g.ev('G.stage.autoChem = () => {}'); g.step(60);
  g.ev(`for (const m of ${heavyFree}) m.dead = true; G.stage.m = G.stage.m.filter(m => !m.dead); globalThis.__t0 = G.stage.clock;
    globalThis.__new = []; const nm = G.stage.newMol.bind(G.stage); G.stage.newMol = (el, x, y) => { if (el !== 'H') __new.push([el, G.stage.clock]); return nm(el, x, y); }`);
  g.step(60 * 20);
  const got = g.ev('__new.map(([el, t]) => [el, +(t - __t0).toFixed(2)])'), DRIP = g.ev('M_DRIP');
  assert.ok(got.length >= 2, 'тяжёлые всё же приходят: ' + JSON.stringify(got));
  assert.ok(got[0][1] >= DRIP - .05, 'не сразу: ' + JSON.stringify(got));
  for (let i = 1; i < got.length; i++) assert.ok(got[i][1] - got[i - 1][1] >= DRIP - .05, 'по одному раз в M_DRIP с: ' + JSON.stringify(got));
  assert.ok(got.length <= Math.floor(20 / DRIP) + 1, 'не досыпка: ' + JSON.stringify(got));
});

test('второе ревью № 6: пустой перенос — тяжёлых на старте нет, Вселенная приносит их не раньше M_DRIP0 с', () => {
  const g = toAtoms(5);
  g.ev('for (const i of G.stage.ions) i.ne = 0'); // в «Атомах» не нейтрализовал ничего
  g.ev('advance(); G.trans = 99');
  assert.deepEqual(J(g, 'G.stage.brought'), { C: 0, N: 0, O: 0 });
  assert.equal(g.ev(`G.stage.m.filter(m => m.atoms.some(a => a.el !== 'H')).length`), 0, 'газ Вселенной — водород');
  g.ev(`globalThis.__new = []; const nm = G.stage.newMol.bind(G.stage); G.stage.newMol = (el, x, y) => { if (el !== 'H') __new.push([el, G.stage.clock]); return nm(el, x, y); }`);
  g.step(2);
  assert.ok(g.ev(`G.stage.floats.map(f => f.txt)`).includes('из «Атомов»: ни C, ни N, ни O'));
  g.step(60 * 30);
  const got = g.ev('__new'), D0 = g.ev('M_DRIP0'), DRIP = g.ev('M_DRIP');
  assert.ok(got.length >= 3, 'приходят: ' + JSON.stringify(got));
  assert.ok(got[0][1] >= D0 - .05, 'первый — не раньше M_DRIP0: ' + JSON.stringify(got));
  assert.ok(got.length <= Math.floor((30 + 4 / 60 - D0) / DRIP) + 1, 'редко: ' + JSON.stringify(got));
});

test('второе ревью № 6: только что принесённый тяжёлый атом Вселенная M_GIFT с не берёт — он игроку', () => {
  const g = toMols(); g.ev('G.stage.tide = () => {}');
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = []; S.res.add('CH₄');
    const c = S.newMol('C', P.x, P.y); c.age = 2; c.w = 0; c.gift = S.t; globalThis.__C = c;
    for (let i = 0; i < 10; i++) { const h = S.newMol('H', P.x + 20 + (i % 5) * 9, P.y - 15 + (i / 5 | 0) * 30); h.age = 2; } })()`);
  g.ev('G.stage.autoCd = 0; G.stage.autoChem(1 / 60)');
  assert.ok(!(g.ev('__C.auto') > 0), 'свежий углерод — не трогает');
  g.ev('__C.gift = G.stage.t - M_GIFT - 1; G.stage.autoCd = 0; G.stage.autoChem(1 / 60)');
  assert.ok(g.ev('__C.auto') > 0, 'через M_GIFT с — уже бульон Вселенной');
});

test('ревью CO₂: Вселенная достраивает начатое и издалека — второй O к C=O с 120 ед.', () => {
  for (const seed of [3, 4, 11]) {
    const g = toMols(seed); g.ev('G.stage.tide = () => {}');
    g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = []; S.res.add('CO₂');
      const c = S.newMol('C', P.x, P.y), o = S.newMol('O', P.x + 30, P.y); c.age = o.age = 2;
      if (!S.merge(c, 0, 0, o, 0, 1, 'auto', 2)) throw new Error('C=O не встало');
      S.m = S.m.filter(m => !m.dead); const co = S.m[0]; co.vx = co.vy = co.w = 0;
      const o2 = S.newMol('O', co.x - 120, co.y); o2.age = 2; o2.w = 0; })()`);
    assert.equal(g.ev(`G.stage.m.map(m => G.stage.formula(m)).sort().join(' ')`), 'CO O');
    for (let i = 0; i < 60 * 25 && !g.ev(`G.stage.found.includes('CO₂')`); i++) g.ev('update(1 / 60)');
    assert.ok(g.ev(`G.stage.found.includes('CO₂')`), `сид ${seed}: O=C=O достроен`);
  }
});

test('ревью «Синтеза»: бросок Вселенной долетает до касания со скоростью M_AUTO_V — тяжёлое с тяжёлым с 69 ед. связывается', () => {
  const g = toMols(); g.ev('G.stage.tide = () => {}');
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = []; S.res.add('CH₃OH');
    const c = S.newMol('C', P.x, P.y), o = S.newMol('O', P.x + 69, P.y); c.age = o.age = 2; c.w = o.w = 0; S.autoCd = 0; })()`);
  let bonded = false;
  for (let i = 0; i < 60 * 3 && !bonded; i++) { g.ev('update(1 / 60)'); bonded = g.ev('G.stage.m.some(m => m.bonds.length > 0)'); }
  assert.ok(bonded, 'C–O с 69 ед. — связь, а не отскок от барьера');
});

test('второе ревью № 6: с титула — стартовый набор C, N, O (как средний итог «Атомов») и строка «с нуля»', () => {
  // проходимость с титула и с пустым переносом: бот из molecules.test.mjs (пустой перенос — сам тот тест; с титула — проверено
  // вручную, 180–280 с из 400; в набор не включён — полторы минуты)
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`jumpTo(STAGES.findIndex(s => s.key === 'molecules'))`);
  assert.equal(g.ev('G.stage.brought'), null);
  const n = el => g.ev(`${heavyFree}.filter(m => m.atoms[0].el === '${el}').length`);
  assert.deepEqual([n('C'), n('N'), n('O')], [2, 2, 3]);
  assert.equal(g.ev(`G.stage.m.filter(m => m.atoms.some(a => a.el !== 'H')).length`), 7, 'кроме набора — водород');
  g.step(2);
  const fl = g.ev(`G.stage.floats.map(f => f.txt)`);
  assert.ok(fl.includes('с нуля: C ×2 · N ×2 · O ×3 от Вселенной'), fl.join(' | '));
});
