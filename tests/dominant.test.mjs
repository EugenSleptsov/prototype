// Пройти без мастерства (REVIEW_NEON_4 тема В): в «Ядрах» карта, которую водишь, открывала свежую Вселенную со свежими
// нейтронами — Y до 100 %, а стоящему игроку прилив не приносил ничего; фоновый ⁴He «отмывался» в счёт через литий.
// В «Частицах» волна «отбивалась» без щита (увернулся или ядро пустое), а отброшенные щитом антикварки на 16:9
// возвращались бумерангом.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// ---------- «Частицы», эпоха 4 ----------
function ep4(W, H) {
  const g = loadGame({ seed: 3, storage: { 'proto.known': JSON.stringify(['gest:school', 'chap:9']) } });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`Cine.clear(); Spot.clear(); G.stage.startEpoch(3); Cine.clear(); Spot.clear(); G.stage.T = 3`);
  if (W) g.ev(`G.W = ${W}; G.H = ${H}; cam.z = zoomFor(G.stage)`);
  g.ev(`(() => { const S = G.stage; S.wave.cd = 999; S.soupCd = 999; S.p.forEach(o => { if (SM[o.sp].kind === 'quark') o.dead = true; }); S.p = S.p.filter(o => !o.dead); })()`);
  return g;
}
const run = (g, s, body = '') => g.ev(`(() => { for (let i = 0; i < ${Math.round(s * 60)}; i++) { ${body}; update(1 / 60); if (Spot.on) Spot.end(); if (Cine.on) Cine.clear(); } })()`);
// волна из n антикварков на расстоянии d — как её запускает tickWave
const wave = (g, n, d) => g.ev(`(() => { const S = G.stage, list = [];
  for (let k = 0; k < ${n}; k++) { const a = k * .25; const o = S.mk(k % 2 ? 'd' : 'u', true, P.x + Math.cos(a) * ${d}, P.y + Math.sin(a) * ${d}, a + Math.PI, .2); o.wave = true; o.wv = WAVE_V; o.cd = 1.5; o.born = 1; list.push(o); }
  S.wave.n++; S.wave.cur = { list, all: list.slice(), t: 0, eaten0: S.st.eaten }; S.wave.dir = null; })()`);

test('«Частицы»: на 16:9 и телефоне отброшенные щитом антикварки уходят насовсем, а не возвращаются бумерангом', () => {
  for (const [W, H] of [[1600, 900], [1950, 900], [390, 844]]) {
    const g = ep4(W, H);
    g.ev(`(() => { const S = G.stage; S.stockQ = [{ fl: 'u', col: 0 }, { fl: 'd', col: 1 }, { fl: 'u', col: 2 }]; S.stock = 3;
      globalThis.__L = []; for (let k = 0; k < 4; k++) { const a = k * 1.4, o = S.mk('u', true, P.x + Math.cos(a) * S.shR() * .95, P.y + Math.sin(a) * S.shR() * .95, a + Math.PI, .1); o.born = 1; o.cd = 9; o.wave = true; o.wv = WAVE_V; __L.push(o); }
      S.shieldPulse(); })()`);
    run(g, 12);
    assert.equal(g.ev('__L.filter(o => o.dead).length'), 4, `${W}×${H}: ушли за кадр-эталон`);
    assert.equal(g.ev('G.stage.st.eaten'), 0, `${W}×${H}: раньше возвращались и съедали 2 кварка`);
  }
});

test('«Частицы»: волна, от которой увернулся без щита, — не «отбита»: ни +5 ✦, ни ★ «3 волны без потерь»; не долетевшие гаснут', () => {
  const g = ep4();
  wave(g, 4, 30); // далеко: за 10 с не долетят
  run(g, 11);
  assert.equal(g.ev('G.stage.st.waves'), 0, 'раньше таймаут без потерь — «волна отбита ✓ +5 ✦»');
  run(g, 2);
  assert.equal(g.ev('G.stage.p.filter(o => !o.dead && o.wave).length'), 0, 'кружившие погасли, не копятся');
});

test('«Частицы»: волна в пустое ядро — не «отбита»', () => {
  const g = ep4();
  g.ev('G.stage.stockQ = []; G.stage.stock = 0');
  wave(g, 4, 4);
  run(g, 11);
  assert.equal(g.ev('G.stage.st.eaten'), 0);
  assert.equal(g.ev('G.stage.st.waves'), 0, 'раньше антикварки сгорали в пустом ядре, и волна считалась отбитой');
});

test('«Частицы»: волна, отброшенная ударом щита, — «отбита» (+5 ✦)', () => {
  const g = ep4();
  g.ev(`(() => { const S = G.stage; S.stockQ = [{ fl: 'u', col: 0 }, { fl: 'd', col: 1 }, { fl: 'u', col: 2 }]; S.stock = 3; })()`);
  wave(g, 4, 2.6);
  const kn = g.ev('G.stage.kn');
  g.ev('G.stage.shieldPulse()');
  run(g, 11);
  assert.equal(g.ev('G.stage.st.eaten'), 0);
  assert.equal(g.ev('G.stage.st.waves'), 1);
  assert.ok(g.ev('G.stage.kn') >= kn + 5);
});

// ---------- «Ядра» ----------
function nuc(seed = 3) {
  const g = loadGame({ seed });
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light);
  g.ev(`jumpTo(STAGES.findIndex(s => s.key === 'nuclei'))`);
  g.step(120);
  g.ev('Cine.clear(); Spot.clear()');
  return g;
}

test('«Ядра»: выросшее из фонового ⁴He — тоже фон: ²H в него не даёт +15 % к цели', () => {
  const g = nuc();
  g.ev(`(() => { const S = G.stage; for (const o of S.o) o.dead = true; S.o = []; })()`);
  const y0 = g.ev('G.stage.Y()');
  g.ev(`(() => { const S = G.stage, he = S.mk(2, 2, cam.x, cam.y); he.cos = true; he.age = 1; const d = S.mk(1, 1, cam.x - 2, cam.y); d.age = 1;
    globalThis.__ok = S.collide(d, he, (S.vBar(d, he) + Math.min(S.vMax(d, he), S.vmax())) / 2, 'hand'); })()`);
  assert.equal(g.ev('__ok'), true, 'слились');
  assert.equal(g.ev(`G.stage.o.filter(o => !o.dead && o.Z === 3).length`), 1, 'родился литий');
  assert.equal(g.ev('G.stage.o.filter(o => !o.dead && o.Z === 3).every(o => o.cos)'), true, 'он фоновый');
  assert.equal(g.ev('G.stage.Y()'), y0, 'раньше ⁶Li давал +15 % одним броском');
});

test('«Ядра»: из-за края нейтроны не приходят — только приливом из запаса Вселенной; запас кончился — их нет', () => {
  const g = nuc();
  assert.equal(g.ev(`(() => { const S = G.stage; let n = 0; for (let i = 0; i < 2000; i++) { const o = S.inflow(P.x + 99, P.y, 0, 0); if (o.N) n++; o.dead = true; } return n; })()`), 0, 'свежая Вселенная за краем — без нейтронов');
  // кадр забит протонами (как у стоящего игрока), нейтронов нет: прилив их всё равно приносит — из запаса
  g.ev(`(() => { const S = G.stage; for (const o of S.o) o.dead = true; S.o = [];
    for (let i = 0; i < 80; i++) S.mk(1, 0, cam.x + Math.random() * 6 - 3, cam.y + Math.random() * 6 - 3).age = 1;
    S.nBud = 3; })()`);
  const nN = 'G.stage.o.filter(o => !o.dead && o.Z === 0 && o.N === 1).length';
  g.step(60 * 15);
  assert.equal(g.ev(nN), 3, 'раньше кадр, полный протонов, перекрывал прилив');
  assert.equal(g.ev('G.stage.nBud'), 0);
  g.ev(`(() => { for (const o of G.stage.o) if (o.Z === 0) o.dead = true; })()`);
  g.step(60 * 10);
  assert.equal(g.ev(nN), 0, 'запас кончился — нейтронов больше нет');
});

test('«Ядра»: нейтрон, растворившийся вдали, возвращается в запас', () => {
  const g = nuc();
  g.ev(`(() => { const S = G.stage; S.nBud = 0; S.mk(0, 1, cam.x + viewRadius() * 5, cam.y).life = 99; })()`);
  g.step(2);
  assert.equal(g.ev('G.stage.nBud'), 1);
});

// бот рук: раз в gap с бросает лучшую пару к гелию точно в середину окна; pan — водит карту, когда бросить нечего
const BOT = `globalThis.__nbot = (secs, gap, pan) => {
  const S = G.stage, dt = 1 / 60; let cd = .5, dir = 0;
  const ok = o => S.free(o) && o.age > .3 && inView(o.x, o.y, -.5);
  const want = [['0,1','1,0'],['0,1','1,1'],['1,0','1,2'],['0,1','2,1'],['1,1','1,1'],['1,1','1,2'],['1,1','2,1'],['1,0','1,1']];
  const aim = (a, b) => { const lo = S.vBar(a, b), hi = Math.min(S.vMax(a, b), S.vmax()), v = (lo + hi) / 2, t = Math.hypot(b.x - a.x, b.y - a.y) / v;
    const tx = b.x + b.vx * t - a.x, ty = b.y + b.vy * t - a.y, L = Math.hypot(tx, ty) || 1; return [tx / L * v, ty / L * v]; };
  for (let i = 0; i < secs * 60 && S.doneAt === null; i++) {
    if ((cd -= dt) <= 0) {
      cd = gap; let done = false;
      for (const [ak, bk] of want) {
        for (const b of S.o.filter(o => ok(o) && nkey(o) === bk)) {
          for (const a of S.o.filter(o => o !== b && ok(o) && nkey(o) === ak && Math.hypot(o.x - b.x, o.y - b.y) < 8)) {
            const [vx, vy] = aim(a, b), pr = S.predict(a, vx, vy);
            if (pr.hit && /^→/.test(pr.label) && Math.hypot(pr.x - b.x, pr.y - b.y) < 2) { S.launch(a, vx, vy); done = true; break; } }
          if (done) break;
        }
        if (done) break;
      }
      if (!done && pan) { dir += .3; P.x += Math.cos(dir) * pan; P.y += Math.sin(dir) * pan; }
    }
    G.inT = G.T; update(dt);
  }
  return S.Y();
};`;

test('«Ядра»: водить карту — не фарм: бот с картой не набирает 100 % и не обгоняет стоящего вдвое', () => {
  const ys = [];
  for (const pan of [0, 4]) {
    const g = nuc(7); g.ev(BOT);
    ys.push(g.ev('__nbot(115, 1.2, ' + pan + ')'));
  }
  const [still, moving] = ys;
  assert.ok(moving < .95, `с картой Y ${Math.round(moving * 100)} % (раньше 100 %)`);
  assert.ok(still >= .25, `стоящий набрал ${Math.round(still * 100)} % — цель 25 % по силам`);
  assert.ok(moving < still * 2, `с картой ${Math.round(moving * 100)} %, стоя ${Math.round(still * 100)} %`);
});
