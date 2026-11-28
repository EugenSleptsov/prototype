// Второе ревью, «Звёзды»: №6б — доля гелия Y с «Ядер» задаёт долю ⁴He в недрах на старте (раньше недра сами доводили её
// до ~55 %, и Y ничего не решала): больше гелия — углерод раньше, с Y = 0 уровень проходим (водород выгорает в гелий);
// №8а — выбор массы честный: тяжёлая горячая, но живёт ~50 с (цейтнот), лёгкая спокойная (~130 с), но недра прохладнее.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function toStars(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'stars') g.ev('advance(); G.trans = 99');
  g.step(240);
  return g;
}
// зажечь звезду массы mu из настоящего комка (в полосе зажигания) при доле гелия облака Y
const IGN = (mu, Y) => `(() => { const S = G.stage; S.heP = ${Y}; S.gas = S.gas.filter(q => !inView(q.x, q.y, 3));
  const n = Math.round(lerp(S.lo, S.hi, ${mu}));
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 1.2; S.gas.push(S.puff(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 0, 0, 1)); }
  S.ignite(P.x, P.y, ${mu}); })()`;
// бот недр: раз в gap с (±30 %) бросает по заданию — смотрит пунктир (predict) и бросает только то, что попадёт в цель;
// скорость — середина окна слияния с ошибкой sig·vmax, направление — с ошибкой ang рад; покупает закон, как только хватает ✦.
// gap 3 — обычный игрок, gap 6 — медленный. stopC — остановиться на первом углероде
const BOT = `globalThis.__sbot = (secs, gap, sig, ang, stopC = false) => {
  const S = G.stage, dt = 1 / 60; let cd = .8, heT = null;
  const ok = o => S.free(o) && o.age > .3 && inView(o.x, o.y, 4);
  const aim = (a, b) => { const lo = S.vBar(a, b), hi = Math.min(S.vMax(a, b), S.vmax()), v = (lo + hi) / 2, t = Math.hypot(b.x - a.x, b.y - a.y) / v;
    const tx = b.x + b.vx * t - a.x, ty = b.y + b.vy * t - a.y, L = Math.hypot(tx, ty) || 1; return [tx / L, ty / L, v]; };
  const pick = (tk, bk) => {
    for (const tg of S.o.filter(o => ok(o) && nkey(o) === tk)) {
      const cs = S.o.filter(o => o !== tg && ok(o) && nkey(o) === bk && Math.hypot(o.x - tg.x, o.y - tg.y) < 9).sort((u, v) => Math.hypot(u.x - tg.x, u.y - tg.y) - Math.hypot(v.x - tg.x, v.y - tg.y)).slice(0, 4);
      for (const a of cs) { const [ux, uy, v] = aim(a, tg), pr = S.predict(a, tg.vx + ux * v, tg.vy + uy * v); if (pr.hit && /^→/.test(pr.label) && Math.hypot(pr.x - tg.x, pr.y - tg.y) < 3) return [a, tg]; }
    }
    return null;
  };
  for (let i = 0; i < secs * 60 && S.doneAt === null && !(stopC && heT !== null); i++) {
    if (heT === null && S.o.some(o => nkey(o) === '6,6')) heT = S.clock - S.ignAt;
    if ((cd -= dt) <= 0) {
      cd = gap * (.7 + Math.random() * .6);
      if (S.shopItems().length && S.bal() >= ST_COST) S.buy(0);
      const cC = S.cnt('6,6'), cO = S.cnt('8,8'), cN = S.cnt('7,7'), c13 = S.o.filter(o => ok(o) && nkey(o) === '6,7').length;
      let pair = null;
      if (c13 && cN < 1) pair = pick('6,7', '1,0');
      if (!pair && cC && cO < 2) pair = pick('6,6', '2,2');
      if (!pair && cC && cN + c13 < 1) pair = pick('6,6', '1,0');
      if (!pair) pair = pick('4,4', '2,2');
      if (!pair && !(S.rs.syn && S.cnt('4,4'))) pair = pick('2,2', '2,2');
      if (pair) {
        const [a, b] = pair, [ux, uy, v0] = aim(a, b), v = clamp(v0 + randn() * sig * S.vmax(), .6, S.vmax()), e = randn() * ang;
        S.launch(a, b.vx + (ux * Math.cos(e) - uy * Math.sin(e)) * v, b.vy + (ux * Math.sin(e) + uy * Math.cos(e)) * v);
      } else cd = .3;
    }
    update(dt);
  }
  return { failed: S.failed, done: S.doneAt !== null, t: S.doneAt === null ? null : S.doneAt - S.ignAt, heT, life: S.life };
};`;
const play = (seed, mu, Y, gap, opt = {}) => {
  const g = toStars(seed); g.ev(BOT); g.ev(IGN(mu, Y));
  return { g, r: g.ev(`__sbot(${opt.secs ?? 300}, ${gap}, ${opt.sig ?? .1}, ${opt.ang ?? .06}, ${!!opt.stopC})`) };
};
const heIn = 'G.stage.o.filter(o => !o.dead && nkey(o) === "2,2").length', heView = 'G.stage.o.filter(o => !o.dead && nkey(o) === "2,2" && inView(o.x, o.y)).length';

test('ревью-2 №6б: доля ⁴He в недрах на старте — ровно Y с «Ядер» (с Y = 0 — ни одного)', () => {
  for (const Y of [0, .25, .5]) {
    const g = toStars();
    g.ev(IGN(.5, Y));
    const n = g.ev('G.stage.o.length'), he = g.ev(heIn);
    assert.equal(he, Math.round(Y * n), `Y ${Y}: ⁴He ${he} из ${n}`);
    assert.equal(g.ev('G.stage.he0'), he / n);
    assert.equal(g.ev('G.stage.heCore()'), he / n, 'состав недр на старте — тот же');
    assert.match(g.ev('G.stage.hud().sub'), new RegExp(`⁴He в ядре ${Math.round(he / n * 100)} %`));
  }
});

test('ревью-2 №6б: итог «Ядер» виден при зажигании — «гелий из «Ядер»: N % → в ядре ⁴He …»', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'nuclei') g.ev('advance(); G.trans = 99');
  g.step(240);
  g.ev('G.stage.Y = () => .4; G.stage.doneAt = 0; advance(); G.prev = null; G.trans = 99; update(1 / 60)');
  assert.equal(g.ev('G.stage.key'), 'stars');
  g.ev(IGN(.5, .4));
  const pct = g.ev('Math.round(G.stage.he0 * 100)');
  assert.ok(Math.abs(pct - 40) <= 3, `в ядре ${pct} %`);
  assert.ok(g.ev(`G.stage.floats.some(f => f.txt === 'гелий из «Ядер»: 40 % → в ядре ⁴He ${pct} %')`), 'строка показана');
});

test('ревью-2 №6б: водород выгорает в гелий — доля ⁴He растёт к ST_HEMAX, у тяжёлой быстрее; конвекция несёт этот состав', () => {
  const at = (mu, dt) => { const g = toStars(); g.ev(IGN(mu, 0)); g.ev(`G.stage.clock = G.stage.ignAt + ${dt}`); return g.ev('G.stage.heCore()'); };
  assert.equal(at(0, 0), 0);
  const l20 = at(0, 20), h20 = at(1, 20);
  assert.ok(l20 > .05 && h20 > l20, `за 20 с: лёгкая ${l20}, тяжёлая ${h20}`);
  assert.ok(Math.abs(at(0, 1e4) - .7) < 1e-6, 'не выше ST_HEMAX — протоны нужны азоту');
  // первые секунды при Y = 0 недра почти без гелия, при Y = 0,5 — гелия вдоволь
  const g0 = toStars(); g0.ev(IGN(0, 0)); g0.step(120);
  const g5 = toStars(); g5.ev(IGN(0, .5)); g5.step(120);
  const n0 = g0.ev(heView), n5 = g5.ev(heView);
  assert.ok(n0 <= 3 && n5 >= 8, `через 2 с ⁴He: Y 0 — ${n0}, Y 0,5 — ${n5}`);
  // без игрока гелий копится сам (4p → ⁴He и конвекция): с Y = 0 через 30 с его уже хватает на углерод
  g0.step(60 * 28);
  assert.ok(g0.ev(heView) >= 6, `через 30 с ⁴He ${g0.ev(heView)}`);
});

test('ревью-2 №6б: больше гелия с «Ядер» — углерод раньше (обычный игрок)', () => {
  // восемь сидов и большинство, а не три сида и порог: от любой мелочи в фазе газа случай расходится (28.11: на сидах 1–8
  // Y 0,4 — 85 с против 140 с, раньше в 7 из 8, восьмой — вничью)
  const first = Y => [1, 2, 3, 4, 5, 6, 7, 8].map(s => play(s, .5, Y, 3, { stopC: true, secs: 120 }).r.heT);
  const t0 = first(0), t4 = first(.4), sum = a => a.reduce((x, y) => x + y, 0);
  assert.ok(t0.every(t => t !== null) && t4.every(t => t !== null));
  const msg = `первый ¹²C: Y 0,4 — ${t4.map(t => t.toFixed(1))}, Y 0 — ${t0.map(t => t.toFixed(1))}`;
  assert.ok(sum(t4) < sum(t0) * .75, msg);
  assert.ok(t4.filter((t, i) => t < t0[i]).length >= 6, msg);
});

test('ревью-2 №6б: с Y = 0 уровень проходим — обычный игрок успевает до сверхновой и на лёгкой, и на тяжёлой', () => {
  for (const mu of [0, 1]) {
    const { r } = play(1, mu, 0, 3);
    assert.ok(r.done && !r.failed, `mu ${mu}: ${JSON.stringify(r)}`);
    assert.ok(r.t < r.life);
  }
});

test('ревью-2 №8а: тяжёлая — горячо, но цейтнот (~50 с), лёгкая — спокойно (~130 с)', () => {
  assert.ok(toStars().ev('ST_LIFE[1] >= 45 && ST_LIFE[1] <= 60 && ST_LIFE[0] >= 120'), 'сроки жизни');
  // обычный игрок успевает на обеих, на тяжёлой — быстрее; медленный успевает на лёгкой, а тяжёлая догорает раньше
  const L = play(5, 0, .25, 3).r, H = play(5, 1, .25, 3).r; // 28.11, сиды 1, 4–8: тяжёлая быстрее в 5 из 6 (сид 5 — 31 с против 54)
  assert.ok(!L.failed && !H.failed, `обычный: лёгкая ${L.t}, тяжёлая ${H.t}`);
  assert.ok(H.t < L.t, 'на тяжёлой — быстрее');
  assert.ok(H.life - H.t < 30, `тяжёлая: запас ${(H.life - H.t).toFixed(1)} с — цейтнот чувствуется`);
  const slowL = play(1, 0, .25, 6, { sig: .12, ang: .08 }), slowH = play(15, 1, .25, 6, { sig: .12, ang: .08 }); // медленный на тяжёлой — на грани: не успевают единицы сидов (28.11: 15 — да, 10 и 17 — успели за 40 и 31 с)
  assert.ok(slowL.r.done && !slowL.r.failed, `медленный на лёгкой: ${JSON.stringify(slowL.r)}`);
  assert.ok(slowH.r.done && slowH.r.failed, `медленный на тяжёлой не успел: ${JSON.stringify(slowH.r)}`);
  assert.ok(Math.abs(slowH.r.t - slowH.r.life) < .1, 'сверхновая — когда догорела');
  // догорела без цели — уровень не кончается (луп): пепел — облако новой звезды, снова сбор газа (stars_loop.test.mjs)
  const g = slowH.g;
  g.step(60 * 3);
  assert.equal(g.ev('G.stage.key'), 'stars');
  assert.equal(g.ev('G.stage.phase'), 'gas'); assert.equal(g.ev('G.stage.starN'), 1);
});

test('ревью-2 №8а: время видно — весы показывают срок жизни массы, внизу — «сверхновая через …», за 20 с — предупреждение', () => {
  const g = toStars();
  g.ev(`globalThis.__lbl = []; const L0 = label; label = (t, ...a) => { __lbl.push(String(t)); return L0(t, ...a); }`);
  // весы: комок у верха полосы — тяжёлая, «живёт 0:50»
  g.ev(`(() => { const S = G.stage; S.well = { x: P.x, y: P.y }; S.near = S.hi; S.drawGauge(1); })()`);
  assert.ok(g.ev(`__lbl.some(t => t === 'тяжёлая: горячо, но живёт ' + fmtClock(ST_LIFE[1]))`), g.ev('__lbl.join(" | ")'));
  g.ev(`__lbl.length = 0; (() => { const S = G.stage; S.near = S.lo; S.drawGauge(1); })()`);
  assert.ok(g.ev(`__lbl.some(t => t === 'лёгкая: живёт ' + fmtClock(ST_LIFE[0]) + ', но кислород трудно')`));
  g.ev(`G.stage.well = null; ${IGN(1, .25)}; __lbl.length = 0; G.stage.overlay(1)`);
  assert.ok(g.ev(`__lbl.some(t => t === 'звезда 100 M☉ · сверхновая через 0:50')`), g.ev('__lbl.join(" | ")'));
  g.ev('G.stage.clock = G.stage.ignAt + ST_LIFE[1] - 19.5'); g.step(1);
  assert.ok(g.ev(`G.stage.floats.some(f => /звезде осталось 20 с/.test(f.txt))`), 'предупреждение');
  g.ev('__lbl.length = 0; G.stage.overlay(1)');
  assert.ok(g.ev(`__lbl.some(t => t === 'звезда 100 M☉ · сверхновая через 0:19')`));
  g.step(30, true); // отрисовка с полоской горючего — без ошибок
});
