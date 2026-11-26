"use strict";
// ---------- математика ----------
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * Math.random()); }
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const rot = (u, v, a) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function centroid(arr) { let x = 0, y = 0; for (const p of arr) { x += p.x; y += p.y; } return { x: x / arr.length, y: y / arr.length }; }

// пересекаются ли отрезки ab и cd
function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

// расстояние от точки до отрезка
/** @param {number} x @param {number} y @param {number} ax @param {number} ay @param {number} bx @param {number} by */
function segDist(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1) : 0;
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}

// ---------- текст ----------
const SUBD = '₀₁₂₃₄₅₆₇₈₉', SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sub = n => String(n).split('').map(d => SUBD[d]).join('');
const sup = n => String(n).split('').map(d => SUPD[d]).join('');

// ---------- цвет ----------
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------- примитивы рисования ----------
/** Элемент страницы по id — для тех, что точно есть в index.html (нет — ошибка сразу, а не null дальше) */
const byId = (/** @type {string} */ id) => { const el = document.getElementById(id); if (!el) throw new Error('нет #' + id); return el; };
const cv = /** @type {HTMLCanvasElement} */ (byId('c'));
const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));

// Кварк: аромат — форма, цвет — заливка. u ● круг, d ◆ ромб, s ▲ треугольник, c ■ квадрат, b ⬢ шестиугольник, t — круг.
// Антикварк — полый, той же формы и того же цвета (антицвет: «красный» + «полый красный» = бесцветный мезон).
/** @type {Record<string, string>} */
const Q_SHAPE = { d: 'dia', s: 'tri', c: 'sq', b: 'hex' };
/** @param {number} x @param {number} y @param {number} r @param {boolean | string} sh true / 'dia' — ромб; 'tri', 'sq', 'hex'; иначе круг */
function qPath(x, y, r, sh) {
  ctx.beginPath();
  const k = r * 1.2, poly = (/** @type {number} */ n, /** @type {number} */ R, /** @type {number} */ a0) => { for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; if (i) ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); else ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.closePath(); };
  if (sh === true || sh === 'dia') { ctx.moveTo(x, y - k); ctx.lineTo(x + k, y); ctx.lineTo(x, y + k); ctx.lineTo(x - k, y); ctx.closePath(); }
  else if (sh === 'tri') poly(3, r * 1.3, -Math.PI / 2);
  else if (sh === 'sq') poly(4, r * 1.2, Math.PI / 4);
  else if (sh === 'hex') poly(6, r * 1.15, 0);
  else ctx.arc(x, y, r, 0, TAU);
}
/** @param {number} x @param {number} y @param {number} r @param {RGB} c @param {string} fl @param {boolean} anti @param {number} [a] */
function quark(x, y, r, c, fl, anti, a = 1) {
  if (!(r > 0)) return;
  const sh = Q_SHAPE[fl];
  if (anti) { ctx.strokeStyle = rgb(c, a); ctx.lineWidth = Math.max(1.5, r * .32); qPath(x, y, r * .82, sh); ctx.stroke(); return; }
  if (!sh) { ball(x, y, r, c, a); return; }
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r * 1.2);
  g.addColorStop(0, rgb(mixc(c, [255, 255, 255], .6), a)); g.addColorStop(.6, rgb(c, a)); g.addColorStop(1, rgb(mixc(c, [0, 0, 0], .5), a));
  ctx.fillStyle = g; qPath(x, y, r, sh); ctx.fill();
}
function ball(x, y, r, c, a = 1) {
  if (!(r > 0)) return;
  if (r < 0.8) { ctx.fillStyle = rgb(c, a); ctx.fillRect(x - .7, y - .7, 1.4, 1.4); return; }
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r);
  g.addColorStop(0, rgb(mixc(c, [255, 255, 255], .6), a)); g.addColorStop(.6, rgb(c, a)); g.addColorStop(1, rgb(mixc(c, [0, 0, 0], .5), a));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function glow(x, y, r, c, a) {
  if (!(r >= 1) || !(a > 0)) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(c, a)); g.addColorStop(1, rgb(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
/** @param {number[] | null} [dash] */
function ring(x, y, r, c, a, lw = 1, dash = null) {
  if (!(r > 0) || !(a > 0)) return;
  ctx.strokeStyle = rgb(c, a); ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  if (dash) ctx.setLineDash([]);
}
function line(x1, y1, x2, y2, c, a, lw = 1) {
  ctx.strokeStyle = rgb(c, a); ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function label(t, x, y, px, c = [255, 255, 255], a = 1, weight = 600) {
  ctx.fillStyle = rgb(c, a); ctx.font = `${weight} ${Math.max(8, px) | 0}px system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
}
// подпись на тёмной плашке: читается поверх светлого свечения (гелий, нуклоны)
function tag(t, x, y, px, c = [255, 255, 255], a = 1, weight = 700) {
  ctx.font = `${weight} ${Math.max(8, px) | 0}px system-ui,sans-serif`;
  const w = ctx.measureText(t).width + px * .9, h = px * 1.45;
  ctx.fillStyle = `rgba(10,10,22,${(.62 * a).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  label(t, x, y, px, c, a, weight);
}
// всплывающая надпись: целиком в экране, даже если источник у края
function labelIn(t, x, y, px, c, a, weight) {
  ctx.font = `${weight} ${Math.max(8, px) | 0}px system-ui,sans-serif`;
  const h = ctx.measureText(t).width / 2 + 8;
  label(t, G.W > 2 * h ? clamp(x, h, G.W - h) : G.W / 2, y, px, c, a, weight);
}
// нуклон с тремя кварками внутри — общий для этапов 0–2 (визуальная преемственность)
const NUC_C = { p: [230, 80, 70], n: [170, 170, 185] };
const QDOT = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
function drawNucleon(x, y, r, type, phase = 0) {
  const c = NUC_C[type];
  glow(x, y, r * 1.5, c, .15);
  ball(x, y, r, c);
  if (r > 4) for (let i = 0; i < 3; i++) {
    const a = phase + i * TAU / 3;
    ball(x + Math.cos(a) * r * .45, y + Math.sin(a) * r * .45, r * .2, QDOT[i], .85);
  }
}
