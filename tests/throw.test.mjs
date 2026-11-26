// Бросок на ходу (частицы): каждый квант пары несёт заряд и бьёт сам — два удара за один заряд.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

test('бросок на ходу: оба кванта пары бьют встречные кванты — два удара за один заряд', () => {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  const r = g.ev(`(() => { const S = G.stage; S.en = E_CAP;
    for (const o of S.p) if (!o.dead && Math.hypot(o.x - P.x, o.y - P.y) < S.fr() * 3) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T), B = S.mk('ph', false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    mouse.clicked = true; mouse.down = true; let n = 0;
    while (n < 600 && !(S.focus && S.focus.cap.length === 2 && (S.focus.lv || 0) >= 1)) { update(1 / 60); n++; }
    const thr0 = S.st.thr;
    // мишени впереди: по одной на линии каждого кванта (разлёт ±0,1 рад)
    const T1 = S.mk('ph', false, P.x + 2.2, P.y - .22, Math.PI, S.T), T2 = S.mk('ph', false, P.x + 2.2, P.y + .22, Math.PI, S.T);
    for (const t of [T1, T2]) { t.born = 1; t.cd = 0; t.v = 0.01; }
    P.vx = THROW_V * 2; P.vy = 0; mouse.down = false; update(1 / 60);
    P.vx = 0; for (let i = 0; i < 90; i++) update(1 / 60);
    return { thr: S.st.thr - thr0, thr2: S.st.thr2 || 0, floats: S.floats.map(f => f.txt) }; })()`);
  assert.ok(r.thr >= 2, `два удара броском: ${JSON.stringify(r)}`);
  assert.ok(r.thr2 >= 1 && r.floats.some(t => /второй удар/.test(t)), 'второй удар отмечен');
});
