// Второе ревью, № 2, № 3, № 14: фермы очков и ✦ закрыты, закон не проходит уровень сам, Кодекс подсказывает состав.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== key) g.ev('advance(); G.trans = 99');
  return g;
}

test('фермы: «Молекулы» — очков за связь нет, H₂ в бульон не идёт, H₂O в лавке раньше H₂', () => {
  const g = toStage('molecules');
  const s0 = g.ev('G.score');
  g.ev(`(() => { const S = G.stage; S.freeSlots = () => 0; S.counts = () => ({ H: 2 }); S.res.add('H₂');
    for (let i = 0; i < 20; i++) { S.afterMerge(S.m[0], 'hand', 0, 0); S.afterMerge(S.m[0], 'auto', 0, 0); } })()`);
  assert.equal(g.ev('G.stage.st.bonds'), 20);
  assert.equal(g.ev('G.score'), s0, '20 связей рукой — очков не прибавилось: очки за вехи');
  assert.equal(g.ev('G.stage.st.soup'), 0, 'штамповка H + H бульон не варит');
  g.ev(`(() => { const S = G.stage; S.counts = () => ({ H: 2, O: 1 }); S.afterMerge(S.m[0], 'auto', 0, 0); })()`);
  assert.equal(g.ev('G.stage.st.soup'), 1, 'вода — в бульон');
  g.ev(`(() => { const S = G.stage; S.counts = () => ({ C: 3, H: 8 }); S.afterMerge(S.m[0], 'hand', 0, 0); })()`);
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === 'C₃H₈ · не из бульона')`), 'насыщенное вне каталога — хотя бы формула');
  g.ev(`(() => { const S = G.stage; S.res.clear(); S.found = ['H₂', 'H₂O']; })()`);
  assert.equal(g.ev('G.stage.shopItems()[0].f'), 'H₂O', 'первым в лавке (и «для задания») — соединение с тяжёлым атомом');
});

test('фермы: «Адроны» — сложил пару → разбил нуклоном → сложил: ✦ за пару один раз', () => {
  const g = toStage('quarks');
  g.ev(`(() => { const S = G.stage; S.o = []; S.pi = []; S.stuck = () => false; })()`);
  const mk = (n, col, dx) => `globalThis.${n} = G.stage.mk([{ col: ${col}, fl: 'u', anti: false }], G.stage.C.x + ${dx}, G.stage.C.y); ${n}.age = 9; ${n}.vx = ${n}.vy = 0`;
  g.ev(mk('__a', 0, 0)); g.ev(mk('__b', 1, .5));
  const k0 = g.ev('G.stage.kn');
  g.ev(`G.stage.collide(__a, __b, 'hand')`);
  assert.equal(g.ev('G.stage.kn'), k0 + 2, 'первая пара — +2 ✦');
  for (let i = 0; i < 5; i++) {
    g.ev(`(() => { const S = G.stage, p = S.o.find(o => !o.dead && o.kind === 'pair'); S.split(p, 1, 0);
      const q = S.o.filter(o => !o.dead && o.kind === 'q'); S.collide(q[0], q[1], i % 2 ? 'cue' : 'hand'); })()`.replace('i % 2', String(i % 2)));
  }
  assert.equal(g.ev(`G.stage.o.filter(o => !o.dead && o.kind === 'pair').length`), 1);
  assert.equal(g.ev('G.stage.kn'), k0 + 2, 'та же пара снова — ✦ не печатает (и карамболем тоже)');
  // спасённый из холода — +2 ✦ раз на кварк
  g.ev(`(() => { const S = G.stage, p = S.o.find(o => !o.dead && o.kind === 'pair'); p.rescue = true; })()`);
  for (let i = 0; i < 3; i++) g.ev('update(1 / 60)');
  g.ev(`(() => { const S = G.stage, p = S.o.find(o => !o.dead && o.kind === 'pair'); p.rescue = true; })()`);
  for (let i = 0; i < 3; i++) g.ev('update(1 / 60)');
  assert.equal(g.ev('G.stage.st.saved'), 2);
  assert.equal(g.ev('G.stage.kn'), k0 + 4, 'спасение той же пары второй раз — без ✦');
});

test('фермы: законы Вселенной платят, пока игрок здесь (AFK на ×4 копилку не растит)', () => {
  const g = toStage('quarks');
  const k0 = g.ev('G.stage.kn');
  g.ev(`G.inT = G.T; Uni.pay(G.stage, 'x', 5)`);
  assert.equal(g.ev('G.stage.kn'), k0 + 5);
  g.ev(`G.inT = G.T - UNI_AFK - 1; Uni.pay(G.stage, 'x', 5)`);
  assert.equal(g.ev('G.stage.kn'), k0 + 5, 'игрока нет дольше UNI_AFK — не платят');
  g.ev(`G.stage.uni = [{ k: 'x', ic: '·', name: 'тест', lv: 1, rate: 6, acc: 0, kn: 0, en: 0, n: 0, t0: G.T, fl: G.T, log: [] }]; Uni.render(document.getElementById('uni'))`);
  assert.match(g.ev(`document.getElementById('uni').innerHTML`), /ждут тебя/);
});

test('автоматика: «Нуклеосинтез» сам — до SYN_TOP гелия, дальше ⁴He только руками', () => {
  const g = toStage('nuclei');
  const put = (Z, N, dx) => `Object.assign({}, __t, { Z: ${Z}, N: ${N}, x: P.x + ${dx}, y: P.y, vx: 0, vy: 0, age: 5, nb: 0, dead: false, held: false, fly: 0, thrown: null })`;
  const run = y => g.ev(`(() => { const S = G.stage; globalThis.__t = S.o[0]; S.o = [${put(1, 2, 0)}, ${put(1, 0, 2)}];
    S.rs.syn = 1; S.Y = () => ${y}; S.autoCd = 0; S.autoFuse(1 / 60); return S.o.filter(o => o.thrown === 'auto').length; })()`);
  assert.equal(run(.1), 1, '³H + p → ⁴He — пока гелия мало, закон куёт');
  assert.equal(run(.2), 0, 'свою долю набрал — гелий за тобой');
  assert.ok(g.ev('SYN_TOP') < g.ev('Y_GOAL'));
  assert.match(g.ev(`G.stage.steps().find(s => s.t === 'Набрать 25 % гелия').h`), /дальше ⁴He твоими бросками/);
});

test('Кодекс: неоткрытая молекула подсказывает элементы и число атомов (не формулу)', () => {
  const g = loadGame();
  assert.equal(g.ev(`molHow({ c: { H: 2, O: 1 } })`), 'Нужны H и O, всего 3 атома.');
  assert.equal(g.ev(`molHow({ c: { H: 2 } })`), 'Только H, всего 2 атома.');
  assert.match(g.ev(`molHow({ c: { C: 1, O: 2 }, mb: 2 })`), /^Нужны C и O, всего 3 атома\. Нужна двойная связь/);
  assert.equal(g.ev(`molHow({ c: { C: 2, H: 6, O: 1 } })`), 'Нужны C, H и O, всего 9 атомов.');
});
