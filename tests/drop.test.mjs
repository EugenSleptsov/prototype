// Разжать без удара (правая кнопка, второй палец, X): взятое разлетается, ничего не рождается, ⚡ зажатия — назад.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGame, PREP } from './harness.mjs';

function held(g, k) {
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  return g.ev(`(() => { const S = G.stage; S.en = E_CAP;
    for (const o of S.p) if (!o.dead && Math.hypot(o.x - P.x, o.y - P.y) < S.fr() * 1.6) o.dead = true; update(1 / 60);
    const A = S.mk('ph', false, P.x + .5, P.y, 0, S.T), B = S.mk('ph', false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    globalThis.__AB = [A, B]; globalThis.__before = new Set(S.p); mouse.clicked = true; mouse.down = true; let n = 0;
    while (n < 600 && !(S.focus && S.focus.cap.length === 2 && (S.focus.lv || 0) >= ${k})) { update(1 / 60); n++; }
    return { lv: S.focus.lv, en: S.en }; })()`);
}

test('разжать: пара квантов отпускается без столкновения, ⚡ ступеней возвращается', () => {
  const g = loadGame({ seed: 5 });
  const h = held(g, 2);
  assert.equal(h.lv, 2, 'дотянули до 2 ⚡');
  assert.ok(g.ev('E_CAP') - h.en >= 2 - 1e-9, 'ступени списали ⚡');
  assert.equal(g.ev('G.stage.drop()'), true, 'было что разжимать');
  assert.equal(g.ev('G.stage.focus'), null);
  assert.equal(g.ev('G.stage.holding'), false);
  assert.ok(Math.abs(g.ev('G.stage.en') - g.ev('E_CAP')) < 1e-9, '⚡ вернулась');
  g.ev(`globalThis.__snaps = 0; { const S = G.stage, sn = S.snapshot; S.snapshot = function (...a) { __snaps++; return sn.apply(this, a); }; }`);
  g.ev('mouse.down = false'); g.step(40);
  assert.equal(g.ev('__snaps'), 0, 'отпускание кнопки после «разжать» — не снимок');
  assert.equal(g.ev(`G.stage.p.filter(o => !__before.has(o) && !o.dead && o.sp !== 'ph').length`), 0, 'ничего не родилось');
  assert.ok(g.ev('__AB.every(o => !o.dead && !o.cap && !o.mate)'), 'оба кванта живы и свободны');
  assert.ok(g.ev('__AB.every(o => Math.hypot(o.x - P.x, o.y - P.y) > .5)'), 'и отлетели от детектора');
  assert.equal(g.ev('!!G.stage.learn.drop'), true);
});

test('разжать: без взятого — ничего; X с клавиатуры зовёт то же', () => {
  const g = loadGame({ seed: 5 });
  g.ev(PREP.start); g.ev(PREP.pump(.9)); g.ev(PREP.light);
  assert.equal(g.ev('G.stage.drop()'), false, 'ничего не держишь — разжимать нечего');
  held(g, 1);
  g.ev('G.stage.detach()');
  assert.equal(g.ev('G.stage.focus'), null, 'X разжал');
});

test('разжать на сенсоре: кнопка ✕ видна, пока держишь пару, и разжимает (раньше — касание вторым пальцем поверх ◉)', () => {
  const g = loadGame({ seed: 5, touch: true });
  held(g, 1);
  g.ev('touchBar()');
  assert.equal(g.ev(`document.getElementById('t-drop').style.display`), '', 'держишь — ✕ на виду');
  assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /id="t-drop" data-key="KeyX"/, '✕ жмёт X');
  g.ev('G.stage.detach()');
  assert.equal(g.ev('G.stage.focus'), null, '✕ разжал');
  g.ev('touchBar()');
  assert.equal(g.ev(`document.getElementById('t-drop').style.display`), 'none', 'нечего держать — ✕ нет');
});
