"use strict";
/* Рогатка — общий глагол уровней «Атомы» и «Молекулы»: зажми тело, оттяни назад, отпусти — оно полетит
   в обратную сторону, тем быстрее, чем длиннее резинка. Пока держишь — пунктир показывает путь, а у цели —
   что выйдет («связь C–H», «захват», «слабо», «порвёт»…). Отпустил с короткой резинкой — отмена.
   Уровень-хозяин даёт:
     bodies()            — что можно брать: [{x, y, vx, vy, dead}]
     grabR(b)            — радиус, в котором тело берётся (мир)
     full(), vmax()      — длина полной резинки (мир; обычно slingFullPx() / cam.z) и скорость при ней (k^SLING_POW)
     carry(b)            — необязательно: скорость тела, которая сохраняется при броске (инерция), иначе 0
     hold(b)             — необязательно: тело взяли (заморозить, погасить вращение…)
     launch(b, vx, vy)   — бросить: задать скорость, пометить брошенным
     predict(b, vx, vy)  — {pts: [[x, y]…], x, y, label, c, then?, c2?} — путь и вердикт у цели (или без цели);
                           then — путь сбитого после удара (бильярд «Адронов»), пунктиром потоньше цветом c2
     tap2(x, y)          — необязательно: двойной клик или двойное касание в точке мира; true — съедено (не брать тело) */
const SLING_MIN = .12; // доля резинки, короче которой бросок отменяется
const SLING_POW = 1.5; // скорость растёт быстрее длины: у слабых бросков больше хода резинки — мягкий удар легче отмерить
class Sling {
  constructor(host) {
    this.h = host; this.held = null; this.p0 = null; this.pull = [0, 0]; this.aim = null; this.shots = 0; this.was = false; this.pan = null;
    this.t0 = 0; this.tap = null; this.eat = false; this.snap = null; // начало нажатия; прошлый тап {t, x, y}; двойной клик съел нажатие; отдача броска
  }
  pick(x, y) {
    let best = null, bd = Infinity;
    for (const b of this.h.bodies()) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < this.h.grabR(b) && d < bd) { bd = d; best = b; }
    }
    return best;
  }
  kick() { // скорость броска при нынешней резинке
    const [dx, dy] = this.pull, L = Math.hypot(dx, dy), k = L / this.h.full();
    if (k < SLING_MIN) return null;
    const v = k ** SLING_POW * this.h.vmax(), c = this.h.carry ? this.h.carry(this.held) : [0, 0];
    return [c[0] - dx / L * v, c[1] - dy / L * v];
  }
  update() {
    if (mouse.cancel && !this.held) mouse.cancel = false; // щипок без тела в руке — отменять нечего
    const down = mouse.down && !G.paused && G.started, [mx, my] = S2W(mouse.x, mouse.y);
    // нажатие — фронт кнопки или защёлка clicked (нажал и отпустил быстрее кадра — всё равно нажатие)
    if (!this.was && (down || (mouse.clicked && !G.paused && G.started))) {
      mouse.clicked = false;
      // второй тап рядом с первым и вскоре — двойной клик (у молекул — разорвать связь)
      const t2 = mouse.dbl || (this.tap && G.T - this.tap.t < .4 && Math.hypot(mouse.x - this.tap.x, mouse.y - this.tap.y) < 36);
      this.tap = null; this.t0 = G.T; mouse.dbl = false;
      if (t2 && this.h.tap2 && this.h.tap2(mx, my)) { this.eat = true; this.was = down; return; }
      this.held = this.pick(mx, my);
      if (this.held) { this.p0 = [mx, my]; this.h.hold && this.h.hold(this.held); Sfx.play('grab'); }
      else this.pan = [mouse.x, mouse.y]; // мимо тела — тянем карту
    }
    this.was = down;
    if (this.eat) { if (!down) this.eat = false; return; }
    if (this.pan) { if (down) { panBy(mouse.x - this.pan[0], mouse.y - this.pan[1]); this.pan = [mouse.x, mouse.y]; } else this.pan = null; return; }
    if (this.held && this.held.dead) this.held = null;
    const b = this.held; this.aim = null;
    if (!b) return;
    let dx = mx - this.p0[0], dy = my - this.p0[1]; const L = Math.hypot(dx, dy);
    const F = this.h.full(); if (L > F) { dx *= F / L; dy *= F / L; }
    this.pull = [dx, dy];
    const v = this.kick();
    if (mouse.cancel) { this.held = null; mouse.cancel = false; this.h.launch(b, ...(this.h.carry ? this.h.carry(b) : [0, 0])); return; } // второй палец — отмена
    if (!down) {
      this.held = null;
      if (v) { this.h.launch(b, v[0], v[1]); this.shots++; this.kickFx(b); }
      else {
        this.h.launch(b, ...(this.h.carry ? this.h.carry(b) : [0, 0]));
        if (G.T - this.t0 < .3) this.tap = { t: G.T, x: mouse.x, y: mouse.y }; // короткое нажатие без резинки — тап
      }
      return;
    }
    if (v) this.aim = this.h.predict(b, v[0], v[1]);
  }
  // отдача: резинка схлопывается, у места броска — ударная волна, за телом — разгонный след, экран чуть отдаёт назад
  kickFx(b) {
    const k = Math.min(1, Math.hypot(...this.pull) / this.h.full()), L = Math.hypot(...this.pull) || 1;
    this.snap = { b, x: b.x, y: b.y, pull: [...this.pull], t: G.T, k };
    cam.x += this.pull[0] / L * 10 * k / cam.z; cam.y += this.pull[1] / L * 10 * k / cam.z;
    Sfx.play('throw');
  }
  drawSnap(al) {
    const s = this.snap; if (!s) return;
    const u = (G.T - s.t) / .5; if (u >= 1) { this.snap = null; return; }
    const [x0, y0] = W2S(s.x, s.y), [x1, y1] = W2S(s.b.x, s.b.y), a = (1 - u) * al;
    ring(x0, y0, 12 + 90 * u * (.5 + s.k), [255, 235, 170], .85 * a, 1 + 4 * (1 - u));
    if (u < .25) { const r = 1 - u / .25, [px, py] = W2S(s.x + s.pull[0] * r, s.y + s.pull[1] * r); line(x0, y0, px, py, [255, 255, 255], .9 * r * al, 3); }
    if (!s.b.dead && Math.hypot(x1 - x0, y1 - y0) > 4) {
      for (let i = 0; i < 3; i++) { const f = .35 + .2 * i; line(lerp(x0, x1, f), lerp(y0, y1, f), x1, y1, GOLD, (.18 + .14 * i) * a, 2 + (4 + 2 * i) * s.k * (1 - u)); }
      ball(x1, y1, 5 + 12 * s.k * (1 - u), [255, 245, 210], .45 * a);
    }
  }
  draw(al) {
    this.drawSnap(al);
    const b = this.held; if (!b) return;
    const [bx, by] = W2S(b.x, b.y), [ex, ey] = W2S(b.x + this.pull[0], b.y + this.pull[1]);
    const k = Math.hypot(...this.pull) / this.h.full();
    // резинка: от тела к пальцу, натянутая — ярче и тоньше
    line(bx, by, ex, ey, [255, 255, 255], (.4 + .45 * k) * al, Math.max(1.5, 4 - 2.5 * k));
    ball(ex, ey, 4, [255, 255, 255], .9 * al);
    // доля резинки — дуга вокруг тела
    arc(bx, by, 16, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, k), k < SLING_MIN ? [150, 150, 165] : [255, 215, 110], .9 * al, 3);
    if (this.h.carry) { // инерция тела: куда оно летело — сохранится при броске
      const [cx, cy] = this.h.carry(b), s = Math.hypot(cx, cy);
      if (s > .1) { const [tx, ty] = W2S(b.x + cx * .5, b.y + cy * .5); ctx.setLineDash([2, 3]); line(bx, by, tx, ty, [140, 200, 255], .7 * al, 2); ctx.setLineDash([]); }
    }
    const a = this.aim;
    if (!a) { if (k < SLING_MIN) label('оттянуть дальше', bx, by - 26, 12, [215, 220, 235], .8 * al, 700); return; }
    ctx.setLineDash([3, 5]); ctx.beginPath();
    a.pts.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.strokeStyle = rgb(a.c, .85 * al); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    if (a.then) { // удар: куда покатится сбитое
      ctx.setLineDash([2, 4]); ctx.beginPath();
      a.then.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
      ctx.strokeStyle = rgb(a.c2 || a.c, .65 * al); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      const [x, y] = a.then[a.then.length - 1], [ex, ey] = W2S(x, y); ball(ex, ey, 3, a.c2 || a.c, .8 * al);
    }
    if (a.label) {
      const [tx, ty] = W2S(a.x, a.y);
      if (a.hit) ring(tx, ty, 10, a.c, .9 * al, 2);
      label(a.label, tx, ty - 20, 14, a.c, al, 800);
    }
  }
}
