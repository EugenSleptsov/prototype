"use strict";
/* Уровень 4. Звёзды — ~100 млн лет. После Большого взрыва есть только водород, гелий и капля лития;
   всё тяжелее куют звёзды. Мост от «Ядер»: через ~380 000 лет ядра H и He поймали электроны — первые атомы,
   Вселенная стала прозрачной (реликтовый свет); звезда сжимается из облака этих нейтральных атомов.
   Фаза 1 «Облако»: газ H и He медленно стягивается сам, но тепловое давление расталкивает густое; зажми и веди —
     гравитация сгребает его в комок. Масса комка — масса будущей звезды; отпустил в золотой полосе — звезда зажглась:
     легче полосы — меньше массы Джинса, давление разносит комок; тяжелее — перебор: протозвезда светит так ярко,
     что свет сдувает газ (настоящая беда тяжёлых звёзд). Лёгкая звезда живёт долго, но недра прохладнее (барьер выше,
     кислород трудно); тяжёлая — горячая, но сгорает быстро и взрывается раньше. Доля гелия в облаке — твоя Y с «Ядер».
   Фаза 2 «Ядро звезды»: та же рогатка, что на уровне ядер (методы берём у Nuclei), но реакции звёздные:
   - ⁴He + ⁴He → ⁸Be — живёт миг (дуга) и разваливается обратно; ⁸Be + ⁴He → ¹²C (тройная альфа);
   - ¹²C + ⁴He → ¹⁶O; ¹²C + p → ¹³C (через ¹³N); ¹³C + p → ¹⁴N (начало CNO-цикла).
   - В ядре горячо: барьер ниже, чем на уровне ядер (×0,7). ⁸Be хрупкий — сильный удар его разобьёт.
   Живой мир: звезда сама жжёт водород в гелий (4p → ⁴He), конвекция подносит p и ⁴He с краёв,
   ⁴He изредка сами слипаются в ⁸Be — лови его, пока не распался.
   Исследование «Звёздный синтез»: звезда бросает ядра сама — туда, чего не хватает.
   Конец — пропуск времени: дальше (Ne, Mg, Si… до железа) массивная звезда куёт сама, железное ядро схлопывается —
   сверхновая; выкованные ядра разлетаются и становятся атомами на следующем уровне. Взрывают звезду не C, N, O
   (так было в тексте раньше — ревью: физическая неправда), а железо, которое уже не горит.
   Мир без края, как везде: газ — твои ядра с прошлого уровня, теперь атомы (на тех же местах), и Вселенная из-за края кадра.
   Звезда зажглась — камера ныряет в комок: мир растягивается (rescale), в жаре недр атомы комка снова голые ядра. */
// газ: плотность и предел в кадре, обзор, доля газа кадра в комке для зажигания; комок — радиус, из которого газ становится ядрами,
// ST_CORE — во что он растягивается; недра: плотность и предел ядер в кадре
const ST_GAS_D = .09, ST_GAS_CAP = 230, ST_GR = 16, ST_IGN = .5, ST_CLUMP = 3.2, ST_CORE = 7.5, ST_CORE_D = .05, ST_CORE_CAP = 45;
const ST_VIEW = 10.5, ST_PAR = 150, ST_COST = 35, BE_LIFE = 2.6, ST_BOOM = 2.6;
// масса комка — облачка ближе ST_NEAR к яме; полоса зажигания — [ST_LO, ST_HI] × ignN, выше — перебор: ST_OVER с — и свет сдувает газ
// (ST_BLOWV — толчок, ST_BLOWT с яма держит слабо); масса звезды на полосе ST_M0 → ST_M1 M☉ (лог-шкала), mu 0…1;
// тепловое давление — облачка ближе ST_PH расталкиваются (сила ST_PK); не зажёг за ST_AUTO с — облако схлопнулось само, лёгкой звездой
const ST_NEAR = 2.6, ST_LO = 1, ST_HI = 1.6, ST_M0 = 8, ST_M1 = 100, ST_OVER = .35, ST_BLOWV = 10, ST_BLOWT = 1.6, ST_PH = 1.1, ST_PK = 3, ST_AUTO = 60;
// звезда по mu: [лёгкая, тяжёлая] — сколько живёт до сверхновой (с), множитель барьера, ширина окна слияния, раз в сколько секунд 4p → ⁴He, ядер в недрах;
// у лёгкой ¹²C + ⁴He → ¹⁶O ещё ×ST_OCOOL (в прохладных недрах гелий горит в углерод, кислород — у тяжёлых)
const ST_LIFE = [220, 110], ST_BF = [.85, .55], ST_GAP = [.8, 1.2], ST_HBURN = [5, 2.2], ST_NUCN = [15, 26], ST_OCOOL = 1.15, ST_HE0 = .25;
const ST_NEED = { '6,6': 2, '8,8': 2, '7,7': 1 }; // накопить к сверхновой: ¹²C, ¹⁶O, ¹⁴N
Object.assign(NUC_NAME, { '4,4': ['⁸Be', 'бериллий-8'], '6,6': ['¹²C', 'углерод-12'], '6,7': ['¹³C', 'углерод-13'], '7,7': ['¹⁴N', 'азот-14'], '8,8': ['¹⁶O', 'кислород-16'] });

const Stars = {
  key: 'stars', name: 'Звёзды', bg: [26, 10, 18], sling: true,
  get controls() { return this.phase === 'core' ? 'Зажать ядро, оттянуть, отпустить' : 'Зажать и вести: гравитация сгребает газ'; },
  gest() { return this.phase === 'core' ? { obj: 'ядро: оттянуть, отпустить — в другое', empty: 'тянуть: карта' }
    : { empty: 'держать и вести: яма сгребает газ · отпустить в золотой полосе: звезда' }; },

  // рогатка и броски — как на уровне ядер
  mk: Nuclei.mk, float: Nuclei.float, free: Nuclei.free, grabR: Nuclei.grabR, full: Nuclei.full, vmax: Nuclei.vmax,
  hold: Nuclei.hold, launch: Nuclei.launch, flyT: Nuclei.flyT, predict: Nuclei.predict, judge: Nuclei.judge, bounce: Nuclei.bounce, drawNuc: Nuclei.drawNuc,

  enter(prev) {
    this.o = []; this.floats = []; this.t = 0; this.clock = 0; this.doneAt = null; this.endCd = -1; this.advanced = false; this.cheated = false;
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.failed = false; this.stuckT = 0; this.rs = { syn: 0 }; this.banner = -1.5; this.learn = {}; this.seen = new Set(); this.tk = {};
    this.st = { bounce: 0, shat: 0 }; this.made = { hand: 0, auto: 0 }; this.phase = 'gas'; this.igT = 0; this.ignAt = null;
    this.hT = 0; this.beT = 2; this.flowT = 0; this.autoCd = 1; this.boom = 0; this.well = null;
    this.st.blow = 0; this.overT = 0; this.blowT = 0; this.near = 0; this.mu = .5; this.Ms = null; this.life = lerp(ST_LIFE[0], ST_LIFE[1], .5); this.bf = lerp(ST_BF[0], ST_BF[1], .5);
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    this.C = { x: P.x, y: P.y }; this.ignT = null;
    // доля гелия в облаке — твоя Y с «Ядер» (с нуля — как в нашей Вселенной, 25 %); показ — в первый живой кадр
    this.Yin = prev && prev.key === 'nuclei' && typeof prev.Y === 'function' ? clamp(prev.Y(), 0, 1) : null;
    this.heP = this.Yin ?? ST_HE0; this.yShown = this.Yin === null;
    // газ — твои ядра с уровня ядер, за 380 000 лет поймавшие электроны: каждое там же, где было (облачко атомов H или He);
    // Li и Be — свои облачка (сиреневые): в недрах звезды они сгорают в гелий (⁷Li + p → 2 ⁴He)
    this.gas = [];
    if (prev && prev.o) for (const o of prev.o) if (!o.dead) this.gas.push({ x: o.x, y: o.y, vx: o.vx * .5, vy: o.vy * .5, he: o.Z >= 2, li: o.Z >= 3, age: 1, s: 1, mine: true, src: o });
    // остальное облако — за краем кадра (камера отъедет и откроет); с нуля — и в кадре
    const z1 = zoomFor(this), want = popWant(ST_GAS_D, ST_GAS_CAP, z1);
    for (let k = 0; this.gas.length < want && k < want * 3; k++) {
      const at = beyondPos(z1, .3, !prev); if (at) this.gas.push(this.puff(at[0], at[1], randn() * .6, randn() * .6, prev ? 1 : -Math.random()));
    }
    this.ignN = clamp(Math.round(want * ST_IGN), 45, 80); // столько газа сгрести в комок
    this.lo = Math.round(this.ignN * ST_LO); this.hi = Math.round(this.ignN * ST_HI); // полоса зажигания
    this.stars = pickStars(this.starPool());
    this.sl = new Sling(this);
  },
  // облачко газа Вселенной: нейтральные атомы водорода и гелия; гелия — доля heP (Y с «Ядер»). Упрощение: доля по числу
  // облачков равна доле по массе (честно атомов He было бы вчетверо меньше) — так твоя Y видна глазом
  puff(x, y, vx, vy, age) { return { x, y, vx, vy, he: Math.random() < this.heP, li: false, age, s: 1, mine: false, src: null }; },
  // масса комка из n облачков: mu 0…1 на полосе зажигания и масса звезды, M☉ (лог-шкала)
  muOf(n) { return clamp((n - this.lo) / Math.max(1, this.hi - this.lo), 0, 1); },
  massOf(mu) { return Math.round(ST_M0 * (ST_M1 / ST_M0) ** mu); },
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
    if (has('1,0', '1,0')) return { why: 'p + p: в звезде это годы' };
    if (has('2,2', '1,0')) return { why: 'ядер с массой 5 нет' };
    if (ka === '8,8' || kb === '8,8' || ka === '7,7' || kb === '7,7') return { why: 'дальше — Ne, Mg… до железа: звезда куёт сама, позже' };
    return { why: 'такие не связываются' };
  },
  // в ядре звезды горячо — барьер ниже (×bf: тяжёлая звезда горячее); в прохладных недрах лёгкой ⁴He + ¹²C → ¹⁶O ещё труднее
  vBar(a, b) {
    const zz = a.Z * b.Z; if (!zz) return 0;
    const co = (a.Z === 6 && b.Z === 2) || (a.Z === 2 && b.Z === 6) ? lerp(ST_OCOOL, 1, this.mu ?? .5) : 1;
    return (2 + 2.5 * Math.sqrt(zz)) * (this.bf ?? .7) * co * N_SPD;
  },
  vMax(a, b) { return this.vBar(a, b) + 6 * N_SPD * lerp(ST_GAP[0], ST_GAP[1], this.mu ?? .5); }, // окно слияния: в прохладных недрах уже
  fragile(a, b) { return nkey(a) === '4,4' ? a : nkey(b) === '4,4' ? b : null; },
  collide(a, b, v, src) {
    const j = this.judge(a, b, v), hand = src === 'hand';
    if (j.kind === 'bar') { this.bounce(a, b, hand ? 'барьер: нужно сильнее' : ''); if (hand) { this.st.bounce++; if (!this.learn.bar) { this.learn.bar = true; tipMsg('stars:bar', 'Заряд больше, барьер выше: нужен бросок сильнее'); } } return false; }
    if (j.kind === 'no') { this.bounce(a, b, hand ? j.why : '', N_NO); return false; }
    if (j.kind === 'fast') { this.bounce(a, b, hand ? 'слишком сильно: разлетелись' : '', N_BAD); return false; }
    if (j.kind === 'shat') { const be = j.f; this.bounce(a, b, ''); this.beSplit(be, '⁸Be разбился: нужно мягче'); if (hand) this.st.shat++; return false; }
    const [[Z, N]] = j.r.out, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    const o = this.mk(Z, N, x, y, (a.vx + b.vx) / 4, (a.vy + b.vy) / 4); o.age = 1; o.nb = .8; o.mine = true;
    if (Z === 4) o.life = BE_LIFE;
    const k = nkey(o);
    if (ST_NEED[k] || k === '6,7') { if (hand) this.made.hand++; else this.made.auto++; }
    this.gain(o, src);
    fxFlash(x, y, 1.3, [255, 240, 200], .45); fxRing(x, y, .3, [255, 210, 140], 2.4, .6);
    if (j.r.why2) this.float(x, y + .7, j.r.why2, [255, 210, 160], 12);
    if (hand) Sfx.play('segment');
    return true;
  },
  // новое ядро +10 ✦; C, N, O — ещё +5
  gain(o, src) {
    const k = nkey(o), nm = NUC_NAME[k]; let pts = 0, txt = '';
    Codex.note('n:' + k);
    if (!this.seen.has(k)) { this.seen.add(k); pts += 10; txt = `НОВОЕ ${nm[0]} ${nm[1]}`; }
    if (ST_NEED[k]) pts += src === 'hand' ? 8 : 5; // своими руками — дороже
    if (!pts) return;
    if (src === 'auto') Uni.pay(this, 'syn', pts); else this.kn += pts; // звезда куёт сама — в сводку
    this.float(o.x, o.y - .4, `${txt || nm[0]} +${pts} ✦`, txt ? [255, 215, 110] : [140, 220, 255], txt ? 16 : 14);
  },
  beSplit(o, txt) {
    o.dead = true;
    const a = Math.random() * TAU;
    for (const s of [1, -1]) { const n = this.mk(2, 2, o.x + Math.cos(a) * .4 * s, o.y + Math.sin(a) * .4 * s, o.vx + Math.cos(a) * 2.2 * s, o.vy + Math.sin(a) * 2.2 * s); n.age = 1; n.nb = 1; n.mine = o.mine; }
    fxRing(o.x, o.y, .3, [255, 200, 150], 1.6, .5);
    this.float(o.x, o.y, txt, [255, 200, 150], 13);
  },
  cnt(k) { return this.o.filter(o => !o.dead && nkey(o) === k).length; },

  // ---------- фаза 1: облако ----------
  // зажал — в точке пальца гравитационная яма; масса комка — облачка ближе ST_NEAR; отпустил — решение: зажечь или нет
  tickGas(dt, live) {
    const c = this.gas.length ? centroid(this.gas) : { x: P.x, y: P.y };
    let w = null;
    if (live && mouse.down && !G.paused) { const [wx, wy] = S2W(mouse.x, mouse.y); w = { x: wx, y: wy }; this.learn.grab = true; }
    const was = this.well, cancel = !w && mouse.cancel; // второй палец (щипок) — отмена, а не «отпустил»
    if (cancel) mouse.cancel = false;
    if (w && !was) Tips.did('stars:gas'); // зажал — сделал то, о чём подсказка
    this.well = w;
    if (was && !w && live && !cancel && this.release(was)) return; // отпустил в золотой полосе — звезда зажглась
    const hold = (this.blowT -= dt) > 0 ? .25 : 1; // свет перебора ещё дует — яма держит слабо
    let near = 0;
    for (const g of this.gas) {
      g.age += dt;
      if (inRef(g.x, g.y, .5)) { g.vx += (c.x - g.x) * .05 * dt; g.vy += (c.y - g.y) * .05 * dt; } // газ в кадре стягивается сам — медленно; за краем — свой
      if (w) {
        const dx = w.x - g.x, dy = w.y - g.y, d = Math.hypot(dx, dy) || 1e-6;
        if (d < 6) { const f = (9 * (1 - d / 6) + 2) * hold; g.vx += dx / d * f * dt; g.vy += dy / d * f * dt; }
        if (d < ST_NEAR) near++;
      }
      const j = .9 * Math.sqrt(dt); g.vx += randn() * j; g.vy += randn() * j;
      const k = Math.exp(-dt * (w && hold === 1 && Math.hypot(w.x - g.x, w.y - g.y) < 3 ? 3 : .5)); g.vx *= k; g.vy *= k; // у ямы газ вязнет; сдутый — летит
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.src && G.prev) { const [px, py] = toPrev(g.x, g.y); g.src.x = px; g.src.y = py; g.src.vx = g.src.vy = 0; } // ядро гаснет там, где проявляется облачко
    }
    this.pressure(dt);
    this.near = near;
    this.gasTide(dt);
    // перебор: держишь комок тяжелее полосы — протозвезда засветилась, и её свет сдувает газ
    if (w && near > this.hi) { if ((this.overT += dt) > ST_OVER) this.blow(w); } else this.overT = 0;
    if (live && this.clock > ST_AUTO && this.phase === 'gas') this.ignite(c.x, c.y, 0, true); // не зажёг — облако схлопнулось само: звезда лёгкая
  },
  // тепловое давление: облачка ближе ST_PH расталкивают друг друга — густой комок без ямы расплывается (сетка ячеек ST_PH)
  pressure(dt) {
    const h = ST_PH, cells = new Map(), vis = this.gas.filter(g => inRef(g.x, g.y, 1)), key = (/** @type {number} */ i, /** @type {number} */ j) => i * 1e6 + j;
    for (const g of vis) { const k = key(Math.floor(g.x / h), Math.floor(g.y / h)); let cl = cells.get(k); if (!cl) cells.set(k, cl = []); cl.push(g); }
    for (const g of vis) {
      const i = Math.floor(g.x / h), j = Math.floor(g.y / h);
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const cl = cells.get(key(i + di, j + dj)); if (!cl) continue;
        for (const q of cl) {
          const dx = g.x - q.x, dy = g.y - q.y, d2 = dx * dx + dy * dy;
          if (q === g || d2 >= h * h || d2 < 1e-12) continue;
          const d = Math.sqrt(d2), f = ST_PK * (1 - d / h) * dt / d; g.vx += dx * f; g.vy += dy * f;
        }
      }
    }
  },
  // отпустил яму: комок в золотой полосе — звезда зажглась его массой; легче — давление разносит комок; тяжелее — перебор
  release(w) {
    const n = this.near || 0;
    if (n > this.hi) { this.blow(w); return false; }
    if (n >= this.lo) { this.ignite(w.x, w.y, this.muOf(n)); return true; }
    if (n >= this.lo * .4) { fxRing(w.x, w.y, ST_NEAR, [170, 200, 255], ST_NEAR * 2.2, .6); this.float(w.x, w.y - ST_NEAR, 'мало массы: давление разносит комок', [190, 210, 255], 13); }
    return false;
  },
  blow(w) {
    this.overT = 0; this.blowT = ST_BLOWT; this.st.blow++;
    for (const g of this.gas) {
      const dx = g.x - w.x, dy = g.y - w.y, d = Math.hypot(dx, dy) || 1e-6;
      if (d < 6) { const v = ST_BLOWV * (1 - d / 7), a = d > 1e-3 ? 0 : Math.random() * TAU; g.vx += (d > 1e-3 ? dx / d : Math.cos(a)) * v; g.vy += (d > 1e-3 ? dy / d : Math.sin(a)) * v; }
    }
    fxFlash(w.x, w.y, 3, [255, 210, 180], .6); fxRing(w.x, w.y, .5, [255, 120, 90], 7, .8);
    Sfx.play('fizzle');
    this.float(w.x, w.y - ST_NEAR - 1, 'перебор: свет протозвезды сдул газ', [255, 140, 110], 15);
    tipMsg('stars:blow', 'Слишком тяжёлая протозвезда светит так ярко, что сдувает свой газ');
  },
  // облако без края: газ Вселенной приходит из-за края кадра, чужой вдали растворяется
  gasTide(dt) {
    dissolveFar(this.gas);
    this.gas = this.gas.filter(g => !g.dead);
    const have = this.gas.filter(g => inView(g.x, g.y, .5)).length, want = popWant(ST_GAS_D, ST_GAS_CAP);
    for (let i = 0; i < 3 && have + i < want && Math.random() < dt * 30; i++) { const r = rimPos(.3); this.gas.push(this.puff(r.x, r.y, r.nx * 1.2 + randn() * .5, r.ny * 1.2 + randn() * .5, 0)); }
    haloFill(this.gas, ST_GAS_D, ST_GAS_CAP, dt, (x, y) => { this.gas.push(this.puff(x, y, randn() * .6, randn() * .6, 0)); }, 4); // и за краем — сдвинул карту, там то же
  },
  // Звезда зажглась: камера ныряет в комок. Мир вокруг него растягивается в U раз (на экране — без скачка),
  // газ комка становится ядрами недр на тех же местах (твой — первым), остальной газ комка растворяется в свечении.
  // mu — масса звезды на полосе (0 — лёгкая, 1 — тяжёлая): сколько живёт, насколько горячи недра, сколько в них ядер
  ignite(x, y, mu = .5, auto = false) {
    this.phase = 'core'; this.ignAt = this.clock; this.ignT = this.t; this.well = null;
    this.mu = mu; this.Ms = this.massOf(mu); this.life = lerp(ST_LIFE[0], ST_LIFE[1], mu); this.bf = lerp(ST_BF[0], ST_BF[1], mu); this.hBurn = lerp(ST_HBURN[0], ST_HBURN[1], mu);
    const U = ST_CORE / ST_CLUMP, lump = this.gas.filter(g => Math.hypot(g.x - x, g.y - y) < ST_CLUMP);
    rescale(U, x, y, [this.gas, this.o, this.floats]);
    for (const g of this.gas) g.s = U;
    P.x = x; P.y = y; P.vx = P.vy = 0; this.C = { x, y };
    fxFlash(x, y, 6 * U, [255, 230, 170], 1.2); fxRing(x, y, U, [255, 200, 120], 14 * U, 1.2);
    Sfx.play('ignite');
    lump.sort((a, b) => +b.mine - +a.mine || Math.random() - .5);
    for (const g of lump) g.core = 1;
    // ядро рождается там, где было облачко, и недра расширяются: k-е от центра уходит на свою долю радиуса (плотный комок не слипается)
    const nuc = lump.slice(0, Math.round(lerp(ST_NUCN[0], ST_NUCN[1], mu))).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    nuc.forEach((g, k) => {
      const he = g.he || Math.random() < .5; // в недрах водород уже горит в гелий
      const dx = g.x - x, dy = g.y - y, d = Math.hypot(dx, dy), an = d > 1e-6 ? Math.atan2(dy, dx) : Math.random() * TAU;
      const push = Math.max(0, ST_CORE * Math.sqrt((k + .5) / nuc.length) - d) * .9; // путь с трением .9 — ровно до места
      const o = this.mk(he ? 2 : 1, he ? 2 : 0, g.x, g.y, Math.cos(an) * push, Math.sin(an) * push); o.age = 0; o.mine = g.mine;
      if (g.li) this.float(g.x, g.y - .5, '⁷Li + p → 2 ⁴He', [210, 170, 255], 12); // литий в недрах не живёт: сгорает в гелий
    });
    // комок был жидковат (облако схлопнулось само) — недра всё равно не пустые
    for (let i = this.o.length; i < 18; i++) {
      const a = Math.random() * TAU, d = ST_CORE * Math.sqrt(Math.random()) * .9, he = i % 3 > 0;
      this.mk(he ? 2 : 1, he ? 2 : 0, x + Math.cos(a) * d, y + Math.sin(a) * d, randn() * .4, randn() * .4).age = -Math.random();
    }
    const kind = mu < 1 / 3 ? 'лёгкая: живёт долго, но недра прохладнее' : mu > 2 / 3 ? 'тяжёлая: недра горячие, но сгорит быстро' : 'в жаре недр атомы снова голые ядра';
    msg(auto ? `Облако схлопнулось само: звезда ${this.Ms} M☉, лёгкая. Гелий сливается в углерод` : `Звезда ${this.Ms} M☉ зажглась: ${kind}`);
    this.float(x, y - 1.6, `${this.Ms} M☉`, this.col(1), 20);
  },

  // ---------- фаза 2: ядро звезды ----------
  tickCore(dt, live) {
    for (const o of this.o) {
      if (o.dead) continue;
      o.age += dt; o.nb -= dt; o.rot += dt * .6;
      if (o.Z === 4 && (o.life -= o.held ? dt * .5 : dt) <= 0) { o.held = false; this.beSplit(o, '⁸Be → 2 ⁴He'); continue; } // и в руке живёт миг (вдвое дольше — успеть прицелиться)
      if (o.held) continue;
      if (this.doneAt !== null) { const k = Math.exp(-dt * 1.5); o.vx *= k; o.vy *= k; } // выброс сверхновой тормозит и остывает
      else if (o.fly > 0) { if ((o.fly -= dt) <= 0) o.thrown = null; }
      else {
        const j = .55 * Math.sqrt(dt); o.vx += randn() * j; o.vy += randn() * j;
        const k = Math.exp(-dt * .9); o.vx *= k; o.vy *= k;
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
    }
    if (!live) return;
    this.coreTide(dt);
    for (const o of this.o) {
      if (o.dead || !o.thrown) continue;
      for (const q of this.o) {
        if (q === o || q.dead || q.held || q.age < .3) continue;
        if (Math.hypot(q.x - o.x, q.y - o.y) < (o.rad + q.rad) * .8) { this.collide(o, q, Math.hypot(o.vx - q.vx, o.vy - q.vy), o.thrown); break; }
      }
    }
    if (this.doneAt !== null) return;
    // звезда сама жжёт водород: 4p → ⁴He
    if ((this.hT += dt) > (this.hBurn ?? 3.5)) { // тяжёлая звезда жжёт водород быстрее
      const ps = this.o.filter(o => nkey(o) === '1,0' && this.free(o) && o.age > 1 && inRef(o.x, o.y));
      if (ps.length >= 6) {
        this.hT = 0; const p0 = ps[Math.random() * ps.length | 0];
        const four = ps.sort((u, v) => Math.hypot(u.x - p0.x, u.y - p0.y) - Math.hypot(v.x - p0.x, v.y - p0.y)).slice(0, 4);
        const c = centroid(four); four.forEach(p => p.dead = true);
        const he = this.mk(2, 2, c.x, c.y); he.age = .6;
        fxRing(c.x, c.y, .3, [255, 240, 180], 1.8, .6); this.float(c.x, c.y, '4p → ⁴He', [255, 230, 170], 12);
      }
    }
    // гелий изредка слипается в ⁸Be сам — лови его (после того как первый ⁸Be ты слепил сам: первый раз — руками)
    if (this.seen.has('4,4') && (this.beT -= dt) <= 0) {
      this.beT = 2.4;
      const al = this.o.filter(o => nkey(o) === '2,2' && this.free(o) && o.age > 1);
      if (al.length >= 4 && this.cnt('4,4') < 2) {
        let best = null, bd = 3.2;
        for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) { const d = Math.hypot(al[i].x - al[j].x, al[i].y - al[j].y); if (d < bd) { bd = d; best = [al[i], al[j]]; } }
        // скорость — внутри окна слияния (барьер растёт вместе с N_SPD); сообщение — только если ⁸Be правда родился
        if (best && this.collide(best[0], best[1], lerp(this.vBar(best[0], best[1]), this.vMax(best[0], best[1]), .3), null) && !this.learn.be) { this.learn.be = true; tipMsg('stars:be', '⁸Be живёт миг: нужно успеть бросить в него ещё ⁴He'); }
      }
    }
    this.autoFuse(dt);
  },
  // «Звёздный синтез»: звезда бросает сама — туда, чего не хватает к сверхновой
  autoFuse(dt) {
    if (!this.rs.syn || Uni.off(this, 'syn') || (this.autoCd -= dt) > 0) return;
    this.autoCd = 1.4;
    const need = k => (ST_NEED[k] || 0) - this.cnt(k);
    const want = [];
    const spareC = this.cnt('6,6') > ST_NEED['6,6']; // ¹²C в O и N — только лишний: собранные к сверхновой не трогаем
    if (need('8,8') > 0 && spareC) want.push(['6,6', '2,2', 3]);
    if (need('7,7') > 0) { want.push(['6,7', '1,0', 4]); if (spareC) want.push(['6,6', '1,0', 2]); }
    want.push(['4,4', '2,2', 5]);
    const f = this.o.filter(o => this.free(o) && o.age > .8 && inRef(o.x, o.y, -1));
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

  // недра без края: конвекция подносит p и ⁴He из-за края кадра — того, чего вокруг меньше; чужое вдали растворяется
  coreTide(dt) {
    dissolveFar(this.o, o => o.held || o.fly > 0);
    for (const g of this.gas) if (farOff(g)) g.dead = true; // остаток облака позади — и твой: ты уже внутри звезды
    if (this.doneAt !== null) return;
    const vis = this.o.filter(o => !o.dead && inView(o.x, o.y, 1));
    if (vis.length < popWant(ST_CORE_D, ST_CORE_CAP) && Math.random() < dt * 4) {
      const nP = vis.filter(o => nkey(o) === '1,0').length, nA = vis.filter(o => nkey(o) === '2,2').length;
      const he = nA < nP * 1.2, r = rimPos(1), sp = rnd(1.2, 2.2);
      this.mk(he ? 2 : 1, he ? 2 : 0, r.x, r.y, r.nx * sp + randn() * .4, r.ny * sp + randn() * .4).age = 0;
    }
    haloFill(this.o, ST_CORE_D, ST_CORE_CAP, dt, (x, y) => { const he = Math.random() < .45; this.mk(he ? 2 : 1, he ? 2 : 0, x, y, randn() * .4, randn() * .4).age = 0; }, 2);
  },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt;
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    if (live && !this.yShown && !G.prev) { // итог «Ядер» — в облаке: сколько в нём гелия (подольше обычного всплывающего)
      this.yShown = true; this.float(P.x, P.y + 2.5, `гелий из «Ядер»: ${Math.round(this.heP * 100)} %`, [255, 225, 150], 16); this.floats[this.floats.length - 1].t = -1.4;
    }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.6);
    if (this.phase === 'gas') { if (act) this.tickGas(dt, live); }
    else {
      if (live && this.doneAt === null) this.sl.update();
      for (const g of this.gas) { // остаток облака; газ комка растворяется в свечении недр
        g.x += g.vx * dt; g.y += g.vy * dt; g.age += dt; g.s += (1 - g.s) * Math.min(1, dt * .8);
        if (g.core && (g.core -= dt * .9) <= 0) g.dead = true;
      }
      this.gas = this.gas.filter(g => !g.dead);
      this.tickCore(dt, act);
    }
    this.o = this.o.filter(o => !o.dead);
    if (!live) return;
    if (this.doneAt === null) this.tickStars(false);
    if (this.doneAt === null && (this.steps().every(s => s.d) || this.rest() <= 0)) { this.failed = !this.steps().every(s => s.d); this.supernova(); } // звезда догорела — без бонуса уровня
    if (this.boom > 0) this.boom -= dt;
    if (this.endCd > 0 && (this.endCd -= dt) <= 0 && !this.advanced) { this.advanced = true; advance(); } // атомам — эти же ядра, там, куда их вынесло
  },
  // Сверхновая: недра разлетаются от тебя — дальнее быстрее (как растёт шар), выброс тормозит и остывает;
  // камера отъезжает вместе с ним к масштабу атомов
  supernova() {
    this.doneAt = this.clock; this.endCd = ST_BOOM; this.boom = ST_BOOM; this.sl.held = null;
    const cx = P.x, cy = P.y, R = viewRadius();
    this.C = { x: cx, y: cy };
    for (const o of this.o) {
      o.held = false; o.fly = 0; o.thrown = null;
      const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy) || 1, v = 1.5 + 5 * Math.min(1.4, d / R * 1.6) + rnd(-.5, .5);
      o.vx = dx / d * v; o.vy = dy / d * v;
    }
    fxFlash(cx, cy, 10, [255, 250, 230], 1.6); fxRing(cx, cy, 2, [255, 220, 160], 30, 2);
    Sfx.play('overheat'); Sfx.play('segment');
    this.tickStars(true);
    msg('Миллионы лет спустя: звезда дожгла всё до железа, ядро схлопнулось — сверхновая! Выкованные ядра разлетаются по Вселенной');
  },

  // сколько звезде осталось до сверхновой (тяжёлая сгорает быстрее)
  rest() { return this.ignAt === null ? Infinity : this.ignAt + this.life - this.clock; },
  // цвет звезды по массе: лёгкая — оранжевая, тяжёлая — голубовато-белая (k: 0 — свечение недр, 1 — яркое)
  col(k = 0) { const m = this.mu ?? .5; return k ? mixc([255, 205, 130], [200, 220, 255], m) : mixc([255, 150, 70], [140, 170, 255], m); },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.phase === 'core' && this.seen.has('6,6') && !this.rs.syn && this.doneAt === null ? [{ ic: '✺', name: 'Звёздный синтез', about: 'звезда куёт ядра', c: ST_COST }] : []; },
  keyOf() { return this.shopItems().length ? 1 : null; },
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - 1.5, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.rs.syn = 1; this.autoCd = .4; Sfx.play('upgrade'); Uni.learn(this, 'syn', '✺', 'Звёздный синтез', UNI_LVL);
    fxRing(P.x, P.y, 1, GOLD, viewRadius() * .8, 1.4); this.float(P.x, P.y - 1.5, '✺ Звёздный синтез', GOLD, 16);
  },
  renderShop: Nuclei.renderShop,

  // ---------- задание ----------
  steps() {
    const s = this.seen, gasP = this.phase === 'gas' ? Math.min(100, Math.round((this.near || 0) / this.lo * 100)) : 100;
    const n = k => this.cnt(k);
    return [
      { t: 'Зажечь звезду', h: 'зажать и вести: гравитация сгребает газ; отпустить в золотой полосе', p: [gasP, 100], s: 'звезда горит', d: this.phase === 'core' },
      { t: 'Сделать углерод', h: '⁴He в ⁴He → ⁸Be (живёт миг), затем в него ещё ⁴He', items: [['⁸Be', s.has('4,4')], ['¹²C', s.has('6,6')]], s: 'углерод', d: s.has('6,6') },
      { t: 'Сделать кислород', h: 'бросить ⁴He в ¹²C', s: 'кислород', d: s.has('8,8') },
      { t: 'Сделать азот', h: 'бросить протон в ¹²C, потом ещё один', items: [['¹³C', s.has('6,7')], ['¹⁴N', s.has('7,7')]], s: 'азот', d: s.has('7,7') },
      { t: 'Сформировать закон «Звёздный синтез»', h: `${isTouch() ? 'в лавке' : 'клавиша 1'} за ${ST_COST} ✦`, s: 'звёздный синтез', d: this.rs.syn > 0, res: 'syn' },
      { t: 'Накопить на сверхновую', h: 'C, N, O — для жизни; дальше до железа звезда догорит сама, железное ядро схлопнется — и взрыв разнесёт их', items: [[`¹²C ${Math.min(n('6,6'), 2)}/2`, n('6,6') >= 2], [`¹⁶O ${Math.min(n('8,8'), 2)}/2`, n('8,8') >= 2], [`¹⁴N ${Math.min(n('7,7'), 1)}/1`, n('7,7') >= 1]], s: 'сверхновая', d: Object.keys(ST_NEED).every(k => n(k) >= ST_NEED[k]) },
    ];
  },
  starPool() {
    return [
      { t: 'зажечь звезду за 0:15', ok: () => this.ignAt !== null && this.ignAt <= 15, bad: () => this.ignAt === null && this.clock > 15 },
      { t: 'звезда тяжелее 40 M☉', ok: () => (this.Ms ?? 0) >= 40, bad: () => this.Ms !== null && this.Ms < 40 },
      { t: 'без отскоков от барьера', bad: () => this.st.bounce > 0, atEnd: true },
      { t: 'без разбитых ⁸Be', bad: () => this.st.shat > 0, atEnd: true },
      { t: `быстрее ${fmtClock(ST_PAR)}`, bad: () => this.clock > ST_PAR, atEnd: true },
      { t: 'кислорода больше, чем углерода', ok: () => this.cnt('8,8') > this.cnt('6,6') && this.cnt('8,8') >= 2 },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 2, '★ +10 ✦', [255, 215, 110], 17); }, this.failed); },
  tally() {
    const n = this.made.hand + this.made.auto;
    return { name: 'Звёзды', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['¹²C · ¹⁶O · ¹⁴N', `${this.cnt('6,6')} · ${this.cnt('8,8')} · ${this.cnt('7,7')}`], ['выковано рогаткой', this.made.hand], ['выковано звездой', this.made.auto]], auto: [this.made.auto, n], stars: this.stars };
  },
  cheat() {
    this.cheated = true;
    if (this.phase === 'gas') this.ignite(P.x, P.y);
    for (const k of ['4,4', '6,6', '6,7', '7,7', '8,8']) this.seen.add(k);
    for (const k of ['4,4', '6,6', '6,7', '7,7', '8,8']) Codex.note('n:' + k);
    for (const [k, n] of Object.entries(ST_NEED)) for (let i = 0; i < n; i++) { const [Z, N] = k.split(',').map(Number); const o = this.mk(Z, N, P.x + rnd(-4, 4), P.y + rnd(-4, 4)); o.age = 1; o.mine = true; }
    this.rs.syn = 1;
  },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    if (this.phase === 'core') { // недра звезды — повсюду вокруг: горячее зернистое свечение (разгорается, гаснет со сверхновой)
      const k = (this.doneAt === null ? 1 : Math.max(0, this.boom / ST_BOOM)) * clamp((this.t - (this.ignT ?? -9)) / 1.5, 0, 1), cx = G.W / 2, cy = G.H / 2, R = Math.hypot(G.W, G.H) / 2;
      glow(cx, cy, R * 1.15, this.col(0), .3 * al * k); // цвет — по массе звезды: лёгкая оранжевая, тяжёлая голубая
      glow(cx, cy, R * .5, this.col(1), .14 * al * k);
      // зёрна конвекции — на сетке мира: плывут вместе с картой
      const gx = Math.round(cam.x / 4) * 4, gy = Math.round(cam.y / 4) * 4;
      for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) {
        const cx2 = gx + i * 4, cy2 = gy + j * 4, h = (cx2 * 12.9898 + cy2 * 78.233) % TAU;
        const [sx, sy] = W2S(cx2 + Math.cos(h + G.T * .2) * 1.5, cy2 + Math.sin(h * 1.7 + G.T * .2) * 1.5);
        if (onScreen(sx, sy, 2 * z)) glow(sx, sy, 1.8 * z, this.col(1), (.06 + .04 * Math.sin(G.T * 2 + h)) * al * k);
      }
    }
    for (const g of this.gas) {
      const [sx, sy] = W2S(g.x, g.y); if (!onScreen(sx, sy, 10)) continue;
      const a = al * appear(g.age) * (this.phase === 'core' ? .25 + .75 * clamp(g.core || 0, 0, 1) : 1), gs = g.s || 1;
      glow(sx, sy, Math.max(3, .45 * gs * z), g.li ? [200, 150, 255] : g.he ? [255, 225, 150] : [170, 200, 255], .45 * a); ball(sx, sy, Math.max(1, .12 * gs * z), g.li ? [230, 210, 255] : g.he ? [255, 240, 200] : [220, 235, 255], .9 * a);
    }
    if (this.well) this.drawGauge(al);
    for (const o of this.o) {
      this.drawNuc(o, al);
      if (o.Z === 4 && !o.dead) { const [sx, sy] = W2S(o.x, o.y); arc(sx, sy, (o.rad + .25) * z, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.life / BE_LIFE, 0, 1), [255, 140, 110], .85 * al, 2.5); }
    }
    ctx.globalAlpha = 1;
  },
  // весы массы у ямы: дуга-шкала; серое — мало (меньше массы Джинса), золотая полоса — отпустить и зажечь, красное — перебор.
  // Над ней — что будет, если отпустить сейчас (как вердикт у рогатки), под ней — какая выйдет звезда
  drawGauge(al) {
    const z = cam.z, [wx, wy] = W2S(this.well.x, this.well.y), n = this.near || 0, top = this.hi * 1.25, R = ST_NEAR * z + 9;
    const A = (/** @type {number} */ q) => -Math.PI / 2 + TAU * clamp(q / top, 0, 1), inB = n >= this.lo && n <= this.hi, over = n > this.hi, mu = this.muOf(n);
    const c = over ? [255, 110, 90] : inB ? mixc([255, 205, 130], [200, 220, 255], mu) : [190, 200, 225];
    ring(wx, wy, 6 * z, [255, 255, 255], .12 * al, 1, [5, 7]); // докуда тянет яма
    glow(wx, wy, ST_NEAR * z, inB ? c : [255, 200, 120], (.15 + .5 * clamp(n / this.hi, 0, 1)) * al);
    arc(wx, wy, R, A(0), A(this.lo), [255, 255, 255], .14 * al, 7);
    arc(wx, wy, R, A(this.lo), A(this.hi), GOLD, (.3 + .15 * Math.sin(G.T * 5)) * al, 7);
    arc(wx, wy, R, A(this.hi), A(top), [255, 90, 70], .32 * al, 7);
    arc(wx, wy, R, A(0), A(n), c, .95 * al, 3);
    const top2 = over ? 'перебор: свет сдует газ' : inB ? `отпустить: звезда ${this.massOf(mu)} M☉` : 'мало массы';
    label(top2, wx, wy - R - 14, 14, over ? [255, 140, 110] : inB ? GOLD : [200, 210, 230], .9 * al, 800);
    if (inB) label(mu < 1 / 3 ? 'лёгкая: живёт долго, кислород трудно' : mu > 2 / 3 ? 'тяжёлая: горячо, но взорвётся скоро' : 'средняя', wx, wy + R + 16, 12, c, .8 * al, 700);
  },
  drawPlayer(al) {
    ctx.globalAlpha = al;
    if (this.phase === 'core') this.sl.draw(al);
    if (G.started && !G.paused && !G.prev && this.doneAt === null) {
      if (this.phase === 'gas' && !this.well && Tips.ok('stars:gas')) { label('зажать и вести: газ сгребается в комок, отпустить в золотой полосе', G.W / 2, G.H * .62, 15, [255, 255, 255], (.75 + .2 * Math.sin(G.T * 4)) * al, 700); ghostSweep(G.W / 2, G.H * .62 - 80, al); }
      if (this.phase === 'core' && this.sl.shots === 0 && !this.sl.held) {
        const be = this.o.find(o => o.Z === 4) || this.o.find(o => nkey(o) === '2,2' && o.age > .3);
        if (be && Tips.ok('stars:sling')) { const [sx, sy] = W2S(be.x, be.y), r = be.rad * cam.z + 8 + 3 * Math.sin(G.T * 5); ring(sx, sy, r, GOLD, .8 * al, 2); label(be.Z === 4 ? 'бросить в ⁸Be ещё ⁴He' : 'зажать ⁴He, оттянуть, отпустить в другой', sx, sy + r + 16, 13, [255, 255, 255], .85 * al, 700);
          // курсор сам бросает ⁴He: в ⁸Be (если он есть) или в соседний ⁴He
          const he = this.o.filter(o => o !== be && nkey(o) === '2,2' && o.age > .3).sort((u, v) => Math.hypot(u.x - be.x, u.y - be.y) - Math.hypot(v.x - be.x, v.y - be.y))[0];
          if (he) { const [hx, hy] = W2S(he.x, he.y); if (onScreen(hx, hy, 0)) { if (be.Z === 4) ghostSling(hx, hy, sx, sy, al); else ghostSling(sx, sy, hx, hy, al); } } }
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
    // звезда горит: её масса и сколько ей осталось (последние 20 с — красным)
    if (this.phase === 'core' && this.doneAt === null && !G.prev) { const r = Math.max(0, this.rest()); label(`звезда ${this.Ms} M☉ · сверхновая через ${fmtClock(r)}`, G.W / 2, aboveShop(), 13, r < 20 ? [255, 140, 110] : this.col(1), .85 * al, 700); }
    hudBanner(this.banner, 'УРОВЕНЬ 4 · 100 млн лет', 'Звёзды', 'Через 380 000 лет ядра H и He поймали электроны: первые атомы, Вселенная прозрачна. Сжать облако атомов в звезду и выковать в ней углерод, кислород и азот', al, 'в звёздах куётся углерод → без него не будет живого');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  // газ — широко; недра — ближе; сверхновая — камера отъезжает с выбросом к масштабу атомов
  viewR() { return this.phase === 'gas' ? ST_GR + 1 : this.doneAt === null ? ST_VIEW : lerp(ST_VIEW, A_VIEW, smooth(0, 1, 1 - this.boom / ST_BOOM)); },
  hud() { return { title: '', sub: this.phase === 'gas' ? `атомы H, He · гелий ${Math.round(this.heP * 100)} %${this.Yin !== null ? ' с «Ядер»' : ''} · T ≈ 200 K` : `${this.Ms} M☉ · T ≈ ${(1 + (this.mu ?? .5)).toFixed(1).replace('.', ',')}·10⁸ K`, lines: [], goal: '', laws: [] }; },
};
