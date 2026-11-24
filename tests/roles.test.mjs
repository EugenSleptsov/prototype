// Роль семейства: «Рождение X» не просто ещё один вид в мире — у каждого семейства своя польза.
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
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt.startsWith('e⁺e⁻ → γγ'))`));
});

test('e: без исследования параллельные e⁻ и e⁺ друг друга не ищут', () => {
  const g = toField(); g.ev(`Codex.see('e')`);
  g.ev(`(() => { const S = G.stage; globalThis.__a = S.mk('e', false, P.x + 1, P.y, Math.PI / 2, 1); globalThis.__b = S.mk('e', true, P.x - 1, P.y, Math.PI / 2, 1);
    for (const o of [__a, __b]) { o.born = 1; o.cd = 0; } })()`);
  g.step(60);
  assert.ok(g.ev('!__a.dead && !__b.dead'));
});

test('u, d: Вселенная копит их в запас, а в эпохе 4 запас сразу ложится в детектор', () => {
  const g = toField(); give(g, 'u'); give(g, 'd');
  g.step(40 * 60);
  const n = g.ev('G.stage.udRes.length');
  assert.ok(n > 0 && n <= g.ev('UD_MAX'), `в запасе ${n}`);
  g.ev(`G.stage.udRes = ['u', 'u', 'd', 'u', 'd', 'd']; G.stage.stock = 0; G.stage.stockQ = []; G.stage.startEpoch(3)`);
  assert.equal(g.ev('G.stage.stock'), 6);
  assert.equal(g.ev('G.stage.udRes.length'), 0);
  assert.equal(g.ev('baryonTrios(G.stage.stockQ)'), 2, 'цвета поровну — две готовые тройки');
});

test('c s b μ τ: каждый снятый распад даёт ✦ по массе, не только первый', () => {
  const g = toField(); give(g, 'mu');
  g.ev(`(() => { const S = G.stage; S.hig = 1; S.decSeen.add('mu'); const o = S.mk('mu', false, P.x, P.y, 0, .01); o.born = 1; o.life = .01; })()`);
  g.step(2);
  g.ev(`(() => { const S = G.stage; S.shotCd = 0; S.en = E_CAP; globalThis.__kn = S.kn; S.snapshot(); })()`);
  const v = g.ev(`G.stage.value('mu')`);
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === SM.mu.sym + '→ +${v} ✦')`), 'распад оплачен');
  assert.ok(g.ev('G.stage.kn - __kn') >= v);
});

test('t: распался у детектора — ⚡ до полного', () => {
  const g = toField(); give(g, 't');
  g.ev(`(() => { const S = G.stage; S.hig = 1; S.en = 0; const o = S.mk('t', false, P.x + .3, P.y, 0, .01); o.born = 1; o.life = .01; })()`);
  g.step(2);
  assert.equal(g.ev('G.stage.en'), g.ev('E_CAP'));
});

test('лавка: «Рождение X» говорит, зачем оно', () => {
  const g = toField();
  for (const [sp, want] of [['e', 'γγ'], ['u', 'эпохе 4'], ['c', '✦'], ['t', '⚡']]) assert.ok(g.ev(`G.stage.role('${sp}')`).includes(want), sp);
});
