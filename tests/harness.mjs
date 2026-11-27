// Безголовый запуск игры в Node: все скрипты из index.html грузятся в один vm-контекст (как классические
// <script> в браузере — общие глобальные const/function), DOM и canvas — заглушки. Math.random — с зерном,
// чтобы прогоны повторялись. Зависимостей нет: только node:vm и node:test.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Порядок скриптов — как в index.html (тесты не разойдутся с игрой)
export function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
}

const noop = () => {};
// Любое неизвестное свойство — пустая функция: вызовы DOM/canvas проходят молча
const lax = target => new Proxy(target, {
  get(t, k) { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; return noop; },
});

class ClassList {
  constructor() { this.s = new Set(); }
  add(...c) { c.forEach(x => this.s.add(x)); }
  remove(...c) { c.forEach(x => this.s.delete(x)); }
  toggle(c, on) { const v = on ?? !this.s.has(c); if (v) this.s.add(c); else this.s.delete(c); return v; }
  contains(c) { return this.s.has(c); }
}
function fakeEl(id = '') {
  const kids = new Map(); // querySelector отдаёт один и тот же элемент на селектор
  return lax({
    id, style: {}, dataset: {}, classList: new ClassList(), children: [], childNodes: [],
    textContent: '', innerHTML: '', value: '', checked: false, disabled: false,
    offsetParent: null, offsetHeight: 0, offsetWidth: 0, scrollTop: 0, scrollHeight: 0, clientWidth: 800, clientHeight: 600,
    width: 800, height: 600, onclick: null, oninput: null,
    getContext: () => fakeCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }),
    querySelector: q => { if (!kids.has(q)) kids.set(q, fakeEl(q)); return kids.get(q); }, querySelectorAll: () => [], closest: () => null, contains: () => false,
    appendChild: c => c, removeChild: c => c, append: noop, remove: noop, replaceChildren: noop,
  });
}
function fakeCtx() {
  const grad = { addColorStop: noop };
  return lax({
    canvas: { width: 800, height: 600 }, globalAlpha: 1, lineWidth: 1, font: '', fillStyle: '', strokeStyle: '',
    textAlign: 'left', textBaseline: 'alphabetic', globalCompositeOperation: 'source-over', shadowBlur: 0, shadowColor: '',
    lineCap: 'butt', lineJoin: 'miter', filter: 'none', imageSmoothingEnabled: true,
    measureText: t => ({ width: String(t).length * 6, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    createLinearGradient: () => grad, createRadialGradient: () => grad, createConicGradient: () => grad, createPattern: () => null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getLineDash: () => [], isPointInPath: () => false,
  });
}
function seeded(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Загрузить игру. Возвращает { ev(expr), step(n), frame(), ... } — ev выполняет код внутри игры
export function loadGame({ seed = 1, touch = false, storage = {} } = {}) {
  const els = new Map(), store = new Map(Object.entries(storage));
  const body = fakeEl('body'); if (touch) body.classList.add('touch');
  const document = lax({
    body, documentElement: fakeEl('html'), activeElement: body, hidden: false, visibilityState: 'visible',
    getElementById: id => { if (!els.has(id)) els.set(id, fakeEl(id)); return els.get(id); },
    querySelector: () => null, querySelectorAll: () => [], createElement: t => fakeEl(t),
    addEventListener: noop, removeEventListener: noop,
  });
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k), clear: () => store.clear(),
  };
  let t = 0;
  const sandbox = {
    console, document, localStorage, sessionStorage: localStorage,
    navigator: { userAgent: 'node-test', maxTouchPoints: touch ? 5 : 0, language: 'ru' },
    location: { protocol: 'http:', host: 'localhost', hostname: 'localhost', origin: 'http://localhost', href: 'http://localhost/', search: '', hash: '', reload: noop },
    history: { replaceState: noop, pushState: noop },
    matchMedia: q => ({ matches: touch && /coarse/.test(q), addEventListener: noop, addListener: noop }),
    addEventListener: noop, removeEventListener: noop,
    requestAnimationFrame: () => 0, cancelAnimationFrame: noop, // кадры гоняет тест сам
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    performance: { now: () => t },
    fetch: () => Promise.reject(new Error('offline in tests')),
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    Image: function Image() { return fakeEl('img'); },
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  // __reseed — поток случайного заново от зерна забега (после пролога: тесты дальше не зависят от того, как шла раскачка)
  vm.runInContext(`const __seeded = ${seeded.toString()}; Math.random = __seeded(${seed}); globalThis.__reseed = k => { Math.random = __seeded(${seed} * 7919 + k); };`, ctx);
  for (const src of scriptList()) {
    const file = path.join(ROOT, src);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  const ev = code => vm.runInContext(code, ctx);
  ev(`globalThis.__step = (n, dt = 1 / 60, draw = false) => { for (let i = 0; i < n; i++) { update(dt); if (draw) { render(); hud(); } } };`);
  return {
    ctx, ev, els, store,
    // n кадров по 1/60 с; draw — ещё и рисовать (ловит ошибки отрисовки и HUD)
    step(n = 1, draw = false) { t += n * 1000 / 60; ev(`__step(${n | 0}, 1 / 60, ${!!draw})`); },
    click(id) { const el = els.get(id); if (!el || typeof el.onclick !== 'function') throw new Error(`no onclick on #${id}`); el.onclick({ preventDefault: noop, stopPropagation: noop, target: el }); },
  };
}

// Стандартные заготовки для тестов уровня частиц
export const PREP = {
  // старт забега: «Начать», пустота, первое нажатие (жесты уже освоены — школы жестов нет, нажатие — сразу толчок поля)
  start: `Known.add('gest:school'); document.getElementById('go').onclick(); __step(110); mouse.clicked = true; mouse.down = true; __step(1); mouse.down = false;`,
  // раскачка рогаткой до вспышки (maxA — какой размах держать: от него разогрев и классы света): шарик затих на краю
  // хода (или лежит на дне) и размах ниже 0,8·maxA — поймать, оттянуть наружу ровно на столько, чтобы долетел до maxA (по прицелу), отпустить
  pump: (maxA = .9, secs = 40) => `(() => { const S = G.stage, I = S.inf;
    for (let i = 0; i < 60 * ${secs} && !S.lit; i++) {
      if (I.hold) { const sg = I.u >= 0 ? 1 : -1; let lo = SLING_MIN, hi = 1; // прицел честный (с трением): подобрать резинку до maxA
        for (let j = 0; j < 18; j++) { const k = (lo + hi) / 2; I.pull = sg * k; if (S.bowlAim(I) < ${maxA}) lo = k; else hi = k; }
        mouse.x = I.p0[0] + sg * lo * slingFullPx(); mouse.down = false; }
      else if (!(I.out > 0) && I.A < ${maxA} * .8 && Math.abs(I.v) < .12 * INF.w) { mouse.x = G.W / 2; mouse.clicked = true; mouse.down = true; }
      update(1 / 60); }
    mouse.down = false; __reseed(1); })()`,
  // свет исследован и измерен — поле открыто
  light: `(() => { const S = G.stage; S.kn += 500; S.chap = Math.max(S.chap, 4); S.buy(S.shopItems().findIndex(it => it.r && it.r.k === 'ph')); for (const c of S.madeCls()) S.measure(c); })()`,
  // зажать пару квантов a+b у детектора до ступени k и отпустить; вернуть рождённое
  hit: `globalThis.__hit = (a, b, k, en = E_CAP) => { const S = G.stage; S.en = en;
    for (const o of S.p) if (!o.dead && Math.hypot(o.x - P.x, o.y - P.y) < S.fr() * 1.6) o.dead = true; update(1 / 60);
    const A = S.mk(a, false, P.x + .5, P.y, 0, S.T), B = S.mk(b, false, P.x - .5, P.y, Math.PI, S.T); A.born = B.born = 1; A.cd = B.cd = 2;
    const before = new Set(S.p); mouse.clicked = true; mouse.down = true; let n = 0;
    while (n < 600 && !(S.focus && S.focus.cap.length === 2 && (S.focus.lv || 0) >= k && (k > 0 || n > 20))) { update(1 / 60); n++; }
    const lv = S.focus ? S.focus.lv || 0 : null, en1 = S.en; mouse.down = false; __step(40);
    return { lv, spent: en - en1, born: S.p.filter(o => !before.has(o) && !o.dead && o.sp !== 'ph').map(o => (o.anti ? '~' : '') + o.sp).sort() };
  };`,
};
