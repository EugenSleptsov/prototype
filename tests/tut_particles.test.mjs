// Обучение эпохи 1 «Частиц» (просьба 28.11): каждое действие — отдельно и по порядку.
// Свет вспышки кончается (собрать весь) → закон «Свет» генерирует свет сам → «Свет II» впервые зажигает
// 2 горячих источника → свет из источника открывает соединение → зарядка тратит ⚡ (и возвращает, если разжать).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

function lit(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump());
  g.ev(`Cine.clear(); Spot.clear(); Codex.see('ph')`);
  return g;
}
const first = g => g.ev('(() => { const s = G.stage.steps().find(x => !x.d); return s ? s.t : null; })()');
const nPh = g => g.ev(`G.stage.phLeft()`);

test('обучение: свет вспышки кончается, нового нет и соединять нельзя — пока нет закона «Свет»', () => {
  const g = lit();
  assert.equal(g.ev('G.stage.ep'), 0);
  assert.ok(g.ev('G.stage.stashN') > 0, 'вспышка дала свет');
  assert.equal(first(g), 'Собрать весь свет');
  assert.equal(g.ev('G.stage.fieldOn()'), false, 'соединять пока нельзя');
  assert.equal(g.ev('G.stage.hzN()'), 0, 'горячих источников ещё нет');
  // весь свет пойман: в мире — ни одного фотона, и новые не рождаются
  g.ev('(() => { const S = G.stage; for (const o of S.p) if (o.sp === "ph") o.dead = true; })()');
  g.step(60 * 10);
  assert.equal(nPh(g), 0, 'без закона свет не генерируется');
  assert.ok(g.ev('G.stage.outAt') >= 0, 'свет кончился — замечено');
  assert.equal(first(g), 'Сформировать закон «Свет»');
  assert.ok(g.ev('G.stage.shopOk()'), 'лавка открыта — там закон');
});

test('обучение: закон «Свет» генерирует свет по Вселенной; «Свет II» впервые зажигает 2 источника; свет из них открывает соединение', () => {
  const g = lit();
  g.ev('(() => { const S = G.stage; for (const o of S.p) if (o.sp === "ph") o.dead = true; })()');
  g.step(60 * 5);
  g.ev(`(() => { const S = G.stage; S.kn += 500; S.chap = 3; S.buy(S.shopItems().findIndex(it => it.r && it.r.k === 'ph')); })()`);
  g.ev('Cine.clear(); Spot.clear()');
  assert.equal(g.ev('G.stage.rs.ph'), 1);
  g.step(60 * 6);
  assert.ok(nPh(g) > 3, `свет генерируется сам: ${nPh(g)} γ`);
  assert.equal(g.ev('G.stage.hz.length'), 0, 'закон I источников не зажигает');
  assert.equal(first(g), 'Поймать 15 γ нового света');
  // ловля засчитывается
  g.ev('(() => { const S = G.stage; S.lawCaught = 15; })()');
  assert.equal(first(g), 'Ещё больше света: улучшить закон «Свет»');
  assert.equal(g.ev('G.stage.fieldOn()'), false, 'соединять ещё рано');
  g.ev(`(() => { const S = G.stage; S.buy(S.shopItems().findIndex(it => it.r && it.r.k === 'ph')); })()`);
  g.ev('Cine.clear(); Spot.clear()');
  assert.equal(g.ev('G.stage.rs.ph'), 2);
  assert.equal(g.ev('G.stage.hz.length'), 2, '«Свет II» — сразу 2 горячих источника у детектора');
  assert.equal(g.ev('G.stage.hzN()'), 2);
  assert.equal(first(g), 'Поймать 5 γ у горячего источника');
  // свет у источника: пойманный фотон рядом с пятном
  g.ev(`(() => { const S = G.stage, z = S.hz[0]; P.x = z.x; P.y = z.y; S.hzCaught = 4;
    const o = S.mk('ph', false, z.x, z.y, 0, S.T); o.born = 1; S.absorb(o); })()`);
  g.step(2);
  assert.ok(g.ev('G.stage.hzCaught') >= 5, 'фотон у источника засчитан');
  assert.equal(g.ev('G.stage.joinOk'), true);
  assert.equal(g.ev('G.stage.fieldOn()'), true, 'соединение открыто');
  assert.equal(first(g), 'Соединить два фотона: электрон');
});

test('обучение: зарядка тратит ⚡ по ступени и подсвечивает трату на шкале; разжал без удара — ⚡ вернулись', () => {
  const g = lit();
  g.ev(PREP.light); g.ev(PREP.hit);
  g.ev('Cine.clear(); Spot.clear()');
  // зажать пару и держать до ступени 2: шкала потеряла 2 ⚡, два деления вспыхнули
  const r = JSON.parse(g.ev(`(() => { const S = G.stage; S.en = E_CAP;
    for (const o of S.p) if (!o.dead && Math.hypot(o.x - P.x, o.y - P.y) < S.fr() * 1.6) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T), B = S.mk('ph', false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    mouse.clicked = true; mouse.down = true; let n = 0, fx = 0, t2 = null;
    while (n < 900 && !(S.focus && (S.focus.lv || 0) >= 2)) { update(1 / 60); n++; fx = Math.max(fx, S.spendFx.length); if (S.focus && S.focus.lv >= 1 && t2 === null) t2 = n; }
    const en = S.en; S.drop(); mouse.down = false; update(1 / 60);
    return JSON.stringify({ lv: S.focus ? 1 : 0, spent: E_CAP - en, fx, n, t2, back: S.en }); })()`));
  assert.ok(r.spent >= 2 - 1e-6 && r.spent < 3, `ступень 2 взяла 2 ⚡, взято ${r.spent}`);
  assert.ok(r.fx >= 1, 'трата видна на шкале');
  assert.ok(r.n - r.t2 >= 60 * 1.5, `ступень длится ≥ 1,5 с (медленная зарядка): ${(r.n - r.t2) / 60} с`);
  assert.ok(Math.abs(r.back - 10) < 1e-6, `разжал — ⚡ вернулись: ${r.back}`);
});
