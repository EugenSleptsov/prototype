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
