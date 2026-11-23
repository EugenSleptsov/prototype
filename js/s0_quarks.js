"use strict";
/* Уровень 2. Адроны: из кварк-глюонной плазмы — протоны и нейтроны.
   Материал — ровно те кварки, что ты сберёг в эпохе аннигиляции: они вылетают из детектора,
   новых из ниоткуда не появляется (кроме пар от порванной струны — это E = mc²).
   Физика:
   - Пока плазма горячая (T > ~180 МэВ), кварки свободны и не слипаются.
   - Остыла — конфайнмент: кварки связываются струнами в бесцветные состояния.
   - Барион = три разных цвета. uud — протон, udd — нейтрон; uuu/ddd — Δ, тут же распадается.
   - Струна рвётся при сильном растяжении, рождая пару кварк–антикварк; кварк + антикварк = мезон, он нестабилен.
   Глагол игрока — то же поле, что на уровне частиц: зажать — собрать кварки, три разных цвета слипаются. */
const QCOL = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
const QANTI = [[60, 230, 240], [240, 90, 240], [250, 225, 70]]; // анти-красный = голубой и т.д.
const QR = .26, BIND = .62, D0 = .55, KSTR = 9, DBREAK = 2.6;
const Q_PAR = 60, Q_WR = 7.5, Q_T0 = 4.6; // эталон времени, радиус области, стартовая T (10¹² K ≈ 400 МэВ)

const Quarks = {
  key: 'quarks', name: 'Адроны', bg: [34, 6, 26], controls: '',

  enter(prev) {
    this.q = []; this.groups = new Map(); this.gid = 1; this.t = 0;
    this.temp = Q_T0; this.conf = 0; this.advanced = false; this.res = null; this.cheated = false;
    this.focus = null; this.holding = false; this.hold = 0; this.learn = {}; this.floats = [];
    this.kn = 0; this.clock = 0; this.doneAt = null; this.endCd = -1; this.banner = -1.5; this.made = { p: 0, n: 0 }; this.mine = 0;
    this.hr = prev && prev.hr ? prev.hr() : 1.4;
    const src = prev && prev.handoff || [];
    // сбережённые кварки вырываются из детектора там же, где кружили, оставляя треки, и растут до размера кварка
    const sz0 = clamp(4.5 / (QR * cam.z), .08, 1);
    for (const h of src) { const q = this.mk(h.x, h.y, h.col, false, h.fl); q.vx = h.vx; q.vy = h.vy; q.age = 1; q.sz = sz0; q.tr = [[h.x, h.y]]; q.mine = 1; }
    this.nSaved = src.length;
    if (!src.length) { P.x = P.y = P.vx = P.vy = 0; }
    this.C = { x: P.x, y: P.y };
    // материал — только сбережённое; при запуске прямо с этого уровня кварки прилетают из-за края
    for (let i = this.q.length; i < (src.length ? 0 : 12); i++) {
      const a = Math.random() * TAU, d = Q_WR * .9, q = this.mk(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, i % 3, false, i % 3 === 1 ? 'd' : 'u');
      q.vx = -Math.cos(a) * 2.5; q.vy = -Math.sin(a) * 2.5; q.age = 0;
    }
  },
  mk(x, y, col, anti, fl) {
    const q = { x, y, vx: 0, vy: 0, col, anti, fl, g: 0, nb: 0, dead: false, age: 0, sz: 1, cap: false, hand: 0 };
    this.q.push(q); return q;
  },
  float(x, y, txt, c = [140, 220, 255], sz = 14) { this.floats.push({ x, y, t: 0, txt, c, sz }); },
  fr() { return this.hr * 1.5; },
  members(q) { return q.g ? this.groups.get(q.g).m : [q]; },
  // Может ли набор кварков стать (частью) бесцветного состояния?
  valid(arr) {
    if (arr.length > 3) return false;
    if (arr.every(m => m.anti === arr[0].anti)) return new Set(arr.map(m => m.col)).size === arr.length;
    return arr.length === 2 && arr[0].col === arr[1].col; // мезон: цвет + свой антицвет
  },
  join(a, b) {
    if (a.g && a.g === b.g) return;
    const all = [...this.members(a), ...this.members(b)];
    if (!this.valid(all)) return;
    if (a.g) this.groups.delete(a.g);
    if (b.g) this.groups.delete(b.g);
    const id = this.gid++, grp = { id, m: all, kind: 'forming', t: 0 };
    for (const m of all) m.g = id;
    this.groups.set(id, grp); this.classify(grp);
    fxFlash((a.x + b.x) / 2, (a.y + b.y) / 2, .6, [255, 255, 255], .3);
    if (grp.kind === 'p' || grp.kind === 'n') this.onBaryon(grp);
    return grp;
  },
  classify(grp) {
    const m = grp.m;
    if (m.length === 2 && m[0].anti !== m[1].anti) { grp.kind = 'meson'; grp.t = 2.2; }
    else if (m.length === 3) {
      const u = m.filter(x => x.fl === 'u').length;
      grp.kind = u === 2 ? 'p' : u === 1 ? 'n' : 'delta';
      if (grp.kind === 'delta') grp.t = 1.4;
      if (m[0].anti) grp.kind = 'anti';
    } else grp.kind = 'forming';
  },
  // Барион собран: своими руками (полем) — дороже, сам слипся — дешевле
  onBaryon(grp) {
    const c = centroid(grp.m), hand = grp.m.some(x => x.cap || x.hand > 0);
    const pts = hand ? 10 : 4;
    this.kn += pts; this.made[grp.kind]++;
    if (!this.mine && hand) this.mine = grp.id;
    for (const x of grp.m) { x.cap = false; x.hand = 0; }
    fxRing(c.x, c.y, .4, [255, 255, 255], 2.5, .9);
    this.float(c.x, c.y, `${grp.kind === 'p' ? 'p⁺' : 'n⁰'} ✓ +${pts}`, hand ? [255, 215, 110] : [200, 220, 240], hand ? 16 : 13);
    if (hand) this.learn.bar = true;
  },
  detach(q) {
    if (!q.g) return;
    const grp = this.groups.get(q.g);
    grp.m = grp.m.filter(x => x !== q); q.g = 0; q.nb = .8;
    if (grp.m.length <= 1) { for (const x of grp.m) x.g = 0; this.groups.delete(grp.id); }
    else this.classify(grp);
  },
  // Струна порвалась: энергия натяжения → новая пара кварк–антикварк (E = mc²).
  snap(grp, a, b) {
    const far = Math.hypot(a.x - P.x, a.y - P.y) > Math.hypot(b.x - P.x, b.y - P.y) ? a : b;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    this.detach(far);
    const col = Math.random() * 3 | 0, fl = Math.random() < .5 ? 'u' : 'd';
    const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    const q1 = this.mk(mx + nx / nl * .35, my + ny / nl * .35, col, false, fl);
    const q2 = this.mk(mx - nx / nl * .35, my - ny / nl * .35, col, true, fl);
    q1.vx = nx / nl * 2; q1.vy = ny / nl * 2; q2.vx = -q1.vx; q2.vy = -q1.vy; q1.nb = q2.nb = .7; q1.age = q2.age = 1;
    fxFlash(mx, my, 1, [255, 240, 200], .5);
    this.float(mx, my, 'струна → q q̄', [255, 200, 150], 12);
  },

  // ---------- поле игрока ----------
  input(dt) {
    if (mouse.clicked) { mouse.clicked = false; this.holding = true; this.hold = 0; }
    if (this.holding && !mouse.down) { this.holding = false; this.release(); }
    if (this.holding) { this.hold += dt; if (this.hold > .12 && !this.focus) this.focus = { cap: [], ang: Math.random() * TAU, t: 0, tog: 0 }; }
  },
  // кого поле может взять: кварк вещества (одиночку или недособранную пару целиком), чьих цветов в поле ещё нет
  // (пару, которая не помещается, поле разнимает и берёт один кварк)
  capSet(o, cap) {
    if (o.dead || o.cap || o.anti || o.age < .4 || o.nb > 0 || cap.length >= 3) return null;
    // три разных цвета; и не три одинаковых аромата (uuu/ddd — Δ, сразу распадётся)
    const fits = s => {
      const all = [...cap, ...s];
      return all.length <= 3 && new Set(all.map(x => x.col)).size === all.length && !(all.length === 3 && all.every(x => x.fl === all[0].fl));
    };
    if (!o.g) return fits([o]) ? [o] : null;
    const g = this.groups.get(o.g);
    if (g.kind !== 'forming' || g.m.some(x => x.anti)) return null;
    return fits(g.m) ? g.m : fits([o]) ? [o] : null;
  },
  canCap(o, cap) { return !!this.capSet(o, cap); },
  tickFocus(dt) {
    const f = this.focus; if (!f) return;
    f.t += dt; f.cap = f.cap.filter(o => !o.dead && o.cap);
    if (f.cap.length < 3) {
      let best = null, bd = this.fr();
      for (const o of this.q) {
        if (!this.canCap(o, f.cap)) continue;
        const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; best = o; }
      }
      if (best) {
        const set = this.capSet(best, f.cap);
        for (const x of set) { if (set.length === 1 && x.g) this.detach(x); x.cap = true; f.cap.push(x); }
        if (f.cap.length >= 2) this.learn.hold = true;
      }
    }
    f.ang += dt * 1.6;
    // захваченные собираются треугольником у центра детектора; в горячей плазме их трясёт
    const n = f.cap.length, ro = n === 1 ? 0 : .34, hot = 1 - this.conf, pv = Math.hypot(P.vx, P.vy);
    f.cap.forEach((o, k) => {
      const a = f.ang + k * TAU / Math.max(n, 1);
      const tx = P.x + Math.cos(a) * ro + randn() * .12 * hot, ty = P.y + Math.sin(a) * ro + randn() * .12 * hot;
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), step = (3 + pv) * dt;
      if (d > step) { o.x += dx / d * step; o.y += dy / d * step; } else { o.x = tx; o.y = ty; }
      o.vx = P.vx; o.vy = P.vy;
    });
    // три разных цвета вместе и плазма остыла — слипаются
    if (n === 3) {
      const close = f.cap.every(o => Math.hypot(o.x - P.x, o.y - P.y) < ro + .2);
      f.tog = close ? f.tog + dt : 0;
      if (this.conf > .5 && f.tog > .35) {
        const [a, b, c] = f.cap;
        this.join(a, b); this.join(a, c); this.join(b, c);
        f.cap.forEach(o => { o.cap = false; o.hand = 2; });
        f.cap = [];
      }
    }
  },
  release() {
    const f = this.focus; this.focus = null; if (!f) return;
    for (const o of f.cap) { o.cap = false; o.hand = 2; o.vx = P.vx + randn() * .3; o.vy = P.vy + randn() * .3; }
  },

  // ---------- физика ----------
  forces(dt) {
    const q = this.q, c = this.conf;
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      for (let j = i + 1; j < q.length; j++) {
        const b = q[j];
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 > 4) continue;
        const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
        // одинаковый цвет — отталкивание (в бесцветную комбинацию не сложатся)
        if (a.col === b.col && a.anti === b.anti && d < .9) {
          const f = 5 * (.9 - d) * dt;
          if (!a.cap) { a.vx -= nx * f; a.vy -= ny * f; }
          if (!b.cap) { b.vx += nx * f; b.vy += ny * f; }
          continue;
        }
        if (c < .2 || d2 > 1.7 || (a.g && a.g === b.g) || (a.g && b.g) || a.cap || b.cap) continue;
        // слабое цветовое притяжение вблизи: сами слипаются только соседи
        if (this.valid([...this.members(a), ...this.members(b)])) {
          const f = 1.0 * c * dt;
          if (!b.g) { b.vx -= nx * f; b.vy -= ny * f; }
          if (!a.g) { a.vx += nx * f; a.vy += ny * f; }
        }
      }
    }
  },
  strings(dt) {
    for (const grp of [...this.groups.values()]) {
      const m = grp.m; let broke = false;
      for (let i = 0; i < m.length && !broke; i++) for (let j = i + 1; j < m.length; j++) {
        const a = m[i], b = m[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-9;
        if (d > DBREAK) { this.snap(grp, a, b); broke = true; break; }
        if (d > D0) {
          const f = KSTR * (d - D0) * Math.max(this.conf, .3) * dt;
          a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
        }
      }
    }
  },
  // Сами по себе слипаются только целые бесцветные тройки, оказавшиеся рядом (пар-заготовок нет),
  // и кварк с антикварком своего цвета (мезон)
  binding() {
    if (this.conf < .5) return;
    const free = this.q.filter(o => !o.dead && !o.g && !o.cap && o.nb <= 0), B2 = BIND * BIND;
    const near = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < B2;
    for (const a of free) {
      if (a.g) continue;
      const nb = free.filter(b => b !== a && !b.g && near(a, b));
      for (const b of nb) {
        if (a.anti !== b.anti && a.col === b.col) { this.join(a, b); break; }
        const c = nb.find(c => c !== b && !c.g && this.valid([a, b, c]) && !(a.fl === b.fl && b.fl === c.fl));
        if (c) { this.join(a, b); this.join(a, c); break; }
      }
    }
  },
  updGroups(dt) {
    for (const grp of [...this.groups.values()]) {
      if (!this.groups.has(grp.id)) continue;
      if (grp.kind === 'meson' || grp.kind === 'anti') {
        grp.t -= dt;
        if (grp.kind === 'anti' || grp.t <= 0) {
          // мезон нестабилен: кварк и антикварк аннигилируют во вспышку света
          const c = centroid(grp.m);
          fxFlash(c.x, c.y, 1.6, [255, 255, 220], .7); fxRing(c.x, c.y, .5, [255, 255, 200], 5, .8);
          for (const x of grp.m) { x.g = 0; x.dead = true; }
          this.groups.delete(grp.id);
          this.float(c.x, c.y, 'π → свет', [255, 240, 200], 12);
        }
      } else if (grp.kind === 'delta') {
        grp.t -= dt;
        if (grp.t <= 0) {
          const c = centroid(grp.m), x = pick(grp.m);
          this.detach(x);
          const dx = x.x - c.x, dy = x.y - c.y, d = Math.hypot(dx, dy) || 1;
          x.vx += dx / d * 6; x.vy += dy / d * 6;
          fxRing(c.x, c.y, .4, [255, 200, 120], 3, .6);
          this.float(c.x, c.y, 'Δ распался', [255, 190, 120], 13);
        }
      }
    }
  },
  // Сколько ещё барионов можно собрать из свободного вещества (жадно, с учётом цветов и ароматов)
  spare() {
    return baryonTrios(this.q.filter(o => {
      if (o.dead || o.anti) return false;
      if (o.g) { const k = this.groups.get(o.g).kind; if (k === 'p' || k === 'n') return false; }
      return true;
    }));
  },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
    this.temp = Math.max(1.2, Q_T0 * Math.exp(-this.t / 9));
    this.conf = 1 - smooth(1.8, 2.3, this.temp);
    if (live) {
      this.banner += dt;
      if (this.doneAt === null) this.clock += dt;
      this.input(dt);
      steer(P, 7, 6, dt);
      P.x += P.vx * dt; P.y += P.vy * dt;
      this.tickFocus(dt);
    }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    // тепловое дрожание: плазма кипит, но кварки расходятся из детектора постепенно
    const jit = .22 * this.temp;
    for (const q of this.q) {
      q.age += dt; q.nb -= dt; q.hand -= dt; q.sz = Math.min(1, q.sz + dt * .8);
      if (q.tr) { if (q.age < 3.5) { q.tr.push([q.x, q.y]); if (q.tr.length > 40) q.tr.shift(); } else q.tr = null; }
      if (q.cap) continue;
      const j = jit * Math.sqrt(dt) * 2;
      q.vx += randn() * j; q.vy += randn() * j;
      const dr = Math.exp(-dt * 1.2); q.vx *= dr; q.vy *= dr;
      // область плазмы ограничена: дальние кварки мягко возвращаются
      const dx = q.x - this.C.x, dy = q.y - this.C.y, d = Math.hypot(dx, dy);
      if (d > Q_WR) { q.vx -= dx / d * 6 * dt; q.vy -= dy / d * 6 * dt; }
    }
    this.forces(dt); this.strings(dt); this.binding(); this.updGroups(dt);
    for (const q of this.q) {
      if (q.cap) continue;
      const s = Math.hypot(q.vx, q.vy); if (s > 25) { q.vx *= 25 / s; q.vy *= 25 / s; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    this.q = this.q.filter(q => !q.dead);
    if (!act) { // этап гаснет: твой первый барион едет к детектору нового этапа
      const g = this.groups.get(this.mine);
      if (g) { const c = centroid(g.m), k = Math.min(1, dt * 8); for (const x of g.m) { x.x += (P.x - c.x) * k; x.y += (P.y - c.y) * k; } }
      return;
    }
    if (!live) return;
    // всё, что можно было собрать, собрано
    if (this.doneAt === null && this.conf > .5 && !this.spare() && !this.q.some(o => o.cap)) {
      this.doneAt = this.clock; this.endCd = 1.4; this.release(); this.holding = false;
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0) this.showResult();
  },

  // ---------- итоги ----------
  showResult() {
    const t = this.doneAt, pts = Math.round(this.kn), bonus = t === null ? 0 : Math.max(0, Math.round((Q_PAR - t) * 2)), total = pts + bonus;
    const e = { n: LB.name(), s: total, p: pts, t: t === null ? null : Math.floor(t), d: Date.now() };
    const html = `<div class="ek">Уровень 2 · ${this.made.p} p⁺ · ${this.made.n} n⁰</div><div class="en">Адроны</div>` +
      `<div class="rs"><div><span>⏱</span>${fmtClock(t)}</div>` +
      `<div><span>✦</span>${pts}</div><div><span>быстрее ${fmtClock(Q_PAR)}</span>+${bonus}</div><div class="tot"><span>итог</span>${total}</div></div>` +
      lbTable('quarks', e, this.cheated) + `<button class="go">Дальше — ядра</button>`;
    this.res = { final: true };
    G.paused = true;
    const el = document.getElementById('epoch');
    el.innerHTML = html; el.scrollTop = 0;
    el.querySelector('button.go').onclick = () => this.closeCard();
    el.style.display = 'flex';
  },
  closeCard() {
    const el = document.getElementById('epoch');
    if (el.style.display !== 'flex') return;
    el.style.display = 'none'; G.paused = false;
    if (this.res && !this.advanced) { this.advanced = true; this.res = null; advance(); }
  },
  cheat() { this.t = Math.max(this.t, 20); this.cheated = true; },

  // ---------- рисование ----------
  tube(x1, y1, x2, y2, c, w, al) {
    line(x1, y1, x2, y2, c, .16 * al, w * 3);
    line(x1, y1, x2, y2, c, .75 * al, Math.max(1, w));
  },
  draw(al) {
    const z = cam.z;
    ctx.globalAlpha = 1;
    // горячая плазма: глюонные искры
    if (this.temp > 1.8) {
      const n = Math.min(60, (this.temp - 1.8) * 22) | 0;
      ctx.strokeStyle = `rgba(255,220,180,${.25 * al})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < n; i++) { const x = Math.random() * G.W, y = Math.random() * G.H, a = Math.random() * TAU, l = 4 + Math.random() * 12; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); }
      ctx.stroke();
    }
    // струны (у бариона — Y-образное соединение)
    for (const grp of this.groups.values()) {
      const pts = grp.m.map(x => W2S(x.x, x.y));
      const done = grp.kind === 'p' || grp.kind === 'n';
      const unstable = grp.kind === 'meson' || grp.kind === 'delta';
      const c = done ? [255, 255, 255] : unstable ? [255, 170, 120] : [255, 230, 200];
      const flick = unstable ? .6 + .4 * Math.sin(G.T * 30) : 1;
      let maxd = 0;
      for (let i = 0; i < grp.m.length; i++) for (let j = i + 1; j < grp.m.length; j++) maxd = Math.max(maxd, Math.hypot(grp.m[i].x - grp.m[j].x, grp.m[i].y - grp.m[j].y));
      const w = QR * z * .45 * clamp(1.3 - maxd / DBREAK, .25, 1);
      if (pts.length === 3) {
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        for (const p of pts) this.tube(cx, cy, p[0], p[1], c, w, al * flick);
        if (done) {
          glow(cx, cy, 1.5 * z, [255, 255, 255], .18 * al);
          label(grp.kind === 'p' ? 'p⁺' : 'n⁰', cx, cy - 1.05 * z, 12, [255, 255, 255], .7 * al, 700);
        }
      } else if (pts.length === 2) this.tube(pts[0][0], pts[0][1], pts[1][0], pts[1][1], c, w, al * flick);
    }
    // треки вылета из детектора: как в пузырьковой камере уровня частиц, гаснут за пару секунд
    for (const q of this.q) {
      if (!q.tr || q.tr.length < 2) continue;
      ctx.strokeStyle = rgb(QCOL[q.col], .55 * clamp(1 - (q.age - 1) / 2.5, 0, 1)); ctx.lineWidth = 2; ctx.beginPath();
      q.tr.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
      ctx.stroke();
    }
    // кварки
    for (const q of this.q) {
      const [sx, sy] = W2S(q.x, q.y), r = QR * z * q.sz;
      if (!onScreen(sx, sy, r * 4)) continue;
      // сбережённые кварки видны всё время смены уровня — это те же самые кварки, они не пропадают
      const a = (q.mine ? 1 : al) * Math.min(1, q.age * 2);
      const c = q.anti ? QANTI[q.col] : QCOL[q.col];
      glow(sx, sy, r * 3, c, .4 * a);
      if (q.anti) { ring(sx, sy, r * .75, c, a, Math.max(1.5, r * .3)); }
      else ball(sx, sy, r, c, a);
      if (r > 7) label(q.anti ? (q.fl === 'u' ? 'ū' : 'd̄') : q.fl, sx, sy + r * 1.9, r * .9, [255, 255, 255], .8 * a);
    }
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, r = this.hr * z, f = this.focus;
    ctx.globalAlpha = al;
    ring(sx, sy, r, [255, 255, 255], .5, 1.5, [6, 6]);
    if (f) {
      ring(sx, sy, this.fr() * z, FIELD_C, .35, 1.5, [6, 6]);
      ring(sx, sy, .6 * z + 3 * Math.sin(G.T * 10), GOLD, .7, 2);
      for (const o of f.cap) { const [ox, oy] = W2S(o.x, o.y); line(ox, oy, sx, sy, GOLD, .6, 1.8); }
      // каких цветов не хватает: золотые дуги на подходящих кварках; лишний цвет — тусклый крест
      const need = f.cap.length < 3;
      for (const o of this.q) {
        if (o.cap || o.anti || Math.hypot(o.x - P.x, o.y - P.y) > this.fr() * 1.6 || !this.capSet(o, [])) continue;
        const [ox, oy] = W2S(o.x, o.y), rr = QR * z + 7;
        if (need && this.canCap(o, f.cap)) { const sp = G.T * 2; for (let k = 0; k < 3; k++) arc(ox, oy, rr, sp + k * TAU / 3, sp + k * TAU / 3 + 1.2, GOLD, .85, 2); }
        else if (f.cap.some(c => c.col === o.col)) { line(ox - 5, oy - 5, ox + 5, oy + 5, [255, 120, 120], .5, 1.5); line(ox - 5, oy + 5, ox + 5, oy - 5, [255, 120, 120], .5, 1.5); }
      }
      // три цвета собраны: кольцо слипания
      if (f.cap.length === 3) arc(sx, sy, .6 * z + 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(f.tog / .35, 0, 1) * (this.conf > .5 ? 1 : .15), this.conf > .5 ? [255, 255, 255] : [255, 140, 110], .9, 3);
    }
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    this.drawHint(sx, sy, r);
    this.drawArrows();
    for (const fl of this.floats) {
      const [fx, fy] = W2S(fl.x, fl.y);
      label(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700);
    }
    ctx.globalAlpha = 1;
  },
  drawHint(sx, sy, r) {
    if (!G.started || G.paused || this.doneAt !== null) return;
    const f = this.focus; let t = null;
    if (f && f.cap.length === 3 && this.conf <= .5) t = 'горячо — не слипаются';
    else if (!this.learn.hold && this.t > 1.5) t = 'зажми — собрать кварки';
    else if (f && f.cap.length && !this.learn.bar) t = 'три разных цвета';
    if (t) label(t, sx, sy + Math.max(r, this.fr() * cam.z) + 22, 14, [255, 255, 255], .75 + .2 * Math.sin(G.T * 4), 700);
  },
  // стрелки к свободным кваркам за краем экрана
  drawArrows() {
    if (this.doneAt !== null || this.conf < .5) return;
    const cap = this.focus ? this.focus.cap : [];
    const pts = this.q.filter(o => this.capSet(o, cap)).map(o => [o.x, o.y, QCOL[o.col]]);
    edgeArrows(pts, 3);
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    const n = this.made.p + this.made.n, all = n + this.spare();
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > Q_PAR ? [190, 190, 205] : [255, 255, 255], Math.round(this.kn),
      [['остыла', this.conf > .5], [`барионы ${n}/${all}`, this.doneAt !== null]]);
    hudBanner(this.banner, 'УРОВЕНЬ 2 · 10⁻⁶ с', 'Адроны', this.nSaved ? `${this.nSaved} сбережённых кварков → протоны и нейтроны` : 'собери из кварков протоны и нейтроны', al);
    ctx.globalAlpha = 1;
  },
  viewR() { return 3.6 + this.hr * 1.4; },
  hud() {
    return { title: '', sub: `T ≈ ${fmtGeV(this.temp * .0862)}${this.conf > .5 ? ' · конфайнмент' : ''}`, lines: [], goal: '', laws: [] };
  },
};
