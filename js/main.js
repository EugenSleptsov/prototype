"use strict";
const STAGES = [Particles, Quarks, Nuclei, Atoms, Mols];
const LADDER = ['Частицы', 'Адроны', 'Ядра', 'Атомы', 'Молекулы', 'Органика', 'Протоклетки', 'Клетки', 'Организмы'];
const TRANS_DUR = 3;

// Переход: старый этап продолжает жить и гаснет, новый проявляется и забирает его частицы.
function advance() {
  if (G.stageI >= STAGES.length - 1) return;
  G.prev = G.stage; G.stageI++; G.stage = STAGES[G.stageI]; G.trans = 0; Sfx.hum(0); Sfx.play('segment');
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
// Колесо — зум: вглубь до ×2,2, наружу до ×0,55 от обзора этапа. Shift + колесо — действие этапа (вращение молекулы).
const ZOOM_MIN = .55, ZOOM_MAX = 2.2;
addEventListener('wheel', e => {
  if (e.target !== cv) return;
  if (e.shiftKey && G.stage.wheel) { G.stage.wheel(e.deltaY || e.deltaX); return; }
  G.zoom = clamp((G.zoom || 1) * Math.exp(-e.deltaY * .0015), ZOOM_MIN, ZOOM_MAX);
}, { passive: true });
// звук включается первым жестом игрока (так требует браузер)
addEventListener('pointerdown', () => Sfx.unlock(), true);
addEventListener('keydown', e => {
  keys.add(e.code); Sfx.unlock();
  if (e.code === 'KeyM' && document.activeElement !== pname) { const m = Sfx.toggle(); if (G.started) msg(m ? 'звук выкл. · M' : 'звук вкл. · M', 1.2); }
  if (!G.started) return;
  if (e.code === 'Space' && !G.paused) { e.preventDefault(); G.stage.dash && G.stage.dash(); }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') G.stage.enterKey && G.stage.enterKey();
  if (e.code === 'KeyX') G.stage.detach && G.stage.detach();
  if (/^Digit[1-9]$/.test(e.code)) { const i = +e.code.slice(5) - 1; if (G.paused) G.stage.pick && G.stage.pick(i); else G.stage.buy && G.stage.buy(i); }
  if (G.paused && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) { e.preventDefault(); G.stage.closeCard && G.stage.closeCard(); return; }
  if (G.paused) return;
  if (e.code === 'BracketRight') G.stage.cheat && G.stage.cheat();
  if (e.code === 'KeyR' && G.ended) location.reload();
});
addEventListener('keyup', e => keys.delete(e.code));
// имя для таблицы рекордов запоминается в браузере
const pname = document.getElementById('pname');
try { pname.value = localStorage.getItem('proto.name') || ''; } catch (e) { /* без хранилища */ }
document.getElementById('go').onclick = () => {
  try { localStorage.setItem('proto.name', pname.value.trim() || 'Игрок'); } catch (e) { /* без хранилища */ }
  document.getElementById('intro').style.display = 'none'; G.started = true;
};

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
  const tz = Math.max(100, Math.min(G.W, G.H)) / 2 / G.stage.viewR() * (G.zoom || 1);
  cam.z = Math.exp(lerp(Math.log(cam.z), Math.log(tz), 1 - Math.exp(-dt * 1.8)));
  cam.x += (P.x - cam.x) * Math.min(1, dt * 4); cam.y += (P.y - cam.y) * Math.min(1, dt * 4);
  if (msgT > 0 && (msgT -= dt) <= 0) document.getElementById('msg').style.opacity = 0;
}

// Сколько пройдено в текущем уровне: свой progress() у уровня или доля выполненных шагов задания
function stageProgress(s) {
  if (s.progress) return clamp(s.progress(), 0, 1);
  if (s.steps && G.started) { const st = s.steps(); return st.length ? st.filter(g => g.d).length / st.length : 0; }
  return 0;
}
// Шкала эволюции внизу — прогресс-бар всей игры: заполнена до места, где ты сейчас
function drawLadder(k) {
  const x0 = 24, x1 = G.W - 24, y = G.H - 22, n = LADDER.length - 1;
  line(x0, y, x1, y, [255, 255, 255], .22, 2);
  const tgt = G.prev ? G.stageI : G.stageI + stageProgress(G.stage);
  const ldt = clamp(G.T - (G.ladT ?? G.T), 0, .05); G.ladT = G.T;
  G.ladP = G.ladP == null || tgt < G.ladP - .5 ? tgt : G.ladP + (tgt - G.ladP) * Math.min(1, ldt * 3);
  const pos = G.ladP, mx = lerp(x0, x1, pos / n);
  ctx.globalAlpha = 1;
  const gr = ctx.createLinearGradient(x0, 0, Math.max(x0 + 1, mx), 0);
  gr.addColorStop(0, 'rgba(90,150,255,.35)'); gr.addColorStop(1, 'rgba(160,230,255,.95)');
  ctx.strokeStyle = gr; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(mx, y); ctx.stroke();
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
  glow(mx, y, 12, [140, 220, 255], .8); ball(mx, y, 4, [200, 240, 255]);
  // доля текущего уровня — над бегунком
  const pct = Math.round(stageProgress(G.stage) * 100);
  if (G.started && !G.prev) { ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(190,235,255,.85)'; ctx.fillText(pct + ' %', mx, y + 6); }
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
  // пустые поля не показываем: этапы сами решают, сколько текста на экране
  const put = (id, v, html) => { const el = document.getElementById(id); el.style.display = v ? '' : 'none'; if (html) el.innerHTML = v; else el.textContent = v; };
  put('title', h.title); put('sub', h.sub);
  put('lines', h.lines.map(([a, b]) => `<div class="k">${a}</div><div>${b}</div>`).join(''), true);
  put('goal', h.goal, true);
  put('controls', G.stage.controls || '');
  document.getElementById('laws').style.display = h.laws.length ? '' : 'none';
  document.getElementById('codex').style.top = h.laws.length ? '190px' : '12px';
  const key = G.stage.key;
  if (key !== lawsKey) { lawsKey = key; barsEl.innerHTML = h.laws.map(([n], i) => `<div>${n}</div><div class="bar"><i id="law${i}"></i></div>`).join(''); }
  Codex.render(G.stage.showCodex ? G.stage.showCodex() : true);
  const upg = document.getElementById('upg');
  if (G.stage.renderUpg) G.stage.renderUpg(upg); else upg.style.display = 'none';
  const shop = document.getElementById('shop');
  if (G.stage.renderShop) G.stage.renderShop(shop); else shop.style.display = 'none';
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
    if (!G.paused) update(dt); else Sfx.hum(0);
    if (!isFinite(P.x + P.y + cam.z)) recover();
    render(); hud();
  } catch (err) { recover(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
