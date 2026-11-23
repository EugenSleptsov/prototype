"use strict";
/* Уровень частиц: эпохи 1–2. «Вселенная как коллайдер».
   Игрок — не частица, а ДЕТЕКТОР (круг вокруг курсора).
   - Клик = снимок: изучено всё, что сейчас в круге, и следы событий последних долей секунды.
   - Снимки дают ЗНАНИЯ ✦, за них прокачивается детектор (радиус, затвор, сжатие).
   - Сжатие (Пробел): всё рядом летит к центру и нагревается → лобовые столкновения.
   - Столкновение двух квантов рождает пару частица + античастица (E = mc²).
   - Открытое в забеге Вселенная дальше рождает сама — пока хватает температуры.
   Эпоха 1 (T > 160 ГэВ): всё безмассовое и летит со скоростью света.
   Эпоха 2: поле Хиггса застывает → массы. Пара рождается, только если √s ≥ 2m.
   Тяжёлые частицы быстро распадаются, Вселенная остывает — окна закрываются. */
const C_LIGHT = 3, WORLD_R = 12, T_START = 1000, N_QUANTA = 130, TRACK_T = .8;
// Прокачка детектора: значения по уровням и цена следующего уровня в знаниях ✦
const UPG = [
  { key: 'r', name: 'Радиус детектора', val: [.9, 1.25, 1.65, 2.1, 2.6], cost: [10, 30, 70, 140], fmt: v => v.toFixed(2) },
  { key: 'sh', name: 'Затвор (перезарядка снимка)', val: [1.2, .85, .6, .4], cost: [15, 40, 90], fmt: v => v.toFixed(2) + ' с' },
  { key: 'cmp', name: 'Сжатие (нагрев)', val: [1.25, 1.5, 1.8, 2.2], cost: [15, 45, 100], fmt: v => '×' + v },
];
const LEP_C = [[150, 205, 255], [120, 165, 255], [150, 120, 255]];
const BOS_C = { W: [255, 150, 70], Z: [255, 105, 115], H: [255, 215, 90], ph: [255, 240, 190] };
const NU_C = [175, 255, 205];
const FERMIONS = ['u', 'd', 'c', 's', 't', 'b', 'e', 'mu', 'ta', 'ne', 'nm', 'nt'];

// Волна вдоль направления движения: голова в (sx, sy), хвост сзади, к хвосту затухает.
// cols — один цвет или два (у глюона цвет и антицвет чередуются по полупериодам).
function waveLine(sx, sy, dx, dy, L, per, amp, phase, cols, a, lw) {
  const nx = -dy, ny = dx, steps = Math.max(8, Math.min(48, L / 2.5 | 0));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps * L, env = .3 + .7 * (1 - i / steps), arg = s / per * TAU + phase, w = Math.sin(arg) * amp * env;
    pts.push([sx - dx * s + nx * w, sy - dy * s + ny * w, Math.floor(arg / Math.PI) & 1]);
  }
  ctx.lineWidth = lw;
  for (let ci = 0; ci < cols.length; ci++) {
    // затухание к хвосту — одним градиентом на весь штрих
    const g = ctx.createLinearGradient(sx, sy, sx - dx * L, sy - dy * L);
    g.addColorStop(0, rgb(cols[ci], a)); g.addColorStop(1, rgb(cols[ci], 0));
    ctx.strokeStyle = g; ctx.beginPath();
    let pen = false;
    for (let i = 1; i < pts.length; i++) {
      const on = cols.length === 1 || pts[i][2] === ci;
      if (on) { if (!pen) ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); }
      pen = on;
    }
    ctx.stroke();
  }
}

const Particles = {
  key: 'particles', name: 'Частицы', bg: [44, 34, 14],
  controls: 'Мышь — вести детектор · Клик — снимок · Пробел — сжатие · 1–3 — улучшить детектор · Enter — ускорить остывание',

  enter() {
    this.p = []; this.t = 0; this.T = T_START; this.hig = 0; this.higT = -1; this.ff = 1;
    this.advanced = false; this.sawTop = false; this.msgCd = 0; this.said = {};
    this.kn = 0; this.lvl = { r: 0, sh: 0, cmp: 0 }; this.shotCd = 0; this.tracks = []; this.floats = []; this.seenN = {};
    this.bg = [44, 34, 14];
    Codex.run = new Set(); Codex.dirty = true;
    P.x = P.y = P.vx = P.vy = 0; P.dashCd = 0;
    for (let i = 0, n = this.nQ(); i < n; i++) this.spawnQuantum(true);
    setTimeout(() => G.started && this.hint('start', 'Ты — детектор. Наведи круг на кванты и кликни: снимок изучит всё, что внутри'), 600);
  },
  hint(k, t, dur) { if (this.said[k]) return; this.said[k] = true; msg(t, dur); },

  // ---------- создание ----------
  thermalP(T) { return T * -Math.log(Math.random() * Math.random() * Math.random() + 1e-12); },
  mk(sp, anti, x, y, a, p, col) {
    const s = SM[sp], o = { sp, anti, x, y, dx: Math.cos(a), dy: Math.sin(a), p, col: col ?? (Math.random() * 3 | 0),
      age: 0, life: s.life ? -s.life * Math.log(Math.random() + 1e-9) : Infinity, seen: 0, born: 0, cd: 0, dead: false };
    if (sp === 'g') o.col2 = (o.col + 1 + (Math.random() * 2 | 0)) % 3;
    if (sp === 'g' || sp === 'ph') { o.amp = rnd(.5, 1.5); o.ph = Math.random() * TAU; }
    this.p.push(o); return o;
  },
  up(k) { const u = UPG.find(x => x.key === k); return u.val[this.lvl[k]]; },
  hr() { return this.up('r'); },
  wr() { return Math.max(WORLD_R, viewRadius() + 1); },
  nQ() { return Math.round(N_QUANTA * (this.wr() / WORLD_R) ** 2); },
  randPos(outside) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, d = outside ? rnd(viewRadius() * .9, this.wr()) : Math.sqrt(Math.random()) * this.wr();
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if (Math.hypot(x - P.x, y - P.y) > this.hr() * 1.5) return [x, y];
    }
    return [P.x + this.wr() * .8, P.y];
  },
  spawnQuantum(any) {
    const [x, y] = this.randPos(!any);
    const o = this.mk(Math.random() < .62 ? 'g' : 'ph', false, x, y, Math.random() * TAU, this.thermalP(this.T));
    if (any) o.born = 1;
  },
  // пара частица + античастица разлетается из одной точки
  pair(sp, x, y, pEach, col) {
    const a = Math.random() * TAU, c = col ?? (Math.random() * 3 | 0);
    const A = this.mk(sp, false, x, y, a, pEach, c), B = this.mk(sp, true, x, y, a + Math.PI, pEach, c);
    A.cd = B.cd = .4; return [A, B];
  },
  meff(o) { return SM[o.sp].m * this.hig; },
  speed(o) { const m = this.meff(o); return m <= 0 ? C_LIGHT : C_LIGHT * o.p / Math.sqrt(o.p * o.p + m * m); },
  isQ(o) { return o.sp === 'ph' || o.sp === 'g'; },
  inHand(o) { return Math.hypot(o.x - P.x, o.y - P.y) < this.hr(); },
  // Больцмановский вес: сколько частиц этого сорта держит Вселенная при температуре T
  weight(sp) { const m = SM[sp].m * this.hig; return m <= 0 ? 1 : Math.exp(-m / this.T); },

  // ---------- действие игрока: сжатие ----------
  dash() {
    if (!G.started || P.dashCd > 0) return;
    P.dashCd = 1.1; this.focusT = .9;
    let n = 0;
    const R0 = this.hr() * 1.8, heat = this.up('cmp');
    for (const o of this.p) {
      const dx = P.x - o.x, dy = P.y - o.y, d = Math.hypot(dx, dy);
      if (d > R0 || d < .05) continue;
      const a = Math.atan2(dy, dx) + randn() * .12;
      o.dx = Math.cos(a); o.dy = Math.sin(a); o.p *= heat; o.cd = 0; n++;
    }
    fxRing(P.x, P.y, R0, [255, 230, 170], .2, .45);
    if (n > 1) this.hint('dash', 'Сжатие нагревает: кванты летят навстречу друг другу', 3);
  },

  // ---------- физика событий ----------
  sqrtS(a, b) {
    if (this.isQ(a) && this.isQ(b)) { const cos = a.dx * b.dx + a.dy * b.dy; return Math.sqrt(Math.max(0, 2 * a.p * b.p * (1 - cos))); }
    const ma = this.meff(a), mb = this.meff(b), Ea = Math.hypot(a.p, ma), Eb = Math.hypot(b.p, mb);
    const px = a.dx * a.p + b.dx * b.p, py = a.dy * a.p + b.dy * b.p;
    return Math.sqrt(Math.max(0, (Ea + Eb) ** 2 - px * px - py * py));
  },
  // Какие пары может родить столкновение двух квантов (веса ~ квадрат заряда × число цветов)
  channels(a, b, rs) {
    const ch = [], post = this.hig > .5, kinds = [a.sp, b.sp].sort().join('');
    const ok = sp => rs >= 2 * SM[sp].m * this.hig;
    for (const sp of ['u', 'c', 't', 'd', 's', 'b', 'e', 'mu', 'ta']) {
      const s = SM[sp], quark = s.kind === 'quark';
      if (!ok(sp)) continue;
      let w = 0;
      if (kinds === 'phph') w = s.q * s.q * (quark ? 3 : 1);
      else if (kinds === 'gph') w = quark ? s.q * s.q * 3 : 0;
      else if (kinds === 'gg') w = quark ? 1 : 0;
      if (w > 0) ch.push([sp, w]);
    }
    if (post && kinds === 'phph' && rs >= 2 * SM.W.m) ch.push(['WW', 1.5]);
    if (post && kinds === 'gg' && Math.abs(rs - SM.H.m) < 15) ch.push(['H', 10]);
    return ch;
  },
  pickW(ch) { let s = 0; for (const c of ch) s += c[1]; let r = Math.random() * s; for (const c of ch) if ((r -= c[1]) <= 0) return c[0]; return ch[ch.length - 1][0]; },
  collide(a, b) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.cd = b.cd = .5;
    const ch = this.channels(a, b, rs);
    if (!ch.length) {
      if (this.hig > .5) this.hint('low', `Не хватает энергии: √s = ${fmtGeV(rs)}. Сожми область — сжатие нагревает`, 3.5);
      const t = a.dx; a.dx = b.dx; b.dx = t; const u = a.dy; a.dy = b.dy; b.dy = u; return;
    }
    const c = this.pickW(ch);
    a.dead = b.dead = true;
    let made;
    if (c === 'H') { made = [this.mk('H', false, x, y, Math.random() * TAU, rs * .05)]; }
    else if (c === 'WW') { const pe = Math.sqrt(Math.max(.01, (rs / 2) ** 2 - SM.W.m ** 2)); made = this.pair('W', x, y, pe); }
    else { const m = SM[c].m * this.hig, pe = Math.sqrt(Math.max(.0001, (rs / 2) ** 2 - m * m)); made = this.pair(c, x, y, pe, a.sp === 'g' ? a.col : undefined); }
    fxFlash(x, y, .7, [255, 250, 220], .35);
    this.event(made, x, y);
  },
  // Аннигиляция частицы и своей античастицы → кванты (или Z на резонансе)
  annihilate(a, b) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    let made;
    if (this.hig > .5 && Math.abs(rs - SM.Z.m) < 14 && SM[a.sp].kind !== 'nu') made = [this.mk('Z', false, x, y, Math.random() * TAU, rs * .05)];
    else {
      const q = SM[a.sp].kind === 'quark' ? 'g' : 'ph', an = Math.random() * TAU;
      made = [this.mk(q, false, x, y, an, rs / 2), this.mk(q, false, x, y, an + Math.PI, rs / 2)];
      for (const m of made) m.cd = .5;
    }
    fxFlash(x, y, .9, [255, 255, 255], .4);
    this.event(made, x, y);
    this.hint('ann', 'Аннигиляция: частица и античастица снова стали энергией', 3);
  },
  // Распады — только когда у частиц есть масса (после перехода Хиггса)
  decayProducts(o) {
    const sp = o.sp, a = o.anti;
    const L = (s, an) => [s, an];
    switch (sp) {
      case 't': return [L('b', a), L('W', a)];
      case 'b': return [L('c', a), L('e', a), L('ne', !a)];
      case 'c': return [L('s', a), L('e', !a), L('ne', a)];
      case 's': return [L('u', a), L('e', a), L('ne', !a)];
      case 'ta': return [L('mu', a), L('nm', !a), L('nt', a)];
      case 'mu': return [L('e', a), L('ne', !a), L('nm', a)];
      case 'W': { // W⁺ (anti=false) → ℓ⁺ ν или u d̄ / c s̄
        const r = Math.random();
        if (r < .5) { const l = pick(['e', 'mu', 'ta']); return [L(l, !a), L(NU_OF[l], a)]; }
        return r < .75 ? [L('u', a), L('d', !a)] : [L('c', a), L('s', !a)];
      }
      case 'Z': { const f = pick(['e', 'mu', 'ta', 'ne', 'nm', 'nt', 'u', 'd', 'c', 's', 'b']); return [L(f, false), L(f, true)]; }
      case 'H': { const r = Math.random(); const f = r < .58 ? 'b' : r < .7 ? 'ta' : r < .8 ? 'c' : null;
        return f ? [L(f, false), L(f, true)] : r < .9 ? [L('ph', false), L('ph', false)] : [L('g', false), L('g', false)]; }
    }
    return null;
  },
  decay(o) {
    const pr = this.decayProducts(o); if (!pr) return;
    o.dead = true;
    const m = this.meff(o), E = Math.hypot(o.p, m), base = Math.atan2(o.dy, o.dx), n = pr.length;
    const c0 = Math.random() * 3 | 0, made = [];
    pr.forEach(([sp, an], i) => {
      const a = n === 2 && o.p < m ? base + (i ? Math.PI : 0) + randn() * .3 : base + rnd(-1.3, 1.3);
      const q = this.mk(sp, an, o.x, o.y, a, Math.max(.05, E / n * rnd(.7, 1.3)), SM[sp].kind === 'quark' ? c0 : undefined);
      q.cd = .4; made.push(q);
    });
    fxRing(o.x, o.y, .2, this.color(o), 1.1, .5);
    this.event(made, o.x, o.y, o);
  },
  // Событие оставляет СЛЕД: доли секунды его можно заснять (как треки в настоящем детекторе)
  event(made, x, y, parent) {
    const sps = made.map(m => m.sp); if (parent) sps.push(parent.sp);
    this.tracks.push({ x, y, t: this.t, sps, cols: made.map(m => this.color(m)) });
    if (parent && SM[parent.sp].life < 1 && Math.hypot(x - P.x, y - P.y) < this.hr() * 2)
      this.hint('fast', `${SM[parent.sp].name} распался за миг — сними след, пока не погас`, 3.5);
  },

  // ---------- действие игрока: снимок ----------
  value(sp) { const m = SM[sp].m; return m > 0 ? 1 + Math.round(Math.log10(1 + m / .001) / 2) : 1; },
  snapshot() {
    if (!G.started || this.shotCd > 0) return;
    this.shotCd = this.up('sh');
    const R0 = this.hr(), got = new Set();
    for (const o of this.p) if (!o.dead && this.inHand(o)) {
      got.add(o.sp);
      if (o.sp === 't' && this.hig > .5 && !this.sawTop) { this.sawTop = true; msg('t-кварк с массой 173 ГэВ — тяжелее атома золота', 3.5); }
    }
    for (const tr of this.tracks) if (this.t - tr.t < TRACK_T && Math.hypot(tr.x - P.x, tr.y - P.y) < R0) for (const sp of tr.sps) got.add(sp);
    fxRing(P.x, P.y, R0, [255, 255, 255], R0 * .6, .3);
    if (!got.size) { this.hint('empty', 'Пустой снимок. Лови момент, когда в круге что-то есть', 2.5); return; }
    let gain = 0, fresh = 0;
    for (const sp of got) {
      if (!Codex.has(sp)) { Codex.see(sp); gain += 10; fresh++; continue; }
      if (sp === 'ph' || sp === 'g') continue;
      // повторные измерения тоже дают знания, но всё меньше: статистика насыщается
      const n = this.seenN[sp] = (this.seenN[sp] || 0) + 1;
      gain += this.value(sp) * Math.max(.05, 1 / (1 + n / 3));
    }
    gain = Math.round(gain * 10) / 10;
    this.kn += gain;
    if (gain > 0) this.floats.push({ x: P.x, y: P.y - R0, t: 0, txt: `+${gain} ✦` });
    if (fresh) fxRing(P.x, P.y, R0, [255, 255, 255], R0 * 1.4, .6);
    if (this.kn >= 10) this.hint('upg', 'Знаний ✦ хватает на улучшение детектора — клавиши 1–3 или кнопки справа внизу', 4);
    if (Codex.run.size >= 3) this.hint('dash2', 'Пробел — сжатие: кванты летят навстречу и рождают пары частица + античастица', 4);
  },
  buy(i) {
    const u = UPG[i]; if (!u) return;
    const l = this.lvl[u.key], c = u.cost[l];
    if (c === undefined) { msg(`${u.name}: максимум`, 1.5); return; }
    if (this.kn < c) { msg(`${u.name}: нужно ${c} ✦`, 1.5); return; }
    this.kn -= c; this.lvl[u.key]++;
    msg(`${u.name}: ${u.fmt(u.val[l])} → ${u.fmt(u.val[l + 1])}`, 2);
    fxRing(P.x, P.y, this.hr(), [140, 220, 255], this.hr() * 1.5, .6);
  },
  renderUpg(el) {
    el.style.display = 'block';
    const key = this.kn.toFixed(1) + JSON.stringify(this.lvl);
    if (el.dataset.k === key) return; el.dataset.k = key;
    el.innerHTML = `<b>Знания ✦ ${this.kn.toFixed(1)}</b>` + UPG.map((u, i) => {
      const l = this.lvl[u.key], c = u.cost[l];
      return `<button data-i="${i}" ${c === undefined || this.kn < c ? 'disabled' : ''}><span class="k">${i + 1}</span> ${u.name}<br>` +
        `<small>${u.fmt(u.val[l])}${c === undefined ? ' · максимум' : ` → ${u.fmt(u.val[l + 1])} · ${c} ✦`}</small></button>`;
    }).join('');
    el.querySelectorAll('button').forEach(b => b.onclick = () => this.buy(+b.dataset.i));
  },

  // ---------- Вселенная сама рождает то, что уже открыто ----------
  populate(dt) {
    const cnt = {};
    for (const o of this.p) if (!o.dead) cnt[o.sp] = (cnt[o.sp] || 0) + 1;
    if ((cnt.ph || 0) + (cnt.g || 0) < this.nQ() && Math.random() < dt * 40) this.spawnQuantum(false);
    for (const sp of [...FERMIONS, 'W', 'Z', 'H']) {
      if (!Codex.has(sp)) continue;
      const s = SM[sp], base = s.kind === 'nu' ? 2 : s.kind === 'boson' ? 2 : 2.5, target = base * this.weight(sp);
      const have = cnt[sp] || 0;
      if (have < target - .5 && Math.random() < dt * 1.5) {
        const [x, y] = this.randPos(true), pp = this.thermalP(this.T);
        if (s.kind === 'boson' && sp !== 'W') this.mk(sp, false, x, y, Math.random() * TAU, pp);
        else this.pair(sp, x, y, pp);
      } else if (have > target * 1.5 + 1) {
        // лишние аннигилируют где-то вдали (за краем экрана)
        let extra = have - Math.ceil(target * 1.5 + 1);
        for (const o of this.p) {
          if (extra <= 0) break;
          if (o.sp === sp && !o.dead && !onScreen(...W2S(o.x, o.y), 30)) { o.dead = true; extra--; }
        }
      }
    }
  },

  update(dt, act) {
    const prevT = this.T;
    if (act) {
      this.t += dt;
      const tau = this.higT < 0 ? 21.8 : 12;
      this.T = this.T * Math.exp(-dt * this.ff / tau);
      if (this.higT < 0 && this.T <= UNIVERSE.T_EW) this.higgsOn();
    }
    if (this.higT >= 0) { this.higT += dt; this.hig = smooth(0, 4, this.higT); }
    this.bg = mixc([44, 34, 14], [16, 12, 30], this.hig);
    const red = this.T / prevT; // расширение: импульсы краснеют вместе с температурой
    this.focusT = (this.focusT || 0) - dt;
    if (act) {
      steer(P, 11, 6, dt);
      P.x += P.vx * dt; P.y += P.vy * dt;
      if (mouse.clicked) { mouse.clicked = false; this.snapshot(); }
      this.shotCd -= dt;
      for (const f of this.floats) f.t += dt;
      this.floats = this.floats.filter(f => f.t < 1.2);
      this.tracks = this.tracks.filter(tr => this.t - tr.t < TRACK_T);
    }
    const WR = this.wr();
    for (const o of this.p) {
      if (o.dead) continue;
      o.p *= red; o.born = Math.min(1, o.born + dt * 2); o.cd -= dt;
      const v = this.speed(o);
      o.x += o.dx * v * dt; o.y += o.dy * v * dt;
      if (this.hig > .5 && o.life < Infinity) { o.age += dt; if (o.age > o.life) { this.decay(o); continue; } }
      if (!act) continue;
      const ox = o.x - P.x, oy = o.y - P.y, d = Math.hypot(ox, oy);
      if (d > WR) { o.x = P.x - ox * .95; o.y = P.y - oy * .95; o.born = 0; }
    }
    if (act) {
      // столкновения и аннигиляции — внутри детектора
      const h = this.p.filter(o => !o.dead && o.cd <= 0 && this.inHand(o));
      for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) {
        const a = h[i], b = h[j]; if (a.dead || b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        // после сжатия в центре фокус: всё, что туда влетело, сталкивается
        const FR = .3 + .3 * this.hr();
        const focus = this.focusT > 0 && Math.hypot(a.x - P.x, a.y - P.y) < FR && Math.hypot(b.x - P.x, b.y - P.y) < FR;
        if (!focus && dx * dx + dy * dy > .16) continue;
        const va = this.speed(a), vb = this.speed(b);
        if ((b.dx * vb - a.dx * va) * dx + (b.dy * vb - a.dy * va) * dy >= 0) continue; // разлетаются
        if (this.isQ(a) && this.isQ(b)) { if (Math.random() < (focus ? .4 : .75)) this.collide(a, b); else a.cd = b.cd = .3; }
        else if (a.sp === b.sp && a.anti !== b.anti && SM[a.sp].kind !== 'nu' && SM[a.sp].kind !== 'boson') this.annihilate(a, b);
      }
      this.populate(dt);
      this.checkGoals();
      if (!this.advanced && this.T < .4) {
        this.advanced = true;
        msg(`Открыто ${Codex.run.size} из 17. Температура упала до ${fmtGeV(this.T)} — кварки начинают запираться`, 5);
        advance();
      }
    }
    this.p = this.p.filter(o => !o.dead);
    if (this.p.length > 260) this.p.splice(0, this.p.length - 260);
  },
  higgsOn() {
    this.higT = 0;
    msg('Поле Хиггса застыло! У частиц появилась масса — тяжёлые замедляются и начинают распадаться', 6);
    fxRing(P.x, P.y, .5, [255, 215, 90], this.wr() * 1.4, 3.5);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * TAU, d = rnd(2.5, 6.5);
      const h = this.mk('H', false, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, Math.random() * TAU, rnd(20, 60));
      h.life = rnd(4, 9);
    }
    setTimeout(() => this.hint('higgs', 'Рядом всплески поля — бозоны Хиггса. Сними один, пока не распался', 5), 6500);
  },
  goals() {
    const n = Codex.run.size;
    if (this.higT < 0) return [[`Открой 6 частиц (${Math.min(n, 6)}/6)`, n >= 6]];
    return [
      ['Сними бозон Хиггса', Codex.has('H')],
      ['Найди переносчик слабой силы: W или Z', Codex.has('W') || Codex.has('Z')],
      ['Сними нейтрино (рождается в распадах)', Codex.has('ne') || Codex.has('nm') || Codex.has('nt')],
      ['Успей снять t-кварк с массой', this.sawTop],
    ];
  },
  checkGoals() {
    if (this.higT < 0 && Codex.run.size >= 6) this.hint('g1', 'Отлично! Вселенная остывает к электрослабому переходу. Enter — ускорить', 4);
    if (this.higT >= 0 && this.goals().every(g => g[1])) this.hint('g2', 'Все цели эпохи выполнены. Enter — ускорить остывание', 4);
  },
  enterKey() { this.ff = this.ff > 1 ? 1 : 4; msg(this.ff > 1 ? 'Время ускорено ×4' : 'Обычный ход времени', 1.5); },
  cheat() {
    for (const k of Object.keys(SM)) Codex.see(k);
    this.kn += 200;
    this.sawTop = true;
    if (this.higT < 0) { this.T = UNIVERSE.T_EW + 1; } else this.T = .45;
  },

  // ---------- рисование ----------
  color(o) {
    const s = SM[o.sp];
    if (o.sp === 'g') return QCOL[o.col];
    if (s.kind === 'quark') return o.anti ? QANTI[o.col] : QCOL[o.col];
    if (s.kind === 'lepton') return LEP_C[s.gen - 1];
    if (s.kind === 'nu') return NU_C;
    return BOS_C[o.sp];
  },
  lab(o) {
    const s = SM[o.sp];
    if (s.kind === 'quark') return o.anti ? s.sym + '̅' : s.sym;
    if (s.kind === 'lepton') return s.sym + (o.anti ? '⁺' : '⁻');
    if (s.kind === 'nu') return o.anti ? 'ν̄' + s.sym.slice(1) : s.sym;
    if (o.sp === 'W') return o.anti ? 'W⁻' : 'W⁺';
    return s.sym;
  },
  rad(o) { const m = SM[o.sp].m; return .13 + (.11 + .055 * Math.log10(1 + m / .001) - .13) * this.hig * (m > 0 ? 1 : 0); },
  draw(alpha) {
    const z = cam.z;
    ctx.lineCap = 'round';
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 40)) continue;
      const a = alpha * o.born, c = this.color(o);
      if (this.isQ(o)) {
        // Квант — волна: чем выше энергия, тем короче период (λ ~ 1/E)
        const hot = clamp(o.p / (this.T * 6), 0, 1), L = 1.1 * z;
        const per = clamp(.42 * z * this.T * 1.5 / Math.max(o.p, 1e-9), 4, .5 * z);
        const amp = o.amp * clamp(.09 * z, 2.5, 6);
        const phase = o.ph - G.T * 9;
        if (o.sp === 'ph') {
          const cc = mixc([255, 200, 120], [220, 235, 255], hot);
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [cc], .7 * a, 1.6);
          glow(sx, sy, 4 + 5 * hot, cc, .45 * a);
        } else {
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [c, QCOL[o.col2]], .75 * a, 1.6);
          glow(sx, sy, 3 + 4 * hot, c, .4 * a);
        }
        continue;
      }
      const s = SM[o.sp], r = this.rad(o) * z;
      ctx.globalAlpha = a;
      if (s.kind === 'nu') {
        ring(sx, sy, r, c, .55, 1.2, [3, 3]);
      } else {
        if (o.sp === 'H') glow(sx, sy, r * (3 + Math.sin(G.T * 8) * .6), c, .45);
        else if (s.kind === 'boson') glow(sx, sy, r * 2.6, c, .35);
        if (o.anti && s.kind !== 'boson') { glow(sx, sy, r * 1.8, c, .2); ring(sx, sy, r * .8, c, .95, Math.max(1.5, r * .35)); }
        else { glow(sx, sy, r * 1.8, c, .22); ball(sx, sy, r, c); }
        // массивные нестабильные «дрожат» к концу жизни
        if (o.life < Infinity && this.hig > .5) ring(sx, sy, r * 1.35, c, .5 * clamp(o.age / o.life, 0, 1), 1, [2, 3]);
      }
      if (z > 20) label(this.lab(o), sx, sy + r + 7, 10, [255, 255, 255], .75, 500);
      ctx.globalAlpha = 1;
    }
  },
  drawPlayer(alpha) {
    const [sx, sy] = W2S(P.x, P.y), r = this.hr() * cam.z;
    ctx.globalAlpha = alpha;
    // следы событий: гаснущие лучи к осколкам
    for (const tr of this.tracks) {
      const k = 1 - (this.t - tr.t) / TRACK_T, [tx, ty] = W2S(tr.x, tr.y);
      tr.cols.forEach((c, i) => {
        const a = i * TAU / tr.cols.length + tr.t * 7, L = (8 + 18 * (1 - k));
        line(tx, ty, tx + Math.cos(a) * L, ty + Math.sin(a) * L, c, .8 * k, 1.5);
      });
      ring(tx, ty, 4, [255, 255, 255], .7 * k, 1);
    }
    const ready = this.shotCd <= 0;
    glow(sx, sy, r, [255, 255, 255], ready ? .05 : .02);
    ring(sx, sy, r, [255, 255, 255], ready ? .75 : .35, 1.5, [6, 6]);
    // затвор
    const ks = clamp(1 - this.shotCd / this.up('sh'), 0, 1);
    ctx.strokeStyle = rgb([200, 235, 255], .85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * ks); ctx.stroke();
    // сжатие
    const k = clamp(1 - P.dashCd / 1.1, 0, 1);
    ctx.strokeStyle = rgb([255, 230, 170], .6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, r + 9, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    label('детектор', sx, sy - r - 18, 11, [255, 255, 255], .45, 500);
    for (const f of this.floats) { const [fx, fy] = W2S(f.x, f.y); label(f.txt, fx, fy - 20 - f.t * 30, 14, [140, 220, 255], 1 - f.t / 1.2, 700); }
    ctx.globalAlpha = 1;
  },
  viewR() { return 3.5 + this.hr() * 1.9; },
  hud() {
    const T = this.T, tsec = .24 * (.001 / T) ** 2;
    const open = [...FERMIONS, 'W', 'Z', 'H'].filter(sp => Codex.has(sp) && this.weight(sp) > .02).map(sp => SM[sp].sym);
    const nm = this.p.filter(o => !o.dead && !this.isQ(o) && SM[o.sp].kind !== 'boson' && !o.anti).length;
    const na = this.p.filter(o => !o.dead && !this.isQ(o) && SM[o.sp].kind !== 'boson' && o.anti).length;
    const title = this.higT < 0 ? 'Чистая энергия' : this.hig < 1 ? 'Поле Хиггса застывает' : 'Электрослабая эпоха позади';
    const goal = this.higT < 0
      ? 'Ты — <b>детектор</b>. <b>Клик</b> — снимок: изучено всё, что в круге, и свежие следы событий. Снимки дают <b>знания ✦</b> — на них растёт детектор. <b>Сжатие</b> (Пробел) бросает кванты навстречу: столкновение рождает пару <b>частица + античастица</b>. Фотоны рождают заряженные пары, глюоны — кварки. Открытое Вселенная дальше рождает сама.'
      : 'У частиц есть масса: пара рождается, только если энергии столкновения хватает на <b>2mc²</b>. Тяжёлые живут миг — снимай их <b>распады</b>: след держится доли секунды. Вселенная остывает, и окна закрываются: тяжёлое перестаёт рождаться.';
    return {
      title, sub: `t ≈ ${fmtSci(tsec)} с · T ≈ ${fmtGeV(T)} (${fmtSci(gevToK(T))} K)${this.ff > 1 ? ' · ×4' : ''}`,
      lines: [
        ['Открыто', `${Codex.run.size} / 17`],
        ['Знания', `${this.kn.toFixed(1)} ✦`],
        ['Рождается само', open.length ? open.join(' ') : '— ничего, кроме квантов'],
        ['Материя : анти', `${nm} : ${na}`],
        ['Снимок · сжатие', `${this.shotCd > 0 ? 'затвор…' : 'готов'} · ${P.dashCd > 0 ? 'заряжается…' : 'готово'}`],
      ],
      goal: goal + '<br>' + this.goals().map(([t, d]) => `${d ? '✓' : '○'} ${t}`).join('<br>'),
      laws: [['Рождение пар (E = mc²)', 1], ['Электрослабая симметрия', 1 - this.hig], ['Слабые распады', this.hig], ['Остывание', 1 - Math.log(T / .4) / Math.log(T_START / .4)]],
    };
  },
};
