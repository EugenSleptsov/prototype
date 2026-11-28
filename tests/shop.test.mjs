// Лавка «Частиц»: каждый необязательный закон действует сразу — в первые секунды после покупки, по заданию эпохи
// (◉ в запас, пары в кадре, горячая точка, свет у детектора), а не доходом в минуту; цены — по замеру дохода ✦
// «среднего игрока» (бот ловит свет полвремени и раз в 10 с сталкивает пару): закон окупается за 20–40 с игры.
// Обязательные законы («Свет» I, «Глюоны», «Асимметрия») по-прежнему закрывают свои эпохи.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// свет создан, научен и измерен; первое столкновение руками было — законы вещества в лавке
const lit = (seed = 3) => {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); ['ph', 'e', 'u', 'd', 'g'].forEach(k => { Codex.see(k); Codex.run.add(k); }); G.stage.pairs = 1; G.stage.kn += 2000; Cine.clear(); Cine.tick(99)`);
  return g;
};
// купить закон k из лавки; вернуть цену (null — его нет в лавке)
const buy = (g, k) => g.ev(`(() => { const S = G.stage, it = S.shopItems(), i = it.findIndex(x => x.r && x.r.k === '${k}'); if (i < 0) return null;
  const c = it[i].c; S.buy(i); Cine.clear(); Cine.tick(99); return c; })()`);
const inView = `(o => !o.dead && onScreen(...W2S(o.x, o.y), 0))`;

test('лавка: «Кварки I» — запас u/d растёт в ту же секунду, пары u и d — в кадре', () => {
  const g = lit();
  assert.equal(g.ev('G.stage.udRes.length'), 0);
  const n0 = g.ev(`G.stage.p.filter(o => (o.sp === 'u' || o.sp === 'd') && o.uni && ${inView}(o)).length`);
  assert.match(g.ev(`G.stage.resList().find(r => r.k === 'q1').about(0)`), /^сразу: \+3 ◉ в запас u\/d/);
  buy(g, 'q1');
  assert.equal(g.ev('G.stage.udRes.length'), g.ev('NOW_UD'), 'запас — сразу, не по таймеру');
  assert.equal(g.ev('G.stage.udRes.slice().sort().join()'), 'd,u,u', 'поровну: сложится тройка');
  assert.ok(g.ev(`G.stage.p.filter(o => (o.sp === 'u' || o.sp === 'd') && o.uni && ${inView}(o)).length`) >= n0 + 4, 'пары u и d Вселенной — в кадре');
  assert.equal(g.ev('G.stage.rs.coll'), 1, 'первый закон вещества приносит и «Столкновения»');
  assert.ok(g.ev(`G.stage.uni.some(r => r.k === 'coll')`), '…строкой-тумблером в сводке');
});

test('лавка: «Лептоны I» — пары e⁺e⁻ в кадре гаснут в γγ за несколько секунд: +✦ и +⚡', () => {
  const g = lit();
  buy(g, 'e');
  g.step(60 * 4);
  assert.ok(g.ev(`G.stage.uni.find(r => r.k === 'e').kn`) >= 1, 'e⁺e⁻ → γγ уже случилось');
});

test('лавка: «Лептоны II» — +2 e⁻ к атомам сразу; «Кварки III» — ⚡ полный сразу', () => {
  const g = lit();
  g.ev(`['mu', 'c', 's', 'b'].forEach(k => { Codex.see(k); Codex.run.add(k); })`);
  buy(g, 'e'); buy(g, 'q1'); buy(g, 'q2');
  assert.equal(g.ev('G.stage.eRes'), 0);
  buy(g, 'mu');
  assert.equal(g.ev('G.stage.eRes'), g.ev('NOW_E'));
  g.ev('G.stage.en = 1');
  buy(g, 'q3');
  assert.equal(g.ev('G.stage.en'), g.ev('E_CAP'));
  assert.equal(g.ev('G.stage.udRes.length'), 3 * g.ev('NOW_UD'), 'кузница каждого поколения — сразу +3 ◉');
});

test('лавка: «Свет» — два уровня; II в эпохе 1 впервые зажигает горячие источники — разогретыми, в кадре', () => {
  const g = lit();
  assert.equal(g.ev('RES_COST.ph.length'), 2);
  g.ev('G.stage.hz = []');
  assert.equal(g.ev('G.stage.hzN()'), 0, 'до «Света II» источников нет');
  buy(g, 'ph');
  assert.equal(g.ev('G.stage.rs.ph'), 2);
  assert.equal(g.ev('G.stage.hzN()'), g.ev('HZ_N'));
  assert.equal(g.ev(`G.stage.hz.filter(z => G.stage.hzK(z) > .5 && onScreen(...W2S(z.x, z.y), 0)).length`), g.ev('HZ_N'), 'все источники уже кипят в кадре');
  assert.equal(g.ev(`G.stage.shopItems().some(it => it.r && it.r.k === 'ph')`), false, '«Свет» III нет');
});

test('лавка: эпоха 3 — закон для задания: горячая точка рождает его вид через ~2 с, а не через 45', () => {
  const g = lit();
  g.ev(`(() => { ['H', 'W', 'Z', 'c', 's', 'b', 'mu'].forEach(k => { Codex.see(k); Codex.run.add(k); }); const S = G.stage; S.rs.coll = 1; S.rs.q1 = 1; S.qSync();
    S.startEpoch(2); S.hig = 1; S.T = 40; S.need2 = ['c', 'mu', 'b']; S.hot = []; Cine.clear(); Cine.tick(99); })()`);
  g.step(60 * 6);
  assert.ok(!g.ev(`G.stage.hot.some(h => h.sp === 'c')`), 'без закона c у горячей точки пока не рождается');
  // покупка в эпохе 3 не обязательна (второе ревью №7c): золотой плашки «для задания» нет, но закон в лавке и говорит, что сделает
  assert.equal(g.ev('G.stage.taskRes()'), null, 'закон не «для задания»: руками распад достижим');
  g.ev('G.stage._pk = G.stage.taskRes()'); // как в renderShop
  assert.ok(g.ev(`G.stage.shopItems().some(it => it.r && it.r.k === 'q2')`), '«Кварки II» в лавке');
  assert.match(g.ev(`G.stage.resList().find(r => r.k === 'q2').about(0)`), /^сразу: горячая точка родит c/);
  buy(g, 'q2');
  g.step(60 * 2);
  assert.ok(g.ev(`G.stage.hot.some(h => h.sp === 'c' && h.done) || G.stage.p.some(o => o.sp === 'c' && !o.dead)`), 'c родился у горячей точки за 2 с');
  assert.ok(g.ev('G.stage.epT') < 45);
});

// замер дохода: бот ловит свет полвремени (цель — раз в 1,5 с), раз в 10 с сталкивает пару и снимает
const BOT = `globalThis.__casual = (secs) => {
  const S = G.stage; let next = 2, rt = 0;
  for (let i = 0; i < 60 * secs; i++) {
    if (Cine.stop) { Cine.tick(1 / 60); if (Cine.t > 1.5) Cine.skip(); continue; } Cine.tick(1 / 60);
    if (Math.floor(S.t / 5) % 2 === 0 && (rt -= 1 / 60) <= 0) {
      rt = 1.5; let best = null, bd = 1e9;
      for (const o of S.p) if (!o.dead && o.sp === 'ph') { const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; best = o; } }
      if (best) { const [sx, sy] = W2S(best.x, best.y); mouse.x = sx; mouse.y = sy; mouse.has = true; }
    }
    if (S.fieldOn() && (next -= 1 / 60) <= 0 && S.en >= 3) {
      next = 10; const pairs = S.gOn ? [['ph', 'ph'], ['g', 'ph'], ['g', 'g']] : [['ph', 'ph']];
      const [a, b] = pairs[Math.random() * pairs.length | 0]; __hit(a, b, 1 + (Math.random() * Math.min(4, S.en - 1) | 0), S.en);
      mouse.clicked = true; mouse.down = true; update(1 / 60); mouse.down = false;
    }
    update(1 / 60);
  }
};`;

test('лавка: необязательный закон стоит 20–40 с дохода среднего игрока; вся необязательная лавка — не больше 300 ✦', () => {
  // доход среднего — по трём забегам (один сид шумит: 1,0–1,7 ✦/с)
  const rate = [1, 3, 5].map(seed => {
    const g = loadGame({ seed });
    g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.hit); g.ev(BOT);
    g.ev(`(() => { const S = G.stage; S.chap = 4; const ph = () => S.shopItems().findIndex(it => it.r && it.r.k === 'ph');
      S.kn += 35; S.buy(ph()); S.buy(ph()); S.kn -= 35; S.joinOk = true; })()`); // обучение 28.11: соединять — после «Света II» и света из его источников
    g.ev('__casual(20)'); // разогнался: измерил свет — дальше ровный темп
    const k0 = g.ev('G.stage.kn'), t0 = g.ev('G.stage.t');
    g.ev('__casual(120)');
    return (g.ev('G.stage.kn') - k0) / (g.ev('G.stage.t') - t0); // ✦ в секунду
  }).reduce((s, r) => s + r, 0) / 3;
  const g = loadGame();
  const opt = g.ev(`[...RES_COST.ph.slice(1), ...Object.values(LAW_COST)]`);
  const total = opt.reduce((s, c) => s + c, 0);
  assert.ok(total <= 300 && total >= 150, `необязательная лавка ${total} ✦`);
  for (const c of opt) assert.ok(c <= rate * 40 && c >= rate * 15, `закон за ${c} ✦ при доходе ${rate.toFixed(2)} ✦/с — ${Math.round(c / rate)} с игры`);
  assert.ok(rate > .6 && rate < 2.5, `доход ${rate.toFixed(2)} ✦/с`);
});

test('лавка: обязательные законы по-прежнему закрывают задания — «Свет» I и «Глюоны» эпоху 1, «Асимметрия» свой шаг эпохи 4', () => {
  const g = loadGame({ seed: 3 });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Cine.tick(99); G.stage.pairs = 1; G.stage.full = true; G.stage.kn += 40; Codex.see('e'); Codex.see('g'); Codex.see('mu')`); // электрон, глюон и мюон сняты; свет скуп до закона — ✦ на глюоны доложим
  assert.equal(g.ev('G.stage.taskRes()'), 'g');
  assert.equal(buy(g, 'g'), 40);
  g.ev(`['u', 'd', 'e'].forEach(k => Codex.see(k)); G.stage.checkGoals()`);
  assert.equal(g.ev('G.stage.epDone'), true, 'эпоха 1 выполнена: свет и глюоны — законы, шкала ⚡ наполнена, первое поколение открыто');
  // эпоха 4: тройки руками → «Асимметрия» → Вселенная сберегает тройки сама
  g.ev(`(() => { const S = G.stage; S.startEpoch(3); S.hig = 1; S.stockQ = Array.from({ length: 15 }, (_, i) => ({ fl: i % 3 ? 'u' : 'd', col: i % 3 })); S.stock = 15; Cine.clear(); Cine.tick(99); })()`);
  assert.equal(g.ev('G.stage.taskRes()'), 'cp');
  assert.equal(buy(g, 'cp'), 40);
  g.step(60 * 1.2);
  assert.ok(g.ev('G.stage.safe.length') >= 1, 'первая тройка сбережена сразу');
  g.step(60 * 14);
  assert.ok(g.ev('G.stage.safe.length') >= g.ev('AUTO_TRIO'));
  assert.equal(g.ev('G.stage.steps()[1].d'), true, 'шаг «сберечь вещество» выполнен законом');
});
