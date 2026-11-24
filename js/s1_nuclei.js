"use strict";
/* Уровень 3. Ядра — нуклеосинтез, первые три минуты после Большого взрыва.
   Материал — твои протоны и нейтроны с уровня адронов (на тех же местах) и вся Вселенная вокруг:
   на одного нейтрона — три протона. Цель — гелий: 25 % массы, как в нашей Вселенной.
   Глагол — рогатка (sling.js): зажми ядро — оно замирает; оттяни и отпусти — полетит в обратную сторону.
   Сила удара решает всё, и пунктир заранее пишет у цели, что выйдет:
   - нейтрон без заряда — сливается от мягкого броска;
   - заряженным нужен сильный удар: кулоновский барьер ~ Z₁·Z₂ («отскочит — барьер»);
   - слишком сильно — хрупкое ядро (²H, ³H, ³He) разобьётся.
   Реакции: n + p → ²H; ²H + n → ³H; ²H + p → ³He; ³H + p, ³He + n → ⁴He; ²H + ²H → ³He + n или ³H + p;
     ³H + ²H → ⁴He + n; ³He + ²H → ⁴He + p; ³He + ³He → ⁴He + 2p; ³H + ³H → ⁴He + 2n;
     ⁴He + ²H → ⁶Li; ⁴He + ³H → ⁷Li; ⁴He + ³He → ⁷Be; ⁷Li + p → две альфы.
     Ядер с массой 5 нет; ⁸Be сразу разваливается; p + p и n + n не связаны.
   Живой мир:
   - жёсткие γ разбивают хрупкие ядра, пока горячо («бутылочное горлышко» дейтерия); ядро в руке γ не трогают;
   - свободный нейтрон распадается (n → p + e⁻ + ν̄) — у него видна дуга оставшейся жизни;
   - нейтроны сами липнут к ядрам (барьера нет), когда ты уже сделал первую реакцию;
   - исследование «Нуклеосинтез»: Вселенная бросает ядра — с тем же барьером и той же хрупкостью;
   - окно синтеза ~2 минуты: Вселенная остывает, и реакции прекращаются.
   Мир без края: Вселенная приносит протоны и нейтроны из-за края кадра, чужое вдали растворяется (core.js). */
const ELEM = [['n', 'Нейтрон', 0], ['H', 'Водород', 1], ['He', 'Гелий', 0], ['Li', 'Литий', 1], ['Be', 'Бериллий', 2], ['B', 'Бор', 3],
  ['C', 'Углерод', 4], ['N', 'Азот', 3], ['O', 'Кислород', 2], ['F', 'Фтор', 1], ['Ne', 'Неон', 0], ['Na', 'Натрий', 1], ['Mg', 'Магний', 2]];
const elemOf = Z => ELEM[clamp(Z, 0, ELEM.length - 1)];
const NR = .8; // радиус нуклона в масштабе уровня атомов (части ядра передаются туда)
// N_FLY — сколько летит брошенное (минимум), N_REACH — сколько оно пролетает самое меньшее: мягкий бросок летит дольше и долетает
const NU_R = .42, N_WIN = 120, N_PAR = 75, N_VIEW = 9, N_DENS = .075, N_CAP = 60, N_FLY = 1.3, N_REACH = 11, N_VMAX = 15, SYN_COST = 30, Y_GOAL = .25;
const NUC_NAME = {
  '1,0': ['p', 'протон'], '0,1': ['n', 'нейтрон'], '1,1': ['²H', 'дейтерий'], '1,2': ['³H', 'тритий'], '2,1': ['³He', 'гелий-3'],
  '2,2': ['⁴He', 'гелий-4'], '3,3': ['⁶Li', 'литий-6'], '3,4': ['⁷Li', 'литий-7'], '4,3': ['⁷Be', 'бериллий-7'],
};
const N_BIND = { '1,1': 1, '1,2': 2.6, '2,1': 2.4 }; // энергия связи хрупких ядер: γ (или удар) сильнее — разбивает
const nkey = o => o.Z + ',' + o.N;
const nsym = k => (NUC_NAME[k] || ['?'])[0];
const N_COL = { n: [170, 170, 185], e: [140, 205, 255] };
const N_OK = [120, 240, 160], N_BAR = [255, 190, 100], N_BAD = [255, 120, 110], N_NO = [200, 175, 190];

const Nuclei = {
  key: 'nuclei', name: 'Ядра', bg: [22, 8, 40], sling: true,
  controls: 'Зажми ядро, оттяни, отпусти',

  enter(prev) {
    this.o = []; this.g = []; this.el = []; this.floats = []; this.t = 0; this.clock = 0; this.doneAt = null; this.endCd = -1;
    this.kn = 0; this.spent = 0; this.rs = { syn: 0 }; this.banner = -1.5; this.learn = {}; this.autoCd = 1;
    this.advanced = false; this.cheated = false; this.gT = 0; this.spCd = 0; this.seen = new Set(); this.tk = {};
    this.st = { decayed: 0, broken: 0, bounce: 0, shat: 0 }; this.he = { hand: 0, auto: 0 };
    this.hr = prev && prev.hr != null ? (typeof prev.hr === 'function' ? prev.hr() : prev.hr) : 1.4;
    P.vx = P.vy = 0;
    if (!prev) P.x = P.y = 0;
    // барионы уровня адронов становятся нуклонами там же, где были
    if (prev && prev.groups) for (const grp of prev.groups.values()) {
      if (grp.kind !== 'p' && grp.kind !== 'n') continue;
      const c = centroid(grp.m), v = grp.m.reduce((s, q) => [s[0] + q.vx / 3, s[1] + q.vy / 3], [0, 0]);
      const o = this.mk(grp.kind === 'p' ? 1 : 0, grp.kind === 'n' ? 1 : 0, c.x, c.y, v[0], v[1]); o.src = grp; o.mine = true;
    }
    // остальная Вселенная — за краем кадра: камера отъедет к масштабу ядер и откроет её (с нуля — она и в кадре, из тумана)
    const z1 = zoomFor(this), want = popWant(N_DENS, N_CAP, z1);
    for (let i = this.o.length, k = 0; i < want && k < want * 3; k++) {
      const at = beyondPos(z1, .5, !prev); if (!at) continue;
      const o = this.cosmic(at[0], at[1], randn() * .4, randn() * .4); o.age = prev ? 1 : -Math.random() * 1.5; i++;
    }
    if (this.o.filter(o => o.N).length < 3) for (let i = 0; i < 3; i++) { const at = beyondPos(z1, .5, true); if (at) this.mk(0, 1, at[0], at[1]).age = prev ? 1 : -Math.random(); }
    this.nB = this.o.length; this.nN = this.o.filter(o => o.N).length;
    for (const o of this.o) if (o.N) o.life = rnd(70, 100);
    for (const o of this.o) { this.seen.add(nkey(o)); Codex.note('n:' + nkey(o)); }
    this.stars = pickStars(this.starPool());
    this.sl = new Sling(this);
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); },
  // вещество Вселенной: на нейтрон — три протона (свободные нейтроны со временем распадаются, их всё меньше);
  // после «Нуклеосинтеза» гелий рождается повсюду — и приходит уже с той же долей, что вокруг тебя
  cosmic(x, y, vx, vy) {
    if (this.rs.syn && Math.random() < this.Y()) return this.mk(2, 2, x, y, vx, vy);
    const isN = Math.random() < .25 * Math.exp(-this.t / 150), o = this.mk(isN ? 0 : 1, isN ? 1 : 0, x, y, vx, vy);
    if (isN) o.life = rnd(60, 100);
    return o;
  },
  // Вселенная вокруг: не хватает в кадре — приходит из-за края; чужое далеко за краем растворяется
  tide(dt) {
    dissolveFar(this.o, o => o.held || o.fly > 0);
    this.el = this.el.filter(e => !farOff(e));
    if (this.doneAt !== null) return;
    const have = this.o.filter(o => !o.dead && inView(o.x, o.y, 1)).length;
    if (have < popWant(N_DENS, N_CAP) && Math.random() < dt * 6) {
      const r = rimPos(.6), sp = rnd(1, 2.2);
      const o = this.cosmic(r.x, r.y, r.nx * sp + randn() * .4, r.ny * sp + randn() * .4); o.age = 0;
    }
  },
  // ядро: Z протонов, N нейтронов; нуклоны уложены спиралью
  mk(Z, N, x, y, vx = 0, vy = 0) {
    const A = Z + N, parts = [];
    for (let k = 0, p = Z, n = N; k < A; k++) { const t = (k % 2 === 0 ? p > 0 : n <= 0) ? 'p' : 'n'; if (t === 'p') p--; else n--; parts.push(t); }
    const lay = parts.map((t, k) => { const r = k ? NU_R * 1.3 * Math.sqrt(k) : 0, a = k * 2.4; return { t, lx: Math.cos(a) * r, ly: Math.sin(a) * r }; });
    const o = { Z, N, x, y, vx, vy, lay, rad: Math.max(...lay.map(p => Math.hypot(p.lx, p.ly))) + NU_R, age: 0, dead: false, nb: 0, fly: 0, rot: Math.random() * TAU, life: Infinity };
    this.o.push(o); return o;
  },
  T() { return Math.exp(-this.t / 40); }, // температура в долях от начальной
  free(o) { return !o.dead && !o.held && !(o.fly > 0); },

  // ---------- рогатка ----------
  bodies() { return G.prev || this.doneAt !== null ? [] : this.o.filter(o => this.free(o) && o.age > .3); },
  grabR(b) { return b.rad + 16 / cam.z; },
  full() { return slingFullPx() / cam.z; },
  vmax() { return N_VMAX; },
  hold(b) { b.held = true; b.vx = b.vy = 0; this.learn.grab = true; },
  launch(b, vx, vy) {
    b.held = false; b.vx = vx; b.vy = vy;
    const v = Math.hypot(vx, vy);
    if (v > .5) { b.fly = this.flyT(v); b.thrown = 'hand'; this.learn.throw = true; }
  },
  // время полёта броска со скоростью v: не меньше N_FLY и не короче N_REACH по пути (но не дольше 5 с)
  flyT(v) { return clamp(N_REACH / Math.max(v, 1e-6), N_FLY, 5); },
  // путь броска (цели движутся по прямой) и вердикт у первой встречной
  predict(b, vx, vy) {
    const pts = [[b.x, b.y]], dt = 1 / 60, others = this.o.filter(q => q !== b && !q.dead && q.age > .3);
    for (let n = 1; n <= this.flyT(Math.hypot(vx, vy)) * 60; n++) {
      const t = n * dt, x = b.x + vx * t, y = b.y + vy * t;
      if (n % 4 === 0) pts.push([x, y]);
      for (const q of others) {
        const qx = q.x + (q.held ? 0 : q.vx * t), qy = q.y + (q.held ? 0 : q.vy * t);
        if (Math.hypot(qx - x, qy - y) < (b.rad + q.rad) * .8) {
          pts.push([x, y]);
          const j = this.judge(b, q, Math.hypot(vx - q.vx, vy - q.vy), true);
          return { pts, x: qx, y: qy, label: j.label, c: j.c, hit: true };
        }
      }
    }
    const [lx, ly] = pts[pts.length - 1];
    return { pts, x: lx, y: ly, label: 'мимо', c: [200, 205, 225] };
  },

  // ---------- реакции ----------
  // что получится из a + b: продукты [Z, N] или причина, почему не связались
  outcome(a, b, sure) {
    const Z = a.Z + b.Z, N = a.N + b.N, A = Z + N, k = Z + ',' + N, he = o => o.Z === 2 && o.N === 2, d = o => o.Z === 1 && o.N === 1;
    if (A === 2 && Z !== 1) return { why: Z ? 'p + p не связаны' : 'n + n не связаны' };
    if (d(a) && d(b)) return { out: (sure ? .5 : Math.random()) < .5 ? [[2, 1], [0, 1]] : [[1, 2], [1, 0]], dd: true };
    if (A === 5) return he(a) || he(b) ? { why: 'ядер с массой 5 нет' } : { out: [[2, 2], Z === 3 ? [1, 0] : [0, 1]] };
    if (k === '4,2') return { out: [[2, 2], [1, 0], [1, 0]] };
    if (k === '2,4') return { out: [[2, 2], [0, 1], [0, 1]] };
    if (k === '4,4') return { out: [[2, 2], [2, 2]], why2: '⁸Be → две альфы' };
    if (NUC_NAME[k] && A <= 7) return { out: [[Z, N]] };
    return { why: 'такие не связываются' };
  },
  // скорость, нужная, чтобы пробить кулоновский барьер (с нейтроном — 0)
  vBar(a, b) { const zz = a.Z * b.Z; return zz ? 2 + 2.5 * Math.sqrt(zz) : 0; },
  // скорость, выше которой хрупкое ядро разобьётся (или нуклоны просто разлетятся)
  vMax(a, b) { const f = [N_BIND[nkey(a)], N_BIND[nkey(b)]].filter(Boolean); return this.vBar(a, b) + 5 + 1.5 * (f.length ? Math.min(...f) : 2); },
  fragile(a, b) { const fa = N_BIND[nkey(a)], fb = N_BIND[nkey(b)]; return fa && (!fb || fa <= fb) ? a : fb ? b : null; },
  // вердикт удара со скоростью v: {kind, label, c}
  judge(a, b, v, sure) {
    const r = this.outcome(a, b, sure);
    if (!r.out) return { kind: 'no', label: '✗ ' + r.why, c: N_NO, why: r.why };
    if (v < this.vBar(a, b)) return { kind: 'bar', label: 'отскочит — барьер, сильнее', c: N_BAR };
    if (v > this.vMax(a, b)) {
      const f = this.fragile(a, b);
      return f ? { kind: 'shat', label: `разобьёт ${nsym(nkey(f))} — мягче`, c: N_BAD, f } : { kind: 'fast', label: 'разлетятся — мягче', c: N_BAD };
    }
    const out = r.dd ? '³He + n или ³H + p' : r.out.map(([Z, N]) => nsym(Z + ',' + N)).join(' + ');
    return { kind: 'fuse', label: '→ ' + out, c: N_OK, r };
  },
  bounce(a, b, txt, c = N_BAR) {
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    for (const [o, s] of [[a, -1], [b, 1]]) { o.vx = s * dx / d * 2.4; o.vy = s * dy / d * 2.4; o.fly = 0; o.thrown = null; o.nb = 1; }
    fxRing(x, y, .2, c, 1.2, .5);
    if (txt) this.float(x, y, txt, c, 13);
  },
  // удар a в b со скоростью v; src — 'hand' (рогатка), 'auto' (Вселенная) или null (тепловое слипание)
  collide(a, b, v, src) {
    const j = this.judge(a, b, v), hand = src === 'hand';
    if (j.kind === 'bar') {
      this.bounce(a, b, hand ? 'барьер — сильнее' : '');
      if (hand) { this.st.bounce++; if (!this.learn.bar) { this.learn.bar = true; msg('Протоны отталкиваются — бросай сильнее'); } }
      return false;
    }
    if (j.kind === 'no') { this.bounce(a, b, hand ? j.why : '', N_NO); return false; }
    if (j.kind === 'fast') { this.bounce(a, b, hand ? 'слишком сильно — разлетелись' : '', N_BAD); return false; }
    if (j.kind === 'shat') {
      const other = j.f === a ? b : a, an = Math.atan2(other.y - j.f.y, other.x - j.f.x) + Math.PI / 2;
      other.vx *= -.4; other.vy *= -.4; other.fly = 0; other.thrown = null; other.nb = 1;
      this.split(j.f, an, `${nsym(nkey(j.f))} разбился — мягче`);
      if (hand) { this.st.shat++; if (!this.learn.shat) { this.learn.shat = true; msg('Слишком сильно — ядро разбилось'); } }
      return false;
    }
    const r = j.r, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, vx = (a.vx + b.vx) / 4, vy = (a.vy + b.vy) / 4;
    a.dead = b.dead = true;
    const a0 = Math.random() * TAU, n = r.out.length;
    r.out.forEach(([Z, N], i) => {
      const an = a0 + i * TAU / n, sp = n > 1 ? 2.4 : 0, off = n > 1 ? .3 : 0;
      const o = this.mk(Z, N, x + Math.cos(an) * off, y + Math.sin(an) * off, vx + Math.cos(an) * sp, vy + Math.sin(an) * sp);
      o.age = 1; o.nb = .8; o.mine = true; if (Z === 0) o.life = Math.min(a.life, b.life, rnd(50, 70));
      if (Z === 2 && N === 2) { if (src === 'hand') this.he.hand++; else this.he.auto++; }
      this.made(o, i);
    });
    fxFlash(x, y, 1.2, [255, 240, 200], .45);
    fxRing(x, y, .3, [255, 220, 150], 2.2, .6);
    if (r.why2) this.float(x, y + .6, r.why2, [255, 200, 150], 13);
    if (src) this.learn.smash = true;
    if (hand) Sfx.play('segment');
    return true;
  },
  // родилось ядро: новое — +10 ✦, гелий — +5, литий и бериллий — +15
  made(o, i) {
    const k = nkey(o), nm = NUC_NAME[k];
    if (!nm || o.Z + o.N < 2) return;
    Codex.note('n:' + k);
    let pts = 0, txt = '';
    if (!this.seen.has(k)) { this.seen.add(k); pts += 10; txt = `НОВОЕ ${nm[0]} ${nm[1]}`; }
    if (k === '2,2') pts += 5; else if (o.Z >= 3) pts += 15;
    if (!pts) return;
    this.kn += pts;
    this.float(o.x, o.y - .3 * i, `${txt || nm[0]} +${pts} ✦`, txt ? [255, 215, 110] : [140, 220, 255], txt ? 16 : 14);
  },
  // хрупкое ядро разлетается на части (γ или слишком сильный удар)
  split(o, a, txt) {
    const k = nkey(o);
    o.dead = true;
    const parts = k === '1,1' ? [[1, 0], [0, 1]] : k === '1,2' ? [[1, 1], [0, 1]] : [[1, 1], [1, 0]];
    parts.forEach(([Z, N], i) => {
      const s = i ? -1 : 1, n = this.mk(Z, N, o.x + Math.cos(a) * .3 * s, o.y + Math.sin(a) * .3 * s, o.vx + Math.cos(a) * 2.5 * s, o.vy + Math.sin(a) * 2.5 * s);
      n.age = 1; n.nb = 1; n.mine = o.mine; if (Z === 0) n.life = rnd(45, 65);
    });
    fxFlash(o.x, o.y, 1.4, [255, 255, 230], .4);
    this.float(o.x, o.y, txt, [255, 240, 170], 14);
  },
  photodis(o, g) {
    const k = nkey(o);
    if (!(g.E > N_BIND[k])) return false;
    this.split(o, Math.atan2(g.vy, g.vx) + Math.PI / 2, `γ разбил ${nsym(k)}`);
    this.st.broken++;
    if (!this.learn.gam) { this.learn.gam = true; msg('Пока горячо, свет разбивает дейтерий. Гелий ему не по зубам'); }
    return true;
  },
  decayN(o) {
    o.Z = 1; o.N = 0; o.lay[0].t = 'p'; o.life = Infinity;
    const a = Math.random() * TAU;
    this.el.push({ x: o.x, y: o.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, age: 0 });
    fxRing(o.x, o.y, .3, [140, 255, 160], 1.6, .6);
    this.float(o.x, o.y, 'n → p + e⁻ + ν̄', [255, 150, 130], 13);
    this.st.decayed++;
  },

  // ---------- Вселенная бросает сама («Синтез сам») ----------
  // выбирает пару, которая продвигает цепочку к гелию, и бросает с нужной силой — в окно между барьером и хрупкостью
  autoFuse(dt) {
    if (!this.rs.syn || this.doneAt !== null || (this.autoCd -= dt) > 0) return;
    this.autoCd = 1.8 / Math.max(.35, this.T());
    const f = this.o.filter(o => this.free(o) && o.age > 1 && o.nb <= 0 && inView(o.x, o.y, -1)); // на виду — чтобы было видно, как Вселенная куёт
    let best = null, bs = -Infinity;
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 7) continue;
      const r = this.outcome(a, b, true);
      if (!r.out) continue;
      const A = a.Z + a.N + b.Z + b.N, he = r.out.some(([Z, N]) => Z === 2 && N === 2);
      if (A > 5 && !he) continue; // литий — только руками (испытание ★)
      const sc = (he ? 10 : 0) + A * 2 - d - (a.Z * b.Z) * .5 + Math.random();
      if (sc > bs) { bs = sc; best = [a, b, d]; }
    }
    if (!best) return;
    let [a, b, d] = best;
    if (a.Z + a.N > b.Z + b.N) [a, b] = [b, a]; // бросают лёгкое
    const v = Math.max(3, lerp(this.vBar(a, b), this.vMax(a, b), .4)), t = d / v;
    const tx = b.x + b.vx * t - a.x, ty = b.y + b.vy * t - a.y, L = Math.hypot(tx, ty) || 1;
    a.vx = b.vx + tx / L * v; a.vy = b.vy + ty / L * v; a.fly = t + .5; a.thrown = 'auto';
  },
  // после твоей первой реакции нейтроны изредка липнут к ядрам и сами (барьера нет)
  spontaneous(dt) {
    if (!this.learn.smash || (this.spCd -= dt) > 0) return;
    const f = this.o.filter(o => this.free(o) && o.nb <= 0 && o.age > 1);
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) > (a.rad + b.rad) * .8 || a.Z * b.Z > 0) continue;
      a.nb = b.nb = 1;
      if (Math.random() < .35 && this.outcome(a, b).out) { this.collide(a, b, 1, this.rs.syn ? 'auto' : null); this.spCd = 3; return; }
    }
  },

  // ---------- шаг ----------
  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
    if (live) {
      this.banner += dt;
      if (this.doneAt === null) this.clock += dt;
      this.sl.update();
      P.vx = P.vy = 0;
    }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    const Tn = this.T(), trans = G.prev && G.prev.key === 'quarks';
    // γ-кванты: чем горячее, тем чаще и жёстче
    if (live && this.doneAt === null) {
      this.gT += dt * 3.5 * Tn;
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
    // ядра: тепловое дрожание, мягкая стенка вокруг облака; брошенное летит по прямой
    for (const o of this.o) {
      if (o.dead) continue;
      o.age += dt; o.nb -= dt; o.rot += dt * .6;
      if (trans && o.src) { const c = centroid(o.src.m); o.x = c.x; o.y = c.y; continue; } // пока гаснут кварки — нуклон на месте бариона
      if (o.held) continue;
      if (o.fly > 0) { if ((o.fly -= dt) <= 0) o.thrown = null; }
      else {
        const j = (.25 + .45 * Tn) * Math.sqrt(dt); o.vx += randn() * j; o.vy += randn() * j;
        const k = Math.exp(-dt * .9); o.vx *= k; o.vy *= k;
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (act && o.Z === 0 && o.N === 1 && (o.life -= dt) <= 0) this.decayN(o);
    }
    if (act) {
      for (const o of this.o) {
        if (o.dead || !o.thrown) continue;
        for (const q of this.o) {
          if (q === o || q.dead || q.held || q.age < .3) continue;
          if (Math.hypot(q.x - o.x, q.y - o.y) < (o.rad + q.rad) * .8) { this.collide(o, q, Math.hypot(o.vx - q.vx, o.vy - q.vy), o.thrown); break; }
        }
      }
      if (this.doneAt === null) { this.spontaneous(dt); this.autoFuse(dt); }
      this.tide(dt);
    }
    this.o = this.o.filter(o => !o.dead);
    if (!live) return;
    if (this.doneAt === null) this.tickStars(false);
    const goal = this.steps().every(s => s.d);
    if (this.doneAt === null && (goal || this.stuck() || this.t > N_WIN)) {
      this.doneAt = this.clock; this.endCd = 2; this.sl.held = null;
      for (const o of this.o) o.held = false;
      if (!goal) this.float(P.x, P.y - 2, this.t > N_WIN ? 'остыло — синтез окончен' : 'нейтронов больше нет — синтез окончен', [200, 210, 240], 16);
      this.tickStars(true);
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; addScore(this.Y() * 2000); advance(); } // звёздам — твои же ядра, на тех же местах // итоги — сбоку, без паузы
  },
  counts() {
    const c = { n: 0, mid: 0, he: 0, p: 0, he3: 0 };
    for (const o of this.o) { const k = nkey(o); if (k === '0,1') c.n++; else if (k === '1,0') c.p++; else if (k === '2,2') c.he++; else if (N_BIND[k]) { c.mid++; if (k === '2,1') c.he3++; } }
    return c;
  },
  // гелию больше не из чего взяться: нет свободных нейтронов, ²H, ³H и пары ³He — и Вселенная почти не приносит нейтронов
  stuck() { const c = this.counts(); return .25 * Math.exp(-this.t / 150) < .05 && c.n === 0 && c.mid - c.he3 === 0 && c.he3 < 2; },
  // доля массы в гелии-4 и всём, что из него выросло (³He не в счёт — он ещё «недостроен»), среди всех ядер вокруг
  Y() { let m = 0, all = 0; for (const o of this.o) { all += o.Z + o.N; if (o.Z >= 2 && o.Z + o.N >= 4) m += o.Z + o.N; } return m / Math.max(1, all); },

  // ---------- исследование — в лавке ✦ ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.seen.has('2,2') && !this.rs.syn && this.doneAt === null ? [{ ic: '☀', name: 'Нуклеосинтез', about: 'ядра сливаются повсюду', c: SYN_COST }] : []; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1.5, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs.syn = 1; this.autoCd = .5; Sfx.play('upgrade');
    fxRing(P.x, P.y, 1, GOLD, viewRadius() * .8, 1.4);
    this.float(P.x, P.y - 1.5, '☀ Нуклеосинтез', GOLD, 16);
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

  // ---------- задание и испытания ★ ----------
  steps() {
    const s = this.seen, touch = isTouch(), Y = Math.round(this.Y() * 100);
    return [
      { t: 'Слей нейтрон с протоном', h: 'зажми нейтрон, оттяни и отпусти в протон', s: 'дейтерий ²H', d: s.has('1,1') },
      { t: 'Собери гелий-4', h: 'к ²H — нейтрон, потом протон: его бросай сильнее',
        items: [['²H', s.has('1,1')], ['³H или ³He', s.has('1,2') || s.has('2,1')], ['⁴He', s.has('2,2')]], s: 'гелий-4', d: s.has('2,2') },
      { t: 'Исследуй «Нуклеосинтез»', h: `${touch ? 'в лавке' : 'клавиша 1'} за ${SYN_COST} ✦`, s: 'нуклеосинтез', d: this.rs.syn > 0, res: 'syn' },
      { t: 'Набери 25 % гелия', h: 'столько гелия в нашей Вселенной', p: [Math.min(Y, 25), 25], s: 'гелий как в нашей Вселенной', d: this.Y() >= Y_GOAL },
    ];
  },
  starPool() {
    const st = this.st;
    return [
      { t: 'ни один нейтрон не распался', bad: () => st.decayed > 0, atEnd: true },
      { t: 'γ не разбил ни одного ядра', bad: () => st.broken > 0, atEnd: true },
      { t: 'без отскоков от барьера', bad: () => st.bounce > 0, atEnd: true },
      { t: 'не разбей ни одного ядра', bad: () => st.shat > 0, atEnd: true },
      { t: `быстрее ${fmtClock(N_PAR)}`, bad: () => this.clock > N_PAR, atEnd: true },
      { t: 'сделай литий или бериллий', ok: () => ['3,3', '3,4', '4,3'].some(k => this.seen.has(k)), can: () => this.nN >= 3 },
      { t: 'гелий Y ≥ 33 %', ok: () => this.Y() >= .33, can: () => this.nN * 2 / this.nB >= .4 },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 2, '★ +10 ✦', [255, 215, 110], 17); }); },

  tally() {
    const c = this.counts(), n = this.he.hand + this.he.auto;
    return { name: 'Ядра', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['гелий по массе', Math.round(this.Y() * 100) + ' %'], ['⁴He — рогаткой', this.he.hand], ['⁴He — Вселенная', this.he.auto], ['водород p', c.p]], auto: [this.he.auto, n], stars: this.stars };
  },
  cheat() {
    this.cheated = true;
    for (const o of this.o) o.dead = true;
    this.o = [];
    const nHe = Math.floor(this.nN / 2);
    for (let i = 0; i < nHe; i++) this.made(this.mk(2, 2, P.x + i * 1.5, P.y + 2), 0);
    for (let i = 0; i < this.nB - nHe * 4; i++) this.mk(1, 0, P.x - 2 - i, P.y - 2);
    this.seen.add('1,1'); this.seen.add('1,2'); this.rs.syn = 1; this.he.hand += nHe;
  },

  // ---------- рисование ----------
  drawNuc(o, al) {
    const [sx, sy] = W2S(o.x, o.y), z = cam.z;
    if (!onScreen(sx, sy, o.rad * z + 40)) return;
    const a = al * clamp(o.age * 2 + (o.src ? 1 : 0), 0, 1);
    if (a <= 0) return;
    if (o.thrown) { // след броска: золото — твой, голубой — Вселенной
      const c = o.thrown === 'hand' ? GOLD : [150, 205, 255];
      line(sx, sy, sx - o.vx * .12 * z, sy - o.vy * .12 * z, c, .5 * a, Math.max(2, o.rad * z * .8));
    }
    ctx.globalAlpha = a;
    const c = Math.cos(o.rot), s = Math.sin(o.rot);
    for (const p of o.lay) drawNucleon(sx + (p.lx * c - p.ly * s) * z, sy + (p.lx * s + p.ly * c) * z, NU_R * z, p.t, G.T * .8);
    ctx.globalAlpha = 1;
    if (o.Z + o.N > 1) label(nsym(nkey(o)), sx, sy - (o.rad + .3) * z, 12, [255, 255, 255], .8 * a, 700);
    // свободный нейтрон: дуга оставшейся жизни, последние 15 с — красная
    if (o.Z === 0 && o.life < Infinity) {
      const k = clamp(o.life / 100, 0, 1), warn = o.life < 15;
      arc(sx, sy, (NU_R + .16) * z, -Math.PI / 2, -Math.PI / 2 + TAU * k, warn ? [255, 120, 110] : N_COL.n, (warn ? .6 + .4 * Math.sin(G.T * 10) : .6) * a, 2);
    }
    if (o.held) ring(sx, sy, o.rad * z + 5, GOLD, .9 * al, 2);
    else if (N_BIND[nkey(o)] && this.T() > .3 && this.doneAt === null) ring(sx, sy, o.rad * z + 3, [255, 240, 170], .18 * a, 1, [3, 4]); // хрупкое, пока горячо
  },
  draw(al) {
    const z = cam.z;
    for (const g of this.g) {
      const [sx, sy] = W2S(g.x, g.y), c = g.E > 2.4 ? [220, 200, 255] : g.E > 1 ? [255, 255, 230] : [255, 190, 120];
      line(sx, sy, sx - g.vx * .1 * z, sy - g.vy * .1 * z, c, .6 * al, Math.max(1.5, z * .05));
    }
    for (const e of this.el) { const [sx, sy] = W2S(e.x, e.y); glow(sx, sy, 8, N_COL.e, .5 * al); ball(sx, sy, 2.5, [200, 235, 255], al); }
    for (const o of this.o) this.drawNuc(o, al);
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    this.sl.draw(al);
    this.drawHint(al);
    this.drawArrows();
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  // подсказка новичку: мерцающее кольцо на ближайшем нейтроне, пока не бросил ни разу
  drawHint(al) {
    if (!G.started || G.paused || this.doneAt !== null || G.prev || this.sl.held || this.sl.shots > 0) return;
    let best = null, bd = Infinity;
    for (const o of this.o) if (o.Z === 0 && this.free(o) && o.age > .3) { const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; best = o; } }
    if (!best) return;
    const [sx, sy] = W2S(best.x, best.y), r = best.rad * cam.z + 8 + 3 * Math.sin(G.T * 5);
    ring(sx, sy, r, GOLD, .8 * al, 2);
    label('зажми нейтрон, оттяни, отпусти', sx, sy + r + 16, 13, [255, 255, 255], (.75 + .2 * Math.sin(G.T * 4)) * al, 700);
  },
  drawArrows() {
    if (this.doneAt !== null) return;
    edgeArrows(this.o.filter(o => o.Z === 0 || N_BIND[nkey(o)]).map(o => [o.x, o.y, o.Z === 0 ? N_COL.n : nsym(nkey(o))]), 3);
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > N_PAR ? [190, 190, 205] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 3', this.steps(), this.stars, `Гелий по массе: ${Math.round(this.Y() * 100)} %`);
    if (!G.prev && this.doneAt === null) {
      const rest = Math.max(0, N_WIN - this.t), c = rest < 20 ? [255, 140, 120] : [205, 200, 230];
      const shopUp = document.getElementById('shop').style.display === 'flex';
      label(`гелий ${Math.round(this.Y() * 100)} % из 25 · остынет через ${fmtClock(rest)}`, G.W / 2, G.H - (shopUp ? 118 : 52), 13, c, .85 * al, 700);
    }
    hudBanner(this.banner, 'УРОВЕНЬ 3 · первые 3 минуты', 'Ядра', 'собери гелий, пока Вселенная горячая', al);
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return N_VIEW; },
  hud() { return { title: '', sub: `T ≈ ${(this.T() * 1.2).toFixed(1)}·10⁹ K`, lines: [], goal: '', laws: [] }; },
};
