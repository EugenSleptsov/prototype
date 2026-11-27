// Грилл дизайн-документов (REVIEW_DESIGN.md), раздел 5, правки 1–4:
// бульон «Молекул» без автопилота, след «Атомов» с запасом чернил, отмена броска на уровнях 2–6, счёт по миру, а не по камере.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGame, PREP } from './harness.mjs';

function toStage(key, seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`jumpTo(STAGES.findIndex(s => s.key === '${key}'))`);
  g.step(120);
  return g;
}

test('REVIEW_DESIGN 5.1: без касаний законы «Синтез» варят не больше M_SOUP_UNI — уровень сам не кончается', () => {
  for (const laws of [['H₂O', 'CH₄', 'NH₃', 'O₂']]) { // четыре закона — самый быстрый автопилот (раньше 10/10 за 105–112 с)
    const g = toStage('molecules');
    g.ev(`(() => { const S = G.stage; S.st.bonds = 1; for (const f of ['H₂O','NH₃','CH₄','H₂O₂','CH₃OH','O₂','N₂']) S.found.push(f);
      for (const f of ${JSON.stringify(laws)}) { S.res.add(f); Uni.learn(S, f, f, f, UNI_LVL); } })()`);
    g.step(60 * 300); // облако сжимается за M_LIFE: уровень кончится, но не пройденным
    assert.ok(g.ev('G.stage.doneAt === null || G.stage.failed'), `${laws}: уровень прошёл сам`);
    assert.ok(g.ev('G.stage.st.soup') <= g.ev('M_SOUP_UNI'), `${laws}: бульон ${g.ev('G.stage.st.soup')}`);
    assert.equal(g.ev('G.stage.st.soup'), g.ev('M_SOUP_UNI'), `${laws}: свою долю законы доваривают`);
  }
});

test('REVIEW_DESIGN 5.1: после доли Вселенной бульон доводит рогатка', () => {
  const g = toStage('molecules');
  g.ev(`(() => { const S = G.stage; S.res.add('H₂O'); S.res.add('NH₃'); S.st.soup = S.st.soupU = M_SOUP_UNI; S.autoChem = () => {}; S.tide = () => {}; })()`);
  // вода рукой: O и два H, слияние «рукой»
  g.ev(`(() => { const S = G.stage; for (const m of S.m) m.dead = true; S.m = [];
    const o = S.newMol('O', P.x, P.y); o.age = 2; const h1 = S.newMol('H', P.x + 40, P.y); h1.age = 2; S.merge(o, 0, 0, h1, 0, 0, 'hand');
    const h2 = S.newMol('H', P.x - 40, P.y); h2.age = 2; S.merge(o, 0, o.atoms[0].b.findIndex(x => x < 0), h2, 0, 0, 'hand'); })()`);
  assert.equal(g.ev('G.stage.st.soup'), g.ev('M_SOUP_UNI') + 1, 'вода рогаткой идёт в бульон сверх доли законов');
});

const toAtoms = (seed = 3) => { const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  while (g.ev('G.stage.key') !== 'atoms') g.ev('advance(); G.trans = 99');
  g.step(30); return g; };
// «умелый» игрок: короткие росчерки поперёк электронов у голых ионов, через дрожащие атомы, поперёк УФ; закон — как только по карману
const SKILL = `globalThis.__skill = (secs, opt = {}) => { const S = G.stage; let q = [], cool = 0, n0 = null;
  const rows = [];
  for (let f = 0; f < 60 * secs && S.doneAt === null; f++) {
    if (!S.rs.rec && S.shopItems().some(it => it.k === 'rec') && S.bal() >= A_COST) S.buy(S.shopItems().findIndex(it => it.k === 'rec'));
    if (!q.length && (cool -= 1 / 60) <= 0 && S.ink >= (opt.ink ?? 2.2)) {
      let a = null, b = null;
      const exI = S.ions.find(i => i.ex > 0 && G.T - i.exAt > .3 && inView(i.x, i.y, -1));
      if (exI) { a = [exI.x - .8, exI.y]; b = [exI.x + .8, exI.y]; }
      else {
        const uv = S.ph.find(p => p.hard && !p.esc && inView(p.x, p.y, -1));
        const e = S.el.filter(e => !e.dead && e.slow <= 0 && inView(e.x, e.y, -1) && S.ions.some(i => i.ne < i.Z && Math.hypot(i.x - e.x, i.y - e.y) < 2.5))[0];
        const t = e || uv;
        if (t) { const sp = Math.hypot(t.vx, t.vy) || 1, nx = -t.vy / sp, ny = t.vx / sp, ax = t.x + t.vx * .12, ay = t.y + t.vy * .12; a = [ax - nx * .8, ay - ny * .8]; b = [ax + nx * .8, ay + ny * .8]; }
      }
      if (a) { for (let k = 0; k <= 4; k++) q.push([a[0] + (b[0] - a[0]) * k / 4, a[1] + (b[1] - a[1]) * k / 4]); q.push(null); cool = opt.cool ?? .15; }
    }
    if (q.length) { const p = q.shift(); if (p) { const [x, y] = W2S(p[0], p[1]); mouse.x = x; mouse.y = y; mouse.down = true; } else mouse.down = false; }
    update(1 / 60);
    if (f % 1200 === 1199) rows.push(Math.round(S.clock) + ':' + Math.round(S.neutral() * 100) + '%');
  }
  mouse.down = false;
  return { done: S.doneAt !== null, t: Math.round(S.doneAt ?? S.clock), n: Math.round(S.neutral() * 100), seen: [...S.seenN].join(','), rec: !!S.rs.rec, rows: rows.join(' '), kn: Math.round(S.kn) };
};`;

test('REVIEW_DESIGN 5.2: у следа запас — каракули одним зажатием туманность не гасят, точные росчерки — гасят', () => {
  const g = toAtoms(1);
  g.ev(`for (let i = 0; i < 60 * 90; i++) { const T = G.T; mouse.down = true; mouse.x = 400 + 360 * Math.sin(T * 2.1); mouse.y = 300 + 260 * Math.sin(T * 3.3 + 1); update(1 / 60); } mouse.down = false`);
  const n = g.ev('G.stage.neutral()');
  assert.ok(n < .4, `слепой зигзаг 90 с: нейтральных ${Math.round(n * 100)} % (было 74–79 % за 120 с)`);
  assert.ok(g.ev('G.stage.ink') < INK_MAX_OF(g), 'запас тратится');
  const h = toAtoms(1); h.ev(SKILL); // сиды 1–6: 58 с … дольше 240 (последний ион — редкий гость), 1 — 142 с
  const r = h.ev('__skill(240)');
  assert.equal(r.done, true, JSON.stringify(r));
});
const INK_MAX_OF = g => g.ev('INK_MAX');

test('REVIEW_DESIGN 5.2: запас кончился — след рвётся; разрыв не тормозит и кончает «росчерк»', () => {
  const g = toAtoms(); g.ev('G.stage.el = []; G.stage.ph = []; G.stage.tide = () => {}; G.stage.ink = 1');
  g.ev(`(() => { const [x, y] = W2S(P.x - 6, P.y + 3); mouse.x = x; mouse.y = y; mouse.down = true; update(1 / 60);
    for (let k = 1; k <= 30; k++) { const [x2, y2] = W2S(P.x - 6 + k * .4, P.y + 3); mouse.x = x2; mouse.y = y2; update(1 / 60); } })()`);
  assert.equal(g.ev('G.stage.dry'), true, 'запаса на 12 ед. не хватило');
  g.ev('for (let i = 0; i < 60; i++) update(1 / 60)'); // копится, след продолжается с разрывом
  assert.ok(g.ev('G.stage.tr.some(p => p.gap)'), 'точка после разрыва помечена');
  g.ev('mouse.down = false; update(1 / 60)');
});

test('REVIEW_DESIGN 5.2: ручная цена — на электрон: сам спрыгнул пойманный следом — ✦ твои, но по цене Вселенной', () => {
  const g = toAtoms(); g.ev('G.stage.el = []; G.stage.ph = []; G.stage.tide = () => {}');
  // водород: электрон поймал ты, спрыгнул сам — +2 (не +4), в твою копилку
  g.ev(`globalThis.__h = G.stage.ion(1, P.x, P.y, 2); G.stage.ions.push(__h); G.stage.seenN.add(1);
    G.stage.capture(__h, { by: 'hand' }); globalThis.__k0 = G.stage.kn; G.stage.relax(__h, 'self')`);
  assert.equal(g.ev('G.stage.kn - __k0'), 2, 'самоосаживание — по цене Вселенной');
  // кислород: один электрон следом, остальные — «Рекомбинация»: нейтральный атом не по ручной цене
  g.ev(`globalThis.__o = G.stage.ion(8, P.x + 3, P.y, 2); G.stage.ions.push(__o); G.stage.seenN.add(8);
    G.stage.capture(__o, { by: 'hand' }); G.stage.relax(__o, 'hand'); for (let i = 0; i < 7; i++) G.stage.capture(__o, { by: 'auto' });
    globalThis.__k1 = G.stage.kn; globalThis.__u1 = G.stage.uni.reduce((s, u) => s + (u.kn || 0), 0); G.stage.relax(__o, 'hand')`);
  assert.equal(g.ev('__o.ne'), 8);
  // осадил следом +1, K-оболочка +2, нейтральный — +2, а не +4: семь из восьми электронов поймала Вселенная
  assert.equal(g.ev('G.stage.kn - __k1'), 1 + 2 + 2, 'один ручной из восьми — нейтральный O не по ручной цене');
  g.ev(`globalThis.__o2 = G.stage.ion(8, P.x - 3, P.y, 2); G.stage.ions.push(__o2);
    for (let i = 0; i < 4; i++) G.stage.capture(__o2, { by: 'hand' }); for (let i = 0; i < 4; i++) G.stage.capture(__o2, { by: 'auto' });
    globalThis.__k2 = G.stage.kn; G.stage.relax(__o2, 'hand')`);
  assert.equal(g.ev('G.stage.kn - __k2'), 1 + 2 + 4, 'половина электронов твоя — ручная цена');
});

test('REVIEW_DESIGN 5.2: возбуждённый атом ещё светится — в долю нейтральных идёт после того, как спрыгнет', () => {
  const g = toAtoms(); g.ev('G.stage.el = []; G.stage.ph = []; G.stage.tide = () => {}');
  g.ev(`for (const i of G.stage.ions) { i.ne = i.Z; i.ex = 0; } globalThis.__n0 = G.stage.neutral();
    globalThis.__c = G.stage.ions.find(i => inRef(i.x, i.y) && i.Z === 1) || G.stage.ions.find(i => inRef(i.x, i.y)); __c.ex = 1;`);
  assert.ok(g.ev('G.stage.neutral() < __n0'), 'дрожащий — ещё не нейтральный');
  g.ev('G.stage.relax(__c, "self")');
  assert.ok(Math.abs(g.ev('G.stage.neutral() - __n0')) < 1e-9);
});

// взять тело рогаткой, оттянуть на полрезинки, отменить — тело остаётся, броска нет, отпускание — не бросок
const HOLD_CANCEL = `(() => { const S = G.stage, sl = S.sl;
  const b = S.bodies().filter(o => !o.dead && inView(o.x, o.y, -2)).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
  if (!b) return 'нет тела';
  const [x, y] = W2S(b.x, b.y); mouse.x = x; mouse.y = y; mouse.down = true; mouse.clicked = true; update(1 / 60);
  if (sl.held !== b) return 'не взял';
  mouse.x = x - slingFullPx() * .5; update(1 / 60);
  if (!sl.aim) return 'нет прицела';
  const shots = sl.shots, ok = stCanDrop() && stDrop(); update(1 / 60);
  const out = { ok, held: !!sl.held, can: stCanDrop() };
  mouse.down = false; for (let i = 0; i < 10; i++) update(1 / 60);
  return JSON.stringify({ ...out, shots: sl.shots - shots, v: +Math.hypot(b.vx, b.vy).toFixed(2) });
})()`;

test('REVIEW_DESIGN 5.3: отмена броска — одна на игру: на уровнях 2–6 правая кнопка / X / Esc / ✕ отпускают взятое без броска', () => {
  for (const key of ['quarks', 'nuclei', 'atoms', 'molecules']) {
    const g = toStage(key, 4); // сид 4: рядом с телом никто не пролетает — его скорость после отмены видна чисто
    g.ev('if (G.stage.tide) G.stage.tide = () => {}');
    const r = g.ev(HOLD_CANCEL);
    assert.equal(typeof r === 'string' && r.startsWith('{'), true, `${key}: ${r}`);
    const o = JSON.parse(r);
    assert.deepEqual({ ok: o.ok, held: o.held, can: o.can, shots: o.shots }, { ok: true, held: false, can: false, shots: 0 }, `${key}: ${r}`);
    assert.ok(o.v < 1, `${key}: после отмены тело не брошено (v ${o.v})`);
  }
});

test('REVIEW_DESIGN 5.3: «Звёзды» — яма газа отменяется без решения (на ПК раньше никак)', () => {
  const g = toStage('stars');
  assert.equal(g.ev('G.stage.phase'), 'gas');
  g.ev(`(() => { const [x, y] = W2S(P.x, P.y); mouse.x = x; mouse.y = y; mouse.down = true; for (let i = 0; i < 90; i++) update(1 / 60); })()`);
  assert.ok(g.ev('!!G.stage.well'), 'яма');
  assert.equal(g.ev('stCanDrop() && stDrop()'), true);
  g.ev('for (let i = 0; i < 10; i++) update(1 / 60)');
  assert.equal(g.ev('G.stage.well'), null, 'ямы нет');
  assert.equal(g.ev('G.stage.phase'), 'gas', 'облако не зажглось и не схлопнулось');
});

test('REVIEW_DESIGN 5.3: сенсор — ✕ видна, пока что-то в руке, звук и ×4 тогда спрятаны; столбец кнопок снизу вверх', () => {
  const g = loadGame({ seed: 3, touch: true });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`jumpTo(STAGES.findIndex(s => s.key === 'nuclei'))`); g.step(120);
  g.ev('touchBar()');
  assert.equal(g.ev(`document.getElementById('t-drop').style.display`), 'none');
  assert.equal(g.ev(`document.getElementById('t-mute').style.display`), '');
  g.ev(`(() => { const S = G.stage, b = S.bodies().filter(o => inView(o.x, o.y, -2))[0], [x, y] = W2S(b.x, b.y); mouse.x = x; mouse.y = y; mouse.down = true; mouse.clicked = true; update(1 / 60); touchBar(); })()`);
  assert.equal(g.ev(`document.getElementById('t-drop').style.display`), '', 'держишь — ✕ на виду');
  assert.equal(g.ev(`document.getElementById('t-mute').style.display`), 'none', 'звук не задеть');
  assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /#tbar\{display:flex;flex-direction:column-reverse/, '✕ (первая) — нижняя, у пальца');
});

test('REVIEW_DESIGN 5.4: «Ядра» — гелий считается на месте уровня: сдвиг карты долю не меняет; на финише доля застывает', () => {
  const g = toStage('nuclei');
  g.ev('G.stage.tide = () => {}; G.stage.autoFuse = () => {}; G.stage.spontaneous = () => {}');
  // кучка ⁴He в стороне от места уровня
  g.ev(`for (let i = 0; i < 8; i++) G.stage.mk(2, 2, G.stage.yc.x + 18 + i * .5, G.stage.yc.y, 0, 0)`);
  const y0 = g.ev('G.stage.Y()');
  g.ev('panBy(-18 * cam.z, 0); cam.x = P.x; cam.y = P.y');
  assert.ok(Math.abs(g.ev('G.stage.Y()') - y0) < 1e-9, 'карта у кучки гелия — доля та же');
  g.ev('G.stage.yEnd = G.stage.Y(); G.stage.mk(2, 2, G.stage.yc.x, G.stage.yc.y, 0, 0)');
  assert.ok(Math.abs(g.ev('G.stage.Y()') - y0) < 1e-9, 'после финиша доля застыла (очки и «Звёзды» — по ней)');
});

test('REVIEW_DESIGN 5.4: «Атомы» — доля нейтральных на месте туманности: сдвиг карты не поднимает её, выброшенный голый ион в счёте', () => {
  const g = toAtoms();
  g.ev('G.stage.tide = () => {}; G.stage.ph = []; G.stage.el = []');
  const n0 = g.ev('G.stage.neutral()');
  g.ev('panBy(-25 * cam.z, 0); cam.x = P.x; cam.y = P.y');
  assert.ok(Math.abs(g.ev('G.stage.neutral()') - n0) < 1e-9, 'увёл карту от голых ионов — доля та же');
  g.ev('panBy(25 * cam.z, 0); cam.x = P.x; cam.y = P.y');
  // голый ион рогаткой далеко за край счёта — всё равно идёт в долю, пока не одет
  g.ev(`globalThis.__b = G.stage.ions.find(i => i.ne === 0 && i.Z >= 6 && G.stage.counted(i)) || Object.assign(G.stage.ion(8, P.x, P.y, 2), {}); if (!G.stage.ions.includes(__b)) G.stage.ions.push(__b);
    globalThis.__n1 = G.stage.neutral(); G.stage.launch(__b, 5, 0); __b.x += 60`);
  assert.equal(g.ev('G.stage.counted(__b)'), true);
  assert.ok(Math.abs(g.ev('G.stage.neutral() - __n1')) < 1e-9, 'брошенный голый ион за краем — в счёте');
});
