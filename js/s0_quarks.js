"use strict";
/* Этап 0. Кварк-глюонная плазма.
   Физика: сильное взаимодействие.
   - Асимптотическая свобода: вблизи (d < D0) кварки почти не чувствуют друг друга.
   - Конфайнмент: дальше струна тянет с силой ~ k·(d − D0) — растёт с расстоянием.
   - Струна рвётся при d > DBREAK, и энергия натяжения рождает пару кварк–антикварк.
   - Бесцветные состояния: барион (3 разных цвета) или мезон (цвет + антицвет).
   - Плазма остывает: пока T > T_c, конфайнмента нет.
   Глагол игрока: связать и бережно вести связку. */
const QCOL = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
const QANTI = [[60, 230, 240], [240, 90, 240], [250, 225, 70]]; // анти-красный = голубой и т.д.
const QR = .26, BIND = .62, D0 = .55, KSTR = 9, DBREAK = 2.6;

const Quarks = {
  key: 'quarks', name: 'Кварк-глюонная плазма', bg: [34, 6, 26],
  controls: 'Мышь — двигаться · Пробел — рывок (осторожно: рвёт струны)',

  enter(prev) {
    this.q = []; this.groups = new Map(); this.gid = 1; this.t = 0;
    this.temp = 3.2; this.conf = 0; this.done = false; this.doneT = 0; this.advanced = false; this.saidConf = false;
    if (prev && prev.key === 'particles') {
      // лёгкие кварки уровня частиц становятся стартовым материалом плазмы
      P.vx = P.vy = 0;
      let n = 0;
      for (const o of prev.p) {
        if ((o.sp !== 'u' && o.sp !== 'd') || o.dead || Math.hypot(o.x - P.x, o.y - P.y) < .8 || n >= 30) continue;
        const q = this.mk(o.x, o.y, o.col, o.anti, o.sp); q.vx = o.dx * 2; q.vy = o.dy * 2; q.age = 1; n++;
      }
      this.pq = this.mk(P.x, P.y, 0, false, 'u'); this.pq.player = true; this.pq.age = 1;
      for (let i = n; i < 60; i++) this.spawn(true);
      return;
    }
    P.x = P.y = P.vx = P.vy = 0;
    this.pq = this.mk(0, 0, 0, false, 'u'); this.pq.player = true; this.pq.age = 1;
    for (let i = 0; i < 60; i++) this.spawn(true);
  },
  mk(x, y, col, anti, fl) {
    const q = { x, y, vx: 0, vy: 0, col, anti, fl, g: 0, nb: 0, dead: false, age: 0, player: false };
    this.q.push(q); return q;
  },
  spawn(any) {
    const R = Math.max(viewRadius(), 6), a = Math.random() * TAU, d = any ? rnd(1.4, R * 1.4) : rnd(R * 1.1, R * 1.5);
    const q = this.mk(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, Math.random() * 3 | 0, Math.random() < .28, Math.random() < .55 ? 'u' : 'd');
    q.vx = randn() * 2; q.vy = randn() * 2; if (any) q.age = 1;
  },
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
    if (all.some(m => m.player)) this.onPlayerGroup(grp);
  },
  classify(grp) {
    const m = grp.m;
    if (m.length === 2 && m[0].anti !== m[1].anti) { grp.kind = 'meson'; grp.t = 2.2; }
    else if (m.length === 3) {
      const u = m.filter(x => x.fl === 'u').length;
      grp.kind = u === 2 ? 'p' : u === 1 ? 'n' : 'delta';
      if (grp.kind === 'delta') grp.t = 1.4;
    } else grp.kind = 'forming';
  },
  onPlayerGroup(grp) {
    if (grp.kind === 'meson') msg('Антикварк! Кварк + антикварк = пион. Он нестабилен…');
    else if (grp.kind === 'delta') msg('Три кварка одного аромата → Δ-резонанс. Сейчас распадётся');
    else if (grp.kind === 'p' || grp.kind === 'n') {
      if (!this.done) {
        this.done = true; this.doneT = 1.6;
        msg(grp.kind === 'p' ? 'Протон (uud)! Бесцветный и стабильный' : 'Нейтрон (udd)! Бесцветный барион');
        const c = centroid(grp.m); fxRing(c.x, c.y, .5, [255, 255, 255], 4, 1.2);
      }
    } else if (grp.m.length === 2) msg('Глюонная струна держит вас вместе. Нужен третий цвет');
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
    const far = a.player ? b : b.player ? a : (Math.hypot(a.x - P.x, a.y - P.y) > Math.hypot(b.x - P.x, b.y - P.y) ? a : b);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const isPlayer = grp.m.some(x => x.player);
    this.detach(far);
    const col = Math.random() * 3 | 0, fl = Math.random() < .5 ? 'u' : 'd';
    const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    const q1 = this.mk(mx + nx / nl * .35, my + ny / nl * .35, col, false, fl);
    const q2 = this.mk(mx - nx / nl * .35, my - ny / nl * .35, col, true, fl);
    q1.vx = nx / nl * 2; q1.vy = ny / nl * 2; q2.vx = -q1.vx; q2.vy = -q1.vy; q1.nb = q2.nb = .7; q1.age = q2.age = 1;
    fxFlash(mx, my, 1, [255, 240, 200], .5);
    if (isPlayer) msg('Струна порвалась! Энергия натяжения превратилась в пару кварк–антикварк');
  },

  forces(dt) {
    const q = this.q, c = this.conf;
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      for (let j = i + 1; j < q.length; j++) {
        const b = q[j];
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 > 6) continue;
        const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
        // одинаковый цвет — отталкивание (в бесцветную комбинацию не сложатся)
        if (a.col === b.col && a.anti === b.anti && d < .9) {
          const f = 5 * (.9 - d) * dt; a.vx -= nx * f; a.vy -= ny * f; b.vx += nx * f; b.vy += ny * f; continue;
        }
        if (c < .2 || (a.g && a.g === b.g) || (a.g && b.g)) continue;
        // цветовое притяжение: тянет к тем, с кем можно стать бесцветным
        if (this.valid([...this.members(a), ...this.members(b)])) {
          const f = 2.2 * c * dt;
          if (!b.g && !b.player) { b.vx -= nx * f; b.vy -= ny * f; }
          if (!a.g && !a.player) { a.vx += nx * f; a.vy += ny * f; }
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
  binding() {
    if (this.conf < .5) return;
    const q = this.q;
    for (let i = 0; i < q.length; i++) {
      const a = q[i]; if (a.dead || a.nb > 0) continue;
      for (let j = i + 1; j < q.length; j++) {
        const b = q[j]; if (b.dead || b.nb > 0 || (a.g && a.g === b.g)) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy < BIND * BIND) this.join(a, b);
      }
    }
  },
  updGroups(dt) {
    for (const grp of [...this.groups.values()]) {
      if (!this.groups.has(grp.id)) continue;
      const hasP = grp.m.some(x => x.player);
      if (grp.kind === 'meson') {
        grp.t -= dt;
        if (grp.t <= 0) {
          const c = centroid(grp.m);
          fxFlash(c.x, c.y, 1.6, [255, 255, 220], .7); fxRing(c.x, c.y, .5, [255, 255, 200], 5, .8);
          for (const x of grp.m) { x.g = 0; if (!x.player) x.dead = true; else x.nb = 1; }
          this.groups.delete(grp.id);
          if (hasP) msg('Пион распался: кварк и антикварк аннигилировали в фотоны');
        }
      } else if (grp.kind === 'delta') {
        grp.t -= dt;
        if (grp.t <= 0) {
          const c = centroid(grp.m), x = pick(grp.m.filter(m => !m.player));
          this.detach(x);
          const dx = x.x - c.x, dy = x.y - c.y, d = Math.hypot(dx, dy) || 1;
          x.vx += dx / d * 6; x.vy += dy / d * 6;
          fxRing(c.x, c.y, .4, [255, 200, 120], 3, .6);
          if (hasP) msg('Δ-резонанс распался: кварк вылетел. Нужен другой аромат (u/d)');
        }
      }
    }
  },

  update(dt, act) {
    this.t += dt;
    this.temp = Math.max(1.2, 3.2 - this.t * .12);
    this.conf = 1 - smooth(1.8, 2.3, this.temp);
    if (act && this.conf > .5 && !this.saidConf) { this.saidConf = true; msg('Плазма остыла: включился конфайнмент. Кварки начинают слипаться'); }
    const pq = this.pq;
    if (act) steer(pq, 4.2, 3, dt);
    const jit = .9 * this.temp;
    for (const q of this.q) {
      q.age += dt; q.nb -= dt;
      const j = jit * (q.player ? .4 : 1) * Math.sqrt(dt) * 2;
      q.vx += randn() * j; q.vy += randn() * j;
      if (!q.player || !act) { const dr = Math.exp(-dt * 1.2); q.vx *= dr; q.vy *= dr; }
    }
    this.forces(dt); this.strings(dt); this.binding(); this.updGroups(dt);
    for (const q of this.q) { const s = Math.hypot(q.vx, q.vy); if (s > 25) { q.vx *= 25 / s; q.vy *= 25 / s; } q.x += q.vx * dt; q.y += q.vy * dt; }

    if (act) { P.x = pq.x; P.y = pq.y; P.vx = pq.vx; P.vy = pq.vy; }
    else { // этап гаснет: твой барион едет вместе с новым этапом
      const m = this.members(pq), c = centroid(m), k = Math.min(1, dt * 8);
      for (const x of m) { x.x += (P.x - c.x) * k; x.y += (P.y - c.y) * k; }
    }

    if (this.done && act) { this.doneT -= dt; if (this.doneT <= 0 && !this.advanced) { this.advanced = true; advance(); } }

    // спавн / деспавн вокруг игрока
    const R = viewRadius();
    for (const q of this.q) if (!q.g && !q.player && Math.hypot(q.x - P.x, q.y - P.y) > R * 2.2) q.dead = true;
    for (const grp of [...this.groups.values()]) {
      if (grp.m.some(x => x.player)) continue;
      const c = centroid(grp.m);
      if (Math.hypot(c.x - P.x, c.y - P.y) > R * 2.4) { for (const x of grp.m) x.dead = true; this.groups.delete(grp.id); }
    }
    this.q = this.q.filter(q => !q.dead);
    if (act) { const free = this.q.filter(q => !q.g).length; for (let i = 0; i < 3 && free + i < 55; i++) this.spawn(false); }
  },

  tube(x1, y1, x2, y2, c, w, al) {
    line(x1, y1, x2, y2, c, .16 * al, w * 3);
    line(x1, y1, x2, y2, c, .75 * al, Math.max(1, w));
  },
  draw(al) {
    const z = cam.z;
    ctx.globalAlpha = 1;
    // горячая плазма: глюонные искры
    if (this.temp > 1.8) {
      const n = (this.temp - 1.8) * 30 | 0;
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
        if (done) glow(cx, cy, 1.5 * z, [255, 255, 255], .18 * al);
      } else if (pts.length === 2) this.tube(pts[0][0], pts[0][1], pts[1][0], pts[1][1], c, w, al * flick);
    }
    // кварки
    for (const q of this.q) {
      const [sx, sy] = W2S(q.x, q.y), r = QR * z;
      if (!onScreen(sx, sy, r * 4)) continue;
      const a = al * Math.min(1, q.age * 2);
      const c = q.anti ? QANTI[q.col] : QCOL[q.col];
      glow(sx, sy, r * 3, c, .4 * a);
      if (q.anti) { ring(sx, sy, r * .75, c, a, Math.max(1.5, r * .3)); }
      else ball(sx, sy, r, c, a);
      if (r > 7) label(q.anti ? (q.fl === 'u' ? 'ū' : 'd̄') : q.fl, sx, sy + r * 1.9, r * .9, [255, 255, 255], .8 * a);
    }
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(this.pq.x, this.pq.y), r = QR * cam.z;
    ring(sx, sy, r * (2.2 + .25 * Math.sin(G.T * 4)), [255, 255, 255], .7 * al, 1.5, [4, 4]);
  },
  viewR() { return 5; },
  hud() {
    const m = this.members(this.pq);
    const comp = m.map(x => `<span style="color:${rgb(x.anti ? QANTI[x.col] : QCOL[x.col])}">${x.anti ? 'анти-' : ''}${x.fl}</span>`).join(' + ');
    const kindName = { p: 'протон', n: 'нейтрон', meson: 'пион (нестабилен)', delta: 'Δ-резонанс (нестабилен)', forming: 'собирается…' };
    const grp = this.pq.g ? this.groups.get(this.pq.g) : null;
    return {
      title: this.name,
      sub: `T ≈ ${this.temp.toFixed(1)}·10¹² K · ${this.conf < .5 ? 'кварки свободны' : 'конфайнмент'}`,
      lines: [['Связка', comp], ['Что это', grp ? kindName[grp.kind] : 'одинокий кварк']],
      goal: this.conf < .5
        ? 'Плазма слишком горячая: кварки свободны (асимптотическая свобода). Ждём остывания…'
        : 'Собери бесцветный барион: три кварка <b>разных цветов</b>. uud = протон, udd = нейтрон. Полые кружки — антикварки: с ними получится нестабильный пион. Не дёргай связку резко — струна порвётся.',
      laws: [['Сильное взаимодействие (струны)', this.conf], ['Тепловой хаос', clamp((this.temp - 1.2) / 2, 0, 1)], ['Асимптотическая свобода', 1 - this.conf * .6]],
    };
  },
  cheat() {
    const pq = this.pq;
    for (const x of [...this.members(pq)]) if (x !== pq) this.detach(x);
    this.t = 20; this.temp = 1.2; this.conf = 1; this.saidConf = true;
    const cols = [0, 1, 2].filter(c => c !== pq.col), fls = pq.fl === 'u' ? ['u', 'd'] : ['u', 'u'];
    const a = this.mk(pq.x + .4, pq.y, cols[0], false, fls[0]), b = this.mk(pq.x - .2, pq.y + .35, cols[1], false, fls[1]);
    a.age = b.age = 1;
    this.join(pq, a); this.join(pq, b);
  },
};
