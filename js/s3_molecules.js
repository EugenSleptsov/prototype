"use strict";
/* Этап 3. Химия.
   Физика:
   - Молекула — твёрдое тело (масса, момент инерции, вращение). Столкновения — импульсы.
   - Валентность: у атома есть свободные связи с фиксированной геометрией
     (C — 4 под 90°, N — 3 под 120°, O — 2 под 104,5°, H — 1). Это вакансии
     внешней оболочки с прошлого этапа.
   - Связь возникает, только если свободные связи двух атомов смотрят друг на друга
     И удар сильнее энергии активации. Связь выделяет энергию (толчок соседям).
   - Стерика: атомы не могут налезать друг на друга — связь, которая так сделает, не возникает.
   - Очень сильный удар рвёт связь.
   - Насыщенная молекула (свободных связей нет) больше не растёт.
   Глагол игрока: рогатка — зажми атом (или свою молекулу), поверни (Q / E), оттяни и отпусти: связь выйдет,
   если свободные связи встретятся лицом к лицу и удар сильнее энергии активации. Пунктир показывает путь,
   у цели — вердикт: «связь C–H», «слабо», «не той стороной», «порвёт связь». */
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
const GOALS = [
  { t: 'Образуй первую химическую связь', ok: (m, c) => m.bonds.length >= 1 },
  { t: 'Собери молекулу из 6 атомов', ok: (m, c) => m.atoms.length >= 6 },
  { t: 'Каркас глицина: ≥ 2 C, ≥ 1 N, ≥ 2 O, ≥ 4 H', ok: (m, c) => (c.C || 0) >= 2 && (c.N || 0) >= 1 && (c.O || 0) >= 2 && (c.H || 0) >= 4 },
];

const Mols = {
  key: 'molecules', name: 'Химия', bg: [6, 24, 44],
  controls: 'Зажми атом, оттяни, отпусти — рогатка · Q / E или Shift + колесо — вращать взятое · колесо — зум · X — отщепить атом',
  sling: true,

  enter(prev) {
    this.m = []; this.t = 0; this.goalI = 0; this.first = true; this.hints = []; this.lowEMsgT = 0; this.satMsg = false;
    const Z = prev && prev.Z ? prev.Z : 6;
    let el = elemOf(Z)[0]; if (!CHEM[el] || !CHEM[el].s.length) el = 'C';
    this.pm = this.newMol(el, P.x, P.y); this.pm.player = true; this.pm.vx = P.vx; this.pm.vy = P.vy; this.pm.age = 1;
    if (prev && prev.ions) for (const io of prev.ions) if (io.ne >= io.Z) { const m = this.newMol(io.Z === 1 ? 'H' : 'He', io.x, io.y); m.age = 0; }
    for (let i = 0; i < 32; i++) this.spawn(true);
    this.sl = new Sling(this);
    msg('Рогатка: зажми атом, оттяни назад и отпусти — брось его в свою молекулу');
  },
  // ---------- рогатка ----------
  bodies() { return this.m; },
  grabR(b) { return b.R + 14 / cam.z; },
  full() { return 150 / cam.z; },
  vmax() { return 40; },
  hold(b) { b.held = true; b.vx = b.vy = 0; b.w = 0; },
  launch(b, vx, vy) { b.held = false; b.vx = vx; b.vy = vy; b.thrown = 0; },
  damp(b) { return b.player ? .8 : .3; },
  // Полёт брошенного (без поворота и теплового дрожания): первый касающийся атом — и что выйдет
  predict(b, vx, vy) {
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
          // у своей молекулы свободные связи доворачиваются друг к другу («магнит»): там допуск шире
          const tolA = T === this.pm ? 1.2 : TOL, tolB = b === this.pm ? 1.2 : TOL;
          const sa = this.slotNear(b, ia, th, tolA), sb = this.slotNear(T, ib, th + Math.PI, tolB);
          const ea = EA(b.atoms[ia].el, T.atoms[ib].el), hit = [pa[0] + dx * ra / (ra + rb), pa[1] + dy * ra / (ra + rb)];
          let label, c;
          if (!this.freeSlots(T) || !this.freeSlots(b)) { label = 'насыщена — отскочит'; c = [170, 175, 195]; }
          else if (sa >= 0 && sb >= 0 && vn >= ea) { label = `связь ${b.atoms[ia].el}–${T.atoms[ib].el}`; c = [120, 240, 160]; }
          else if (sa >= 0 && sb >= 0) { label = 'слабо — оттяни сильнее'; c = [255, 200, 110]; }
          else if (vn > BREAK_V && (b.bonds.length || T.bonds.length)) { label = 'порвёт связь'; c = [255, 90, 80]; }
          else { label = sa < 0 ? 'не той стороной — поверни (Q / E)' : 'мимо свободной связи — целься в штрих'; c = [200, 205, 225]; }
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
    const mol = { atoms: [{ el, lx: 0, ly: 0, base: Math.random() * TAU, b: d.s.map(() => -1) }], bonds: [], x, y, a: 0, vx: 0, vy: 0, w: randn() * .5, m: 1, I: 1, R: d.r, player: false, age: 0, dead: false, wp: null };
    this.recompute(mol); this.m.push(mol); return mol;
  },
  spawn(any) {
    const R = Math.max(viewRadius(), 40), a = Math.random() * TAU, d = any ? rnd(45, R * 1.4) : rnd(R * 1.1, R * 1.5);
    const r = Math.random(), el = r < .48 ? 'H' : r < .66 ? 'O' : r < .84 ? 'C' : 'N';
    const mol = this.newMol(el, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d);
    mol.vx = randn() * 4; mol.vy = randn() * 4; if (any) mol.age = 1;
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
  bestSlot(mol, i, th) {
    const a = mol.atoms[i]; let best = -1, bd = TOL;
    for (let k = 0; k < a.b.length; k++) if (a.b[k] < 0) { const d = Math.abs(angDiff(this.slotAng(mol, i, k), th)); if (d < bd) { bd = d; best = k; } }
    return best;
  },

  // ---------- реакции ----------
  merge(A, ia, sa, B, ib, sb) {
    let host = A, ih = ia, sh = sa, gu = B, ig = ib, sg = sb;
    if (B.player || (!A.player && B.m > A.m)) { host = B; ih = ib; sh = sb; gu = A; ig = ia; sg = sa; }
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
    host.bonds.push([ih, off + ig, sh, sg]); if (host.player) addScore(80);
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
    if (host.player && this.first) { this.first = false; msg('Ковалентная связь! Общая пара электронов, выделилась энергия'); }
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
    const keep = mol.player ? (comp.has(0) ? comp : null) : (comp.size * 2 >= mol.atoms.length ? comp : null);
    const inKeep = k => keep ? keep.has(k) : !comp.has(k);
    const idxK = [], idxO = [];
    mol.atoms.forEach((_, k) => (inKeep(k) ? idxK : idxO).push(k));
    const mK = new Map(idxK.map((o, n) => [o, n])), mO = new Map(idxO.map((o, n) => [o, n]));
    const remap = (a, mp) => ({ ...a, b: a.b.map(x => x < 0 ? -1 : mp.get(x)) });
    const other = { atoms: idxO.map(o => remap(mol.atoms[o], mO)), bonds: mol.bonds.filter(b => mO.has(b[0])).map(b => [mO.get(b[0]), mO.get(b[1]), b[2], b[3]]),
      x: mol.x, y: mol.y, a: mol.a, vx: mol.vx, vy: mol.vy, w: mol.w, m: 1, I: 1, R: 1, player: false, age: 1, dead: false, wp: null };
    mol.atoms = idxK.map(o => remap(mol.atoms[o], mK));
    mol.bonds = mol.bonds.filter(b => mK.has(b[0])).map(b => [mK.get(b[0]), mK.get(b[1]), b[2], b[3]]);
    this.recompute(mol); this.recompute(other);
    const dx = other.x - mol.x, dy = other.y - mol.y, d = Math.hypot(dx, dy) || 1;
    other.vx += dx / d * 6; other.vy += dy / d * 6; mol.vx -= dx / d * 6 * other.m / mol.m; mol.vy -= dy / d * 6 * other.m / mol.m;
    this.m.push(other);
    if (mol.player) msg('Связь разорвана');
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
      const sa = this.bestSlot(A, ia, th), sb = this.bestSlot(B, ib, th + Math.PI);
      if (sa >= 0 && sb >= 0) {
        if (imp >= EA(A.atoms[ia].el, B.atoms[ib].el)) { if (this.merge(A, ia, sa, B, ib, sb)) return true; }
        else if ((A.player || B.player) && this.lowEMsgT <= 0) { this.lowEMsgT = 5; msg('Связи совпали, но удар слабый — не хватило энергии активации'); }
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
  // «магнетизм» свободных связей: почти совпавшие валентности слегка доворачиваются друг к другу
  magnet(dt) {
    const pm = this.pm; this.hints = [];
    for (const o of this.m) {
      if (o === pm || o.dead) continue;
      if (Math.hypot(o.x - pm.x, o.y - pm.y) > pm.R + o.R + 25) continue;
      for (let i = 0; i < pm.atoms.length; i++) for (let k = 0; k < pm.atoms[i].b.length; k++) {
        if (pm.atoms[i].b[k] >= 0) continue;
        const pa = pm.wp[i], th = this.slotAng(pm, i, k), ra = CHEM[pm.atoms[i].el].r;
        for (let j = 0; j < o.atoms.length; j++) for (let l = 0; l < o.atoms[j].b.length; l++) {
          if (o.atoms[j].b[l] >= 0) continue;
          const pb = o.wp[j], rb = CHEM[o.atoms[j].el].r, dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
          if (d > (ra + rb) * 2.2) continue;
          const phi = Math.atan2(dy, dx), dA = angDiff(th, phi), dB = angDiff(this.slotAng(o, j, l), phi + Math.PI);
          if (Math.abs(dA) > 1 || Math.abs(dB) > 1.2) continue;
          o.a -= dB * 2.5 * dt;
          const L = (ra + rb) * .78, txx = pa[0] + Math.cos(th) * L, tyy = pa[1] + Math.sin(th) * L;
          o.vx += (txx - pb[0]) * .8 * dt; o.vy += (tyy - pb[1]) * .8 * dt;
          this.hints.push([pa[0] + Math.cos(th) * ra * 1.05, pa[1] + Math.sin(th) * ra * 1.05, pb[0], pb[1], Math.abs(dA) < TOL && Math.abs(dB) < TOL]);
        }
      }
    }
  },

  update(dt, act) {
    this.t += dt; this.lowEMsgT -= dt;
    const pm = this.pm;
    if (act) {
      this.sl.update();
      // Q / E вращают то, что держишь, иначе — свою молекулу
      const rm = this.sl.held || pm;
      let wt = 0; if (keys.has('KeyQ')) wt -= 2.6; if (keys.has('KeyE')) wt += 2.6;
      if (wt) rm.w += (wt - rm.w) * Math.min(1, dt * 3); else rm.w *= Math.exp(-dt * 2);
    }
    for (const mol of this.m) {
      mol.age += dt; mol.thrown = (mol.thrown ?? 9) + dt;
      if (mol.held) { mol.vx = mol.vy = 0; mol.a += mol.w * dt; mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i)); continue; }
      if (mol.player) { const dr = Math.exp(-dt * this.damp(mol)); mol.vx *= dr; mol.vy *= dr; }
      else if (mol.thrown < 3) { const dr = Math.exp(-dt * this.damp(mol)); mol.vx *= dr; mol.vy *= dr; } // брошенный летит, как показал пунктир
      else {
        const j = 3.2 * Math.sqrt(dt); mol.vx += randn() * j; mol.vy += randn() * j; mol.w += randn() * .6 * Math.sqrt(dt);
        const dr = Math.exp(-dt * .3); mol.vx *= dr; mol.vy *= dr; mol.w *= dr;
      }
      mol.x += mol.vx * dt; mol.y += mol.vy * dt; mol.a += mol.w * dt;
      mol.wp = mol.atoms.map((_, i) => this.wpos(mol, i));
    }
    if (act) this.magnet(dt);
    this.collide();
    if (act) { P.x = pm.x; P.y = pm.y; P.vx = pm.vx; P.vy = pm.vy; }

    if (act && !G.ended) {
      const c = this.counts(pm);
      while (this.goalI < GOALS.length && GOALS[this.goalI].ok(pm, c)) {
        this.goalI++;
        if (this.goalI < GOALS.length) msg('Цель выполнена! Дальше: ' + GOALS[this.goalI].t);
      }
      if (this.goalI >= GOALS.length) endGame(`Ты собрал ${this.formula(pm)} — каркас аминокислоты. Путь от кварка до кирпичика жизни пройден.`);
      if (this.freeSlots(pm) === 0 && !this.satMsg) { this.satMsg = true; msg('Молекула насыщена: свободных связей нет. X — отщепить атом'); }
      if (this.freeSlots(pm) > 0) this.satMsg = false;
    }

    const R = viewRadius();
    for (const m of this.m) if (!m.player && Math.hypot(m.x - P.x, m.y - P.y) > R * 2.4) m.dead = true;
    this.m = this.m.filter(m => !m.dead);
    if (act) { for (let i = 0; i < 2 && this.m.length + i < 42; i++) this.spawn(false); }
  },
  wheel(dy) { (this.sl.held || this.pm).w += Math.sign(dy) * .9; },
  detach() {
    const pm = this.pm;
    for (let i = pm.atoms.length - 1; i > 0; i--) {
      const deg = pm.atoms[i].b.filter(x => x >= 0).length;
      if (deg === 1) { const bi = pm.bonds.findIndex(b => b[0] === i || b[1] === i); this.splitBond(pm, bi); return; }
    }
    msg('Нечего отщеплять');
  },
  cheat() { this.goalI = GOALS.length; endGame(`Ты собрал ${this.formula(this.pm)}. (Этап пропущен через отладку.)`); },

  draw(al) {
    const z = cam.z;
    for (const mol of this.m) {
      const [cx, cy] = W2S(mol.x, mol.y); if (!onScreen(cx, cy, mol.R * z + 20)) continue;
      const a = al * Math.min(1, mol.age * 2);
      const pts = mol.wp.map(p => W2S(p[0], p[1]));
      for (const [i, j] of mol.bonds) line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], [220, 230, 245], .85 * a, Math.max(1.5, 2.2 * z));
      mol.atoms.forEach((at, i) => {
        const d = CHEM[at.el], [sx, sy] = pts[i], r = d.r * z;
        glow(sx, sy, r * 1.25, [150, 190, 255], (mol.player ? .2 : .1) * a);
        for (let k = 0; k < at.b.length; k++) {
          if (at.b[k] >= 0) continue;
          const th = this.slotAng(mol, i, k), x1 = sx + Math.cos(th) * r * .6, y1 = sy + Math.sin(th) * r * .6, x2 = sx + Math.cos(th) * r * 1.05, y2 = sy + Math.sin(th) * r * 1.05;
          const c = mol.player ? [255, 190, 100] : [210, 210, 230];
          line(x1, y1, x2, y2, c, (mol.player ? .95 : .55) * a, Math.max(1.2, .9 * z));
          glow(x2, y2, Math.max(3, 1.6 * z), c, (mol.player ? .7 : .35) * a);
        }
        ball(sx, sy, r * .62, d.c, a);
        if (r > 11) label(at.el, sx, sy, r * .5, at.el === 'H' ? [40, 40, 50] : [255, 255, 255], .85 * a);
      });
    }
    for (const h of this.hints) {
      const [x1, y1] = W2S(h[0], h[1]), [x2, y2] = W2S(h[2], h[3]);
      ctx.setLineDash([4, 4]); line(x1, y1, x2, y2, h[4] ? [140, 255, 170] : [255, 220, 150], .7 * al, 1.5); ctx.setLineDash([]);
    }
    if (this.sl) this.sl.draw(al);
  },
  drawPlayer(al) {
    const pm = this.pm;
    for (let i = 0; i < pm.atoms.length; i++) {
      const [sx, sy] = W2S(pm.wp[i][0], pm.wp[i][1]);
      ring(sx, sy, CHEM[pm.atoms[i].el].r * cam.z * .75, [140, 255, 200], .35 * al, 1.5);
    }
  },
  viewR() { return Math.max(60, this.pm.R * 2.2 + 45); },
  hud() {
    const pm = this.pm, free = this.freeSlots(pm);
    return {
      title: this.name,
      sub: 'Первичный бульон · ковалентные связи',
      lines: [['Молекула', this.formula(pm)], ['Атомов', pm.atoms.length], ['Очки', fmtScore(G.score)],
        ['Свободные связи', free ? free : '<span style="color:#ff9a7a">0 — насыщена, X — отщепить</span>'],
        ['Цели', GOALS.map((g, i) => `${i < this.goalI ? '✓' : i === this.goalI ? '→' : '·'} ${g.t}`).join('<br>')]],
      goal: '<b>Рогатка</b>: зажми атом, оттяни назад и отпусти — он полетит в обратную сторону. Связь возникает, только если <b>свободные связи</b> (оранжевые штрихи) смотрят друг на друга и удар сильнее <b>энергии активации</b>. Пока держишь — Q/E поворачивают атом, пунктир показывает путь, у цели — что выйдет. Слишком сильный удар не той стороной рвёт связи; насыщенная молекула больше не растёт. Свою молекулу тоже можно взять и бросить.',
      laws: [['Ковалентная связь', 1], ['Геометрия орбиталей', 1], ['Энергия активации', .6], ['Тепловое движение', .4]],
    };
  },
};
