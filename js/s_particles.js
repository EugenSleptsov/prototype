"use strict";
/* Уровень частиц: эпохи 1–4. «Вселенная как коллайдер».
   Игрок — не частица, а ДЕТЕКТОР (круг вокруг курсора).
   - Клик = снимок: изучено всё, что сейчас в круге, и следы событий (вершины распадов живут ~2,5 с).
   - Зажать = поле: ближайшие кванты притягиваются к детектору и кружат вокруг него, тянутся за ним
     и набирают энергию (кольцо-шкала вокруг круга). Отпустить = столкнуть их лоб в лоб.
   - Столкновение двух квантов рождает пару частица + античастица (E = mc²).
   - Масса (эпоха 2, поле Хиггса) — вес в руке: с массой поле ловит и вещество, но тяжёлое тянется медленно,
     тормозит детектор и медленнее летит; частица + античастица в поле аннигилируют (на 91 ГэВ — Z).
   - Эпоха 4: зажатое поле — щит: тянет кварки вещества и отталкивает антикварки.
   - Каждая эпоха — задание крупно под часами (цели меняются от забега к забегу) и два случайных испытания ★.
   - ✦ знания добываются ловлей фотонов и снимками и тратятся на исследования мира прямо в игре.
   - Улучшения детектора — отдельный пул: очки ★ (выполнил эпоху — 1, каждое испытание ★ — ещё 1),
     тратятся на карточке итогов эпохи (клавиши 1–4).
   - Пролог «Разогрев»: инфляция кончилась, поле-инфлатон — шарик в чаше потенциала V(φ), катается туда-сюда.
     Его надо раскачать, как качели: зажатое поле толкает шарик влево — зажимать, пока он катится влево, и отпускать в самой
     узкой точке (золотой круг). Зажал не вовремя — раскачка гаснет. На каждом отскоке поле отдаёт энергию в
     свет: из кольца вылетают пары фотонов, тем жёстче, чем сильнее размах, и остаются в мире эпохи 1.
     Чем сильнее размах — тем быстрее ритм; кольцо дошло до красной черты — срыв, раскачка пропадает.
     За 18 с поле распадается; сколько света набрал (шкала внизу) — такой и разогрев: холодный, тёплый
     или горячий (T = k·1 ТэВ, света в мире ∝ k^1,5 до конца уровня). Это настоящий механизм preheating —
     параметрический резонанс инфлатона.
   - Исследования (эпохи 1–3): сначала делаешь руками, потом за ✦ отдаёшь это Вселенной. Свет сам (уровни
     плотности), глюоны, самостолкновения, «X сам» для каждой открытой частицы (и для H, W, Z).
     Вселенная рождает сама только исследованное: H во всплесках поля — после «H сам»,
     в эпохе 3 тяжёлое для распада у горячей точки — после «X сам» (или когда руками уже не сделать). Пункт появляется в панели
     ✦ (до трёх сразу, клавиши 1–7) только после того, как сделал это руками; автоматическое в кодексе помечено ⟳. Пойманный фотон измерен: класс по энергии
     (мягкий, тёплый — обычные; жёсткий — редкий; сверхжёсткий — легендарный) и ⚡ по классу.
   Текста минимум: подсказка в одну строку у детектора, пока действие не освоено. */
const C_LIGHT = 1.2, WORLD_R = 12, T_START = 1000, N_QUANTA = 22, PAIR_T = .8, VERT_T = 2.6, CHARGE_T = 3;
const UPG = [
  { key: 'r', name: 'Радиус', ic: '◎', val: [.9, 1.25, 1.65, 2.1, 2.6], fmt: v => v.toFixed(2), about: 'шире кадр' },
  { key: 'sh', name: 'Перезарядка', ic: '⟳', val: [1.2, .85, .6, .4], fmt: v => v.toFixed(2) + ' с', about: 'чаще снимки' },
  { key: 'pow', name: 'Сила поля', ic: 'ϟ', val: [3, 4, 5, 6.5], fmt: v => '×' + v + ' T', about: 'больше энергии' },
  { key: 'fr', name: 'Захват', ic: '◌', val: [2.6, 3.2, 3.9], fmt: v => '×' + v, about: 'тянет издалека' },
];
const NEED0 = ['u', 'd', 'e']; // эпоха 1: первое поколение; следующие открываются по порядку (GEN_PREV в codex.js)
const HIT_R = .42, H_WIN = 20, Z_WIN = 14; // радиус встречи; полуширина окна резонанса H (ГэВ)
// Тепловая масса в плазме до перехода Хиггса: m ≈ g·T (сильное взаимодействие — кварки ≈ 0,5 T, топ ещё и юкавское ≈ 0,6 T;
// электрослабое — лептоны ≈ 0,2 T). Поэтому и без поля Хиггса у рождения пары есть порог 2m.
const TH_M = { quark: .5, t: .6, lepton: .2 };
const THROW_V = 5, THROW_R = .6; // скорость детектора для броска; радиус попадания броском
// Энергия детектора: появляется, когда открыт фотон; пополняется пойманными фотонами,
// тратится на снимки и на разгон квантов полем
const E_CAP = 10, E_START = 0, E_SHOT = 1, E_FIELD = 2, PH_C = [255, 238, 150];
// Норматив времени эпохи (с): каждая секунда быстрее даёт +2 к итогу. В эпохе 4 вместо скорости — сохранённое вещество.
const PAR = [180, 60, 60]; // часы эпохи 1 идут с конца пролога
const PH_DENS = [0, .45, .75, 1]; // исследование «свет сам»: доля квантов в мире по уровням
const RES_MAX = 4; // исследований в панели ✦ одновременно (клавиши 1–4)
// Три спектра разогрева на выбор: диапазон k (T = k·1 ТэВ), имя и цвет отметок
// h — с какой доли шкалы разогрева начинается этот разогрев
const PROF = [{ n: 'холодный', k: [.82, .92], c: [130, 195, 255], h: 0 }, { n: 'тёплый', k: [1.05, 1.18], c: [255, 215, 110], h: .4 }, { n: 'горячий', k: [1.38, 1.5], c: [255, 120, 200], h: .75 }];
// Пролог — резонанс инфлатона: шарик в чаше V(φ) ∝ φ². Размах A (0…1), фаза θ: φ = A·cos θ, θ ∈ (0, π) — катится влево.
// Зажал — толчок влево. Свет рождается, когда шарик проходит дно (φ = 0). R — полуширина чаши в радиусах детектора.
// Зажатое поле тянет внутрь: dA/dt = f·ω·sin θ — на сжатии раскачивает, на расширении гасит (как качели).
// Отскок (θ = π) отдаёт долю eta размаха в свет: шкала += kap·A². Ритм ω = w0·(1 + wk·A). A > crit — срыв до snapA.
// life — сколько секунд живёт поле после первого нажатия (или после wait секунд без нажатий).
const INF = { A0: .2, w0: TAU / 1.8, wk: 1, f: .08, damp: .03, eta: .06, kap: .09, crit: 1, snapA: .15, life: 18, wait: 8, R: 2.6, deep: .75, low: .4 };
// Классы фотонов по энергии относительно температуры (x = E/T, тепловой спектр): доля, ⚡, ✦ за первую находку (k)
// и ✦ за каждый пойманный (kn) — главный «клик» экономики: больше света в мире → быстрее копятся ✦
const PH_CLS = [
  { n: 'мягкий', r: 'обычный', x: 0, e: .5, k: 5, kn: 1, c: [255, 170, 110] },
  { n: 'тёплый', r: 'обычный', x: 2, e: 1, k: 5, kn: 1, c: [255, 235, 160] },
  { n: 'жёсткий', r: 'редкий', x: 5, e: 2, k: 10, kn: 4, c: [200, 225, 255] },
  { n: 'сверхжёсткий', r: 'легендарный', x: 8, e: 4, k: 20, kn: 10, c: [210, 170, 255] },
];
// Цены исследований: новое в мире (новый вид частиц) — дорого, автоматизация уже имеющегося — дешевле
const RES_COST = { ph: [10, 30, 60], g: [100], coll: [60], cp: [60] }, resNew = v => 60 + 20 * v;
const LB_KEY = 'proto.lb.v1', LB_TOP = 5;
// Таблица рекордов — в браузере игрока (localStorage)
const LB = {
  load() { try { return JSON.parse(localStorage.getItem(LB_KEY)) || {}; } catch (e) { return {}; } },
  name() { try { return localStorage.getItem('proto.name') || 'Игрок'; } catch (e) { return 'Игрок'; } },
  best(key) { const l = this.load()[key]; return l && l.length ? l[0] : null; },
  // добавляет результат, возвращает список и место (0 — первое)
  add(key, e) {
    const all = this.load(), l = all[key] || [];
    l.push(e); l.sort((a, b) => b.s - a.s || (a.t ?? 1e9) - (b.t ?? 1e9));
    all[key] = l.slice(0, 20);
    try { localStorage.setItem(LB_KEY, JSON.stringify(all)); } catch (err) { /* без хранилища таблица живёт до перезагрузки */ }
    return { list: l, place: l.indexOf(e) };
  },
};
const fmtClock = t => t == null ? '—' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
// Таблица рекордов для карточки итогов: место, топ и твоя строка
function lbTable(key, entry, cheated) {
  if (cheated) return '<div class="rk">отладка — без рекорда</div>';
  const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const row = (x, k, me) => `<tr class="${me ? 'me' : ''}"><td>${k + 1}</td><td>${esc(x.n)}</td><td>${x.s}</td><td>${fmtClock(x.t)}</td></tr>`;
  const { list, place } = LB.add(key, entry);
  const top = list.slice(0, LB_TOP).map((x, k) => row(x, k, k === place)).join('') + (place >= LB_TOP ? row(entry, place, true) : '');
  return `<div class="rk">${place === 0 ? '🏆 Рекорд!' : `#${place + 1} из ${list.length}`}</div><table class="lb">${top}</table>`;
}
const LEP_C = [[150, 205, 255], [120, 165, 255], [150, 120, 255]];
const BOS_C = { W: [255, 150, 70], Z: [255, 105, 115], H: [255, 215, 90], ph: [255, 240, 190] };
const NU_C = [175, 255, 205], GOLD = [255, 226, 106], FIELD_C = [82, 200, 255], SHIELD_C = [77, 232, 155];
const FERMIONS = ['u', 'd', 'c', 's', 't', 'b', 'e', 'mu', 'ta', 'ne', 'nm', 'nt'];
// Эпохи уровня. Температура не опускается ниже floor, пока цели эпохи не выполнены;
// следующая эпоха начинается, когда T ≤ startT (и после короткой паузы).
const EPOCHS = [
  { name: 'Чистая энергия', floor: 165, tau: 36, startT: Infinity, when: '10⁻¹² с', line: 'Сначала нет ничего — только вакуум' },
  { name: 'Поле Хиггса', floor: 90, tau: 14, startT: 160, when: '10⁻¹¹ с', line: 'Поле застывает — у частиц появляется масса' },
  { name: 'Распады', floor: 3, tau: 14, startT: Infinity, when: '10⁻¹⁰ с', line: 'Тяжёлое распадается — сними цепочки' },
  { name: 'Аннигиляция', floor: .5, tau: 36, startT: 3, when: '10⁻⁷ с', line: 'Вещество против антивещества' },
];
const CHAINS = [['t', 'b', 'c'], ['ta', 'mu']]; // чьи распады нужно снять в эпохе 3
const COL_N = ['красный', 'зелёный', 'синий']; // цвет кварка; у глюона — цвет и антицвет
const STOCK_GOAL = 15, TRIO_GOAL = 5; // цель эпохи 4 — пять будущих барионов (по кварку каждого цвета)
const TRIO_W = TRIO_GOAL < 5 ? 'тройки' : 'троек';
// Автоматизация эпохи 4: исследуй «Асимметрию» — и Вселенная сама сберегает тройки (раз в SAVE_CD с);
// AUTO_TRIO таких — и вещество больше не нуждается в тебе: уровень кончается не «по времени», а потому что научился сам
const AUTO_TRIO = 6, SAVE_CD = 2.2, HAND_CP = 2;
// Сколько барионов можно собрать из кварков [{fl, col}]: три разных цвета, не uuu/ddd (жадно)
function baryonTrios(list) {
  const cnt = {};
  for (const o of list) { const k = o.fl + o.col; cnt[k] = (cnt[k] || 0) + 1; }
  let n = 0;
  for (;;) {
    let best = null, bs = -1;
    for (let m = 0; m < 8; m++) {
      const fl = [0, 1, 2].map(c => (m >> c & 1) ? 'u' : 'd');
      const u = fl.filter(x => x === 'u').length; if (u === 0 || u === 3) continue;
      const keys = fl.map((f, c) => f + c);
      if (!keys.every(k => cnt[k] > 0)) continue;
      const s = Math.min(...keys.map(k => cnt[k])); if (s > bs) { bs = s; best = keys; }
    }
    if (!best) return n;
    for (const k of best) cnt[k]--; n++;
  }
}

// Волна вдоль направления движения: голова в (sx, sy), хвост сзади, к хвосту затухает.
// cols — один цвет или два (у глюона цвет и антицвет чередуются по полупериодам).
function waveLine(sx, sy, dx, dy, L, per, amp, phase, cols, a, lw) {
  const nx = -dy, ny = dx, steps = Math.max(8, Math.min(48, L / 2.5 | 0));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps * L, arg = s / per * TAU + phase, w = Math.sin(arg) * amp;
    pts.push([sx - dx * s + nx * w, sy - dy * s + ny * w, Math.floor(arg / Math.PI) & 1]);
  }
  ctx.lineWidth = lw;
  for (let ci = 0; ci < cols.length; ci++) {
    const g = ctx.createLinearGradient(sx, sy, sx - dx * L, sy - dy * L);
    g.addColorStop(0, rgb(cols[ci], a)); g.addColorStop(.55, rgb(cols[ci], a)); g.addColorStop(1, rgb(cols[ci], 0));
    ctx.strokeStyle = g; ctx.beginPath();
    let pen = false;
    for (let i = 1; i < pts.length; i++) {
      const on = cols.length === 1 || pts[i][2] === ci;
      if (on) { if (!pen) ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); }
      pen = on;
    }
    ctx.stroke();
  }
}
// Дуга-клин: толщина растёт от w0 у начала до w1 у конца — «набираешь» видно по толщине
function wedge(x, y, r, a0, a1, w0, w1, c, a) {
  if (!(a > 0) || Math.abs(a1 - a0) < .005) return;
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / .08)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, an = a0 + (a1 - a0) * t, w = (w0 + (w1 - w0) * t) / 2; pts.push([an, r + w, r - w]); }
  ctx.fillStyle = rgb(c, a); ctx.beginPath();
  pts.forEach(([an, ro], i) => { const X = x + Math.cos(an) * ro, Y = y + Math.sin(an) * ro; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  for (let i = pts.length - 1; i >= 0; i--) { const [an, , ri] = pts[i]; ctx.lineTo(x + Math.cos(an) * ri, y + Math.sin(an) * ri); }
  ctx.closePath(); ctx.fill();
}
function arc(x, y, r, a0, a1, c, a, lw, dash) {
  if (!(r > 0) || !(a > 0)) return;
  ctx.strokeStyle = rgb(c, a); ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); if (dash) ctx.setLineDash([]);
}

const Particles = {
  key: 'particles', name: 'Частицы', bg: [44, 34, 14], controls: '',

  enter() {
    this.p = []; this.t = 0; this.T = T_START; this.hig = 0; this.higT = -1; this.higC = { x: 0, y: 0 }; this.ripples = []; this.ripCd = 0; this.ff = 1;
    this.advanced = false;
    this.gOn = false; this.full = false; this.spCd = 0; // эволюция эпохи 1: сперва пустота, потом свет, потом глюоны
    this.lit = false; this.litT = 0; this.rs = { ph: 0, g: 0, coll: 0, cp: 0 }; this.safe = []; this.saveCd = 0; this.autoT = 0; Codex.auto = new Set(); this.inf = this.mkInf(); this.T0 = T_START; this.heat = 1; this.upPts = 0; this.caught = [0, 0, 0, 0]; this.phSeen = new Set();
    this.kn = 0; this.spent = 0; this.epClock = 0; this.epKn0 = 0; this.doneAt = null; this.lvlTotal = 0; this.cheated = false; this.res = null;
    this.lvl = { r: 0, sh: 0, pow: 0, fr: 0 }; this.focus = null; this.holding = false; this.hold = 0; this.shield = 1;
    this.learn = {}; this.en = 0; this.enFx = 0; this.shotCd = 0; this.tracks = []; this.floats = []; this.seenN = {}; this.ejected = 0;
    this.bg = [44, 34, 14];
    this.ep = 0; this.epDone = false; this.epGap = 0; this.bannerFor = -1; this.banner = 99; this.epT = 0;
    this.pairs = 0; this.decSeen = new Set(); this.hot = []; this.hotCd = 3; this.stock = 0; this.stockQ = []; this.soupCd = 0; this.handoff = null; this.stockOut = false; this.finale = -1;
    Codex.run = new Set(); Codex.dirty = true;
    // цели этого забега: что открыть в эпохе 1 и чьи распады снять в эпохе 3
    this.need0 = [...NEED0];
    // распады эпохи 3 — по порядку поколений: лёгкое раньше тяжёлого
    this.need2 = pickStars(CHAINS.flat().map(sp => ({ sp })), 3).map(x => x.sp).sort((a, b) => SM[a].gen - SM[b].gen);
    this.newEpochState(0);
    P.x = P.y = P.vx = P.vy = 0; P.dashCd = 0;
  },
  newEpochState(i) {
    this.st = { pairs: 0, thr: 0, empty: 0, kinds: 0, dry: 0, eaten: 0, recol: 0 }; // статистика эпохи для испытаний
    this.tk = {}; this.stars = pickStars(this.starPool(i));
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13, t = 0) { this.floats.push({ x, y, t, txt, c, sz }); },

  // ---------- создание ----------
  thermalP(T) { return T * -Math.log(Math.random() * Math.random() * Math.random() + 1e-12); },
  mk(sp, anti, x, y, a, p, col) {
    const s = SM[sp], o = { sp, anti, x, y, dx: Math.cos(a), dy: Math.sin(a), p, col: col ?? (Math.random() * 3 | 0),
      age: 0, life: s.life ? -s.life * Math.log(Math.random() + 1e-9) : Infinity, born: 0, cd: 0, dead: false, ph: Math.random() * TAU };
    if (sp === 'g') o.col2 = (o.col + 1 + (Math.random() * 2 | 0)) % 3;
    if (sp === 'g' || sp === 'ph') o.amp = rnd(.5, 1.5); else o.trail = [];
    this.p.push(o); return o;
  },
  up(k) { const u = UPG.find(x => x.key === k); return u.val[this.lvl[k]]; },
  hr() { return this.up('r'); },
  fr() { return this.hr() * this.up('fr'); }, // радиус захвата полем
  wr() { return Math.max(WORLD_R, viewRadius() + 1); },
  nQ() { return Math.round(N_QUANTA * (this.wr() / WORLD_R) ** 2 * this.heat); }, // горячее разогрев — больше квантов
  randPos(outside) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, d = outside ? rnd(viewRadius() * .9, this.wr()) : Math.sqrt(Math.random()) * this.wr();
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if (Math.hypot(x - P.x, y - P.y) > this.hr() * 1.5) return [x, y];
    }
    return [P.x + this.wr() * .8, P.y];
  },
  // Возмущение вакуума: из точки разлетается пара фотонов (импульс сохраняется)
  burst(x, y, fx, p0) {
    const a = Math.random() * TAU, p = p0 ?? this.thermalP(this.T), made = [];
    for (const s of [0, Math.PI]) { const o = this.mk('ph', false, x, y, a + s, p); o.cd = .6; made.push(o); }
    if (fx) fxRing(x, y, .05, PH_C, .9, .6);
    this.pingRare(made[0]);
    return made;
  },
  // ---------- пролог: резонанс инфлатона ----------
  mkInf() { return { A: INF.A0, th: -Math.PI / 2, H: 0, t: 0, idle: 0, go: false, hold: false, gain: 0, loss: 0, flash: 0, snapFx: 0, snaps: 0, good: 0, late: 0, pick: null, zone: 0 }; },
  // Разогрев по шкале H (0…1): зона даёт имя и цвет, место внутри зоны — температуру k
  profOf(H) {
    const i = H >= PROF[2].h ? 2 : H >= PROF[1].h ? 1 : 0, p = PROF[i], hi = i < 2 ? PROF[i + 1].h : 1;
    const k = lerp(p.k[0], p.k[1], clamp((H - p.h) / (hi - p.h), 0, 1));
    return { ...p, i, k, heat: k ** 1.5 };
  },
  infW() { return INF.w0 * (1 + INF.wk * this.inf.A); },
  tickInf(dt) {
    const I = this.inf;
    I.flash = Math.max(0, I.flash - dt * 2.5); I.snapFx = Math.max(0, I.snapFx - dt);
    if (mouse.clicked) { mouse.clicked = false; I.go = true; I.hold = true; I.gain = I.loss = 0; }
    if (I.hold && !mouse.down) { // отпустил: раскачал или погасил?
      I.hold = false;
      if (I.loss > I.gain && I.loss > .01) I.late++; else if (I.gain > .02) I.good++;
    }
    if (!I.go && (I.idle += dt) > INF.wait) I.go = true; // не трогает — поле распадается само, Вселенная выйдет холодной
    if (I.go) I.t += dt;
    const w = this.infW();
    if (I.hold) { const d = INF.f * w * Math.sin(I.th) * dt; I.A += d; if (d > 0) I.gain += d; else I.loss -= d; }
    I.A = Math.max(.08, I.A * (1 - INF.damp * dt));
    const th2 = I.th + w * dt;
    if (Math.floor((th2 - Math.PI / 2) / Math.PI) > Math.floor((I.th - Math.PI / 2) / Math.PI)) this.infBounce();
    I.th = th2;
    if (I.A > INF.crit) this.infSnap();
    Sfx.hum(I.hold ? .15 + .85 * Math.min(1, I.A) : 0);
    if (I.go && I.t >= INF.life) this.ignite(this.profOf(I.H));
  },
  // Чаша (в мире): полуширина, глубина до черты срыва, дно — под центром детектора
  infBowl() { const w = this.hr() * INF.R; return { w, d: w * INF.deep, bx: P.x, by: P.y + w * INF.low }; },
  // Проход дна: поле отдаёт часть размаха в свет — со дна разлетаются пары фотонов, тем жёстче, чем сильнее размах
  infBounce() {
    const I = this.inf, A = Math.min(1, I.A); I.flash = 1;
    if (!I.go) return; // пока не тронул — шарик только показывает ритм
    I.H = Math.min(1, I.H + INF.kap * A * A / 2); I.A -= INF.eta / 2 * I.A;
    const c0 = A < .3 ? 0 : A < .55 ? 1 : A < .8 ? 2 : 3, n = 1 + (A > .7), B = this.infBowl(), R = this.hr() * .4;
    for (let k = 0; k < n; k++) {
      const c = Math.random() < .3 ? Math.max(0, c0 - 1) : c0, C = PH_CLS[c], hi = c < 3 ? PH_CLS[c + 1].x : 11;
      const a = Math.random() * TAU, p = this.T * rnd(Math.max(.6, C.x + .2), hi - .2);
      for (const s of [0, Math.PI]) { const o = this.mk('ph', false, B.bx + Math.cos(a + s) * R, B.by + Math.sin(a + s) * R, a + s, p); o.cd = .6; }
    }
    const C = PH_CLS[c0]; this.kn += .5;
    fxRing(B.bx, B.by, R * .5, C.c, R + this.hr() * (.6 + A), .5); Sfx.play('pert', c0);
    const z = this.profOf(I.H).i;
    if (z > I.zone) { I.zone = z; const p = PROF[z]; Sfx.play('goal'); this.float(P.x, P.y - this.hr() * 2.2, `${p.n} разогрев`, p.c, 16); }
  },
  // Срыв: размах дошёл до красной черты — поле дробится в мягкий свет, раскачку начинать заново
  infSnap() {
    const I = this.inf; I.A = INF.snapA; I.snaps++; I.snapFx = 2.5; I.hold = false; I.gain = I.loss = 0;
    const B = this.infBowl(), x = B.bx + B.w * Math.sign(Math.cos(I.th) || 1), y = B.by - B.d; // шарик вылетел за край
    for (let k = 0; k < 3; k++) fxRing(x, y, this.hr() * (.3 + .3 * k), [255, 90, 80], this.hr() * (1.5 + .6 * k), .5 + .1 * k);
    fxFlash(x, y, this.hr(), [255, 80, 70], .4); Sfx.play('overheat');
    this.float(P.x, P.y - this.hr() * 2.2, 'срыв резонанса', [255, 120, 110], 15);
  },
  // Поле распалось — Вселенная разогрета до набранной температуры; света в ней до конца уровня ∝ T^1,5
  ignite(p = this.profOf(.55)) {
    this.lit = true; this.litT = 0; this.banner = 0; this.inf.pick = p; this.inf.hold = false; Sfx.hum(0); Sfx.play('ignite'); // одно событие — заголовок эпохи 1
    this.heat = p.heat;
    this.T = this.T0 = T_START * p.k;
    this.en = Math.max(this.en, E_START);
    fxRing(P.x, P.y, .5, PH_C, this.wr(), 2.5); fxFlash(P.x, P.y, this.hr() * 2, [255, 240, 200], .6);
  },
  phClass(o) { const x = o.p / Math.max(this.T, 1e-9); let c = 0; for (let i = 0; i < PH_CLS.length; i++) if (x >= PH_CLS[i].x) c = i; return c; },
  // Родился легендарный фотон — вспышка-метка, чтобы его заметили
  pingRare(o) {
    if (!this.lit || this.phClass(o) < 3) return;
    fxRing(o.x, o.y, .1, PH_CLS[3].c, 1.6, .9);
    if (onScreen(...W2S(o.x, o.y), -20)) this.float(o.x, o.y, 'сверхжёсткий γ!', PH_CLS[3].c, 13);
  },
  qCap() { return this.ep > 0 ? this.nQ() : Math.round(this.nQ() * PH_DENS[this.rs.ph] * Math.min(1, .3 + this.autoT / 10)); },
  spawnQuantum(any) {
    // вакуум только что закипел: возмущения вспыхивают прямо в кадре, пары фотонов
    if (this.ep === 0 && !this.gOn && this.autoT < 10) { const [bx, by] = this.randPos(false); this.burst(bx, by, true); return; }
    const [x, y] = this.randPos(!any);
    // пополнение держит фотоны и глюоны поровну: детектор ест фотоны на энергию, их не должно стать нечем ловить
    let ng = 0, nph = 0; for (const o of this.p) if (!o.dead) { if (o.sp === 'g') ng++; else if (o.sp === 'ph') nph++; }
    const o = this.mk(this.ep === 3 ? (Math.random() < .75 ? 'g' : 'ph') : this.gOn && (any ? Math.random() < .5 : ng < nph) ? 'g' : 'ph', false, x, y, Math.random() * TAU, this.thermalP(this.T));
    if (o.sp === 'g' && this.ep === 3 && this.stock > 0 && Math.random() < .6) {
      const c = this.colCnt(), lo = c.indexOf(Math.min(...c)), hi = c.indexOf(Math.max(...c));
      if (lo !== hi) { o.col = lo; o.col2 = hi; }
    }
    if (any) o.born = 1;
    if (o.sp === 'ph') this.pingRare(o);
  },
  // пара частица + античастица разлетается из одной точки
  // col — цвет кварка, colB — антицвет антикварка (из глюона цвет и антицвет переходят в пару)
  pair(sp, x, y, pEach, col, colB) {
    const a = Math.random() * TAU, c = col ?? (Math.random() * 3 | 0);
    const A = this.mk(sp, false, x, y, a, pEach, c), B = this.mk(sp, true, x, y, a + Math.PI, pEach, colB ?? c);
    A.cd = B.cd = .4; return [A, B];
  },
  meff(o) { return SM[o.sp].m * this.hig; },
  // Масса для порога рождения пары: тепловая (≈ g·T) до перехода Хиггса, масса покоя — после
  mThr(sp) { const s = SM[sp], k = sp === 't' ? TH_M.t : TH_M[s.kind] || 0; return Math.hypot(s.m * this.hig, k * this.T * (1 - this.hig)); },
  speed(o) { if (o.v != null) return o.v; const m = this.meff(o); return m <= 0 ? C_LIGHT : C_LIGHT * o.p / Math.sqrt(o.p * o.p + m * m); },
  isQ(o) { return o.sp === 'ph' || o.sp === 'g'; },
  // Тяжесть в руке 0…1: растёт с массой (по логарифму — масса частиц различается в 10⁵ раз) и с полем Хиггса
  heavy(o) { const m = this.meff(o); return m <= 0 ? 0 : clamp(Math.log10(1 + m / .001) / 5.3, 0, 1); },
  // Что держит поле: кванты — всегда; вещество (кварки и заряженные лептоны) — только когда у него есть масса
  grabbable(o) { const k = SM[o.sp].kind; return this.isQ(o) || (this.hig >= .5 && (k === 'quark' || k === 'lepton')); },
  antiPair(a, b) { return a.sp === b.sp && a.anti !== b.anti && !this.isQ(a); },
  // Груз поля: чем тяжелее захваченное, тем медленнее детектор
  load() { return this.focus ? this.focus.cap.reduce((s, o) => s + this.heavy(o), 0) : 0; },
  inHand(o) { return Math.hypot(o.x - P.x, o.y - P.y) < this.hr(); },
  enOn() { return this.lit && Codex.has('ph'); },
  fieldOn() { return this.ep > 0 || Codex.has('g'); }, // сталкивать можно, когда открыт глюон
  // Пул энергии собран — во Вселенной появляются глюоны
  unlockGluons() {
    this.gOn = true;
    for (let k = 0; k < 8; k++) { const [x, y] = this.randPos(false); this.mk('g', false, x, y, Math.random() * TAU, this.thermalP(this.T)); }
    fxRing(P.x, P.y, this.hr(), [255, 120, 160], this.wr(), 1.6);
  },
  // После первого столкновения игрока кванты изредка сталкиваются и сами — при случайной встрече
  spontaneous(dt) {
    if (!this.rs.coll || this.ep === 3 || (this.spCd -= dt) > 0) return; // только после исследования «Столкновения»
    const q = this.p.filter(o => !o.dead && this.isQ(o) && !o.cap && !(o.flung > 0) && o.born >= 1 && o.cd <= 0 && !(o.fade >= 0));
    for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
      const a = q[i], b = q[j];
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > .12) continue;
      a.cd = b.cd = 1;
      if (Math.random() < .6 && this.collide(a, b, true)) { this.spCd = 1.5; return; }
    }
  },
  canShot() { return this.shotCd <= 0 && (!this.enOn() || this.en >= E_SHOT); },
  noEnergy() { this.enFx = .6; this.st.dry++; Sfx.play('fizzle'); },
  // Детектор поглощает знакомый фотон, пролетевший через его центр
  // Пойманный фотон измерен: класс по энергии; ⚡ — по классу; новый класс и редкие дают ✦
  absorb(o) {
    const c = this.phClass(o), C = PH_CLS[c];
    o.dead = true; this.en = Math.min(E_CAP, this.en + C.e); this.learn.absorb = true; this.caught[c]++; this.caughtFx = c; this.caughtAt = G.T;
    fxRing(o.x, o.y, .05, C.c, .5 + .3 * c, .35 + .1 * c); Sfx.play('catch', c);
    if (!this.measure(c)) { this.kn += C.kn; if (c >= 2) {
      this.float(P.x, P.y - this.hr() - .2, `${C.r}! ${C.n} γ · +${C.kn} ✦`, [255, 215, 110], 15);
    } else this.float(P.x + .5, P.y + this.hr() * .3, `+${C.kn} ✦ +${C.e}⚡`, C.c, 12); }
    if (c === 3) fxFlash(P.x, P.y, this.hr() * 1.5, C.c, .5);
  },
  // Измерен фотон класса c: новый класс — событие и ✦. Возвращает true, если класс новый.
  measure(c) {
    if (this.phSeen.has(c)) return false;
    const C = PH_CLS[c];
    this.phSeen.add(c); this.kn += C.k; Sfx.play('fresh');
    fxRing(P.x, P.y, this.hr(), C.c, this.hr() * 1.6, .8);
    this.float(P.x, P.y - this.hr() - .2, `НОВЫЙ КЛАСС: ${C.n} γ · ${C.r} · +${C.k} ✦`, c >= 2 ? [255, 215, 110] : C.c, c >= 2 ? 17 : 15);
    return true;
  },
  // Больцмановский вес: сколько частиц этого сорта держит Вселенная при температуре T
  weight(sp) { const m = SM[sp].m * this.hig; return m <= 0 ? 1 : Math.exp(-m / this.T); },

  // ---------- действие игрока: поле ----------
  // Ввод: нажатие — снимок; удержание — поле (эпохи 1–3: захват квантов, эпоха 4: щит)
  input(dt) {
    if (!this.lit && this.ep === 0) return this.tickInf(dt);
    // короткое нажатие — снимок (на отпускании); удержание — поле, без снимка
    if (mouse.clicked) { mouse.clicked = false; this.holding = true; this.hold = 0; }
    if (this.holding && !mouse.down) { this.holding = false; const tap = !this.focus; this.release(); if (tap) this.snapshot(); }
    if (this.holding) { this.hold += dt; if (this.hold > .18 && !this.focus && this.fieldOn()) this.focus = { cap: [], q: 0, E: 0, ang: Math.random() * TAU, t: 0 }; }
  },
  Emax() { return 2 * this.T * this.up('pow'); },
  // Энергия столкновения растёт, пока держишь поле: от почти нуля до 2·T·сила
  chargeE(q) { return this.Emax() * (.02 + .98 * q); },
  qOf(E) { return (E / this.Emax() - .02) / .98; },
  tickFocus(dt) {
    const f = this.focus; if (this.lit || this.ep) Sfx.hum(f && f.cap.length && this.ep !== 3 ? .1 + .9 * f.q : 0); if (!f || this.ep === 3) return;
    f.t += dt;
    f.cap = f.cap.filter(o => !o.dead);
    if (f.cap.length < 2) {
      let best = null, bd = this.fr() * 2;
      for (const o of this.p) {
        if (o.dead || o.cap || !this.grabbable(o) || o.born < .5 || o.fade >= 0 || o.flung > 0) continue;
        // к кванту — только квант; к частице — только её античастица
        const f0 = f.cap[0];
        if (f0 && (this.isQ(f0) ? !this.isQ(o) : !this.antiPair(f0, o))) continue;
        // второй квант — того же вида, что первый (наведись на фотон — получишь γγ), если такой есть рядом
        const d = Math.hypot(o.x - P.x, o.y - P.y), sc = d + (f.cap.length && o.sp !== f.cap[0].sp ? this.fr() * .99 : 0);
        if (d < this.fr() && sc < bd) { bd = sc; best = o; }
      }
      if (best) { best.cap = true; best.v = undefined; f.cap.push(best); Sfx.play('grab'); if (!this.isQ(best)) { this.learn.heavy = true; if (best.trail) best.trail = []; } }
    }
    const two = f.cap.length === 2;
    if (f.cap.length && (two || this.isQ(f.cap[0]))) { // вещество разгоняется, только когда пара в поле
      const bd = two && (this.band(f) || (this.leptonWin() && [2 * this.mThr('e'), 2 * this.mThr('u')])), inB = bd && f.E > bd[0] && f.E < bd[1];
      let dq = Math.min(dt / CHARGE_T * (inB ? .3 : 1), 1 - f.q); // на резонансе стрелка замедляется — успей отпустить
      if (this.enOn()) { dq = Math.min(dq, this.en / E_FIELD); this.en -= dq * E_FIELD; if (dq <= 0 && f.q < 1) this.noEnergy(); }
      f.q += dq; f.E = this.chargeE(f.q);
    }
    if (two) { f.t2 = (f.t2 || 0) + dt; if (f.t2 > .4) this.learn.hold = true; if (!this.isQ(f.cap[0])) this.learn.pair2 = true; }
    f.ang += dt * (2.2 + 7 * f.q);
    // захваченные кванты тянутся к детектору (и за ним), затем кружат друг напротив друга;
    // на разгоне отстают назад, как камень в рогатке
    const ro = this.hr() * .42, pv = Math.hypot(P.vx, P.vy), lag = Math.min(.6, pv * .05) / (pv || 1);
    f.cap.forEach((o, k) => {
      const a = f.ang + k * Math.PI, tx = P.x + Math.cos(a) * ro - P.vx * lag, ty = P.y + Math.sin(a) * ro - P.vy * lag;
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), step = (C_LIGHT * 2.5 + pv) * dt / (1 + 3 * this.heavy(o)); // тяжёлое тянется медленно
      if (d > step) { o.x += dx / d * step; o.y += dy / d * step; o.dx = dx / d; o.dy = dy / d; }
      else { o.x = tx; o.y = ty; o.dx = -Math.sin(a); o.dy = Math.cos(a); }
      o.p = f.E / 2;
    });
  },
  thrownReady() { return Math.hypot(P.vx, P.vy) > THROW_V; },
  // Резонанс, на котором стоит отпустить: два глюона — H, частица + античастица — Z
  band(f) {
    if (this.hig <= .5 || f.cap.length < 2) return null;
    const [a, b] = f.cap;
    if (a.sp === 'g' && b.sp === 'g') return [SM.H.m - H_WIN, SM.H.m + H_WIN];
    if (this.antiPair(a, b)) { const m = this.meff(a), E = rs => 2 * Math.sqrt(Math.max(0, (rs / 2) ** 2 - m * m)); return SM.Z.m - Z_WIN > 2 * m ? [E(SM.Z.m - Z_WIN), E(SM.Z.m + Z_WIN)] : null; }
    return null;
  },
  // √s столкновения, если отпустить сейчас (у массивных лоб в лоб: 2·√(p² + m²))
  rsOf(f) { const a = f.cap[0]; return f.cap.length === 2 && !this.isQ(a) ? 2 * Math.hypot(f.E / 2, this.meff(a)) : f.E; },
  // Отпустил — захваченные летят навстречу друг другу и сталкиваются лоб в лоб (√s = E)
  release() {
    const f = this.focus; this.focus = null; if (!f) return;
    const c = f.cap.filter(o => !o.dead); c.forEach(o => { o.cap = false; });
    if (!c.length || this.ep === 3) return;
    // Рогатка: отпустил на разгоне — кванты летят вперёд и бьют всё, что встретят
    if (this.thrownReady()) {
      const base = Math.atan2(P.vy, P.vx);
      c.forEach((o, k) => {
        const an = base + (c.length > 1 ? (k ? .1 : -.1) : 0);
        o.dx = Math.cos(an); o.dy = Math.sin(an); o.p = f.E / 2; o.flung = 2.2; o.v = C_LIGHT * 2.4 / (1 + this.heavy(o));
        o.thrown = true; o.sib = c[1 - k] || null; o.mate = null;
      });
      fxRing(P.x, P.y, this.hr() * .4, GOLD, this.hr() * .9, .35); Sfx.play('throw');
      this.learn.throw = true;
      return;
    }
    if (c.length < 2) return;
    const [a, b] = c, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    for (const o of c) {
      const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1;
      o.dx = dx / d; o.dy = dy / d; o.p = f.E / 2; o.flung = .7 * (1 + this.heavy(o)); o.v = C_LIGHT * 1.6 / (1 + this.heavy(o));
    }
    a.mate = b; b.mate = a;
    this.learn.smash = true;
    if (Math.hypot(a.x - b.x, a.y - b.y) < HIT_R) this.smash(a, b);
  },
  // Столкновение по воле игрока: кванты — рождают пары, частица + античастица — аннигилируют
  smash(a, b) {
    if (this.isQ(a) && this.isQ(b)) return this.collide(a, b);
    a.mate = b.mate = null; a.thrown = b.thrown = false; a.flung = b.flung = 0; a.v = b.v = undefined;
    if (!this.antiPair(a, b)) return false;
    this.annihilate(a, b); this.pairs++; this.st.pairs++; this.learn.ann = true;
    return true;
  },
  // Эпоха 4: щит. Тянет кварки вещества к детектору, отталкивает антикварки. Заряд щита ограничен.
  tickShield(dt) {
    const on = this.focus && this.ep === 3 && this.shield > 0;
    this.shield = on ? Math.max(0, this.shield - dt / 4) : Math.min(1, this.shield + dt / 5);
    if (!on) return;
    if ((this.focus.t += dt) > 1) this.learn.shield = true;
    const R = this.fr();
    for (const o of this.p) {
      if (o.dead) continue;
      const dx = P.x - o.x, dy = P.y - o.y, d = Math.hypot(dx, dy);
      if (d > R * 1.3 || d < 1e-3) continue;
      if (o.sp === 'g') { if (this.helpGlu(o)) { o.dx = dx / d; o.dy = dy / d; o.v = 2.2; o.pull = .15; } continue; } // полезный глюон — внутрь, перекрасить
      if (SM[o.sp].kind !== 'quark' || d > R) continue;
      if (!o.anti) { o.dx = dx / d; o.dy = dy / d; o.v = 1.3; o.pull = .15; }
      else { o.dx = -dx / d; o.dy = -dy / d; o.v = 2; o.rep = 1.2; }
    }
  },

  // ---------- физика событий ----------
  sqrtS(a, b) {
    if (this.isQ(a) && this.isQ(b)) { const cos = a.dx * b.dx + a.dy * b.dy; return Math.sqrt(Math.max(0, 2 * a.p * b.p * (1 - cos))); }
    const ma = this.meff(a), mb = this.meff(b), Ea = Math.hypot(a.p, ma), Eb = Math.hypot(b.p, mb);
    const px = a.dx * a.p + b.dx * b.p, py = a.dy * a.p + b.dy * b.p;
    return Math.sqrt(Math.max(0, (Ea + Eb) ** 2 - px * px - py * py));
  },
  // Какие пары может родить столкновение двух квантов (веса ~ квадрат заряда × число цветов)
  // spont — столкнула сама Вселенная: рождает только то, что исследовано «X сам» (руками — всё, на что хватает энергии)
  channels(a, b, rs, spont) {
    const ch = [], post = this.hig > .5, kinds = [a.sp, b.sp].sort().join('');
    const ok = sp => rs >= 2 * this.mThr(sp) && (!spont || Codex.auto.has(sp)) && genOpen(sp);
    for (const sp of ['u', 'c', 't', 'd', 's', 'b', 'e', 'mu', 'ta']) {
      const s = SM[sp], quark = s.kind === 'quark';
      if (!ok(sp)) continue;
      let w = 0;
      if (kinds === 'phph') w = s.q * s.q * (quark ? 3 : 1);
      else if (kinds === 'gph') w = quark ? s.q * s.q * 3 : 0;
      else if (kinds === 'gg') w = quark ? 1 : 0;
      if (!Codex.has(sp)) w *= quark ? 5 : 3; // ещё не виденное (но уже открытое поколение) рождается охотнее
      if (w > 0) ch.push([sp, w]);
    }
    if (post && kinds === 'phph' && rs >= 2 * SM.W.m && (!spont || Codex.auto.has('W'))) ch.push(['WW', 1.5]);
    if (post && kinds === 'gg' && Math.abs(rs - SM.H.m) < H_WIN && (!spont || Codex.auto.has('H'))) ch.push(['H', 10]);
    return ch;
  },
  pickW(ch) { let s = 0; for (const c of ch) s += c[1]; let r = Math.random() * s; for (const c of ch) if ((r -= c[1]) <= 0) return c[0]; return ch[ch.length - 1][0]; },
  collide(a, b, spont) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.cd = b.cd = .5; a.mate = b.mate = null; a.thrown = b.thrown = false;
    const ch = this.channels(a, b, rs, spont);
    if (!ch.length) {
      // энергии мало (или Вселенной нечего рождать — не исследовано): кванты разлетаются
      const t = a.dx; a.dx = b.dx; b.dx = t; const u = a.dy; a.dy = b.dy; b.dy = u;
      a.flung = b.flung = 0; a.v = b.v = undefined;
      if (spont && this.channels(a, b, rs).length && onScreen(...W2S(x, y), 0)) fxRing(x, y, .05, [255, 240, 200], .35, .3); // искра: могло бы родить, но не исследовано
      if (!spont) { fxRing(x, y, .1, [255, 160, 140], .6, .4); this.float(x, y, 'мало энергии', [255, 160, 140], 12); Sfx.play('fizzle'); }
      return;
    }
    const c = this.pickW(ch);
    a.dead = b.dead = true;
    let made;
    if (c === 'H') { made = [this.mk('H', false, x, y, Math.random() * TAU, rs * .05)]; }
    else if (c === 'WW') { const pe = Math.sqrt(Math.max(.01, (rs / 2) ** 2 - SM.W.m ** 2)); made = this.pair('W', x, y, pe); }
    else { const m = this.mThr(c), pe = Math.sqrt(Math.max(.0001, (rs / 2) ** 2 - m * m)); const gl = [a, b].filter(o => o.sp === 'g'); made = this.pair(c, x, y, pe, gl.length ? gl[0].col : undefined, gl.length ? gl[gl.length - 1].col2 : undefined); }
    fxFlash(x, y, .7, [255, 250, 220], .35);
    for (let i = 0; i < 8; i++) { const an = i * TAU / 8; fxRing(x + Math.cos(an) * .25, y + Math.sin(an) * .25, .02, [255, 240, 200], .06, .35); }
    if (!spont) { this.pairs++; this.st.pairs++; }
    Sfx.play(spont ? 'pop' : 'collide');
    this.event(made, x, y);
    return true;
  },
  // Аннигиляция частицы и своей античастицы → кванты (или Z на резонансе)
  // spont — встретились сами: Z — только если исследован «Z сам»
  annihilate(a, b, spont) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    let made;
    if (this.hig > .5 && Math.abs(rs - SM.Z.m) < Z_WIN && (!spont || Codex.auto.has('Z')) && SM[a.sp].kind !== 'nu') { made = [this.mk('Z', false, x, y, Math.random() * TAU, rs * .05)]; fxRing(x, y, .2, BOS_C.Z, 1.6, .7); }
    else {
      const q = SM[a.sp].kind === 'quark' ? 'g' : 'ph', an = Math.random() * TAU;
      made = [this.mk(q, false, x, y, an, rs / 2), this.mk(q, false, x, y, an + Math.PI, rs / 2)];
      for (const m of made) m.cd = .5;
    }
    fxFlash(x, y, .9, [255, 255, 255], spont ? .25 : .4); if (!spont || onScreen(...W2S(x, y), 0)) Sfx.play('annih');
    this.event(made, x, y);
  },
  // Эпохи 1–3: частица и её античастица, сблизившись, аннигилируют сами (не в поле и не брошенные).
  // Только сходящиеся: только что рождённая пара разлетается и друг друга не трогает; вернуть их друг к другу
  // может магнитное поле камеры (заряды закручиваются в разные стороны) или край мира.
  annihilateMet() {
    const f = this.p.filter(o => !o.dead && !this.isQ(o) && !o.cap && !(o.flung > 0) && o.cd <= 0 && o.born > .5 && SM[o.sp].kind !== 'nu' && SM[o.sp].kind !== 'boson');
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.dead || b.dead || a.sp !== b.sp || a.anti === b.anti) continue;
      const dx = b.x - a.x, dy = b.y - a.y; if (dx * dx + dy * dy > .16) continue;
      const va = this.speed(a), vb = this.speed(b);
      if (dx * (a.dx * va - b.dx * vb) + dy * (a.dy * va - b.dy * vb) <= 0) continue; // расходятся
      this.annihilate(a, b, true); this.st.ann = (this.st.ann || 0) + 1;
    }
  },
  // Распады — только когда у частиц есть масса (после перехода Хиггса)
  decayProducts(o) {
    const sp = o.sp, a = o.anti;
    const L = (s, an) => [s, an];
    switch (sp) {
      case 't': return [L('b', a), L('W', a)];
      case 'b': return [L('c', a), L('e', a), L('ne', !a)];
      case 'c': return [L('s', a), L('e', !a), L('ne', a)];
      case 's': return [L('u', a), L('e', a), L('ne', !a)];
      case 'ta': return [L('mu', a), L('nm', !a), L('nt', a)];
      case 'mu': return [L('e', a), L('ne', !a), L('nm', a)];
      case 'W': { // W⁺ (anti=false) → ℓ⁺ ν или u d̄ / c s̄
        const r = Math.random();
        if (r < .5) { const l = pick(['e', 'mu', 'ta'].filter(genOpen)); return [L(l, !a), L(NU_OF[l], a)]; } // только открытые поколения
        return r < .75 || !genOpen('c') ? [L('u', a), L('d', !a)] : [L('c', a), L('s', !a)];
      }
      case 'Z': { const f = pick(['e', 'mu', 'ta', 'ne', 'nm', 'nt', 'u', 'd', 'c', 's', 'b'].filter(genOpen)); return [L(f, false), L(f, true)]; }
      case 'H': { const r = Math.random(); let f = r < .58 ? 'b' : r < .7 ? 'ta' : r < .8 ? 'c' : null; if (f && !genOpen(f)) f = null;
        return f ? [L(f, false), L(f, true)] : r < .9 ? [L('ph', false), L('ph', false)] : [L('g', false), L('g', false)]; }
    }
    return null;
  },
  // Осколки разлетаются веером от направления родителя (как в пузырьковой камере)
  decay(o) {
    const pr = this.decayProducts(o); if (!pr) return;
    o.dead = true;
    const m = this.meff(o), E = Math.hypot(o.p, m), base = Math.atan2(o.dy, o.dx), n = pr.length;
    const fan = n === 2 ? [-.65, .65] : [0, -1.15, 1.15];
    const c0 = Math.random() * 3 | 0, made = [];
    pr.forEach(([sp, an], i) => {
      const a = base + (fan[i] ?? 0) + rnd(-.11, .11);
      const q = this.mk(sp, an, o.x, o.y, a, Math.max(.05, E / n * rnd(.7, 1.3)), SM[sp].kind === 'quark' ? c0 : undefined);
      q.cd = .4; q.born = .6; made.push(q);
    });
    fxRing(o.x, o.y, .1, this.dcol(o), .5, .5);
    if (onScreen(...W2S(o.x, o.y), 0)) Sfx.play('decay');
    this.event(made, o.x, o.y, o);
  },
  // Событие оставляет СЛЕД: вершину с лучами осколков. Пока след не погас, его можно заснять.
  event(made, x, y, parent) {
    const sps = made.map(m => m.sp); if (parent) sps.push(parent.sp);
    this.tracks.push({ x, y, t: this.t, life: parent ? VERT_T : PAIR_T, sps, parent: parent && parent.sp, col: parent && this.color(parent),
      angs: made.map(m => Math.atan2(m.dy, m.dx)), dsp: made.map(m => [m.sp, m.anti, m.col, m.col2]) });
  },

  // ---------- действие игрока: снимок ----------
  value(sp) { const m = SM[sp].m; return m > 0 ? 1 + Math.round(Math.log10(1 + m / .001) / 2) : 1; },
  snapshot() {
    if (!G.started || this.shotCd > 0) return;
    const paid = this.enOn();
    if (paid && this.en < E_SHOT) { this.noEnergy(); this.shotCd = .25; this.float(P.x, P.y - this.hr(), 'нет энергии ⚡', [255, 150, 130], 13); return; }
    if (paid) this.en -= E_SHOT;
    this.shotCd = this.up('sh'); this.learn.snap = true; Sfx.play('snap');
    const R0 = this.hr(), got = new Map(); // вид → где его видно (частица или след)
    for (const o of this.p) if (!o.dead && this.inHand(o) && !got.has(o.sp)) got.set(o.sp, { x: o.x, y: o.y });
    this.shotFx = .35;
    for (const tr of this.tracks) {
      if (this.t - tr.t >= tr.life || Math.hypot(tr.x - P.x, tr.y - P.y) >= R0) continue;
      for (const sp of tr.sps) if (!got.has(sp)) got.set(sp, { x: tr.x, y: tr.y });
      if (tr.parent && !tr.rec) {
        tr.rec = true;
        if (!this.decSeen.has(tr.parent)) {
          this.decSeen.add(tr.parent); this.kn += 5; Sfx.play('goal');
          this.float(tr.x, tr.y + .4, `${SM[tr.parent].sym}→ ✓ +5`, [255, 215, 110], 15, -.3);
          fxRing(tr.x, tr.y, .2, GOLD, .9, .6);
        }
      }
    }
    if (!got.size) { this.st.empty++; this.float(P.x, P.y - R0, 'пусто', [200, 200, 210]); return; }
    // комбо: чем больше разных частиц (не квантов) в одном кадре, тем ценнее снимок
    const kinds = [...got.keys()].filter(sp => sp !== 'ph' && sp !== 'g').length;
    const combo = kinds >= 2 ? 1 + .25 * (kinds - 1) : 1; this.st.kinds = Math.max(this.st.kinds, kinds);
    let gain = 0, fresh = 0;
    for (const [sp, at] of got) {
      if (!Codex.has(sp)) {
        Codex.see(sp); gain += 10; fresh++;
        if (sp === 'ph' && this.lit) { // фотон открыт — у детектора появляется энергия
          this.en = Math.max(this.en, E_START);
          fxRing(P.x, P.y, this.hr(), PH_C, this.hr() * 1.6, .9);
          this.float(P.x, P.y + this.hr() + .3, 'γ → ⚡ энергия', PH_C, 15, -.4);
        }
        this.float(at.x, at.y, 'НОВОЕ ' + SM[sp].sym, [255, 215, 110], 15, -.15 * fresh);
        continue;
      }
      if (sp === 'ph' || sp === 'g') continue;
      // повторные измерения тоже дают знания, но всё меньше: статистика насыщается
      const n = this.seenN[sp] = (this.seenN[sp] || 0) + 1, v = this.value(sp) * Math.max(.05, 1 / (1 + n / 3)) * combo;
      gain += v;
    }
    gain = Math.round(gain * 10) / 10;
    this.kn += gain;
    if (gain > 0) this.float(P.x, P.y - R0, `+${gain} ✦` + (combo > 1 ? ` ×${combo}` : ''), [140, 220, 255], 16);
    if (fresh) fxRing(P.x, P.y, R0, [255, 215, 110], R0 * 1.5, .7);
  },
  // ---------- улучшения детектора за ✦ — прямо во время игры (клавиши 1–4 или клик) ----------
  bal() { return Math.floor(this.kn - this.spent); },
  maxed(u) { return this.lvl[u.key] >= u.val.length - 1; },
  // улучшение доступно вместе со своим глаголом: снимок — сразу, поле — когда оно появилось
  avail(u) { return u.key === 'r' || u.key === 'sh' || this.fieldOn(); },
  // ---------- исследования: сделал руками — отдай Вселенной ----------
  // Пункт виден, только когда это уже сделано руками; уровень хранится в rs[k]
  // Порядок — приоритет (в панели только первые RES_MAX): то, что нужно для задания эпохи, — раньше
  resList() {
    if (!this.lit) return [];
    if (this.ep === 3) return baryonTrios(this.stockQ) >= HAND_CP || this.rs.cp ? [{ k: 'cp', ic: '⚖', name: 'Асимметрия', cost: RES_COST.cp, about: () => 'вещества чуть больше, чем антивещества' }] : [];
    const ph = { k: 'ph', ic: 'γ', name: 'Свет', cost: RES_COST.ph, about: l => `γ ${Math.round(PH_DENS[l] * 100)}% → ${Math.round(PH_DENS[l + 1] * 100)}%` };
    const L = [];
    if (!this.rs.ph) L.push(ph);
    if (this.phSeen.size >= 3) L.push({ k: 'g', ic: 'g', name: 'Глюоны', cost: RES_COST.g, about: () => 'Вселенная рождает g' });
    if (this.pairs > 0) L.push({ k: 'coll', ic: '✸', name: 'Столкновения', cost: RES_COST.coll, about: () => 'кванты сталкиваются сами — рождают исследованное' });
    const need = this.ep === 2 ? this.need2 : this.ep === 0 ? this.need0 : ['H', 'Z', 'W'];
    const all = [...Codex.run].filter(sp => sp === 'H' || this.rs.coll > 0 && ((FERMIONS.includes(sp) && SM[sp].kind !== 'nu') || sp === 'W' || sp === 'Z'));
    for (const sp of [...all.filter(sp => need.includes(sp)), ...all.filter(sp => !need.includes(sp))])
      L.push({ k: sp, ic: SM[sp].sym, name: `Рождение ${SM[sp].sym}`, cost: [resNew(this.value(sp))], about: () => sp === 'H' ? 'всплески поля рождают H' : `столкновения рождают ${SM[sp].sym}` });
    if (this.rs.ph && this.ep === 0) L.push(ph);
    return L;
  },
  rLvl(k) { return this.rs[k] || 0; },
  // исследование, которое просит текущий шаг задания (крупно и первым в лавке)
  // (кэш раз в кадр в renderShop: шаги сами спрашивают у лавки номер клавиши)
  taskRes() { const c = this.steps().find(g => !g.d); return c && c.res; },
  shopItems() {
    // ✦ — исследования мира; ★ (за эпохи и испытания) — улучшения детектора
    const pk = this._pk;
    const res = this.resList().filter(r => this.rLvl(r.k) < r.cost.length).slice(0, RES_MAX).map(r => ({ r, c: r.cost[this.rLvl(r.k)], pri: r.k === pk }));
    res.sort((a, b) => b.pri - a.pri);
    const up = this.upPts > 0 ? UPG.filter(u => !this.maxed(u) && this.avail(u)).map(u => ({ up: u, c: 1 })) : [];
    return [...res, ...up];
  },
  keyOf(k) { const i = this.shopItems().findIndex(x => x.r && x.r.k === k); return i < 0 ? null : i + 1; },
  canBuy() { return this.shopItems().some(x => x.up ? this.upPts > 0 : this.bal() >= x.c); },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused || this.stockOut) return;
    if (it.up) { // улучшение детектора за ★
      const u = it.up; this.upPts--; this.lvl[u.key]++; Sfx.play('upgrade');
      fxRing(P.x, P.y, this.hr(), [143, 208, 255], this.hr() * 1.6, .6);
      this.float(P.x, P.y - this.hr() - .3, `${u.ic} ${u.name}: ${u.fmt(u.val[this.lvl[u.key]])}`, [143, 208, 255], 15);
      return;
    }
    if (this.bal() < it.c) { this.float(P.x, P.y - this.hr() - .2, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.learn.buy = true;
    this.research(it.r);
  },
  // Исследовано — теперь это делает сама Вселенная
  research(r) {
    const k = r.k, l = this.rs[k] = this.rLvl(k) + 1; Sfx.play('upgrade');
    if (k === 'ph' && l === 1) { this.autoT = 0; Codex.auto.add('ph'); fxRing(P.x, P.y, .5, PH_C, this.wr(), 2.5); fxFlash(P.x, P.y, this.hr() * 2, [255, 240, 200], .5); }
    else if (k === 'g') { Codex.auto.add('g'); this.unlockGluons(); }
    else if (k === 'cp') this.saveCd = .8;
    else if (k !== 'ph' && k !== 'coll') Codex.auto.add(k);
    Codex.dirty = true;
    fxRing(P.x, P.y, this.hr(), GOLD, this.hr() * 1.8, .7);
    this.float(P.x, P.y - this.hr() - .3, `${r.ic} ${k === 'ph' ? `свет ×${l}` : k === 'g' ? 'глюоны в мире' : k === 'coll' ? 'кванты сталкиваются сами' : k === 'cp' ? 'Вселенная сберегает вещество' : k === 'H' ? 'H рождается в мире' : 'столкновения рождают ' + SM[k].sym}`, GOLD, 16);
  },
  renderShop(el) {
    this._pk = this.taskRes();
    const items = this.shopItems();
    if (!G.started || this.stockOut || !this.lit || !items.length) { el.style.display = 'none'; return; } // в пустоте исследовать нечего
    const b = this.bal(), anyPri = items.some(x => x.pri);
    // иерархия: «для задания» — крупно; прочие исследования — компактно (если есть главное или их много); детектор — всегда компактно
    const html = items.map((x, k) => {
      if (x.up) {
        const u = x.up, l = this.lvl[u.key];
        return `<button data-i="${k}" class="det sec ok" title="${u.name}: ${u.fmt(u.val[l])} → ${u.fmt(u.val[l + 1])} · ${u.about}"><span class="k">${k + 1}</span><span class="ic">${u.ic}</span><b>${u.name}</b></button>`;
      }
      const { r, c } = x, sec = !x.pri && (anyPri || k > 0 && items.length > 2);
      return `<button data-i="${k}" class="res ${b >= c ? 'ok' : 'no'}${x.pri ? ' pri' : sec ? ' sec' : ''}">${x.pri ? '<u>для задания</u>' : ''}<span class="k">${k + 1}</span>` +
        `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${r.about(this.rLvl(r.k))}</i><em>${c} ✦</em></button>`;
    }).join('') + (this.upPts > 0 ? `<div class="sh-h">детектор · ★ ${this.upPts}</div>` : '');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    if (!el.onclick) el.onclick = e => { const bt = e.target.closest('button'); if (bt && G.stage.buy) G.stage.buy(+bt.dataset.i); };
    el.style.display = 'flex';
  },
  // ---------- Вселенная сама рождает то, что уже открыто ----------
  populate(dt) {
    const cnt = {};
    for (const o of this.p) if (!o.dead && !(o.fade >= 0)) cnt[o.sp] = (cnt[o.sp] || 0) + 1; // гаснущие уже ушли — иначе thin гасит лишнее каждый кадр
    if ((cnt.ph || 0) + (cnt.g || 0) < this.qCap() && Math.random() < dt * 40) this.spawnQuantum(false);
    // Вселенная рождает сама только исследованное; остальное — из столкновений (твоих или случайных)
    // лишнее (осколки распадов) уходит у всех видов — исследованные или нет
    for (const sp of this.ep === 3 ? [] : this.ep === 0 ? FERMIONS.filter(sp => Codex.auto.has(sp)) : [...FERMIONS, 'W', 'Z', 'H']) {
      const s = SM[sp], base = s.kind === 'quark' || s.kind === 'lepton' ? .6 : .4, target = base * this.weight(sp);
      const have = cnt[sp] || 0, auto = Codex.has(sp) && Codex.auto.has(sp) && (sp === 'H' || this.rs.coll > 0); // вещество — из столкновений
      if (auto && Math.random() < dt * .25 * (have === 0 ? Math.min(1, target * 1.5) : have < target - .5 ? 1 : 0)) {
        const [x, y] = this.randPos(true), pp = this.thermalP(this.T);
        if (s.kind === 'boson' && sp !== 'W') this.mk(sp, false, x, y, Math.random() * TAU, pp);
        else this.pair(sp, x, y, pp);
      } else if (have > target * 1.5 + 1) this.thin(o => o.sp === sp, have - Math.ceil(target * 1.5 + 1));
    }
    const nq = (cnt.ph || 0) + (cnt.g || 0), capQ = Math.ceil(this.nQ() * 1.1);
    if (nq > capQ) this.thin(o => this.isQ(o) && !o.cap, nq - capQ);
  },
  // Лишние частицы уходят: за экраном — сразу, на экране — плавно гаснут, дальние от детектора первыми
  thin(pred, extra) {
    const c = this.p.filter(o => pred(o) && !o.dead && !(o.fade >= 0) && !o.cap);
    for (const o of c) {
      if (extra <= 0) return;
      if (!onScreen(...W2S(o.x, o.y), 30)) { o.dead = true; extra--; }
    }
    c.filter(o => !o.dead && !this.inHand(o))
      .sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y))
      .slice(0, extra).forEach(o => o.fade = 1);
  },

  update(dt0, act) {
    const prevT = this.T, dt = dt0;
    // до старта (под заставкой) мир просто живёт: без остывания и ввода
    const live = act && G.started;
    if (live && this.bannerFor !== this.ep) { this.bannerFor = this.ep; this.banner = 0; }
    if (live) {
      this.t += dt; this.epT += dt; this.banner += dt0;
      if (this.doneAt === null && (this.lit || this.ep)) this.epClock += dt0; // часы эпохи идут до выполнения целей (пролог не в счёт)
      const E = EPOCHS[this.ep], nx = EPOCHS[this.ep + 1];
      const floor = this.epDone ? (nx ? Math.min(nx.startT, this.T) * .999 : 0) : E.floor;
      const rate = this.epDone ? (nx ? 12 : 4) : this.ff; // последняя эпоха выполнена — догорает быстро
      if (this.lit || this.ep) this.T = Math.max(floor, this.T * Math.exp(-dt * rate / E.tau)); // в прологе не остывает
      if (this.epDone && nx && (this.epGap -= dt) <= 0 && this.T <= nx.startT) this.startEpoch(this.ep + 1);
      this.tickHot(dt);
      if (this.ep === 3 && !this.advanced) { this.soup(dt); if (this.rs.cp && this.safe.length < AUTO_TRIO + 4 && (this.saveCd -= dt * this.ff) <= 0) { this.saveCd = SAVE_CD; this.addSafe(); } }
    }
    if (this.higT >= 0) { this.higT += dt; this.hig = smooth(0, 9, this.higT); }
    this.tickRipples(dt, live);
    if (this.lit) this.litT += dt;
    if (this.rs.ph) this.autoT += dt;
    // свет открыт, когда шкала разогрева погасла: карточка не ложится поверх неё
    if (this.lit && this.litT > 2.6 && !Codex.has('ph')) { Codex.see('ph'); this.kn += 10; }
    this.bg = mixc(mixc([7, 7, 12], [44, 34, 14], this.lit ? smooth(0, 3, this.litT) : 0), [16, 12, 30], this.hig);
    const red = this.T / prevT; // расширение: импульсы краснеют вместе с температурой
    if (live) { this.input(dt0); this.tickShield(dt0); }
    if (act) {
      steer(P, 11 / (1 + 1.5 * this.load()), 6, dt0); // тяжёлый груз в поле тормозит детектор
      P.x += P.vx * dt0; P.y += P.vy * dt0;
      this.shotCd -= dt0; this.enFx -= dt0;
      for (const f of this.floats) f.t += dt0;
      this.floats = this.floats.filter(f => f.t < 1.6);
      this.shotFx = (this.shotFx || 0) - dt0;
      this.tracks = this.tracks.filter(tr => this.t - tr.t < tr.life);
      this.tickFocus(dt0);
    }
    const WR = this.wr(), ep4 = act && this.ep === 3;
    for (const o of this.p) {
      if (o.dead) continue;
      if (!o.cap) o.p *= red;
      o.born = Math.min(1, o.born + dt * 2); o.cd -= dt;
      if (o.flung > 0 && (o.flung -= dt) <= 0) { o.v = undefined; o.mate = null; o.thrown = false; o.sib = null; }
      if (o.rep > 0) o.rep -= dt;
      if (o.pull > 0 && (o.pull -= dt) <= 0) o.v = undefined;
      if (o.fade >= 0) { o.fade -= dt * 1.5; o.born = Math.min(o.born, Math.max(0, o.fade)); if (o.fade <= 0) o.dead = true; }
      if (ep4 && SM[o.sp].kind === 'quark' && !(o.rep > 0) && !(o.pull > 0)) this.drift4(o, dt);
      if (!o.cap) {
        // магнитное поле камеры закручивает заряженные следы (античастицы — в другую сторону)
        const q = SM[o.sp].q;
        if (q && !this.isQ(o) && !(o.rep > 0) && !(o.pull > 0)) {
          const w = .5 * q * (o.anti ? -1 : 1) * dt, c = Math.cos(w), s = Math.sin(w), x = o.dx;
          o.dx = x * c - o.dy * s; o.dy = x * s + o.dy * c;
        }
        const v = this.speed(o);
        o.x += o.dx * v * dt; o.y += o.dy * v * dt;
      }
      if (o.trail) {
        const tl = o.trail, l = tl[tl.length - 1];
        if (!l || (o.x - l[0]) ** 2 + (o.y - l[1]) ** 2 > .0064) { tl.push([o.x, o.y]); if (tl.length > 22) tl.shift(); }
      }
      if (this.hig > .5 && o.life < Infinity) { o.age += dt; if (o.age > o.life) { this.decay(o); continue; } }
      if (!act) continue;
      const ox = o.x - P.x, oy = o.y - P.y, d = Math.hypot(ox, oy);
      if (o.rep > 0 && d > viewRadius() + .5) { o.dead = true; this.ejected++; continue; }
      if (d > WR && !o.cap) {
        o.x = P.x - ox * .95; o.y = P.y - oy * .95; o.born = 0; if (o.trail) o.trail = [];
        const w = rnd(-.6, .6), c = Math.cos(w), s = Math.sin(w), x = o.dx; o.dx = x * c - o.dy * s; o.dy = x * s + o.dy * c; // не по той же линии
      }
      if (ep4 && !this.advanced && (o.sp === 'u' || o.sp === 'd') && d < this.hr() * (o.anti ? .55 : .75)) this.store(o);
      if (o.sp === 'ph' && this.ep !== 3 && G.started && this.enOn() && !this.focus && d < this.hr() && !o.cap && !(o.flung > 0) && o.born > .5 && o.cd <= 0) this.absorb(o);
      if (ep4 && o.sp === 'g' && !this.advanced && d < this.hr() * .9 && o.born > .5) this.recolor(o);
    }
    if (act) {
      // сталкивает только поле: квант встречает своего напарника — или, брошенный рогаткой, любой встречный квант
      for (const o of this.p) {
        if (o.dead || !(o.flung > 0)) continue;
        const t = o.mate;
        if (t && !t.dead && (t.x - o.x) ** 2 + (t.y - o.y) ** 2 < HIT_R * HIT_R) { this.smash(o, t); continue; }
        if (!o.thrown) continue;
        for (const q of this.p) {
          if (q === o || q === o.sib || q.dead || q.cap || q.thrown || q.cd > 0 || q.born < .5) continue;
          if (this.isQ(o) ? !this.isQ(q) : !this.antiPair(o, q)) continue; // брошенная частица бьёт только свою античастицу
          if ((q.x - o.x) ** 2 + (q.y - o.y) ** 2 < THROW_R * THROW_R) { if (this.smash(o, q)) this.st.thr++; this.learn.hit = true; break; }
        }
      }
      if (!this.full && this.enOn() && this.en >= E_CAP) this.full = true;
      this.spontaneous(dt);
      if (this.ep === 3 && !this.advanced) this.annihilateAll(); else if (this.ep < 3) this.annihilateMet();
      if (!this.advanced) this.populate(dt);
      this.checkGoals();
      if (!this.epDone || this.ep === 3) this.tickStars(false);
      if (!this.advanced && this.ep === 3 && this.T < .4) {
        // аннигиляция догорает: антивещество вспыхивает, неспасённое гаснет; в детекторе — только твои кварки
        this.advanced = true; this.release(); this.holding = false; this.finale = 1.6; this.tickStars(true);
        for (const o of this.p) {
          if (o.anti && SM[o.sp].kind === 'quark') fxFlash(o.x, o.y, .5, [255, 255, 255], .4);
          o.fade = rnd(.6, 1.2);
        }
        this.float(P.x, P.y - this.hr() - .4, `◉ ${this.stock}`, [140, 235, 170], 18);
      }
      if (this.finale > 0 && (this.finale -= dt0) <= 0) { this.finale = -1; this.endLevel(); } // итоги — сбоку, без паузы
    }
    this.p = this.p.filter(o => !o.dead);
    if (this.p.length > 260) this.p.splice(0, this.p.length - 260);
  },
  // Сбережённые кварки — ровно те, что кружат в детекторе, — переходят на уровень адронов: детектор
  // раскрывается, и они вырываются наружу с того места, где кружили. Новых не появляется.
  stockPos(i) {
    const a = G.T * 1.2 + i / this.stock * TAU, rr = this.hr() * (.35 + .1 * (i % 2));
    return { x: P.x + Math.cos(a) * rr, y: P.y + Math.sin(a) * rr, a, rr };
  },
  endLevel() {
    this.handoff = this.stockQ.map((s, i) => {
      const p = this.stockPos(i), out = rnd(2.6, 3.6), tan = p.rr * 1.2;
      return { x: p.x, y: p.y, vx: Math.cos(p.a) * out - Math.sin(p.a) * tan, vy: Math.sin(p.a) * out + Math.cos(p.a) * tan, fl: s.fl, col: s.col };
    });
    // и тройки, сбережённые самой Вселенной, — там же, где кружили
    for (const t of this.safe) t.q.forEach((fl, c) => {
      const p = this.safePos(t, c), out = rnd(1.2, 2);
      this.handoff.push({ x: p.x, y: p.y, vx: Math.cos(p.a) * out, vy: Math.sin(p.a) * out, fl, col: c });
    });
    this.stockOut = true;
    fxFlash(P.x, P.y, this.hr(), [255, 255, 255], .5); fxRing(P.x, P.y, this.hr() * .5, [140, 235, 170], this.hr() * 3, .9);
    advance();
  },
  // Вселенная сберегла тройку: R·G·B кружит вокруг детектора, антикварки её не трогают (асимметрия — вещества больше)
  addSafe() {
    const k = this.safe.length;
    this.safe.push({ a: Math.random() * TAU, r: this.hr() * (1.5 + .3 * (k % 4)) + rnd(0, .15), w: rnd(.12, .2) * (k % 2 ? -1 : 1), t0: G.T, q: Math.random() < .5 ? ['u', 'u', 'd'] : ['u', 'd', 'd'] });
    const p = this.safePos(this.safe[k]);
    fxRing(p.x, p.y, .1, [140, 235, 170], .9, .6); fxFlash(p.x, p.y, .4, [200, 255, 220], .25);
    this.kn += 2; this.float(p.x, p.y - .35, '⚖ R·G·B', [140, 235, 170], 13); Sfx.play('pop');
  },
  // центр сбережённой тройки (c — один из кварков: вершина маленького треугольника)
  safePos(t, c) {
    const a = t.a + t.w * G.T, x = P.x + Math.cos(a) * t.r, y = P.y + Math.sin(a) * t.r;
    if (c == null) return { x, y, a };
    const b = G.T * 2.2 + c * TAU / 3; return { x: x + Math.cos(b) * .16, y: y + Math.sin(b) * .16, a };
  },
  // Итоги уровня для ненавязчивого экрана между уровнями
  tally() {
    const hand = baryonTrios(this.stockQ), auto = this.safe.length;
    return { name: 'Частицы', rows: [['⏱ уровень', fmtClock(this.t)], ['✦ добыто', Math.round(this.kn)], ['тройки — руками', hand], ['тройки — Вселенная', auto]], auto: [auto, hand + auto], stars: this.stars };
  },
  // Эпоха 4: кварки почти остановились (упрощение), антикварки ищут вещество — свободное или в детекторе
  drift4(o, dt) {
    if (!o.anti) { o.v = .22; return; }
    let tx = null, ty = null, best = 4;
    for (const t of this.p) {
      if (t.dead || t.anti || t.sp !== o.sp) continue;
      const d = Math.hypot(t.x - o.x, t.y - o.y); if (d < best) { best = d; tx = t.x; ty = t.y; }
    }
    if (this.stock > 0) { const d = Math.hypot(P.x - o.x, P.y - o.y); if (d < 6 && d < best + 1.5) { tx = P.x; ty = P.y; } }
    o.v = tx === null ? .22 : .45;
    if (tx === null) return;
    const d = Math.hypot(tx - o.x, ty - o.y) || 1, k = Math.min(1, dt * 2.5);
    const nx = o.dx + ((tx - o.x) / d - o.dx) * k, ny = o.dy + ((ty - o.y) / d - o.dy) * k, l = Math.hypot(nx, ny) || 1;
    o.dx = nx / l; o.dy = ny / l;
  },
  // Поле Хиггса застывает: от детектора расходится золотая решётка (потом гаснет),
  // а всплески поля рождают бозоны Хиггса
  higgsOn() {
    this.higT = 0; this.higC = { x: P.x, y: P.y }; this.ripCd = 1.5; Sfx.play('freeze');
    fxRing(P.x, P.y, .5, GOLD, this.wr() * 1.2, 4);
  },
  tickRipples(dt, live) {
    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter(r => r.t < 1.8);
    if (!live || this.ep !== 1 || this.higT < 0 || (this.ripCd -= dt) > 0) return;
    // всплески поля рождают H, только когда это исследовано; долго не выходит руками — Вселенная помогает
    if (!Codex.auto.has('H') && !(this.epT > 40 && !Codex.has('H'))) return;
    this.ripCd = Codex.has('H') ? 5 : 2.4;
    const a = Math.random() * TAU, d = rnd(this.hr() + .8, viewRadius() * .5);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    this.ripples.push({ x, y, t: 0 });
    const h = this.mk('H', false, x, y, Math.random() * TAU, rnd(5, 25)); h.life = rnd(4, 8);
  },

  // ---------- эпохи ----------
  startEpoch(i) {
    this.release();
    this.ep = i; this.epDone = false; this.epT = 0; this.ff = 1; this.hot = []; this.hotCd = 4;
    this.epClock = 0; this.epKn0 = this.kn; this.doneAt = null;
    this.newEpochState(i);
    if (i === 1) this.higgsOn();
    if (i === 3) {
      // остатки Вселенной: кварки и антикварки почти поровну — с небольшим перевесом вещества
      for (const o of this.p) if (!this.isQ(o)) o.fade = 1;
      for (let k = 0; k < 9; k++) { const [x, y] = this.randPos(false); this.pair(pick(['u', 'd']), x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5); }
      for (let k = 0; k < 4; k++) { const [x, y] = this.randPos(false); this.mk(pick(['u', 'd']), false, x, y, Math.random() * TAU, rnd(.1, .4)); }
    }
  },
  // Итоги эпохи — сбоку, игру не останавливают (Tally.note); очки ★ — на детектор прямо в лавке
  showResult() {
    const i = this.ep, pts = Math.round(this.kn - this.epKn0), t = this.doneAt;
    const bonus = t === null ? 0 : Math.max(0, Math.round((PAR[i] - t) * 2)), total = pts + bonus, won = starsWon(this.stars);
    this.upPts += (t === null ? 0 : 1) + won; this.lvlTotal += total; addScore(bonus * 10);
    const place = this.cheated ? null : LB.add('e' + i, { n: LB.name(), s: total, p: pts, t: t === null ? null : Math.floor(t), d: Date.now() }).place;
    Tally.note(`ЭПОХА ${i + 1} · ВЫПОЛНЕНА`, EPOCHS[i].name, [['⏱ эпоха', fmtClock(t)], ['✦ добыто', pts], [`быстрее ${fmtClock(PAR[i])}`, '+' + bonus, 'tb'], ['итог', total, 'tl']],
      this.stars, place, this.upPts ? `★ ${this.upPts} — улучши детектор в лавке внизу` : '');
    Sfx.play('segment');
  },
  // Горячая точка: мерцающее кольцо, через 1,6 с там рождается нужная тяжёлая частица
  hotTarget() {
    if (this.ep === 1 && this.hig >= 1 && this.epT > 50 && !Codex.has('W') && !Codex.has('Z')) return 'W'; // подсказка, если Z долго не выходит
    // эпоха 3: тяжёлое у горячей точки рождает Вселенная — если исследовано «X сам», если руками его уже
    // не сделать (порог выше максимума поля) или если распад долго не выходит
    // поколение ещё закрыто — Вселенная помогает открыть недостающее лёгкое (его надо снять самому)
    if (this.ep === 2) for (const sp of this.need2) {
      if (this.decSeen.has(sp)) continue;
      const c = genOpen(sp) ? sp : this.genFirst(sp);
      if (c && (Codex.auto.has(c) || 2 * this.mThr(c) > this.Emax() || this.epT > 45)) return c;
    }
    return null;
  },
  tickHot(dt) {
    for (const h of this.hot) {
      h.t += dt;
      if (h.t >= 1.6 && !h.done) {
        h.done = true;
        const m = SM[h.sp].m, pe = m * .25;
        const made = h.sp === 'W' || Math.random() < .5 ? this.pair(h.sp, h.x, h.y, pe) : [this.mk(h.sp, false, h.x, h.y, Math.random() * TAU, pe)];
        for (const o of made) { o.born = 1; o.age = 0; o.life = Math.max(o.life, SM[h.sp].life * .6); }
        fxFlash(h.x, h.y, 1, [255, 200, 120], .4);
      }
    }
    this.hot = this.hot.filter(h => h.t < 2.2);
    const sp = this.hotTarget();
    if (!sp || this.hot.length) return;
    // не плодим новых, пока в мире есть частица (или свежий след), чей распад мы ждём
    if (this.p.some(o => !o.dead && o.sp === sp) || this.tracks.some(tr => tr.parent === sp && !tr.rec)) { this.hotCd = Math.max(this.hotCd, 1.5); return; }
    if ((this.hotCd -= dt) > 0) return;
    this.hotCd = 5;
    const a = Math.random() * TAU, d = rnd(this.hr() + 1.2, viewRadius() * .6);
    this.hot.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, t: 0, sp });
  },
  // Эпоха 4: из-за края приходят остатки — пары и редкие лишние кварки вещества
  soup(dt) {
    if ((this.soupCd -= dt) > 0) return;
    this.soupCd = 1.3;
    const n = this.p.filter(o => !o.dead && !this.isQ(o)).length;
    if (n > 34) return;
    // часть пар рождается прямо рядом с детектором (кванты ещё рождают кварки) — успей забрать кварк, пока
    // антикварк его не нашёл; остальное приходит издалека
    const near = Math.random() < .45, a = Math.random() * TAU, sp = pick(['u', 'd']);
    const d = near ? rnd(this.hr() * 1.5, this.hr() + 1.6) : rnd(this.hr() + 2, viewRadius() * .95);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (near) {
      // пару рождает глюон: кварк получает его цвет, антикварк — антицвет
      const c = Math.random() * 3 | 0, c2 = (c + 1 + (Math.random() * 2 | 0)) % 3;
      this.pair(sp, x, y, rnd(.15, .35), c, c2).forEach(o => o.cd = 2.5);
      fxRing(x, y, .05, [255, 245, 220], .5, .45); fxFlash(x, y, .35, [255, 245, 220], .25);
    } else if (Math.random() < .68) this.pair(sp, x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5);
    else this.mk(sp, false, x, y, Math.atan2(P.y - y, P.x - x) + rnd(-.8, .8), rnd(.1, .4));
  },
  // Эпоха 4: вещество и антивещество аннигилируют повсюду, а не только в детекторе
  annihilateAll() {
    const f = this.p.filter(o => !o.dead && !this.isQ(o) && o.cd <= 0 && SM[o.sp].kind === 'quark');
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.dead || b.dead || a.sp !== b.sp || a.anti === b.anti) continue;
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < .3) { this.annihilate(a, b, true); this.annN = (this.annN || 0) + 1; }
    }
  },
  // Эпоха 4: глюон в детекторе перекрашивает кварк — антицвет глюона гасит цвет кварка, кварк получает цвет глюона
  // (обмен цветом — то, чем держится сильное взаимодействие). Нет кварка такого цвета — глюон пролетает.
  recolor(g) {
    const i = this.stockQ.findIndex(s => s.col === g.col2); if (i < 0 || g.col === g.col2) return false;
    const was = this.colCnt(), good = was[g.col] < was[g.col2];
    this.stockQ[i].col = g.col; g.dead = true; this.st.recol++; this.learn.recol = true;
    fxRing(P.x, P.y, this.hr() * .3, QCOL[g.col], this.hr() * 1.3, .6);
    this.float(P.x, P.y - this.hr() - .2, `глюон: ${COL_N[g.col2]} → ${COL_N[g.col]}`, good ? GOLD : QCOL[g.col], 14);
    Sfx.play(good ? 'recolor' : 'pop');
    return true;
  },
  // глюон, который выровняет цвета: заберёт лишний цвет и даст недостающий
  helpGlu(g) { const c = this.colCnt(); return c[g.col2] > 0 && c[g.col] < c[g.col2] && c[g.col] === Math.min(...c); },
  store(o) {
    o.dead = true;
    if (!o.anti) {
      this.stock++; this.stockQ.push({ fl: o.sp, col: o.col });
      this.float(P.x, P.y, '+1 ◉', [140, 235, 170], 14);
    } else if (this.stock > 0) {
      this.stock--;
      const i = this.stockQ.map(s => s.fl).lastIndexOf(o.sp); this.stockQ.splice(i >= 0 ? i : this.stockQ.length - 1, 1);
      fxFlash(P.x, P.y, this.hr(), [255, 120, 120], .5);
      this.float(P.x, P.y, '−1 ◉', [255, 130, 130], 15); this.st.eaten++;
    } else fxFlash(P.x, P.y, .6, [255, 255, 255], .3);
  },
  // Сколько пройдено в уровне частиц (0..1) — для шкалы внизу: пролог — по времени жизни поля, дальше — по шагам эпох
  progress() {
    if (this.stockOut) return 1;
    const sd = () => { const s = this.steps(); return s.length ? s.filter(g => g.d).length / s.length : 0; };
    const pre = Math.min(1, this.inf.t / INF.life);
    const e = this.epDone ? 1 : this.ep === 0 ? (this.lit ? .2 + .8 * sd() : .2 * pre) : sd();
    return Math.min(1, (this.ep + e) / EPOCHS.length);
  },
  // ---------- задание эпохи: шаги крупно под часами ----------
  // Цели меняются от забега к забегу: в эпохе 1 — какие частицы открыть, в эпохе 3 — чьи распады снять.
  steps() {
    const has = sp => Codex.has(sp), sym = sp => SM[sp].sym, touch = isTouch();
    const buy = sp => touch ? 'в лавке за ✦' : `за ✦, клавиша ${this.keyOf(sp) || '?'}`, tap = touch ? 'коснись' : 'кликни';
    switch (this.ep) {
      case 0: return [
        { t: 'Раскачай поле, как качели', h: 'зажатое поле толкает шарик влево: держи, пока он катится влево, отпускай на краю. Каждый проход дна — свет; выше размах — горячее Вселенная', s: `${this.inf.pick ? this.inf.pick.n : ''} разогрев · ${fmtGeV(this.T0)}`, d: this.lit },
        { t: 'Исследуй свет', h: `${buy('ph')} — Вселенная начнёт светить`, s: 'свет', d: this.rs.ph > 0, res: 'ph' },
        { t: 'Измерь спектр', h: 'лови фотоны кругом — пойманный измерен; найди 3 класса из 4', items: PH_CLS.map((c, i) => [c.n, this.phSeen.has(i)]), s: 'спектр измерен', d: this.phSeen.size >= 3 },
        { t: this.gOn ? 'Сними глюон' : 'Исследуй глюоны', h: this.gOn ? 'глюоны уже в мире — поймай один' : `${buy('g')} — и сними глюон`, s: 'глюон открыт', d: has('g'), res: this.gOn ? null : 'g' },
        { t: 'Столкни кванты', h: 'зажми рядом с двумя волнами и отпусти', s: 'первое столкновение', d: this.pairs > 0 },
        { t: 'Открой первое поколение', h: 'сталкивай кванты и снимай, что родилось. Тяжёлые поколения откроются следом' + (this.need0.some(sp => SM[sp].kind === 'lepton' && !has(sp)) ? '. Лептоны — из γ + γ: наведись на фотон и отпусти в синем окне, до риски q' : ''),
          items: this.need0.map(sp => [sym(sp), has(sp)]), s: 'частицы открыты', d: this.need0.every(has) },
      ];
      case 1: return [
        { t: 'Жди: поле Хиггса застывает', h: 'частицы тяжелеют и замедляются…', s: 'у частиц есть масса', d: this.hig >= 1 },
        { t: 'Роди бозон H', h: 'два глюона в поле, отпусти в золотой полосе (≈125 ГэВ) — и сними', s: 'бозон Хиггса', d: has('H') },
        { t: 'Удержи вещество', h: 'с массой его можно поймать: сделай пару столкновением и возьми полем частицу и её античастицу', s: 'вещество в поле', d: this.learn.pair2 || has('W') || has('Z') },
        { t: 'Открой Z', h: 'столкни пару, когда шкала в золотой полосе (≈91 ГэВ), и сними', s: 'Z открыт', d: has('W') || has('Z') },
      ];
      case 2: return this.need2.map(sp => ({ t: `Сними распад ${sym(sp)}`, h: !genOpen(sp) ? `сначала открой ${genNeed(sp).map(sym).join(' и ')} — поколения открываются по порядку: столкни кванты и сними`
        : Codex.auto.has(sp) ? `жди вспышку и ${tap} по золотой вершине следа`
        : `сделай ${sym(sp)} столкновением (выше риски ${sym(sp)}) и ${tap} по вершине распада — или исследуй «Рождение ${sym(sp)}»`, s: `распад ${sym(sp)}`, d: this.decSeen.has(sp), res: genOpen(sp) ? sp : null }));
      default: {
        const t = baryonTrios(this.stockQ);
        const a = this.safe.length;
        return [{ t: `Собери ${TRIO_GOAL} ${TRIO_W} R·G·B`, h: 'лови кварки недостающего цвета; глюон в золотом кольце перекрасит лишний — зажми рядом, щит его втянет', p: [Math.min(t, TRIO_GOAL), TRIO_GOAL], s: `${TRIO_GOAL} ${TRIO_W}`, d: t >= TRIO_GOAL },
          { t: 'Научи Вселенную сберегать вещество', h: this.rs.cp ? 'Вселенная сберегает тройки — они зелёные, вокруг детектора'
            : t < HAND_CP ? `сначала ${HAND_CP} тройки руками — потом исследуй «⚖ Асимметрия»` : `исследуй «⚖ Асимметрия» ${buy('cp')}`,
            p: [Math.min(a, AUTO_TRIO), AUTO_TRIO], s: 'вещество сбережено', d: a >= AUTO_TRIO, res: 'cp' }];
      }
    }
  },
  // Испытания ★: два случайных на эпоху, за каждое +15 ✦
  starPool(i) {
    const st = this.st, fast = sec => ({ t: `быстрее ${fmtClock(sec)}`, bad: () => this.epClock > sec, atEnd: true });
    const clean = { t: 'без пустых снимков', bad: () => st.empty > 0, atEnd: true }, thr = { t: 'пара броском', ok: () => st.thr > 0 };
    switch (i) {
      case 0: return [thr, fast(130), { t: 'горячий разогрев', ok: () => !!this.inf.pick && this.inf.pick.i === 2, bad: () => !!this.inf.pick && this.inf.pick.i < 2 }, { t: 'поймай сверхжёсткий γ', ok: () => this.phSeen.has(3) }, { t: 'снимок с 3 видами', ok: () => st.kinds >= 3 }, { t: '6 столкновений', ok: () => st.pairs >= 6 },
        { t: 'открой второе поколение', ok: () => ['c', 's', 'mu'].some(sp => Codex.has(sp)) }];
      case 1: return [thr, fast(45), { t: 'и W, и Z', ok: () => Codex.has('W') && Codex.has('Z') },
        { t: 'открой t-кварк', ok: () => Codex.has('t'), can: () => !Codex.has('t') }, { t: 'не остаться без ⚡', bad: () => st.dry > 0, atEnd: true }];
      case 2: return [thr, clean, fast(35), { t: 'снимок с 4 видами', ok: () => st.kinds >= 4 }];
      default: return [{ t: '7 троек', ok: () => baryonTrios(this.stockQ) >= 7 }, { t: 'перекрась кварк глюоном', ok: () => st.recol > 0 }, { t: 'антикварки не съели ни одного', bad: () => st.eaten > 0, atEnd: true },
        { t: '20 кварков в детекторе', ok: () => this.stock >= 20 }];
    }
  },
  winStar() { this.kn += 15; this.float(P.x, P.y - this.hr() - .4, '★ +15 ✦', [255, 215, 110], 17); },
  tickStars(end) { tickStars(this.stars, end, () => this.winStar()); },
  checkGoals() {
    if (this.epDone || !this.steps().every(g => g.d)) return;
    this.epDone = true; this.epGap = 2.5; this.kn += 15; this.doneAt = this.epClock;
    this.release(); this.holding = false;
    if (this.ep < EPOCHS.length - 1) { this.tickStars(true); this.showResult(); }
    else this.float(P.x, P.y - this.hr() - .5, '✓ +15 ✦', [255, 215, 110], 17);
  },
  enterKey() { this.ff = this.ff > 1 ? 1 : 4; msg(this.ff > 1 ? '×4' : '×1', 1); },
  cheat() {
    for (const k of Object.keys(SM)) Codex.see(k);
    this.kn += 100; this.pairs++; this.cheated = true; this.en = E_CAP; if (!this.lit) this.ignite(); this.rs.ph = Math.max(1, this.rs.ph); Codex.auto.add('ph'); Codex.auto.add('g'); this.rs.g = 1; PH_CLS.forEach((c, i) => this.phSeen.add(i)); this.full = true; if (!this.gOn) this.unlockGluons();
    for (const sp of CHAINS.flat()) this.decSeen.add(sp);
    if (this.ep === 1) this.higT = 99;
    if (this.ep === 3) { this.rs.cp = 1; while (this.safe.length < AUTO_TRIO) this.addSafe(); }
    if (this.ep === 3) while (this.stock < STOCK_GOAL) { this.stock++; this.stockQ.push({ fl: this.stock % 3 === 2 ? 'd' : 'u', col: this.stockQ.length % 3 }); }
  },
  // Что сейчас нужно снять: в эпохе 2 — H и W/Z, в эпохе 3 — распады цепочек
  // Эпоха 4: каких цветов в детекторе меньше всего — такие кварки и нужны
  colCnt() { const c = [0, 0, 0]; for (const s of this.stockQ) c[s.col]++; return c; },
  needCol(col) { const c = this.colCnt(); return c[col] === Math.min(...c); },
  wanted(sp, o) {
    if (this.ep === 3) return !!o && !this.advanced && SM[sp].kind === 'quark' && !o.anti && this.needCol(o.col);
    if (this.ep === 1) {
      const f0 = this.focus && this.focus.cap.length === 1 && this.focus.cap[0];
      if (f0 && !this.isQ(f0)) return !!o && this.antiPair(f0, o) && !o.cap; // держишь частицу — где её античастица
      return sp === 'H' ? !Codex.has('H') : (sp === 'W' || sp === 'Z') && !Codex.has('W') && !Codex.has('Z');
    }
    if (this.ep === 2) return this.need2.includes(sp) && !this.decSeen.has(sp);
    if (this.ep === 0) return !!o && this.need0.includes(sp) && !Codex.has(sp);
    return false;
  },

  // ---------- рисование ----------
  color(o) {
    const s = SM[o.sp];
    if (o.sp === 'g') return QCOL[o.col];
    if (s.kind === 'quark') return o.anti ? QANTI[o.col] : QCOL[o.col];
    if (s.kind === 'lepton') return LEP_C[s.gen - 1];
    if (s.kind === 'nu') return NU_C;
    return BOS_C[o.sp];
  },
  lab(o) {
    const s = SM[o.sp];
    if (s.kind === 'quark') return o.anti ? s.sym + '̅' : s.sym;
    if (s.kind === 'lepton') return s.sym + (o.anti ? '⁺' : '⁻');
    if (s.kind === 'nu') return o.anti ? 'ν̄' + s.sym.slice(1) : s.sym;
    if (o.sp === 'W') return o.anti ? 'W⁻' : 'W⁺';
    return s.sym;
  },
  dcol(o) { return Codex.has(o.sp) ? this.color(o) : [205, 220, 245]; },
  rad(o) { const m = SM[o.sp].m, big = m > 60 ? .21 : m > 1 ? .17 : .135; return .135 + (big - .135) * this.hig; },
  // Фон камеры: едва заметная сетка
  drawGrid(alpha) {
    const z = cam.z, step = 1.5, x0 = Math.floor((cam.x - G.W / 2 / z) / step), x1 = Math.ceil((cam.x + G.W / 2 / z) / step);
    const y0 = Math.floor((cam.y - G.H / 2 / z) / step), y1 = Math.ceil((cam.y + G.H / 2 / z) / step);
    if ((x1 - x0) * (y1 - y0) > 4000) return;
    ctx.strokeStyle = rgb([130, 175, 255], .045 * alpha); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = x0; i <= x1; i++) { const [sx] = W2S(i * step, 0); ctx.moveTo(sx, 0); ctx.lineTo(sx, G.H); }
    for (let j = y0; j <= y1; j++) { const [, sy] = W2S(0, j * step); ctx.moveTo(0, sy); ctx.lineTo(G.W, sy); }
    ctx.stroke();
  },
  // Решётка поля Хиггса: проявляется расходящейся волной и через несколько секунд гаснет
  drawHiggs(alpha) {
    const z = cam.z;
    for (const r of this.ripples) {
      const k = r.t / 1.8, [x, y] = W2S(r.x, r.y);
      ring(x, y, (.2 + k * 1.25) * z, GOLD, (1 - k) * .7 * alpha, 2);
    }
    if (this.higT < 0) return;
    const p = clamp(this.higT / 4, 0, 1), fade = 1 - smooth(5, 10, this.higT);
    const al = (p < 1 ? .18 * Math.sin(p * Math.PI) + .08 : .08) * fade * alpha;
    if (al < .004) return;
    const hc = this.higC, Rw = p * (viewRadius() * 1.2 + Math.hypot(P.x - hc.x, P.y - hc.y));
    const step = .8, rowH = step * .866;
    const y0 = Math.floor((cam.y - G.H / 2 / z) / rowH), y1 = Math.ceil((cam.y + G.H / 2 / z) / rowH);
    const x0 = Math.floor((cam.x - G.W / 2 / z) / step) - 1, x1 = Math.ceil((cam.x + G.W / 2 / z) / step);
    if ((x1 - x0) * (y1 - y0) > 5000) return;
    ctx.strokeStyle = rgb(GOLD, al); ctx.lineWidth = 1; ctx.beginPath();
    for (let j = y0; j <= y1; j++) {
      const wy = j * rowH, off = (j & 1) * step / 2;
      for (let i = x0; i <= x1; i++) {
        const wx = i * step + off; if (Math.hypot(wx - hc.x, wy - hc.y) > Rw) continue;
        const [sx, sy] = W2S(wx, wy); ctx.moveTo(sx + 2.2, sy); ctx.arc(sx, sy, 2.2, 0, TAU);
      }
    }
    ctx.stroke();
    if (p < 1) { const [cx, cy] = W2S(hc.x, hc.y); ring(cx, cy, Rw * z, GOLD, .55 * alpha * fade, 2.5); }
  },
  // Пустой вакуум мерцает: виртуальные пары вспыхивают и гаснут — пока свет не начал рождаться сам
  drawVacuum(alpha) {
    const k = (1 - (this.lit ? smooth(0, 3, this.litT) : 0)) * alpha;
    if (k <= .01 || this.ep > 0) return;
    const hw = G.W / 2 / cam.z, hh = G.H / 2 / cam.z;
    for (let i = 0; i < 70; i++) {
      const ph = G.T * .9 + i * .618, n = Math.floor(ph), f = ph - n, h = Math.sin(i * 127.1 + n * 311.7) * 43758.5453, r1 = h - Math.floor(h), h2 = Math.sin(i * 269.5 + n * 183.3) * 43758.5453, r2 = h2 - Math.floor(h2);
      const wx = cam.x + (r1 * 2 - 1) * hw, wy = cam.y + (r2 * 2 - 1) * hh, [x, y] = W2S(wx, wy);
      const near = this.lit ? 0 : Math.min(1, this.inf.A) * .6 + this.inf.flash * .8; // вакуум дышит в такт полю
      const a = Math.sin(f * Math.PI) * (.5 + 1.5 * near) * k;
      ball(x - 2, y, 1.2, [200, 210, 255], a); ball(x + 2, y, 1.2, [255, 200, 220], a);
    }
  },
  drawTrail(o, a) {
    const tl = o.trail; if (!tl || tl.length < 2) return;
    const nu = SM[o.sp].kind === 'nu', known = Codex.has(o.sp);
    if (nu && !known) return;
    ctx.strokeStyle = rgb(known ? this.color(o) : [205, 220, 245], (nu ? .25 : .4) * a);
    ctx.lineWidth = nu ? 1.1 : o.anti ? 1.4 : 2;
    if (o.anti || nu) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    let [px, py] = W2S(tl[0][0], tl[0][1]); ctx.moveTo(px, py);
    for (let i = 1; i < tl.length; i++) { [px, py] = W2S(tl[i][0], tl[i][1]); ctx.lineTo(px, py); }
    [px, py] = W2S(o.x, o.y); ctx.lineTo(px, py);
    ctx.stroke(); ctx.setLineDash([]);
  },
  draw(alpha) {
    const z = cam.z;
    ctx.lineCap = 'round';
    this.drawGrid(alpha);
    this.drawVacuum(alpha);
    this.drawHiggs(alpha);
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 80)) continue;
      const a = alpha * o.born;
      if (!this.isQ(o)) this.drawTrail(o, a);
    }
    for (const tr of this.tracks) this.drawVertex(tr, alpha);
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 40)) continue;
      const a = alpha * o.born, known = Codex.has(o.sp), c = this.dcol(o);
      if (this.isQ(o)) {
        // Квант — волна: чем выше энергия, тем короче период (λ ~ 1/E)
        const hot = clamp(o.p / (this.T * 6), 0, 1), L = 1.1 * z;
        const per = clamp(.42 * z * this.T * 1.5 / Math.max(o.p, 1e-9), 4, .5 * z);
        const amp = o.amp * clamp(.09 * z, 2.5, 6);
        // Волна неподвижна в пространстве: фаза привязана к мировой координате вдоль луча
        const phase = o.ph - (o.x * o.dx + o.y * o.dy) * z / per * TAU;
        // головка кванта сидит на самой волне (в её текущем отклонении), а не на оси
        const hw = Math.sin(phase) * amp, hx = sx - o.dy * hw, hy = sy + o.dx * hw;
        if (o.thrown) { ctx.lineCap = 'round'; line(sx, sy, sx - o.dx * 34, sy - o.dy * 34, GOLD, .5 * a, 4); }
        if (!known) {
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [c], .6 * a, 1.6);
          ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,16,32,.85)'; ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, TAU); ctx.fill();
          ring(hx, hy, 7.5, [235, 245, 255], .9, 1.3); label('?', hx, hy + .5, 10, [255, 255, 255], 1, 800); ctx.globalAlpha = 1;
        } else if (o.sp === 'ph' && this.ep === 3) { // аннигиляция: свет — фон, фокус на кварках и глюонах
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [[220, 225, 240]], .18 * a, 1.2);
        } else if (o.sp === 'ph') {
          const cc = mixc([255, 200, 120], [220, 235, 255], hot);
          if (this.enOn() && (this.en < 3 || !this.full) && !o.cap) ring(hx, hy, 10 + 2 * Math.sin(G.T * 8 + o.ph), PH_C, .7 * a, 1.6);
          // редкие классы — вращающиеся дуги цвета класса
          const pc = this.lit ? this.phClass(o) : 0;
          if (pc === 3 || (pc === 2 && !this.phSeen.has(2))) { const s0 = G.T * 3; for (let k = 0; k < 3; k++) arc(hx, hy, 15, s0 + k * TAU / 3, s0 + k * TAU / 3 + 1, PH_CLS[pc].c, .9 * a, 2); }
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [cc], .75 * a, 1.8);
          glow(hx, hy, 4 + 5 * hot, cc, .45 * a);
        } else {
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [c, QANTI[o.col2]], .8 * a, 1.8);
          glow(hx, hy, 3 + 4 * hot, c, .4 * a);
          // эпоха 4: что глюон сделает с кварком в детекторе — «антицвет → цвет»; полезный — в золотом кольце
          if (this.ep === 3 && !this.stockOut) {
            const help = this.helpGlu(o), y = sy - 15; // метка — на оси, чтобы не прыгала с волной
            ball(sx - 7, y, 3.2, QCOL[o.col2]); line(sx - 3, y, sx + 3, y, [235, 240, 250], .8 * a, 1.2); ball(sx + 7, y, 3.2, QCOL[o.col]);
            if (help && !this.advanced) ring(hx, hy - 5, 15 + 1.5 * Math.sin(G.T * 8), GOLD, .85 * a, 2);
          }
        }
        continue;
      }
      this.drawParticle(o, sx, sy, this.rad(o) * z, a, known, c);
    }
  },
  // Вещество — светящийся шар с символом внутри; античастица — полое кольцо с встречной дугой;
  // неизвестное — пунктирное облачко с «?». У нестабильных — дуга оставшейся жизни.
  drawParticle(o, sx, sy, r, a, known, c) {
    const s = SM[o.sp];
    ctx.globalAlpha = a;
    if (o.life < Infinity && this.hig > .5) arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - o.age / o.life, 0, 1), [255, 255, 255], .4, 1.6);
    if (this.wanted(o.sp, o)) {
      const sp = G.T * 2;
      for (let k = 0; k < 4; k++) arc(sx, sy, r + 10, sp + k * Math.PI / 2, sp + k * Math.PI / 2 + .9, GOLD, .9, 2.2);
    }
    const fs = Math.max(9, r * .95);
    if (s.kind === 'nu') {
      const near = Math.hypot(o.x - P.x, o.y - P.y) < this.hr() * 1.8;
      ring(sx, sy, r * .95, known ? NU_C : [216, 244, 255], near ? .85 : .35, 1.5, [2.5, 3.5]);
      if (near) label(known ? s.sym : '?', sx, sy + .5, fs * .85, known ? NU_C : [255, 255, 255], .9, 700);
    } else if (!known) {
      const pul = 1 + .09 * Math.sin(G.T * 6 + o.ph);
      ctx.fillStyle = 'rgba(210,226,255,.18)'; ctx.beginPath(); ctx.arc(sx, sy, r * 1.25 * pul, 0, TAU); ctx.fill();
      ring(sx, sy, r * pul, [235, 245, 255], .88, 1.8, [4, 3]);
      label('?', sx, sy + 1, fs, [255, 255, 255], 1, 800);
    } else if (o.anti && s.kind !== 'boson') {
      ring(sx, sy, r, c, .95, 2.4);
      if (r > 7) { const sp = -G.T * 2.5; arc(sx, sy, r - 4, sp, sp + Math.PI * 1.4, [255, 255, 255], .8, 1.2, [4, 4]); }
      label(this.lab(o), sx, sy + .5, fs * .9, c, 1, 700);
    } else {
      if (o.sp === 'H') glow(sx, sy, r * (3 + Math.sin(G.T * 8) * .6), c, .4);
      else if (s.kind === 'boson') glow(sx, sy, r * 2.4, c, .3);
      const g = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, r * 1.4);
      g.addColorStop(0, '#fff'); g.addColorStop(.35, rgb(c)); g.addColorStop(1, rgb(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 1.35, 0, TAU); ctx.fill();
      ctx.fillStyle = rgb(c); ctx.beginPath(); ctx.arc(sx, sy, r * .88, 0, TAU); ctx.fill();
      label(this.lab(o), sx, sy + .5, fs, [6, 9, 19], 1, 800);
    }
    ctx.globalAlpha = 1;
  },
  // Вершина распада: пульсирующее кольцо и пунктирные лучи осколков (нейтрино — точками).
  // Нужные для цели — золотые и крупнее; «клик!», когда вершина в круге и снимок готов.
  drawVertex(tr, alpha) {
    const age = this.t - tr.t, k = 1 - age / tr.life, [x, y] = W2S(tr.x, tr.y);
    if (!onScreen(x, y, 60)) return;
    if (!tr.parent) {
      tr.angs.forEach((an, i) => {
        const L = 8 + 22 * (1 - k), d = tr.dsp[i];
        line(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, this.dcol({ sp: d[0], anti: d[1], col: d[2] }), .8 * k * alpha, 1.5);
      });
      ring(x, y, 4, [255, 255, 255], .7 * k * alpha, 1);
      return;
    }
    const a = Math.min(1, k * 1.4) * alpha, known = Codex.has(tr.parent), want = this.wanted(tr.parent) && !tr.rec;
    const col = tr.rec ? [160, 210, 255] : want ? GOLD : known ? tr.col : [255, 255, 255], aa = tr.rec ? a * .45 : a;
    tr.angs.forEach((an, i) => {
      const nu = SM[tr.dsp[i][0]].kind === 'nu', L = nu ? 54 : 36;
      ctx.setLineDash(nu ? [3, 4] : [5, 3]);
      line(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, nu ? [168, 240, 255] : col, .8 * aa, nu ? 1.5 : 1.8);
    });
    ctx.setLineDash([]);
    const pul = 1 + .16 * Math.sin(G.T * 8), rr = 13 * pul * (want ? 1.35 : 1);
    if (want) glow(x, y, rr * 2.2, GOLD, .25 * aa);
    ring(x, y, rr, col, aa, tr.rec ? 1.2 : want ? 2.8 : 2.2);
    const sym = SM[tr.parent].sym;
    label(tr.rec ? sym : known || want ? sym + '→' : '?→', x, y - rr - 9, want ? 13 : 11, col, aa, 700);
    if (want && Math.hypot(tr.x - P.x, tr.y - P.y) < this.hr() && this.canShot())
      label('клик!', x, y + rr + 12, 13, GOLD, aa * (.7 + .3 * Math.sin(G.T * 10)), 800);
  },
  drawPlayer(alpha) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, r = this.hr() * z;
    ctx.globalAlpha = alpha;
    for (const h of this.hot) {
      const [hx, hy] = W2S(h.x, h.y), k = clamp(h.t / 1.6, 0, 1), pul = .5 + .5 * Math.sin(h.t * 14);
      if (!h.done) {
        ring(hx, hy, (1.2 - .9 * k) * z, [255, 190, 110], .35 + .5 * pul, 2, [5, 4]);
        glow(hx, hy, .5 * z, [255, 170, 90], .2 + .25 * k);
      }
    }
    if (this.ep === 3 && this.stock > 0 && !this.stockOut) {
      // запас вещества кружит внутри детектора
      for (let i = 0; i < this.stock; i++) { const p = this.stockPos(i), [bx, by] = W2S(p.x, p.y); ball(bx, by, 4.5, QCOL[this.stockQ[i].col]); }
    }
    // тройки, что Вселенная сберегла сама: мягкое зелёное свечение, три цвета треугольником
    if (this.ep === 3 && !this.stockOut) for (const t of this.safe) {
      const a = Math.min(1, (G.T - t.t0) * 2), c = this.safePos(t), [cx, cy] = W2S(c.x, c.y);
      glow(cx, cy, .45 * z, [140, 235, 170], .25 * a);
      for (let k = 0; k < 3; k++) { const p = this.safePos(t, k), [bx, by] = W2S(p.x, p.y); line(cx, cy, bx, by, [220, 255, 230], .35 * a, 1.2); ball(bx, by, 3.5, QCOL[k], a); }
    }
    if (this.ep === 3 && !this.stockOut) {
      // счётчик цветов справа от детектора: каких меньше всего — пульсирующее золотое кольцо
      const c = this.colCnt(), mn = Math.min(...c);
      c.forEach((n, k) => {
        const x = sx + r + 26, y = sy - 18 + k * 18;
        if (n === mn && !this.advanced) ring(x, y, 8 + 1.5 * Math.sin(G.T * 8), GOLD, .9, 2);
        ball(x, y, 5, QCOL[k]);
        label(String(n), x + 16, y + .5, 13, n === mn ? GOLD : [235, 235, 245], .95, 700);
      });
    }
    const ready = this.canShot();
    let unk = 0;
    for (const o of this.p) if (!o.dead && this.inHand(o)) {
      if (!Codex.has(o.sp)) unk++;
      if (o.cap) continue;
      const [ox, oy] = W2S(o.x, o.y), rr = Math.max(7, this.rad(o) * z + 4);
      ring(ox, oy, rr, Codex.has(o.sp) ? [255, 255, 255] : [255, 215, 110], ready ? .45 : .15, 1);
    }
    for (const tr of this.tracks) if (Math.hypot(tr.x - P.x, tr.y - P.y) < this.hr() && tr.sps.some(sp => !Codex.has(sp))) unk++;
    this.drawField(sx, sy, r);
    this.drawInflaton(sx, sy);
    // вспышка затвора
    if (this.shotFx > 0) glow(sx, sy, r, [255, 255, 255], .14 * this.shotFx / .35);
    glow(sx, sy, r, [255, 255, 255], ready ? .05 : .02);
    ring(sx, sy, r, [255, 255, 255], ready ? .6 : .3, 1.5, [6, 6]);
    // уголки видоискателя: золотые, когда в кадре есть неизвестное
    const vc = unk && ready ? [255, 215, 110] : [255, 255, 255], q = r * 1.12 + (this.shotFx > 0 ? 6 * this.shotFx / .35 : 0);
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; arc(sx, sy, q, a - .3, a + .3, vc, ready ? .9 : .35, 2.2); }
    // перезарядка снимка
    if (this.shotCd > 0) arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - this.shotCd / this.up('sh'), 0, 1), [200, 235, 255], .85, 2);
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    this.drawEnergy(sx, sy, r);
    this.drawHint(sx, sy, r);
    this.drawArrows();
    for (const f of this.floats) {
      if (f.t < 0) continue;
      const [fx, fy] = W2S(f.x, f.y);
      label(f.txt, fx, fy - 16 - f.t * 26, f.sz || 14, f.c || [140, 220, 255], clamp(1.6 - f.t, 0, 1), 700);
    }
    ctx.globalAlpha = 1;
  },
  // Пролог: чаша потенциала V(φ) с шариком-полем. Красный пунктир — черта срыва, золотые риски — размах.
  // Шарик катится влево — под ним золотая стрелка «←» (сейчас толкать); вправо — серая «→» (отпусти).
  // Зажал — стрелка толчка: золотая, если шарик катится влево; красная и дрожит, если вправо (гасишь).
  drawInflaton(sx, sy) {
    if (this.lit || this.ep) return;
    const I = this.inf, A = Math.min(1.05, I.A), z = cam.z, B = this.infBowl(), w = B.w * z, d = B.d * z;
    const [bx, by] = W2S(B.bx, B.by), th = I.th, u = A * Math.cos(th), left = Math.sin(th) > 0;
    const Y = v => by - d * v * v, c = PH_CLS[A < .3 ? 0 : A < .55 ? 1 : A < .8 ? 2 : 3].c, dang = smooth(.6, 1, A);
    // чаша
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const v = -1.12 + 2.24 * k / 40; k ? ctx.lineTo(bx + w * v, Y(v)) : ctx.moveTo(bx + w * v, Y(v)); }
    ctx.strokeStyle = rgb([200, 215, 255], .55); ctx.lineWidth = 2.5; ctx.stroke();
    // черта срыва
    ctx.setLineDash([5, 5]); line(bx - w * 1.12, Y(INF.crit), bx + w * 1.12, Y(INF.crit), [255, 80, 70], .25 + .6 * dang, 1.5 + 1.5 * dang); ctx.setLineDash([]);
    label('срыв', bx + w * 1.12 + 4, Y(INF.crit), 11, [255, 110, 100], .5 + .5 * dang, 700); ctx.textAlign = 'center';
    // размах: золотые риски, докуда шарик долетает
    for (const sg of [-1, 1]) { const x = bx + sg * w * A, y = Y(A); line(x, y - 7, x, y + 7, GOLD, .7, 2); }
    // дно — где рождается свет
    glow(bx, by, w * .25, c, .1 + .5 * I.flash); ball(bx, by, 2.5, [255, 255, 255], .5 + .5 * I.flash);
    // шарик
    const x = bx + w * u, y = Y(u), br = Math.max(6, w * .09);
    glow(x, y, br * 2.6, c, .25 + .2 * A); ball(x, y, br, mixc(c, [255, 255, 255], .35), 1);
    // куда толкать: под шариком стрелка
    const push = I.hold, lose = push && !left, col = push ? (lose ? [255, 80, 70] : GOLD) : left ? GOLD : [170, 175, 195];
    const dir = push ? -1 : left ? -1 : 1, ax = x + (lose ? Math.sin(G.T * 50) * 2.5 : 0), ay = y + br + 16, L = push ? 30 : 20;
    const al = push ? .95 : left ? .55 + .4 * Math.abs(Math.sin(G.T * 6)) * (I.go ? .5 : 1) : .35;
    line(ax - dir * L / 2, ay, ax + dir * L / 2, ay, col, al, push ? 4 : 2.5);
    line(ax + dir * L / 2, ay, ax + dir * (L / 2 - 8), ay - 6, col, al, push ? 4 : 2.5);
    line(ax + dir * L / 2, ay, ax + dir * (L / 2 - 8), ay + 6, col, al, push ? 4 : 2.5);
  },
  // Поле: пунктир захвата, ядро, нити к захваченным квантам и кольцо-шкала энергии с порогами
  drawField(sx, sy, r) {
    const f = this.focus; if (!f) return;
    const z = cam.z, R = this.fr() * z;
    if (this.ep === 3) {
      const on = this.shield > 0;
      ring(sx, sy, R, SHIELD_C, on ? .45 : .15, 1.5, [6, 6]);
      if (on) { glow(sx, sy, R, SHIELD_C, .06); ring(sx, sy, r * .5 + 3 * Math.sin(G.T * 10), SHIELD_C, .9, 2); }
      arc(sx, sy, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * this.shield, SHIELD_C, .85, 4);
      return;
    }
    ring(sx, sy, R, FIELD_C, .35, 1.5, [6, 6]);
    ring(sx, sy, this.hr() * .42 * z + 3 * Math.sin(G.T * 10), GOLD, .8, 2);
    for (const o of f.cap) { const [ox, oy] = W2S(o.x, o.y); line(ox, oy, sx, sy, GOLD, .45 + .4 * f.q, 1.5 + 4 * f.q); }
    if (!f.cap.length) return;
    const Rg = r + 13, a0 = -Math.PI / 2;
    // рогатка взведена: стрелка — куда полетят кванты, если отпустить сейчас
    const pv = Math.hypot(P.vx, P.vy);
    if (pv > THROW_V * .6) {
      const on = pv > THROW_V, an = Math.atan2(P.vy, P.vx), c = Math.cos(an), s = Math.sin(an), r0 = Rg + 10, L = on ? 46 : 24;
      ctx.setLineDash(on ? [] : [4, 4]);
      line(sx + c * r0, sy + s * r0, sx + c * (r0 + L), sy + s * (r0 + L), GOLD, on ? .95 : .4, on ? 3 : 2);
      ctx.setLineDash([]);
      if (on) {
        const hx = sx + c * (r0 + L + 4), hy = sy + s * (r0 + L + 4);
        ctx.fillStyle = rgb(GOLD, .95); ctx.beginPath(); ctx.moveTo(hx + c * 8, hy + s * 8);
        ctx.lineTo(hx + Math.cos(an + 2.4) * 9, hy + Math.sin(an + 2.4) * 9); ctx.lineTo(hx + Math.cos(an - 2.4) * 9, hy + Math.sin(an - 2.4) * 9); ctx.fill();
      }
    }
    if (f.cap.length < 2) { wedge(sx, sy, Rg, a0, a0 + TAU * Math.max(.005, f.q), 2, 2 + 12 * f.q, FIELD_C, .6); return; }
    const kinds = f.cap.map(o => o.sp).sort().join(''), bd = this.band(f), inH = !!bd && f.E > bd[0] && f.E < bd[1];
    wedge(sx, sy, Rg, a0, a0 + TAU, 2, 14, [255, 255, 255], .08); // сколько можно набрать
    // золотая полоса — резонанс: два глюона — H, частица + античастица — Z
    if (bd) {
      const q1 = this.qOf(bd[0]), q2 = this.qOf(bd[1]);
      if (q2 > 0 && q1 < 1) {
        arc(sx, sy, Rg, a0 + TAU * Math.max(0, q1), a0 + TAU * Math.min(1, q2), GOLD, .55, 9);
        const am = a0 + TAU * clamp((q1 + q2) / 2, 0, 1), sym = kinds === 'gg' ? 'H' : 'Z';
        label(Codex.has(sym) ? sym : '?', sx + Math.cos(am) * (Rg + 17), sy + Math.sin(am) * (Rg + 17), 11, GOLD, .95, 800);
      }
    }
    if (this.isQ(f.cap[0])) {
      // риски — пороги 2m рождения пар; до перехода Хиггса — тепловые массы: ℓ (лептоны) и q (кварки)
      const pre = this.hig < .5, ph2 = kinds === 'phph';
      const list = pre ? (ph2 ? ['e', 'u', 't'] : ['u', 't']) : kinds === 'gg' || kinds === 'gph' ? ['c', 'b', 't'] : ['c', 'ta', 'b', 't'];
      const th = list.map(sp => [sp, 2 * this.mThr(sp)]);
      if (ph2 && !pre) th.push(['W', 2 * SM.W.m * this.hig]);
      const sym = sp => pre && sp === 'e' ? 'ℓ' : pre && sp === 'u' ? 'q' : Codex.has(sp) ? SM[sp].sym : '?';
      // окно лептонов: γ + γ между порогами ℓ и q рождает только лептоны
      if (pre && ph2) {
        const q1 = this.qOf(th[0][1]), q2 = this.qOf(th[1][1]);
        if (q2 > .02 && q1 < 1) arc(sx, sy, Rg, a0 + TAU * Math.max(0, q1), a0 + TAU * Math.min(1, q2), LEP_C[0], .4, 9);
      }
      let lastA = -9;
      for (const [sp, E] of th.sort((x, y) => x[1] - y[1])) {
        const q = this.qOf(E); if (q < .02 || q > 1) continue;
        const an = a0 + TAU * q, c = Math.cos(an), s = Math.sin(an);
        line(sx + c * (Rg - 7), sy + s * (Rg - 7), sx + c * (Rg + 7), sy + s * (Rg + 7), [255, 255, 255], .9, 2);
        if (an - lastA > .22) { label(sym(sp), sx + c * (Rg + 17), sy + s * (Rg + 17), 11, sp === 'e' ? LEP_C[0] : [255, 255, 255], .9, 700); lastA = an; }
      }
    }
    // энергия столкновения — клин: чем больше набрал, тем толще линия; нити к квантам тоже толстеют
    wedge(sx, sy, Rg, a0, a0 + TAU * Math.max(.005, f.q), 2, 2 + 12 * f.q, inH ? GOLD : FIELD_C, .95);
    label(`√s ${fmtGeV(this.rsOf(f))}`, sx, sy - Rg - 32, 12, inH ? GOLD : [142, 229, 255], .95, 700);
  },
  // Энергия детектора — дуга из делений под кругом; пустая и нужна — мигает красным
  drawEnergy(sx, sy, r) {
    if (!this.enOn()) return;
    const R = r + 9, a0 = Math.PI * .78, span = Math.PI * .56, warn = this.enFx > 0 && Math.sin(G.T * 30) > 0;
    for (let k = 0; k < E_CAP; k++) {
      const a = a0 - (k + .5) / E_CAP * span, fill = clamp(this.en - k, 0, 1);
      const x = sx + Math.cos(a) * R, y = sy + Math.sin(a) * R;
      ctx.globalAlpha = 1; ctx.fillStyle = warn ? 'rgba(255,110,100,.85)' : 'rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
      if (fill > 0) { ctx.fillStyle = rgb(PH_C, .35 + .65 * fill); ctx.beginPath(); ctx.arc(x, y, 3.5 * Math.sqrt(fill), 0, TAU); ctx.fill(); }
    }
    label('⚡', sx, sy + R + 10, 11, this.en < E_SHOT ? [255, 140, 120] : PH_C, .9, 700);
  },
  // Держишь два фотона до перехода Хиггса, а загаданный лептон ещё не открыт — подсказка про синее окно
  leptonWin() {
    const f = this.focus;
    return !!f && this.ep === 0 && this.hig < .5 && f.cap.length === 2 && f.cap.every(o => o.sp === 'ph') && this.need0.some(sp => SM[sp].kind === 'lepton' && !Codex.has(sp));
  },
  // Подсказка в одну строку — пока действие не освоено
  drawHint(sx, sy, r) {
    if (!G.started || G.paused || this.advanced) return;
    let t = null;
    if (this.ep === 3) t = !this.learn.shield ? 'зажми — щит'
      : !this.learn.recol && this.stock >= 2 && this.p.some(o => !o.dead && o.sp === 'g' && this.helpGlu(o) && onScreen(...W2S(o.x, o.y), 0)) ? 'глюон в золотом кольце: подлети и зажми — щит втянет его и перекрасит лишний кварк' : null;
    else if (!this.lit && this.ep === 0) {
      const I = this.inf;
      if (I.hold) t = null;
      else if (I.snapFx > 0) t = 'срыв! не доводи шарик до красной черты';
      else if (!I.go) t = 'зажми, когда шарик покатится влево ←';
      else if (I.late >= 2 && I.late > I.good) t = 'отпускай на левом краю — вправо не толкай';
      else if (I.good < 2) t = 'держи, пока катится влево · отпусти на краю';
      else if (I.A > .8 && !I.snaps) t = 'у красной черты — толкай короче';
    }
    else if (this.ep === 0 && this.lit && !this.rs.ph) t = this.bal() >= 10 ? `клавиша ${this.keyOf('ph')} — свет` : null;
    else if (this.ep === 0 && this.phSeen.size >= 3 && !this.gOn) t = this.keyOf('g') && this.bal() >= RES_COST.g[0] ? `клавиша ${this.keyOf('g')} — исследуй глюоны` : `лови фотоны — ✦ на глюоны: ${this.bal()}/${RES_COST.g[0]}`;
    else if (this.enOn() && this.phSeen.size < 3) t = 'лови фотоны кругом — измерить';
    else if (this.enOn() && (!this.full || this.en < E_SHOT + .5)) t = 'лови фотоны — энергия';
    else if (!this.learn.snap) t = 'клик — снимок';
    else if (this.focus && this.focus.cap.length === 2 && !this.learn.smash) t = 'отпусти — столкнуть';
    else if (this.leptonWin()) t = this.focus.E < 2 * this.mThr('e') ? 'держи — мало энергии для ℓ' : this.focus.E < 2 * this.mThr('u') ? 'отпусти — синее окно: лептон' : 'выше q — уже в основном кварки';
    else if (this.focus && this.focus.cap.length === 1 && !this.isQ(this.focus.cap[0]) && !this.learn.ann) t = `тяжёлое тянется медленно — нужна античастица ${this.lab({ ...this.focus.cap[0], anti: !this.focus.cap[0].anti })}`;
    else if (this.focus && this.focus.cap.length === 2 && !this.isQ(this.focus.cap[0]) && !this.learn.ann) t = this.band(this.focus) ? 'отпусти в золотой полосе' : 'отпусти — аннигиляция';
    else if (this.ep === 1 && this.hig >= 1 && !Codex.has('H') && this.focus && this.focus.cap.length === 2 && this.isQ(this.focus.cap[0])) t = this.focus.cap.every(o => o.sp === 'g') ? 'отпусти в золотой полосе — H' : 'для H нужны два глюона';
    else if (this.ep === 1 && Codex.has('H') && !this.learn.heavy && this.hig >= 1) t = this.p.some(o => !o.dead && !this.isQ(o) && this.grabbable(o) && onScreen(...W2S(o.x, o.y), 0)) ? 'зажми возле частицы — с массой её можно удержать' : 'вещества нет — сделай пару: столкни кванты';
    else if (this.focus && this.focus.cap.length && this.learn.smash && !this.learn.throw && this.epT > 6) t = this.thrownReady() ? 'отпусти на ходу — бросок' : 'разгонись с квантами';
    else if (!this.learn.hold && this.ep === 0 && this.fieldOn()) t = 'зажми — притянуть кванты';
    else if (this.ep === 0 && this.pairs > 0 && !this.rs.coll && this.canBuy()) t = 'сделал руками — можно отдать Вселенной: клавиши внизу';
    else if (!this.learn.buy && this.canBuy()) t = 'хватает ✦ — исследуй: клавиши внизу';
    if (!t) return;
    if (!this.learn.snap && this.lit || (!this.lit && this.ep === 0 && !this.inf.go)) { const ph = (G.T % 1.4) / 1.4; ring(sx, sy, r * (1 + .25 * ph), [255, 255, 255], .5 * (1 - ph), 2); }
    label(t, sx, sy + r + 36, 14, [255, 255, 255], .75 + .2 * Math.sin(G.T * 4), 700);
  },
  // Стрелки у края экрана — к тому, что нужно снять, если оно за кадром
  drawArrows() {
    const pts = [];
    for (const o of this.p) if (!o.dead && this.wanted(o.sp, o)) pts.push([o.x, o.y, this.ep === 3 ? QCOL[o.col] : SM[o.sp].sym]);
    for (const tr of this.tracks) if (tr.parent && !tr.rec && this.wanted(tr.parent)) pts.push([tr.x, tr.y, SM[tr.parent].sym + '→']);
    for (const h of this.hot) if (!h.done) pts.push([h.x, h.y, '']);
    if (this.enOn()) for (const o of this.p) if (!o.dead && o.sp === 'ph' && this.phClass(o) === 3) pts.push([o.x, o.y, 'γ!']);
    // не больше трёх ближайших — чтобы край экрана не превратился в ёлку
    edgeArrows(pts, 3);
  },
  // Часы, очки и цели эпохи — сверху по центру
  drawClock(alpha) {
    if (!G.started) return;
    const done = this.doneAt !== null;
    let left, col = [255, 255, 255];
    if (this.ep < 3) { left = `${done ? '✓ ' : ''}${fmtClock(this.epClock)}`; col = done ? [140, 235, 170] : this.epClock > PAR[this.ep] ? [190, 190, 205] : col; }
    else left = done ? `⏳ ${fmtClock(this.T > .4 ? EPOCHS[3].tau / 4 * Math.log(this.T / .4) : 0)}` : fmtClock(this.epClock);
    hudClock(alpha, left, col, this.bal(), []);
    if (!this.advanced) hudTask(alpha, this.tk, !this.lit && !this.ep ? 'ПРОЛОГ' : `ЭПОХА ${this.ep + 1}`, this.steps(), this.stars,
      this.ep === 3 ? 'Вселенная остывает — лови ещё кварки, больше барионов на следующем уровне' : 'Готово!');
  },
  // Заголовок эпохи: всплывает и гаснет, игру не останавливает
  drawBanner(alpha) {
    if (!this.lit && !this.ep) return hudBanner(this.banner, 'ПРОЛОГ · 10⁻³² с', 'Разогрев', 'Инфляция кончилась — раскачай поле, как качели: его энергия станет светом', alpha);
    const E = EPOCHS[this.ep];
    hudBanner(this.banner, `ЭПОХА ${this.ep + 1} · ${E.when}`, E.name, this.ep ? E.line : `${this.inf.pick ? this.inf.pick.n[0].toUpperCase() + this.inf.pick.n.slice(1) : ''} разогрев: ${fmtGeV(this.T0)}, света ×${this.heat.toFixed(1)}`, alpha);
  },
  // Шкала разогрева внизу: сколько света набрано; три зоны — холодный, тёплый, горячий; над ней — сколько живёт поле
  drawHeat(alpha) {
    const fade = this.lit ? 1 - smooth(1, 2.5, this.litT) : 1, a = alpha * fade;
    if (a <= .01 || this.ep || !G.started) return;
    const pad = document.body.classList.contains('touch') ? 124 : 0; // справа — кнопка действия
    const I = this.inf, W = Math.min(440, G.W - (pad ? 48 : 120) - pad), narrow = W < 330, cx = (G.W - pad) / 2, x0 = cx - W / 2, y = G.H - 96, h = 14, cur = this.inf.pick || this.profOf(I.H);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(x0 - 14, y - 34, W + 28, 72, 10); ctx.fill();
    PROF.forEach((p, i) => {
      const hi = i < 2 ? PROF[i + 1].h : 1, xa = x0 + W * p.h, xb = x0 + W * hi, on = cur.i === i, mid = ((p.k[0] + p.k[1]) / 2) ** 1.5;
      ctx.fillStyle = rgb(p.c, on ? .25 : .1); ctx.fillRect(xa, y, xb - xa, h);
      if (i) line(xa, y - 3, xa, y + h + 3, [255, 255, 255], .5, 1);
      label(narrow ? p.n : `${p.n} · свет ×${mid.toFixed(1)}`, (xa + xb) / 2, y + h + 13, narrow ? 10 : 11, on ? p.c : [190, 195, 210], on ? 1 : .6, on ? 800 : 600);
    });
    const fw = W * Math.min(1, I.H), gr = ctx.createLinearGradient(x0, 0, x0 + W, 0);
    PROF.forEach(p => gr.addColorStop(Math.min(1, p.h + .12), rgb(p.c, .95)));
    ctx.fillStyle = gr; ctx.fillRect(x0, y + 3, fw, h - 6);
    if (I.flash > 0) glow(x0 + fw, y + h / 2, 10 + 14 * I.flash, [255, 255, 255], .5 * I.flash);
    ctx.fillStyle = '#fff'; ctx.fillRect(x0 + fw - 1, y - 3, 2, h + 6);
    // сколько ещё живёт поле
    const left = I.go ? Math.max(0, INF.life - I.t) : INF.life;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x0, y - 8, W * left / INF.life, 2);
    label(narrow ? (I.go ? `РАЗОГРЕВ · поле живёт ${Math.ceil(left)} с` : 'РАЗОГРЕВ · поле не раскачано') : I.go ? `РАЗОГРЕВ · поле распадётся через ${Math.ceil(left)} с` : 'РАЗОГРЕВ · поле ещё не раскачано', cx, y - 20, 11, [235, 240, 250], .85, 700);
    ctx.globalAlpha = 1;
  },
  // Шкала остывания (слева вверху): T в логарифме, слева горячо. Риски — где закрывается окно «сделать руками»:
  // после Хиггса пару X поле родит, пока 2m ≤ 2·T·сила, т. е. до T = m / сила. Сила поля сдвигает окна вниз.
  // Ромб — застывание поля Хиггса (160 ГэВ); пунктир — ниже этой T Вселенная не остынет, пока задание эпохи не выполнено.
  drawGauge(alpha) {
    if (!G.started || (!this.lit && this.ep === 0)) return;
    const x0 = 16, x1 = 276, y = 56 + this.leftTop(), lo = Math.log10(.1), hi = Math.log10(2000);
    const X = T => lerp(x0, x1, clamp((hi - Math.log10(Math.max(T, .1))) / (hi - lo), 0, 1));
    ctx.globalAlpha = alpha;
    const gr = ctx.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(255,240,190,.9)'); gr.addColorStop(.35, 'rgba(255,140,60,.9)'); gr.addColorStop(.7, 'rgba(200,50,110,.85)'); gr.addColorStop(1, 'rgba(70,90,220,.85)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x0, y - 2, x1 - x0, 4, 2); ctx.fill();
    ctx.font = '600 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(220,225,240,.55)'; ctx.fillText('остывание →', x1 + 6, y);
    // застывание поля Хиггса
    const xh = X(160); ctx.fillStyle = rgb(GOLD, this.hig >= 1 ? .5 : .95);
    ctx.beginPath(); ctx.moveTo(xh, y - 6); ctx.lineTo(xh + 3, y - 3); ctx.lineTo(xh, y); ctx.lineTo(xh - 3, y - 3); ctx.closePath(); ctx.fill();
    // окна тяжёлых частиц
    const need = this.ep === 2 ? this.need2 : this.ep === 0 ? this.need0 : [];
    let lastX = -99, row = 0; // близкие подписи — в два ряда
    for (const sp of ['t', 'Z', 'W', 'b', 'ta', 'c']) {
      const Tc = SM[sp].m / this.up('pow'), x = X(Tc), shut = this.hig >= 1 && this.T < Tc, kn = Codex.has(sp);
      row = x - lastX < 12 ? 1 - row : 0; lastX = x; const ly = y - 15 - row * 11;
      const col = shut ? [120, 125, 140] : need.includes(sp) && !this.decSeen.has(sp) ? GOLD : kn ? this.color({ sp, anti: false, col: 0 }) : [210, 220, 240];
      ctx.globalAlpha = alpha * (shut ? .55 : 1); ctx.fillStyle = rgb(col, 1); ctx.fillRect(x - .75, y - 9, 1.5, 7);
      label(kn ? SM[sp].sym : '?', x, ly, 10, col, alpha * (shut ? .55 : 1), 700);
      if (shut) { ctx.strokeStyle = rgb(col, .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 5, ly + 4); ctx.lineTo(x + 5, ly - 4); ctx.stroke(); }
    }
    // предел эпохи: пока задание не выполнено, ниже Вселенная не остынет
    const fl = EPOCHS[this.ep].floor;
    if (fl > 0 && !this.epDone) { const xf = X(fl); ctx.globalAlpha = alpha * .8; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(xf, y - 6); ctx.lineTo(xf, y + 6); ctx.stroke(); ctx.setLineDash([]); }
    // где сейчас Вселенная
    const xt = X(this.T); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(xt, y + 3); ctx.lineTo(xt + 5, y + 10); ctx.lineTo(xt - 5, y + 10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  },
  // Трекер: сколько поймано фотонов каждого класса (слева вверху); не найденный класс — «?»
  drawCaught(alpha) {
    if (!G.started || !this.enOn() || this.ep === 3) return;
    const x = 16, y0 = 84 + this.leftTop();
    ctx.globalAlpha = alpha * .9; ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(220,225,240,.6)'; ctx.fillText('ПОЙМАНО γ', x, y0);
    PH_CLS.forEach((C, i) => {
      const y = y0 + 16 + i * 15, seen = this.phSeen.has(i), hot = this.caughtFx === i && G.T - this.caughtAt < .6 ? 2.5 * (1 - (G.T - this.caughtAt) / .6) : 0;
      ctx.globalAlpha = alpha * (seen ? 1 : .45);
      ctx.fillStyle = rgb(C.c, 1); ctx.beginPath(); ctx.arc(x + 4, y, 4 + hot, 0, TAU); ctx.fill();
      ctx.font = '600 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(235,240,250,.95)';
      ctx.fillText(seen ? C.n : '?', x + 14, y);
      ctx.textAlign = 'right'; ctx.fillText(String(this.caught[i]), x + 128, y); ctx.textAlign = 'left';
    });
    ctx.globalAlpha = 1;
  },
  overlay(alpha) { if (this.stockOut) return; this.drawHeat(alpha); this.drawClock(alpha); this.drawGauge(alpha); this.drawCaught(alpha); this.drawBanner(alpha); ctx.globalAlpha = 1; },
  // Шкала остывания и трекер γ — слева вверху; если там карточки задания (узкий экран) — под ними
  leftTop() {
    const cx0 = (G.W - Math.min(400, G.W - 24)) / 2;
    return cx0 < 345 && G.T - (G.taskAt ?? -9) < .2 ? Math.max(0, G.taskY - 26) : 0;
  },
  showCodex() { return this.lit || this.ep > 0; }, // в пустоте открывать ещё нечего
  viewR() { return 3.5 + this.hr() * 1.9; },
  hud() {
    return { title: '', sub: `T ≈ ${fmtGeV(this.T)}${this.ff > 1 ? ' · ×4' : ''}`, lines: [], goal: '', laws: [] };
  },
};
