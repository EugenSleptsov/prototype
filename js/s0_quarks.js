"use strict";
/* Уровень 2. Адроны: из кварк-глюонной плазмы — протоны и нейтроны, и правильная их смесь для ядер.
   Материал — сначала те кварки, что ты сберёг в эпохе аннигиляции (они вылетают из детектора), а дальше
   кварки со всей Вселенной приходят из-за края (у тебя — лишь кусочек плазмы).
   Физика:
   - Плазма остывает неровно: вокруг уже холоднее ~155 МэВ (конфайнмент), но горят очаги КГП (> 170 МэВ).
     В очаге кварки свободны и не слипаются; адрон, занесённый в очаг, плавится обратно на кварки.
   - Барион = три разных цвета. Аромат — форма: u (заряд +⅔) — круг, d (−⅓) — ромб.
     uud (● ● ◆) — протон, udd (● ◆ ◆) — нейтрон; uuu — Δ⁺⁺ → p⁺ + π⁺, ddd — Δ⁻ → n⁰ + π⁻.
   - Антикварк — полый, той же формы и цвета. Кварк + антикварк своего цвета — мезон:
     одной формы (u ū, d d̄) — π⁰, за миг сгорает в свет (γγ); разной — заряженный пион, живёт дольше:
     π⁺ = u d̄ (● + ◇), π⁻ = d ū (◆ + ○). π⁺ + n⁰ → p⁺, π⁻ + p⁺ → n⁰ — изоспиновая перезарядка.
   - Струна между двумя кварками (дикварк) рвётся с рождением пары q q̄ из вакуума: новый кварк
     достраивает барион, антикварк улетает (E = mc²; одиночных кварков не бывает).
   - К нуклеосинтезу n/p ≈ 1/6…1/7: m_n > m_p на 1,3 МэВ, остывая, слабые реакции чаще делают n → p.
   Глаголы: зажать — поле собирает кварки (и антикварк — в пион), держит адрон целиком; чиркнуть (быстро
   провести) или двойной тап — разорвать струну, направить распад Δ.
   Законы: «Конфайнмент» (барионы повсюду, 50/50), «Баланс n/p» (нейтроны сами становятся протонами),
   необязательная «Фрагментация» (струны рвутся сами — Вселенная рождает пары). */
const QCOL = [[255, 60, 90], [70, 235, 120], [80, 140, 255]];
const QANTI = [[60, 230, 240], [240, 90, 240], [250, 225, 70]]; // анти-красный = голубой и т.д. — так рисуется только антицвет глюона; антикварк — полый того же цвета
const QR = .26, BIND = .62, D0 = .55, KSTR = 9, DBREAK = 2.6;
const Q_PAR = 150, Q_T0 = 1.75; // эталон времени; T вокруг (≈150 МэВ — уже конфайнмент), очаги КГП горячее
// чужих барионов вокруг — не больше; сколько повторов экзотики ещё платят; сколько нуклонов последнего шага — твоих (законы делают остальное, но не всё)
const UNI_BAR = 30, EXO_REP = 3, OWN_N = 5;
const HAND_Q = 3, CONF_COST = 25, NP_COST = 35, FRAG_COST = 25, GOAL_N = 12, FLOW_N = 9; // барионов руками до закона, цены законов, цель, свободных кварков в притоке
// FLOW_MAX — больше свободных не копится: лишние уходят за край; недостающий цвет приходит всегда (тупика без зелёных нет)
const FLOW_MAX = 16, PAIR_CD = 3.2, ANTI_MAX = 3, EXO_T = 3.2, EXO_PTS = 20;
const PI0_T = 1.2, PI_T = 9, DELTA_T = 1.8, PI_V = 7, FLIP_R = .7; // жизнь π⁰, π±, Δ; скорость пиона из Δ; дальность перезарядки
const NP_LO = .7, NP_HI = .88, NP_AIM = .82, NP_CD = 3.5; // коридор доли протонов для ядер; к чему тянет закон; как часто
const HOT_EDGE = .35, MELT_T = .5, BLADE_PX = 26, Q_TR = .5; // ширина края очага; сколько адрон терпит жар; рывок «чиркнуть» (px); след
// «Адронный зоопарк» — ключи кодекса 'h:…'. Экзотику собирают полем из двух адронов: зажми на адроне — возьмёшь целиком.
const HADRON = {
  p: ['p⁺', 'протон', 'uud'], n: ['n⁰', 'нейтрон', 'udd'], delta: ['Δ', 'дельта-барион', 'uuu (Δ⁺⁺) или ddd (Δ⁻)'], meson: ['π', 'пион', 'u d̄ (π⁺) · d ū (π⁻) · u ū, d d̄ (π⁰)'],
  qq: ['qq', 'дикварк', 'два кварка разных цветов'], tetra: ['qqq̄q̄', 'тетракварк', 'два мезона вместе'],
  penta: ['qqqqq̄', 'пентакварк', 'барион + мезон'], hexa: ['6q', 'гексакварк', 'два бариона вместе'],
  lam: ['Λ⁰', 'лямбда-гиперон', 'uds'], sig: ['Σ', 'сигма-гиперон', 'uus (Σ⁺) · dds (Σ⁻)'], xi: ['Ξ', 'кси-гиперон', 'uss (Ξ⁰) · dss (Ξ⁻)'],
  omega: ['Ω⁻', 'омега-гиперон', 'sss'], lamc: ['Λc⁺', 'очарованный барион', 'udc (и другие с c)'], lamb: ['Λb⁰', 'прелестный барион', 'udb (и другие с b)'],
};
// Тяжёлые кварки — от законов «Кварки II / III» уровня частиц: странный s ▲, очарованный c ■, прелестный b ⬢.
// Тройка с тяжёлым кварком — гиперон: живёт миг и распадается слабо — тяжёлый кварк становится легче
// (b → c → s → u/d), вылетает пион (заряд — разница зарядов кварков), и в конце цепочки выходит нуклон.
const HEAVY = { s: 1, c: 2, b: 3 }, QORD = 'udscb';
/** @type {Record<string, number>} */
const QCH = { u: 2, c: 2, t: 2, d: -1, s: -1, b: -1 }; // заряд кварка в третях
const HEAVY_P = .18, HEAVY_MAX = 3; // доля тяжёлых в притоке; свободных тяжёлых — не больше
/** @type {Record<string, number>} */
const HYP_T = { s: 3.2, c: 1.8, b: 1.8 }; // сколько живёт гиперон с таким самым тяжёлым кварком
/** @type {Record<string, number>} */
const HYP_ZOO = { lam: 12, sig: 12, xi: 12, omega: 15, lamc: 20, lamb: 30 }; // первое открытие — ✦
/** @type {Record<string, RGB>} */
const HYP_C = { s: [255, 215, 100], c: [255, 160, 70], b: [255, 110, 150] };
/** @type {Record<string, string[]>} */
const HYP_SYM = { uds: ['Λ⁰', 'lam'], uus: ['Σ⁺', 'sig'], dds: ['Σ⁻', 'sig'], uss: ['Ξ⁰', 'xi'], dss: ['Ξ⁻', 'xi'], sss: ['Ω⁻', 'omega'],
  udc: ['Λc⁺', 'lamc'], uuc: ['Σc⁺⁺', 'lamc'], ddc: ['Σc⁰', 'lamc'], usc: ['Ξc⁺', 'lamc'], dsc: ['Ξc⁰', 'lamc'], ssc: ['Ωc⁰', 'lamc'],
  udb: ['Λb⁰', 'lamb'], uub: ['Σb⁺', 'lamb'], ddb: ['Σb⁻', 'lamb'], usb: ['Ξb⁰', 'lamb'], dsb: ['Ξb⁻', 'lamb'] };
// протон и нейтрон — разного цвета (как в «Ядрах»: p — красный, n — серый), подпись на плашке: тройки не спутать
/** @type {Record<string, RGB>} */
const NP_C = { p: [255, 125, 105], n: [180, 190, 215] };
const EXO = { tetra: 1, penta: 1, hexa: 1 };
const HOLDABLE = { p: 1, n: 1, 'pi+': 1, 'pi-': 1 };
const HSYM = { p: 'p⁺', n: 'n⁰', 'pi+': 'π⁺', 'pi-': 'π⁻', pi0: 'π⁰' };
/** @type {Record<string, RGB>} */
const PI_C = { 'pi+': [255, 185, 120], 'pi-': [130, 180, 255], pi0: [255, 255, 235] };
const isPi = (/** @type {string} */ k) => k === 'pi+' || k === 'pi-' || k === 'pi0';
const isDq = (/** @type {any} */ g) => g.kind === 'forming' && g.m.length === 2 && !g.m[0].anti && !g.m[1].anti;
// значок кварка в тексте: аромат — форма, антикварк — полый
/** @type {Record<string, string[]>} */
const QGLYPH = { u: ['●', '○'], d: ['◆', '◇'], s: ['▲', '△'], c: ['■', '□'], b: ['⬢', '⬡'] };
const qGlyph = (/** @type {any} */ o) => (QGLYPH[o.fl] || QGLYPH.u)[o.anti ? 1 : 0];

const Quarks = {
  key: 'quarks', name: 'Адроны', bg: [34, 6, 26], controls: '', sling: true, // sling — палец сам жест (зажать / чиркнуть), без кнопки действия

  enter(prev) {
    this.q = []; this.groups = new Map(); this.gid = 1; this.t = 0;
    this.temp = Q_T0; this.advanced = false; this.res = null; this.cheated = false;
    this.focus = null; this.holding = false; this.hold = 0; this.press = null; this.tr = []; this.learn = {}; this.floats = []; this.msgs = new Set();
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.clock = 0; this.doneAt = null; this.endCd = -1; this.banner = -1.5; this.made = { p: 0, n: 0 }; this.mine = 0; this.exoN = {};
    this.st = { passive: 0, delta: 0, exo: 0, pi0Lost: 0, cascade: 0, flips: 0, handFlips: 0, snaps: 0, pions: 0, melts: 0, hyp: 0, hypN: 0, bCasc: 0 }; this.tk = {};
    // законы поколений кварков с уровня частиц: «Кварки II» — в плазме и s, c; «Кварки III» — ещё и b
    const pr = prev && prev.rs || {};
    this.gen2 = pr.q2 > 0 || pr.q3 > 0; this.gen3 = pr.q3 > 0;
    this.spent = 0; this.rs = { conf: 0, np: 0, frag: 0 }; this.handN = 0; this.autoN = 0; this.flowCd = 1; this.asm = null; this.asmCd = 0; this.pairCd = 2; this.npCd = NP_CD;
    this.hover = null;
    this.hr = prev && prev.hr ? prev.hr() : 1.4;
    const src = prev && prev.handoff || [];
    // сбережённые кварки вырываются из детектора там же, где кружили, оставляя треки, и растут до размера кварка
    const sz0 = clamp(4.5 / (QR * cam.z), .08, 1);
    for (const h of src) { const q = this.mk(h.x, h.y, h.col, false, h.fl); q.vx = h.vx; q.vy = h.vy; q.age = 1; q.sz = sz0; q.tr = [[h.x, h.y]]; q.mine = 1; }
    this.nSaved = src.length;
    if (!src.length) { P.x = P.y = P.vx = P.vy = 0; }
    this.C = { x: P.x, y: P.y };
    // очаги КГП: главный — там, где раскрылся детектор (сбережённые кварки — в нём), второй — рядом
    const R0 = 2.4 + this.hr * .7, a = Math.random() * TAU;
    this.qgp = [{ x: P.x, y: P.y, r0: R0, t0: -1, L: 75 }, { x: P.x + Math.cos(a) * (R0 + 3.4), y: P.y + Math.sin(a) * (R0 + 3.4), r0: 1.6, t0: -1, L: 50 }];
    this.hotN = 2;
    this.stars = null; // испытания ★ выбираются, когда известен материал
    // материал — только сбережённое; при запуске прямо с этого уровня кварки прилетают из-за края
    for (let i = this.q.length; i < (src.length ? 0 : 12); i++) {
      const r = rimPos(.5, zoomFor(this)), q = this.mk(r.x, r.y, i % 3, false, i % 3 === 1 ? 'd' : 'u'); // у края кадра этапа (камера ещё едет к нему)
      q.vx = r.nx * 2.5 + randn() * .5; q.vy = r.ny * 2.5 + randn() * .5; q.age = 0;
    }
  },
  mk(x, y, col, anti, fl) {
    const q = { x, y, vx: 0, vy: 0, col, anti, fl, g: 0, nb: 0, dead: false, age: 0, sz: 1, cap: false, hand: 0, own: 0, fly: 0 };
    this.q.push(q); return q;
  },
  float(x, y, txt, c = [140, 220, 255], sz = 14) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  once(k, txt) { if (!this.msgs.has(k)) { this.msgs.add(k); msg(txt); } },
  fr() { return this.hr * 1.5; },
  members(q) { return q.g ? this.groups.get(q.g).m : [q]; },

  // ---------- очаги кварк-глюонной плазмы ----------
  hotR(s) { const a = this.t - s.t0; return s.r0 * smooth(0, .8, a) * Math.sqrt(clamp(1 - a / s.L, 0, 1)); },
  /** жар в точке: 1 — внутри очага, 0 — снаружи (край — плавный) */
  hotAt(x, y) {
    let h = 0;
    for (const s of this.qgp) {
      const r = this.hotR(s); if (r < .05) continue;
      h = Math.max(h, clamp((r + HOT_EDGE - Math.hypot(x - s.x, y - s.y)) / (2 * HOT_EDGE), 0, 1));
    }
    return h;
  },
  coldAt(x, y) { return 1 - this.hotAt(x, y); },
  // очаг, в котором точка, и выход из него (ближайший край)
  exitOf(x, y) {
    for (const s of this.qgp) {
      const r = this.hotR(s), d = Math.hypot(x - s.x, y - s.y);
      if (d < r + HOT_EDGE) { const a = d < .05 ? Math.random() * TAU : Math.atan2(y - s.y, x - s.x); return { x: s.x + Math.cos(a) * (r + HOT_EDGE + .4), y: s.y + Math.sin(a) * (r + HOT_EDGE + .4) }; }
    }
    return null;
  },
  // Вселенная неоднородна: из-за края в кадр приходит ещё один очаг (где поменьше твоих барионов)
  hotTick() {
    this.qgp = this.qgp.filter(s => this.t - s.t0 < s.L);
    if (this.hotN !== 2 || this.t < 25) return;
    this.hotN++;
    let best = null, bn = Infinity;
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * TAU, d = rnd(2.8, 4.5), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      let n = 0; for (const g of this.groups.values()) if (g.kind === 'p' || g.kind === 'n') { const c = centroid(g.m); if (Math.hypot(c.x - x, c.y - y) < 2.3) n++; }
      if (n < bn) { bn = n; best = { x, y }; }
    }
    if (best) this.qgp.push({ x: best.x, y: best.y, r0: rnd(1.3, 1.7), t0: this.t, L: rnd(35, 45) });
  },

  // ---------- адроны ----------
  // Может ли набор кварков стать (частью) бесцветного состояния?
  valid(arr) {
    if (arr.length > 3) return false;
    if (arr.every(m => m.anti === arr[0].anti)) return (!arr[0].anti || arr.length < 2) && new Set(arr.map(m => m.col)).size === arr.length; // антибарионов в модели нет: антикварк — только в пионе
    return arr.length === 2 && arr[0].col === arr[1].col && !HEAVY[arr[0].fl] && !HEAVY[arr[1].fl]; // мезон: цвет + свой антицвет (странных мезонов в модели нет)
  },
  join(a, b) {
    if (a.g && a.g === b.g) return;
    const all = [...this.members(a), ...this.members(b)];
    if (!this.valid(all)) return;
    if (a.g) this.groups.delete(a.g);
    if (b.g) this.groups.delete(b.g);
    const id = this.gid++, grp = { id, m: all, kind: 'forming', t: 0, born: this.t };
    for (const m of all) m.g = id;
    this.groups.set(id, grp); this.classify(grp);
    fxFlash((a.x + b.x) / 2, (a.y + b.y) / 2, .6, [255, 255, 255], .3);
    if (grp.kind === 'p' || grp.kind === 'n') this.onBaryon(grp); else if (grp.kind === 'hyp') this.onHyp(grp);
    return grp;
  },
  classify(grp) {
    const m = grp.m;
    if (m.length === 2 && m[0].anti !== m[1].anti) {
      const q = m[0].anti ? m[1] : m[0], aq = m[0].anti ? m[0] : m[1];
      grp.kind = q.fl === aq.fl ? 'pi0' : q.fl === 'u' ? 'pi+' : 'pi-';
      grp.t = grp.kind === 'pi0' ? PI0_T : PI_T; grp.hand = grp.hand || 0;
      const c = centroid(m); this.zoo('meson', c.x, c.y);
    } else if (m.length === 3) {
      if (m[0].anti) { grp.kind = 'anti'; return; }
      const h = this.hypOf(m);
      if (h) {
        if (grp.kind !== 'hyp') grp.byHand = m.some(x => x.cap || x.hand > 0); // каскад распадов — тот же гиперон, чей был
        grp.kind = 'hyp'; grp.sym = h.sym; grp.top = h.top; grp.t = grp.T = HYP_T[h.top];
        if (h.top === 'b') grp.hadB = true;
        const c = centroid(m); this.zoo(h.hk, c.x, c.y);
        return;
      }
      const u = m.filter(x => x.fl === 'u').length;
      grp.kind = u === 2 ? 'p' : u === 1 ? 'n' : 'delta';
      if (grp.kind === 'delta') {
        grp.dq = u === 3 ? '++' : '-'; grp.t = DELTA_T; grp.byHand = m.some(x => x.cap || x.hand > 0); this.st.delta++;
        const c = centroid(m); this.zoo('delta', c.x, c.y);
        if (grp.byHand) this.once('delta', `Δ${grp.dq === '++' ? '⁺⁺' : '⁻'} тяжелее нуклона и сейчас распадётся — чиркни через него, куда послать пион`);
      }
    } else grp.kind = 'forming';
  },
  // Барион собран: своими руками (полем) — дороже, сам слипся — дешевле
  onBaryon(grp, hand = grp.m.some(x => x.cap || x.hand > 0)) {
    const c = centroid(grp.m);
    const pts = hand ? 10 : inView(c.x, c.y, 1) ? 4 : 0; if (!hand) this.st.passive++; // за кадром Вселенная лепит без ✦: иначе доход рос бы с размером мира
    if (hand) this.handN++;
    const conf = this.rs.conf && !Uni.off(this, 'conf');
    if (conf) this.autoN++; // после закона — все барионы, и твои тоже
    if (!hand && conf) Uni.pay(this, 'conf', pts); else this.kn += pts; // барионы Вселенной — в сводку «Законы Вселенной»
    this.made[grp.kind]++;
    if (!this.mine && hand) this.mine = grp.id;
    for (const x of grp.m) { x.cap = false; x.hand = 0; }
    fxRing(c.x, c.y, .4, [255, 255, 255], 2.5, .9);
    this.float(c.x, c.y, `${HSYM[grp.kind]} ✓ +${pts} ✦`, hand ? [255, 215, 110] : [200, 220, 240], hand ? 16 : 13);
    if (hand) this.learn.bar = true;
    this.zoo(grp.kind, c.x, c.y - .5);
  },
  // новое в «зоопарке» адронов: в кодекс; экзотика ещё и приносит ✦
  zoo(k, x, y) {
    const key = 'h:' + k; if (Codex.has(key)) return false;
    Codex.note(key);
    const [sym, name] = HADRON[k], pts = EXO[k] ? EXO_PTS : HYP_ZOO[k] || 0;
    this.kn += pts;
    this.float(x, y - .6, `${sym} ${name} — в кодексе${pts ? ` +${pts} ✦` : ''}`, pts ? GOLD : [200, 230, 255], pts ? 16 : 13);
    Sfx.play('fresh');
    return true;
  },
  // тройка с тяжёлым кварком: самый тяжёлый, символ (по составу и заряду), ключ кодекса
  /** @param {any[]} m */
  hypOf(m) {
    const top = m.reduce((t, o) => (HEAVY[o.fl] || 0) > (HEAVY[t] || 0) ? o.fl : t, 'u');
    if (!HEAVY[top]) return null;
    const key = m.map(o => o.fl).sort((a, b) => QORD.indexOf(a) - QORD.indexOf(b)).join(''), Q = m.reduce((s, o) => s + QCH[o.fl], 0) / 3;
    const [sym, hk] = HYP_SYM[key] || [key + (Q > 1 ? '⁺⁺' : Q > 0 ? '⁺' : Q < 0 ? '⁻' : '⁰'), top === 's' ? 'lam' : top === 'c' ? 'lamc' : 'lamb'];
    return { top, sym, hk };
  },
  onHyp(grp) {
    const c = centroid(grp.m), hand = grp.byHand;
    if (hand) { this.kn += 6; this.st.hyp++; }
    if (hand || inView(c.x, c.y)) this.float(c.x, c.y, `${grp.sym}${hand ? ' ✓ +6 ✦' : ''}`, HYP_C[grp.top], hand ? 15 : 12);
    if (hand) this.once('hyp', `${grp.sym} — гиперон: в нём тяжёлый кварк. Он живёт миг и распадается — тяжёлый кварк становится легче, вылетает пион, а в конце выходит нуклон`);
  },
  // Слабый распад: самый тяжёлый кварк → легче (b → c, c → s, s → u; у uus — s → d, иначе вышла бы Δ⁺⁺).
  // Пион уносит разницу зарядов: Λ⁰ (uds) → p⁺ + π⁻, Λc⁺ (udc) → Λ⁰ + π⁺, Λb⁰ (udb) → Λc⁺ + π⁻.
  decayHyp(g) {
    const o = g.m.reduce((b, x) => (HEAVY[x.fl] || 0) > (HEAVY[b.fl] || 0) ? x : b), from = o.fl;
    const to = from === 'b' ? 'c' : from === 'c' ? 's' : g.m.filter(x => x !== o).every(x => x.fl === 'u') ? 'd' : 'u';
    const dq = (QCH[from] - QCH[to]) / 3, c = centroid(g.m), was = g.sym, hand = !!g.byHand;
    o.fl = to;
    this.classify(g);
    const a = Math.random() * TAU, pk = dq > 0 ? 'pi+' : dq < 0 ? 'pi-' : 'pi0';
    this.emitPion(c, pk, [Math.cos(a), Math.sin(a)], hand, false);
    const now = g.kind === 'hyp' ? g.sym : HSYM[g.kind];
    fxRing(c.x, c.y, .4, HYP_C[from], 2.4, .6);
    if (hand || inView(c.x, c.y)) this.float(c.x, c.y + .5, `${was} → ${now} + ${HSYM[pk]}`, HYP_C[from], hand ? 14 : 12);
    if (g.kind === 'p' || g.kind === 'n') {
      if (hand) { this.st.hypN++; if (g.hadB) { this.st.bCasc++; this.once('bcasc', 'Каскад b → c → s → u: прелестный кварк дважды становился легче — и вышел обычный нуклон'); } }
      this.onBaryon(g, hand);
    }
  },
  // пион из распада (Δ или гиперона): dir — куда летит
  /** @param {{x: number, y: number}} c @param {string} kind @param {number[]} dir @param {boolean} hand @param {boolean} fromDelta */
  emitPion(c, kind, dir, hand, fromDelta) {
    const k = Math.random() * 3 | 0, ox = c.x + dir[0] * .55, oy = c.y + dir[1] * .55;
    const [f1, f2] = kind === 'pi+' ? ['u', 'd'] : kind === 'pi-' ? ['d', 'u'] : Math.random() < .5 ? ['u', 'u'] : ['d', 'd'];
    const q1 = this.mk(ox - dir[1] * .16, oy + dir[0] * .16, k, false, f1), q2 = this.mk(ox + dir[1] * .16, oy - dir[0] * .16, k, true, f2);
    const pg = { id: this.gid++, m: [q1, q2], kind, t: kind === 'pi0' ? PI0_T : PI_T, hand: hand ? 4 : 0, fromDelta, born: this.t };
    for (const o of pg.m) { o.g = pg.id; o.age = 1; o.sz = .5; o.vx = dir[0] * PI_V; o.vy = dir[1] * PI_V; o.fly = 1.2; o.nb = .5; }
    this.groups.set(pg.id, pg);
    return pg;
  },
  detach(q) {
    if (!q || !q.g) return; // X с клавиатуры зовёт без аргумента
    const grp = this.groups.get(q.g);
    grp.m = grp.m.filter(x => x !== q); q.g = 0; q.nb = .8;
    if (grp.m.length <= 1) { for (const x of grp.m) x.g = 0; this.groups.delete(grp.id); }
    else this.classify(grp);
  },
  // Струна перетянулась сама: энергия натяжения → новая пара кварк–антикварк (E = mc²).
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
  // Разрыв струны дикварка: из вакуума — пара недостающего цвета. Кварк достраивает барион, антикварк улетает.
  cut(g, how) {
    const [a, b] = g.m, col = 3 - a.col - b.col, hand = how === 'hand';
    const fl = a.fl === b.fl ? (a.fl === 'u' ? 'd' : 'u') : Math.random() < .5 ? 'u' : 'd'; // uu + d = p⁺, dd + u = n⁰ (пара та же: Δ не выйдет)
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    const s = (P.x - mx) * nx + (P.y - my) * ny > 0 ? -1 : 1; // антикварк — от тебя
    const q = this.mk(mx - s * nx / nl * .2, my - s * ny / nl * .2, col, false, fl), aq = this.mk(mx + s * nx / nl * .35, my + s * ny / nl * .35, col, true, fl);
    q.age = aq.age = 1; q.sz = aq.sz = .4; aq.nb = 1; aq.vx = s * nx / nl * 3.4; aq.vy = s * ny / nl * 3.4;
    if (hand) { a.hand = b.hand = q.hand = 2; q.own = 1; }
    fxFlash(mx, my, 1, [255, 240, 200], .5); fxRing(mx, my, .3, [255, 210, 150], 1.6, .5);
    if (hand) {
      this.st.snaps++; this.kn += 4; Sfx.play('snap');
      this.float(mx, my - .3, `струна → q ${qGlyph(aq)} +4 ✦`, [255, 210, 150], 14);
      this.once('cut', 'Струна порвалась — из вакуума пара: кварк достроил барион, полый антикварк улетел');
    } else { Uni.pay(this, 'frag', 2); if (inView(mx, my)) this.float(mx, my - .3, 'струна → q q̄ +2 ✦', [230, 200, 170], 11); }
    this.join(a, q);
  },
  // Δ распадается: Δ⁺⁺ (uuu) → p⁺ (uud) + π⁺ (u d̄), Δ⁻ (ddd) → n⁰ (udd) + π⁻ (d ū). dir — куда полетит пион.
  decayDelta(g, dir, how) {
    const c = centroid(g.m), up = g.dq === '++', hand = how === 'hand' || g.byHand;
    pick(g.m).fl = up ? 'd' : 'u';
    g.kind = up ? 'p' : 'n'; g.t = 0;
    this.onBaryon(g, hand);
    if (!dir) { const a = Math.random() * TAU; dir = [Math.cos(a), Math.sin(a)]; }
    this.emitPion(c, up ? 'pi+' : 'pi-', dir, hand, how === 'hand');
    for (const o of g.m) { o.vx -= dir[0] * 1.2; o.vy -= dir[1] * 1.2; }
    fxRing(c.x, c.y, .4, [255, 200, 120], 3, .6); Sfx.play('throw');
    this.float(c.x, c.y + .5, `Δ${up ? '⁺⁺' : '⁻'} → ${up ? 'p⁺ + π⁺' : 'n⁰ + π⁻'}`, [255, 200, 130], 13);
  },
  // Заряженный пион встретил «свой» нуклон: π⁺ + n⁰ → p⁺, π⁻ + p⁺ → n⁰ (кварк и антикварк одного аромата аннигилируют)
  flip(pi, N) {
    const up = pi.kind === 'pi+', x = N.m.find(o => o.fl === (up ? 'd' : 'u'));
    if (!x) return;
    x.fl = up ? 'u' : 'd'; N.kind = up ? 'p' : 'n';
    for (const o of pi.m) { o.dead = true; o.g = 0; }
    this.groups.delete(pi.id);
    const hand = pi.hand > 0 || pi.m.some(o => o.cap), c = centroid(N.m), txt = up ? 'n⁰ + π⁺ → p⁺' : 'p⁺ + π⁻ → n⁰';
    this.made[N.kind]++; this.zoo(N.kind, c.x, c.y); // перезаряженный — тоже сделан
    this.st.flips++;
    fxFlash(c.x, c.y, 1.2, PI_C[pi.kind], .5); fxRing(c.x, c.y, .4, PI_C[pi.kind], 2.4, .7);
    if (hand) {
      this.st.handFlips++; let pts = 8;
      if (pi.fromDelta) { this.st.cascade++; pts += 15; }
      this.kn += pts; Sfx.play('upgrade');
      this.float(c.x, c.y - .4, `${pi.fromDelta ? 'каскад: ' : ''}${txt} +${pts} ✦`, GOLD, 15);
      this.once('flip', up ? 'Пион π⁺ отдал нейтрону u вместо d — стал протон' : 'Пион π⁻ отдал протону d вместо u — стал нейтрон');
    } else if (this.rs.np && !Uni.off(this, 'np')) { Uni.pay(this, 'np', 3); if (inView(c.x, c.y)) this.float(c.x, c.y - .4, `${txt} +3 ✦`, [200, 220, 240], 12); }
    else if (inView(c.x, c.y)) this.float(c.x, c.y - .4, txt, [200, 220, 240], 12);
  },
  // Адрон в очаге КГП плавится: асимптотическая свобода — снова свободные кварки
  melt(g) {
    const c = centroid(g.m);
    for (const o of g.m) { o.g = 0; o.cap = false; o.nb = .5; o.vx += randn() * 1.2; o.vy += randn() * 1.2; }
    this.groups.delete(g.id);
    if (g.kind === 'p' || g.kind === 'n') { this.st.melts++; this.once('melt', 'Адрон попал в очаг плазмы и расплавился — кварки снова свободны'); }
    fxFlash(c.x, c.y, 1, [255, 150, 90], .4);
    if (inView(c.x, c.y)) this.float(c.x, c.y, `${(g.kind === 'hyp' ? g.sym : HSYM[g.kind]) || 'qq'} → расплавился`, [255, 160, 110], 12);
  },

  // ---------- поле игрока ----------
  input(dt) {
    if (mouse.cancel) { mouse.cancel = false; this.holding = false; this.press = null; this.release(true); } // второй палец — щипок, а не жест: взятое просто остаётся
    if (mouse.clicked) {
      mouse.clicked = false; this.holding = true; this.hold = 0;
      this.press = { t: 0, sx: mouse.x, sy: mouse.y, blade: false, cuts: 0, used: false };
      if (mouse.dbl) { const [x, y] = S2W(mouse.x, mouse.y); if (this.tapAt(x, y)) this.press.used = true; }
    }
    if (this.holding && !mouse.down) { this.holding = false; this.press = null; this.release(); }
    const pr = this.press;
    if (this.holding && pr) {
      this.hold += dt; pr.t += dt;
      // рывок сразу после нажатия — «чиркнуть» (след режет струны), а не поле
      if (!pr.blade && !pr.used && !this.focus && pr.t < .16 && Math.hypot(mouse.x - pr.sx, mouse.y - pr.sy) > BLADE_PX) {
        pr.blade = true; const [x, y] = S2W(pr.sx, pr.sy); this.tr = [{ x, y, t: G.T }];
      }
      if (pr.blade) {
        const [x, y] = S2W(mouse.x, mouse.y), l = this.tr[this.tr.length - 1];
        if (!l || Math.hypot(l.x - x, l.y - y) > .08) { this.tr.push({ x, y, t: G.T }); if (l) this.blade(l.x, l.y, x, y); }
        if (!pr.cuts && pr.t > .45) pr.blade = false; // ничего не порвал и держит дальше — значит, «зажать и вести»
      } else if (!pr.used && this.hold > .12 && !this.focus) {
        this.focus = { cap: [], had: [], ang: Math.random() * TAU, t: 0, tog: 0, tog2: 0 };
        // зажал прямо на адроне (на нём подсказка «зажми — взять целиком») — поле берёт его целиком;
        // рядом с адроном — тоже, если поблизости нет свободных кварков
        const on = this.hadronAt(.7), h = on || this.hadronAt();
        if (h && (on || !this.q.some(o => this.canCap(o, []) && Math.hypot(o.x - P.x, o.y - P.y) < this.fr()))) this.grabHadron(h);
      }
    }
    this.tr = this.tr.filter(p => G.T - p.t < Q_TR);
  },
  // отрезок следа: рвёт струны дикварков, через Δ — направляет его распад
  blade(ax, ay, bx, by) {
    const L = Math.hypot(bx - ax, by - ay) || 1, dir = [(bx - ax) / L, (by - ay) / L];
    for (const g of [...this.groups.values()]) {
      if (!this.groups.has(g.id) || g.m.some(o => o.cap)) continue;
      if (isDq(g)) {
        const [a, b] = g.m;
        if (segX(ax, ay, bx, by, a.x, a.y, b.x, b.y) || segDist((a.x + b.x) / 2, (a.y + b.y) / 2, ax, ay, bx, by) < .3) { this.cut(g, 'hand'); this.press.cuts++; }
      } else if (g.kind === 'delta') {
        const c = centroid(g.m);
        if (segDist(c.x, c.y, ax, ay, bx, by) < .55) { this.decayDelta(g, dir, 'hand'); this.press.cuts++; }
      }
    }
  },
  // двойной тап (клик): по струне — порвать, по Δ — распад с пионом в ближайший «свой» нуклон
  tapAt(x, y) {
    let best = null, bd = .8;
    for (const g of this.groups.values()) {
      if (!(isDq(g) || g.kind === 'delta') || g.m.some(o => o.cap)) continue;
      const c = centroid(g.m), d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = g; }
    }
    if (!best) return false;
    if (best.kind === 'delta') {
      const c = centroid(best.m), N = this.nearest(best.dq === '++' ? 'n' : 'p', c.x, c.y, 6);
      let dir = null; if (N) { const n = centroid(N.m), d = Math.hypot(n.x - c.x, n.y - c.y) || 1; dir = [(n.x - c.x) / d, (n.y - c.y) / d]; }
      this.decayDelta(best, dir, 'hand');
    } else this.cut(best, 'hand');
    return true;
  },
  nearest(kind, x, y, R = Infinity) {
    let best = null, bd = R;
    for (const g of this.groups.values()) { if (g.kind !== kind) continue; const c = centroid(g.m), d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = g; } }
    return best;
  },
  // кого поле может взять: кварк вещества (одиночку или недособранную пару целиком), чьих цветов в поле ещё нет;
  // антикварк — только в заряженный пион: к кварку того же цвета и другой формы (π⁰ поле не соберёт — он сгорит)
  capSet(o, cap) {
    if (o.dead || o.cap || o.age < .4 || o.nb > 0 || cap.length >= 3) return null;
    if (o.anti || cap.some(x => x.anti)) {
      if (o.g || cap.length > 1) return null;
      if (!cap.length) return [o]; // одиночный антикварк — можно отнести к кварку
      const c = cap[0];
      return c.anti !== o.anti && c.col === o.col && c.fl !== o.fl && !HEAVY[c.fl] && !HEAVY[o.fl] ? [o] : null;
    }
    // три разных цвета (три одинаковых аромата uuu/ddd поле тоже возьмёт — выйдет Δ; см. decayDelta)
    const fits = s => {
      const all = [...cap, ...s];
      return all.length <= 3 && new Set(all.map(x => x.col)).size === all.length;
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
    const anti = f.cap.some(x => x.anti);
    if (f.cap.length < 3 && !(anti && f.cap.length === 2)) {
      // ближайший подходящий; с кем выйдет Δ (uuu/ddd) — как будто дальше: поле сперва берёт тот, с кем выйдет нуклон
      let best = null, bd = this.fr() + .6;
      const delta = (/** @type {any} */ o) => { const all = [...f.cap, ...this.capSet(o, f.cap)]; return all.length === 3 && all.every(x => x.fl === all[0].fl); };
      for (const o of this.q) {
        if (!this.canCap(o, f.cap)) continue;
        const d = Math.hypot(o.x - P.x, o.y - P.y); if (d > this.fr()) continue;
        const s = d + (delta(o) ? .5 : 0); if (s < bd) { bd = s; best = o; }
      }
      if (best) {
        const set = this.capSet(best, f.cap);
        for (const x of set) { if (set.length === 1 && x.g) this.detach(x); x.cap = true; x.own = 1; f.cap.push(x); }
        if (f.cap.length >= 2 && !f.cap.some(x => x.anti)) { this.learn.hold = true; this.zoo('qq', P.x, P.y - this.hr * .6); }
        if (best.anti) this.learn.anti = true;
      }
    }
    f.ang += dt * 1.6;
    // захваченные собираются у центра детектора; в очаге плазмы их трясёт
    const n = f.cap.length, ro = n === 1 ? 0 : n === 2 ? .3 : .34, hot = this.hotAt(P.x, P.y), pv = Math.hypot(P.vx, P.vy);
    f.cap.forEach((o, k) => {
      const a = f.ang + k * TAU / Math.max(n, 1);
      const tx = P.x + Math.cos(a) * ro + randn() * .14 * hot, ty = P.y + Math.sin(a) * ro + randn() * .14 * hot;
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), step = (3 + pv) * dt;
      if (d > step) { o.x += dx / d * step; o.y += dy / d * step; } else { o.x = tx; o.y = ty; }
      o.vx = P.vx; o.vy = P.vy;
    });
    // три разных цвета (или кварк + антикварк) вместе и вокруг не очаг — слипаются
    const pion = n === 2 && f.cap.some(x => x.anti);
    if (n === 3 || pion) {
      const close = f.cap.every(o => Math.hypot(o.x - P.x, o.y - P.y) < ro + .2);
      f.tog = close ? f.tog + dt : 0;
      if (hot < .5 && f.tog > (pion ? .2 : .35)) {
        const [a, b, c] = f.cap;
        if (pion) {
          const g = this.join(a, b);
          for (const o of f.cap) o.cap = false;
          f.cap = [];
          if (g) {
            this.st.pions++; this.kn += 4; g.hand = 3; this.learn.pion = true;
            const pc = centroid(g.m);
            this.float(pc.x, pc.y, `${HSYM[g.kind]} ${g.kind === 'pi+' ? '● + ◇' : '◆ + ○'} +4 ✦`, PI_C[g.kind], 15);
            if (!this.msgs.has('spot-pi')) { this.msgs.add('spot-pi'); Spot.show(pc, `${HSYM[g.kind]} — заряженный пион`, g.kind === 'pi+' ? 'поднеси к нейтрону n⁰ — станет протон' : 'поднеси к протону p⁺ — станет нейтрон', 2.6); }
            this.grabHadron(g); // пион — в поле: неси к нуклону
          }
        } else {
          this.join(a, b); this.join(a, c); this.join(b, c);
          f.cap.forEach(o => { o.cap = false; o.hand = 2; });
          f.cap = [];
        }
      }
    }
  },
  /** @param {boolean} [drop] отмена жеста: взятое остаётся на месте — без струны и броска */
  release(drop = false) {
    const f = this.focus; this.focus = null; if (!f) return;
    // два кварка разных цветов, вне очага — остаются связаны струной (дикварк): её можно порвать
    if (!drop && f.cap.length === 2 && !f.cap.some(o => o.anti) && this.hotAt(P.x, P.y) < .5) {
      const g = this.join(f.cap[0], f.cap[1]); if (g) { g.byHand = true; this.learn.qq = true; }
    }
    for (const o of f.cap) { o.cap = false; o.hand = drop ? 0 : 2; o.vx = P.vx + randn() * .3; o.vy = P.vy + randn() * .3; }
    // взятое целиком — летит по ходу детектора (пион так бросают в нуклон)
    for (const g of f.had) {
      const k = drop ? 0 : 1.2;
      for (const o of g.m) { o.cap = false; o.hand = drop ? 0 : 1; o.vx = P.vx * k; o.vy = P.vy * k; if (isPi(g.kind) && !drop) o.fly = .8; }
      if (isPi(g.kind)) g.hand = 3;
    }
  },
  // ---------- зоопарк: поле держит адроны целиком и сжимает два в экзотический ----------
  // адрон под курсором (или под детектором): готовый p⁺/n⁰ или заряженный пион
  hadronAt(R = .9) {
    const pts = [[P.x, P.y]]; if (mouse.has && !mouse.idle) pts.push(S2W(mouse.x, mouse.y));
    let best = null, bd = R;
    for (const g of this.groups.values()) {
      if (!HOLDABLE[g.kind] || g.m.some(x => x.cap || x.fly > 0)) continue; // только что отпущенное — снова берётся (летящий пион — нет)
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
        if (!HOLDABLE[g.kind] || f.had.includes(g) || g.m.some(x => x.cap || x.fly > 0)) continue;
        const c = centroid(g.m), d = Math.hypot(c.x - P.x, c.y - P.y); if (d < bd) { bd = d; best = g; }
      }
      if (best) this.grabHadron(best);
    }
    f.ang += dt * 1.2;
    const two = f.had.length === 2, pv = Math.hypot(P.vx, P.vy);
    // двое сближаются к центру поля — сжатие (пион и «свой» нуклон до сжатия не дойдут: перезарядка — раньше)
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
    const [g1, g2] = f.had, nm = +isPi(g1.kind) + +isPi(g2.kind);
    const kind = nm === 2 ? 'tetra' : nm === 1 ? 'penta' : 'hexa';
    this.groups.delete(g1.id); this.groups.delete(g2.id);
    const id = this.gid++, grp = { id, m: [...g1.m, ...g2.m], kind, t: EXO_T, parts: [{ m: g1.m, kind: g1.kind }, { m: g2.m, kind: g2.kind }] };
    for (const o of grp.m) { o.g = id; o.cap = false; o.hand = 2; o.vx = P.vx; o.vy = P.vy; }
    this.groups.set(id, grp); f.had = []; this.st.exo++;
    const c = centroid(grp.m);
    fxFlash(c.x, c.y, 1.4, GOLD, .6); fxRing(c.x, c.y, .5, GOLD, 3, 1);
    // повтор — +5 ✦, но лишь первые EXO_REP раз каждого вида: сжимать одно и то же без конца — не ферма
    const k = this.exoN; k[kind] = (k[kind] || 0) + 1;
    if (!this.zoo(kind, c.x, c.y)) { const pay = k[kind] <= EXO_REP + 1; if (pay) this.kn += 5; this.float(c.x, c.y - .6, `${HADRON[kind][1]}${pay ? ' +5 ✦' : ''}`, GOLD, 14); }
    Sfx.play('upgrade');
  },
  // экзотика живёт мгновения и распадается обратно на те же адроны (барионы не пропадают)
  unfuse(grp) {
    this.groups.delete(grp.id);
    const c = centroid(grp.m);
    for (const p of grp.parts) {
      const m = p.m.filter(o => !o.dead); if (!m.length) continue;
      const id = this.gid++, g = { id, m, kind: p.kind, t: isPi(p.kind) ? PI_T : 0, hand: 0, born: this.t };
      for (const o of m) o.g = id;
      this.groups.set(id, g);
      const pc = centroid(m), dx = pc.x - c.x, dy = pc.y - c.y, a = Math.hypot(dx, dy) < .05 ? Math.random() * TAU : Math.atan2(dy, dx);
      for (const o of m) { o.vx += Math.cos(a) * 2.5; o.vy += Math.sin(a) * 2.5; }
    }
    fxRing(c.x, c.y, .4, GOLD, 2.5, .6);
    this.float(c.x, c.y, `${HADRON[grp.kind][0]} → ${grp.parts.map(p => HSYM[p.kind] || HADRON[p.kind][0]).join(' + ')}`, [255, 220, 160], 13);
  },

  // ---------- физика ----------
  forces(dt) {
    const q = this.q;
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
        if (d2 > 1.7 || (a.g && a.g === b.g) || (a.g && b.g) || a.cap || b.cap) continue;
        const c = this.coldAt(a.x, a.y); if (c < .2) continue; // в очаге плазмы цветового притяжения нет
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
          const f = KSTR * (d - D0) * dt;
          a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
        }
      }
    }
  },
  // Сами по себе слипаются только целые бесцветные тройки, оказавшиеся рядом, кварк с антикварком своего цвета
  // (мезон) и дикварк с кварком недостающего цвета — и только вне очагов плазмы
  binding() {
    const free = this.q.filter(o => !o.dead && !o.g && !o.cap && o.nb <= 0 && this.hotAt(o.x, o.y) < .5), B2 = BIND * BIND;
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
    for (const g of [...this.groups.values()]) {
      if (!isDq(g) || g.m.some(o => o.cap)) continue;
      const [a, b] = g.m, o = free.find(o => !o.g && !o.anti && o.col !== a.col && o.col !== b.col && !(o.fl === a.fl && o.fl === b.fl) && (near(o, a) || near(o, b)));
      if (o) this.join(a, o);
    }
  },
  // Вселенная лепит барионы без конца: чужих (не твоих) держим не больше UNI_BAR — лишние за кадром растворяются, дальние первыми
  // (иначе физика кварков — попарная — разрасталась бы с каждой минутой ожидания)
  uniBars() {
    const L = [];
    for (const g of this.groups.values()) if ((g.kind === 'p' || g.kind === 'n') && g.id !== this.mine && !g.m.some(o => o.cap || o.own || o.mine)) L.push(g);
    return L;
  },
  capUni() {
    const L = this.uniBars();
    if (L.length <= UNI_BAR) return;
    const off = L.map(g => ({ g, c: centroid(g.m) })).filter(x => !inView(x.c.x, x.c.y, 1))
      .sort((a, b) => Math.hypot(b.c.x - P.x, b.c.y - P.y) - Math.hypot(a.c.x - P.x, a.c.y - P.y));
    for (const { g } of off.slice(0, L.length - UNI_BAR)) { for (const x of g.m) { x.g = 0; x.dead = true; } this.groups.delete(g.id); }
  },
  updGroups(dt, act) {
    for (const grp of [...this.groups.values()]) {
      if (!this.groups.has(grp.id)) continue;
      if (EXO[grp.kind]) { if ((grp.t -= dt) <= 0) this.unfuse(grp); continue; }
      // в очаге плазмы адрон плавится (пока уровень идёт: барионы, ушедшие к ядрам, не трогаем)
      if (act && this.doneAt === null && grp.kind !== 'anti') {
        const c = centroid(grp.m);
        if (this.hotAt(c.x, c.y) > .8) { if ((grp.melt = (grp.melt || 0) + dt) > MELT_T) { this.melt(grp); continue; } } else grp.melt = 0;
      }
      // мир без края: чужой адрон далеко за краем растворяется, как и свободные кварки (иначе барионы Вселенной копились бы без предела)
      if (act && this.doneAt === null && grp.id !== this.mine && !grp.m.some(o => o.cap || o.own || o.mine) && farOff(centroid(grp.m))) {
        for (const x of grp.m) { x.g = 0; x.dead = true; }
        this.groups.delete(grp.id); continue;
      }
      if (grp.hand > 0) grp.hand -= dt;
      if (isPi(grp.kind) || grp.kind === 'anti') {
        grp.t -= grp.m[0].cap ? dt * .3 : dt; // поле придерживает пион
        if (grp.kind === 'anti' || grp.t <= 0) {
          const c = centroid(grp.m);
          for (const x of grp.m) { x.g = 0; x.dead = true; }
          this.groups.delete(grp.id);
          if (grp.kind === 'pi0' || grp.kind === 'anti') {
            // π⁰ (u ū, d d̄): кварк и антикварк одной формы аннигилируют во вспышку света
            const lost = grp.kind === 'pi0' && grp.m.some(o => !o.anti && (o.own || o.mine));
            if (lost) { this.st.pi0Lost++; this.once('pi0', 'Полый антикварк той же формы сжёг твой кварк в свет (π⁰ → γγ) — лови антикварки полем в π⁺ или π⁻'); }
            fxFlash(c.x, c.y, 1.6, [255, 255, 220], .7); fxRing(c.x, c.y, .5, [255, 255, 200], 5, .8); Sfx.play('pop');
            this.float(c.x, c.y, lost ? 'π⁰ → γγ · кварк сгорел' : 'π⁰ → γγ', lost ? [255, 150, 130] : [255, 240, 200], lost ? 14 : 12);
          } else {
            // заряженный пион живёт дольше: распадается слабо, π± → μ± ν
            fxRing(c.x, c.y, .3, PI_C[grp.kind], 1.2, .5);
            if (inView(c.x, c.y)) this.float(c.x, c.y, grp.kind === 'pi+' ? 'π⁺ → μ⁺ ν' : 'π⁻ → μ⁻ ν̄', [190, 190, 210], 11);
          }
        }
      } else if (grp.kind === 'delta') {
        if ((grp.t -= dt) <= 0) this.decayDelta(grp, null, 'self');
      } else if (grp.kind === 'hyp') {
        if ((grp.t -= dt) <= 0) this.decayHyp(grp);
      } else if (isDq(grp) && act && this.rs.frag && !Uni.off(this, 'frag') && !grp.m.some(o => o.cap) && this.t - grp.born > (grp.byHand ? 4 : .7)) {
        this.cut(grp, 'uni'); // «Фрагментация»: струна дикварка рвётся сама
      }
    }
  },
  // заряженные пионы и «свои» нуклоны рядом — перезарядка
  pionHits() {
    for (const pi of [...this.groups.values()]) {
      if ((pi.kind !== 'pi+' && pi.kind !== 'pi-') || !this.groups.has(pi.id)) continue;
      const c = centroid(pi.m), N = this.nearest(pi.kind === 'pi+' ? 'n' : 'p', c.x, c.y, FLIP_R);
      if (N) this.flip(pi, N);
    }
  },
  // живые протоны и нейтроны (и те, что сейчас внутри экзотики)
  liveNP() {
    let p = 0, n = 0;
    for (const g of this.groups.values()) {
      if (g.kind === 'p') p++; else if (g.kind === 'n') n++;
      else if (EXO[g.kind]) for (const x of g.parts) { if (x.kind === 'p') p++; else if (x.kind === 'n') n++; }
    }
    return { p, n };
  },
  pShare() { const { p, n } = this.liveNP(); return p + n ? p / (p + n) : 0; },
  inCorridor() { const s = this.pShare(); return s >= NP_LO - 1e-9 && s <= NP_HI + 1e-9; },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
    this.temp = Math.max(1.2, Q_T0 * Math.exp(-this.t / 150)); // вокруг — уже ниже перехода; очаги горячее
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
    // тепловое дрожание: в очаге плазмы кипит сильнее
    for (const q of this.q) {
      q.age += dt; q.nb -= dt; q.hand -= dt; q.fly -= dt; q.sz = Math.min(1, q.sz + dt * .8);
      if (q.tr) { if (q.age < 3.5) { q.tr.push([q.x, q.y]); if (q.tr.length > 40) q.tr.shift(); } else q.tr = null; }
      if (q.cap) continue;
      const j = .22 * (1.2 + 2.6 * this.hotAt(q.x, q.y)) * Math.sqrt(dt) * 2;
      q.vx += randn() * j; q.vy += randn() * j;
      if (q.fly <= 0) { const dr = Math.exp(-dt * 1.2); q.vx *= dr; q.vy *= dr; } // брошенный пион летит, не вязнет
      // мир без края: свободный чужой кварк далеко за краем растворяется (его место займёт пришедший из-за края)
      if (act && !q.g && !q.mine && farOff(q)) q.dead = true;
    }
    this.forces(dt); this.strings(dt); this.binding(); this.updGroups(dt, act); if (act && this.doneAt === null) this.capUni();
    if (act) this.pionHits();
    for (const q of this.q) {
      if (q.cap) continue;
      const s = Math.hypot(q.vx, q.vy); if (s > 25) { q.vx *= 25 / s; q.vy *= 25 / s; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    this.q = this.q.filter(q => !q.dead);
    if (!act) return; // этап гаснет: барионы на тех же местах становятся нуклонами уровня ядер
    if (!live) return;
    if (this.doneAt === null) { this.hotTick(); this.flow(dt); this.pairs(dt); this.autoAsm(dt); this.npTick(dt); }
    this.hover = !this.focus && this.doneAt === null && (this.handN >= HAND_Q || this.learn.had || this.learn.pion) ? this.hadronAt(.7) : null;
    // живая Δ сначала распадётся (в n⁰ или p⁺ с пионом): коридор n/p проверяем на том составе, что уйдёт к ядрам
    if (this.doneAt === null && this.steps().every(g => g.d) && !this.q.some(o => o.cap) && ![...this.groups.values()].some(g => g.kind === 'delta' || (g.kind === 'hyp' && g.byHand))) {
      this.doneAt = this.clock; this.endCd = 1.4; this.release(); this.holding = false; this.press = null; this.asm = null;
      for (const g of [...this.groups.values()]) { if (EXO[g.kind]) this.unfuse(g); else if (g.kind === 'delta') this.decayDelta(g, null, 'self'); else while (g.kind === 'hyp') this.decayHyp(g); } // барионы уходят к ядрам целыми
      this.tickStars(true);
      this.float(P.x, P.y - this.hr - .5, 'вещество для ядер готово ✓', [140, 235, 170], 17);
    }
    if (this.doneAt === null) this.tickStars(false);
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); }
  },

  // ---------- кварки со всей Вселенной и законы ----------
  freeQ() { return this.q.filter(o => !o.dead && !o.anti && !o.g && !o.cap); },
  // Кварки приходят сами: того цвета и аромата, которого не хватает. Считаются и свободные, и недособранные пары
  // (паре нужен третий цвет). Обычно держим FLOW_N свободных, но цвет, без которого не собрать ни одной тройки,
  // приходит всегда — иначе тупик: девять красных и синих и ни одного зелёного.
  flow(dt) {
    if ((this.flowCd -= dt) > 0) return;
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
    // законы поколений: иногда приходит тяжёлый кварк (свободных тяжёлых — не больше HEAVY_MAX)
    if (this.gen2 && f.filter(o => HEAVY[o.fl]).length < HEAVY_MAX && Math.random() < HEAVY_P) {
      const r = Math.random(); fl = this.gen3 && r < .25 ? 'b' : r < (this.gen3 ? .5 : .3) ? 'c' : 's';
      this.once('heavy', `Закон «Кварки ${this.gen3 ? 'III' : 'II'}»: в плазме и тяжёлые кварки — ▲ s, ■ c${this.gen3 ? ', ⬢ b' : ''}. Тройка с ним — гиперон`);
    }
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
  // вакуум кипит: время от времени рождается пара кварк + антикварк — антикварк и угроза (π⁰), и материал (π±)
  pairs(dt) {
    if (this.t < 10 || (this.pairCd -= dt) > 0) return;
    this.pairCd = PAIR_CD * (.7 + Math.random() * .6);
    if (this.q.filter(o => o.anti).length >= ANTI_MAX) return;
    const a = Math.random() * TAU, d = this.fr() * 1.3 + Math.random() * 2, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    const col = Math.random() * 3 | 0, fl = Math.random() < .5 ? 'u' : 'd', b = Math.random() * TAU;
    const q1 = this.mk(x + Math.cos(b) * .25, y + Math.sin(b) * .25, col, false, fl), q2 = this.mk(x - Math.cos(b) * .25, y - Math.sin(b) * .25, col, true, fl);
    q1.vx = Math.cos(b) * 1.8; q1.vy = Math.sin(b) * 1.8; q2.vx = -q1.vx; q2.vy = -q1.vy;
    q1.nb = q2.nb = .9; q1.sz = q2.sz = .2;
    fxFlash(x, y, .6, [255, 240, 200], .4);
  },
  // «Конфайнмент»: Вселенная сама выбирает ближайшую тройку R·G·B (не uuu/ddd) вне очагов и стягивает её, пока не слипнется.
  // Сильному взаимодействию аромат безразличен — p⁺ и n⁰ выходят поровну; с «Балансом n/p» — к нужной доле.
  // С «Фрагментацией» — и пару: её струна тут же рвётся, рождая недостающий кварк.
  autoAsm(dt) {
    if (!this.rs.conf || Uni.off(this, 'conf')) { this.asm = null; return; }
    const A = this.asm;
    if (A) {
      A.t += dt;
      const c = centroid(A.m);
      if (A.m.some(o => o.dead || o.g || o.cap) || A.t > 6 || this.hotAt(c.x, c.y) > .4) { this.asm = null; this.asmCd = .4; return; } // в очаг не тянем
      for (const o of A.m) {
        const dx = c.x - o.x, dy = c.y - o.y, d = Math.hypot(dx, dy) || 1e-6;
        const k = Math.min(14, 4 + 3 * d) * dt; o.vx += dx / d * k; o.vy += dy / d * k; o.nb = 0;
        const dr = Math.exp(-dt * 3); o.vx *= dr; o.vy *= dr;
      }
      if (A.m.every(o => Math.hypot(o.x - c.x, o.y - c.y) < BIND * .55)) {
        const [a, b, e] = A.m; this.join(a, b); if (e) this.join(a, e); this.asm = null; this.asmCd = .9;
      }
      return;
    }
    if ((this.asmCd -= dt) > 0) return;
    if (this.uniBars().length >= UNI_BAR) { this.asmCd = 1; return; } // вокруг уже довольно барионов Вселенной — свободные кварки ждут тебя
    const f = this.freeQ().filter(o => !HEAVY[o.fl] && o.age > .6 && Math.hypot(o.x - P.x, o.y - P.y) > this.fr() * .8 && this.hotAt(o.x, o.y) < .3); // поле игрока, очаги и тяжёлые кварки (гипероны — твои) не трогаем
    const sh = this.pShare(), want = !this.rs.np || Uni.off(this, 'np') ? null : sh < NP_AIM ? 2 : sh > NP_HI ? 1 : null; // сколько u нужно в тройке
    let best = null, bs = Infinity; // ближайшая тройка — где бы она ни была
    for (const a of f) for (const b of f) {
      if (b === a || b.col === a.col) continue;
      const dab = Math.hypot(a.x - b.x, a.y - b.y); if (dab >= bs) continue;
      for (const e of f) {
        if (e === a || e === b || e.col === a.col || e.col === b.col || (a.fl === b.fl && b.fl === e.fl)) continue;
        const nu = +(a.fl === 'u') + +(b.fl === 'u') + +(e.fl === 'u');
        const s = dab + Math.hypot(a.x - e.x, a.y - e.y) + (want !== null && nu !== want ? 4 : 0);
        if (s < bs && this.hotAt((a.x + b.x + e.x) / 3, (a.y + b.y + e.y) / 3) < .3) { bs = s; best = [a, b, e]; } // слипнутся там, где холодно
      }
    }
    if (!best && this.rs.frag && !Uni.off(this, 'frag')) for (const a of f) for (const b of f) {
      if (b === a || b.col === a.col) continue;
      const s = Math.hypot(a.x - b.x, a.y - b.y); if (s < bs && this.hotAt((a.x + b.x) / 2, (a.y + b.y) / 2) < .3) { bs = s; best = [a, b]; }
    }
    if (best) { this.asm = { m: best, t: 0 }; Sfx.play('grab'); } else this.asmCd = .5;
  },
  // «Баланс n/p»: m_n > m_p — остывая, слабые реакции (n + ν → p + e⁻) чаще превращают нейтроны в протоны
  npTick(dt) {
    if (!this.rs.np || Uni.off(this, 'np') || (this.npCd -= dt) > 0) return;
    this.npCd = NP_CD;
    const { p, n } = this.liveNP(); if (n < 3 || p / (p + n) >= NP_AIM) return;
    let best = null, bd = Infinity;
    for (const g of this.groups.values()) {
      if (g.kind !== 'n' || g.m.some(o => o.cap)) continue;
      const c = centroid(g.m), d = Math.hypot(c.x - P.x, c.y - P.y) - (inView(c.x, c.y) ? 50 : 0); if (d < bd) { bd = d; best = g; }
    }
    if (!best) return;
    const x = best.m.find(o => o.fl === 'd'); if (!x) return;
    x.fl = 'u'; best.kind = 'p';
    const c = centroid(best.m);
    this.made.p++;
    fxRing(c.x, c.y, .3, [150, 240, 200], 1.8, .6);
    Uni.pay(this, 'np', 3);
    if (inView(c.x, c.y)) this.float(c.x, c.y - .4, 'n⁰ + ν → p⁺ + e⁻ +3 ✦', [150, 235, 200], 12);
  },
  // законы — в лавке ✦ (как на уровне частиц)
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() {
    if (this.doneAt !== null) return [];
    const L = [];
    if (!this.rs.conf && (this.handN >= HAND_Q || this.steps0())) L.push({ k: 'conf', ic: '◬', name: 'Конфайнмент', about: 'барионы собираются повсюду', c: CONF_COST });
    if (this.rs.conf && !this.rs.np && this.st.handFlips >= 1) L.push({ k: 'np', ic: '⚖', name: 'Баланс n/p', about: 'нейтроны сами становятся протонами', c: NP_COST });
    if (this.st.snaps >= 1 && !this.rs.frag) L.push({ k: 'frag', ic: '⚡', name: 'Фрагментация', about: 'струны рвутся сами — пары из вакуума', c: FRAG_COST, opt: true });
    return L;
  },
  keyOf(k) { const i = this.shopItems().findIndex(x => x.k === k); return i < 0 ? null : i + 1; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused || this.doneAt !== null) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - this.hr - .2, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs[it.k] = 1; this.asmCd = .6; Sfx.play('upgrade'); Uni.learn(this, it.k, it.ic, it.name, UNI_LVL);
    fxRing(P.x, P.y, this.hr, GOLD, viewRadius() * .8, 1.4);
    this.float(P.x, P.y - this.hr - .3, `${it.ic} ${it.name}`, GOLD, 16);
    if (it.k === 'conf') msg('Сильному взаимодействию аромат безразличен: Вселенная лепит протоны и нейтроны поровну');
    if (it.k === 'np') msg('Нейтрон тяжелее протона: остывая, Вселенная сама превращает лишние нейтроны в протоны');
    if (it.k === 'frag') msg('Струны рвутся сами: Вселенная рождает пары из вакуума и достраивает барионы');
  },
  renderShop(el) {
    const items = this.shopItems();
    if (!G.started || this.advanced || !items.length) { el.style.display = 'none'; return; }
    const b = this.bal();
    const html = items.map((r, k) => `<button data-i="${k}" class="res ${r.opt ? 'sec' : 'pri'} ${b >= r.c ? 'ok' : 'no'}">${r.opt ? '' : '<u>для задания</u>'}<span class="k">${k + 1}</span>` +
      `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${r.about}</i><em>${r.c} ✦</em></button>`).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    if (!el.onclick) el.onclick = e => { const bt = e.target.closest('button'); if (bt && G.stage.buy) G.stage.buy(+bt.dataset.i); };
    el.style.display = 'flex';
  },
  tally() {
    const n = this.made.p + this.made.n, self = n - this.handN, np = this.liveNP();
    return {
      name: 'Адроны', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['к ядрам: p⁺ · n⁰', `${np.p} · ${np.n} (${Math.round(this.pShare() * 100)} % p⁺)`],
        ['барионы — полем', this.handN], ['барионы — Вселенная', self], ['перезарядки пионом', this.st.handFlips], ['разрывы струн', this.st.snaps], ...(this.gen2 ? [['гипероны полем', this.st.hyp]] : [])],
      auto: [self, n], stars: this.stars || [],
    };
  },

  // ---------- задание и испытания ★ ----------
  starPool() {
    const st = this.st;
    return [
      { t: 'ни одного кварка в π⁰', bad: () => st.pi0Lost > 0, atEnd: true },
      { t: 'каскад: пион из Δ перезарядил нуклон', ok: () => st.cascade > 0 },
      { t: '3 перезарядки пионом', ok: () => st.handFlips >= 3 },
      { t: '3 разрыва струны', ok: () => st.snaps >= 3 },
      { t: 'экзотический адрон', ok: () => st.exo > 0 },
      { t: 'быстрее 2:15', bad: () => this.clock > 135, atEnd: true },
      ...(this.gen2 ? [{ t: 'гиперон распался в нуклон', ok: () => st.hypN > 0 }] : []),
      ...(this.gen3 ? [{ t: 'каскад b → c → s → u', ok: () => st.bCasc > 0 }] : []),
    ];
  },
  tickStars(end) {
    if (!this.stars) this.stars = pickStars(this.starPool());
    tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - this.hr - .4, '★ +10 ✦', [255, 215, 110], 17); });
  },
  steps() {
    const touch = isTouch(), np = this.liveNP(), N = np.p + np.n, pct = Math.round(this.pShare() * 100), own = N - this.uniBars().length;
    const key = (/** @type {string} */ k, /** @type {number} */ c) => `${touch || !this.keyOf(k) ? 'в лавке' : `клавиша ${this.keyOf(k)}`} за ${c} ✦`;
    const cut = touch ? 'чиркни пальцем поперёк струны' : 'чиркни мышью поперёк струны (или двойной клик)';
    return [
      { t: 'Выведи кварки из плазмы', h: 'зажми у трёх кварков разных цветов и вынеси их из горячего облака — там они слипнутся', s: 'первый барион', d: this.handN >= 1 },
      { t: 'Протон, нейтрон и струна', h: `форма — аромат: ● u, ◆ d${this.gen2 ? `, тяжёлые ▲ s, ■ c${this.gen3 ? ', ⬢ b' : ''} — в гиперон` : ''}. Отпусти поле с двумя кварками — останется струна: ${cut}`,
        items: [['p⁺ = ● ● ◆', this.made.p > 0], ['n⁰ = ● ◆ ◆', this.made.n > 0], ['разрыв струны', this.st.snaps > 0]], s: 'формы и струны', d: this.made.p > 0 && this.made.n > 0 && this.st.snaps > 0 },
      { t: 'Сформируй закон «Конфайнмент»', h: this.handN >= HAND_Q || this.steps0() ? key('conf', CONF_COST) : `сначала ещё ${HAND_Q - this.handN} барион${HAND_Q - this.handN === 1 ? '' : 'а'} полем`, s: 'конфайнмент', d: this.rs.conf > 0 },
      { t: 'Перезаряди нуклон пионом', h: 'полый антикварк + кварк того же цвета и другой формы: ● + ◇ = π⁺ — поднеси к n⁰, ◆ + ○ = π⁻ — к p⁺. Или чиркни через Δ к нуклону', s: 'пионный обмен', d: this.st.handFlips > 0 },
      { t: 'Сформируй закон «Баланс n/p»', h: `Вселенная лепит p⁺ и n⁰ поровну, а ядрам нужно больше протонов — ${this.rs.conf && this.st.handFlips ? key('np', NP_COST) : 'сначала перезарядка пионом'}`, s: 'баланс n/p', d: this.rs.np > 0 },
      { t: 'Вещество для ядер', h: `сейчас p⁺ ${pct} % — нужно ${NP_LO * 100}–${NP_HI * 100} % (как к нуклеосинтезу), хотя бы 2 нейтрона и ${OWN_N} нуклонов — твоих, полем`, p: [Math.min(N, GOAL_N), GOAL_N],
        items: [[`p⁺ ${NP_LO * 100}–${NP_HI * 100} %`, N > 0 && this.inCorridor()], ['≥ 2 n⁰', np.n >= 2], [`${OWN_N} — полем`, own >= OWN_N]], s: 'вещество для ядер готово', d: N >= GOAL_N && this.inCorridor() && np.n >= 2 && own >= OWN_N },
    ];
  },
  steps0() { return this.made.p > 0 && this.made.n > 0 && this.st.snaps > 0; },

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
  cheat() { this.cheated = true; this.handN = Math.max(this.handN, HAND_Q); this.made.p = Math.max(1, this.made.p); this.made.n = Math.max(1, this.made.n); this.st.snaps = Math.max(1, this.st.snaps); this.st.handFlips = Math.max(1, this.st.handFlips); this.kn += CONF_COST + NP_COST;
    // законы — сразу, и вещество для ядер вокруг тебя: 10 p⁺ и 2 n⁰ (свои — за краем не растворяются)
    this.rs.conf = this.rs.np = 1;
    const bar = (/** @type {string[]} */ fl, /** @type {number} */ i) => {
      const r = 1.5 + Math.sqrt(i) * 1.1, a = i * 2.4, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
      const m = fl.map((f, c) => { const q = this.mk(x + (c - 1) * .3, y + (c === 1 ? .25 : 0), c, false, f); q.own = 1; return q; });
      const id = this.gid++, grp = { id, m, kind: 'forming', t: 0, born: this.t };
      for (const q of m) q.g = id;
      this.groups.set(id, grp); this.classify(grp);
    };
    for (let i = 0; i < GOAL_N - 2; i++) bar(['u', 'u', 'd'], i);
    for (let i = 0; i < 2; i++) bar(['u', 'd', 'd'], GOAL_N + i);
  },

  // ---------- рисование ----------
  tube(x1, y1, x2, y2, c, w, al) {
    line(x1, y1, x2, y2, c, .16 * al, w * 3);
    line(x1, y1, x2, y2, c, .75 * al, Math.max(1, w));
  },
  drawHot(al) {
    const z = cam.z;
    for (const s of this.qgp) {
      const r = this.hotR(s); if (r < .05) continue;
      const [sx, sy] = W2S(s.x, s.y), R = (r + HOT_EDGE) * z;
      if (!onScreen(sx, sy, R)) continue;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, rgb([255, 140, 70], .3 * al)); g.addColorStop(.7, rgb([230, 80, 60], .16 * al)); g.addColorStop(1, rgb([200, 40, 60], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
      ring(sx, sy, r * z, [255, 170, 110], .35 * al, 1.5, [5, 6]);
      // глюонные искры внутри: тут кварки свободны
      const n = Math.min(40, r * r * 6) | 0;
      ctx.strokeStyle = rgb([255, 220, 180], .3 * al); ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * r * z, x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d, b = Math.random() * TAU, l = 3 + Math.random() * 9; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); }
      ctx.stroke();
      if (r * z > 50) label('плазма > 170 МэВ', sx, sy - r * z + 14, 11, [255, 190, 140], .55 * al, 700);
    }
  },
  draw(al) {
    const z = cam.z;
    ctx.globalAlpha = 1;
    this.drawHot(al);
    // струны (у бариона — Y-образное соединение)
    for (const grp of this.groups.values()) {
      const pts = grp.m.map(x => W2S(x.x, x.y));
      const done = grp.kind === 'p' || grp.kind === 'n', pi = isPi(grp.kind), dq = isDq(grp);
      const unstable = grp.kind === 'pi0' || grp.kind === 'delta', hyp = grp.kind === 'hyp';
      const c = done ? NP_C[grp.kind] : pi ? PI_C[grp.kind] : hyp ? HYP_C[grp.top] : unstable ? [255, 150, 90] : [255, 230, 200];
      const flick = unstable ? .6 + .4 * Math.sin(G.T * 30) : hyp ? .8 + .2 * Math.sin(G.T * 12) : dq ? .75 + .25 * Math.sin(G.T * 5) : 1;
      let maxd = 0;
      for (let i = 0; i < grp.m.length; i++) for (let j = i + 1; j < grp.m.length; j++) maxd = Math.max(maxd, Math.hypot(grp.m[i].x - grp.m[j].x, grp.m[i].y - grp.m[j].y));
      const w = QR * z * .45 * clamp(1.3 - maxd / DBREAK, .25, 1);
      if (pts.length === 3) {
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        for (const p of pts) this.tube(cx, cy, p[0], p[1], c, w, al * flick);
        if (done) {
          glow(cx, cy, 1.5 * z, c, .22 * al);
          ring(cx, cy, .8 * z, c, .6 * al, 2.5); // кольцо цвета нуклона: свечение кварков не перекрывает его, как струны
          tag(HSYM[grp.kind], cx, cy - .8 * z - 13, clamp(.22 * z, 14, 20), c, .95 * al, 800);
        } else if (hyp) {
          arc(cx, cy, .9 * z, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(grp.t / grp.T, 0, 1), c, .8 * al, 2.5);
          tag(grp.sym, cx, cy - 1.15 * z, 13, c, .95 * al, 800);
        } else if (grp.kind === 'delta') {
          const k = clamp(grp.t / DELTA_T, 0, 1);
          arc(cx, cy, .9 * z, -Math.PI / 2, -Math.PI / 2 + TAU * k, [255, 190, 110], .8 * al, 2.5);
          label(grp.dq === '++' ? 'Δ⁺⁺' : 'Δ⁻', cx, cy - 1.15 * z, 13, [255, 200, 130], (.7 + .3 * Math.sin(G.T * 20)) * al, 800);
        }
      } else if (pts.length === 2) {
        this.tube(pts[0][0], pts[0][1], pts[1][0], pts[1][1], c, pi ? w * 1.2 : w, al * flick);
        const mx = (pts[0][0] + pts[1][0]) / 2, my = (pts[0][1] + pts[1][1]) / 2;
        if (pi) {
          glow(mx, my, .9 * z, c, (grp.kind === 'pi0' ? .3 : .2) * al);
          label(HSYM[grp.kind], mx, my - .75 * z, 12, c, .85 * al, 800);
          if (grp.kind !== 'pi0') arc(mx, my, .55 * z, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(grp.t / PI_T, 0, 1), c, .4 * al, 1.5);
        }
      } else if (pts.length > 3) {
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
      const c = QCOL[q.col];
      glow(sx, sy, r * 3, c, .4 * a);
      quark(sx, sy, r, c, q.fl, q.anti, a); // аромат — форма (u — круг, d — ромб), антикварк — полый
      if (r > 7) label(q.anti ? (q.fl === 'u' ? 'ū' : 'd̄') : q.fl, sx, sy + r * 1.9, r * .9, HEAVY[q.fl] ? HYP_C[q.fl] : [255, 255, 255], .8 * a);
    }
    // след «чиркнуть»
    for (let i = 1; i < this.tr.length; i++) {
      const p = this.tr[i - 1], q = this.tr[i], k = 1 - (G.T - q.t) / Q_TR, [x1, y1] = W2S(p.x, p.y), [x2, y2] = W2S(q.x, q.y);
      line(x1, y1, x2, y2, [255, 240, 200], .8 * k * al, 1 + 4 * k);
    }
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, r = this.hr * z, f = this.focus;
    ctx.globalAlpha = al;
    ring(sx, sy, r, [255, 255, 255], .5, 1.5, [6, 6]);
    if (f) {
      const hot = this.hotAt(P.x, P.y) >= .5;
      ring(sx, sy, this.fr() * z, FIELD_C, .35, 1.5, [6, 6]);
      ring(sx, sy, .6 * z + 3 * Math.sin(G.T * 10), GOLD, .7, 2);
      for (const o of f.cap) { const [ox, oy] = W2S(o.x, o.y); line(ox, oy, sx, sy, GOLD, .6, 1.8); }
      for (const g of f.had) { const c = centroid(g.m), [ox, oy] = W2S(c.x, c.y); ring(ox, oy, .75 * z, GOLD, .7, 2); line(ox, oy, sx, sy, GOLD, .6, 1.8); }
      // кого поле возьмёт: золотые дуги на подходящих кварках; лишний цвет — тусклый крест
      const need = f.cap.length < 3 && !f.had.length;
      for (const o of this.q) {
        if (o.cap || Math.hypot(o.x - P.x, o.y - P.y) > this.fr() * 1.6) continue;
        const [ox, oy] = W2S(o.x, o.y), rr = QR * z + 7;
        if (need && this.canCap(o, f.cap)) { const sp = G.T * 2; for (let k = 0; k < 3; k++) arc(ox, oy, rr, sp + k * TAU / 3, sp + k * TAU / 3 + 1.2, GOLD, .85, 2); }
        else if (!o.anti && this.capSet(o, []) && f.cap.some(c => c.col === o.col)) { line(ox - 5, oy - 5, ox + 5, oy + 5, [255, 120, 120], .5, 1.5); line(ox - 5, oy + 5, ox + 5, oy - 5, [255, 120, 120], .5, 1.5); }
      }
      // собрано: кольцо слипания (в очаге — красное и не растёт)
      const pion = f.cap.length === 2 && f.cap.some(o => o.anti);
      if (f.cap.length === 3 || pion) arc(sx, sy, .6 * z + 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(f.tog / (pion ? .2 : .35), 0, 1) * (hot ? .15 : 1), hot ? [255, 140, 110] : [255, 255, 255], .9, 3);
      this.drawPreview(sx, sy - this.fr() * z - 16, f, hot);
    }
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    // курсор над готовым адроном: его можно взять целиком (так носят пион и собирают экзотику)
    if (this.hover && G.started && !G.paused) {
      const c = centroid(this.hover.m), [hx, hy] = W2S(c.x, c.y);
      ring(hx, hy, .8 * z + 2 * Math.sin(G.T * 6), [255, 255, 255], .6, 1.5, [4, 4]);
      if (!this.learn.had) { label('зажми — взять целиком', hx, hy + .8 * z + 16, 12, [255, 255, 255], .8, 700); hintIcons('hold', hx, hy + .8 * z + 16); }
    }
    this.drawShow(al);
    this.drawHint(sx, sy, r);
    this.drawArrows();
    for (const fl of this.floats) {
      const [fx, fy] = W2S(fl.x, fl.y);
      label(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700);
    }
    ctx.globalAlpha = 1;
  },
  // Живое превью над полем: что сейчас в поле (формами) и что из этого выйдет — без чтения правил
  drawPreview(x, y, f, hot) {
    let cap = f.cap, res = '', c = [255, 255, 255];
    if (f.had.length === 1 && isPi(f.had[0].kind)) { const k = f.had[0].kind; [res, c] = [`${HSYM[k]} → к ${k === 'pi+' ? 'n⁰ = p⁺' : 'p⁺ = n⁰'}`, PI_C[k]]; cap = []; }
    else if (f.had.length) return;
    const qs = cap.filter(o => !o.anti), anti = cap.find(o => o.anti), nu = qs.filter(o => o.fl === 'u').length;
    if (anti) {
      const q = qs[0], k = q ? (q.fl === anti.fl ? 'pi0' : q.fl === 'u' ? 'pi+' : 'pi-') : null;
      [res, c] = k ? [`→ ${HSYM[k]}`, PI_C[k]] : [`+ ${anti.fl === 'u' ? '◆' : '●'} того же цвета → ${anti.fl === 'u' ? 'π⁻' : 'π⁺'}`, [255, 220, 170]];
    } else if (qs.length === 3 && this.hypOf(qs)) { const h = this.hypOf(qs); [res, c] = [`→ ${h.sym} → … → нуклон`, HYP_C[h.top]]; }
    else if (qs.length === 2 && qs.some(o => HEAVY[o.fl])) { const hu = this.hypOf([...qs, { fl: 'u' }]), hd = this.hypOf([...qs, { fl: 'd' }]); res = `+● → ${hu.sym} · +◆ → ${hd.sym}`; }
    else if (qs.length === 3) [res, c] = nu === 2 ? ['→ p⁺', NP_C.p] : nu === 1 ? ['→ n⁰', NP_C.n] : [nu === 3 ? '→ Δ⁺⁺ ⚠' : '→ Δ⁻ ⚠', [255, 190, 110]];
    else if (qs.length === 2) res = nu === 2 ? '+◆ → p⁺ · +● → Δ⁺⁺' : nu === 0 ? '+● → n⁰ · +◆ → Δ⁻' : '+● → p⁺ · +◆ → n⁰';
    else if (qs.length === 1) res = '+ ещё два цвета';
    if (!res && !cap.length) return;
    if (hot && (qs.length === 3 || (anti && qs.length))) [res, c] = ['горячо — не слипаются', [255, 150, 120]];
    const n = cap.length, w = n * 18;
    ctx.font = `700 13px system-ui,sans-serif`;
    const tw = res ? ctx.measureText(res).width : 0, W = w + (res ? tw + 10 : 0), x0 = x - W / 2;
    ctx.fillStyle = rgb([14, 12, 26], .7); ctx.beginPath(); ctx.roundRect(x0 - 8, y - 12, W + 16, 24, 12); ctx.fill();
    cap.forEach((o, k) => quark(x0 + 9 + k * 18, y, 6, QCOL[o.col], o.fl, o.anti, 1));
    if (res) { ctx.fillStyle = rgb(c, .95); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(res, x0 + w + (n ? 10 : 0), y); }
  },
  // показ в мире: призрачный жест на первой струне, на Δ, пунктир от пиона к «своему» нуклону, стрелка к лавке
  drawShow(al) {
    if (!G.started || G.paused || G.prev || this.doneAt !== null || Spot.on) { pointAt(null); return; }
    const z = cam.z, a = .9 * al, touch = isTouch();
    // струна дикварка — проведи поперёк
    if (this.st.snaps === 0 && !this.tr.length) {
      const g = [...this.groups.values()].find(g => isDq(g) && !g.m.some(o => o.cap) && inView(g.m[0].x, g.m[0].y));
      if (g) {
        const [p, q] = g.m.map(o => W2S(o.x, o.y)), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
        ghostSwipe(mx - ux * 46, my - uy * 46, ux, uy, a);
        label(touch ? 'чиркни поперёк струны' : 'чиркни поперёк струны · или двойной клик', mx, my + 58, 13, SHOW_C, a, 700);
      }
    }
    // Δ — направь распад к нуклону
    if (this.st.cascade === 0) {
      const g = [...this.groups.values()].find(g => g.kind === 'delta' && inView(g.m[0].x, g.m[0].y));
      if (g) {
        const c = centroid(g.m), N = this.nearest(g.dq === '++' ? 'n' : 'p', c.x, c.y, 6), [dx, dy] = W2S(c.x, c.y);
        if (N) {
          const n = centroid(N.m), [nx, ny] = W2S(n.x, n.y), L = Math.hypot(nx - dx, ny - dy) || 1, ux = (nx - dx) / L, uy = (ny - dy) / L;
          arrowTo(dx + ux * .9 * z, dy + uy * .9 * z, nx - ux * .8 * z, ny - uy * .8 * z, SHOW_C, .6 * a, true);
          const k = (G.T % 1.4) / 1.4, s = smooth(.15, .55, k), gx = dx - ux * 40 + ux * 100 * s, gy = dy - uy * 40 + uy * 100 * s;
          if (k > .15 && k < .6) line(dx - ux * 40, dy - uy * 40, gx, gy, SHOW_C, .6 * a, 3);
          ghostCursor(gx, gy, k > .15 && k < .6, a * smooth(0, .1, k) * (1 - smooth(.85, 1, k)));
          label(`${touch ? 'чиркни' : 'чиркни мышью'} к ${HSYM[N.kind]}`, dx, dy + .9 * z + 22, 13, SHOW_C, a, 700);
        }
      }
    }
    // заряженный пион — пунктир к «своему» нуклону
    if (this.st.handFlips === 0) for (const g of this.groups.values()) {
      if (g.kind !== 'pi+' && g.kind !== 'pi-') continue;
      const c = centroid(g.m), N = this.nearest(g.kind === 'pi+' ? 'n' : 'p', c.x, c.y, 7); if (!N || !inView(c.x, c.y)) continue;
      const n = centroid(N.m), [px, py] = W2S(c.x, c.y), [nx, ny] = W2S(n.x, n.y), L = Math.hypot(nx - px, ny - py) || 1;
      arrowTo(px + (nx - px) / L * .6 * z, py + (ny - py) / L * .6 * z, nx - (nx - px) / L * .7 * z, ny - (ny - py) / L * .7 * z, PI_C[g.kind], .55 * a, true);
      label(`→ ${g.kind === 'pi+' ? 'p⁺' : 'n⁰'}`, nx, ny + .9 * z + 12, 12, PI_C[g.kind], .8 * a, 800);
      break;
    }
    // обязательный закон по карману — стрелка к лавке
    const it = this.shopItems().find(r => !r.opt);
    pointAt(it && this.bal() >= it.c ? document.querySelector('#shop button.pri.ok') : null);
  },
  drawHint(sx, sy, r) {
    if (!G.started || G.paused || this.doneAt !== null) return;
    const f = this.focus; let t = null, g = '';
    const hot = this.hotAt(P.x, P.y) >= .5, ready = f && (f.cap.length === 3 || (f.cap.length === 2 && f.cap.some(o => o.anti)));
    if (ready && hot) {
      [t, g] = ['горячо — вынеси из облака', 'move'];
      const e = this.exitOf(P.x, P.y);
      if (e) { const [ex, ey] = W2S(e.x, e.y); arrowTo(sx, sy, ex, ey, SHOW_C, .75 + .2 * Math.sin(G.T * 6), true); }
    } else if (f && f.had.length === 1 && isPi(f.had[0].kind) && !this.st.handFlips) [t, g] = [`поднеси к ${f.had[0].kind === 'pi+' ? 'n⁰' : 'p⁺'}`, 'move'];
    else if (f && f.had.length === 1 && this.st.exo === 0 && !isPi(f.had[0].kind)) [t, g] = ['добавь ещё адрон — сожмёшь в один', 'move'];
    else if (!this.learn.hold && this.t > 1.5) [t, g] = ['зажми — собрать кварки', 'holdrel'];
    else if (f && f.cap.length && !this.learn.bar && !f.cap.some(o => o.anti)) [t, g] = ['три разных цвета', 'move'];
    else if (!f && this.handN >= 1 && !this.learn.qq && this.st.snaps === 0 && this.made.p + this.made.n >= 2) [t, g] = ['собери два кварка и отпусти — останется струна', 'holdrel'];
    if (!t) return;
    const ty = sy + Math.max(r, this.fr() * cam.z) + 22;
    label(t, sx, ty, 14, [255, 255, 255], .75 + .2 * Math.sin(G.T * 4), 700);
    hintIcons(g, sx, ty); // показать жест, а не только написать
  },
  // стрелки к свободным кваркам за краем экрана
  drawArrows() {
    if (this.doneAt !== null) return;
    const cap = this.focus ? this.focus.cap : [];
    const pts = this.q.filter(o => !o.anti && this.capSet(o, cap)).map(o => [o.x, o.y, QCOL[o.col]]);
    edgeArrows(pts, 3);
  },
  // полоса состава под заданием: доля протонов и зелёный коридор для ядер
  drawNP(al) {
    const { p, n } = this.liveNP(); if (!this.rs.conf || p + n === 0) return;
    const W = Math.min(260, G.W - 60), x0 = (G.W - W) / 2, y = (G.taskY || 120) + 8, s = p / (p + n), ok = this.inCorridor();
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgb([14, 12, 26], .7 * al); ctx.beginPath(); ctx.roundRect(x0 - 8, y - 4, W + 16, 30, 8); ctx.fill();
    ctx.fillStyle = rgb([255, 255, 255], .12 * al); ctx.beginPath(); ctx.roundRect(x0, y + 4, W, 6, 3); ctx.fill();
    ctx.fillStyle = rgb([77, 232, 155], .45 * al); ctx.fillRect(x0 + W * NP_LO, y + 4, W * (NP_HI - NP_LO), 6);
    const mx = x0 + W * s;
    ctx.fillStyle = rgb(ok ? [150, 245, 190] : [255, 200, 120], al); ctx.beginPath(); ctx.moveTo(mx, y + 2); ctx.lineTo(mx - 5, y - 4); ctx.lineTo(mx + 5, y - 4); ctx.fill();
    labelL(`p⁺ ${p}`, x0, y + 19, 11, NP_C.p, .9 * al, 700);
    labelL(`n⁰ ${n}`, x0 + W, y + 19, 11, NP_C.n, .9 * al, 700, 'right');
    label(`${Math.round(s * 100)} % p⁺ · ядрам нужно ${NP_LO * 100}–${NP_HI * 100} %`, x0 + W / 2, y + 19, 11, ok ? [150, 245, 190] : [255, 210, 150], .9 * al, 700);
  },
  overlay(al) {
    if (!G.started || this.advanced) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    const { p, n } = this.liveNP();
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > Q_PAR ? [190, 190, 205] : [255, 255, 255], this.bal(), []);
    if (this.stars) { hudTask(al, this.tk, 'УРОВЕНЬ 2', this.steps(), this.stars, `К ядрам: ${p} p⁺ · ${n} n⁰`); this.drawNP(al); }
    hudBanner(this.banner, 'УРОВЕНЬ 2 · 10⁻⁶ с', 'Адроны', this.nSaved ? `${this.nSaved} сбережённых кварков → протоны и нейтроны` : 'собери из кварков протоны и нейтроны', al, 'из кварков → протоны и нейтроны → без них не будет ни одного ядра');
    ctx.globalAlpha = 1;
  },
  viewR() { return 3.6 + this.hr * 1.4; },
  hud() {
    return { title: '', sub: `T ≈ ${fmtGeV(this.temp * .0862)} · конфайнмент${this.qgp.length ? ' · очаги плазмы горячее' : ''}`, lines: [], goal: '', laws: [] };
  },
};
