"use strict";
/* Этап 2. Рекомбинация.
   Физика:
   - Кулон: электроны притягиваются к ядру с зарядом Q = Z − (пойманные электроны)
     и летят по настоящим кулоновским орбитам (гиперболы мимо, если быстрые).
   - Захват (радиационная рекомбинация): электрон садится на оболочку, только если
     его энергия относительно ядра меньше, чем может унести испущенный фотон.
     Практически: нужна маленькая ОТНОСИТЕЛЬНАЯ скорость → лети рядом с электроном.
   - Оболочки квантованы: 2, 8, 8. Внешние электроны связаны слабее.
   - Фотоны с энергией выше энергии ионизации выбивают электрон обратно.
   - Вселенная остывает: электроны медленнее, фотоны слабее, туман рассеивается.
   Глагол игрока: рогатка. Зажми электрон — он замирает, но помнит, куда летел (голубой пунктир): бросок
   прибавляет к этой скорости толчок. Чтобы ядро его поймало, толчок должен погасить тепловую скорость
   и мягко направить электрон к ядру — пунктир показывает кулоновскую орбиту, у цели — «захват» или «пролетит».
   Брошенный электрон 2,5 с летит свободно (без теплового блуждания) — как показал пунктир. */
const E_FREE = 2.5;
const SHELL_R = [6, 11, 16], SHELL_CAP = [2, 8, 8];
const shellOf = k => k < 2 ? 0 : k < 10 ? 1 : 2;
const KE = 200, SOFT = 3;
function shellFill(n) { return [Math.min(n, 2), clamp(n - 2, 0, 8), clamp(n - 10, 0, 8)]; }

const Atoms = {
  key: 'atoms', name: 'Рекомбинация', bg: [10, 14, 42],
  controls: 'Зажми электрон, оттяни, отпусти — рогатка: погаси его скорость и мягко брось к ядру',
  sling: true,

  enter(prev) {
    this.t = 0; this.Ta = 1; this.el = []; this.ph = []; this.ions = []; this.neutralT = 0; this.phT = 0;
    this.cleared = false; this.advanced = false; this.capMsg = false; this.ionMsgT = 0;
    const nu = prev && prev.nuc ? prev.nuc : { Z: 6, N: 6, parts: [] };
    this.Z = Math.max(1, nu.Z); this.N = nu.N; this.parts = nu.parts.map(p => ({ ...p }));
    if (!this.parts.length) for (let k = 0; k < this.Z + this.N; k++) { const a = k * 2.4, r = .9 * Math.sqrt(k); this.parts.push({ t: k < this.Z ? 'p' : 'n', lx: Math.cos(a) * r, ly: Math.sin(a) * r }); }
    this.ne = 0;
    if (prev && prev.e) for (const e of prev.e) {
      if (e.type === 'p') this.ions.push(this.mkIon(1, e.x, e.y));
      else if (e.type === 'a') this.ions.push(this.mkIon(2, e.x, e.y));
      else if (e.type === 'e') this.el.push({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, k: rnd(.75, 1.25), dead: false, age: 1 });
    }
    for (let i = 0; i < 50; i++) this.spawnE(true);
    for (let i = 0; i < 10; i++) this.spawnIon(true);
    this.sl = new Sling(this);
  },
  // ---------- рогатка ----------
  bodies() { return this.el; },
  grabR() { return 30 / cam.z; },
  full() { return 150 / cam.z; },
  vmax() { return 1.4 * this.vth() + 8; },
  carry(b) { return [b.cvx || 0, b.cvy || 0]; },
  hold(b) { b.held = true; b.cvx = b.vx; b.cvy = b.vy; if (!this.slMsg) { this.slMsg = true; msg('Электрон замер, но помнит, куда летел (голубой пунктир). Оттяни так, чтобы погасить эту скорость и мягко бросить его к ядру'); } },
  launch(b, vx, vy) { b.held = false; b.vx = vx; b.vy = vy; b.free = E_FREE; },
  // Кулоновская орбита броска (только поле игрока, без теплового блуждания) и вердикт
  predict(b, vx, vy) {
    const Q = this.Z - this.ne, pts = [[b.x, b.y]], dt = 1 / 60;
    if (Q <= 0) return { pts, x: P.x, y: P.y, label: 'атом уже нейтрален', c: [200, 205, 225] };
    let x = b.x, y = b.y, ux = vx, uy = vy;
    const sh = shellOf(this.ne), E0 = .5 * (ux * ux + uy * uy) - KE * Q / Math.sqrt((x - P.x) ** 2 + (y - P.y) ** 2 + SOFT * SOFT);
    let best = Infinity, bx = x, by = y;
    for (let n = 0; n < E_FREE * 60; n++) {
      const dx = P.x - x, dy = P.y - y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1e-6, f = KE * Q / (d2 + SOFT * SOFT);
      if (d < SHELL_R[sh] * 1.6) {
        const Einf = .5 * ((ux - P.vx) ** 2 + (uy - P.vy) ** 2) - KE * Q / Math.sqrt(d2 + SOFT * SOFT);
        if (Einf < this.bindE(Q, sh)) { pts.push([x, y]); return { pts, x, y, label: 'захват', c: [120, 240, 160], hit: true }; }
      }
      if (d < best) { best = d; bx = x; by = y; }
      ux += dx / d * f * dt; uy += dy / d * f * dt;
      const s = Math.hypot(ux, uy); if (s > 60) { ux *= 60 / s; uy *= 60 / s; }
      x += ux * dt; y += uy * dt;
      if (n % 3 === 2) pts.push([x, y]);
    }
    return E0 >= this.bindE(Q, sh) ? { pts, x: bx, y: by, label: 'пролетит — слишком быстро', c: [255, 110, 100] }
      : { pts, x: bx, y: by, label: 'мимо — целься в ядро', c: [255, 200, 110] };
  },
  mkIon(Z, x, y) { return { Z, ne: 0, x, y, vx: randn(), vy: randn(), dead: false, age: 1 }; },
  vth() { return 3 + 25 * this.Ta; },
  ringPos(any, lo) {
    const R = Math.max(viewRadius(), 20), a = Math.random() * TAU, d = any ? rnd(lo, R * 1.4) : rnd(R * 1.1, R * 1.5);
    return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d];
  },
  spawnE(any) {
    const [x, y] = this.ringPos(any, 22), v = this.vth(), a = Math.random() * TAU;
    this.el.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, k: rnd(.75, 1.25), dead: false, age: any ? 1 : 0 });
  },
  spawnIon(any) {
    const [x, y] = this.ringPos(any, 25), io = this.mkIon(Math.random() < .78 ? 1 : 2, x, y);
    if (this.Ta < .3) io.ne = io.Z; io.age = any ? 1 : 0;
    this.ions.push(io);
  },
  spawnPhoton() {
    const R = viewRadius(), a = Math.random() * TAU, h = a + Math.PI + randn() * .4;
    this.ph.push({ x: P.x + Math.cos(a) * R * 1.05, y: P.y + Math.sin(a) * R * 1.05, vx: Math.cos(h) * 40, vy: Math.sin(h) * 40, E: 1 + 40 * this.Ta * Math.random(), dead: false });
  },
  // энергия связи следующей свободной оболочки (в игровых единицах)
  bindE(Q, shell) { return KE * Q / SHELL_R[shell] * .12; },
  ionE() { // энергия ионизации внешнего электрона в эВ (грубая модель экранирования)
    if (this.ne <= 0) return 0;
    const s = shellOf(this.ne - 1), inner = s === 0 ? 0 : s === 1 ? 2 : 10;
    const Zeff = Math.max(1, this.Z - inner - (this.ne - inner - 1) * .35);
    return 13.6 * Zeff * Zeff / ((s + 1) * (s + 1));
  },
  outerR() { return SHELL_R[shellOf(Math.max(0, this.ne - 1))]; },

  update(dt, act) {
    this.t += dt; this.Ta = Math.max(0, 1 - this.t / 90);
    if (act) { this.sl.update(); const dr = Math.exp(-dt * 1.5); P.vx *= dr; P.vy *= dr; P.x += P.vx * dt; P.y += P.vy * dt; }
    const Q = this.Z - this.ne, vth = this.vth();
    if (act && !this.cleared && this.Ta < .3) { this.cleared = true; msg('Рекомбинация: Вселенная стала прозрачной. Этот свет — будущее реликтовое излучение'); }

    for (const io of this.ions) {
      const j = Math.sqrt(dt) * 1.2; io.vx += randn() * j; io.vy += randn() * j;
      const dr = Math.exp(-dt * .5); io.vx *= dr; io.vy *= dr; io.x += io.vx * dt; io.y += io.vy * dt; io.age += dt;
    }
    for (const e of this.el) {
      e.age += dt;
      if (e.held) continue; // взят рогаткой — замер
      let ax = 0, ay = 0;
      if (act && Q > 0) {
        const dx = P.x - e.x, dy = P.y - e.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1e-6, f = KE * Q / (d2 + SOFT * SOFT);
        ax += dx / d * f; ay += dy / d * f;
        // захват игроком
        const sh = shellOf(this.ne);
        if (d < SHELL_R[sh] * 1.6) {
          const rvx = e.vx - P.vx, rvy = e.vy - P.vy;
          const Einf = .5 * (rvx * rvx + rvy * rvy) - KE * Q / Math.sqrt(d2 + SOFT * SOFT);
          if (Einf < this.bindE(Q, sh) && Math.random() < 1 - Math.exp(-dt * 8)) {
            e.dead = true; this.ne++; addScore(50);
            const lineC = sh === 0 ? [190, 130, 255] : sh === 1 ? [255, 90, 90] : [255, 190, 90];
            fxFlash(e.x, e.y, 3, lineC, .6); fxRing(P.x, P.y, SHELL_R[sh], lineC, SHELL_R[sh] * 1.6, .7);
            if (!this.capMsg) { this.capMsg = true; msg('Электрон пойман! Он сбросил энергию, испустив фотон — спектральную линию'); }
            continue;
          }
        }
      }
      for (const io of this.ions) {
        const qi = io.Z - io.ne; if (qi <= 0) continue;
        const dx = io.x - e.x, dy = io.y - e.y, d2 = dx * dx + dy * dy; if (d2 > 900) continue;
        const d = Math.sqrt(d2) || 1e-6, f = KE * qi / (d2 + SOFT * SOFT) * .5;
        ax += dx / d * f; ay += dy / d * f;
        if (d < 4) { const rv2 = (e.vx - io.vx) ** 2 + (e.vy - io.vy) ** 2; if (rv2 < 80 * qi && Math.random() < 1 - Math.exp(-dt * 4)) { e.dead = true; io.ne++; break; } }
      }
      if (e.dead) continue;
      // баллистика: своя скорость ~ тепловой, направление плавно блуждает (брошенный рогаткой — пока летит свободно)
      e.vx += ax * dt; e.vy += ay * dt;
      let s = Math.hypot(e.vx, e.vy) || 1e-6;
      if (e.free > 0) e.free -= dt;
      else {
        const tw = randn() * .6 * Math.sqrt(dt), cs = Math.cos(tw), sn = Math.sin(tw);
        [e.vx, e.vy] = [e.vx * cs - e.vy * sn, e.vx * sn + e.vy * cs];
        const target = (e.k || 1) * vth, ns = s + (target - s) * Math.min(1, dt * .6);
        e.vx *= ns / s; e.vy *= ns / s; s = ns;
      }
      if (s > 60) { e.vx *= 60 / s; e.vy *= 60 / s; }
      e.x += e.vx * dt; e.y += e.vy * dt;
    }

    // фотоны
    if (act) { this.phT += dt * (2 + 10 * this.Ta); while (this.phT > 1) { this.phT--; this.spawnPhoton(); } }
    this.ionMsgT -= dt;
    for (const p of this.ph) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (act && this.ne > 0 && Math.hypot(p.x - P.x, p.y - P.y) < this.outerR()) {
        p.dead = true;
        if (p.E > this.ionE() && Math.random() < .6) {
          this.ne--;
          const a = Math.random() * TAU;
          this.el.push({ x: P.x + Math.cos(a) * this.outerR(), y: P.y + Math.sin(a) * this.outerR(), vx: P.vx + Math.cos(a) * 20, vy: P.vy + Math.sin(a) * 20, k: rnd(.75, 1.25), dead: false, age: 1 });
          fxFlash(P.x, P.y, this.outerR(), [255, 255, 255], .3);
          if (this.ionMsgT <= 0) { this.ionMsgT = 6; msg(`Фотон ${p.E.toFixed(0)} эВ выбил электрон (ионизация ≈ ${this.ionE().toFixed(0)} эВ)`); }
        }
      }
    }

    // цель: нейтральный атом
    if (act && this.ne >= this.Z) { this.neutralT += dt; if (this.neutralT > 2 && !this.advanced) { this.advanced = true; msg(`Нейтральный атом: ${elemOf(this.Z)[1]}. Пора строить молекулы`); advance(); } }
    else this.neutralT = 0;

    const R = viewRadius();
    for (const e of this.el) if (!e.held && Math.hypot(e.x - P.x, e.y - P.y) > R * 2.3) e.dead = true;
    for (const io of this.ions) if (Math.hypot(io.x - P.x, io.y - P.y) > R * 2.3) io.dead = true;
    for (const p of this.ph) if (Math.hypot(p.x - P.x, p.y - P.y) > R * 1.6) p.dead = true;
    this.el = this.el.filter(e => !e.dead); this.ions = this.ions.filter(e => !e.dead); this.ph = this.ph.filter(e => !e.dead);
    if (act) {
      const target = 25 + 40 * this.Ta;
      for (let i = 0; i < 3 && this.el.length + i < target; i++) this.spawnE(false);
      for (let i = 0; i < 2 && this.ions.length + i < 12; i++) this.spawnIon(false);
    }
  },
  tally() { return { name: 'Рекомбинация', rows: [['⏱ уровень', fmtClock(this.t)], ['электроны', `${this.ne} / ${this.Z}`], ['бросков рогаткой', this.sl ? this.sl.shots : 0]], auto: null }; },
  cheat() { this.ne = this.Z; this.t = Math.max(this.t, 55); this.Ta = .2; this.neutralT = 1.9; },

  draw(al) {
    const z = cam.z;
    for (const io of this.ions) {
      const [sx, sy] = W2S(io.x, io.y); if (!onScreen(sx, sy, 60)) continue;
      const a = al * Math.min(1, io.age * 2);
      if (io.ne > 0) glow(sx, sy, 4 * z, [140, 190, 255], (.15 + .25 * io.ne / io.Z) * a);
      ball(sx, sy, Math.max(1.5, .9 * z * Math.sqrt(io.Z)), NUC_C.p, a);
      for (let i = 0; i < io.ne; i++) { const an = G.T * 3 + i * Math.PI + io.x; ball(sx + Math.cos(an) * 3 * z, sy + Math.sin(an) * 3 * z, Math.max(1, .3 * z), [170, 220, 255], a); }
    }
    for (const e of this.el) {
      const [sx, sy] = W2S(e.x, e.y); if (!onScreen(sx, sy, 20)) continue;
      const a = al * Math.min(1, e.age * 2);
      line(sx, sy, sx - e.vx * .04 * z, sy - e.vy * .04 * z, [120, 190, 255], .35 * a, Math.max(1, .25 * z));
      glow(sx, sy, Math.max(3, .9 * z), [120, 200, 255], .7 * a); ball(sx, sy, Math.max(1, .3 * z), [200, 235, 255], a);
      if (e.held) ring(sx, sy, 9, [255, 215, 110], .9 * al, 2);
    }
    for (const p of this.ph) {
      const [sx, sy] = W2S(p.x, p.y);
      const c = p.E > 25 ? [210, 200, 255] : p.E > 12 ? [255, 255, 240] : p.E > 5 ? [255, 210, 140] : [255, 130, 90];
      line(sx, sy, sx - p.vx * .06 * z, sy - p.vy * .06 * z, c, .7 * al, Math.max(1.2, .2 * z));
    }
    if (this.sl) this.sl.draw(al);
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z;
    const need = shellFill(this.Z), have = shellFill(this.ne), outer = shellOf(this.Z - 1);
    const val = elemOf(this.Z)[2];
    for (let s = 0; s <= outer; s++) {
      const R = SHELL_R[s] * z, cap = SHELL_CAP[s];
      if (have[s] > 0) glow(sx, sy, R * 1.15, [130, 180, 255], .1 * al * have[s] / cap + .04 * al);
      ring(sx, sy, R, [160, 200, 255], .28 * al, 1, [3, 6]);
      let vacShown = 0;
      for (let i = 0; i < cap; i++) {
        const an = i / cap * TAU + G.T * (.9 / (s + 1)), x = sx + Math.cos(an) * R, y = sy + Math.sin(an) * R, r = Math.max(1.5, .55 * z);
        if (i < have[s]) { glow(x, y, r * 3, [120, 200, 255], .7 * al); ball(x, y, r, [200, 235, 255], al); }
        else if (i < need[s]) ring(x, y, r, [200, 230, 255], .6 * al, 1.2);
        else if (s === outer && vacShown < val) { vacShown++; ring(x, y, r * .8, [255, 180, 90], .8 * al, 1.5, [2, 2]); }
      }
    }
    ctx.globalAlpha = al;
    for (const p of this.parts) drawNucleon(sx + p.lx * z, sy + p.ly * z, NR * z, p.t, G.T);
    ctx.globalAlpha = 1;
    const Q = this.Z - this.ne, el = elemOf(this.Z);
    label(el[0] + (Q > 0 ? (Q > 1 ? sup(Q) : '') + '⁺' : ''), sx, sy - (SHELL_R[outer] + 3) * z, 16, [255, 255, 255], .9 * al);
  },
  overlay(al) { // туман непрозрачной Вселенной: свет рассеивается на свободных электронах
    const fog = .55 * smooth(.1, .6, this.Ta) * al;
    if (fog <= .01) return;
    ctx.fillStyle = `rgba(255,170,110,${fog * .55})`; ctx.fillRect(0, 0, G.W, G.H);
    ctx.fillStyle = `rgba(255,220,180,${fog * .5})`;
    for (let i = 0; i < 120; i++) ctx.fillRect(Math.random() * G.W, Math.random() * G.H, 2, 2);
  },
  viewR() { return SHELL_R[shellOf(this.Z - 1)] * 2.4 + 10; },
  hud() {
    const Q = this.Z - this.ne, el = elemOf(this.Z), sh = shellOf(Math.min(this.ne, this.Z - 1));
    const vcap = Q > 0 ? Math.sqrt(2 * this.bindE(Q, shellOf(this.ne))) : 0;
    return {
      title: this.name,
      sub: `T ≈ ${Math.round(1500 + 6000 * this.Ta)} K · ${this.Ta > .3 ? 'Вселенная непрозрачна' : 'Вселенная прозрачна'}`,
      lines: [['Атом', `${el[1]} ${Q > 0 ? `(ион, заряд +${Q})` : '(нейтральный)'}`], ['Электроны', `${this.ne} / ${this.Z}`], ['Очки', fmtScore(G.score)],
        ['Захват', Q > 0 ? `скорость у оболочки ≲ ${vcap.toFixed(1)} (электроны летят ≈ ${this.vth().toFixed(0)})` : '—'],
        ['Ионизация', this.ne ? `${this.ionE().toFixed(1)} эВ` : '—'], ['Химия', `валентность ${el[2]} — оранжевые вакансии станут связями`]],
      goal: 'Собери электроны до нейтрального атома. <b>Рогатка</b>: зажми электрон — он замрёт, но запомнит, куда летел (голубой пунктир); оттяни и отпусти — толчок прибавится к его скорости. Быстрый электрон пролетит мимо ядра по гиперболе: погаси его скорость и брось мягко — пунктир покажет орбиту, у ядра — «захват». Жёсткие фотоны выбивают электроны; Вселенная остывает, и ловить становится легче.',
      laws: [['Электромагнетизм (кулон)', 1], ['Квантованные оболочки', 1], ['Фотоионизация', this.Ta], ['Тепловое движение', .2 + .8 * this.Ta]],
    };
  },
};
