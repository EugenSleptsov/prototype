"use strict";
/* Уровень 2. Адроны — «всё должно стать белым».
   Кварк-глюонная плазма остывает: горячий диск сжимается, и за его краем цветное не живёт.
   Цвет кварка — заряд сильного взаимодействия; в холоде выживает только бесцветное (белое):
   - три кварка трёх разных цветов (R·G·B) — барион: ● ● ◆ (uud) — протон, ● ◆ ◆ (udd) — нейтрон,
     ● ● ● / ◆ ◆ ◆ — Δ, тяжелее нуклона: тут же распадается в нуклон и пион;
   - кварк и антикварк (полый) своего цвета — мезон, пион: белый, но живёт миг.
   Аромат — форма: u — круг ●, d — ромб ◆; тяжёлые (законы «Кварки II / III» уровня частиц) — ▲ s, ■ c, ⬢ b:
   тройка с тяжёлым — гиперон, он распадается слабо, по шагу на кварк (b → c → s → u), и выходит нуклон.
   Глагол — рогатка (sling.js), как в «Ядрах»: зажать кварк (или пару), оттянуть и отпустить в другой.
   Пунктир заранее пишет у цели, что выйдет: «→ p⁺ белый», «одинаковый цвет», «пара: ждёт синий»…
   Остывание — часы уровня: цветное, что осталось за краем горячего диска, через миг вымерзает в пионы — потеряно.
   Закон «Конфайнмент»: Вселенная сама бросает кварки к соседям — барионы собираются повсюду.
   Цель — вещество для ядер: 12 нуклонов, среди них нейтроны, пока плазма не остыла. */
const QCOL = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
const QANTI = [[60, 230, 240], [240, 90, 240], [250, 225, 70]]; // антицвет глюона (уровень частиц)
const Q_COLN = ['красный', 'зелёный', 'синий'], Q_ANTN = ['антикрасный', 'антизелёный', 'антисиний'];
const QR = .26, Q_MINPX = 7; // радиус кварка; цветное на экране не мельче (px)
// плазма: радиус в начале, обзор этапа, сколько остывает (с), эталон времени; сколько цветное терпит холод
const Q_R0 = 6.4, QK_VIEW = 7.4, Q_COOL = 120, Q_PAR = 90, FREEZE_T = 2.5;
// материал: кварков не меньше (поровну цветов), пар антикварк + кварк; доля u среди лёгких
const Q_TOTAL = 54, ANTI_N = 6, U_SHARE = .6;
// бросок: скорость полной резинки, сколько пролетает самое меньшее, сколько летит самое меньшее
const Q_VMAX = 13, Q_REACH = 6, Q_FLY = .8;
const DELTA_T = 1.6, MESON_T = 2.6; // жизнь Δ и пиона
// белое схлопывается: за SQ_T кварки стягиваются к центру (до SQ_K раскладки: 30 %), цвета сливаются в белый
const SQ_T = .5, SQ_K = .3, SQ_RAD = .3;
// бильярд: готовый нуклон — шар; упругость удара (масса — число кварков), сбитое быстрее полной резинки не летит
const Q_REST = .8, SPLIT_V = 5; // упругость; с какой скорости удара шар разбивает пару
// нуклон из распада Δ — меньше чистого (Δ — ошибка, не выгода); вакуум рождает пару q q̄, если антикварков не осталось
const DELTA_PTS = 6, VAC_CD = 4;
// «Приток плазмы» — повторяемое в лавке: по GEN_PER кварков каждого цвета из соседнего объёма;
// цена растёт квадратично: GEN_C0 + k·(k + 3) — 8, 12, 18, 26, 36, 48, 62…
const GEN_PER = 5, GEN_C0 = 8;
// цель, своих нуклонов в цели, нейтронов в цели, барионов рогаткой до закона, цена закона, как часто бросает Вселенная
const GOAL_N = 12, OWN_N = 5, GOAL_NN = 2, HAND_Q = 2, CONF_COST = 25, AUTO_CD = 1.6;
// «Адронный зоопарк» — ключи кодекса 'h:…'
const HADRON = {
  p: ['p⁺', 'протон', 'uud'], n: ['n⁰', 'нейтрон', 'udd'], delta: ['Δ', 'дельта-барион', 'uuu (Δ⁺⁺) или ddd (Δ⁻)'], meson: ['π', 'пион', 'u d̄ (π⁺) · d ū (π⁻) · u ū, d d̄ (π⁰)'],
  qq: ['qq', 'дикварк', 'два кварка разных цветов'],
  lam: ['Λ⁰', 'лямбда-гиперон', 'uds'], sig: ['Σ', 'сигма-гиперон', 'uus (Σ⁺) · dds (Σ⁻)'], xi: ['Ξ', 'кси-гиперон', 'uss (Ξ⁰) · dss (Ξ⁻)'],
  omega: ['Ω⁻', 'омега-гиперон', 'sss'], lamc: ['Λc⁺', 'очарованный барион', 'udc (и другие с c)'], lamb: ['Λb⁰', 'прелестный барион', 'udb (и другие с b)'],
};
// Тяжёлые кварки — от законов «Кварки II / III» уровня частиц: странный s ▲, очарованный c ■, прелестный b ⬢.
const HEAVY = { s: 1, c: 2, b: 3 }, QORD = 'udscb';
/** @type {Record<string, number>} */
const QCH = { u: 2, c: 2, t: 2, d: -1, s: -1, b: -1 }; // заряд кварка в третях
/** @type {Record<string, number>} */
const HYP_T = { s: 2.4, c: 1.6, b: 1.6 }; // сколько живёт гиперон с таким самым тяжёлым кварком
/** @type {Record<string, number>} */
const HYP_ZOO = { lam: 12, sig: 12, xi: 12, omega: 15, lamc: 20, lamb: 30 }; // первое открытие — ✦
/** @type {Record<string, RGB>} */
const HYP_C = { s: [255, 215, 100], c: [255, 160, 70], b: [255, 110, 150] };
/** @type {Record<string, string[]>} */
const HYP_SYM = { uds: ['Λ⁰', 'lam'], uus: ['Σ⁺', 'sig'], dds: ['Σ⁻', 'sig'], uss: ['Ξ⁰', 'xi'], dss: ['Ξ⁻', 'xi'], sss: ['Ω⁻', 'omega'],
  udc: ['Λc⁺', 'lamc'], uuc: ['Σc⁺⁺', 'lamc'], ddc: ['Σc⁰', 'lamc'], usc: ['Ξc⁺', 'lamc'], dsc: ['Ξc⁰', 'lamc'], ssc: ['Ωc⁰', 'lamc'],
  udb: ['Λb⁰', 'lamb'], uub: ['Σb⁺', 'lamb'], ddb: ['Σb⁻', 'lamb'], usb: ['Ξb⁰', 'lamb'], dsb: ['Ξb⁻', 'lamb'] };
// протон и нейтрон — разного цвета (как в «Ядрах»: p — красный, n — серый), подпись на плашке
/** @type {Record<string, RGB>} */
const NP_C = { p: [255, 125, 105], n: [180, 190, 215] };
const HSYM = { p: 'p⁺', n: 'n⁰', 'pi+': 'π⁺', 'pi-': 'π⁻', pi0: 'π⁰' };
/** @type {Record<string, RGB>} */
const PI_C = { 'pi+': [255, 185, 120], 'pi-': [130, 180, 255], pi0: [255, 255, 235] };
const Q_OK = [150, 245, 190], Q_NO = [255, 150, 130], Q_ICE = [150, 215, 255], Q_HOT = [255, 150, 80];
// белое (бесцветное) — то, что переживёт остывание
const WHITE = { p: 1, n: 1, delta: 1, hyp: 1, meson: 1 };
const isWhite = (/** @type {any} */ o) => !!WHITE[o.kind];
const isNuc = (/** @type {any} */ o) => o.kind === 'p' || o.kind === 'n';
// значок кварка в тексте: аромат — форма, антикварк — полый
/** @type {Record<string, string[]>} */
const QGLYPH = { u: ['●', '○'], d: ['◆', '◇'], s: ['▲', '△'], c: ['■', '□'], b: ['⬢', '⬡'] };
const qGlyph = (/** @type {any} */ o) => (QGLYPH[o.fl] || QGLYPH.u)[o.anti ? 1 : 0];

const Quarks = {
  key: 'quarks', name: 'Адроны', bg: [34, 6, 26], sling: true,
  controls: 'Зажать кварк, оттянуть, отпустить',
  gest() { return { obj: 'кварк: оттянуть, отпустить — в другой цвет', empty: 'тянуть: карта' }; },

  enter(prev) {
    this.o = []; this.pi = []; this.floats = []; this.id = 1; this.t = 0; this.cool = 0; this.clock = 0; this.doneAt = null; this.endCd = -1;
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.failed = false; this.rs = { conf: 0 }; this.banner = -1.5; this.learn = {};
    this.advanced = false; this.cheated = false; this.res = null; this.autoCd = 1; this.vacCd = VAC_CD; this.stuckT = 0; this.tk = {}; this.msgs = new Set();
    this.made = { p: 0, n: 0 }; this.handN = 0; this.autoN = 0; this.goneWhite = 0;
    this.st = { frozen: 0, frozenMine: 0, mesons: 0, delta: 0, hyp: 0, hypN: 0, bCasc: 0, pairThrow: 0, bounce: 0, miss: 0, strikes: 0, carom: 0, saved: 0, bank: 0, gen: 0, split: 0, vac: 0 };
    const pr = prev && prev.rs || {};
    this.gen2 = pr.q2 > 0 || pr.q3 > 0; this.gen3 = pr.q3 > 0;
    this.hr = prev && prev.hr ? (typeof prev.hr === 'function' ? prev.hr() : prev.hr) : 1.4;
    P.vx = P.vy = 0;
    const src = prev && prev.handoff || [];
    if (!prev) P.x = P.y = 0;
    this.C = { x: P.x, y: P.y };
    // сбережённые кварки вырываются из детектора там же, где кружили, оставляя треки
    for (const h of src) { const o = this.mk([{ col: h.col, fl: h.fl, anti: false }], h.x, h.y, h.vx, h.vy); o.age = 1; o.mine = true; o.tr = [[h.x, h.y]]; }
    this.nSaved = src.length;
    // остальная плазма — поровну трёх цветов (иначе кому-то не хватит пары), лёгкие — с долей u
    const per = [0, 1, 2].map(c => this.o.filter(o => o.m[0].col === c).length), N = Math.max(Math.ceil(Q_TOTAL / 3), ...per);
    const add = [];
    for (let c = 0; c < 3; c++) for (let i = per[c]; i < N; i++) add.push(c);
    let nu = this.o.filter(o => o.m[0].fl === 'u').length, nl = this.o.filter(o => !HEAVY[o.m[0].fl]).length;
    const born = [];
    for (const c of add) {
      const fl = (nu + 1) / (nl + 1) <= U_SHARE ? 'u' : 'd'; nu += +(fl === 'u'); nl++;
      const [x, y] = this.inDisk(.92); const o = this.mk([{ col: c, fl, anti: false }], x, y, randn() * .3, randn() * .3);
      o.age = prev ? -Math.random() * 1.2 : 0; born.push(o);
    }
    // законы поколений: в плазме и тяжёлые кварки (у разных цветов, из добавленных)
    const heavy = this.gen2 ? (this.gen3 ? ['s', 's', 'c', 'b'] : ['s', 's', 's', 'c']) : [];
    heavy.forEach((fl, i) => { const o = born.find(b => b.m[0].col === i % 3 && !HEAVY[b.m[0].fl]); if (o) o.m[0].fl = fl; });
    // вакуум: пары кварк + антикварк — антикварк надо погасить в кварк своего цвета (мезон), иначе вымерзнет
    for (let i = 0; i < ANTI_N; i++) {
      const c = i % 3;
      for (const anti of [false, true]) { const [x, y] = this.inDisk(.85); const o = this.mk([{ col: c, fl: Math.random() < .5 ? 'u' : 'd', anti }], x, y, randn() * .3, randn() * .3); o.age = prev ? -Math.random() * 1.5 : 0; }
    }
    this.Q0 = this.o.reduce((s, o) => s + o.m.length, 0);
    this.stars = pickStars(this.starPool());
    this.sl = new Sling(this);
  },
  // точка в горячем диске (доля радиуса), подальше от уже лежащих
  inDisk(k, R0 = Q_R0) {
    let best = [this.C.x, this.C.y], bd = -1;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R0 * k, x = this.C.x + Math.cos(a) * r, y = this.C.y + Math.sin(a) * r;
      let d = Infinity; for (const o of this.o) d = Math.min(d, Math.hypot(o.x - x, o.y - y));
      if (d > bd) { bd = d; best = [x, y]; }
    }
    return best;
  },
  // тело — кварк, пара или адрон: члены уложены вокруг центра (у каждого — своё место в мире: так их видят «Ядра»)
  mk(m, x, y, vx = 0, vy = 0) {
    const o = { id: this.id++, m: m.map(q => ({ ...q, lx: 0, ly: 0, x, y, vx, vy })), x, y, vx, vy, kind: 'q', rad: QR, age: 0, dead: false, nb: 0, fly: 0, thrown: null, held: false,
      rot: Math.random() * TAU, cold: 0, mine: false, byHand: false, t: 0, T: 0, sym: '', top: '', dq: '', pk: '', tr: null, sq: 0, r0: QR, rescue: false, by: null };
    this.lay(o); this.classify(o); this.o.push(o); return o;
  },
  lay(o) {
    const n = o.m.length, R = n === 1 ? 0 : n === 2 ? .22 : .3;
    o.m.forEach((q, k) => { const a = -Math.PI / 2 + k * TAU / n; q.lx = Math.cos(a) * R; q.ly = Math.sin(a) * R; });
    o.r0 = o.rad = n === 1 ? QR : n === 2 ? .48 : .56;
    this.place(o);
  },
  place(o) {
    const e = smooth(0, 1, o.sq), f = 1 - (1 - SQ_K) * e, c = Math.cos(o.rot) * f, s = Math.sin(o.rot) * f;
    o.rad = lerp(o.r0, SQ_RAD, e);
    for (const q of o.m) { q.x = o.x + q.lx * c - q.ly * s; q.y = o.y + q.lx * s + q.ly * c; q.vx = o.vx; q.vy = o.vy; }
  },
  float(x, y, txt, c = [140, 220, 255], sz = 14) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  once(k, txt) { if (!this.msgs.has(k)) { this.msgs.add(k); tipMsg(this.key + ':' + k, txt); } }, // урок — раз за всю игру
  // барионы для «Ядер»: те же тела, члены — с координатами в мире
  get groups() { const g = new Map(); for (const o of this.o) if (!o.dead && isNuc(o)) g.set(o.id, o); return g; },

  // ---------- что из чего ----------
  /** @param {any[]} m */
  hypOf(m) {
    const top = m.reduce((t, o) => (HEAVY[o.fl] || 0) > (HEAVY[t] || 0) ? o.fl : t, 'u');
    if (!HEAVY[top]) return null;
    const key = m.map(o => o.fl).sort((a, b) => QORD.indexOf(a) - QORD.indexOf(b)).join(''), Q = m.reduce((s, o) => s + QCH[o.fl], 0) / 3;
    const [sym, hk] = HYP_SYM[key] || [key + (Q > 1 ? '⁺⁺' : Q > 0 ? '⁺' : Q < 0 ? '⁻' : '⁰'), top === 's' ? 'lam' : top === 'c' ? 'lamc' : 'lamb'];
    return { top, sym, hk };
  },
  // вид тела по составу (без побочных эффектов)
  /** @param {any[]} m */
  kindOf(m) {
    if (m.length === 1) return { kind: m[0].anti ? 'aq' : 'q' };
    if (m.length === 2 && m[0].anti !== m[1].anti) {
      const q = m[0].anti ? m[1] : m[0], aq = m[0].anti ? m[0] : m[1];
      return { kind: 'meson', pk: q.fl === aq.fl ? 'pi0' : q.fl === 'u' ? 'pi+' : 'pi-' };
    }
    if (m.length === 2) return { kind: 'pair' };
    const h = this.hypOf(m);
    if (h) return { kind: 'hyp', ...h };
    const u = m.filter(x => x.fl === 'u').length;
    return u === 2 ? { kind: 'p' } : u === 1 ? { kind: 'n' } : { kind: 'delta', dq: u === 3 ? '++' : '-' };
  },
  classify(o) {
    const k = this.kindOf(o.m);
    o.kind = k.kind; o.pk = k.pk || ''; o.dq = k.dq || ''; o.sym = k.sym || ''; o.top = k.top || '';
    if (o.kind === 'meson') o.t = o.T = MESON_T;
    else if (o.kind === 'delta') o.t = o.T = DELTA_T;
    else if (o.kind === 'hyp') o.t = o.T = HYP_T[o.top];
    return k;
  },
  // недостающие цвета у цветного тела (пары или одиночки)
  missing(o) { const has = new Set(o.m.map(q => q.col)); return [0, 1, 2].filter(c => !has.has(c)); },
  // Удар a в b: что выйдет. {ok, kind, label, c}
  judge(a, b) {
    if (isWhite(b)) return { ok: false, label: `${this.symOf(b)} уже белый`, c: [215, 220, 235], why: 'white' };
    const all = [...a.m, ...b.m], anti = all.filter(q => q.anti), qs = all.filter(q => !q.anti);
    if (anti.length) {
      if (anti.length > 1) return { ok: false, label: 'два антикварка не гасят друг друга', c: Q_NO, why: 'anti2' };
      if (qs.length > 1) return { ok: false, label: 'антикварк гасит один кварк, не пару', c: Q_NO, why: 'antipair' };
      const q = qs[0], aq = anti[0];
      if (q.col !== aq.col) return { ok: false, label: `${Q_ANTN[aq.col]} гасит только ${Q_COLN[aq.col]}`, c: Q_NO, why: 'anticol' };
      if (HEAVY[q.fl] || HEAVY[aq.fl]) return { ok: false, label: 'тяжёлый кварк — только в барион', c: Q_NO, why: 'heavy' };
      const k = this.kindOf(all);
      return { ok: true, kind: 'meson', label: `→ ${HSYM[k.pk]} белый`, c: PI_C[k.pk] };
    }
    if (all.length > 3) return { ok: false, label: 'больше трёх — не бывает', c: Q_NO, why: 'many' };
    const cols = new Set(all.map(q => q.col));
    if (cols.size < all.length) return { ok: false, label: `одинаковый цвет: нужен ${this.missing(b).map(c => Q_COLN[c]).join(' или ')}`, c: Q_NO, why: 'same' };
    if (all.length === 2) return { ok: true, kind: 'pair', label: `→ пара, ждёт ${Q_COLN[3 - all[0].col - all[1].col]}`, c: mixc(QCOL[all[0].col], QCOL[all[1].col], .5) };
    const k = this.kindOf(all);
    if (k.kind === 'hyp') return { ok: true, kind: 'hyp', label: `→ ${k.sym} → … → нуклон`, c: HYP_C[k.top] };
    if (k.kind === 'delta') return { ok: true, kind: 'delta', label: `→ Δ${k.dq === '++' ? '⁺⁺ → p⁺' : '⁻ → n⁰'} + π`, c: [255, 200, 130] };
    return { ok: true, kind: k.kind, label: `→ ${HSYM[k.kind]} белый`, c: NP_C[k.kind] };
  },
  symOf(o) { return o.kind === 'hyp' ? o.sym : o.kind === 'delta' ? (o.dq === '++' ? 'Δ⁺⁺' : 'Δ⁻') : o.kind === 'meson' ? HSYM[o.pk] : HSYM[o.kind] || ''; },

  // ---------- рогатка ----------
  // берётся цветное и готовый нуклон (он — шар бильярда); Δ, гипероны и мезоны живут миг — их не берут
  bodies() { return G.prev || this.doneAt !== null ? [] : this.o.filter(o => !o.dead && (!isWhite(o) || isNuc(o)) && !(o.fly > 0) && o.age > .3); },
  grabR(b) { return b.rad + 16 / cam.z; },
  full() { return slingFullPx() / cam.z; },
  vmax() { return Q_VMAX; },
  hold(b) { b.held = true; b.vx = b.vy = 0; b.rescue = false; this.learn.grab = true; },
  launch(b, vx, vy) {
    b.held = false; b.vx = vx; b.vy = vy; b.by = null;
    const v = Math.hypot(vx, vy);
    if (v > .5) { b.fly = this.flyT(v); b.thrown = 'hand'; this.learn.throw = true; }
  },
  flyT(v) { return clamp(Q_REACH / Math.max(v, 1e-6), Q_FLY, 3); },
  // путь броска (цели дрейфуют по прямой) и вердикт у первой встречной; мимо и за край — вымерзнет
  // нуклоном — удар: путь шара до первого встречного, потом пунктир — куда покатится сбитое и во что попадёт
  predict(b, vx, vy) {
    const R = this.hotR(), C = this.C, cold = (/** @type {number} */ x, /** @type {number} */ y) => Math.hypot(x - C.x, y - C.y) > R;
    const cue = isNuc(b), s = this.sim(b, b.x, b.y, vx, vy, 0, [b], cue);
    if (!s.q) {
      const out = !cue && cold(s.x, s.y);
      return { pts: s.pts, x: s.x, y: s.y, label: out ? 'мимо, в холод: вымерзнет' : 'мимо', c: out ? Q_ICE : [200, 205, 225] };
    }
    const q = s.q;
    if (!cue) { const j = this.judge(b, q); return { pts: s.pts, x: s.qx, y: s.qy, label: j.label, c: j.c, hit: true }; }
    const v = this.impulse(s.x, s.y, s.vx, s.vy, b.m.length, s.qx, s.qy, q.vx, q.vy, q.m.length);
    if (!v) return { pts: s.pts, x: s.qx, y: s.qy, label: 'вскользь', c: [200, 205, 225], hit: true };
    if (q.kind === 'pair' && this.hitV({ x: s.x, y: s.y, vx: s.vx, vy: s.vy }, { x: s.qx, y: s.qy, vx: q.vx, vy: q.vy }) >= SPLIT_V) return { pts: s.pts, x: s.qx, y: s.qy, label: 'разобьёт пару', c: [235, 235, 245], hit: true };
    const s2 = this.sim(q, s.qx, s.qy, v[2], v[3], s.t, [b, q], isNuc(q)), white = isWhite(q);
    let label = `толкнёт ${this.symOf(q)}`, c = [235, 235, 245];
    if (s2.q && !white) { const j = this.judge(q, s2.q); label = (j.ok ? 'карамболь ' : 'собьёт, но ') + j.label; c = j.ok ? GOLD : j.c; }
    else if (!white && cold(s2.x, s2.y)) { label = 'собьёт в холод: вымерзнет'; c = Q_ICE; }
    else if (!white) { label = cold(q.x, q.y) ? 'вернёт в тепло' : 'толкнёт мимо'; c = cold(q.x, q.y) ? Q_OK : [200, 205, 225]; }
    return { pts: s.pts, x: s.qx, y: s.qy, label, c, hit: true, then: s2.pts, c2: c };
  },
  // полёт тела (другие дрейфуют по прямой) до первого встречного; шар отскакивает от края горячего диска
  sim(who, x, y, vx, vy, t0, skip, cush) {
    const p = { x, y, vx, vy, rad: who.rad }, pts = [[x, y]], dt = 1 / 60, R = this.hotR(), N = Math.round(this.flyT(Math.hypot(vx, vy)) * 60);
    const others = this.o.filter(q => !skip.includes(q) && !q.dead && !q.held && q.age > .3);
    for (let n = 1; n <= N; n++) {
      if (cush) this.cushion(p, R);
      p.x += p.vx * dt; p.y += p.vy * dt;
      const t = t0 + n * dt;
      if (n % 4 === 0) pts.push([p.x, p.y]);
      for (const q of others) {
        const qx = q.x + q.vx * t, qy = q.y + q.vy * t;
        if (Math.hypot(qx - p.x, qy - p.y) < (who.rad + q.rad) * .85) { pts.push([p.x, p.y]); return { pts, x: p.x, y: p.y, vx: p.vx, vy: p.vy, t, q, qx, qy }; }
      }
    }
    pts.push([p.x, p.y]);
    return { pts, x: p.x, y: p.y, vx: p.vx, vy: p.vy, t: t0 + N * dt, q: null, qx: 0, qy: 0 };
  },
  // борт: брошенный шар у края горячего диска отражается внутрь (кто начал полёт далеко за краем — летит свободно)
  cushion(p, R) {
    const dx = p.x - this.C.x, dy = p.y - this.C.y, d = Math.hypot(dx, dy) || 1e-6, nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny;
    if (d > R - p.rad && d < R + 1 && vn > 0) { p.vx -= 2 * vn * nx; p.vy -= 2 * vn * ny; return true; }
    return false;
  },
  // скорость сближения вдоль линии центров
  hitV(a, b) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6; return ((a.vx - b.vx) * dx + (a.vy - b.vy) * dy) / d; },
  // шар разбил пару: два кварка разлетаются в стороны от удара — их снова можно сложить по-другому
  split(b, vx, vy) {
    b.dead = true; this.st.split++; this.st.strikes++;
    const s = Math.hypot(vx, vy) || 1, px = -vy / s, py = vx / s;
    b.m.forEach((q, i) => { const k = i ? 1 : -1, o = this.mk([{ col: q.col, fl: q.fl, anti: q.anti }], q.x, q.y, vx * .5 + px * k * 2.5, vy * .5 + py * k * 2.5); o.age = 9; o.mine = b.mine; o.nb = .6; });
    fxRing(b.x, b.y, .2, [255, 255, 255], 1.6, .5); Sfx.play('pop');
    this.float(b.x, b.y - .7, 'пара разбита', [235, 235, 245], 13);
  },
  // упругий удар двух тел (масса — число кварков): новые скорости обоих или null, если расходятся
  impulse(ax, ay, avx, avy, ma, bx, by, bvx, bvy, mb) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6, nx = dx / d, ny = dy / d, vn = (avx - bvx) * nx + (avy - bvy) * ny;
    if (vn <= 0) return null;
    const J = (1 + Q_REST) * vn / (1 / ma + 1 / mb);
    let cx = bvx + J / mb * nx, cy = bvy + J / mb * ny; const s = Math.hypot(cx, cy);
    if (s > Q_VMAX) { cx *= Q_VMAX / s; cy *= Q_VMAX / s; }
    return [avx - J / ma * nx, avy - J / ma * ny, cx, cy];
  },
  // шар попал: сбитое летит дальше само (src 'cue' — твой удар); спасённое из холода — в зачёт
  strike(a, b) {
    const v = this.impulse(a.x, a.y, a.vx, a.vy, a.m.length, b.x, b.y, b.vx, b.vy, b.m.length);
    if (!v) return false;
    if (b.kind === 'pair' && this.hitV(a, b) >= SPLIT_V) { [a.vx, a.vy] = v; this.split(b, v[2], v[3]); return true; }
    [a.vx, a.vy, b.vx, b.vy] = v;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, over = (a.rad + b.rad) * .85 - d;
    if (over > 0) { b.x += dx / d * over; b.y += dy / d * over; }
    const s = Math.hypot(b.vx, b.vy);
    if (s > .5) {
      b.fly = this.flyT(s); b.thrown = 'cue'; b.nb = 0; b.by = a;
      if (!isWhite(b) && Math.hypot(b.x - this.C.x, b.y - this.C.y) > this.hotR() + b.rad * .3) b.rescue = true;
    }
    this.st.strikes++; Tips.did("quarks:cue");
    fxRing((a.x + b.x) / 2, (a.y + b.y) / 2, .15, [255, 255, 255], 1.2, .4); Sfx.play('pop');
    return true;
  },

  // ---------- реакции ----------
  bounce(a, b, txt, c = Q_NO) {
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    for (const [o, s] of [[a, -1], [b, 1]]) { if (isWhite(o) && o !== a) { o.vx += s * dx / d * .6; o.vy += s * dy / d * .6; continue; } o.vx = s * dx / d * 1.8; o.vy = s * dy / d * 1.8; o.fly = 0; o.thrown = null; o.nb = .8; }
    fxRing(x, y, .2, c, 1, .45);
    if (txt) this.float(x, y, txt, c, 13);
  },
  // a врезался в b; src — 'hand' (рогатка), 'cue' (сбит твоим нуклоном — тоже твой), 'auto' (Вселенная) или null
  collide(a, b, src) {
    const carom = src === 'cue'; if (carom) src = 'hand';
    const j = this.judge(a, b), hand = src === 'hand';
    if (!j.ok) {
      this.bounce(a, b, hand ? j.label : '');
      if (hand) { this.st.bounce++; if (j.why === 'same') this.once('same', 'Одинаковые цвета не складываются: в барионе все три разные — красный, зелёный и синий'); }
      return false;
    }
    const o = this.mk([...b.m, ...a.m].map(q => ({ col: q.col, fl: q.fl, anti: q.anti })), (a.x + b.x) / 2, (a.y + b.y) / 2, (a.vx + b.vx) / 4, (a.vy + b.vy) / 4);
    o.age = 9; o.nb = .5; o.rot = b.rot; o.mine = a.mine || b.mine || hand; o.byHand = hand || a.byHand || b.byHand;
    o.cold = Math.min(a.cold, b.cold); o.src = src;
    a.dead = b.dead = true; this.place(o);
    fxFlash(o.x, o.y, .7, isWhite(o) ? [255, 255, 255] : j.c, .35);
    if (hand) Sfx.play('segment');
    if (carom) { this.st.carom++; this.kn += 4; this.float(o.x, o.y - 1.1, 'карамболь +4 ✦', GOLD, 15); fxRing(o.x, o.y, .3, GOLD, 2, .7); }
    if (o.kind === 'pair') { this.zoo('qq', o.x, o.y); if (hand) { this.kn += 2; this.float(o.x, o.y - .5, `пара: ждёт ${Q_COLN[this.missing(o)[0]]} +2 ✦`, j.c, 13); } }
    else this.onWhite(o, src, hand && a.kind === 'pair');
    return true;
  },
  // родилось белое: барион — нуклон (или Δ, гиперон — скоро станет нуклоном), мезон — вспыхнет
  onWhite(o, src, pairThrow = false) {
    const hand = src === 'hand', conf = this.rs.conf && !Uni.off(this, 'conf');
    fxRing(o.x, o.y, .4, [255, 255, 255], 2.4, .9);
    if (o.kind === 'meson') {
      this.zoo('meson', o.x, o.y);
      if (hand) { this.st.mesons++; Tips.did('quarks:anti'); this.kn += 4; this.float(o.x, o.y - .4, `${HSYM[o.pk]} белый +4 ✦`, PI_C[o.pk], 15); this.once('meson', 'Антикварк несёт антицвет: с кварком своего цвета он белый. Пион живёт миг и вспыхивает светом'); }
      else if (onScreen(...W2S(o.x, o.y), 0)) this.float(o.x, o.y - .4, HSYM[o.pk], PI_C[o.pk], 12);
      return;
    }
    if (hand && pairThrow) this.st.pairThrow++;
    if (o.kind === 'delta') { this.zoo('delta', o.x, o.y); if (hand) { this.st.delta++; this.float(o.x, o.y - .5, `${this.symOf(o)}: распадётся`, [255, 200, 130], 14); this.once('delta', 'Три одинаковых аромата — Δ: тяжелее нуклона и тут же распадается в нуклон и пион'); } return; }
    if (o.kind === 'hyp') {
      this.zoo(o.top === 's' ? this.hypOf(o.m).hk : o.top === 'c' ? 'lamc' : 'lamb', o.x, o.y); if (o.top === 'b') o.hadB = true;
      if (hand) { this.st.hyp++; this.kn += 6; this.float(o.x, o.y - .5, `${o.sym} +6 ✦`, HYP_C[o.top], 15); this.once('hyp', `${o.sym}: гиперон с тяжёлым кварком. Живёт миг, при распаде тяжёлый кварк становится легче и вылетает пион. В конце цепочки выходит нуклон`); }
      return;
    }
    this.nucleon(o, src);
  },
  // нуклон готов: твой — +10 ✦, Вселенной — в строку закона
  nucleon(o, src) {
    const hand = src === 'hand' || o.byHand, conf = this.rs.conf && !Uni.off(this, 'conf');
    this.made[o.kind]++;
    const pts = o.fromD ? DELTA_PTS : 10;
    if (hand) { this.handN++; Tips.did('quarks:pair'); this.kn += pts; this.learn.bar = true; if (this.handN === 1) this.once('cue', 'Готовый нуклон — тоже шар: зажми его и сбей кварк в пару или в барион, а замерзающий — обратно в тепло. От края плазмы шар отскакивает'); }
    else if (conf) { this.autoN++; Uni.pay(this, 'conf', 3); }
    this.zoo(o.kind, o.x, o.y - .5);
    if (hand) this.float(o.x, o.y, `${HSYM[o.kind]} белый +${pts} ✦`, GOLD, 16);
    else if (onScreen(...W2S(o.x, o.y), 0)) this.float(o.x, o.y, `${HSYM[o.kind]}${conf ? ' +3 ✦' : ''}`, [200, 220, 240], 12);
  },
  // новое в «зоопарке» адронов: в кодекс; гипероны — ещё и ✦
  zoo(k, x, y) {
    const key = 'h:' + k; if (Codex.has(key)) return false;
    Codex.note(key);
    const [sym, name] = HADRON[k], pts = HYP_ZOO[k] || 0;
    this.kn += pts;
    this.float(x, y - .6, `${sym} ${name}: в кодексе${pts ? ` +${pts} ✦` : ''}`, pts ? GOLD : [200, 230, 255], pts ? 16 : 13);
    Sfx.play('fresh');
    return true;
  },
  // пион из распада — только след: летит и гаснет (вещество не уносит)
  emitPion(x, y, pk) { const a = Math.random() * TAU; this.pi.push({ x, y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, t: 0, pk }); },
  // Δ: Δ⁺⁺ (uuu) → p⁺ + π⁺, Δ⁻ (ddd) → n⁰ + π⁻
  decayDelta(o) {
    const up = o.dq === '++';
    pick(o.m).fl = up ? 'd' : 'u';
    this.classify(o); o.fromD = true; this.emitPion(o.x, o.y, up ? 'pi+' : 'pi-');
    fxRing(o.x, o.y, .4, [255, 200, 120], 2.4, .6); Sfx.play('throw');
    this.float(o.x, o.y + .5, `Δ${up ? '⁺⁺ → p⁺ + π⁺' : '⁻ → n⁰ + π⁻'}`, [255, 200, 130], 13);
    this.nucleon(o, o.byHand ? 'hand' : o.src);
  },
  // Слабый распад гиперона: самый тяжёлый кварк → легче (b → c, c → s, s → u; у uus — s → d, иначе вышла бы Δ⁺⁺)
  decayHyp(o) {
    const x = o.m.reduce((b, q) => (HEAVY[q.fl] || 0) > (HEAVY[b.fl] || 0) ? q : b), from = x.fl;
    const to = from === 'b' ? 'c' : from === 'c' ? 's' : o.m.filter(q => q !== x).every(q => q.fl === 'u') ? 'd' : 'u';
    const dq = (QCH[from] - QCH[to]) / 3, was = o.sym;
    x.fl = to;
    const k = this.classify(o), pk = dq > 0 ? 'pi+' : dq < 0 ? 'pi-' : 'pi0';
    this.emitPion(o.x, o.y, pk);
    if (k.kind === 'hyp') this.zoo(k.hk, o.x, o.y);
    fxRing(o.x, o.y, .4, HYP_C[from], 2.2, .6);
    if (o.byHand || onScreen(...W2S(o.x, o.y), 0)) this.float(o.x, o.y + .5, `${was} → ${this.symOf(o)} + ${HSYM[pk]}`, HYP_C[from], o.byHand ? 14 : 12);
    if (isNuc(o)) {
      if (o.byHand) { this.st.hypN++; if (o.hadB) { this.st.bCasc++; this.once('bcasc', 'Каскад b → c → s → u: прелестный кварк дважды стал легче, в итоге вышел обычный нуклон'); } }
      this.nucleon(o, o.byHand ? 'hand' : o.src);
    }
  },
  // Цветное в холоде: струна рвётся, рождаются пионы — кварки потеряны
  freeze(o) {
    o.dead = true;
    const n = o.m.length; this.st.frozen += n; if (o.mine) this.st.frozenMine += n;
    for (const q of o.m) this.emitPion(o.x, o.y, (q.fl === 'u') !== q.anti ? (q.fl === 'u' || q.fl === 'd' ? 'pi+' : 'pi0') : q.fl === 'u' || q.fl === 'd' ? 'pi-' : 'pi0');
    fxFlash(o.x, o.y, .9, Q_ICE, .45); fxRing(o.x, o.y, .3, Q_ICE, 1.6, .6); Sfx.play('fizzle');
    if (o.mine || onScreen(...W2S(o.x, o.y), 0)) this.float(o.x, o.y, n === 1 && o.m[0].anti ? 'антикварк ушёл в пион' : 'кварк ушёл в пион', Q_ICE, o.mine ? 14 : 12);
    this.once('freeze', 'За краем горячей плазмы кварк один не живёт: струна рвётся, из вакуума рождается пара кварк-антикварк, и кварк улетает в пионе — из плазмы потерян');
  },

  // ---------- Вселенная бросает сама («Конфайнмент») ----------
  // выбирает ближнюю пару, из которой выйдет пара или нуклон (не Δ, без тяжёлых и антикварков), и бросает к ней
  autoThrow(dt) {
    if (!this.rs.conf || Uni.off(this, 'conf') || this.doneAt !== null || G.prev || (this.autoCd -= dt) > 0) return;
    this.autoCd = AUTO_CD;
    const R = this.hotR(), f = this.o.filter(o => !o.dead && !o.held && !(o.fly > 0) && o.age > 1 && o.nb <= 0 && (o.kind === 'q' || o.kind === 'pair') &&
      !o.m.some(q => HEAVY[q.fl]) && Math.hypot(o.x - this.C.x, o.y - this.C.y) < R - .3);
    const { n } = this.liveNP(), wantN = n < GOAL_NN + 1;
    let best = null, bs = -Infinity;
    for (const a of f) for (const b of f) {
      if (a === b || a.m.length > b.m.length) continue; // бросают меньшее в большее
      const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 3.5) continue;
      const j = this.judge(a, b); if (!j.ok || j.kind === 'delta') continue;
      const s = (j.kind === 'pair' ? 0 : 6) + (j.kind === 'n' && wantN ? 3 : 0) - d + Math.random() * .5;
      if (s > bs) { bs = s; best = [a, b, d]; }
    }
    if (!best) return;
    const [a, b, d] = best, v = clamp(d * 2.2, 3, 8), t = d / v;
    const tx = b.x + b.vx * t - a.x, ty = b.y + b.vy * t - a.y, L = Math.hypot(tx, ty) || 1;
    a.vx = tx / L * v; a.vy = ty / L * v; a.fly = t + .5; a.thrown = 'auto';
  },

  // ---------- шаг ----------
  hotR() { return Q_R0 * Math.sqrt(clamp(1 - this.cool / Q_COOL, 0, 1)); },
  update(dt, act) {
    const live = act && G.started, run = live && !G.prev && this.doneAt === null;
    this.t += dt;
    if (live) {
      this.banner += dt;
      if (this.doneAt === null) this.clock += dt;
      this.sl.update();
      P.vx = P.vy = 0;
    }
    if (run) this.cool += dt;
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    for (const p of this.pi) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.pi = this.pi.filter(p => p.t < 1.4);
    const R = this.hotR(), C = this.C;
    for (const o of this.o) {
      if (o.dead) continue;
      o.age += dt; o.nb -= dt; o.rot += dt * (isWhite(o) ? .8 : .4);
      if (isWhite(o) && o.sq < 1) o.sq = Math.min(1, o.sq + dt / SQ_T);
      if (o.tr) { if (o.age < 3.5) { o.tr.push([o.x, o.y]); if (o.tr.length > 40) o.tr.shift(); } else o.tr = null; }
      if (!o.held) {
        if (o.fly > 0) {
          if (isNuc(o) && this.cushion(o, R)) { this.st.bank++; fxRing(o.x, o.y, .15, [255, 235, 200], 1, .35); }
          if ((o.fly -= dt) <= 0) { o.thrown = null; o.by = null; }
        }
        else {
          const j = .35 * Math.sqrt(dt); o.vx += randn() * j; o.vy += randn() * j; // тепловое дрожание
          const k = Math.exp(-dt * 1.4); o.vx *= k; o.vy *= k;
          // у края горячего диска плазма тянет внутрь (кто не брошен прочь — остаётся в тепле)
          // белое держится в диске; цветное край не втягивает — остывание само отнимает тех, кто у края
          const dx = o.x - C.x, dy = o.y - C.y, d = Math.hypot(dx, dy) || 1e-6, w = isWhite(o), edge = d - (w ? Q_R0 - .6 : R - .3);
          // белое плазма держит у края; цветное — лишь слабо, от теплового дрейфа: брошенное и сбитое мимо уходит в холод
          if (edge > 0 && (w || d < R + .1)) { const f = Math.min(w ? 4 : 1.2, (w ? 2.2 : 1.5) * edge) * dt; o.vx -= dx / d * f; o.vy -= dy / d * f; }
        }
        const s = Math.hypot(o.vx, o.vy); if (s > 30) { o.vx *= 30 / s; o.vy *= 30 / s; }
        o.x += o.vx * dt; o.y += o.vy * dt;
      }
      this.place(o);
    }
    if (act && !G.prev) {
      // брошенное — во что попало
      for (const o of this.o) {
        if (o.dead || !o.thrown) continue;
        for (const q of this.o) {
          if (q === o || q === o.by || q.dead || q.held || q.age < .3) continue;
          if (Math.hypot(q.x - o.x, q.y - o.y) >= (o.rad + q.rad) * .85) continue;
          if (isNuc(o)) { if (this.strike(o, q)) break; continue; } // нуклон — шар: бьёт, не слипается
          this.collide(o, q, o.thrown); break;
        }
      }
      this.passive();
      if (this.doneAt === null) {
        if (this.st.mesons === 0 && !this.o.some(o => !o.dead && o.m.some(q => q.anti)) && (this.vacCd -= dt) <= 0) this.vacPair();
        // цветное за краем горячего диска мёрзнет
        for (const o of this.o) {
          if (o.dead || isWhite(o) || o.held || o.age < .3) continue;
          if (Math.hypot(o.x - C.x, o.y - C.y) > R + o.rad * .3) { if ((o.cold += dt) > FREEZE_T) this.freeze(o); }
          else {
            o.cold = Math.max(0, o.cold - dt * 2);
            if (o.rescue) { o.rescue = false; this.st.saved++; this.kn += 2; this.float(o.x, o.y - .6, 'спасён +2 ✦', Q_OK, 13); }
          }
        }
        this.autoThrow(dt);
      }
      // нестабильное белое: Δ и гипероны распадаются в нуклоны, пионы вспыхивают
      for (const o of this.o) {
        if (o.dead || !(o.kind === 'delta' || o.kind === 'hyp' || o.kind === 'meson') || (o.t -= dt) > 0) continue;
        if (o.kind === 'delta') this.decayDelta(o);
        else if (o.kind === 'hyp') this.decayHyp(o);
        else {
          o.dead = true; this.goneWhite += 2;
          fxFlash(o.x, o.y, 1.1, PI_C[o.pk], .5); fxRing(o.x, o.y, .3, PI_C[o.pk], 2.2, .6); Sfx.play('pop');
          if (onScreen(...W2S(o.x, o.y), 0)) this.float(o.x, o.y, o.pk === 'pi0' ? 'π⁰ → γγ' : o.pk === 'pi+' ? 'π⁺ → μ⁺ ν' : 'π⁻ → μ⁻ ν̄', [255, 240, 200], 11);
        }
      }
    }
    this.o = this.o.filter(o => !o.dead);
    if (!live) return;
    if (this.doneAt === null) {
      this.tickStars(false);
      const goal = this.steps().every(s => s.d) && !this.o.some(o => o.kind === 'delta' || (o.kind === 'hyp' && o.byHand));
      this.stuckT = this.stuck() ? this.stuckT + dt : 0;
      const cold = this.cool >= Q_COOL;
      if (goal || cold || this.stuckT > 3) {
        this.doneAt = this.clock; this.endCd = goal ? 1.6 : 2.4; this.sl.held = null; this.failed = !goal;
        for (const o of this.o) { o.held = false; if (o.kind === 'delta') this.decayDelta(o); while (o.kind === 'hyp') this.decayHyp(o); }
        if (cold) for (const o of this.o) if (!isWhite(o)) this.freeze(o);
        this.o = this.o.filter(o => !o.dead);
        this.tickStars(true);
        this.float(C.x, C.y - 1.5, goal ? 'вещество для ядер готово ✓' : cold ? 'плазма остыла' : 'кварков на нуклоны больше нет', goal ? [140, 235, 170] : [200, 210, 240], 17);
      }
    }
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); }
  },
  // тела не налезают друг на друга (сами не слипаются: белое собирают рогатка и «Конфайнмент»; антикварк гасишь ты)
  passive() {
    const L = this.o;
    for (let i = 0; i < L.length; i++) {
      const a = L[i]; if (a.dead) continue;
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j]; if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, rr = a.rad + b.rad;
        if (d > rr) continue;
        const f = (rr - d) * 3; // мягко расталкиваются
        if (!a.held) { a.x -= dx / d * f * .016; a.y -= dy / d * f * .016; }
        if (!b.held) { b.x += dx / d * f * .016; b.y += dy / d * f * .016; }
      }
    }
  },
  // нуклоны больше не из чего собрать: и всё цветное (без антикварков), сложенное по три, не дотянет до цели
  stuck() {
    if (this.shopItems().some(x => x.k === 'gen' && this.bal() >= x.c)) return false; // хватает ✦ на приток плазмы
    const { p, n } = this.liveNP(), pend = this.o.filter(o => o.kind === 'delta' || o.kind === 'hyp').length;
    const cc = [0, 0, 0]; for (const o of this.o) if (!o.dead && !isWhite(o)) for (const q of o.m) if (!q.anti) cc[q.col]++;
    return p + n + pend + Math.min(...cc) < GOAL_N; // барион — по кварку каждого цвета
  },
  liveNP() { let p = 0, n = 0; for (const o of this.o) if (!o.dead) { if (o.kind === 'p') p++; else if (o.kind === 'n') n++; } return { p, n }; },
  ownN() { return this.o.filter(o => !o.dead && isNuc(o) && o.byHand).length; },
  // доля белого: кварки в белом сейчас и в погасших пионах — от всего, что было в плазме
  white() { let w = this.goneWhite; for (const o of this.o) if (!o.dead && isWhite(o)) w += o.m.length; return this.Q0 ? clamp(w / this.Q0, 0, 1) : 0; },
  progress() { const { p, n } = this.liveNP(), s = this.steps(); return (s.filter(x => x.d).length + Math.min(1, (p + n) / GOAL_N)) / (s.length + 1); },

  // ---------- закон — в лавке ✦ ----------
  bal() { return Math.floor(this.kn - this.spent); },
  // закон (для задания) и повторяемый «Приток плазмы» — после первого бариона
  shopItems() {
    if (this.doneAt !== null) return [];
    const it = [];
    if (!this.rs.conf && (this.handN >= HAND_Q || this.steps0())) it.push({ k: 'conf', ic: '◬', name: 'Конфайнмент', about: 'Вселенная сама собирает белое', c: CONF_COST });
    if (this.handN >= 1) it.push({ k: 'gen', ic: '≋', name: 'Приток плазмы', about: `+${GEN_PER} кварков каждого цвета`, c: this.genCost(), opt: true });
    return it;
  },
  genCost() { const k = this.st.gen; return GEN_C0 + k * (k + 3); },
  keyOf(k) { const i = this.shopItems().findIndex(x => x.k === k); return i < 0 ? null : i + 1; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused || this.doneAt !== null) return;
    if (this.bal() < it.c) { this.float(this.C.x, this.C.y - 1.5, `нужно ${it.c} ✦`, Q_NO, 13); Sfx.play('fizzle'); return; }
    if (it.k === 'gen') { this.spent += it.c; this.gen(); return; }
    this.spent += it.c; this.rs[it.k] = 1; this.autoCd = .5; Sfx.play('upgrade'); Uni.learn(this, it.k, it.ic, it.name, UNI_LVL);
    fxRing(this.C.x, this.C.y, 1, GOLD, Q_R0, 1.4);
    this.float(this.C.x, this.C.y - 1.5, `${it.ic} ${it.name}`, GOLD, 16);
    msg('Конфайнмент: в холоде цветное не живёт — Вселенная сама сводит соседние цвета в белое');
  },
  // вакуум рождает пару: антикварк и кварк того же цвета — рядом, в горячем диске (шаг «погасить антикварк» всегда выполним)
  vacPair() {
    this.vacCd = VAC_CD; this.st.vac++;
    const c = Math.random() * 3 | 0, fl = Math.random() < .5 ? 'u' : 'd', [x, y] = this.inDisk(.5, this.hotR());
    for (const [anti, s] of [[true, -1], [false, 1]]) this.mk([{ col: c, fl, anti }], x + s * .45, y, s * .6, 0);
    this.Q0 += 2; fxRing(x, y, .2, [255, 240, 220], 1.2, .6); Sfx.play('fresh');
    this.float(x, y - .8, 'вакуум: пара кварк-антикварк', [255, 235, 210], 13);
  },
  // приток плазмы: по GEN_PER кварков каждого цвета вспыхивают по горячему диску (не хватает нейтронов — среди них d)
  gen() {
    const R = this.hotR(), N = GEN_PER * 3;
    for (let k = 0; k < N; k++) {
      const c = k % 3, [x, y] = this.inDisk(.85, R);
      // первым в каждом цвете — d, если нейтронов не хватает
      const fl = k < 3 && this.liveNP().n < GOAL_NN + 1 ? 'd' : Math.random() < U_SHARE ? 'u' : 'd';
      this.mk([{ col: c, fl, anti: false }], x, y, randn() * .3, randn() * .3);
      fxFlash(x, y, .5, QCOL[c], .4);
    }
    this.Q0 += N; this.st.gen++;
    fxRing(this.C.x, this.C.y, .5, [255, 230, 200], R, 1); Sfx.play('fresh');
    this.float(this.C.x, this.C.y - 1.5, `≋ приток плазмы: +${N} кварков`, [255, 225, 190], 15);
    this.once('gen', `Приток плазмы: из соседнего объёма горячей плазмы пришли ещё ${N} кварков — по ${GEN_PER} каждого цвета`);
  },
  renderShop(el) {
    const items = this.shopItems();
    if (!G.started || this.advanced || !items.length) { el.style.display = 'none'; return; }
    const b = this.bal();
    const html = items.map((r, k) => `<button data-i="${k}" class="res ${r.opt ? 'sec' : 'pri'} ${b >= r.c ? 'ok' : 'no'}" title="${r.name}: ${r.about}">${r.opt ? '' : '<u>для задания</u>'}<span class="k">${k + 1}</span>` +
      `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${r.about}</i><em>${r.c} ✦</em></button>`).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    if (!el.onclick) el.onclick = e => { const bt = e.target.closest('button'); if (bt && G.stage.buy) G.stage.buy(+bt.dataset.i); };
    el.style.display = 'flex';
  },
  tally() {
    const np = this.liveNP();
    return {
      name: 'Адроны', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['к ядрам: p⁺ · n⁰', `${np.p} · ${np.n}`], ['белое', Math.round(this.white() * 100) + ' %'],
        ['нуклоны рогаткой', this.handN], ['нуклоны Вселенной', this.autoN], ['мезоны', this.st.mesons], ['вымерзло кварков', this.st.frozen], ...(this.st.gen ? [['приток плазмы', this.st.gen + ' × ' + GEN_PER * 3 + ' кварков']] : []), ...(this.gen2 ? [['гипероны рогаткой', this.st.hyp]] : [])],
      auto: [this.autoN, this.handN + this.autoN], stars: this.stars || [],
    };
  },

  // ---------- задание и испытания ★ ----------
  starPool() {
    const st = this.st;
    return [
      { t: 'ни одного вымерзшего кварка', bad: () => st.frozen > 0, atEnd: true },
      { t: 'без Δ', bad: () => st.delta > 0, atEnd: true },
      { t: 'три мезона', ok: () => st.mesons >= 3 },
      { t: 'пару — в третий цвет', ok: () => st.pairThrow > 0 },
      { t: 'карамболь: нуклоном сбить кварк в пару или барион', ok: () => st.carom > 0 },
      { t: `быстрее ${fmtClock(Q_PAR)}`, bad: () => this.clock > Q_PAR, atEnd: true },
      ...(this.gen2 ? [{ t: 'гиперон распался в нуклон', ok: () => st.hypN > 0 }] : []),
      ...(this.gen3 ? [{ t: 'каскад b → c → s → u', ok: () => st.bCasc > 0 }] : []),
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(this.C.x, this.C.y - 2, '★ +10 ✦', [255, 215, 110], 17); }, this.failed); },
  steps0() { return this.made.p > 0 && this.made.n > 0; },
  steps() {
    const touch = isTouch(), np = this.liveNP(), N = np.p + np.n, own = this.ownN();
    return [
      { t: 'Собрать белое из трёх цветов', h: 'зажать кварк, оттянуть и отпустить в кварк другого цвета; третьим — недостающий. Цвет дублируют точки: · красный, ·· зелёный, ··· синий', s: 'первый барион', d: this.handN >= 1 },
      { t: 'Протон и нейтрон', h: `форма — аромат: ● u, ◆ d${this.gen2 ? `; тяжёлые ▲ s, ■ c${this.gen3 ? ', ⬢ b' : ''} дают гиперон` : ''}`,
        items: [['p⁺ = ● ● ◆', this.made.p > 0], ['n⁰ = ● ◆ ◆', this.made.n > 0]], s: 'протон и нейтрон', d: this.steps0() },
      { t: 'Погасить антикварк', h: 'полый — антикварк: бросить его в кварк своего цвета (или кварк в него). Мезон тоже белый', s: 'мезон', d: this.st.mesons > 0 },
      { t: 'Сформировать закон «Конфайнмент»', h: this.handN >= HAND_Q || this.steps0() ? `${touch || !this.keyOf('conf') ? 'в лавке' : `клавиша ${this.keyOf('conf')}`} за ${CONF_COST} ✦` : `сначала ещё ${HAND_Q - this.handN} барион${HAND_Q - this.handN === 1 ? '' : 'а'} рогаткой`, s: 'конфайнмент', d: this.rs.conf > 0 },
      { t: 'Вещество для ядер', h: `${GOAL_N} нуклонов, пока плазма не остыла: не меньше ${GOAL_NN} нейтронов и ${OWN_N} своих. Доля нейтронов перейдёт во Вселенную «Ядер»: больше n⁰ — легче гелий`, p: [Math.min(N, GOAL_N), GOAL_N],
        items: [[`≥ ${GOAL_NN} n⁰`, np.n >= GOAL_NN], [`${OWN_N} своих`, own >= OWN_N]], s: 'вещество для ядер готово', d: N >= GOAL_N && np.n >= GOAL_NN && own >= OWN_N },
    ];
  },

  closeCard() {
    const el = document.getElementById('epoch');
    if (el.style.display !== 'flex') return;
    el.style.display = 'none'; G.paused = false;
    if (this.res && !this.advanced) { this.advanced = true; this.res = null; advance(); }
  },
  // чит: закон и вещество для ядер у центра — 10 p⁺ и 2 n⁰, все твои
  cheat() {
    this.cheated = true; this.rs.conf = 1; this.st.mesons = Math.max(1, this.st.mesons);
    for (let i = 0; i < GOAL_N; i++) {
      const fl = i < GOAL_N - GOAL_NN ? ['u', 'u', 'd'] : ['u', 'd', 'd'], r = 1 + Math.sqrt(i) * 1.1, a = i * 2.4;
      const o = this.mk(fl.map((f, c) => ({ col: c, fl: f, anti: false })), this.C.x + Math.cos(a) * r, this.C.y + Math.sin(a) * r);
      o.mine = o.byHand = true; o.age = 9; this.nucleon(o, 'hand');
    }
  },

  // ---------- рисование ----------
  tube(x1, y1, x2, y2, c, w, al) {
    line(x1, y1, x2, y2, c, .16 * al, w * 3);
    line(x1, y1, x2, y2, c, .75 * al, Math.max(1, w));
  },
  drawPlasma(al) {
    const z = cam.z, [cx, cy] = W2S(this.C.x, this.C.y), R = this.hotR() * z, R0 = Q_R0 * z, u = clamp(this.cool / Q_COOL, 0, 1);
    // холод за краем: голубоватая изморозь до бывшего края
    if (R0 > R + 2) {
      const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R0 + 30);
      g.addColorStop(0, rgb([90, 150, 220], .14 * al)); g.addColorStop(1, rgb([60, 100, 180], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R0 + 30, 0, TAU); ctx.fill();
    }
    if (R > 1) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, rgb([255, 150, 80], (.22 - .08 * u) * al)); g.addColorStop(.75, rgb([230, 80, 70], .12 * al)); g.addColorStop(1, rgb([200, 50, 80], .05 * al));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      // глюонные искры: тут кварки свободны
      const n = Math.min(50, R * R / 900) | 0;
      ctx.strokeStyle = rgb([255, 220, 180], .22 * al); ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, b = Math.random() * TAU, l = 3 + Math.random() * 7; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); }
      ctx.stroke();
      // фронт остывания
      ring(cx, cy, R, Q_ICE, (.45 + .15 * Math.sin(G.T * 3)) * al, 2, [7, 6]);
      if (!G.prev && this.doneAt === null) label('край плазмы: дальше холод', cx, cy - R - 10, 11, Q_ICE, .55 * al, 700);
    }
  },
  draw(al) {
    const z = cam.z;
    ctx.globalAlpha = 1;
    this.drawPlasma(al);
    // треки вылета из детектора
    for (const o of this.o) {
      if (!o.tr || o.tr.length < 2) continue;
      ctx.strokeStyle = rgb(QCOL[o.m[0].col], .55 * clamp(1 - (o.age - 1) / 2.5, 0, 1)); ctx.lineWidth = 2; ctx.beginPath();
      o.tr.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
      ctx.stroke();
    }
    for (const p of this.pi) { const [sx, sy] = W2S(p.x, p.y), a = (1 - p.t / 1.4) * al; glow(sx, sy, 10, PI_C[p.pk], .5 * a); ball(sx, sy, 3, PI_C[p.pk], a); }
    for (const o of this.o) this.drawBody(o, al);
    ctx.globalAlpha = 1;
  },
  drawBody(o, al) {
    const z = cam.z, [sx, sy] = W2S(o.x, o.y);
    if (!onScreen(sx, sy, o.rad * z + 40)) return;
    const k = appear(o.age), a = (o.mine && G.prev && G.prev !== this ? 1 : al) * k, zs = z * popIn(k); // сбережённые видны всю смену уровня
    if (a <= 0) return;
    const pts = o.m.map(q => [sx + (q.x - o.x) * zs, sy + (q.y - o.y) * zs]);
    if (o.thrown) { const c = o.thrown === 'hand' ? GOLD : [150, 205, 255]; line(sx, sy, sx - o.vx * .1 * z, sy - o.vy * .1 * z, c, .5 * a, Math.max(2, o.rad * z * .7)); }
    const w = QR * z * .4, white = isWhite(o);
    // струны и свечение: белое — белое; цветное — смесь своих цветов
    const c = white ? (isNuc(o) ? NP_C[o.kind] : o.kind === 'meson' ? PI_C[o.pk] : o.kind === 'hyp' ? HYP_C[o.top] : [255, 200, 130]) : o.m.length === 2 ? mixc(QCOL[o.m[0].col], QCOL[o.m[1].col], .5) : QCOL[o.m[0].col];
    if (pts.length === 3) { const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3; for (const p of pts) this.tube(cx, cy, p[0], p[1], [255, 255, 255], w, a); }
    else if (pts.length === 2) this.tube(pts[0][0], pts[0][1], pts[1][0], pts[1][1], white ? [255, 255, 255] : c, w, a * (white ? 1 : .75 + .25 * Math.sin(G.T * 5)));
    const e = white ? smooth(0, 1, o.sq) : 0, rr = lerp(.72, .42, e);
    if (white) {
      glow(sx, sy, lerp(1.5, 1.1, e) * zs, [255, 255, 255], (.28 + .2 * e) * a);
      ball(sx, sy, rr * .62 * zs, [255, 255, 255], .3 * e * a); // схлопнулась — одно белое ядрышко
      ring(sx, sy, rr * zs, c, .7 * a, 2.5);
      if (o.kind === 'delta' || o.kind === 'hyp' || o.kind === 'meson') arc(sx, sy, (rr + .14) * zs, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.t / o.T, 0, 1), c, .8 * a, 2);
      tag(this.symOf(o), sx, sy - rr * zs - 13, clamp(.22 * z, 12, 20), c, .95 * a, 800);
    } else {
      glow(sx, sy, (o.m.length === 2 ? 1.2 : .9) * zs, c, .32 * a);
      // пара: на пустом месте — кружок недостающего цвета
      if (o.m.length === 2) {
        const miss = this.missing(o)[0], cs = Math.cos(o.rot), sn = Math.sin(o.rot), lx = 0, ly = .42;
        const mx = sx + (lx * cs - ly * sn) * zs, my = sy + (lx * sn + ly * cs) * zs;
        ring(mx, my, QR * zs * (1 + .12 * Math.sin(G.T * 5)), QCOL[miss], .75 * a, 2, [3, 3]);
      }
    }
    o.m.forEach((q, i) => {
      // в белом цвет кварка тает в белый, сам кварк сжимается
      // цветное не мельче Q_MINPX на экране: форма и подпись читаются и на телефоне
      const [px, py] = pts[i], r = white ? QR * zs * .9 * (1 - .5 * e) : Math.max(Q_MINPX, QR * zs * .9), qc = mixc(QCOL[q.col], [255, 255, 255], .85 * e);
      glow(px, py, r * 2.6, qc, (white ? .2 * (1 - .6 * e) : .4) * a);
      quark(px, py, r, qc, q.fl, q.anti, a);
      if (!white) {
        // цвет — не только оттенком: точки над кварком (1 — красный, 2 — зелёный, 3 — синий)
        for (let t = 0; t <= q.col; t++) { const an = -Math.PI / 2 + (t - q.col / 2) * .55; ball(px + Math.cos(an) * r * 1.5, py + Math.sin(an) * r * 1.5, Math.max(1.4, r * .15), [255, 255, 255], .85 * a); }
        label(q.anti ? `${q.fl}̄` : q.fl, px, py + r * 1.9, Math.max(10, r * .85), HEAVY[q.fl] ? HYP_C[q.fl] : [255, 255, 255], .75 * a);
      }
    });
    // в холоде: ледяная дуга — сколько осталось до вымерзания
    if (!white && o.cold > 0 && this.doneAt === null) {
      const f = clamp(o.cold / FREEZE_T, 0, 1);
      arc(sx, sy, o.rad * zs + 6, -Math.PI / 2, -Math.PI / 2 + TAU * f, Q_ICE, (.6 + .4 * Math.sin(G.T * 14)) * a, 3);
      if (o.mine || f > .3) label('вымерзнет', sx, sy + o.rad * zs + 18, 11, Q_ICE, .9 * a, 800);
    }
    if (o.held) ring(sx, sy, o.rad * zs + 5, GOLD, .9 * al, 2);
    // курсор над готовым нуклоном — его можно взять: это шар бильярда
    else if (isNuc(o) && this.doneAt === null && !G.prev && mouse.has && !isTouch() && !this.sl.held) {
      const [mx, my] = S2W(mouse.x, mouse.y);
      if (Math.hypot(mx - o.x, my - o.y) < this.grabR(o)) { ring(sx, sy, o.rad * zs + 7, [235, 235, 245], .75 * al, 1.5, [3, 4]); label('шар: зажми и бей', sx, sy + o.rad * zs + 22, 11, [235, 235, 245], .85 * al, 700); }
    }
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    this.sl.draw(al);
    this.drawShow(al);
    this.drawArrows();
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  // ближайшее к центру кадра тело, подходящее под условие
  nearBody(f, x = cam.x, y = cam.y) {
    let best = null, bd = Infinity;
    for (const o of this.o) if (!o.dead && !o.held && !(o.fly > 0) && o.age > .5 && f(o)) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
    return best;
  },
  // показ в мире: призрачный бросок к цели — что с чем складывать; стрелка к лавке
  drawShow(al) {
    if (!G.started || G.paused || G.prev || this.doneAt !== null || Spot.on || this.sl.held) { pointAt(null); return; }
    const z = cam.z, a = .9 * al;
    const ghost = (/** @type {any} */ from, /** @type {any} */ to, /** @type {string} */ txt, /** @type {string} */ tip) => {
      if (!from || !to || !Tips.ok(tip)) return;
      const [fx, fy] = W2S(from.x, from.y), [tx, ty] = W2S(to.x, to.y);
      if (!onScreen(fx, fy, 0) || !onScreen(tx, ty, 0)) return;
      ring(fx, fy, from.rad * z + 8 + 3 * Math.sin(G.T * 5), GOLD, .8 * a, 2);
      ghostSling(fx, fy, tx, ty, al);
      label(txt, fx, fy + from.rad * z + 24, 13, [255, 255, 255], (.75 + .2 * Math.sin(G.T * 4)) * al, 700);
    };
    const fits = (/** @type {any} */ x, /** @type {any} */ y) => x !== y && this.judge(x, y).ok;
    if (this.sl.shots === 0 || this.handN === 0) {
      // пара есть — к ней недостающий цвет; иначе — кварк в кварк другого цвета
      const pr = this.nearBody(o => o.kind === 'pair' && !o.m.some(q => HEAVY[q.fl]));
      const q = pr ? this.nearBody(o => o.kind === 'q' && fits(o, pr), pr.x, pr.y) : this.nearBody(o => o.kind === 'q' && !HEAVY[o.m[0].fl]);
      const to = pr || (q && this.nearBody(o => o.kind === 'q' && fits(q, o), q.x, q.y));
      ghost(q, to, pr ? `паре нужен ${Q_COLN[this.missing(pr)[0]]}` : 'зажать кварк, оттянуть, отпустить в другой цвет', pr ? 'quarks:pair' : 'quarks:sling');
    } else if (this.st.mesons === 0 && this.steps0()) {
      const aq = this.nearBody(o => o.kind === 'aq'), q = aq && this.nearBody(o => o.kind === 'q' && fits(aq, o), aq.x, aq.y);
      ghost(aq, q, `полый — антикварк: в ${Q_COLN[aq ? aq.m[0].col : 0]} кварк`, 'quarks:anti');
    } else if (this.st.strikes === 0 && this.handN >= 1) {
      // нуклон — шар: сбить им ближний цветной
      const nu = this.nearBody(o => isNuc(o) && o.byHand), q = nu && this.nearBody(o => !isWhite(o) && !o.m.some(x => x.anti), nu.x, nu.y);
      ghost(nu, q, 'нуклон — шар: сбей им кварк', 'quarks:cue');
    }
    const it = this.shopItems()[0];
    pointAt(it && this.bal() >= it.c ? document.querySelector('#shop button.pri.ok') : null);
  },
  // стрелки к цветному за краем экрана (что ещё не белое)
  drawArrows() {
    if (this.doneAt !== null) return;
    edgeArrows(this.o.filter(o => !isWhite(o)).map(o => [o.x, o.y, QCOL[o.m[0].col]]), 3);
  },
  overlay(al) {
    if (!G.started || this.advanced) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock), { p, n } = this.liveNP();
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > Q_PAR ? [190, 190, 205] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 2', this.steps(), this.stars, `К ядрам: ${p} p⁺ · ${n} n⁰`);
    if (!G.prev && this.doneAt === null) {
      const rest = Math.max(0, Q_COOL - this.cool), c = rest < 20 ? [255, 140, 120] : [205, 200, 230];
      label(`белое ${Math.round(this.white() * 100)} % · нуклонов ${p + n}/${GOAL_N} · остынет через ${fmtClock(rest)}`, G.W / 2, aboveShop(), 13, c, .85 * al, 700);
    }
    hudBanner(this.banner, 'УРОВЕНЬ 2 · 10⁻⁶ с', 'Адроны', this.nSaved ? `${this.nSaved} сбережённых кварков: всё должно стать белым` : 'всё должно стать белым: три цвета или цвет и антицвет', al, 'из кварков → протоны и нейтроны → без них не будет ни одного ядра');
    ctx.globalAlpha = 1;
  },
  viewR() { return QK_VIEW; },
  hud() { return { title: '', sub: `T ≈ ${fmtGeV(.19 - .04 * clamp(this.cool / Q_COOL, 0, 1))} · плазма остывает`, lines: [], goal: '', laws: [] }; },
};
