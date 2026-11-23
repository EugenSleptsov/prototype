"use strict";
/* Уровень частиц: эпохи 1–2. «Вселенная как коллайдер».
   Игрок — не частица, а ДЕТЕКТОР (круг вокруг курсора).
   - Клик = снимок: изучено всё, что сейчас в круге, и следы событий последних долей секунды.
   - Снимки дают ЗНАНИЯ ✦, за них прокачивается детектор (радиус, затвор, бросок, фокус).
   - Рогатка: зажми частицу и оттяни — время замедляется, видно траекторию, цель с упреждением
     и энергию столкновения на шкале с порогами 2m. Отпусти — бросок. Сталкивает только рука.
   - Столкновение двух квантов рождает пару частица + античастица (E = mc²).
   - Открытое в забеге Вселенная дальше рождает сама — пока хватает температуры.
   Эпоха 1 (T > 160 ГэВ): всё безмассовое и летит со скоростью света.
   Эпоха 2: поле Хиггса застывает → массы. Пара рождается, только если √s ≥ 2m.
   Тяжёлые частицы быстро распадаются, Вселенная остывает — окна закрываются. */
const C_LIGHT = 1.2, WORLD_R = 12, T_START = 1000, N_QUANTA = 14, TRACK_T = .8;
// Прокачка детектора: значения по уровням и цена следующего уровня в знаниях ✦
const UPG = [
  { key: 'r', name: 'Радиус детектора', ic: '◎', val: [.9, 1.25, 1.65, 2.1, 2.6], fmt: v => v.toFixed(2),
    about: 'Круг больше — в кадр попадает больше частиц, камера отъезжает' },
  { key: 'sh', name: 'Быстрый затвор', ic: '⏱', val: [1.2, .85, .6, .4], fmt: v => v.toFixed(2) + ' с',
    about: 'Снимки чаще — проще поймать короткоживущую частицу' },
  { key: 'pow', name: 'Сила броска', ic: '➶', val: [3, 4, 5, 6.5], fmt: v => '×' + v + ' T',
    about: 'Полное натяжение даёт больше энергии — хватает на тяжёлые пары и резонансы' },
  { key: 'slow', name: 'Фокус', ic: '◔', val: [.25, .16, .1], fmt: v => '×' + v,
    about: 'Пока целишься, время течёт ещё медленнее' },
];
// Рогатка: натяжение до maxPull мировых единиц; слабое натяжение в span раз слабее полного
// (логарифмическая шкала — удобно попадать в резонанс); cone — захват цели с упреждением.
const AIM = { maxPull: 3, span: 400, cone: 14 * DEG, hitR: .42, flungT: 7, grab: .7 };
// пороги знаний: на каждом игра встаёт на паузу и предлагает выбрать улучшение
const KN_STEPS = [10, 25, 45, 75, 115, 165, 230, 310, 400, 500];
const LEP_C = [[150, 205, 255], [120, 165, 255], [150, 120, 255]];
const BOS_C = { W: [255, 150, 70], Z: [255, 105, 115], H: [255, 215, 90], ph: [255, 240, 190] };
const NU_C = [175, 255, 205];
const FERMIONS = ['u', 'd', 'c', 's', 't', 'b', 'e', 'mu', 'ta', 'ne', 'nm', 'nt'];
// Эпохи уровня. Температура не опускается ниже floor, пока цели эпохи не выполнены;
// следующая эпоха начинается, когда T ≤ startT (и после короткой паузы).
const EPOCHS = [
  { name: 'Чистая энергия', floor: 165, tau: 36, startT: Infinity, when: '10⁻¹² с после Большого взрыва',
    phys: 'Вселенная — раскалённый газ квантов: фотонов и глюонов. Массы нет ни у чего, всё летит со скоростью света. Энергия может стать веществом: два кванта при столкновении рождают пару <b>частица + античастица</b> (E = mc²).',
    todo: '<b>Клик</b> — снимок: определи, что в круге. <b>Зажми квант и оттяни, как рогатку</b> — время замедлится, покажется траектория. Отпусти в другой квант: из энергии столкновения родится пара.' },
  { name: 'Поле Хиггса', floor: 90, tau: 14, startT: 160, when: '10⁻¹¹ с · 160 ГэВ',
    phys: 'Поле Хиггса «застывает» во всём пространстве. Частицы, которые с ним взаимодействуют, обретают <b>массу</b> и замедляются. Переносчики слабой силы W и Z становятся тяжёлыми — поэтому слабая сила такая слабая.',
    todo: 'Рядом всплески поля — <b>бозоны Хиггса</b>. Сними их, пока не распались. Теперь работает E = mc²: <b>тяни сильнее</b> — шкала внизу покажет, на какие пары хватает энергии. Два глюона точно в светлой полосе рождают H; W и Z — сильный бросок или <b>горячая точка</b>.' },
  { name: 'Распады', floor: 3, tau: 14, startT: Infinity, when: '10⁻¹⁰ с · ~90 ГэВ',
    phys: 'Тяжёлые частицы нестабильны. t-кварк живёт 5·10⁻²⁵ с и распадается на b-кварк, тот — на c, дальше s… Физики узнают частицы по <b>осколкам распада</b>.',
    todo: 'Мерцающее кольцо — <b>горячая точка</b>: там сейчас родится тяжёлая частица. Наведи круг и сними <b>вспышку распада</b>. Потом следуй за осколком и сними его распад — так собирается цепочка.' },
  { name: 'Аннигиляция', floor: 0, tau: 20, startT: 3, when: '10⁻⁷ с · 3 ГэВ',
    phys: 'Вещество и антивещество уничтожают друг друга и превращаются в свет. Но вещества чуть больше: один лишний кварк на миллиард пар (в игре — гораздо больше). Из этого остатка сделаны звёзды, планеты и ты.',
    todo: 'Наведи детектор на кварки вещества (шары) — он их <b>сохранит</b>. Антикварки (кольца) тянутся к веществу: долетев до детектора, антикварк уничтожит сохранённый кварк. <b>Хватай антикварк и вышвыривай</b> подальше.' },
];
const CHAINS = [['t', 'b', 'c'], ['ta', 'mu']]; // чьи распады нужно снять в эпохе 3
const STOCK_GOAL = 12;

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
    // амплитуда постоянна; прозрачность мягко уходит только у самого хвоста
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

const Particles = {
  key: 'particles', name: 'Частицы', bg: [44, 34, 14],
  controls: 'Мышь — вести детектор · Клик — снимок · Зажать частицу и оттянуть — бросок · Enter — ускорить остывание',

  enter() {
    this.p = []; this.t = 0; this.T = T_START; this.hig = 0; this.higT = -1; this.ff = 1;
    this.advanced = false; this.sawTop = false; this.msgCd = 0; this.said = {};
    this.kn = 0; this.picks = 0; this.lvl = { r: 0, sh: 0, pow: 0, slow: 0 }; this.press = null; this.aim = null; this.ejected = 0; this.shotCd = 0; this.tracks = []; this.floats = []; this.seenN = {};
    this.bg = [44, 34, 14];
    this.ep = 0; this.epDone = false; this.epGap = 0; this.cardFor = -1; this.epT = 0;
    this.pairs = 0; this.decSeen = new Set(); this.hot = []; this.hotCd = 3; this.stock = 0; this.soupCd = 0;
    Codex.run = new Set(); Codex.dirty = true;
    P.x = P.y = P.vx = P.vy = 0; P.dashCd = 0;
    for (let i = 0, n = this.nQ(); i < n; i++) this.spawnQuantum(true);
  },
  hint(k, t, dur) { if (this.said[k]) return; this.said[k] = true; msg(t, dur); },

  // ---------- создание ----------
  thermalP(T) { return T * -Math.log(Math.random() * Math.random() * Math.random() + 1e-12); },
  mk(sp, anti, x, y, a, p, col) {
    const s = SM[sp], o = { sp, anti, x, y, dx: Math.cos(a), dy: Math.sin(a), p, col: col ?? (Math.random() * 3 | 0),
      age: 0, life: s.life ? -s.life * Math.log(Math.random() + 1e-9) : Infinity, seen: 0, born: 0, cd: 0, dead: false };
    if (sp === 'g') o.col2 = (o.col + 1 + (Math.random() * 2 | 0)) % 3;
    if (sp === 'g' || sp === 'ph') { o.amp = rnd(.5, 1.5); o.ph = Math.random() * TAU; }
    this.p.push(o); return o;
  },
  up(k) { const u = UPG.find(x => x.key === k); return u.val[this.lvl[k]]; },
  hr() { return this.up('r'); },
  wr() { return Math.max(WORLD_R, viewRadius() + 1); },
  nQ() { return Math.round(N_QUANTA * (this.wr() / WORLD_R) ** 2); },
  randPos(outside) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, d = outside ? rnd(viewRadius() * .9, this.wr()) : Math.sqrt(Math.random()) * this.wr();
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if (Math.hypot(x - P.x, y - P.y) > this.hr() * 1.5) return [x, y];
    }
    return [P.x + this.wr() * .8, P.y];
  },
  spawnQuantum(any) {
    const [x, y] = this.randPos(!any);
    const o = this.mk(Math.random() < .62 ? 'g' : 'ph', false, x, y, Math.random() * TAU, this.thermalP(this.T));
    if (any) o.born = 1;
  },
  // пара частица + античастица разлетается из одной точки
  pair(sp, x, y, pEach, col) {
    const a = Math.random() * TAU, c = col ?? (Math.random() * 3 | 0);
    const A = this.mk(sp, false, x, y, a, pEach, c), B = this.mk(sp, true, x, y, a + Math.PI, pEach, c);
    A.cd = B.cd = .4; return [A, B];
  },
  meff(o) { return SM[o.sp].m * this.hig; },
  speed(o) { if (o.v != null) return o.v; const m = this.meff(o); return m <= 0 ? C_LIGHT : C_LIGHT * o.p / Math.sqrt(o.p * o.p + m * m); },
  isQ(o) { return o.sp === 'ph' || o.sp === 'g'; },
  inHand(o) { return Math.hypot(o.x - P.x, o.y - P.y) < this.hr(); },
  // Больцмановский вес: сколько частиц этого сорта держит Вселенная при температуре T
  weight(sp) { const m = SM[sp].m * this.hig; return m <= 0 ? 1 : Math.exp(-m / this.T); },

  // ---------- действие игрока: рогатка ----------
  // Что можно схватить: ближайшее к курсору, кроме нейтрино (рукой не поймать) и тяжёлых бозонов
  grabbable(x, y) {
    let best = null, bd = AIM.grab;
    for (const o of this.p) {
      if (o.dead || o.fade >= 0 || o.born < .5) continue;
      if (SM[o.sp].kind === 'nu' || o.sp === 'W' || o.sp === 'Z' || o.sp === 'H') continue;
      const d = Math.hypot(o.x - x, o.y - y) - this.rad(o); if (d < bd) { bd = d; best = o; }
    }
    return best;
  },
  // Эпоха 4: кварк бросается «вручную», без наведения — просто вышвырнуть
  freeThrow(o) { return this.ep === 3 && SM[o.sp].kind === 'quark'; },
  partners(o) {
    if (this.isQ(o)) return this.p.filter(t => t !== o && !t.dead && this.isQ(t) && !(t.fade >= 0));
    return this.p.filter(t => !t.dead && t.sp === o.sp && t.anti !== o.anti);
  },
  vel(o) { const v = this.speed(o); return [o.dx * v, o.dy * v]; },
  // Упреждение: куда лететь со скоростью speed, чтобы встретить движущуюся цель
  intercept(px, py, speed, q) {
    const rx = q.x - px, ry = q.y - py, [ux, uy] = this.vel(q);
    const a = ux * ux + uy * uy - speed * speed, b = 2 * (rx * ux + ry * uy), c = rx * rx + ry * ry;
    let t;
    if (Math.abs(a) < 1e-6) { if (b > -1e-9) return null; t = -c / b; } // та же скорость: догнать можно, только если летит навстречу
    else {
      const D = b * b - 4 * a * c; if (D < 0) return null;
      const sq = Math.sqrt(D), t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
      t = Math.min(t1, t2); if (t <= 0) t = Math.max(t1, t2);
    }
    if (!(t > 0)) return null;
    const hx = q.x + ux * t, hy = q.y + uy * t;
    return { time: t, x: hx, y: hy, dx: (hx - px) / (speed * t), dy: (hy - py) / (speed * t) };
  },
  // Чем сильнее натяжение, тем больше энергии; максимум ~ сила броска × T (рука собирает тепло вокруг)
  shotKin(o, p) {
    const K0 = this.T * this.up('pow') * Math.pow(1 / AIM.span, 1 - p);
    if (this.isQ(o)) return { E: K0, pm: K0, speed: C_LIGHT };
    if (this.freeThrow(o)) return { E: K0, pm: K0, speed: C_LIGHT * (.5 + 1.4 * p) };
    const m = this.meff(o), E = m + K0, pm = Math.sqrt(E * E - m * m);
    return { E, pm, speed: Math.max(.3 * C_LIGHT, C_LIGHT * pm / E) };
  },
  shotS(o, kin, d, t) { return this.sqrtS({ sp: o.sp, dx: d.x, dy: d.y, p: kin.pm }, t); },
  planShot(o, dir, p) {
    const kin = this.shotKin(o, p), free = this.freeThrow(o);
    let hit = null, d = dir, best = AIM.cone, miss = null, missA = AIM.cone;
    if (!free) for (const t of this.partners(o)) {
      const td = Math.hypot(t.x - o.x, t.y - o.y) || 1;
      const direct = Math.acos(clamp((dir.x * (t.x - o.x) + dir.y * (t.y - o.y)) / td, -1, 1));
      const sol = this.intercept(o.x, o.y, kin.speed, t);
      if (!sol || sol.time > 8) { if (direct < missA) { missA = direct; miss = t; } continue; }
      // целиться можно и в саму цель — упреждение посчитается само
      const ang = Math.min(Math.acos(clamp(dir.x * sol.dx + dir.y * sol.dy, -1, 1)), direct);
      if (ang < best) { best = ang; hit = Object.assign({ target: t }, sol); }
    }
    if (hit) d = { x: hit.dx, y: hit.dy };
    else if (!free) {
      // свободное направление: вдруг кого-то заденем по пути
      let bt = 8;
      for (const t of this.partners(o)) {
        const [ux, uy] = this.vel(t), rx = t.x - o.x, ry = t.y - o.y;
        const wx = ux - d.x * kin.speed, wy = uy - d.y * kin.speed, w2 = wx * wx + wy * wy;
        if (w2 < 1e-9) continue;
        const tm = -(rx * wx + ry * wy) / w2; if (tm <= 0 || tm > bt) continue;
        const cx = rx + wx * tm, cy = ry + wy * tm;
        if (cx * cx + cy * cy < AIM.hitR * AIM.hitR * .7) { bt = tm; hit = { target: t, time: tm, x: o.x + d.x * kin.speed * tm, y: o.y + d.y * kin.speed * tm, dx: d.x, dy: d.y }; }
      }
    }
    let rs = null, outs = null, range = null;
    if (hit) {
      rs = this.shotS(o, kin, d, hit.target);
      outs = this.outcomes(o, hit.target, rs);
      range = [this.shotS(o, this.shotKin(o, 0), d, hit.target), this.shotS(o, this.shotKin(o, 1), d, hit.target)];
    }
    return { o, dir: d, p, kin, hit, rs, outs, range, free, miss: hit ? null : miss };
  },
  // Что может получиться: [[вид, доля]] по убыванию
  outcomes(a, b, rs) {
    let ch;
    if (this.isQ(a)) ch = this.channels(a, b, rs);
    else ch = this.hig > .5 && Math.abs(rs - SM.Z.m) < 14 ? [['Z', 1]] : [[SM[a.sp].kind === 'quark' ? 'gg' : 'phph', 1]];
    const s = ch.reduce((n, c) => n + c[1], 0);
    return ch.map(([k, w]) => [k, w / s]).sort((x, y) => y[1] - x[1]);
  },
  computeAim(mx, my) {
    const o = this.press.o; if (!o || o.dead) { this.aim = null; return; }
    const vx = o.x - mx, vy = o.y - my, len = Math.hypot(vx, vy);
    const p = clamp((len - .3) / AIM.maxPull, 0, 1);
    const dir = len > 1e-3 ? { x: vx / len, y: vy / len } : { x: o.dx, y: o.dy };
    this.aim = this.planShot(o, dir, p);
  },
  fling(pl) {
    const o = pl.o; if (!o || o.dead) return;
    o.dx = pl.dir.x; o.dy = pl.dir.y; o.p = pl.kin.pm; o.flung = AIM.flungT; o.byHand = true; o.cd = 0; o.fade = undefined;
    if (pl.free) o.v = pl.kin.speed;
    o.mark = pl.hit ? { x: pl.hit.x, y: pl.hit.y } : null;
    this.flings = (this.flings || 0) + 1;
    fxRing(o.x, o.y, .2, [255, 255, 255], .8, .35);
  },
  // Ввод: нажатие на частицу → прицел (тап без движения = снимок); нажатие в пустоту → сразу снимок
  input() {
    const [mx, my] = S2W(mouse.x, mouse.y);
    if (mouse.clicked) {
      mouse.clicked = false;
      const o = this.grabbable(mx, my);
      if (o) this.press = { o, x0: mouse.x, y0: mouse.y, moved: false };
      else this.snapshot();
    }
    const pr = this.press; if (!pr) return;
    if (!pr.moved && Math.hypot(mouse.x - pr.x0, mouse.y - pr.y0) > 8) { pr.moved = true; this.hint('aim', 'Время замедлено. Оттяни дальше — энергия больше. Отпусти — бросок', 3); }
    if (pr.moved) this.computeAim(mx, my);
    if (!mouse.down) {
      const aim = this.aim; this.press = null; this.aim = null;
      if (!pr.moved) this.snapshot();
      else if (aim && aim.p > .02) this.fling(aim);
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
  channels(a, b, rs) {
    const ch = [], post = this.hig > .5, kinds = [a.sp, b.sp].sort().join('');
    const ok = sp => rs >= 2 * SM[sp].m * this.hig;
    for (const sp of ['u', 'c', 't', 'd', 's', 'b', 'e', 'mu', 'ta']) {
      const s = SM[sp], quark = s.kind === 'quark';
      if (!ok(sp)) continue;
      let w = 0;
      if (kinds === 'phph') w = s.q * s.q * (quark ? 3 : 1);
      else if (kinds === 'gph') w = quark ? s.q * s.q * 3 : 0;
      else if (kinds === 'gg') w = quark ? 1 : 0;
      if (w > 0) ch.push([sp, w]);
    }
    if (post && kinds === 'phph' && rs >= 2 * SM.W.m) ch.push(['WW', 1.5]);
    if (post && kinds === 'gg' && Math.abs(rs - SM.H.m) < 15) ch.push(['H', 10]);
    return ch;
  },
  pickW(ch) { let s = 0; for (const c of ch) s += c[1]; let r = Math.random() * s; for (const c of ch) if ((r -= c[1]) <= 0) return c[0]; return ch[ch.length - 1][0]; },
  collide(a, b) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.cd = b.cd = .5;
    const ch = this.channels(a, b, rs);
    if (!ch.length) {
      if (this.hig > .5) this.hint('low', `Не хватает энергии: √s = ${fmtGeV(rs)}. Тяни рогатку сильнее`, 3.5);
      const t = a.dx; a.dx = b.dx; b.dx = t; const u = a.dy; a.dy = b.dy; b.dy = u; a.flung = b.flung = 0; return;
    }
    const c = this.pickW(ch);
    a.dead = b.dead = true;
    let made;
    if (c === 'H') { made = [this.mk('H', false, x, y, Math.random() * TAU, rs * .05)]; }
    else if (c === 'WW') { const pe = Math.sqrt(Math.max(.01, (rs / 2) ** 2 - SM.W.m ** 2)); made = this.pair('W', x, y, pe); }
    else { const m = SM[c].m * this.hig, pe = Math.sqrt(Math.max(.0001, (rs / 2) ** 2 - m * m)); made = this.pair(c, x, y, pe, a.sp === 'g' ? a.col : undefined); }
    fxFlash(x, y, .7, [255, 250, 220], .35);
    this.pairs++;
    this.event(made, x, y);
  },
  // Аннигиляция частицы и своей античастицы → кванты (или Z на резонансе)
  annihilate(a, b) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    let made;
    if (this.hig > .5 && Math.abs(rs - SM.Z.m) < 14 && SM[a.sp].kind !== 'nu') made = [this.mk('Z', false, x, y, Math.random() * TAU, rs * .05)];
    else {
      const q = SM[a.sp].kind === 'quark' ? 'g' : 'ph', an = Math.random() * TAU;
      made = [this.mk(q, false, x, y, an, rs / 2), this.mk(q, false, x, y, an + Math.PI, rs / 2)];
      for (const m of made) m.cd = .5;
    }
    fxFlash(x, y, .9, [255, 255, 255], .4);
    this.event(made, x, y);
    this.hint('ann', 'Аннигиляция: частица и античастица снова стали энергией', 3);
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
        if (r < .5) { const l = pick(['e', 'mu', 'ta']); return [L(l, !a), L(NU_OF[l], a)]; }
        return r < .75 ? [L('u', a), L('d', !a)] : [L('c', a), L('s', !a)];
      }
      case 'Z': { const f = pick(['e', 'mu', 'ta', 'ne', 'nm', 'nt', 'u', 'd', 'c', 's', 'b']); return [L(f, false), L(f, true)]; }
      case 'H': { const r = Math.random(); const f = r < .58 ? 'b' : r < .7 ? 'ta' : r < .8 ? 'c' : null;
        return f ? [L(f, false), L(f, true)] : r < .9 ? [L('ph', false), L('ph', false)] : [L('g', false), L('g', false)]; }
    }
    return null;
  },
  decay(o) {
    const pr = this.decayProducts(o); if (!pr) return;
    o.dead = true;
    const m = this.meff(o), E = Math.hypot(o.p, m), base = Math.atan2(o.dy, o.dx), n = pr.length;
    const c0 = Math.random() * 3 | 0, made = [];
    pr.forEach(([sp, an], i) => {
      const a = n === 2 && o.p < m ? base + (i ? Math.PI : 0) + randn() * .3 : base + rnd(-1.3, 1.3);
      const q = this.mk(sp, an, o.x, o.y, a, Math.max(.05, E / n * rnd(.7, 1.3)), SM[sp].kind === 'quark' ? c0 : undefined);
      q.cd = .4; made.push(q);
    });
    fxRing(o.x, o.y, .2, this.dcol(o), 1.1, .5);
    this.event(made, o.x, o.y, o);
  },
  // Событие оставляет СЛЕД: доли секунды его можно заснять (как треки в настоящем детекторе)
  event(made, x, y, parent) {
    const sps = made.map(m => m.sp); if (parent) sps.push(parent.sp);
    this.tracks.push({ x, y, t: this.t, sps, parent: parent && parent.sp, parts: made.map(m => ({ sp: m.sp, anti: m.anti, col: m.col, col2: m.col2 })) });
    if (parent && SM[parent.sp].life < 1 && Math.hypot(x - P.x, y - P.y) < this.hr() * 2)
      this.hint('fast', `${SM[parent.sp].name} распался за миг — сними след, пока не погас`, 3.5);
  },

  // ---------- действие игрока: снимок ----------
  value(sp) { const m = SM[sp].m; return m > 0 ? 1 + Math.round(Math.log10(1 + m / .001) / 2) : 1; },
  snapshot() {
    if (!G.started || this.shotCd > 0) return;
    this.shotCd = this.up('sh');
    const R0 = this.hr(), got = new Map(); // вид → где его видно (частица или след)
    for (const o of this.p) if (!o.dead && this.inHand(o)) {
      if (!got.has(o.sp)) got.set(o.sp, { x: o.x, y: o.y });
      if (o.sp === 't' && this.hig > .5 && !this.sawTop) { this.sawTop = true; msg('t-кварк с массой 173 ГэВ — тяжелее атома золота', 3.5); }
    }
    for (const tr of this.tracks) if (this.t - tr.t < TRACK_T && Math.hypot(tr.x - P.x, tr.y - P.y) < R0)
      for (const sp of tr.sps) if (!got.has(sp)) got.set(sp, { x: tr.x, y: tr.y, track: true });
    this.shotFx = .35;
    for (const tr of this.tracks) if (tr.parent && this.t - tr.t < TRACK_T && Math.hypot(tr.x - P.x, tr.y - P.y) < R0 && !this.decSeen.has(tr.parent)) {
      this.decSeen.add(tr.parent); this.kn += 5;
      this.floats.push({ x: tr.x, y: tr.y + .4, t: -.3, txt: `распад ${SM[tr.parent].sym} ✓ +5`, c: [255, 190, 120], sz: 14 });
    }
    if (!got.size) { this.floats.push({ x: P.x, y: P.y - R0, t: 0, txt: 'пусто', c: [200, 200, 210], sz: 13 }); this.hint('empty', 'Пустой снимок: в круге ничего не было. Лови момент', 2.5); return; }
    // комбо: чем больше разных частиц (не квантов) в одном кадре, тем ценнее снимок
    const kinds = [...got.keys()].filter(sp => sp !== 'ph' && sp !== 'g').length;
    const combo = kinds >= 2 ? 1 + .25 * (kinds - 1) : 1;
    let gain = 0, fresh = 0;
    for (const [sp, at] of got) {
      if (!Codex.has(sp)) {
        Codex.see(sp); gain += 10; fresh++;
        this.floats.push({ x: at.x, y: at.y, t: -.15 * fresh, txt: 'НОВОЕ: ' + SM[sp].name, c: [255, 215, 110], sz: 15 });
        continue;
      }
      if (sp === 'ph' || sp === 'g') continue;
      // повторные измерения тоже дают знания, но всё меньше: статистика насыщается
      const n = this.seenN[sp] = (this.seenN[sp] || 0) + 1, v = this.value(sp) * Math.max(.05, 1 / (1 + n / 3)) * combo;
      gain += v;
      this.floats.push({ x: at.x, y: at.y, t: 0, txt: `${SM[sp].sym} +${v.toFixed(1)}`, c: [170, 225, 255], sz: 12 });
    }
    gain = Math.round(gain * 10) / 10;
    this.kn += gain;
    if (gain > 0) this.floats.push({ x: P.x, y: P.y - R0, t: 0, txt: `+${gain} ✦` + (combo > 1 ? `  комбо ×${combo}` : ''), c: [140, 220, 255], sz: 16 });
    if (fresh) fxRing(P.x, P.y, R0, [255, 215, 110], R0 * 1.5, .7);
    if (kinds >= 2) this.hint('combo', 'Комбо! Разные частицы в одном кадре дают больше знаний', 3);
    this.checkPick();
    if (Codex.run.size >= 2) this.hint('sling', 'Зажми квант и оттяни, как рогатку. Отпусти в другой квант — родится пара', 4);
  },
  // ---------- прокачка: выбор улучшения на паузе ----------
  opts() { return UPG.filter(u => this.lvl[u.key] < u.val.length - 1); },
  checkPick() {
    const need = KN_STEPS[this.picks];
    if (G.paused || need === undefined || this.kn < need || !this.opts().length) return;
    G.paused = true;
    const el = document.getElementById('pick');
    el.querySelector('.pt').textContent = `Знания ✦ ${need}: улучши детектор`;
    el.querySelector('.pc').innerHTML = this.opts().map((u, i) => {
      const l = this.lvl[u.key];
      return `<button data-k="${u.key}"><span class="k">${i + 1}</span><span class="ic">${u.ic}</span>` +
        `<b>${u.name}</b><i>${u.fmt(u.val[l])} → ${u.fmt(u.val[l + 1])}</i><small>${u.about}</small></button>`;
    }).join('');
    el.querySelectorAll('button').forEach(b => b.onclick = () => this.choose(b.dataset.k));
    el.style.display = 'flex';
  },
  pick(i) { const u = this.opts()[i]; if (u) this.choose(u.key); },
  choose(k) {
    if (!G.paused) return;
    const u = UPG.find(x => x.key === k), l = this.lvl[k];
    this.lvl[k]++; this.picks++;
    document.getElementById('pick').style.display = 'none';
    G.paused = false;
    msg(`${u.name}: ${u.fmt(u.val[l])} → ${u.fmt(u.val[l + 1])}`, 2);
    fxRing(P.x, P.y, this.hr(), [140, 220, 255], this.hr() * 1.5, .6);
    this.checkPick();
  },
  renderUpg(el) {
    el.style.display = 'block';
    const need = KN_STEPS[this.picks], prev = KN_STEPS[this.picks - 1] || 0;
    const key = this.kn.toFixed(1) + this.picks;
    if (el.dataset.k === key) return; el.dataset.k = key;
    const w = need === undefined ? 100 : clamp((this.kn - prev) / (need - prev), 0, 1) * 100;
    el.innerHTML = `<b>Знания ✦ ${this.kn.toFixed(1)}${need === undefined ? '' : ` / ${need}`}</b>` +
      `<div class="xp"><i style="width:${w.toFixed(0)}%"></i></div>` +
      UPG.map(u => `<div class="lv">${u.ic} ${u.name} <span>${'●'.repeat(this.lvl[u.key])}${'○'.repeat(u.val.length - 1 - this.lvl[u.key])}</span></div>`).join('');
  },

  // ---------- Вселенная сама рождает то, что уже открыто ----------
  populate(dt) {
    const cnt = {};
    for (const o of this.p) if (!o.dead) cnt[o.sp] = (cnt[o.sp] || 0) + 1;
    if ((cnt.ph || 0) + (cnt.g || 0) < this.nQ() && Math.random() < dt * 40) this.spawnQuantum(false);
    for (const sp of this.ep === 3 ? [] : [...FERMIONS, 'W', 'Z', 'H']) {
      if (!Codex.has(sp)) continue;
      const s = SM[sp], base = s.kind === 'quark' || s.kind === 'lepton' ? .6 : .4, target = base * this.weight(sp);
      const have = cnt[sp] || 0;
      if (Math.random() < dt * .25 * (have === 0 ? Math.min(1, target * 1.5) : have < target - .5 ? 1 : 0)) {
        const [x, y] = this.randPos(true), pp = this.thermalP(this.T);
        if (s.kind === 'boson' && sp !== 'W') this.mk(sp, false, x, y, Math.random() * TAU, pp);
        else this.pair(sp, x, y, pp);
      } else if (have > target * 1.5 + 1) this.thin(o => o.sp === sp, have - Math.ceil(target * 1.5 + 1));
    }
    const nq = (cnt.ph || 0) + (cnt.g || 0), capQ = Math.ceil(this.nQ() * 1.1);
    if (nq > capQ) this.thin(o => this.isQ(o), nq - capQ);
  },
  // Лишние частицы уходят: за экраном — сразу, на экране — плавно гаснут, дальние от детектора первыми
  thin(pred, extra) {
    const c = this.p.filter(o => pred(o) && !o.dead && !(o.fade >= 0));
    for (const o of c) {
      if (extra <= 0) return;
      if (!onScreen(...W2S(o.x, o.y), 30)) { o.dead = true; extra--; }
    }
    c.filter(o => !o.dead && !this.inHand(o))
      .sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y))
      .slice(0, extra).forEach(o => o.fade = 1);
  },

  update(dt0, act) {
    const prevT = this.T;
    // до старта (под заставкой) мир просто живёт: без карточек, остывания и ввода
    const live = act && G.started;
    if (live) {
      // карточка эпохи — один раз, в начале
      if (this.cardFor !== this.ep) { this.cardFor = this.ep; this.showCard(); return; }
    }
    // пока игрок целится, время замедлено
    const dt = this.aim ? dt0 * this.up('slow') : dt0;
    if (live) {
      this.t += dt; this.epT += dt;
      const E = EPOCHS[this.ep], nx = EPOCHS[this.ep + 1];
      const floor = this.epDone ? (nx ? Math.min(nx.startT, this.T) * .999 : 0) : E.floor;
      const rate = this.epDone && nx ? 5 : this.ff;
      this.T = Math.max(floor, this.T * Math.exp(-dt * rate / E.tau));
      if (this.epDone && nx && (this.epGap -= dt) <= 0 && this.T <= nx.startT) this.startEpoch(this.ep + 1);
      this.tickHot(dt);
      if (this.ep === 3) this.soup(dt);
    }
    if (this.higT >= 0) { this.higT += dt; this.hig = smooth(0, 9, this.higT); }
    this.bg = mixc([44, 34, 14], [16, 12, 30], this.hig);
    const red = this.T / prevT; // расширение: импульсы краснеют вместе с температурой
    if (live) this.input();
    if (act) {
      // детектор держит позицию, пока игрок натягивает рогатку
      if (this.press) { P.vx *= .8; P.vy *= .8; } else steer(P, 11, 6, dt0);
      P.x += P.vx * dt0; P.y += P.vy * dt0;
      this.shotCd -= dt0;
      for (const f of this.floats) f.t += dt0;
      this.floats = this.floats.filter(f => f.t < 1.6);
      this.shotFx = (this.shotFx || 0) - dt0;
      this.tracks = this.tracks.filter(tr => this.t - tr.t < TRACK_T);
    }
    const WR = this.wr(), grabbed = this.press && this.press.o, ep4 = act && this.ep === 3;
    for (const o of this.p) {
      if (o.dead) continue;
      o.p *= red; o.born = Math.min(1, o.born + dt * 2); o.cd -= dt;
      if (o.flung > 0 && (o.flung -= dt) <= 0) o.mark = null;
      if (o.fade >= 0) { o.fade -= dt * 1.5; o.born = Math.min(o.born, Math.max(0, o.fade)); if (o.fade <= 0) o.dead = true; }
      if (ep4 && SM[o.sp].kind === 'quark' && !o.byHand) this.drift4(o, dt);
      const v = this.speed(o);
      o.x += o.dx * v * dt; o.y += o.dy * v * dt;
      if (this.hig > .5 && o.life < Infinity && o !== grabbed) { o.age += dt; if (o.age > o.life) { this.decay(o); continue; } }
      if (!act) continue;
      const ox = o.x - P.x, oy = o.y - P.y, d = Math.hypot(ox, oy);
      if (o.byHand && this.ep === 3) {
        if (d > viewRadius() + .5) { o.dead = true; this.ejected++; this.floats.push({ x: P.x + ox / d * (viewRadius() - 1.5), y: P.y + oy / d * (viewRadius() - 1.5), t: 0, txt: 'выброшен', c: [140, 235, 170], sz: 13 }); }
        continue;
      }
      if (d > WR) { o.x = P.x - ox * .95; o.y = P.y - oy * .95; o.born = 0; }
      if (ep4 && SM[o.sp].kind === 'quark' && o !== grabbed && d < this.hr() * (o.anti ? .55 : .75)) this.store(o);
    }
    if (act) {
      // сталкивает только рука: брошенная частица против партнёра (квант — квант, частица — своя античастица)
      for (const o of this.p) {
        if (o.dead || !(o.flung > 0) || this.freeThrow(o)) continue;
        for (const t of this.p) {
          if (t === o || t.dead || t.fade >= 0) continue;
          const q = this.isQ(o);
          if (q ? !this.isQ(t) : (t.sp !== o.sp || t.anti === o.anti)) continue;
          if ((t.x - o.x) ** 2 + (t.y - o.y) ** 2 < AIM.hitR * AIM.hitR) {
            if (q) this.collide(o, t); else this.annihilate(o, t);
            break;
          }
        }
      }
      if (this.ep === 3) this.annihilateAll();
      this.populate(dt);
      this.checkGoals();
      if (!this.advanced && this.ep === 3 && this.T < .4) {
        this.advanced = true; this.press = this.aim = null;
        // сохранённое вещество выпускаем вокруг детектора — это стартовый материал кварковой плазмы
        for (let i = 0; i < this.stock; i++) {
          const a = i / Math.max(1, this.stock) * TAU, d = rnd(1, 2);
          this.mk(i % 3 ? 'u' : 'd', false, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, a, .3).born = 1;
        }
        msg(this.stock >= STOCK_GOAL
          ? `Сохранено ${this.stock} кварков вещества. Температура ${fmtGeV(this.T)} — кварки начинают запираться в адроны`
          : `Уцелело лишь ${this.stock} кварков вещества… Но Вселенная остывает — кварки запираются в адроны`, 5);
        advance();
      }
    }
    if (this.press && this.press.o && this.press.o.dead) { this.press = null; this.aim = null; }
    this.p = this.p.filter(o => !o.dead);
    if (this.p.length > 260) this.p.splice(0, this.p.length - 260);
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
  higgsOn() {
    this.higT = 0;
    fxRing(P.x, P.y, .5, [255, 215, 90], this.wr() * 1.4, 9);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * TAU, d = rnd(2.5, 6.5);
      const h = this.mk('H', false, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, Math.random() * TAU, rnd(20, 60));
      h.life = rnd(4, 9);
    }
  },

  // ---------- эпохи ----------
  startEpoch(i) {
    this.ep = i; this.epDone = false; this.epT = 0; this.ff = 1; this.hot = []; this.hotCd = 4;
    if (i === 1) this.higgsOn();
    if (i === 3) {
      // остатки Вселенной: кварки и антикварки почти поровну — с небольшим перевесом вещества
      for (const o of this.p) if (!this.isQ(o)) o.fade = 1;
      for (let k = 0; k < 9; k++) { const [x, y] = this.randPos(false); this.pair(pick(['u', 'd']), x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5); }
      for (let k = 0; k < 4; k++) { const [x, y] = this.randPos(false); this.mk(pick(['u', 'd']), false, x, y, Math.random() * TAU, rnd(.1, .4)); }
    }
  },
  showCard() {
    const E = EPOCHS[this.ep];
    G.paused = true;
    const el = document.getElementById('epoch');
    el.innerHTML = `<div class="ek">Эпоха ${this.ep + 1} из ${EPOCHS.length} · ${E.when}</div><div class="en">${E.name}</div>` +
      `<div class="ep">${E.phys}</div><div class="et"><span>Что делать</span>${E.todo}</div>` +
      `<div class="eg"><span>Цели</span>${this.goals().map(([t]) => '○ ' + t).join('<br>')}</div>` +
      `<button>Начать · Пробел</button>`;
    el.querySelector('button').onclick = () => this.closeCard();
    el.style.display = 'flex';
  },
  closeCard() {
    const el = document.getElementById('epoch');
    if (el.style.display !== 'flex') return;
    el.style.display = 'none'; G.paused = false; this.checkPick();
  },
  // Горячая точка: мерцающее кольцо, через 1,6 с там рождается нужная тяжёлая частица
  hotTarget() {
    if (this.ep === 1 && this.hig >= 1 && this.epT > 12 && !Codex.has('W') && !Codex.has('Z')) return 'W';
    if (this.ep === 2) for (const ch of CHAINS) for (const sp of ch) if (!this.decSeen.has(sp)) return sp;
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
        this.hint('hot' + this.ep, 'Тяжёлая частица родилась! Держи её в круге и сними вспышку распада', 3);
      }
    }
    this.hot = this.hot.filter(h => h.t < 2.2);
    const sp = this.hotTarget();
    if (!sp || this.hot.length) return;
    // не плодим новых, пока в мире есть частица, чей распад мы ждём
    if (this.p.some(o => !o.dead && o.sp === sp)) { this.hotCd = Math.max(this.hotCd, 1.5); return; }
    if ((this.hotCd -= dt) > 0) return;
    this.hotCd = 5;
    const a = Math.random() * TAU, d = rnd(this.hr() + 1.2, viewRadius() * .6);
    this.hot.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, t: 0, sp });
    this.hint('hotfirst', 'Мерцающее кольцо — горячая точка: там сейчас родится тяжёлая частица. Успей туда', 4);
  },
  // Эпоха 4: из-за края приходят остатки — пары и редкие лишние кварки вещества
  soup(dt) {
    if ((this.soupCd -= dt) > 0) return;
    this.soupCd = 1.3;
    const n = this.p.filter(o => !o.dead && !this.isQ(o)).length;
    if (n > 34) return;
    const a = Math.random() * TAU, d = rnd(this.hr() + 2, viewRadius() * .95), sp = pick(['u', 'd']);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (Math.random() < .68) this.pair(sp, x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5);
    else this.mk(sp, false, x, y, Math.atan2(P.y - y, P.x - x) + rnd(-.8, .8), rnd(.1, .4));
  },
  // Эпоха 4: вещество и антивещество аннигилируют повсюду, а не только в детекторе
  annihilateAll() {
    const f = this.p.filter(o => !o.dead && !this.isQ(o) && o.cd <= 0 && SM[o.sp].kind === 'quark');
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.dead || b.dead || a.sp !== b.sp || a.anti === b.anti) continue;
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < .3) { this.annihilate(a, b); this.annN = (this.annN || 0) + 1; }
    }
  },
  store(o) {
    o.dead = true;
    if (!o.anti) {
      this.stock++;
      this.floats.push({ x: P.x, y: P.y, t: 0, txt: `+1 вещество (${this.stock})`, c: [140, 220, 255], sz: 13 });
    } else if (this.stock > 0) {
      this.stock--;
      fxFlash(P.x, P.y, this.hr(), [255, 120, 120], .5);
      this.floats.push({ x: P.x, y: P.y, t: 0, txt: `антикварк! −1 (${this.stock})`, c: [255, 130, 130], sz: 14 });
      this.hint('anti', 'Антикварк аннигилировал с сохранённым кварком. Сжимай там, где больше шаров, а не колец', 4);
    } else fxFlash(P.x, P.y, .6, [255, 255, 255], .3);
  },
  goals() {
    const n = Codex.run.size, has = sp => Codex.has(sp);
    switch (this.ep) {
      case 0: return [
        ['Определи квант — фотон или глюон', has('ph') || has('g')],
        ['Столкни два кванта рогаткой — роди пару', this.pairs > 0],
        [`Определи 6 частиц (${Math.min(n, 6)}/6)`, n >= 6]];
      case 1: return [
        ['Дождись, пока поле застынет', this.hig >= 1],
        ['Сними бозон Хиггса', has('H')],
        ['Сними переносчик слабой силы: W или Z', has('W') || has('Z')]];
      case 2: return CHAINS.map(ch => {
        const k = ch.filter(sp => this.decSeen.has(sp)).length;
        const path = [...ch, ch[0] === 't' ? 's' : 'e'].map(sp => SM[sp].sym).join(' → ');
        return [`${ch[0] === 't' ? 'Кварки' : 'Лептоны'}: сними распады ${path} (${k}/${ch.length})`, k === ch.length];
      });
      default: return [[`Сохрани ${STOCK_GOAL} кварков вещества (${this.stock}/${STOCK_GOAL})`, this.stock >= STOCK_GOAL]];
    }
  },
  checkGoals() {
    if (this.epDone || !this.goals().every(g => g[1])) return;
    this.epDone = true; this.epGap = 2.5; this.kn += 15;
    this.floats.push({ x: P.x, y: P.y - this.hr() - .5, t: 0, txt: `Эпоха «${EPOCHS[this.ep].name}» пройдена! +15 ✦`, c: [255, 215, 110], sz: 17 });
    if (this.ep < EPOCHS.length - 1) msg(`Эпоха «${EPOCHS[this.ep].name}» пройдена. Вселенная остывает дальше…`, 3);
    else msg('Вещество спасено! Можно собирать ещё или ускорить остывание (Enter)', 4);
    this.checkPick();
  },
  enterKey() { this.ff = this.ff > 1 ? 1 : 4; msg(this.ff > 1 ? 'Время ускорено ×4' : 'Обычный ход времени', 1.5); },
  cheat() {
    for (const k of Object.keys(SM)) Codex.see(k);
    this.kn += 100; this.pairs++; this.sawTop = true;
    for (const ch of CHAINS) for (const sp of ch) this.decSeen.add(sp);
    if (this.ep === 1) this.higT = 99;
    if (this.ep === 3) this.stock = STOCK_GOAL;
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
  dcol(o) { return Codex.has(o.sp) ? this.color(o) : [150, 150, 165]; },
  rad(o) { const m = SM[o.sp].m; return .13 + (.11 + .055 * Math.log10(1 + m / .001) - .13) * this.hig * (m > 0 ? 1 : 0); },
  draw(alpha) {
    const z = cam.z;
    ctx.lineCap = 'round';
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 40)) continue;
      const a = alpha * o.born, known = Codex.has(o.sp), c = this.dcol(o);
      if (this.isQ(o)) {
        // Квант — волна: чем выше энергия, тем короче период (λ ~ 1/E)
        const hot = clamp(o.p / (this.T * 6), 0, 1), L = 1.1 * z;
        const per = clamp(.42 * z * this.T * 1.5 / Math.max(o.p, 1e-9), 4, .5 * z);
        const amp = o.amp * clamp(.09 * z, 2.5, 6);
        // Волна неподвижна в пространстве: фаза привязана к мировой координате вдоль луча,
        // а частица — лишь «окно», которое скользит по ней
        const phase = o.ph - (o.x * o.dx + o.y * o.dy) * z / per * TAU;
        if (!known) {
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [c], .55 * a, 1.4);
        } else if (o.sp === 'ph') {
          const cc = mixc([255, 200, 120], [220, 235, 255], hot);
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [cc], .7 * a, 1.6);
          glow(sx, sy, 4 + 5 * hot, cc, .45 * a);
        } else {
          waveLine(sx, sy, o.dx, o.dy, L, per, amp, phase, [c, QCOL[o.col2]], .75 * a, 1.6);
          glow(sx, sy, 3 + 4 * hot, c, .4 * a);
        }
        continue;
      }
      const s = SM[o.sp], r = this.rad(o) * z;
      ctx.globalAlpha = a;
      if (s.kind === 'nu') {
        ring(sx, sy, r, c, .55, 1.2, [3, 3]);
      } else {
        if (!known) glow(sx, sy, r * 1.8, c, .15);
        else if (o.sp === 'H') glow(sx, sy, r * (3 + Math.sin(G.T * 8) * .6), c, .45);
        else if (s.kind === 'boson') glow(sx, sy, r * 2.6, c, .35);
        if (o.anti && s.kind !== 'boson') { glow(sx, sy, r * 1.8, c, .2); ring(sx, sy, r * .8, c, .95, Math.max(1.5, r * .35)); }
        else { glow(sx, sy, r * 1.8, c, .22); ball(sx, sy, r, c); }
        // массивные нестабильные «дрожат» к концу жизни
        if (o.life < Infinity && this.hig > .5) ring(sx, sy, r * 1.35, c, .5 * clamp(o.age / o.life, 0, 1), 1, [2, 3]);
      }
      if (z > 20) label(known ? this.lab(o) : '?', sx, sy + r + 7, known ? 10 : 12, known ? [255, 255, 255] : [210, 210, 225], .75, known ? 500 : 700);
      ctx.globalAlpha = 1;
    }
  },
  drawPlayer(alpha) {
    const [sx, sy] = W2S(P.x, P.y), r = this.hr() * cam.z;
    ctx.globalAlpha = alpha;
    // следы событий: гаснущие лучи к осколкам
    for (const tr of this.tracks) {
      const k = 1 - (this.t - tr.t) / TRACK_T, [tx, ty] = W2S(tr.x, tr.y);
      tr.parts.forEach((pt, i) => {
        const a = i * TAU / tr.parts.length + tr.t * 7, L = (8 + 18 * (1 - k));
        line(tx, ty, tx + Math.cos(a) * L, ty + Math.sin(a) * L, this.dcol(pt), .8 * k, 1.5);
      });
      ring(tx, ty, 4, [255, 255, 255], .7 * k, 1);
    }
    for (const h of this.hot) {
      const [hx, hy] = W2S(h.x, h.y), k = clamp(h.t / 1.6, 0, 1), pul = .5 + .5 * Math.sin(h.t * 14);
      if (!h.done) {
        ring(hx, hy, (1.2 - .9 * k) * cam.z, [255, 190, 110], .35 + .5 * pul, 2, [5, 4]);
        glow(hx, hy, .5 * cam.z, [255, 170, 90], .2 + .25 * k);
        label('горячая точка', hx, hy - 1.3 * cam.z, 11, [255, 200, 130], .8, 700);
      }
    }
    if (this.ep === 3 && this.stock > 0) {
      // запас вещества кружит внутри детектора
      for (let i = 0; i < this.stock; i++) {
        const a = G.T * 1.2 + i / this.stock * TAU, rr = r * (.35 + .1 * (i % 2));
        ball(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, 3.5, i % 3 ? QCOL[i % 3] : QCOL[0]);
      }
    }
    const ready = this.shotCd <= 0;
    let inF = 0, unk = 0;
    for (const o of this.p) if (!o.dead && this.inHand(o)) {
      inF++; if (!Codex.has(o.sp)) unk++;
      const [ox, oy] = W2S(o.x, o.y), rr = Math.max(7, this.rad(o) * cam.z + 4);
      ring(ox, oy, rr, Codex.has(o.sp) ? [255, 255, 255] : [255, 215, 110], ready ? .55 : .2, 1);
    }
    for (const tr of this.tracks) if (Math.hypot(tr.x - P.x, tr.y - P.y) < this.hr()) { inF++; if (tr.sps.some(sp => !Codex.has(sp))) unk++; }
    // вспышка затвора: уголки видоискателя
    if (this.shotFx > 0) {
      const q = r * 1.15, L = r * .35, aF = this.shotFx / .35;
      for (const [ux, uy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        line(sx + ux * q, sy + uy * q, sx + ux * (q - L), sy + uy * q, [255, 255, 255], aF, 2.5);
        line(sx + ux * q, sy + uy * q, sx + ux * q, sy + uy * (q - L), [255, 255, 255], aF, 2.5);
      }
      glow(sx, sy, r, [255, 255, 255], .12 * aF);
    }
    glow(sx, sy, r, [255, 255, 255], ready ? .05 : .02);
    ring(sx, sy, r, [255, 255, 255], ready ? .75 : .35, 1.5, [6, 6]);
    // затвор
    const ks = clamp(1 - this.shotCd / this.up('sh'), 0, 1);
    ctx.strokeStyle = rgb([200, 235, 255], .85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * ks); ctx.stroke();
    this.drawAim();
    // подсветка того, что можно схватить
    if (!this.press && mouse.has) {
      const g = this.grabbable(...S2W(mouse.x, mouse.y));
      if (g) { const [gx, gy] = W2S(g.x, g.y); ring(gx, gy, Math.max(9, this.rad(g) * cam.z + 6), [255, 255, 255], .5 + .3 * Math.sin(G.T * 8), 1.5, [3, 3]); }
    }
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    label(inF ? `в кадре ${inF}${unk ? ` · неизвестных ${unk}` : ''}` : 'детектор', sx, sy - r - 18, 11, unk ? [255, 215, 110] : [255, 255, 255], unk ? .9 : .45, unk ? 700 : 500);
    for (const f of this.floats) {
      if (f.t < 0) continue;
      const [fx, fy] = W2S(f.x, f.y);
      label(f.txt, fx, fy - 16 - f.t * 26, f.sz || 14, f.c || [140, 220, 255], clamp(1.6 - f.t, 0, 1), 700);
    }
    ctx.globalAlpha = 1;
  },
  // Прицел: резинка, траектория, точка встречи с упреждением, что может родиться
  drawAim() {
    const pl = this.aim, pr = this.press; if (!pr || !pl) return;
    const o = pl.o; if (!o || o.dead) return;
    const [ox, oy] = W2S(o.x, o.y), [fx, fy] = [mouse.x, mouse.y], z = cam.z;
    line(ox, oy, fx, fy, [255, 255, 255], .35 + .5 * pl.p, 1.5 + 3 * pl.p);
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(fx, fy, 11, 0, TAU); ctx.fill();
    ring(fx, fy, 11, [255, 255, 255], .9, 1.5);
    ring(ox, oy, Math.max(10, this.rad(o) * z + 7), [255, 255, 255], .9, 2);
    if (pl.p <= .02) return;
    const len = pl.hit ? Math.hypot(pl.hit.x - o.x, pl.hit.y - o.y) * z : pl.free ? pl.kin.speed * 3 * z : Math.max(G.W, G.H);
    ctx.setLineDash([6, 7]); line(ox, oy, ox + pl.dir.x * len, oy + pl.dir.y * len, [255, 255, 255], .75, 2); ctx.setLineDash([]);
    if (pl.free) {
      const out = Math.hypot(pl.dir.x * len, pl.dir.y * len) / z > 2.5;
      label(o.anti ? 'вышвырнуть' : 'бросить', ox + pl.dir.x * len, oy + pl.dir.y * len - 14, 12, out ? [140, 235, 170] : [255, 160, 140], .9, 700);
      return;
    }
    if (pl.hit) {
      const [hx, hy] = W2S(pl.hit.x, pl.hit.y), [tx, ty] = W2S(pl.hit.target.x, pl.hit.target.y);
      ring(hx, hy, z * (AIM.hitR + .05 * Math.sin(G.T * 8)), [255, 255, 255], .95, 2);
      ctx.setLineDash([3, 5]); line(tx, ty, hx, hy, [255, 255, 255], .4, 1.5); ctx.setLineDash([]);
      // известное — поимённо, неизвестное — одной строкой «новое»
      const known = pl.outs.filter(([k]) => this.outKnown(k)), fresh = pl.outs.filter(([k]) => !this.outKnown(k)).reduce((n, c) => n + c[1], 0);
      const parts = known.slice(0, 3).map(([k, f]) => `${this.outLab(k)} ${Math.round(f * 100)}%`);
      if (fresh > 0) parts.unshift(`новое ${Math.round(fresh * 100)}%`);
      const txt = pl.outs.length ? parts.join(' · ') : 'энергии мало — отскочат';
      label(`√s ${fmtGeV(pl.rs)}`, hx, hy - z * .6 - 30, 12, [255, 255, 255], .9, 700);
      label(txt, hx, hy - z * .6 - 14, 12, !pl.outs.length ? [255, 160, 140] : fresh > 0 ? [255, 215, 110] : [210, 230, 255], .95, 700);
    } else if (pl.miss && !pl.miss.dead) {
      // цель есть, но её не догнать: квант улетает с той же скоростью света
      const [mx, my] = W2S(pl.miss.x, pl.miss.y), r = z * .3;
      line(mx - r, my - r, mx + r, my + r, [255, 140, 120], .9, 2.5); line(mx + r, my - r, mx - r, my + r, [255, 140, 120], .9, 2.5);
      label('не догнать', mx, my + r + 14, 12, [255, 160, 140], .9, 700);
    }
  },
  outKnown(k) { return Codex.has(k === 'WW' ? 'W' : k === 'gg' ? 'g' : k === 'phph' ? 'ph' : k); },
  outLab(k) {
    const sym = sp => Codex.has(sp) ? SM[sp].sym : '?';
    if (k === 'H' || k === 'Z') return sym(k);
    if (k === 'WW') return Codex.has('W') ? 'W⁺W⁻' : '??';
    if (k === 'gg') return 'g g'; if (k === 'phph') return 'γ γ';
    return Codex.has(k) ? `${SM[k].sym}${SM[k].sym}̅` : '? ?';
  },
  // Шкала энергии столкновения (экран): пороги 2m, резонансы H и Z, стрелка — текущее √s
  overlay(alpha) {
    const pl = this.aim; if (!pl || !pl.hit || !pl.range) return;
    const [a, b] = pl.range; if (!(b > a * 1.1)) return;
    const gw = Math.min(380, G.W - 60), gx = (G.W - gw) / 2, gy = G.H - 92;
    const pos = v => gx + gw * clamp(Math.log(v / a) / Math.log(b / a), 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,9,18,.78)'; ctx.beginPath(); ctx.roundRect(gx - 14, gy - 38, gw + 28, 66, 12); ctx.fill();
    const g = ctx.createLinearGradient(gx, 0, gx + gw, 0); g.addColorStop(0, '#3b4a9a'); g.addColorStop(1, '#ffcf6b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(gx, gy - 3, gw, 6, 3); ctx.fill();
    if (this.hig < .05) label('масс ещё нет — на пару хватает любой энергии', gx + gw / 2, gy - 22, 11, [220, 220, 235], .8, 600);
    else {
      const q = this.isQ(pl.o), kinds = q ? [pl.o.sp, pl.hit.target.sp].sort().join('') : '';
      const band = (m, w, k) => {
        if (this.hig < 1 || m + w < a || m - w > b) return;
        const x1 = pos(m - w), x2 = pos(m + w);
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.roundRect(x1, gy - 6, Math.max(6, x2 - x1), 12, 4); ctx.fill();
        label(Codex.has(k) ? SM[k].sym : '?', (x1 + x2) / 2, gy - 18, 11, [255, 255, 255], 1, 700);
      };
      if (kinds === 'gg') band(SM.H.m, 15, 'H');
      if (!q) band(SM.Z.m, 14, 'Z');
      if (q) {
        const list = kinds === 'phph' ? ['u', 'c', 't', 'd', 's', 'b', 'e', 'mu', 'ta'] : ['u', 'c', 't', 'd', 's', 'b'];
        const th = list.map(sp => [sp, 2 * SM[sp].m * this.hig]);
        if (kinds === 'phph' && this.hig > .5) th.push(['W', 2 * SM.W.m]);
        let lastX = -99;
        for (const [sp, v] of th.filter(([, v]) => v > a && v < b).sort((x, y) => x[1] - y[1])) {
          const x = pos(v); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, gy - 8, 2, 16);
          const lift = x - lastX < 18 ? 34 : 18;
          label(Codex.has(sp) ? SM[sp].sym : '?', x, gy - lift, 11, Codex.has(sp) ? [255, 255, 255] : [190, 190, 205], .9, 700);
          lastX = lift === 18 ? x : -99;
        }
      }
    }
    const px = pos(pl.rs);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px, gy + 5); ctx.lineTo(px - 7, gy + 16); ctx.lineTo(px + 7, gy + 16); ctx.closePath(); ctx.fill();
    label('энергия ' + fmtGeV(pl.rs), clamp(px, gx + 40, gx + gw - 40), gy + 24, 12, [255, 255, 255], 1, 700);
    label('время замедлено', gx + gw / 2, gy - 50, 11, [255, 255, 255], .6, 600);
    ctx.globalAlpha = 1;
  },
  viewR() { return 3.5 + this.hr() * 1.9; },
  hud() {
    const T = this.T, tsec = .24 * (.001 / T) ** 2;
    const open = [...FERMIONS, 'W', 'Z', 'H'].filter(sp => Codex.has(sp) && this.weight(sp) > .02).map(sp => SM[sp].sym);
    const nm = this.p.filter(o => !o.dead && !this.isQ(o) && SM[o.sp].kind !== 'boson' && !o.anti).length;
    const na = this.p.filter(o => !o.dead && !this.isQ(o) && SM[o.sp].kind !== 'boson' && o.anti).length;
    const E = EPOCHS[this.ep];
    const title = `Эпоха ${this.ep + 1}/${EPOCHS.length} · ${E.name}`;
    const goal = E.todo + (this.epDone && this.ep < EPOCHS.length - 1 ? '<br><b>✓ Эпоха пройдена — Вселенная остывает…</b>' : '');
    return {
      title, sub: `t ≈ ${fmtSci(tsec)} с · T ≈ ${fmtGeV(T)} (${fmtSci(gevToK(T))} K)${this.ff > 1 ? ' · ×4' : ''}`,
      lines: [
        ['Открыто', `${Codex.run.size} / 17`],
        ['Знания', `${this.kn.toFixed(1)} ✦`],
        ['Рождается само', open.length ? open.join(' ') : '— ничего, кроме квантов'],
        this.ep === 3 ? ['Сохранено', `${this.stock} / ${STOCK_GOAL} кварков`] : ['Материя : анти', `${nm} : ${na}`],
        ['Снимок · бросок', `${this.shotCd > 0 ? 'затвор…' : 'готов'} · до ${fmtGeV(this.T * this.up('pow'))}`],
      ],
      goal: goal + '<br>' + this.goals().map(([t, d]) => `${d ? '✓' : '○'} ${t}`).join('<br>'),
      laws: [['Рождение пар (E = mc²)', 1], ['Электрослабая симметрия', 1 - this.hig], ['Слабые распады', this.hig], ['Остывание', 1 - Math.log(T / .4) / Math.log(T_START / .4)]],
    };
  },
};
