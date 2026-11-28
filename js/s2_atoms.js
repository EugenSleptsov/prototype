"use strict";
/* Уровень 5. Атомы — туманность сверхновой расширяется и остывает, её ионы одеваются электронами.
   Это не космологическая рекомбинация (она была через 380 000 лет, до звёзд — мост на «Звёздах»):
   здесь ионы C, N, O и захваченные выбросом H и He ловят электроны в остывающем остатке.
   Материал — ядра со «Звёзд» (C, N, O, гелий, водород); при запуске отсюда — набор по умолчанию.
   Физика (упрощённо):
   - ион с зарядом Q = Z − (пойманные электроны) притягивает электроны (кулон);
   - захват только заторможенного электрона (след или «Рекомбинация») — сам по себе горячий пролетит мимо, ждать бесполезно;
   - электроны горячие и быстрые; туманность остывает, они медленнеют (вести след легче), но сами не садятся;
   - пойманный электрон сначала на возбуждённой орбите (O*): держится слабо — его сбивает даже видимый свет,
     пока не спрыгнет на основную сам (EX_T) или от следа; спрыгнул — фотон своей спектральной линии,
     и такой же возбуждённый атом на его пути спрыгивает тоже (вынужденное излучение — каскад): фотон летит дальше,
     и рядом с ним — его копия (то же направление, та же линия);
   - упрощение: линия и энергия ионизации — по элементу, как у нейтрального атома (у O⁵⁺ на деле выше, чем у O);
   - оболочки: первые два электрона — K, их жёсткий свет не берёт (сотни эВ); гелий весь такой (24,6 эВ и 54 эВ),
     внешние (L) и водород — уязвимы (11–15 эВ); жёсткий УФ здесь 11–24 эВ;
   - свечение — ионизованный газ светится (линии рекомбинации, Hα): пока ионы голые, туманность горячая и светится;
     нейтральная — тёмный холодный газ, где соберутся молекулы (не «туман на свободных электронах»: это физика
     реликтового света через 380 000 лет, а туманность сверхновой разрежена — свет сквозь неё и так проходит).
   Глагол — след (палец или мышь с зажатой кнопкой): поперёк электрона — тормозит (ион его ловит),
   через дрожащий атом — осаживает электрон, поперёк луча УФ — рассеивает его в безвредный свет.
   Второй жест — атом рогаткой, как предметы на всех уровнях (разбор дизайна: один глагол на игру): зажал — атом стоит
   (заторможенные рядом садятся), оттянул и отпустил — полетел и встаёт, где кончился разгон (пунктир). Это расстановка,
   а не пылесос: брось его под уже заторможенные следом электроны, из-под луча УФ, в ряд для каскада.
   Тормозит, осаживает и рассеивает по-прежнему только след.
   Исследование «Рекомбинация»: электроны у ионов тормозят сами (излучают), туманность нейтрализуется без тебя.
   Необязательный закон «Разлёт туманности» (ключ 'red', после первого перечёркнутого луча): туманность расширяется
   и редеет — часть УФ уходит из неё мимо атомов, безвредно (и приносит ✦ в строку Вселенной).
   Мир без края: ионы — ядра твоей сверхновой там, куда их вынесло; Вселенная приносит ионы, электроны и свет из-за края кадра.
   Прошлый уровень весом (второе ревью №6): C, N, O, которых твоя звезда не выковала, — не подарок на старте, а пыль
   соседних сверхновых: первая — через DUST_T, потом реже своих (DUST_K); строка на старте — что из твоей звезды.
   Финал — охота, а не ожидание (№12): выше REC_TOP приток из-за края нейтрален, как твой кадр (дрейф не откатывает),
   выше HUNT_AT голые ионы в счёте доли отмечены, за краем — стрелки.
   Другой конец (урок GDD 50): с охоты или с A_LATE — часы A_COOL; не успел к 90 % — туманность остыла сама, без бонуса. */
// обзор; ионы Вселенной: плотность и предел в кадре; электронов в кадре — не больше
const A_RED = 25, RED_P = .55; // «Разлёт туманности»: цена и доля УФ, которая уходит сама
const HOLD_R = 3, HOLD_PICK = .45, HOLD_CAP = 1.5; // взятый атом: круг, где его тянут заторможенные электроны (показ); как близко к атому нажать (чуть шире ядра: след рядом с атомом — след, а не захват); поблажка захвату (только заторможенным)
const A_VMAX = 7, ION_DRAG = .6; // рогатка атома: скорость при полной резинке; торможение иона в туманности (1/с) — бросок встаёт через ~v/0,6
const A_SPARSE = .7; // в кадре меньше этой доли обычного числа ионов — пустота: недостающие считаются голыми
const REC_TOP = .65; // «Рекомбинация» нейтрализует сама лишь до этой доли — остальное до 90 % доводишь ты
const A_REFM = 4; // доля нейтральных — по ионам кадра-эталона и ещё на столько за его краем (там ионы есть, но не видны)
const HUNT_AT = .75, HUNT_N = 4; // нейтральных больше — голые ионы в счёте доли отмечены (за краем кадра — стрелки, не больше HUNT_N)
// уровень не бесконечный (игрок: «набрать 90 невозможно, остаюсь на 80»): с охоты (HUNT_AT) или с A_LATE с — часы A_COOL с,
// потом туманность остывает сама — конец без бонуса уровня; цель 90 % та же, одетые атомы идут в «Молекулы», голые ионы — нет
const A_LATE = 240, A_COOL = 90;
// C, N, O не из твоей звезды — пыль соседних сверхновых: первая через DUST_T с, потом — доля DUST_K от своих;
// пропала из виду, а элемент ещё не одет — следующая через DUST_GAP с (уровень проходим и без твоей звезды)
const DUST_T = 25, DUST_K = .3, DUST_GAP = 15;
const A_VIEW = 14.5, A_DENS = .025, A_CAP = 40, A_ECAP = 30, A_COST = 30, A_GOAL = .9, TR_LIFE = 1.1, TR_W = .55; // TR_W — полуширина следа (мир)
// запас следа (REVIEW_DESIGN 5.2): росчерк тратит INK на единицу длины, запас копится INK_REG в секунду; кончился — след
// рвётся и продолжается, только когда накопится INK_GO. Точный росчерк поперёк электрона стоит 1–2 ед., каракули по всему
// экрану — нет (раньше слепой зигзаг одним зажатием без закона давал 74–79 % нейтральных за 2 минуты)
const INK_MAX = 8, INK_REG = 2.5, INK_GO = 2;
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
  controls: 'След поперёк электрона тормозит его, через дрожащий атом осаживает, поперёк УФ рассеивает · Зажать атом, оттянуть, отпустить: под заторможенные электроны',
  gest() { return { obj: 'атом: оттянуть, отпустить — встанет в конце пунктира; держишь — стоит', empty: 'вести: след тормозит e⁻, осаживает атом, рассеивает УФ' }; },
  // рогатка атома (sling.js): хозяин даёт тела, радиус, резинку; мимо атома — не карта, а след (noPan)
  noPan: true,
  alien: /** @type {number[]} */ ([]), // C, N, O не из твоей звезды (enter)
  bodies() { return this.ions; },
  /** @param {{x: number, y: number, vx: number, vy: number, Z: number, ne: number}} b */ grabR(b) { return HOLD_PICK + .06 * b.Z; },
  full() { return slingFullPx() / cam.z; },
  vmax() { return A_VMAX; },
  /** @param {{x: number, y: number, vx: number, vy: number, Z: number, ne: number}} b */
  hold(b) {
    b.vx = b.vy = 0; this.st.held++; Tips.did('atoms:hold');
    this.once('hold', 'Атом — рогаткой, как везде: оттянуть и отпустить — встанет в конце пунктира. Пока держишь — стоит, заторможенные рядом садятся. Тормозит и осаживает — след');
  },
  /** @param {{x: number, y: number, vx: number, vy: number, Z: number, ne: number}} b @param {number} vx @param {number} vy */
  // брошенный тобой голый ион идёт в долю, где бы ни встал, пока не одет: выбросить его за край счёта — не способ (REVIEW_DESIGN 5.4)
  launch(b, vx, vy) { b.vx = vx; b.vy = vy; if (Math.hypot(vx, vy) > .5) b.thr = true; },
  // путь броска: ион тормозится туманностью (ION_DRAG) и встаёт; у точки остановки — сколько там заторможенных e⁻
  /** @param {{x: number, y: number, vx: number, vy: number, Z: number, ne: number}} b @param {number} vx @param {number} vy */
  predict(b, vx, vy) {
    const pts = [[b.x, b.y]]; let x = b.x, y = b.y, ux = vx, uy = vy;
    for (let t = 0; t < 6 && Math.hypot(ux, uy) > .25; t += 1 / 30) { const k = Math.exp(-ION_DRAG / 30); x += ux / 30; y += uy / 30; ux *= k; uy *= k; pts.push([x, y]); }
    const n = b.Z - b.ne > 0 ? this.el.filter(e => !e.dead && e.slow > 0 && Math.hypot(e.x - x, e.y - y) < HOLD_R).length : 0;
    return { pts, x, y, hit: n > 0, label: b.Z - b.ne <= 0 ? 'нейтральный: ловить нечего' : n ? `встанет у ${n} заторм. e⁻` : 'встанет здесь', c: n ? [170, 255, 210] : [215, 220, 235] };
  },

  enter(prev) {
    this.t = 0; this.clock = 0; this.Ta = 1; this.ions = []; this.el = []; this.ph = []; this.tr = []; this.floats = [];
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.rs = { rec: 0, red: 0 }; this.banner = -1.5; this.tk = {}; this.doneAt = null; this.endCd = -1;
    this.failed = false; this.coolAt = null; this.nEnd = null; // coolAt — когда пошли часы остывания; nEnd — доля, с которой остыла сама
    this.advanced = false; this.cheated = false; this.seenN = new Set(); this.phT = 0; this.was = false; this.stroke = 0; this.grab = null; this.trOn = false; this.ink = INK_MAX; this.dry = false;
    this.sl = new Sling(this);
    this.st = { brakes: 0, ionized: 0, best: 0, relaxed: 0, cascade: 0, cut: 0, shield: 0, held: 0 }; this.caps = { hand: 0, auto: 0 }; this.msgs = new Set();
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    this.zc = { x: P.x, y: P.y }; // туманность считается здесь, на месте сверхновой, а не там, куда уехала карта (REVIEW_DESIGN 5.4)
    this.fromStars = !!(prev && prev.o); this.alien = []; this.dustAt = {};
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
    // C, N, O, что выковала твоя звезда (mine); прочие тяжёлые — чужие: придут пылью соседних сверхновых, позже и реже
    // (с титула звезды не было — набор по умолчанию, чужих нет)
    this.own = this.fromStars ? [6, 7, 8].filter(Z => this.ions.some(i => i.mine && i.Z === Z)) : [6, 7, 8];
    this.alien = [6, 7, 8].filter(Z => !this.own.includes(Z));
    // ионы Вселенной — за краем кадра; каждого нужного атома — хотя бы по одному (чужой тяжёлый — нет: он придёт пылью)
    const z1 = zoomFor(this), want = popWant(A_DENS, A_CAP, z1);
    for (let k = 0; this.ions.length < want && k < want * 3; k++) { const at = beyondPos(z1, 1, false); if (at) this.ions.push(this.ion(this.cosmicZ(), at[0], at[1], 1)); }
    for (const Z of AT_NEED) if (!this.alien.includes(Z) && !this.ions.some(i => i.Z === Z)) { const at = beyondPos(z1, 1, false) || [P.x + rnd(-8, 8), P.y + rnd(-8, 8)]; this.ions.push(this.ion(Z, at[0], at[1], 1)); }
    this.Zsum = this.ions.reduce((s, i) => s + i.Z, 0);
    // строка на старте — что из твоей звезды (с титула звезды не было — молчим)
    const own = this.own.map(atSym).join(', '), alien = this.alien.map(atSym).join(', ');
    this.origin = !this.fromStars ? '' : !alien ? `Из твоей звезды: ${own}. Тяжёлые атомы из своей звезды ценятся вдвое`
      : own ? `Из твоей звезды: ${own} (✦ вдвое). ${alien} она не выковала — их принесёт пыль соседних сверхновых: позже и реже`
        : 'Твоя звезда не выковала C, N, O — их принесёт пыль соседних сверхновых: позже и реже';
    for (let i = 0; i < 26; i++) this.spawnE(true);
    // кузница частиц: распады μ и τ, научённые Вселенной, выковали электроны — они здесь холодными, у ионов
    const pS = G.fromI ? null : STAGES.find(s => s.key === 'particles');
    this.eForge = Math.min(E_FORGE, pS && /** @type {{ eRes?: number }} */ (pS).eRes || 0);
    const bare = this.ions.filter(i => i.ne < i.Z).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y)).slice(0, 8); // ближние к тебе ионы
    for (let k = 0; k < this.eForge && bare.length; k++) {
      const io = bare[k % bare.length], a = Math.random() * TAU, d = rnd(1.4, 2.2);
      this.el.push({ x: io.x + Math.cos(a) * d, y: io.y + Math.sin(a) * d, vx: -Math.sin(a) * .6, vy: Math.cos(a) * .6, k: 1, slow: 4.5, brk: 1, by: null, age: 1 });
    }
    this.stars = pickStars(this.starPool());
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  // ex — сколько электронов на возбуждённой орбите (внешние из ne), exT — сколько ей ещё жить, exH — сколько из них поймано следом,
  // hN — сколько электронов иона поймано следом за всё время (ручная цена — на электрон, а не на ион), kDone — K-оболочка закрыта (награда — раз)
  ion(Z, x, y, age) { return { Z, ne: 0, ex: 0, exT: 0, exAt: -9, exH: 0, hN: 0, kDone: false, x, y, vx: randn() * .3, vy: randn() * .3, age, rot: Math.random() * TAU, mine: false, src: null }; },
  /** подсказка словами — один раз за уровень @param {string} k @param {string} txt */
  once(k, txt) { if (!this.msgs.has(k)) { this.msgs.add(k); tipMsg(this.key + ':' + k, txt); } }, // урок — раз за всю игру
  // ион Вселенной: в основном водород и гелий, тяжёлым — по равной доле на C, N и O; чужой (не из твоей звезды) —
  // только после DUST_T и в DUST_K случаев, иначе на его месте водород: не выковал — тяжёлого в туманности меньше
  cosmicZ() {
    const r = Math.random();
    if (r < .68) return 1;
    if (r < .9) return 2;
    const Z = [6, 7, 8][Math.min(2, Math.floor((r - .9) / .1 * 3))];
    if (this.alien.includes(Z) && (this.clock < DUST_T || Math.random() >= DUST_K)) return 1;
    return Z;
  },
  // ион из-за края: туманность вокруг нейтральна так же, как твой кадр. До REC_TOP — с «Рекомбинацией» он с долей
  // нейтральных одет целиком (иначе голый); выше REC_TOP — электронов ≈ доля × Z при любом законе: дрейф из-за края
  // не откатывает набранное (раньше 35 % приплывших были голыми, и один O⁸⁺ ронял 85 % → 78 %)
  /** @param {any} io */
  inflow(io) {
    const n = this.neutral();
    if (n > REC_TOP) io.ne = Math.min(io.Z, Math.floor(n * io.Z + Math.random()));
    else if (this.recOn() && Math.random() < n) io.ne = io.Z;
    io.kDone = io.Z > 2 && io.ne >= 2; // K-оболочку закрыл не ты — награды за неё нет
    return io;
  },
  // пыль соседних сверхновых: чужой C, N, O, которого ты ещё не одел и которого нет рядом, — из-за края, раз в DUST_GAP
  dustTick() {
    if (!this.alien.length || this.clock < DUST_T) return;
    const m = haloM(), got = [];
    for (const Z of this.alien) {
      if (this.seenN.has(Z) || this.clock - (this.dustAt[Z] ?? -1e9) < DUST_GAP) continue;
      if (this.ions.some(i => !i.dead && i.Z === Z && inView(i.x, i.y, m))) continue;
      const r = rimPos(1), io = this.inflow(this.ion(Z, r.x, r.y, 0)), sp = rnd(.9, 1.4);
      io.ne = Math.min(io.ne, Z - 1); io.kDone = io.ne >= 2; io.dust = true; // хоть один электрон — поймать тебе: иначе атом не засчитать
      io.vx += r.nx * sp; io.vy += r.ny * sp; this.ions.push(io); this.dustAt[Z] = this.clock; got.push(atSym(Z));
    }
    if (got.length && !this.msgs.has('dust')) { this.msgs.add('dust'); msg(`Пыль соседних сверхновых: ${got.join(', ')} — чужие ядра, их мало`); }
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
    dissolveFar(this.ions, i => zoneNear(this.zc) && this.counted(i)); // туманность, где считается доля, не растворяется — и когда карта уехала
    this.ions = this.ions.filter(i => !i.dead);
    if (this.doneAt !== null) return;
    const have = this.ions.filter(i => inView(i.x, i.y, 1)).length;
    if (have < popWant(A_DENS, A_CAP) && Math.random() < dt * 3) {
      const r = rimPos(1), io = this.inflow(this.ion(this.cosmicZ(), r.x, r.y, 0)), sp = rnd(.6, 1.4);
      io.vx += r.nx * sp; io.vy += r.ny * sp;
      this.ions.push(io);
    }
    haloFill(this.ions, A_DENS, A_CAP, dt, (x, y) => { // и за краем — сдвинул карту, там то же
      this.ions.push(this.inflow(this.ion(this.cosmicZ(), x, y, 0)));
    }, 2);
  },
  // доля нейтральных — по ионам в кадре и рядом: электроны живут только здесь, и улетевшие далеко ядра сверхновой не держат уровень
  recOn() { return !!this.rs.rec && !Uni.off(this, 'rec'); },
  // знаменатель — не меньше A_SPARSE обычного числа ионов кадра: увёл камеру в пустоту, где пара нейтральных, —
  // это не «туманность прозрачна», недостающие ионы считаются голыми (игрок: «отодвинул где ничего нет — 100 %»)
  // возбуждённый атом ещё светится — нейтральным он станет, когда электрон спрыгнет на основную (ne − ex)
  counted(i) { return !i.dead && (inZone(this.zc, i.x, i.y, A_REFM) || (i.thr && i.ne < i.Z)); },
  neutral() { let n = 0, z = 0; for (const i of this.ions) if (this.counted(i)) { n += Math.min(i.ne - (i.ex || 0), i.Z); z += i.Z; } return n / Math.max(z, this.zFloor(), 1); },
  zFloor() { return A_SPARSE * popWant(A_DENS, A_CAP, refZ()); },
  sparse() { let z = 0; for (const i of this.ions) if (this.counted(i)) z += i.Z; return z < this.zFloor(); },
  // последние проценты — охота: голые (и недоодетые) ионы, что идут в долю, когда нейтральных больше HUNT_AT
  huntList() {
    if (this.doneAt !== null || this.neutral() <= HUNT_AT) return [];
    return this.ions.filter(i => i.ne < i.Z && this.counted(i));
  },

  // ---------- след ----------
  tickTrail(live, dt) {
    const down = live && mouse.down && !G.paused && this.doneAt === null;
    this.ink = Math.min(INK_MAX, this.ink + INK_REG * dt);
    if (down && !this.was) { // нажал на атом — его берёт рогатка (sl), мимо — новый росчерк следа
      const [x, y] = S2W(mouse.x, mouse.y);
      this.trOn = !this.ionAt(x, y);
      if (this.trOn) { this.stroke++; this.strokeN = 0; this.tr = []; this.dry = this.ink < INK_GO; }
    }
    if (!down) this.trOn = false;
    this.was = down;
    if (down && this.trOn) {
      const [x, y] = S2W(mouse.x, mouse.y), l = this.tr[this.tr.length - 1];
      if (this.dry) { // запас кончился: след ждёт, пока накопится, и идёт дальше с разрывом (разрыв — конец «росчерка»)
        if (this.ink >= INK_GO) { this.dry = false; this.tr.push({ x, y, t: G.T, gap: true }); }
      } else if (!l) this.tr.push({ x, y, t: G.T });
      else { const d = Math.hypot(l.x - x, l.y - y);
        if (d > .12) { if (d <= this.ink) { this.ink -= d; this.tr.push({ x, y, t: G.T }); }
          else { this.dry = true; this.strokeN = 0; this.once('ink', 'След иссяк: запас копится заново. Точный короткий росчерк поперёк электрона дешевле каракулей'); } } }
    }
    this.tr = this.tr.filter(p => G.T - p.t < TR_LIFE);
  },
  // атом под пальцем (ближайший в пределах HOLD_PICK от края ядра)
  /** @param {number} x @param {number} y */
  ionAt(x, y) {
    let best = null, bd = Infinity;
    for (const io of this.ions) { if (io.dead) continue; const d = Math.hypot(io.x - x, io.y - y) - .06 * io.Z; if (d < HOLD_PICK && d < bd) { bd = d; best = io; } }
    return best;
  },
  brake(e, by) {
    const s = Math.hypot(e.vx, e.vy) || 1, ns = Math.max(.7, s * .22);
    e.vx *= ns / s; e.vy *= ns / s; e.slow = 4.5; e.brk = .6; e.by = by;
    fxFlash(e.x, e.y, .5, [255, 240, 170], .3);
    if (by === 'hand') {
      this.st.brakes++; Tips.did('atoms:brake'); if (!this.grab) { this.strokeN = (this.strokeN || 0) + 1; this.st.best = Math.max(this.st.best, this.strokeN); } // «росчерк» — только след
      if (this.st.brakes === 1) tipMsg('atoms:brake', 'Электрон отдал энергию фотоном и замедлился. Теперь ион его поймает');
    }
  },

  // ---------- шаг ----------
  update(dt, act) {
    const live = act && G.started;
    this.t += dt; this.Ta = Math.max(.1, 1 - this.t / 120);
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    // что из твоей звезды — каждый забег (не урок, а итог прошлого уровня); кузница — после этой строки
    if (live && this.origin && this.clock > 1.5 && !this.msgs.has('origin')) { this.msgs.add('origin'); msg(this.origin, 5); }
    if (live && this.eForge && this.clock > (this.origin ? 6.5 : 1.5)) this.once('forge', `Кузница частиц: +${this.eForge} холодных e⁻ из распадов μ и τ по законам «Лептоны II, III»`);
    if (live && this.doneAt === null) { this.dustTick(); if (this.huntList().length) this.once('hunt', 'Почти: ещё светятся отмеченные голые ионы, за краем кадра — стрелки к ним'); }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    this.tickTrail(live, dt);
    if (live && this.doneAt === null) this.sl.update(); else if (this.sl.held) this.sl.held = null;
    this.grab = this.sl.held && !this.sl.held.dead ? this.sl.held : null; // взятый рогаткой — стоит
    const vth = this.vth();
    for (const io of this.ions) {
      io.age += dt; io.rot += dt * 2;
      if (io !== this.grab) { const j = .25 * Math.sqrt(dt); io.vx += randn() * j; io.vy += randn() * j; const k = Math.exp(-dt * ION_DRAG); io.vx *= k; io.vy *= k; } // взятый — стоит
      io.x += io.vx * dt; io.y += io.vy * dt;
      if (io.src && G.prev) { const [px, py] = toPrev(io.x, io.y); io.src.x = px; io.src.y = py; io.src.vx = io.src.vy = 0; } // ядро гаснет там, где проявляется ион
      if (act && io.ex > 0 && (io.exT -= dt) <= 0) this.relax(io, 'self'); // спрыгнул на основную сам
    }
    // след через дрожащий атом — электрон спрыгивает на основную орбиту (след, проведённый ещё до захвата, не считается)
    if (live && this.tr.length > 1) for (const io of this.ions) {
      if (!(io.ex > 0)) continue;
      for (let i = 1; i < this.tr.length; i++) {
        const p = this.tr[i - 1], q = this.tr[i]; if (q.gap) continue;
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
        if (act && e.slow > 0 && d < .95 + .08 * Q && Math.hypot(e.vx - io.vx, e.vy - io.vy) < 2.4 + .3 * Q + (io === this.grab ? HOLD_CAP : 0)) { this.capture(io, e); break; } // зажатый на ходу ловит чуть легче — но только заторможенных
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
        const p = this.tr[i - 1], q = this.tr[i]; if (q.gap) continue;
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
          red: hard && this.rs.red && !Uni.off(this, 'red') && Math.random() < RED_P ? rnd(.5, 1.3) : 0 }); // red — когда уйдёт из редеющей туманности
      }
    }
    for (const p of this.ph) {
      const ox = p.x, oy = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
      if (!act || p.dead) continue;
      if (p.hard && p.red && p.t >= p.red && !Uni.off(this, 'red')) this.escape(p);
      if (p.esc) continue; // ушёл из туманности — атомов и электронов на пути больше нет
      // перечеркнул УФ следом — рассеян в безвредный видимый свет
      if (live && p.hard && this.tr.length > 1) for (let i = 1; i < this.tr.length; i++) {
        const a = this.tr[i - 1], b = this.tr[i]; if (b.gap) continue;
        if (segX(ox, oy, p.x, p.y, a.x, a.y, b.x, b.y) || segDist(p.x, p.y, a.x, a.y, b.x, b.y) < TR_W * 1.3) { this.cutUV(p); break; }
      }
      for (const io of this.ions) {
        if (io.ne <= 0 || io === p.from || io === p.pass) continue;
        const d2 = (io.x - p.x) ** 2 + (io.y - p.y) ** 2;
        if (d2 > 1.6 || !inRef(io.x, io.y)) continue; // ободок за краем свет не трогает: ионизация там была бы невидимой порчей
        if (d2 > (p.res === io.Z && io.ex > 0 ? 1.6 : .8)) continue;
        if (io.ex > 0) {
          if (p.res === io.Z) { this.relax(io, p.hand ? 'casc' : 'self', p); break; } // вынужденное излучение: та же линия осаживает такой же атом, фотон летит дальше вместе с копией (цепочку начал твой след — каскад твой)
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
    if (this.doneAt === null && this.coolAt === null && (this.neutral() > HUNT_AT || this.clock > A_LATE) && !this.steps().every(s => s.d)) { // часы остывания — новое понятие: стоп-кадр
      this.coolAt = this.clock;
      msg(`Туманность остывает: через ${fmtClock(A_COOL)} она остынет сама — успей до 90 %`, 5);
      Spot.show({ x: P.x, y: P.y }, 'Туманность остывает', `через ${fmtClock(A_COOL)} остынет сама: уровень кончится без бонуса, а голые ионы так и останутся ионами — в молекулы не войдут`, 5, 4);
    }
    if (this.doneAt === null && this.steps().every(s => s.d)) {
      this.doneAt = this.clock; this.endCd = 2; this.tr = [];
      this.tickStars(true);
      fxRing(P.x, P.y, 1, GOLD, viewRadius() * 1.3, 1.8); fxFlash(P.x, P.y, viewRadius(), [255, 240, 210], .35);
      msg('Туманность нейтральна: свечение погасло, газ остыл и потемнел — в нём соберутся молекулы');
    } else if (this.doneAt === null && this.coolAt !== null && this.clock - this.coolAt >= A_COOL) { // не успел — остыла сама
      this.failed = true; this.nEnd = this.neutral(); this.doneAt = this.clock; this.endCd = 2.4; this.tr = []; this.sl.held = null;
      this.tickStars(true);
      this.float(P.x, P.y - 1, `остыла сама: ${Math.round(this.nEnd * 100)} % из 90`, [255, 170, 140], 16);
      msg('Туманность остыла сама: что ты одел — атомы для молекул, голые ионы так и остались ионами');
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); } // молекулам — эти же атомы, на своих местах
  },
  // пойман — но сперва на возбуждённой орбите: награда за атом — когда спрыгнет на основную
  capture(io, e) {
    e.dead = true; io.ne++; io.ex = (io.ex || 0) + 1; io.exT = EX_T; io.exAt = G.T;
    if (e.by === 'hand') { this.caps.hand++; io.exH = (io.exH || 0) + 1; io.hN = (io.hN || 0) + 1; } else this.caps.auto++;
    fxRing(io.x, io.y, .3, atCol(io.Z), 1.6, .5);
    Sfx.play('catch', Math.min(3, io.ne - 1));
    this.once('ex', 'Электрон пойман, но дрожит на внешней орбите, и свет легко его сбивает. Осадить его — провести следом через атом');
  },
  // электроны спрыгнули на основную орбиту: вспышка своей линии и фотон этой линии (how: 'hand' — след, 'casc' — фотон соседа, 'self' — сам)
  // by — фотон той же линии, что осадил атом (вынужденное излучение): он летит дальше, а новый — его копия рядом, тем же курсом
  /** @param {any} io @param {string} how @param {any} [by] */
  relax(io, how, by) {
    if (!(io.ex > 0)) return;
    io.ex = 0; io.exT = 0;
    // me — осадил ты (след или каскад): ручная цена; спрыгнул сам — цена Вселенной, но если электрон поймал ты (exH),
    // ✦ всё равно твои (раньше самоосаживание пойманного следом платило полную ручную цену — и K-оболочку)
    const c = atSpec(io.Z), s = atSym(io.Z), me = how !== 'self', mineE = me || (io.exH || 0) > 0; io.exH = 0;
    fxFlash(io.x, io.y, how === 'self' ? .9 : 1.6, c, how === 'self' ? .35 : .65); fxRing(io.x, io.y, .3, c, how === 'self' ? 1.3 : 2.4, .55);
    const a = by ? Math.atan2(by.vy, by.vx) : Math.random() * TAU, sx = by ? by.x - Math.sin(a) * .25 : io.x, sy = by ? by.y + Math.cos(a) * .25 : io.y;
    this.ph.push({ x: sx, y: sy, vx: Math.cos(a) * RES_V, vy: Math.sin(a) * RES_V, t: 0, hard: false, E: 2, res: io.Z, from: io, hand: how !== 'self', life: 1.6 });
    let pts = 0, txt = '', big = false;
    const is = ionSym(io.Z, io.ne);
    if (how === 'hand') { this.st.relaxed++; Tips.did('atoms:relax'); pts += 1; txt = `${is}* → ${is}`; Sfx.play('catch', 3); }
    else if (how === 'casc') { this.st.cascade++; pts += 2; txt = `каскад ${is}`; Sfx.play('catch', 3); this.once('casc', 'Фотон той же линии осадил такой же атом и летит дальше вдвоём с копией: каскад'); }
    if (io.Z > 2 && io.ne >= 2 && !io.kDone) { io.kDone = true; if (me) { pts += 2; txt = (txt || is) + ' · K-оболочка'; } }
    if (io.ne >= io.Z) { // нейтральный атом — своими руками дороже
      Codex.note('a:' + io.Z); pts += me && (io.hN || 0) * 2 >= io.Z ? 4 : 2; if (!txt || how === 'self') txt = s; // ручная цена — если хотя бы половину электронов поймал ты
      if (!this.seenN.has(io.Z)) { this.seenN.add(io.Z); pts += 10; txt = `НОВЫЙ АТОМ ${s} · ${elemOf(io.Z)[1].toLowerCase()}`; big = true; Sfx.play('fresh'); }
      fxFlash(io.x, io.y, 1.4, atCol(io.Z), .6);
      if (io.mine && io.Z >= 6) { pts *= 2; txt += ' · из своей звезды ×2'; } // выкованное тобой вещество — дороже: переждать «Звёзды» не то же самое
    }
    if (!pts) return;
    if (mineE) this.kn += pts; else Uni.pay(this, 'rec', pts); // осадила и собрала Вселенная — в сводку
    this.float(io.x, io.y - .8, `${txt} +${pts} ✦`, big ? [255, 215, 110] : c, big ? 16 : 13);
  },
  ionize(io, p) {
    const exc = io.ex > 0;
    io.ne--; this.st.ionized++; if (exc) io.ex--; io.exH = Math.min(io.exH || 0, io.ex);
    const a = Math.atan2(p.vy, p.vx) + randn() * .5, v = 12;
    this.el.push({ x: io.x, y: io.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, k: 1, slow: 0, brk: .5, by: null, age: 1 });
    fxFlash(io.x, io.y, .9, [255, 255, 255], .3);
    if (exc && !p.hard) this.once('soft', 'Свет сбил электрон с возбуждённой орбиты: пойманный лучше осаждать сразу');
    else this.once('ion', 'Жёсткий свет выбил электрон. Луч можно перечеркнуть следом, пока он летит');
  },
  // жёсткий свет ударил в закрытую оболочку — не взял
  shield(io) {
    if (G.T - (io.shT || -9) < .4) return;
    io.shT = G.T; this.st.shield++;
    fxRing(io.x, io.y, .5, [160, 240, 255], 1.2, .35);
    this.once('shield', io.Z === 2 ? 'Гелий держит жёсткий свет: его оболочка закрыта' : 'Закрытую K-оболочку жёсткий свет не берёт');
  },
  // «Разлёт туманности»: туманность поредела — луч УФ уходит из неё мимо атомов и гаснет вдали (✦ — Вселенной)
  escape(p) {
    p.hard = false; p.red = 0; p.esc = true; p.redT = p.t; p.life = p.t + 1.2;
    fxRing(p.x, p.y, .15, UV_C, .8, .35);
    Uni.pay(this, 'red', 1);
    if (inView(p.x, p.y, 0)) this.float(p.x, p.y - .4, 'УФ ушёл мимо +1 ✦', UV_C, 11);
  },
  // след поперёк луча УФ: рассеян, теперь это безвредный видимый свет
  cutUV(p) {
    const a = Math.atan2(p.vy, p.vx) + (Math.random() < .5 ? -1 : 1) * rnd(.6, 1.4);
    p.hard = false; p.E = rnd(1.5, 3); p.vx = Math.cos(a) * PH_V; p.vy = Math.sin(a) * PH_V; p.cut = true; p.life = p.t + 1;
    this.st.cut++; Tips.did('atoms:cut'); this.kn += 1; Sfx.play('pop');
    fxFlash(p.x, p.y, .7, UV_C, .35); fxRing(p.x, p.y, .2, UV_C, .9, .3);
    this.float(p.x, p.y - .4, 'УФ рассеян +1 ✦', UV_C, 12);
    this.once('cut', 'Перечёркнутый жёсткий свет рассеялся и стал безвредным');
  },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() {
    if (this.doneAt !== null) return [];
    const L = [];
    if (this.seenN.size >= 2 && !this.rs.rec) L.push({ k: 'rec', ic: '◎', name: 'Рекомбинация', about: 'электроны у ионов тормозят, излучая свет', c: A_COST });
    if (this.st.cut >= 1 && !this.rs.red) L.push({ k: 'red', ic: '∿', name: 'Разлёт туманности', about: 'туманность редеет: часть УФ уходит мимо атомов', c: A_RED, opt: true });
    return L;
  },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs[it.k] = 1; Sfx.play('upgrade'); Uni.learn(this, it.k, it.ic, it.name, UNI_LVL);
    fxRing(P.x, P.y, 1, GOLD, viewRadius() * .8, 1.4); this.float(P.x, P.y - 1, `${it.ic} ${it.name}`, GOLD, 16);
    if (it.k === 'red') msg('Туманность расширяется и редеет: часть жёсткого света уходит, не задев атомов');
  },
  renderShop: Nuclei.renderShop,

  // ---------- задание ----------
  steps() {
    const n = this.neutral(), touch = isTouch(), wait = this.alien.filter(Z => !this.seenN.has(Z)).map(atSym).join(', ');
    const dust = wait ? ` · ${wait} — не из твоей звезды: ${this.clock < DUST_T ? `пыль соседних сверхновых через ${Math.ceil(DUST_T - this.clock)} с` : 'их приносит пыль соседних сверхновых, она редкая'}` : '';
    const hunt = this.huntList().length;
    return [
      { t: 'Затормозить электрон', h: `${touch ? 'провести пальцем' : 'зажать мышь и провести'} поперёк его пути`, s: 'электрон замедлился', d: this.st.brakes > 0 },
      { t: 'Осадить пойманный электрон', h: 'он дрожит на внешней орбите: провести следом через атом', s: 'спектральная линия', d: this.st.relaxed > 0 },
      { t: 'Одеть ядра электронами', h: 'заторможенные электроны садятся на ион; ион — рогаткой под них · гелий и закрытую K-оболочку жёсткий свет не берёт' + dust, items: AT_NEED.map(Z => [atSym(Z), this.seenN.has(Z)]), s: 'H, He, C, N, O', d: AT_NEED.every(Z => this.seenN.has(Z)) },
      { t: 'Сформировать закон «Рекомбинация»', h: `${touch ? 'в лавке' : 'клавиша 1'} за ${A_COST} ✦`, s: 'рекомбинация', d: this.rs.rec > 0, res: 'rec' },
      { t: 'Погасить свечение туманности', h: this.sparse() ? 'в кадре пусто — это не туманность: вернись туда, где ионы' : hunt ? `осталось одеть голые ионы (${hunt}): они отмечены, за краем кадра — стрелки к ним` : `голые ионы и свободные электроны светятся и греют газ — молекулам в нём не выжить: нейтрализовать 90 %${this.rs.rec ? `. Закон «Рекомбинация» даёт до ${REC_TOP * 100} %, остальное следом` : ''}`, p: [Math.min(90, Math.round((this.nEnd ?? n) * 100)), 90], s: 'газ нейтральный', d: !this.failed && n >= A_GOAL },
    ];
  },
  starPool() {
    return [
      { t: 'свет не выбил ни одного электрона', bad: () => this.st.ionized > 0, atEnd: true },
      { t: '3 электрона одним росчерком', ok: () => this.st.best >= 3 },
      { t: 'перечеркнуть 5 лучей УФ', ok: () => this.st.cut >= 5 },
      { t: 'каскад: атом осадил атом', ok: () => this.st.cascade >= 1 },
      { t: 'быстрее 2:00', bad: () => this.clock > 120, atEnd: true },
      { t: 'кислород раньше углерода', ok: () => this.seenN.has(8) && !this.seenN.has(6), bad: () => this.seenN.has(6) && !this.seenN.has(8) },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 1, '★ +10 ✦', [255, 215, 110], 17); }, this.failed); },
  tally() {
    const n = this.caps.hand + this.caps.auto, at = this.ions.filter(i => i.ne >= i.Z).length;
    return { name: 'Атомы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['доля нейтральных', `${Math.round((this.nEnd ?? this.neutral()) * 100)} % из 90`], ['нейтральных атомов', `${at} из ${this.ions.length}`], ['электроны следом', this.caps.hand], ['электроны от Вселенной', this.caps.auto], ['осажено следом · каскадом', `${this.st.relaxed} · ${this.st.cascade}`], ['УФ перечёркнуто', this.st.cut]], auto: [this.caps.auto, n], stars: this.stars };
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
      else if (p.esc) line(sx, sy, sx - p.vx * .07 * z, sy - p.vy * .07 * z, UV_C, .45 * clamp(1 - (p.t - p.redT) / 1.2, 0, 1) * al, Math.max(1.6, .1 * z)); // ушёл из туманности — гаснет вдали
      else line(sx, sy, sx - p.vx * .05 * z, sy - p.vy * .05 * z, p.cut ? UV_C : [255, 200, 140], (p.cut ? .4 : .25) * al, Math.max(1.2, .08 * z));
    }
    // след
    for (let i = 1; i < this.tr.length; i++) {
      const p = this.tr[i - 1], q = this.tr[i], k = 1 - (G.T - q.t) / TR_LIFE; if (q.gap) continue;
      const [x1, y1] = W2S(p.x, p.y), [x2, y2] = W2S(q.x, q.y);
      line(x1, y1, x2, y2, GOLD, .75 * k * al, 3 + 4 * k);
    }
    for (const io of this.ions) {
      const [sx, sy] = W2S(io.x, io.y); if (!onScreen(sx, sy, 60)) continue;
      const ka = appear(io.age), a = al * ka, c = atCol(io.Z), r = (.3 + .06 * io.Z) * z * popIn(ka), Q = io.Z - io.ne;
      if (io === this.grab) { // держишь: где его тянут заторможенные — зелёный пунктир (и нити к ним), сам атом — в золотом кольце
        ring(sx, sy, HOLD_R * z, [170, 255, 210], (Q > 0 ? .4 : .15) * a, 1.5, [6, 6]);
        if (Q > 0) for (const e of this.el) if (!e.dead && e.slow > 0 && Math.hypot(e.x - io.x, e.y - io.y) < HOLD_R) { const [ex, ey] = W2S(e.x, e.y); line(sx, sy, ex, ey, [170, 255, 210], .25 * a, 1); }
        ring(sx, sy, r + 6 + 2 * Math.sin(G.T * 8), GOLD, .9 * a, 2.5);
      }
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
      // подпись — над внешней орбитой и на плашке: у гелия свечение почти белое, белые буквы на нём терялись
      const top = ex ? 1.45 * z + r + 4 : gn > 2 ? .95 * z + r : gn > 0 ? .55 * z + r : r;
      tag(ionSym(io.Z, io.ne) + (ex ? '*' : ''), sx, sy - top - 13, 12, ex ? atSpec(io.Z) : Q > 0 ? [210, 215, 235] : [255, 255, 255], .9 * a, 700);
    }
    for (const e of this.el) {
      const [sx, sy] = W2S(e.x, e.y); if (!onScreen(sx, sy, 20)) continue;
      const a = al * appear(e.age);
      if (e.slow > 0) { glow(sx, sy, Math.max(5, .45 * z), [170, 255, 210], .6 * a); ball(sx, sy, Math.max(1.6, .1 * z), [230, 255, 240], a); }
      else { line(sx, sy, sx - e.vx * .05 * z, sy - e.vy * .05 * z, [120, 190, 255], .4 * a, Math.max(1, .07 * z)); glow(sx, sy, Math.max(3, .3 * z), [120, 200, 255], .55 * a); ball(sx, sy, Math.max(1.2, .08 * z), [200, 235, 255], a); }
    }
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    if (G.started && !G.paused && !G.prev && this.doneAt === null && this.st.brakes === 0 && !this.tr.length) {
      // подсказка: ближайший к центру быстрый электрон
      const e = this.el.filter(e => e.slow <= 0 && e.age > .5).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
      if (e && Tips.ok('atoms:brake')) { const [sx, sy] = W2S(e.x, e.y); ring(sx, sy, 14 + 3 * Math.sin(G.T * 5), GOLD, .8 * al, 2); label('провести поперёк его пути', sx, sy + 30, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, e.vx, e.vy, al); }
    } else if (G.started && !G.paused && !G.prev && this.doneAt === null && !this.tr.length) {
      // следующий урок — показом: дрожащий атом (осади), потом луч УФ (перечеркни)
      // только то, что видно: не под панелью задания сверху и не у края
      const near = o => Math.hypot(o.x - P.x, o.y - P.y), clear = o => { const [x, y] = W2S(o.x, o.y); return x > 70 && x < G.W - 70 && y > Math.min(230, G.H * .35) && y < G.H - 90; };
      const io = this.st.relaxed === 0 ? this.ions.filter(i => i.ex > 0 && G.T - i.exAt > .3 && clear(i)).sort((u, v) => near(u) - near(v))[0] : null;
      const p = !io && this.st.cut === 0 ? this.ph.find(p => p.hard && p.t > .4 && clear(p)) : null;
      if (io) { if (Tips.ok('atoms:relax')) { const [sx, sy] = W2S(io.x, io.y); ring(sx, sy, 1.9 * cam.z + 8 + 3 * Math.sin(G.T * 5), atSpec(io.Z), .8 * al, 2); label('провести через атом', sx, sy + 1.9 * cam.z + 26, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, 0, 1, al); } }
      else if (p) { if (Tips.ok('atoms:cut')) { const [sx, sy] = W2S(p.x, p.y); ring(sx, sy, 16 + 3 * Math.sin(G.T * 5), UV_C, .8 * al, 2); label('перечеркнуть луч', sx, sy + 32, 13, [255, 255, 255], .85 * al, 700); ghostSwipe(sx, sy, p.vx, p.vy, al); } }
      else if (this.st.held === 0 && this.st.relaxed > 0) { // и второй жест: зажать на голом ионе
        const h = this.ions.filter(i => i.Z - i.ne > 0 && i.age > 1 && clear(i)).sort((u, v) => near(u) - near(v))[0];
        if (h && Tips.ok('atoms:hold')) { const [sx, sy] = W2S(h.x, h.y); ring(sx, sy, HOLD_R * cam.z, [170, 255, 210], .3 * al, 1.5, [6, 6]); label('зажать атом, оттянуть, отпустить — под заторможенные', sx, sy + .9 * cam.z + 22, 13, [255, 255, 255], .85 * al, 700);
          const e = this.el.find(e => !e.dead && e.slow > 0 && onScreen(...W2S(e.x, e.y), -40)); if (e) { const [ex, ey] = W2S(e.x, e.y); ghostSling(sx, sy, ex, ey, al); } else hintIcons('hold', sx, sy + .9 * cam.z + 22); }
      }
    }
    if (!G.prev) this.drawHunt(al);
    // запас следа — дуга у пальца, пока ведёшь след (кончился — красная, ждёт INK_GO)
    if (this.trOn && this.ink < INK_MAX - .05) { const f = this.ink / INK_MAX; ring(mouse.x, mouse.y, 18, [255, 255, 255], .12 * al, 2); arc(mouse.x, mouse.y, 18, -Math.PI / 2, -Math.PI / 2 + TAU * f, this.dry ? [255, 130, 110] : GOLD, .8 * al, 3); }
    this.sl.draw(al); // рогатка атома: резинка, пунктир до остановки, вердикт
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  // охота за последними процентами: голые ионы, что идут в долю, — тонкое розовое кольцо (цвет свечения),
  // а те, что за краем экрана (счёт идёт и на A_REFM за кадром), — стрелки у края с символом иона
  drawHunt(al) {
    const L = this.huntList(); if (!L.length) return;
    const z = cam.z, pu = .35 + .2 * Math.sin(G.T * 4);
    for (const io of L) {
      const [sx, sy] = W2S(io.x, io.y); if (!onScreen(sx, sy, 30)) continue;
      ring(sx, sy, (.3 + .06 * io.Z) * z + 1.2 * z + 6, [255, 140, 170], pu * al, 1.5, [5, 5]);
    }
    edgeArrows(L.map(io => [io.x, io.y, ionSym(io.Z, io.ne)]), HUNT_N);
    ctx.globalAlpha = al;
  },
  // свечение ионизованного газа (Hα, розовое): гаснет, как только электроны садятся на ядра
  fog() { return .5 * (1 - smooth(.15, A_GOAL, this.neutral())) * smooth(0, 2, this.t); },
  overlay(al) {
    const fog = this.fog() * al;
    if (fog > .01) { ctx.fillStyle = `rgba(255,120,150,${fog * .4})`; ctx.fillRect(0, 0, G.W, G.H); }
    if (!G.started) return;
    const left = this.doneAt === null ? fmtClock(this.clock) : (this.failed ? '' : '✓ ') + fmtClock(this.doneAt);
    hudClock(al, left, this.doneAt === null ? [255, 255, 255] : this.failed ? [255, 170, 140] : [140, 235, 170], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 5', this.steps(), this.stars, 'Туманность нейтральна');
    if (!G.prev && this.doneAt === null && this.coolAt !== null) { // часы остывания — как «остынет через» в «Ядрах»
      const rest = Math.max(0, A_COOL - (this.clock - this.coolAt)), c = rest < 20 ? [255, 140, 120] : [205, 200, 230];
      label(`нейтральных ${Math.round(this.neutral() * 100)} % из 90 · остынет сама через ${fmtClock(rest)}`, G.W / 2, aboveShop(), 13, c, .85 * al, 700);
    }
    hudBanner(this.banner, 'УРОВЕНЬ 5 · туманность сверхновой', 'Атомы', 'туманность расширяется и остывает: одеть её ионы электронами', al, 'ядро + электроны → атомы → из атомов сложатся молекулы');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return A_VIEW; },
  hud() { return { title: '', sub: `T ≈ ${Math.round(30 + 120 * this.Ta) * 100} K`, lines: [], goal: '', laws: [] }; },
};
