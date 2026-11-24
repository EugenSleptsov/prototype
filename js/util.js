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
