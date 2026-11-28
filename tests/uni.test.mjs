// «Законы Вселенной»: чему научил — работает без тебя и понемногу приносит ✦; сводка справа и строка в итогах.
// Цена закона от покупок не растёт; «Столкновения» приходят строкой вместе с первым законом вещества.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const lit = () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); ['e', 'u', 'd', 'g'].forEach(k => Codex.see(k)); G.stage.pairs = 1; G.stage.kn += 2000; Cine.clear(); Cine.tick(99)`);
  return g;
};
const buy = (g, k) => g.ev(`(() => { const S = G.stage, it = S.shopItems(), i = it.findIndex(x => x.r && x.r.k === '${k}'); const c = i >= 0 ? it[i].c : null; S.buy(i); Cine.clear(); Cine.tick(99); return c; })()`);

test('законы Вселенной: каждый закон — строка в сводке; ровный доход капает в ✦ уровня', () => {
  const g = lit();
  assert.equal(g.ev(`G.stage.uni.map(r => r.k).join()`), 'ph', 'свет научен в PREP.light');
  buy(g, 'e'); // первый закон вещества — и «Столкновения» строкой
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'coll').rate`), 4);
  const k0 = g.ev('G.stage.kn'), u0 = g.ev('Uni.total(G.stage)');
  g.step(60 * 65);
  const got = g.ev('Uni.total(G.stage)') - u0;
  assert.ok(got >= 5, `за минуту свет + столкновения принесли ${got} ✦`);
  assert.ok(g.ev('G.stage.kn') - k0 >= got, 'доход Вселенной — в те же ✦ уровня');
  assert.ok(g.ev(`G.stage.uni.find(r => r.k === 'coll').kn`) >= 3);
});

test('законы Вселенной: лавка говорит, сколько ✦/мин принесёт закон; цена от покупок не растёт, тяжелее поколение — дороже', () => {
  const g = lit();
  g.ev('G.stage.renderShop(document.getElementById("shop"))');
  assert.match(g.ev('document.getElementById("shop").innerHTML'), /\+\d+ ✦\/мин/);
  const e = buy(g, 'e'), q1 = buy(g, 'q1');
  assert.equal(e, 20); assert.equal(q1, 20, 'кварки — один закон на поколение: «Кварки I» вместо u и d; цена после «Лептонов I» та же');
  assert.equal(buy(g, 'coll'), null, '«Столкновения» в лавке не продаются: пришли с первым законом вещества');
  g.ev("Codex.see('c'); Codex.run.add('c')");
  assert.ok(g.ev(`G.stage.resList().find(r => r.k === 'q2').cost[0]`) > q1, '«Кварки II» дороже «Кварков I»');
  assert.ok(g.ev("Codex.auto.has('u') && Codex.auto.has('d')"), '«Кварки I» — Вселенная рождает и u, и d');
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'e').rate`), 3, 'Генерация e: 2 + ценность e');
});

test('законы Вселенной: в эпоху 4 частиц Вселенная не рождает — их строки стоят, свет капает дальше', () => {
  const g = lit();
  buy(g, 'e');
  g.ev('G.stage.ep = 3');
  assert.equal(g.ev(`Uni.perMin(G.stage, G.stage.uni.find(r => r.k === 'e'))`), 0);
  assert.ok(g.ev(`Uni.perMin(G.stage, G.stage.uni.find(r => r.k === 'ph'))`) > 0);
  const e0 = g.ev(`G.stage.uni.find(r => r.k === 'e').kn`);
  g.ev(`Uni.tick(G.stage, 120)`);
  assert.equal(g.ev(`G.stage.uni.find(r => r.k === 'e').kn`), e0);
});

test('законы Вселенной: сводка на экране, в итогах уровня — «✦ от Вселенной»; новый уровень — с чистой сводки', () => {
  const g = lit();
  buy(g, 'e'); g.step(60 * 30);
  g.ev(`Uni.render(document.getElementById('uni'))`);
  const html = g.ev(`document.getElementById('uni').innerHTML`);
  assert.match(html, /Законы Вселенной/); assert.match(html, /Столкновения/); assert.match(html, /✦\/мин/);
  g.ev(`Tally.show(G.stage)`);
  assert.match(g.ev(`document.getElementById('tally').innerHTML`), /✦ от Вселенной/);
  g.ev('advance(); G.trans = 99');
  assert.equal(g.ev('G.stage.key'), 'quarks');
  assert.equal(g.ev('G.stage.uni.length'), 0);
  // адроны: «Конфайнмент» — строка; барионы Вселенной платят в неё
  g.ev(`(() => { const S = G.stage; S.skipChapters(); S.kn += 100; S.buy(S.shopItems().findIndex(x => x.k === 'conf')); })()`);
  assert.equal(g.ev(`G.stage.uni.map(r => r.k).join()`), 'conf');
  g.ev(`Uni.pay(G.stage, 'conf', 4)`);
  assert.equal(g.ev(`G.stage.uni[0].kn`), 4);
});
