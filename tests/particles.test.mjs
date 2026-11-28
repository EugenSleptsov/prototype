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

test('пустота: до нажатия нет поля; нажатие проявляет поле — у знающего жесты оно сразу первый толчок', () => {
  const g = loadGame({ storage: { 'proto.known': JSON.stringify(['gest:school']) } });
  g.ev(`document.getElementById('go').onclick()`);
  g.step(60 * 5, true);
  assert.equal(g.ev('G.stage.inVoid'), true);
  assert.equal(g.ev('G.stage.inf.go'), false);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inVoid'), false);
  assert.equal(g.ev('G.stage.school'), null, 'жесты освоены — школы нет');
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

test('пролог: та же чаша, что в «Рогатке», — бросок раскачивает, трение — это разогрев, свет — на проходах дна; перетянул — шарик вывалился', () => {
  const g = loadGame();
  g.ev(`Known.add('gest:school'); document.getElementById('go').onclick()`); g.step(110);
  g.ev('mouse.x = G.W / 2; mouse.clicked = true; mouse.down = true'); g.step(1);
  assert.equal(g.ev('G.stage.inf.hold'), true, 'первое нажатие — шарик пойман');
  assert.equal(g.ev('G.stage.inf.u'), 0);
  assert.equal(g.ev('stCanDrop()'), true, 'держишь — можно передумать');
  g.ev('mouse.x = G.stage.inf.p0[0] + .7 * slingFullPx()'); g.step(1);
  const aim = g.ev('G.stage.bowlAim(G.stage.inf)');
  assert.ok(aim > .5 && aim < 1, 'прицел: докуда долетит — ' + aim);
  g.ev(`globalThis.__pass = 0; const f = G.stage.infBounce.bind(G.stage); G.stage.infBounce = A => { __pass++; f(A); }`);
  const ph0 = g.ev('G.stage.p.length');
  g.ev('mouse.down = false'); g.step(1);
  assert.ok(g.ev('G.stage.inf.v') < 0, 'резинка вправо — шарик летит влево');
  g.step(60 * 4);
  assert.ok(g.ev('__pass') >= 3, 'качается туда-сюда через дно');
  assert.ok(g.ev('G.stage.p.length') > ph0, 'на проходах дна — свет');
  assert.ok(g.ev('G.stage.inf.H') > 0, 'трение разогревает');
  assert.ok(g.ev('G.stage.inf.A') < aim * .7, 'размах тает');
  // перетянул: шарик вывалился, новый — на дне
  g.ev('mouse.x = G.W / 2; mouse.clicked = true; mouse.down = true'); g.step(1);
  g.ev('mouse.x = G.stage.inf.p0[0] + (G.stage.inf.u > 0 ? -1 : 1) * slingFullPx()'); g.step(1);
  assert.ok(g.ev('G.stage.bowlAim(G.stage.inf)') > 1, 'прицел: за край');
  g.ev('mouse.down = false'); g.step(60);
  assert.equal(g.ev('G.stage.inf.snaps'), 1);
  g.step(60 * 1.5);
  assert.equal(g.ev('G.stage.inf.A'), 0, 'новый шарик лежит на дне');
});

test('пролог: не трогаешь — шарик лежит на дне, Вселенная выходит холодной', () => {
  const g = loadGame();
  g.ev(`Known.add('gest:school'); document.getElementById('go').onclick()`); g.step(110);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1); g.ev('mouse.down = false'); g.step(1); // пойман и отпущен без резинки
  g.step(60 * 30);
  assert.equal(g.ev('G.stage.lit'), true);
  assert.equal(g.ev('G.stage.inf.H'), 0);
  assert.equal(g.ev('G.stage.inf.pick.i'), 0, 'холодный разогрев');
});

test('глава «Свет»: после вспышки света раскачки — на одну шкалу ⚡ с запасом, каждый созданный класс есть, он летит прочь от чаши; пока шкала не полна — новый свет вспыхивает за кадром', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump(.9));
  assert.equal(g.ev('INF.life'), 25);
  const r = json(g, `(() => { const S = G.stage, L = S.p.filter(o => !o.dead && o.sp === 'ph' && !(o.fade >= 0));
    return { e: L.reduce((a, o) => a + PH_CLS[S.phClass(o)].e, 0), cls: [...new Set(L.map(o => S.phClass(o)))].sort(), made: S.madeCls().sort(),
      out: L.every(o => (o.x - P.x) * o.dx + (o.y - P.y) * o.dy >= 0), fading: S.p.filter(o => !o.dead && o.sp === 'ph' && o.fade >= 0).length }; })()`);
  const SE = g.ev('STASH_E');
  assert.ok(r.e >= SE && r.e < SE + 3, `свет на шкалу с запасом: ${r.e} ⚡`);
  assert.deepEqual(r.cls, r.made, 'каждый созданный класс — хотя бы один фотон');
  assert.ok(r.out, 'летит прочь от чаши');
  assert.ok(r.fading > 0, 'лишний свет раскачки остывает в фон, а не исчезает');
  const far = g.ev(`(() => { const S = G.stage, n0 = S.p.length; for (let i = 0; i < 20; i++) S.spawnQuantum(false); const R = Math.min(viewRadius(), refRadius()) * .9;
    return S.p.slice(n0).every(o => Math.hypot(o.x - P.x, o.y - P.y) >= R - .01); })()`);
  assert.equal(far, true, 'пока шкала не полна — пополнение за кадром');
});

test('круг заряда пары квантов: ступень 1 — пустой круг (0°), дальше по трети, 4 — полный; у тяжёлой пары круг линейный', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump());
  const r = json(g, `(() => { const S = G.stage, a = S.mk('ph', false, P.x, P.y, 0, 1), b = S.mk('ph', false, P.x, P.y, 0, 1), m = S.mk('e', false, P.x, P.y, 0, 1);
    const fq = { cap: [a, b] }, fh = { cap: [m, m] };
    return { q: [1, 2, 3, 4].map(k => +S.ringA(k / LV_N, fq).toFixed(3)), h: +S.ringA(.25, fh).toFixed(3) }; })()`);
  assert.deepEqual(r.q, [0, .333, .667, 1]);
  assert.equal(r.h, .25);
});

test('новое понятие — пауза и объяснение: первая горячая область в кадре ставит стоп-кадр с её описанием (раз за игру), не поверх ленты; в главах 1–2 областей нет', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev('Cine.clear(); Cine.tick(99)');
  g.ev('G.stage.tickChapter = () => {}'); g.step(60 * 5);
  assert.equal(g.ev('G.stage.chap'), 1); assert.equal(g.ev('G.stage.hz.length'), 0, 'в главах 1–2 областей нет');
  g.ev('G.stage.chap = 3; G.stage.hzSeen = false; G.stage.hzCd = 0; Cine.show("x", 5, 0, true)');
  g.step(60 * 4);
  assert.equal(g.ev('Spot.on'), false, 'поверх ленты стоп-кадра нет');
  g.ev('Cine.clear()'); g.step(2);
  assert.equal(g.ev('Spot.on && Spot.txt'), 'Горячая область');
  assert.match(g.ev('Spot.sub'), /свет рождается гуще/);
  assert.ok(g.ev('Spot.r') > 1, 'пятно — размером с область');
  g.ev('Spot.clear(); G.stage.hz = []; G.stage.hzSeen = false; G.stage.hzCd = 0'); g.step(60 * 4);
  assert.equal(g.ev('Spot.on'), false, 'во второй раз — без паузы');
  g.ev('G.stage.hz = []; G.stage.hzCd = 999; G.stage.rs.g = 1; G.stage.cz = []; G.stage.czSeen = false; G.stage.czCd = 0'); g.step(60 * 4); // закон «Глюоны» — первый цветной вихрь (в кадре есть место)
  assert.equal(g.ev('Spot.on && Spot.txt'), 'Цветной вихрь');
  assert.match(g.ev('Spot.sub'), /рождаются глюоны/);
});

test('новое понятие — пауза и объяснение: аннигиляция, масса, вершина распада, щит и ядро, волна антивещества, перекраска — по одному, не посреди зажатия и не до ленты главы', () => {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev('Cine.clear(); Spot.clear()');
  const ex = js => g.ev(`(() => { const S = G.stage; Spot.clear(); Cine.clear(); ${js}; S.tickExplain(1 / 60); return Spot.on ? Spot.txt : null; })()`);
  // эпоха 1: частица и античастица встретились в кадре — посреди зажатия пауза ждёт
  g.ev(`(() => { const S = G.stage; S.chap = 3; const a = S.mk('e', false, P.x + .4, P.y, 0, 1), b = S.mk('e', true, P.x + .5, P.y, 0, 1); S.annihilate(a, b, true); })()`);
  assert.equal(ex('S.holding = true'), null, 'посреди зажатия — без паузы (клик «дальше» отпустил бы удар)');
  assert.equal(ex('S.holding = false; S.focus = null'), 'Аннигиляция');
  assert.match(g.ev('Spot.sub'), /античастиц/);
  // эпоха 2, после H: вещество с массой в кадре; до ленты главы 7 — ждёт
  const e2 = `S.ep = 1; S.hig = 1; S.epDone = false; Codex.see('H'); S.p.filter(o => !o.dead && !S.isQ(o)).forEach(o => o.dead = true); const o = S.mk('u', false, P.x + 1, P.y, 0, 1); o.born = 1`;
  assert.equal(ex(e2 + '; S.chap = 6'), null, 'не до ленты главы эпохи');
  assert.equal(ex(e2 + '; S.chap = 7'), 'Масса — это вес');
  assert.match(g.ev('Spot.sub'), /золотой полосе/);
  // эпоха 3: вершина распада в кадре
  assert.equal(ex(`S.ep = 2; S.chap = 8; S.tracks = []; const b = S.mk('b', false, P.x + 1, P.y, 0, 1); S.event([S.mk('c', false, P.x + 1, P.y, 0, 1)], P.x + 1, P.y, b)`), 'Вершина распада');
  // эпоха 4: щит и ядро — сразу после ленты; волна; глюон, который достроит тройку
  assert.equal(ex('S.ep = 3; S.chap = 9; S.learn.shield = false'), 'Щит и ядро');
  assert.ok(g.ev('Spot.r') >= g.ev('G.stage.coreR()') - 1e-9, 'пятно — на ядре');
  assert.equal(ex(`S.learn.shield = true; const w = S.mk('u', true, P.x + 1.5, P.y, Math.PI, .1); w.wave = true`), 'Волна антивещества');
  assert.equal(ex(`S.p.forEach(o => { if (o.wave) o.dead = true; }); S.stock = 2; S.stockQ = [{ fl: 'u', col: 0 }, { fl: 'd', col: 0 }]; const q = S.mk('g', false, P.x + 1.2, P.y, 0, 1); q.col = 1; q.col2 = 0`), 'Глюон перекрашивает');
  // каждое — раз за игру
  assert.equal(ex('S.learn.shield = false'), null, 'во второй раз — без паузы');
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

// круг — к точке мира: курсор туда (камера едет за кругом — целимся заново), детектор догоняет
const goTo = (g, wx, wy, n = 70) => { for (let k = 0; k < n; k += 5) { g.ev(`(() => { const [sx, sy] = W2S(${wx}, ${wy}); mouse.x = sx; mouse.y = sy; mouse.has = true; mouse.idle = false; })()`); g.step(5, true); } };
const sch = (g, e) => JSON.parse(g.ev(`JSON.stringify(${e})`));
// школа, сцена «Рогатка»: зажать шарик, оттянуть на k резинки (знак — в какую сторону), отпустить
const sling = (g, k) => { g.ev(`mouse.x = G.W / 2; mouse.clicked = true; mouse.down = true`); g.step(1); g.ev(`mouse.x = G.stage.school.bw.p0[0] + ${k} * slingFullPx()`); g.step(1); const aim = g.ev('G.stage.bowlAim(G.stage.school.bw)'); g.ev('mouse.down = false'); g.step(1); return aim; };
// пройти «Рогатку»: дважды довести размах почти до края — шарик лежит на дне или замер на краю хода: поймать,
// оттянуть (по прицелу) до 0,93 и отпустить
const passSling = g => {
  for (let t = 0; t < 60 * 20 && g.ev('!!G.stage.school && G.stage.school.i === 4'); t++) {
    const B = sch(g, '(B => ({ u: B.u, v: B.v, A: B.A, out: B.out }))(G.stage.school.bw)');
    if (!g.ev('G.stage.school.done') && !B.out && (B.A < .02 || Math.abs(B.v) < .3 && Math.abs(B.u) > .5)) {
      g.ev(`mouse.x = G.W / 2; mouse.clicked = true; mouse.down = true`); g.step(1);
      const sg = B.u < 0 ? -1 : 1; let lo = .12, hi = 1;
      for (let j = 0; j < 18; j++) { const k = (lo + hi) / 2; g.ev(`G.stage.school.bw.pull = ${sg} * ${k}`); if (g.ev('G.stage.bowlAim(G.stage.school.bw)') < .93) lo = k; else hi = k; }
      g.ev(`mouse.x = G.stage.school.bw.p0[0] + ${sg * lo} * slingFullPx(); mouse.down = false`);
    }
    g.step(1, true);
  }
};
test('школа жестов: впервые пролог учит жесты игры — вести, посмотреть, свести, разжать, рогатка; без очков; потом раскачка, во второй раз — сразу она', () => {
  const g = loadGame();
  g.ev(`document.getElementById('go').onclick()`); g.step(110);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1); g.ev('mouse.down = false'); g.step(1, true);
  assert.ok(g.ev('!!G.stage.school'), 'первое нажатие — школа жестов, а не толчок');
  assert.equal(g.ev('G.stage.inf.go'), false);
  assert.equal(g.ev('G.stage.finger'), false, 'на сенсоре — как в игре: палец ведёт круг, ◉ — действие');
  assert.ok(g.ev(`document.body.classList.contains('tut')`), 'кнопка «пропустить» видна');
  assert.deepEqual(sch(g, 'G.stage.steps().map(s => [s.t, !!s.np])'), [['Вести круг', true], ['Посмотреть', true], ['Свести два', true], ['Разжать без удара', true], ['Рогатка', true]]);
  const score0 = g.ev('G.score');
  assert.equal(g.ev('G.stage.p.length'), 0, 'до частиц: ни света, ни частиц — только сгустки поля');
  // 1 — вести: круг сквозь три сгустка
  for (let t = 0; t < 60 && g.ev('G.stage.school.n') < 3; t++) { const b = sch(g, 'G.stage.school.fl.find(b => !b.dead)'); goTo(g, b.x, b.y, 5); } // сгусток дрейфует — круг гонится за ним
  assert.equal(g.ev('G.stage.school.n'), 3);
  g.step(90, true); assert.equal(g.ev('G.stage.school.i'), 1, 'вести — освоено');
  // 2 — посмотреть: клик мимо — «пусто», клик с кругом на сгустке — снимок
  const far = sch(g, 'G.stage.school.fl[0]');
  g.ev(`mouse.clicked = true; mouse.down = true`); g.step(2); g.ev('mouse.down = false'); g.step(2);
  assert.equal(g.ev('G.stage.school.miss'), 1, 'мимо: сгусток далеко');
  goTo(g, far.x, far.y);
  g.ev(`mouse.clicked = true; mouse.down = true`); g.step(2); g.ev('mouse.down = false'); g.step(2);
  assert.ok(g.ev('G.stage.school.done') > 0, 'снимок сгустка');
  g.step(90, true); assert.equal(g.ev('G.stage.school.i'), 2);
  // 3 — свести: зажать у двух, сила копится засечками, отпустить — столкнулись
  const mid = () => sch(g, '(() => { const [a, b] = G.stage.school.fl; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; })()');
  let m = mid(); goTo(g, m.x, m.y);
  g.ev(`mouse.clicked = true; mouse.down = true`); g.step(60 * 2, true);
  assert.ok(g.ev('G.stage.school.cap && G.stage.school.cap.length') === 2, 'поле взяло пару');
  assert.ok(g.ev('G.stage.school.lv') >= 2, 'держал 2 с — не меньше двух засечек');
  g.ev('mouse.down = false'); g.step(2);
  assert.ok(g.ev('G.stage.school.done') > 0, 'столкнулись');
  g.step(90, true); assert.equal(g.ev('G.stage.school.i'), 3);
  // 4 — разжать: отпустить — не то (столкнулись, новая пара); правая кнопка — то
  m = mid(); goTo(g, m.x, m.y);
  g.ev(`mouse.clicked = true; mouse.down = true`); g.step(30); g.ev('mouse.down = false'); g.step(2);
  assert.equal(g.ev('G.stage.school.i'), 3, 'отпустил — это удар, а не отмена');
  g.step(80);
  m = mid(); goTo(g, m.x, m.y);
  g.ev(`mouse.clicked = true; mouse.down = true`); g.step(30);
  assert.equal(g.ev('stCanDrop()'), true, '✕ на сенсоре видна: есть что разжать');
  assert.equal(g.ev('stDrop()'), true);
  g.step(90, true);
  assert.equal(g.ev('G.stage.school.i'), 4, 'разжать — освоено; дальше рогатка');
  passSling(g);
  assert.equal(g.ev('G.stage.school'), null, 'жесты освоены — дальше раскачка');
  assert.equal(g.ev('G.score'), score0, 'школа очков не даёт: её проходят не все');
  assert.ok(!g.ev(`document.body.classList.contains('tut')`));
  assert.equal(g.ev('G.stage.inf.go'), false, 'раскачка ждёт первого толчка');
  // во второй раз — школы нет
  const g2 = loadGame({ storage: Object.fromEntries(g.store) });
  g2.ev(`document.getElementById('go').onclick()`); g2.step(110);
  g2.ev('mouse.clicked = true; mouse.down = true'); g2.step(1);
  assert.equal(g2.ev('G.stage.school'), null);
  assert.equal(g2.ev('G.stage.inf.go'), true, 'нажатие — сразу толчок поля');
});

test('школа жестов: Esc — пропустить; задание и подсказки школы без «обучения» в разметке', () => {
  const g = loadGame();
  g.ev(`document.getElementById('go').onclick()`); g.step(110);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1); g.ev('mouse.down = false');
  assert.ok(g.ev('!!G.stage.school'));
  g.click('tutskip');
  assert.equal(g.ev('G.stage.school'), null);
  assert.equal(g.ev(`Known.has('gest:school')`), true);
  g.step(60, true);
  assert.equal(g.ev('G.stage.lit'), false, 'дальше — раскачка');
});

test('школа «Рогатка»: та же чаша, что в прологе — шарик сам не движется; бросок — колебание с трением; перетянул — вывалился; у края дважды — освоено', () => {
  const g = loadGame();
  g.ev(`document.getElementById('go').onclick()`); g.step(110);
  g.ev('mouse.clicked = true; mouse.down = true'); g.step(1); g.ev('mouse.down = false'); g.step(1, true);
  g.ev(`G.stage.school.i = 3; G.stage.schoolNext()`);
  assert.equal(g.ev('G.stage.school.i'), 4);
  assert.equal(g.ev('G.stage.finger'), true, 'рогатка — пальцем, как в прологе');
  const p0 = sch(g, '[P.x, P.y]');
  g.step(120, true);
  assert.deepEqual(sch(g, '[G.stage.school.bw.u, G.stage.school.bw.v]'), [0, 0], 'не трогаешь — шарик лежит на дне');
  // слабый бросок: колеблется, теряя размах; не у края
  assert.ok(sling(g, .3) < .85, 'прицел: слабо');
  const tops = [];
  g.ev(`globalThis.__t = []; const f = G.stage.bowlTick.bind(G.stage); G.stage.bowlTick = (B, dt, cb) => f(B, dt, { ...cb, top: a => { __t.push(a); cb.top && cb.top(a); } })`);
  g.step(60 * 4, true); tops.push(...sch(g, '__t'));
  assert.ok(tops.length >= 3, 'качается туда-сюда: ' + tops);
  for (let i = 1; i < tops.length; i++) assert.ok(tops[i] < tops[i - 1], 'размах тает: ' + tops);
  assert.equal(g.ev('G.stage.school.n'), 0);
  assert.deepEqual(sch(g, '[P.x, P.y]'), p0, 'круг стоит: чаша неподвижна');
  // перетянул: прицел красный, шарик вываливается, новый — на дне
  g.step(60 * 6, true);
  const aim = sling(g, 1);
  assert.ok(aim > 1, 'прицел: за край — ' + aim);
  g.step(60, true);
  assert.equal(g.ev('G.stage.school.miss'), 1, 'вывалился');
  assert.ok(g.ev('G.stage.school.bw.out') > 0);
  g.step(60 * 1.5, true);
  assert.equal(g.ev('G.stage.school.bw.out'), 0); assert.equal(g.ev('G.stage.school.bw.u'), 0, 'новый шарик — на дне');
  // освоить: размах почти до края дважды
  passSling(g);
  assert.equal(g.ev('G.stage.school'), null, 'рогатка освоена — школа кончилась');
  assert.equal(g.ev(`Known.has('gest:school')`), true);
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
