"use strict";
/* Уровень 5. Атомы — выброс сверхновой остывает, голые ядра одеваются электронами.
   Материал — ядра со «Звёзд» (C, N, O, гелий, водород); при запуске отсюда — набор по умолчанию.
   Физика (упрощённо):
   - ион с зарядом Q = Z − (пойманные электроны) притягивает электроны (кулон);
   - захват только медленного электрона: относительная скорость < 1,6 + 0,35·Q — быстрый пролетит мимо;
   - электроны горячие и быстрые; Вселенная остывает, они медленнеют;
   - жёсткий свет выбивает электрон обратно, пока горячо.
   Глагол: проведи пальцем (или мышью с зажатой кнопкой) — за ним тормозящий след. Электрон, пересёкший след,
   отдаёт энергию фотоном и замедляется — ближайший ион его ловит. Играешь по всему полю.
   Исследование «Рекомбинация»: электроны у ионов тормозят сами (излучают), Вселенная нейтрализуется без тебя.
   Мир без края: ионы — ядра твоей сверхновой там, куда их вынесло; Вселенная приносит ионы, электроны и свет из-за края кадра. */
// обзор; ионы Вселенной: плотность и предел в кадре; электронов в кадре — не больше
const A_VIEW = 14.5, A_DENS = .025, A_CAP = 40, A_ECAP = 30, A_COST = 30, A_GOAL = .9, TR_LIFE = .8;
const AT_EL = { 1: ['H', [235, 235, 240]], 2: ['He', [200, 250, 255]], 3: ['Li', [200, 120, 255]], 6: ['C', [150, 150, 165]], 7: ['N', [110, 145, 255]], 8: ['O', [250, 95, 80]] };
const atSym = Z => (AT_EL[Z] || [elemOf(Z)[0]])[0];
const atCol = Z => (AT_EL[Z] || [0, [220, 220, 230]])[1];
const AT_NEED = [1, 2, 6, 7, 8]; // какие атомы собрать: H, He, C, N, O
// пересекаются ли отрезки ab и cd
function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

const Atoms = {
  key: 'atoms', name: 'Атомы', bg: [10, 14, 42], sling: true, // sling — палец сам рисует след (без кнопки действия)
  controls: 'Проведи по пути электронов — след их тормозит',

  enter(prev) {
    this.t = 0; this.clock = 0; this.Ta = 1; this.ions = []; this.el = []; this.ph = []; this.tr = []; this.floats = [];
    this.kn = 0; this.uni = []; this.spent = 0; this.rs = { rec: 0 }; this.banner = -1.5; this.tk = {}; this.doneAt = null; this.endCd = -1;
    this.advanced = false; this.cheated = false; this.seenN = new Set(); this.phT = 0; this.was = false; this.stroke = 0;
    this.st = { brakes: 0, ionized: 0, best: 0 }; this.caps = { hand: 0, auto: 0 };
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    this.fromStars = !!(prev && prev.o);
    // ионы — ядра со «Звёзд», каждое там, куда его вынесла сверхновая, и с той же скоростью (структура ядра больше не видна — голый ион)
    if (prev && prev.o) for (const o of prev.o) {
      if (o.dead || o.Z < 1) continue;
      this.ions.push({ Z: o.Z === 4 ? 2 : o.Z, ne: 0, x: o.x, y: o.y, vx: o.vx, vy: o.vy, age: 1, rot: Math.random() * TAU, mine: true, src: o }); // ⁸Be — уже два гелия
    }
    // с нуля — набор по умолчанию в кадре
    if (!prev) for (const Z of [6, 6, 7, 8, 8, 2, 2, 2, ...Array(14).fill(1)]) {
      const at = beyondPos(zoomFor(this), 0, true); if (at) this.ions.push(this.ion(Z, at[0], at[1], -Math.random()));
    }
    // ионы Вселенной — за краем кадра; каждого нужного атома — хотя бы по одному
    const z1 = zoomFor(this), want = popWant(A_DENS, A_CAP, z1);
    for (let k = 0; this.ions.length < want && k < want * 3; k++) { const at = beyondPos(z1, 1, false); if (at) this.ions.push(this.ion(this.cosmicZ(), at[0], at[1], 1)); }
    for (const Z of AT_NEED) if (!this.ions.some(i => i.Z === Z)) { const at = beyondPos(z1, 1, false) || [P.x + rnd(-8, 8), P.y + rnd(-8, 8)]; this.ions.push(this.ion(Z, at[0], at[1], 1)); }
    this.Zsum = this.ions.reduce((s, i) => s + i.Z, 0);
    for (let i = 0; i < 26; i++) this.spawnE(true);
    this.stars = pickStars(this.starPool());
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  ion(Z, x, y, age) { return { Z, ne: 0, x, y, vx: randn() * .3, vy: randn() * .3, age, rot: Math.random() * TAU, mine: false, src: null }; },
  // ион Вселенной: в основном водород и гелий; тяжёлые — только те, что уже выковали звёзды (или каких вокруг ещё нет)
  cosmicZ() {
    const r = Math.random();
    if (r < .68) return 1;
    if (r < .9) return 2;
    const heavy = [6, 7, 8].filter(Z => !this.fromStars || Codex.has('n:' + Z + ',' + Z) || !this.ions.some(i => i.Z === Z));
    return heavy.length ? pick(heavy) : 1;
  },
  vth() { return 2.5 + 8 * this.Ta; },
  // электрон: any — где угодно в кадре (начало), иначе — из-за края кадра, внутрь
  spawnE(any) {
    const v = this.vth();
    let x, y, h;
    if (any) { const at = beyondPos(cam.z, 0, true) || [P.x, P.y]; [x, y] = at; h = Math.random() * TAU; }
    else { const r = rimPos(.5); x = r.x; y = r.y; h = Math.atan2(r.ny, r.nx) + randn() * .5; }
    this.el.push({ x, y, vx: Math.cos(h) * v, vy: Math.sin(h) * v, k: rnd(.8, 1.2), slow: 0, brk: 0, by: null, age: any ? 1 : 0 });
  },
  // Вселенная вокруг: ионов в кадре не хватает — приходят из-за края (после «Рекомбинации» — часто уже нейтральными); чужое вдали растворяется
  tide(dt) {
    dissolveFar(this.ions);
    this.ions = this.ions.filter(i => !i.dead);
    if (this.doneAt !== null) return;
    const have = this.ions.filter(i => inView(i.x, i.y, 1)).length;
    if (have < popWant(A_DENS, A_CAP) && Math.random() < dt * 3) {
      const r = rimPos(1), io = this.ion(this.cosmicZ(), r.x, r.y, 0), sp = rnd(.6, 1.4);
      io.vx += r.nx * sp; io.vy += r.ny * sp;
      if (this.rs.rec && Math.random() < this.neutral()) io.ne = io.Z;
      this.ions.push(io);
    }
  },
  neutral() { return this.ions.reduce((s, i) => s + Math.min(i.ne, i.Z), 0) / Math.max(1, this.Zsum); },

  // ---------- след ----------
  tickTrail(live) {
    const down = live && mouse.down && !G.paused && this.doneAt === null;
    if (down && !this.was) { this.stroke++; this.strokeN = 0; this.tr = []; }
    this.was = down;
    if (down) {
      const [x, y] = S2W(mouse.x, mouse.y), l = this.tr[this.tr.length - 1];
      if (!l || Math.hypot(l.x - x, l.y - y) > .12) this.tr.push({ x, y, t: G.T });
    }
    this.tr = this.tr.filter(p => G.T - p.t < TR_LIFE);
  },
  brake(e, by) {
    const s = Math.hypot(e.vx, e.vy) || 1, ns = Math.max(.7, s * .22);
    e.vx *= ns / s; e.vy *= ns / s; e.slow = 4.5; e.brk = .6; e.by = by;
    fxFlash(e.x, e.y, .5, [255, 240, 170], .3);
    if (by === 'hand') {
      this.st.brakes++; this.strokeN = (this.strokeN || 0) + 1; this.st.best = Math.max(this.st.best, this.strokeN);
      if (this.st.brakes === 1) msg('Электрон отдал энергию фотоном и замедлился — теперь ион его поймает');
    }
  },

  // ---------- шаг ----------
  update(dt, act) {
    const live = act && G.started;
    this.t += dt; this.Ta = Math.max(.1, 1 - this.t / 120);
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    this.tickTrail(live);
    const vth = this.vth();
    for (const io of this.ions) {
      io.age += dt; io.rot += dt * 2;
      const j = .25 * Math.sqrt(dt); io.vx += randn() * j; io.vy += randn() * j;
      const k = Math.exp(-dt * .6); io.vx *= k; io.vy *= k;
      io.x += io.vx * dt; io.y += io.vy * dt;
      if (io.src && G.prev) { const [px, py] = toPrev(io.x, io.y); io.src.x = px; io.src.y = py; io.src.vx = io.src.vy = 0; } // ядро гаснет там, где проявляется ион
    }
    for (const e of this.el) {
      if (e.dead) continue;
      e.age += dt; e.slow -= dt; e.brk -= dt;
      const ox = e.x, oy = e.y;
      let ax = 0, ay = 0;
      for (const io of this.ions) {
        const Q = io.Z - io.ne; if (Q <= 0) continue;
        const dx = io.x - e.x, dy = io.y - e.y, d2 = dx * dx + dy * dy; if (d2 > (e.slow > 0 ? 40 : 20)) continue;
        const d = Math.sqrt(d2) || 1e-6, f = (e.slow > 0 ? 9 : 5) * Q / (d2 + .6); // медленного кулон дотягивает издалека
        ax += dx / d * f; ay += dy / d * f;
        // захват: близко и медленно
        if (act && d < .95 + .08 * Q && Math.hypot(e.vx - io.vx, e.vy - io.vy) < 2.4 + .3 * Q) { this.capture(io, e); break; }
        // «Рекомбинация»: у иона электрон излучает и тормозит сам
        if (act && this.rs.rec && d < 4 && e.brk <= 0 && this.doneAt === null && Math.random() < dt * 1.2) this.brake(e, e.by === 'hand' ? 'hand' : 'auto');
      }
      if (e.dead) continue;
      e.vx += ax * dt; e.vy += ay * dt;
      let s = Math.hypot(e.vx, e.vy) || 1e-6;
      if (e.slow <= 0) { // тепло разгоняет обратно, направление блуждает
        const tw = randn() * .5 * Math.sqrt(dt), cs = Math.cos(tw), sn = Math.sin(tw);
        [e.vx, e.vy] = [e.vx * cs - e.vy * sn, e.vx * sn + e.vy * cs];
        const ns = s + (e.k * vth - s) * Math.min(1, dt * .7); e.vx *= ns / s; e.vy *= ns / s; s = ns;
      }
      if (s > 25) { e.vx *= 25 / s; e.vy *= 25 / s; }
      e.x += e.vx * dt; e.y += e.vy * dt;
      // пересёк след — тормозит
      if (live && e.brk <= 0 && this.tr.length > 1) for (let i = 1; i < this.tr.length; i++) {
        const p = this.tr[i - 1], q = this.tr[i];
        if (segX(ox, oy, e.x, e.y, p.x, p.y, q.x, q.y)) { this.brake(e, 'hand'); break; }
      }
      if (farOff(e)) e.dead = true;
    }
    // свет выбивает электроны, пока горячо
    if (act && this.doneAt === null) {
      this.phT += dt * 2.5 * this.Ta;
      while (this.phT > 1) {
        this.phT--;
        const R = viewRadius(), a = Math.random() * TAU, h = a + Math.PI + randn() * .35;
        this.ph.push({ x: P.x + Math.cos(a) * R * 1.05, y: P.y + Math.sin(a) * R * 1.05, vx: Math.cos(h) * 22, vy: Math.sin(h) * 22, t: 0, hard: Math.random() < .45 * this.Ta - .12 });
      }
    }
    for (const p of this.ph) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
      if (!act || p.dead || !p.hard) continue;
      for (const io of this.ions) if (io.ne > 0 && (io.x - p.x) ** 2 + (io.y - p.y) ** 2 < .8) { this.ionize(io, p); p.dead = true; break; }
    }
    this.ph = this.ph.filter(p => !p.dead && p.t < 2.4);
    this.el = this.el.filter(e => !e.dead);
    if (act) this.tide(dt);
    this.Zsum = this.ions.reduce((s, i) => s + i.Z, 0);
    if (!live) return;
    // приток электронов из плазмы — из-за края, сколько не хватает ионам в кадре
    const vis = this.ions.filter(i => inView(i.x, i.y, 2)), free = vis.reduce((s, i) => s + Math.max(0, i.Z - i.ne), 0);
    const nE = this.el.filter(e => inView(e.x, e.y, 2)).length;
    if (this.doneAt === null) for (let i = 0; i < 2 && nE + i < Math.min(A_ECAP, free + 8); i++) this.spawnE(false);
    if (this.doneAt === null) this.tickStars(false);
    if (this.doneAt === null && this.steps().every(s => s.d)) {
      this.doneAt = this.clock; this.endCd = 2; this.tr = [];
      this.tickStars(true);
      msg('Вселенная стала нейтральной и прозрачной');
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); } // молекулам — эти же атомы, на своих местах
  },
  capture(io, e) {
    e.dead = true; io.ne++;
    if (e.by === 'hand') this.caps.hand++; else this.caps.auto++;
    const c = atCol(io.Z);
    fxRing(io.x, io.y, .3, c, 1.6, .5);
    Sfx.play('catch', Math.min(3, io.ne - 1));
    if (io.ne >= io.Z) { // нейтральный атом
      const s = atSym(io.Z);
      let pts = 2, txt = s; Codex.note('a:' + io.Z);
      if (!this.seenN.has(io.Z)) { this.seenN.add(io.Z); pts += 10; txt = `НОВЫЙ АТОМ ${s} · ${elemOf(io.Z)[1].toLowerCase()}`; Sfx.play('fresh'); }
      if (e.by === 'auto') Uni.pay(this, 'rec', pts); else this.kn += pts; // атом собрала Вселенная — в сводку
      fxFlash(io.x, io.y, 1.4, c, .6);
      this.float(io.x, io.y - .8, `${txt} +${pts} ✦`, pts > 2 ? [255, 215, 110] : [140, 220, 255], pts > 2 ? 16 : 13);
    }
  },
  ionize(io, p) {
    io.ne--; this.st.ionized++;
    const a = Math.atan2(p.vy, p.vx) + randn() * .5, v = 12;
    this.el.push({ x: io.x, y: io.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, k: 1, slow: 0, brk: .5, by: null, age: 1 });
    fxFlash(io.x, io.y, .9, [255, 255, 255], .3);
    if (!this.ionMsg) { this.ionMsg = true; msg('Жёсткий свет выбил электрон — пока горячо, так будет'); }
  },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.seenN.size >= 2 && !this.rs.rec && this.doneAt === null ? [{ ic: '◎', name: 'Рекомбинация', about: 'электроны у ионов тормозят сами', c: A_COST }] : []; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs.rec = 1; Sfx.play('upgrade'); Uni.learn(this, 'rec', '◎', 'Рекомбинация', UNI_LVL);
    fxRing(P.x, P.y, 1, GOLD, viewRadius() * .8, 1.4); this.float(P.x, P.y - 1, '◎ Рекомбинация', GOLD, 16);
  },
  renderShop: Nuclei.renderShop,

  // ---------- задание ----------
  steps() {
    const n = this.neutral(), touch = isTouch();
    return [
      { t: 'Затормози электрон', h: touch ? 'проведи пальцем поперёк его пути' : 'зажми мышь и проведи поперёк его пути', s: 'электрон замедлился', d: this.st.brakes > 0 },
      { t: 'Одень ядра электронами', h: 'медленный электрон ион ловит сам; углероду нужно шесть', items: AT_NEED.map(Z => [atSym(Z), this.seenN.has(Z)]), s: 'H, He, C, N, O', d: AT_NEED.every(Z => this.seenN.has(Z)) },
      { t: 'Исследуй «Рекомбинация»', h: `${touch ? 'в лавке' : 'клавиша 1'} за ${A_COST} ✦`, s: 'рекомбинация', d: this.rs.rec > 0, res: 'rec' },
      { t: 'Нейтральная Вселенная', h: 'электроны садятся на ионы — помогай следом', p: [Math.min(90, Math.round(n * 100)), 90], s: 'Вселенная прозрачна', d: n >= A_GOAL },
    ];
  },
  starPool() {
    return [
      { t: 'свет не выбил ни одного электрона', bad: () => this.st.ionized > 0, atEnd: true },
      { t: 'один росчерк — 3 электрона', ok: () => this.st.best >= 3 },
      { t: 'быстрее 2:00', bad: () => this.clock > 120, atEnd: true },
      { t: 'кислород раньше углерода', ok: () => this.seenN.has(8) && !this.seenN.has(6), bad: () => this.seenN.has(6) && !this.seenN.has(8) },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 1, '★ +10 ✦', [255, 215, 110], 17); }); },
  tally() {
    const n = this.caps.hand + this.caps.auto, at = this.ions.filter(i => i.ne >= i.Z).length;
    return { name: 'Атомы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['нейтральных атомов', `${at} из ${this.ions.length}`], ['электроны — следом', this.caps.hand], ['электроны — Вселенная', this.caps.auto]], auto: [this.caps.auto, n], stars: this.stars };
  },
  cheat() { this.cheated = true; for (const io of this.ions) { io.ne = io.Z; this.seenN.add(io.Z); } this.st.brakes++; this.rs.rec = 1; },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    for (const p of this.ph) {
      const [sx, sy] = W2S(p.x, p.y);
      line(sx, sy, sx - p.vx * .05 * z, sy - p.vy * .05 * z, p.hard ? [235, 220, 255] : [255, 200, 140], (p.hard ? .6 : .25) * al, Math.max(1.2, .08 * z));
    }
    // след
    for (let i = 1; i < this.tr.length; i++) {
      const p = this.tr[i - 1], q = this.tr[i], k = 1 - (G.T - q.t) / TR_LIFE;
      const [x1, y1] = W2S(p.x, p.y), [x2, y2] = W2S(q.x, q.y);
      line(x1, y1, x2, y2, GOLD, .75 * k * al, 3 + 4 * k);
    }
    for (const io of this.ions) {
      const [sx, sy] = W2S(io.x, io.y); if (!onScreen(sx, sy, 60)) continue;
      const a = al * clamp(io.age * 2, 0, 1), c = atCol(io.Z), r = (.3 + .06 * io.Z) * z, Q = io.Z - io.ne;
      if (Q <= 0) glow(sx, sy, r * 3.2, c, .22 * a);
      else ring(sx, sy, (.95 + .08 * Q) * z, [255, 255, 255], .12 * a, 1, [3, 4]); // зона захвата
      ball(sx, sy, r, c, a);
      for (let i = 0; i < io.ne; i++) {
        const inner = i < 2, n = inner ? Math.min(io.ne, 2) : io.ne - 2, k = inner ? i : i - 2;
        const R = (inner ? .55 : .95) * z + r, an = io.rot * (inner ? 1.4 : .9) + k / n * TAU;
        ball(sx + Math.cos(an) * R, sy + Math.sin(an) * R, Math.max(1.4, .09 * z), [200, 235, 255], a);
      }
      label(atSym(io.Z) + (Q > 0 ? (Q > 1 ? sup(Q) : '') + '⁺' : ''), sx, sy - r - (io.ne > 2 ? 1.2 : .8) * z, 12, Q > 0 ? [210, 215, 235] : [255, 255, 255], .85 * a, 700);
    }
    for (const e of this.el) {
      const [sx, sy] = W2S(e.x, e.y); if (!onScreen(sx, sy, 20)) continue;
      const a = al * clamp(e.age * 2, 0, 1);
      if (e.slow > 0) { glow(sx, sy, Math.max(5, .45 * z), [170, 255, 210], .6 * a); ball(sx, sy, Math.max(1.6, .1 * z), [230, 255, 240], a); }
      else { line(sx, sy, sx - e.vx * .05 * z, sy - e.vy * .05 * z, [120, 190, 255], .4 * a, Math.max(1, .07 * z)); glow(sx, sy, Math.max(3, .3 * z), [120, 200, 255], .55 * a); ball(sx, sy, Math.max(1.2, .08 * z), [200, 235, 255], a); }
    }
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    if (G.started && !G.paused && !G.prev && this.doneAt === null && this.st.brakes === 0 && !this.tr.length) {
      // подсказка: ближайший к центру быстрый электрон
      const e = this.el.filter(e => e.slow <= 0 && e.age > .5).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
      if (e) { const [sx, sy] = W2S(e.x, e.y); ring(sx, sy, 14 + 3 * Math.sin(G.T * 5), GOLD, .8 * al, 2); label('проведи поперёк его пути', sx, sy + 30, 13, [255, 255, 255], .85 * al, 700); }
    }
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  overlay(al) {
    // туман: пока горячо, свет рассеивается на свободных электронах
    const fog = .4 * smooth(.35, .9, this.Ta) * al;
    if (fog > .01) { ctx.fillStyle = `rgba(255,170,110,${fog * .4})`; ctx.fillRect(0, 0, G.W, G.H); }
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 5', this.steps(), this.stars, 'Вселенная нейтральна');
    hudBanner(this.banner, 'УРОВЕНЬ 5 · остывший выброс', 'Атомы', 'одень голые ядра электронами', al, 'ядро + электроны → атомы → из атомов сложатся молекулы');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return A_VIEW; },
  hud() { return { title: '', sub: `T ≈ ${Math.round(400 + 5000 * this.Ta)} K`, lines: [], goal: '', laws: [] }; },
};
