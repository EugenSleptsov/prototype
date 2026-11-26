// Что родит удар (ступени у детектора): ещё не открываемое — не показываем; не созданное, но доступное — «?»;
// созданное — символом. У тяжёлой пары частица + античастица золотая полоса Z — посередине шкалы.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function field() {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  return g;
}
// подписи, которые рисует поле при двух зажатых фотонах
const labels = g => g.ev(`(() => { const S = G.stage, out = [], lb = label; label = (t, ...r) => { out.push(String(t)); return lb(t, ...r); };
  const a = S.mk('ph', false, P.x + .2, P.y, 0, S.T), b = S.mk('ph', false, P.x - .2, P.y, 0, S.T); a.cap = b.cap = true;
  S.focus = { cap: [a, b], q: 0, E: 0, lv: 0, ang: 0, t: 0 }; S.drawField(400, 300, 40);
  label = lb; S.focus = null; a.dead = b.dead = true; return out; })()`);

test('ступени удара: закрытое поколение не показываем; не созданное — «?»; созданное — символом', () => {
  const g = field();
  let L = labels(g);
  assert.ok(L.includes('?'), `e ещё не создан — «?»: ${L}`);
  for (const s of ['e⁻', 'μ⁻', 'τ⁻', 'μ', 'τ']) assert.ok(!L.includes(s), `не показываем ${s}: ${L}`);
  assert.ok(!L.some(t => /сначала/.test(t)), 'и подсказок «сначала …» тоже нет');
  g.ev(`Codex.see('e')`);
  L = labels(g);
  assert.ok(L.includes(g.ev('SM.e.sym')), `e создан — символом: ${L}`);
  assert.ok(L.includes('?'), 'μ теперь открываем — «?»');
  assert.ok(!L.includes(g.ev('SM.ta.sym')), 'τ — пока не открыть μ, не показываем');
});

test('тяжёлая пара: полоса Z — посередине шкалы заряда, а не в начале', () => {
  const g = field();
  const q = g.ev(`(() => { const S = G.stage; S.hig = 1; const a = S.mk('e', false, P.x + .2, P.y, 0, 1), b = S.mk('e', true, P.x - .2, P.y, 0, 1);
    const f = { cap: [a, b], q: 0, E: 0, lv: 0, ang: 0, t: 0 }, bd = S.band(f); return bd && [S.qOf(bd[0], f), S.qOf(bd[1], f), S.qOf(bd[0]), S.qOf(bd[1])]; })()`);
  assert.ok(q, 'полоса есть');
  const [lo, hi, lo0, hi0] = q;
  assert.ok(lo > .35 && hi < .75 && lo < .55 && hi > .55, `середина полосы — около середины шкалы: ${lo.toFixed(2)}…${hi.toFixed(2)}`);
  assert.ok(hi - lo > 2 * (hi0 - lo0), `и полоса шире прежней: ${(hi - lo).toFixed(2)} против ${(hi0 - lo0).toFixed(2)}`);
});
