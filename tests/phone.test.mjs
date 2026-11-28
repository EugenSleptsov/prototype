// Список игрока (27.11): тап по ◉ — снимок; лестница удара 1–4 без «слабо»; без надписей «+1 ⚡ +1 ✦»;
// «Во Вселенной» — счётчик (Counts); законы на телефоне — фишкой; тексты без «Вселенная светит / генерирует».
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGame, PREP, ROOT } from './harness.mjs';

const lit = (opts = {}) => {
  const g = loadGame({ seed: 5, ...opts });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph'); Cine.clear(); Cine.tick(99)`);
  g.ev(`globalThis.__snaps = 0; { const S = G.stage, sn = S.snapshot; S.snapshot = function (...a) { __snaps++; return sn.apply(this, a); }; }`);
  return g;
};
// нажать и держать ◉ (мышь) sec секунд, затем отпустить
const press = (g, sec) => g.ev(`(() => { mouse.clicked = true; mouse.down = true; for (let i = 0; i < Math.round(${sec} * 60); i++) update(1 / 60);
  mouse.down = false; for (let i = 0; i < 6; i++) update(1 / 60); })()`);

test('тап по ◉ до TAP_MAX — снимок, даже если поле уже включилось; удержание — поле, без снимка', () => {
  const g = lit();
  assert.ok(g.ev('TAP_MAX') >= .3, 'тап пальцем длится до ~0,3 с');
  for (const s of [.1, .25, .32]) {
    g.ev(`(() => { const S = G.stage; for (const o of S.p) o.dead = true; S.focus = null; S.holding = false; __snaps = 0; })()`);
    press(g, s);
    assert.equal(g.ev('__snaps'), 1, `нажатие ${s} с — снимок`);
  }
  g.ev(`(() => { const S = G.stage; for (const o of S.p) o.dead = true; __snaps = 0; })()`);
  press(g, .8);
  assert.equal(g.ev('__snaps'), 0, 'удержание 0,8 с — поле, не снимок');
});

test('лестница удара 1–4 без нуля: взял пару — сразу ступень 1 (1 ⚡); без ⚡ — ступени нет', () => {
  const g = lit();
  const take = en => g.ev(`(() => { const S = G.stage; S.en = ${en}; S.focus = null; S.holding = false;
    for (const o of S.p) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T), B = S.mk('ph', false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    mouse.clicked = true; mouse.down = true; let n = 0;
    while (n < 120 && !(S.focus && S.focus.cap.length === 2)) { update(1 / 60); n++; }
    update(1 / 60); const r = { lv: S.focus ? S.focus.lv || 0 : -1, en: S.en }; mouse.down = false; update(1 / 60); S.drop && S.drop(); return r; })()`);
  const full = take(10);
  assert.equal(full.lv, 1, 'сразу ступень 1');
  assert.ok(full.en <= 9 + 1e-9, 'ступень 1 стоит 1 ⚡');
  assert.equal(take(0).lv, 0, 'без ⚡ — ступени нет');
  assert.deepEqual(JSON.parse(g.ev('JSON.stringify(LV_W.slice(1))')), ['на 1 ⚡', 'на 2 ⚡', 'на 3 ⚡', 'на 4 ⚡']);
  assert.doesNotMatch(g.ev(`JSON.stringify(G.stage.steps())`), /слабо|слабый удар/);
});

test('пойманный свет и доход законов — без надписей «+1 ✦ +1 ⚡»: искры к счётчику', () => {
  const g = lit();
  g.ev(`Cine.clear(); update(1 / 60); render()`); // счётчик нарисован — искрам есть куда лететь
  const r = JSON.parse(g.ev(`(() => { const S = G.stage; S.floats = []; Fly.q = [];
    for (let i = 0; i < 6; i++) { const o = S.mk('ph', false, P.x, P.y, 0, S.T * .2); o.born = 1; S.absorb(o); }
    S.eFlash(P.x + 1, P.y);
    return JSON.stringify({ txt: S.floats.map(f => f.txt), sparks: Fly.q.length }); })()`));
  assert.ok(!r.txt.some(t => /\+1 ✦|\+1 ⚡|\+1⚡/.test(t)), r.txt.join(' | '));
  assert.ok(r.sparks > 0, 'искры летят');
});

test('счётчик «Во Вселенной»: число и вспышка перемены (Counts), новый уровень — без старых вспышек', () => {
  const g = lit();
  assert.deepEqual(JSON.parse(g.ev(`JSON.stringify(Counts.note('x', 3))`)), { d: 0, a: 0 }, 'первое число — без вспышки');
  g.ev('G.T += .1');
  const ch = JSON.parse(g.ev(`JSON.stringify(Counts.note('x', 5))`));
  assert.equal(ch.d, 2); assert.equal(ch.a, 1);
  g.ev('G.T += COUNT_FL * .5');
  assert.ok(Math.abs(JSON.parse(g.ev(`JSON.stringify(Counts.note('x', 5))`)).a - .5) < 1e-6, 'вспышка гаснет');
  g.ev(`G.T += 1; Counts.note('x', 4)`);
  assert.equal(JSON.parse(g.ev(`JSON.stringify(Counts.note('x', 4))`)).d, -1);
  g.ev('Counts.of = null');
  assert.deepEqual(JSON.parse(g.ev(`JSON.stringify(Counts.note('x', 9))`)), { d: 0, a: 0 }, 'другой уровень — счёт с чистого');
  assert.equal(g.ev(`'bins' in METER[0]`), false, 'корзин-полосок больше нет');
  g.ev('G.stage.drawMeter(1)'); // рисуется без ошибок
});

test('законы на телефоне: фишка «Законы · N», тап по шапке разворачивает и сворачивает', () => {
  const html = readFileSync(`${ROOT}/index.html`, 'utf8');
  assert.match(html, /body\.touch #uni \.ur\{display:none\}/, 'свёрнуто: строки законов скрыты');
  assert.match(html, /body\.touch #uni\.open \.ur\{display:grid/, 'открыто: строки списком');
  assert.match(html, /<button id="t-help" data-key="KeyH"/, '«?» на сенсоре — в столбце кнопок');
  assert.match(html, /body\.touch #help\{display:none!important\}/, 'слева внизу она ложилась на лавку');
  const main = readFileSync(`${ROOT}/js/main.js`, 'utf8');
  assert.match(main, /closest\('\.uh'\)\) \{ uni\.classList\.toggle\('open'\)/);
  const g = lit();
  g.ev(`(() => { const S = G.stage; S.kn += 99; S.buy(S.resList().findIndex(r => r.k === 'g') >= 0 ? 0 : 0); Uni.learn(S, 'ph', 'γ', 'Свет', 5); Uni.learn(S, 'g', 'g', 'Глюоны', 3); })()`);
  assert.match(g.ev(`(() => { const el = byId('uni'); el._h = ''; Uni.render(el); return el.innerHTML; })()`), /Законы · \d/);
});

test('тексты: без оборота «Вселенная светит / генерирует / сберегает» — «Генерация света», «Остывание»', () => {
  for (const f of ['js/s_particles.js', 'js/s0_quarks.js', 'js/s1_nuclei.js', 'js/s_stars.js', 'js/s2_atoms.js', 'js/s3_molecules.js']) {
    const src = readFileSync(`${ROOT}/${f}`, 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    for (const bad of ['Вселенная светит', 'Вселенная генерирует', 'Вселенная сберегает', 'Вселенная повторит', 'Вселенная сама', 'Вселенная остыла', 'Вселенная собирает', 'принесёт Вселенная'])
      assert.ok(!new RegExp(`['\`][^'\`\\n]*${bad}`).test(src), `${f}: «${bad}»`);
  }
  const g = lit();
  g.ev('G.stage.rs.ph = 1');
  assert.match(g.ev(`JSON.stringify(G.stage.steps())`), /генерация света/);
  assert.doesNotMatch(g.ev(`JSON.stringify(G.stage.steps())`), /Вселенная (будет )?генерир/);
});
