// @ts-check
"use strict";
// Общее состояние, камера, ввод, эффекты.
// Типы (Stage — что этап отдаёт main.js, Fx, Step, TaskPanel…) — в types/game.d.ts
const G = { W: 1, H: 1, DPR: 1, T: 0, stageI: 0,
  /** текущий этап; prev — уходящий, пока идёт переход (trans 0…1) */
  stage: /** @type {Stage} */ (/** @type {unknown} */ (null)), prev: /** @type {Stage | null} */ (null), trans: 1,
  started: false, ended: false, paused: false, /** замедление времени (сцена открытия), с */ slowT: 0, fx: /** @type {Fx[]} */ ([]), score: 0,
  /** низ панели задания и когда она рисовалась (заголовки встают ниже) */
  taskY: 0, taskAt: /** @type {number | undefined} */ (undefined),
  /** заводит main.js: масштаб щипком/колесом, начало забега, идёт обучение, ✦ уже обращённые в очки (у какого этапа), лестница */
  zoom: 1, runT0: 0, tutor: false, knOf: /** @type {Stage | null} */ (null), knSeen: 0,
  ladP: /** @type {number | null} */ (null), ladT: /** @type {number | undefined} */ (undefined),
  /** единицы уходящего этапа: x_prev = x·s + ox (на переходе со сменой масштаба, см. rescale) */
  prevU: { s: 1, ox: 0, oy: 0 } };
// Очки — только для счёта: копятся весь забег, не тратятся (✦ — валюта уровня, её тратят на исследования).
// Каждый добытый ✦ приносит 10 очков (main.js следит за kn уровня); прочее — addScore.
/** @param {number} n */
function addScore(n) { G.score += Math.max(0, Math.round(n)); }
const fmtScore = (/** @type {number} */ n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const cam = { x: 0, y: 0, z: 40 };
// idle — палец отпущен: цели нет, тело плавно тормозит (мышь остаётся на месте и ведёт дальше)
const mouse = { x: 0, y: 0, has: false, down: false, idle: false, clicked: false };
const keys = new Set();
// P — «точка игрока» в мире. Активный этап держит её в актуальном состоянии.
const P = { x: 0, y: 0, vx: 0, vy: 0, dashCd: 0, dashT: 0 };

function resize() {
  G.DPR = Math.min(2, devicePixelRatio || 1);
  G.W = Math.max(1, innerWidth); G.H = Math.max(1, innerHeight);
  cv.width = G.W * G.DPR; cv.height = G.H * G.DPR;
  cv.style.width = G.W + 'px'; cv.style.height = G.H + 'px';
}
/** @type {(x: number, y: number) => [number, number]} */
const W2S = (x, y) => [G.W / 2 + (x - cam.x) * cam.z, G.H / 2 + (y - cam.y) * cam.z];
/** @type {(sx: number, sy: number) => [number, number]} */
const S2W = (sx, sy) => [(sx - G.W / 2) / cam.z + cam.x, (sy - G.H / 2) / cam.z + cam.y];
/** @type {(sx: number, sy: number, r: number) => boolean} */
const onScreen = (sx, sy, r) => sx > -r && sy > -r && sx < G.W + r && sy < G.H + r;
const viewRadius = () => Math.hypot(G.W, G.H) / 2 / cam.z;

// Плавное управление: тело тянется к курсору. resp — «вязкость» отклика.
/** @param {{ x: number, y: number, vx: number, vy: number }} o @param {number} maxSp @param {number} resp @param {number} dt */
function steer(o, maxSp, resp, dt) {
  if (!G.started || !mouse.has || P.dashT > 0) return;
  const [mx, my] = mouse.idle ? [o.x, o.y] : S2W(mouse.x, mouse.y);
  const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1e-9;
  const sp = maxSp * Math.min(1, d / (maxSp * .6));
  const k = Math.min(1, dt * resp);
  o.vx += (dx / d * sp - o.vx) * k; o.vy += (dy / d * sp - o.vy) * k;
}
/** @param {{ x: number, y: number, vx: number, vy: number }} o @param {number} power */
function tryDash(o, power) {
  if (!G.started || P.dashCd > 0 || !mouse.has) return false;
  const [mx, my] = mouse.idle ? [o.x + o.vx, o.y + o.vy] : S2W(mouse.x, mouse.y); // палец отпущен — рывок по ходу
  const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1e-9;
  o.vx += dx / d * power; o.vy += dy / d * power;
  P.dashCd = 1.0; P.dashT = .35;
  fxRing(o.x, o.y, 6 / cam.z, [255, 255, 255], 30 / cam.z, .4);
  return true;
}

// ---------- карта на уровнях с рогаткой ----------
// Там палец и мышь заняты жестом (рогатка, след, сгребание газа), поэтому карту двигают отдельно:
// WASD / стрелки, правая (средняя) кнопка мыши, два пальца, а у рогатки — ещё и тяга по пустому месту.
// Двигается «точка игрока» P — за ней камера; мир этапа остаётся на месте.
const PAN_KEYS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
/** Сдвинуть карту вслед за пальцем: точка мира под пальцем остаётся под ним @param {number} dsx @param {number} dsy — сдвиг на экране, px */
function panBy(dsx, dsy) { const dx = dsx / cam.z, dy = dsy / cam.z; P.x -= dx; P.y -= dy; cam.x -= dx; cam.y -= dy; }
/** Клавиши карты; скорость — доля поля зрения в секунду, на любом масштабе одинаково @param {number} dt */
function tickPan(dt) {
  if (!G.started || G.paused || (document.activeElement && document.activeElement.tagName === 'INPUT')) return; // печатают имя — не карта
  let x = 0, y = 0;
  for (const k of keys) { const v = /** @type {Record<string, number[]>} */ (PAN_KEYS)[k]; if (v) { x += v[0]; y += v[1]; } }
  const L = Math.hypot(x, y); if (!L) return;
  const sp = viewRadius() * 1.1 * dt / L; P.x += x * sp; P.y += y * sp;
}
// Полная резинка рогатки (px на экране): длиннее — точнее; на маленьком экране — сколько помещается
const slingFullPx = () => clamp(Math.min(G.W, G.H) * .42, 170, 340);

// ---------- бесконечный мир: Вселенная вокруг игрока ----------
// У каждого этапа свой масштаб, но мир везде один и без края. Вещество Вселенной приходит из-за края кадра — оттуда,
// где игрок его не видит, — а чужое далеко за краем растворяется. Своё (mine: твоё или выкованное тобой) не исчезает.
/** половина кадра в мире при масштабе z @param {number} [z] @returns {[number, number]} */
const halfView = (z = cam.z) => [G.W / 2 / z, G.H / 2 / z];
/** масштаб, к которому камера тянется на этапе @param {Stage} st */
const zoomFor = st => Math.max(100, Math.min(G.W, G.H)) / 2 / st.viewR() * (G.zoom || 1);
/** точка в кадре (с запасом m мировых единиц) @param {number} x @param {number} y @param {number} [m] */
const inView = (x, y, m = 0) => { const [hw, hh] = halfView(); return Math.abs(x - cam.x) < hw + m && Math.abs(y - cam.y) < hh + m; };
/** сколько тел держать в кадре: плотность (на единицу площади) × площадь кадра, но не больше cap @param {number} dens @param {number} cap @param {number} [z] */
const popWant = (dens, cap, z) => { const [hw, hh] = halfView(z); return Math.min(cap, Math.round(dens * 4 * hw * hh)); };
/** далеко за краем — тут чужое растворяется @param {{ x: number, y: number }} o @param {number} [k] */
const farOff = (o, k = 1.6) => Math.hypot(o.x - cam.x, o.y - cam.y) > viewRadius() * k;
/** точка сразу за краем кадра (запас m; z — масштаб кадра, по умолчанию нынешний) и направление внутрь
 * @param {number} m @param {number} [z] @returns {{ x: number, y: number, nx: number, ny: number }} */
function rimPos(m, z) {
  const [hw, hh] = halfView(z), s = Math.random() < .5 ? -1 : 1;
  if (Math.random() * (hw + hh) < hw) return { x: cam.x + rnd(-hw, hw), y: cam.y + s * (hh + m), nx: 0, ny: -s };
  return { x: cam.x + s * (hw + m), y: cam.y + rnd(-hh, hh), nx: -s, ny: 0 };
}
/** Точка в кадре будущего масштаба z1, но за краем нынешнего: туда Вселенная кладёт вещество заранее,
 * и камера, отъезжая, его открывает. anywhere — и в нынешнем кадре (запуск этапа с нуля) @param {number} z1 @param {number} m @param {boolean} [anywhere] @returns {[number, number] | null} */
function beyondPos(z1, m, anywhere) {
  const [hw, hh] = halfView(z1);
  for (let i = 0; i < 12; i++) {
    const x = cam.x + rnd(-hw - m, hw + m), y = cam.y + rnd(-hh - m, hh + m);
    if (anywhere || !inView(x, y, m)) return [x, y];
  }
  return null;
}
/** Чужое далеко за краем растворяется (dead), своё и занятое (keep) — нет @template {{ x: number, y: number, mine?: boolean, dead?: boolean }} T
 * @param {T[]} arr @param {(o: T) => boolean} [keep] */
function dissolveFar(arr, keep) { for (const o of arr) if (!o.mine && !o.dead && farOff(o) && !(keep && keep(o))) o.dead = true; }
/** Смена масштаба: мир вокруг (cx, cy) растягивается в U раз, а камера — в 1/U, и на экране ничего не прыгает;
 * дальше камера плавно едет к масштабу этапа. Уходящий этап рисуется в своих прежних единицах (G.prevU)
 * @param {number} U @param {number} cx @param {number} cy @param {Array<Array<{ x: number, y: number, vx?: number, vy?: number }>>} lists */
function rescale(U, cx, cy, lists) {
  const f = (/** @type {{ x: number, y: number }} */ o) => { o.x = cx + (o.x - cx) * U; o.y = cy + (o.y - cy) * U; };
  for (const arr of lists) for (const o of arr) { f(o); if (o.vx != null && o.vy != null) { o.vx *= U; o.vy *= U; } }
  f(cam); f(P); cam.z /= U; P.vx *= U; P.vy *= U;
  for (const fx of G.fx) { f(fx); fx.r0 *= U; fx.r1 *= U; }
  const u = G.prevU; u.ox += cx * (1 - 1 / U) * u.s; u.oy += cy * (1 - 1 / U) * u.s; u.s /= U;
}
/** точка мира в единицах уходящего этапа @param {number} x @param {number} y @returns {[number, number]} */
const toPrev = (x, y) => [x * G.prevU.s + G.prevU.ox, y * G.prevU.s + G.prevU.oy];
/** нарисовать уходящий этап его же камерой (в его единицах) @param {() => void} fn */
function withPrevCam(fn) {
  const { s, ox, oy } = G.prevU, x = cam.x, y = cam.y, z = cam.z;
  cam.x = x * s + ox; cam.y = y * s + oy; cam.z = z / s;
  try { fn(); } finally { cam.x = x; cam.y = y; cam.z = z; }
}

// ---------- эффекты ----------
/** @param {number} x @param {number} y @param {number} r0 @param {RGB} c @param {number} [r1] @param {number} [dur] */
function fxRing(x, y, r0, c, r1 = r0 * 3, dur = .6) { G.fx.push({ x, y, r0, r1, t: 0, dur, c, kind: 'ring' }); }
/** @param {number} x @param {number} y @param {number} r @param {RGB} c @param {number} [dur] */
function fxFlash(x, y, r, c, dur = .5) { G.fx.push({ x, y, r0: r, r1: r * 1.8, t: 0, dur, c, kind: 'flash' }); }
function drawFx() {
  for (const f of G.fx) {
    const k = f.t / f.dur, [sx, sy] = W2S(f.x, f.y), r = lerp(f.r0, f.r1, k) * cam.z;
    if (f.kind === 'ring') ring(sx, sy, r, f.c, .7 * (1 - k), 2);
    else glow(sx, sy, r, f.c, .8 * (1 - k));
  }
}

// ---------- ✦ летят в копилку: заработанное — искрами от места к счётчику «знания» ----------
// Всплыла надпись «+N ✦» — от неё к счётчику наверху летят 1–5 маленьких ✦ (тихо, без звука).
// Счётчик показывает баланс без того, что ещё в полёте, и чуть вспыхивает, когда искра долетела.
// Счётчика на экране нет (пролог, тесты без отрисовки) — ничего не летит, баланс сразу верный.
/** @typedef {{ x: number, y: number, cx: number, cy: number, t: number, d: number, v: number }} Spark */
const FLY_C = /** @type {RGB} */ ([255, 215, 110]);
const Fly = {
  /** @type {Spark[]} */ q: [],
  /** @type {Stage | null} */ of: null,
  tx: 0, ty: 0, seen: -9, pulse: -9, lag: 0,
  /** надпись в мире: «+N ✦» в тексте — искры от неё @param {number} wx @param {number} wy @param {string} txt */
  from(wx, wy, txt) { const m = /\+(\d+) ✦/.exec(txt); if (m) { const [x, y] = W2S(wx, wy); this.add(x, y - 16, +m[1]); } },
  /** от элемента страницы (строка «Законов Вселенной») @param {string} sel @param {number} v */
  fromEl(sel, v) { const el = document.querySelector(sel); if (!el) return; const r = el.getBoundingClientRect(); if (r.width) this.add(r.left + 14, r.top + r.height / 2, v); },
  /** @param {number} sx @param {number} sy @param {number} v */
  add(sx, sy, v) {
    if (!(v > 0) || G.T - this.seen > .5 || this.of !== G.stage || this.q.length > 60) return;
    const n = Math.min(5, Math.max(1, Math.round(Math.sqrt(v * 1.5))));
    const dx = this.tx - sx, dy = this.ty - sy, L = Math.hypot(dx, dy) || 1, bend = (Math.random() < .5 ? -1 : 1);
    for (let i = 0; i < n; i++) {
      const s = bend * (.18 + Math.random() * .22) * L; // дуга вбок, у каждой искры своя
      this.q.push({ x: sx + (Math.random() - .5) * 12, y: sy + (Math.random() - .5) * 8,
        cx: (sx + this.tx) / 2 - dy / L * s, cy: (sy + this.ty) / 2 + dx / L * s, t: -i * .07, d: .7 + Math.random() * .2 + Math.min(.3, L / 3000), v: v / n });
    }
    this.lag += v;
  },
  /** @param {number} dt */
  tick(dt) {
    if (this.of !== G.stage) { this.q = []; this.lag = 0; this.of = G.stage; }
    for (const f of this.q) if ((f.t += dt) >= f.d) { this.lag -= f.v; this.pulse = G.T; }
    this.q = this.q.filter(f => f.t < f.d);
    if (!this.q.length || this.lag < 0) this.lag = 0; // всё долетело — без накопленной погрешности
  },
  /** что показать на счётчике: баланс без того, что ещё летит @param {number} b */
  shown(b) { return Math.max(0, Math.round(b - this.lag)); },
  /** счётчик нарисован здесь (hudClock) @param {number} x @param {number} y */
  at(x, y) { this.tx = x; this.ty = y; this.seen = G.T; },
  draw() {
    for (const f of this.q) {
      if (f.t < 0) continue;
      const k = smooth(0, 1, f.t / f.d), u = 1 - k, x = u * u * f.x + 2 * u * k * f.cx + k * k * this.tx, y = u * u * f.y + 2 * u * k * f.cy + k * k * this.ty;
      const a = .8 * smooth(0, .12, f.t / f.d) * (1 - .4 * k);
      glow(x, y, 7, FLY_C, .25 * a);
      label('✦', x, y, 12 - 3 * k, FLY_C, a, 700);
    }
  }
};

// ---------- общий интерфейс уровней: часы, цели, заголовок, стрелки ----------
// Часы, ✦ и очки забега — сверху по центру, под ними цели «фишками» [текст, выполнено]
/** @param {number} alpha @param {string} left @param {RGB} leftCol @param {number | string} pts @param {[string, boolean][]} chips */
function hudClock(alpha, left, leftCol, pts, chips) {
  const x = G.W / 2, y = 24;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10,9,18,.55)'; ctx.beginPath(); ctx.roundRect(x - 140, y - 17, 280, 34, 10); ctx.fill();
  label(left, x - 88, y, 20, leftCol, 1, 700);
  // ✦ в полёте ещё не на счётчике; долетела — счётчик чуть вспыхивает
  const shown = typeof pts === 'number' ? Fly.shown(pts) : pts, pl = 1 - smooth(0, .35, G.T - Fly.pulse), kt = `${shown} ✦`;
  ctx.font = '700 18px system-ui,sans-serif'; Fly.at(x - 4 + ctx.measureText(kt).width / 2 - 7, y - 3);
  if (pl > 0) glow(Fly.tx, Fly.ty, 16, FLY_C, .35 * pl);
  label(kt, x - 4, y - 3, 18 + 1.5 * pl, [255, 215, 110], 1, 700);
  label('знания', x - 4, y + 11, 9, [255, 215, 110], .75, 600); // ✦ — знания (их тратят), ⚡ — энергия детектора
  label(fmtScore(G.score), x + 86, y - 3, 17, [235, 238, 250], 1, 800);
  label('очки', x + 86, y + 11, 9, [190, 195, 215], .75, 600);
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
// why — ради чего этот уровень на пути к жизни («из кварков → протоны → без них не будет ядер»): строка золотом.
// Начало нового уровня (не первого) — важное знание: вместо надписи на карте — кадр-пауза с путём Вселенной.
/** @type {Set<string>} */
const bannerCine = new Set();
/** @param {number} b @param {string} kicker @param {string} name @param {string} sub @param {number} alpha @param {string} [why] */
function hudBanner(b, kicker, name, sub, alpha, why) {
  const end = why ? 5.6 : 4.2;
  if (!G.started || b > end) return;
  if (why && G.stageI > 0) {
    if (b < .2 || bannerCine.has(name)) return;
    bannerCine.add(name);
    const path = LADDER.map((n, i) => `<span class="${i < G.stageI ? 'was' : i === G.stageI ? 'on' : ''}">${n}</span>`).join('<i>→</i>');
    Cine.show(`<div class="ck">${kicker}</div><div class="cn lvl">${name}</div><div class="pth">${path}</div>` +
      `<div class="cp">${sub}</div><div class="cg">${why}</div>`, 6.5);
    return;
  }
  const a = smooth(0, .4, b) * (1 - smooth(end - 1.2, end, b)) * alpha, y = Math.max(G.H * .3, (G.T - (G.taskAt ?? -9) < .2 ? G.taskY : 0) + 62); // не на карточках задания
  label(kicker, G.W / 2, y - 36, 12, [255, 210, 122], .85 * a, 700);
  label(name, G.W / 2, y, 40, [255, 255, 255], a, 800);
  const maxW = Math.min(640, G.W - 40), ls = wrapText(sub, 15, 500, maxW);
  ls.forEach((l, k) => label(l, G.W / 2, y + 36 + k * 20, 15, [220, 225, 240], .8 * a, 500));
  if (why) wrapText(why, 15, 700, maxW).forEach((l, k) => label(l, G.W / 2, y + 44 + ls.length * 20 + k * 20, 15, [255, 215, 120], .95 * a * smooth(.8, 1.3, b), 700));
}
// Стрелки у края экрана к целям за кадром: pts = [[x, y, подпись или цвет]]; не больше n ближайших
/** @param {[number, number, (string | RGB)?][]} pts @param {number} n */
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
/** @param {string} t @param {number} px @param {number | string} weight @param {number} maxW @returns {string[]} */
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
/** @template {object} T @param {T[]} pool @param {number} [n] @returns {(T & { st: number })[]} */
function pickStars(pool, n = 2) {
  const a = pool.filter(s => { const can = /** @type {{ can?: () => boolean }} */ (s).can; return !can || can(); });
  for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n).map(s => ({ ...s, st: 0 }));
}
// end — эпоха закончилась (всё несделанное проваливается); onWin(s) — награда
/** @param {Star[]} stars @param {boolean} end @param {(s: Star) => void} onWin */
function tickStars(stars, end, onWin) {
  for (const s of stars) {
    if (s.st) continue;
    if (s.bad && s.bad()) s.st = -1;
    else if ((s.ok && s.ok()) || (end && s.atEnd)) { s.st = 1; onWin(s); }
    else if (end) s.st = -1;
  }
}
const starsWon = (/** @type {Star[]} */ stars) => stars.filter(s => s.st === 1).length;
// Текст слева (или справа) и обрезка с «…» по ширине
/** @param {string} t @param {number} x @param {number} y @param {number} px @param {RGB} c @param {number} [a] @param {number} [weight] @param {CanvasTextAlign} [align] */
function labelL(t, x, y, px, c, a = 1, weight = 600, align = 'left') {
  ctx.fillStyle = rgb(c, a); ctx.font = `${weight} ${px}px system-ui,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
}
/** @param {string} t @param {number} px @param {number} weight @param {number} maxW */
function fitText(t, px, weight, maxW) {
  ctx.font = `${weight} ${px}px system-ui,sans-serif`;
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}
// Фишки в строку с переносом: [[текст, цвет фона, цвет текста, зачёркнуто]] → высота; draw=false — только мерить
/** @param {Chip[]} list @param {number} x0 @param {number} y @param {number} maxW @param {number} px @param {boolean} draw @param {number} alpha */
function chipRows(list, x0, y, maxW, px, draw, alpha) {
  ctx.font = `700 ${px}px system-ui,sans-serif`;
  const h = px + 9, gap = 6; let x = x0, rows = list.length ? 1 : 0;
  for (const [t, bg, fg, strike] of list) {
    const w = ctx.measureText(t).width + 16;
    if (x > x0 && x + w > x0 + maxW) { x = x0; y += h + gap; rows++; }
    if (draw) {
      ctx.fillStyle = rgb(bg[0], bg[1] * alpha); ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
      label(t, x + w / 2, y + h / 2 + .5, px, fg, .95 * alpha, 700);
      if (strike) { ctx.fillStyle = rgb(fg, .6 * alpha); ctx.fillRect(x + 8, y + h / 2, w - 16, 1); }
      ctx.font = `700 ${px}px system-ui,sans-serif`;
    }
    x += w + gap;
  }
  return rows ? rows * h + (rows - 1) * gap : 0;
}
// Цвет значка частицы по виду (как .cs в index.html): кварк, лептон, нейтрино, бозон, поле
/** @type {Record<string, RGB>} */
const KIND_C = { quark: [122, 61, 154], lepton: [47, 122, 78], nu: [47, 122, 78], boson: [154, 74, 46], fld: [46, 74, 154] };
// Рецепт значками: «γ + g ▮▮▯▯ 2 ⚡ → c c̄». draw=false — только ширина
/** @param {Rx} rx @param {number} x @param {number} y — верх строки @param {number} a @param {boolean} draw */
function drawRecipe(rx, x, y, a, draw) {
  const h = 22, x0 = x;
  /** @param {[string, string]} c */
  const chip = ([t, kind]) => {
    ctx.font = '800 14px system-ui,sans-serif'; const w = Math.max(26, ctx.measureText(t).width + 12);
    if (draw) { ctx.fillStyle = rgb(KIND_C[kind] || KIND_C.boson, .95 * a); ctx.beginPath(); ctx.roundRect(x, y, w, h, 7); ctx.fill(); label(t, x + w / 2, y + h / 2 + .5, 14, [255, 255, 255], a, 800); }
    x += w + 5;
  };
  /** @param {string} t */
  const sign = t => { if (draw) label(t, x + 6, y + h / 2, 14, [220, 225, 240], .7 * a, 600); x += 17; };
  rx.l.forEach((c, i) => { if (i) sign('+'); chip(c); });
  if (rx.k) { // сила удара — ступени, как на кольце детектора; −1 — не названа: подбери сам
    for (let k = 1; k <= 4; k++) { if (draw) { ctx.fillStyle = k <= rx.k ? rgb([255, 210, 122], .95 * a) : rgb([255, 255, 255], .16 * a); ctx.beginPath(); ctx.roundRect(x, y + 4, 6, h - 8, 2); ctx.fill(); } x += 9; }
    if (draw) labelL(rx.k > 0 ? `${rx.k}⚡` : '?⚡', x + 1, y + h / 2 + .5, 12, [255, 210, 122], .95 * a, 800);
    x += 26;
  }
  sign('→'); rx.r.forEach(chip);
  return x - x0;
}
// Задание — одна карточка под часами (раньше — стопка: выполненные и следующий отвлекали). Шаг: {t: что сделать
// словами, rx: рецепт значками, h: как (мелко), items: [[метка, есть]], p: [сколько, из], s: коротко — вспыхивает
// «✓ s», d: сделано}. В шапке — полоска шагов; испытания ★ — фишками под карточкой.
// tk — состояние панели у этапа (сбрасывать на новой эпохе), after — текст, когда все шаги сделаны.
/** @param {number} alpha @param {TaskPanel} tk @param {string} kicker @param {Step[]} steps @param {Star[]} stars @param {string} [after] */
function hudTask(alpha, tk, kicker, steps, stars, after) {
  if (!G.started) return;
  const ds = steps.map(s => !!s.d), ss = stars.map(s => s.st);
  const pd = tk.ds, ps = tk.ss || [];
  if (pd) {
    const j = ds.findIndex((d, k) => d && !pd[k]);
    if (j >= 0) { tk.fl = { txt: '✓ ' + steps[j].s, c: [140, 235, 170], at: G.T }; tk.doneAt = G.T; Sfx.play('goal'); }
    const w = ss.findIndex((v, k) => v === 1 && ps[k] !== 1);
    if (w >= 0) { tk.fl = { txt: '★ ' + stars[w].t, c: [255, 215, 110], at: G.T }; Sfx.play('star'); }
  }
  tk.ds = ds; tk.ss = ss;
  const i = ds.indexOf(false), n = steps.length, cur = i < 0 ? null : steps[i], a = alpha, small = G.H < 720 || G.W < 520;
  const W = Math.min(400, G.W - 24), x0 = (G.W - W) / 2, pad = 12, GOLD = [255, 210, 122], GREEN = [150, 240, 185];
  let y = 46;
  ctx.globalAlpha = 1;
  // шапка: эпоха и полоска шагов
  labelL(cur ? `${kicker} · ЗАДАНИЕ ${i + 1}/${n}` : `${kicker} · ✓ ВЫПОЛНЕНО`, x0 + 4, y + 8, 11, cur ? GOLD : GREEN, .9 * a, 800);
  const sw = Math.min(18, (W * .4) / n - 3);
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = ds[k] ? rgb([77, 232, 155], .85 * a) : k === i ? rgb(GOLD, .95 * a) : rgb([255, 255, 255], .18 * a);
    ctx.beginPath(); ctx.roundRect(x0 + W - (n - k) * (sw + 3) + 3, y + 6, sw, 4, 2); ctx.fill();
  }
  y += 20;
  // текущий — раскрыт
  const iw = W - pad * 2 - 30, tx = x0 + pad + 30;
  const title = wrapText(cur ? cur.t : after || 'Задание выполнено', 16, 800, iw);
  let hint = cur && cur.h ? wrapText(cur.h, 13, 500, iw) : [];
  if (small && hint.length > 2) { hint = hint.slice(0, 2); hint[1] = hint[1].replace(/[\s,.;:—-]*\S*$/, '') + '…'; }
  /** @type {Chip[]} */
  const items = cur && cur.items ? cur.items.map(([t, d]) => [(d ? '✓ ' : '') + t, d ? [[77, 232, 155], .28] : [[255, 255, 255], .09], d ? [170, 245, 205] : [235, 235, 245]]) : [];
  const ih = chipRows(items, tx, 0, iw, 12, false, a);
  const hasP = cur && cur.p, rx = cur && cur.rx;
  const h = 12 + title.length * 21 + (rx ? 28 : 0) + (hint.length ? 3 + hint.length * 17 : 0) + (ih ? 8 + ih : 0) + (hasP ? 16 : 0) + 10;
  ctx.fillStyle = rgb([14, 12, 26], .84 * a); ctx.beginPath(); ctx.roundRect(x0, y, W, h, 12); ctx.fill();
  ctx.strokeStyle = rgb(cur ? GOLD : GREEN, .35 * a); ctx.lineWidth = 1; ctx.stroke();
  // номер шага в кружке
  ctx.fillStyle = rgb(cur ? GOLD : [77, 232, 155], .95 * a); ctx.beginPath(); ctx.arc(x0 + pad + 11, y + 12 + 10.5, 11, 0, TAU); ctx.fill();
  label(cur ? String(i + 1) : '✓', x0 + pad + 11, y + 12 + 11, 13, [20, 16, 30], a, 800);
  let cy = y + 12 + 10.5;
  title.forEach(l => { labelL(l, tx, cy, 16, [255, 255, 255], a, 800); cy += 21; });
  cy -= 10.5;
  if (rx) { drawRecipe(rx, tx, cy + 4, a, true); cy += 28; }
  if (hint.length) { cy += 3; hint.forEach(l => { labelL(l, tx, cy + 8.5, 13, [200, 206, 228], .88 * a, 500); cy += 17; }); }
  if (ih) { cy += 8; chipRows(items, tx, cy, iw, 12, true, a); cy += ih; }
  if (hasP) {
    const [v, of] = hasP, k = of > 0 ? Math.min(1, v / of) : 0, bw = iw - 46;
    ctx.fillStyle = rgb([255, 255, 255], .12 * a); ctx.beginPath(); ctx.roundRect(tx, cy + 7, bw, 5, 2.5); ctx.fill();
    if (k > 0) { ctx.fillStyle = rgb(GOLD, .95 * a); ctx.beginPath(); ctx.roundRect(tx, cy + 7, Math.max(5, bw * k), 5, 2.5); ctx.fill(); }
    labelL(`${v}/${of}`, tx + iw, cy + 9.5, 12, GOLD, .95 * a, 800, 'right');
  }
  y += h + 5;
  // испытания ★
  if (stars.length) {
    /** @type {Chip[]} */
    const st = stars.map(s => s.st === 1 ? ['★ ' + s.t, [[255, 215, 110], .26], [255, 225, 140]]
      : s.st < 0 ? ['✗ ' + s.t, [[255, 255, 255], .05], [150, 150, 165], true] : ['☆ ' + s.t, [[10, 9, 18], .62], [225, 228, 240]]);
    y += chipRows(st, x0, y + 1, W, 12, true, a) + 6;
  }
  G.taskY = y; G.taskAt = G.T; // низ панели — заголовок эпохи встаёт ниже
  if (tk.fl) {
    const k = (G.T - tk.fl.at) / 1.8;
    if (k < 1) label(tk.fl.txt, G.W / 2, G.H * .4 - 20 * k, 26, tk.fl.c, a * (1 - smooth(.6, 1, k)) * smooth(0, .08, k), 800);
  }
  ctx.globalAlpha = 1;
}

// ---------- итоги уровня: ненавязчиво, сбоку, игру не останавливают ----------
// Уровень даёт tally(): { name, rows: [[подпись, значение]], auto: [сама, всего] | null, stars }.
// Здесь же: бонус за пройденный уровень и за долю, отданную Вселенной; рекорд уровня — молча в таблицу.
const TALLY_T = 8, LVL_BONUS = 500, AUTO_BONUS = 1000;
const Tally = {
  t: 0,
  // итоги пройденного уровня (из advance)
  /** @param {Stage} st */
  show(st) {
    /** @type {TallyData} */
    const d = st.tally ? st.tally() : { name: st.name, rows: [] };
    const auto = d.auto && d.auto[1] > 0 ? clamp(d.auto[0] / d.auto[1], 0, 1) : null;
    addScore(LVL_BONUS); if (auto !== null) addScore(AUTO_BONUS * auto);
    const lvl = Math.round(G.score - (st.scoreAt || 0));
    /** @type {number | null} */
    let place = null;
    if (!st.cheated) place = LB.add('run.' + st.key, { n: LB.name(), s: lvl, t: Math.floor(st.clock ?? st.t ?? 0), d: Date.now() }).place;
    const uk = Math.floor(Uni.total(st));
    /** @type {TallyData['rows']} */
    const rows = [...d.rows];
    if (uk > 0) rows.push(['✦ от Вселенной', uk]);
    rows.push(['уровень пройден', '+' + LVL_BONUS, 'tb']);
    if (auto !== null) rows.push(['отдано Вселенной', '+' + Math.round(AUTO_BONUS * auto), 'tb']);
    rows.push(['очки за уровень', fmtScore(lvl), 'tl'], ['всего', fmtScore(G.score), 'tt']);
    this.note(`УРОВЕНЬ ${G.stageI + 1} · ПРОЙДЕН`, d.name, rows, d.stars || [], place, '', auto);
  },
  // любая сводка сбоку: шапка, имя, строки [подпись, значение, класс], ★, место в таблице, сноска, доля Вселенной
  /** @param {string} kick @param {string} name @param {TallyData['rows']} rows @param {Star[]} stars @param {number | null} place @param {string} [foot] @param {number | null} [auto] */
  note(kick, name, rows, stars, place, foot, auto) {
    const row = (/** @type {TallyData['rows'][number]} */ [k, v, c = 'tx']) => `<div class="${c}"><span>${k}</span><b>${v}</b></div>`;
    const el = byId('tally');
    el.innerHTML = `<div class="tk">${kick}</div><div class="tn">${name}</div>` +
      (auto != null ? `<div class="ta"><i style="width:${Math.round(auto * 100)}%"></i><span>Вселенная — ${Math.round(auto * 100)} %</span></div>` : '') +
      rows.map(row).join('') +
      (stars && stars.length ? `<div class="ts">${stars.map(s => `<em class="${s.st === 1 ? 'y' : 'n'}">${s.st === 1 ? '★' : '✗'} ${s.t}</em>`).join('')}</div>` : '') +
      (place === 0 ? '<div class="tr">🏆 рекорд</div>' : place != null ? `<div class="tr">#${place + 1} в таблице</div>` : '') +
      (foot ? `<div class="tf">${foot}</div>` : '');
    el.classList.add('on'); this.t = TALLY_T;
  },
  /** @param {number} dt */
  tick(dt) {
    if (this.t <= 0) return;
    const el = byId('tally');
    if ((this.t -= dt) <= 0) { el.classList.remove('on'); return; }
    // на узком экране — компактно под панелью задания (и под карточкой открытия, если она видна)
    if (G.W <= 700) {
      const cd = byId('card'), cv = +cd.style.opacity > 0 && !cd.classList.contains('side') && !cd.classList.contains('big');
      el.style.top = Math.max(60, (G.taskY || 0) + 10 + (cv ? cd.offsetHeight + 8 : 0)) + 'px';
    } else el.style.top = '';
  },
};

// ---------- Законы Вселенной: чему научил — работает без тебя и понемногу приносит ✦ ----------
// Строка на каждый закон уровня («Сформировать закон»): ровный доход rate (✦/мин, выплачивается по 1 ✦) и всё, что принесла.
// События, за которые Вселенная платит и так (её барионы, вспышки e⁺e⁻, снятые распады…), идут через pay() —
// в ту же строку. Сводка — справа (#uni); в итогах уровня — «✦ от Вселенной».
// Уровень может дать uniOn(k) — работает ли это сейчас — и uniPop(k) — где показать «+1 ✦».
const UNI_WIN = 60, UNI_LVL = 3; // UNI_LVL — ✦/мин от закона на уровнях после частиц (их события платят ещё)
/** @type {RGB} */
const UNI_C = [140, 235, 170];
const Uni = {
  /** научено (повторно — уровень выше, rate — новый общий доход строки, ✦/мин)
   * @param {Stage} S @param {string} k @param {string} ic @param {string} name @param {number} [rate] @returns {UniRow} */
  learn(S, k, ic, name, rate = 0) {
    const L = S.uni || (S.uni = []);
    let r = L.find(x => x.k === k);
    if (!r) L.push(r = { k, ic, name, lv: 0, rate: 0, acc: 0, kn: 0, en: 0, n: 0, t0: G.T, fl: G.T, log: [] });
    r.lv++; r.rate = rate; r.fl = G.T; return r;
  },
  /** Вселенная сработала сама: +v ✦ уровню (en — ⚡, только для сводки)
   * @param {Stage} S @param {string} k @param {number} v @param {number} [en] */
  pay(S, k, v, en = 0) {
    S.kn = (S.kn || 0) + v;
    const r = S.uni && S.uni.find(x => x.k === k); if (!r) return;
    r.kn += v; r.en += en; r.n++; r.fl = G.T;
    if (v) r.log.push([G.T, v]);
  },
  /** @param {Stage} S @param {string} k */
  on(S, k) { return !S.uniOn || S.uniOn(k); },
  /** ровный доход: копится и выплачивается по 1 ✦ @param {Stage} S @param {number} dt */
  tick(S, dt) {
    for (const r of S.uni || []) {
      if (!r.rate || !this.on(S, r.k) || (r.acc += r.rate / 60 * dt) < 1) continue;
      r.acc -= 1; this.pay(S, r.k, 1);
      if (!(S.uniPop && S.uniPop(r.k))) Fly.fromEl(`#uni .ur[data-k="${r.k}"]`, 1); // не на виду — искра из строки закона
    }
  },
  /** всего принесла Вселенная на уровне @param {Stage} S */
  total(S) { return (S.uni || []).reduce((s, r) => s + r.kn, 0); },
  /** ✦/мин строки: не меньше ровного дохода; события — за последнюю минуту @param {Stage} S @param {UniRow} r */
  perMin(S, r) {
    if (!this.on(S, r.k)) return 0;
    const t0 = G.T - UNI_WIN; while (r.log.length && r.log[0][0] < t0) r.log.shift();
    const win = clamp(G.T - r.t0, 20, UNI_WIN), ev = r.log.reduce((s, e) => s + (e[0] >= G.T - win ? e[1] : 0), 0) * 60 / win;
    return Math.max(r.rate, ev);
  },
  /** @param {HTMLElement & { _h?: string }} el */
  render(el) {
    const S = G.stage, L = (S && S.uni) || [];
    if (!G.started || G.ended || !L.length) { el.style.display = 'none'; return; }
    let tot = 0;
    const rows = L.map(r => {
      const pm = this.perMin(S, r); tot += pm;
      const got = `+${Math.floor(r.kn)} ✦` + (r.en >= 1 ? ` <s>+${Math.round(r.en)} ⚡</s>` : '');
      return `<div data-k="${r.k}" class="ur${G.T - r.fl < .6 ? ' fl' : ''}${pm ? '' : ' off'}" title="${r.name}: ${pm ? `${fmtPm(pm)} ✦ в минуту` : 'в эту эпоху не работает'} · принесла ${Math.floor(r.kn)} ✦">` +
        `<span class="ic">${r.ic}</span><b>${r.name}${r.lv > 1 ? ` <small>×${r.lv}</small>` : ''}</b><em>${got}</em><i>${pm ? fmtPm(pm) + '/мин' : 'в эту эпоху — нет'}</i></div>`;
    }).join('');
    const html = `<div class="uh"><span>Законы Вселенной</span><em>+${fmtPm(tot)} ✦/мин</em></div>` + rows;
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    // над лавкой (она бывает в два ряда) и не налезая на сетку кодекса сверху
    const sh = byId('shop'), cx = byId('codex');
    const bot = Math.max(G.W <= 700 ? 96 : 110, sh.style.display === 'none' ? 0 : G.H - sh.getBoundingClientRect().top + 10);
    const cb = cx.style.display === 'none' ? 0 : cx.getBoundingClientRect().bottom;
    el.style.bottom = bot + 'px'; el.style.maxHeight = Math.max(60, G.H - cb - 10 - bot) + 'px';
    el.style.display = '';
  },
};
const fmtPm = (/** @type {number} */ v) => v >= 10 || v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1).replace('.', ',');

let msgT = 0, lastMsg = '';
/** @param {string} t @param {number} [dur] */
function msg(t, dur = 3.8) {
  const el = byId('msg');
  el.textContent = t; el.style.opacity = '1'; msgT = dur; lastMsg = t;
  el.style.top = Math.max(G.H * .2, (G.taskY || 0) + 14) + 'px'; // под панелью задания, не поверх
}

// ---------- «зачем это»: часть экрана появилась впервые — одна строка рядом с ней ----------
// По одной за раз, HINT_T секунд; at() — точка на экране и сторона подписи (1 — ниже точки, −1 — выше), null — пока некуда показать
const HINT_T = 4.2;
/** @typedef {{ text: string, at: () => [number, number, number] | null, t: number }} HintItem */
const Hint = {
  seen: /** @type {Set<string>} */ (new Set()), q: /** @type {HintItem[]} */ ([]), cur: /** @type {HintItem | null} */ (null),
  /** @param {string} key @param {string} text @param {() => [number, number, number] | null} at */
  once(key, text, at) { if (this.seen.has(key)) return; this.seen.add(key); this.q.push({ text, at, t: 0 }); },
  /** @param {number} dt */
  tick(dt) {
    if (!this.cur) this.cur = this.q.shift() || null;
    if (this.cur && (this.cur.t += dt) > HINT_T) this.cur = null;
  },
  draw() {
    const h = this.cur; if (!h || !G.started || G.paused) return;
    const p = h.at(); if (!p) return;
    const [x, y, side] = p, a = smooth(0, .3, h.t) * (1 - smooth(HINT_T - .6, HINT_T, h.t)), px = 13;
    const txt = fitText(h.text, px, 700, G.W - 40), w = ctx.measureText(txt).width + 22, hh = 26;
    const bx = clamp(x - w / 2, 8, G.W - w - 8), by = side > 0 ? y + 10 : y - 10 - hh, tx = clamp(x, bx + 12, bx + w - 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgb([20, 16, 8], .92 * a); ctx.strokeStyle = rgb([255, 210, 122], .85 * a); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(bx, by, w, hh, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgb([255, 210, 122], .9 * a); ctx.beginPath(); // носик к тому, о чём речь
    if (side > 0) { ctx.moveTo(tx - 6, by); ctx.lineTo(tx, by - 7); ctx.lineTo(tx + 6, by); } else { ctx.moveTo(tx - 6, by + hh); ctx.lineTo(tx, by + hh + 7); ctx.lineTo(tx + 6, by + hh); }
    ctx.fill();
    label(txt, bx + w / 2, by + hh / 2 + .5, px, [255, 236, 190], a, 700);
  },
};
/** точка у края элемента страницы (для Hint): side 1 — под ним, −1 — над ним @param {string} id @param {number} side @returns {[number, number, number] | null} */
function hintAtEl(id, side) {
  const el = byId(id); if (!el || el.style.display === 'none') return null;
  const r = el.getBoundingClientRect(); if (!r.width) return null;
  return [r.left + r.width / 2, side > 0 ? r.bottom : r.top, side];
}

// ---------- фон: масштабно-инвариантная «пыль» ----------
/** @param {number} a @param {number} b @param {number} c */
function hash(a, b, c) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0;
}
/** @param {RGB} bg */
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
