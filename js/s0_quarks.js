"use strict";
/* Уровень 2. Адроны: из кварк-глюонной плазмы — протоны и нейтроны.
   Материал — сначала те кварки, что ты сберёг в эпохе аннигиляции (они вылетают из детектора), а дальше
   кварки со всей Вселенной приходят из-за края (у тебя — лишь кусочек плазмы).
   Автоматизация: собери HAND_Q барионов полем — и исследуй «Конфайнмент сам»: Вселенная начинает сама
   стягивать тройки R·G·B в барионы. Когда она собрала AUTO_Q — уровень пройден: дальше без тебя.
   Физика:
   - Пока плазма горячая (T > ~180 МэВ), кварки свободны и не слипаются.
   - Остыла — конфайнмент: кварки связываются струнами в бесцветные состояния.
   - Барион = три разных цвета. uud — протон, udd — нейтрон; uuu/ddd — Δ, тут же распадается.
   - Струна рвётся при сильном растяжении, рождая пару кварк–антикварк; кварк + антикварк = мезон, он нестабилен.
   Глагол игрока — то же поле, что на уровне частиц: зажать — собрать кварки, три разных цвета слипаются. */
const QCOL = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
const QANTI = [[60, 230, 240], [240, 90, 240], [250, 225, 70]]; // анти-красный = голубой и т.д.
const QR = .26, BIND = .62, D0 = .55, KSTR = 9, DBREAK = 2.6;
const Q_PAR = 60, Q_T0 = 4.6; // эталон времени, стартовая T (10¹² K ≈ 400 МэВ); мир без края — кварки приходят из-за края кадра
const HAND_Q = 3, AUTO_Q = 5, CONF_COST = 25, FLOW_N = 9; // барионов руками, Вселенной, цена исследования, свободных кварков в притоке
// FLOW_MAX — больше свободных не копится: лишние уходят за край; недостающий цвет приходит всегда (тупика без зелёных нет)
const FLOW_MAX = 16, PAIR_CD = 3.2, ANTI_MAX = 3, MESON_T = 3.5, EXO_T = 3.2, EXO_PTS = 20;
// «Адронный зоопарк» — ключи кодекса 'h:…'. Экзотику собирают полем из двух адронов: зажми на адроне — возьмёшь целиком.
const HADRON = {
  p: ['p⁺', 'протон', 'uud'], n: ['n⁰', 'нейтрон', 'udd'], delta: ['Δ', 'дельта-барион', 'uuu или ddd'], meson: ['π', 'пион', 'кварк + антикварк'],
  qq: ['qq', 'дикварк', 'два кварка разных цветов'], tetra: ['qqq̄q̄', 'тетракварк', 'два мезона вместе'],
  penta: ['qqqqq̄', 'пентакварк', 'барион + мезон'], hexa: ['6q', 'гексакварк', 'два бариона вместе'],
};
const EXO = { tetra: 1, penta: 1, hexa: 1 };
const HOLDABLE = { p: 1, n: 1, meson: 1 };

const Quarks = {
  key: 'quarks', name: 'Адроны', bg: [34, 6, 26], controls: '',

  enter(prev) {
    this.q = []; this.groups = new Map(); this.gid = 1; this.t = 0;
    this.temp = Q_T0; this.conf = 0; this.advanced = false; this.res = null; this.cheated = false;
    this.focus = null; this.holding = false; this.hold = 0; this.learn = {}; this.floats = [];
    this.kn = 0; this.uni = []; this.clock = 0; this.doneAt = null; this.endCd = -1; this.banner = -1.5; this.made = { p: 0, n: 0 }; this.mine = 0;
    this.st = { passive: 0, delta: 0 }; this.tk = {};
    this.spent = 0; this.rs = { conf: 0 }; this.handN = 0; this.autoN = 0; this.flowCd = 1; this.asm = null; this.asmCd = 0; this.pairCd = 2;
    this.st.exo = 0; this.hover = null;
    this.hr = prev && prev.hr ? prev.hr() : 1.4;
    const src = prev && prev.handoff || [];
    // сбережённые кварки вырываются из детектора там же, где кружили, оставляя треки, и растут до размера кварка
    const sz0 = clamp(4.5 / (QR * cam.z), .08, 1);
    for (const h of src) { const q = this.mk(h.x, h.y, h.col, false, h.fl); q.vx = h.vx; q.vy = h.vy; q.age = 1; q.sz = sz0; q.tr = [[h.x, h.y]]; q.mine = 1; }
    this.nSaved = src.length;
    if (!src.length) { P.x = P.y = P.vx = P.vy = 0; }
    this.C = { x: P.x, y: P.y };
    this.stars = null; // испытания ★ выбираются, когда известен материал
    // материал — только сбережённое; при запуске прямо с этого уровня кварки прилетают из-за края
    for (let i = this.q.length; i < (src.length ? 0 : 12); i++) {
      const r = rimPos(.5, zoomFor(this)), q = this.mk(r.x, r.y, i % 3, false, i % 3 === 1 ? 'd' : 'u'); // у края кадра этапа (камера ещё едет к нему)
      q.vx = r.nx * 2.5 + randn() * .5; q.vy = r.ny * 2.5 + randn() * .5; q.age = 0;
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
    if (m.length === 2 && m[0].anti !== m[1].anti) { grp.kind = 'meson'; grp.t = MESON_T; const c = centroid(m); this.zoo('meson', c.x, c.y); }
    else if (m.length === 3) {
      const u = m.filter(x => x.fl === 'u').length;
      grp.kind = u === 2 ? 'p' : u === 1 ? 'n' : 'delta';
      if (grp.kind === 'delta') { grp.t = 1.4; this.st.delta++; const c = centroid(m); this.zoo('delta', c.x, c.y); }
      if (m[0].anti) grp.kind = 'anti';
    } else grp.kind = 'forming';
  },
  // Барион собран: своими руками (полем) — дороже, сам слипся — дешевле
  onBaryon(grp) {
    const c = centroid(grp.m), hand = grp.m.some(x => x.cap || x.hand > 0);
    const pts = hand ? 10 : 4; if (!hand) this.st.passive++;
    if (hand) this.handN++;
    if (this.rs.conf) this.autoN++; // после исследования в шаг «по всей Вселенной» идут все барионы — и твои тоже
    if (!hand && this.rs.conf) Uni.pay(this, 'conf', pts); else this.kn += pts; // барионы Вселенной — в сводку «Законы Вселенной»
    this.made[grp.kind]++;
    if (!this.mine && hand) this.mine = grp.id;
    for (const x of grp.m) { x.cap = false; x.hand = 0; }
    fxRing(c.x, c.y, .4, [255, 255, 255], 2.5, .9);
    this.float(c.x, c.y, `${grp.kind === 'p' ? 'p⁺' : 'n⁰'} ✓ +${pts}`, hand ? [255, 215, 110] : [200, 220, 240], hand ? 16 : 13);
    if (hand) this.learn.bar = true;
    this.zoo(grp.kind, c.x, c.y - .5);
  },
  // новое в «зоопарке» адронов: в кодекс; экзотика ещё и приносит ✦
  zoo(k, x, y) {
    const key = 'h:' + k; if (Codex.has(key)) return false;
    Codex.note(key);
    const [sym, name] = HADRON[k], pts = EXO[k] ? EXO_PTS : 0;
    this.kn += pts;
    this.float(x, y - .6, `${sym} ${name} — в кодексе${pts ? ` +${pts} ✦` : ''}`, EXO[k] ? GOLD : [200, 230, 255], EXO[k] ? 16 : 13);
    Sfx.play('fresh');
    return true;
  },
  detach(q) {
    if (!q || !q.g) return; // X с клавиатуры зовёт без аргумента
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
    if (this.holding) {
      this.hold += dt;
      if (this.hold > .12 && !this.focus) {
        this.focus = { cap: [], had: [], ang: Math.random() * TAU, t: 0, tog: 0, tog2: 0 };
        // зажал прямо на адроне (и рядом нет свободных кварков) — поле берёт его целиком
        const h = this.hadronAt(); if (h && !this.q.some(o => this.canCap(o, []) && Math.hypot(o.x - P.x, o.y - P.y) < this.fr())) this.grabHadron(h);
      }
    }
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
    f.had = f.had.filter(g => this.groups.get(g.id) === g);
    if (f.had.length) { this.holdHadrons(f, dt); return; }
    if (f.cap.length < 3) {
      let best = null, bd = this.fr();
      for (const o of this.q) {
        if (!this.canCap(o, f.cap)) continue;
        const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; best = o; }
      }
      if (best) {
        const set = this.capSet(best, f.cap);
        for (const x of set) { if (set.length === 1 && x.g) this.detach(x); x.cap = true; f.cap.push(x); }
        if (f.cap.length >= 2) { this.learn.hold = true; this.zoo('qq', P.x, P.y - this.hr * .6); }
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
    for (const g of f.had) for (const o of g.m) { o.cap = false; o.hand = 1; o.vx = P.vx; o.vy = P.vy; }
  },
  // ---------- зоопарк: поле держит адроны целиком и сжимает два в экзотический ----------
  // адрон под курсором (или под детектором): готовый p⁺/n⁰ или мезон
  hadronAt(R = .9) {
    const pts = [[P.x, P.y]]; if (mouse.has && !mouse.idle) pts.push(S2W(mouse.x, mouse.y));
    let best = null, bd = R;
    for (const g of this.groups.values()) {
      if (!HOLDABLE[g.kind] || g.m.some(x => x.cap || x.hand > 0)) continue;
      const c = centroid(g.m);
      for (const [x, y] of pts) { const d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = g; } }
    }
    return best;
  },
  grabHadron(g) {
    const f = this.focus; if (!f || f.had.includes(g) || f.had.length >= 2) return;
    f.had.push(g); f.tog2 = 0;
    for (const o of g.m) o.cap = true;
    this.learn.had = true; Sfx.play('grab');
  },
  holdHadrons(f, dt) {
    // второй адрон — любой готовый в радиусе поля
    if (f.had.length < 2) {
      let best = null, bd = this.fr();
      for (const g of this.groups.values()) {
        if (!HOLDABLE[g.kind] || f.had.includes(g) || g.m.some(x => x.cap || x.hand > 0)) continue;
        const c = centroid(g.m), d = Math.hypot(c.x - P.x, c.y - P.y); if (d < bd) { bd = d; best = g; }
      }
      if (best) this.grabHadron(best);
    }
    f.ang += dt * 1.2;
    const two = f.had.length === 2, pv = Math.hypot(P.vx, P.vy);
    // двое сближаются к центру поля — сжатие
    f.tog2 = two ? f.tog2 + dt : 0;
    const sep = two ? Math.max(.12, .9 - f.tog2 * 1.1) : 0;
    let ok = true;
    f.had.forEach((g, k) => {
      const c = centroid(g.m), a = f.ang + k * Math.PI;
      const tx = P.x + Math.cos(a) * sep, ty = P.y + Math.sin(a) * sep;
      const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), step = (3 + pv) * dt;
      const mx = d > step ? dx / d * step : dx, my = d > step ? dy / d * step : dy;
      if (d > .25) ok = false;
      for (const o of g.m) { o.x += mx; o.y += my; o.vx = P.vx; o.vy = P.vy; }
    });
    if (two && ok && f.tog2 > .8) this.fuse(f);
  },
  fuse(f) {
    const [g1, g2] = f.had, nm = (g1.kind === 'meson') + (g2.kind === 'meson');
    const kind = nm === 2 ? 'tetra' : nm === 1 ? 'penta' : 'hexa';
    this.groups.delete(g1.id); this.groups.delete(g2.id);
    const id = this.gid++, grp = { id, m: [...g1.m, ...g2.m], kind, t: EXO_T, parts: [{ m: g1.m, kind: g1.kind }, { m: g2.m, kind: g2.kind }] };
    for (const o of grp.m) { o.g = id; o.cap = false; o.hand = 2; o.vx = P.vx; o.vy = P.vy; }
    this.groups.set(id, grp); f.had = []; this.st.exo++;
    const c = centroid(grp.m);
    fxFlash(c.x, c.y, 1.4, GOLD, .6); fxRing(c.x, c.y, .5, GOLD, 3, 1);
    if (!this.zoo(kind, c.x, c.y)) { this.kn += 5; this.float(c.x, c.y - .6, `${HADRON[kind][1]} +5 ✦`, GOLD, 14); }
    Sfx.play('upgrade');
  },
  // экзотика живёт мгновения и распадается обратно на те же адроны (барионы не пропадают)
  unfuse(grp) {
    this.groups.delete(grp.id);
    const c = centroid(grp.m);
    for (const p of grp.parts) {
      const m = p.m.filter(o => !o.dead); if (!m.length) continue;
      const id = this.gid++, g = { id, m, kind: p.kind, t: p.kind === 'meson' ? MESON_T : 0 };
      for (const o of m) o.g = id;
      this.groups.set(id, g);
      const pc = centroid(m), dx = pc.x - c.x, dy = pc.y - c.y, a = Math.hypot(dx, dy) < .05 ? Math.random() * TAU : Math.atan2(dy, dx);
      for (const o of m) { o.vx += Math.cos(a) * 2.5; o.vy += Math.sin(a) * 2.5; }
    }
    fxRing(c.x, c.y, .4, GOLD, 2.5, .6);
    this.float(c.x, c.y, `${HADRON[grp.kind][0]} → ${grp.parts.map(p => HADRON[p.kind][0]).join(' + ')}`, [255, 220, 160], 13);
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
      const m = grp.m, exo = EXO[grp.kind]; let broke = false;
      for (let i = 0; i < m.length && !broke; i++) for (let j = i + 1; j < m.length; j++) {
        const a = m[i], b = m[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-9;
        if (d > DBREAK && !exo) { this.snap(grp, a, b); broke = true; break; }
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
      if (EXO[grp.kind]) { if ((grp.t -= dt) <= 0) this.unfuse(grp); continue; }
      if (grp.kind === 'meson' || grp.kind === 'anti') {
        grp.t -= grp.m[0].cap ? dt * .3 : dt; // поле придерживает мезон
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
      if (o.g) { const k = this.groups.get(o.g).kind; if (k === 'p' || k === 'n' || EXO[k]) return false; }
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
      // мир без края: свободный чужой кварк далеко за краем растворяется (его место займёт пришедший из-за края)
      if (act && !q.g && !q.mine && farOff(q)) q.dead = true;
    }
    this.forces(dt); this.strings(dt); this.binding(); this.updGroups(dt);
    for (const q of this.q) {
      if (q.cap) continue;
      const s = Math.hypot(q.vx, q.vy); if (s > 25) { q.vx *= 25 / s; q.vy *= 25 / s; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    this.q = this.q.filter(q => !q.dead);
    if (!act) return; // этап гаснет: барионы на тех же местах становятся нуклонами уровня ядер
    if (!live) return;
    // всё, что можно было собрать, собрано
    if (this.doneAt === null) { this.flow(dt); this.pairs(dt); this.autoAsm(dt); }
    this.hover = !this.focus && this.doneAt === null && (this.handN >= HAND_Q || this.learn.had) ? this.hadronAt(.7) : null;
    if (this.doneAt === null && this.steps().every(g => g.d) && !this.q.some(o => o.cap)) {
      this.doneAt = this.clock; this.endCd = 1.4; this.release(); this.holding = false; this.asm = null;
      for (const g of [...this.groups.values()]) if (EXO[g.kind]) this.unfuse(g); // барионы уходят к ядрам целыми
      this.tickStars(true);
      this.float(P.x, P.y - this.hr - .5, 'конфайнмент повсюду ✓', [140, 235, 170], 17);
    }
    if (this.doneAt === null) this.tickStars(false);
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); }
  },

  // ---------- кварки со всей Вселенной и конфайнмент сам ----------
  freeQ() { return this.q.filter(o => !o.dead && !o.anti && !o.g && !o.cap); },
  // Кварки приходят сами: того цвета и аромата, которого не хватает. Считаются и свободные, и недособранные пары
  // (паре нужен третий цвет). Обычно держим FLOW_N свободных, но цвет, без которого не собрать ни одной тройки,
  // приходит всегда — иначе тупик: девять красных и синих и ни одного зелёного.
  flow(dt) {
    if (this.conf < .2 || (this.flowCd -= dt) > 0) return;
    this.flowCd = .7;
    const f = this.freeQ(), sup = [0, 1, 2].map(c => f.filter(o => o.col === c).length);
    const pairs = [...this.groups.values()].filter(g => g.kind === 'forming' && !g.m.some(x => x.anti));
    for (const g of pairs) for (const x of g.m) sup[x.col]++;
    const lo = Math.min(...sup), col = sup.indexOf(lo);
    // лишние (самого частого цвета) далеко за краем экрана уходят — свободных не копится больше FLOW_MAX
    if (f.length > FLOW_MAX) {
      const hi = sup.indexOf(Math.max(...sup)), far = f.filter(o => o.col === hi && !o.mine && Math.hypot(o.x - P.x, o.y - P.y) > viewRadius() + 1);
      if (far.length) far[0].dead = true;
    }
    if (lo > 0 && f.length >= FLOW_N) return; // цвета, без которого нет ни одной тройки, — всегда
    const nu = f.filter(o => o.fl === 'u').length;
    let fl = nu <= f.length - nu ? 'u' : 'd';
    const pr = pairs.find(g => g.m.length === 2 && !g.m.some(x => x.col === col));
    if (pr && pr.m[0].fl === pr.m[1].fl) fl = pr.m[0].fl === 'u' ? 'd' : 'u'; // не дать паре uu/dd стать Δ
    this.born(col, fl);
  },
  // рождение кварка: чаще — прямо из вакуума рядом с полем (видно, что они берутся сами), реже — из-за края
  born(col, fl) {
    if (Math.random() < .6) {
      const a = Math.random() * TAU, d = this.fr() * 1.25 + Math.random() * 1.6;
      const q = this.mk(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, col, false, fl);
      q.vx = Math.cos(a) * .6 + P.vx * .3; q.vy = Math.sin(a) * .6 + P.vy * .3; q.sz = .15;
      fxFlash(q.x, q.y, .35, QCOL[col], .35);
      return q;
    }
    const r = rimPos(.5), q = this.mk(r.x, r.y, col, false, fl);
    q.vx = r.nx * 2.5 + randn() * .5; q.vy = r.ny * 2.5 + randn() * .5;
    return q;
  },
  // вакуум кипит: время от времени рождается пара кварк + антикварк (из неё — мезоны π)
  pairs(dt) {
    if (this.conf < .5 || (this.pairCd -= dt) > 0) return;
    this.pairCd = PAIR_CD * (.7 + Math.random() * .6);
    if (this.q.filter(o => o.anti).length >= ANTI_MAX) return;
    const a = Math.random() * TAU, d = this.fr() * 1.3 + Math.random() * 2, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    const col = Math.random() * 3 | 0, fl = Math.random() < .5 ? 'u' : 'd', b = Math.random() * TAU;
    const q1 = this.mk(x + Math.cos(b) * .25, y + Math.sin(b) * .25, col, false, fl), q2 = this.mk(x - Math.cos(b) * .25, y - Math.sin(b) * .25, col, true, fl);
    q1.vx = Math.cos(b) * 1.8; q1.vy = Math.sin(b) * 1.8; q2.vx = -q1.vx; q2.vy = -q1.vy;
    q1.nb = q2.nb = .9; q1.sz = q2.sz = .2;
    fxFlash(x, y, .6, [255, 240, 200], .4);
  },
  // Вселенная сама: выбирает ближайшую тройку R·G·B (не uuu/ddd) и стягивает её, пока не слипнется
  autoAsm(dt) {
    if (!this.rs.conf || this.conf < .5) return;
    const A = this.asm;
    if (A) {
      A.t += dt;
      if (A.m.some(o => o.dead || o.g || o.cap) || A.t > 6) { this.asm = null; this.asmCd = .4; return; }
      const c = centroid(A.m);
      for (const o of A.m) {
        const dx = c.x - o.x, dy = c.y - o.y, d = Math.hypot(dx, dy) || 1e-6;
        const k = Math.min(14, 4 + 3 * d) * dt; o.vx += dx / d * k; o.vy += dy / d * k; o.nb = 0;
        const dr = Math.exp(-dt * 3); o.vx *= dr; o.vy *= dr;
      }
      if (A.m.every(o => Math.hypot(o.x - c.x, o.y - c.y) < BIND * .55)) {
        const [a, b, e] = A.m; this.join(a, b); this.join(a, e); this.asm = null; this.asmCd = .9;
      }
      return;
    }
    if ((this.asmCd -= dt) > 0) return;
    const f = this.freeQ().filter(o => o.age > .6 && Math.hypot(o.x - P.x, o.y - P.y) > this.fr() * .8); // поле игрока не трогаем
    let best = null, bs = Infinity; // ближайшая тройка — где бы она ни была
    for (const a of f) for (const b of f) {
      if (b === a || b.col === a.col) continue;
      const dab = Math.hypot(a.x - b.x, a.y - b.y); if (dab >= bs) continue;
      for (const e of f) {
        if (e === a || e === b || e.col === a.col || e.col === b.col || (a.fl === b.fl && b.fl === e.fl)) continue;
        const s = dab + Math.hypot(a.x - e.x, a.y - e.y); if (s < bs) { bs = s; best = [a, b, e]; }
      }
    }
    if (best) { this.asm = { m: best, t: 0 }; Sfx.play('grab'); } else this.asmCd = .5;
  },
  // исследование — в лавке ✦ (как на уровне частиц)
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.handN >= HAND_Q && !this.rs.conf ? [{ ic: '◬', name: 'Конфайнмент', about: 'барионы собираются повсюду', c: CONF_COST }] : []; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused || this.doneAt !== null) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - this.hr - .2, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs.conf = 1; this.asmCd = .6; Sfx.play('upgrade'); Uni.learn(this, 'conf', '◬', 'Конфайнмент', UNI_LVL);
    fxRing(P.x, P.y, this.hr, GOLD, viewRadius() * .8, 1.4);
    this.float(P.x, P.y - this.hr - .3, '◬ Конфайнмент', GOLD, 16);
  },
  renderShop(el) {
    const items = this.shopItems();
    if (!G.started || this.advanced || !items.length) { el.style.display = 'none'; return; }
    const b = this.bal();
    const html = items.map((r, k) => `<button data-i="${k}" class="res pri ${b >= r.c ? 'ok' : 'no'}"><u>для задания</u><span class="k">${k + 1}</span>` +
      `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${r.about}</i><em>${r.c} ✦</em></button>`).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    if (!el.onclick) el.onclick = e => { const bt = e.target.closest('button'); if (bt && G.stage.buy) G.stage.buy(+bt.dataset.i); };
    el.style.display = 'flex';
  },
  tally() {
    const n = this.made.p + this.made.n, self = n - this.handN;
    return { name: 'Адроны', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['p⁺ · n⁰', `${this.made.p} · ${this.made.n}`], ['барионы — полем', this.handN], ['барионы — Вселенная', self]], auto: [self, n], stars: this.stars || [] };
  },

  // ---------- задание и испытания ★ ----------
  starPool() {
    const st = this.st;
    return [
      { t: 'быстрее 0:45', bad: () => this.clock > 45, atEnd: true },
      { t: '5 барионов полем', ok: () => this.handN >= 5 },
      { t: 'ни одного Δ', bad: () => st.delta > 0, atEnd: true },
      { t: '2 p⁺ и 2 n⁰', ok: () => this.made.p >= 2 && this.made.n >= 2, can: () => this.q.length >= 12 },
      { t: 'экзотический адрон', ok: () => st.exo > 0 },
    ];
  },
  tickStars(end) {
    if (!this.stars) this.stars = pickStars(this.starPool());
    tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - this.hr - .4, '★ +10 ✦', [255, 215, 110], 17); });
  },
  steps() {
    const touch = isTouch();
    return [
      { t: 'Жди конфайнмента', h: 'плазма остывает — кварки вот-вот начнут слипаться…', s: 'конфайнмент', d: this.conf > .5 },
      { t: 'Собери барионы полем', h: 'зажми возле трёх кварков разных цветов — R, G и B', p: [Math.min(this.handN, HAND_Q), HAND_Q], s: `${HAND_Q} бариона полем`, d: this.handN >= HAND_Q },
      { t: 'Исследуй «Конфайнмент»', h: `${touch ? 'в лавке' : 'клавиша 1'} за ${CONF_COST} ✦`, s: 'конфайнмент', d: this.rs.conf > 0 },
      { t: 'Барионы по всей Вселенной', h: 'кварки слипаются в p⁺ и n⁰ повсюду — помогай полем', p: [Math.min(this.autoN, AUTO_Q), AUTO_Q], s: 'конфайнмент повсюду', d: this.autoN >= AUTO_Q },
    ];
  },

  // ---------- итоги (старая модальная карточка; итоги теперь — Tally сбоку) ----------
  showResultCard() {
    const won = starsWon(this.stars || []);
    const t = this.doneAt, pts = Math.round(this.kn), bonus = t === null ? 0 : Math.max(0, Math.round((Q_PAR - t) * 2)), total = pts + bonus;
    const e = { n: LB.name(), s: total, p: pts, t: t === null ? null : Math.floor(t), d: Date.now() };
    const html = `<div class="ek">Уровень 2 · ${this.made.p} p⁺ · ${this.made.n} n⁰</div><div class="en">Адроны</div>` +
      `<div class="rs"><div><span>⏱</span>${fmtClock(t)}</div>` +
      `<div><span>✦</span>${pts}</div><div><span>быстрее ${fmtClock(Q_PAR)}</span>+${bonus}</div><div class="tot"><span>итог</span>${total}</div></div>` +
      `<div class="st">${(this.stars || []).map(s => `<b class="${s.st === 1 ? 'y' : 'n'}">${s.st === 1 ? '★' : '✗'} ${s.t}</b>`).join('')}<small>★ ${won}/${(this.stars || []).length} · испытания в каждом забеге новые</small></div>` +
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
  cheat() { this.t = Math.max(this.t, 20); this.cheated = true; this.handN = Math.max(this.handN, HAND_Q); this.kn += CONF_COST; },

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
      else if (pts.length > 3) {
        // экзотика: все струны в общий центр, золотое свечение пульсирует, пока не распадётся
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        for (const p of pts) this.tube(cx, cy, p[0], p[1], EXO[grp.kind] ? GOLD : c, w, al);
        if (EXO[grp.kind]) {
          glow(cx, cy, 2 * z, GOLD, (.2 + .1 * Math.sin(G.T * 8)) * al);
          label(HADRON[grp.kind][1], cx, cy - 1.3 * z, 13, GOLD, .9 * al, 700);
        }
      }
    }
    // тройка, которую стягивает Вселенная: тонкие зелёные нити к центру
    if (this.asm) {
      const c = centroid(this.asm.m), [cx, cy] = W2S(c.x, c.y), k = Math.min(1, this.asm.t * 2);
      for (const o of this.asm.m) { const [ox, oy] = W2S(o.x, o.y); ctx.setLineDash([3, 4]); line(cx, cy, ox, oy, [140, 235, 170], .6 * k * al, 1.5); ctx.setLineDash([]); }
      glow(cx, cy, .6 * z, [140, 235, 170], .25 * k * al);
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
      for (const g of f.had) { const c = centroid(g.m), [ox, oy] = W2S(c.x, c.y); ring(ox, oy, .75 * z, GOLD, .7, 2); line(ox, oy, sx, sy, GOLD, .6, 1.8); }
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
    // курсор над готовым адроном: его можно взять целиком (так собирается экзотика)
    if (this.hover && G.started && !G.paused) {
      const c = centroid(this.hover.m), [hx, hy] = W2S(c.x, c.y);
      ring(hx, hy, .8 * z + 2 * Math.sin(G.T * 6), [255, 255, 255], .6, 1.5, [4, 4]);
      if (!this.learn.had) label('зажми — взять целиком', hx, hy + .8 * z + 16, 12, [255, 255, 255], .8, 700);
    }
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
    else if (f && f.had.length === 1 && this.st.exo === 0) t = 'добавь ещё адрон — сожмёшь в один';
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
    if (!G.started || this.advanced) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    const n = this.made.p + this.made.n, all = n + this.spare();
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > Q_PAR ? [190, 190, 205] : [255, 255, 255], this.bal(), []);
    if (this.stars) hudTask(al, this.tk, 'УРОВЕНЬ 2', this.steps(), this.stars, `Собрано: ${n} p⁺/n⁰`);
    hudBanner(this.banner, 'УРОВЕНЬ 2 · 10⁻⁶ с', 'Адроны', this.nSaved ? `${this.nSaved} сбережённых кварков → протоны и нейтроны` : 'собери из кварков протоны и нейтроны', al, 'из кварков → протоны и нейтроны → без них не будет ни одного ядра');
    ctx.globalAlpha = 1;
  },
  viewR() { return 3.6 + this.hr * 1.4; },
  hud() {
    return { title: '', sub: `T ≈ ${fmtGeV(this.temp * .0862)}${this.conf > .5 ? ' · конфайнмент' : ''}`, lines: [], goal: '', laws: [] };
  },
};
