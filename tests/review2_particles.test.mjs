// Второе ревью неона, «Частицы» (№7a, №7c, №8b, №11, №15): обучение учит тому, что делает игра (свет ловится сам,
// снимок — для нового); в эпохе 3 нет ложной плашки «для задания»; разогрев — оценка, а не выбор; эпоха 4 правда
// остывает (без «пола» 0,5 ГэВ), не успел — дальше без бонуса; поле Хиггса застывает за 3 с; у ступеней удара — только ⚡ (ГэВ убраны по просьбе игрока);
// в Кодексе — шпаргалка рецептов удара.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function field(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  g.ev('Cine.clear(); Cine.tick(99)');
  return g;
}
// всё, что за вызов code нарисовано через label (и hudBanner)
const drawn = (g, code) => g.ev(`(() => { const out = [], lb = label, hb = hudBanner;
  label = (t, ...r) => { out.push(String(t)); return lb(t, ...r); }; hudBanner = (b, k, n, line, ...r) => { out.push(String(k), String(n), String(line)); };
  try { ${code}; } finally { label = lb; hudBanner = hb; } return out; })()`);

test('№7a свет регистрируется сам, клик по свету — «снимать нечего», снимать учат на рождённой частице', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump(.7)); g.step(30);
  const st = g.ev('G.stage.steps().map(s => s.t + " | " + s.h)');
  assert.ok(!st.some(s => /фотон/.test(s) && /снимок/.test(s.split('|')[0])), `ни один шаг не просит снять фотон: ${st}`);
  assert.match(st[1], /кликать не нужно/);
  assert.match(st[4], /^Снять электрон/);
  // свет, который ещё не зарегистрирован, подсказка-жест не предлагает снимать
  assert.notEqual(g.ev(`(() => { const S = G.stage; S.learn.snapNew = false; const o = S.mk('ph', false, P.x + 1, P.y, 0, S.T); o.born = 1; const k = S.coachPick(); o.dead = true; return k && k.kind; })()`), 'snap');
  g.step(60 * 3);
  assert.equal(g.ev(`Codex.has('ph')`), true, 'фотон зарегистрировался сам');
  // клик по одному свету: «снимать нечего», ⚡ цела
  const said = g.ev(`(() => { const S = G.stage, out = [], f = S.float; for (const o of S.p) o.dead = true; S.p = []; S.tracks = [];
    S.float = (x, y, t, ...r) => { out.push(t); return f.call(S, x, y, t, ...r); };
    S.mk('ph', false, P.x, P.y, 0, S.T).born = 1; S.shotCd = 0; S.snapshot(); S.float = f; return out; })()`);
  assert.ok(said.some(t => /снимать нечего: свет ловится кругом/.test(t)), String(said));
  g.ev(`(() => { const S = G.stage; S.en = 3; S.mk('e', false, P.x, P.y, 0, .1).born = 1; S.shotCd = 0; S.snapshot(); })()`);
  assert.equal(g.ev(`Codex.has('e')`), true, 'снята рождённая частица');
  assert.equal(g.ev(`G.stage.steps()[4].d`), true, 'шаг «Снять электрон» засчитан');
});

test('№7c эпоха 3: у шагов нет плашки «для задания» — покупка не обязательна (и когда руками уже не родить)', () => {
  const g = field();
  g.ev(`(() => { ['e', 'u', 'd', 'g', 'H', 'W', 'Z', 'c', 's', 'b', 'mu', 'ta'].forEach(k => { Codex.see(k); Codex.run.add(k); }); const S = G.stage; S.rs.coll = 1;
    S.startEpoch(2); S.hig = 1; S.T = 40; S.need2 = ['c', 'mu', 'b']; S.hot = []; Cine.clear(); Cine.tick(99); })()`);
  assert.equal(g.ev('JSON.stringify(G.stage.steps().map(s => s.res))'), '[null,null,null]');
  assert.equal(g.ev('G.stage.taskRes()'), null);
  assert.ok(g.ev(`G.stage.steps()[0].h.includes('закон')`), 'закон по-прежнему назван как вариант');
  // t создан, но остыло: удару не хватает — горячая точка родит его и без закона, поэтому плашки нет и тут
  g.ev(`(() => { Codex.see('t'); const S = G.stage; S.need2 = ['t', 'b', 'c']; S.T = 5; })()`);
  assert.ok(g.ev(`2 * G.stage.mThr('t') > G.stage.Emax()`), 'руками t уже не родить');
  assert.equal(g.ev('G.stage.hotTarget()'), 't', 'Вселенная родит t у горячей точки сама');
  assert.equal(g.ev('G.stage.taskRes()'), null);
});

test('№8b разогрев — оценка качества, а не выбор профиля: слабый · хороший · отличный, больше — лучше', () => {
  assert.equal(loadGame().ev(`PROF.map(p => p.n).join(' · ')`), 'слабый · хороший · отличный');
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start);
  const bar = drawn(g, 'G.stage.drawHeat(1)');
  assert.ok(bar.some(t => /КАЧЕСТВО РАЗОГРЕВА|больше света — лучше/.test(t)), String(bar));
  assert.ok(!bar.some(t => /холодный|тёплый|горячий/.test(t)), `без «профилей»: ${bar}`);
  assert.ok(g.ev('PROF.every((p, i) => !i || (p.k[0] > PROF[i - 1].k[1]))'), 'каждая следующая оценка — строго горячее и светлее');
  g.ev(PREP.pump(.9)); g.ev('Cine.clear(); Cine.tick(99); G.stage.banner = 1');
  const ban = drawn(g, 'G.stage.drawBanner(1)');
  assert.ok(ban.some(t => /^Разогрев (слабый|хороший|отличный): /.test(t)), String(ban));
  assert.ok(g.ev(`G.stage.starPool(0).some(s => s.t === 'отличный разогрев')`));
});

test('№11 эпоха 4: Вселенная остывает за ~81 с без «пола»; не успел — сбережённое уходит дальше без бонуса', () => {
  const g = field();
  g.ev(`(() => { const S = G.stage; S.stock = 0; S.stockQ = []; S.udRes = []; S.startEpoch(3); S.T = EPOCHS[3].startT; Cine.clear(); Cine.tick(99);
    globalThis.__note = null; const n = Tally.note; Tally.note = function (kick, name, rows, ...r) { globalThis.__note = { kick, rows }; return n.call(this, kick, name, rows, ...r); }; })()`);
  const left = g.ev('G.stage.coolLeft()');
  assert.ok(left > 75 && left < 90, `остынет через ${left.toFixed(1)} с`);
  const clock = drawn(g, 'G.stage.drawClock(1)');
  assert.ok(clock.some(t => /^⏳ 1:[12]\d$/.test(t)), `часы — обратный отсчёт: ${clock}`);
  assert.ok(clock.some(t => /остынет через 1:[12]\d/.test(t)), `строка внизу: ${clock}`);
  // ничего не делаем: Вселенная не застывает на 0,5 ГэВ, а догорает
  const r = g.ev(`(() => { const S = G.stage; let t = 0, minT = 9; while (!S.advanced && t < 120) { update(1 / 60); t += 1 / 60; minT = Math.min(minT, S.T); } return { t, minT, failed: S.failed, done: S.epDone }; })()`);
  assert.equal(r.done, false);
  assert.ok(r.minT < .5, `ниже прежнего «пола»: ${r.minT}`);
  assert.ok(r.t > 75 && r.t < 90, `аннигиляция догорела за ${r.t.toFixed(1)} с`);
  assert.equal(r.failed, true, 'цель не выполнена');
  const S = 'G.stageI';
  const i0 = g.ev(S); g.step(60 * 4);
  assert.equal(g.ev(S), i0 + 1, 'и всё равно дальше — в «Адроны»');
  const note = g.ev('globalThis.__note');
  assert.match(note.kick, /ВРЕМЯ ВЫШЛО/);
  assert.ok(note.rows.some(row => row[0] === 'цель не выполнена'), JSON.stringify(note.rows));
});

test('№11 эпоха 4: цель выполнена — бонус есть; поле Хиггса застывает за 3 с', () => {
  const g = field();
  g.ev(`(() => { const S = G.stage; S.udRes = []; S.startEpoch(3); S.T = EPOCHS[3].startT; S.stockQ = Array.from({ length: 15 }, (_, i) => ({ fl: i % 3 ? 'u' : 'd', col: i % 3 })); S.stock = 15;
    S.rs.cp = 1; for (let k = 0; k < AUTO_TRIO; k++) S.addSafe(); Cine.clear(); Cine.tick(99); })()`);
  const r = g.ev(`(() => { const S = G.stage; let t = 0; while (!S.advanced && t < 120) { update(1 / 60); t += 1 / 60; } return { t, failed: S.failed, done: S.epDone }; })()`);
  assert.equal(r.done, true); assert.equal(r.failed, false);
  assert.ok(r.t < 30, `выполнил — догорает быстро: ${r.t.toFixed(1)} с`);
  assert.equal(g.ev('HIG_T'), 3);
  const g2 = field();
  g2.ev(`(() => { const S = G.stage; S.startEpoch(1); S.T = EPOCHS[1].startT; })()`);
  g2.step(60 * 3 + 2);
  assert.equal(g2.ev('G.stage.hig'), 1, 'поле застыло за 3 с');
});

test('№15 (пересмотрен по просьбе игрока) ступени удара — только ⚡, без ГэВ, и при остывании тоже; шпаргалка рецептов в Кодексе', () => {
  const g = field();
  const ring = () => drawn(g, `(() => { const S = G.stage, a = S.mk('ph', false, P.x + .2, P.y, 0, S.T), b = S.mk('ph', false, P.x - .2, P.y, 0, S.T); a.cap = b.cap = true;
    S.focus = { cap: [a, b], q: 0, E: 0, lv: 0, ang: 0, t: 0 }; S.drawField(400, 300, 40); S.focus = null; a.dead = b.dead = true; })()`);
  let L = ring();
  assert.ok(L.includes('4⚡'), `4⚡ в ${L}`);
  assert.ok(!/ГэВ|МэВ|√s/.test(L), `у удара нет энергии в цифрах: ${L}`);
  g.ev('G.stage.T = G.stage.T / 4');
  L = ring();
  assert.ok(L.includes('4⚡') && !/ГэВ|МэВ|√s/.test(L), `остыло — всё так же 4⚡, без ГэВ: ${L}`);
  // шпаргалка: открытое — символом, остальное «?»
  let sheet = g.ev('rxSheet()');
  for (const p of ['γ + γ', 'γ + g', 'g + g', '4⚡']) assert.ok(sheet.includes(p), p);
  assert.ok(!sheet.includes(g.ev('SM.mu.sym')), 'μ не открыт — не видно');
  g.ev(`Codex.see('e'); Codex.see('mu')`);
  sheet = g.ev('rxSheet()');
  assert.ok(sheet.includes(g.ev('SM.e.sym')) && sheet.includes(g.ev('SM.mu.sym')), 'открытое — символом');
  assert.ok(g.ev('CX.sm.empty').includes('Удар: пара квантов'), 'на вкладке «Частицы» Кодекса');
  assert.equal(loadGame().ev('rxSheet()'), '', 'пока свет не открыт — шпаргалки нет');
});
