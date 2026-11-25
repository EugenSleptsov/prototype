"use strict";
/* Кодекс открытий.
   - known: что игрок видел хоть раз в любом забеге (хранится в браузере).
   - run:   что открыто в ЭТОМ забеге. Только открытое в забеге Вселенная умеет рождать сама.
   Открыть = увидеть своими глазами: событие должно случиться внутри круга детектора. */
// Поколения открываются по порядку: тяжёлое поколение — «та же» частица, только тяжелее, и родиться ей
// можно, лишь когда открыто лёгкое. μ — после e, τ — после μ; c и s — после u и d; t и b — после c и s.
/** @type {Record<string, string[]>} */
const GEN_PREV = { mu: ['e'], ta: ['mu'], c: ['u', 'd'], s: ['u', 'd'], t: ['c', 's'], b: ['c', 's'] };
const GEN_N = ['', 'I', 'II', 'III'], GEN_SP = [[], ['u', 'd', 'e'], ['c', 's', 'mu'], ['t', 'b', 'ta']];
// текущее поколение — первое, где открыто ещё не всё (нейтрино не в счёт)
const genCur = () => { for (let g = 1; g <= 3; g++) if (!GEN_SP[g].every(k => Codex.has(k))) return g; return 4; };
const genOpen = sp => (GEN_PREV[sp] || []).every(k => Codex.has(k));
const genNeed = sp => (GEN_PREV[sp] || []).filter(k => !Codex.has(k));
const Codex = {
  known: new Set(), run: new Set(), dirty: true,
  /** что Вселенная рождает сама (исследовано); заводит уровень частиц */
  auto: /** @type {Set<string>} */ (new Set()),
  load() {
    try { const s = JSON.parse(localStorage.getItem('protoCodex') || '[]'); this.known = new Set(s); } catch (e) { this.known = new Set(); }
  },
  save() { try { localStorage.setItem('protoCodex', JSON.stringify([...this.known])); } catch (e) { } },
  has(k) { return this.run.has(k); },
  // Возвращает 'new' (впервые вообще), 'run' (впервые в этом забеге) или false.
  // rx — как родилась: { l: [[символ, вид]], r: [[символ, вид]], k: сила удара } — сцена открытия покажет схему
  see(k, rx) {
    if (this.run.has(k)) return false;
    this.run.add(k); this.dirty = true;
    const first = !this.known.has(k);
    if (first) { this.known.add(k); this.save(); }
    Sfx.play('fresh');
    // открылось следующее поколение — сказать на той же карточке, кто теперь может родиться
    const nx = Object.keys(GEN_PREV).filter(sp => GEN_PREV[sp].includes(k) && !this.run.has(sp) && genOpen(sp));
    const then = G.stage && G.stage.seeNext ? G.stage.seeNext(k) : ''; // уровень подсказывает, что дальше
    showCard(k, first, nx.length ? `Открыто ${GEN_N[SM[nx[0]].gen]} поколение: теперь могут родиться ${nx.map(sp => SM[sp].sym).join(' и ')}` : then || '', rx);

    return first ? 'new' : 'run';
  },
  // Сетка Стандартной модели: три поколения материи + бозоны
  LAYOUT: [['u', 'c', 't', 'g', 'H'], ['d', 's', 'b', 'ph', ''], ['e', 'mu', 'ta', 'Z', ''], ['ne', 'nm', 'nt', 'W', '']],
  // всё, что открыто кроме частиц (ядра, атомы, молекулы): ключи 'n:Z,N', 'a:Z', 'm:формула'
  note(k) {
    if (this.run.has(k)) return;
    this.run.add(k); this.dirty = true;
    if (!this.known.has(k)) { this.known.add(k); this.save(); }
  },
  st(k) { return this.run.has(k) ? 'on' : this.known.has(k) ? 'old' : 'off'; },
  // На экране — маленькая сетка (уровень частиц) или фишка «Кодекс» (дальше); клик — окно кодекса
  render(show) {
    const el = document.getElementById('codex');
    if (show === null) { el.style.display = 'none'; this.mode = 'none'; return; } // пока ничего не открыто — кодекса нет
    el.style.display = 'block';
    const mode = show ? 'grid' : 'chip';
    if (!this.dirty && this.mode === mode) return;
    this.dirty = false; this.mode = mode;
    el.className = mode;
    if (!el.onclick) el.onclick = () => this.open();
    if (mode === 'chip') {
      el.innerHTML = '<b>Кодекс <i>C</i></b>';
      return;
    }
    let n = 0;
    const cells = this.LAYOUT.flat().map(k => {
      if (!k) return '<div></div>';
      const s = SM[k], lock = !this.run.has(k) && !genOpen(k), st = this.run.has(k) ? 'on' : lock ? 'lock' : this.known.has(k) ? 'old' : 'off';
      if (st === 'on') n++;
      const tip = lock ? `откроется после ${genNeed(k).map(x => SM[x].sym).join(' и ')}` : st === 'off' ? '?' : s.name;
      return `<div class="cx ${s.kind} ${st}${st === 'on' && this.auto && this.auto.has(k) ? ' auto' : ''}" title="${tip}">${lock ? '·' : st === 'off' ? '?' : s.sym}</div>`;
    }).join('');
    const gc = genCur(), head = [1, 2, 3].map(g => `<div class="gh ${g < gc ? 'done' : g === gc ? 'cur' : ''}">${g < gc ? '✓' : GEN_N[g]}</div>`).join('') + '<div></div><div></div>';
    el.innerHTML = `<b>Кодекс · ${n}/17 <i>C</i></b><div class="cxg">${head}${cells}</div>`;
  },

  // ---------- окно кодекса ----------
  isOpen: false, tab: 'sm', sel: null,
  open(tab) {
    if (this.isOpen) return;
    this.isOpen = true; this.wasPaused = G.paused; G.paused = true; mouse.down = false;
    this.tab = tab || (G.stage && CX_TAB_OF[G.stage.key]) || 'sm'; this.sel = null;
    const m = document.getElementById('cxm');
    if (!m.onclick) m.onclick = e => {
      if (e.target === m || e.target.id === 'cxx') return this.close();
      const t = e.target.closest('[data-tab]'); if (t) { this.tab = t.dataset.tab; this.sel = null; return this.draw(); }
      const c = e.target.closest('[data-k]'); if (c) { this.sel = c.dataset.k; this.draw(); }
    };
    m.style.display = 'flex';
    this.draw();
  },
  close() {
    if (!this.isOpen) return;
    this.isOpen = false; G.paused = !!this.wasPaused;
    document.getElementById('cxm').style.display = 'none';
  },
  toggle() { if (this.isOpen) this.close(); else this.open(); },
  draw() {
    const T = CX[this.tab], items = T.items(), real = items.filter(it => !it.gap), on = real.filter(it => it.st === 'on').length, ever = real.filter(it => it.st !== 'off').length;
    document.getElementById('cxtabs').innerHTML = Object.keys(CX).map(k => {
      const its = CX[k].items().filter(it => !it.gap), got = its.filter(it => it.st !== 'off').length;
      return `<button data-tab="${k}" class="${k === this.tab ? 'on' : ''}">${CX[k].n} <span>${got}/${its.length}</span></button>`;
    }).join('');
    document.getElementById('cxt').textContent = `${T.title} · ${on}/${real.length}${ever > on ? ` (за все забеги ${ever})` : ''}`;
    const grid = document.getElementById('cxgrid');
    grid.style.gridTemplateColumns = `repeat(${T.cols}, minmax(0,1fr))`;
    grid.innerHTML = (T.head ? T.head() : '') + items.map(it => it.gap ? '<div></div>' :
      `<button data-k="${it.k}" class="cc ${it.cls || ''} ${it.st}${this.sel === it.k ? ' sel' : ''}"><b>${it.st === 'off' ? '?' : it.sym}</b><small>${it.st === 'off' ? (it.hint || '') : it.sub || ''}</small></button>`).join('');
    const it = items.find(x => x.k === this.sel);
    document.getElementById('cxi').innerHTML = it ? this.card(it) : `<div class="ce">${T.empty}</div>`;
  },
  card(it) {
    if (it.st === 'off') return `<div class="ch"><span class="cb off">?</span><div><b>Ещё не открыто</b><small>${it.how || ''}</small></div></div>`;
    const rows = it.rows.filter(r => r[1] !== '' && r[1] != null).map(([a, b]) => `<div><span>${a}</span>${b}</div>`).join('');
    return `<div class="ch"><span class="cb ${it.cls || ''}">${it.sym}</span><div><b>${it.name}</b><small>${it.kind}${it.st === 'old' ? ' · в прошлых забегах' : ''}</small></div></div>` +
      `<div class="cr">${rows}</div>` + (it.fact ? `<div class="cfx">${it.fact}</div>` : '');
  },
};
Codex.load();

// ---------- данные окна: вкладки ----------
const fmtMass = m => !m ? '0' : m >= 1 ? m.toFixed(1) + ' ГэВ' : m >= .001 ? (m * 1000).toFixed(1) + ' МэВ' : (m * 1e6).toFixed(0) + ' кэВ';
const fmtQ = q => Math.abs(q) < 1e-6 ? '0' : (q > 0 ? '+' : '−') + ({ '0.33': '⅓', '0.67': '⅔', '1.00': '1' })[Math.abs(q).toFixed(2)];
const SM_KIND = { quark: 'кварк', lepton: 'лептон', nu: 'нейтрино', boson: 'бозон' };
const SM_DEC = {
  t: 't → b + W⁺', b: 'b → c + e⁻ + ν̄e', c: 'c → s + e⁺ + νe', s: 's → u + e⁻ + ν̄e',
  mu: 'μ → e + ν̄e + νμ', ta: 'τ → μ + ν̄μ + ντ', W: 'W⁺ → ℓ⁺ + ν или u + d̄', Z: 'Z → частица + античастица',
  H: 'H → b + b̄ (чаще всего), τ τ̄, c c̄, γγ, gg',
};
const NUC_ORDER = ['1,0', '0,1', '1,1', '1,2', '2,1', '2,2', '3,3', '3,4', '4,3', '4,4', '6,6', '6,7', '7,7', '8,8'];
const NUC_UNST = { '0,1': 'распадается: n → p + e⁻ + ν̄e', '1,2': 'распадается в ³He', '4,3': 'ловит электрон и становится ⁷Li', '4,4': 'сразу распадается на два ⁴He' };
const NUC_FACT = {
  '1,0': 'Ядро водорода. Поймает электрон — станет атомом H.',
  '0,1': 'Один, без ядра, живёт около 15 минут.',
  '1,1': 'Хрупкий: пока горячо, свет его разбивает. Через него идёт весь синтез.',
  '1,2': 'Сверхтяжёлый водород, радиоактивный.',
  '2,1': 'Лёгкий гелий: два протона и один нейтрон.',
  '2,2': 'Очень прочное ядро. Четверть массы обычного вещества — гелий-4.',
  '3,3': 'Литий — самое тяжёлое, что успел сделать Большой взрыв.',
  '3,4': 'Литий — самое тяжёлое, что успел сделать Большой взрыв.',
  '4,3': 'Через него в ранней Вселенной получился почти весь литий-7.',
  '4,4': 'Живёт мгновения. Звезда успевает бросить в него третий гелий.',
  '6,6': 'Три гелия — один углерод. Из него строится вся органика.',
  '6,7': 'Шаг на пути от углерода к азоту.',
  '7,7': 'Углерод и два протона. Сейчас его больше всего в воздухе.',
  '8,8': 'Углерод и гелий. Третий по количеству элемент во Вселенной.',
};
const ATOM_ORDER = [1, 2, 6, 7, 8];
const ATOM_INFO = {
  1: ['водород', 1, 'Протон и электрон. Самый частый атом во Вселенной.'],
  2: ['гелий', 0, 'Два электрона закрывают оболочку — связей не делает.'],
  6: ['углерод', 4, 'Четыре связи: строит цепи и кольца. Основа органики.'],
  7: ['азот', 3, 'Три связи. Без него нет белков и ДНК.'],
  8: ['кислород', 2, 'Две связи. Вода, дыхание, огонь.'],
};
const MOL_FACT = {
  'H₂': 'Самая простая молекула: два водорода на общей паре электронов.',
  'H₂O': 'Угол 104,5° делает воду полярной — она растворяет почти всё.',
  'NH₃': 'Азот с тремя водородами. Сырьё для аминокислот.',
  'CH₄': 'Углерод с четырьмя водородами по углам тетраэдра.',
  'H₂O₂': 'Связь O–O легко рвётся — отсюда отбеливающая сила.',
  'CH₃OH': 'Простейший спирт. Найден в межзвёздных облаках.',
  'C₂H₆': 'Первая связь углерод–углерод: начало цепей.',
  'CH₃NH₂': 'Углерод и азот вместе — шаг к аминокислотам.',
  'N₂H₄': 'Связь N–N. Ракетное топливо.',
  'NH₂OH': 'Азот и кислород в одной молекуле.',
  'C₂H₅OH': 'Два углерода и спиртовая группа.',
};
const HAD_ORDER = ['p', 'n', 'delta', 'meson', 'qq', 'tetra', 'penta', 'hexa'];
const HAD_LIFE = { p: 'стабилен', n: 'в ядре — стабилен', delta: 'мгновения → нуклон + пион', meson: 'π⁰ — миг, π± — дольше', qq: 'только внутри адрона', tetra: 'мгновения', penta: 'мгновения', hexa: 'мгновения' };
const HAD_HOW = {
  p: 'Три кварка R·G·B: два u и d.', n: 'Три кварка R·G·B: u и два d.', delta: 'Три одинаковых аромата: ● ● ● или ◆ ◆ ◆.', meson: 'Кварк и антикварк одного цвета: разной формы — π±, одной — π⁰.',
  qq: 'Отпусти поле с двумя кварками разных цветов.', tetra: 'Сожми полем два мезона.', penta: 'Сожми полем барион и мезон.', hexa: 'Сожми полем два бариона.',
};
const HAD_FACT = {
  p: 'Ядро водорода. Живёт дольше, чем существует Вселенная.',
  n: 'Без заряда. Один живёт около 15 минут, в ядре — вечно.',
  delta: 'Тяжелее протона на треть и распадается за 10⁻²³ с.',
  meson: 'Пионы держат протоны и нейтроны вместе в ядре. π± перезаряжают нуклон: π⁺ + n → p.',
  qq: 'Цветной, поэтому один не бывает. Внутри бариона пара кварков часто держится вместе.',
  tetra: 'Два кварка и два антикварка. Первые надёжные найдены в 2000–2010-х.',
  penta: 'Четыре кварка и антикварк. Открыт на LHCb в 2015 году.',
  hexa: 'Шесть кварков. Кандидат — d*(2380), эксперимент WASA, 2014 год.',
};
const CX_TAB_OF = { particles: 'sm', quarks: 'h', nuclei: 'n', stars: 'n', atoms: 'a', molecules: 'm' };
const CX = {
  sm: {
    n: 'Частицы', title: 'Стандартная модель', cols: 5, empty: 'Нажми на открытую частицу — масса, заряд, распады.',
    head: () => { const gc = genCur(); return [1, 2, 3].map(g => `<div class="gh ${g < gc ? 'done' : g === gc ? 'cur' : ''}">${g < gc ? '✓ ' : ''}${GEN_N[g]}</div>`).join('') + '<div class="gh">бозоны</div><div class="gh"></div>'; },
    items: () => Codex.LAYOUT.flat().map(k => {
      if (!k) return { gap: true };
      const s = SM[k], lock = !Codex.run.has(k) && !genOpen(k);
      return {
        k, sym: s.sym, name: s.name, cls: s.kind, kind: SM_KIND[s.kind] + (s.gen ? ` · ${GEN_N[s.gen]} поколение` : ''),
        st: Codex.st(k), sub: s.m ? fmtMass(s.m) : '0', hint: lock ? '🔒' : '',
        how: lock ? `Откроется после ${genNeed(k).map(x => SM[x].sym).join(' и ')}.` : 'Поймай её в круг детектора.',
        rows: [['масса', fmtMass(s.m)], ['заряд', fmtQ(s.q)], ['живёт', s.life ? 'недолго — распадается' : 'стабильна'], ['распад', SM_DEC[k] || '']],
        fact: SM_FACT[k],
      };
    }),
  },
  h: {
    n: 'Адроны', title: 'Адронный зоопарк', cols: 4, empty: 'Нажми на открытый адрон. Экзотика — два адрона, сжатые полем.',
    items: () => HAD_ORDER.map(k => {
      const [sym, name, comp] = HADRON[k];
      return {
        k: 'h:' + k, sym, name, cls: EXO[k] ? 'exo' : 'had', kind: EXO[k] ? 'экзотический адрон' : k === 'qq' ? 'не живёт один' : 'адрон',
        st: Codex.st('h:' + k), sub: name, how: HAD_HOW[k], rows: [['состав', comp], ['живёт', HAD_LIFE[k]]], fact: HAD_FACT[k],
      };
    }),
  },
  n: {
    n: 'Ядра', title: 'Ядра', cols: 5, empty: 'Нажми на открытое ядро.',
    items: () => NUC_ORDER.filter(k => NUC_NAME && NUC_NAME[k]).map(k => {
      const [Z, N] = k.split(',').map(Number), [sym, name] = NUC_NAME[k];
      return {
        k: 'n:' + k, sym, name, cls: 'nuc', kind: Z + N >= 8 ? 'звёздный синтез' : 'Большой взрыв', st: Codex.st('n:' + k), sub: `${Z}p ${N}n`,
        how: Z + N >= 8 ? 'Куётся в звёздах.' : 'Собирается в первые минуты.',
        rows: [['состав', `${Z} p⁺ + ${N} n⁰`], ['живёт', NUC_UNST[k] || 'стабильно']], fact: NUC_FACT[k],
      };
    }),
  },
  a: {
    n: 'Атомы', title: 'Атомы', cols: 5, empty: 'Нажми на открытый атом.',
    items: () => ATOM_ORDER.map(Z => {
      const [name, val, fact] = ATOM_INFO[Z], sym = elemOf(Z)[0];
      return {
        k: 'a:' + Z, sym, name, cls: 'atom', kind: 'атом', st: Codex.st('a:' + Z), sub: 'Z ' + Z, how: 'Одень ядро электронами.',
        rows: [['ядро', `Z = ${Z}`], ['электронов', Z], ['связей', val || 'нет']], fact,
      };
    }),
  },
  m: {
    n: 'Молекулы', title: 'Молекулы', cols: 4, empty: 'Нажми на открытую молекулу.',
    items: () => COMP.map(c => ({
      k: 'm:' + c.f, sym: c.f, name: c.n, cls: 'mol', kind: 'молекула', st: Codex.st('m:' + c.f), sub: c.n, hint: '', how: 'Собери из атомов.',
      rows: [['состав', Object.keys(c.c).map(e => `${e} ×${c.c[e]}`).join(', ')]], fact: MOL_FACT[c.f],
    })),
  },
};

let cardT = 0, cardBig = false;
const SCENE_T = 4.8, SCENE_SLOW = 1.3;
// Схема реакции значками: «γ + γ ▮▯▯▯ → e⁻ e⁺»; me — символ, который только что открыт (подсвечен)
function rxHtml(rx, me) {
  const ic = ([t, kind]) => `<span class="cs ${kind}${me && t.startsWith(me) ? ' me' : ''}">${t}</span>`;
  const lv = rx.k ? `<span class="lv" title="сила удара">${[1, 2, 3, 4].map(i => `<b class="${i <= rx.k ? 'on' : ''}"></b>`).join('')}<small>${rx.k > 0 ? rx.k : '?'} ⚡</small></span>` : '';
  return `<div class="rx">${rx.l.map(ic).join('<i>+</i>')}${lv}<i>→</i>${rx.r.map(ic).join(' ')}</div>`;
}
// Сцена: крупно в нижней трети, игру не останавливает; slow — секунды замедления времени
function showScene(html, dur = SCENE_T, slow = 0) {
  const el = document.getElementById('card');
  el.classList.remove('side'); el.classList.add('big'); cardBig = true;
  el.style.top = ''; el.innerHTML = html; el.style.opacity = 1; cardT = dur; sceneAbove(el);
  if (slow) G.slowT = Math.max(G.slowT || 0, slow);
}
// сцена — сразу над лавкой (её высота разная: ПК, телефон, свёрнута), чтобы не закрывать детектор
function sceneAbove(el) {
  const r = document.getElementById('shop').getBoundingClientRect();
  el.style.bottom = r.height > 0 && r.top > G.H * .5 ? Math.round(G.H - r.top + 10) + 'px' : '';
}
// Кадр-пауза для важного знания (как в кино): время стоит, сверху и снизу наезжают чёрные полосы,
// поперёк экрана — тёмная лента с открытием, вокруг детектора — светлое пятно (на него и смотреть).
// Сама уходит через dur секунд; клик, тап или клавиша — дальше. Несколько подряд — по очереди.
const Cine = {
  on: false, t: 0, dur: 0, slow: 0, /** @type {{html: string, dur: number, slow: number}[]} */ q: [],
  /** @param {string} html @param {number} [dur] @param {number} [slow] — замедление после паузы, с */
  show(html, dur = 6, slow = 0) {
    this.q.push({ html, dur, slow });
    if (!this.on) this.next();
  },
  next() {
    const it = this.q.shift(), el = document.getElementById('cine');
    if (!it) { this.on = false; el.classList.remove('show'); setTimeout(() => { if (!this.on) el.classList.remove('on'); }, 400); return; }
    this.on = true; this.t = 0; this.dur = it.dur; this.slow = it.slow;
    const [sx, sy] = G.stage.key === 'particles' ? W2S(P.x, P.y) : [G.W / 2, G.H / 2];
    el.style.cssText = `--sx:${Math.round(sx)}px;--sy:${Math.round(sy)}px;--d:${it.dur}s`; // пятно — на детекторе, полоска — на всё время
    document.getElementById('cinein').innerHTML = it.html +
      `<div class="go"><b></b><span>${isTouch() ? 'коснись' : 'клик или любая клавиша'} — дальше</span></div>`;
    document.getElementById('card').style.opacity = 0; cardT = 0; // маленькая сцена под лентой не нужна
    el.classList.add('on'); void el.offsetWidth; el.classList.add('show');
  },
  // кадр стоит, пока идёт пауза; true — игре не двигаться
  /** @param {number} dt */
  tick(dt) {
    if (!this.on) return false;
    if ((this.t += dt) >= this.dur) this.done();
    return this.on;
  },
  done() { if (this.slow) G.slowT = Math.max(G.slowT || 0, this.slow); this.next(); },
  // дальше — не сразу: клик, который как раз родил частицу, не должен смахнуть её открытие
  skip() { if (this.on && this.t > .6) this.done(); },
  clear() { this.q = []; if (this.on) this.next(); },
};
function showCard(k, first, extra, rx) {
  const s = SM[k], el = document.getElementById('card');
  // впервые в жизни — важное знание: кадр-пауза на весь экран
  if (first) {
    Cine.show(`<div class="ck">Новое знание</div>` + (rx ? rxHtml(rx, s.sym) : '') +
      `<div class="cn"><span class="cs ${s.kind}">${s.sym}</span> ${s.name}</div><div class="cp">${SM_PLAIN[k] || SM_FACT[k]}</div>` +
      (extra ? `<div class="cg">${extra}</div>` : ''), 6.5, SCENE_SLOW);
    return;
  }
  // открытие в забеге — сцена: «это с тем столкнулось — появилось вот это» и одна строка простыми словами
  if (rx) {
    showScene(`<div class="ck">${first ? 'Новое открытие' : 'Открыто в этом забеге'}</div>` + (rx ? rxHtml(rx, s.sym) : '') +
      `<div class="cn"><span class="cs ${s.kind}">${s.sym}</span> ${s.name}</div><div class="cp">${SM_PLAIN[k] || SM_FACT[k]}</div>` +
      (extra ? `<div class="cg">${extra}</div>` : ''), extra ? SCENE_T : 3.2);
    return;
  }
  // на широком экране — справа под сеткой Стандартной модели; на узком — под панелью задания
  el.classList.remove('big'); cardBig = false; el.style.bottom = '';
  const cx = document.getElementById('codex'), wide = G.W > 700 && cx.style.display !== 'none';
  el.classList.toggle('side', wide);
  el.style.top = (wide ? cx.getBoundingClientRect().bottom + 10 : Math.max(60, (G.taskY || 0) + 10)) + 'px';
  el.innerHTML = `<div class="cn"><span class="cs ${s.kind}">${s.sym}</span> ${s.name}${s.m ? ` · ${fmtMass(s.m)}` : ''}</div>` + (extra ? `<div class="cg">${extra}</div>` : '');
  el.style.opacity = 1; cardT = extra ? 5.5 : 2.5;
}
function tickCard(dt) {
  if (cardT <= 0) return;
  const el = document.getElementById('card');
  if ((cardT -= dt) <= 0) { el.style.opacity = 0; return; }
  if (cardBig) { sceneAbove(el); return; } // сцена стоит на месте, только держится над лавкой
  // сетка может перерисоваться (или скрыться) — карточка держится под ней, иначе — под панелью задания
  const cx = document.getElementById('codex'), r = cx.getBoundingClientRect(), wide = G.W > 700 && cx.style.display !== 'none' && r.height > 0;
  el.classList.toggle('side', wide);
  el.style.top = (wide ? r.bottom + 10 : Math.max(60, (G.taskY || 0) + 10)) + 'px';
}
