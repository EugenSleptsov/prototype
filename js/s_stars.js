"use strict";
/* Уровень 4. Звёзды — ~100 млн лет. После Большого взрыва есть только водород, гелий и капля лития;
   всё тяжелее куют звёзды.
   Фаза 1 «Облако»: газ H и He медленно стягивается сам; зажми и веди — гравитация сгребает его в комок.
     Набралось достаточно — звезда загорается (масса Джинса, упрощённо — доля газа в ядре комка).
   Фаза 2 «Ядро звезды»: та же рогатка, что на уровне ядер (методы берём у Nuclei), но реакции звёздные:
   - ⁴He + ⁴He → ⁸Be — живёт миг (дуга) и разваливается обратно; ⁸Be + ⁴He → ¹²C (тройная альфа);
   - ¹²C + ⁴He → ¹⁶O; ¹²C + p → ¹³C (через ¹³N); ¹³C + p → ¹⁴N (начало CNO-цикла).
   - В ядре горячо: барьер ниже, чем на уровне ядер (×0,7). ⁸Be хрупкий — сильный удар его разобьёт.
   Живой мир: звезда сама жжёт водород в гелий (4p → ⁴He), конвекция подносит p и ⁴He с краёв,
   ⁴He изредка сами слипаются в ⁸Be — лови его, пока не распался.
   Исследование «Звёздный синтез»: звезда бросает ядра сама — туда, чего не хватает.
   Конец — сверхновая: выкованные ядра разлетаются и становятся атомами на следующем уровне. */
const ST_GAS = 140, ST_GR = 16, ST_IGN = .65, ST_WR = 8.5, ST_WIN = 200, ST_PAR = 150, ST_COST = 35, BE_LIFE = 2.6;
const ST_NEED = { '6,6': 2, '8,8': 2, '7,7': 1 }; // накопить к сверхновой: ¹²C, ¹⁶O, ¹⁴N
Object.assign(NUC_NAME, { '4,4': ['⁸Be', 'бериллий-8'], '6,6': ['¹²C', 'углерод-12'], '6,7': ['¹³C', 'углерод-13'], '7,7': ['¹⁴N', 'азот-14'], '8,8': ['¹⁶O', 'кислород-16'] });

const Stars = {
  key: 'stars', name: 'Звёзды', bg: [26, 10, 18], sling: true,
  get controls() { return this.phase === 'core' ? 'Зажми ядро, оттяни, отпусти' : 'Зажми и веди — сгребай газ'; },

  // рогатка и броски — как на уровне ядер
  mk: Nuclei.mk, float: Nuclei.float, free: Nuclei.free, grabR: Nuclei.grabR, full: Nuclei.full, vmax: Nuclei.vmax,
  hold: Nuclei.hold, launch: Nuclei.launch, flyT: Nuclei.flyT, predict: Nuclei.predict, judge: Nuclei.judge, bounce: Nuclei.bounce, drawNuc: Nuclei.drawNuc,

  enter(prev) {
    this.o = []; this.floats = []; this.t = 0; this.clock = 0; this.doneAt = null; this.endCd = -1; this.advanced = false; this.cheated = false;
    this.kn = 0; this.spent = 0; this.rs = { syn: 0 }; this.banner = -1.5; this.learn = {}; this.seen = new Set(); this.tk = {};
    this.st = { bounce: 0, shat: 0 }; this.made = { hand: 0, auto: 0 }; this.phase = 'gas'; this.igT = 0; this.ignAt = null;
    this.hT = 0; this.beT = 2; this.flowT = 0; this.autoCd = 1; this.boom = 0; this.well = null;
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    this.C = { x: P.x, y: P.y };
    // газ: водород и гелий (по массе ~3 : 1)
    this.gas = [];
    for (let i = 0; i < ST_GAS; i++) {
      const a = Math.random() * TAU, d = ST_GR * Math.sqrt(Math.random());
      this.gas.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, vx: randn() * .6, vy: randn() * .6, he: Math.random() < .25, age: -Math.random() });
    }
    this.stars = pickStars(this.starPool());
    this.sl = new Sling(this);
  },
  T() { return 0; }, // drawNuc: хрупких ореолов «пока горячо» тут нет
  bodies() { return this.phase !== 'core' || this.doneAt !== null ? [] : this.o.filter(o => this.free(o) && o.age > .3); },

  // ---------- реакции в ядре звезды ----------
  outcome(a, b) {
    const ka = nkey(a), kb = nkey(b), has = (x, y) => (ka === x && kb === y) || (ka === y && kb === x);
    if (has('2,2', '2,2')) return { out: [[4, 4]] };
    if (has('4,4', '2,2')) return { out: [[6, 6]] };
    if (has('6,6', '2,2')) return { out: [[8, 8]] };
    if (has('6,6', '1,0')) return { out: [[6, 7]], why2: 'через ¹³N → ¹³C' };
    if (has('6,7', '1,0')) return { out: [[7, 7]] };
    if (has('1,0', '1,0')) return { why: 'p + p — в звезде это годы' };
    if (has('2,2', '1,0')) return { why: 'ядер с массой 5 нет' };
    if (ka === '8,8' || kb === '8,8' || ka === '7,7' || kb === '7,7') return { why: 'дальше — в следующих звёздах' };
    return { why: 'такие не связываются' };
  },
  vBar(a, b) { const zz = a.Z * b.Z; return zz ? (2 + 2.5 * Math.sqrt(zz)) * .7 : 0; }, // в ядре звезды горячо — барьер ниже
  vMax(a, b) { return this.vBar(a, b) + 6; },
  fragile(a, b) { return nkey(a) === '4,4' ? a : nkey(b) === '4,4' ? b : null; },
  collide(a, b, v, src) {
    const j = this.judge(a, b, v), hand = src === 'hand';
    if (j.kind === 'bar') { this.bounce(a, b, hand ? 'барьер — сильнее' : ''); if (hand) { this.st.bounce++; if (!this.learn.bar) { this.learn.bar = true; msg('Заряд больше — барьер выше: бросай сильнее'); } } return false; }
    if (j.kind === 'no') { this.bounce(a, b, hand ? j.why : '', N_NO); return false; }
    if (j.kind === 'fast') { this.bounce(a, b, hand ? 'слишком сильно — разлетелись' : '', N_BAD); return false; }
    if (j.kind === 'shat') { const be = j.f; this.bounce(a, b, ''); this.beSplit(be, '⁸Be разбился — мягче'); if (hand) this.st.shat++; return false; }
    const [[Z, N]] = j.r.out, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    const o = this.mk(Z, N, x, y, (a.vx + b.vx) / 4, (a.vy + b.vy) / 4); o.age = 1; o.nb = .8;
    if (Z === 4) o.life = BE_LIFE;
    const k = nkey(o);
    if (ST_NEED[k] || k === '6,7') { if (hand) this.made.hand++; else this.made.auto++; }
    this.gain(o);
    fxFlash(x, y, 1.3, [255, 240, 200], .45); fxRing(x, y, .3, [255, 210, 140], 2.4, .6);
    if (j.r.why2) this.float(x, y + .7, j.r.why2, [255, 210, 160], 12);
    if (hand) Sfx.play('segment');
    return true;
  },
  // новое ядро +10 ✦; C, N, O — ещё +5
  gain(o) {
    const k = nkey(o), nm = NUC_NAME[k]; let pts = 0, txt = '';
    Codex.note('n:' + k);
    if (!this.seen.has(k)) { this.seen.add(k); pts += 10; txt = `НОВОЕ ${nm[0]} ${nm[1]}`; }
    if (ST_NEED[k]) pts += 5;
    if (!pts) return;
    this.kn += pts;
    this.float(o.x, o.y - .4, `${txt || nm[0]} +${pts} ✦`, txt ? [255, 215, 110] : [140, 220, 255], txt ? 16 : 14);
  },
  beSplit(o, txt) {
    o.dead = true;
    const a = Math.random() * TAU;
    for (const s of [1, -1]) { const n = this.mk(2, 2, o.x + Math.cos(a) * .4 * s, o.y + Math.sin(a) * .4 * s, o.vx + Math.cos(a) * 2.2 * s, o.vy + Math.sin(a) * 2.2 * s); n.age = 1; n.nb = 1; }
    fxRing(o.x, o.y, .3, [255, 200, 150], 1.6, .5);
    this.float(o.x, o.y, txt, [255, 200, 150], 13);
  },
  cnt(k) { return this.o.filter(o => !o.dead && nkey(o) === k).length; },

  // ---------- фаза 1: облако ----------
  tickGas(dt, live) {
    const c = centroid(this.gas);
    let w = null;
    if (live && mouse.down && !G.paused) { const [wx, wy] = S2W(mouse.x, mouse.y); w = { x: wx, y: wy }; this.learn.grab = true; }
    this.well = w;
    let near = 0;
    for (const g of this.gas) {
      g.age += dt;
      g.vx += (c.x - g.x) * .05 * dt; g.vy += (c.y - g.y) * .05 * dt; // газ стягивается сам — медленно
      if (w) {
        const dx = w.x - g.x, dy = w.y - g.y, d = Math.hypot(dx, dy) || 1e-6;
        if (d < 6) { const f = 9 * (1 - d / 6) + 2; g.vx += dx / d * f * dt; g.vy += dy / d * f * dt; }
        if (d < 2.6) near++;
      }
      const j = .9 * Math.sqrt(dt); g.vx += randn() * j; g.vy += randn() * j;
      const k = Math.exp(-dt * (w && Math.hypot(w.x - g.x, w.y - g.y) < 3 ? 3 : .5)); g.vx *= k; g.vy *= k;
      g.x += g.vx * dt; g.y += g.vy * dt;
    }
    this.near = near;
    if (w && near >= ST_GAS * ST_IGN) { if ((this.igT += dt) > .5) this.ignite(w.x, w.y); } else this.igT = 0;
    if (live && this.t > 45 && this.phase === 'gas') this.ignite(c.x, c.y); // не сгрёб — облако схлопнулось само
  },
  ignite(x, y) {
    this.phase = 'core'; this.ignAt = this.clock; this.well = null;
    P.x = x; P.y = y; this.C = { x, y };
    fxFlash(x, y, 6, [255, 230, 170], 1.2); fxRing(x, y, 1, [255, 200, 120], 14, 1.2);
    Sfx.play('ignite');
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * TAU, d = ST_WR * Math.sqrt(Math.random()) * .9, he = i < 13;
      const o = this.mk(he ? 2 : 1, he ? 2 : 0, x + Math.cos(a) * d, y + Math.sin(a) * d, randn() * .4, randn() * .4); o.age = -Math.random();
    }
    msg('Звезда зажглась! В её ядре гелий сливается в углерод');
  },

  // ---------- фаза 2: ядро звезды ----------
  tickCore(dt, live) {
    for (const o of this.o) {
      if (o.dead) continue;
      o.age += dt; o.nb -= dt; o.rot += dt * .6;
      if (o.Z === 4 && (o.life -= dt) <= 0 && !o.held) { this.beSplit(o, '⁸Be → 2 ⁴He'); continue; }
      if (o.held) continue;
      if (o.fly > 0) { if ((o.fly -= dt) <= 0) o.thrown = null; }
      else {
        const j = .55 * Math.sqrt(dt); o.vx += randn() * j; o.vy += randn() * j;
        const k = Math.exp(-dt * .9); o.vx *= k; o.vy *= k;
        const dx = o.x - this.C.x, dy = o.y - this.C.y, d = Math.hypot(dx, dy);
        if (d > ST_WR) { o.vx -= dx / d * 5 * dt; o.vy -= dy / d * 5 * dt; }
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
    }
    if (!live) return;
    for (const o of this.o) {
      if (o.dead || !o.thrown) continue;
      for (const q of this.o) {
        if (q === o || q.dead || q.held || q.age < .3) continue;
        if (Math.hypot(q.x - o.x, q.y - o.y) < (o.rad + q.rad) * .8) { this.collide(o, q, Math.hypot(o.vx - q.vx, o.vy - q.vy), o.thrown); break; }
      }
    }
    if (this.doneAt !== null) return;
    // звезда сама жжёт водород: 4p → ⁴He
    if ((this.hT += dt) > 3.5) {
      const ps = this.o.filter(o => nkey(o) === '1,0' && this.free(o) && o.age > 1);
      if (ps.length >= 6) {
        this.hT = 0; const p0 = ps[Math.random() * ps.length | 0];
        const four = ps.sort((u, v) => Math.hypot(u.x - p0.x, u.y - p0.y) - Math.hypot(v.x - p0.x, v.y - p0.y)).slice(0, 4);
        const c = centroid(four); four.forEach(p => p.dead = true);
        const he = this.mk(2, 2, c.x, c.y); he.age = .6;
        fxRing(c.x, c.y, .3, [255, 240, 180], 1.8, .6); this.float(c.x, c.y, '4p → ⁴He', [255, 230, 170], 12);
      }
    }
    // конвекция подносит вещество с краёв
    if ((this.flowT -= dt) <= 0) {
      this.flowT = 1;
      const nP = this.cnt('1,0'), nA = this.cnt('2,2');
      const add = (Z, N) => { const a = Math.random() * TAU, o = this.mk(Z, N, this.C.x + Math.cos(a) * ST_WR, this.C.y + Math.sin(a) * ST_WR, -Math.cos(a) * 1.5, -Math.sin(a) * 1.5); o.age = 0; };
      if (nP < 9) add(1, 0);
      if (nA < 7) add(2, 2);
    }
    // гелий изредка слипается в ⁸Be сам — лови его
    if ((this.beT -= dt) <= 0) {
      this.beT = 2.4;
      const al = this.o.filter(o => nkey(o) === '2,2' && this.free(o) && o.age > 1);
      if (al.length >= 4 && this.cnt('4,4') < 2) {
        let best = null, bd = 3.2;
        for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) { const d = Math.hypot(al[i].x - al[j].x, al[i].y - al[j].y); if (d < bd) { bd = d; best = [al[i], al[j]]; } }
        if (best) { this.collide(best[0], best[1], 5.5, null); if (!this.learn.be) { this.learn.be = true; msg('⁸Be живёт миг — брось в него ещё ⁴He'); } }
      }
    }
    this.autoFuse(dt);
  },
  // «Звёздный синтез»: звезда бросает сама — туда, чего не хватает к сверхновой
  autoFuse(dt) {
    if (!this.rs.syn || (this.autoCd -= dt) > 0) return;
    this.autoCd = 1.4;
    const need = k => (ST_NEED[k] || 0) - this.cnt(k);
    const want = [];
    if (need('8,8') > 0 && this.cnt('6,6') > Math.max(0, need('6,6'))) want.push(['6,6', '2,2', 3]);
    if (need('7,7') > 0) { want.push(['6,7', '1,0', 4]); if (this.cnt('6,6') > Math.max(0, need('6,6'))) want.push(['6,6', '1,0', 2]); }
    want.push(['4,4', '2,2', 5]);
    const f = this.o.filter(o => this.free(o) && o.age > .8);
    let best = null, bs = -Infinity;
    for (const [tk, bk, w] of want) for (const tg of f) {
      if (nkey(tg) !== tk) continue;
      for (const b of f) { if (nkey(b) !== bk) continue; const d = Math.hypot(b.x - tg.x, b.y - tg.y); if (d < 8 && w * 3 - d > bs) { bs = w * 3 - d; best = [b, tg, d]; } }
    }
    if (!best) return;
    const [a, b, d] = best, v = lerp(this.vBar(a, b), this.vMax(a, b), .4), t = d / v;
    const tx = b.x + b.vx * t - a.x, ty = b.y + b.vy * t - a.y, L = Math.hypot(tx, ty) || 1;
    a.vx = b.vx + tx / L * v; a.vy = b.vy + ty / L * v; a.fly = t + .5; a.thrown = 'auto';
  },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    if (this.phase === 'gas') { if (act) this.tickGas(dt, live); }
    else {
      if (live && this.doneAt === null) this.sl.update();
      for (const g of this.gas) { g.x += g.vx * dt; g.y += g.vy * dt; g.age += dt; } // остаток облака
      this.tickCore(dt, act);
    }
    this.o = this.o.filter(o => !o.dead);
    if (!live) return;
    if (this.doneAt === null) this.tickStars(false);
    if (this.doneAt === null && (this.steps().every(s => s.d) || this.t > ST_WIN)) this.supernova();
    if (this.boom > 0) this.boom -= dt;
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; this.handoff(); advance(); }
  },
  supernova() {
    this.doneAt = this.clock; this.endCd = 2.6; this.boom = 2.6; this.sl.held = null;
    for (const o of this.o) { o.held = false; const dx = o.x - this.C.x, dy = o.y - this.C.y, d = Math.hypot(dx, dy) || 1; o.vx = dx / d * rnd(6, 12); o.vy = dy / d * rnd(6, 12); o.fly = 9; o.thrown = null; }
    fxFlash(this.C.x, this.C.y, 10, [255, 250, 230], 1.6); fxRing(this.C.x, this.C.y, 2, [255, 220, 160], 30, 2);
    Sfx.play('overheat'); Sfx.play('segment');
    this.tickStars(true);
    msg('Сверхновая! Выкованные ядра разлетаются по Вселенной');
  },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.phase === 'core' && this.seen.has('6,6') && !this.rs.syn && this.doneAt === null ? [{ ic: '✺', name: 'Звёздный синтез', about: 'звезда куёт ядра', c: ST_COST }] : []; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1.5, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs.syn = 1; this.autoCd = .4; Sfx.play('upgrade');
    fxRing(P.x, P.y, 1, GOLD, ST_WR, 1.4); this.float(P.x, P.y - 1.5, '✺ Звёздный синтез', GOLD, 16);
  },
  renderShop: Nuclei.renderShop,

  // ---------- задание ----------
  steps() {
    const s = this.seen, gasP = this.phase === 'gas' ? Math.min(100, Math.round((this.near || 0) / (ST_GAS * ST_IGN) * 100)) : 100;
    const n = k => this.cnt(k);
    return [
      { t: 'Зажги звезду', h: 'зажми и веди — гравитация сгребает газ в комок', p: [gasP, 100], s: 'звезда горит', d: this.phase === 'core' },
      { t: 'Сделай углерод', h: '⁴He в ⁴He → ⁸Be, он живёт миг — брось в него ещё ⁴He', items: [['⁸Be', s.has('4,4')], ['¹²C', s.has('6,6')]], s: 'углерод', d: s.has('6,6') },
      { t: 'Сделай кислород', h: 'брось ⁴He в ¹²C', s: 'кислород', d: s.has('8,8') },
      { t: 'Сделай азот', h: 'брось протон в ¹²C, потом ещё один', items: [['¹³C', s.has('6,7')], ['¹⁴N', s.has('7,7')]], s: 'азот', d: s.has('7,7') },
      { t: 'Исследуй «Звёздный синтез»', h: `${isTouch() ? 'в лавке' : 'клавиша 1'} за ${ST_COST} ✦`, s: 'звёздный синтез', d: this.rs.syn > 0, res: 'syn' },
      { t: 'Накопи на сверхновую', h: 'звезда взорвётся и разнесёт их по Вселенной', items: [[`¹²C ${Math.min(n('6,6'), 2)}/2`, n('6,6') >= 2], [`¹⁶O ${Math.min(n('8,8'), 2)}/2`, n('8,8') >= 2], [`¹⁴N ${Math.min(n('7,7'), 1)}/1`, n('7,7') >= 1]], s: 'сверхновая', d: Object.keys(ST_NEED).every(k => n(k) >= ST_NEED[k]) },
    ];
  },
  starPool() {
    return [
      { t: 'зажги звезду за 0:15', ok: () => this.ignAt !== null && this.ignAt <= 15, bad: () => this.ignAt === null && this.clock > 15 },
      { t: 'без отскоков от барьера', bad: () => this.st.bounce > 0, atEnd: true },
      { t: 'не разбей ⁸Be', bad: () => this.st.shat > 0, atEnd: true },
      { t: `быстрее ${fmtClock(ST_PAR)}`, bad: () => this.clock > ST_PAR, atEnd: true },
      { t: 'кислорода больше, чем углерода', ok: () => this.cnt('8,8') > this.cnt('6,6') && this.cnt('8,8') >= 2 },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 2, '★ +10 ✦', [255, 215, 110], 17); }); },
  tally() {
    const n = this.made.hand + this.made.auto;
    return { name: 'Звёзды', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['¹²C · ¹⁶O · ¹⁴N', `${this.cnt('6,6')} · ${this.cnt('8,8')} · ${this.cnt('7,7')}`], ['выковано рогаткой', this.made.hand], ['выковано звездой', this.made.auto]], auto: [this.made.auto, n], stars: this.stars };
  },
  // Атомам: выкованные ядра и водород с гелием вокруг — все пока голые (ионы)
  handoff() {
    const ions = [];
    for (const o of this.o) { const Z = o.Z === 4 ? 2 : o.Z; if (Z >= 1) ions.push({ Z, x: o.x, y: o.y }); }
    this.ions = ions;
  },
  cheat() {
    this.cheated = true;
    if (this.phase === 'gas') this.ignite(P.x, P.y);
    for (const k of ['4,4', '6,6', '6,7', '7,7', '8,8']) this.seen.add(k);
    for (const [k, n] of Object.entries(ST_NEED)) for (let i = 0; i < n; i++) { const [Z, N] = k.split(',').map(Number); this.mk(Z, N, P.x + rnd(-4, 4), P.y + rnd(-4, 4)).age = 1; }
    this.rs.syn = 1;
  },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z, [cx, cy] = W2S(this.C.x, this.C.y);
    if (this.phase === 'core') { // недра звезды: горячее зернистое свечение
      const k = this.doneAt === null ? 1 : Math.max(0, this.boom / 2.6);
      glow(cx, cy, (ST_WR + 3) * z, [255, 150, 70], .35 * al * k);
      glow(cx, cy, ST_WR * .6 * z, [255, 220, 150], .22 * al * k);
      for (let i = 0; i < 18; i++) { const a = i * 2.4 + G.T * .2, r = (ST_WR * .9) * ((i * .37) % 1); glow(cx + Math.cos(a) * r * z, cy + Math.sin(a) * r * z, 1.6 * z, [255, 190, 110], (.08 + .05 * Math.sin(G.T * 2 + i)) * al * k); }
    }
    for (const g of this.gas) {
      const [sx, sy] = W2S(g.x, g.y); if (!onScreen(sx, sy, 10)) continue;
      const a = al * clamp(g.age * 2, 0, 1) * (this.phase === 'core' ? .25 : 1);
      glow(sx, sy, Math.max(3, .45 * z), g.he ? [255, 225, 150] : [170, 200, 255], .45 * a); ball(sx, sy, Math.max(1, .12 * z), g.he ? [255, 240, 200] : [220, 235, 255], .9 * a);
    }
    if (this.well) {
      const [wx, wy] = W2S(this.well.x, this.well.y), q = clamp((this.near || 0) / (ST_GAS * ST_IGN), 0, 1);
      ring(wx, wy, 6 * z, [255, 255, 255], .12 * al, 1, [5, 7]);
      glow(wx, wy, 2.6 * z, [255, 200, 120], (.15 + .5 * q) * al);
      arc(wx, wy, 2.6 * z + 6, -Math.PI / 2, -Math.PI / 2 + TAU * q, GOLD, .9 * al, 3);
    }
    for (const o of this.o) {
      this.drawNuc(o, al);
      if (o.Z === 4 && !o.dead) { const [sx, sy] = W2S(o.x, o.y); arc(sx, sy, (o.rad + .25) * z, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.life / BE_LIFE, 0, 1), [255, 140, 110], .85 * al, 2.5); }
    }
    ctx.globalAlpha = 1;
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    if (this.phase === 'core') this.sl.draw(al);
    if (G.started && !G.paused && !G.prev && this.doneAt === null) {
      if (this.phase === 'gas' && !this.well) label('зажми и веди — сгребай газ', G.W / 2, G.H * .62, 15, [255, 255, 255], (.75 + .2 * Math.sin(G.T * 4)) * al, 700);
      if (this.phase === 'core' && this.sl.shots === 0 && !this.sl.held) {
        const be = this.o.find(o => o.Z === 4) || this.o.find(o => nkey(o) === '2,2' && o.age > .3);
        if (be) { const [sx, sy] = W2S(be.x, be.y), r = be.rad * cam.z + 8 + 3 * Math.sin(G.T * 5); ring(sx, sy, r, GOLD, .8 * al, 2); label(be.Z === 4 ? 'брось в ⁸Be ещё ⁴He' : 'зажми ⁴He, оттяни, отпусти в другой', sx, sy + r + 16, 13, [255, 255, 255], .85 * al, 700); }
      }
    }
    for (const fl of this.floats) { const [fx, fy] = W2S(fl.x, fl.y); labelIn(fl.txt, fx, fy - 16 - fl.t * 26, fl.sz, fl.c, clamp(1.6 - fl.t, 0, 1), 700); }
    ctx.globalAlpha = 1;
  },
  overlay(al) {
    if (!G.started) return;
    const left = this.doneAt !== null ? '✓ ' + fmtClock(this.doneAt) : fmtClock(this.clock);
    hudClock(al, left, this.doneAt !== null ? [140, 235, 170] : this.clock > ST_PAR ? [190, 190, 205] : [255, 255, 255], this.bal(), []);
    if (!G.prev) hudTask(al, this.tk, 'УРОВЕНЬ 4', this.steps(), this.stars, 'Сверхновая!');
    hudBanner(this.banner, 'УРОВЕНЬ 4 · 100 млн лет', 'Звёзды', 'зажги звезду и выкуй в ней углерод, кислород и азот', al);
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return this.phase === 'gas' ? ST_GR + 1 : ST_WR + 2; },
  hud() { return { title: '', sub: this.phase === 'gas' ? 'T ≈ 20 K' : 'T ≈ 10⁸ K', lines: [], goal: '', laws: [] }; },
};
