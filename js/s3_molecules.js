"use strict";
/* Уровень 6. Молекулы — первичный бульон.
   Физика:
   - Молекула — твёрдое тело (масса, момент инерции, вращение). Столкновения — импульсы.
   - Валентность: у атома свободные связи с фиксированной геометрией (C — 4 под 90°, N — 3 под 120°,
     O — 2 под 104,5°, H — 1). Связь возникает, если свободные связи двух атомов смотрят друг на друга
     и удар сильнее энергии активации; связь выделяет энергию (толчок соседям). Стерика: налезать нельзя.
   - Очень сильный удар рвёт связь. Насыщенная молекула больше не растёт.
   Игра — по всему полю, своего атома нет. Рогатка: зажми атом или молекулу, оттяни, отпусти;
   взятое само поворачивается свободной связью по ходу броска, у цели свободная связь доворачивается навстречу.
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
const TOL = .42, BREAK_V = 30;
const EA = (x, y) => (x === 'H' && y === 'H') ? 1 : 2;
const M_U = 5, M_VIEW = 78, M_DENS = .0012, M_CAP = 60, M_COST = 20;
// соединения из одинарных связей (двойные модель не умеет) — {f: формула, n: название, c: состав}
const COMP = [
  { f: 'H₂', n: 'водород', c: { H: 2 } }, { f: 'H₂O', n: 'вода', c: { H: 2, O: 1 } }, { f: 'NH₃', n: 'аммиак', c: { N: 1, H: 3 } },
  { f: 'CH₄', n: 'метан', c: { C: 1, H: 4 } }, { f: 'H₂O₂', n: 'перекись водорода', c: { H: 2, O: 2 } }, { f: 'CH₃OH', n: 'метанол', c: { C: 1, H: 4, O: 1 } },
  { f: 'C₂H₆', n: 'этан', c: { C: 2, H: 6 } }, { f: 'CH₃NH₂', n: 'метиламин', c: { C: 1, N: 1, H: 5 } }, { f: 'N₂H₄', n: 'гидразин', c: { N: 2, H: 4 } },
  { f: 'NH₂OH', n: 'гидроксиламин', c: { N: 1, O: 1, H: 3 } }, { f: 'C₂H₅OH', n: 'этанол', c: { C: 2, H: 6, O: 1 } },
];
const ckey = c => Object.keys(c).filter(k => c[k]).sort().map(k => k + c[k]).join('');
const COMP_BY = Object.fromEntries(COMP.map(x => [ckey(x.c), x]));
const fits = (c, t) => Object.keys(c).every(k => (t[k] || 0) >= c[k]);

const Mols = {
  key: 'molecules', name: 'Молекулы', bg: [6, 24, 44], sling: true,
  // взятое поворачивают Q / E или Shift + колесо (на сенсоре оно поворачивается само по ходу броска)
  get controls() { return 'Зажми атом, оттяни, отпусти' + (isTouch() ? '' : ' · Q / E или Shift + колесо — повернуть'); },

  enter(prev) {
    this.m = []; this.t = 0; this.clock = 0; this.hints = []; this.lowEMsgT = 0; this.floats = []; this.tk = {}; this.banner = -1.5;
    this.kn = 0; this.uni = []; this.spent = 0; this.found = []; this.res = new Set(); this.autoCd = 1; this.doneAt = null; this.cheated = false;
    this.st = { bonds: 0, broke: 0, auto: 0, hand: 0, soup: 0 };
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    // атомы с прошлого уровня — на своих местах: мир растягивается в M_U раз, камера — во столько же отъезжает
    if (prev && prev.ions) {
      rescale(M_U, P.x, P.y, []);
      for (const io of prev.ions) {
        const el = atSym(io.Z); if (!CHEM[el] || io.dead) continue;
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
  vmax() { return 40; },
  hold(b) { b.held = true; b.vx = b.vy = 0; b.w = 0; },
  launch(b, vx, vy) { b.held = false; b.vx = vx; b.vy = vy; b.thrown = 0; if (Math.hypot(vx, vy) > 1) b.hand = 3; },
  damp() { return .3; },
  // взятое поворачивается свободной связью по ходу броска
  orient(b, dx, dy) {
    const th = Math.atan2(dy, dx); let best = null, bd = Infinity;
    b.atoms.forEach((a, i) => a.b.forEach((x, k) => { if (x < 0) { const d = Math.abs(angDiff(th, this.slotAng(b, i, k))); if (d < bd) { bd = d; best = [i, k]; } } }));
    if (!best) return;
    b.a += angDiff(th, this.slotAng(b, best[0], best[1]));
    b.wp = b.atoms.map((_, i) => this.wpos(b, i));
  },
  // Полёт брошенного: первый касающийся атом — и что выйдет
  predict(b, vx, vy) {
    this.orient(b, vx, vy);
    const pts = [[b.x, b.y]], dt = 1 / 60, k = Math.exp(-this.damp(b) * dt);
    let x = b.x, y = b.y, ux = vx, uy = vy;
    for (let n = 0; n < 240; n++) {
      x += ux * dt; y += uy * dt; ux *= k; uy *= k;
      if (n % 4 === 3) pts.push([x, y]);
      const ox = x - b.x, oy = y - b.y;
      for (const T of this.m) {
        if (T === b || T.dead || Math.hypot(T.x - x, T.y - y) > T.R + b.R) continue;
        for (let ia = 0; ia < b.atoms.length; ia++) for (let ib = 0; ib < T.atoms.length; ib++) {
          const pa = [b.wp[ia][0] + ox, b.wp[ia][1] + oy], pb = T.wp[ib], ra = CHEM[b.atoms[ia].el].r, rb = CHEM[T.atoms[ib].el].r;
          const dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
          if (d >= ra + rb) continue;
          pts.push([x, y]);
          const th = Math.atan2(dy, dx), vn = ((ux - T.vx) * dx + (uy - T.vy) * dy) / (d || 1);
          const sa = this.slotNear(b, ia, th, 1), sb = this.slotNear(T, ib, th + Math.PI, 1.6); // у цели связь доворачивается навстречу
          const ea = EA(b.atoms[ia].el, T.atoms[ib].el), hit = [pa[0] + dx * ra / (ra + rb), pa[1] + dy * ra / (ra + rb)];
          let label, c;
          if (!this.freeSlots(T) || !this.freeSlots(b)) { label = 'насыщена — отскочит'; c = [170, 175, 195]; }
          else if (sa >= 0 && sb >= 0 && vn >= ea) { label = `связь ${b.atoms[ia].el}–${T.atoms[ib].el}`; c = [120, 240, 160]; }
          else if (sa >= 0 && sb >= 0) { label = 'слабо — оттяни сильнее'; c = [255, 200, 110]; }
          else if (vn > BREAK_V && (b.bonds.length || T.bonds.length)) { label = 'порвёт связь'; c = [255, 90, 80]; }
          else { label = 'мимо свободной связи'; c = [200, 205, 225]; }
          return { pts, x: hit[0], y: hit[1], label, c, hit: true };
        }
      }
    }
    return { pts, x, y, label: '', c: [200, 205, 225] };
  },
  slotNear(mol, i, th, tol) {
    const a = mol.atoms[i]; let best = -1, bd = tol;
    for (let k = 0; k < a.b.length; k++) if (a.b[k] < 0) { const d = Math.abs(angDiff(this.slotAng(mol, i, k), th)); if (d < bd) { bd = d; best = k; } }
    return best;
  },
  newMol(el, x, y) {
    const d = CHEM[el];
    const mol = { atoms: [{ el, lx: 0, ly: 0, base: Math.random() * TAU, b: d.s.map(() => -1) }], bonds: [], x, y, a: 0, vx: 0, vy: 0, w: randn() * .5, m: 1, I: 1, R: d.r, age: 0, dead: false, wp: null, hand: 0, auto: 0, mine: false, src: null };
    this.recompute(mol); this.m.push(mol); return mol;
  },
  // какой атом принести: чего из нужного в кадре нет — то и несёт; иначе водорода больше всех (он почти в каждом соединении)
  needEl() {
    const one = el => this.m.filter(m => m.atoms.length === 1 && m.atoms[0].el === el && inView(m.x, m.y, 20)).length;
    const need = [['C', 2], ['N', 2], ['O', 3], ['H', 10]].find(([el, n]) => one(el) < n);
    if (need) return need[0];
    const r = Math.random(); return r < .6 ? 'H' : r < .75 ? 'O' : r < .88 ? 'C' : 'N';
  },
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
    if (src === 'hand') { host.mine = true; this.st.bonds++; addScore(40); if (this.st.bonds === 1) msg('Ковалентная связь: общая пара электронов'); }
    if (this.freeSlots(host)) return;
    const cp = COMP_BY[ckey(this.counts(host))];
    if (!cp) return;
    if (src === 'auto') { this.st.auto++; Uni.pay(this, this.res.has(cp.f) ? cp.f : [...this.res][0], 2); } else if (src === 'hand') this.st.hand++;
    if (src === 'auto' || (src === 'hand' && this.res.size)) this.st.soup++; // Вселенная учится — бульон варит она и ты вместе
    Codex.note('m:' + cp.f);
    if (!this.found.includes(cp.f)) {
      this.found.push(cp.f); this.kn += 15; Sfx.play('fresh');
      this.float(x, y - 14, `НОВОЕ: ${cp.f} · ${cp.n} +15 ✦`, [255, 215, 110], 16);
      fxRing(x, y, 6, GOLD, 40, .9);
    } else this.float(x, y - 10, cp.f, src === 'auto' ? [150, 205, 255] : [140, 235, 170], 13);
  },

  // ---------- реакции ----------
  merge(A, ia, sa, B, ib, sb, src) {
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
      // брошенный уже смотрит связью вперёд, у цели связь доворачивается навстречу — те же допуски, что у пунктира
      const tA = A.hand > 0 || A.auto > 0, tB = B.hand > 0 || B.auto > 0, any = tA || tB;
      const sa = this.bestSlot(A, ia, th, tA ? 1 : any ? 1.6 : TOL), sb = this.bestSlot(B, ib, th + Math.PI, tB ? 1 : any ? 1.6 : TOL);
      if (sa >= 0 && sb >= 0) {
        const src = A.hand > 0 || B.hand > 0 ? 'hand' : A.auto > 0 || B.auto > 0 ? 'auto' : null;
        // сами по себе (без броска) связи не возникают — иначе тепловая толчея лепит огромные цепи и съедает весь углерод
        if (src && imp >= EA(A.atoms[ia].el, B.atoms[ib].el)) { if (this.merge(A, ia, sa, B, ib, sb, src)) return true; }
        else if (src === 'hand' && this.lowEMsgT <= 0) { this.lowEMsgT = 5; msg('Удар слабый — бросай сильнее'); }
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
  // «магнетизм» свободных связей: у брошенного (тобой или Вселенной) почти совпавшие валентности доворачиваются друг к другу
  magnet(dt) {
    this.hints = [];
    for (const pm of this.m) {
      if (pm.dead || pm.held || !(pm.hand > 0 || pm.auto > 0)) continue;
      for (const o of this.m) {
        if (o === pm || o.dead || o.held) continue;
        if (Math.hypot(o.x - pm.x, o.y - pm.y) > pm.R + o.R + 25) continue;
        for (let i = 0; i < pm.atoms.length; i++) for (let k = 0; k < pm.atoms[i].b.length; k++) {
          if (pm.atoms[i].b[k] >= 0) continue;
          const pa = pm.wp[i], th = this.slotAng(pm, i, k), ra = CHEM[pm.atoms[i].el].r;
          for (let j = 0; j < o.atoms.length; j++) for (let l = 0; l < o.atoms[j].b.length; l++) {
            if (o.atoms[j].b[l] >= 0) continue;
            const pb = o.wp[j], rb = CHEM[o.atoms[j].el].r, dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
            if (d > (ra + rb) * 2.2) continue;
            const phi = Math.atan2(dy, dx), dA = angDiff(th, phi), dB = angDiff(this.slotAng(o, j, l), phi + Math.PI);
            if (Math.abs(dA) > 1 || Math.abs(dB) > 1.6) continue;
            o.a -= dB * 3 * dt; pm.a -= dA * 2 * dt;
            if (pm.hand > 0) this.hints.push([pa[0] + Math.cos(th) * ra * 1.05, pa[1] + Math.sin(th) * ra * 1.05, pb[0], pb[1], Math.abs(dA) < TOL && Math.abs(dB) < TOL]);
          }
        }
      }
    }
  },

  // ---------- Вселенная сама сводит куски открытого («Синтез …») ----------
  autoChem(dt) {
    if (!this.res.size || (this.autoCd -= dt) > 0) return;
    this.autoCd = 1.2;
    const goals = COMP.filter(x => this.res.has(x.f));
    const f = this.m.filter(m => !m.dead && !m.held && m.age > 1 && !(m.hand > 0) && !(m.auto > 0) && this.freeSlots(m) && inView(m.x, m.y, -5));
    let best = null, bs = -Infinity;
    for (const g of goals) for (let i = 0; i < f.length; i++) {
      const ca = this.counts(f[i]); if (!fits(ca, g.c)) continue;
      for (let j = i + 1; j < f.length; j++) {
        const cb = this.counts(f[j]), sum = { ...ca }; for (const k in cb) sum[k] = (sum[k] || 0) + cb[k];
        if (!fits(sum, g.c)) continue;
        const d = Math.hypot(f[i].x - f[j].x, f[i].y - f[j].y); if (d > 70) continue;
        const sc = f[i].atoms.length + f[j].atoms.length + (ckey(sum) === ckey(g.c) ? 4 : 0) - d / 20 + Math.random();
        if (sc > bs) { bs = sc; best = [f[i], f[j], d]; }
      }
    }
    if (!best) return;
    let [A, B, d] = best; if (A.m > B.m) [A, B] = [B, A];
    const dx = B.x - A.x, dy = B.y - A.y;
    this.orient(A, dx, dy); this.orient(B, -dx, -dy); A.w = B.w = 0;
    const v = 16; A.vx = B.vx + dx / d * v; A.vy = B.vy + dy / d * v; A.thrown = 0; A.auto = 3; B.auto = 3;
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
      if (rm) { let wt = 0; if (keys.has('KeyQ')) wt -= 2.6; if (keys.has('KeyE')) wt += 2.6; rm.w = wt; }
    }
    for (const mol of this.m) {
      mol.age += dt; mol.thrown = (mol.thrown ?? 9) + dt; mol.hand -= dt; mol.auto -= dt;
      if (mol.held) { mol.vx = mol.vy = 0; mol.a += mol.w * dt; mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i)); continue; }
      if (mol.thrown < 3) { const dr = Math.exp(-dt * this.damp(mol)); mol.vx *= dr; mol.vy *= dr; } // брошенный летит, как показал пунктир
      else {
        const j = 3.2 * Math.sqrt(dt); mol.vx += randn() * j; mol.vy += randn() * j; mol.w += randn() * .6 * Math.sqrt(dt);
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
        endGame(`Первичный бульон готов: ${this.found.join(', ')}. Дальше — органика (скоро).`);
      }
    }
  },
  wheel(dy) { if (this.sl.held) this.sl.held.w += Math.sign(dy) * .9; },

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
    this.float(P.x, P.y - 10, `Синтез ${it.f}: Вселенная учится`, GOLD, 16);
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
      { t: 'Свяжи два атома', h: 'зажми атом, оттяни и отпусти в другой', s: 'первая связь', d: this.st.bonds > 0 },
      { t: 'Собери воду', h: 'кислороду нужны два водорода', s: 'вода H₂O', d: fd.includes('H₂O') },
      { t: 'Открой 4 соединения', h: 'аммиак NH₃, метан CH₄, перекись H₂O₂…', items: fd.slice(0, 6).map(f => [f, true]), p: [Math.min(fd.length, 4), 4], s: '4 соединения', d: fd.length >= 4 },
      { t: 'Сформируй законы', h: `${touch ? 'в лавке' : 'клавиши 1–4'}: «Синтез …»`, p: [Math.min(this.res.size, 2), 2], s: 'законы сформированы', d: this.res.size >= 2 },
      { t: 'Первичный бульон', h: 'Вселенная собирает открытое — помогай рогаткой', p: [Math.min(this.st.soup, 10), 10], s: 'бульон готов', d: this.st.soup >= 10 },
    ];
  },
  starPool() {
    return [
      { t: 'открой метан', ok: () => this.found.includes('CH₄') },
      { t: 'открой аммиак', ok: () => this.found.includes('NH₃') },
      { t: 'открой 6 соединений', ok: () => this.found.length >= 6 },
      { t: 'открой этанол', ok: () => this.found.includes('C₂H₅OH') },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 10, '★ +10 ✦', [255, 215, 110], 17); }); },
  tally() { return { name: 'Молекулы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['соединений открыто', this.found.length], ['собрано рогаткой', this.st.hand], ['собрано Вселенной', this.st.auto]], auto: [this.st.auto, this.st.auto + this.st.hand], stars: this.stars }; },
  cheat() { this.cheated = true; for (const x of COMP.slice(0, 4)) if (!this.found.includes(x.f)) this.found.push(x.f); this.st.bonds++; this.res.add('H₂O'); this.res.add('H₂'); this.st.auto = this.st.soup = 10; },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    for (const mol of this.m) {
      const [cx, cy] = W2S(mol.x, mol.y); if (!onScreen(cx, cy, mol.R * z + 20)) continue;
      const a = al * Math.min(1, mol.age * 2), sat = !this.freeSlots(mol) && mol.atoms.length > 1;
      const pts = mol.wp.map(p => W2S(p[0], p[1]));
      if (sat && COMP_BY[ckey(this.counts(mol))]) glow(cx, cy, mol.R * z * 1.4, [140, 235, 170], .12 * a); // готовое соединение
      for (const [i, j] of mol.bonds) line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], [220, 230, 245], .85 * a, Math.max(1.5, 2.2 * z));
      mol.atoms.forEach((at, i) => {
        const d = CHEM[at.el], [sx, sy] = pts[i], r = d.r * z;
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
    if (G.started && !G.paused && !G.prev && this.doneAt === null && this.sl.shots === 0 && !this.sl.held) {
      const o = this.m.filter(m => m.atoms.length === 1 && m.atoms[0].el === 'H' && m.age > .5).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
      if (o) { const [sx, sy] = W2S(o.x, o.y), r = o.R * cam.z + 8 + 3 * Math.sin(G.T * 5); ring(sx, sy, r, GOLD, .8 * al, 2); label('зажми, оттяни, отпусти в другой атом', sx, sy + r + 16, 13, [255, 255, 255], .85 * al, 700);
        // курсор сам бросает этот атом в ближайший другой
        const to = this.m.filter(m => m !== o && m.age > .5).sort((u, v) => Math.hypot(u.x - o.x, u.y - o.y) - Math.hypot(v.x - o.x, v.y - o.y))[0];
        if (to) { const [tx, ty] = W2S(to.x, to.y); if (onScreen(tx, ty, 0)) ghostSling(sx, sy, tx, ty, al); } }
    }
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.8 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 6', this.steps(), this.stars, 'Первичный бульон готов');
    hudBanner(this.banner, 'УРОВЕНЬ 6 · миллиард лет', 'Молекулы', 'собирай соединения и учи Вселенную их делать', al, 'атомы → молекулы → первые кирпичики жизни');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return M_VIEW; },
  hud() { return { title: '', sub: 'T ≈ 300 K', lines: [], goal: '', laws: [] }; },
};
