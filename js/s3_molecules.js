"use strict";
/* Уровень 6. Молекулы — первичный бульон.
   Физика:
   - Молекула — твёрдое тело (масса, момент инерции, вращение). Столкновения — импульсы.
   - Валентность: у атома свободные связи с фиксированной геометрией (C — 4 под 90°, N — 3 под 120°,
     O — 2 под 104,5°, H — 1). Связь возникает, если свободные связи двух атомов смотрят друг на друга
     и удар сильнее энергии активации; связь выделяет энергию (толчок соседям). Стерика: налезать нельзя.
   - Энергия активации — заметная доля рогатки: H–H слабее всего, связь с водородом сильнее, тяжёлое с тяжёлым
     (C–C, C–O, C–N) — сильнее всех; слабый бросок отскакивает. Геометрия: брошенное смотрит связью вперёд
     (доворачивает рука), но цель не доворачивается — бить надо в её свободную связь (конус у цели на прицеле).
   - Кратные связи: удар сильнее барьера на EA_N[2] — двойная (O=O, C=O, C=C), на EA_N[3] — тройная (N≡N, C≡N, C≡C),
     если у обоих атомов столько свободных связей; лишние связи берутся соседние по углу (рисунок — параллельные линии).
     Рвётся кратная по одной: O=O → O–O. Так собираются O₂, N₂, CO₂, H₂CO, HCN, C₂H₄, C₂H₂ (раньше модель их не умела).
   - Очень сильный удар рвёт связь. Насыщенная молекула больше не растёт.
   Игра — по всему полю, своего атома нет. Рогатка: зажми атом или молекулу, оттяни, отпусти;
   взятое само поворачивается свободной связью по ходу броска; цель — как лежит (её вращение пунктир учитывает).
   Цель — открывать соединения (вода, аммиак, метан…), потом учить Вселенную их делать:
   исследование «Синтез H₂O» — Вселенная сама сводит подходящие куски воды, и т. д.
   Мир без края: атомы — твои с прошлого уровня, на своих местах. Масштаб тут в M_U раз крупнее — мир растягивается,
   а камера отъезжает ровно настолько же (rescale), так что на экране ничего не прыгает. Вселенная приносит атомы из-за края кадра. */
const CHEM = {
  H: { r: 5.4, c: [235, 235, 240], s: [0], m: 1 },
  He: { r: 6, c: [220, 255, 255], s: [], m: 4 },
  Li: { r: 10.5, c: [200, 120, 255], s: [0], m: 7 },
  Be: { r: 10, c: [190, 255, 120], s: [0, 180], m: 9 },
  B: { r: 10, c: [255, 180, 170], s: [0, 120, 240], m: 11 },
  C: { r: 10, c: [95, 95, 105], s: [0, 90, 180, 270], m: 12 },
  N: { r: 9.6, c: [80, 120, 255], s: [0, 120, 240], m: 14 },
  O: { r: 9.2, c: [240, 70, 60], s: [0, 104.5], m: 16 },
  F: { r: 9, c: [150, 240, 100], s: [0], m: 19 },
  Ne: { r: 9, c: [255, 150, 120], s: [], m: 20 },
};
const TOL = .42, M_VMAX = 70, BREAK_V = 52, M_MINE = 8; // M_MINE — сколько секунд Вселенная не трогает то, что ты брал
// допуски связи при броске (рад): у брошенного — между его свободной связью и линией удара (пунктир сам доворачивает её вперёд,
// так что это «бить в лоб, а не вскользь»), у цели — её свободная связь должна смотреть на удар; без броска — TOL
const TOL_HIT = .5, TOL_AIM = .7;
// энергия активации — скорость удара по линии центров: H–H 18, связь с водородом 22, тяжёлое с тяжёлым (C–C, C–O, C–N…) 27 —
// 26 %, 31 % и 39 % полной рогатки M_VMAX; Вселенная («Синтез») бросает со скоростью M_AUTO_V — выше любого барьера, ниже BREAK_V
const EA_HH = 18, EA_XH = 22, EA_XX = 27, M_AUTO_V = 38, M_HKEEP = 6;
const EA = (/** @type {string} */ x, /** @type {string} */ y) => x === 'H' && y === 'H' ? EA_HH : x === 'H' || y === 'H' ? EA_XH : EA_XX;
// кратная связь — удар сильнее барьера ещё на столько: двойная X–X от 39, тройная от 46 (Вселенная бьёт 38 — только одинарные,
// пока её не научили соединению с кратной связью: тогда ставит нужную кратность сама, A.mb)
const EA_N = [0, 0, 12, 19], BOND_SYM = ['', '–', '=', '≡'];
/** кратность связи при ударе со скоростью vn (по линии центров): не больше свободных связей у обоих атомов @param {number} vn @param {number} ea @param {number} mx */
const bondN = (vn, ea, mx) => mx >= 3 && vn >= ea + EA_N[3] ? 3 : mx >= 2 && vn >= ea + EA_N[2] ? 2 : 1;
// органика с каркасом — связь углерода с тяжёлым атомом (C–C, C–O, C–N): шаг задания
const ORGANIC = ['CH₃OH', 'C₂H₆', 'CH₃NH₂', 'C₂H₅OH', 'H₂CO', 'HCN', 'C₂H₄', 'C₂H₂'];
const M_U = 5, M_VIEW = 78, M_DENS = .0012, M_CAP = 60, M_COST = 20;
// соединения — {f: формула, n: название, c: состав, mb: кратная связь в ней (2 — двойная, 3 — тройная)}
const COMP = [
  { f: 'H₂', n: 'водород', c: { H: 2 } }, { f: 'H₂O', n: 'вода', c: { H: 2, O: 1 } }, { f: 'NH₃', n: 'аммиак', c: { N: 1, H: 3 } },
  { f: 'CH₄', n: 'метан', c: { C: 1, H: 4 } }, { f: 'H₂O₂', n: 'перекись водорода', c: { H: 2, O: 2 } }, { f: 'CH₃OH', n: 'метанол', c: { C: 1, H: 4, O: 1 } },
  { f: 'C₂H₆', n: 'этан', c: { C: 2, H: 6 } }, { f: 'CH₃NH₂', n: 'метиламин', c: { C: 1, N: 1, H: 5 } }, { f: 'N₂H₄', n: 'гидразин', c: { N: 2, H: 4 } },
  { f: 'NH₂OH', n: 'гидроксиламин', c: { N: 1, O: 1, H: 3 } }, { f: 'C₂H₅OH', n: 'этанол', c: { C: 2, H: 6, O: 1 } },
  { f: 'O₂', n: 'кислород', c: { O: 2 }, mb: 2 }, { f: 'N₂', n: 'азот', c: { N: 2 }, mb: 3 }, { f: 'CO₂', n: 'углекислый газ', c: { C: 1, O: 2 }, mb: 2 },
  { f: 'H₂CO', n: 'формальдегид', c: { C: 1, H: 2, O: 1 }, mb: 2 }, { f: 'HCN', n: 'циановодород', c: { H: 1, C: 1, N: 1 }, mb: 3 },
  { f: 'C₂H₄', n: 'этилен', c: { C: 2, H: 4 }, mb: 2 }, { f: 'C₂H₂', n: 'ацетилен', c: { C: 2, H: 2 }, mb: 3 },
];
const ckey = c => Object.keys(c).filter(k => c[k]).sort().map(k => k + c[k]).join('');
const COMP_BY = Object.fromEntries(COMP.map(x => [ckey(x.c), x]));
const fits = (c, t) => Object.keys(c).every(k => (t[k] || 0) >= c[k]);

const Mols = {
  key: 'molecules', name: 'Молекулы', bg: [6, 24, 44], sling: true,
  // взятое поворачивают Q / E или Shift + колесо (на сенсоре оно поворачивается само по ходу броска)
  get controls() { return 'Зажать атом, оттянуть, отпустить · зажать на связи: разорвать' + (isTouch() ? '' : ' · Q / E или Shift + колесо: повернуть'); },
  gest() { return { obj: 'атом: оттянуть, отпустить в свободную связь · связь: зажать — разорвать', empty: 'тянуть: карта' }; },

  enter(prev) {
    this.m = []; this.t = 0; this.clock = 0; this.hints = []; this.lowEMsgT = 0; this.floats = []; this.tk = {}; this.banner = -1.5;
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.found = []; this.res = new Set(); this.autoCd = 1; this.doneAt = null; this.cheated = false;
    this.st = { bonds: 0, broke: 0, auto: 0, hand: 0, soup: 0, tear: 0, cut: 0 }; this.tore = false; this.paidB = 0;
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    // атомы с прошлого уровня — на своих местах: мир растягивается в M_U раз, камера — во столько же отъезжает
    if (prev && prev.ions) {
      rescale(M_U, P.x, P.y, []);
      for (const io of prev.ions) {
        const el = atSym(io.Z); if (!CHEM[el] || io.dead || io.ne < io.Z) continue; // в химию идут только нейтральные атомы: голый ион — не реагент
        const m = this.newMol(el, P.x + (io.x - P.x) * M_U, P.y + (io.y - P.y) * M_U);
        m.vx = io.vx * M_U; m.vy = io.vy * M_U; m.age = 1; m.mine = true; m.src = io;
      }
    }
    // остальное — Вселенная за краем кадра (с нуля — и в кадре); без углерода не будет ни метана, ни спиртов
    const z1 = zoomFor(this), want = popWant(M_DENS, M_CAP, z1);
    for (let k = 0; this.m.length < want && k < want * 3; k++) {
      const at = beyondPos(z1, 12, !prev); if (!at) continue;
      const mol = this.newMol(this.needEl(), at[0], at[1]); mol.vx = randn() * 4; mol.vy = randn() * 4; mol.age = 1;
    }
    this.stars = pickStars(this.starPool());
    this.sl = new Sling(this);
  },
  float(x, y, txt, c = [140, 220, 255], sz = 13) { this.floats.push({ x, y, t: 0, txt, c, sz }); Fly.from(x, y, txt); },
  // ---------- рогатка ----------
  bodies() { return this.doneAt !== null ? [] : this.m.filter(m => !m.dead && m.age > .3); },
  grabR(b) { return b.R + 14 / cam.z; },
  full() { return slingFullPx() / cam.z; },
  vmax() { return M_VMAX; },
  hold(b) { b.held = true; b.vx = b.vy = 0; b.w = 0; b.mineT = this.t; b.manRot = false; },
  launch(b, vx, vy) { b.held = false; b.vx = vx; b.vy = vy; b.thrown = 0; if (Math.hypot(vx, vy) > 1) b.hand = 3; },
  damp() { return .22; },
  // зажать на связи (долгое нажатие, резинка не оттянута) — связь рвётся: та, к середине которой нажатие ближе,
  // чем к любому атому (иначе это просто взятая молекула, а не связь). Был двойной клик — разбор дизайна: свой глагол
  // на один уровень; теперь «зажать» везде значит «взять», а держать без броска — действие с тем, что держишь.
  /** @returns {{x: number, y: number, label: string, bi: number} | null} */
  lpAt(mol, x, y) {
    if (this.doneAt !== null || mol.dead || !mol.bonds.length) return null;
    let best = null, bd = Infinity;
    mol.bonds.forEach((b, bi) => { const p = mol.wp[b[0]], q = mol.wp[b[1]], d = Math.hypot((p[0] + q[0]) / 2 - x, (p[1] + q[1]) / 2 - y); if (d < bd) { bd = d; best = bi; } });
    const da = Math.min(...mol.wp.map(p => Math.hypot(p[0] - x, p[1] - y)));
    if (best === null || bd >= da) return null;
    const [i, j] = mol.bonds[best], p = mol.wp[i], q = mol.wp[j], n = this.order(mol, i, j);
    return { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, label: n > 1 ? `ослабить ${mol.atoms[i].el}${BOND_SYM[n]}${mol.atoms[j].el} → ${BOND_SYM[n - 1]}` : `разорвать ${mol.atoms[i].el}–${mol.atoms[j].el}`, bi: best };
  },
  lp(mol, x, y) {
    const t = this.lpAt(mol, x, y); if (!t) return false;
    const bi = t.bi, [i, j] = mol.bonds[bi], s = `${mol.atoms[i].el}${BOND_SYM[this.order(mol, i, j)]}${mol.atoms[j].el}`;
    const mx = (mol.wp[i][0] + mol.wp[j][0]) / 2, my = (mol.wp[i][1] + mol.wp[j][1]) / 2;
    const other = this.splitBond(mol, bi);
    mol.mineT = this.t; if (other) other.mineT = this.t;
    this.st.tear++; this.tore = true; Tips.did('mols:tear');
    fxRing(mx, my, 1.5, [255, 170, 120], 9, .45);
    Sfx.play('snap');
    this.float(mx, my, `✂ ${s}`, [255, 170, 120], 14);
    return true;
  },
  // взятое поворачивается свободной связью по ходу броска
  orient(b, dx, dy) {
    const th = Math.atan2(dy, dx); let best = null, bd = Infinity;
    b.atoms.forEach((a, i) => a.b.forEach((x, k) => { if (x < 0) { const d = Math.abs(angDiff(th, this.slotAng(b, i, k))); if (d < bd) { bd = d; best = [i, k]; } } }));
    if (!best) return;
    b.a += angDiff(th, this.slotAng(b, best[0], best[1]));
    b.wp = b.atoms.map((_, i) => this.wpos(b, i));
  },
  // Полёт брошенного: первый касающийся атом — и что выйдет. Цель за время полёта сдвигается и поворачивается
  // (тепловое вращение, затухает) — пунктир считает её там и так, как она будет; допуски — те же, что при ударе.
  // cone — свободная связь цели, ближайшая к удару: [x, y, угол, попал ли в допуск, радиус атома]; need — скорость броска для барьера
  predict(b, vx, vy) {
    if (!b.manRot) this.orient(b, vx, vy); // сам повернул Q / E или колесом — не перебиваем
    const pts = [[b.x, b.y]], dt = 1 / 60, k = Math.exp(-this.damp(b) * dt), v0 = Math.hypot(vx, vy);
    let x = b.x, y = b.y, ux = vx, uy = vy;
    for (let n = 0; n < 240; n++) {
      x += ux * dt; y += uy * dt; ux *= k; uy *= k;
      if (n % 4 === 3) pts.push([x, y]);
      const ox = x - b.x, oy = y - b.y, t = (n + 1) * dt;
      for (const T of this.m) {
        if (T === b || T.dead) continue;
        const [Tx, Ty, Ta, Tvx, Tvy] = this.ahead(T, t);
        if (Math.hypot(Tx - x, Ty - y) > T.R + b.R) continue;
        for (let ia = 0; ia < b.atoms.length; ia++) for (let ib = 0; ib < T.atoms.length; ib++) {
          const at = T.atoms[ib], [rx, ry] = rot(at.lx, at.ly, Ta);
          const pa = [b.wp[ia][0] + ox, b.wp[ia][1] + oy], pb = [Tx + rx, Ty + ry], ra = CHEM[b.atoms[ia].el].r, rb = CHEM[at.el].r;
          const dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
          if (d >= ra + rb) continue;
          pts.push([x, y]);
          const th = Math.atan2(dy, dx), vn = ((ux - Tvx) * dx + (uy - Tvy) * dy) / (d || 1), da = Ta - T.a;
          const sa = this.slotNear(b, ia, th, TOL_HIT), sb = this.slotNear(T, ib, th + Math.PI, TOL_AIM, da);
          const ea = EA(b.atoms[ia].el, at.el), hit = [pa[0] + dx * ra / (ra + rb), pa[1] + dy * ra / (ra + rb)];
          let label, c;
          const free = this.freeSlots(T) && this.freeSlots(b), mx = Math.min(this.freeAt(b, ia), this.freeAt(T, ib), 3);
          if (free && sa >= 0 && sb >= 0 && vn >= ea) {
            const n = bondN(vn, ea, mx), bs = `${b.atoms[ia].el}${BOND_SYM[n]}${at.el}`;
            label = n === 3 ? `тройная связь ${bs}` : n === 2 ? `двойная связь ${bs}` : `связь ${bs}`; c = n > 1 ? [130, 220, 255] : [120, 240, 160];
          }
          else if (vn > BREAK_V && (b.bonds.length || T.bonds.length)) { label = 'порвёт связь'; c = [255, 90, 80]; }
          else if (!free) { label = 'насыщена, отскочит'; c = [170, 175, 195]; }
          else if (sb < 0) { label = 'мимо свободной связи цели'; c = [200, 205, 225]; }
          else if (sa < 0) { label = 'вскользь: бить в лоб'; c = [200, 205, 225]; }
          else { label = 'слабо: барьер, оттянуть сильнее'; c = [255, 200, 110]; }
          const near = this.slotNear(T, ib, th + Math.PI, 9, da), cone = near >= 0 && free ? [pb[0], pb[1], this.slotAng(T, ib, near) + da, sb >= 0, rb] : null;
          const sc = vn > .1 ? v0 / vn : Infinity, needN = free && sa >= 0 && sb >= 0 ? [2, 3].filter(n => n <= mx).map(n => (ea + EA_N[n]) * sc) : [];
          return { pts, x: hit[0], y: hit[1], label, c, hit: true, cone, need: ea * sc, needN };
        }
      }
    }
    return { pts, x, y, label: '', c: [200, 205, 225] };
  },
  // где тело будет через t с: [x, y, угол, vx, vy] — без броска скорость и вращение затухают (.3/с), брошенное летит с damp()
  ahead(T, t) {
    if (T.held) return [T.x, T.y, T.a, 0, 0];
    const fly = (T.thrown ?? 9) < 3, r = fly ? this.damp(T) : .3, e = Math.exp(-r * t), f = (1 - e) / r;
    return [T.x + T.vx * f, T.y + T.vy * f, T.a + T.w * (fly ? t : f), T.vx * e, T.vy * e];
  },
  slotNear(mol, i, th, tol, da = 0) {
    const a = mol.atoms[i]; let best = -1, bd = tol;
    for (let k = 0; k < a.b.length; k++) if (a.b[k] < 0) { const d = Math.abs(angDiff(this.slotAng(mol, i, k) + da, th)); if (d < bd) { bd = d; best = k; } }
    return best;
  },
  newMol(el, x, y) {
    const d = CHEM[el];
    const mol = { atoms: [{ el, lx: 0, ly: 0, base: Math.random() * TAU, b: d.s.map(() => -1) }], bonds: [], x, y, a: 0, vx: 0, vy: 0, w: randn() * .5, m: 1, I: 1, R: d.r, age: 0, dead: false, wp: null, hand: 0, auto: 0, mine: false, src: null };
    this.recompute(mol); this.m.push(mol); return mol;
  },
  // какой атом принести: чего из нужного в кадре меньше всего (по доле от нужного) — то и несёт; иначе обычная смесь.
  // По доле, а не по порядку: иначе C, N, O всегда шли первыми, и недостроенные каркасы оставались без водорода
  needEl() {
    const one = (/** @type {string} */ el) => this.m.filter(m => m.atoms.length === 1 && m.atoms[0].el === el && inView(m.x, m.y, 20)).length;
    let best = null, bq = 1;
    for (const [el, n] of /** @type {[string, number][]} */ ([['C', 2], ['N', 2], ['O', 3], ['H', 10]])) { const q = one(el) / n; if (q < bq) { bq = q; best = el; } }
    return best || this.mixEl();
  },
  // обычная смесь Вселенной (для ободка за краем: недостачу в кадре он не восполняет)
  mixEl() { const r = Math.random(); return r < .6 ? 'H' : r < .75 ? 'O' : r < .88 ? 'C' : 'N'; },
  // Вселенная вокруг: не хватает в кадре — одиночный атом из-за края; чужое вдали растворяется
  tide(dt) {
    for (const m of this.m) if (!m.mine && !m.held && !(m.hand > 0) && farOff(m, 1.6)) m.dead = true;
    this.m = this.m.filter(m => !m.dead);
    if (this.doneAt !== null) return;
    const have = this.m.filter(m => inView(m.x, m.y, 10)).length;
    if (have < popWant(M_DENS, M_CAP) && Math.random() < dt * 3) {
      const r = rimPos(14), mol = this.newMol(this.needEl(), r.x, r.y), sp = rnd(4, 8);
      mol.vx = r.nx * sp + randn() * 3; mol.vy = r.ny * sp + randn() * 3; mol.age = 0;
    }
    haloFill(this.m, M_DENS, M_CAP, dt, (x, y) => { const mol = this.newMol(this.mixEl(), x, y); mol.vx = randn() * 3; mol.vy = randn() * 3; mol.age = 0; }, 2);
  },
  recompute(mol) {
    let M = 0, cx = 0, cy = 0;
    for (const a of mol.atoms) { const mm = CHEM[a.el].m; M += mm; cx += a.lx * mm; cy += a.ly * mm; }
    cx /= M; cy /= M;
    for (const a of mol.atoms) { a.lx -= cx; a.ly -= cy; }
    const [ox, oy] = rot(cx, cy, mol.a); mol.x += ox; mol.y += oy;
    let I = 0, R = 0;
    for (const a of mol.atoms) { const mm = CHEM[a.el].m, r = CHEM[a.el].r; I += mm * (a.lx * a.lx + a.ly * a.ly) + .5 * mm * r * r; R = Math.max(R, Math.hypot(a.lx, a.ly) + r); }
    mol.m = M; mol.I = I; mol.R = R;
    mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i));
  },
  wpos(mol, i) { const a = mol.atoms[i], [x, y] = rot(a.lx, a.ly, mol.a); return [mol.x + x, mol.y + y]; },
  slotAng(mol, i, k) { const a = mol.atoms[i]; return mol.a + a.base + CHEM[a.el].s[k] * DEG; },
  freeSlots(mol) { let n = 0; for (const a of mol.atoms) for (const b of a.b) if (b < 0) n++; return n; },
  freeAt(mol, i) { return mol.atoms[i].b.filter(x => x < 0).length; },
  /** кратность связи между атомами i и j @param {any} mol @param {number} i @param {number} j */
  order(mol, i, j) { return mol.bonds.filter(b => (b[0] === i && b[1] === j) || (b[0] === j && b[1] === i)).length; },
  counts(mol) { const c = {}; for (const a of mol.atoms) c[a.el] = (c[a.el] || 0) + 1; return c; },
  formula(mol) { // порядок Хилла: C, H, затем по алфавиту
    const c = this.counts(mol), keys = Object.keys(c).sort((a, b) => {
      const o = k => k === 'C' ? 0 : k === 'H' && c.C ? 1 : 2; return o(a) - o(b) || a.localeCompare(b);
    });
    return keys.map(k => k + (c[k] > 1 ? sub(c[k]) : '')).join('');
  },
  bestSlot(mol, i, th, tol = TOL) {
    const a = mol.atoms[i]; let best = -1, bd = tol;
    for (let k = 0; k < a.b.length; k++) if (a.b[k] < 0) { const d = Math.abs(angDiff(this.slotAng(mol, i, k), th)); if (d < bd) { bd = d; best = k; } }
    return best;
  },
  // связь возникла: насыщенная молекула из каталога — открытие
  afterMerge(host, src, x, y) {
    host.hand = 0; host.auto = 0;
    if (src === 'hand') {
      host.mine = true; this.st.bonds++;
      // очки — только за чистый прирост связей: «связал — разорвал (двойным кликом или ударом) — связал» не фармит
      if (this.st.bonds - this.st.cut > this.paidB) { this.paidB = this.st.bonds - this.st.cut; addScore(40); }
      if (this.st.bonds === 1) tipMsg('mols:bond', 'Ковалентная связь: общая пара электронов');
    }
    if (this.freeSlots(host)) return;
    const cp = COMP_BY[ckey(this.counts(host))];
    if (!cp) return;
    // C₂H₆O — это и этанол CH₃–CH₂–OH, и диметиловый эфир CH₃–O–CH₃: у этанола углероды связаны между собой
    if (cp.f === 'C₂H₅OH' && !host.bonds.some(b => host.atoms[b[0]].el === 'C' && host.atoms[b[1]].el === 'C')) {
      this.float(x, y - 10, 'CH₃–O–CH₃ · эфир, не спирт', [200, 205, 220], 13); return;
    }
    if (src === 'auto') { this.st.auto++; Uni.pay(this, this.res.has(cp.f) && !Uni.off(this, cp.f) ? cp.f : [...this.res].find(k => !Uni.off(this, k)) || cp.f, 2); } else if (src === 'hand') this.st.hand++;
    if (src === 'auto' || (src === 'hand' && this.res.size)) { this.st.soup++; host.soup = true; } // Вселенная учится — бульон варит она и ты вместе
    Codex.note('m:' + cp.f);
    if (!this.found.includes(cp.f)) {
      this.found.push(cp.f); this.kn += 15; Sfx.play('fresh');
      this.float(x, y - 14, `НОВОЕ: ${cp.f} · ${cp.n} +15 ✦`, [255, 215, 110], 16);
      fxRing(x, y, 6, GOLD, 40, .9);
    } else this.float(x, y - 10, cp.f, src === 'auto' ? [150, 205, 255] : [140, 235, 170], 13);
  },

  // ---------- реакции ----------
  merge(A, ia, sa, B, ib, sb, src, n = 1) {
    let host = A, ih = ia, sh = sa, gu = B, ig = ib, sg = sb;
    if (B.m > A.m) { host = B; ih = ib; sh = sb; gu = A; ig = ia; sg = sa; }
    const ha = host.atoms[ih], ga = gu.atoms[ig];
    const L = (CHEM[ha.el].r + CHEM[ga.el].r) * .78;
    const ph = this.wpos(host, ih), th = this.slotAng(host, ih, sh);
    const tx = ph[0] + Math.cos(th) * L, ty = ph[1] + Math.sin(th) * L;
    const dA = angDiff(th + Math.PI, this.slotAng(gu, ig, sg));
    const pg = this.wpos(gu, ig);
    const np = gu.atoms.map((_, k) => { const p = this.wpos(gu, k), r = rot(p[0] - pg[0], p[1] - pg[1], dA); return [tx + r[0], ty + r[1]]; });
    // стерика: новые атомы не должны налезать на старые
    for (let k = 0; k < np.length; k++) for (let h = 0; h < host.atoms.length; h++) {
      if (k === ig && h === ih) continue;
      const p2 = this.wpos(host, h);
      if (Math.hypot(np[k][0] - p2[0], np[k][1] - p2[1]) < .8 * (CHEM[gu.atoms[k].el].r + CHEM[host.atoms[h].el].r)) return false;
    }
    const off = host.atoms.length, M = host.m + gu.m;
    const vx = (host.vx * host.m + gu.vx * gu.m) / M, vy = (host.vy * host.m + gu.vy * gu.m) / M, Lw = host.I * host.w + gu.I * gu.w;
    gu.atoms.forEach((at, k) => {
      const [lx, ly] = rot(np[k][0] - host.x, np[k][1] - host.y, -host.a);
      host.atoms.push({ el: at.el, lx, ly, base: gu.a + at.base + dA - host.a, b: at.b.map(x => x < 0 ? -1 : x + off) });
    });
    for (const bd of gu.bonds) host.bonds.push([bd[0] + off, bd[1] + off, bd[2], bd[3]]);
    host.bonds.push([ih, off + ig, sh, sg]);
    host.atoms[ih].b[sh] = off + ig; host.atoms[off + ig].b[sg] = ih;
    // кратная связь: ещё n − 1 пар свободных связей — у каждого атома соседняя по углу к первой
    const near = (/** @type {any} */ at, /** @type {number} */ s0) => { const S = CHEM[at.el].s; let best = -1, bd = Infinity;
      at.b.forEach((x, k) => { if (x < 0) { const d = Math.abs(angDiff(S[k] * DEG, S[s0] * DEG)); if (d < bd) { bd = d; best = k; } } }); return best; };
    for (let k = 1; k < n; k++) {
      const s1 = near(host.atoms[ih], sh), s2 = near(host.atoms[off + ig], sg); if (s1 < 0 || s2 < 0) break;
      host.bonds.push([ih, off + ig, s1, s2]); host.atoms[ih].b[s1] = off + ig; host.atoms[off + ig].b[s2] = ih;
    }
    this.recompute(host);
    host.vx = vx; host.vy = vy; host.w = Lw / host.I;
    gu.dead = true;
    fxFlash(tx, ty, 8, [255, 255, 220], .5); fxRing(tx, ty, 4, [200, 240, 255], 22, .6);
    // экзотермика: выделившаяся энергия толкает соседей
    for (const o of this.m) {
      if (o === host || o.dead) continue;
      const dx = o.x - tx, dy = o.y - ty, d = Math.hypot(dx, dy);
      if (d < 45 && d > 0) { o.vx += dx / d * 6 * (1 - d / 45); o.vy += dy / d * 6 * (1 - d / 45); }
    }
    this.afterMerge(host, src, tx, ty);
    return true;
  },
  splitBond(mol, bi) {
    const [i, j, si, sj] = mol.bonds[bi];
    if (mol.mine) this.st.cut++; // твоё разорвано — связь снова не оплачивается
    if (mol.soup) { mol.soup = false; this.st.soup = Math.max(0, this.st.soup - 1); } // разобрал сваренное — в бульоне его больше нет
    mol.bonds.splice(bi, 1); mol.atoms[i].b[si] = -1; mol.atoms[j].b[sj] = -1;
    const comp = new Set([i]), st = [i];
    while (st.length) { const u = st.pop(); for (const v of mol.atoms[u].b) if (v >= 0 && !comp.has(v)) { comp.add(v); st.push(v); } }
    const mid = [(mol.wp[i][0] + mol.wp[j][0]) / 2, (mol.wp[i][1] + mol.wp[j][1]) / 2];
    fxFlash(mid[0], mid[1], 7, [255, 170, 120], .5);
    if (comp.has(j)) { this.recompute(mol); return null; } // был цикл — молекула цела
    const keep = comp.size * 2 >= mol.atoms.length ? comp : null;
    const inKeep = k => keep ? keep.has(k) : !comp.has(k);
    const idxK = [], idxO = [];
    mol.atoms.forEach((_, k) => (inKeep(k) ? idxK : idxO).push(k));
    const mK = new Map(idxK.map((o, n) => [o, n])), mO = new Map(idxO.map((o, n) => [o, n]));
    const remap = (a, mp) => ({ ...a, b: a.b.map(x => x < 0 ? -1 : mp.get(x)) });
    const other = { atoms: idxO.map(o => remap(mol.atoms[o], mO)), bonds: mol.bonds.filter(b => mO.has(b[0])).map(b => [mO.get(b[0]), mO.get(b[1]), b[2], b[3]]),
      x: mol.x, y: mol.y, a: mol.a, vx: mol.vx, vy: mol.vy, w: mol.w, m: 1, I: 1, R: 1, age: 1, dead: false, wp: null, hand: 0, auto: 0, mine: mol.mine, src: null };
    mol.atoms = idxK.map(o => remap(mol.atoms[o], mK));
    mol.bonds = mol.bonds.filter(b => mK.has(b[0])).map(b => [mK.get(b[0]), mK.get(b[1]), b[2], b[3]]);
    this.recompute(mol); this.recompute(other);
    const dx = other.x - mol.x, dy = other.y - mol.y, d = Math.hypot(dx, dy) || 1;
    other.vx += dx / d * 6; other.vy += dy / d * 6; mol.vx -= dx / d * 6 * other.m / mol.m; mol.vy -= dy / d * 6 * other.m / mol.m;
    this.m.push(other);
    return other;
  },
  breakAt(mol, i) {
    const bi = mol.bonds.findIndex(b => b[0] === i || b[1] === i);
    if (bi < 0) return false;
    this.splitBond(mol, bi); return true;
  },
  contact(A, ia, B, ib) {
    const pa = A.wp[ia], pb = B.wp[ib], ra = CHEM[A.atoms[ia].el].r, rb = CHEM[B.atoms[ib].el].r;
    let nx = pb[0] - pa[0], ny = pb[1] - pa[1]; const d = Math.hypot(nx, ny) || 1e-6; nx /= d; ny /= d;
    const cx = pa[0] + nx * ra, cy = pa[1] + ny * ra;
    const rAx = cx - A.x, rAy = cy - A.y, rBx = cx - B.x, rBy = cy - B.y;
    const vAx = A.vx - A.w * rAy, vAy = A.vy + A.w * rAx, vBx = B.vx - B.w * rBy, vBy = B.vy + B.w * rBx;
    const vn = (vBx - vAx) * nx + (vBy - vAy) * ny;
    if (vn < 0) {
      const imp = -vn, th = Math.atan2(ny, nx);
      // брошенный смотрит связью вперёд — бить в лоб (TOL_HIT); цель не доворачивается — удар в её свободную связь (TOL_AIM); как у пунктира
      const tA = A.hand > 0 || A.auto > 0, tB = B.hand > 0 || B.auto > 0, any = tA || tB;
      const sa = this.bestSlot(A, ia, th, tA ? TOL_HIT : any ? TOL_AIM : TOL), sb = this.bestSlot(B, ib, th + Math.PI, tB ? TOL_HIT : any ? TOL_AIM : TOL);
      if (sa >= 0 && sb >= 0) {
        const src = A.hand > 0 || B.hand > 0 ? 'hand' : A.auto > 0 || B.auto > 0 ? 'auto' : null;
        // сами по себе (без броска) связи не возникают — иначе тепловая толчея лепит огромные цепи и съедает весь углерод
        const ea = EA(A.atoms[ia].el, B.atoms[ib].el);
        const mx = Math.min(this.freeAt(A, ia), this.freeAt(B, ib), 3), want = src === 'auto' ? Math.max(A.auto > 0 ? A.mb || 1 : 1, B.auto > 0 ? B.mb || 1 : 1) : 1;
        if (src && imp >= ea) { if (this.merge(A, ia, sa, B, ib, sb, src, Math.min(mx, Math.max(bondN(imp, ea, mx), want)))) return true; }
        else if (src === 'hand' && this.lowEMsgT <= 0) { this.lowEMsgT = 5; tipMsg('mols:lowE', 'Барьер: связь рождается только от удара сильнее энергии активации'); }
      }
      if (imp > BREAK_V && (A.bonds.length || B.bonds.length)) {
        const victim = A.bonds.length && (!B.bonds.length || Math.random() < .5) ? [A, ia] : [B, ib];
        if (this.breakAt(victim[0], victim[1])) return true;
      }
      const rnA = rAx * ny - rAy * nx, rnB = rBx * ny - rBy * nx;
      const jn = -(1 + .5) * vn / (1 / A.m + 1 / B.m + rnA * rnA / A.I + rnB * rnB / B.I);
      A.vx -= jn * nx / A.m; A.vy -= jn * ny / A.m; A.w -= jn * rnA / A.I;
      B.vx += jn * nx / B.m; B.vy += jn * ny / B.m; B.w += jn * rnB / B.I;
    }
    const ov = ra + rb - d;
    if (ov > 0) {
      const tm = A.m + B.m;
      A.x -= nx * ov * B.m / tm; A.y -= ny * ov * B.m / tm; B.x += nx * ov * A.m / tm; B.y += ny * ov * A.m / tm;
      A.wp = A.atoms.map((_, i) => this.wpos(A, i)); B.wp = B.atoms.map((_, i) => this.wpos(B, i));
    }
    return false;
  },
  collide() {
    const ms = this.m;
    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const A = ms[i], B = ms[j];
        if (A.dead || B.dead) continue;
        const dx = B.x - A.x, dy = B.y - A.y, rr = A.R + B.R;
        if (dx * dx + dy * dy > rr * rr) continue;
        outer: for (let ia = 0; ia < A.atoms.length; ia++) for (let ib = 0; ib < B.atoms.length; ib++) {
          const pa = A.wp[ia], pb = B.wp[ib], s = CHEM[A.atoms[ia].el].r + CHEM[B.atoms[ib].el].r;
          const ex = pb[0] - pa[0], ey = pb[1] - pa[1];
          if (ex * ex + ey * ey >= s * s) continue;
          if (this.contact(A, ia, B, ib)) break outer;
        }
      }
    }
    this.m = this.m.filter(m => !m.dead);
  },
  // «магнетизм» свободных связей — только у бросков Вселенной (её «Синтез» доворачивает почти совпавшие валентности);
  // у твоего броска — лишь пунктир-подсказка: геометрию решает прицел, а не притяжение
  magnet(dt) {
    this.hints = [];
    for (const pm of this.m) {
      if (pm.dead || pm.held || !(pm.hand > 0 || pm.auto > 0)) continue;
      for (const o of this.m) {
        if (o === pm || o.dead || o.held) continue;
        if (Math.hypot(o.x - pm.x, o.y - pm.y) > pm.R + o.R + 25) continue;
        // для пары атомов — только ближайшая по углу свободная связь каждого: если тянуть все, у углерода (4 связи под 90°)
        // соседние тянут в разные стороны и атом встаёт повёрнутым на 30–45° — удар Вселенной в углерод отскакивал
        const nearest = (/** @type {any} */ mol, /** @type {number} */ i, /** @type {number} */ phi) => { let best = null, bd = Infinity;
          mol.atoms[i].b.forEach((x, k) => { if (x < 0) { const d = angDiff(this.slotAng(mol, i, k), phi); if (Math.abs(d) < Math.abs(bd)) { bd = d; best = k; } } }); return best === null ? null : bd; };
        for (let i = 0; i < pm.atoms.length; i++) {
          if (!pm.atoms[i].b.some(x => x < 0)) continue;
          const pa = pm.wp[i], ra = CHEM[pm.atoms[i].el].r;
          for (let j = 0; j < o.atoms.length; j++) {
            if (!o.atoms[j].b.some(x => x < 0)) continue;
            const pb = o.wp[j], rb = CHEM[o.atoms[j].el].r, dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
            if (d > (ra + rb) * 2.2) continue;
            const phi = Math.atan2(dy, dx), dA = nearest(pm, i, phi), dB = nearest(o, j, phi + Math.PI);
            if (dA === null || dB === null || Math.abs(dA) > 1 || Math.abs(dB) > 1.6) continue;
            const th = phi + dA;
            if (!(pm.hand > 0)) { o.a -= dB * 3 * dt; pm.a -= dA * 2 * dt; }
            else this.hints.push([pa[0] + Math.cos(th) * ra * 1.05, pa[1] + Math.sin(th) * ra * 1.05, pb[0], pb[1], Math.abs(dA) < TOL_HIT && Math.abs(dB) < TOL_AIM]);
          }
        }
      }
    }
  },

  // ---------- Вселенная сама сводит куски открытого («Синтез …») ----------
  autoChem(dt) {
    const goals = COMP.filter(x => this.res.has(x.f) && !Uni.off(this, x.f)); // выключенный «Синтез» Вселенная не варит
    if (!goals.length || (this.autoCd -= dt) > 0) return;
    this.autoCd = 2.4; // не чаще — у игрока есть время собрать своё
    const f = this.m.filter(m => !m.dead && !m.held && m.age > 1 && !(m.hand > 0) && !(m.auto > 0) && !(this.t - (m.mineT ?? -99) < M_MINE) && this.freeSlots(m) && inRef(m.x, m.y, -5));
    // последний водород — игроку: свободных атомов H в кадре не больше M_HKEEP — Вселенная их не берёт (иначе «Синтез H₂» съедал весь
    // водород, и недостроенные каркасы оставались голыми)
    const isH = (/** @type {any} */ m) => m.atoms.length === 1 && m.atoms[0].el === 'H', hLow = this.m.filter(m => !m.dead && isH(m) && inView(m.x, m.y, 10)).length <= M_HKEEP;
    let best = null, bs = -Infinity;
    for (const g of goals) for (let i = 0; i < f.length; i++) {
      const ca = this.counts(f[i]); if (!fits(ca, g.c) || (hLow && isH(f[i]))) continue;
      for (let j = i + 1; j < f.length; j++) {
        if (hLow && isH(f[j])) continue;
        const cb = this.counts(f[j]), sum = { ...ca }; for (const k in cb) sum[k] = (sum[k] || 0) + cb[k];
        if (!fits(sum, g.c)) continue;
        // не цель целиком — после связи должна остаться свободная валентность: H + H под «воду» дало бы тупиковый H₂
        if (ckey(sum) !== ckey(g.c) && this.freeSlots(f[i]) + this.freeSlots(f[j]) - 2 < 1) continue;
        const d = Math.hypot(f[i].x - f[j].x, f[i].y - f[j].y); if (d > 70) continue;
        const sc = f[i].atoms.length + f[j].atoms.length + (ckey(sum) === ckey(g.c) ? 4 : 0) - d / 20 + Math.random();
        if (sc > bs) { bs = sc; best = [f[i], f[j], d, g.mb || 1]; }
      }
    }
    if (!best) return;
    let [A, B, d, mb] = best; if (A.m > B.m) [A, B] = [B, A];
    const dx = B.x - A.x, dy = B.y - A.y;
    this.orient(A, dx, dy); this.orient(B, -dx, -dy); A.w = B.w = 0;
    // соединение с кратной связью — Вселенная знает, что варит (как доворачивает «магнитом»): ставит нужную кратность (mb)
    const v = M_AUTO_V; d = d || 1; A.mb = B.mb = mb; A.vx = B.vx + dx / d * v; A.vy = B.vy + dy / d * v; A.thrown = 0; A.auto = 3; B.auto = 3;
  },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt; this.lowEMsgT -= dt;
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.8);
    if (live && this.doneAt === null) {
      this.sl.update();
      const rm = this.sl.held; // Q / E поворачивают взятое (само оно и так поворачивается по ходу броска)
      if (rm) { let wt = 0; if (keys.has('KeyQ')) wt -= 2.6; if (keys.has('KeyE')) wt += 2.6; rm.w = wt; if (wt) rm.manRot = true; } // повернул сам — прицел больше не доворачивает
    }
    for (const mol of this.m) {
      mol.age += dt; mol.thrown = (mol.thrown ?? 9) + dt; mol.hand -= dt; mol.auto -= dt;
      if (mol.held) { mol.vx = mol.vy = 0; mol.a += mol.w * dt; mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i)); continue; }
      if (mol.thrown < 3) { const dr = Math.exp(-dt * this.damp(mol)); mol.vx *= dr; mol.vy *= dr; } // брошенный летит, как показал пунктир
      else {
        const j = 3.2 * Math.sqrt(dt); mol.vx += randn() * j; mol.vy += randn() * j; mol.w += randn() * .3 * Math.sqrt(dt); // вращение тихое: цель на прицеле не убегает
        const dr = Math.exp(-dt * .3); mol.vx *= dr; mol.vy *= dr; mol.w *= dr;
      }
      mol.x += mol.vx * dt; mol.y += mol.vy * dt; mol.a += mol.w * dt;
      mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i));
      if (mol.src && G.prev) { const [px, py] = toPrev(mol.x, mol.y); mol.src.x = px; mol.src.y = py; mol.src.vx = mol.src.vy = 0; } // атом прошлого уровня гаснет там же
    }
    if (act) this.magnet(dt);
    this.collide();
    if (!live) return;
    if (this.doneAt === null) {
      this.autoChem(dt);
      this.tide(dt);
      this.tickStars(false);
      if (this.steps().every(s => s.d)) {
        this.doneAt = this.clock; this.tickStars(true);
        Tally.show(this); // как у остальных уровней: бонус уровня, доля Вселенной, рекорд
        endGame(`Первичный бульон готов: ${this.found.join(', ')}. Следующая ступень: органика (скоро).`);
      }
    }
  },
  // Shift + колесо — поворот взятого шагом (сразу в угол: скорость вращения Q / E обнуляет каждый кадр)
  wheel(dy) { if (this.sl.held && dy) { this.sl.held.a += Math.sign(dy) * .26; this.sl.held.manRot = true; } },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.doneAt !== null ? [] : COMP.filter(x => this.found.includes(x.f) && !this.res.has(x.f)).slice(0, 4).map(x => ({ ic: x.f, name: 'Синтез', about: x.n, c: this.mCost(), f: x.f })); },
  // каждый следующий «Синтез» дороже на четверть: научённое приносит ✦ само
  mCost() { return Math.round(M_COST * (1 + .25 * this.res.size) / 5) * 5; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 10, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.res.add(it.f); this.autoCd = .3; Sfx.play('upgrade'); Uni.learn(this, it.f, it.f, it.about, UNI_LVL);
    this.float(P.x, P.y - 10, `Синтез ${it.f}: теперь это закон Вселенной`, GOLD, 16);
  },
  renderShop(el) {
    const items = this.shopItems();
    if (!G.started || !items.length) { el.style.display = 'none'; return; }
    const b = this.bal(), pri = this.res.size < 2 && this.found.length >= 4;
    const html = items.map((r, k) => `<button data-i="${k}" class="res ${k === 0 && pri ? 'pri ' : 'sec '}${b >= r.c ? 'ok' : 'no'}">${k === 0 && pri ? '<u>для задания</u>' : ''}<span class="k">${k + 1}</span>` +
      `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${r.about}</i><em>${r.c} ✦</em></button>`).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    if (!el.onclick) el.onclick = e => { const bt = e.target.closest('button'); if (bt && G.stage.buy) G.stage.buy(+bt.dataset.i); };
    el.style.display = 'flex';
  },

  // ---------- задание ----------
  steps() {
    const touch = isTouch(), fd = this.found;
    return [
      { t: 'Связать два атома', h: 'зажать атом, оттянуть и отпустить в другой', s: 'первая связь', d: this.st.bonds > 0 },
      { t: 'Собрать воду', h: 'кислороду нужны два водорода', s: 'вода H₂O', d: fd.includes('H₂O') },
      { t: 'Открыть 4 соединения', h: 'аммиак NH₃, метан CH₄, перекись H₂O₂…', items: fd.slice(0, 6).map(f => [f, true]), p: [Math.min(fd.length, 4), 4], s: '4 соединения', d: fd.length >= 4 },
      { t: 'Собрать органику: связь C–C, C–O или C–N', h: 'метанол CH₃OH, этан C₂H₆, метиламин CH₃NH₂; тяжёлое в тяжёлое — бросок сильнее', s: 'органика', d: ORGANIC.some(f => fd.includes(f)) },
      { t: 'Сформировать законы', h: `${touch ? 'в лавке' : 'клавиши 1–4'}: «Синтез …»`, p: [Math.min(this.res.size, 2), 2], s: 'законы сформированы', d: this.res.size >= 2 },
      { t: 'Первичный бульон', h: 'Вселенная собирает открытое, рогатка ей помогает', p: [Math.min(this.st.soup, 10), 10], s: 'бульон готов', d: this.st.soup >= 10 },
    ];
  },
  starPool() {
    return [
      { t: 'открыть метан', ok: () => this.found.includes('CH₄') },
      { t: 'открыть аммиак', ok: () => this.found.includes('NH₃') },
      { t: 'открыть 6 соединений', ok: () => this.found.length >= 6 },
      { t: 'открыть этанол', ok: () => this.found.includes('C₂H₅OH') },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 10, '★ +10 ✦', [255, 215, 110], 17); }); },
  tally() { return { name: 'Молекулы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['соединений открыто', this.found.length], ['собрано рогаткой', this.st.hand], ['собрано Вселенной', this.st.auto]], auto: [this.st.auto, this.st.auto + this.st.hand], stars: this.stars }; },
  cheat() { this.cheated = true; for (const x of [...COMP.slice(0, 4), COMP_BY[ckey({ C: 1, H: 4, O: 1 })]]) if (!this.found.includes(x.f)) this.found.push(x.f); this.st.bonds++; this.res.add('H₂O'); this.res.add('H₂'); this.st.auto = this.st.soup = 10; },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    for (const mol of this.m) {
      const [cx, cy] = W2S(mol.x, mol.y); if (!onScreen(cx, cy, mol.R * z + 20)) continue;
      const ka = appear(mol.age), a = al * ka, sat = !this.freeSlots(mol) && mol.atoms.length > 1;
      const pts = mol.wp.map(p => W2S(p[0], p[1]));
      if (sat && COMP_BY[ckey(this.counts(mol))]) glow(cx, cy, mol.R * z * 1.4, [140, 235, 170], .12 * a); // готовое соединение
      const seen = new Map();
      for (const [i, j] of mol.bonds) {
        const key = Math.min(i, j) * 999 + Math.max(i, j), n = this.order(mol, i, j), k = seen.get(key) || 0; seen.set(key, k + 1);
        const dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1], L = Math.hypot(dx, dy) || 1, gap = Math.max(2.5, 3.2 * z), o = (k - (n - 1) / 2) * gap;
        const ox = -dy / L * o, oy = dx / L * o;
        line(pts[i][0] + ox, pts[i][1] + oy, pts[j][0] + ox, pts[j][1] + oy, n > 1 ? [190, 230, 255] : [220, 230, 245], .85 * a, Math.max(1.2, (n > 1 ? 1.5 : 2.2) * z));
      }
      mol.atoms.forEach((at, i) => {
        const d = CHEM[at.el], [sx, sy] = pts[i], r = d.r * z * popIn(ka);
        glow(sx, sy, r * 1.25, [150, 190, 255], .1 * a);
        for (let k = 0; k < at.b.length; k++) {
          if (at.b[k] >= 0) continue;
          const th = this.slotAng(mol, i, k), x1 = sx + Math.cos(th) * r * .6, y1 = sy + Math.sin(th) * r * .6, x2 = sx + Math.cos(th) * r * 1.05, y2 = sy + Math.sin(th) * r * 1.05;
          line(x1, y1, x2, y2, [255, 190, 100], .8 * a, Math.max(1.2, .9 * z));
          glow(x2, y2, Math.max(3, 1.6 * z), [255, 190, 100], .45 * a);
        }
        ball(sx, sy, r * .62, d.c, a);
        if (r > 9) label(at.el, sx, sy, Math.max(9, r * .5), at.el === 'H' ? [40, 40, 50] : [255, 255, 255], .85 * a);
      });
      if (sat) label(this.formula(mol), cx, cy - mol.R * z - 8, 11, [190, 235, 210], .75 * a, 700);
      if (mol.held) ring(cx, cy, mol.R * z + 6, GOLD, .9 * al, 2);
    }
    for (const h of this.hints) {
      const [x1, y1] = W2S(h[0], h[1]), [x2, y2] = W2S(h[2], h[3]);
      ctx.setLineDash([4, 4]); line(x1, y1, x2, y2, h[4] ? [140, 255, 170] : [255, 220, 150], .7 * al, 1.5); ctx.setLineDash([]);
    }
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    this.sl.draw(al);
    this.drawAim(al);
    if (G.started && !G.paused && !G.prev && this.doneAt === null && this.sl.shots === 0 && !this.sl.held) {
      const o = this.m.filter(m => m.atoms.length === 1 && m.atoms[0].el === 'H' && m.age > .5).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
      if (o && Tips.ok('molecules:sling')) { const [sx, sy] = W2S(o.x, o.y), r = o.R * cam.z + 8 + 3 * Math.sin(G.T * 5); ring(sx, sy, r, GOLD, .8 * al, 2); label('зажать, оттянуть, отпустить в свободную связь другого атома', sx, sy + r + 16, 13, [255, 255, 255], .85 * al, 700);
        // курсор сам бросает этот атом в ближайший другой
        const to = this.m.filter(m => m !== o && m.age > .5).sort((u, v) => Math.hypot(u.x - o.x, u.y - o.y) - Math.hypot(v.x - o.x, v.y - o.y))[0];
        if (to) { const [tx, ty] = W2S(to.x, to.y); if (onScreen(tx, ty, 0)) ghostSling(sx, sy, tx, ty, al); } }
    }
    else if (G.started && !G.paused && !G.prev && this.doneAt === null && !this.tore && !this.sl.held && (this.sl.shots >= 3 || this.st.auto > 0)) this.drawTearHint(al);
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.8 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  // прицел рогатки: у цели — конус допуска её свободной связи (зелёный — удар в него, серый — мимо);
  // на дуге натяжения — засечка барьера: досюда оттянуть, чтобы связь родилась при таком ударе (зелёная — хватает)
  drawAim(al) {
    const b = this.sl.held, a = this.sl.aim; if (!b || !a || !a.hit) return;
    if (a.cone) {
      const [cx, cy] = W2S(a.cone[0], a.cone[1]), r = a.cone[4] * cam.z * 2.2, c = a.cone[3] ? [140, 240, 170] : [200, 205, 225];
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a.cone[2] - TOL_AIM, a.cone[2] + TOL_AIM); ctx.closePath();
      ctx.fillStyle = rgb(c, .16 * al); ctx.fill(); ctx.strokeStyle = rgb(c, .55 * al); ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (a.need < M_VMAX * 1.01) {
      const kn = Math.min(1, (a.need / M_VMAX) ** (1 / SLING_POW)), q = -Math.PI / 2 + TAU * kn, ok = Math.hypot(...this.sl.pull) / this.full() >= kn, [bx, by] = W2S(b.x, b.y);
      line(bx + Math.cos(q) * 11, by + Math.sin(q) * 11, bx + Math.cos(q) * 22, by + Math.sin(q) * 22, ok ? [140, 240, 170] : [255, 120, 100], .95 * al, 2.5);
      for (const nd of a.needN || []) { // засечки двойной и тройной: досюда — кратная связь
        if (nd > M_VMAX) continue;
        const k2 = (nd / M_VMAX) ** (1 / SLING_POW), q2 = -Math.PI / 2 + TAU * k2, ok2 = Math.hypot(...this.sl.pull) / this.full() >= k2;
        line(bx + Math.cos(q2) * 13, by + Math.sin(q2) * 13, bx + Math.cos(q2) * 20, by + Math.sin(q2) * 20, ok2 ? [130, 220, 255] : [150, 160, 190], .9 * al, 2);
      }
    }
  },
  // ещё не рвал связей: у ближайшей связанной молекулы — «двойной клик — разорвать» и курсор, который сам дважды кликает
  drawTearHint(al) {
    const o = this.m.filter(m => !m.dead && m.bonds.length && !m.held && onScreen(...W2S(m.x, m.y), -40)).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
    if (!o || !Tips.ok('mols:tear')) return;
    const [i, j] = o.bonds[0], [bx, by] = W2S((o.wp[i][0] + o.wp[j][0]) / 2, (o.wp[i][1] + o.wp[j][1]) / 2), r = o.R * cam.z + 10;
    const [sx, sy] = W2S(o.x, o.y);
    label('зажать на связи: разорвать', sx, sy + r + 18, 13, [255, 255, 255], .8 * al, 700);
    ghostLong(bx, by, al);
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 6', this.steps(), this.stars, 'Первичный бульон готов');
    hudBanner(this.banner, 'УРОВЕНЬ 6 · миллиард лет', 'Молекулы', 'собрать соединения и создать законы их синтеза', al, 'атомы → молекулы → первые кирпичики жизни');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return M_VIEW; },
  hud() { return { title: '', sub: 'T ≈ 300 K', lines: [], goal: '', laws: [] }; },
};
