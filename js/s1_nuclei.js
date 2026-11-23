"use strict";
/* Этап 1. Нуклеосинтез.
   Физика:
   - Сильное ядерное: короткое — нуклон прилипает, только коснувшись ядра.
   - Кулон: протоны и альфа-частицы отталкиваются от ядра с силой ~ Z·q/r².
     Чтобы прилипнуть, нужна скорость сближения выше барьера: v² > 2·k·Z·q/(m·R).
   - Слабое: перекос нейтронов/протонов → β⁻ / β⁺-распад через несколько секунд.
   - Нет стабильных ядер с массой 5; ⁸Be разваливается на две альфы.
   - γ-кванты разбивают слабо связанные ядра (дейтерий — 2,2 МэВ): «бутылочное горлышко».
   - Вселенная остывает: γ слабеют, но и тепловые скорости падают.
   Глагол игрока: протаранить (рывок через кулоновский барьер). */
const ELEM = [['n', 'Нейтрон', 0], ['H', 'Водород', 1], ['He', 'Гелий', 0], ['Li', 'Литий', 1], ['Be', 'Бериллий', 2], ['B', 'Бор', 3],
  ['C', 'Углерод', 4], ['N', 'Азот', 3], ['O', 'Кислород', 2], ['F', 'Фтор', 1], ['Ne', 'Неон', 0], ['Na', 'Натрий', 1], ['Mg', 'Магний', 2]];
const elemOf = Z => ELEM[clamp(Z, 0, ELEM.length - 1)];
const STABLE = new Set(['1,0', '1,1', '2,1', '2,2', '3,3', '3,4', '4,5', '5,5', '5,6', '6,6', '6,7', '7,7', '7,8', '8,8', '8,9', '8,10',
  '9,10', '10,10', '10,11', '10,12', '11,12', '12,12', '12,13', '12,14']);
function judgeNucleus(Z, N) {
  const A = Z + N;
  if (STABLE.has(Z + ',' + N)) return { ok: true };
  if (Z > 12 && N >= Z && N <= Z + 2) return { ok: true };
  if (Z === 0) return N === 1 ? { decay: 'beta-', t: 25, why: 'Свободный нейтрон нестабилен: через ~25 с станет протоном' } : { split: 'n', why: 'Динейтрон не связан' };
  if (A === 5) return { split: N > Z ? 'n' : 'p', why: 'Ядер с массой 5 не бывает — нуклон вылетел' };
  if (Z === 4 && N === 4) return { split: 'alpha', why: 'Бериллий-8 развалился на две альфа-частицы' };
  if (Z === 2 && N === 0) return { split: 'p', why: 'Дипротон не связан — протон вылетел' };
  if (N > Z) return { decay: 'beta-', t: 4, why: 'Избыток нейтронов → скоро β⁻-распад (n → p + e⁻)' };
  return { decay: 'beta+', t: 4, why: 'Избыток протонов → скоро β⁺-распад (p → n + e⁺)' };
}
const NUC_MSG = {
  '1,1': 'Дейтерий! Хрупкий: жёсткие γ-кванты легко его разбивают',
  '2,1': 'Гелий-3. Ещё нейтрон — и будет сверхпрочный гелий-4',
  '2,2': 'Гелий-4 — альфа-частица, очень прочное ядро. Но гелий инертен: для химии иди дальше',
  '4,4': 'Бериллий-8 живёт миг! Успей добавить нейтрон — получится стабильный бериллий-9',
  '3,3': 'Литий-6', '3,4': 'Литий-7', '4,5': 'Бериллий-9', '5,6': 'Бор-11',
  '6,6': 'Углерод-12! Четыре валентности — лучшая химия во Вселенной',
  '7,7': 'Азот-14', '8,8': 'Кислород-16',
};
const NR = .8, KC = 30;
const ETYPE = { p: { r: NR, m: 1, q: 1 }, n: { r: NR, m: 1, q: 0 }, a: { r: NR * 1.7, m: 4, q: 2 }, e: { r: .22, m: .05, q: -1 }, ep: { r: .22, m: .05, q: 1 }, g: { r: .25, m: 0, q: 0 } };

const Nuclei = {
  key: 'nuclei', name: 'Нуклеосинтез', bg: [22, 8, 40],
  controls: 'Мышь — двигаться · Пробел — рывок (пробить барьер) · Enter — «остыть», когда ядро стабильно',

  enter(prev) {
    this.e = []; this.t = 0; this.Tn = 1; this.gT = 0; this.leaving = false; this.msgCd = 0;
    let kind = 'p';
    if (prev && prev.key === 'quarks') {
      // твой первый барион — ядро-зародыш; остальные барионы плазмы становятся нуклонами этого этапа
      const mine = prev.groups.get(prev.mine);
      kind = mine ? mine.kind : 'p';
      for (const grp of prev.groups.values()) {
        if ((grp.kind === 'p' || grp.kind === 'n') && grp.id !== prev.mine) {
          const c = centroid(grp.m); this.add(grp.kind, c.x, c.y, randn(), randn());
        }
      }
    }
    this.nuc = { Z: kind === 'p' ? 1 : 0, N: kind === 'n' ? 1 : 0, parts: [{ t: kind, lx: 0, ly: 0 }], decay: null, split: null };
    this.R = NR;
    this.judge(false);
    for (let i = 0; i < 40; i++) this.spawn(true);
  },
  add(type, x, y, vx = 0, vy = 0) {
    const d = ETYPE[type];
    const e = { type, x, y, vx, vy, r: d.r, m: d.m, q: d.q, age: 0, dead: false, life: type === 'n' ? rnd(30, 60) : 99, E: 0, rot: Math.random() * TAU };
    this.e.push(e); return e;
  },
  spawn(any) {
    const R = Math.max(viewRadius(), 8), a = Math.random() * TAU, d = any ? rnd(this.R * 3 + 2, R * 1.4) : rnd(R * 1.1, R * 1.5);
    const w = { p: .5, n: .12 + .3 * this.Tn, a: .03 + .1 * (1 - this.Tn), e: .12 };
    let r = Math.random() * (w.p + w.n + w.a + w.e), type = 'p';
    for (const k of ['p', 'n', 'a', 'e']) { if (r < w[k]) { type = k; break; } r -= w[k]; }
    const vth = 1 + 2.5 * this.Tn, va = Math.random() * TAU;
    const e = this.add(type, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, Math.cos(va) * vth, Math.sin(va) * vth);
    if (any) e.age = 1;
  },
  spawnGamma() {
    const R = viewRadius(), a = Math.random() * TAU;
    const g = this.add('g', P.x + Math.cos(a) * R * 1.05, P.y + Math.sin(a) * R * 1.05);
    const h = a + Math.PI + randn() * .35;
    g.vx = Math.cos(h) * 26; g.vy = Math.sin(h) * 26; g.E = .3 + 9 * this.Tn * Math.random(); g.age = 1;
  },
  playerR() { let m = 0; for (const p of this.nuc.parts) m = Math.max(m, Math.hypot(p.lx, p.ly)); return m + NR; },
  relax() {
    const ps = this.nuc.parts, D = NR * 1.9;
    for (let it = 0; it < 2; it++) {
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j], dx = b.lx - a.lx, dy = b.ly - a.ly, d = Math.hypot(dx, dy) || 1e-3;
        if (d < D) { const k = (D - d) / d * .5; a.lx -= dx * k; a.ly -= dy * k; b.lx += dx * k; b.ly += dy * k; }
      }
      let cx = 0, cy = 0; for (const p of ps) { cx += p.lx; cy += p.ly; } cx /= ps.length; cy /= ps.length;
      for (const p of ps) { p.lx = (p.lx - cx) * .97; p.ly = (p.ly - cy) * .97; }
    }
  },
  judge(announce) {
    const nu = this.nuc, j = judgeNucleus(nu.Z, nu.N);
    if (j.split) { if (!nu.split || nu.split.kind !== j.split) nu.split = { kind: j.split, t: j.split === 'alpha' ? .7 : .35, why: j.why }; nu.decay = null; }
    else if (j.decay) { if (!nu.decay || nu.decay.kind !== j.decay) nu.decay = { kind: j.decay, t: j.t, t0: j.t }; nu.split = null; }
    else { nu.decay = null; nu.split = null; }
    if (announce) { const m = NUC_MSG[nu.Z + ',' + nu.N]; if (m) msg(m); else if (j.why) msg(j.why); }
  },
  addPart(t, ang) {
    const R0 = Math.max(0, this.R - NR * .4);
    this.nuc.parts.push({ t, lx: Math.cos(ang) * R0, ly: Math.sin(ang) * R0 });
    if (t === 'p') this.nuc.Z++; else this.nuc.N++;
  },
  capture(e) {
    e.dead = true;
    const ang = Math.atan2(e.y - P.y, e.x - P.x);
    if (e.type === 'a') { for (const t of ['p', 'n', 'p', 'n']) this.addPart(t, ang + randn() * .4); }
    else this.addPart(e.type, ang);
    fxFlash(e.x, e.y, 1.5, [255, 240, 200], .4);
    fxRing(P.x, P.y, this.R, [255, 220, 150], this.R * 2.5, .6);
    this.R = this.playerR();
    this.judge(true);
  },
  // выбросить нуклон заданного типа из ядра
  eject(type, speed = 7) {
    const ps = this.nuc.parts;
    let bi = -1, bd = -1;
    ps.forEach((p, i) => { if (p.t === type) { const d = Math.hypot(p.lx, p.ly); if (d > bd) { bd = d; bi = i; } } });
    if (bi < 0) return null;
    const p = ps.splice(bi, 1)[0];
    if (type === 'p') this.nuc.Z--; else this.nuc.N--;
    let dx = p.lx, dy = p.ly, d = Math.hypot(dx, dy);
    if (d < 1e-3) { const a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
    const x = P.x + dx / d * (this.R + NR), y = P.y + dy / d * (this.R + NR);
    this.R = this.playerR();
    return { x, y, vx: P.vx + dx / d * speed, vy: P.vy + dy / d * speed };
  },
  doSplit(kind) {
    if (kind === 'alpha') {
      const pts = [this.eject('p'), this.eject('n'), this.eject('p'), this.eject('n')].filter(Boolean);
      const c = centroid(pts), dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
      // две альфы равной массы разлетаются симметрично: импульс сохраняется, ядро игрока получает отдачу
      const a = this.add('a', c.x + dx / d, c.y + dy / d, P.vx + dx / d * 8, P.vy + dy / d * 8);
      a.noCap = 1.2;
      P.vx -= dx / d * 8; P.vy -= dy / d * 8; P.dashT = .3;
    } else {
      const o = this.eject(kind);
      if (o) { const e = this.add(kind, o.x, o.y, o.vx, o.vy); e.noCap = 1.2; }
    }
    fxRing(P.x, P.y, this.R, [255, 160, 120], this.R * 3, .7);
  },
  beta(kind) {
    const from = kind === 'beta-' ? 'n' : 'p', to = kind === 'beta-' ? 'p' : 'n';
    const p = this.nuc.parts.find(x => x.t === from);
    if (!p) return;
    p.t = to;
    if (kind === 'beta-') { this.nuc.N--; this.nuc.Z++; } else { this.nuc.Z--; this.nuc.N++; }
    const a = Math.random() * TAU;
    this.add(kind === 'beta-' ? 'e' : 'ep', P.x + Math.cos(a) * this.R, P.y + Math.sin(a) * this.R, Math.cos(a) * 16, Math.sin(a) * 16).age = 1;
    fxRing(P.x, P.y, this.R, [140, 255, 160], this.R * 2.2, .7);
    msg(kind === 'beta-' ? 'β⁻-распад: нейтрон → протон + электрон + антинейтрино' : 'β⁺-распад: протон → нейтрон + позитрон + нейтрино');
  },
  gammaHit(g) {
    g.dead = true;
    const A = this.nuc.Z + this.nuc.N, thr = A <= 1 ? 1e9 : A === 2 ? 2.2 : A === 3 ? 6 : 20;
    if (g.E > thr) {
      const type = this.nuc.N > 0 && (Math.random() < .5 || this.nuc.Z === 0) ? 'n' : 'p';
      const o = this.eject(type, 9);
      if (o) this.add(type, o.x, o.y, o.vx, o.vy).noCap = 1;
      fxFlash(P.x, P.y, this.R * 2, [255, 255, 255], .4);
      msg(`γ-квант (${g.E.toFixed(1)} МэВ) разбил ядро — фотодиссоциация`);
      this.judge(false);
    } else fxFlash(g.x, g.y, .8, [255, 255, 220], .25);
  },

  update(dt, act) {
    this.t += dt; this.Tn = Math.max(.15, 1 - this.t / 140);
    const nu = this.nuc;
    if (act) { steer(P, 5, 4, dt); P.x += P.vx * dt; P.y += P.vy * dt; }
    this.relax(); this.R = this.playerR();
    const Z = nu.Z, vth = 1 + 2.5 * this.Tn;
    if (act) { this.gT += dt * 3.5 * this.Tn; while (this.gT > 1) { this.gT--; this.spawnGamma(); } }

    for (const e of this.e) {
      e.age += dt; e.rot += dt; if (e.noCap > 0) e.noCap -= dt;
      if (e.type === 'g') {
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (act && Math.hypot(e.x - P.x, e.y - P.y) < this.R) this.gammaHit(e);
        continue;
      }
      const j = vth * .8 * Math.sqrt(dt); e.vx += randn() * j; e.vy += randn() * j;
      const dr = Math.exp(-dt * .4); e.vx *= dr; e.vy *= dr;
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1e-6;
      const Rc = this.R + e.r * .8;
      // кулоновское отталкивание от ядра игрока
      if (act && e.q > 0 && Z > 0 && e.type !== 'ep' && d > Rc * .9) {
        const acc = KC * Z * e.q / (d * d) / e.m;
        e.vx += dx / d * acc * dt; e.vy += dy / d * acc * dt;
      }
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.type === 'n') {
        e.life -= dt;
        if (e.life <= 0) { e.type = 'p'; e.q = 1; fxRing(e.x, e.y, .5, [140, 255, 160], 2, .5); this.add('e', e.x, e.y, randn() * 12, randn() * 12).age = 1; }
      }
      if (e.type === 'ep' && e.age > 1.2) { e.dead = true; fxFlash(e.x, e.y, 1.2, [255, 200, 255], .4); }
      if (act && !this.leaving && !(e.noCap > 0) && (e.type === 'p' || e.type === 'n' || e.type === 'a') && d < Rc) this.capture(e);
    }

    if (act) {
      if (nu.split) {
        nu.split.t -= dt;
        if (nu.split.t <= 0) { const { kind, why } = nu.split; nu.split = null; this.doSplit(kind); this.judge(false); msg(why); }
      }
      if (nu.decay) { nu.decay.t -= dt; if (nu.decay.t <= 0) { const k = nu.decay.kind; nu.decay = null; this.beta(k); this.judge(true); } }
    }

    const R = viewRadius();
    for (const e of this.e) if (Math.hypot(e.x - P.x, e.y - P.y) > R * 2.3) e.dead = true;
    this.e = this.e.filter(e => !e.dead);
    if (act) { const n = this.e.filter(e => e.type !== 'g').length; for (let i = 0; i < 3 && n + i < 45; i++) this.spawn(false); }
  },
  dash() { tryDash(P, 11); },
  enterKey() {
    const nu = this.nuc, j = judgeNucleus(nu.Z, nu.N);
    if (this.leaving) return;
    if (!j.ok) { msg('Ядро нестабильно — сначала стабилизируй его'); return; }
    const el = elemOf(nu.Z);
    if (el[2] === 0) { msg(`${el[1]} — инертный газ: химических связей не будет. Добавь нуклонов`); return; }
    this.leaving = true;
    msg(`${el[1]}: ядро заморожено. Вселенная остывает до эпохи атомов…`);
    advance();
  },
  cheat() {
    this.nuc.parts = [];
    for (let k = 0; k < 12; k++) { const a = k * 2.4, r = .9 * Math.sqrt(k); this.nuc.parts.push({ t: k % 2 ? 'n' : 'p', lx: Math.cos(a) * r, ly: Math.sin(a) * r }); }
    this.nuc.Z = 6; this.nuc.N = 6; this.relax(); this.R = this.playerR(); this.judge(false);
    this.enterKey();
  },

  draw(al) {
    const z = cam.z;
    for (const e of this.e) {
      const [sx, sy] = W2S(e.x, e.y), r = e.r * z;
      if (!onScreen(sx, sy, r * 4 + 40)) continue;
      const a = al * Math.min(1, e.age * 2);
      ctx.globalAlpha = a;
      if (e.type === 'p' || e.type === 'n') drawNucleon(sx, sy, r, e.type, e.rot);
      else if (e.type === 'a') {
        for (let i = 0; i < 4; i++) { const an = e.rot + i * TAU / 4; drawNucleon(sx + Math.cos(an) * r * .45, sy + Math.sin(an) * r * .45, r * .5, i % 2 ? 'n' : 'p', e.rot * 2); }
      } else if (e.type === 'e') { glow(sx, sy, r * 4, [120, 200, 255], .6); ball(sx, sy, r, [190, 230, 255]); }
      else if (e.type === 'ep') { glow(sx, sy, r * 4, [255, 140, 230], .6); ball(sx, sy, r, [255, 200, 240]); }
      else if (e.type === 'g') {
        const c = e.E > 6 ? [220, 200, 255] : e.E > 2.2 ? [255, 255, 230] : [255, 190, 120];
        const l = .12;
        line(sx, sy, sx - e.vx * l * z, sy - e.vy * l * z, c, .8, Math.max(1.5, z * .12));
      }
    }
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, nu = this.nuc;
    ctx.globalAlpha = 1;
    if (nu.Z > 0) { // кулоновский барьер
      const Rc = (this.R + NR * .8) * z, s = Math.min(1, nu.Z / 3 + .3);
      for (const k of [1.25, 1.7, 2.4]) ring(sx, sy, Rc * k, [255, 120, 120], .22 * al * s / k, 1, [3, 5]);
    }
    glow(sx, sy, this.R * z * 2.2, [255, 220, 200], .22 * al);
    ctx.globalAlpha = al;
    for (const p of nu.parts) drawNucleon(sx + p.lx * z, sy + p.ly * z, NR * z, p.t, G.T * .8);
    ctx.globalAlpha = 1;
    const d = nu.decay;
    if (d) {
      const k = d.t / d.t0, pul = .5 + .5 * Math.sin(G.T * 10);
      ring(sx, sy, (this.R + .6) * z, [140, 255, 160], (.3 + .4 * pul) * al, 2);
      ctx.strokeStyle = rgb([140, 255, 160], al); ctx.lineWidth = 3; ctx.beginPath();
      ctx.arc(sx, sy, (this.R + 1) * z, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    }
    const el = elemOf(nu.Z), A = nu.Z + nu.N;
    label(nu.Z === 0 ? 'n' : `${sup(A)}${el[0]}`, sx, sy - (this.R + 1.6) * z, 15, [255, 255, 255], .9 * al);
  },
  viewR() { return this.R * 3 + 5; },
  hud() {
    const nu = this.nuc, el = elemOf(nu.Z), A = nu.Z + nu.N, j = judgeNucleus(nu.Z, nu.N);
    const state = nu.split ? '<span style="color:#ff9a7a">разваливается</span>'
      : nu.decay ? `<span style="color:#8cffa0">${nu.decay.kind === 'beta-' ? 'β⁻' : 'β⁺'}-распад через ${nu.decay.t.toFixed(1)} с</span>`
      : j.ok ? '<span style="color:#9fd8ff">стабильно</span>' : '—';
    const Rc = this.R + NR * .8, vneed = Math.sqrt(2 * KC * nu.Z / Rc), sp = Math.hypot(P.vx, P.vy);
    const chem = nu.Z === 0 ? '—' : el[2] === 0 ? 'инертный газ (химии не будет)' : `валентность ${el[2]}`;
    return {
      title: this.name,
      sub: `T ≈ ${(this.Tn).toFixed(2)}·10⁹ K · окно нуклеосинтеза ${this.Tn > .2 ? 'открыто' : 'закрывается'}`,
      lines: [['Ядро', nu.Z === 0 ? 'нейтрон' : `${sup(A)}${el[0]} — ${el[1]}`], ['Состав', `${nu.Z} p + ${nu.N} n`], ['Состояние', state],
        ['Барьер', nu.Z ? `нужно сближение ≈ ${vneed.toFixed(1)}, ты летишь ${sp.toFixed(1)}` : 'нет (у нейтрона нет заряда)'], ['Будущая химия', chem]],
      goal: 'Слепи стабильное ядро и нажми <b>Enter</b>. Протоны отталкиваются (пунктир — кулоновский барьер): разгоняйся <b>рывком</b>. Нейтроны липнут свободно, но перекос n/p → β-распад. Жёсткие γ разбивают дейтерий, пока Вселенная горячая.',
      laws: [['Сильное ядерное (короткое)', 1], ['Кулоновское отталкивание', clamp(nu.Z / 8, .1, 1)], ['Слабое (β-распад)', nu.decay ? 1 : .25], ['Фотодиссоциация (γ)', this.Tn]],
    };
  },
};
