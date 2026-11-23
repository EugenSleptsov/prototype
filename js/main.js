"use strict";
const STAGES = [Particles, Quarks, Nuclei, Atoms, Mols];
const LADDER = ['Частицы', 'Кварки', 'Ядра', 'Атомы', 'Молекулы', 'Органика', 'Протоклетки', 'Клетки', 'Организмы'];
const TRANS_DUR = 3;

// Переход: старый этап продолжает жить и гаснет, новый проявляется и забирает его частицы.
function advance() {
  if (G.stageI >= STAGES.length - 1) return;
  G.prev = G.stage; G.stageI++; G.stage = STAGES[G.stageI]; G.trans = 0;
  G.stage.enter(G.prev);
}
function endGame(text) {
  if (G.ended) return;
  G.ended = true;
  document.getElementById('endtext').textContent = text;
  setTimeout(() => { document.getElementById('end').style.display = 'flex'; }, 1500);
}

// ---------- ввод ----------
addEventListener('resize', resize); resize();
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; });
addEventListener('mousedown', e => { mouse.down = true; if (e.target === cv && G.started) mouse.clicked = true; });
addEventListener('mouseup', () => { mouse.down = false; });
addEventListener('touchmove', e => { const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.has = true; }, { passive: true });
addEventListener('wheel', e => { G.stage.wheel && G.stage.wheel(e.deltaY); }, { passive: true });
addEventListener('keydown', e => {
  keys.add(e.code);
  if (!G.started) return;
  if (e.code === 'Space') { e.preventDefault(); G.stage.dash && G.stage.dash(); }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') G.stage.enterKey && G.stage.enterKey();
  if (e.code === 'KeyX') G.stage.detach && G.stage.detach();
  if (/^Digit[1-9]$/.test(e.code) && G.stage.buy) G.stage.buy(+e.code.slice(5) - 1);
  if (e.code === 'BracketRight') G.stage.cheat && G.stage.cheat();
  if (e.code === 'KeyR' && G.ended) location.reload();
});
addEventListener('keyup', e => keys.delete(e.code));
document.getElementById('go').onclick = () => { document.getElementById('intro').style.display = 'none'; G.started = true; };

// ---------- цикл ----------
function update(dt) {
  G.T += dt; P.dashCd -= dt; P.dashT -= dt;
  G.stage.update(dt, true);
  if (G.prev) {
    G.trans += dt / TRANS_DUR;
    G.prev.update(dt, false);
    if (G.trans >= 1) { G.prev = null; G.trans = 1; }
  }
  tickCard(dt);
  for (const f of G.fx) f.t += dt;
  G.fx = G.fx.filter(f => f.t < f.dur);
  const tz = Math.max(100, Math.min(G.W, G.H)) / 2 / G.stage.viewR();
  cam.z = Math.exp(lerp(Math.log(cam.z), Math.log(tz), 1 - Math.exp(-dt * 1.8)));
  cam.x += (P.x - cam.x) * Math.min(1, dt * 4); cam.y += (P.y - cam.y) * Math.min(1, dt * 4);
  if (msgT > 0 && (msgT -= dt) <= 0) document.getElementById('msg').style.opacity = 0;
}

function drawLadder(k) {
  const x0 = 24, x1 = G.W - 24, y = G.H - 22, n = LADDER.length - 1;
  line(x0, y, x1, y, [255, 255, 255], .22, 2);
  const pos = G.prev ? G.stageI - 1 + k : G.stageI;
  const narrow = G.W < 700;
  LADDER.forEach((name, i) => {
    const x = lerp(x0, x1, i / n), active = i < STAGES.length, near = 1 - Math.min(1, Math.abs(pos - i) / 2);
    ctx.fillStyle = `rgba(255,255,255,${active ? .3 + .6 * near : .15})`; ctx.fillRect(x - 1, y - 5, 2, 10);
    if (!narrow || Math.abs(pos - i) < 1.5) {
      ctx.font = '11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = `rgba(255,255,255,${active ? .35 + .55 * near : .2})`;
      ctx.fillText(active ? name : name + ' · скоро', x, y - 8);
    }
  });
  const mx = lerp(x0, x1, pos / n);
  glow(mx, y, 12, [140, 220, 255], .8); ball(mx, y, 4, [200, 240, 255]);
}

function render() {
  ctx.setTransform(G.DPR, 0, 0, G.DPR, 0, 0);
  ctx.globalAlpha = 1;
  const k = G.prev ? smooth(0, 1, G.trans) : 1;
  const bg = G.prev ? mixc(G.prev.bg, G.stage.bg, k) : G.stage.bg;
  const g = ctx.createRadialGradient(G.W / 2, G.H / 2, 0, G.W / 2, G.H / 2, Math.hypot(G.W, G.H) / 2);
  g.addColorStop(0, rgb(mixc(bg, [255, 255, 255], .06))); g.addColorStop(1, rgb(mixc(bg, [0, 0, 0], .6)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
  drawDust(bg);
  if (G.prev) G.prev.draw(1 - k);
  G.stage.draw(k);
  ctx.globalAlpha = 1;
  if (G.prev) G.prev.drawPlayer(1 - k);
  G.stage.drawPlayer(k);
  ctx.globalAlpha = 1;
  drawFx();
  if (G.prev && G.prev.overlay) G.prev.overlay(1 - k);
  if (G.stage.overlay) G.stage.overlay(k);
  ctx.globalAlpha = 1;
  drawLadder(k);
}

const barsEl = document.getElementById('bars');
let hudN = 0, lawsKey = '';
function hud() {
  if ((hudN++) % 6) return;
  const h = G.stage.hud();
  document.getElementById('title').textContent = h.title;
  document.getElementById('sub').textContent = h.sub;
  document.getElementById('lines').innerHTML = h.lines.map(([a, b]) => `<div class="k">${a}</div><div>${b}</div>`).join('');
  document.getElementById('goal').innerHTML = h.goal;
  document.getElementById('controls').textContent = G.stage.controls;
  const key = G.stage.key;
  if (key !== lawsKey) { lawsKey = key; barsEl.innerHTML = h.laws.map(([n], i) => `<div>${n}</div><div class="bar"><i id="law${i}"></i></div>`).join(''); }
  Codex.render(true);
  const upg = document.getElementById('upg');
  if (G.stage.renderUpg) G.stage.renderUpg(upg); else upg.style.display = 'none';
  h.laws.forEach(([, w], i) => { const el = document.getElementById('law' + i); if (el) el.style.width = (clamp(w, 0, 1) * 100).toFixed(0) + '%'; });
}

// страховка: ошибка или NaN не должны вешать игру
let errShown = false;
function recover(err) {
  if (err && !errShown) { errShown = true; console.error(err); }
  if (!isFinite(P.x + P.y)) { P.x = P.y = 0; }
  if (!isFinite(P.vx + P.vy)) { P.vx = P.vy = 0; }
  if (!isFinite(cam.z) || cam.z <= 0) cam.z = 40;
  if (!isFinite(cam.x + cam.y)) { cam.x = P.x; cam.y = P.y; }
}

G.stage = STAGES[0]; G.stage.enter(null);
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  try {
    update(dt);
    if (!isFinite(P.x + P.y + cam.z)) recover();
    render(); hud();
  } catch (err) { recover(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
