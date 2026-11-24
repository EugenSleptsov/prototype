"use strict";
// Общее состояние, камера, ввод, эффекты.
const G = { W: 1, H: 1, DPR: 1, T: 0, stageI: 0, stage: null, prev: null, trans: 1, started: false, ended: false, fx: [], score: 0 };
// Очки — только для счёта: копятся весь забег, не тратятся (✦ — валюта уровня, её тратят на исследования).
// Каждый добытый ✦ приносит 10 очков (main.js следит за kn уровня); прочее — addScore.
function addScore(n) { G.score += Math.max(0, Math.round(n)); }
const fmtScore = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const cam = { x: 0, y: 0, z: 40 };
// idle — палец отпущен: цели нет, тело плавно тормозит (мышь остаётся на месте и ведёт дальше)
const mouse = { x: 0, y: 0, has: false, down: false, idle: false };
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
  const [mx, my] = mouse.idle ? [o.x, o.y] : S2W(mouse.x, mouse.y);
  const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1e-9;
  const sp = maxSp * Math.min(1, d / (maxSp * .6));
  const k = Math.min(1, dt * resp);
  o.vx += (dx / d * sp - o.vx) * k; o.vy += (dy / d * sp - o.vy) * k;
}
function tryDash(o, power) {
  if (!G.started || P.dashCd > 0 || !mouse.has) return false;
  const [mx, my] = mouse.idle ? [o.x + o.vx, o.y + o.vy] : S2W(mouse.x, mouse.y); // палец отпущен — рывок по ходу
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
// Часы, ✦ и очки забега — сверху по центру, под ними цели «фишками» [текст, выполнено]
function hudClock(alpha, left, leftCol, pts, chips) {
  const x = G.W / 2, y = 24;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10,9,18,.55)'; ctx.beginPath(); ctx.roundRect(x - 140, y - 17, 280, 34, 10); ctx.fill();
  label(left, x - 88, y, 20, leftCol, 1, 700);
  label(`${pts} ✦`, x - 4, y, 20, [255, 215, 110], 1, 700);
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
function hudBanner(b, kicker, name, sub, alpha) {
  if (!G.started || b > 4.2) return;
  const a = smooth(0, .4, b) * (1 - smooth(3, 4.2, b)) * alpha, y = Math.max(G.H * .3, (G.T - (G.taskAt ?? -9) < .2 ? G.taskY : 0) + 62); // не на карточках задания
  label(kicker, G.W / 2, y - 36, 12, [255, 210, 122], .85 * a, 700);
  label(name, G.W / 2, y, 40, [255, 255, 255], a, 800);
  wrapText(sub, 15, 500, Math.min(640, G.W - 40)).forEach((l, k) => label(l, G.W / 2, y + 36 + k * 20, 15, [220, 225, 240], .8 * a, 500));
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
// Текст слева (или справа) и обрезка с «…» по ширине
function labelL(t, x, y, px, c, a = 1, weight = 600, align = 'left') {
  ctx.fillStyle = rgb(c, a); ctx.font = `${weight} ${px}px system-ui,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
}
function fitText(t, px, weight, maxW) {
  ctx.font = `${weight} ${px}px system-ui,sans-serif`;
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}
// Фишки в строку с переносом: [[текст, цвет фона, цвет текста, зачёркнуто]] → высота; draw=false — только мерить
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
// Задание — список карточек под часами. Шаг: {t: что сделать (коротко), h: как (мелко), items: [[метка, есть]],
// p: [сколько, из], s: коротко — вспыхивает «✓ s», d: сделано}. Видно: два последних выполненных (свёрнуты, ✓),
// текущий (раскрыт), следующий (свёрнут, тускло); в шапке — полоска шагов; испытания ★ — фишками под карточками.
// tk — состояние панели у этапа (сбрасывать на новой эпохе), after — текст, когда все шаги сделаны.
function hudTask(alpha, tk, kicker, steps, stars, after) {
  if (!G.started) return;
  const ds = steps.map(s => !!s.d), ss = stars.map(s => s.st);
  if (tk.ds) {
    const j = ds.findIndex((d, k) => d && !tk.ds[k]);
    if (j >= 0) { tk.fl = { txt: '✓ ' + steps[j].s, c: [140, 235, 170], at: G.T }; tk.doneAt = G.T; Sfx.play('goal'); }
    const w = ss.findIndex((v, k) => v === 1 && tk.ss[k] !== 1);
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
  const slim = (txt, bg, fg, fa) => {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x0, y, W, 26, 9); ctx.fill();
    labelL(fitText(txt, 12, 700, W - pad * 2), x0 + pad, y + 13.5, 12, fg, fa * a, 700);
    y += 31;
  };
  // выполненные — свёрнуты
  const doneIdx = ds.map((d, k) => d ? k : -1).filter(k => k >= 0 && (i < 0 || k < i));
  for (const k of doneIdx.slice(small ? -1 : -2)) if (!small || G.T - (tk.doneAt || -9) < 4) slim('✓  ' + steps[k].s, rgb([77, 232, 155], .16 * a), GREEN, .95);
  // текущий — раскрыт
  const iw = W - pad * 2 - 30, tx = x0 + pad + 30;
  const title = wrapText(cur ? cur.t : after || 'Задание выполнено', 16, 800, iw);
  let hint = cur && cur.h ? wrapText(cur.h, 13, 500, iw) : [];
  if (small && hint.length > 2) { hint = hint.slice(0, 2); hint[1] = hint[1].replace(/[\s,.;:—-]*\S*$/, '') + '…'; }
  const items = cur && cur.items ? cur.items.map(([t, d]) => [(d ? '✓ ' : '') + t, d ? [[77, 232, 155], .28] : [[255, 255, 255], .09], d ? [170, 245, 205] : [235, 235, 245]]) : [];
  const ih = chipRows(items, tx, 0, iw, 12, false, a);
  const hasP = cur && cur.p;
  const h = 12 + title.length * 21 + (hint.length ? 3 + hint.length * 17 : 0) + (ih ? 8 + ih : 0) + (hasP ? 16 : 0) + 10;
  ctx.fillStyle = rgb([14, 12, 26], .84 * a); ctx.beginPath(); ctx.roundRect(x0, y, W, h, 12); ctx.fill();
  ctx.strokeStyle = rgb(cur ? GOLD : GREEN, .35 * a); ctx.lineWidth = 1; ctx.stroke();
  // номер шага в кружке
  ctx.fillStyle = rgb(cur ? GOLD : [77, 232, 155], .95 * a); ctx.beginPath(); ctx.arc(x0 + pad + 11, y + 12 + 10.5, 11, 0, TAU); ctx.fill();
  label(cur ? String(i + 1) : '✓', x0 + pad + 11, y + 12 + 11, 13, [20, 16, 30], a, 800);
  let cy = y + 12 + 10.5;
  title.forEach(l => { labelL(l, tx, cy, 16, [255, 255, 255], a, 800); cy += 21; });
  cy -= 10.5;
  if (hint.length) { cy += 3; hint.forEach(l => { labelL(l, tx, cy + 8.5, 13, [200, 206, 228], .88 * a, 500); cy += 17; }); }
  if (ih) { cy += 8; chipRows(items, tx, cy, iw, 12, true, a); cy += ih; }
  if (hasP) {
    const [v, of] = cur.p, k = of > 0 ? Math.min(1, v / of) : 0, bw = iw - 46;
    ctx.fillStyle = rgb([255, 255, 255], .12 * a); ctx.beginPath(); ctx.roundRect(tx, cy + 7, bw, 5, 2.5); ctx.fill();
    if (k > 0) { ctx.fillStyle = rgb(GOLD, .95 * a); ctx.beginPath(); ctx.roundRect(tx, cy + 7, Math.max(5, bw * k), 5, 2.5); ctx.fill(); }
    labelL(`${v}/${of}`, tx + iw, cy + 9.5, 12, GOLD, .95 * a, 800, 'right');
  }
  y += h + 5;
  // следующий — свёрнут, тускло
  if (!small && cur && i + 1 < n && !ds[i + 1]) slim(`${i + 2}.  ${steps[i + 1].t}`, rgb([10, 9, 18], .5 * a), [215, 220, 235], .55);
  // испытания ★
  if (stars.length) {
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
  show(st) {
    const d = st.tally ? st.tally() : { name: st.name, rows: [] };
    const auto = d.auto && d.auto[1] > 0 ? clamp(d.auto[0] / d.auto[1], 0, 1) : null;
    addScore(LVL_BONUS); if (auto !== null) addScore(AUTO_BONUS * auto);
    const lvl = Math.round(G.score - (st.scoreAt || 0));
    let place = null;
    if (!st.cheated) place = LB.add('run.' + st.key, { n: LB.name(), s: lvl, t: Math.floor(st.clock ?? st.t ?? 0), d: Date.now() }).place;
    this.note(`УРОВЕНЬ ${G.stageI + 1} · ПРОЙДЕН`, d.name, [...d.rows, ['уровень пройден', '+' + LVL_BONUS, 'tb'],
      ...(auto !== null ? [['отдано Вселенной', '+' + Math.round(AUTO_BONUS * auto), 'tb']] : []),
      ['очки за уровень', fmtScore(lvl), 'tl'], ['всего', fmtScore(G.score), 'tt']], d.stars || [], place, '', auto);
  },
  // любая сводка сбоку: шапка, имя, строки [подпись, значение, класс], ★, место в таблице, сноска, доля Вселенной
  note(kick, name, rows, stars, place, foot, auto) {
    const row = ([k, v, c = 'tx']) => `<div class="${c}"><span>${k}</span><b>${v}</b></div>`;
    const el = document.getElementById('tally');
    el.innerHTML = `<div class="tk">${kick}</div><div class="tn">${name}</div>` +
      (auto != null ? `<div class="ta"><i style="width:${Math.round(auto * 100)}%"></i><span>Вселенная — ${Math.round(auto * 100)} %</span></div>` : '') +
      rows.map(row).join('') +
      (stars && stars.length ? `<div class="ts">${stars.map(s => `<em class="${s.st === 1 ? 'y' : 'n'}">${s.st === 1 ? '★' : '✗'} ${s.t}</em>`).join('')}</div>` : '') +
      (place === 0 ? '<div class="tr">🏆 рекорд</div>' : place != null ? `<div class="tr">#${place + 1} в таблице</div>` : '') +
      (foot ? `<div class="tf">${foot}</div>` : '');
    el.classList.add('on'); this.t = TALLY_T;
  },
  tick(dt) {
    if (this.t <= 0) return;
    const el = document.getElementById('tally');
    if ((this.t -= dt) <= 0) { el.classList.remove('on'); return; }
    // на узком экране — компактно под панелью задания (и под карточкой открытия, если она видна)
    if (G.W <= 700) {
      const cd = document.getElementById('card'), cv = +cd.style.opacity > 0 && !cd.classList.contains('side');
      el.style.top = Math.max(60, (G.taskY || 0) + 10 + (cv ? cd.offsetHeight + 8 : 0)) + 'px';
    } else el.style.top = '';
  },
};

let msgT = 0, lastMsg = '';
function msg(t, dur = 3.8) {
  const el = document.getElementById('msg');
  el.textContent = t; el.style.opacity = 1; msgT = dur; lastMsg = t;
  el.style.top = Math.max(G.H * .2, (G.taskY || 0) + 14) + 'px'; // под панелью задания, не поверх
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
