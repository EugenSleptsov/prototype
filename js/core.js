"use strict";
// Общее состояние, камера, ввод, эффекты.
const G = { W: 1, H: 1, DPR: 1, T: 0, stageI: 0, stage: null, prev: null, trans: 1, started: false, ended: false, fx: [] };
const cam = { x: 0, y: 0, z: 40 };
const mouse = { x: 0, y: 0, has: false, down: false };
const keys = new Set();
// P — «точка игрока» в мире. Активный этап держит её в актуальном состоянии.
const P = { x: 0, y: 0, vx: 0, vy: 0, dashCd: 0, dashT: 0 };

function resize() {
  G.DPR = Math.min(2, devicePixelRatio || 1);
  G.W = Math.max(1, innerWidth); G.H = Math.max(1, innerHeight);
  cv.width = G.W * G.DPR; cv.height = G.H * G.DPR;
  cv.style.width = G.W + 'px'; cv.style.height = G.H + 'px';
}
const W2S = (x, y) => [G.W / 2 + (x - cam.x) * cam.z, G.H / 2 + (y - cam.y) * cam.z];
const S2W = (sx, sy) => [(sx - G.W / 2) / cam.z + cam.x, (sy - G.H / 2) / cam.z + cam.y];
const onScreen = (sx, sy, r) => sx > -r && sy > -r && sx < G.W + r && sy < G.H + r;
const viewRadius = () => Math.hypot(G.W, G.H) / 2 / cam.z;

// Плавное управление: тело тянется к курсору. resp — «вязкость» отклика.
function steer(o, maxSp, resp, dt) {
  if (!G.started || !mouse.has || P.dashT > 0) return;
  const [mx, my] = S2W(mouse.x, mouse.y);
  const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1e-9;
  const sp = maxSp * Math.min(1, d / (maxSp * .6));
  const k = Math.min(1, dt * resp);
  o.vx += (dx / d * sp - o.vx) * k; o.vy += (dy / d * sp - o.vy) * k;
}
function tryDash(o, power) {
  if (!G.started || P.dashCd > 0 || !mouse.has) return false;
  const [mx, my] = S2W(mouse.x, mouse.y);
  const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1e-9;
  o.vx += dx / d * power; o.vy += dy / d * power;
  P.dashCd = 1.0; P.dashT = .35;
  fxRing(o.x, o.y, 6 / cam.z, [255, 255, 255], 30 / cam.z, .4);
  return true;
}

// ---------- эффекты ----------
function fxRing(x, y, r0, c, r1 = r0 * 3, dur = .6) { G.fx.push({ x, y, r0, r1, t: 0, dur, c, kind: 'ring' }); }
function fxFlash(x, y, r, c, dur = .5) { G.fx.push({ x, y, r0: r, r1: r * 1.8, t: 0, dur, c, kind: 'flash' }); }
function drawFx() {
  for (const f of G.fx) {
    const k = f.t / f.dur, [sx, sy] = W2S(f.x, f.y), r = lerp(f.r0, f.r1, k) * cam.z;
    if (f.kind === 'ring') ring(sx, sy, r, f.c, .7 * (1 - k), 2);
    else glow(sx, sy, r, f.c, .8 * (1 - k));
  }
}

// ---------- общий интерфейс уровней: часы, цели, заголовок, стрелки ----------
// Часы и очки — сверху по центру, под ними цели «фишками» [текст, выполнено]
function hudClock(alpha, left, leftCol, pts, chips) {
  const x = G.W / 2, y = 24;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10,9,18,.55)'; ctx.beginPath(); ctx.roundRect(x - 100, y - 17, 200, 34, 10); ctx.fill();
  label(left, x - 46, y, 20, leftCol, 1, 700);
  label(`${pts} ✦`, x + 50, y, 20, [255, 215, 110], 1, 700);
  ctx.font = '700 12px system-ui,sans-serif';
  const ws = chips.map(([t, d]) => ctx.measureText((d ? '✓ ' : '') + t).width + 18), gap = 6;
  let gx = x - (ws.reduce((s, w) => s + w, 0) + gap * (chips.length - 1)) / 2;
  chips.forEach(([t, d], i) => {
    ctx.fillStyle = d ? 'rgba(77,232,155,.25)' : 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.roundRect(gx, y + 24, ws[i], 22, 11); ctx.fill();
    label((d ? '✓ ' : '') + t, gx + ws[i] / 2, y + 35.5, 12, d ? [160, 245, 200] : [235, 235, 245], d ? .95 : .85, 700);
    gx += ws[i] + gap;
  });
  ctx.globalAlpha = 1;
}
// Заголовок: всплывает и гаснет, игру не останавливает (b — секунды с начала)
function hudBanner(b, kicker, name, sub, alpha) {
  if (!G.started || b > 4.2) return;
  const a = smooth(0, .4, b) * (1 - smooth(3, 4.2, b)) * alpha, y = G.H * .3;
  label(kicker, G.W / 2, y - 36, 12, [255, 210, 122], .85 * a, 700);
  label(name, G.W / 2, y, 40, [255, 255, 255], a, 800);
  label(sub, G.W / 2, y + 36, 15, [220, 225, 240], .8 * a, 500);
}
// Стрелки у края экрана к целям за кадром: pts = [[x, y, подпись или цвет]]; не больше n ближайших
function edgeArrows(pts, n) {
  const m = 34, cx = G.W / 2, cy = G.H / 2, off = pts.filter(([wx, wy]) => !onScreen(...W2S(wx, wy), -m));
  off.sort((u, v) => Math.hypot(u[0] - P.x, u[1] - P.y) - Math.hypot(v[0] - P.x, v[1] - P.y));
  for (const [wx, wy, t] of off.slice(0, n)) {
    const [x, y] = W2S(wx, wy), c = Array.isArray(t) ? t : [255, 226, 106];
    const dx = x - cx, dy = y - cy, k = Math.min((cx - m) / Math.abs(dx || 1e-9), (cy - m) / Math.abs(dy || 1e-9));
    const ax = cx + dx * k, ay = cy + dy * k, an = Math.atan2(dy, dx);
    ctx.globalAlpha = 1; ctx.fillStyle = rgb(c, .9); ctx.beginPath();
    ctx.moveTo(ax + Math.cos(an) * 12, ay + Math.sin(an) * 12);
    ctx.lineTo(ax + Math.cos(an + 2.4) * 10, ay + Math.sin(an + 2.4) * 10);
    ctx.lineTo(ax + Math.cos(an - 2.4) * 10, ay + Math.sin(an - 2.4) * 10); ctx.fill();
    if (typeof t === 'string' && t) label(t, ax - Math.cos(an) * 16, ay - Math.sin(an) * 16, 12, c, .95, 800);
  }
}

// ---------- задание и испытания ★ ----------
function wrapText(t, px, weight, maxW) {
  ctx.font = `${weight} ${px}px system-ui,sans-serif`;
  const out = []; let line = '';
  for (const w of t.split(' ')) {
    const s = line ? line + ' ' + w : w;
    if (line && ctx.measureText(s).width > maxW) { out.push(line); line = w; } else line = s;
  }
  if (line) out.push(line);
  return out;
}
// Испытания ★ — два случайных из набора эпохи, каждый забег разные.
// ok() — выполнено; bad() — провалено; atEnd — засчитывается в конце, если не провалено.
function pickStars(pool, n = 2) {
  const a = pool.filter(s => !s.can || s.can());
  for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n).map(s => ({ ...s, st: 0 }));
}
// end — эпоха закончилась (всё несделанное проваливается); onWin(s) — награда
function tickStars(stars, end, onWin) {
  for (const s of stars) {
    if (s.st) continue;
    if (s.bad && s.bad()) s.st = -1;
    else if ((s.ok && s.ok()) || (end && s.atEnd)) { s.st = 1; onWin(s); }
    else if (end) s.st = -1;
  }
}
const starsWon = stars => stars.filter(s => s.st === 1).length;
// Панель задания под часами: крупно — первый невыполненный шаг {t: что сделать, s: коротко, d: сделано},
// ниже — испытания ★. Шаг выполнен — по центру вспыхивает «✓ коротко»; испытание — «★ …».
// tk — состояние панели у этапа (сбрасывать на новой эпохе), after — текст, когда все шаги сделаны.
function hudTask(alpha, tk, kicker, steps, stars, after) {
  if (!G.started) return;
  const ds = steps.map(s => !!s.d), ss = stars.map(s => s.st);
  if (tk.ds) {
    const j = ds.findIndex((d, k) => d && !tk.ds[k]);
    if (j >= 0) tk.fl = { txt: '✓ ' + steps[j].s, c: [140, 235, 170], at: G.T };
    const w = ss.findIndex((v, k) => v === 1 && tk.ss[k] !== 1);
    if (w >= 0) tk.fl = { txt: '★ ' + stars[w].t, c: [255, 215, 110], at: G.T };
  }
  tk.ds = ds; tk.ss = ss;
  const i = ds.indexOf(false), n = steps.length, cur = i < 0 ? null : steps[i];
  const x = G.W / 2, maxW = Math.min(560, G.W - 40) - 28;
  const lines = wrapText(cur ? cur.t : after || 'Задание выполнено', 19, 700, maxW);
  const kick = cur ? `${kicker} · ЗАДАНИЕ ${i + 1}/${n}` : `${kicker} · ✓ ВЫПОЛНЕНО`;
  ctx.font = '600 13px system-ui,sans-serif';
  const st = stars.map(s => `${s.st === 1 ? '★' : s.st < 0 ? '✗' : '☆'} ${s.t}`);
  const sw = st.map(t => ctx.measureText(t).width), gap = 22, rowW = sw.reduce((a, b) => a + b, 0) + gap * Math.max(0, st.length - 1);
  const stack = rowW > maxW, rows = st.length ? (stack ? st.length : 1) : 0;
  ctx.font = '700 19px system-ui,sans-serif';
  const w = Math.max(260, ...lines.map(l => ctx.measureText(l).width), stack ? Math.max(...sw) : rowW) + 28;
  const y0 = 48, h = 12 + 16 + lines.length * 24 + rows * 20 + 10;
  ctx.globalAlpha = alpha; ctx.fillStyle = 'rgba(10,9,18,.62)';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y0, w, h, 12); ctx.fill();
  label(kick, x, y0 + 18, 11, cur ? [255, 210, 122] : [140, 235, 170], .9 * alpha, 700);
  lines.forEach((l, k) => label(l, x, y0 + 40 + k * 24, 19, [255, 255, 255], alpha, 700));
  let sy = y0 + 40 + lines.length * 24 + 2, sx = x - rowW / 2;
  st.forEach((t, k) => {
    const c = stars[k].st === 1 ? [255, 215, 110] : stars[k].st < 0 ? [150, 150, 165] : [215, 220, 235];
    if (stack) label(t, x, sy + k * 20, 13, c, .95 * alpha, 600);
    else { label(t, sx + sw[k] / 2, sy, 13, c, .95 * alpha, 600); sx += sw[k] + gap; }
  });
  if (tk.fl) {
    const k = (G.T - tk.fl.at) / 1.8;
    if (k < 1) label(tk.fl.txt, x, G.H * .4 - 20 * k, 26, tk.fl.c, alpha * (1 - smooth(.6, 1, k)) * smooth(0, .08, k), 800);
  }
  ctx.globalAlpha = 1;
}

let msgT = 0, lastMsg = '';
function msg(t, dur = 3.8) {
  const el = document.getElementById('msg');
  el.textContent = t; el.style.opacity = 1; msgT = dur; lastMsg = t;
}

// ---------- фон: масштабно-инвариантная «пыль» ----------
function hash(a, b, c) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0;
}
function drawDust(bg) {
  const R = viewRadius(), base = Math.log(R) / Math.log(4);
  if (!isFinite(base)) return;
  ctx.fillStyle = rgb(mixc(bg, [255, 255, 255], .45));
  for (let k = 0; k < 3; k++) {
    const L = Math.floor(base) - 1 + k, cell = Math.pow(4, L), u = base - L;
    const a = smooth(-1, 0, u) * (1 - smooth(1.2, 2, u)) * .45;
    if (a <= .01) continue;
    const x0 = Math.floor((cam.x - G.W / 2 / cam.z) / cell), x1 = Math.ceil((cam.x + G.W / 2 / cam.z) / cell);
    const y0 = Math.floor((cam.y - G.H / 2 / cam.z) / cell), y1 = Math.ceil((cam.y + G.H / 2 / cam.z) / cell);
    if (!((x1 - x0) * (y1 - y0) < 6000)) continue;
    ctx.globalAlpha = a;
    const sz = clamp(cell * cam.z * .03, 1, 2.5);
    for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
      const h = hash(ix, iy, L); if (h & 1) continue;
      const wx = (ix + ((h >>> 8) & 255) / 255) * cell, wy = (iy + ((h >>> 16) & 255) / 255) * cell;
      ctx.fillRect(G.W / 2 + (wx - cam.x) * cam.z, G.H / 2 + (wy - cam.y) * cam.z, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}
