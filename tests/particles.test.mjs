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
  g.step(10); // 0,17 с: нажатие «Начать» ещё не толчок
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inVoid'), true);
  g.ev('mouse.down = false'); g.step(20); // через VOID_MIN — первое же нажатие проявляет поле (строки не держат)
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inVoid'), false);
});

test('свет: два класса — мягкий и жёсткий; вялая раскачка — жёсткий только редким тепловым хвостом', () => {
  const g = loadGame();
  assert.equal(g.ev('PH_CLS.map(c => c.n).join()'), 'мягкий,жёсткий');
  g.ev(PREP.start); g.step(60 * 25);
  assert.equal(g.ev('G.stage.lit'), true);
  assert.deepEqual(json(g, 'G.stage.madeCls()'), [0], 'создан только мягкий');
  const cls = json(g, '[...Array(2000)].map(() => G.stage.phClass({ p: G.stage.phP() }))');
  const hard = cls.filter(c => c === 1).length / cls.length;
  assert.ok(hard > 0 && hard < .1, `жёсткий — хвост, но есть: ${hard}`);
});

test('свет: сильная раскачка создаёт оба класса, Вселенная повторяет созданные', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump(.95));
  const made = json(g, 'G.stage.madeCls()');
  assert.deepEqual(made, [0, 1], `создано классов: ${made}`);
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
  const one = json(g, `(() => { const S = G.stage; S.en = 5; S.hz = []; S.cz = []; S.hzCd = S.czCd = 999; S.populate = () => {}; for (const o of S.p) if (!o.dead && S.isQ(o)) o.dead = true; update(1 / 60);
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
  assert.deepEqual(json(g, `__hit('ph', 'ph', 0)`).born, ['e', '~e']); // лестница 1–4 без нуля: взял пару — уже ступень 1
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
  g.ev(`(() => { const S = G.stage; for (const c of [0, 1, 1, 0, 0]) S.absorb(S.mk('ph', false, P.x + 3, P.y, 0, S.T * (PH_CLS[c].x + .5))); })()`);
  assert.deepEqual(json(g, 'G.stage.caught'), [3, 2]);
});

// Вселенная умеет только то, что игрок создал сам: без его ударов тяжёлое (и закрытые поколения) в мире не появляется
const HEAVY = ['H', 'W', 'Z', 't', 'b', 'c', 's', 'mu', 'ta'];
function worldKinds(g, secs) {
  return json(g, `(() => { const seen = new Set(); for (let i = 0; i < 60 * ${secs}; i++) { update(1 / 60); for (const o of G.stage.p) if (!o.dead) seen.add(o.sp); } return [...seen]; })()`);
}

test('Хиггс: H, Z, W сами не рождаются, пока игрок их не создал', () => {
  const g = toField();
  g.ev(`['e', 'u', 'd', 'g'].forEach(k => Codex.see(k)); const S = G.stage; S.rs.g = 1; S.gOn = true; S.rs.coll = 1;
    S.ep = 1; S.newEpochState(1); S.hig = 1; S.higT = 5; S.T = EPOCHS[1].floor * 1.5; S.epT = 60; S.epDone = false;`);
  const kinds = worldKinds(g, 40);
  assert.deepEqual(HEAVY.filter(sp => kinds.includes(sp)), [], `в мире: ${kinds}`);
});

test('Распады: закрытое поколение и не созданное тяжёлое Вселенная за игрока не рождает (и не падает)', () => {
  const g = toField();
  g.ev(`['e', 'u', 'd', 'g', 'H', 'W', 'Z'].forEach(k => Codex.see(k)); const S = G.stage; S.rs.coll = 1; S.ep = 2; S.hig = 1; S.T = 40; S.epT = 50; S.need2 = ['c', 'ta', 't']; S.epDone = false;`);
  assert.equal(g.ev('G.stage.hotTarget()'), null);
  const kinds = worldKinds(g, 20);
  assert.deepEqual(['t', 'c', 's', 'mu', 'ta', 'b'].filter(sp => kinds.includes(sp)), [], `в мире: ${kinds}`);
});

test('Распады: созданное игроком тяжёлое Вселенная повторяет у горячей точки', () => {
  const g = toField();
  g.ev(`['e', 'u', 'd', 'g', 'c', 's', 't'].forEach(k => Codex.see(k)); const S = G.stage; S.ep = 2; S.hig = 1; S.T = 10; S.epT = 5; S.need2 = ['t']; S.epDone = false;`);
  assert.equal(g.ev('G.stage.hotTarget()'), 't'); // руками уже не родить: 2·173 ГэВ больше поля
});

test('Распады: цель t, которого игрок не создал, меняется на выполнимую', () => {
  const g = toField();
  g.ev(`G.stage.need2 = ['b', 'mu', 't']`);
  const n = json(g, 'G.stage.reachNeed2()');
  assert.equal(n.length, 3); assert.ok(!n.includes('t'), String(n));
  g.ev(`Codex.see('t')`);
  assert.ok(json(g, 'G.stage.reachNeed2()').includes('t'));
});

test('обучение: такт → свет ловится сам → три удара → снимок новой частицы → обычный забег', () => {
  const g = loadGame();
  g.ev(`document.getElementById('tutgo').onclick()`);
  assert.equal(g.ev('G.tutor'), true);
  g.ev(PREP.pump(.7));
  g.step(30);
  assert.equal(g.ev('G.stage.tut.i'), 1);
  g.step(60 * 3); // фотон регистрируется сам, как в игре — без снимка
  assert.equal(g.ev(`Codex.has('ph')`), true);
  g.ev(`(() => { const S = G.stage; for (let k = 0; k < TUT_ABS; k++) S.absorb(S.mk('ph', false, P.x + 3, P.y, 0, S.T * 3)); })()`);
  g.step(5);
  assert.equal(g.ev('G.stage.tut.i'), 2);
  g.ev(PREP.hit);
  for (const k of [0, 1, 4]) g.ev(`__hit('ph', 'ph', ${k}, Math.max(G.stage.en, ${k}))`);
  g.step(5);
  assert.equal(g.ev('G.stage.tut.i'), 3);
  g.ev(`(() => { const S = G.stage; S.mk('e', false, P.x, P.y, 0, .1).born = 1; S.shotCd = 0; S.snapshot(); })()`);
  g.step(60 * 4, true);
  assert.equal(g.ev('G.tutor'), false);
  assert.equal(g.store.get('proto.tut'), '1');
  assert.equal(g.ev('G.stage.tut'), null);
});

test('рецепт в задании: поколение II — только пара, сила «?»; после двух промахов — целиком; открытое раньше — сразу целиком', () => {
  const setup = g => g.ev(`['e', 'u', 'd', 'g', 'H', 'W', 'Z'].forEach(k => Codex.see(k)); const S = G.stage; S.rs.coll = 1; S.ep = 2; S.hig = 1; S.T = 40; S.epT = 50; S.need2 = ['mu', 'c', 'ta']; S.epDone = false;`);
  const step = g => json(g, `(s => ({ h: s.h, k: s.rx && s.rx.k }))(G.stage.steps()[0])`);
  const g = toField();
  setup(g);
  let s = step(g);
  assert.equal(s.k, -1, 'сила не названа');
  assert.match(s.h, /два фотона, подобрав силу удара/);
  g.ev(`__hit('ph', 'ph', 1)`); // родился e, а не μ — промах
  assert.equal(step(g).k, -1, 'один промах — рецепт ещё наполовину');
  g.ev(`__hit('ph', 'ph', 1)`);
  s = step(g);
  assert.equal(s.k, 2, 'два промаха — рецепт целиком');
  assert.match(s.h, /два фотона на 2 ⚡/);

  const g2 = toField({ storage: { protoCodex: JSON.stringify(['ph', 'mu']) } });
  setup(g2);
  assert.equal(step(g2).k, 2, 'μ уже открыт в прошлом забеге — рецепт сразу целиком');
});

test('частицы: удару не хватает на массу — словами и ⚡, без ГэВ: «остыло» или «сильнее», а не «мало энергии» (запас ⚡ ни при чём)', () => {
  const g = toField();
  g.ev(`(() => { const S = G.stage; S.hig = 1; for (const k of ['e', 'u', 'd', 'mu', 'c', 's', 'ta', 't', 'b']) { Codex.see(k); Codex.run.add(k); } })()`);
  g.ev('G.stage.T = 20');
  assert.match(g.ev(`G.stage.cellWhy({ c: 't' }, G.stage.lvE(4), false)`), /^остыло: на неё удара уже не хватит$/);
  g.ev('G.stage.T = 200');
  const why = g.ev(`G.stage.cellWhy({ c: 't' }, G.stage.lvE(1), false)`), k = +(why.match(/^нужен удар сильнее: (\d)⚡$/) || [])[1];
  assert.ok(k > 1, 'подсказка называет ступень ⚡: ' + why);
  assert.equal(g.ev(`G.stage.cellWhy({ c: 't' }, G.stage.lvE(${k}), false)`), '', `на ${k}⚡ уже рождается`);
  assert.notEqual(g.ev(`G.stage.cellWhy({ c: 't' }, G.stage.lvE(${k - 1}), false)`), '', `на ${k - 1}⚡ ещё нет`);
  assert.equal(g.ev(`G.stage.cellWhy({ c: 't' }, G.stage.lvE(4), false)`), '');
});
