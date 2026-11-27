// Роль семейства: «Генерация X» не просто ещё один вид в мире — у каждого семейства своя польза.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toField() {
  const g = loadGame();
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  return g;
}
// отдать Вселенной рождение вида sp (как купленное исследование)
const give = (g, sp) => g.ev(`Codex.see('${sp}'); Codex.auto.add('${sp}'); G.stage.rs.coll = 1`);

test('e: e⁻ и e⁺ поворачивают друг к другу и гаснут в γγ — свет и ✦', () => {
  const g = toField(); give(g, 'e');
  g.ev(`(() => { const S = G.stage; globalThis.__a = S.mk('e', false, P.x + 1, P.y, Math.PI / 2, 1); globalThis.__b = S.mk('e', true, P.x - 1, P.y, Math.PI / 2, 1);
    for (const o of [__a, __b]) { o.born = 1; o.cd = 0; } globalThis.__kn = S.kn; })()`);
  for (let i = 0; i < 3 * 60 && !g.ev('__a.dead'); i++) g.step(1);
  assert.ok(g.ev('__a.dead && __b.dead'), 'пара встретилась');
  assert.ok(g.ev('G.stage.kn - __kn') >= 1, 'вспышка в кадре дала ✦');
  assert.ok(!g.ev(`G.stage.floats.some(f => f.txt.includes('+1 ✦') || f.txt.includes('+1 ⚡'))`), 'без надписи «+1 ✦ +1 ⚡» — только вспышка и искра');
});

test('e: без исследования параллельные e⁻ и e⁺ друг друга не ищут', () => {
  const g = toField(); g.ev(`Codex.see('e')`);
  g.ev(`(() => { const S = G.stage; globalThis.__a = S.mk('e', false, P.x + 1, P.y, Math.PI / 2, 1); globalThis.__b = S.mk('e', true, P.x - 1, P.y, Math.PI / 2, 1);
    for (const o of [__a, __b]) { o.born = 1; o.cd = 0; } })()`);
  g.step(60);
  assert.ok(g.ev('!__a.dead && !__b.dead'));
});

test('e: вспышка в кадре даёт ещё и ⚡; пара, что родила Z, — не вспышка', () => {
  const g = toField(); give(g, 'e');
  g.ev(`G.stage.en = 0; G.stage.eFlash(P.x + 1, P.y)`);
  assert.equal(g.ev('G.stage.en'), 1);
  // e⁺e⁻ на резонансе Z (Z исследован) — родился Z, а не свет: ни ✦, ни надписи
  g.ev(`(() => { const S = G.stage; S.hig = 1; give2(); globalThis.__kn = S.kn; S.floats.length = 0;
    S.sqrtS = () => SM.Z.m; const a = S.mk('e', false, P.x + .1, P.y, Math.PI, 1), b = S.mk('e', true, P.x - .1, P.y, 0, 1);
    for (const o of [a, b]) { o.born = 1; o.cd = 0; } })()`.replace('give2();', `Codex.see('Z'); Codex.auto.add('Z');`));
  g.step(1);
  assert.ok(g.ev(`G.stage.p.some(o => o.sp === 'Z' && !o.dead)`), 'родился Z');
  assert.ok(!g.ev(`G.stage.floats.some(f => f.txt.startsWith('e⁺e⁻'))`), 'не γγ — не вспышка');
});

test('u, d: запас растёт сам по таймеру поровну, в эпохе 4 ложится готовыми тройками', () => {
  const g = toField(); give(g, 'u'); give(g, 'd');
  g.step(Math.ceil(g.ev('UD_MAX * UD_EVERY + 2') * 60));
  assert.equal(g.ev('G.stage.udRes.length'), g.ev('UD_MAX'), 'за UD_MAX·UD_EVERY с — полный запас');
  assert.equal(g.ev(`G.stage.udRes.filter(f => f === 'u').length`), g.ev('UD_MAX / 2'), 'поровну u и d');
  g.ev(`G.stage.stock = 0; G.stage.stockQ = []; G.stage.startEpoch(3)`);
  assert.equal(g.ev('G.stage.stock'), 6);
  assert.equal(g.ev('G.stage.udRes.length'), 0);
  assert.equal(g.ev('baryonTrios(G.stage.stockQ)'), 2, 'две готовые тройки');
});

test('u, d: в любом наборе ароматов — столько троек, сколько из него можно сложить', () => {
  const g = toField();
  for (const [res, want] of [[['u', 'u', 'u', 'd'], 1], [['d', 'd', 'u', 'u', 'u'], 1], [['u', 'u', 'd', 'u', 'd', 'u'], 2], [['u', 'u', 'u'], 0]]) {
    g.ev(`G.stage.ep = 2; G.stage.udRes = ${JSON.stringify(res)}; G.stage.stock = 0; G.stage.stockQ = []; G.stage.startEpoch(3)`);
    assert.equal(g.ev('baryonTrios(G.stage.stockQ)'), want, res.join(''));
  }
  // только u исследован — лавка предупреждает, что нужен и d
  g.ev(`Codex.see('u'); Codex.auto.add('u')`);
  assert.ok(g.ev(`G.stage.role('u')`).includes('нужен и d'));
});

test('c s b μ τ: каждый снятый распад платит ✦ и возвращает ⚡ снимка; частица не уходит в фон', () => {
  const g = toField(); give(g, 'mu');
  g.ev(`(() => { const S = G.stage; S.hig = 1; S.decSeen.add('mu'); globalThis.__mu = S.mk('mu', false, P.x + 3, P.y, 0, .01); __mu.born = 1; __mu.life = 50; })()`);
  assert.equal(g.ev('G.stage.isBg(__mu)'), false, 'оплачиваемый — на виду');
  g.ev(`(() => { const S = G.stage; const o = S.mk('mu', false, P.x, P.y, 0, .01); o.born = 1; o.life = .01; })()`);
  g.step(2);
  g.ev(`(() => { const S = G.stage; S.shotCd = 0; S.en = 5; globalThis.__kn = S.kn; S.snapshot(); })()`);
  const v = g.ev(`G.stage.decPay('mu')`);
  assert.ok(v >= 2 * g.ev(`G.stage.value('mu')`));
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === SM.mu.sym + '→ +${v} ✦')`), 'распад оплачен');
  assert.ok(g.ev('G.stage.kn - __kn') >= v);
  assert.equal(g.ev('G.stage.en'), 5, 'снимок оплаченного распада — без ⚡');
});

test('t: распад t Вселенной в кадре — ⚡ до полного, не чаще раза в T_CD; твой t — нет', () => {
  const g = toField(); give(g, 't');
  g.ev(`(() => { const S = G.stage; S.hz = []; S.hzCd = 999; S.populate = () => {}; })()`); // без света вокруг: ⚡ — только от t
  const tRun = (uni) => { g.ev(`(() => { const S = G.stage; S.hig = 1; S.en = 0; for (const o of S.p) if (o.sp === 'ph') o.dead = true; const o = S.mk('t', false, P.x + 1, P.y, 0, .01); o.born = 1; o.life = .01; o.uni = ${uni}; })()`); g.step(2); return g.ev('G.stage.en'); };
  assert.equal(tRun(false), 0, 'сделанный руками t не заряжает');
  assert.equal(tRun(true), g.ev('E_CAP'));
  assert.equal(tRun(true), 0, 'перезарядка');
  g.ev('G.stage.tAt -= T_CD');
  assert.equal(tRun(true), g.ev('E_CAP'));
});

test('лавка: закон («Лептоны I», «Генерация X») говорит, зачем она — и в подсказке у компактной кнопки', () => {
  const g = toField();
  for (const [sp, want] of [['e', 'γγ'], ['u', 'эпохе 4'], ['c', '✦'], ['t', '⚡']]) assert.ok(g.ev(`G.stage.role('${sp}')`).includes(want), sp);
  g.ev(`for (const sp of ['e', 'u', 'mu', 'c']) Codex.run.add(sp); G.stage.rs.coll = 1; G.stage.kn += 999`);
  const el = g.ev(`(() => { const el = document.getElementById('shop'); G.stage.renderShop(el); return el.innerHTML; })()`);
  assert.match(el, /title="(Генерация|Лептоны) [^"]+: [^"]+"/);
});
