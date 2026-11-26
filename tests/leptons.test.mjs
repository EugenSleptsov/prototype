// Лептоны — ветка, параллельная кваркам: «Лептоны I, II, III». Все три — ветка завершена:
// своя сцена и бонус «Лептонная универсальность» (распад μ и τ Вселенной даёт +1 ⚡).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const lit = () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); ['ph', 'e', 'mu', 'ta', 'u', 'd'].forEach(k => Codex.see(k)); G.stage.pairs = 1; G.stage.kn += 9999; G.stage.ep = 1; G.stage.hig = 1; Cine.clear(); Cine.tick(99)`);
  return g;
};
// купить закон k; вернуть html сцены, если она встала в очередь
const buy = (g, k) => g.ev(`(() => { const S = G.stage, it = S.shopItems(), i = it.findIndex(x => x.r && x.r.k === '${k}'); if (i < 0) return null;
  let html = ''; const sh = Cine.show; Cine.show = function (h, ...r) { html += h; return sh.call(this, h, ...r); };
  S.buy(i); Cine.show = sh; Cine.clear(); Cine.tick(99); return html; })()`);
const names = g => g.ev(`G.stage.resList().map(r => r.name).join(' | ')`);

test('лептоны: в лавке — «Лептоны I, II, III» по лестнице, как кварки', () => {
  const g = lit();
  assert.ok(buy(g, 'coll') !== null);
  assert.match(names(g), /Лептоны I(?!I)/, names(g));
  assert.doesNotMatch(names(g), /Генерация (e|μ|τ)/);
  assert.doesNotMatch(names(g), /Лептоны II/, 'II — только после I');
  assert.equal(g.ev(`G.stage.lawName('ta')`), '«Лептоны III»');
  buy(g, 'e');
  assert.match(names(g), /Лептоны II(?!I)/);
});

test('лептоны: все три — ветка завершена, сцена и бонус ⚡ за распад μ и τ Вселенной', () => {
  const g = lit();
  buy(g, 'coll'); buy(g, 'e'); buy(g, 'mu');
  assert.equal(g.ev('G.stage.lepDone'), false);
  const html = buy(g, 'ta');
  assert.equal(g.ev('G.stage.lepDone'), true);
  assert.match(html, /Ветка завершена/); assert.match(html, /Лептоны I, II, III/);
  g.ev(`Codex.dirty = true; Codex.render(true)`);
  assert.match(g.ev(`document.getElementById('codex').innerHTML`), /cx lepton[^"]* br/, 'в кодексе лептоны — золотом');
  // распад μ Вселенной — +1 ⚡
  const de = g.ev(`(() => { const S = G.stage; S.en = 2; const o = S.mk('mu', false, P.x + 30, P.y, 0, .01); o.uni = true; o.born = 1; S.decay(o); return S.en - 2; })()`);
  assert.equal(de, 1);
  // свой μ (не Вселенной) — не в счёт
  const own = g.ev(`(() => { const S = G.stage; S.en = 2; const o = S.mk('mu', false, P.x + 30, P.y, 0, .01); o.uni = false; o.born = 1; S.decay(o); return S.en - 2; })()`);
  assert.equal(own, 0);
});

test('лептоны: без всех трёх бонуса нет', () => {
  const g = lit();
  buy(g, 'coll'); buy(g, 'e'); buy(g, 'mu');
  const de = g.ev(`(() => { const S = G.stage; S.en = 2; const o = S.mk('mu', false, P.x + 30, P.y, 0, .01); o.uni = true; o.born = 1; S.decay(o); return S.en - 2; })()`);
  assert.equal(de, 0);
});
