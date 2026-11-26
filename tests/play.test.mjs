// Играбельность: рогатка бросает быстро и с отдачей, молекулу можно разорвать двойным кликом,
// ✦ переходят на следующий уровень (остаток ÷ 10), электроны садятся на ионы только заторможенными.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}

test('рогатка: бросок в 1,75 раза быстрее, пороги ядер — вместе с ним; при броске — отдача', () => {
  const g = toStage('nuclei');
  assert.equal(g.ev('G.stage.vmax()'), 15 * 1.75);
  assert.equal(g.ev(`G.stage.vBar({ Z: 1, N: 0 }, { Z: 1, N: 0 })`), 4.5 * 1.75);
  g.ev(`const S = G.stage, sl = S.sl, b = S.bodies()[0]; sl.held = b; sl.pull = [S.full() * .6, 0]; const k = sl.kick(); sl.held = null; S.launch(b, k[0], k[1]); sl.kickFx(b); globalThis.__b = b`);
  assert.ok(Math.abs(g.ev('G.stage.sl.snap.k') - .6) < 1e-9);
  assert.equal(g.ev('__b.thrown'), 'hand');
  g.ev('render()'); g.step(40); g.ev('render()');
  assert.equal(g.ev('G.stage.sl.snap'), null, 'отдача гаснет за полсекунды');
});

// молекула из двух H, связанных рукой; возвращает её
const pairH = `(() => { const S = G.stage, A = S.newMol('H', P.x, P.y), B = S.newMol('H', P.x + 3, P.y); A.age = B.age = 2;
  S.merge(A, 0, 0, B, 0, 0, 'hand'); return S.m.filter(m => !m.dead && m.bonds.length).length; })()`;

test('молекулы: двойной клик по связи рвёт её (рогатка не берёт тело)', () => {
  const g = toStage('molecules');
  g.ev('for (const m of G.stage.m) m.dead = true; G.stage.m = []');
  assert.equal(g.ev(pairH), 1, 'связались');
  g.ev(`globalThis.__mol = G.stage.m.find(m => m.bonds.length); const [i, j] = __mol.bonds[0];
    const [sx, sy] = W2S((__mol.wp[i][0] + __mol.wp[j][0]) / 2, (__mol.wp[i][1] + __mol.wp[j][1]) / 2); mouse.x = sx; mouse.y = sy; mouse.has = true`);
  const tap = (down) => g.ev(`mouse.down = ${down}; G.stage.sl.update()`);
  tap(true); tap(false); // первый тап — взял и отпустил без резинки
  assert.equal(g.ev('G.stage.st.tear'), 0);
  tap(true); // второй — разрыв
  assert.equal(g.ev('G.stage.st.tear'), 1);
  assert.equal(g.ev('G.stage.sl.held'), null, 'двойной клик не берёт тело');
  tap(false);
  assert.equal(g.ev('G.stage.m.filter(m => !m.dead && m.bonds.length).length'), 0, 'связи нет');
  assert.equal(g.ev('G.stage.m.filter(m => !m.dead).length'), 2, 'два атома');
  assert.ok(g.ev('G.stage.floats.some(f => /✂ H–H/.test(f.txt))'));
  assert.equal(g.ev('G.stage.tore'), true, 'подсказка «двойной клик» больше не нужна');
});

test('молекулы: двойной клик быстрее кадра (оба нажатия между кадрами) — тоже разрыв', () => {
  const g = toStage('molecules');
  g.ev('for (const m of G.stage.m) m.dead = true; G.stage.m = []');
  g.ev(pairH);
  g.ev(`const mol = G.stage.m.find(m => m.bonds.length), [i, j] = mol.bonds[0];
    const [sx, sy] = W2S((mol.wp[i][0] + mol.wp[j][0]) / 2, (mol.wp[i][1] + mol.wp[j][1]) / 2); mouse.x = sx; mouse.y = sy; mouse.has = true`);
  // два pointerdown и два pointerup пришли до кадра: кнопка уже отпущена, но защёлка и «второе подряд» стоят
  g.ev('mouse.down = false; mouse.clicked = true; mouse.dbl = true; G.stage.sl.update()');
  assert.equal(g.ev('G.stage.st.tear'), 1);
  assert.equal(g.ev('mouse.dbl'), false, 'двойной клик съеден');
  g.ev('G.stage.sl.update()');
  assert.equal(g.ev('G.stage.sl.eat'), false);
});

test('молекулы: «связал — разорвал — связал» не фармит очки', () => {
  const g = toStage('molecules');
  g.ev('for (const m of G.stage.m) m.dead = true; G.stage.m = []');
  const s0 = g.ev('G.score');
  g.ev(pairH);
  assert.equal(g.ev('G.score') - s0, 40, 'первая связь — +40');
  for (let i = 0; i < 3; i++) {
    g.ev(`(() => { const mol = G.stage.m.find(m => !m.dead && m.bonds.length); G.stage.splitBond(mol, 0); G.stage.st.tear++;
      for (const m of G.stage.m) m.dead = true; G.stage.m = []; })()`);
    g.ev(pairH);
  }
  assert.equal(g.ev('G.score') - s0, 40, 'повторы после разрыва — без очков');
});

test('звёзды: два ⁴He в ядре звезды сами сливаются в ⁸Be (скорость — в окне нового барьера)', () => {
  const g = toStage('stars');
  g.ev(`const S = G.stage, a = S.mk(2, 2, P.x, P.y), b = S.mk(2, 2, P.x + .5, P.y); a.age = b.age = 2;
    globalThis.__ok = S.collide(a, b, lerp(S.vBar(a, b), S.vMax(a, b), .3), null)`);
  assert.equal(g.ev('__ok'), true);
  assert.ok(g.ev(`G.stage.o.some(o => !o.dead && o.Z === 4 && o.N === 4)`), '⁸Be родился');
});

test('молекулы: Вселенная не трогает то, что ты недавно брал', () => {
  const g = toStage('molecules');
  g.ev(`G.stage.res.add('H₂'); for (const m of G.stage.m) m.dead = true; G.stage.m = [];
    const S = G.stage, A = S.newMol('H', P.x, P.y), B = S.newMol('H', P.x + 6, P.y); A.age = B.age = 2; globalThis.__AB = [A, B];
    for (let i = 0; i < 6; i++) { const h = S.newMol('H', P.x - 30 - i * 12, P.y + 30); h.age = 2; h.mineT = 1e9; }`); // водорода вдоволь (последний Вселенная не берёт); эти — «твои», не в паре
  g.ev(`G.stage.hold(__AB[0]); __AB[0].held = false; G.stage.autoCd = 0; G.stage.autoChem(1 / 60)`);
  assert.ok(!(g.ev('__AB[0].auto') > 0) && !(g.ev('__AB[1].auto') > 0), 'твой атом — не в паре Вселенной');
  g.ev(`G.stage.t += 9; G.stage.autoCd = 0; G.stage.autoChem(1 / 60)`);
  assert.ok(g.ev('__AB[0].auto') > 0, 'через 8 с — снова её');
  assert.equal(g.ev('G.stage.autoCd'), 2.4);
});

test('✦ с собой: остаток уровня ÷ 10 — в копилку следующего (очки не растут), в итогах — строка', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'quarks') g.ev('advance(); G.trans = 99');
  g.ev('G.stage.kn = 157; G.stage.spent = 100');
  const sc = g.ev('G.score');
  g.ev('advance()');
  assert.equal(g.ev('G.stage.key'), 'nuclei');
  assert.match(g.ev(`document.getElementById('tally').innerHTML`), /с собой.*\+5/);
  assert.equal(g.ev('G.stage.bal()'), 0, 'пока идёт переход — ещё не в копилке (счётчик не прыгает)');
  const sc2 = g.ev('G.score');
  g.ev('G.prev = null; Fly.seen = G.T; update(1 / 60)');
  assert.equal(g.ev('G.stage.bal()'), 5);
  assert.equal(g.ev('G.stage.kn'), 0, '✦ уровня (и очки) — только заработанные здесь');
  assert.ok(g.ev('G.stage.floats.some(f => /с прошлого уровня \\+5 ✦/.test(f.txt))'), 'показано при входе');
  assert.equal(g.ev('G.stage.carryIn'), 0, 'один раз');
  g.step(5); assert.equal(g.ev('G.stage.bal()'), 5);
  assert.ok(g.ev('G.score') - sc2 < 1, 'перенос не даёт очков');
  assert.ok(sc2 >= sc);
});

test('атомы: ждать бесполезно — электроны садятся только заторможенными; след тормозит и рядом', () => {
  const g = toStage('atoms');
  g.step(60 * 40);
  assert.equal(g.ev('G.stage.caps.hand + G.stage.caps.auto'), 0, 'за 40 с без игрока — ни одного захвата');
  // медленный, но не заторможенный у иона — не садится; заторможенный — садится
  g.ev(`globalThis.__io = G.stage.ion(1, P.x, P.y, 1); __io.vx = __io.vy = 0; G.stage.ions.push(__io);
    G.stage.el.push(globalThis.__e = { x: P.x + .3, y: P.y, vx: 0, vy: 0, k: 1, slow: 0, brk: 0, by: null, age: 1 })`);
  g.ev('update(1 / 60)');
  assert.equal(g.ev('__io.ne'), 0);
  g.ev(`__e.x = P.x + .3; __e.y = P.y; __e.vx = __e.vy = 0; __io.x = P.x; __io.y = P.y; G.stage.brake(__e, 'hand'); update(1 / 60)`);
  assert.equal(g.ev('__io.ne'), 1, 'заторможенный — пойман');
  assert.equal(g.ev('G.stage.caps.hand'), 1);
  // электрон идёт вдоль следа на 0,3 от него — тормозит
  g.ev(`G.stage.el.push(globalThis.__f = { x: P.x + 20, y: P.y + 20, vx: 6, vy: 0, k: 1, slow: 0, brk: 0, by: null, age: 1 });
    G.stage.tr = [{ x: P.x + 19, y: P.y + 20.3, t: G.T }, { x: P.x + 22, y: P.y + 20.3, t: G.T }]; update(1 / 60)`);
  assert.ok(g.ev('__f.slow') > 0, 'рядом со следом — тормозит');
});
