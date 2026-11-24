"use strict";
/* Уровень 3. Ядра — нуклеосинтез, ~3 минуты после Большого взрыва.
   Материал — твои протоны и нейтроны с уровня адронов: барионы на смене экрана становятся нуклонами
   на тех же местах. Новых нуклонов не появляется.
   Игрок — тот же детектор с полем (как на уровнях частиц и адронов):
   - зажать — поле берёт до двух ядер, они кружат у детектора, энергия столкновения растёт;
   - отпустить — сталкиваются лоб в лоб; отпустить на ходу — бросок в первое встречное ядро.
   Физика (упрощённо, но по-настоящему):
   - n + p → ²H; ²H + n → ³H; ²H + p → ³He; ³H + p, ³He + n → ⁴He; ²H + ²H → ³He + n или ³H + p;
     ³H + ²H → ⁴He + n; ³He + ²H → ⁴He + p; ³He + ³He → ⁴He + 2p; ³H + ³H → ⁴He + 2n;
     ⁴He + ²H → ⁶Li; ⁴He + ³H → ⁷Li; ⁴He + ³He → ⁷Be; ⁷Li + p → две альфы.
   - Кулоновский барьер ~ Z₁·Z₂: заряженным ядрам нужен разгон (держи поле дольше); с нейтроном барьера нет.
   - Ядер с массой 5 нет; ⁸Be сразу разваливается на две альфы; p + p и n + n не связаны.
   - Жёсткие γ разбивают хрупкие ядра (²H, ³H, ³He), пока Вселенная горячая («бутылочное горлышко»).
     Ядро в поле детектора γ не трогают.
   - Свободный нейтрон распадается (n → p + e⁻): спрячь его в ядро.
   - Окно синтеза ~100 с: Вселенная остывает, и реакции прекращаются. */
const ELEM = [['n', 'Нейтрон', 0], ['H', 'Водород', 1], ['He', 'Гелий', 0], ['Li', 'Литий', 1], ['Be', 'Бериллий', 2], ['B', 'Бор', 3],
  ['C', 'Углерод', 4], ['N', 'Азот', 3], ['O', 'Кислород', 2], ['F', 'Фтор', 1], ['Ne', 'Неон', 0], ['Na', 'Натрий', 1], ['Mg', 'Магний', 2]];
const elemOf = Z => ELEM[clamp(Z, 0, ELEM.length - 1)];
const NR = .8; // радиус нуклона в масштабе уровня атомов (части ядра передаются туда)
const NU_R = .42, N_WIN = 100, N_PAR = 60, N_WR = 8, N_EMAX = 4.6, N_CHARGE = 2.2, N_THROW_V = 5;
const NUC_NAME = {
  '1,0': ['p', 'протон'], '0,1': ['n', 'нейтрон'], '1,1': ['²H', 'дейтерий'], '1,2': ['³H', 'тритий'], '2,1': ['³He', 'гелий-3'],
  '2,2': ['⁴He', 'гелий-4'], '3,3': ['⁶Li', 'литий-6'], '3,4': ['⁷Li', 'литий-7'], '4,3': ['⁷Be', 'бериллий-7'],
};
const N_BIND = { '1,1': 1, '1,2': 2.6, '2,1': 2.4 }; // энергия связи хрупких ядер: γ сильнее — разбивает
const nkey = o => o.Z + ',' + o.N;
const N_COL = { n: [170, 170, 185], e: [140, 205, 255] };

const Nuclei = {
  key: 'nuclei', name: 'Ядра', bg: [22, 8, 40], controls: '',

  enter(prev) {
    this.o = []; this.g = []; this.el = []; this.floats = []; this.t = 0; this.clock = 0; this.doneAt = null; this.endCd = -1;
    this.kn = 0; this.banner = -1.5; this.focus = null; this.holding = false; this.hold = 0; this.learn = {};
    this.res = null; this.advanced = false; this.cheated = false; this.gT = 0; this.spCd = 0; this.seen = new Set(); this.tk = {};
    this.st = { decayed: 0, broken: 0, bounce: 0 };
    this.hr = prev && prev.hr != null ? (typeof prev.hr === 'function' ? prev.hr() : prev.hr) : 1.4;
    // барионы уровня адронов становятся нуклонами там же, где были
    if (prev && prev.groups) for (const grp of prev.groups.values()) {
      if (grp.kind !== 'p' && grp.kind !== 'n') continue;
      const c = centroid(grp.m), v = grp.m.reduce((s, q) => [s[0] + q.vx / 3, s[1] + q.vy / 3], [0, 0]);
      const o = this.mk(grp.kind === 'p' ? 1 : 0, grp.kind === 'n' ? 1 : 0, c.x, c.y, v[0], v[1]); o.src = grp;
    }
    if (!this.o.length) { // запуск прямо с этого уровня
      P.x = P.y = P.vx = P.vy = 0;
      for (let i = 0; i < 9; i++) { const a = Math.random() * TAU, d = rnd(1.5, 5); this.mk(i < 5 ? 1 : 0, i < 5 ? 0 : 1, Math.cos(a) * d, Math.sin(a) * d, randn() * .4, randn() * .4); }
    }
    this.nB = this.o.length; this.nN = this.o.filter(o => o.N).length;
    this.C = centroid(this.o);
    for (const o of this.o) if (o.N) o.life = rnd(50, 75);
    for (const o of this.o) this.seen.add(nkey(o));
    this.stars = pickStars(this.starPool());
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); },
  // ядро: Z протонов, N нейтронов; нуклоны уложены спиралью
  mk(Z, N, x, y, vx = 0, vy = 0) {
    const A = Z + N, parts = [];
    for (let k = 0, p = Z, n = N; k < A; k++) { const t = (k % 2 === 0 ? p > 0 : n <= 0) ? 'p' : 'n'; if (t === 'p') p--; else n--; parts.push(t); }
    const lay = parts.map((t, k) => { const r = k ? NU_R * 1.3 * Math.sqrt(k) : 0, a = k * 2.4; return { t, lx: Math.cos(a) * r, ly: Math.sin(a) * r }; });
    const o = { Z, N, x, y, vx, vy, lay, rad: Math.max(...lay.map(p => Math.hypot(p.lx, p.ly))) + NU_R, age: 0, dead: false, cap: false, nb: 0, fly: 0, rot: Math.random() * TAU, life: Infinity };
    this.o.push(o); return o;
  },
  T() { return Math.exp(-this.t / 35); }, // температура в долях от начальной
  fr() { return this.hr * 1.5; },
  barrier(a, b) { return a.Z * b.Z; },
  free(o) { return !o.dead && !o.cap && !(o.fly > 0); },

  // ---------- реакции ----------
  // что получится из a + b: список продуктов [Z, N] или причина, почему не связались
  outcome(a, b) {
    const Z = a.Z + b.Z, N = a.N + b.N, A = Z + N, k = Z + ',' + N, he = o => o.Z === 2 && o.N === 2, d = o => o.Z === 1 && o.N === 1;
    if (A === 2 && Z !== 1) return { why: Z ? 'p + p не связаны' : 'n + n не связаны' };
    if (d(a) && d(b)) return { out: Math.random() < .5 ? [[2, 1], [0, 1]] : [[1, 2], [1, 0]] };
    if (A === 5) return he(a) || he(b) ? { why: 'ядер с массой 5 нет' } : { out: [[2, 2], Z === 3 ? [1, 0] : [0, 1]] };
    if (k === '4,2') return { out: [[2, 2], [1, 0], [1, 0]] };
    if (k === '2,4') return { out: [[2, 2], [0, 1], [0, 1]] };
    if (k === '4,4') return { out: [[2, 2], [2, 2]], why2: '⁸Be → две альфы' };
    if (NUC_NAME[k] && A <= 7) return { out: [[Z, N]] };
    return { why: 'такие не связываются' };
  },
  bounce(a, b, txt) {
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    a.vx = -dx / d * 2.2; a.vy = -dy / d * 2.2; b.vx = dx / d * 2.2; b.vy = dy / d * 2.2;
    a.fly = b.fly = 0; a.mate = b.mate = null; a.nb = b.nb = 1;
    fxRing(x, y, .2, [255, 140, 120], 1.2, .5);
    this.float(x, y, txt, [255, 160, 140], 13);
  },
  // реакция; hand — сделал игрок (поле или бросок)
  react(a, b, E, hand) {
    if (E < this.barrier(a, b)) { this.bounce(a, b, 'барьер — нужен разгон'); this.st.bounce++; this.learn.bar = true; return false; }
    const r = this.outcome(a, b);
    if (!r.out) { this.bounce(a, b, r.why); return false; }
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, vx = (a.vx + b.vx) / 4, vy = (a.vy + b.vy) / 4;
    a.dead = b.dead = true;
    const a0 = Math.random() * TAU;
    r.out.forEach(([Z, N], i) => {
      const an = a0 + i * TAU / r.out.length, sp = r.out.length > 1 ? 2.4 : 0;
      const o = this.mk(Z, N, x + Math.cos(an) * .3 * (r.out.length > 1), y + Math.sin(an) * .3 * (r.out.length > 1), vx + Math.cos(an) * sp, vy + Math.sin(an) * sp);
      o.age = 1; o.nb = .8; if (Z === 0) o.life = Math.min(a.life, b.life, rnd(40, 60));
      this.made(o, i);
    });
    fxFlash(x, y, 1.2, [255, 240, 200], .45);
    fxRing(x, y, .3, [255, 220, 150], 2.2, .6);
    if (r.why2) this.float(x, y + .6, r.why2, [255, 200, 150], 13);
    if (hand) this.learn.smash = true;
    return true;
  },
  // родилось ядро: новое — +10 ✦, гелий — +5, литий и бериллий — +15
  made(o, i) {
    const k = nkey(o), nm = NUC_NAME[k];
    if (!nm || o.Z + o.N < 2) return;
    let pts = 0, txt = '';
    if (!this.seen.has(k)) { this.seen.add(k); pts += 10; txt = `НОВОЕ ${nm[0]} ${nm[1]}`; }
    if (k === '2,2') pts += 5; else if (o.Z >= 3) pts += 15;
    if (!pts) return;
    this.kn += pts;
    this.float(o.x, o.y - .3 * i, `${txt || nm[0]} +${pts} ✦`, txt ? [255, 215, 110] : [140, 220, 255], txt ? 16 : 14);
  },
  // γ-квант разбивает хрупкое ядро
  photodis(o, g) {
    const k = nkey(o);
    if (!(g.E > N_BIND[k])) return false;
    o.dead = true;
    const parts = k === '1,1' ? [[1, 0], [0, 1]] : k === '1,2' ? [[1, 1], [0, 1]] : [[1, 1], [1, 0]], a = Math.atan2(g.vy, g.vx) + Math.PI / 2;
    parts.forEach(([Z, N], i) => {
      const s = i ? -1 : 1, n = this.mk(Z, N, o.x + Math.cos(a) * .3 * s, o.y + Math.sin(a) * .3 * s, o.vx + Math.cos(a) * 2.5 * s, o.vy + Math.sin(a) * 2.5 * s);
      n.age = 1; n.nb = 1; if (Z === 0) n.life = rnd(35, 55);
    });
    fxFlash(o.x, o.y, 1.4, [255, 255, 230], .4);
    this.float(o.x, o.y, `γ разбил ${NUC_NAME[k][0]}`, [255, 240, 170], 14);
    this.st.broken++;
    return true;
  },
  decayN(o) {
    o.Z = 1; o.N = 0; o.lay[0].t = 'p'; o.life = Infinity;
    const a = Math.random() * TAU;
    this.el.push({ x: o.x, y: o.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, age: 0 });
    fxRing(o.x, o.y, .3, [140, 255, 160], 1.6, .6);
    this.float(o.x, o.y, 'n → p + e⁻', [255, 150, 130], 13);
    this.st.decayed++;
  },

  // ---------- поле ----------
  input(dt) {
    if (mouse.clicked) { mouse.clicked = false; this.holding = true; this.hold = 0; }
    if (this.holding && !mouse.down) { this.holding = false; this.release(); }
    if (this.holding) { this.hold += dt; if (this.hold > .12 && !this.focus) this.focus = { cap: [], q: 0, ang: Math.random() * TAU }; }
  },
  E() { return this.focus ? N_EMAX * this.focus.q : 0; },
  tickFocus(dt) {
    const f = this.focus; if (!f) return;
    f.cap = f.cap.filter(o => !o.dead && o.cap);
    if (f.cap.length < 2 && !G.prev) {
      let best = null, bd = this.fr();
      for (const o of this.o) {
        if (!this.free(o) || o.age < .4) continue;
        const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; best = o; }
      }
      if (best) { best.cap = true; best.mate = null; f.cap.push(best); }
    }
    if (f.cap.length) f.q = Math.min(1, f.q + dt / N_CHARGE);
    if (f.cap.length === 2) this.learn.hold = true;
    f.ang += dt * (1.8 + 5 * f.q);
    const pv = Math.hypot(P.vx, P.vy), lag = Math.min(.6, pv * .05) / (pv || 1);
    const ro = f.cap.length === 2 ? Math.max(this.hr * .42, (f.cap[0].rad + f.cap[1].rad) / 2 + .12) : 0;
    f.cap.forEach((o, k) => {
      const a = f.ang + k * Math.PI, tx = P.x + Math.cos(a) * ro - P.vx * lag, ty = P.y + Math.sin(a) * ro - P.vy * lag;
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), step = (4 + pv) * dt;
      if (d > step) { o.x += dx / d * step; o.y += dy / d * step; } else { o.x = tx; o.y = ty; }
      o.vx = P.vx; o.vy = P.vy;
    });
  },
  // отпустил: двое сталкиваются лоб в лоб; на ходу — летят вперёд и бьют первое встречное ядро
  release() {
    const f = this.focus; this.focus = null; if (!f) return;
    const c = f.cap.filter(o => !o.dead), E = N_EMAX * f.q;
    c.forEach(o => { o.cap = false; o.E = E; });
    if (!c.length) return;
    if (Math.hypot(P.vx, P.vy) > N_THROW_V) {
      const base = Math.atan2(P.vy, P.vx);
      c.forEach((o, k) => {
        const an = base + (c.length > 1 ? (k ? .12 : -.12) : 0);
        o.vx = Math.cos(an) * 6.5; o.vy = Math.sin(an) * 6.5; o.fly = 1.4; o.thrown = true; o.sib = c[1 - k] || null; o.mate = null;
      });
      fxRing(P.x, P.y, this.hr * .4, GOLD, this.hr * .9, .35);
      this.learn.throw = true;
      return;
    }
    if (c.length < 2) { c[0].vx = P.vx * .5; c[0].vy = P.vy * .5; return; }
    const [a, b] = c, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    for (const o of c) { const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1; o.vx = dx / d * 4; o.vy = dy / d * 4; o.fly = .8; }
    a.mate = b; b.mate = a;
  },

  // ---------- шаг ----------
  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
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
    const Tn = this.T(), trans = G.prev && G.prev.key === 'quarks';
    // γ-кванты: чем горячее, тем чаще и жёстче
    if (live && this.doneAt === null) {
      this.gT += dt * 3 * Tn;
      while (this.gT > 1) {
        this.gT--;
        const R = viewRadius(), a = Math.random() * TAU, h = a + Math.PI + randn() * .35;
        this.g.push({ x: P.x + Math.cos(a) * R * 1.05, y: P.y + Math.sin(a) * R * 1.05, vx: Math.cos(h) * 18, vy: Math.sin(h) * 18, E: 3.5 * Tn * Math.random(), t: 0 });
      }
    }
    for (const g of this.g) {
      g.x += g.vx * dt; g.y += g.vy * dt; g.t += dt;
      if (!act || g.dead) continue;
      for (const o of this.o) if (this.free(o) && N_BIND[nkey(o)] && (o.x - g.x) ** 2 + (o.y - g.y) ** 2 < o.rad * o.rad) { if (this.photodis(o, g)) { g.dead = true; break; } }
    }
    this.g = this.g.filter(g => !g.dead && g.t < 2.5);
    for (const e of this.el) { e.age += dt; e.x += e.vx * dt; e.y += e.vy * dt; const k = Math.exp(-dt * .5); e.vx *= k; e.vy *= k; }
    // ядра: тепловое дрожание, мягкая стенка вокруг облака
    for (const o of this.o) {
      if (o.dead) continue;
      o.age += dt; o.nb -= dt; o.rot += dt * .6;
      if (trans && o.src) { const c = centroid(o.src.m); o.x = c.x; o.y = c.y; continue; } // пока гаснут кварки — нуклон на месте бариона
      if (o.cap) continue;
      if (o.fly > 0) { o.fly -= dt; if (o.fly <= 0) { o.thrown = false; o.mate = null; o.sib = null; } }
      else {
        const j = (.25 + .5 * Tn) * Math.sqrt(dt); o.vx += randn() * j; o.vy += randn() * j;
        const k = Math.exp(-dt * .6); o.vx *= k; o.vy *= k;
        const dx = o.x - this.C.x, dy = o.y - this.C.y, d = Math.hypot(dx, dy);
        if (d > N_WR) { o.vx -= dx / d * 4 * dt; o.vy -= dy / d * 4 * dt; }
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (act && o.Z === 0 && o.N === 1 && (o.life -= dt) <= 0) this.decayN(o);
    }
    if (act) {
      for (const o of this.o) {
        if (o.dead || !(o.fly > 0)) continue;
        const m = o.mate;
        if (m && !m.dead && Math.hypot(m.x - o.x, m.y - o.y) < (o.rad + m.rad) * .75) { this.react(o, m, o.E || 0, true); continue; }
        if (!o.thrown) continue;
        for (const q of this.o) {
          if (q === o || q === o.sib || q.dead || q.cap || q.age < .4) continue;
          if (Math.hypot(q.x - o.x, q.y - o.y) < (o.rad + q.rad) * .8) { this.react(o, q, o.E || 0, true); break; }
        }
      }
      this.spontaneous(dt);
    }
    this.o = this.o.filter(o => !o.dead);
    if (!live) return;
    if (this.doneAt === null) this.tickStars(false);
    if (this.doneAt === null && (this.allDone() || this.t > N_WIN)) {
      this.doneAt = this.clock; this.endCd = 1.6; this.release(); this.holding = false;
      if (!this.allDone()) this.float(P.x, P.y - this.hr - .5, 'остыло — синтез окончен', [200, 210, 240], 16);
      this.tickStars(true);
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; addScore(this.Y() * 2000); this.handoff(); advance(); } // итоги — сбоку, без паузы
  },
  // после твоей первой реакции ядра изредка сливаются и сами — только с нейтроном (без барьера)
  spontaneous(dt) {
    if (!this.learn.smash || (this.spCd -= dt) > 0) return;
    const f = this.o.filter(o => this.free(o) && o.nb <= 0 && o.age > 1);
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) > (a.rad + b.rad) * .8 || this.barrier(a, b) > 0) continue;
      a.nb = b.nb = 1;
      if (Math.random() < .4 && this.outcome(a, b).out) { this.react(a, b, 0, false); this.spCd = 2.5; return; }
    }
  },
  counts() {
    const c = { n: 0, mid: 0, he: 0, p: 0 };
    for (const o of this.o) { const k = nkey(o); if (k === '0,1') c.n++; else if (k === '1,0') c.p++; else if (k === '2,2') c.he++; else if (k === '1,1' || k === '1,2' || k === '2,1') c.mid++; }
    c.he3 = this.o.filter(o => nkey(o) === '2,1').length;
    return c;
  },
  // всё, что могло стать гелием, стало: нет свободных нейтронов, ²H, ³H и пары ³He
  allDone() { const c = this.counts(); return c.n === 0 && c.mid - c.he3 === 0 && c.he3 < 2; },
  // доля массы в ядрах тяжелее водорода (гелий и всё, что из него выросло)
  Y() { let m = 0; for (const o of this.o) if (o.Z >= 2) m += o.Z + o.N; return m / Math.max(1, this.nB); },

  // ---------- задание и испытания ★ ----------
  steps() {
    const c = this.counts();
    return [
      { t: 'Сделай дейтерий', h: 'слей протон и нейтрон: зажми возле них и отпусти', s: 'дейтерий', d: this.seen.has('1,1') },
      { t: 'Сделай гелий-4', h: 'добавляй к дейтерию нейтроны и протоны — протонам нужен разгон, держи поле дольше', s: 'гелий-4', d: this.seen.has('2,2') },
      { t: 'Спрячь нейтроны в гелий', h: 'пока они не распались', items: [[`свободных n — ${c.n}`, c.n === 0], [`недостроенных ядер — ${c.mid}`, c.mid === 0]], s: 'всё в гелии', d: this.allDone() },
    ];
  },
  starPool() {
    const st = this.st;
    return [
      { t: 'ни один нейтрон не распался', bad: () => st.decayed > 0, atEnd: true },
      { t: 'γ не разбил ни одного ядра', bad: () => st.broken > 0, atEnd: true },
      { t: 'без отскоков от барьера', bad: () => st.bounce > 0, atEnd: true },
      { t: 'быстрее 1:00', bad: () => this.clock > 60, atEnd: true },
      { t: 'сделай литий или бериллий', ok: () => ['3,3', '3,4', '4,3'].some(k => this.seen.has(k)), can: () => this.nN >= 3 && this.nB >= 6 },
      { t: 'гелий Y ≥ 25 %', ok: () => this.Y() >= .25, can: () => this.nN >= 2 && this.nN * 2 / this.nB >= .25 },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - this.hr - .4, '★ +10 ✦', [255, 215, 110], 17); }); },

  tally() {
    const c = this.counts();
    return { name: 'Ядра', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['⁴He · p', `${c.he} · ${c.p}`], ['гелий по массе', Math.round(this.Y() * 100) + ' %'], ['✦ добыто', Math.round(this.kn)]], auto: null, stars: this.stars };
  },
  // ---------- итоги и переход к атомам (старая модальная карточка; итоги теперь — Tally сбоку) ----------
  showResultCard() {
    const t = this.doneAt, pts = Math.round(this.kn), Y = Math.round(this.Y() * 100), bonus = Y * 2, total = pts + bonus, won = starsWon(this.stars);
    const e = { n: LB.name(), s: total, p: pts, t: t === null ? null : Math.floor(t), d: Date.now() };
    const c = this.counts();
    const html = `<div class="ek">Уровень 3 · ${c.he} ⁴He · ${c.p} p</div><div class="en">Ядра</div>` +
      `<div class="rs"><div><span>⏱</span>${fmtClock(t)}</div><div><span>✦</span>${pts}</div>` +
      `<div><span>гелий Y = ${Y} % × 2</span>+${bonus}</div><div class="tot"><span>итог</span>${total}</div></div>` +
      `<div class="er" style="margin:-4px 0 10px">Во Вселенной гелия по массе ~25 %: остальное — водород.</div>` +
      `<div class="st">${this.stars.map(s => `<b class="${s.st === 1 ? 'y' : 'n'}">${s.st === 1 ? '★' : '✗'} ${s.t}</b>`).join('')}<small>★ ${won}/${this.stars.length} · испытания в каждом забеге новые</small></div>` +
      lbTable('nuclei', e, this.cheated) + `<button class="go">Дальше — атомы</button>`;
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
    if (this.res && !this.advanced) { this.advanced = true; this.res = null; this.handoff(); advance(); }
  },
  // Атомам: твоё ядро — самое тяжёлое с химией (Li, Be), иначе водород; остальные ядра — ионы вокруг
  handoff() {
    const pick = [...this.o].filter(o => elemOf(o.Z)[2] > 0).sort((a, b) => b.Z - a.Z || b.N - a.N)[0];
    const Z = pick ? pick.Z : 1, N = pick ? pick.N : 0, parts = [];
    for (let k = 0; k < Z + N; k++) { const a = k * 2.4, r = .9 * Math.sqrt(k); parts.push({ t: k < Z ? 'p' : 'n', lx: Math.cos(a) * r, ly: Math.sin(a) * r }); }
    this.nuc = { Z, N, parts };
    this.e = this.o.filter(o => o !== pick && o.Z > 0).map(o => ({ type: o.Z === 1 ? 'p' : 'a', x: o.x, y: o.y, vx: o.vx, vy: o.vy }))
      .concat(this.el.map(e => ({ type: 'e', x: e.x, y: e.y, vx: e.vx, vy: e.vy })));
  },
  cheat() {
    this.cheated = true;
    for (const o of this.o) o.dead = true;
    this.o = [];
    const nHe = Math.floor(this.nN / 2);
    for (let i = 0; i < nHe; i++) this.made(this.mk(2, 2, P.x + i * 1.5, P.y + 2), 0);
    for (let i = 0; i < this.nB - nHe * 4; i++) this.mk(1, 0, P.x - 2 - i, P.y - 2);
    this.seen.add('1,1');
  },

  // ---------- рисование ----------
  drawNuc(o, al) {
    const [sx, sy] = W2S(o.x, o.y), z = cam.z;
    if (!onScreen(sx, sy, o.rad * z + 40)) return;
    const a = al * Math.min(1, o.age * 2 + (o.src ? 1 : 0));
    ctx.globalAlpha = a;
    const c = Math.cos(o.rot), s = Math.sin(o.rot);
    for (const p of o.lay) drawNucleon(sx + (p.lx * c - p.ly * s) * z, sy + (p.lx * s + p.ly * c) * z, NU_R * z, p.t, G.T * .8);
    ctx.globalAlpha = 1;
    if (o.Z + o.N > 1) label(NUC_NAME[nkey(o)][0], sx, sy - (o.rad + .3) * z, 12, [255, 255, 255], .8 * a, 700);
    // свободный нейтрон: дуга оставшейся жизни, последние 10 с — красная
    if (o.Z === 0 && o.life < Infinity) {
      const k = clamp(o.life / 60, 0, 1), warn = o.life < 10;
      arc(sx, sy, (NU_R + .16) * z, -Math.PI / 2, -Math.PI / 2 + TAU * k, warn ? [255, 120, 110] : N_COL.n, (warn ? .6 + .4 * Math.sin(G.T * 10) : .6) * a, 2);
    }
    if (o.thrown) glow(sx, sy, o.rad * z * 1.6, GOLD, .25 * a);
  },
  draw(al) {
    const z = cam.z;
    for (const g of this.g) {
      const [sx, sy] = W2S(g.x, g.y), c = g.E > 2.4 ? [220, 200, 255] : g.E > 1 ? [255, 255, 230] : [255, 190, 120];
      line(sx, sy, sx - g.vx * .1 * z, sy - g.vy * .1 * z, c, .75 * al, Math.max(1.5, z * .06));
    }
    for (const e of this.el) { const [sx, sy] = W2S(e.x, e.y); glow(sx, sy, 8, N_COL.e, .5 * al); ball(sx, sy, 2.5, [200, 235, 255], al); }
    for (const o of this.o) this.drawNuc(o, al);
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, r = this.hr * z, f = this.focus;
    ctx.globalAlpha = al;
    ring(sx, sy, r, [255, 255, 255], .5, 1.5, [6, 6]);
    if (f) {
      ring(sx, sy, this.fr() * z, FIELD_C, .35, 1.5, [6, 6]);
      for (const o of f.cap) { const [ox, oy] = W2S(o.x, o.y); line(ox, oy, sx, sy, GOLD, .6, 1.8); }
      // шкала энергии; при двух ядрах — риска барьера: золото — хватит, красный — нужен разгон
      const R = r + 7;
      arc(sx, sy, R, -Math.PI / 2, Math.PI * 1.5, [255, 255, 255], .12, 4);
      if (f.cap.length === 2) {
        const B = this.barrier(f.cap[0], f.cap[1]), ok = this.E() >= B, bq = B / N_EMAX;
        arc(sx, sy, R, -Math.PI / 2, -Math.PI / 2 + TAU * f.q, ok ? GOLD : [255, 130, 110], .9, 4);
        if (B > 0) { const a = -Math.PI / 2 + TAU * Math.min(bq, 1); line(sx + Math.cos(a) * (R - 7), sy + Math.sin(a) * (R - 7), sx + Math.cos(a) * (R + 7), sy + Math.sin(a) * (R + 7), [255, 255, 255], .9, 2); }
        const out = this.outcome(f.cap[0], f.cap[1]);
        if (!out.out) label('✗ ' + out.why, sx, sy - R - 14, 13, [255, 160, 140], .9, 700);
      } else if (f.cap.length) arc(sx, sy, R, -Math.PI / 2, -Math.PI / 2 + TAU * f.q, FIELD_C, .8, 4);
    }
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    this.drawHint(sx, sy, r);
    this.drawArrows();
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); label(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  drawHint(sx, sy, r) {
    if (!G.started || G.paused || this.doneAt !== null || G.prev) return;
    const f = this.focus; let t = null;
    if (f && f.cap.length === 2 && this.E() < this.barrier(f.cap[0], f.cap[1])) t = 'держи — протонам нужен разгон';
    else if (f && f.cap.length === 2 && !this.learn.smash) t = 'отпусти — столкнуть';
    else if (!this.learn.hold) t = 'зажми — притянуть ядра';
    if (t) label(t, sx, sy + Math.max(r, this.fr() * cam.z) + 22, 14, [255, 255, 255], .75 + .2 * Math.sin(G.T * 4), 700);
  },
  drawArrows() {
    if (this.doneAt !== null) return;
    edgeArrows(this.o.filter(o => o.Z === 0 || N_BIND[nkey(o)]).map(o => [o.x, o.y, o.Z === 0 ? N_COL.n : (NUC_NAME[nkey(o)] || ['?'])[0]]), 3);
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > N_PAR ? [190, 190, 205] : [255, 255, 255], Math.round(this.kn), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 3', this.steps(), this.stars, `Гелий по массе: ${Math.round(this.Y() * 100)} %`);
    hudBanner(this.banner, 'УРОВЕНЬ 3 · 3 минуты', 'Ядра', `${this.nB} твоих нуклонов → гелий, пока Вселенная горячая`, al);
    ctx.globalAlpha = 1;
  },
  viewR() { return Math.max(5.5, 3.6 + this.hr * 1.4); },
  hud() { return { title: '', sub: `T ≈ ${(this.T() * 1.2).toFixed(1)}·10⁹ K`, lines: [], goal: '', laws: [] }; },
};
