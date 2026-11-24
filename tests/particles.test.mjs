// Уровень частиц: пустота, созданный свет, ступени удара, матрица рождения, обучение, регрессии.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const json = (g, expr) => JSON.parse(g.ev(`JSON.stringify(${expr})`));

// забег до открытого поля: старт → раскачка → свет исследован и измерен
function toField(opts = {}) {
  const g = loadGame(opts);
  g.ev(PREP.start); g.ev(PREP.pump(opts.maxA ?? .9)); g.ev(PREP.light);
  g.ev(`Codex.see('ph')`); g.ev(PREP.hit);
  return g;
}

test('пустота: до нажатия нет поля, нажатие проявляет поле и становится первым толчком', () => {
  const g = loadGame();
  g.ev(`document.getElementById('go').onclick()`);
  g.step(60 * 5, true);
  assert.equal(g.ev('G.stage.inVoid'), true);
  assert.equal(g.ev('G.stage.inf.go'), false);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inVoid'), false);
  assert.equal(g.ev('G.stage.inf.go'), true);
  assert.equal(g.ev('G.stage.inf.hold'), true);
});

test('пустота: слишком раннее нажатие не считается', () => {
  const g = loadGame();
  g.ev(`document.getElementById('go').onclick()`);
  g.step(20);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inVoid'), true);
});

test('свет: вялая раскачка создаёт только мягкий — и Вселенная рождает только его', () => {
  const g = loadGame();
  g.ev(PREP.start); g.step(60 * 25);
  assert.equal(g.ev('G.stage.lit'), true);
  assert.deepEqual(json(g, 'G.stage.madeCls()'), [0]);
  const cls = json(g, '[...Array(300)].map(() => G.stage.phClass({ p: G.stage.phP() }))');
  assert.ok(cls.every(c => c === 0), 'все фотоны Вселенной — мягкие');
});

test('свет: сильная раскачка создаёт несколько классов, Вселенная повторяет только созданные', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump(.95));
  const made = json(g, 'G.stage.madeCls()');
  assert.ok(made.length >= 3, `создано классов: ${made}`);
  const cls = new Set(json(g, '[...Array(400)].map(() => G.stage.phClass({ p: G.stage.phP() }))'));
  for (const c of cls) assert.ok(made.includes(c), `класс ${c} не создан игроком`);
});

test('поле включается, только когда свой свет измерен', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump());
  g.ev(`(() => { const S = G.stage; S.kn += 500; S.buy(S.shopItems().findIndex(it => it.r && it.r.k === 'ph')); })()`);
  assert.equal(g.ev('G.stage.fieldOn()'), false);
  g.ev('for (const c of G.stage.madeCls()) G.stage.measure(c)');
  assert.equal(g.ev('G.stage.fieldOn()'), true);
});

test('ступени удара: каждая стоит 1 ⚡, одиночный квант не заряжается', () => {
  const g = toField();
  const r = [1, 2, 3, 4].map(k => json(g, `__hit('ph', 'ph', ${k})`));
  r.forEach((x, i) => { assert.equal(x.lv, i + 1); assert.equal(x.spent, i + 1); });
  // один квант в поле — ступени не растут, ⚡ не тратится
  const one = json(g, `(() => { const S = G.stage; S.en = 5; for (const o of S.p) if (!o.dead && S.isQ(o)) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T); A.born = 1; A.cd = 2; mouse.clicked = true; mouse.down = true; __step(180);
    const r = { cap: S.focus ? S.focus.cap.length : 0, lv: S.focus ? S.focus.lv || 0 : 0, en: S.en }; mouse.down = false; __step(5); return r; })()`);
  assert.deepEqual(one, { cap: 1, lv: 0, en: 5 });
});

test('ступени удара: без энергии заряд встаёт на текущей ступени', () => {
  const g = toField();
  const r = json(g, `(() => { const S = G.stage; S.en = 2; for (const o of S.p) if (!o.dead && S.isQ(o)) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T), B = S.mk('ph', false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    mouse.clicked = true; mouse.down = true; __step(60 * 5); const r = { lv: S.focus.lv, en: S.en, dry: S.st.dry }; mouse.down = false; __step(5); return r; })()`);
  assert.equal(r.lv, 2); assert.equal(r.en, 0); assert.ok(r.dry >= 1);
});

test('матрица до Хиггса: γ+γ → e, закрытые поколения откатываются вниз, 4 ⚡ — три струи', () => {
  const g = toField();
  assert.deepEqual(json(g, `__hit('ph', 'ph', 0)`).born, []);
  assert.deepEqual(json(g, `__hit('ph', 'ph', 1)`).born, ['e', '~e']);
  assert.deepEqual(json(g, `__hit('ph', 'ph', 2)`).born, ['e', '~e']); // μ закрыт, пока не снят e
  assert.deepEqual(json(g, `__hit('ph', 'ph', 4)`).born, ['g', 'u', '~u']);
});

test('матрица: таблица клеток до и после Хиггса', () => {
  const g = toField();
  const table = () => json(g, `Object.fromEntries(['phph', 'gph', 'gg'].map(kd => [kd, [1, 2, 3, 4].map(k => { const r = G.stage.pickCell(kd, k, G.stage.lvE(k), false); return r.c ? G.stage.cellSym(r) : '—'; })]))`);
  g.ev(`['e', 'u', 'd', 'mu', 'c', 's'].forEach(k => Codex.see(k))`);
  assert.deepEqual(table(), { phph: ['e', 'μ', 'τ', 'u + g'], gph: ['u', 'c', 't', 't + g'], gg: ['d', 's', 'b', 'b'] });
  g.ev('G.stage.hig = 1; G.stage.T = 90');
  assert.deepEqual(table(), { phph: ['e', 'μ', 'τ', 'W⁺W⁻'], gph: ['u', 'c', 't', 't + g'], gg: ['d', 's', 'b', 'H'] });
});

test('матрица: причина отката называет закрытую клетку', () => {
  const g = toField();
  assert.deepEqual(json(g, `(() => { const r = G.stage.pickCell('phph', 3, G.stage.lvE(3), false); return [r.c, r.k, r.why]; })()`), ['e', 1, 'τ: сначала μ']);
  assert.deepEqual(json(g, `(() => { const r = G.stage.pickCell('gg', 4, G.stage.lvE(4), false); return [r.c, r.why]; })()`), ['d', 'H: после Хиггса']);
});

test('глюон создаётся тремя струями и не рождается сам до создания', () => {
  const g = toField();
  assert.equal(g.ev(`G.stage.p.some(o => !o.dead && o.sp === 'g')`), false);
  // кварки, аннигилируя сами, до создания глюона дают фотоны
  const ann = json(g, `(() => { const S = G.stage, a = S.mk('u', false, 5, 5, 0, 1), b = S.mk('u', true, 5, 5, Math.PI, 1), n = S.p.length; S.annihilate(a, b, true); return S.p.slice(n).map(o => o.sp); })()`);
  assert.deepEqual(ann, ['ph', 'ph']);
  assert.ok(json(g, `__hit('ph', 'ph', 4)`).born.includes('g'));
});

test('счётчик «Поймано γ» растёт при поглощении', () => {
  const g = toField();
  g.ev(`(() => { const S = G.stage; for (const c of [0, 1, 1, 2]) S.absorb(S.mk('ph', false, P.x + 3, P.y, 0, S.T * (PH_CLS[c].x + .5))); })()`);
  assert.deepEqual(json(g, 'G.stage.caught'), [1, 2, 1, 0]);
});

test('регрессия: «Распады» с закрытым поколением не падают (genFirst)', () => {
  const g = toField();
  g.ev(`['e', 'u', 'd', 'g', 'H', 'W', 'Z'].forEach(k => Codex.see(k)); const S = G.stage; S.ep = 2; S.hig = 1; S.T = 40; S.epT = 50; S.need2 = ['c', 'ta', 't']; S.epDone = false;`);
  assert.equal(g.ev(`G.stage.genFirst('ta')`), 'mu');
  assert.equal(g.ev(`G.stage.genFirst('t')`), 'c');
  g.step(60 * 20, true); // раньше — TypeError на каждом кадре
});

test('обучение: такт → снимок → сбор → три удара → обычный забег', () => {
  const g = loadGame();
  g.ev(`document.getElementById('tutgo').onclick()`);
  assert.equal(g.ev('G.tutor'), true);
  g.ev(PREP.pump(.7));
  g.step(30);
  assert.equal(g.ev('G.stage.tut.i'), 1);
  g.ev(`Codex.see('ph')`); g.step(5);
  assert.equal(g.ev('G.stage.tut.i'), 2);
  g.ev(`(() => { const S = G.stage; for (let k = 0; k < TUT_ABS; k++) S.absorb(S.mk('ph', false, P.x + 3, P.y, 0, S.T * 3)); })()`);
  g.step(5);
  assert.equal(g.ev('G.stage.tut.i'), 3);
  g.ev(PREP.hit);
  for (const k of [0, 1, 4]) g.ev(`__hit('ph', 'ph', ${k}, Math.max(G.stage.en, ${k}))`);
  g.step(60 * 4, true);
  assert.equal(g.ev('G.tutor'), false);
  assert.equal(g.store.get('proto.tut'), '1');
  assert.equal(g.ev('G.stage.tut'), null);
});
