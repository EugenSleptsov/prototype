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
// M_SURE — запас пунктира над барьером: цель за полёт дрожит (тепловое движение), и удар «впритык» приходит на 1–3 % слабее
const TOL = .42, M_VMAX = 70, BREAK_V = 52, M_MINE = 8, M_STERIC = .8, M_STERIC_H = .5, M_SURE = 1.5; // M_STERIC — насколько атомы могут сблизиться (доля суммы радиусов) // M_MINE — сколько секунд Вселенная не трогает то, что ты брал
// допуски связи при броске (рад): у брошенного — между его свободной связью и линией удара (пунктир сам доворачивает её вперёд,
// так что это «бить в лоб, а не вскользь»), у цели — её свободная связь должна смотреть на удар; без броска — TOL
const TOL_HIT = .5, TOL_AIM = .7;
// энергия активации — скорость удара по линии центров: H–H 18, связь с водородом 22, тяжёлое с тяжёлым (C–C, C–O, C–N…) 27 —
// 26 %, 31 % и 39 % полной рогатки M_VMAX; Вселенная («Синтез») бросает со скоростью M_AUTO_V — выше любого барьера, ниже BREAK_V
const EA_HH = 18, EA_XH = 22, EA_XX = 27, M_AUTO_V = 38, M_HKEEP = 6;
// M_GIFT — сколько секунд Вселенная не берёт тяжёлый атом, который сама принесла (он — игроку); M_REACH — докуда она бросает
// кусок в кусок, M_REACH2 — докуда тянется достроить начатое (пара даёт соединение целиком)
const M_GIFT = 12, M_REACH = 70, M_REACH2 = 160;
const EA = (/** @type {string} */ x, /** @type {string} */ y) => x === 'H' && y === 'H' ? EA_HH : x === 'H' || y === 'H' ? EA_XH : EA_XX;
// кратная связь — удар сильнее барьера ещё на столько: двойная X–X от 39, тройная от 46 (Вселенная бьёт 38 — только одинарные,
// пока её не научили соединению с кратной связью: тогда ставит ту кратность, что нужна закону, lawN)
const EA_N = [0, 0, 12, 19], BOND_SYM = ['', '–', '=', '≡'];
/** кратность связи при ударе со скоростью vn (по линии центров): не больше свободных связей у обоих атомов @param {number} vn @param {number} ea @param {number} mx */
const bondN = (vn, ea, mx) => mx >= 3 && vn >= ea + EA_N[3] ? 3 : mx >= 2 && vn >= ea + EA_N[2] ? 2 : 1;
// органика с каркасом — связь углерода с тяжёлым атомом (C–C, C–O, C–N): шаг задания
const ORGANIC = ['CH₃OH', 'C₂H₆', 'CH₃NH₂', 'C₂H₅OH', 'CH₃OCH₃', 'H₂CO', 'HCN', 'C₂H₄', 'C₂H₂', 'HCONH₂', 'NH₂CH₂COOH'];
// венец уровня — глицин, простейшая аминокислота (его нашли в комете); ступень к нему — формамид (C, N и O в одной молекуле)
const CROWN = 'NH₂CH₂COOH';
// Тяжёлые атомы (C, N, O) — итог «Атомов»: твои нейтральные приходят на свои места и дают фору. Вселенная своих тяжёлых
// в кадр не досыпает: её газ — водород, а недостающий C, N или O она приносит по одному из-за края, не раньше M_DRIP0 с
// от входа и не чаще раза в M_DRIP с (раньше приток держал C ≥ 2, N ≥ 2, O ≥ 3 всегда — и неважно было, что ты принёс).
// M_HEAVY — сколько свободных атомов в кадре считать «хватает»; M_START — стартовый набор, если уровень открыт с титула
const M_HEAVY = /** @type {[string, number][]} */ ([['C', 2], ['N', 2], ['O', 3]]), M_DRIP0 = 6, M_DRIP = 4;
const M_START = /** @type {Record<string, number>} */ ({ C: 2, N: 2, O: 3 });
const M_U = 5, M_VIEW = 78, M_DENS = .0008, M_CAP = 40, M_COST = 20; // плотность газа: тяжёлые C, N, O должны быть видны среди водорода
// бульон — M_SOUP молекул с C, N или O; законы «Синтез» варят не больше M_SOUP_UNI из них, остальное — рогаткой
// (урок 33: закон не проходит уровень сам; раньше без единого касания бульон доходил до 10/10 за 105–136 с)
const M_SOUP = 10, M_SOUP_UNI = 6;
// Ценность бульона — очки уровня сверх вех: чем сложнее соединение, тем дороже (M_SV за каждый тяжёлый атом и за каждую
// кратность связи тяжёлое–тяжёлое: CH₄ 30, CH₃OH 90, HCN 150, этанол 150, CO₂ 210). Сваренное законом — вполовину,
// с атомом твоей звезды — ×M_SV_STAR. Раньше очки уровня кончались на 2000 (вехи): переиграть было незачем.
const M_SV = 30, M_SV_STAR = 1.5;
// Окно: облако, где варится бульон, сжимается — через M_LIFE с в нём зажигается звезда, и её ультрафиолет рвёт молекулы.
// Не успел сварить бульон — уровень кончается без бонуса (как звезда, догоревшая до цели); M_WARN — последние секунды красным.
// 5 минут: бот, который варит бульон, с пустым переносом проходит за 140–260 с (на бедном тяжёлыми сиде — 450–480)
const M_LIFE = 300, M_WARN = 30;
// испытания ★: бульон быстрее M_STAR_T с, M_STAR_HAND из 10 рогаткой, ценность M_STAR_V, M_STAR_OWN соединения с атомом твоей звезды
const M_STAR_T = 180, M_STAR_HAND = 7, M_STAR_V = 900, M_STAR_OWN = 3;
// соединения — {f: формула, n: название, c: состав, mb: кратная связь в ней (2 — двойная, 3 — тройная)}
const COMP = [
  { f: 'H₂', n: 'водород', c: { H: 2 } }, { f: 'H₂O', n: 'вода', c: { H: 2, O: 1 } }, { f: 'NH₃', n: 'аммиак', c: { N: 1, H: 3 } },
  { f: 'CH₄', n: 'метан', c: { C: 1, H: 4 } }, { f: 'H₂O₂', n: 'перекись водорода', c: { H: 2, O: 2 } }, { f: 'CH₃OH', n: 'метанол', c: { C: 1, H: 4, O: 1 } },
  { f: 'C₂H₆', n: 'этан', c: { C: 2, H: 6 } }, { f: 'CH₃NH₂', n: 'метиламин', c: { C: 1, N: 1, H: 5 } }, { f: 'N₂H₄', n: 'гидразин', c: { N: 2, H: 4 } },
  { f: 'NH₂OH', n: 'гидроксиламин', c: { N: 1, O: 1, H: 3 } }, { f: 'C₂H₅OH', n: 'этанол', c: { C: 2, H: 6, O: 1 }, cc: 1 },
  // изомеры C₂H₆O: этанол CH₃–CH₂–OH (углероды связаны между собой, cc: 1) и диметиловый эфир CH₃–O–CH₃ (оба углерода — на кислороде, cc: 0)
  { f: 'CH₃OCH₃', n: 'диметиловый эфир', c: { C: 2, H: 6, O: 1 }, cc: 0 },
  { f: 'O₂', n: 'кислород', c: { O: 2 }, mb: 2 }, { f: 'N₂', n: 'азот', c: { N: 2 }, mb: 3 }, { f: 'CO₂', n: 'углекислый газ', c: { C: 1, O: 2 }, mb: 2 },
  { f: 'H₂CO', n: 'формальдегид', c: { C: 1, H: 2, O: 1 }, mb: 2 }, { f: 'HCN', n: 'циановодород', c: { H: 1, C: 1, N: 1 }, mb: 3 },
  { f: 'C₂H₄', n: 'этилен', c: { C: 2, H: 4 }, mb: 2 }, { f: 'C₂H₂', n: 'ацетилен', c: { C: 2, H: 2 }, mb: 3 },
  // этап 3: формамид H–C(=O)–NH₂ и глицин NH₂–CH₂–C(=O)–OH (у составов есть и другие строения — их опознаёт каркас SK)
  { f: 'HCONH₂', n: 'формамид', c: { C: 1, H: 3, N: 1, O: 1 }, mb: 2 }, { f: 'NH₂CH₂COOH', n: 'глицин', c: { C: 2, H: 5, N: 1, O: 2 }, mb: 2 },
];
// Строение соединений — каркас из тяжёлых атомов и связей между ними [i, j, кратность]; водород садится на свободные
// связи каркаса. По нему «Синтез» строит только то, что ведёт к цели: кусок должен быть частью готовой молекулы
// (иначе он лепил тупики вроде HNC для HCN или OH для формальдегида — и тратил редкие C, N, O). H₂ — без каркаса.
/** @type {Record<string, [string[], number[][]]>} */
const SK = {
  'H₂O': [['O'], []], 'NH₃': [['N'], []], 'CH₄': [['C'], []], 'H₂O₂': [['O', 'O'], [[0, 1, 1]]], 'CH₃OH': [['C', 'O'], [[0, 1, 1]]],
  'C₂H₆': [['C', 'C'], [[0, 1, 1]]], 'CH₃NH₂': [['C', 'N'], [[0, 1, 1]]], 'N₂H₄': [['N', 'N'], [[0, 1, 1]]], 'NH₂OH': [['N', 'O'], [[0, 1, 1]]],
  'C₂H₅OH': [['C', 'C', 'O'], [[0, 1, 1], [1, 2, 1]]], 'CH₃OCH₃': [['C', 'O', 'C'], [[0, 1, 1], [1, 2, 1]]],
  'O₂': [['O', 'O'], [[0, 1, 2]]], 'N₂': [['N', 'N'], [[0, 1, 3]]], 'CO₂': [['O', 'C', 'O'], [[0, 1, 2], [1, 2, 2]]], 'H₂CO': [['C', 'O'], [[0, 1, 2]]],
  'HCN': [['C', 'N'], [[0, 1, 3]]], 'C₂H₄': [['C', 'C'], [[0, 1, 2]]], 'C₂H₂': [['C', 'C'], [[0, 1, 3]]],
  'HCONH₂': [['C', 'O', 'N'], [[0, 1, 2], [0, 2, 1]]], 'NH₂CH₂COOH': [['N', 'C', 'C', 'O', 'O'], [[0, 1, 1], [1, 2, 1], [2, 3, 2], [2, 4, 1]]],
};
const VAL = /** @type {Record<string, number>} */ ({ H: 1, C: 4, N: 3, O: 2 });
// Кусок {el: [], b: [[i, j, кратность]]} — часть соединения f? Каркас куска ложится на каркас цели (те же элементы, те же
// связи той же кратности, без лишних связей внутри), водорода у каждого тяжёлого — не больше, чем у него в цели.
/** @param {string} f @param {{ el: string[], b: number[][] }} pc */
function partOf(f, pc) {
  const hv = pc.el.map((e, i) => e === 'H' ? -1 : i).filter(i => i >= 0);
  if (!hv.length) return f === 'H₂' ? pc.el.length <= 2 : pc.el.length === 1 && !!COMP.find(x => x.f === f && x.c.H); // один H — годится всюду, где есть H
  const sk = SK[f]; if (!sk) return false;
  const [els, sb] = sk, ord = (/** @type {number} */ i, /** @type {number} */ j) => { const e = sb.find(x => (x[0] === i && x[1] === j) || (x[0] === j && x[1] === i)); return e ? e[2] : 0; };
  const hGoal = els.map((e, i) => VAL[e] - sb.reduce((s, x) => s + (x[0] === i || x[1] === i ? x[2] : 0), 0));
  const hHave = hv.map(i => pc.b.filter(x => (x[0] === i && pc.el[x[1]] === 'H') || (x[1] === i && pc.el[x[0]] === 'H')).length);
  if (pc.b.some(x => pc.el[x[0]] === 'H' && pc.el[x[1]] === 'H')) return false;
  const hh = pc.b.filter(x => pc.el[x[0]] !== 'H' && pc.el[x[1]] !== 'H');
  const used = new Set(), map = /** @type {number[]} */ ([]);
  const ok = () => hv.every((i, k) => hHave[k] <= hGoal[map[k]]) &&
    hh.every(x => ord(map[hv.indexOf(x[0])], map[hv.indexOf(x[1])]) === x[2]) &&
    sb.filter(x => used.has(x[0]) && used.has(x[1])).length === hh.length; // каркас цели без лишних связей внутри куска (колец нет)
  const go = (/** @type {number} */ k) => {
    if (k === hv.length) return ok();
    for (let t = 0; t < els.length; t++) if (!used.has(t) && els[t] === pc.el[hv[k]]) { used.add(t); map[k] = t; if (go(k + 1)) return true; used.delete(t); }
    return false;
  };
  return go(0);
}
const ckey = c => Object.keys(c).filter(k => c[k]).sort().map(k => k + c[k]).join('');
// по составу — первое соединение (у изомеров — то, что раньше в каталоге); что именно собрано — Mols.ident (по связям)
const COMP_BY = Object.fromEntries(COMP.slice().reverse().map(x => [ckey(x.c), x]));
const fits = (c, t) => Object.keys(c).every(k => (t[k] || 0) >= c[k]);

// в соединении есть тяжёлый атом (C, N, O) — не голый водород: только такое идёт в бульон и первым в лавку
const heavy = (/** @type {{c: Record<string, number>}} */ cp) => Object.keys(cp.c).some(e => e !== 'H');
// Портрет бульона (SVG): молекулы — как в игре (шары, связи, кратные — параллельными линиями, искра — атом твоей звезды),
// самая ценная крупно в центре с названием, остальные — кольцом с формулой и ценностью. Пустой бульон — пусто
/** @param {{ f: string, n: string, v: number, star: boolean, g?: { a: [string, number, number, number][], b: number[][] } }[]} list */
function soupSvg(list) {
  const L = list.filter(x => x.g).slice().sort((a, b) => b.v - a.v).slice(0, 10); if (!L.length) return '';
  const W = 640, H = 360, cx = W / 2, cy = 172, f1 = (/** @type {number} */ x) => x.toFixed(1), out = /** @type {string[]} */ ([]);
  const hex = (/** @type {number[]} */ c) => '#' + c.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  const mol = (/** @type {typeof L[number]} */ it, /** @type {number} */ x0, /** @type {number} */ y0, /** @type {number} */ R) => {
    const g = /** @type {{ a: [string, number, number, number][], b: number[][] }} */ (it.g), A = g.a, n = A.length;
    const mx = A.reduce((s, a) => s + a[1], 0) / n, my = A.reduce((s, a) => s + a[2], 0) / n;
    // главная ось — по горизонтали (как лежала в игре — неважно)
    let sxx = 0, syy = 0, sxy = 0; for (const a of A) { const dx = a[1] - mx, dy = a[2] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const th = -.5 * Math.atan2(2 * sxy, sxx - syy), P = A.map(a => rot(a[1] - mx, a[2] - my, th));
    const ext = Math.max(...P.map((p, i) => Math.hypot(p[0], p[1]) + CHEM[A[i][0]].r * .62), 1), k = Math.min(R / ext, R / 16);
    const at = (/** @type {number} */ i) => [x0 + P[i][0] * k, y0 + P[i][1] * k];
    for (const [i, j, o] of g.b) {
      const [x1, y1] = at(i), [x2, y2] = at(j), dl = Math.hypot(x2 - x1, y2 - y1) || 1, gap = Math.max(2.2, 2.6 * k);
      for (let q = 0; q < o; q++) {
        const off = (q - (o - 1) / 2) * gap, ox = -(y2 - y1) / dl * off, oy = (x2 - x1) / dl * off;
        out.push(`<line x1="${f1(x1 + ox)}" y1="${f1(y1 + oy)}" x2="${f1(x2 + ox)}" y2="${f1(y2 + oy)}" stroke="${o > 1 ? '#bee6ff' : '#dce6f5'}" stroke-width="${f1(Math.max(1.2, 1.8 * k))}" stroke-opacity=".85"/>`);
      }
    }
    A.forEach((a, i) => {
      const [x, y] = at(i), r = CHEM[a[0]].r * .62 * k;
      out.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${hex(CHEM[a[0]].c)}"/>`);
      if (a[0] !== 'H' && r > 6) out.push(`<text x="${f1(x)}" y="${f1(y + r * .36)}" font-size="${f1(r)}" fill="#fff" text-anchor="middle" font-weight="700">${a[0]}</text>`);
      if (a[3]) out.push(`<circle cx="${f1(x + r * .8)}" cy="${f1(y - r * .8)}" r="${f1(Math.max(4, r * .6))}" fill="#ffe26a" fill-opacity=".3"/><circle cx="${f1(x + r * .8)}" cy="${f1(y - r * .8)}" r="${f1(Math.max(1.8, r * .28))}" fill="#ffe7a0"/>`);
    });
  };
  const rest = L.slice(1), m = rest.length;
  rest.forEach((it, q) => {
    const t = -Math.PI / 2 + (q + .5) / m * TAU, x = cx + 245 * Math.cos(t), y = cy + 118 * Math.sin(t);
    mol(it, x, y - 6, 30);
    out.push(`<text x="${f1(x)}" y="${f1(y + 34)}" font-size="12" fill="${it.star ? '#ffe08c' : '#c9d3e6'}" text-anchor="middle">${it.f} · ${it.v}</text>`);
  });
  const c0 = L[0]; mol(c0, cx, cy - 12, 70);
  out.push(`<text x="${cx}" y="${cy + 74}" font-size="16" fill="#fff" text-anchor="middle" font-weight="700">${c0.n} ${c0.f} · ${c0.v}</text>`);
  if (c0.star) out.push(`<text x="${cx}" y="${cy + 92}" font-size="12" fill="#ffe08c" text-anchor="middle">из вещества твоих звёзд</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Портрет бульона: ${L.map(x => x.f).join(', ')}" font-family="system-ui,sans-serif">${out.join('')}</svg>`;
}
const Mols = {
  key: 'molecules', name: 'Молекулы', bg: [6, 24, 44], sling: true,
  // взятое поворачивают Q / E или Shift + колесо (на сенсоре оно поворачивается само по ходу броска)
  get controls() { return 'Зажать атом, оттянуть, отпустить · зажать на связи: разорвать' + (isTouch() ? '' : ' · Q / E или Shift + колесо: повернуть'); },
  gest() { return { obj: 'атом: оттянуть, отпустить в свободную связь · связь: зажать — разорвать', empty: 'тянуть: карта' }; },

  enter(prev) {
    this.m = []; this.t = 0; this.clock = 0; this.hints = []; this.lowEMsgT = 0; this.floats = []; this.tk = {}; this.banner = -1.5;
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.found = []; this.res = new Set(); this.autoCd = 1; this.doneAt = null; this.cheated = false;
    this.st = { bonds: 0, broke: 0, auto: 0, hand: 0, soup: 0, soupU: 0, soupV: 0, soupStar: 0, triple: 0, tear: 0, cut: 0 }; this.tore = false;
    this.life = M_LIFE; this.crownAt = null; this.failed = false; this.warned = false; this.ignite = -1; this.igAt = [0, 0]; this.soupList = [];
    P.vx = P.vy = 0; if (!prev) P.x = P.y = 0;
    // brought — сколько твоих нейтральных C, N, O пришло из «Атомов» (null — уровень открыт с титула); dripT — до следующего тяжёлого от Вселенной
    this.brought = prev && prev.ions ? { C: 0, N: 0, O: 0 } : null; this.dripT = M_DRIP0; this.broughtShown = false; this.starN = 0;
    // атомы с прошлого уровня — на своих местах: мир растягивается в M_U раз, камера — во столько же отъезжает
    if (prev && prev.ions) {
      rescale(M_U, P.x, P.y, []);
      for (const io of prev.ions) {
        const el = atSym(io.Z); if (!CHEM[el] || !CHEM[el].s.length || io.dead || io.ne < io.Z) continue; // в химию идут только нейтральные атомы: голый ион — не реагент; благородный газ (He) — тоже нет
        const m = this.newMol(el, P.x + (io.x - P.x) * M_U, P.y + (io.y - P.y) * M_U);
        m.vx = io.vx * M_U; m.vy = io.vy * M_U; m.age = 1; m.mine = true; m.src = io;
        if (io.mine) { m.atoms[0].star = true; this.starN++; } // выкован в твоей звезде — золотая метка, в бульоне дороже
        if (this.brought && el in this.brought) this.brought[el]++;
      }
    }
    // с титула «Атомов» не было — стартовый набор, как средний их итог (иначе первые полминуты не из чего строить)
    const z1 = zoomFor(this), want = popWant(M_DENS, M_CAP, z1), put = (/** @type {string} */ el, /** @type {boolean} */ any) => {
      const at = beyondPos(z1, 12, any); if (!at) return;
      const mol = this.newMol(el, at[0], at[1]); mol.vx = randn() * 4; mol.vy = randn() * 4; mol.age = 1; return mol;
    };
    // стартовый набор — вместо твоих атомов из «Атомов», и он твой: иначе в первую секунду с титула (камера ещё близко)
    // «чужое вдали растворяется» съедало все C, N, O
    if (!this.brought) for (const el in M_START) for (let i = 0; i < M_START[el]; i++) { const m = put(el, true); if (m) m.mine = true; }
    // остальное — газ Вселенной за краем кадра (с нуля — и в кадре): водород; C, N, O — только твои (или стартовый набор)
    for (let k = 0; this.m.length < want && k < want * 3; k++) put(this.mixEl(), !prev);
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
          // хватит ли места: та же посадка, что у удара, — в том положении, где оба будут в миг касания
          const room = !(free && sa >= 0 && sb >= 0) || !!this.place(b, { x: b.x + ox, y: b.y + oy, a: b.a }, ia, sa, T, { x: Tx, y: Ty, a: Ta }, ib, sb);
          if (free && sa >= 0 && sb >= 0 && vn >= ea + M_SURE && room) {
            const n = bondN(vn - M_SURE, ea, mx), bs = `${b.atoms[ia].el}${BOND_SYM[n]}${at.el}`;
            label = n === 3 ? `тройная связь ${bs}` : n === 2 ? `двойная связь ${bs}` : `связь ${bs}`; c = n > 1 ? [130, 220, 255] : [120, 240, 160];
          }
          else if (vn > BREAK_V && (b.bonds.length || T.bonds.length)) { label = 'порвёт связь'; c = [255, 90, 80]; }
          else if (!free) { label = 'насыщена, отскочит'; c = [170, 175, 195]; }
          else if (sb < 0) { label = 'мимо свободной связи цели'; c = [200, 205, 225]; }
          else if (sa < 0) { label = 'вскользь: бить в лоб'; c = [200, 205, 225]; }
          else if (!room) { label = 'тесно: атомы налезут — в другую связь'; c = [255, 200, 110]; }
          else if (vn >= ea) { label = 'на грани барьера: может отскочить'; c = [255, 200, 110]; }
          else { label = 'слабо: барьер, оттянуть сильнее'; c = [255, 200, 110]; }
          const near = this.slotNear(T, ib, th + Math.PI, 9, da), cone = near >= 0 && free ? [pb[0], pb[1], this.slotAng(T, ib, near) + da, sb >= 0 && room, rb] : null;
          const sc = vn > .1 ? v0 / vn : Infinity, needN = free && sa >= 0 && sb >= 0 && room ? [2, 3].filter(n => n <= mx).map(n => (ea + EA_N[n] + M_SURE) * sc) : [];
          return { pts, x: hit[0], y: hit[1], label, c, hit: true, cone, need: (ea + M_SURE) * sc, needN };
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
  // какого тяжёлого не хватает: чего из нужного (M_HEAVY) свободного в кадре меньше всего по доле; всего хватает — null.
  // По доле, а не по порядку: иначе C, N, O всегда шли первыми
  needEl() {
    const one = (/** @type {string} */ el) => this.m.filter(m => m.atoms.length === 1 && m.atoms[0].el === el && inRef(m.x, m.y, 20)).length; // по кадру-эталону: отдалился — приток тот же
    let best = null, bq = 1;
    for (const [el, n] of M_HEAVY) { const q = one(el) / n; if (q < bq) { bq = q; best = el; } }
    return best;
  },
  // газ Вселенной — водород (C, N, O в нём — следы; их приносит только редкий приток, needEl)
  mixEl() { return 'H'; },
  // Вселенная вокруг: не хватает в кадре — водород из-за края; тяжёлого не хватает — один атом раз в M_DRIP с
  // (часы идут, только пока не хватает: израсходовал своё — следующий придёт не сразу); чужое вдали растворяется
  tide(dt) {
    for (const m of this.m) if (!m.mine && !m.held && !(m.hand > 0) && farOff(m, 1.6)) m.dead = true;
    this.m = this.m.filter(m => !m.dead);
    if (this.doneAt !== null) return;
    const rim = (/** @type {string} */ el) => { const r = rimPos(14), mol = this.newMol(el, r.x, r.y), sp = rnd(4, 8);
      mol.vx = r.nx * sp + randn() * 3; mol.vy = r.ny * sp + randn() * 3; mol.age = 0; };
    const need = this.needEl();
    if (!need) this.dripT = Math.max(this.dripT, M_DRIP);
    else if ((this.dripT -= dt) <= 0) { rim(need); this.m[this.m.length - 1].gift = this.t; this.dripT = M_DRIP; }
    const have = this.m.filter(m => inView(m.x, m.y, 10)).length;
    if (have < popWant(M_DENS, M_CAP) && Math.random() < dt * 3) rim(this.mixEl());
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
  /** молекула как кусок для partOf: элементы и связи с кратностью @returns {{ el: string[], b: number[][] }} */
  piece(mol) {
    const b = /** @type {number[][]} */ ([]);
    for (const [i, j] of mol.bonds) { const e = b.find(x => (x[0] === i && x[1] === j) || (x[0] === j && x[1] === i)); if (e) e[2]++; else b.push([i, j, 1]); }
    return { el: mol.atoms.map((/** @type {any} */ a) => a.el), b };
  },
  // A и B — части цели f, и любая связь между их свободными атомами (кратность — как бьёт «Синтез»: под цель, но не больше
  // свободных связей) даёт снова часть цели: тупика не будет, куда бы ни пришёлся удар. at — [ia, ib]: только эта пара атомов (удар уже случился)
  joinsTo(f, A, B, at = null) {
    const pa = this.piece(A), pb = this.piece(B); if (!partOf(f, pa) || !partOf(f, pb)) return false;
    const mb = (COMP.find(x => x.f === f) || {}).mb || 1, off = pa.el.length;
    const fa = (at ? [at[0]] : A.atoms.map((/** @type {any} */ _, /** @type {number} */ i) => i)).filter((/** @type {number} */ i) => this.freeAt(A, i) > 0);
    const fb = (at ? [at[1]] : B.atoms.map((/** @type {any} */ _, /** @type {number} */ i) => i)).filter((/** @type {number} */ i) => this.freeAt(B, i) > 0);
    if (!fa.length || !fb.length) return false;
    return fa.every((/** @type {number} */ i) => fb.every((/** @type {number} */ j) => {
      const n = this.lawN(mb, A, i, B, j);
      return partOf(f, { el: [...pa.el, ...pb.el], b: [...pa.b, ...pb.b.map(x => [x[0] + off, x[1] + off, x[2]]), [i, j + off, n]] });
    }));
  },
  // кратность связи, которую бросок Вселенной ставит по закону: сколько нужно соединению (mb), сколько есть свободных, H — одинарная
  /** @param {number} mb @param {any} A @param {number} i @param {any} B @param {number} j */
  lawN(mb, A, i, B, j) { return Math.min(this.freeAt(A, i), this.freeAt(B, j), 3, A.atoms[i].el === 'H' || B.atoms[j].el === 'H' ? 1 : mb); },
  counts(mol) { const c = {}; for (const a of mol.atoms) c[a.el] = (c[a.el] || 0) + 1; return c; },
  // какое соединение каталога собрано: по составу и по каркасу SK (C₂H₆O: углероды связаны — этанол, оба на кислороде — эфир;
  // CH₃NO — формамид, только если C=O и C–N, а не H₂C=N–OH). Тот же состав, другое строение — не из каталога
  ident(mol) {
    const k = ckey(this.counts(mol)), pc = this.piece(mol);
    return COMP.find(x => ckey(x.c) === k && (!SK[x.f] || partOf(x.f, pc))) || null;
  },
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
      // очков за связь нет (раньше +40 за каждую — с бесконечным притоком H это печатало очки): очки — за вехи (шаги, ★, уровень)
      if (this.st.bonds === 1) tipMsg('mols:bond', 'Ковалентная связь: общая пара электронов');
    }
    if (this.freeSlots(host)) return;
    const cp = this.ident(host);
    // насыщенное, но не из каталога (пропан, CH₂(OH)₂…) — реакция удалась, просто это не бульон: хотя бы формула
    if (!cp) { if (src === 'hand') this.float(x, y - 10, `${this.formula(host)} · не из бульона`, [175, 185, 205], 12); return; }
    if (src === 'auto') { this.st.auto++; Uni.pay(this, this.res.has(cp.f) && !Uni.off(this, cp.f) ? cp.f : [...this.res].find(k => !Uni.off(this, k)) || cp.f, 2); } else if (src === 'hand') this.st.hand++;
    // Вселенная учится — бульон варит она и ты вместе, но её доля — не больше M_SOUP_UNI: последнее — рогаткой;
    // H₂ в бульон не в счёт (иначе финал проходился штамповкой H + H)
    let sv = 0;
    if (heavy(cp) && src === 'auto' && this.st.soupU < M_SOUP_UNI && this.st.soup < M_SOUP) {
      this.st.soupU++; sv = this.toSoup(host, cp, 'auto');
      if (this.st.soupU === M_SOUP_UNI) tipMsg('mols:soupU', `Законы сварили ${M_SOUP_UNI} из ${M_SOUP}: остальное бульону — рогаткой`);
    } else if (heavy(cp) && src === 'hand' && this.res.size && this.st.soup < M_SOUP) sv = this.toSoup(host, cp, 'hand');
    Codex.note('m:' + cp.f);
    if (!this.found.includes(cp.f)) {
      this.found.push(cp.f); this.kn += 15; Sfx.play('fresh');
      this.float(x, y - 14, `НОВОЕ: ${cp.f} · ${cp.n} +15 ✦`, [255, 215, 110], 16);
      fxRing(x, y, 6, GOLD, 40, .9);
      if (cp.f === CROWN) this.crown(host, x, y);
    } else this.float(x, y - 10, sv ? `${cp.f} · бульон +${sv}${host.soupStar ? ' · твоя звезда' : ''}` : cp.f, src === 'auto' ? [150, 205, 255] : [140, 235, 170], 13);
  },
  // венец: первая аминокислота — сцена с замедлением, большая вспышка, звук открытия дважды
  /** @param {any} host @param {number} x @param {number} y */
  crown(host, x, y) {
    this.crownAt = this.clock; Sfx.play('upgrade');
    fxRing(x, y, 10, GOLD, 90, 1.6); fxFlash(x, y, 30, [255, 240, 190], .8);
    const own = host.atoms.some((/** @type {any} */ a) => a.star);
    showScene(`<div class="ck">Венец уровня</div><div class="cn">NH₂–CH₂–COOH · глицин</div>` +
      `<div class="cp">Простейшая аминокислота. Из аминокислот собраны белки всего живого; глицин нашли даже в пыли кометы.</div>` +
      (own ? '<div class="cg">из вещества твоих звёзд</div>' : ''), 6, SCENE_SLOW);
  },
  // ценность соединения в бульоне: тяжёлые атомы и кратности связей между ними; законом — вполовину, с атомом твоей звезды — дороже
  /** @param {any} mol @param {'hand' | 'auto'} src */
  soupVal(mol, src) {
    const hv = mol.atoms.filter((/** @type {any} */ a) => a.el !== 'H').length;
    const hb = mol.bonds.filter((/** @type {number[]} */ b) => mol.atoms[b[0]].el !== 'H' && mol.atoms[b[1]].el !== 'H').length;
    const star = mol.atoms.some((/** @type {any} */ a) => a.star);
    return Math.round(M_SV * (hv + hb) * (src === 'auto' ? .5 : 1) * (star ? M_SV_STAR : 1));
  },
  // соединение — в бульон: счёт, ценность, строка списка (для конца — что сварено из твоих звёзд)
  /** @param {any} host @param {any} cp @param {'hand' | 'auto'} src */
  toSoup(host, cp, src) {
    const v = this.soupVal(host, src), star = host.atoms.some((/** @type {any} */ a) => a.star);
    this.st.soup++; this.st.soupV += v; if (star) this.st.soupStar++;
    // снимок строения — для портрета бульона в конце (молекулу потом могут разобрать или унести за край)
    const g = { a: host.atoms.map((/** @type {any} */ a) => [a.el, a.lx, a.ly, a.star ? 1 : 0]), b: this.piece(host).b };
    const it = { f: cp.f, n: cp.n, v, src, star, g };
    host.soup = src; host.soupV = v; host.soupStar = star; host.soupIt = it; this.soupList.push(it);
    return v;
  },

  // ---------- реакции ----------
  // Посадка связи: гость (лёгкий кусок) встаёт свободной связью навстречу свободной связи хозяина. pA, pB — положение
  // и угол кусков {x, y, a} (сейчас — сами молекулы; у пунктира — где они будут в миг удара). Стерика: новые атомы не
  // налезают на старые — тогда null (удар отскакивает). Одна проверка и для удара, и для пунктира: что обещано, то и выйдет.
  // Не влез — гость пробует сесть перевёрнутым (mir: отражён поперёк своей связи — в объёме это кусок, подлетевший другой
  // стороной, или поворот вокруг новой связи): иначе глицин в каждой десятой сборке упирался водородом азота в чужой атом
  place(A, pA, ia, sa, B, pB, ib, sb) {
    const swap = B.m > A.m, host = swap ? B : A, ph0 = swap ? pB : pA, ih = swap ? ib : ia, sh = swap ? sb : sa;
    const gu = swap ? A : B, pg0 = swap ? pA : pB, ig = swap ? ia : ib, sg = swap ? sa : sb;
    const at = (/** @type {any} */ m, /** @type {any} */ p, /** @type {number} */ i) => { const [x, y] = rot(m.atoms[i].lx, m.atoms[i].ly, p.a); return [p.x + x, p.y + y]; };
    const sl = (/** @type {any} */ m, /** @type {any} */ p, /** @type {number} */ i, /** @type {number} */ k) => p.a + m.atoms[i].base + CHEM[m.atoms[i].el].s[k] * DEG;
    const L = (CHEM[host.atoms[ih].el].r + CHEM[gu.atoms[ig].el].r) * .78;
    const ph = at(host, ph0, ih), th = sl(host, ph0, ih, sh);
    const tx = ph[0] + Math.cos(th) * L, ty = ph[1] + Math.sin(th) * L;
    const phi = sl(gu, pg0, ig, sg), dA = angDiff(th + Math.PI, phi), pg = at(gu, pg0, ig), ux = Math.cos(phi), uy = Math.sin(phi);
    const fit = (/** @type {boolean} */ mir) => {
      const np = gu.atoms.map((/** @type {any} */ _, /** @type {number} */ k) => {
        const p = at(gu, pg0, k); let vx = p[0] - pg[0], vy = p[1] - pg[1];
        if (mir) { const d = vx * ux + vy * uy; vx = 2 * d * ux - vx; vy = 2 * d * uy - vy; } // отражение поперёк связи гостя
        const r = rot(vx, vy, dA); return [tx + r[0], ty + r[1]];
      });
      for (let k = 0; k < np.length; k++) for (let h = 0; h < host.atoms.length; h++) {
        // водород теснее: он мал и на деле торчит из плоскости (O–H, N–H вращаются) — H–H не тесно вовсе, H к тяжёлому — до M_STERIC_H;
        // иначе в плоском кресте NH₂–CH₂ не садился на –C(=O)OH (H азота упирался в O), и глицин было не собрать
        const hk = +(gu.atoms[k].el === 'H') + +(host.atoms[h].el === 'H');
        if ((k === ig && h === ih) || hk === 2) continue;
        const p2 = at(host, ph0, h);
        if (Math.hypot(np[k][0] - p2[0], np[k][1] - p2[1]) < (hk ? M_STERIC_H : M_STERIC) * (CHEM[gu.atoms[k].el].r + CHEM[host.atoms[h].el].r)) return null;
      }
      return np;
    };
    let mir = false, np = fit(false); if (!np) { mir = true; np = fit(true); } if (!np) return null;
    return { host, ih, sh, gu, ig, sg, tx, ty, dA, np, mir, phi };
  },
  merge(A, ia, sa, B, ib, sb, src, n = 1) {
    const pl = this.place(A, A, ia, sa, B, B, ib, sb); if (!pl) return false;
    const { host, ih, sh, gu, ig, tx, ty, dA, np, mir, phi } = pl;
    const off = host.atoms.length, M = host.m + gu.m;
    const vx = (host.vx * host.m + gu.vx * gu.m) / M, vy = (host.vy * host.m + gu.vy * gu.m) / M, Lw = host.I * host.w + gu.I * gu.w;
    // перевёрнутый гость: связи атома идут в обратном порядке (у всех элементов углы связей симметричны: s[n−1−j] = s[n−1] − s[j]),
    // а нулевая связь — там, куда смотрела последняя
    const ms = (/** @type {number} */ k, /** @type {number} */ si) => mir ? CHEM[gu.atoms[k].el].s.length - 1 - si : si;
    gu.atoms.forEach((at, k) => {
      const [lx, ly] = rot(np[k][0] - host.x, np[k][1] - host.y, -host.a), S = CHEM[at.el].s, last = (S[S.length - 1] || 0) * DEG;
      const base = mir ? 2 * phi - gu.a - at.base - last + dA - host.a : gu.a + at.base + dA - host.a;
      const b = mir ? at.b.map((/** @type {number} */ _, /** @type {number} */ j) => at.b[S.length - 1 - j]) : at.b;
      host.atoms.push({ el: at.el, lx, ly, base, b: b.map((/** @type {number} */ x) => x < 0 ? -1 : x + off), star: at.star });
    });
    for (const bd of gu.bonds) host.bonds.push([bd[0] + off, bd[1] + off, ms(bd[0], bd[2]), ms(bd[1], bd[3])]);
    const sg = ms(ig, pl.sg);
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
    if (mol.soup) { // разобрал сваренное — в бульоне его больше нет (и его ценности)
      if (mol.soup === 'auto') this.st.soupU = Math.max(0, this.st.soupU - 1);
      this.st.soup = Math.max(0, this.st.soup - 1); this.st.soupV -= mol.soupV || 0; if (mol.soupStar) this.st.soupStar--;
      this.soupList = this.soupList.filter((/** @type {any} */ x) => x !== mol.soupIt); mol.soup = false; mol.soupV = 0; mol.soupStar = false; mol.soupIt = null;
    }
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
        const mx = Math.min(this.freeAt(A, ia), this.freeAt(B, ib), 3);
        // бросок Вселенной связывает, только если выходит часть того, что она варит (задела по пути третий кусок — отскок)
        // кратность — та, что нужна закону (сильный удар не делает из C=C тупиковую C≡C)
        const law = src === 'auto' ? COMP.find(x => this.res.has(x.f) && !Uni.off(this, x.f) && this.joinsTo(x.f, A, B, [ia, ib])) : null;
        if (src && imp >= ea && (src !== 'auto' || law)) { const n = law ? this.lawN(law.mb || 1, A, ia, B, ib) : Math.min(mx, bondN(imp, ea, mx)); if (this.merge(A, ia, sa, B, ib, sb, src, n)) { if (src === 'hand') { Sfx.play('bond', n); if (n === 3) this.st.triple++; } return true; } }
        else if (src === 'hand' && this.lowEMsgT <= 0) { this.lowEMsgT = 5; tipMsg('mols:lowE', 'Барьер: связь рождается только от удара сильнее энергии активации'); }
      }
      if (imp > BREAK_V && (A.bonds.length || B.bonds.length)) {
        const victim = A.bonds.length && (!B.bonds.length || Math.random() < .5) ? [A, ia] : [B, ib];
        if (this.breakAt(victim[0], victim[1])) { Sfx.play('snap'); return true; }
      }
      if (A.hand > 0 || B.hand > 0) Sfx.play('bounce', Math.min(1, imp / M_VMAX)); // твой бросок отскочил
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
    const isH = (/** @type {any} */ m) => m.atoms.length === 1 && m.atoms[0].el === 'H', hLow = this.m.filter(m => !m.dead && isH(m) && inRef(m.x, m.y, 10)).length <= M_HKEEP;
    // и только что принесённый C, N или O — первые M_GIFT с тоже игроку: тяжёлых теперь мало (приток редкий), и «Синтез CH₄» иначе
    // съедал каждый пришедший углерод раньше, чем до него дотянется рогатка (органику с каркасом было не собрать)
    const keep = (/** @type {any} */ m) => (hLow && isH(m)) || (m.gift != null && this.t - m.gift < M_GIFT);
    let best = null, bs = -Infinity;
    for (const g of goals) for (let i = 0; i < f.length; i++) {
      const ca = this.counts(f[i]); if (!fits(ca, g.c) || keep(f[i])) continue;
      for (let j = i + 1; j < f.length; j++) {
        if (keep(f[j])) continue;
        const cb = this.counts(f[j]), sum = { ...ca }; for (const k in cb) sum[k] = (sum[k] || 0) + cb[k];
        if (!fits(sum, g.c)) continue;
        // оба куска — части цели, и связь между ними — снова часть цели: ни тупиковых обрывков (HNC, OH под формальдегид,
        // CH₃–CH под этилен), ни H₂ под «воду»
        if (!this.joinsTo(g.f, f[i], f[j])) continue;
        // достроить начатое (пара даёт цель целиком) Вселенная тянется и дальше: экзотермика связи отталкивает соседей,
        // и последний кусок (второй O к C=O) часто отлетал за M_REACH — CO₂ так и оставался недостроенным
        const d = Math.hypot(f[i].x - f[j].x, f[i].y - f[j].y), whole = ckey(sum) === ckey(g.c); if (d > (whole ? M_REACH2 : M_REACH)) continue;
        const sc = f[i].atoms.length + f[j].atoms.length + (whole ? 4 : 0) - d / 20 + Math.random();
        if (sc > bs) { bs = sc; best = [f[i], f[j], d]; }
      }
    }
    if (!best) return;
    let [A, B, d] = best; if (A.m > B.m) [A, B] = [B, A];
    const dx = B.x - A.x, dy = B.y - A.y, dmp = this.damp(); d = d || 1;
    if (d > M_REACH) { // далеко — сначала подвести лёгкий кусок поближе (без связи: бросок тихий), бросок — в следующий раз
      const v = Math.min(28, (d - M_REACH * .5) * dmp / (1 - Math.exp(-dmp * 2.4)));
      A.vx = B.vx + dx / d * v; A.vy = B.vy + dy / d * v; A.thrown = 0; return;
    }
    this.orient(A, dx, dy); this.orient(B, -dx, -dy); A.w = B.w = 0;
    // соединение с кратной связью — Вселенная знает, что варит (как доворачивает «магнитом»): кратность ставит contact по закону (lawN).
    // Брошенное в полёте тормозит (damp: скорость падает на damp за единицу пути), поэтому бросок — с запасом на путь до касания:
    // долетает со скоростью M_AUTO_V (раньше бросок с 50–70 ед. приходил медленнее барьера тяжёлое–тяжёлое и отскакивал)
    const v = M_AUTO_V + dmp * Math.max(0, d - A.R - B.R); A.vx = B.vx + dx / d * v; A.vy = B.vy + dy / d * v; A.thrown = 0; A.auto = 3; B.auto = 3;
  },

  update(dt, act) {
    const live = act && G.started;
    this.t += dt; this.lowEMsgT -= dt;
    if (live) { this.banner += dt; if (this.doneAt === null) this.clock += dt; P.vx = P.vy = 0; }
    if (live && !this.broughtShown && !G.prev) { // итог «Атомов» — в бульоне: сколько твоих C, N, O (подольше обычного всплывающего)
      this.broughtShown = true; const [a, b] = this.broughtLine();
      this.float(P.x, P.y + 2.5, a, [255, 225, 150], 16); this.floats[this.floats.length - 1].t = -1.4;
      if (b) { this.float(P.x, P.y + 7, b, [190, 205, 225], 13); this.floats[this.floats.length - 1].t = -1.4; }
    }
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
      if (!this.warned && this.rest() < M_WARN) { this.warned = true; this.float(cam.x, cam.y - 8, `облако сожмётся через ${Math.ceil(this.rest())} с: дальше — звезда`, [255, 140, 110], 16); Sfx.play('fizzle'); }
      if (this.steps().every(s => s.d)) this.finish(false);
      else if (this.rest() <= 0) this.finish(true);
    }
    if (this.ignite >= 0) this.ignite += dt;
  },
  // сколько секунд до коллапса облака
  rest() { return this.life - this.clock; },
  // конец уровня (и забега): бульон готов — или облако сжалось раньше (без бонуса уровня, но сваренное — в очки)
  /** @param {boolean} failed */
  finish(failed) {
    this.doneAt = this.clock; this.failed = failed; this.sl.held = null; this.tickStars(true);
    if (failed) {
      this.ignite = 0; this.igAt = [cam.x, cam.y]; fxFlash(cam.x, cam.y, 60, [210, 230, 255], .9); Sfx.play('fizzle'); // звезда — там, куда смотришь: её надо увидеть
      this.float(cam.x, cam.y - 6, 'Облако сжалось: зажглась звезда — бульон, какой успел', [255, 200, 150], 17);
    }
    addScore(Math.max(0, this.st.soupV)); // ценность бульона — очки уровня сверх вех (в итогах — строкой)
    Tally.show(this); // как у остальных уровней: бонус уровня, доля Вселенной, рекорд
    endGame(this.endText());
  },
  // текст конца: что сварено, сколько стоит, что — из вещества твоих звёзд
  endText() {
    const own = [...new Set(this.soupList.filter((/** @type {any} */ x) => x.star).map((/** @type {any} */ x) => x.n))];
    return (this.failed ? `Облако сжалось: в бульоне ${this.st.soup} из ${M_SOUP}` : 'Первичный бульон готов') +
      ` · ценность ${this.st.soupV}.` + (this.found.length ? ` Открыто: ${this.found.join(', ')}.` : '') +
      (own.length ? ` Из вещества твоих звёзд: ${own.join(', ')}.` : '') + (this.found.includes(CROWN) ? ' Венец — глицин: первая аминокислота.' : '');
  },
  // портрет бульона для экрана конца: самое ценное — в центре, остальное — кольцом; рекорд бульона — сравнение с лучшим
  endArt() {
    const best = LB.best('soup.molecules'), prev = best ? best.s : null, v = this.st.soupV;
    if (!this.cheated && v > 0) LB.add('soup.molecules', { n: LB.name(), s: v, t: Math.floor(this.doneAt ?? this.clock), d: Date.now() });
    const rec = this.cheated || !v ? '' : prev == null ? 'первый бульон в этом браузере' : v > prev ? `🏆 рекорд бульона: было ${prev}` : `лучший бульон — ${prev}`;
    return { title: this.failed ? 'Облако сжалось' : 'Первичный бульон', svg: soupSvg(this.soupList), rec };
  },
  // стартовая строка: что пришло из «Атомов» (твои нейтральные C, N, O) и чего нет — то Вселенная принесёт, но не сразу
  /** @returns {[string, string]} */
  broughtLine() {
    const c = this.brought, els = M_HEAVY.map(([e]) => e);
    if (!c) return [`с нуля: стартовый набор ${els.map(e => `${e} ×${M_START[e]}`).join(' · ')}`, ''];
    const have = els.filter(e => c[e] > 0), miss = els.filter(e => !(c[e] > 0));
    if (!have.length) return ['из «Атомов»: ни C, ни N, ни O', 'их принесёт приток — по одному и не сразу'];
    return [`из «Атомов»: ${have.map(e => `${e} ×${c[e]}`).join(' · ')}`, miss.length ? `${miss.join(', ')} — притоком, по одному и не сразу` : 'всё своё; приток — водород, тяжёлые редко'];
  },
  // Shift + колесо — поворот взятого шагом (сразу в угол: скорость вращения Q / E обнуляет каждый кадр)
  wheel(dy) { if (this.sl.held && dy) { this.sl.held.a += Math.sign(dy) * .26; this.sl.held.manRot = true; } },

  // ---------- исследование ----------
  bal() { return Math.floor(this.kn - this.spent); },
  shopItems() { return this.doneAt !== null ? [] : COMP.filter(x => this.found.includes(x.f) && !this.res.has(x.f)).sort((a, b) => +heavy(b) - +heavy(a)).slice(0, 4).map(x => ({ ic: x.f, name: 'Синтез', about: x.n, c: this.mCost(), f: x.f })); },
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
      { t: 'Собрать органику: связь C–C, C–O или C–N', h: 'метанол CH₃OH, этан C₂H₆, метиламин CH₃NH₂, эфир CH₃OCH₃; тяжёлое в тяжёлое — бросок сильнее', s: 'органика', d: ORGANIC.some(f => fd.includes(f)) },
      { t: 'Сформировать законы', h: `${touch ? 'в лавке' : 'клавиши 1–4'}: «Синтез …»`, p: [Math.min(this.res.size, 2), 2], s: 'законы сформированы', d: this.res.size >= 2 },
      { t: `Первичный бульон · ценность ${this.st.soupV}`, h: `законы сварят до ${M_SOUP_UNI}, остальное — рогаткой · H₂ не в счёт · сложное дороже: C₂H₅OH, HCN — впятеро против CH₄, венец — глицин NH₂CH₂COOH — вдесятеро; законом — вполовину`, p: [Math.min(this.st.soup, M_SOUP), M_SOUP], s: 'бульон готов', d: this.st.soup >= M_SOUP },
    ];
  },
  starPool() {
    return [
      // ★ — про умение, а не про то, что случается само (метан и аммиак закрывал шаг 3)
      { t: 'тройная связь рогаткой', ok: () => this.st.triple > 0 },
      { t: 'открыть этанол', ok: () => this.found.includes('C₂H₅OH') },
      { t: 'венец: глицин', ok: () => this.found.includes(CROWN) },
      { t: `бульон за ${fmtClock(M_STAR_T)}`, ok: () => this.doneAt !== null && !this.failed && this.doneAt <= M_STAR_T, bad: () => this.clock > M_STAR_T },
      { t: `${M_STAR_HAND} из ${M_SOUP} в бульон — рогаткой`, ok: () => this.st.soup - this.st.soupU >= M_STAR_HAND },
      { t: `ценность бульона ${M_STAR_V}`, ok: () => this.st.soupV >= M_STAR_V },
      { t: `${M_STAR_OWN} в бульоне — из твоих звёзд`, ok: () => this.st.soupStar >= M_STAR_OWN, can: () => this.starN >= 2 },
    ];
  },
  tickStars(end) { tickStars(this.stars, end, () => { this.kn += 10; this.float(P.x, P.y - 10, '★ +10 ✦', [255, 215, 110], 17); }, this.failed); },
  tally() { return { name: 'Молекулы', rows: [['⏱ уровень', fmtClock(this.doneAt ?? this.clock)], ['соединений открыто', this.found.length], ['собрано рогаткой', this.st.hand], ['собрано Вселенной', this.st.auto], [`бульон ${this.st.soup} / ${M_SOUP}${this.st.soupStar ? ` · из твоих звёзд ${this.st.soupStar}` : ''}`, '+' + this.st.soupV, 'tb']], auto: [this.st.auto, this.st.auto + this.st.hand], stars: this.stars }; },
  cheat() { this.cheated = true; for (const x of [...COMP.slice(0, 4), COMP_BY[ckey({ C: 1, H: 4, O: 1 })]]) if (!this.found.includes(x.f)) this.found.push(x.f); this.st.bonds++; this.res.add('H₂O'); this.res.add('H₂'); this.st.auto = this.st.soup = 10; },

  // ---------- рисование ----------
  draw(al) {
    const z = cam.z;
    for (const mol of this.m) {
      const [cx, cy] = W2S(mol.x, mol.y); if (!onScreen(cx, cy, mol.R * z + 20)) continue;
      const ka = appear(mol.age), a = al * ka, sat = !this.freeSlots(mol) && mol.atoms.length > 1;
      const pts = mol.wp.map(p => W2S(p[0], p[1]));
      if (sat && this.ident(mol)) glow(cx, cy, mol.R * z * 1.4, [140, 235, 170], .12 * a); // готовое соединение
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
        if (at.star) { // выкован в твоей звезде — золотая искра у атома (кольцо — это «взято», его не путать)
          const qx = sx + r * .5, qy = sy - r * .5; glow(qx, qy, Math.max(5, r * .45), GOLD, .5 * a); ball(qx, qy, Math.max(1.8, r * .14), [255, 235, 160], a);
        }
        if (r > 9) label(at.el, sx, sy, Math.max(9, r * .5), at.el === 'H' ? [40, 40, 50] : [255, 255, 255], .85 * a);
      });
      if (sat) label(this.formula(mol), cx, cy - mol.R * z - 8, 11, [190, 235, 210], .75 * a, 700);
      if (mol.held) ring(cx, cy, mol.R * z + 6, GOLD, .9 * al, 2);
    }
    if (this.ignite >= 0) { // облако сжалось: в центре зажглась звезда, её свет заливает бульон
      const [sx, sy] = W2S(this.igAt[0], this.igAt[1]), u = Math.min(1, this.ignite / 2.5);
      glow(sx, sy, (40 + 260 * u) * Math.max(.6, z / 3), [255, 240, 210], .55 * u * al); ball(sx, sy, 6 + 10 * u, [255, 250, 235], .9 * u * al);
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
    // облако сжимается: сколько осталось (последние M_WARN с — красным, мигает) — над лавкой, как срок звезды
    if (this.doneAt === null && !G.prev) {
      const r = Math.max(0, this.rest()), hot = r < M_WARN, y = aboveShop() - 6, w = Math.min(240, G.W * .5), f = clamp(r / this.life, 0, 1);
      const c = hot ? [255, 140, 110] : [150, 205, 255], a = al * (r < 10 ? .6 + .4 * Math.sin(G.T * 8) : 1);
      label(`облако сожмётся в звезду через ${fmtClock(r)}`, G.W / 2, y, hot ? 16 : 14, c, .9 * a, 800);
      ctx.globalAlpha = 1; ctx.fillStyle = rgb([255, 255, 255], .14 * al); ctx.fillRect(G.W / 2 - w / 2, y + 11, w, 4);
      ctx.fillStyle = rgb(c, .85 * a); ctx.fillRect(G.W / 2 - w / 2, y + 11, w * f, 4);
    }
    hudBanner(this.banner, 'УРОВЕНЬ 6 · миллиард лет', 'Молекулы', 'собрать соединения и создать законы их синтеза', al, 'атомы → молекулы → первые кирпичики жизни');
    ctx.globalAlpha = 1;
  },
  showCodex() { return false; },
  viewR() { return M_VIEW; },
  hud() { return { title: '', sub: `облако · T ≈ 30 K${this.starN ? ` · из твоих звёзд: ${this.starN}` : ''}`, lines: [], goal: '', laws: [] }; },
};
