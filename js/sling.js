"use strict";
/* Рогатка — общий глагол уровней «Атомы» и «Молекулы»: зажми тело, оттяни назад, отпусти — оно полетит
   в обратную сторону, тем быстрее, чем длиннее резинка. Пока держишь — пунктир показывает путь, а у цели —
   что выйдет («связь C–H», «захват», «слабо», «порвёт»…). Отпустил с короткой резинкой — отмена.
   Уровень-хозяин даёт:
     bodies()            — что можно брать: [{x, y, vx, vy, dead}]
     grabR(b)            — радиус, в котором тело берётся (мир)
     full(), vmax()      — длина полной резинки (мир) и скорость при ней
     carry(b)            — необязательно: скорость тела, которая сохраняется при броске (инерция), иначе 0
     hold(b)             — необязательно: тело взяли (заморозить, погасить вращение…)
     launch(b, vx, vy)   — бросить: задать скорость, пометить брошенным
     predict(b, vx, vy)  — {pts: [[x, y]…], x, y, label, c} — путь и вердикт у цели (или без цели) */
const SLING_MIN = .12; // доля резинки, короче которой бросок отменяется
class Sling {
  constructor(host) { this.h = host; this.held = null; this.p0 = null; this.pull = [0, 0]; this.aim = null; this.shots = 0; this.was = false; }
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
    const v = k * this.h.vmax(), c = this.h.carry ? this.h.carry(this.held) : [0, 0];
    return [c[0] - dx / L * v, c[1] - dy / L * v];
  }
  update() {
    const down = mouse.down && !G.paused && G.started, [mx, my] = S2W(mouse.x, mouse.y);
    if (down && !this.was) {
      mouse.clicked = false;
      this.held = this.pick(mx, my);
      if (this.held) { this.p0 = [mx, my]; this.h.hold && this.h.hold(this.held); Sfx.play('grab'); }
    }
    this.was = down;
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
      if (v) { this.h.launch(b, v[0], v[1]); this.shots++; Sfx.play('pop'); } else this.h.launch(b, ...(this.h.carry ? this.h.carry(b) : [0, 0]));
      return;
    }
    if (v) this.aim = this.h.predict(b, v[0], v[1]);
  }
  draw(al) {
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
    if (!a) { if (k < SLING_MIN) label('оттяни дальше', bx, by - 26, 12, [215, 220, 235], .8 * al, 700); return; }
    ctx.setLineDash([3, 5]); ctx.beginPath();
    a.pts.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.strokeStyle = rgb(a.c, .85 * al); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    if (a.label) {
      const [tx, ty] = W2S(a.x, a.y);
      if (a.hit) ring(tx, ty, 10, a.c, .9 * al, 2);
      label(a.label, tx, ty - 20, 14, a.c, al, 800);
    }
  }
}
