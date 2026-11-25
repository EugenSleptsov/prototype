"use strict";
/* Уровень 5. Атомы — выброс сверхновой остывает, голые ядра одеваются электронами.
   Материал — ядра со «Звёзд» (C, N, O, гелий, водород); при запуске отсюда — набор по умолчанию.
   Физика (упрощённо):
   - ион с зарядом Q = Z − (пойманные электроны) притягивает электроны (кулон);
   - захват только заторможенного электрона (след или «Рекомбинация») — сам по себе горячий пролетит мимо, ждать бесполезно;
   - электроны горячие и быстрые; Вселенная остывает, они медленнеют (вести след легче), но сами не садятся;
   - пойманный электрон сначала на возбуждённой орбите (O*): держится слабо — его сбивает даже видимый свет,
     пока не спрыгнет на основную сам (EX_T) или от следа; спрыгнул — фотон своей спектральной линии,
     и такой же возбуждённый атом на его пути спрыгивает тоже (вынужденное излучение — каскад);
   - оболочки: первые два электрона — K, их жёсткий свет не берёт (сотни эВ); гелий весь такой (24,6 эВ и 54 эВ),
     внешние (L) и водород — уязвимы (11–15 эВ); жёсткий УФ здесь 11–24 эВ;
   - туман — рассеяние света на свободных электронах: чем больше нейтральных, тем прозрачнее (последнее рассеяние).
   Глагол один — след (палец или мышь с зажатой кнопкой): поперёк электрона — тормозит (ион его ловит),
   через дрожащий атом — осаживает электрон, поперёк луча УФ — рассеивает его в безвредный свет.
   Исследование «Рекомбинация»: электроны у ионов тормозят сами (излучают), Вселенная нейтрализуется без тебя.
   Необязательный закон «Красное смещение» (после первого перечёркнутого луча): Вселенная расширяется — часть УФ
   сама слабеет в полёте до видимого света (и приносит ✦ в её строку).
   Мир без края: ионы — ядра твоей сверхновой там, куда их вынесло; Вселенная приносит ионы, электроны и свет из-за края кадра. */
// обзор; ионы Вселенной: плотность и предел в кадре; электронов в кадре — не больше
const A_RED = 25, RED_P = .55; // «Красное смещение»: цена и доля УФ, которая слабеет сама
const REC_TOP = .65; // «Рекомбинация» нейтрализует сама лишь до этой доли — остальное до прозрачности доводишь ты
const A_VIEW = 14.5, A_DENS = .025, A_CAP = 40, A_ECAP = 30, A_COST = 30, A_GOAL = .9, TR_LIFE = 1.1, TR_W = .55; // TR_W — полуширина следа (мир)
const AT_EL = { 1: ['H', [235, 235, 240]], 2: ['He', [200, 250, 255]], 3: ['Li', [200, 120, 255]], 6: ['C', [150, 150, 165]], 7: ['N', [110, 145, 255]], 8: ['O', [250, 95, 80]] };
const atSym = Z => (AT_EL[Z] || [elemOf(Z)[0]])[0];
const atCol = Z => (AT_EL[Z] || [0, [220, 220, 230]])[1];
// символ с зарядом: O, O⁺, O³⁺
const ionSym = (Z, ne) => { const Q = Z - ne; return atSym(Z) + (Q > 0 ? (Q > 1 ? sup(Q) : '') + '⁺' : ''); };
const AT_NEED = [1, 2, 6, 7, 8]; // какие атомы собрать: H, He, C, N, O
// EX_T — сколько живёт возбуждённая орбита; УФ летит медленнее видимого — успеть перечеркнуть
const EX_T = 3.2, UV_V = 13, PH_V = 22, RES_V = 14, UV_T0 = 6;
// спектральная линия элемента (вспышка, когда электрон спрыгивает на основную орбиту): Hα, He D₃, Li, C, N, зелёная линия O
const AT_SPEC = { 1: [255, 80, 95], 2: [255, 235, 120], 3: [255, 90, 60], 6: [120, 200, 255], 7: [150, 120, 255], 8: [90, 255, 160] };
const atSpec = Z => AT_SPEC[Z] || [255, 255, 255];
// сколько эВ нужно, чтобы выбить внешний электрон из основного состояния (по нейтральному атому — упрощённо):
// K-оболочка (первые два) у C/N/O — сотни эВ, гелий — 24,6 (He⁺ — 54): жёсткий свет здесь до 24 эВ их не берёт
const AT_IE = { 1: 13.6, 3: 5.4, 6: 11.3, 7: 14.5, 8: 13.6 };
const ionE = (Z, ne) => Z === 2 || (Z > 2 && ne <= 2) ? Infinity : AT_IE[Z] ?? 12;
const UV_C = [215, 190, 255];

const Atoms = {
  key: 'atoms', name: 'Атомы', bg: [10, 14, 42], sling: true, // sling — палец сам рисует след (без кнопки действия)
  controls: 'След: поперёк электрона — тормозит, через дрожащий атом — осаживает, поперёк УФ — рассеивает',

  enter(prev) {
    this.t = 0; this.clock = 0; this.Ta = 1; this.ions = []; this.el = []; this.ph = []; this.tr = []; this.floats = [];
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.rs = { rec: 0, red: 0 }; this.banner = -1.5; this.tk = {}; this.doneAt = null; this.endCd = -1;
    this.advanced = false; this.cheated = false; this.seenN = new Set(); this.phT = 0; this.was = false; this.stroke = 0;
    this.st = { brakes: 0, ionized: 0, best: 0, relaxed: 0, cascade: 0, cut: 0, shield: 0 }; this.caps = { hand: 0, auto: 0 }; this.msgs = new Set();
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    this.fromStars = !!(prev && prev.o);
    // ионы — ядра со «Звёзд», каждое там, куда его вынесла сверхновая, и с той же скоростью (структура ядра больше не видна — голый ион)
    if (prev && prev.o) for (const o of prev.o) {
      if (o.dead || o.Z < 1) continue;
      if (o.Z === 4) { // ⁸Be — уже два гелия, разлетаются из той же точки
        for (const s of [1, -1]) this.ions.push(Object.assign(this.ion(2, o.x + .15 * s, o.y, 1), { vx: o.vx + .6 * s, vy: o.vy, mine: true, src: s > 0 ? o : null }));
        continue;
      }
      this.ions.push(Object.assign(this.ion(o.Z, o.x, o.y, 1), { vx: o.vx, vy: o.vy, mine: true, src: o }));
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
    // C, N, O не из твоей звезды — честно сказать, откуда они (переждал «Звёзды» — тяжёлое пришло от чужих сверхновых)
    this.gift = prev ? [6, 7, 8].filter(Z => !this.ions.some(i => i.mine && i.Z === Z)).map(atSym).join(', ') : '';
    for (let i = 0; i < 26; i++) this.spawnE(true);
    this.stars = pickStars(this.starPool());
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  // ex — сколько электронов на возбуждённой орбите (внешние из ne), exT — сколько ей ещё жить, by — кто их поймал, kDone — K-оболочка закрыта (награда — раз)
  ion(Z, x, y, age) { return { Z, ne: 0, ex: 0, exT: 0, exAt: -9, by: null, kDone: false, x, y, vx: randn() * .3, vy: randn() * .3, age, rot: Math.random() * TAU, mine: false, src: null }; },
  /** подсказка словами — один раз за уровень @param {string} k @param {string} txt */
  once(k, txt) { if (!this.msgs.has(k)) { this.msgs.add(k); msg(txt); } },
  // ион Вселенной: в основном водород и гелий; тяжёлые — только те, что уже выковали звёзды (или каких вокруг ещё нет)
  cosmicZ() {
    const r = Math.random();
    if (r < .68) return 1;
    if (r < .9) return 2;
    const heavy = [6, 7, 8].filter(Z => !this.fromStars || Codex.has('n:' + Z + ',' + Z) || !this.ions.some(i => i.Z === Z));
    return heavy.length ? pick(heavy) : 1;
  },
  vth() { return 4.5 + 6 * this.Ta; },
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
      if (this.recOn() && Math.random() < Math.min(REC_TOP, this.neutral())) io.ne = io.Z;
      this.ions.push(io);
    }
    haloFill(this.ions, A_DENS, A_CAP, dt, (x, y) => { // и за краем — сдвинул карту, там то же
      const io = this.ion(this.cosmicZ(), x, y, 0);
      if (this.recOn() && Math.random() < Math.min(REC_TOP, this.neutral())) io.ne = io.Z;
      this.ions.push(io);
    }, 2);
  },
  // доля нейтральных — по ионам в кадре и рядом: электроны живут только здесь, и улетевшие далеко ядра сверхновой не держат уровень
  recOn() { return !!this.rs.rec && !Uni.off(this, 'rec'); },
  neutral() { let n = 0, z = 0; for (const i of this.ions) if (!i.dead && inView(i.x, i.y, 4)) { n += Math.min(i.ne, i.Z); z += i.Z; } return z ? n / z : 0; },

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
    if (live && this.gift && this.clock > 4) this.once('gift', `${this.gift} — не из твоих звёзд: их принесло от чужих сверхновых. Своё тяжёлое вещество дороже вдвое`);
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
      if (act && io.ex > 0 && (io.exT -= dt) <= 0) this.relax(io, 'self'); // спрыгнул на основную сам
    }
    // след через дрожащий атом — электрон спрыгивает на основную орбиту (след, проведённый ещё до захвата, не считается)
    if (live && this.tr.length > 1) for (const io of this.ions) {
      if (!(io.ex > 0)) continue;
      for (let i = 1; i < this.tr.length; i++) {
        const p = this.tr[i - 1], q = this.tr[i];
        if (q.t > io.exAt + .25 && segDist(io.x, io.y, p.x, p.y, q.x, q.y) < .9) { this.relax(io, 'hand'); break; }
      }
    }
    const recAuto = this.recOn() && this.doneAt === null && this.neutral() < REC_TOP; // закон тормозит сам — пока не набрал свою долю
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
        // захват: заторможенный, близко и медленно
        if (act && e.slow > 0 && d < .95 + .08 * Q && Math.hypot(e.vx - io.vx, e.vy - io.vy) < 2.4 + .3 * Q) { this.capture(io, e); break; }
        // «Рекомбинация»: у иона электрон излучает и тормозит сам
        if (act && recAuto && d < 4 && e.brk <= 0 && Math.random() < dt * .5) this.brake(e, e.by === 'hand' ? 'hand' : 'auto');
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
      // пересёк след или прошёл рядом с ним — тормозит
      if (live && e.brk <= 0 && this.tr.length > 1) for (let i = 1; i < this.tr.length; i++) {
        const p = this.tr[i - 1], q = this.tr[i];
        if (segX(ox, oy, e.x, e.y, p.x, p.y, q.x, q.y) || segDist(e.x, e.y, p.x, p.y, q.x, q.y) < TR_W) { this.brake(e, 'hand'); break; }
      }
      if (farOff(e)) e.dead = true;
    }
    // свет выбивает электроны, пока горячо
    if (act && this.doneAt === null) {
      this.phT += dt * 2.5 * this.Ta;
      while (this.phT > 1) {
        this.phT--;
        const hard = this.t > UV_T0 && Math.random() < .45 * this.Ta - .12, v = hard ? UV_V : PH_V; // первые секунды — без УФ: дать оглядеться
        const R = viewRadius() * (hard ? 1.15 : 1.05), a = Math.random() * TAU, h = a + Math.PI + randn() * .35;
        this.ph.push({ x: P.x + Math.cos(a) * R, y: P.y + Math.sin(a) * R, vx: Math.cos(h) * v, vy: Math.sin(h) * v, t: 0, hard, E: hard ? rnd(11, 24) : rnd(1.5, 3.5), life: hard ? 3.4 : 2.4,
          red: hard && this.rs.red && !Uni.off(this, 'red') && Math.random() < RED_P ? rnd(.5, 1.3) : 0 }); // red — когда растянется в видимый
      }
    }
    const nf = this.neutral();
    for (const p of this.ph) {
      const ox = p.x, oy = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
      if (!act || p.dead) continue;
      if (p.hard && p.red && p.t >= p.red && !Uni.off(this, 'red')) this.redshift(p);
      // мутная плазма: видимый свет блуждает на свободных электронах — пока Вселенная не нейтральна
      if (!p.hard && !p.res && Math.random() < dt * 3 * (1 - nf)) { const w = randn() * .8, c = Math.cos(w), s = Math.sin(w); [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c]; }
      // перечеркнул УФ следом — рассеян в безвредный видимый свет
      if (live && p.hard && this.tr.length > 1) for (let i = 1; i < this.tr.length; i++) {
        const a = this.tr[i - 1], b = this.tr[i];
        if (segX(ox, oy, p.x, p.y, a.x, a.y, b.x, b.y) || segDist(p.x, p.y, a.x, a.y, b.x, b.y) < TR_W * 1.3) { this.cutUV(p); break; }
      }
      for (const io of this.ions) {
        if (io.ne <= 0 || io === p.from || io === p.pass) continue;
        const d2 = (io.x - p.x) ** 2 + (io.y - p.y) ** 2;
        if (d2 > 1.6 || !inView(io.x, io.y)) continue; // ободок за краем свет не трогает: ионизация там была бы невидимой порчей
        if (d2 > (p.res === io.Z && io.ex > 0 ? 1.6 : .8)) continue;
        if (io.ex > 0) {
          if (p.res === io.Z) { this.relax(io, p.hand ? 'casc' : 'self'); p.dead = true; break; } // вынужденное излучение: та же линия осаживает такой же атом (цепочку начал твой след — каскад твой)
          if (p.hard || Math.random() < .5) { this.ionize(io, p); p.dead = true; break; } // возбуждённый держится слабо — сбивает и видимый свет
          p.pass = io; continue; // пронесло (одна проверка на атом)
        }
        if (!p.hard) continue;
        if (p.E >= ionE(io.Z, io.ne)) this.ionize(io, p); else this.shield(io);
        p.dead = true; break;
      }
    }
    this.ph = this.ph.filter(p => !p.dead && p.t < (p.life || 2.4));
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
      fxRing(P.x, P.y, 1, GOLD, viewRadius() * 1.3, 1.8); fxFlash(P.x, P.y, viewRadius(), [255, 240, 210], .35);
      msg('Последнее рассеяние: свет летит свободно — Вселенная прозрачна');
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); } // молекулам — эти же атомы, на своих местах
  },
  // пойман — но сперва на возбуждённой орбите: награда за атом — когда спрыгнет на основную
  capture(io, e) {
    e.dead = true; io.ne++; io.ex = (io.ex || 0) + 1; io.exT = EX_T; io.exAt = G.T;
    if (e.by === 'hand') { this.caps.hand++; io.by = 'hand'; } else { this.caps.auto++; if (io.by !== 'hand') io.by = 'auto'; }
    fxRing(io.x, io.y, .3, atCol(io.Z), 1.6, .5);
    Sfx.play('catch', Math.min(3, io.ne - 1));
    this.once('ex', 'Пойман, но дрожит на внешней орбите — проведи следом через атом, пока свет его не сбил');
  },
  // электроны спрыгнули на основную орбиту: вспышка своей линии и фотон этой линии (how: 'hand' — след, 'casc' — фотон соседа, 'self' — сам)
  relax(io, how) {
    if (!(io.ex > 0)) return;
    io.ex = 0; io.exT = 0;
    const c = atSpec(io.Z), s = atSym(io.Z), me = how !== 'self' || io.by === 'hand'; io.by = null;
    fxFlash(io.x, io.y, how === 'self' ? .9 : 1.6, c, how === 'self' ? .35 : .65); fxRing(io.x, io.y, .3, c, how === 'self' ? 1.3 : 2.4, .55);
    const a = Math.random() * TAU; this.ph.push({ x: io.x, y: io.y, vx: Math.cos(a) * RES_V, vy: Math.sin(a) * RES_V, t: 0, hard: false, E: 2, res: io.Z, from: io, hand: how !== 'self', life: 1.6 });
    let pts = 0, txt = '', big = false;
    const is = ionSym(io.Z, io.ne);
    if (how === 'hand') { this.st.relaxed++; pts += 1; txt = `${is}* → ${is}`; Sfx.play('catch', 3); }
    else if (how === 'casc') { this.st.cascade++; pts += 2; txt = `каскад ${is}`; Sfx.play('catch', 3); this.once('casc', 'Фотон той же линии осадил такой же атом — каскад'); }
    if (io.Z > 2 && io.ne >= 2 && !io.kDone) { io.kDone = true; if (me) { pts += 2; txt = (txt || is) + ' · K-оболочка'; } }
    if (io.ne >= io.Z) { // нейтральный атом — своими руками дороже
      Codex.note('a:' + io.Z); pts += me ? 4 : 2; if (!txt || how === 'self') txt = s;
      if (!this.seenN.has(io.Z)) { this.seenN.add(io.Z); pts += 10; txt = `НОВЫЙ АТОМ ${s} · ${elemOf(io.Z)[1].toLowerCase()}`; big = true; Sfx.play('fresh'); }
      fxFlash(io.x, io.y, 1.4, atCol(io.Z), .6);
      if (io.mine && io.Z >= 6) { pts *= 2; txt += ' · из твоей звезды ×2'; } // выкованное тобой вещество — дороже: переждать «Звёзды» не то же самое
    }
    if (!pts) return;
    if (me) this.kn += pts; else Uni.pay(this, 'rec', pts); // осадила и собрала Вселенная — в сводку
    this.float(io.x, io.y - .8, `${txt} +${pts} ✦`, big ? [255, 215, 110] : c, big ? 16 : 13);
  },
  ionize(io, p) {
    const exc = io.ex > 0;
    io.ne--; this.st.ionized++; if (exc) io.ex--; if (!io.ex) io.by = null;
    const a = Math.atan2(p.vy, p.vx) + randn() * .5, v = 12;
    this.el.push({ x: io.x, y: io.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, k: 1, slow: 0, brk: .5, by: null, age: 1 });
    fxFlash(io.x, io.y, .9, [255, 255, 255], .3);
    if (exc && !p.hard) this.once('soft', 'Свет сбил электрон с возбуждённой орбиты — осаживай следом сразу');
    else this.once('ion', 'Жёсткий свет выбил электрон — перечеркни луч следом, пока он летит');
  },
  // жёсткий свет ударил в закрытую оболочку — не взял
  shield(io) {
    if (G.T - (io.shT || -9) < .4) return;
    io.shT = G.T; this.st.shield++;
    fxRing(io.x, io.y, .5, [160, 240, 255], 1.2, .35);
    this.once('shield', io.Z === 2 ? 'Гелий держит жёсткий свет: его оболочка закрыта' : 'Закрытую K-оболочку жёсткий свет не берёт');
  },
  // «Красное смещение»: пространство растянуло УФ — теперь это видимый свет (✦ — Вселенной)
  redshift(p) {
    p.hard = false; p.red = 0; p.E = rnd(1.5, 3); p.redT = p.t;
    const s = Math.hypot(p.vx, p.vy) || 1; p.vx *= PH_V / s; p.vy *= PH_V / s; p.life = p.t + 1.2;
    fxRing(p.x, p.y, .15, [255, 120, 90], .8, .35);
    Uni.pay(this, 'red', 1);
    if (inView(p.x, p.y, 0)) this.float(p.x, p.y - .4, 'УФ → свет +1 ✦', [255, 150, 120], 11);
  },
  // след поперёк луча УФ: рассеян, теперь это безвредный видимый свет
  cutUV(p) {
    const a = Math.atan2(p.vy, p.vx) + (Math.random() < .5 ? -1 : 1) * rnd(.6, 1.4);
    p.hard = false; p.E = rnd(1.5, 3); p.vx = Math.cos(a) * PH_V; p.vy = Math.sin(a) * PH_V; p.cut = true; p.life = p.t + 1;
    this.st.cut++; this.kn += 1; Sfx.play('pop');
    fxFlash(p.x, p.y, .7, UV_C, .35); fxRing(p.x, p.y, .2, UV_C, .9, .3);
    this.float(p.x, p.y - .4, 'УФ рассеян +1 ✦', UV_C, 12);
    this.once('cut', 'Перечеркнул жёсткий свет — рассеялся, стал безвредным');
  },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() {
    if (this.doneAt !== null) return [];
    const L = [];
    if (this.seenN.size >= 2 && !this.rs.rec) L.push({ k: 'rec', ic: '◎', name: 'Рекомбинация', about: 'электроны у ионов тормозят сами', c: A_COST });
    if (this.st.cut >= 1 && !this.rs.red) L.push({ k: 'red', ic: '∿', name: 'Красное смещение', about: 'часть УФ сама слабеет в полёте', c: A_RED, opt: true });
    return L;
  },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs[it.k] = 1; Sfx.play('upgrade'); Uni.learn(this, it.k, it.ic, it.name, UNI_LVL);
    fxRing(P.x, P.y, 1, GOLD, viewRadius() * .8, 1.4); this.float(P.x, P.y - 1, `${it.ic} ${it.name}`, GOLD, 16);
    if (it.k === 'red') msg('Вселенная расширяется: часть жёсткого света сама растягивается в видимый');
  },
  renderShop: Nuclei.renderShop,

  // ---------- задание ----------
  steps() {
    const n = this.neutral(), touch = isTouch();
    return [
      { t: 'Затормози электрон', h: touch ? 'проведи пальцем поперёк его пути' : 'зажми мышь и проведи поперёк его пути', s: 'электрон замедлился', d: this.st.brakes > 0 },
      { t: 'Осади пойманный электрон', h: 'он дрожит на внешней орбите — проведи следом через атом', s: 'спектральная линия', d: this.st.relaxed > 0 },
      { t: 'Одень ядра электронами', h: 'гелий и закрытую K-оболочку жёсткий свет не берёт', items: AT_NEED.map(Z => [atSym(Z), this.seenN.has(Z)]), s: 'H, He, C, N, O', d: AT_NEED.every(Z => this.seenN.has(Z)) },
      { t: 'Сформируй закон «Рекомбинация»', h: `${touch ? 'в лавке' : 'клавиша 1'} за ${A_COST} ✦`, s: 'рекомбинация', d: this.rs.rec > 0, res: 'rec' },
      { t: 'Сделай Вселенную прозрачной', h: `свет рассеивают свободные электроны — нейтрализуй 90 %${this.rs.rec ? `: «Рекомбинация» сама — до ${REC_TOP * 100} %, дальше ты` : ''}`, p: [Math.min(90, Math.round(n * 100)), 90], s: 'последнее рассеяние', d: n >= A_GOAL },
    ];
  },
  starPool() {
    return [
      { t: 'свет не выбил ни одного электрона', bad: () => this.st.ionized > 0, atEnd: true },
      { t: 'один росчерк — 3 электрона', ok: () => this.st.best >= 3 },
      { t: 'перечеркни 5 лучей УФ', ok: () => this.st.cut >= 5 },
      { t: 'каскад: атом осадил атом', ok: () => this.st.cascade >= 1 },
      { t: 'быстрее 2:00', bad: () => this.clock > 120, atEnd: true },
      { t: 'кислород раньше углерода', ok: () => this.seenN.has(8) && !this.seenN.has(6), bad: () => this.seenN.has(6) && !this.seenN.has(8) },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 1, '★ +10 ✦', [255, 215, 110], 17); }); },
  tally() {
    const n = this.caps.hand + this.caps.auto, at = this.ions.filter(i => i.ne >= i.Z).length;
    return { name: 'Атомы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['нейтральных атомов', `${at} из ${this.ions.length}`], ['электроны — следом', this.caps.hand], ['электроны — Вселенная', this.caps.auto], ['осажено следом · каскадом', `${this.st.relaxed} · ${this.st.cascade}`], ['УФ перечёркнуто', this.st.cut]], auto: [this.caps.auto, n], stars: this.stars };
  },
  cheat() { this.cheated = true; for (const io of this.ions) { io.ne = io.Z; io.ex = 0; this.seenN.add(io.Z); } for (const Z of AT_NEED) this.seenN.add(Z); this.st.brakes++; this.st.relaxed++; this.rs.rec = 1; },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    for (const p of this.ph) {
      const [sx, sy] = W2S(p.x, p.y); if (!onScreen(sx, sy, 40)) continue;
      if (p.hard) { // УФ: яркий, с длинным хвостом — видно издалека, успей перечеркнуть
        line(sx, sy, sx - p.vx * .09 * z, sy - p.vy * .09 * z, UV_C, .85 * al, Math.max(2, .14 * z));
        glow(sx, sy, Math.max(6, .5 * z), UV_C, (.45 + .25 * Math.sin(G.T * 18)) * al);
      } else if (p.res) { const c = atSpec(p.res); line(sx, sy, sx - p.vx * .06 * z, sy - p.vy * .06 * z, c, .7 * al, Math.max(1.5, .1 * z)); glow(sx, sy, Math.max(4, .3 * z), c, .5 * al); }
      else if (p.redT != null && p.t - p.redT < .6) line(sx, sy, sx - p.vx * .06 * z, sy - p.vy * .06 * z, [255, 110, 90], .6 * al, Math.max(1.6, .1 * z));
      else line(sx, sy, sx - p.vx * .05 * z, sy - p.vy * .05 * z, p.cut ? UV_C : [255, 200, 140], (p.cut ? .4 : .25) * al, Math.max(1.2, .08 * z));
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
      const ex = io.ex || 0, gn = io.ne - ex; // на основных орбитах / на возбуждённой
      // закрытая оболочка — щит: гелий целиком, у C/N/O — K (первые два)
      if (io.Z >= 2 && gn >= 2) ring(sx, sy, .55 * z + r, [160, 240, 255], (io.Z === 2 ? .55 : .3) * a, io.Z === 2 ? 2 : 1.2);
      for (let i = 0; i < gn; i++) {
        const inner = i < 2, n = inner ? Math.min(gn, 2) : gn - 2, k = inner ? i : i - 2;
        const R = (inner ? .55 : .95) * z + r, an = io.rot * (inner ? 1.4 : .9) + k / n * TAU;
        ball(sx + Math.cos(an) * R, sy + Math.sin(an) * R, Math.max(1.4, .09 * z), [200, 235, 255], a);
      }
      if (ex > 0) { // возбуждённая орбита: широкая, дрожит, цвет линии элемента; дуга — сколько ей ещё жить
        const sc = atSpec(io.Z), Rx = (1.45 + .08 * Math.sin(G.T * 14)) * z + r;
        ring(sx, sy, Rx, sc, .35 * a, 1, [4, 4]);
        arc(sx, sy, Rx + 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(io.exT / EX_T, 0, 1), sc, .7 * a, 2);
        for (let k = 0; k < ex; k++) { const an = -io.rot * 1.7 + k / ex * TAU, ex2 = sx + Math.cos(an) * Rx, ey2 = sy + Math.sin(an) * Rx; glow(ex2, ey2, Math.max(4, .3 * z), sc, .7 * a); ball(ex2, ey2, Math.max(1.6, .1 * z), [255, 255, 255], a); }
      }
      label(ionSym(io.Z, io.ne) + (ex ? '*' : ''), sx, sy - r - (ex ? 1.8 : io.ne > 2 ? 1.2 : .8) * z, 12, ex ? atSpec(io.Z) : Q > 0 ? [210, 215, 235] : [255, 255, 255], .85 * a, 700);
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
      if (e) { const [sx, sy] = W2S(e.x, e.y); ring(sx, sy, 14 + 3 * Math.sin(G.T * 5), GOLD, .8 * al, 2); label('проведи поперёк его пути', sx, sy + 30, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, e.vx, e.vy, al); }
    } else if (G.started && !G.paused && !G.prev && this.doneAt === null && !this.tr.length) {
      // следующий урок — показом: дрожащий атом (осади), потом луч УФ (перечеркни)
      // только то, что видно: не под панелью задания сверху и не у края
      const near = o => Math.hypot(o.x - P.x, o.y - P.y), clear = o => { const [x, y] = W2S(o.x, o.y); return x > 70 && x < G.W - 70 && y > Math.min(230, G.H * .35) && y < G.H - 90; };
      const io = this.st.relaxed === 0 ? this.ions.filter(i => i.ex > 0 && G.T - i.exAt > .3 && clear(i)).sort((u, v) => near(u) - near(v))[0] : null;
      const p = !io && this.st.cut === 0 ? this.ph.find(p => p.hard && p.t > .4 && clear(p)) : null;
      if (io) { const [sx, sy] = W2S(io.x, io.y); ring(sx, sy, 1.9 * cam.z + 8 + 3 * Math.sin(G.T * 5), atSpec(io.Z), .8 * al, 2); label('проведи через атом', sx, sy + 1.9 * cam.z + 26, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, 0, 1, al); }
      else if (p) { const [sx, sy] = W2S(p.x, p.y); ring(sx, sy, 16 + 3 * Math.sin(G.T * 5), UV_C, .8 * al, 2); label('перечеркни луч', sx, sy + 32, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, p.vx, p.vy, al); }
    }
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  // туман: свет рассеивается на свободных электронах — редеет, как только они садятся на ядра (последнее рассеяние)
  fog() { return .5 * (1 - smooth(.15, A_GOAL, this.neutral())) * smooth(0, 2, this.t); },
  overlay(al) {
    const fog = this.fog() * al;
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
