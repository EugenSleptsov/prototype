// @ts-check
"use strict";
/* Уровень частиц: эпохи 1–4. «Вселенная как коллайдер».
   Игрок — не частица, а ДЕТЕКТОР (круг вокруг курсора).
   - Клик = снимок: изучено всё, что сейчас в круге, и следы событий (вершины распадов живут ~2,5 с).
   - Зажать = поле: ближайшие кванты притягиваются к детектору и кружат вокруг него, тянутся за ним
     и набирают энергию (кольцо-шкала вокруг круга). Отпустить = столкнуть их лоб в лоб.
   - Столкновение двух квантов рождает пару частица + античастица (E = mc²).
   - Масса (эпоха 2, поле Хиггса) — вес в руке: с массой поле ловит и вещество, но тяжёлое тянется медленно,
     тормозит детектор и медленнее летит; частица + античастица в поле аннигилируют (на 91 ГэВ — Z).
   - Эпоха 4: зажатое поле — щит: тянет кварки вещества и отталкивает антикварки.
   - Каждая эпоха — задание крупно под часами (цели меняются от забега к забегу) и два случайных испытания ★.
   - ✦ знания добываются ловлей фотонов и снимками и тратятся на исследования мира прямо в игре.
   - Детектор не прокачивается: радиус, перезарядка, сила поля и захват — одни и те же (DET).
   - Пролог «Разогрев»: инфляция кончилась, поле-инфлатон — шарик в чаше потенциала V(φ), катается туда-сюда.
     Его надо раскачать, как качели, — рогаткой, тем же глаголом, что у предметов на всех уровнях (разбор дизайна:
     было «держать, пока катится влево»): оттянуть резинку против хода шарика и отпустить, когда он проходит дно, —
     толчок по ходу раскачивает, против хода — гасит; чем длиннее резинка, тем сильнее. На каждом отскоке поле отдаёт энергию в
     свет: из кольца вылетают пары фотонов, тем жёстче, чем сильнее размах, и остаются в мире эпохи 1.
     Чем сильнее размах — тем быстрее ритм; кольцо дошло до красной черты — срыв, раскачка пропадает.
     За 18 с поле распадается; сколько света набрал (шкала внизу) — такое и качество разогрева: слабый, хороший
     или отличный (T = k·1 ТэВ, света в мире ∝ k^1,5 до конца уровня). Это оценка, а не выбор: больше — всегда лучше
     (второе ревью №8: «профили» были выбором с одной строго лучшей опцией). Это настоящий механизм preheating —
     параметрический резонанс инфлатона.
   - Исследования (эпохи 1–3): сначала делаешь руками, потом за ✦ отдаёшь это Вселенной. Свет сам (уровни
     плотности), глюоны, самостолкновения, «X сам» для каждой открытой частицы (и для H, W, Z).
     Вселенная рождает сама только исследованное: H во всплесках поля — после «H сам»,
     в эпохе 3 тяжёлое для распада у горячей точки — после «X сам» (или когда руками уже не сделать). Пункт появляется в панели
     ✦ (до трёх сразу, клавиши 1–7) только после того, как сделал это руками; автоматическое в кодексе помечено ⟳. Пойманный фотон измерен: класс по энергии
     (мягкий — обычный, жёсткий — редкий) и ⚡ по классу.
   Текста минимум: подсказка в одну строку у детектора, пока действие не освоено. */
const C_LIGHT = 1.2, WORLD_R = 12, T_START = 1000, N_QUANTA = 22, PAIR_T = .8, VERT_T = 2.6, CHARGE_T = 3;
// Детектор — один и тот же всю игру (прокачки нет: она путала и отвлекала от главного — законов Вселенной):
// r — радиус, sh — перезарядка снимка (с), pow — сила поля (Emax = 2·T·pow), fr — захват полем (× радиуса)
/** @type {Record<string, number>} */
const DET = { r: .9, sh: 1.2, pow: 3, fr: 2.6 };
const NEED0 = ['u', 'd', 'e']; // эпоха 1: первое поколение; следующие открываются по порядку (GEN_PREV в codex.js)
const HIT_R = .42, Z_WIN = 14, BAND_AT = .55; // BAND_AT — где на шкале тяжёлой пары середина полосы Z // радиус встречи; полуширина окна резонанса Z (ГэВ)
// Тепловая масса в плазме до перехода Хиггса: m ≈ g·T (сильное взаимодействие — кварки ≈ 0,5 T, топ ещё и юкавское ≈ 0,6 T;
// электрослабое — лептоны ≈ 0,2 T). Поэтому и без поля Хиггса у рождения пары есть порог 2m.
/** @type {Record<string, number>} */
const TH_M = { quark: .5, t: .6, lepton: .2 };
const THROW_V = 5, THROW_R = .85; // скорость детектора для броска; радиус попадания броском (шире: бросок — не лотерея)
// Энергия детектора: появляется, когда открыт фотон; пополняется пойманными фотонами,
// тратится на снимки и на разгон квантов полем
const E_CAP = 10, E_START = 0, E_SHOT = 1, E_FIELD = 2, PH_C = [255, 238, 150];
// Норматив времени эпохи (с): каждая секунда быстрее даёт +2 к итогу. В эпохе 4 вместо скорости — сохранённое вещество.
const PAR = [0, 60, 60]; // норматив эпохи, с (0 — нет: эпоха 1 — учебные главы, спешка там вредна; часы идут с конца пролога)
const PH_DENS = [.15, .45, .45]; // закон «Свет»: доля квантов в мире по уровням (до закона — скудный остаток разогрева: свет кончается, его ешь;
// второй уровень — не больше света, а вдвое больше горячих областей)
// Счётчик «Во Вселенной» (Counts в core.js): сколько чего сейчас в мире — числом, перемена вспыхивает
/** @type {{ sp: string, n: string, c: RGB }[]} */
const METER = [
  { sp: 'ph', n: 'γ', c: [255, 238, 150] },
  { sp: 'e', n: 'e±', c: [127, 224, 142] }, // цвета — поколения, как в лавке
  { sp: 'mu', n: 'μ±', c: [255, 210, 122] },
  { sp: 'ta', n: 'τ±', c: [255, 122, 102] },
];
const RES_MAX = 4; // исследований в панели ✦ одновременно (клавиши 1–4)
// Качество разогрева — три ступени оценки (не выбор: чем больше света набрал, тем лучше): диапазон k (T = k·1 ТэВ),
// оценка и цвет отметок (от холодного синего к горячему розовому — Вселенная и правда горячее)
// h — с какой доли шкалы разогрева начинается эта оценка
const PROF = [{ n: 'слабый', k: [.82, .92], c: [130, 195, 255], h: 0 }, { n: 'хороший', k: [1.05, 1.18], c: [255, 215, 110], h: .4 }, { n: 'отличный', k: [1.38, 1.5], c: [255, 120, 200], h: .75 }];
// Пролог — резонанс инфлатона: шарик в чаше V(φ) ∝ φ². Размах A (0…1), фаза θ: φ = A·cos θ, θ ∈ (0, π) — катится влево.
// Рогатка: отпустил — толчок в сторону, обратную резинке: dA = kick · k^1,5 · c, k — доля резинки (по горизонтали),
// c = направление толчка × скорость шарика (−sin θ: + — катится вправо) — у дна по ходу раскачивает, против — гасит.
// Свет рождается, когда шарик проходит дно (φ = 0). R — полуширина чаши в радиусах детектора.
// Отскок (θ = π) отдаёт долю eta размаха в свет: шкала += kap·A². Ритм ω = w0·(1 + wk·A). A > crit — срыв до snapA.
// life — сколько секунд живёт поле после первого нажатия (или после wait секунд без нажатий).
const INF = { A0: .2, w0: TAU / 1.8, wk: 1, kick: .2, damp: .03, eta: .06, kap: .09, crit: 1, snapA: .15, life: 18, wait: 8, R: 2.6, deep: .75, low: .4 };
// Классы фотонов по энергии относительно температуры (x = E/T, тепловой спектр): доля, ⚡, ✦ за первую находку (k)
// и ✦ за каждый пойманный (kn) — главный «клик» экономики: больше света в мире → быстрее копятся ✦
// Два класса: четыре оттенка жёсткости путали и ничего не давали игре
const PH_CLS = [
  { n: 'мягкий', r: 'обычный', x: 0, e: 1, k: 5, kn: 1, c: [255, 200, 130] },
  { n: 'жёсткий', r: 'редкий', x: 4, e: 3, k: 15, kn: 5, c: [200, 225, 255] },
];
const GLU_LOOPS = 4, GLU_SPIN = 5; // петель в пружинке глюона; скорость её вращения (рад/с)
// тепловой хвост: класс, которого раскачка не создала, всё равно есть в спектре — редко (вес от суммы созданных).
// Раньше вялая раскачка навсегда запрещала жёсткий свет — в тепловом равновесии так не бывает (ревью: физическая неправда)
const PH_TAIL = .06;
const PH_TOP = PH_CLS.length - 1, PH_XMAX = 11, PH_HARD_A = .55; // самый жёсткий класс; верх спектра (x = E/T); с какого размаха раскачки свет жёсткий
/** верх класса c в долях T @param {number} c */
const phHi = c => (c < PH_TOP ? PH_CLS[c + 1].x : PH_XMAX);
// Цены «Сформировать закон». Обязательные для заданий — «Свет» I, «Глюоны», «Асимметрия»; прочие — по одному
// на эпоху сверх них: замер (бот «средний игрок», tests/shop.test.mjs) — ~1–1,5 ✦ в секунду (свет, снимки, вехи),
// и каждый необязательный закон действует в первые секунды (lawNow) и окупается за 20–40 с игры, а не доходом в минуту.
// Вся необязательная лавка — 245 ✦ (было ~600). «Столкновения» отдельно не продаются: приходят с первым законом вещества.
// «Свет» — два уровня (игрок: «первый + доп. очаги»): I — свет в мире, II — горячих областей вдвое больше
const RES_COST = { ph: [10, 25], g: [40], cp: [40] };
/** «Кварки I–III» и «Лептоны I–III»: тяжелее поколение — чуть дороже (без роста за каждую покупку) @type {Record<string, number>} */
const LAW_COST = { q1: 20, q2: 28, q3: 36, e: 20, mu: 24, ta: 28 };
// что закон делает сразу: ◉ в запас u/d (кварки), e⁻ к атомам (лептоны II–III), пар своего вида в кадре
const NOW_UD = 3, NOW_E = 2, NOW_PAIRS = 2;
// Доход от научённого, ✦/мин (сводка «Законы Вселенной»): свет — по уровню, «Генерация X» — 2 + ценность X
/** @type {Record<string, number>} */
const UNI_RATE = { g: 3, coll: 4, cp: 4 }, UNI_PH = [0, 2, 5];
const LB_KEY = 'proto.lb.v1';
// Таблица рекордов — в браузере игрока (localStorage)
const LB = {
  load() { try { return JSON.parse(localStorage.getItem(LB_KEY) || 'null') || {}; } catch (e) { return {}; } },
  name() { try { return localStorage.getItem('proto.name') || 'Игрок'; } catch (e) { return 'Игрок'; } },
  /** игрок вписал имя (без него строки — «Игрок», в общую таблицу не уходят, пока не впишет) */
  named() { try { return !!localStorage.getItem('proto.name'); } catch (e) { return false; } },
  /** вписал имя позже — свои строки «Игрок» в таблице браузера переименовать @param {string} from @param {string} to */
  rename(from, to) {
    const all = this.load(); let n = 0;
    for (const k of Object.keys(all)) for (const e of all[k]) if (e.n === from) { e.n = to; n++; }
    if (n) try { localStorage.setItem(LB_KEY, JSON.stringify(all)); } catch (err) { /* без хранилища */ }
  },
  /** @param {string} key @returns {LBEntry | null} */
  best(key) { const l = this.load()[key]; return l && l.length ? l[0] : null; },
  // добавляет результат, возвращает список и место (0 — первое)
  /** @param {string} key @param {LBEntry} e @returns {{ list: LBEntry[], place: number }} */
  add(key, e) {
    /** @type {Record<string, LBEntry[]>} */
    const all = this.load(), l = all[key] || [];
    l.push(e); l.sort((a, b) => b.s - a.s || (a.t ?? 1e9) - (b.t ?? 1e9));
    all[key] = l.slice(0, 20);
    try { localStorage.setItem(LB_KEY, JSON.stringify(all)); } catch (err) { /* без хранилища таблица живёт до перезагрузки */ }
    return { list: l, place: l.indexOf(e) };
  },
};
const fmtClock = (/** @type {number | null | undefined} */ t) => t == null ? '—' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const LEP_C = [[150, 205, 255], [120, 165, 255], [150, 120, 255]];
/** @type {Record<string, RGB>} */
const BOS_C = { W: [255, 150, 70], Z: [255, 105, 115], H: [255, 215, 90], ph: [255, 240, 190] };
const NO_C = [255, 95, 85]; // клетка матрицы, которую пока не создать
const NU_C = [175, 255, 205], GOLD = [255, 226, 106], FIELD_C = [82, 200, 255], SHIELD_C = [77, 232, 155];
const FERMIONS = ['u', 'd', 'c', 's', 't', 'b', 'e', 'mu', 'ta', 'ne', 'nm', 'nt'];
// Эпохи уровня. Температура не опускается ниже floor, пока цели эпохи не выполнены;
// следующая эпоха начинается, когда T ≤ startT (и после короткой паузы).
// Эпоха 4 предела не имеет (второе ревью №11: на 0,5 ГэВ её нельзя было проиграть): Вселенная остывает от 3 ГэВ
// до T_END4 за tau·ln(3 / T_END4) ≈ 81 с — сколько троек сберёг, столько и ушло, цель не выполнена — дальше без бонуса.
const EPOCHS = [
  { name: 'Чистая энергия', floor: 165, tau: 36, startT: Infinity, when: '10⁻¹² с', line: 'Сначала нет ничего, только вакуум' },
  { name: 'Поле Хиггса', floor: 90, tau: 14, startT: 160, when: '10⁻¹¹ с', line: 'Поле застывает, и у частиц появляется масса' },
  { name: 'Распады', floor: 3, tau: 14, startT: Infinity, when: '10⁻¹⁰ с', line: 'Тяжёлые частицы распадаются цепочками' },
  { name: 'Аннигиляция', floor: 0, tau: 40, startT: 3, when: '10⁻⁷ с', line: 'Антивещество идёт волнами: вещество нужно сберечь' },
];
const T_END4 = .4; // ГэВ: ниже аннигиляция догорает и уровень кончается
const CHAINS = [['t', 'b', 'c'], ['ta', 'mu']]; // чьи распады нужно снять в эпохе 3
// Роль семейства: зачем отдавать Вселенной рождение частицы (исследование «Генерация X»)
//  e      — e⁻ и e⁺ притягиваются и гаснут в γγ: каждая вспышка +1 ✦, на виду — ещё и +1 ⚡
//  u, d   — Вселенная откладывает по кварку раз в UD_EVERY с (до UD_MAX, поровну u и d);
//           в эпохе 4 запас сразу ложится в детектор готовыми тройками — фора к барионам
//  c s b μ τ — каждый снятый распад платит ✦ (вдвое против массы) и возвращает ⚡ снимка; такие частицы не уходят в фон
//  t      — t, рожденный Вселенной, распадается в кадре: ⚡ до полного (не чаще раза в T_CD с; твой t — не в счёт)
const E_PULL = 2.5, UD_MAX = 6, UD_EVERY = 8, T_CD = 20, DEC_PAY = ['c', 's', 'b', 'mu', 'ta'];
// Кузница: тяжёлое распадается в лёгкое. Научил «Генерация X» тяжёлого — распад X вещества (эпохи 2–3) кладёт
// лёгкий кварк в запас к эпохе 4 (каждое научённое тяжёлое поколение — потолок запаса выше на UD_STEP),
// распады μ и τ куют электроны в «Атомы» (до E_FORGE). Асимметрия (нарушение CP) — только при трёх поколениях кварков.
const FORGE_Q = ['s', 'c', 'b', 't'], FORGE_L = ['mu', 'ta'], UD_STEP = 6, E_FORGE = 12;
// «Кварки I / II / III» — генерация кварков поколениями: один закон на поколение (ключи q1…q3 в rs), по лестнице.
// Кварки поколения получают rs[sp] = 1 и Codex.auto, как только открыты (открыл s после закона — Вселенная рождает и его).
// Зачем каждое: I — запас u/d к эпохе 4 и «Адронам»; II — кузница c, s и в «Адронах» странные ▲ / очарованные ■ кварки
// (гипероны Λ, Σ, Ξ, Λc); III — t заряжает ⚡, кузница b, в «Адронах» прелестный ⬢ (Λb: каскад b → c → s → u).
/** @type {Record<string, string[]>} */
const QGEN = { q1: ['u', 'd'], q2: ['c', 's'], q3: ['t', 'b'] };
/** @type {Record<string, string>} */
const QLAW = { u: 'q1', d: 'q1', c: 'q2', s: 'q2', t: 'q3', b: 'q3' };
/** @type {Record<string, string>} */
const QROM = { q1: 'I', q2: 'II', q3: 'III' };
// Лептоны — ветка, параллельная кваркам: «Лептоны I / II / III» (ключи законов — сами e, μ, τ, по лестнице e → μ → τ).
// Все три сформированы — ветка завершена: «Лептонная универсальность» — распад μ и τ Вселенной даёт +1 ⚡, где бы ни случился.
/** @type {Record<string, string>} */
const LGEN = { e: 'I', mu: 'II', ta: 'III' };
const LEP = ['e', 'mu', 'ta'];
const COL_N = ['красный', 'зелёный', 'синий']; // цвет кварка; у глюона — цвет и антицвет
const STOCK_GOAL = 15, TRIO_GOAL = 5; // цель эпохи 4 — пять будущих барионов (по кварку каждого цвета)
const TRIO_W = TRIO_GOAL < 5 ? 'тройки' : 'троек';
// Автоматизация эпохи 4: исследуй «Асимметрию» — и Вселенная сама сберегает тройки (раз в SAVE_CD с);
// AUTO_TRIO таких — и вещество больше не нуждается в тебе: уровень кончается не «по времени», а потому что научился сам
const AUTO_TRIO = 6, SAVE_CD = 2.2, HAND_CP = 2;
// Эпоха 4 — битва. Ядро детектора (куда складываются кварки и где их съедает антивещество) не растёт с радиусом:
// большой радиус — шире щит, а не уязвимее ядро. Антивещество идёт волнами (раз в WAVE_CD с, за WAVE_WARN с —
// предупреждение и стрелка); отпущенный щит бьёт ударной волной. Глюонов мало: не больше G_MAX4 в мире.
const CORE_R = 1.0, WAVE_CD = 11, WAVE_WARN = 2.4, G_MAX4 = 4;
// Подсказки без обучения (эпоха 1): после COACH_IDLE с без полезного действия призрачный курсор сам показывает
// следующий жест на ближайшем подходящем объекте (COACH_T — длина показа). Освоил жест — этот показ больше не нужен.
const COACH_IDLE = 5, COACH_T = 2.8;
// Обучение — отдельный короткий забег до игры: четыре жеста по одному (такт → снимок → сбор света → столкновения
// разной силы). Без очков, часов и рекордов; пропустить можно на старте и в любой момент (кнопка или Esc).
// До частиц — школа жестов (пролог): сцены по порядку; сгустков в сцене «вести»; через сколько секунд без дела — призрачный жест
const SCHOOL = ['move', 'look', 'join', 'drop'], SCH_N = 3, SCH_IDLE = 3.5, FL_C = [175, 165, 255];
// Главы эпохи 1 (шаг задания знает свою главу — ch): новая глава — лента с её названием и одной мыслью, игра идёт
/** @type {Record<number, { n: string, line: string }>} */
const CHAPTERS = {
  2: { n: 'Свет', line: 'Свет — это энергия. Лови его кругом, кликать не нужно: пойманный фотон измерен и даёт ⚡' },
  3: { n: 'Первый удар', line: 'Сведи два фотона полем — из энергии родится вещество: электрон и его античастица' },
  4: { n: 'Закон', line: 'Свет кончается: ты его ешь. Отдай знания ✦ закону — и Вселенная будет светить сама' },
  5: { n: 'Полный удар', line: 'Чем сильнее удар, тем тяжелее рождённое. 4 ⚡ — три струи, и в одной из них глюон' },
  6: { n: 'Вещество', line: 'Свет и глюоны, сведённые с нужной силой, рождают кварки u и d. Из них потом сделано всё вокруг' },
};
// Пустота — шаг ноль: игра начинается с ничего. Строки предыстории проявляются по одной, «зажми» — с VOID_MIN с;
// первое нажатие проявляет поле и сразу становится первым толчком.
const VOID_MIN = .3, VOID_STEP = 1.3; // .3 — только чтобы нажатие «Начать» не стало толчком: дальше старт по первому нажатию (разбор ревью)
const VOID_TXT = ['Ничего нет. Ни частиц, ни света.', 'Только поле, растянутое инфляцией.', 'В нём вся энергия будущей Вселенной.', 'Из неё генерируется всё, что появится.', 'И только из этого будет строиться мир.'];
// Сила удара — ступени: чем дольше держишь пару квантов, тем выше ступень (LV_T с на ступень), каждая ступень
// стоит 1 ⚡ — удар на k ступеней стоит k ⚡. Лестница 1–4 без нуля: взял пару — сразу ступень 1; «слабый удар» — только без ⚡.
const LV_N = 4, LV_T = .75;
// Горячие области: на карте HZ_N пятен, где Вселенная горячее. Там свет гуще (область сама испускает HZ_RATE квантов в секунду —
// кванты летят со скоростью света, поэтому область — источник, а не склад) и жёстче (×HZ_P),
// удар набирается быстрее. Вещество, W, Z, H Вселенная рождает равномерно — области только для квантов.
// Живут ~HZ_L с и остывают; новые вспыхивают в другом месте — есть зачем ехать по карте.
/** @type {RGB} */
const HZ_C = [255, 150, 80];
// Цветные вихри — после закона «Глюоны»: сгустки, где глюонное поле плотнее и рождаются глюоны (свет — в горячих
// областях, глюоны — в вихрях). Глюоны безмассовые: и в вихре летят со скоростью света, не вязнут.
/** @type {RGB} */
const CZ_C = [120, 175, 255];
const CZ_N = 2, CZ_RATE = 2.5; // сколько цветных вихрей; глюонов в секунду из вихря
const HZ_EP0 = .6; // доля HZ_RATE в эпоху 1 (до Хиггса области только подсвечивают свет)
const HZ_N = 2, HZ_R = 2.6, HZ_L = 40, HZ_IN = 2.5, HZ_RATE = 1.5, HZ_P = 1.7; // HZ_RATE — квантов в секунду из области
// Свет рождается чаще в горячих областях: пока область горит, PH_SRC пополнения света — оттуда (глюоны — G_SRC из вихрей),
// а квант вне области за ~Q_LIFE с остывает и растворяется в фоне. Свет гуще у источников, редеет вдали — за ним едешь.
// В кадре квант не остывает (Q_VIEW = 0): за улетающим можно погнаться и поймать — на глазах ничего не пропадает.
// Мир полон (кванты ≥ qCap · Q_FULL) — области не испускают: кипят, но не заваливают поле.
// Где рождается пополнение: свет — с повышенным шансом в горячих (PH_SRC), глюоны — почти всегда в цветных вихрях (G_SRC),
// всё остальное (вещество, W, Z, H) — равномерно по миру.
const PH_SRC = .5, G_SRC = .95, Q_LIFE = 10, Q_VIEW = 0, Q_FULL = 1.1;
// Выбор второго кванта: поле берёт ближайший к центру детектора (любого вида), но не сразу — PICK_T с подсветкой,
// чтобы успеть подвести детектор к нужному (γ + g, а не то, что оказалось ближе). Прежний кандидат держится, пока новый не ближе на PICK_HYS.
const PICK_T = .35, PICK_HYS = .7;
const TAP_MAX = .35; // до стольких секунд нажатие без взятой пары — снимок, а не поле (тап пальцем длиннее щелчка мыши)
const TRY_N = 2; // промахов, после которых задание называет рецепт целиком (поколения II–III: сначала — только пара)
const HIG_T = 3; // сколько секунд застывает поле Хиггса (пассивная фаза: короче — меньше ждать; было 6 — второе ревью №11)
// Матрица рождения: пара квантов × ступень. Ступень — поколение (тяжелее — дольше держать):
//   γ + γ — фотон чувствует только заряд: лептоны e, μ, τ; 4 ⚡ — три струи (u ū + глюон; три струи увидели
//           на PETRA в 1979, но там сталкивались e⁺ и e⁻ — в игре условность: γ + γ), после перехода Хиггса — W⁺W⁻;
//   γ + g — заряд и цвет: up-кварки u, c, t (заряд 2/3 — фотон рождает их вчетверо охотнее down); 4 ⚡ — t t̄ + глюон;
//   g + g — только цвет: down-кварки d, s, b (в природе g + g к аромату безразличен — в игре закреплено ради ясности);
//           4 ⚡ — после перехода Хиггса бозон H.
// Клетка закрыта (поколение ещё не открыто, энергии на массу не хватает) — рождается клетка ниже по строке.
/** @type {Record<string, string[]>} */
const MATRIX = { phph: ['e', 'mu', 'ta', 'jets'], gph: ['u', 'c', 't', 'tg'], gg: ['d', 's', 'b', 'H'] };
/** @type {Record<string, string>} */
const PAIR_N = { phph: 'γ + γ', gph: 'γ + g', gg: 'g + g' };
/** @type {Record<string, string>} — то же словами, и сила удара по ступеням */
const PAIR_W = { phph: 'два фотона', gph: 'свет и глюон', gg: 'два глюона' }, LV_W = ['', 'на 1 ⚡', 'на 2 ⚡', 'на 3 ⚡', 'на 4 ⚡']; // лестница удара 1–4
// Сколько барионов можно собрать из кварков [{fl, col}]: три разных цвета, не uuu/ddd — точно, не жадно.
// T троек возможно, если из каждого цвета c взять a_c кварков u (и T − a_c кварков d) так, что всего u — от T до 2T
// (в каждой тройке один или два u; при трёх цветах такая раскладка по тройкам всегда найдётся).
/** @param {Stored[]} list */
function baryonTrios(list) {
  const u = [0, 0, 0], d = [0, 0, 0];
  for (const o of list) (o.fl === 'u' ? u : d)[o.col]++;
  for (let T = Math.min(...[0, 1, 2].map(c => u[c] + d[c])); T > 0; T--) {
    let lo = 0, hi = 0;
    for (let c = 0; c < 3; c++) { lo += Math.max(0, T - d[c]); hi += Math.min(u[c], T); }
    if (lo <= 2 * T && hi >= T) return T;
  }
  return 0;
}

// Фотон — волновой пакет: синусоида, симметрично затухающая к обоим концам (без «головы» и «хвоста»).
// Центр пакета — в (sx, sy), длина L вдоль направления (dx, dy); фаза — с мировой координаты, волна стоит в пространстве.
/** @param {number} sx @param {number} sy @param {number} dx @param {number} dy @param {number} L @param {number} per @param {number} amp @param {number} phase @param {RGB} col @param {number} a @param {number} lw */
function wavePacket(sx, sy, dx, dy, L, per, amp, phase, col, a, lw) {
  const nx = -dy, ny = dx, steps = Math.max(16, Math.min(96, Math.ceil(L / per * 10)));
  ctx.lineWidth = lw; ctx.strokeStyle = rgb(col, a); ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps - .5, s = u * L, env = Math.cos(u * Math.PI) ** 2, w = Math.sin(s / per * TAU + phase) * amp * env;
    const x = sx + dx * s + nx * w, y = sy + dy * s + ny * w;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
}
// Глюон — пружинка из петель (как на диаграммах Фейнмана): у всех глюонов одна и та же форма, отличается только цвет.
// Петли чередуют цвет и антицвет. Центр — в (sx, sy), ось — вдоль (dx, dy); размер — от зума, не от энергии.
// roll — фаза вращения: пружинка крутится, петли (с их цветами) бегут вдоль оси, форма та же.
/** @param {number} sx @param {number} sy @param {number} dx @param {number} dy @param {RGB[]} cols @param {number} a @param {number} lw @param {number} roll */
function gluonCoil(sx, sy, dx, dy, cols, a, lw, roll) {
  const N = GLU_LOOPS, L = clamp(.95 * cam.z, 28, 64), k = L / (N * TAU), b = 2.4 * k, nx = -dy, ny = dx, per = 18;
  const pt = (/** @type {number} */ t) => { const s = k * (t - roll) - b * Math.sin(t) - L / 2, w = -b * Math.cos(t); return [sx + dx * s + nx * w, sy + dy * s + ny * w]; };
  ctx.lineWidth = lw;
  let ci = -1, t = roll;
  for (let i = 0; i <= N * per; i++, t = roll + i / per * TAU) {
    const c = ((Math.floor(t / TAU) % cols.length) + cols.length) % cols.length, [x, y] = pt(t);
    if (c !== ci) { // новая петля — новый цвет: продолжаем с той же точки
      if (ci >= 0) { ctx.lineTo(x, y); ctx.stroke(); }
      ci = c; ctx.strokeStyle = rgb(cols[c], a); ctx.beginPath(); ctx.moveTo(x, y);
    } else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
// Дуга-клин: толщина растёт от w0 у начала до w1 у конца — «набираешь» видно по толщине
/** @param {number} x @param {number} y @param {number} r @param {number} a0 @param {number} a1 @param {number} w0 @param {number} w1 @param {RGB} c @param {number} a */
function wedge(x, y, r, a0, a1, w0, w1, c, a) {
  if (!(a > 0) || Math.abs(a1 - a0) < .005) return;
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / .08)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, an = a0 + (a1 - a0) * t, w = (w0 + (w1 - w0) * t) / 2; pts.push([an, r + w, r - w]); }
  ctx.fillStyle = rgb(c, a); ctx.beginPath();
  pts.forEach(([an, ro], i) => { const X = x + Math.cos(an) * ro, Y = y + Math.sin(an) * ro; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  for (let i = pts.length - 1; i >= 0; i--) { const [an, , ri] = pts[i]; ctx.lineTo(x + Math.cos(an) * ri, y + Math.sin(an) * ri); }
  ctx.closePath(); ctx.fill();
}
/** @param {number} x @param {number} y @param {number} r @param {number} a0 @param {number} a1 @param {RGB} c @param {number} a @param {number} lw @param {number[]} [dash] */
function arc(x, y, r, a0, a1, c, a, lw, dash) {
  if (!(r > 0) || !(a > 0)) return;
  ctx.strokeStyle = rgb(c, a); ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); if (dash) ctx.setLineDash([]);
}

// Типы (Q — объект мира, Focus, Track, ParticlesState…) — в types/game.d.ts; проверка: npm run typecheck
const Particles = {
  // поля состояния (их заводят enter() и эпохи) — для проверки типов; во время игры здесь пусто
  ...(/** @type {ParticlesState} */ ({})),
  key: 'particles', name: 'Частицы', bg: [44, 34, 14], controls: '',
  // пролог — рогатка шарика: палец на сенсоре сам жест (без ◉), как на уровнях с рогаткой; в школе жестов — как в игре: палец ведёт, ◉ — действие
  /** @returns {boolean} */
  get finger() { return this.ep === 0 && !this.lit && !this.school; },
  // словарь жестов (разбор дизайна: один на игру): по предмету · по пустому · карта
  gest() {
    const t = isTouch(), hold = t ? '◉ держать' : 'держать';
    if (this.school) return { obj: t ? '◉ тап у сгустка: посмотреть' : 'клик у сгустка: посмотреть', empty: `${hold} у двух сгустков: свести · отпустить: удар` + (t ? ' · с ◉ на ✕: разжать' : ' · правая кнопка: разжать'), map: t ? 'палец ведёт круг' : 'круг идёт за мышью' };
    if (this.ep === 0 && !this.lit) return { obj: 'шарик поля: оттянуть против хода, отпустить у дна — раскачка', empty: '', map: '' };
    return { obj: t ? '◉ тап по частице: снимок' : 'клик по частице: снимок',
      empty: this.ep === 3 ? `${hold}: щит · отпустить: ударная волна` : `${hold} у двух квантов: поле тянет и копит удар · отпустить: удар` + (t ? ' · с ◉ на ✕: разжать' : ' · правая кнопка: разжать'),
      map: t ? 'палец ведёт детектор, карта — за ним' : 'карта — за детектором (ведёт мышь)' };
  },

  enter() {
    this.p = []; this.t = 0; this.T = T_START; this.hig = 0; this.higT = -1; this.higC = { x: 0, y: 0 }; this.ripples = []; this.ripCd = 0; this.ff = 1;
    this.advanced = false;
    this.gOn = false; this.full = false; this.spCd = 0; // эволюция эпохи 1: сперва пустота, потом свет, потом глюоны
    this.lit = false; this.litT = 0; this.rs = { ph: 0, g: 0, coll: 0, cp: 0 }; this.safe = []; this.saveCd = 0; this.autoT = 0; Codex.auto = new Set(); this.inf = this.mkInf(); this.heatBest = LB.best('heat'); this.heatRes = null; this.heatWorld = null; Online.top('heat', 1).then(l => { if (l && l[0]) this.heatWorld = l[0]; }); this.T0 = T_START; this.heat = 1; this.caught = PH_CLS.map(() => 0); this.caughtFx = -1; this.caughtAt = -9; this.phSeen = new Set();
    this.kn = 0; this.uni = []; this.uniOff = new Set(); this.spent = 0; this.epClock = 0; this.epKn0 = 0; this.doneAt = null; this.lvlTotal = 0; this.cheated = false;
    this.school = null; this.chap = 1; this.inVoid = true; this.voidT = 0;
    this.focus = null; this.holding = false; this.hold = 0; this.shield = 1;
    this.learn = {}; this.coach = { idle: 0, t: 0, kind: null }; this.spotted = new Set(); this.missT = -99; this.en = 0; this.enFx = 0; this.shotCd = 0; this.shotFx = 0; this.tracks = []; this.floats = []; this.seenN = {}; this.ejected = 0;
    this.bg = [44, 34, 14];
    this.ep = 0; this.epDone = false; this.epGap = 0; this.bannerFor = -1; this.banner = 99; this.epT = 0;
    this.pairs = 0; this.tries = {}; this.decSeen = new Set(); this._pk = null; this.starsShown = false; this.lepDone = false; this.hot = []; this.hotCd = 3; this.hz = []; this.hzCd = 2; this.hzSeen = false; this.cz = []; this.czCd = 2; this.czSeen = false; this.stock = 0; this.stockQ = []; this.udRes = []; this.eRes = 0; this.forgedQ = []; this.udT = 0; this.tAt = -99; this.soupCd = 0; this.handoff = null; this.stockOut = false; this.finale = -1; this.failed = false;
    Codex.run = new Set(); Codex.dirty = true;
    // цели этого забега: что открыть в эпохе 1 и чьи распады снять в эпохе 3
    this.need0 = [...NEED0];
    // распады эпохи 3 — по порядку поколений: лёгкое раньше тяжёлого
    // цепочка b — всегда: третье поколение кварков к эпохе 4 открыто (без него нет асимметрии)
    this.need2 = ['b', ...pickStars(CHAINS.flat().filter(sp => sp !== 'b').map(sp => ({ sp })), 2).map(x => x.sp)].sort((a, b) => (SM[a].gen ?? 0) - (SM[b].gen ?? 0));
    this.newEpochState(0);
    P.x = P.y = P.vx = P.vy = 0; P.dashCd = 0;
  },
  /** @param {number} i */
  newEpochState(i) {
    this.st = { pairs: 0, thr: 0, empty: 0, kinds: 0, dry: 0, eaten: 0, recol: 0, waves: 0 }; // статистика эпохи для испытаний
    this.tk = {}; this.stars = pickStars(this.starPool(i));
  },
  /** @param {number} x @param {number} y @param {string} txt @param {RGB} [c] @param {number} [sz] @param {number} [t] */
  float(x, y, txt, c = [140, 220, 255], sz = 13, t = 0) { this.floats.push({ x, y, t, txt, c, sz }); Fly.from(x, y, txt); },

  // ---------- создание ----------
  /** @param {number} T */
  thermalP(T) { return T * -Math.log(Math.random() * Math.random() * Math.random() + 1e-12); },
  /** @param {string} sp @param {boolean} anti @param {number} x @param {number} y @param {number} a @param {number} p @param {number} [col] @returns {Q} */
  mk(sp, anti, x, y, a, p, col) {
    const s = SM[sp];
    /** @type {Q} */
    const o = { sp, anti, x, y, dx: Math.cos(a), dy: Math.sin(a), p, col: col ?? (Math.random() * 3 | 0),
      age: 0, life: s.life ? -s.life * Math.log(Math.random() + 1e-9) : Infinity, born: 0, cd: 0, dead: false, ph: Math.random() * TAU,
      amp: 0, flung: 0, fade: -1, mine: 0, rep: 0, pull: 0, lv: null, lvAt: -9 };
    if (sp === 'g') o.col2 = (o.col + 1 + (Math.random() * 2 | 0)) % 3;
    if (sp === 'g' || sp === 'ph') o.amp = rnd(.5, 1.5); else o.trail = [];
    this.p.push(o); return o;
  },
  /** @param {string} k @returns {number} */
  /** @param {string} k */
  up(k) { const v = DET[k]; if (v == null) throw new Error(`нет свойства детектора ${k}`); return v; },
  hr() { return this.up('r'); },
  fr() { return this.hr() * this.up('fr'); }, // радиус захвата полем
  wr() { return Math.max(WORLD_R, refRadius() + 1); }, // мир — по кадру-эталону: отдалил зум — квантов и событий не больше
  nQ() { return Math.round(N_QUANTA * (this.wr() / WORLD_R) ** 2 * this.heat); }, // горячее разогрев — больше квантов
  /** @param {boolean} outside @returns {[number, number]} */
  randPos(outside) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, d = outside ? rnd(Math.min(viewRadius(), refRadius()) * .9, this.wr()) : Math.sqrt(Math.random()) * this.wr();
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if (Math.hypot(x - P.x, y - P.y) > this.hr() * 1.5) return [x, y];
    }
    return [P.x + this.wr() * .8, P.y];
  },
  // Возмущение вакуума: из точки разлетается пара фотонов (импульс сохраняется)
  /** @param {number} x @param {number} y @param {boolean} [fx] @param {number} [p0] */
  burst(x, y, fx, p0) {
    const a = Math.random() * TAU, p = p0 ?? this.phP(), made = [];
    for (const s of [0, Math.PI]) { const o = this.mk('ph', false, x, y, a + s, p); o.cd = .6; made.push(o); }
    if (fx) fxRing(x, y, .05, PH_C, .9, .6);
    return made;
  },
  // ---------- пролог: резонанс инфлатона ----------
  /** @returns {Inf} */
  mkInf() { return { A: INF.A0, th: -Math.PI / 2, H: 0, t: 0, idle: 0, go: false, hold: false, p0: [0, 0], pull: 0, flash: 0, snapFx: 0, snaps: 0, good: 0, late: 0, pick: null, zone: 0, made: PH_CLS.map(() => 0) }; },
  // Разогрев по шкале H (0…1): зона даёт имя и цвет, место внутри зоны — температуру k
  /** @param {number} H @returns {Heat} */
  profOf(H) {
    const i = H >= PROF[2].h ? 2 : H >= PROF[1].h ? 1 : 0, p = PROF[i], hi = i < 2 ? PROF[i + 1].h : 1;
    const k = lerp(p.k[0], p.k[1], clamp((H - p.h) / (hi - p.h), 0, 1));
    return { ...p, i, k, heat: k ** 1.5 };
  },
  infW() { return INF.w0 * (1 + INF.wk * this.inf.A); },
  /** @param {number} dt */
  tickInf(dt) {
    const I = this.inf;
    if (this.inVoid) { // шаг ноль: только предыстория; первое нажатие проявляет поле и становится первым толчком
      this.voidT += dt;
      if (!mouse.clicked || this.voidT < VOID_MIN) { mouse.clicked = false; return; }
      this.inVoid = false; this.banner = 0; I.th = Math.PI * .25; // шарик уже катится влево — нажатие сразу в такт
      fxRing(P.x, P.y, .2, [200, 215, 255], this.hr() * 3, 1.2); fxFlash(P.x, P.y, this.hr(), [200, 215, 255], .5); Sfx.play('segment');
      if (this.needSchool()) { mouse.clicked = false; this.startSchool(); return; } // впервые — сначала жесты, потом раскачка
    }
    if (this.school) return this.tickSchool(dt);
    I.flash = Math.max(0, I.flash - dt * 2.5); I.snapFx = Math.max(0, I.snapFx - dt);
    if (mouse.clicked) { mouse.clicked = false; I.go = true; I.hold = true; I.p0 = [mouse.x, mouse.y]; I.pull = 0; }
    if (I.hold) I.pull = clamp((mouse.x - I.p0[0]) / slingFullPx(), -1, 1); // резинка — по горизонтали (шарик ходит по чаше)
    if (I.hold && !mouse.down) { // отпустил: толчок в сторону, обратную резинке — по ходу шарика раскачал, против — погасил
      I.hold = false;
      const k = Math.abs(I.pull);
      if (k >= SLING_MIN) {
        const c = -Math.sign(I.pull) * -Math.sin(I.th), d = INF.kick * k ** SLING_POW * c;
        I.A = Math.max(.08, I.A + d); I.flash = Math.max(I.flash, .4);
        const late = c < -.2, good = c > .2;
        if (late) I.late++; else if (good) I.good++;
        Sfx.play('throw');
        if (late || I.good <= 2) this.float(P.x, P.y - this.hr() * 2.2, late ? 'против хода: раскачка гаснет' : good ? 'в такт ✓' : 'мимо такта: шарик на краю стоит', late ? [255, 140, 120] : good ? [140, 235, 170] : [215, 220, 235], 15);
      }
      I.pull = 0;
    }
    if (!I.go && (I.idle += dt) > INF.wait) I.go = true; // не трогает — поле распадается само, Вселенная выйдет холодной
    if (I.go) I.t += dt;
    const w = this.infW();
    I.A = Math.max(.08, I.A * (1 - INF.damp * dt));
    const th2 = I.th + w * dt;
    if (Math.floor((th2 - Math.PI / 2) / Math.PI) > Math.floor((I.th - Math.PI / 2) / Math.PI)) this.infBounce();
    I.th = th2;
    if (I.A > INF.crit) this.infSnap();
    Sfx.hum(I.hold ? .15 + .85 * Math.min(1, Math.abs(I.pull)) : 0);
    if (I.go && I.t >= INF.life) this.ignite(this.profOf(I.H));
  },
  // Чаша (в мире): полуширина, глубина до черты срыва, дно — под центром детектора
  infBowl() { const w = this.hr() * INF.R; return { w, d: w * INF.deep, bx: P.x, by: P.y + w * INF.low }; },
  // Проход дна: поле отдаёт часть размаха в свет — со дна разлетаются пары фотонов, тем жёстче, чем сильнее размах
  infBounce() {
    const I = this.inf, A = Math.min(1, I.A); I.flash = 1;
    if (!I.go) return; // пока не тронул — шарик только показывает ритм
    I.H = Math.min(1, I.H + INF.kap * A * A / 2); I.A -= INF.eta / 2 * I.A;
    const c0 = A < PH_HARD_A ? 0 : 1, n = A > .7 ? 2 : 1, B = this.infBowl(), R = this.hr() * .4;
    for (let k = 0; k < n; k++) {
      const c = Math.random() < .3 ? Math.max(0, c0 - 1) : c0, C = PH_CLS[c], hi = phHi(c);
      if (!I.made[c]) this.float(P.x, P.y - this.hr() * 3, `создан свет: ${C.n} γ`, C.c, 15); // новый класс — его будет рождать Вселенная
      I.made[c]++;
      const a = Math.random() * TAU, p = this.T * rnd(Math.max(.6, C.x + .2), hi - .2);
      for (const s of [0, Math.PI]) { const o = this.mk('ph', false, B.bx + Math.cos(a + s) * R, B.by + Math.sin(a + s) * R, a + s, p); o.cd = .6; }
    }
    const C = PH_CLS[c0]; this.kn += .5;
    fxRing(B.bx, B.by, R * .5, C.c, R + this.hr() * (.6 + A), .5); Sfx.play('pert', c0);
    const z = this.profOf(I.H).i;
    if (z > I.zone) { I.zone = z; const p = PROF[z]; Sfx.play('goal'); this.float(P.x, P.y - this.hr() * 2.2, `разогрев: ${p.n}${z === 2 ? '!' : ''}`, p.c, 16); }
  },
  // Срыв: размах дошёл до красной черты — поле дробится в мягкий свет, раскачку начинать заново
  infSnap() {
    const I = this.inf; I.A = INF.snapA; I.snaps++; I.snapFx = 2.5; I.hold = false; I.pull = 0;
    const B = this.infBowl(), x = B.bx + B.w * Math.sign(Math.cos(I.th) || 1), y = B.by - B.d; // шарик вылетел за край
    for (let k = 0; k < 3; k++) fxRing(x, y, this.hr() * (.3 + .3 * k), [255, 90, 80], this.hr() * (1.5 + .6 * k), .5 + .1 * k);
    fxFlash(x, y, this.hr(), [255, 80, 70], .4); Sfx.play('overheat');
    this.float(P.x, P.y - this.hr() * 2.2, 'срыв резонанса', [255, 120, 110], 15);
  },
  // Поле распалось — Вселенная разогрета до набранной температуры; света в ней до конца уровня ∝ T^1,5
  /** @param {Heat} [p] */
  ignite(p) {
    if (!p) p = this.profOf(.55);
    this.lit = true; this.litT = 0; this.banner = 0; this.inf.pick = p; this.inf.hold = false; Sfx.hum(0); Sfx.play('ignite'); // одно событие — заголовок эпохи 1
    this.heat = p.heat;
    // свет не беднее мягкого: не попал в такт ни разу — Вселенная всё равно светит хотя бы мягким (иначе мало ⚡ и ✦ на весь уровень)
    if (!this.inf.made.some(n => n > 0)) this.inf.made[0] = 1; // не раскачал вовсе — Вселенная светит мягким
    const T0 = this.T; this.T = this.T0 = T_START * p.k;
    if (T0 > 0) for (const o of this.p) if (!o.dead && !o.cap && this.isQ(o)) o.p *= this.T / T0;
    this.en = Math.max(this.en, E_START);
    fxRing(P.x, P.y, .5, PH_C, this.wr(), 2.5); fxFlash(P.x, P.y, this.hr() * 2, [255, 240, 200], .6);
    // разогрев — чистый скилл: очки за каждый процент шкалы и отдельный рекорд температуры
    if (this.inf.go && !this.cheated) {
      const T0 = Math.round(this.T0), pts = Math.round(this.inf.H * 100) * 10, was = this.heatBest;
      addScore(pts);
      const r = LB.add('heat', { n: LB.name(), s: T0, h: this.inf.H, t: null, d: Date.now() });
      Online.send('heat', T0).then(ok => { if (ok && this.heatWorld && T0 > this.heatWorld.score) this.float(P.x, P.y - this.hr() * 4, '🌍 мировой рекорд разогрева!', GOLD, 18); });
      this.heatRes = { T0, pts, place: r.place, n: r.list.length, rec: r.place === 0 && (!was || T0 > was.s) };
      this.float(P.x, P.y - this.hr() * 2.2, `разогрев ${T0} ГэВ · +${pts} очков`, p.c, 16);
      if (this.heatRes.rec && was) this.float(P.x, P.y - this.hr() * 3.2, `🏆 рекорд разогрева! было ${was.s} ГэВ`, GOLD, 17);
    }
  },
  // ---------- до частиц: школа жестов (пролог, инфляция) ----------
  // Частиц ещё нет — только поле. На его сгустках — жесты всей игры, по одной короткой сцене, без часов и очков:
  // вести круг · тап — посмотреть · держать у двух — свести (сила копится засечками) · разжать без удара.
  // Потом — раскачка поля (рогатка). Прошёл однажды — в следующих забегах школы нет (Known), Esc — пропустить.
  needSchool() { return !Known.has('gest:school'); },
  startSchool() {
    this.school = { i: 0, t: 0, idle: 0, n: 0, fl: [], press: false, hold: 0, at: 0, ang: 0, cap: null, lv: 0, done: 0, re: 0, miss: 0 };
    this.banner = 0; this.tk = {}; this.schoolSpawn(); document.body.classList.add('tut');
  },
  // сгустки сцены: «вести» — три вокруг, «посмотреть» — один светлый, «свести» и «разжать» — пара рядом
  schoolSpawn() {
    const S = /** @type {School} */ (this.school), a0 = Math.random() * TAU;
    const mk = (/** @type {number} */ a, /** @type {number} */ d, look = false) => ({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, vx: 0, vy: 0, ph: Math.random() * TAU, k: 0, look, cap: false, dead: false });
    S.fl = S.i === 0 ? [0, 1, 2].map(j => mk(a0 + j * TAU / 3, rnd(2.8, 3.6))) : S.i === 1 ? [mk(a0, 3, true)] : [mk(a0 - .3, 2.6), mk(a0 + .3, 2.6)];
    S.cap = null; S.press = false; S.lv = 0; S.n = 0; S.idle = 0;
  },
  /** @param {number} dt */
  tickSchool(dt) {
    const S = /** @type {School} */ (this.school), R = this.hr(), F = this.fr(), k = SCHOOL[S.i];
    S.t += dt; S.idle += dt;
    for (const b of S.fl) {
      b.k = Math.min(1, b.k + dt * 1.5); b.ph += dt;
      if (b.cap || b.dead) continue;
      b.vx = b.vx * Math.exp(-dt * .8) + randn() * .25 * Math.sqrt(dt); b.vy = b.vy * Math.exp(-dt * .8) + randn() * .25 * Math.sqrt(dt);
      const d = Math.hypot(b.x - P.x, b.y - P.y); if (d > 4.4) { b.vx += (P.x - b.x) / d * dt; b.vy += (P.y - b.y) / d * dt; } // не теряться: уехал — сгусток тянется следом
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    if (S.re > 0 && (S.re -= dt) <= 0) this.schoolSpawn(); // столкнул вместо отмены — новая пара
    if (S.done > 0) { mouse.clicked = false; S.press = false; if ((S.done -= dt) <= 0) this.schoolNext(); return; }
    if (k === 'move') {
      mouse.clicked = false; // здесь жест — только вести
      for (const b of S.fl) if (!b.dead && Math.hypot(b.x - P.x, b.y - P.y) < R * .9) {
        b.dead = true; S.n++; S.idle = 0; fxRing(b.x, b.y, .1, FL_C, R * .9, .4); Sfx.play('catch', Math.min(3, S.n)); this.float(b.x, b.y - .3, `${S.n}/${SCH_N}`, FL_C, 14);
      }
      if (S.n >= SCH_N) this.schoolOk();
      return;
    }
    if (mouse.clicked) { mouse.clicked = false; S.press = true; S.hold = 0; S.lv = 0; S.idle = 0; }
    if (S.press && mouse.down) {
      S.hold += dt; S.idle = 0;
      if (k !== 'look' && S.hold > .18 && !S.cap) {
        const near = S.fl.filter(b => !b.dead && Math.hypot(b.x - P.x, b.y - P.y) < F).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y));
        if (near.length >= 2) { S.cap = near.slice(0, 2); for (const b of S.cap) b.cap = true; S.at = S.hold; Sfx.play('grab'); }
      }
      if (S.cap) { // взял пару — сразу 1 ⚡, дальше ступень каждые LV_T с (как в игре); сгустки тянутся к кругу и кружат
        const nk = Math.min(LV_N, 1 + Math.floor((S.hold - S.at) / LV_T));
        if (nk > S.lv) { S.lv = nk; Sfx.play('pert', nk - 1); fxRing(P.x, P.y, R * .9, nk === LV_N ? GOLD : FIELD_C, R * 1.15, .3); }
        S.ang += dt * (2.2 + 1.6 * S.lv);
        S.cap.forEach((b, j) => {
          const a = S.ang + j * Math.PI, tx = P.x + Math.cos(a) * R * .42, ty = P.y + Math.sin(a) * R * .42, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), st = (3 + Math.hypot(P.vx, P.vy)) * dt;
          if (d > st) { b.x += dx / d * st; b.y += dy / d * st; } else { b.x = tx; b.y = ty; }
        });
      }
    }
    if (!S.press || mouse.down) return;
    S.press = false;
    if (k === 'look') {
      const b = S.fl.find(b => !b.dead && Math.hypot(b.x - P.x, b.y - P.y) < R * 1.15);
      if (b) { this.shotFx = .35; Sfx.play('snap'); fxRing(b.x, b.y, .1, [255, 255, 255], R, .45); this.float(b.x, b.y - .45, 'сгусток поля: энергия, ещё без частиц', [255, 255, 255], 14); this.schoolOk(); }
      else { this.shotFx = .15; S.miss++; this.float(P.x, P.y - R, 'пусто: навести круг на сгусток', [200, 200, 210], 13); }
      return;
    }
    if (!S.cap) { S.miss++; this.float(P.x, P.y - R, S.hold < .18 ? 'зажать и держать у двух сгустков' : 'поле не достало: подвести круг к обоим', [200, 205, 220], 13); return; }
    // отпустил — столкнулись: вспышка тем ярче, чем больше ступеней
    const [a, b] = S.cap, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2; a.dead = b.dead = true; S.cap = null;
    fxFlash(x, y, R, [215, 205, 255], .5); fxRing(x, y, .1, S.lv >= LV_N ? GOLD : FIELD_C, R * (1 + .4 * S.lv), .5); Sfx.play('pert', Math.min(3, S.lv));
    this.float(x, y - .4, `удар ${S.lv} ⚡ из ${LV_N}`, S.lv >= LV_N ? GOLD : [200, 230, 255], 15);
    if (k === 'join') this.schoolOk();
    else { S.miss++; S.re = 1; this.float(P.x, P.y - R - .6, 'столкнулись — а нужно разжать без удара', [255, 190, 150], 13); }
  },
  // отмена в школе: пара разлетается без удара; в сцене «разжать» — это и есть жест
  schoolDrop() {
    const S = this.school; if (!S || !S.cap) return false;
    for (const b of S.cap) { b.cap = false; const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy) || 1; b.vx = dx / d * 2.2; b.vy = dy / d * 2.2; }
    S.cap = null; S.press = false; mouse.down = false; Sfx.play('grab'); fxRing(P.x, P.y, this.hr() * .9, [200, 210, 230], this.hr() * .4, .3);
    if (SCHOOL[S.i] === 'drop') this.schoolOk(); else this.float(P.x, P.y - this.hr(), 'разжато без удара', [200, 210, 230], 13);
    return true;
  },
  schoolOk() { const S = /** @type {School} */ (this.school); S.done = 1.3; S.idle = 0; },
  schoolNext() {
    const S = /** @type {School} */ (this.school); S.i++; S.done = 0;
    if (S.i >= SCHOOL.length) this.endSchool(true); else this.schoolSpawn();
  },
  // школа кончилась (или пропущена — Esc, кнопка): дальше раскачка, как раньше; жесты запомнены — в новых забегах сразу раскачка
  /** @param {boolean} done */
  endSchool(done) {
    if (!this.school) return;
    this.school = null; this.tk = {}; this.banner = 0; mouse.down = false; mouse.clicked = false;
    Known.add('gest:school'); try { localStorage.setItem('proto.tut', '1'); } catch (e) { /* без хранилища */ }
    document.body.classList.remove('tut');
    this.inf.th = Math.PI * .25; this.inf.idle = 0;
    fxRing(P.x, P.y, .2, [200, 215, 255], this.hr() * 3, 1.2); Sfx.play('segment');
    if (!done) msg('Школа жестов пропущена. Кнопка «?» вернёт подсказки', 2.5);
  },
  /** @returns {Step[]} */
  schoolSteps() {
    const S = /** @type {School} */ (this.school), tc = isTouch(), d = (/** @type {number} */ k) => S.i > k || (S.i === k && S.done > 0);
    return [
      { t: 'Вести круг', h: `круг — это ты: он идёт за ${tc ? 'пальцем' : 'мышью'}. Провести его сквозь три сгустка поля`, p: [S.i > 0 ? SCH_N : S.n, SCH_N], s: 'круг слушается', d: d(0), np: true },
      { t: 'Посмотреть', h: `навести круг на светлый сгусток и ${tc ? 'коснуться ◉' : 'кликнуть'}: снимок. Так в игре узнают новое`, s: 'снимок: так узнают новое', d: d(1), np: true },
      { t: 'Свести два', h: `${tc ? 'держать ◉' : 'зажать'} у двух сгустков: поле тянет их и копит силу — засечки на кольце. Отпустить: столкнутся`, s: 'чем дольше держишь, тем сильнее удар', d: d(2), np: true },
      { t: 'Разжать без удара', h: tc ? 'держать ◉ у двух и, не отпуская, провести палец на ✕: передумал — сгустки разлетятся' : 'зажать у двух, затем правая кнопка или X: передумал — сгустки разлетятся', s: 'передумал — разжал', d: d(3), np: true },
    ];
  },
  /** @returns {[string | null, string]} строка у круга и значок жеста */
  schoolHint() {
    const S = /** @type {School} */ (this.school), k = SCHOOL[S.i], tc = isTouch();
    if (S.done > 0) return [null, ''];
    if (k === 'move') return [tc ? 'палец ведёт круг: провести сквозь сгустки' : 'круг идёт за мышью: провести сквозь сгустки', 'move'];
    if (k === 'look') return [tc ? 'навести круг на сгусток и тап ◉: посмотреть' : 'навести круг на сгусток и клик: посмотреть', 'click'];
    if (S.cap) return k === 'join' ? (S.lv < 2 ? ['держать: сила копится засечками', 'hold'] : ['отпустить: столкнутся', 'release'])
      : [tc ? 'не отпуская ◉ — провести палец на ✕' : 'не отпуская — правая кнопка или X', ''];
    return [tc ? 'держать ◉ у двух сгустков' : 'зажать у двух сгустков', 'holdrel'];
  },
  /** @param {number} alpha */
  drawSchool(alpha) {
    const S = /** @type {School} */ (this.school), z = cam.z, [px, py] = W2S(P.x, P.y), r0 = this.hr() * z;
    for (const b of S.fl) {
      if (b.dead) continue;
      const [x, y] = W2S(b.x, b.y), r = (.26 + .04 * Math.sin(b.ph * 3)) * z * (b.look ? 1.3 : 1), a = alpha * b.k, c = b.look ? [255, 240, 205] : FL_C;
      glow(x, y, r * 2.6, c, .22 * a); ring(x, y, r, c, .85 * a, 2); ring(x, y, r * (1.55 + .25 * Math.sin(b.ph * 2)), FL_C, .3 * a, 1.2);
      if (b.look) { const q = r + 8 + 2 * Math.sin(G.T * 6); for (let k = 0; k < 4; k++) { const an = Math.PI / 4 + k * Math.PI / 2; arc(x, y, q, an - .35, an + .35, [255, 255, 255], .9 * a, 2); } }
    }
    const k = SCHOOL[S.i];
    if (S.cap) { // поле держит пару: пунктир захвата, нити, засечки силы на кольце
      ring(px, py, this.fr() * z, FIELD_C, .35 * alpha, 1.5, [6, 6]);
      for (const b of S.cap) { const [x, y] = W2S(b.x, b.y); line(px, py, x, y, FIELD_C, .7 * alpha, 2); }
      for (let j = 0; j < LV_N; j++) {
        const a0 = -Math.PI / 2 + j * TAU / LV_N + .09, on = j < S.lv;
        arc(px, py, r0 * 1.3, a0, a0 + TAU / LV_N - .18, on ? (S.lv >= LV_N ? GOLD : FIELD_C) : [255, 255, 255], on ? .95 * alpha : .2 * alpha, 4);
      }
      label(`${S.lv} ⚡`, px, py - r0 * 1.3 - 14, 13, S.lv >= LV_N ? GOLD : [200, 230, 255], alpha, 800);
    } else if (k === 'join' || k === 'drop') ring(px, py, this.fr() * z, FIELD_C, .16 * alpha, 1, [4, 6]); // докуда достаёт поле
    this.drawSchoolCoach(alpha);
  },
  // постоял без дела — призрачный курсор показывает жест сцены
  /** @param {number} alpha */
  drawSchoolCoach(alpha) {
    const S = /** @type {School} */ (this.school); if (S.idle < SCH_IDLE || S.press || S.done > 0) return;
    const live = S.fl.filter(b => !b.dead).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); if (!live.length) return;
    const k = ((S.idle - SCH_IDLE) % 2.8) / 2.8, [px, py] = W2S(P.x, P.y), st = SCHOOL[S.i], two = st === 'join' || st === 'drop', tc = isTouch();
    let [tx, ty] = W2S(live[0].x, live[0].y);
    if (two && live[1]) { const [bx, by] = W2S(live[1].x, live[1].y); tx = (tx + bx) / 2; ty = (ty + by) / 2; }
    const go = smooth(0, .4, k), a = .6 * Math.min(1, k * 6) * (1 - smooth(.85, 1, k)) * alpha, x = lerp(px, tx, go), y = lerp(py, ty, go);
    const press = st === 'look' ? k > .45 && k < .56 : two && k > .45 && k < .82;
    const txt = st === 'move' ? (tc ? 'вести пальцем' : 'вести мышью') : st === 'look' ? (tc ? 'тап ◉' : 'клик')
      : k < .45 ? 'к двум сгусткам…' : st === 'join' ? (k < .82 ? 'зажать…' : '…отпустить') : k < .7 ? 'зажать…' : tc ? '…палец на ✕' : '…правая кнопка';
    ghostCursor(x, y, press, a);
    label(txt, x, y + 36, 12, [255, 255, 255], Math.min(1, a * 1.6), 700);
  },
  // главы эпохи 1: шаг из новой главы стал текущим — лента с названием и одной мыслью (игра идёт)
  chapOf() { const cur = this.steps().find(s => !s.d); return cur && cur.ch || this.chap; },
  tickChapter() {
    if (this.ep !== 0 || !this.lit || this.litT < 4 || this.epDone) return;
    const ch = this.chapOf(); if (ch <= this.chap) return;
    this.chap = ch; const C = CHAPTERS[ch]; if (!C) return;
    Cine.show(`<div class="ck">Глава ${ch}</div><div class="cn">${C.n}</div><div class="cp">${C.line}</div>`, 6.5, 0, true);
  },
  // лавка ✦ — с главы «Закон»: раньше знания копятся, а тратить их ещё не на что
  shopOk() { return this.ep > 0 || this.rs.ph > 0 || this.chap >= 4; },
  // Свет Вселенной — только классы, созданные в прологе, в долях √(сколько пар создано): редкое не тонет
  phP() {
    const w0 = this.inf.made.map(n => Math.sqrt(n)), s0 = w0.reduce((a, b) => a + b, 0);
    if (!s0) return this.thermalP(this.T);
    const w = w0.map(x => x || PH_TAIL * s0), sum = w.reduce((a, b) => a + b, 0); // не созданный класс — только хвостом
    let r = Math.random() * sum, c = 0; for (; c < PH_TOP; c++) if ((r -= w[c]) <= 0) break;
    return this.T * rnd(Math.max(.6, PH_CLS[c].x + .15), phHi(c) - .15);
  },
  madeCls() { return PH_CLS.map((_, c) => c).filter(c => this.inf.made[c] > 0); },
  // верх самого жёсткого созданного класса: жарче этого свет Вселенной не бывает (и в горячей области)
  phTop() { const L = this.madeCls(); if (!L.length) return Infinity; const c = L[L.length - 1]; return this.T * (phHi(c) - .15); },
  // свой свет измерен: каждый созданный класс пойман хоть раз
  measured() { return this.lit && this.madeCls().every(c => this.phSeen.has(c)); },
  /** @param {{ p: number }} o */
  phClass(o) { const x = o.p / Math.max(this.T, 1e-9); let c = 0; for (let i = 0; i < PH_CLS.length; i++) if (x >= PH_CLS[i].x) c = i; return c; },
  // что из квантов Вселенная сейчас рождает сама: свет — пока его закон не выключен; глюоны — открытые и не выключенные
  /** @returns {string[]} */
  qKinds() {
    const k = [];
    if (!Uni.off(this, 'ph')) k.push('ph');
    if ((this.ep === 3 || this.gOn) && !Uni.off(this, 'g')) k.push('g');
    return k;
  },
  // доля обычного запаса квантов, которую держит Вселенная при выключенных законах (свет и глюоны — поровну)
  qShare() { const k = this.qKinds(), all = this.ep === 3 || this.gOn ? 2 : 1; return k.length / all; },
  qCap() {
    const n = this.nQ(), k = this.qKinds();
    if (this.ep === 3) return k.includes('ph') ? Math.round(n * .45) : k.length ? G_MAX4 : 0;
    if (this.ep === 0 && !this.lit) return 0; // до разогрева (пустота, школа жестов, раскачка) света нет
    return Math.round((this.ep > 0 ? n : n * PH_DENS[this.rs.ph] * (this.rs.ph ? Math.min(1, .3 + this.autoT / 10) : 1)) * this.qShare());
  },
  /** @param {boolean} any @param {[number, number] | null} [hp] точка в области: квант оттуда @param {boolean} [hard] жёстче (горячая область)
   *  @param {string | null} [want] только этот вид (горячая область — свет, цветной вихрь — глюоны) @param {boolean} [fromZone] пополнение: из области своего вида */
  spawnQuantum(any, hp = null, hard = !!hp, want = null, fromZone = false) {
    // вакуум только что закипел: возмущения вспыхивают прямо в кадре, пары фотонов
    const K = this.qKinds(); if (!K.length) return; // оба закона выключены — Вселенная квантов не рождает
    if (!hp && this.ep === 0 && !this.gOn && this.autoT < 10) { const [bx, by] = this.randPos(false); this.burst(bx, by, true); return; }
    // пополнение держит фотоны и глюоны поровну: детектор ест фотоны на энергию, их не должно стать нечем ловить
    let ng = 0, nph = 0; for (const o of this.p) if (!o.dead) { if (o.sp === 'g') ng++; else if (o.sp === 'ph') nph++; }
    const gOk = K.includes('g') && (this.ep !== 3 || ng < G_MAX4);
    if (!K.includes('ph') && !gOk) return;
    if (want && !(want === 'g' ? gOk : K.includes('ph'))) return;
    const sp = want || (!K.includes('ph') ? 'g' : !gOk ? 'ph' : this.ep === 3 ? (Math.random() < .3 ? 'g' : 'ph') : (any ? Math.random() < .5 : ng < nph) ? 'g' : 'ph');
    if (fromZone && Math.random() < (sp === 'g' ? G_SRC : PH_SRC)) hp = sp === 'g' ? this.czPos() : this.hzPos(); // свет — чаще в горячих, глюоны — почти всегда в цветных вихрях
    const [x, y] = hp || this.randPos(!any);
    const o = this.mk(sp, false, x, y, Math.random() * TAU, 0);
    o.p = o.sp === 'ph' ? this.phP() : this.thermalP(this.T);
    if (hp && hard) o.p = o.sp === 'ph' ? Math.min(o.p * HZ_P, Math.max(o.p, this.phTop())) : o.p * HZ_P; // в горячей области — жёстче, но в пределах созданных классов
    if (o.sp === 'g' && this.ep === 3 && this.stock > 0 && Math.random() < .6) {
      const c = this.colCnt(), lo = c.indexOf(Math.min(...c)), hi = c.indexOf(Math.max(...c));
      if (lo !== hi) { o.col = lo; o.col2 = hi; }
    }
    if (any) o.born = 1;

  },
  // пара частица + античастица разлетается из одной точки
  // col — цвет кварка, colB — антицвет антикварка (из глюона цвет и антицвет переходят в пару)
  /** @param {string} sp @param {number} x @param {number} y @param {number} pEach @param {number} [col] @param {number} [colB] @returns {Q[]} */
  pair(sp, x, y, pEach, col, colB) {
    const a = Math.random() * TAU, c = col ?? (Math.random() * 3 | 0);
    const A = this.mk(sp, false, x, y, a, pEach, c), B = this.mk(sp, true, x, y, a + Math.PI, pEach, colB ?? c);
    A.cd = B.cd = .4; return [A, B];
  },
  /** @param {Q} o */
  meff(o) { return SM[o.sp].m * this.hig; },
  // Масса для порога рождения пары: тепловая (≈ g·T) до перехода Хиггса, масса покоя — после
  /** @param {string} sp */
  mThr(sp) { const s = SM[sp], k = sp === 't' ? TH_M.t : TH_M[s.kind] || 0; return Math.hypot(s.m * this.hig, k * this.T * (1 - this.hig)); },
  /** @param {Q} o */
  speed(o) { if (o.v != null) return o.v; const m = this.meff(o); return m <= 0 ? C_LIGHT : C_LIGHT * o.p / Math.sqrt(o.p * o.p + m * m); },
  /** @param {Q} o */
  isQ(o) { return o.sp === 'ph' || o.sp === 'g'; },
  // квантов в мире уже с запасом — области молчат
  qFull() { let n = 0; for (const o of this.p) if (!o.dead && !(o.fade >= 0) && this.isQ(o)) n++; return n >= this.qCap() * Q_FULL; },
  // Тяжесть в руке 0…1: растёт с массой (по логарифму — масса частиц различается в 10⁵ раз) и с полем Хиггса
  /** @param {Q} o */
  heavy(o) { const m = this.meff(o); return m <= 0 ? 0 : clamp(Math.log10(1 + m / .001) / 5.3, 0, 1); },
  // Что держит поле: кванты — всегда; вещество (кварки и заряженные лептоны) — только когда у него есть масса
  /** @param {Q} o */
  grabbable(o) { const k = SM[o.sp].kind; return this.isQ(o) || (this.hig >= .5 && (k === 'quark' || k === 'lepton')); },
  /** @param {Q} a @param {Q} b */
  antiPair(a, b) { return a.sp === b.sp && a.anti !== b.anti && !this.isQ(a); },
  // Груз поля: чем тяжелее захваченное, тем медленнее детектор
  load() { return this.focus ? this.focus.cap.reduce((s, o) => s + this.heavy(o), 0) : 0; },
  /** @param {Q} o */
  inHand(o) { return Math.hypot(o.x - P.x, o.y - P.y) < this.hr(); },
  enOn() { return this.lit && Codex.has('ph'); },
  fieldOn() { return this.ep > 0 || this.measured(); }, // сталкивать — когда свой свет измерен
  // Пул энергии собран — во Вселенной появляются глюоны
  unlockGluons() {
    this.gOn = true;
    for (let k = 0; k < 8; k++) { const [x, y] = this.randPos(false); this.mk('g', false, x, y, Math.random() * TAU, this.thermalP(this.T)); }
    fxRing(P.x, P.y, this.hr(), [255, 120, 160], this.wr(), 1.6);
  },
  // После первого столкновения игрока кванты изредка сталкиваются и сами — при случайной встрече
  /** @param {number} dt */
  spontaneous(dt) {
    if (!this.rs.coll || Uni.off(this, 'coll') || this.ep === 3) return; // только после закона «Столкновения» (приходит с первым законом вещества)
    if ((this.spCd -= dt) > 0) return; // равномерно по миру: горячая область не зовёт столкновения к себе
    const q = this.p.filter(o => !o.dead && this.isQ(o) && !o.cap && !(o.flung > 0) && o.born >= 1 && o.cd <= 0 && !(o.fade >= 0));
    for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
      const a = q[i], b = q[j], d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      if (d2 > .25) continue;
      if (d2 > .12) continue;
      a.cd = b.cd = 1;
      if (Math.random() < .6 && this.collide(a, b, true)) { this.spCd = 1.5; return; }
    }
  },
  canShot() { return this.shotCd <= 0 && (!this.enOn() || this.en >= E_SHOT); },
  noEnergy() { this.enFx = .6; this.st.dry++; Sfx.play('fizzle'); },
  // Детектор поглощает знакомый фотон, пролетевший через его центр
  // Пойманный фотон измерен: класс по энергии; ⚡ — по классу; новый класс и редкие дают ✦
  /** @param {Q} o */
  absorb(o) {
    const c = this.phClass(o), C = PH_CLS[c];
    o.dead = true; this.en = Math.min(E_CAP, this.en + C.e); if (!this.learn.absorb) this.acted(); this.learn.absorb = true; // фотоны залетают и сами
    this.caught[c]++; this.caughtFx = c; this.caughtAt = G.T;
    fxRing(o.x, o.y, .05, C.c, .5 + .3 * c, .35 + .1 * c); Sfx.play('catch', c);
    if (!this.measure(c)) { this.kn += C.kn; if (c >= 1) {
      this.float(P.x, P.y - this.hr() - .2, `${C.r}! ${C.n} γ · +${C.kn} ✦`, [255, 215, 110], 15);
    } else Fly.atW(P.x, P.y, C.kn); } // обычный свет — без надписи «+1 ✦ +1 ⚡»: искра к ✦, ⚡ видна на батарее
    if (c === PH_TOP) fxFlash(P.x, P.y, this.hr() * 1.5, C.c, .4);
  },
  // Измерен фотон класса c: новый класс — событие и ✦. Возвращает true, если класс новый.
  /** @param {number} c */
  measure(c) {
    if (this.phSeen.has(c)) return false;
    const C = PH_CLS[c];
    this.phSeen.add(c); this.kn += C.k; Sfx.play('fresh');
    fxRing(P.x, P.y, this.hr(), C.c, this.hr() * 1.6, .8);
    this.float(P.x, P.y - this.hr() - .2, `НОВЫЙ КЛАСС: ${C.n} γ · ${C.r} · +${C.k} ✦`, c >= 1 ? [255, 215, 110] : C.c, c >= 1 ? 17 : 15);
    return true;
  },
  // Больцмановский вес: сколько частиц этого сорта держит Вселенная при температуре T
  /** @param {string} sp */
  weight(sp) { const m = SM[sp].m * this.hig; return m <= 0 ? 1 : Math.exp(-m / this.T); },

  // ---------- действие игрока: поле ----------
  // Ввод: нажатие — снимок; удержание — поле (эпохи 1–3: захват квантов, эпоха 4: щит)
  /** @param {number} dt */
  input(dt) {
    if (!this.lit && this.ep === 0) return this.tickInf(dt);
    // короткое нажатие — снимок (на отпускании); удержание — поле, без снимка
    if (mouse.clicked) { mouse.clicked = false; this.holding = true; this.hold = 0; }
    if (this.holding && !mouse.down) {
      // тап: отпустил быстро и поле не успело взять пару — снимок (тап пальцем по ◉ длится 0,1–0,3 с: раньше он часто становился полем)
      this.holding = false; const f = this.focus, tap = !f || (f.cap.length < 2 && this.hold < TAP_MAX);
      // зажал, но не поймал пару — жест ещё не освоен: сразу показать, как надо (подсказка и курсор-подсказка)
      if (f && !tap && this.ep !== 3 && !this.learn.smash && f.cap.filter(o => !o.dead).length < 2) { this.missT = this.t; this.coach.idle = COACH_IDLE; this.coach.kind = null; }
      this.release(); if (tap) this.snapshot();
      if (this.ep === 3 && f && f.t > .25 && this.shield > .08 && !this.advanced) this.shieldPulse();
    }
    if (this.holding) { this.hold += dt; if (this.hold > .18 && !this.focus && this.fieldOn()) this.focus = { cap: [], q: 0, E: 0, lv: 0, ang: Math.random() * TAU, t: 0 }; }
  },
  Emax() { return 2 * this.T * this.up('pow'); },
  // Энергия столкновения растёт, пока держишь поле: от почти нуля до 2·T·сила
  /** @param {number} q */
  // f — держимое: у пары частица + античастица шкала своя — резонанс Z приходится на её середину (BAND_AT)
  /** @param {number} q @param {Focus | null} [f] */
  chargeE(q, f) { return this.eTop(f) * (.02 + .98 * q); },
  /** @param {number} E @param {Focus | null} [f] */
  qOf(E, f) { return (E / this.eTop(f) - .02) / .98; },
  // верх шкалы заряда: у квантов — Emax; у тяжёлой пары с резонансом — так, чтобы середина полосы Z была на BAND_AT
  /** @param {Focus | null} [f] */
  eTop(f) {
    const bd = f && f.cap.length === 2 && !this.isQ(f.cap[0]) ? this.band(f) : null;
    return bd ? Math.min(this.Emax(), (bd[0] + bd[1]) / 2 / (.02 + .98 * BAND_AT)) : this.Emax();
  },
  /** @param {number} k */
  lvE(k) { return this.Emax() * k / LV_N; }, // √s удара на ступени k
  /** @param {number} rs */
  lvOf(rs) { return clamp(Math.floor(rs * LV_N / this.Emax() + 1e-6), 0, LV_N); }, // ступень случайной встречи
  // Клетки матрицы на ступени k (по порядку предпочтения)
  /** @param {string} kinds @param {number} k @returns {Cell[]} */
  cellsAt(kinds, k) {
    const sp = (MATRIX[kinds] || [])[k - 1];
    if (!sp) return [];
    if (sp === 'jets') return [{ c: 'WW' }, { c: 'u', glu: true }]; // до Хиггса W⁺W⁻ закрыт — три струи
    if (sp === 'tg') return [{ c: 't', glu: true }];
    return [{ c: sp }];
  },
  // Почему клетка не рождается ('' — рождается): поколение закрыто, удару (√s) не хватает на массу, Вселенная ещё не умеет.
  // Энергия удара — не запас ⚡: её верх 2·T·сила, и Вселенная остывает — после Хиггса тяжёлое (t, W, H) уже не родить
  /** @param {Cell} x @param {number} rs @param {boolean} [spont] */
  cellWhy(x, rs, spont) {
    const c = x.c;
    if (c === 'WW' || c === 'H') {
      if (this.hig <= .5) return 'после Хиггса';
      const need = (c === 'WW' ? 2 * SM.W.m : SM.H.m) * this.hig;
      if (rs < need) return this.coldWhy(need);
      return spont && !Codex.auto.has(c === 'WW' ? 'W' : 'H') ? 'auto' : '';
    }
    if (!genOpen(c)) return `сначала ${genNeed(c).map(sp => SM[sp].sym).join(' и ')}`;
    if (rs < 2 * this.mThr(c)) return this.coldWhy(2 * this.mThr(c));
    return spont && !Codex.auto.has(c) ? 'auto' : '';
  },
  // удару не хватает на массу: если и в полную силу не хватит — Вселенная остыла; иначе — бить сильнее
  /** @param {number} need */
  // словами и ⚡, без ГэВ: игрок не знает заранее, какую энергию набрал (просьба игрока, пересмотр второго ревью №15)
  coldWhy(need) { if (need > this.Emax()) return 'остыло: на неё удара уже не хватит'; let k = 1; while (k < LV_N && this.lvE(k) < need) k++; return `нужен удар сильнее: ${k}⚡`; },
  // Что родит удар: клетка ступени k, а если она закрыта — ближайшая ниже по строке
  /** @param {string} kinds @param {number} k @param {number} rs @param {boolean} [spont] @returns {Hit} */
  pickCell(kinds, k, rs, spont) {
    let why = '';
    for (let j = k; j >= 1; j--) for (const x of this.cellsAt(kinds, j)) {
      const w = this.cellWhy(x, rs, spont);
      if (!w) return { ...x, k: j, why };
      if (!why) why = `${SM[x.c === 'WW' ? 'W' : x.c] ? (x.c === 'WW' ? 'W' : SM[x.c].sym) : x.c}: ${w}`;
    }
    return { c: null, k: 0, why };
  },
  // клетку не показываем вовсе: её не открыть, пока не создано то, что ей предшествует (поколение закрыто)
  /** @param {string} why */
  cellHidden(why) { return why.startsWith('сначала'); },
  // клетку уже создавали (открыта в кодексе) — показываем символом, иначе «?»
  /** @param {Cell} x */
  cellKnown(x) { return Codex.has(x.c === 'WW' ? 'W' : x.c); },
  /** @param {Cell | null | undefined} x */
  cellSym(x) { return !x ? 'слабо' : (x.c === 'WW' ? 'W⁺W⁻' : SM[x.c].sym) + (x.glu ? ' + g' : ''); },
  // Кого поле возьмёт следующим: ближайший к центру детектора в радиусе захвата (f — поле, null — ещё не зажал)
  /** @param {Focus | null} f @returns {Q | null} */
  pickNext(f) {
    const f0 = f && f.cap[0], R = this.fr(), cand = f && f.cand;
    /** @type {Q | null} */
    let best = null, bd = R, cd = Infinity;
    for (const o of this.p) {
      if (o.dead || o.cap || !this.grabbable(o) || o.born < .5 || o.fade >= 0 || o.flung > 0) continue;
      // к кванту — только квант; к частице — только её античастица
      if (f0 && (this.isQ(f0) ? !this.isQ(o) : !this.antiPair(f0, o))) continue;
      const d = Math.hypot(o.x - P.x, o.y - P.y), sc = d;
      if (o === cand) cd = sc;
      if (d < R && sc < bd) { bd = sc; best = o; }
    }
    return cand && cd < R && best !== cand && bd > cd * PICK_HYS ? cand : best;
  },
  /** @param {number} dt */
  tickFocus(dt) {
    const f = this.focus; if (this.lit || this.ep) Sfx.hum(f && f.cap.length && this.ep !== 3 ? .1 + .9 * f.q : 0); if (!f || this.ep === 3) return;
    f.t += dt;
    f.cap = f.cap.filter(o => !o.dead);
    if (f.cap.length < 2) {
      const best = this.pickNext(f);
      if (best !== f.cand) { f.cand = best; f.candT = 0; } else f.candT = (f.candT || 0) + dt;
      // первый — сразу (нажатие уже было выбором: подсвечен до нажатия), второй — после короткой подсветки
      // к частице — только её античастица: выбирать там не из чего, подсветка не нужна
      if (best && (!f.cap.length || !this.isQ(f.cap[0]) || f.candT >= PICK_T)) {
        best.cap = true; best.v = undefined; best.p0 = best.p; f.cap.push(best); f.cand = null; Sfx.play('grab'); if (!this.isQ(best)) { this.learn.heavy = true; if (best.trail) best.trail = []; }
      }
    }
    const two = f.cap.length === 2;
    if (two && this.isQ(f.cap[0])) { // пара квантов: ступени удара, каждая — 1 ⚡
      // лестница 1–4 без нуля: взял пару — сразу ступень 1 (1 ⚡), «слабого удара» нет (он только без ⚡)
      let q = Math.min(1, Math.max(f.q, 1 / LV_N) + dt * (1 + .6 * this.hzAt(P.x, P.y)) / (LV_N * LV_T)); const lv = f.lv || 0, nk = Math.min(LV_N, Math.floor(q * LV_N + 1e-9));
      if (nk > lv) {
        if (this.enOn() && this.en < 1) { q = Math.min(q, (lv + 1) / LV_N - 1e-4); if (!f.dry) { f.dry = true; this.noEnergy(); } }
        else { if (this.enOn()) { this.en -= 1; f.spent = (f.spent || 0) + 1; } f.lv = nk; Sfx.play('pert', nk - 1); fxRing(P.x, P.y, this.hr() * .9, nk === LV_N ? GOLD : FIELD_C, this.hr() * 1.15, .3); }
      }
      f.q = q; f.E = this.chargeE(f.q);
    } else if (two) { // вещество разгоняется, только когда пара в поле
      const bd = this.band(f), inB = bd && f.E > bd[0] && f.E < bd[1];
      let dq = Math.min(dt / CHARGE_T * (inB ? .3 : 1), 1 - f.q); // на резонансе стрелка замедляется — успей отпустить
      if (this.enOn()) { dq = Math.min(dq, this.en / E_FIELD); this.en -= dq * E_FIELD; f.spent = (f.spent || 0) + dq * E_FIELD; if (dq <= 0 && f.q < 1 && !f.dry) { f.dry = true; this.noEnergy(); } }
      f.q += dq; f.E = this.chargeE(f.q, f);
    }
    if (two) { f.t2 = (f.t2 || 0) + dt; if (f.t2 > .4) this.learn.hold = true; if (!this.isQ(f.cap[0])) this.learn.pair2 = true; }
    f.ang += dt * (2.2 + 7 * f.q);
    // захваченные кванты тянутся к детектору (и за ним), затем кружат друг напротив друга;
    // на разгоне отстают назад, как камень в рогатке
    const ro = this.hr() * .42, pv = Math.hypot(P.vx, P.vy), lag = Math.min(.6, pv * .05) / (pv || 1);
    f.cap.forEach((o, k) => {
      const a = f.ang + k * Math.PI, tx = P.x + Math.cos(a) * ro - P.vx * lag, ty = P.y + Math.sin(a) * ro - P.vy * lag;
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), step = (C_LIGHT * 2.5 + pv) * dt / (1 + 3 * this.heavy(o)); // тяжёлое тянется медленно
      if (d > step) { o.x += dx / d * step; o.y += dy / d * step; o.dx = dx / d; o.dy = dy / d; }
      else { o.x = tx; o.y = ty; o.dx = -Math.sin(a); o.dy = Math.cos(a); }
      o.p = two ? f.E / 2 : o.p0 ?? o.p; // один в поле — своя энергия: заряжает только пара
    });
  },
  thrownReady() { return Math.hypot(P.vx, P.vy) > THROW_V; },
  // Резонанс, на котором стоит отпустить: частица + античастица — Z (H — у g + g на 4 ⚡)
  /** @param {Focus} f @returns {[number, number] | null} */
  band(f) {
    if (this.hig <= .5 || f.cap.length < 2) return null;
    const [a, b] = f.cap;
    if (this.antiPair(a, b)) { const m = this.meff(a), E = (/** @type {number} */ rs) => 2 * Math.sqrt(Math.max(0, (rs / 2) ** 2 - m * m)); return SM.Z.m - Z_WIN > 2 * m ? [E(SM.Z.m - Z_WIN), E(SM.Z.m + Z_WIN)] : null; }
    return null;
  },
  // Разжать без удара (правая кнопка, X, на сенсоре — провести палец с ◉ на ✕): взятое разлетается от детектора, ничего не сталкивается;
  // ⚡, потраченная на это зажатие, возвращается. Возвращает true, если было что разжимать.
  drop() {
    if (this.school) return this.schoolDrop();
    const f = this.focus; if (!f || !this.holding || this.ep === 3) return false;
    this.focus = null; this.holding = false;
    const c = f.cap.filter(o => !o.dead);
    if (this.enOn() && f.spent) this.en = Math.min(E_CAP, this.en + f.spent);
    for (const o of c) {
      const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy) || 1;
      o.cap = false; o.dx = dx / d; o.dy = dy / d; o.p = o.p0 ?? o.p; o.mate = null; o.thrown = false; o.sib = null;
      o.flung = .6; o.v = C_LIGHT * 1.2 / (1 + this.heavy(o)); o.cd = .8; // отлетают, не сталкиваясь и не поглощаясь детектором
    }
    if (c.length) { fxRing(P.x, P.y, this.hr() * .9, [200, 210, 230], this.hr() * .4, .3); Sfx.play('grab'); this.learn.drop = true; }
    return true;
  },
  // X с клавиатуры — то же, что правая кнопка
  detach() { this.drop(); },
  canDrop() { return this.school ? !!this.school.cap : !!(this.focus && this.holding && this.ep !== 3 && this.focus.cap.length); },
  // Отпустил — захваченные летят навстречу друг другу и сталкиваются лоб в лоб (√s = E)
  release() {
    const f = this.focus; this.focus = null; if (!f) return;
    const c = f.cap.filter(o => !o.dead); c.forEach(o => { o.cap = false; });
    if (!c.length || this.ep === 3) return;
    if (this.isQ(c[0])) { f.E = f.lv ? this.lvE(f.lv) : this.chargeE(0); for (const o of c) { o.lv = f.lv || 0; o.lvAt = this.t; } if (f.lv >= 2) this.learn.lv = true; }
    // Рогатка: отпустил на разгоне — кванты летят вперёд и бьют всё, что встретят
    if (this.thrownReady()) {
      const base = Math.atan2(P.vy, P.vx);
      c.forEach((o, k) => {
        const an = base + (c.length > 1 ? (k ? .1 : -.1) : 0);
        o.dx = Math.cos(an); o.dy = Math.sin(an); o.p = c.length > 1 ? f.E / 2 : o.p0 ?? o.p; o.flung = 2.2; o.v = C_LIGHT * 2.4 / (1 + this.heavy(o));
        o.thrown = true; o.sib = c[1 - k] || null; o.mate = null;
      });
      fxRing(P.x, P.y, this.hr() * .4, GOLD, this.hr() * .9, .35); Sfx.play('throw');
      if (c.length < 2 && this.isQ(c[0])) this.float(P.x, P.y - this.hr() - .3, 'один квант не зарядить: нужны два', [200, 205, 220], 13);
      this.learn.throw = true;
      return;
    }
    if (c.length < 2) return;
    const [a, b] = c, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    for (const o of c) {
      const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1;
      o.dx = dx / d; o.dy = dy / d; o.p = f.E / 2; o.flung = .7 * (1 + this.heavy(o)); o.v = C_LIGHT * 1.6 / (1 + this.heavy(o));
    }
    a.mate = b; b.mate = a;
    this.learn.smash = true; this.acted();
    if (Math.hypot(a.x - b.x, a.y - b.y) < HIT_R) this.smash(a, b);
  },
  // Столкновение по воле игрока: кванты — рождают пары, частица + античастица — аннигилируют
  /** @param {Q} a @param {Q} b */
  smash(a, b) {
    if (this.isQ(a) && this.isQ(b)) return this.collide(a, b);
    a.mate = b.mate = null; a.thrown = b.thrown = false; a.flung = b.flung = 0; a.v = b.v = undefined;
    if (!this.antiPair(a, b)) return false;
    this.annihilate(a, b); this.pairs++; this.st.pairs++; this.learn.ann = true;
    return true;
  },
  // Эпоха 4: щит. Тянет кварки вещества к детектору, отталкивает антикварки. Заряд щита ограничен.
  /** @param {number} dt */
  tickShield(dt) {
    const f = this.focus, on = !!f && this.ep === 3 && this.shield > 0;
    this.shield = on ? Math.max(0, this.shield - dt / 4) : Math.min(1, this.shield + dt / 5);
    if (!f || !on) return;
    if ((f.t += dt) > 1) this.learn.shield = true;
    const R = this.fr();
    for (const o of this.p) {
      if (o.dead) continue;
      const dx = P.x - o.x, dy = P.y - o.y, d = Math.hypot(dx, dy);
      if (d > R * 1.3 || d < 1e-3) continue;
      if (o.sp === 'g') { if (this.helpGlu(o)) { o.dx = dx / d; o.dy = dy / d; o.v = 2.2; o.pull = .15; } continue; } // полезный глюон — внутрь, перекрасить
      if (SM[o.sp].kind !== 'quark' || d > R) continue;
      if (!o.anti) { o.dx = dx / d; o.dy = dy / d; o.v = 1.3; o.pull = .15; }
      else { o.dx = -dx / d; o.dy = -dy / d; o.v = 2; o.rep = 1.2; }
    }
  },

  // ---------- физика событий ----------
  /** @param {Q} a @param {Q} b */
  sqrtS(a, b) {
    if (this.isQ(a) && this.isQ(b)) { const cos = a.dx * b.dx + a.dy * b.dy; return Math.sqrt(Math.max(0, 2 * a.p * b.p * (1 - cos))); }
    const ma = this.meff(a), mb = this.meff(b), Ea = Math.hypot(a.p, ma), Eb = Math.hypot(b.p, mb);
    const px = a.dx * a.p + b.dx * b.p, py = a.dy * a.p + b.dy * b.p;
    return Math.sqrt(Math.max(0, (Ea + Eb) ** 2 - px * px - py * py));
  },
  // Столкновение двух квантов — по матрице (MATRIX): пара × ступень удара. spont — столкнула сама Вселенная:
  // ступень по √s встречи, рождает только исследованное «X сам» (руками — всё, что открыто).
  /** @param {Q} a @param {Q} b @param {boolean} [spont] */
  collide(a, b, spont) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const lvOf = (/** @type {Q} */ o) => o.lv != null && this.t - o.lvAt < 3 ? o.lv : null, k = lvOf(a) ?? lvOf(b) ?? this.lvOf(rs);
    a.lv = b.lv = null;
    a.cd = b.cd = .5; a.mate = b.mate = null; a.thrown = b.thrown = false;
    const kinds = [a.sp, b.sp].sort().join(''), r = k > 0 ? this.pickCell(kinds, k, rs, spont) : { c: null, k: 0, why: 'слабый удар' };
    if (!r.c) {
      // энергии мало (или Вселенной нечего рождать — не исследовано): кванты разлетаются
      const t = a.dx; a.dx = b.dx; b.dx = t; const u = a.dy; a.dy = b.dy; b.dy = u;
      a.flung = b.flung = 0; a.v = b.v = undefined;
      if (spont && k > 0 && this.pickCell(kinds, k, rs, false).c && onScreen(...W2S(x, y), 0)) fxRing(x, y, .05, [255, 240, 200], .35, .3); // искра: могло бы родить, но не исследовано
      if (!spont) { fxRing(x, y, .1, [255, 160, 140], .6, .4); this.float(x, y, r.why || 'слабый удар', [255, 160, 140], 12); Sfx.play('fizzle'); this.tried([]); }
      return;
    }
    const c = r.c;
    if (!spont && r.k < k) this.float(x, y - .45, `${k} ⚡ → ${r.k} ⚡ · ${r.why}`, [255, 190, 140], 12); // клетка закрыта — родилось то, что ниже
    a.dead = b.dead = true;
    /** @type {Q[]} */
    let made;
    if (c === 'H') { made = [this.mk('H', false, x, y, Math.random() * TAU, rs * .05)]; }
    else if (c === 'WW') { const pe = Math.sqrt(Math.max(.01, (rs / 2) ** 2 - SM.W.m ** 2)); made = this.pair('W', x, y, pe); }
    else { const m = this.mThr(c), pe = Math.sqrt(Math.max(.0001, (rs / 2) ** 2 - m * m)); const gl = [a, b].filter(o => o.sp === 'g'); made = this.pair(c, x, y, pe, gl.length ? gl[0].col : undefined, gl.length ? gl[gl.length - 1].col2 : undefined); }
    // три струи: кварк излучает глюон (клетки 4 ⚡)
    if (r.glu && (!spont || Codex.auto.has('g'))) {
      const g = this.mk('g', false, x, y, Math.random() * TAU, rs * .2); g.cd = .6; made.push(g);
      if (!Codex.has('g')) this.float(x, y - .5, 'третья струя: глюон', [255, 150, 190], 14);
    }
    fxFlash(x, y, .7, [255, 250, 220], .35);
    for (let i = 0; i < 8; i++) { const an = i * TAU / 8; fxRing(x + Math.cos(an) * .25, y + Math.sin(an) * .25, .02, [255, 240, 200], .06, .35); }
    if (!spont) { this.pairs++; this.st.pairs++; for (const o of made) o.mine = 5; this.tried(made); this.spotNew(made); } // твоё — несколько секунд на виду
    Sfx.play(spont ? 'pop' : 'collide');
    this.event(made, x, y, undefined, this.rx([a, b], made, r.k));
    return true;
  },
  // Аннигиляция частицы и своей античастицы → кванты (или Z на резонансе)
  // spont — встретились сами: Z — только если исследован «Z сам»
  /** @param {Q} a @param {Q} b @param {boolean} [spont] @returns {Q[]} */
  annihilate(a, b, spont) {
    const rs = this.sqrtS(a, b), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    a.dead = b.dead = true;
    /** @type {Q[]} */
    let made;
    if (this.hig > .5 && Math.abs(rs - SM.Z.m) < Z_WIN && (!spont || Codex.auto.has('Z')) && SM[a.sp].kind !== 'nu') { made = [this.mk('Z', false, x, y, Math.random() * TAU, rs * .05)]; fxRing(x, y, .2, BOS_C.Z, 1.6, .7); }
    else {
      const q = SM[a.sp].kind === 'quark' && (Codex.has('g') || !spont) ? 'g' : 'ph', an = Math.random() * TAU;
      made = [this.mk(q, false, x, y, an, rs / 2), this.mk(q, false, x, y, an + Math.PI, rs / 2)];
      for (const m of made) m.cd = .5;
    }
    fxFlash(x, y, .9, [255, 255, 255], spont ? .25 : .4); if (!spont || onScreen(...W2S(x, y), 0)) Sfx.play('annih');
    this.event(made, x, y, undefined, this.rx([a, b], made, 0));
    return made;
  },
  // Эпохи 1–3: частица и её античастица, сблизившись, аннигилируют сами (не в поле и не брошенные).
  // Только сходящиеся: только что рождённая пара разлетается и друг друга не трогает; вернуть их друг к другу
  // может магнитное поле камеры (заряды закручиваются в разные стороны) или край мира.
  annihilateMet() {
    const f = this.p.filter(o => !o.dead && !this.isQ(o) && !o.cap && !(o.flung > 0) && o.cd <= 0 && o.born > .5 && SM[o.sp].kind !== 'nu' && SM[o.sp].kind !== 'boson');
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.dead || b.dead || a.sp !== b.sp || a.anti === b.anti) continue;
      const dx = b.x - a.x, dy = b.y - a.y; if (dx * dx + dy * dy > .16) continue;
      const va = this.speed(a), vb = this.speed(b);
      if (dx * (a.dx * va - b.dx * vb) + dy * (a.dy * va - b.dy * vb) <= 0) continue; // расходятся
      const made = this.annihilate(a, b, true); this.st.ann = (this.st.ann || 0) + 1;
      if (a.sp === 'e' && Codex.auto.has('e') && made[0].sp === 'ph') this.eFlash((a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  },
  // «Генерация e» исследовано: e⁻ и e⁺ (разноимённые заряды) поворачивают друг к другу — встретятся и погаснут в γγ.
  // Свежие твои и брошенные не трогаем: их ведёшь ты.
  /** @param {number} dt */
  attractE(dt) {
    if (!Codex.auto.has('e') || this.ep === 3) return;
    const f = this.p.filter(o => o.sp === 'e' && !o.dead && !o.cap && !(o.flung > 0) && !(o.fade >= 0) && !(o.mine > 0) && o.born >= 1 && o.cd <= 0);
    for (const a of f) {
      /** @type {Q | null} */
      let best = null, bd = E_PULL * E_PULL;
      for (const b of f) if (b.anti !== a.anti) { const d = (b.x - a.x) ** 2 + (b.y - a.y) ** 2; if (d < bd) { bd = d; best = b; } }
      if (!best) continue;
      const ca = Math.atan2(a.dy, a.dx), dA = Math.atan2(best.y - a.y, best.x - a.x) - ca;
      const na = ca + clamp(Math.atan2(Math.sin(dA), Math.cos(dA)), -3 * dt, 3 * dt);
      a.dx = Math.cos(na); a.dy = Math.sin(na);
    }
  },
  // вспышка e⁺e⁻ → γγ: +1 ✦ и +1 ⚡ — где бы ни случилась (не только на экране: зум и сдвиг не меняют доход); без надписи — искра к ✦
  /** @param {number} x @param {number} y */
  eFlash(x, y) {
    const en = this.enOn(); if (en) this.en = Math.min(E_CAP, this.en + 1);
    Uni.pay(this, 'e', 1, en ? 1 : 0);
    if (!onScreen(...W2S(x, y), 0)) return;
    Fly.atW(x, y, 1); // без надписи: вспышка и искра к ✦ (⚡ — на батарее)
    fxRing(x, y, .1, PH_C, .9, .5);
  },
  // распад этого вида оплачивается («Генерация X» для c s b μ τ) и сколько он платит
  /** @param {string} sp */
  paidDec(sp) { return DEC_PAY.includes(sp) && Codex.auto.has(sp); },
  /** @param {string} sp */
  decPay(sp) { return 2 * this.value(sp); },
  // Распады — только когда у частиц есть масса (после перехода Хиггса)
  /** @param {Q} o @returns {[string, boolean][] | null} */
  decayProducts(o) {
    const sp = o.sp, a = o.anti;
    const L = (/** @type {string} */ s, /** @type {boolean} */ an) => /** @type {[string, boolean]} */ ([s, an]);
    switch (sp) {
      case 't': return [L('b', a), L('W', a)];
      case 'b': return [L('c', a), L('e', a), L('ne', !a)];
      case 'c': return [L('s', a), L('e', !a), L('ne', a)];
      case 's': return [L('u', a), L('e', a), L('ne', !a)];
      case 'ta': return [L('mu', a), L('nm', !a), L('nt', a)];
      case 'mu': return [L('e', a), L('ne', !a), L('nm', a)];
      case 'W': { // W⁺ (anti=false) → ℓ⁺ ν или u d̄ / c s̄
        const r = Math.random();
        if (r < .5) { const l = pick(['e', 'mu', 'ta'].filter(genOpen)); return [L(l, !a), L(NU_OF[l], a)]; } // только открытые поколения
        return r < .75 || !genOpen('c') ? [L('u', a), L('d', !a)] : [L('c', a), L('s', !a)];
      }
      case 'Z': { const f = pick(['e', 'mu', 'ta', 'ne', 'nm', 'nt', 'u', 'd', 'c', 's', 'b'].filter(genOpen)); return [L(f, false), L(f, true)]; }
      case 'H': { const r = Math.random(); let f = r < .58 ? 'b' : r < .7 ? 'ta' : r < .8 ? 'c' : null; if (f && !genOpen(f)) f = null;
        return f ? [L(f, false), L(f, true)] : r < .9 ? [L('ph', false), L('ph', false)] : [L('g', false), L('g', false)]; }
    }
    return null;
  },
  // Осколки разлетаются веером от направления родителя (как в пузырьковой камере)
  /** @param {Q} o */
  decay(o) {
    const pr = this.decayProducts(o); if (!pr) return;
    o.dead = true; this.forge(o);
    if (o.uni && (o.sp === 'mu' || o.sp === 'ta') && this.lepDone && this.lepAll() && this.enOn() && this.en < E_CAP) { // лептонная универсальность
      this.en = Math.min(E_CAP, this.en + 1); if (onScreen(...W2S(o.x, o.y), 0)) fxRing(o.x, o.y, .1, GOLD, .7, .4); // без надписи: ⚡ видна на батарее
    }
    const m = this.meff(o), E = Math.hypot(o.p, m), base = Math.atan2(o.dy, o.dx), n = pr.length;
    const fan = n === 2 ? [-.65, .65] : [0, -1.15, 1.15];
    const c0 = Math.random() * 3 | 0;
    /** @type {Q[]} */
    const made = [];
    pr.forEach(([sp, an], i) => {
      const a = base + (fan[i] ?? 0) + rnd(-.11, .11);
      const q = this.mk(sp, an, o.x, o.y, a, Math.max(.05, E / n * rnd(.7, 1.3)), SM[sp].kind === 'quark' ? c0 : undefined);
      q.cd = .4; q.born = .6; made.push(q);
    });
    fxRing(o.x, o.y, .1, this.dcol(o), .5, .5);
    if (onScreen(...W2S(o.x, o.y), 0)) Sfx.play('decay');
    if (o.sp === 't' && o.uni && Codex.auto.has('t') && this.enOn() && this.t - this.tAt >= T_CD) { // 173 ГэВ — где бы ни распался
      Uni.pay(this, 't', 0, E_CAP - this.en); this.en = E_CAP; this.full = true; this.tAt = this.t;
      fxRing(P.x, P.y, this.hr(), PH_C, this.hr() * 1.8, .8);
      this.float(P.x, P.y + this.hr() + .3, 't → ⚡ полный заряд', PH_C, 15, -.3);
    }
    this.event(made, o.x, o.y, o, this.rx([o], made, 0));
  },
  // Кузница: распад научённого тяжёлого — лёгкое в запас (кварк — к эпохе 4 и «Адронам», электрон — к «Атомам»)
  /** @param {Q} o */
  forge(o) {
    if (o.anti || this.ep >= 3 || !Codex.auto.has(o.sp) || !this.uniOn(o.sp)) return;
    const vis = onScreen(...W2S(o.x, o.y), 0), s = SM[o.sp].sym;
    if (FORGE_Q.includes(o.sp)) {
      const cap = this.udCap(); if (this.udRes.length >= cap) return;
      const nu = this.udRes.filter(f => f === 'u').length, f = nu * 2 <= this.udRes.length ? 'u' : 'd';
      this.udRes.push(f); Uni.pay(this, this.lawOf(o.sp), 0);
      if (vis) this.float(o.x, o.y - .4, `${s} ⇒ ${f} · запас ${this.udRes.length}/${cap} ◉`, [140, 235, 170], 11);
    } else if (FORGE_L.includes(o.sp) && this.eRes < E_FORGE) {
      this.eRes++; Uni.pay(this, this.lawOf(o.sp), 0);
      if (vis) this.float(o.x, o.y - .4, `${s} ⇒ e⁻ · к атомам ${this.eRes}/${E_FORGE}`, [150, 205, 255], 11);
    }
  },
  // потолок запаса u/d: каждое научённое тяжёлое поколение кварков — ещё UD_STEP
  /** @param {string} [k] посчитать, будто научен и k (для подсказки лавки) */
  udCap(k) { const has = (/** @type {string} */ s) => this.rs[s] > 0 || s === k; return UD_MAX + (has('c') || has('s') ? UD_STEP : 0) + (has('b') || has('t') ? UD_STEP : 0); },
  // Событие оставляет СЛЕД: вершину с лучами осколков. Пока след не погас, его можно заснять.
  /** @param {Q[]} made @param {number} x @param {number} y @param {Q} [parent] @param {Rx} [rx] */
  event(made, x, y, parent, rx) {
    const sps = made.map(m => m.sp); if (parent) sps.push(parent.sp);
    if (rx) for (const m of made) m.rx = rx;
    this.tracks.push({ x, y, t: this.t, life: parent ? VERT_T : PAIR_T, sps, parent: parent && parent.sp, col: parent && this.color(parent), rx,
      angs: made.map(m => Math.atan2(m.dy, m.dx)), dsp: made.map(m => [m.sp, m.anti, m.col, m.col2]) });
  },

  // Схема реакции для сцены открытия: что столкнулось (или распалось) и что родилось; k — сила удара (ступень)
  /** @param {Q[]} l @param {Q[]} r @param {number} k @returns {Rx} */
  rx(l, r, k) { const s = (/** @type {Q} */ o) => /** @type {[string, string]} */ ([this.lab(o), SM[o.sp].kind]); return { l: l.map(s), r: r.map(s), k }; },
  // Как родить вид по матрице — для открытия частицы, которую родила сама Вселенная (схемы на ней нет)
  /** @param {string} sp @returns {Rx | undefined} */
  rxOf(sp) {
    if (sp === 'ph') return { l: [['поле', 'fld']], r: [['γ', 'boson'], ['γ', 'boson']], k: 0 }; // свет родило поле-инфлатон
    const c = this.cellOf(sp); if (!c) return undefined;
    const [kinds, k] = c, q = (/** @type {string} */ t) => /** @type {[string, string]} */ ([t, 'boson']), a = { sp, anti: false, col: 0 }, b = { sp, anti: true, col: 0 };
    return { l: kinds === 'phph' ? [q('γ'), q('γ')] : kinds === 'gph' ? [q('γ'), q('g')] : [q('g'), q('g')], r: [[this.lab(a), SM[sp].kind], [this.lab(b), SM[sp].kind]], k };
  },

  // ---------- действие игрока: снимок ----------
  /** @param {string} sp */
  value(sp) { const m = SM[sp].m; return m > 0 ? 1 + Math.round(Math.log10(1 + m / .001) / 2) : 1; },
  snapshot() {
    if (!G.started || this.shotCd > 0) return;
    const paid = this.enOn(), R0 = this.hr();
    // снимать нечего (пусто или только знакомый свет и глюоны) — ⚡ не тратится: свет ловится кругом сам, кликать не нужно
    const worth = this.p.some(o => !o.dead && this.inHand(o) && !((o.sp === 'ph' || o.sp === 'g') && Codex.has(o.sp)))
      || this.tracks.some(tr => this.t - tr.t < tr.life && Math.hypot(tr.x - P.x, tr.y - P.y) < R0);
    if (!worth) {
      this.st.empty++; this.shotCd = .3; this.shotFx = .15;
      const ph = this.p.some(o => !o.dead && o.sp === 'ph' && this.inHand(o)), why = ph || this.st.empty <= 3;
      this.float(P.x, P.y - R0, why ? 'снимать нечего: свет ловится кругом, ⚡ цела' : 'пусто', [200, 200, 210], why ? 13 : 14);
      return;
    }
    if (paid && this.en < E_SHOT) { this.noEnergy(); this.shotCd = .25; this.float(P.x, P.y - R0, 'нет энергии ⚡', [255, 150, 130], 13); return; }
    this.shotCd = this.up('sh'); this.learn.snap = true; Sfx.play('snap');
    const got = new Map(); // вид → где его видно (частица или след)
    let refund = false; // снят оплачиваемый распад — ⚡ снимка вернётся
    for (const o of this.p) if (!o.dead && this.inHand(o) && !got.has(o.sp)) got.set(o.sp, { x: o.x, y: o.y, rx: o.rx });
    this.shotFx = .35;
    for (const tr of this.tracks) {
      if (this.t - tr.t >= tr.life || Math.hypot(tr.x - P.x, tr.y - P.y) >= R0) continue;
      for (const sp of tr.sps) if (!got.has(sp) || !got.get(sp).rx) got.set(sp, { x: tr.x, y: tr.y, rx: tr.rx });
      if (tr.parent && !tr.rec) {
        tr.rec = true;
        if (!this.decSeen.has(tr.parent)) {
          this.decSeen.add(tr.parent); this.kn += 5; Sfx.play('goal');
          this.float(tr.x, tr.y + .4, `${SM[tr.parent].sym}→ ✓ +5`, [255, 215, 110], 15, -.3);
          fxRing(tr.x, tr.y, .2, GOLD, .9, .6);
        } else if (this.paidDec(tr.parent)) {
          const v = this.decPay(tr.parent); Uni.pay(this, this.lawOf(tr.parent), v); refund = true;
          this.float(tr.x, tr.y + .4, `${SM[tr.parent].sym}→ +${v} ✦`, [140, 220, 255], 14, -.3);
        }
      }
    }
    if (paid && !refund) this.en -= E_SHOT; // снят оплачиваемый распад — снимок бесплатно
    this.acted();
    // комбо: чем больше разных частиц (не квантов) в одном кадре, тем ценнее снимок
    const kinds = [...got.keys()].filter(sp => sp !== 'ph' && sp !== 'g').length;
    const combo = kinds >= 2 ? 1 + .25 * (kinds - 1) : 1; this.st.kinds = Math.max(this.st.kinds, kinds);
    let gain = 0, fresh = 0;
    for (const [sp, at] of got) {
      if (!Codex.has(sp)) {
        Codex.see(sp, at.rx || this.rxOf(sp)); gain += 10; fresh++;
        if (sp === 'ph' && this.lit) { // фотон открыт — у детектора появляется энергия
          this.en = Math.max(this.en, E_START);
          fxRing(P.x, P.y, this.hr(), PH_C, this.hr() * 1.6, .9);
          this.float(P.x, P.y + this.hr() + .3, 'γ → ⚡ энергия', PH_C, 15, -.4);
        }
        this.float(at.x, at.y, 'НОВОЕ ' + SM[sp].sym, [255, 215, 110], 15, -.15 * fresh);
        continue;
      }
      if (sp === 'ph' || sp === 'g') continue;
      // повторные измерения тоже дают знания, но всё меньше: статистика насыщается
      const n = this.seenN[sp] = (this.seenN[sp] || 0) + 1, v = this.value(sp) * Math.max(.05, 1 / (1 + n / 3)) * combo;
      gain += v;
    }
    if (fresh) this.learn.snapNew = true;
    gain = Math.round(gain * 10) / 10;
    this.kn += gain;
    if (gain > 0) this.float(P.x, P.y - R0, `+${gain} ✦` + (combo > 1 ? ` ×${combo}` : ''), [140, 220, 255], 16);
    if (fresh) fxRing(P.x, P.y, R0, [255, 215, 110], R0 * 1.5, .7);
  },
  bal() { return Math.floor(this.kn - this.spent); },
  // ---------- исследования: сделал руками — отдай Вселенной ----------
  // Пункт виден, только когда это уже сделано руками; уровень хранится в rs[k]
  // Порядок — приоритет (в панели только первые RES_MAX): то, что нужно для задания эпохи, — раньше
  /** @returns {Research[]} */
  resList() {
    if (!this.lit) return [];
    if (this.ep === 3) return baryonTrios(this.stockQ) >= HAND_CP || this.rs.cp ? [{ k: 'cp', ic: '⚖', name: 'Асимметрия', cost: RES_COST.cp, about: () => 'сразу: первая тройка сбережена · вещества чуть больше, чем антивещества: нарушение CP дают три поколения кварков' }] : [];
    const ph = { k: 'ph', ic: 'γ', name: 'Свет', cost: RES_COST.ph, about: (/** @type {number} */ l) => l ? `сразу: горячая область у детектора · горячих областей вдвое больше: ${HZ_N} → ${HZ_N * 2}` : `свет в мире: ~${this.phN(1)} γ` };
    const L = [];
    if (!this.rs.ph) L.push(ph);
    if (Codex.has('g')) L.push({ k: 'g', ic: 'g', name: 'Глюоны', cost: RES_COST.g, about: () => 'сразу: глюоны в мире · генерация g' });
    if (this.rs.ph && this.ep === 0) L.push(ph);
    // законы вещества — после первого столкновения руками (столкновения квантов приходят вместе с первым из них)
    const need = this.ep === 2 ? this.need2 : this.ep === 0 ? this.need0 : [], hand = this.pairs > 0 || this.rs.coll > 0;
    const all = hand ? [...Codex.run].filter(sp => LGEN[sp] && this.genBuyOk(sp)) : []; // лептоны — по лестнице поколений
    // кварки — по закону на поколение: открыт хоть один кварк поколения и куплено предыдущее
    const qs = hand ? Object.keys(QGEN).filter((k, i) => QGEN[k].some(sp => Codex.run.has(sp)) && (i === 0 || this.rs['q' + i] > 0)) : [];
    const needQ = (/** @type {string} */ k) => QGEN[k].some(sp => need.includes(sp));
    /** @type {Research[]} */
    const items = [
      ...qs.map(k => ({ k, ic: QROM[k], name: `Кварки ${QROM[k]}`, cost: [LAW_COST[k]], about: () => this.lawSoon(k) + this.qRole(k), nd: needQ(k) })),
      ...all.map(sp => ({ k: sp, ic: SM[sp].sym, name: `Лептоны ${LGEN[sp]}`, cost: [LAW_COST[sp]], about: () => this.lawSoon(sp) + this.role(sp), nd: need.includes(sp) })),
    ];
    for (const r of [...items.filter(r => r.nd), ...items.filter(r => !r.nd)]) L.push({ k: r.k, ic: r.ic, name: r.name, cost: r.cost, about: r.about });
    return L;
  },
  // что даёт «Генерация X»: у каждого семейства своя польза
  /** @param {string} sp */
  role(sp) {
    if (sp === 'H') return 'всплески поля генерируют H';
    if (sp === 'e') return 'e⁺e⁻ гаснут в γγ: +1 ✦ +1 ⚡';
    if (sp === 'u' || sp === 'd') { const o = sp === 'u' ? 'd' : 'u'; return `запас к эпохе 4: ${this.udRes.length}/${this.udCap()} ◉` + (Codex.auto.has(o) ? '' : ` · тройке нужен и ${o}`); }
    const fg = FORGE_Q.includes(sp) ? ` · кузница: распад → u/d в запас (потолок ${this.udCap(sp)})` : FORGE_L.includes(sp) ? ' · кузница: распад → e⁻ к атомам' : '';
    if (sp === 't') return `t Вселенной в кадре: ⚡ полный (раз в ${T_CD} с)${fg}`;
    if (DEC_PAY.includes(sp)) return `снятый распад +${this.decPay(sp)} ✦${fg}`;
    return `столкновения генерируют ${SM[sp].sym}`;
  },
  /** @param {string} k */
  rLvl(k) { return this.rs[k] || 0; },
  // закон, которому принадлежит вид: кварк — закон своего поколения («Кварки II»), прочее — «Генерация X»
  /** @param {string} sp */
  lawOf(sp) { return QLAW[sp] || sp; },
  /** @param {string} sp */
  lawName(sp) { return QLAW[sp] ? `«Кварки ${QROM[QLAW[sp]]}»` : LGEN[sp] ? `«Лептоны ${LGEN[sp]}»` : `«Генерация ${SM[sp].sym}»`; },
  // ветка лептонов завершена: сформированы «Лептоны I, II, III» и ни один не выключен
  lepAll() { return LEP.every(sp => this.rs[sp] > 0 && Codex.auto.has(sp)); },
  // ценность поколения кварков — по самому тяжёлому кварку (цена и ✦/мин)
  /** @param {string} k */
  qVal(k) { return Math.max(...QGEN[k].map(sp => this.value(sp))); },
  // зачем закон поколения: тут — и что он даст в «Адронах»
  /** @param {string} k */
  qRole(k) {
    if (k === 'q1') return `запас u/d к эпохе 4: ${this.udRes.length}/${this.udCap()} ◉ · в «Адронах» эти кварки есть с первой секунды`;
    if (k === 'q2') return `кузница c, s → u/d (потолок ${this.udCap('c')}) · в «Адронах»: странные ▲ и очарованные ■ кварки, гипероны Λ, Σ, Ξ и Λc`;
    return `t в кадре: ⚡ полный · кузница b (потолок ${this.udCap('b')}) · в «Адронах»: прелестный ⬢, Λb и каскад b → c → s → u`;
  },
  // виды закона вещества: поколение кварков или лептон
  /** @param {string} k @returns {string[]} */
  lawSps(k) { return QGEN[k] || (LGEN[k] ? [k] : []); },
  // вид задания эпохи 3, который закон k отдаст горячей точке сразу (распад ещё не снят, вид создан игроком)
  /** @param {string} k */
  lawHot(k) { return this.ep === 2 ? this.need2.find(sp => this.lawSps(k).includes(sp) && !this.decSeen.has(sp) && genOpen(sp) && Codex.has(sp)) : undefined; },
  // что закон сделает в первые секунды — начало строки лавки («сразу: … · »)
  /** @param {string} k */
  lawSoon(k) {
    const hot = this.lawHot(k), sym = (/** @type {string} */ s) => SM[s].sym, L = [];
    if (hot) L.push(`горячая точка родит ${sym(hot)}`);
    const seen = this.lawSps(k).filter(sp => Codex.has(sp) && sp !== hot).map(sym);
    if (k === 'q3' && this.enOn()) L.push('⚡ полный');
    const room = QGEN[k] ? Math.min(NOW_UD, this.udCap(QGEN[k][0]) - this.udRes.length) : 0;
    if (room > 0) L.push(`+${room} ◉ в запас u/d`);
    if (FORGE_L.includes(k)) L.push(`+${NOW_E} e⁻ к атомам`);
    if (seen.length) L.push(k === 'e' ? `${NOW_PAIRS} пары e⁺e⁻ в кадре` : `пары ${seen.join(', ')} в кадре`);
    return L.length ? `сразу: ${L.join(', ')} · ` : '';
  },
  // Закон сформирован — действует в ту же секунду (а не когда-нибудь): возвращает, что произошло, для сцены
  /** @param {string} k @param {number} l */
  lawNow(k, l) {
    const L = [];
    if (k === 'ph' && l >= 2 && this.hzOn()) { // горячая область вспыхивает в кадре уже разогретой
      const a = Math.random() * TAU, d = this.hr() + HZ_R * 1.2;
      this.hz.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, r: HZ_R, t: HZ_IN, L: HZ_L }); this.hzCd = 0;
      L.push('горячая область у детектора');
    }
    if (k === 'cp') L.push('первая тройка сбережена');
    const sps = this.lawSps(k); if (!sps.length) return L.join(', ');
    const hot = this.lawHot(k);
    if (hot) { // задание эпохи 3: горячая точка — сейчас, без очереди
      if (!this.hot.some(h => h.sp === hot)) { const a = Math.random() * TAU, d = rnd(this.hr() + 1.2, viewRadius() * .5); this.hot.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, t: 0, sp: hot }); }
      this.hotCd = 5; L.push(`горячая точка родит ${SM[hot].sym}`);
    }
    if (k === 'q3' && this.enOn()) { this.en = E_CAP; this.full = true; L.push('⚡ полный'); }
    if (QGEN[k]) { // кузница сразу: ◉ в запас (поровну u и d — сложатся тройки)
      let n = 0;
      for (; n < NOW_UD && this.udRes.length < this.udCap(); n++) this.udRes.push(this.udRes.filter(f => f === 'u').length * 2 <= this.udRes.length ? 'u' : 'd');
      if (n) { Uni.pay(this, k, 0); this.float(P.x, P.y + this.hr() + .3, `+${n} ◉ в запас · ${this.udRes.length}/${this.udCap()} ◉`, [140, 235, 170], 13); L.push(`+${n} ◉ в запас u/d (${this.udRes.length}/${this.udCap()})`); }
    }
    if (FORGE_L.includes(k)) {
      const n = Math.min(NOW_E, E_FORGE - this.eRes); this.eRes += n;
      if (n) { this.float(P.x, P.y + this.hr() + .3, `+${n} e⁻ к атомам · ${this.eRes}/${E_FORGE}`, [150, 205, 255], 13); L.push(`+${n} e⁻ к атомам`); }
    }
    // пары своего вида — в кадре, рождённые Вселенной: видно, что теперь она это умеет (вид задания — у горячей точки)
    const seen = sps.filter(sp => Codex.has(sp) && sp !== hot);
    for (const sp of seen) for (let i = 0; i < (k === 'e' ? NOW_PAIRS : 1); i++) {
      const [x, y] = this.inViewPos();
      for (const q of this.pair(sp, x, y, this.thermalP(this.T))) q.uni = true;
    }
    if (seen.length) L.push(k === 'e' ? `${NOW_PAIRS} пары e⁺e⁻ в кадре: гаснут в γγ` : `пары ${seen.map(sp => SM[sp].sym).join(', ')} в кадре`);
    return L.join(', ');
  },
  // законы поколений: кварк, открытый после закона, Вселенная тоже рождает (выключенный закон — нет)
  qSync() {
    for (const k in QGEN) {
      if (!(this.rs[k] > 0) || Uni.off(this, k)) continue;
      for (const sp of QGEN[k]) if (Codex.has(sp) && !(this.rs[sp] > 0 && Codex.auto.has(sp))) { this.rs[sp] = 1; Codex.auto.add(sp); Codex.dirty = true; }
    }
  },
  // «Генерация» поколения — только после предыдущего: e → μ → τ, u и d → c, s → t, b (как и открытие, GEN_PREV)
  /** @param {string} sp */
  genBuyOk(sp) { return (GEN_PREV[sp] || []).every(k => this.rs[k] > 0); },
  // что купить первым, чтобы дойти до «Генерации sp»
  /** @param {string} sp @returns {string} */
  buyNext(sp) {
    if (QLAW[sp]) { const n = +QLAW[sp][1]; for (let i = 1; i <= n; i++) if (!(this.rs['q' + i] > 0)) return 'q' + i; return QLAW[sp]; } // кварки — законы поколений по порядку
    const k = this.genBuyOk(sp) ? null : (GEN_PREV[sp] || []).find(k => !(this.rs[k] > 0)); return k ? this.buyNext(k) : sp;
  },
  // лестница словами: «Генерация e», потом «Генерация μ»
  /** @param {string} sp */
  ladder(sp) {
    if (QLAW[sp]) { const n = +QLAW[sp][1], L = []; for (let i = 1; i <= n; i++) if (!(this.rs['q' + i] > 0) || i === n) L.push(`«Кварки ${QROM['q' + i]}»`); return L.join(', потом '); }
    /** @type {Set<string>} */
    const need = new Set();
    const walk = (/** @type {string} */ s) => { for (const k of GEN_PREV[s] || []) if (!(this.rs[k] > 0)) { walk(k); need.add(k); } };
    walk(sp);
    return [...need, sp].map(k => this.lawName(k)).join(', потом ');
  },
  // сколько квантов света держит в мире закон «Свет» уровня l (как в qCap, когда разгорелся)
  /** @param {number} l */
  phN(l) { return Math.round(this.nQ() * PH_DENS[Math.min(l, PH_DENS.length - 1)]); },
  // ровный доход от научённого, ✦/мин, на уровне l
  /** @param {string} k @param {number} l */
  uniRate(k, l) { return k === 'ph' ? UNI_PH[Math.min(l, UNI_PH.length - 1)] : UNI_RATE[k] ?? 2 + (QGEN[k] ? this.qVal(k) : this.value(k)); },
  // сколько ✦/мин прибавит следующий закон (для лавки)
  /** @param {string} k */
  uniGain(k) { const l = this.rLvl(k); return this.uniRate(k, l + 1) - (l ? this.uniRate(k, l) : 0); },
  // работает ли сейчас научённое: в эпоху 4 Вселенная частиц не рождает — только свет, глюоны и асимметрия
  /** @param {string} k */
  uniOn(k) { return this.ep !== 3 || k === 'ph' || k === 'g' || k === 'cp'; },
  // тумблер закона: «Генерация X» и глюоны — это Codex.auto (что Вселенная рождает сама); свет, столкновения, асимметрия смотрят Uni.off
  /** @param {string} k @param {boolean} on */
  uniSet(k, on) {
    if (k === 'coll' || k === 'cp') return;
    for (const sp of QGEN[k] ? QGEN[k].filter(sp => this.rs[sp] > 0) : [k]) { if (on) Codex.auto.add(sp); else Codex.auto.delete(sp); } // закон поколения — все его кварки
    Codex.dirty = true;
  },
  // доход капнул: «+1 ✦» над частицей Вселенной этого вида на виду (нет на виду — только в сводке)
  /** @param {string} k */
  uniPop(k) {
    if (k === 'coll' || k === 'cp') return false;
    const o = this.p.find(o => (QGEN[k] ? QGEN[k].includes(o.sp) : o.sp === k) && !o.dead && !(o.fade >= 0) && (o.uni || this.isQ(o)) && onScreen(...W2S(o.x, o.y), -30));
    if (o) Fly.atW(o.x, o.y, 1); // без надписи «+1 ✦»: искра от частицы к счётчику
    return !!o;
  },
  // исследование, которое просит текущий шаг задания (крупно и первым в лавке)
  // (кэш раз в кадр в renderShop: шаги сами спрашивают у лавки номер клавиши)
  /** @returns {string | null | undefined} */
  taskRes() { const c = this.steps().find(g => !g.d); return c && c.res; },
  /** @returns {ShopItem[]} */
  shopItems() {
    // ✦ — исследования мира (законы Вселенной)
    const pk = this._pk;
    const all = this.resList().filter(r => this.rLvl(r.k) < r.cost.length).map(r => ({ r, c: r.cost[this.rLvl(r.k)], pri: r.k === pk }));
    all.sort((a, b) => +b.pri - +a.pri); // сначала — нужное для задания, потом режем: его не вытеснит
    return all.slice(0, RES_MAX);
  },
  /** @param {string} k */
  keyOf(k) { const i = this.shopItems().findIndex(x => x.r && x.r.k === k); return i < 0 ? null : i + 1; },
  canBuy() { return this.shopOk() && this.shopItems().some(x => this.bal() >= x.c); },
  /** @param {number} i */
  buy(i) {
    const it = this.shopItems()[i];
    if (!it || !G.started || G.paused || this.stockOut || !this.shopOk()) return;
    if (this.bal() < it.c) { this.float(P.x, P.y - this.hr() - .2, `нужно ${it.c} ✦`, [255, 150, 130], 13); Sfx.play('fizzle'); return; }
    this.spent += it.c; this.learn.buy = true; this.acted();
    this.research(it.r);
  },
  // Исследовано — теперь это делает сама Вселенная
  /** @param {Research} r */
  research(r) {
    const k = r.k, gain = this.uniGain(k), l = this.rs[k] = this.rLvl(k) + 1; Sfx.play('upgrade');
    if (k === 'ph' && l === 1) { this.autoT = 0; Codex.auto.add('ph'); fxRing(P.x, P.y, .5, PH_C, this.wr(), 2.5); fxFlash(P.x, P.y, this.hr() * 2, [255, 240, 200], .5); }
    else if (k === 'g') { Codex.auto.add('g'); this.unlockGluons(); }
    else if (k === 'cp') this.saveCd = .8;
    else if (QGEN[k]) this.qSync();
    else if (k !== 'ph') Codex.auto.add(k);
    // первый закон вещества приносит и столкновения квантов: без них Вселенной не из чего генерировать вещество
    const coll = this.lawSps(k).length > 0 && !this.rs.coll;
    if (coll) { this.rs.coll = 1; Uni.learn(this, 'coll', '✸', 'Столкновения', UNI_RATE.coll); }
    Codex.dirty = true;
    const pm = gain || this.uniRate(k, l); Uni.learn(this, k, r.ic, r.name, this.uniRate(k, l));
    const now = this.lawNow(k, l);
    fxRing(P.x, P.y, this.hr(), GOLD, this.hr() * 1.8, .7);
    // сцена: что теперь происходит в мире и что случилось сразу (первый закон и закон глюонов — кадр-пауза)
    const what = k === 'ph' ? (l >= 2 ? `Горячих областей вдвое больше: ${HZ_N} → ${HZ_N * 2}. Свет генерируется именно там` : 'Генерация света: того, что создан здесь. Пойманный кругом свет даёт ⚡ и ✦')
      : k === 'g' ? 'Мир наполняется глюонами: это клей, который потом свяжет кварки'
      : k === 'cp' ? 'Вещество больше не сгорает: тройки сберегаются' : QGEN[k] ? `Генерация кварков ${QROM[k]} поколения в мире · ${this.qRole(k)}` : `Генерация лептонов ${LGEN[k]} поколения (${SM[k].sym}) в мире · ${this.role(k)}`;
    const first = !this.learn.taught; this.learn.taught = true;
    const html = `<div class="ck">Закон сформирован</div><div class="rx"><span class="cs res">${r.ic}</span></div><div class="cn">${r.name}</div>` +
      `<div class="cp">${what}${coll ? '. Кванты сталкиваются и сами: генерация вещества из столкновений' : ''}</div>` + (now ? `<div class="cg">Сразу: ${now}</div>` : '');
    const pay = `<div class="cg"><small>и понемногу ✦: +${fmtPm(pm)} в минуту (справа, в «Законах Вселенной»)</small></div>`;
    // первый закон — важное знание (так устроена вся игра): кадр-пауза; дальше — сцена над лавкой
    if (LGEN[k] && !this.lepDone && this.lepAll()) { this.lepBranch(); return; } // третий лептонный закон — ветка завершена: своя сцена
    if (first) Cine.show(html + `<div class="cg">Закон работает сразу и сам, пока идёт игра (и понемногу приносит ✦: +${fmtPm(pm)} в минуту). Справа: все сформированные законы</div>`, 6, .8);
    else if (k === 'g' && l === 1 && this.ep === 0) Cine.show(html + this.gluPairs() + pay, 8, .8, true); // лента без паузы
    else showScene(html + pay, 3.4);
  },
  // Ветка лептонов завершена: золотая вспышка, кадр-пауза и бонус «Лептонная универсальность»
  lepBranch() {
    this.lepDone = true; Sfx.play('segment');
    fxRing(P.x, P.y, this.hr(), GOLD, this.wr(), 2.4); fxFlash(P.x, P.y, this.hr() * 2.5, [255, 230, 170], .5);
    const sym = LEP.map(sp => `<span class="cs res">${SM[sp].sym}</span>`).join('');
    Cine.show(`<div class="ck">Ветка завершена</div><div class="rx">${sym}</div><div class="cn">Лептоны I, II, III</div>` +
      `<div class="cp">Все три поколения лептонов — законы Вселенной. Бонус: лептонная универсальность — e, μ и τ одинаково чувствуют слабую силу (различаются только массой), и каждый их распад во Вселенной даёт +1 ⚡</div>`, 6, .8, true);
  },
  // Важное родилось у тебя впервые в жизни — стоп-кадр со стрелкой: что это и что сделать.
  // Важное: глюон третьей струи, H, W, Z и самая первая новая частица забега (дальше — без остановок)
  /** @param {Q[]} made */
  spotNew(made) {
    const o = made.find(o => o.sp === 'g' && this.wanted('g', o)) || made.find(o => !Codex.known.has(o.sp) && this.wanted(o.sp, o)
      && (['H', 'W', 'Z'].includes(o.sp) || !this.spotted.size));
    if (!o || this.spotted.has(o.sp) || Codex.known.has(o.sp)) return;
    this.spotted.add(o.sp);
    const tap = isTouch() ? 'нажать ◉' : 'кликнуть';
    Spot.show(o, o.sp === 'g' ? 'Третья струя: глюон' : 'Новая частица!', `навести на неё круг и ${tap}: снимок`);
  },
  // открыт впервые в забеге — что дальше (строка на карточке открытия)
  /** @param {string} k */
  seeNext(k) { return k === 'g' && this.ep === 0 && !this.rs.g ? 'Дальше: закон глюонов, и мир наполнится ими' : ''; },
  // что теперь можно сталкивать с глюонами: жест и две схемы — g + γ и g + g (первое поколение)
  gluPairs() {
    const how = isTouch() ? '<span>держать ◉ у двух: чем дольше, тем сильнее удар; затем отпустить</span>'
      : `<span class="gest">${GEST.hold()}<span>зажать у двух</span></span><span class="gest">${GEST.release()}<span>отпустить: столкнуть</span></span>`;
    const u = this.rxOf('u'), d = this.rxOf('d');
    return `<div class="cp">Их можно сталкивать с фотонами и друг с другом:</div><div class="hw">${how}</div>` +
      (u ? rxHtml(u, '') : '') + (d ? rxHtml(d, '') : '');
  },
  /** @param {HTMLElement & { _h?: string }} el */
  renderShop(el) {
    this._pk = this.taskRes();
    const items = this.shopItems();
    if (!G.started || this.stockOut || !this.lit || !items.length || !this.shopOk()) { el.style.display = 'none'; return; } // в пустоте исследовать нечего; до главы «Закон» — тоже
    const b = this.bal(), anyPri = items.some(x => x.pri);
    // иерархия: «для задания» — крупно; прочие исследования — компактно (если есть главное или их много)
    const html = items.map((x, k) => {
      const { r, c } = x, sec = !x.pri && (anyPri || k > 0 && items.length > 2), ab = r.about(this.rLvl(r.k)), tip = `${ab} · и понемногу +${fmtPm(this.uniGain(r.k))} ✦/мин`;
      const gn = QGEN[r.k] ? ` g${r.k[1]}` : SM[r.k] && SM[r.k].kind !== 'boson' ? ` g${SM[r.k].gen}` : ''; // поколение: I — зелёный, II — жёлтый, III — красный
      return `<button data-i="${k}" class="res ${b >= c ? 'ok' : 'no'}${x.pri ? ' pri' : sec ? ' sec' : ''}${gn}" title="${r.name}: ${tip}">${x.pri ? '<u>для задания</u>' : ''}<span class="k">${k + 1}</span>` +
        `<span class="ic">${r.ic}</span><b>${r.name}</b><i>${ab}</i><em>${x.pri ? 'Сформировать закон · ' : ''}${c} ✦</em></button>`;
    }).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
    el.classList.toggle('nokeys', !this.learn.buy);
    if (!el.onclick) el.onclick = e => { const bt = /** @type {HTMLElement} */ (e.target).closest('button'); const S = G.stage; if (bt && S && S.buy) S.buy(Number(bt.dataset.i)); };
    el.style.display = 'flex';
  },
  // ---------- Вселенная сама рождает то, что уже открыто ----------
  /** @param {number} dt */
  populate(dt) {
    this.qSync();
    /** @type {Record<string, number>} */
    const cnt = {};
    for (const o of this.p) if (!o.dead && !(o.fade >= 0)) cnt[o.sp] = (cnt[o.sp] || 0) + 1; // гаснущие уже ушли — иначе thin гасит лишнее каждый кадр
    if ((cnt.ph || 0) + (cnt.g || 0) < this.qCap() && Math.random() < dt * 40) this.spawnQuantum(false, null, false, null, true); // пополнение — из областей: свет из горячих, глюоны из цветных вихрей
    // Вселенная рождает сама только исследованное; остальное — из столкновений (твоих или случайных)
    // лишнее (осколки распадов) уходит у всех видов — исследованные или нет
    for (const sp of this.ep === 3 ? [] : this.ep === 0 ? FERMIONS.filter(sp => Codex.auto.has(sp)) : [...FERMIONS, 'W', 'Z', 'H']) {
      const s = SM[sp], base = s.kind === 'quark' || s.kind === 'lepton' ? .6 : .4, target = base * this.weight(sp);
      const have = cnt[sp] || 0, auto = Codex.has(sp) && Codex.auto.has(sp) && (sp === 'H' || this.rs.coll > 0 && !Uni.off(this, 'coll')); // вещество — из столкновений
      if (auto && Math.random() < dt * .25 * (have === 0 ? Math.min(1, target * 1.5) : have < target - .5 ? 1 : 0)) {
        const [x, y] = sp === 't' ? this.inViewPos() : this.randPos(true), pp = this.thermalP(this.T);
        if (s.kind === 'boson' && sp !== 'W') this.mk(sp, false, x, y, Math.random() * TAU, pp).uni = true;
        else for (const q of this.pair(sp, x, y, pp)) q.uni = true;
      } else if (have > target * 1.5 + 1) this.thin(o => o.sp === sp, have - Math.ceil(target * 1.5 + 1));
    }
    this.reserve(dt);
    if (this.ep === 3 && (cnt.g || 0) > G_MAX4) this.thin(o => o.sp === 'g' && !o.cap, cnt.g - G_MAX4, true);
    const nq = (cnt.ph || 0) + (cnt.g || 0), capQ = Math.ceil((this.ep === 3 ? this.qCap() : this.nQ() * this.qShare()) * 1.1);
    if (nq > capQ) this.thin(o => this.isQ(o) && !o.cap, nq - capQ);
  },
  // «Генерация u/d»: Вселенная откладывает кварк в запас к эпохе 4 — поровну u и d, чтобы сложились тройки
  /** @param {number} dt */
  reserve(dt) {
    const fl = ['u', 'd'].filter(f => Codex.auto.has(f));
    if (this.ep >= 3 || !this.rs.coll || Uni.off(this, 'coll') || !fl.length || this.udRes.length >= this.udCap() || (this.udT += dt) < UD_EVERY) return;
    this.udT = 0;
    const nu = this.udRes.filter(f => f === 'u').length, f = fl.length === 1 ? fl[0] : nu * 2 <= this.udRes.length ? 'u' : 'd';
    this.udRes.push(f); Uni.pay(this, this.lawOf(f), 0); // в сводке — вспышка строки: Вселенная сделала своё
    this.float(P.x, P.y + this.hr() + .3, `+${f} в запас · ${this.udRes.length}/${this.udCap()} ◉`, [140, 235, 170], 11);
  },
  // точка в кадре, не у самого детектора
  /** @returns {[number, number]} */
  inViewPos() {
    const a = Math.random() * TAU, d = rnd(this.hr() * 1.8, Math.max(this.hr() * 2, refRadius() * .75));
    return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d];
  },
  // Лишние частицы уходят только за экраном: на глазах у игрока ничего не пропадает «в пустоте» (уйдёт, когда уедешь).
  // force — и на экране плавно гаснут, дальние от детектора первыми (только лимит глюонов эпохи 4 — это баланс битвы)
  /** @param {(o: Q) => boolean} pred @param {number} extra @param {boolean} [force] */
  thin(pred, extra, force = false) {
    const c = this.p.filter(o => pred(o) && !o.dead && !(o.fade >= 0) && !o.cap);
    for (const o of c) {
      if (extra <= 0) return;
      if (!onScreen(...W2S(o.x, o.y), 30)) { o.dead = true; extra--; }
    }
    if (!force) return;
    c.filter(o => !o.dead && !this.inHand(o))
      .sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y))
      .slice(0, extra).forEach(o => o.fade = 1);
  },

  // ×4 (Enter / кнопка) — вся игра уровня вчетверо быстрее: и частицы, и остывание, и часы эпохи
  /** @param {number} dt0 @param {boolean} act */
  // ×4 — мир живёт вчетверо быстрее, а ввод, детектор и его поле — один раз за кадр, в реальном времени
  update(dt0, act) { const n = act && G.started && this.ff > 1 ? this.ff : 1; for (let i = 0; i < n; i++) this.tick(dt0, act, i === 0); },
  /** @param {number} dt0 @param {boolean} act @param {boolean} [own] этот шаг — кадр игрока (ввод, детектор) */
  tick(dt0, act, own = true) {
    const prevT = this.T, dt = dt0;
    // до старта (под заставкой) мир просто живёт: без остывания и ввода
    const live = act && G.started;
    if (live && this.bannerFor !== this.ep) { this.bannerFor = this.ep; this.banner = 0; }
    if (live) {
      this.t += dt; this.epT += dt; this.banner += dt0;
      // часы эпохи идут до выполнения целей (пролог не в счёт; в эпохе Хиггса — с той минуты, как поле застыло)
      if (this.doneAt === null && (this.lit || this.ep) && !(this.ep === 1 && this.hig < 1)) this.epClock += dt0;
      const E = EPOCHS[this.ep], nx = EPOCHS[this.ep + 1];
      const floor = this.epDone ? (nx ? Math.min(nx.startT, this.T) * .999 : 0) : E.floor;
      const rate = this.epDone ? (nx ? 12 : 4) : 1; // последняя эпоха выполнена — догорает быстро
      if (this.lit || this.ep) this.T = Math.max(floor, this.T * Math.exp(-dt * rate / E.tau)); // в прологе не остывает
      if (this.epDone && nx && (this.epGap -= dt) <= 0 && this.T <= nx.startT) this.startEpoch(this.ep + 1);
      this.tickHot(dt); this.tickHz(dt); this.tickCz(dt);
      if (this.ep === 3 && !this.advanced) { this.soup(dt); this.tickWave(dt); if (this.rs.cp && !Uni.off(this, 'cp') && this.safe.length < AUTO_TRIO + 4 && (this.saveCd -= dt) <= 0) { this.saveCd = SAVE_CD; this.addSafe(); } }
    }
    if (this.higT >= 0) { this.higT += dt; this.hig = smooth(0, HIG_T, this.higT); }
    this.tickRipples(dt, live);
    if (this.lit) this.litT += dt;
    if (this.rs.ph) this.autoT += dt;
    // свет открыт, когда шкала разогрева погасла: карточка не ложится поверх неё
    // свет регистрируется сам — и в обучении так же (второе ревью №7: обучение просило снимок фотона, а игра снимать свет не даёт)
    if (this.lit && this.litT > 2.6 && !Codex.has('ph')) { Codex.see('ph', this.rxOf('ph')); this.kn += 10; }
    this.bg = mixc(mixc([7, 7, 12], [44, 34, 14], this.lit ? smooth(0, 3, this.litT) : 0), [16, 12, 30], this.hig);
    const red = this.T / prevT; // расширение: импульсы краснеют вместе с температурой
    if (live && own) { this.input(dt0); this.tickShield(dt0); this.tickCoach(dt0); }
    if (act && own) {
      if (this.inf.hold && !this.lit) P.vx = P.vy = 0; // рогатка шарика: чаша стоит, пока тянешь резинку
      else steer(P, 11 / (1 + 1.5 * this.load()), 6, dt0); // тяжёлый груз в поле тормозит детектор
      P.x += P.vx * dt0; P.y += P.vy * dt0;
      this.shotCd -= dt0; this.enFx -= dt0;
      for (const f of this.floats) f.t += dt0;
      this.floats = this.floats.filter(f => f.t < 1.6);
      this.shotFx = (this.shotFx || 0) - dt0;
      this.tracks = this.tracks.filter(tr => this.t - tr.t < tr.life);
      this.tickFocus(dt0);
    }
    // есть источник — квант вне него остывает: свет — вне горячих областей, глюон — вне цветных вихрей
    const WR = this.wr(), ep4 = act && this.ep === 3, phLife = act && this.hzOn() && this.hz.some(z => this.hzK(z) > .5), gLife = act && this.czOn() && this.cz.some(z => this.hzK(z) > .5);
    for (const o of this.p) {
      if (o.dead) continue;
      if (!o.cap) o.p *= red;
      o.born = Math.min(1, o.born + dt * 2); o.vis = o.vis == null ? (o.born >= .6 ? APPEAR_T : 0) : o.vis + dt; o.cd -= dt; if (o.mine > 0) o.mine -= dt;
      if (o.flung > 0 && (o.flung -= dt) <= 0) { o.v = undefined; o.mate = null; o.thrown = false; o.sib = null; if (o.p0 != null) { o.p = o.p0; o.p0 = undefined; } } // промах: заряд рассеялся
      if (o.rep > 0) o.rep -= dt;
      if (o.pull > 0 && (o.pull -= dt) <= 0) o.v = undefined;
      if (o.fade >= 0) { o.fade -= dt * 1.5; o.born = Math.min(o.born, Math.max(0, o.fade)); if (o.fade <= 0) o.dead = true; }
      else if ((o.sp === 'ph' ? phLife && this.hzAt(o.x, o.y) < .2 : o.sp === 'g' && gLife && this.czAt(o.x, o.y) < .2) && !o.cap && !(o.flung > 0) && !(o.mine > 0) && (o.qt = (o.qt || 0) + dt * (inRef(o.x, o.y) ? Q_VIEW : 1)) > (o.ql || (o.ql = rnd(Q_LIFE * .7, Q_LIFE * 1.3))) && !this.inHand(o)) o.fade = 1;
      if (ep4 && SM[o.sp].kind === 'quark' && !(o.rep > 0) && !(o.pull > 0)) this.drift4(o, dt);
      if (!o.cap) {
        // магнитное поле камеры закручивает заряженные следы (античастицы — в другую сторону)
        const q = SM[o.sp].q;
        if (q && !this.isQ(o) && !(o.rep > 0) && !(o.pull > 0)) {
          const w = .5 * q * (o.anti ? -1 : 1) * dt, c = Math.cos(w), s = Math.sin(w), x = o.dx;
          o.dx = x * c - o.dy * s; o.dy = x * s + o.dy * c;
        }
        const v = this.speed(o); // глюон безмассовый — и в вихре не вязнет
        o.x += o.dx * v * dt; o.y += o.dy * v * dt;
      }
      if (o.trail) {
        const tl = o.trail, l = tl[tl.length - 1];
        if (!l || (o.x - l[0]) ** 2 + (o.y - l[1]) ** 2 > .0064) { tl.push([o.x, o.y]); if (tl.length > 22) tl.shift(); }
      }
      if (this.hig > .5 && o.life < Infinity) { o.age += dt; if (o.age > o.life) { this.decay(o); continue; } }
      if (!act) continue;
      const ox = o.x - P.x, oy = o.y - P.y, d = Math.hypot(ox, oy);
      if (o.rep > 0 && d > refRadius() + .5) { o.dead = true; this.ejected++; continue; }
      if (d > WR && !o.cap) {
        o.x = P.x - ox * .95; o.y = P.y - oy * .95; o.born = 0; o.vis = 0; if (o.trail) o.trail = [];
        const w = rnd(-.6, .6), c = Math.cos(w), s = Math.sin(w), x = o.dx; o.dx = x * c - o.dy * s; o.dy = x * s + o.dy * c; // не по той же линии
      }
      if (ep4 && !this.advanced && (o.sp === 'u' || o.sp === 'd') && d < this.coreR() * (o.anti ? .55 : .75)) this.store(o);
      if (o.sp === 'ph' && this.ep !== 3 && G.started && this.enOn() && !this.focus && d < this.hr() && !o.cap && !(o.flung > 0) && o.born > .5 && o.cd <= 0) this.absorb(o);
      if (ep4 && o.sp === 'g' && !this.advanced && d < this.coreR() * .9 && o.born > .5) this.recolor(o);
    }
    if (act) {
      // сталкивает только поле: квант встречает своего напарника — или, брошенный рогаткой, любой встречный квант
      for (const o of this.p) {
        if (o.dead || !(o.flung > 0)) continue;
        const t = o.mate;
        if (t && !t.dead && (t.x - o.x) ** 2 + (t.y - o.y) ** 2 < HIT_R * HIT_R) { this.smash(o, t); continue; }
        if (!o.thrown) continue;
        for (const q of this.p) {
          if (q === o || q === o.sib || q.dead || q.cap || q.thrown || q.cd > 0 || q.born < .5) continue;
          if (this.isQ(o) ? !this.isQ(q) : !this.antiPair(o, q)) continue; // брошенная частица бьёт только свою античастицу
          if ((q.x - o.x) ** 2 + (q.y - o.y) ** 2 < THROW_R * THROW_R) {
            // бросок: каждый квант пары несёт заряд и бьёт сам — два удара за один заряд (лоб в лоб — один)
            const sib = o.sib, x = (o.x + q.x) / 2, y = (o.y + q.y) / 2;
            if (this.smash(o, q)) { this.st.thr++; o.thrHit = true; if (sib && sib.thrHit) { this.st.thr2 = (this.st.thr2 || 0) + 1; this.float(x, y - .3, 'бросок: второй удар за тот же заряд', GOLD, 14); } }
            this.learn.hit = true; break;
          }
        }
      }
      if (!this.full && this.enOn() && this.en >= E_CAP) this.full = true;
      this.spontaneous(dt);
      this.attractE(dt);
      if (this.ep === 3 && !this.advanced) this.annihilateAll(); else if (this.ep < 3) this.annihilateMet();
      if (!this.advanced) this.populate(dt);
      this.checkGoals(); if (!this.epDone || this.ep === 3) this.tickStars(false); this.reveal(); this.tickChapter();
      if (!this.advanced && this.ep === 3 && this.T < T_END4) {
        // аннигиляция догорает: антивещество вспыхивает, неспасённое гаснет; в детекторе — только твои кварки.
        // Цель не выполнена (Вселенная остыла раньше) — сбережённое всё равно уходит дальше, но без бонуса уровня
        this.failed = !this.epDone;
        this.advanced = true; this.release(); this.holding = false; this.finale = this.failed ? 2.4 : 1.6; this.tickStars(true);
        if (this.failed) this.float(P.x, P.y - this.hr() - 1.1, 'Остывание: цель не выполнена, сбережённое — дальше', [255, 170, 140], 15);
        for (const o of this.p) {
          if (o.anti && SM[o.sp].kind === 'quark') fxFlash(o.x, o.y, .5, [255, 255, 255], .4);
          o.fade = rnd(.6, 1.2);
        }
        this.float(P.x, P.y - this.hr() - .4, `◉ ${this.stock}`, [140, 235, 170], 18);
      }
      if (this.finale > 0 && (this.finale -= dt0) <= 0) { this.finale = -1; this.endLevel(); } // итоги — сбоку, без паузы
    }
    this.p = this.p.filter(o => !o.dead);
    // предел частиц: гасим старейшие свободные — взятое полем, летящее в паре и брошенное не трогаем
    if (this.p.length > 260) {
      let extra = this.p.length - 260;
      for (const o of this.p) { if (extra <= 0) break; if (!o.cap && !o.mate && !(o.flung > 0) && !(o.mine > 0)) { o.dead = true; extra--; } }
      this.p = this.p.filter(o => !o.dead);
    }
  },
  // Сбережённые кварки — ровно те, что кружат в детекторе, — переходят на уровень адронов: детектор
  // раскрывается, и они вырываются наружу с того места, где кружили. Новых не появляется.
  /** @param {number} i */
  stockPos(i) {
    const a = G.T * 1.2 + i / this.stock * TAU, rr = this.coreR() * (.35 + .1 * (i % 2));
    return { x: P.x + Math.cos(a) * rr, y: P.y + Math.sin(a) * rr, a, rr };
  },
  endLevel() {
    const list = this.stockQ.map((s, i) => {
      const p = this.stockPos(i), out = rnd(2.6, 3.6), tan = p.rr * 1.2;
      return { x: p.x, y: p.y, vx: Math.cos(p.a) * out - Math.sin(p.a) * tan, vy: Math.sin(p.a) * out + Math.cos(p.a) * tan, fl: s.fl, col: s.col };
    });
    // и тройки, сбережённые самой Вселенной, — там же, где кружили
    for (const t of this.safe) t.q.forEach((fl, c) => {
      const p = this.safePos(t, c), out = rnd(1.2, 2);
      list.push({ x: p.x, y: p.y, vx: Math.cos(p.a) * out, vy: Math.sin(p.a) * out, fl, col: c });
    });
    // выкованное кузницей — тоже материал «Адронов»: вырывается из детектора вместе со сбережённым
    this.forgedQ.forEach((fl, i) => { const a = Math.random() * TAU, out = rnd(2.2, 3.4); list.push({ x: P.x + Math.cos(a) * .3, y: P.y + Math.sin(a) * .3, vx: Math.cos(a) * out, vy: Math.sin(a) * out, fl, col: i % 3 }); });
    this.handoff = list;
    this.stockOut = true;
    fxFlash(P.x, P.y, this.hr(), [255, 255, 255], .5); fxRing(P.x, P.y, this.hr() * .5, [140, 235, 170], this.hr() * 3, .9);
    advance();
  },
  // Вселенная сберегла тройку: R·G·B кружит вокруг детектора, антикварки её не трогают (асимметрия — вещества больше)
  addSafe() {
    const k = this.safe.length;
    this.safe.push({ a: Math.random() * TAU, r: this.hr() * (1.5 + .3 * (k % 4)) + rnd(0, .15), w: rnd(.12, .2) * (k % 2 ? -1 : 1), t0: G.T, q: Math.random() < .5 ? ['u', 'u', 'd'] : ['u', 'd', 'd'] });
    const p = this.safePos(this.safe[k]);
    fxRing(p.x, p.y, .1, [140, 235, 170], .9, .6); fxFlash(p.x, p.y, .4, [200, 255, 220], .25);
    Uni.pay(this, 'cp', 2); this.float(p.x, p.y - .35, '⚖ R·G·B +2 ✦', [140, 235, 170], 13); Sfx.play('pop');
  },
  // центр сбережённой тройки (c — один из кварков: вершина маленького треугольника)
  /** @param {Safe} t @param {number} [c] */
  safePos(t, c) {
    const a = t.a + t.w * G.T, x = P.x + Math.cos(a) * t.r, y = P.y + Math.sin(a) * t.r;
    if (c == null) return { x, y, a };
    const b = G.T * 2.2 + c * TAU / 3; return { x: x + Math.cos(b) * .16, y: y + Math.sin(b) * .16, a };
  },
  // Итоги уровня для ненавязчивого экрана между уровнями
  /** @returns {TallyData} */
  tally() {
    const hand = baryonTrios(this.stockQ), auto = this.safe.length;
    const hr = this.heatRes;
    /** @type {TallyData['rows']} */
    const heat = hr ? [['🔥 разогрев', `${hr.T0} ГэВ${hr.rec ? ' · рекорд' : ` · #${hr.place + 1}`}`]] : [];
    return { name: 'Частицы', rows: [['⏱ уровень', fmtClock(this.t)], ...heat, ['✦ добыто', Math.round(this.kn)], ['тройки вручную', hand], ['тройки от Вселенной', auto]], auto: [auto, hand + auto], stars: this.stars };
  },
  // Эпоха 4: кварки почти остановились (упрощение), антикварки ищут вещество — свободное или в детекторе
  /** @param {Q} o @param {number} dt */
  drift4(o, dt) {
    if (!o.anti) { o.v = .22; return; }
    /** @type {number | null} */
    let tx = null, ty = null, best = o.wave ? 1.2 : 4; // волна идёт на детектор, по дороге ест только то, что совсем рядом
    if (o.wave) { tx = P.x; ty = P.y; }
    for (const t of this.p) {
      if (t.dead || t.anti || t.sp !== o.sp) continue;
      const d = Math.hypot(t.x - o.x, t.y - o.y); if (d < best) { best = d; tx = t.x; ty = t.y; }
    }
    if (this.stock > 0 && !o.wave) { const d = Math.hypot(P.x - o.x, P.y - o.y); if (d < 6 && d < best + 1.5) { tx = P.x; ty = P.y; } }
    o.v = o.wave ? 1.15 : tx === null ? .22 : .45;
    if (tx === null || ty === null) return;
    const d = Math.hypot(tx - o.x, ty - o.y) || 1, k = Math.min(1, dt * 2.5);
    const nx = o.dx + ((tx - o.x) / d - o.dx) * k, ny = o.dy + ((ty - o.y) / d - o.dy) * k, l = Math.hypot(nx, ny) || 1;
    o.dx = nx / l; o.dy = ny / l;
  },
  // Поле Хиггса застывает: от детектора расходится золотая решётка (потом гаснет),
  // а всплески поля рождают бозоны Хиггса
  higgsOn() {
    this.higT = 0; this.higC = { x: P.x, y: P.y }; this.ripCd = 1.5; Sfx.play('freeze');
    fxRing(P.x, P.y, .5, GOLD, this.wr() * 1.2, 4);
  },
  /** @param {number} dt @param {boolean} live */
  tickRipples(dt, live) {
    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter(r => r.t < 1.8);
    if (!live || this.ep !== 1 || this.higT < 0 || (this.ripCd -= dt) > 0) return;
    // всплески поля рождают H, только когда это исследовано: Вселенная умеет лишь то, что игрок создал сам
    if (!Codex.auto.has('H')) return;
    this.ripCd = 5;
    const a = Math.random() * TAU, d = rnd(this.hr() + .8, refRadius() * .5);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    this.ripples.push({ x, y, t: 0 });
    const h = this.mk('H', false, x, y, Math.random() * TAU, rnd(5, 25)); h.life = rnd(4, 8);
  },

  // ---------- эпохи ----------
  /** @param {number} i */
  startEpoch(i) {
    this.release();
    this.ep = i; this.epDone = false; this.epT = 0; this.ff = 1; this.hot = []; this.hotCd = 4; if (i === 3) { this.hz = []; this.cz = []; }
    this.epClock = 0; this.epKn0 = this.kn; this.doneAt = null;
    this.newEpochState(i);
    if (i === 1) this.higgsOn();
    if (i === 2) this.need2 = this.reachNeed2();
    if (i === 3) {
      this.wave = { n: 0, cd: 8, dir: null, cur: null };
      let ng = 0; for (const o of this.p) if (o.sp === 'g' && ++ng > G_MAX4) o.fade = 1; // глюоны прошлых эпох уходят
      // остатки Вселенной: кварки и антикварки почти поровну — с небольшим перевесом вещества
      for (const o of this.p) if (!this.isQ(o)) o.fade = 1;
      for (let k = 0; k < 9; k++) { const [x, y] = this.randPos(false); this.pair(pick(['u', 'd']), x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5); }
      for (let k = 0; k < 4; k++) { const [x, y] = this.randPos(false); this.mk(pick(['u', 'd']), false, x, y, Math.random() * TAU, rnd(.1, .4)); }
      // запас: u и d, что Вселенная накопила за прошлые эпохи, сразу в детекторе — цвета поровну, чтобы сложились тройки
      // сверх UD_MAX — выкованное кузницей: в детектор не ложится (задание эпохи — твоё), уходит прямо в «Адроны»
      this.forgedQ = this.udRes.slice(UD_MAX); this.udRes = this.udRes.slice(0, UD_MAX);
      if (this.forgedQ.length) msg(`Кузница: ещё ${this.forgedQ.length} ◉ из распадов тяжёлых поколений ждут в «Адронах»`, 4);
      if (this.udRes.length) {
        let u = this.udRes.filter(f => f === 'u').length, d = this.udRes.length - u;
        const order = [];
        while (u >= 1 && d >= 1 && u + d >= 3) { if (u >= d) { order.push('u', 'u', 'd'); u -= 2; d--; } else { order.push('u', 'd', 'd'); u--; d -= 2; } }
        order.push(...Array(u).fill('u'), ...Array(d).fill('d'));
        order.forEach((fl, i) => { this.stockQ.push({ fl, col: i % 3 }); this.stock++; });
        fxRing(P.x, P.y, this.hr() * .3, [140, 235, 170], this.hr() * 1.6, .8);
        this.float(P.x, P.y - this.hr() - .3, `запас Вселенной: +${this.udRes.length} ◉`, [140, 235, 170], 16);
        this.udRes = [];
      }
    }
  },
  // Итоги эпохи — сбоку, игру не останавливают (Tally.note)
  showResult() {
    const i = this.ep, pts = Math.round(this.kn - this.epKn0), t = this.doneAt;
    const par = PAR[i], bonus = t === null || !par ? 0 : Math.max(0, Math.round((par - t) * 2)), total = pts + bonus, won = starsWon(this.stars);
    this.lvlTotal += total; addScore(bonus * 10);
    const place = this.cheated ? null : LB.add('e' + i, { n: LB.name(), s: total, p: pts, t: t === null ? null : Math.floor(t), d: Date.now() }).place;
    Tally.note(`ЭПОХА ${i + 1} · ВЫПОЛНЕНА`, EPOCHS[i].name, [['⏱ эпоха', fmtClock(t)], ['✦ добыто', pts], ...(par ? [/** @type {[string, string, string]} */ ([`быстрее ${fmtClock(par)}`, '+' + bonus, 'tb'])] : []), ['итог', total, 'tl']],
      this.stars, place, '');
    Sfx.play('segment');
  },
  // Цели эпохи распадов, которые ещё можно выполнить: не созданное игроком и слишком тяжёлое для поля на холодном
  // конце эпохи (t: 173 ГэВ при T ≈ 3 ГэВ) Вселенная за него не родит — такую цель меняем на другое звено цепочек
  /** @returns {string[]} */
  reachNeed2() {
    // уже снятый распад — не задание: иначе эпоха закрылась бы в первом же кадре
    const ok = (/** @type {string} */ sp) => (Codex.has(sp) || SM[sp].m <= EPOCHS[2].floor * this.up('pow')) && !this.decSeen.has(sp);
    const keep = this.need2.filter(ok), spare = CHAINS.flat().filter(sp => ok(sp) && !keep.includes(sp));
    while (keep.length < this.need2.length && spare.length) keep.push(/** @type {string} */ (spare.shift()));
    return keep.sort((a, b) => (SM[a].gen ?? 0) - (SM[b].gen ?? 0));
  },
  // Горячая точка: мерцающее кольцо, через 1,6 с там рождается нужная тяжёлая частица
  hotTarget() {
    // эпоха 3: тяжёлое у горячей точки рождает Вселенная — только то, что игрок уже создал сам (есть в кодексе):
    // если исследовано «X сам», если руками его уже не сделать (порог выше максимума поля) или распад долго не выходит.
    // Не созданное игроком Вселенная не рождает — даже закрытое поколение открывает только он.
    if (this.ep === 2) for (const sp of this.need2) {
      if (this.decSeen.has(sp) || !genOpen(sp) || !Codex.has(sp)) continue;
      if (Codex.auto.has(sp) || 2 * this.mThr(sp) > this.Emax() || this.epT > 45) return sp;
    }
    return null;
  },
  /** @param {number} dt */
  tickHot(dt) {
    for (const h of this.hot) {
      h.t += dt;
      if (h.t >= 1.6 && !h.done) {
        h.done = true;
        const m = SM[h.sp].m, pe = m * .25;
        const made = h.sp === 'W' || Math.random() < .5 ? this.pair(h.sp, h.x, h.y, pe) : [this.mk(h.sp, false, h.x, h.y, Math.random() * TAU, pe)];
        for (const o of made) { o.born = 1; o.age = 0; o.life = Math.max(o.life, (SM[h.sp].life || 0) * .6); }
        fxFlash(h.x, h.y, 1, [255, 200, 120], .4);
      }
    }
    this.hot = this.hot.filter(h => h.t < 2.2);
    const sp = this.hotTarget();
    if (!sp || this.hot.length) return;
    // не плодим новых, пока в мире есть частица (или свежий след), чей распад мы ждём
    if (this.p.some(o => !o.dead && o.sp === sp) || this.tracks.some(tr => tr.parent === sp && !tr.rec)) { this.hotCd = Math.max(this.hotCd, 1.5); return; }
    if ((this.hotCd -= dt) > 0) return;
    this.hotCd = 5;
    const a = Math.random() * TAU, d = rnd(this.hr() + 1.2, viewRadius() * .6);
    this.hot.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, t: 0, sp });
  },
  // ---------- горячие области ----------
  // сколько горячих областей держит мир: третий уровень закона «Свет» — вдвое больше
  hzN() { return HZ_N * (this.rs.ph >= 2 ? 2 : 1); },
  hzOn() { return this.ep < 3 && (this.lit || this.ep > 0); },
  // сила области: разгорается HZ_IN с, остывает последние 3 с
  /** @param {HotZone} z */
  hzK(z) { return clamp(Math.min(z.t / HZ_IN, (z.L - z.t) / 3), 0, 1); },
  // насколько горячо в точке: 0 — нигде, 1 — в центре разгоревшейся
  /** @param {number} x @param {number} y */
  hzAt(x, y) { return this.zAt(this.hz, x, y); },
  /** @param {number} x @param {number} y */
  czAt(x, y) { return this.zAt(this.cz, x, y); },
  /** @param {HotZone[]} L @param {number} x @param {number} y */
  zAt(L, x, y) {
    let h = 0;
    for (const z of L) { const d = Math.hypot(x - z.x, y - z.y); if (d < z.r) h = Math.max(h, this.hzK(z) * (1 - .5 * (d / z.r) ** 2)); }
    return h;
  },
  // случайная точка в разгоревшейся области (из тех, что в мире вокруг) или null
  /** @returns {[number, number] | null} */
  hzPos() { return this.zPos(this.hz); },
  /** @returns {[number, number] | null} */
  czPos() { return this.zPos(this.cz); },
  /** @param {HotZone[]} Z @returns {[number, number] | null} */
  zPos(Z) {
    const L = Z.filter(z => this.hzK(z) > .5 && Math.hypot(z.x - P.x, z.y - P.y) < this.wr());
    if (!L.length) return null;
    const z = pick(L), a = Math.random() * TAU, d = Math.sqrt(Math.random()) * z.r * .9;
    return [z.x + Math.cos(a) * d, z.y + Math.sin(a) * d];
  },
  czOn() { return this.ep < 3 && this.rs.g > 0 && !Uni.off(this, 'g'); },
  // Цветные вихри: зеркало горячих — живут и остывают так же, но испускают глюоны
  /** @param {number} dt */
  tickCz(dt) {
    if (!this.czOn()) { this.cz = []; return; }
    for (const z of this.cz) z.t += dt;
    this.cz = this.cz.filter(z => z.t < z.L && Math.hypot(z.x - P.x, z.y - P.y) < this.wr() * 1.6);
    if (this.cz.some(z => this.hzK(z) > .5 && onScreen(...W2S(z.x, z.y), 0))) Hint.once('cz', 'цветной вихрь: глюонное поле плотнее — здесь рождаются глюоны', () => {
      const z = this.cz.find(q => onScreen(...W2S(q.x, q.y), 0)); if (!z) return null;
      const [x, y] = W2S(z.x, z.y); return [x, y + z.r * cam.z * .6, 1];
    });
    const emit = !this.advanced && this.qKinds().includes('g') && !this.qFull();
    for (const z of this.cz) {
      if (!emit || Math.hypot(z.x - P.x, z.y - P.y) > this.wr()) continue;
      z.em = (z.em || 0) + dt * CZ_RATE * this.hzK(z);
      for (; z.em >= 1; z.em--) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * z.r * .8; this.spawnQuantum(true, [z.x + Math.cos(a) * d, z.y + Math.sin(a) * d], false, 'g'); }
    }
    if (this.cz.length >= CZ_N || (this.czCd -= dt * (this.cz.length ? 1 : 3)) > 0) return;
    this.czCd = rnd(4, 8);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * TAU, d = this.czSeen ? rnd(viewRadius() * .9, this.wr() * .95) : viewRadius() * .7;
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if ([...this.hz, ...this.cz].some(z => Math.hypot(z.x - x, z.y - y) < HZ_R * 3)) continue;
      this.cz.push({ x, y, r: HZ_R, t: 0, L: rnd(HZ_L * .8, HZ_L * 1.2) }); this.czSeen = true; return;
    }
  },
  /** @param {number} dt */
  tickHz(dt) {
    if (!this.hzOn()) { this.hz = []; return; }
    for (const z of this.hz) z.t += dt;
    this.hz = this.hz.filter(z => z.t < z.L && Math.hypot(z.x - P.x, z.y - P.y) < this.wr() * 1.6); // уехал далеко — та остыла
    const z0 = this.hz.find(z => this.hzK(z) > .5 && onScreen(...W2S(z.x, z.y), 0));
    if (z0) Hint.once('hz', 'горячо: свет гуще и жёстче, удар набирается быстрее', () => {
      const z = this.hz.find(q => onScreen(...W2S(q.x, q.y), 0)); if (!z) return null;
      const [x, y] = W2S(z.x, z.y); return [x, y + z.r * cam.z * .6, 1];
    });
    // область кипит: испускает кванты (в эпоху 1 — только когда свет Вселенной включён: иначе это и был бы закон даром)
    const emit = !this.advanced && (this.ep > 0 || (this.rs.ph > 0 && !Uni.off(this, 'ph'))) && !this.qFull();
    for (const z of this.hz) {
      if (!emit || Math.hypot(z.x - P.x, z.y - P.y) > this.wr()) continue;
      z.em = (z.em || 0) + dt * HZ_RATE * this.hzK(z) * (this.ep > 0 ? 1 : HZ_EP0); // в эпоху 1 — слабее (областей и так вдвое больше со «Светом» II) «Свет»
      for (; z.em >= 1; z.em--) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * z.r * .8; this.spawnQuantum(true, [z.x + Math.cos(a) * d, z.y + Math.sin(a) * d], true, 'ph'); }
    }
    if (this.hz.length >= this.hzN() || (this.hzCd -= dt * (this.hz.length ? 1 : 3)) > 0) return; // ни одной — новая вспыхивает скорее: свет рождается в них
    this.hzCd = rnd(4, 8);
    for (let i = 0; i < 10; i++) {
      // первая — у края кадра, чтобы её заметили; дальше — в мире вокруг, за кадром
      const a = Math.random() * TAU, d = this.hzSeen ? rnd(viewRadius() * .9, this.wr() * .95) : viewRadius() * .7;
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if ([...this.hz, ...this.cz].some(z => Math.hypot(z.x - x, z.y - y) < HZ_R * 3)) continue;
      this.hz.push({ x, y, r: HZ_R, t: 0, L: rnd(HZ_L * .8, HZ_L * 1.2) }); this.hzSeen = true; return;
    }
  },
  coreR() { return Math.min(this.hr(), CORE_R); },
  // Волна антивещества: предупреждение (стрелка и дуга с той стороны), потом 4–8 антикварков летят на детектор.
  // Ни один не добрался до ядра — волна отбита (+5 ✦).
  /** @param {number} dt */
  tickWave(dt) {
    const W = this.wave; if (!W) return;
    if (W.cur) {
      const C = W.cur; C.list = C.list.filter(o => !o.dead); C.t += dt;
      if (C.list.length && C.t < 16) return;
      const lost = this.st.eaten - C.eaten0;
      if (!lost) { this.kn += 5; this.st.waves++; Sfx.play('goal'); this.float(P.x, P.y - this.hr() - .5, `волна ${W.n} отбита ✓ +5 ✦`, [140, 235, 170], 16); }
      else this.float(P.x, P.y - this.hr() - .5, `волна ${W.n} прорвалась: −${lost} ◉`, [255, 130, 130], 15);
      W.cur = null; W.cd = WAVE_CD;
      return;
    }
    if (W.dir == null) W.dir = Math.random() * TAU;
    if ((W.cd -= dt) > 0) return;
    W.n++;
    const N = Math.min(8, 3 + W.n), list = [];
    for (let k = 0; k < N; k++) {
      const a = W.dir + rnd(-.4, .4), d = Math.min(viewRadius() * rnd(1, 1.3), this.wr() - .3); // дальше края мира — перенесло бы на ту сторону
      const o = this.mk(pick(['u', 'd']), true, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, a + Math.PI, rnd(.1, .3));
      o.wave = true; o.cd = 1.5; o.born = 1; list.push(o);
    }
    W.cur = { list, t: 0, eaten0: this.st.eaten }; W.dir = null;
    Sfx.play('fizzle');
  },
  waveWarn() { const W = this.wave; return W && !W.cur && W.dir != null && W.cd < WAVE_WARN && this.ep === 3 && !this.advanced; },
  // Отпустил щит — ударная волна: антикварки в поле отлетают прочь (за край кадра — уходят совсем)
  shieldPulse() {
    const R = this.fr() * 1.4; let n = 0;
    for (const o of this.p) {
      if (o.dead || !o.anti || SM[o.sp].kind !== 'quark') continue;
      const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy);
      if (d > R || d < 1e-3) continue;
      o.dx = dx / d; o.dy = dy / d; o.v = 4.5; o.rep = 1.8; n++;
    }
    this.shield = Math.max(0, this.shield - .2);
    fxRing(P.x, P.y, this.hr() * .5, SHIELD_C, R, .45); Sfx.play('throw');
    if (n) { this.learn.pulse = true; this.float(P.x, P.y - this.hr() - .3, `удар щита ×${n}`, SHIELD_C, 15); }
  },
  // Эпоха 4: из-за края приходят остатки — пары и редкие лишние кварки вещества
  /** @param {number} dt */
  soup(dt) {
    if ((this.soupCd -= dt) > 0) return;
    this.soupCd = 1.3;
    const n = this.p.filter(o => !o.dead && !this.isQ(o)).length;
    if (n > 34) return;
    // часть пар рождается прямо рядом с детектором (кванты ещё рождают кварки) — успей забрать кварк, пока
    // антикварк его не нашёл; остальное приходит издалека
    const near = Math.random() < .45, a = Math.random() * TAU, sp = pick(['u', 'd']);
    const d = near ? rnd(this.hr() * 1.5, this.hr() + 1.6) : rnd(this.hr() + 2, viewRadius() * .95);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (near) {
      // пару рождает глюон: кварк получает его цвет, антикварк — антицвет
      const c = Math.random() * 3 | 0, c2 = (c + 1 + (Math.random() * 2 | 0)) % 3;
      this.pair(sp, x, y, rnd(.15, .35), c, c2).forEach(o => o.cd = 2.5);
      fxRing(x, y, .05, [255, 245, 220], .5, .45); fxFlash(x, y, .35, [255, 245, 220], .25);
    } else if (Math.random() < .68) this.pair(sp, x, y, rnd(.1, .4)).forEach(o => o.cd = 2.5);
    else this.mk(sp, false, x, y, Math.atan2(P.y - y, P.x - x) + rnd(-.8, .8), rnd(.1, .4));
  },
  // Эпоха 4: вещество и антивещество аннигилируют повсюду, а не только в детекторе
  annihilateAll() {
    const f = this.p.filter(o => !o.dead && !this.isQ(o) && o.cd <= 0 && SM[o.sp].kind === 'quark');
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const a = f[i], b = f[j];
      if (a.dead || b.dead || a.sp !== b.sp || a.anti === b.anti) continue;
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < .3) { this.annihilate(a, b, true); this.annN = (this.annN || 0) + 1; }
    }
  },
  // Эпоха 4: глюон в детекторе перекрашивает кварк — антицвет глюона гасит цвет кварка, кварк получает цвет глюона
  // (обмен цветом — то, чем держится сильное взаимодействие). Нет кварка такого цвета — глюон пролетает.
  /** @param {Q} g */
  recolor(g) {
    const c2 = /** @type {number} */ (g.col2); // у глюона антицвет есть всегда
    const i = this.stockQ.findIndex(s => s.col === c2); if (i < 0 || g.col === c2) return false;
    const was = this.colCnt(), good = was[g.col] < was[c2];
    this.stockQ[i].col = g.col; g.dead = true; this.st.recol++; this.learn.recol = true;
    fxRing(P.x, P.y, this.hr() * .3, QCOL[g.col], this.hr() * 1.3, .6);
    this.float(P.x, P.y - this.hr() - .2, `глюон: ${COL_N[c2]} → ${COL_N[g.col]}`, good ? GOLD : QCOL[g.col], 14);
    Sfx.play(good ? 'recolor' : 'pop');
    return true;
  },
  // глюон, который выровняет цвета: заберёт лишний цвет и даст недостающий
  /** @param {Q} g */
  helpGlu(g) { const c = this.colCnt(), c2 = /** @type {number} */ (g.col2); return c[c2] > 0 && c[g.col] < c[c2] && c[g.col] === Math.min(...c); },
  /** @param {Q} o */
  store(o) {
    o.dead = true;
    if (!o.anti) {
      this.stock++; this.stockQ.push({ fl: o.sp, col: o.col });
      this.float(P.x, P.y, '+1 ◉', [140, 235, 170], 14);
    } else if (this.stockQ.some(s => s.fl === o.sp)) { // антикварк гасит только кварк своего аромата: d̄ — d, ū — u
      this.stock--;
      const i = this.stockQ.map(s => s.fl).lastIndexOf(o.sp); this.stockQ.splice(i, 1);
      fxFlash(P.x, P.y, this.hr(), [255, 120, 120], .5);
      this.float(P.x, P.y, '−1 ◉', [255, 130, 130], 15); this.st.eaten++;
    } else fxFlash(P.x, P.y, .6, [255, 255, 255], .3);
  },
  // Сколько пройдено в уровне частиц (0..1) — для шкалы внизу: пролог — по времени жизни поля, дальше — по шагам эпох
  progress() {
    if (this.stockOut) return 1;
    const sd = () => { const s = this.steps(); return s.length ? s.filter(g => g.d).length / s.length : 0; };
    const pre = Math.min(1, this.inf.t / INF.life);
    const e = this.epDone ? 1 : this.ep === 0 ? (this.lit ? .2 + .8 * sd() : .2 * pre) : sd();
    return Math.min(1, (this.ep + e) / EPOCHS.length);
  },
  // ---------- задание эпохи: шаги крупно под часами ----------
  // Цели меняются от забега к забегу: в эпохе 1 — какие частицы открыть, в эпохе 3 — чьи распады снять.
  /** @returns {Step[]} */
  steps() {
    if (this.school) return this.schoolSteps();
    const has = (/** @type {string} */ sp) => Codex.has(sp), sym = (/** @type {string} */ sp) => SM[sp].sym, touch = isTouch();
    const buy = (/** @type {string} */ sp) => touch || !this.learn.buy ? 'кнопкой «Сформировать закон» внизу' : `за ✦, клавиша ${this.keyOf(sp) || '?'}`, tap = touch ? 'нажать ◉' : 'кликнуть';
    const next0 = this.need0.find(sp => !has(sp));
    /** @type {Rx} */
    const G4 = { l: [['γ', 'boson'], ['γ', 'boson']], r: [['u', 'quark'], ['u̅', 'quark'], ['g', 'boson']], k: LV_N };
    switch (this.ep) {
      case 0: return [
        { t: 'Создать свет', h: 'раскачать поле рогаткой: оттянуть против хода шарика, отпустить у дна — толчок по ходу раскачивает. Чем сильнее размах, тем жёстче свет. Генерация света — только созданного здесь: не создал жёсткий — он будет лишь редким тепловым хвостом', items: PH_CLS.map((c, i) => [c.n, this.inf.made[i] > 0]), s: `создано классов света: ${this.madeCls().length} · ${fmtGeV(this.T0)}`, d: this.lit, ch: 1 },
        // глава 2 — свет: поймать (измерить) и запасти энергию; ✦ копятся, лавки ещё нет
        { t: 'Измерить свет', h: 'ловить фотоны кругом, кликать не нужно: пойманный фотон измерен и даёт энергию ⚡. Нужен каждый созданный класс', items: this.madeCls().map(c => [PH_CLS[c].n, this.phSeen.has(c)]), s: 'свет измерен', d: this.measured(), ch: 2 },
        { t: 'Наполнить шкалу энергии ⚡', h: `свет — это энергия: шкала ⚡ — под кругом, ${E_CAP} делений. Удар стоит 1–${LV_N} ⚡. Света мало — он кончается: ищи его по кадру`, p: [this.full ? E_CAP : Math.floor(this.en), E_CAP], s: 'энергия запасена', d: this.full, ch: 2 },
        // глава 3 — первый удар: из энергии — вещество
        { t: 'Столкнуть два фотона на 1 ⚡: генерация электрона', h: 'зажать у двух фотонов и сразу отпустить: взял пару — уже 1 ⚡. Чем дольше держать, тем сильнее удар', s: 'первое столкновение', d: this.pairs > 0, rx: this.rxOf('e'), ch: 3 },
        { t: 'Снять электрон', h: `навести круг на e⁻ и ${tap}: снимок. Электрон и позитрон — частица и античастица: встретятся — снова станут светом`, s: 'электрон открыт', d: has('e'), ch: 3 },
        // глава 4 — закон: свет кончается, знания ✦ — закону
        { t: 'Сформировать закон света', h: `свет кончается: ты его ешь. Знания ✦ — за измерения и снимки — отдать ${buy('ph')}: Вселенная будет светить сама`, s: 'генерация света', d: this.rs.ph > 0, res: 'ph', ch: 4 },
        { t: 'Столкнуть два фотона в полную силу: генерация глюона', h: `выйдут три струи: кварк, антикварк и глюон. Снимок: ${tap} по глюону`, s: 'глюон создан', d: has('g'), rx: G4, ch: 5 },
        { t: 'Сформировать закон глюонов', h: `знания ✦ отдать ${buy('g')}: мир наполнится глюонами`, s: 'глюоны в мире', d: this.rs.g > 0, res: 'g', ch: 5 },
        { t: next0 ? this.howTo(next0) : 'Открыть первое поколение', h: `затем ${tap} по новой частице: снимок. Из первого поколения сделано всё вокруг`,
          items: this.need0.map(sp => [sym(sp), has(sp)]), s: 'частицы открыты', d: this.need0.every(has), rx: next0 ? this.rxOf(next0) : undefined, ch: 6 },
      ];
      case 1: return [
        { t: 'Поле Хиггса застывает', h: 'частицы тяжелеют и замедляются: у них появляется масса. Часы эпохи пока стоят', s: 'у частиц есть масса', d: this.hig >= 1 },
        { t: 'Столкнуть два глюона в полную силу: генерация бозона Хиггса', h: `затем ${tap} по нему: снимок`, s: 'бозон Хиггса', d: has('H'), rx: { l: [['g', 'boson'], ['g', 'boson']], r: [['H', 'boson']], k: LV_N } },
        { t: 'Удержать вещество', h: 'с массой его можно поймать: создать пару столкновением и взять полем частицу и её античастицу', s: 'вещество в поле', d: !!this.learn.pair2 },
        { t: 'Столкнуть частицу с её античастицей: генерация Z', h: 'отпустить, когда шкала в золотой полосе, и сделать снимок', s: 'Z открыт', d: has('Z'), rx: { l: [['e⁻', 'lepton'], ['e⁺', 'lepton']], r: [['Z', 'boson']], k: 0 } },
      ];
      // Эпоха 3: золотой плашки «для задания» у законов нет (второе ревью №7c) — покупка здесь никогда не обязательна:
      // руками распад достижим (недостижимое и не созданное reachNeed2 заменяет), а созданное, но уже слишком тяжёлое
      // для удара (2m > удар в полную силу) горячая точка рождает и без закона (hotTarget). Закон лишь ускоряет — он в лавке
      // со строкой «сразу: горячая точка родит …», а шаг называет его как вариант.
      case 2: return this.need2.map(sp => {
        const pre = genOpen(sp) ? null : genNeed(sp)[0], mk = pre || (Codex.auto.has(sp) ? null : sp);
        return { t: `Снять распад ${sym(sp)}`, h: pre ? `сначала ${this.howTo(pre).toLowerCase()}. Поколения открываются по порядку`
          : Codex.auto.has(sp) ? `Генерация ${sym(sp)} у горячей точки. Снимок: ${tap} по золотой вершине, где он распадётся`
          : `${this.howTo(sp)}, затем ${tap} по золотой вершине, где он распадётся. Или ${this.rs[sp] ? `включить закон ${this.lawName(sp)} справа` : `сформировать закон: ${this.ladder(sp)} (горячая точка родит его сразу)`}`,
          s: `распад ${sym(sp)}`, d: this.decSeen.has(sp), res: null, rx: mk ? this.taskRx(mk) : undefined };
      });
      default: {
        const t = baryonTrios(this.stockQ);
        const a = this.safe.length;
        return [{ t: `Собрать ${TRIO_GOAL} ${TRIO_W} R·G·B`, h: 'ловить кварки недостающего цвета; глюон в золотом кольце перекрасит лишний: зажать рядом, щит его втянет', p: [Math.min(t, TRIO_GOAL), TRIO_GOAL], s: `${TRIO_GOAL} ${TRIO_W}`, d: t >= TRIO_GOAL },
          { t: 'Сформировать закон сбережения вещества', h: this.rs.cp ? 'Сбережение троек: они зелёные, вокруг детектора'
            : t < HAND_CP ? `сначала ${HAND_CP} тройки вручную, потом закон «⚖ Асимметрия»`
            : `сформировать закон «⚖ Асимметрия» ${buy('cp')}`,
            p: [Math.min(a, AUTO_TRIO), AUTO_TRIO], s: 'вещество сбережено', d: a >= AUTO_TRIO, res: 'cp' }];
      }
    }
  },
  // Клетка матрицы вида: [пара квантов, ступень удара] (W — γ + γ изо всех сил, после Хиггса)
  /** @param {string} sp @returns {[string, number] | null} */
  cellOf(sp) {
    for (const kinds in MATRIX) { const k = MATRIX[kinds].indexOf(sp); if (k >= 0) return [kinds, k + 1]; }
    return sp === 'W' ? ['phph', LV_N] : null;
  },
  // Рецепт частицы по матрице: «γ + g · 3 ⚡»
  /** @param {string} sp */
  recipe(sp) { const c = this.cellOf(sp); return c ? `${PAIR_N[c[0]]} · ${c[1]} ⚡` : ''; },
  // Рецепт словами: «Столкни свет и глюон посильнее — родится c-кварк».
  // Поколения II–III — наполовину: пара названа, силу удара игрок находит сам (ступень = поколение — это и есть открытие).
  // Целиком — после TRY_N промахов или если частица уже открыта в прошлых забегах.
  /** @param {string} sp */
  howTo(sp) {
    const c = this.cellOf(sp); if (!c) return `Открыть ${SM[sp].sym}`;
    const nm = SM[sp].name.replace(/ \(.*\)$/, '');
    return this.half(sp) ? `Столкнуть ${PAIR_W[c[0]]}, подобрав силу удара. Генерация: ${nm}` : `Столкнуть ${PAIR_W[c[0]]} ${LV_W[c[1]]}. Генерация: ${nm}`;
  },
  /** @param {string} sp */
  half(sp) { return (SM[sp].gen ?? 0) > 1 && !!this.cellOf(sp) && (this.tries[sp] || 0) < TRY_N && !Codex.known.has(sp); },
  // рецепт значками для задания: наполовину — сила удара «?»
  /** @param {string} sp @returns {Rx | undefined} */
  taskRx(sp) { const rx = this.rxOf(sp); return rx && this.half(sp) ? { ...rx, k: -1 } : rx; },
  // что сейчас нужно родить по заданию (эпоха 3: частица или её лёгкое поколение)
  /** @returns {string | null} */
  goalSp() {
    if (this.ep !== 2) return null;
    const sp = this.need2.find(s => !this.decSeen.has(s)); if (!sp) return null;
    const mk = genOpen(sp) ? (Codex.auto.has(sp) ? null : sp) : genNeed(sp)[0];
    return mk && !Codex.has(mk) ? mk : null;
  },
  // столкновение руками: не родило то, что просит задание, — промах; после TRY_N рецепт открывается целиком
  /** @param {Q[]} made */
  tried(made) {
    const sp = this.goalSp(); if (!sp || !this.half(sp) || made.some(o => o.sp === sp)) return;
    this.tries[sp] = (this.tries[sp] || 0) + 1;
    if (!this.half(sp)) this.float(P.x, P.y - this.hr() - .5, `подсказка: ${this.recipe(sp)} (см. задание)`, [255, 215, 110], 14);
  },
  // Испытания ★: два случайных на эпоху, за каждое +15 ✦
  /** @param {number} i @returns {Omit<Star, "st">[]} */
  starPool(i) {
    const st = this.st, fast = (/** @type {number} */ sec) => ({ t: `быстрее ${fmtClock(sec)}`, bad: () => this.epClock > sec, atEnd: true });
    const clean = { t: 'без пустых снимков', bad: () => st.empty > 0, atEnd: true }, thr = { t: 'пара броском', ok: () => st.thr > 0 };
    switch (i) {
      case 0: return [thr, { t: 'отличный разогрев', ok: () => !!this.inf.pick && this.inf.pick.i === 2, bad: () => !!this.inf.pick && this.inf.pick.i < 2 }, { t: 'создать и поймать жёсткий γ', ok: () => this.phSeen.has(PH_TOP), bad: () => this.lit && !this.inf.made[PH_TOP] }, { t: 'снимок с 3 видами', ok: () => st.kinds >= 3 }, { t: '6 столкновений', ok: () => st.pairs >= 6 },
        { t: 'открыть второе поколение', ok: () => ['c', 's', 'mu'].some(sp => Codex.has(sp)) }];
      case 1: return [thr, fast(45), { t: 'и W, и Z', ok: () => Codex.has('W') && Codex.has('Z') },
        { t: 'открыть t-кварк', ok: () => Codex.has('t'), can: () => !Codex.has('t') }, { t: 'не остаться без ⚡', bad: () => st.dry > 0, atEnd: true }];
      case 2: return [thr, clean, fast(35), { t: 'снимок с 4 видами', ok: () => st.kinds >= 4 }];
      default: return [{ t: '7 троек', ok: () => baryonTrios(this.stockQ) >= 7 }, { t: 'перекрасить кварк глюоном', ok: () => st.recol > 0 }, { t: 'антикварки не съели ни одного', bad: () => st.eaten > 0, atEnd: true },
        { t: '20 кварков в детекторе', ok: () => this.stock >= 20 }, { t: '3 волны без потерь', ok: () => st.waves >= 3 }];
    }
  },
  winStar() { this.kn += 15; this.float(P.x, P.y - this.hr() - .4, '★ +15 ✦', [255, 215, 110], 17); },
  /** @param {boolean} end */
  tickStars(end) {
    // испытания эпохи 1 скрыты до «Света»: пока их не видно, они не проваливаются — а при показе невыполнимое (выбор пролога уже сделан) заменяется
    if (this.ep === 0 && !this.rs.ph) return;
    if (this.ep === 0 && !this.starsShown) {
      this.starsShown = true;
      const dead = (/** @type {{ bad?: () => boolean }} */ s) => !!(s.bad && s.bad());
      if (this.stars.some(dead)) {
        const keep = this.stars.filter(s => !dead(s)), more = pickStars(this.starPool(0).filter(s => !dead(s) && !keep.some(k => k.t === s.t)), this.stars.length - keep.length);
        this.stars = [...keep, ...more];
      }
    }
    tickStars(this.stars, end, () => this.winStar(), this.failed);
  },
  // эпоха 4: сколько секунд Вселенной осталось остывать до конца аннигиляции (выполнил цель — догорает вчетверо быстрее)
  coolLeft() { return this.ep === 3 && this.T > T_END4 ? EPOCHS[3].tau / (this.epDone ? 4 : 1) * Math.log(this.T / T_END4) : 0; },
  checkGoals() {
    if (this.epDone || !this.steps().every(g => g.d)) return;
    this.epDone = true; this.epGap = 2.5; this.kn += 15; this.doneAt = this.epClock;
    this.release(); this.holding = false;
    if (this.ep < EPOCHS.length - 1) { this.tickStars(true); this.showResult(); }
    else this.float(P.x, P.y - this.hr() - .5, '✓ +15 ✦', [255, 215, 110], 17);
  },
  enterKey() { this.ff = this.ff > 1 ? 1 : 4; msg(this.ff > 1 ? '×4' : '×1', 1); },
  cheat() {
    for (const k of Object.keys(SM)) Codex.see(k);
    Cine.clear(); // чит — без кадров-пауз на каждое открытие
    this.kn += 100; this.pairs++; this.cheated = true; this.en = E_CAP; if (!this.lit) this.ignite(); this.rs.ph = Math.max(1, this.rs.ph); Codex.auto.add('ph'); Codex.auto.add('g'); this.rs.g = 1; PH_CLS.forEach((c, i) => this.phSeen.add(i)); this.full = true; if (!this.gOn) this.unlockGluons();
    for (const sp of CHAINS.flat()) this.decSeen.add(sp);
    if (this.ep === 1) this.higT = 99;
    if (this.ep === 3) { this.rs.cp = 1; while (this.safe.length < AUTO_TRIO) this.addSafe(); }
    if (this.ep === 3) while (this.stock < STOCK_GOAL) { this.stock++; this.stockQ.push({ fl: this.stock % 3 === 2 ? 'd' : 'u', col: this.stockQ.length % 3 }); }
  },
  // Что сейчас нужно снять: в эпохе 2 — H и W/Z, в эпохе 3 — распады цепочек
  // Эпоха 4: каких цветов в детекторе меньше всего — такие кварки и нужны
  colCnt() { const c = [0, 0, 0]; for (const s of this.stockQ) c[s.col]++; return c; },
  /** @param {number} col */
  needCol(col) { const c = this.colCnt(); return c[col] === Math.min(...c); },
  /** @param {string} sp @param {Q} [o] */
  wanted(sp, o) {
    if (this.ep === 3) return !!o && !this.advanced && SM[sp].kind === 'quark' && !o.anti && this.needCol(o.col);
    if (this.ep === 1) {
      const f0 = this.focus && this.focus.cap.length === 1 && this.focus.cap[0];
      if (f0 && !this.isQ(f0)) return !!o && this.antiPair(f0, o) && !o.cap; // держишь частицу — где её античастица
      return sp === 'H' ? !Codex.has('H') : sp === 'Z' ? !Codex.has('Z') : sp === 'W' && !Codex.has('W');
    }
    if (this.ep === 2) return this.need2.includes(sp) && !this.decSeen.has(sp);
    if (this.ep === 0) return !!o && (this.need0.includes(sp) || (sp === 'g' && this.pairs > 0)) && !Codex.has(sp);
    return false;
  },

  // Экран открывается по мере надобности: часть HUD появилась впервые — одна строка «зачем это» (Hint, по одной)
  reveal() {
    if (!G.started || this.inVoid) return;
    if (this.lit && Codex.has('ph')) {
      // только неочевидное: ⚡ — у детектора. Счётчик ✦, кодекс и лестница подписаны сами (было 7 пузырей подряд, ~30 с — ревью)
      Hint.once('en', 'энергия ⚡: на снимки и удары; её даёт пойманный свет', () => { const [sx, sy] = W2S(P.x, P.y); return [sx, sy + this.hr() * cam.z + 26, 1]; });
    }
    if (byId('shop').style.display === 'flex') Hint.once('shop', 'лавка: знания ✦ на законы Вселенной', () => hintAtEl('shop', -1));
    if (this.enOn() && !this.measured()) Hint.once('caught', 'каждый класс света нужно поймать: так он измеряется', () => [70, 84 + this.leftTop() + 74, 1]);
    if (this.pairs > 0) Hint.once('gauge', 'Остывание: окна для тяжёлых частиц закрываются', () => [146, 56 + this.leftTop() + 12, 1]);
  },

  // ---------- подсказки без обучения: призрачный курсор и курсор-подсказка (эпоха 1) ----------
  acted() { const C = this.coach; C.idle = 0; C.t = 0; C.kind = null; this.coachOff(); },
  coachOff() { for (const e of document.querySelectorAll('#shop .coach')) e.classList.remove('coach'); },
  coachOn() { return this.ep === 0 && this.lit && this.litT > 3 && !this.advanced && G.started && !G.paused; },
  // что показать: энергии нет — пролететь через фотон; на экране «?» — снимок; два кванта рядом — столкновение
  /** @returns {CoachPick | null} */
  coachPick() {
    const vis = (/** @type {Q} */ o) => !o.dead && o.born > .5 && !(o.fade >= 0) && !o.cap && onScreen(...W2S(o.x, o.y), -30);
    const near = (/** @type {(o: Q) => boolean} */ pred, /** @type {{ x: number, y: number }} */ from = P) => {
      /** @type {Q | null} */
      let b = null, bd = 1e9;
      for (const o of this.p) if (vis(o) && pred(o)) { const d = Math.hypot(o.x - from.x, o.y - from.y); if (d < bd) { bd = d; b = o; } }
      return b;
    };
    const dry = this.enOn() && this.en < E_SHOT;
    // хватает ✦ на исследование для задания — показать кнопку лавки
    if (!this.learn.buy) { const b = /** @type {HTMLElement | null} */ (document.querySelector('#shop button.pri.ok') || document.querySelector('#shop button.res.ok')); if (b && b.offsetParent) return { kind: 'shop', el: b }; }
    if (dry && !this.learn.absorb) { const o = near(o => o.sp === 'ph'); if (o) return { kind: 'sweep', o }; }
    if (!this.learn.snapNew && !dry) { const o = near(o => !Codex.has(o.sp) && o.sp !== 'ph' && SM[o.sp].kind !== 'nu'); if (o) return { kind: 'snap', o }; } // свет снимком не берут: он ловится кругом
    if (this.fieldOn() && !this.learn.smash) {
      const a = near(o => this.isQ(o)), b = a && near(o => o !== a && this.isQ(o), a);
      if (b && Math.hypot(a.x - b.x, a.y - b.y) < this.fr() * 1.6) return { kind: 'hold', o: a, o2: b };
    }
    return null;
  },
  // показ жеста вне обучения — один раз за всю игру на каждый вид
  /** @returns {CoachPick | null} */
  coachOnce() { const p = this.coachPick(); return p && Known.first('coach:' + p.kind) ? p : null; },
  /** @param {number} dt */
  tickCoach(dt) {
    const C = this.coach;
    if (C.kind !== 'shop' || C.t > COACH_T) this.coachOff();
    if (!this.coachOn() || this.focus || this.holding) { C.kind = null; C.t = 0; if (this.focus || this.holding) C.idle = 0; return; }
    if ((C.idle += dt) < COACH_IDLE) return;
    if (!C.kind || C.t > COACH_T) {
      const p = this.coachOnce(); C.t = 0; C.kind = p ? p.kind : null; C.o = p && p.o; C.o2 = p && p.o2; C.el = p && p.el;
      if (!p) C.idle = COACH_IDLE - 1; // показать нечего — посмотрим через секунду
    } else if ((C.o && C.o.dead) || (C.o2 && C.o2.dead) || (C.el && !C.el.isConnected)) C.kind = null;
    else C.t += dt;
  },
  // Призрачный курсор: подлетает от детектора к цели и проигрывает жест
  drawCoach() {
    const C = this.coach; if (!C.kind || !this.coachOn()) return;
    // что задано, решает вид показа (coachPick): shop — кнопка el, snap и sweep — частица o, hold — пара o и o2
    const o = /** @type {Q} */ (C.o), o2 = /** @type {Q} */ (C.o2), el = /** @type {HTMLElement} */ (C.el);
    const k = C.t / COACH_T, z = cam.z, [px, py] = W2S(P.x, P.y);
    // кнопка лавки лежит поверх холста: курсор долетает до её края, нажатие играет сама кнопка (класс coach)
    let [tx, ty] = C.el ? (r => [r.left + r.width * .3, r.top - 4])(el.getBoundingClientRect()) : W2S(o.x, o.y);
    if (C.kind === 'hold') { const [bx, by] = W2S(o2.x, o2.y); tx = (tx + bx) / 2; ty = (ty + by) / 2; }
    const go = smooth(0, .4, k), a = .6 * Math.min(1, k * 6) * (1 - smooth(.85, 1, k));
    let x = lerp(px, tx, go), y = lerp(py, ty, go), press = false, txt = '';
    if (C.kind === 'shop') {
      const on = k > .38 && k < .9;
      el.classList.toggle('coach', on);
      label(isTouch() || !this.learn.buy ? 'нажать: сформировать закон' : `клик или клавиша ${(el.querySelector('.k') || {}).textContent || ''}`, tx, ty - 34, 12, [255, 255, 255], Math.min(1, a * 1.6), 700);
      if (!on) this.ghostCursor(x, y, false, a);
      return;
    } else if (C.kind === 'snap') {
      press = k > .44 && k < .56;
      if (k > .5) { const r = clamp((k - .5) / .35, 0, 1); ring(tx, ty, 10 + 34 * r, [255, 255, 255], a * (1 - r), 2); }
      txt = isTouch() ? 'тап ◉: снимок' : 'клик: снимок';
    } else if (C.kind === 'sweep') {
      // пролетает сквозь фотон — ⚡ улетает в шкалу энергии под детектором
      if (k > .4) { const s = smooth(.4, .75, k); x = tx + (tx - px) * .35 * s; y = ty + (ty - py) * .35 * s; }
      if (k > .45) { const r = smooth(.45, .85, k); label('⚡', lerp(tx, px, r), lerp(ty, py + this.hr() * z + 10, r), 14, PH_C, Math.min(1, a * 1.7), 800); }
      txt = 'пролететь через свет: энергия';
    } else {
      const [ax, ay] = W2S(o.x, o.y), [bx, by] = W2S(o2.x, o2.y);
      press = k > .42 && k < .8;
      if (press) {
        ring(x, y, this.fr() * z, FIELD_C, a * .7, 1.5, [6, 6]);
        line(x, y, ax, ay, FIELD_C, a, 2); line(x, y, bx, by, FIELD_C, a, 2);
      }
      if (k >= .8) { const r = clamp((k - .8) / .15, 0, 1); ring(x, y, 6 + 26 * r, [255, 255, 255], a * (1 - r), 2.5); }
      txt = k < .8 ? 'зажать у двух волн…' : '…отпустить: столкнутся';
    }
    this.ghostCursor(x, y, press, a);
    label(txt, x, C.kind === 'shop' ? y - 26 : y + 36, 12, [255, 255, 255], Math.min(1, a * 1.6), 700);
  },
  // на телефоне — палец (круг), на компьютере — стрелка курсора; нажатие — чуть меньше и с кольцом
  /** @param {number} x @param {number} y @param {boolean} press @param {number} a */
  ghostCursor(x, y, press, a) { ghostCursor(x, y, press, a); },
  // Курсор подсказывает глагол: над «?» — видоискатель «клик», над волной — «зажми», без энергии — «пусто ⚡»
  drawCursorHint() {
    if (!this.coachOn() || isTouch() || !mouse.has || mouse.idle || this.focus) return;
    const [wx, wy] = S2W(mouse.x, mouse.y);
    /** @type {Q | null} */
    let o = null, bd = Math.max(.45, 24 / cam.z);
    for (const q of this.p) { if (q.dead || q.born < .5 || q.cap) continue; const d = Math.hypot(q.x - wx, q.y - wy); if (d < bd) { bd = d; o = q; } }
    /** @type {string | null} */
    let txt = null, c = [255, 255, 255];
    if (this.enOn() && this.en < E_SHOT) { txt = 'пусто ⚡: пролететь через свет'; c = [255, 165, 145]; }
    else if (o && !Codex.has(o.sp)) {
      const [ox, oy] = W2S(o.x, o.y), q = 15 + 2 * Math.sin(G.T * 6);
      for (let k = 0; k < 4; k++) { const an = Math.PI / 4 + k * Math.PI / 2; arc(ox, oy, q, an - .35, an + .35, [255, 255, 255], .95, 2.2); }
      if (!this.learn.snapNew) txt = 'клик: снять';
    } else if (o && this.isQ(o) && this.fieldOn() && !this.learn.smash) txt = 'зажать: притянуть';
    else if (o && o.sp === 'ph' && this.enOn() && !this.learn.absorb) txt = 'свет даёт энергию ⚡';
    if (txt && Tips.ok('cur:' + txt)) labelL(txt, mouse.x + 16, mouse.y + 24, 11, c, .9, 700);
  },

  // ---------- рисование ----------
  /** @param {Look} o @returns {RGB} */
  color(o) {
    const s = SM[o.sp];
    if (o.sp === 'g') return QCOL[o.col];
    if (s.kind === 'quark') return QCOL[o.col]; // антикварк — тот же цвет, но полый (форма — аромат)
    if (s.kind === 'lepton') return LEP_C[(s.gen ?? 1) - 1];
    if (s.kind === 'nu') return NU_C;
    return BOS_C[o.sp];
  },
  /** @param {Pick<Look, "sp" | "anti">} o */
  lab(o) {
    const s = SM[o.sp];
    if (s.kind === 'quark') return o.anti ? s.sym + '̅' : s.sym;
    if (s.kind === 'lepton') return s.sym + (o.anti ? '⁺' : '⁻');
    if (s.kind === 'nu') return o.anti ? 'ν̄' + s.sym.slice(1) : s.sym;
    if (o.sp === 'W') return o.anti ? 'W⁻' : 'W⁺';
    return s.sym;
  },
  /** @param {Look} o @returns {RGB} */
  dcol(o) { return Codex.has(o.sp) ? this.color(o) : [205, 220, 245]; },
  /** @param {Q} o */
  rad(o) { const m = SM[o.sp].m, big = m > 60 ? .21 : m > 1 ? .17 : .135; return .135 + (big - .135) * this.hig; },
  // Горячая область: тёплое марево, пунктир края и дрожащие дуги жара
  /** @param {number} alpha */
  // цветной вихрь — то же, дуги трёх цветов заряда крутятся в другую сторону
  drawHz(alpha) {
    /** @type {[HotZone[], RGB, string, number][]} */
    const Z = [[this.hz, HZ_C, 'горячо', .7], [this.cz, CZ_C, 'цветной вихрь', -.6]];
    for (const [L, C, txt, w] of Z) for (const z of L) {
      const [sx, sy] = W2S(z.x, z.y), R = z.r * cam.z, k = this.hzK(z) * alpha;
      if (!onScreen(sx, sy, R) || k <= 0) continue;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, rgb(C, .17 * k)); g.addColorStop(.7, rgb(C, .07 * k)); g.addColorStop(1, rgb(C, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
      ring(sx, sy, R * .97, C, .25 * k, 1.2, [3, 7]);
      for (let i = 0; i < 3; i++) { const s = (i % 2 ? 1 : -1) * (G.T * w + z.x) + i * 2; arc(sx, sy, R * (.3 + .2 * i), s, s + 1.1, L === this.cz ? QCOL[i] : C, (L === this.cz ? .22 : .14) * k, 1.6); }
      if (R > 40) label(txt, sx, sy - R - 8, 11, C, .6 * k, 700);
    }
  },
  // Фон камеры: едва заметная сетка
  /** @param {number} alpha */
  drawGrid(alpha) {
    const z = cam.z, step = 1.5, x0 = Math.floor((cam.x - G.W / 2 / z) / step), x1 = Math.ceil((cam.x + G.W / 2 / z) / step);
    const y0 = Math.floor((cam.y - G.H / 2 / z) / step), y1 = Math.ceil((cam.y + G.H / 2 / z) / step);
    if ((x1 - x0) * (y1 - y0) > 4000) return;
    ctx.strokeStyle = rgb([130, 175, 255], .045 * alpha); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = x0; i <= x1; i++) { const [sx] = W2S(i * step, 0); ctx.moveTo(sx, 0); ctx.lineTo(sx, G.H); }
    for (let j = y0; j <= y1; j++) { const [, sy] = W2S(0, j * step); ctx.moveTo(0, sy); ctx.lineTo(G.W, sy); }
    ctx.stroke();
  },
  // Решётка поля Хиггса: проявляется расходящейся волной и через несколько секунд гаснет
  /** @param {number} alpha */
  drawHiggs(alpha) {
    const z = cam.z;
    for (const r of this.ripples) {
      const k = r.t / 1.8, [x, y] = W2S(r.x, r.y);
      ring(x, y, (.2 + k * 1.25) * z, GOLD, (1 - k) * .7 * alpha, 2);
    }
    if (this.higT < 0) return;
    const p = clamp(this.higT / 4, 0, 1), fade = 1 - smooth(5, 10, this.higT);
    const al = (p < 1 ? .18 * Math.sin(p * Math.PI) + .08 : .08) * fade * alpha;
    if (al < .004) return;
    const hc = this.higC, Rw = p * (viewRadius() * 1.2 + Math.hypot(P.x - hc.x, P.y - hc.y));
    const step = .8, rowH = step * .866;
    const y0 = Math.floor((cam.y - G.H / 2 / z) / rowH), y1 = Math.ceil((cam.y + G.H / 2 / z) / rowH);
    const x0 = Math.floor((cam.x - G.W / 2 / z) / step) - 1, x1 = Math.ceil((cam.x + G.W / 2 / z) / step);
    if ((x1 - x0) * (y1 - y0) > 5000) return;
    ctx.strokeStyle = rgb(GOLD, al); ctx.lineWidth = 1; ctx.beginPath();
    for (let j = y0; j <= y1; j++) {
      const wy = j * rowH, off = (j & 1) * step / 2;
      for (let i = x0; i <= x1; i++) {
        const wx = i * step + off; if (Math.hypot(wx - hc.x, wy - hc.y) > Rw) continue;
        const [sx, sy] = W2S(wx, wy); ctx.moveTo(sx + 2.2, sy); ctx.arc(sx, sy, 2.2, 0, TAU);
      }
    }
    ctx.stroke();
    if (p < 1) { const [cx, cy] = W2S(hc.x, hc.y); ring(cx, cy, Rw * z, GOLD, .55 * alpha * fade, 2.5); }
  },
  // Пустой вакуум мерцает: виртуальные пары вспыхивают и гаснут — пока свет не начал рождаться сам
  /** @param {number} alpha */
  drawVacuum(alpha) {
    const k = (1 - (this.lit ? smooth(0, 3, this.litT) : 0)) * alpha;
    if (k <= .01 || this.ep > 0) return;
    const hw = G.W / 2 / cam.z, hh = G.H / 2 / cam.z;
    for (let i = 0; i < 70; i++) {
      const ph = G.T * .9 + i * .618, n = Math.floor(ph), f = ph - n, h = Math.sin(i * 127.1 + n * 311.7) * 43758.5453, r1 = h - Math.floor(h), h2 = Math.sin(i * 269.5 + n * 183.3) * 43758.5453, r2 = h2 - Math.floor(h2);
      const wx = cam.x + (r1 * 2 - 1) * hw, wy = cam.y + (r2 * 2 - 1) * hh, [x, y] = W2S(wx, wy);
      const near = this.lit ? 0 : Math.min(1, this.inf.A) * .6 + this.inf.flash * .8; // вакуум дышит в такт полю
      const a = Math.sin(f * Math.PI) * (.5 + 1.5 * near) * k;
      ball(x - 2, y, 1.2, [200, 210, 255], a); ball(x + 2, y, 1.2, [255, 200, 220], a);
    }
  },
  /** @param {Q} o @param {number} a */
  drawTrail(o, a) {
    const tl = o.trail; if (!tl || tl.length < 2) return;
    const nu = SM[o.sp].kind === 'nu', known = Codex.has(o.sp);
    if (nu && !known) return;
    ctx.strokeStyle = rgb(known ? this.color(o) : [205, 220, 245], (nu ? .25 : SM[o.sp].kind === 'lepton' ? .7 : .4) * a);
    ctx.lineWidth = nu ? 1.1 : o.anti ? 1.4 : 2;
    if (o.anti || nu) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    let [px, py] = W2S(tl[0][0], tl[0][1]); ctx.moveTo(px, py);
    for (let i = 1; i < tl.length; i++) { [px, py] = W2S(tl[i][0], tl[i][1]); ctx.lineTo(px, py); }
    [px, py] = W2S(o.x, o.y); ctx.lineTo(px, py);
    ctx.stroke(); ctx.setLineDash([]);
  },
  /** @param {number} alpha */
  draw(alpha) {
    const z = cam.z;
    ctx.lineCap = 'round';
    this.drawGrid(alpha);
    this.drawVacuum(alpha);
    if (this.school) this.drawSchool(alpha);
    this.drawHz(alpha);
    this.drawHiggs(alpha);
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 80)) continue;
      const a = alpha * o.born;
      if (!this.isQ(o)) this.drawTrail(o, a * (this.isBg(o) ? .5 : 1));
    }
    for (const tr of this.tracks) this.drawVertex(tr, alpha);
    // энергии мало — подсвечены только три ближайших фотона, а не весь экран
    const lowE = this.enOn() && (this.en < 3 || !this.full);
    const ringPh = lowE ? new Set(this.p.filter(o => !o.dead && o.sp === 'ph' && !o.cap && o.born > .5).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)).slice(0, 3)) : null;
    for (const o of this.p) {
      const [sx, sy] = W2S(o.x, o.y); if (!onScreen(sx, sy, 40)) continue;
      const k = appear(o.vis ?? APPEAR_T), a = alpha * Math.min(o.born, k), known = Codex.has(o.sp), c = this.dcol(o);
      if (this.isQ(o)) {
        // Фотон — волновой пакет: чем выше энергия, тем короче период (λ ~ 1/E). Глюон — пружинка одной формы для всех.
        const hot = clamp(o.p / (this.T * 6), 0, 1), L = 1.2 * z;
        const per = clamp(.42 * z * this.T * 1.5 / Math.max(o.p, 1e-9), 7, .5 * z);
        const amp = clamp(.08 * z, 3, 5.5);
        // Волна неподвижна в пространстве: фаза привязана к мировой координате вдоль луча
        const phase = o.ph - (o.x * o.dx + o.y * o.dy) * z / per * TAU;
        const glu = o.sp === 'g', gc = glu ? [c, QANTI[/** @type {number} */ (o.col2)]] : [c];
        if (o.thrown) { ctx.lineCap = 'round'; line(sx, sy, sx - o.dx * 34, sy - o.dy * 34, GOLD, .5 * a, 4); }
        if (!known) {
          if (glu) gluonCoil(sx, sy, o.dx, o.dy, gc, .6 * a, 1.6, o.ph + G.T * GLU_SPIN); else wavePacket(sx, sy, o.dx, o.dy, L, per, amp, phase, c, .6 * a, 1.6);
          ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,16,32,.85)'; ctx.beginPath(); ctx.arc(sx, sy, 7.5, 0, TAU); ctx.fill(); // кружок — на оси: волна бежит, а он стоит
          ring(sx, sy, 7.5, [235, 245, 255], .9, 1.3); label('?', sx, sy + .5, 10, [255, 255, 255], 1, 800); ctx.globalAlpha = 1;
          // нужный для задания квант (глюон третьей струи) — золотые дуги и что сделать
          if (this.wanted(o.sp, o)) { const s0 = G.T * 2; for (let k = 0; k < 4; k++) arc(sx, sy, 17, s0 + k * Math.PI / 2, s0 + k * Math.PI / 2 + .9, GOLD, .9 * a, 2.2); glow(sx, sy, 26, GOLD, .18 * a); this.wantTag(o, sx, sy, 17); }
        } else if (o.sp === 'ph' && this.ep === 3) { // аннигиляция: свет — фон, фокус на кварках и глюонах
          wavePacket(sx, sy, o.dx, o.dy, L, per, amp, phase, [220, 225, 240], .18 * a, 1.2);
        } else if (o.sp === 'ph') {
          const cc = mixc([255, 200, 120], [220, 235, 255], hot);
          if (ringPh && ringPh.has(o)) ring(sx, sy, 10 + 2 * Math.sin(G.T * 8 + o.ph), PH_C, .7 * a, 1.6);
          // жёсткий, ещё не измеренный — вращающиеся дуги цвета класса
          const pc = this.lit ? this.phClass(o) : 0;
          if (pc === PH_TOP && !this.phSeen.has(pc)) { const s0 = G.T * 3; for (let k = 0; k < 3; k++) arc(sx, sy, 15, s0 + k * TAU / 3, s0 + k * TAU / 3 + 1, PH_CLS[pc].c, .9 * a, 2); }
          glow(sx, sy, 5 + 6 * hot, cc, .3 * a);
          wavePacket(sx, sy, o.dx, o.dy, L, per, amp, phase, cc, .8 * a, 1.8);
        } else {
          glow(sx, sy, 7, c, .25 * a);
          gluonCoil(sx, sy, o.dx, o.dy, gc, .85 * a, 2, o.ph + G.T * GLU_SPIN);
          // эпоха 4: что глюон сделает с кварком в детекторе — «антицвет → цвет»; полезный — в золотом кольце
          if (this.ep === 3 && !this.stockOut) {
            const help = this.helpGlu(o), y = sy - 15; // метка — на оси, чтобы не прыгала с волной
            ball(sx - 7, y, 3.2, QCOL[/** @type {number} */ (o.col2)]); line(sx - 3, y, sx + 3, y, [235, 240, 250], .8 * a, 1.2); ball(sx + 7, y, 3.2, QCOL[o.col]);
            if (help && !this.advanced) ring(sx, sy - 5, 15 + 1.5 * Math.sin(G.T * 8), GOLD, .85 * a, 2);
          }
        }
        continue;
      }
      this.drawParticle(o, sx, sy, this.rad(o) * z * popIn(k), a, known, c);
    }
  },
  // Вещество — светящийся шар с символом внутри; античастица — полое кольцо с встречной дугой;
  // неизвестное — пунктирное облачко с «?». У нестабильных — дуга оставшейся жизни.
  // Фон: открытое, ненужное сейчас и не твоё свежее — тусклая точка без подписи. На виду — неизвестное («?»),
  // нужное для задания, только что рождённое тобой, то, что держишь, и то, что распадётся с новыми данными.
  /** @param {Q} o */
  isBg(o) {
    if (this.ep === 3 || this.isQ(o) || !Codex.has(o.sp) || o.mine > 0 || o.cap || this.wanted(o.sp, o)) return false;
    if (this.willTell(o)) return false;
    if (this.hig > .5 && o.life < Infinity && this.paidDec(o.sp)) return false; // его распад оплачивается
    const f = this.focus, f0 = f && f.cap.length === 1 && f.cap[0];
    if (f0 && !this.isQ(f0) && this.antiPair(f0, o)) return false; // держишь частицу — её античастица нужна
    if (this.hig >= .5 && this.grabbable(o) && Math.hypot(o.x - P.x, o.y - P.y) < this.fr()) return false; // в зоне поля — можно взять
    return true;
  },
  // Облик семейства (поверх — сам шар): кварк — свой цветной заряд кружит рядом, лептон — искра со светящимся хвостом,
  // второе и третье поколение — одно и два кольца (тяжелее — богаче), бозоны — без украшений
  /** @param {Q} o @param {number} sx @param {number} sy @param {number} r @param {RGB} c @param {boolean} bg */
  drawLook(o, sx, sy, r, c, bg) {
    const s = SM[o.sp], gen = s.gen ?? 0, t = G.T + o.ph;
    if (s.kind === 'quark') {
      if (!bg) glow(sx, sy, r * 2, c, .25);
      for (let k = 0; k < 2; k++) { const an = t * (o.anti ? -2.6 : 2.6) + k * Math.PI; ball(sx + Math.cos(an) * (r + 2.5), sy + Math.sin(an) * (r + 2.5), k ? 1.4 : 2.1, c, k ? .55 : .95); }
    } else if (s.kind === 'lepton') {
      if (!bg) glow(sx, sy, r * 2.6, c, .4);
      const v = this.speed(o) / C_LIGHT; // искра: короткий яркий хвост за спиной
      const L = r * (1.6 + 1.8 * v);
      line(sx - o.dx * r * .6, sy - o.dy * r * .6, sx - o.dx * L, sy - o.dy * L, mixc(c, [255, 255, 255], .5), .5, Math.max(1, r * .22));
    }
    if (gen >= 2 && s.kind !== 'nu' && !bg) for (let k = 0; k < gen - 1; k++) {
      const rr = r + 9 + k * 3.5, sp = t * (k ? -1.4 : 1.1);
      arc(sx, sy, rr, sp, sp + Math.PI * 1.5, c, .5, 1.1);
    }
  },
  // эпоха 1: нужное — снять; в круге и снимок готов — «клик!», иначе у глюона третьей струи — «наведи круг»
  /** @param {Q} o @param {number} sx @param {number} sy @param {number} r — радиус меток */
  wantTag(o, sx, sy, r) {
    if (this.ep !== 0) return;
    if (Math.hypot(o.x - P.x, o.y - P.y) < this.hr() && this.canShot()) label(isTouch() ? '◉!' : 'клик!', sx, sy + r + 12, 13, GOLD, .7 + .3 * Math.sin(G.T * 10), 800);
    else if (o.sp === 'g') label('глюон: навести круг', sx, sy + r + 12, 12, GOLD, .9, 700);
  },
  // распадётся и даст новое: распад этого вида ещё не снят
  /** @param {Q} o */
  willTell(o) { return this.hig > .5 && o.life < Infinity && !this.decSeen.has(o.sp) && SM[o.sp].kind !== 'nu'; },
  /** @param {Q} o @param {number} sx @param {number} sy @param {number} r @param {number} a @param {boolean} known @param {RGB} c */
  drawParticle(o, sx, sy, r, a, known, c) {
    const s = SM[o.sp], bg = this.isBg(o);
    // нестабильное мерцает — тем чаще и глубже, чем ближе распад
    if (o.life < Infinity && this.hig > .5) { const f = clamp(o.age / o.life, 0, 1); a *= 1 - .45 * f * f * (.5 + .5 * Math.sin(o.age * (8 + 20 * f) + o.ph)); } // частота растёт к распаду: 8 → 48 рад/с
    // фон (открытое и сейчас не нужное) — тот же облик, только мельче, тише и без подписи
    if (bg) { r *= .72; a *= .5; }
    ctx.globalAlpha = a;
    if (known && s.kind !== 'nu') this.drawLook(o, sx, sy, r, c, bg);
    if (bg) {
      if (s.kind === 'nu') ring(sx, sy, r * .95, NU_C, .3, 1.2, [2.5, 3.5]);
      else if (s.kind === 'quark') quark(sx, sy, r, c, o.sp, !!o.anti, .9);
      else if (o.anti && s.kind !== 'boson') ring(sx, sy, r, c, .9, 2);
      else { ball(sx, sy, r * 1.15, c, .25); ball(sx, sy, r * .8, c, .95); }
      ctx.globalAlpha = 1;
      return;
    }
    if (o.mine > 0) glow(sx, sy, r * 2.8, [255, 255, 255], .2 * Math.min(1, o.mine));
    if (known && this.willTell(o)) label('→ ?', sx + r + 12, sy - r - 3, 10, [255, 255, 255], .8, 800);
    if (o.life < Infinity && this.hig > .5) arc(sx, sy, r + 5.5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - o.age / o.life, 0, 1), [255, 255, 255], .4, 1.6);
    if (this.wanted(o.sp, o)) {
      const sp = G.T * 2;
      for (let k = 0; k < 4; k++) arc(sx, sy, r + 16, sp + k * Math.PI / 2, sp + k * Math.PI / 2 + .9, this.ep === 0 ? [255, 255, 255] : GOLD, .9, 2.2);
      this.wantTag(o, sx, sy, r + 16);
    }
    const fs = Math.max(9, r * .95);
    if (s.kind === 'nu') {
      const near = Math.hypot(o.x - P.x, o.y - P.y) < this.hr() * 1.8;
      ring(sx, sy, r * .95, known ? NU_C : [216, 244, 255], near ? .85 : .35, 1.5, [2.5, 3.5]);
      if (near) label(known ? s.sym : '?', sx, sy + .5, fs * .85, known ? NU_C : [255, 255, 255], .9, 700);
    } else if (!known) {
      const pul = 1 + .09 * Math.sin(G.T * 6 + o.ph);
      ctx.fillStyle = 'rgba(210,226,255,.18)'; ctx.beginPath(); ctx.arc(sx, sy, r * 1.25 * pul, 0, TAU); ctx.fill();
      ring(sx, sy, r * pul, [235, 245, 255], .88, 1.8, [4, 3]);
      label('?', sx, sy + 1, fs, [255, 255, 255], 1, 800);
    } else if (s.kind === 'quark') { // аромат — форма: верхние — круг, нижние — ромб; антикварк — полый того же цвета
      if (!o.anti) glow(sx, sy, r * 1.6, c, .3);
      quark(sx, sy, r * (o.anti ? 1.05 : .95), c, o.sp, !!o.anti, .95);
      label(this.lab(o), sx, sy + .5, fs * (o.anti ? .9 : 1), o.anti ? c : [6, 9, 19], 1, 800);
    } else if (o.anti && s.kind !== 'boson') {
      ring(sx, sy, r, c, .95, 2.4);
      if (r > 7) { const sp = -G.T * 2.5; arc(sx, sy, r - 4, sp, sp + Math.PI * 1.4, [255, 255, 255], .8, 1.2, [4, 4]); }
      label(this.lab(o), sx, sy + .5, fs * .9, c, 1, 700);
    } else {
      if (o.sp === 'H') glow(sx, sy, r * (3 + Math.sin(G.T * 8) * .6), c, .4);
      else if (s.kind === 'boson') glow(sx, sy, r * 2.4, c, .3);
      const g = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, r * 1.4);
      g.addColorStop(0, '#fff'); g.addColorStop(.35, rgb(c)); g.addColorStop(1, rgb(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 1.35, 0, TAU); ctx.fill();
      ctx.fillStyle = rgb(c); ctx.beginPath(); ctx.arc(sx, sy, r * .88, 0, TAU); ctx.fill();
      label(this.lab(o), sx, sy + .5, fs, [6, 9, 19], 1, 800);
    }
    ctx.globalAlpha = 1;
  },
  // Вершина распада: пульсирующее кольцо и пунктирные лучи осколков (нейтрино — точками).
  // Нужные для цели — золотые и крупнее; «клик!», когда вершина в круге и снимок готов.
  /** @param {Track} tr @param {number} alpha */
  drawVertex(tr, alpha) {
    const age = this.t - tr.t, k = 1 - age / tr.life, [x, y] = W2S(tr.x, tr.y);
    if (!onScreen(x, y, 60)) return;
    if (!tr.parent) {
      tr.angs.forEach((an, i) => {
        const L = 8 + 22 * (1 - k), d = tr.dsp[i];
        line(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, this.dcol({ sp: d[0], anti: d[1], col: d[2] }), .8 * k * alpha, 1.5);
      });
      ring(x, y, 4, [255, 255, 255], .7 * k * alpha, 1);
      return;
    }
    const a = Math.min(1, k * 1.4) * alpha, known = Codex.has(tr.parent), want = this.wanted(tr.parent) && !tr.rec;
    const col = tr.rec ? [160, 210, 255] : want ? GOLD : known ? tr.col : [255, 255, 255], aa = tr.rec ? a * .45 : a;
    tr.angs.forEach((an, i) => {
      const nu = SM[tr.dsp[i][0]].kind === 'nu', L = nu ? 54 : 36;
      ctx.setLineDash(nu ? [3, 4] : [5, 3]);
      line(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, nu ? [168, 240, 255] : col, .8 * aa, nu ? 1.5 : 1.8);
    });
    ctx.setLineDash([]);
    const pul = 1 + .16 * Math.sin(G.T * 8), rr = 13 * pul * (want ? 1.35 : 1);
    if (want) glow(x, y, rr * 2.2, GOLD, .25 * aa);
    ring(x, y, rr, col, aa, tr.rec ? 1.2 : want ? 2.8 : 2.2);
    const sym = SM[tr.parent].sym;
    label(tr.rec ? sym : known || want ? sym + '→' : '?→', x, y - rr - 9, want ? 13 : 11, col, aa, 700);
    if (want && Math.hypot(tr.x - P.x, tr.y - P.y) < this.hr() && this.canShot())
      label(isTouch() ? '◉!' : 'клик!', x, y + rr + 12, 13, GOLD, aa * (.7 + .3 * Math.sin(G.T * 10)), 800);
    else if (!tr.rec && !want && this.paidDec(tr.parent) && this.decSeen.has(tr.parent)) label(`+${this.decPay(tr.parent)} ✦`, x, y + rr + 11, 11, [140, 220, 255], aa, 700);
  },
  /** @param {number} alpha */
  drawPlayer(alpha) {
    const [sx, sy] = W2S(P.x, P.y), z = cam.z, r = this.hr() * z;
    ctx.globalAlpha = alpha;
    for (const h of this.hot) {
      const [hx, hy] = W2S(h.x, h.y), k = clamp(h.t / 1.6, 0, 1), pul = .5 + .5 * Math.sin(h.t * 14);
      if (!h.done) {
        ring(hx, hy, (1.2 - .9 * k) * z, [255, 190, 110], .35 + .5 * pul, 2, [5, 4]);
        glow(hx, hy, .5 * z, [255, 170, 90], .2 + .25 * k);
      }
    }
    if (this.ep === 3 && !this.stockOut && !this.advanced) {
      // ядро — сюда складываются кварки; антикварк, долетевший до ядра, съедает один
      ring(sx, sy, this.coreR() * z, [140, 235, 170], .45, 2);
      // угрозы: антикварки рядом — красные пунктиры к ядру, тем ярче, чем ближе
      if (this.stock > 0) for (const o of this.p) {
        if (o.dead || !o.anti || SM[o.sp].kind !== 'quark' || o.rep > 0) continue;
        const d = Math.hypot(o.x - P.x, o.y - P.y); if (d > 4) continue;
        const [ox, oy] = W2S(o.x, o.y); ctx.setLineDash([3, 5]); line(ox, oy, sx, sy, [255, 90, 90], .5 * (1 - d / 4), 1.5); ctx.setLineDash([]);
      }
      // волна на подходе — красная дуга на краю детектора с той стороны
      if (this.waveWarn()) {
        const an = /** @type {number} */ (/** @type {Wave} */ (this.wave).dir), pul = .5 + .5 * Math.sin(G.T * 12); // waveWarn: волна и сторона есть
        arc(sx, sy, r + 16, an - .5, an + .5, [255, 90, 90], .5 + .45 * pul, 5);
        labelIn('⚠ антивещество', sx + Math.cos(an) * (r + 85), sy + Math.sin(an) * (r + 60), 12, [255, 120, 120], .7 + .3 * pul, 800);
      }
    }
    if (this.ep === 3 && this.stock > 0 && !this.stockOut) {
      // запас вещества кружит внутри детектора
      for (let i = 0; i < this.stock; i++) { const p = this.stockPos(i), [bx, by] = W2S(p.x, p.y); quark(bx, by, 4.5, QCOL[this.stockQ[i].col], this.stockQ[i].fl, false); }
    }
    // тройки, что Вселенная сберегла сама: мягкое зелёное свечение, три цвета треугольником
    if (this.ep === 3 && !this.stockOut) for (const t of this.safe) {
      const a = Math.min(1, (G.T - t.t0) * 2), c = this.safePos(t), [cx, cy] = W2S(c.x, c.y);
      glow(cx, cy, .45 * z, [140, 235, 170], .25 * a);
      for (let k = 0; k < 3; k++) { const p = this.safePos(t, k), [bx, by] = W2S(p.x, p.y); line(cx, cy, bx, by, [220, 255, 230], .35 * a, 1.2); quark(bx, by, 3.5, QCOL[k], t.q[k], false, a); }
    }
    if (this.ep === 3 && !this.stockOut) {
      // счётчик цветов справа от детектора: каких меньше всего — пульсирующее золотое кольцо
      const c = this.colCnt(), mn = Math.min(...c);
      c.forEach((n, k) => {
        const x = sx + r + 26, y = sy - 18 + k * 18;
        if (n === mn && !this.advanced) ring(x, y, 8 + 1.5 * Math.sin(G.T * 8), GOLD, .9, 2);
        ball(x, y, 5, QCOL[k]);
        label(String(n), x + 16, y + .5, 13, n === mn ? GOLD : [235, 235, 245], .95, 700);
      });
    }
    const ready = this.canShot();
    let unk = 0;
    for (const o of this.p) if (!o.dead && this.inHand(o)) {
      if (!Codex.has(o.sp)) unk++;
      if (o.cap || this.isBg(o)) continue;
      const [ox, oy] = W2S(o.x, o.y), rr = Math.max(7, this.rad(o) * z + 4);
      ring(ox, oy, rr, [255, 255, 255], (Codex.has(o.sp) ? .45 : .8) * (ready ? 1 : .35), Codex.has(o.sp) ? 1 : 1.6);
    }
    for (const tr of this.tracks) if (Math.hypot(tr.x - P.x, tr.y - P.y) < this.hr() && tr.sps.some(sp => !Codex.has(sp))) unk++;
    this.drawField(sx, sy, r);
    this.drawPick();
    this.drawInflaton(sx, sy);
    // вспышка затвора
    if (this.shotFx > 0) glow(sx, sy, r, [255, 255, 255], .14 * this.shotFx / .35);
    glow(sx, sy, r, [255, 255, 255], ready ? .05 : .02);
    ring(sx, sy, r, [255, 255, 255], ready ? .6 : .3, 1.5, [6, 6]);
    // уголки видоискателя: золотые, когда в кадре есть неизвестное
    const hot = unk && ready, q = r * 1.12 + (this.shotFx > 0 ? 6 * this.shotFx / .35 : 0) + (hot ? 2 * Math.sin(G.T * 8) : 0);
    const fa = this.focus && this.focus.cap.length === 2 ? .35 : 1, h = q * .72, L = Math.max(5, r * .2); // в поле с парой — тише: там шкала ступеней
    for (let k = 0; k < 4; k++) {
      const dx = k & 1 ? 1 : -1, dy = k & 2 ? 1 : -1, cx = sx + dx * h, cy = sy + dy * h, al = (ready ? (hot ? 1 : .7) : .35) * fa, w = hot ? 3.2 : 2.2;
      line(cx, cy, cx - dx * L, cy, [255, 255, 255], al, w); line(cx, cy, cx, cy - dy * L, [255, 255, 255], al, w);
    }
    // перезарядка снимка
    if (this.shotCd > 0) arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - this.shotCd / this.up('sh'), 0, 1), [200, 235, 255], .85, 2);
    ring(sx, sy, 3, [255, 255, 255], .8, 1.5);
    this.drawEnergy(sx, sy, r);
    this.drawHint(sx, sy, r);
    this.drawCoach();
    this.drawCursorHint();
    this.drawArrows();
    for (const f of this.floats) {
      if (f.t < 0) continue;
      const [fx, fy] = W2S(f.x, f.y);
      label(f.txt, fx, fy - 16 - f.t * 26, f.sz || 14, f.c || [140, 220, 255], clamp(1.6 - f.t, 0, 1), 700);
    }
    ctx.globalAlpha = 1;
  },
  // Пролог: чаша потенциала V(φ) с шариком-полем. Красный пунктир — черта срыва, золотые риски — размах.
  // Под шариком — стрелка его хода (у дна ярче: здесь толкать). Тянешь — резинка от шарика к пальцу, дуга — доля
  // резинки, стрелка толчка: золотая, если толчок сейчас по ходу шарика; красная и дрожит — против (гасишь).
  /** @param {number} sx @param {number} sy */
  drawInflaton(sx, sy) {
    if (this.lit || this.ep || this.inVoid || this.school) return;
    const I = this.inf, A = Math.min(1.05, I.A), z = cam.z, B = this.infBowl(), w = B.w * z, d = B.d * z;
    const [bx, by] = W2S(B.bx, B.by), th = I.th, u = A * Math.cos(th), left = Math.sin(th) > 0;
    const Y = (/** @type {number} */ v) => by - d * v * v, c = PH_CLS[A < PH_HARD_A ? 0 : 1].c, dang = smooth(.6, 1, A);
    // чаша
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const v = -1.12 + 2.24 * k / 40; k ? ctx.lineTo(bx + w * v, Y(v)) : ctx.moveTo(bx + w * v, Y(v)); }
    ctx.strokeStyle = rgb([200, 215, 255], .55); ctx.lineWidth = 2.5; ctx.stroke();
    // черта срыва
    ctx.setLineDash([5, 5]); line(bx - w * 1.12, Y(INF.crit), bx + w * 1.12, Y(INF.crit), [255, 80, 70], .25 + .6 * dang, 1.5 + 1.5 * dang); ctx.setLineDash([]);
    label('срыв', bx + w * 1.12 + 4, Y(INF.crit), 11, [255, 110, 100], .5 + .5 * dang, 700); ctx.textAlign = 'center';
    // размах: золотые риски, докуда шарик долетает
    for (const sg of [-1, 1]) { const x = bx + sg * w * A, y = Y(A); line(x, y - 7, x, y + 7, GOLD, .7, 2); }
    // дно — где рождается свет
    glow(bx, by, w * .25, c, .1 + .5 * I.flash); ball(bx, by, 2.5, [255, 255, 255], .5 + .5 * I.flash);
    // шарик
    const x = bx + w * u, y = Y(u), br = Math.max(6, w * .09);
    glow(x, y, br * 2.6, c, .25 + .2 * A); ball(x, y, br, mixc(c, [255, 255, 255], .35), 1);
    // ход шарика (до нажатия) или толчок рогатки (пока тянешь): стрелка под шариком
    const k = Math.abs(I.pull || 0), push = I.hold && k >= SLING_MIN, kdir = -Math.sign(I.pull || 0), mv = left ? -1 : 1;
    const lose = push && kdir !== mv, bot = 1 - Math.min(1, Math.abs(u) / Math.max(.05, A)); // bot — близость к дну
    if (I.hold) { // резинка: от шарика к пальцу, дуга — доля
      line(x, y, mouse.x, y, [255, 255, 255], (.4 + .45 * k) * .9, Math.max(1.5, 4 - 2.5 * k)); ball(mouse.x, y, 4, [255, 255, 255], .9);
      arc(x, y, br + 8, -Math.PI / 2, -Math.PI / 2 + TAU * k, k < SLING_MIN ? [150, 150, 165] : GOLD, .9, 3);
    }
    const col = push ? (lose ? [255, 80, 70] : GOLD) : bot > .6 ? GOLD : [170, 175, 195];
    const dir = push ? kdir : mv, ax = x + (lose ? Math.sin(G.T * 50) * 2.5 : 0), ay = y + br + 16, L = push ? 22 + 24 * k : 20;
    const al = push ? .95 : .35 + .55 * bot * (I.go ? .6 : 1);
    line(ax - dir * L / 2, ay, ax + dir * L / 2, ay, col, al, push ? 4 : 2.5);
    line(ax + dir * L / 2, ay, ax + dir * (L / 2 - 8), ay - 6, col, al, push ? 4 : 2.5);
    line(ax + dir * L / 2, ay, ax + dir * (L / 2 - 8), ay + 6, col, al, push ? 4 : 2.5);
  },
  // Кого возьмёт поле: до нажатия — ближайший в радиусе захвата, в поле с одним квантом — второй (дуга — сколько осталось)
  drawPick() {
    if (this.ep === 3 || !this.fieldOn()) return;
    const f = this.focus;
    if (f && (f.cap.length !== 1 || !this.isQ(f.cap[0]))) return; // к частице — сразу её античастица, без выбора
    const o = f ? f.cand : this.pickNext(null); if (!o) return;
    const [ox, oy] = W2S(o.x, o.y), r = Math.max(11, this.rad(o) * cam.z + 7);
    if (!f) { ring(ox, oy, r, FIELD_C, .55, 1.5, [3, 4]); return; }
    const [sx, sy] = W2S(P.x, P.y), k = clamp((f.candT || 0) / PICK_T, 0, 1);
    ctx.setLineDash([4, 5]); line(sx, sy, ox, oy, FIELD_C, .35, 1.2); ctx.setLineDash([]);
    ring(ox, oy, r, FIELD_C, .35, 1.5);
    arc(ox, oy, r, -Math.PI / 2, -Math.PI / 2 + TAU * k, FIELD_C, .95, 2.6);
  },
  // Поле: пунктир захвата, ядро, нити к захваченным квантам и кольцо-шкала энергии с порогами
  /** @param {number} sx @param {number} sy @param {number} r */
  drawField(sx, sy, r) {
    const f = this.focus; if (!f) return;
    const z = cam.z, R = this.fr() * z;
    if (this.ep === 3) {
      const on = this.shield > 0;
      ring(sx, sy, R, SHIELD_C, on ? .45 : .15, 1.5, [6, 6]);
      if (on) { glow(sx, sy, R, SHIELD_C, .06); ring(sx, sy, r * .5 + 3 * Math.sin(G.T * 10), SHIELD_C, .9, 2); }
      arc(sx, sy, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * this.shield, SHIELD_C, .85, 4);
      return;
    }
    ring(sx, sy, R, FIELD_C, .35, 1.5, [6, 6]);
    ring(sx, sy, this.hr() * .42 * z + 3 * Math.sin(G.T * 10), FIELD_C, .8, 2);
    for (const o of f.cap) { const [ox, oy] = W2S(o.x, o.y); line(ox, oy, sx, sy, FIELD_C, .45 + .4 * f.q, 1.5 + 4 * f.q); }
    if (!f.cap.length) return;
    const Rg = r + 13, a0 = -Math.PI / 2;
    // рогатка взведена: стрелка — куда полетят кванты, если отпустить сейчас
    const pv = Math.hypot(P.vx, P.vy);
    if (pv > THROW_V * .6) {
      const on = pv > THROW_V, an = Math.atan2(P.vy, P.vx), c = Math.cos(an), s = Math.sin(an), r0 = Rg + 10, L = on ? 46 : 24;
      ctx.setLineDash(on ? [] : [4, 4]);
      line(sx + c * r0, sy + s * r0, sx + c * (r0 + L), sy + s * (r0 + L), GOLD, on ? .95 : .4, on ? 3 : 2);
      ctx.setLineDash([]);
      if (on) {
        const hx = sx + c * (r0 + L + 4), hy = sy + s * (r0 + L + 4);
        ctx.fillStyle = rgb(GOLD, .95); ctx.beginPath(); ctx.moveTo(hx + c * 8, hy + s * 8);
        ctx.lineTo(hx + Math.cos(an + 2.4) * 9, hy + Math.sin(an + 2.4) * 9); ctx.lineTo(hx + Math.cos(an - 2.4) * 9, hy + Math.sin(an - 2.4) * 9); ctx.fill();
      }
    }
    if (f.cap.length < 2) { wedge(sx, sy, Rg, a0, a0 + TAU * Math.max(.005, f.q), 2, 2 + 12 * f.q, FIELD_C, .6); return; }
    const kinds = f.cap.map(o => o.sp).sort().join(''), bd = this.band(f), inH = !!bd && f.E > bd[0] && f.E < bd[1];
    wedge(sx, sy, Rg, a0, a0 + TAU, 2, 14, [255, 255, 255], .08); // сколько можно набрать
    // золотая полоса — резонанс Z: частица + античастица
    if (bd) {
      const q1 = this.qOf(bd[0], f), q2 = this.qOf(bd[1], f);
      if (q2 > 0 && q1 < 1) {
        arc(sx, sy, Rg, a0 + TAU * Math.max(0, q1), a0 + TAU * Math.min(1, q2), GOLD, .55, 9);
        const am = a0 + TAU * clamp((q1 + q2) / 2, 0, 1), sym = kinds === 'gg' ? 'H' : 'Z';
        label(Codex.has(sym) ? sym : '?', sx + Math.cos(am) * (Rg + 17), sy + Math.sin(am) * (Rg + 17), 11, GOLD, .95, 800);
      }
    }
    if (this.isQ(f.cap[0])) {
      // ступени удара: деление на каждой четверти круга, у деления — что родит эта ступень (клетка матрицы)
      for (let k = 1; k <= LV_N; k++) {
        const an = a0 + TAU * k / LV_N, c = Math.cos(an), s = Math.sin(an), got = (f.lv || 0) >= k;
        const xs = this.cellsAt(kinds, k), x = xs.find(v => !this.cellWhy(v, this.lvE(k), false)) || xs[0], why = x ? this.cellWhy(x, this.lvE(k), false) : '', open = !!x && !why;
        // ещё не создано то, без чего эту клетку не открыть (поколение закрыто) — ступень пустая: ни символа, ни подсказки
        if (!x || this.cellHidden(why)) { line(sx + c * (Rg - 5), sy + s * (Rg - 5), sx + c * (Rg + 5), sy + s * (Rg + 5), [255, 255, 255], .25, 2); continue; }
        line(sx + c * (Rg - 8), sy + s * (Rg - 8), sx + c * (Rg + 8), sy + s * (Rg + 8), !open ? NO_C : got ? GOLD : [255, 255, 255], got || !open ? 1 : .7, 2);
        const R = Rg + (Math.abs(c) > .5 ? 42 : 22), lx = sx + c * R, ly = sy + s * R; // сбоку надпись шире — дальше от круга
        const col = !open ? NO_C : got ? GOLD : [255, 255, 255];
        // ⚡ ступени — без ГэВ (просьба игрока: энергия удара в цифрах мешала); остывание видно по красным ступеням
        label(`${k}⚡`, lx, ly - 8, 10, !open ? NO_C : got ? GOLD : [200, 210, 230], .85, 600);
        if (this.cellKnown(x)) label(this.cellSym(x), lx, ly + 7, 13, col, .95, 800); // уже создавали — символ (красный — сейчас не создать)
        else { ring(lx, ly + 7, 8, col, .9, 1.5); label('?', lx, ly + 7.5, 11, col, .95, 800); } // ещё не создано, но можно — кружок с «?»
      }
    }
    // энергия столкновения — клин: чем больше набрал, тем толще линия; нити к квантам тоже толстеют
    wedge(sx, sy, Rg, a0, a0 + TAU * Math.max(.005, f.q), 2, 2 + 12 * f.q, inH ? GOLD : FIELD_C, .95);
    if (this.isQ(f.cap[0])) {
      const k = f.lv || 0, x = k ? this.pickCell(kinds, k, this.lvE(k), false) : null, no = k && x && x.c && x.k < k;
      const top = k ? this.cellsAt(kinds, k)[0] : null, tw = top ? this.cellWhy(top, this.lvE(k), false) : '', show = no && top && !this.cellHidden(tw);
      label(k ? `${k} ⚡ → ${x && x.c ? (this.cellKnown(x) ? this.cellSym(x) : '?') : '—'}` : 'слабо', sx, sy + Rg + 50, 15, show ? NO_C : k ? (k === LV_N ? GOLD : [142, 229, 255]) : [200, 205, 220], .95, 800);
      if (show && top) label(`${this.cellKnown(top) ? this.cellSym(top) : '?'}: ${tw || 'закрыто'}`, sx, sy + Rg + 68, 12, NO_C, .85, 600);
    }
  },
  // Энергия детектора — дуга из делений под кругом; пустая и нужна — мигает красным
  /** @param {number} sx @param {number} sy @param {number} r */
  drawEnergy(sx, sy, r) {
    if (!this.enOn()) return;
    const R = r + 9, a0 = Math.PI * .78, span = Math.PI * .56, warn = this.enFx > 0 && Math.sin(G.T * 30) > 0;
    for (let k = 0; k < E_CAP; k++) {
      const a = a0 - (k + .5) / E_CAP * span, fill = clamp(this.en - k, 0, 1);
      const x = sx + Math.cos(a) * R, y = sy + Math.sin(a) * R;
      ctx.globalAlpha = 1; ctx.fillStyle = warn ? 'rgba(255,110,100,.85)' : 'rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
      if (fill > 0) { ctx.fillStyle = rgb(PH_C, .35 + .65 * fill); ctx.beginPath(); ctx.arc(x, y, 3.5 * Math.sqrt(fill), 0, TAU); ctx.fill(); }
    }
    label('⚡', sx, sy + R + 10, 11, this.en < E_SHOT ? [255, 140, 120] : PH_C, .9, 700);
  },
  // Подсказка в одну строку — пока действие не освоено
  /** @param {number} sx @param {number} sy @param {number} r */
  drawHint(sx, sy, r) {
    if (!G.started || G.paused || this.advanced || this.coach.kind || this.inVoid) { pointAt(null); return; } // показывает призрачный курсор — строка не нужна
    /** @type {string | null} */
    let t = null, g = ''; // g — что показать вместо чтения: значок жеста (hold, release, click, move, holdrel) или shop — стрелка к кнопке лавки
    /** @type {boolean | undefined} */
    let hot; // holdrel: сейчас — «зажми» (раскачка: в такт шарику)
    if (this.school) [t, g] = this.schoolHint();
    else if (this.ep === 3) {
      [t, g] = !this.learn.shield ? ['зажать: щит', 'hold']
        : this.waveWarn() ? ['идёт волна антивещества: встретить щитом', 'move']
        : !this.learn.pulse && this.wave && this.wave.cur ? ['отпустить щит рядом с антикварками: ударная волна', 'release']
        : !this.learn.recol && this.stock >= 2 && this.p.some(o => !o.dead && o.sp === 'g' && this.helpGlu(o) && onScreen(...W2S(o.x, o.y), 0)) ? ['глюон в золотом кольце: зажать рядом, щит перекрасит лишний кварк', 'hold'] : [null, ''];
    }
    else if (!this.lit && this.ep === 0) {
      const I = this.inf; g = 'holdrel'; hot = Math.abs(Math.cos(I.th)) > .5; // значки — в такт шарику: на краю — «зажми, оттяни», у дна — «отпусти»
      if (I.hold) t = null;
      else if (I.snapFx > 0) t = 'срыв резонанса: шарик дошёл до красной черты';
      else if (!I.go) t = 'рогатка: оттянуть против хода шарика, отпустить у дна';
      else if (I.late >= 2 && I.late > I.good) t = 'толчок — в сторону, обратную резинке: тянуть против хода шарика';
      else if (I.good < 2) t = 'отпускать, когда шарик проходит дно: там толчок сильнее всего';
      else if (this.madeCls().length < PH_CLS.length) t = 'сильнее размах, жёстче свет: нужны оба класса';
      else if (I.A > .8 && !I.snaps) t = 'у красной черты резинку короче';
    }
    else if (this.ep === 0 && this.lit && !this.rs.ph && this.shopOk()) { t = this.bal() >= RES_COST.ph[0] ? 'кнопка «Сформировать закон» внизу: свет станет законом' : null; g = 'shop'; }
    else if (!this.learn.smash && this.fieldOn() && this.t - this.missT < 5) { t = isTouch() ? 'для столкновения: держать ◉ у двух квантов, затем отпустить' : 'для столкновения: зажать у двух квантов и отпустить'; g = 'holdrel'; }
    else if (this.ep === 0 && !Codex.has('g') && this.p.some(o => !o.dead && o.sp === 'g' && onScreen(...W2S(o.x, o.y), 0)))
      [t, g] = this.canShot() ? [`глюон: навести круг и ${isTouch() ? 'нажать ◉' : 'кликнуть'} для снимка`, 'click'] : ['глюон: для снимка нужна ⚡ из фотонов', 'move'];
    else if (this.ep === 0 && Codex.has('g') && !this.gOn) [t, g] = this.bal() < RES_COST.g[0] ? [`глюон открыт · ✦ на закон глюонов: ${this.bal()}/${RES_COST.g[0]}`, 'move']
      : [this.keyOf('g') && !isTouch() && this.learn.buy ? `глюон открыт · клавиша ${this.keyOf('g')}: закон глюонов` : 'глюон открыт · «Сформировать закон» внизу', 'shop'];
    else if (this.enOn() && !this.measured()) [t, g] = ['ловить фотоны кругом: так измеряется свет', 'move'];
    else if (this.enOn() && (!this.full || this.en < E_SHOT + .5)) [t, g] = ['ловить фотоны: энергия', 'move'];
    else if (!this.learn.snap) [t, g] = [isTouch() ? 'тап ◉: снимок' : 'клик: снимок', 'click'];
    else if (this.focus && this.focus.cap.length === 2 && !this.learn.smash) [t, g] = ['отпустить: столкнуть', 'release'];
    else if (this.ep === 0 && this.pairs > 0 && !Codex.has('g') && this.focus && this.focus.cap.length === 2 && this.focus.cap.every(o => o.sp === 'ph'))
      [t, g] = (this.focus.lv || 0) < LV_N ? [`держать до ${LV_N} ⚡: три струи`, 'hold'] : ['отпустить: кварк излучит глюон', 'release'];
    else if (this.focus && this.focus.cap.length === 2 && this.isQ(this.focus.cap[0]) && !this.learn.lv) [t, g] = ['чем дольше держать, тем сильнее удар', 'hold'];
    else if (this.focus && this.focus.cap.length === 1 && !this.isQ(this.focus.cap[0]) && !this.learn.ann) t = `тяжёлое тянется медленно. Нужна античастица ${this.lab({ ...this.focus.cap[0], anti: !this.focus.cap[0].anti })}`;
    else if (this.focus && this.focus.cap.length === 2 && !this.isQ(this.focus.cap[0]) && !this.learn.ann) [t, g] = [this.band(this.focus) ? 'отпустить в золотой полосе' : 'отпустить: аннигиляция', 'release'];
    else if (this.ep === 1 && this.hig >= 1 && !Codex.has('H') && this.focus && this.focus.cap.length === 2 && this.isQ(this.focus.cap[0]))
      [t, g] = this.focus.cap.every(o => o.sp === 'g') ? ((this.focus.lv || 0) < LV_N ? [`держать до ${LV_N} ⚡: H`, 'hold'] : ['отпустить: H', 'release']) : ['для H нужны два глюона', ''];
    else if (this.ep === 1 && Codex.has('H') && !this.learn.heavy && this.hig >= 1)
      [t, g] = this.p.some(o => !o.dead && !this.isQ(o) && this.grabbable(o) && onScreen(...W2S(o.x, o.y), 0)) ? ['зажать возле частицы: с массой её можно удержать', 'hold'] : ['вещества нет: нужна пара из столкновения квантов', 'holdrel'];
    else if (this.focus && this.focus.cap.length === 2 && this.learn.smash && !this.learn.drop && this.focus.t > 4)
      [t, g] = [isTouch() ? 'провести палец с ◉ на ✕: разжать без удара' : 'правая кнопка или X: разжать без удара', ''];
    else if (this.focus && this.focus.cap.length && this.learn.smash && !this.learn.throw && this.epT > 6) [t, g] = this.thrownReady() ? ['отпустить на ходу: два удара за один заряд', 'release'] : ['разогнаться с квантами', 'move'];
    else if (!this.learn.hold && this.ep === 0 && this.fieldOn()) [t, g] = ['зажать: притянуть кванты', 'holdrel'];
    else if (this.ep === 0 && this.pairs > 0 && !this.rs.coll && this.canBuy()) [t, g] = ['из сделанного вручную можно сформировать закон: лавка внизу', 'shop'];
    else if (!this.learn.buy && this.canBuy()) [t, g] = ['хватает знаний ✦ на закон: лавка внизу', 'shop'];
    if (t && !this.school && !Tips.ok(t)) t = null; // строка живёт TIP_T секунд за всю игру (в школе жестов — пока сцена)
    if (!t) { pointAt(null); return; }
    if (!this.learn.snap && this.lit || (!this.lit && this.ep === 0 && !this.inf.go)) { const ph = (G.T % 1.4) / 1.4; ring(sx, sy, r * (1 + .25 * ph), [255, 255, 255], .5 * (1 - ph), 2); }
    const two = this.focus && this.focus.cap.length === 2 && this.isQ(this.focus.cap[0]); // под шкалой ступеней — ниже
    let ty = sy + r + (two ? 102 : 36);
    const sh = byId('shop'), top = sh.style.display === 'flex' ? sh.getBoundingClientRect().top : 0;
    if (top > 0 && ty > top - 16) ty = sy - r - (two ? 72 : 30); // налезает на лавку — над детектором
    label(t, sx, ty, 14, [255, 255, 255], .75 + .2 * Math.sin(G.T * 4), 700);
    // показать, а не только написать: значок жеста над строкой или стрелка к кнопке лавки
    hintIcons(g, sx, ty, hot);
    pointAt(g === 'shop' ? document.querySelector('#shop button.pri.ok') || document.querySelector('#shop button.res.ok') : null, sx, ty);
  },
  // Стрелки у края экрана — к тому, что нужно снять, если оно за кадром
  drawArrows() {
    /** @type {[number, number, string | RGB][]} */
    const pts = [];
    for (const o of this.p) if (!o.dead && this.wanted(o.sp, o)) pts.push([o.x, o.y, this.ep === 3 ? QCOL[o.col] : SM[o.sp].sym]);
    for (const tr of this.tracks) if (tr.parent && !tr.rec && this.wanted(tr.parent)) pts.push([tr.x, tr.y, SM[tr.parent].sym + '→']);
    for (const h of this.hot) if (!h.done) pts.push([h.x, h.y, '']);
    if (this.enOn()) for (const o of this.p) if (!o.dead && o.sp === 'ph' && this.phClass(o) === PH_TOP) pts.push([o.x, o.y, 'γ!']);
    if (this.waveWarn()) { const d = viewRadius() * 1.2, an = /** @type {number} */ (/** @type {Wave} */ (this.wave).dir); pts.unshift([P.x + Math.cos(an) * d, P.y + Math.sin(an) * d, [255, 90, 90]]); }
    // горячие области — когда звать больше некуда
    if (pts.length < 2) for (const z of this.hz) if (this.hzK(z) > .5) pts.push([z.x, z.y, HZ_C]);
    // не больше трёх ближайших — чтобы край экрана не превратился в ёлку
    edgeArrows(pts, 3);
  },
  // Часы, очки и цели эпохи — сверху по центру
  /** @param {number} alpha */
  drawClock(alpha) {
    if (!G.started || this.inVoid) return;
    if (this.school) return hudTask(alpha, this.tk, 'ДО ЧАСТИЦ · ЖЕСТЫ', this.steps(), [], 'Жесты освоены');
    const done = this.doneAt !== null;
    /** @type {string} */
    let left, col = [255, 255, 255];
    if (this.ep < 3) { left = `${done ? '✓ ' : ''}${fmtClock(this.epClock)}`; col = done ? [140, 235, 170] : PAR[this.ep] && this.epClock > PAR[this.ep] ? [190, 190, 205] : col; }
    else { const r = this.coolLeft(); left = `⏳ ${fmtClock(r)}`; col = done ? [140, 235, 170] : r < 20 ? [255, 140, 120] : col; } // эпоха 4 — обратный отсчёт остывания
    if (this.lit || this.ep) hudClock(alpha, left, col, this.bal(), []); // в прологе часов и знаний ещё нет
    const stars = this.ep === 0 && !this.rs.ph ? [] : this.stars; // в начале — только задание, испытания появятся позже
    if (!this.advanced) hudTask(alpha, this.tk, !this.lit && !this.ep ? 'ПРОЛОГ · ГЛАВА 1' : this.ep ? `ЭПОХА ${this.ep + 1}` : `ЭПОХА 1 · ГЛАВА ${this.chapOf()}`, this.steps(), stars,
      this.ep === 3 ? 'Остывание. Больше кварков сейчас, больше барионов на следующем уровне' : 'Готово!');
    if (this.ep === 3 && !this.advanced && !done) { // цейтнот виден внизу: сколько троек и сколько осталось
      const r = this.coolLeft(), c = r < 20 ? [255, 140, 120] : [205, 200, 230];
      const tr = `тройки ${baryonTrios(this.stockQ)}/${TRIO_GOAL}`, sv = `сбережено ${this.safe.length}/${AUTO_TRIO}`;
      label(G.W < 520 ? `${tr} · ${sv} · ⏳ ${fmtClock(r)}` : `${tr} · ${sv} · остынет через ${fmtClock(r)}`, G.W / 2, aboveShop(), 13, c, .85 * alpha, 700);
    }
  },
  // Заголовок эпохи: всплывает и гаснет, игру не останавливает
  /** @param {number} alpha */
  drawBanner(alpha) {
    if (this.inVoid) return;
    if (this.school) return hudBanner(this.banner, 'ДО ЧАСТИЦ · 10⁻³⁶ с', 'Жесты', 'Частиц ещё нет — только поле. На его сгустках — все жесты игры', alpha);
    if (!this.lit && !this.ep) return hudBanner(this.banner, 'ПРОЛОГ · 10⁻³² с', 'Разогрев', 'Раскачать поле: каждый проход дна генерирует свет. Каким он будет, таким и останется во Вселенной', alpha, 'свет → частицы → из частиц будет сделано всё');
    const E = EPOCHS[this.ep];
    hudBanner(this.banner, `ЭПОХА ${this.ep + 1} · ${E.when}`, E.name, this.ep ? E.line : `Разогрев ${this.inf.pick ? this.inf.pick.n : ''}: ${fmtGeV(this.T0)}, света ×${this.heat.toFixed(1)}`, alpha);
  },
  // Шкала разогрева внизу: сколько света набрано; три оценки — слабый, хороший, отличный (лучше — правее); над ней — сколько живёт поле
  /** @param {number} alpha */
  drawHeat(alpha) {
    const fade = this.lit ? 1 - smooth(1, 2.5, this.litT) : 1, a = alpha * fade;
    if (a <= .01 || this.ep || !G.started || this.inVoid || this.school) return;
    const pad = document.body.classList.contains('touch') ? 124 : 0; // справа — кнопка действия
    const I = this.inf, W = Math.min(440, G.W - (pad ? 48 : 120) - pad), narrow = W < 330, cx = (G.W - pad) / 2, x0 = cx - W / 2, y = G.H - 110, h = 14, cur = this.inf.pick || this.profOf(I.H);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(x0 - 14, y - 34, W + 28, 86, 10); ctx.fill();
    PROF.forEach((p, i) => {
      const hi = i < 2 ? PROF[i + 1].h : 1, xa = x0 + W * p.h, xb = x0 + W * hi, on = cur.i === i, mid = ((p.k[0] + p.k[1]) / 2) ** 1.5;
      ctx.fillStyle = rgb(p.c, on ? .25 : .1); ctx.fillRect(xa, y, xb - xa, h);
      if (i) line(xa, y - 3, xa, y + h + 3, [255, 255, 255], .5, 1);
      label(narrow ? p.n : `${p.n} · свет ×${mid.toFixed(1)}`, (xa + xb) / 2, y + h + 13, narrow ? 10 : 11, on ? p.c : [190, 195, 210], on ? 1 : .6, on ? 800 : 600);
    });
    const fw = W * Math.min(1, I.H), gr = ctx.createLinearGradient(x0, 0, x0 + W, 0);
    PROF.forEach(p => gr.addColorStop(Math.min(1, p.h + .12), rgb(p.c, .95)));
    ctx.fillStyle = gr; ctx.fillRect(x0, y + 3, fw, h - 6);
    if (I.flash > 0) glow(x0 + fw, y + h / 2, 10 + 14 * I.flash, [255, 255, 255], .5 * I.flash);
    ctx.fillStyle = '#fff'; ctx.fillRect(x0 + fw - 1, y - 3, 2, h + 6);
    // рекорд — золотая риска на шкале; под шкалой — сколько сейчас и сколько рекорд
    const B = this.heatBest, Tn = Math.round(T_START * cur.k);
    if (B && B.h && B.h > 0) { const xb = x0 + W * Math.min(1, B.h); ctx.fillStyle = rgb(GOLD, .95); ctx.fillRect(xb - 1, y - 5, 2, h + 10); }
    const HW = this.heatWorld, Wd = HW ? ` · в мире ${HW.score}` : '';
    label(I.go ? `≈ ${Tn} ГэВ${B ? ` · рекорд ${B.s} ГэВ` : ''}${Wd}` : B ? `рекорд разогрева ${B.s} ГэВ${Wd}` : HW ? `рекорд в мире ${HW.score} ГэВ` : '', cx, y + h + 30, 11, B && I.go && Tn > B.s ? GOLD : [215, 220, 235], .85, 700);
    // сколько ещё живёт поле
    const left = I.go ? Math.max(0, INF.life - I.t) : INF.life;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x0, y - 8, W * left / INF.life, 2);
    label(narrow ? (I.go ? `РАЗОГРЕВ · поле живёт ${Math.ceil(left)} с` : 'РАЗОГРЕВ · больше света — лучше') : I.go ? `КАЧЕСТВО РАЗОГРЕВА · поле распадётся через ${Math.ceil(left)} с` : 'КАЧЕСТВО РАЗОГРЕВА · больше света — лучше', cx, y - 20, 11, [235, 240, 250], .85, 700);
    ctx.globalAlpha = 1;
  },
  // Шкала остывания (слева вверху): T в логарифме, слева горячо. Риски — где закрывается окно «сделать руками»:
  // после Хиггса пару X поле родит, пока 2m ≤ 2·T·сила, т. е. до T = m / сила. Сила поля сдвигает окна вниз.
  // Ромб — застывание поля Хиггса (160 ГэВ); пунктир — ниже этой T Вселенная не остынет, пока задание эпохи не выполнено.
  /** @param {number} alpha */
  drawGauge(alpha) {
    if (!G.started || (this.ep === 0 && !this.pairs)) return; // окна тяжёлых частиц важны, когда начал сталкивать
    const x0 = 16, x1 = Math.min(276, G.W - 80), y = 56 + this.leftTop(), lo = Math.log10(.1), hi = Math.log10(2000); // узкий экран — короче
    const X = (/** @type {number} */ T) => lerp(x0, x1, clamp((hi - Math.log10(Math.max(T, .1))) / (hi - lo), 0, 1));
    ctx.globalAlpha = alpha;
    const gr = ctx.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(255,240,190,.9)'); gr.addColorStop(.35, 'rgba(255,140,60,.9)'); gr.addColorStop(.7, 'rgba(200,50,110,.85)'); gr.addColorStop(1, 'rgba(70,90,220,.85)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x0, y - 2, x1 - x0, 4, 2); ctx.fill();
    ctx.font = '600 9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(220,225,240,.55)'; ctx.fillText('остывание →', x1 + 6, y);
    // застывание поля Хиггса
    const xh = X(160); ctx.fillStyle = rgb(GOLD, this.hig >= 1 ? .5 : .95);
    ctx.beginPath(); ctx.moveTo(xh, y - 6); ctx.lineTo(xh + 3, y - 3); ctx.lineTo(xh, y); ctx.lineTo(xh - 3, y - 3); ctx.closePath(); ctx.fill();
    // окна тяжёлых частиц
    const need = this.ep === 2 ? this.need2 : this.ep === 0 ? this.need0 : [];
    let lastX = -99, row = 0; // близкие подписи — в два ряда
    for (const sp of ['t', 'Z', 'W', 'b', 'ta', 'c']) {
      // Z рождается один (e⁺e⁻ → Z), не парой: порог вдвое ниже
      const Tc = SM[sp].m / this.up('pow') / (sp === 'Z' ? 2 : 1), x = X(Tc), shut = this.hig >= 1 && this.T < Tc, kn = Codex.has(sp);
      row = x - lastX < 12 ? 1 - row : 0; lastX = x; const ly = y - 15 - row * 11;
      const col = shut ? [120, 125, 140] : need.includes(sp) && !this.decSeen.has(sp) ? GOLD : kn ? this.color({ sp, anti: false, col: 0 }) : [210, 220, 240];
      ctx.globalAlpha = alpha * (shut ? .55 : 1); ctx.fillStyle = rgb(col, 1); ctx.fillRect(x - .75, y - 9, 1.5, 7);
      label(kn ? SM[sp].sym : '?', x, ly, 10, col, alpha * (shut ? .55 : 1), 700);
      if (shut) { ctx.strokeStyle = rgb(col, .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 5, ly + 4); ctx.lineTo(x + 5, ly - 4); ctx.stroke(); }
    }
    // предел эпохи: пока задание не выполнено, ниже Вселенная не остынет
    const fl = EPOCHS[this.ep].floor;
    if (fl > 0 && !this.epDone) { const xf = X(fl); ctx.globalAlpha = alpha * .8; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(xf, y - 6); ctx.lineTo(xf, y + 6); ctx.stroke(); ctx.setLineDash([]); }
    // где сейчас Вселенная
    const xt = X(this.T); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(xt, y + 3); ctx.lineTo(xt + 5, y + 10); ctx.lineTo(xt - 5, y + 10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  },
  // Трекер: сколько поймано фотонов каждого класса (слева вверху); не найденный класс — «?»
  /** @param {number} alpha */
  drawCaught(alpha) {
    if (!this.caughtOn()) return; // свет измерен — трекер больше не нужен
    const x = 16, y0 = 84 + this.leftTop();
    ctx.globalAlpha = alpha * .9; ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(220,225,240,.6)'; ctx.fillText('ПОЙМАНО γ', x, y0);
    if (this.narrowHud()) { // узкий экран — одной строкой рядом с заголовком
      let cx = x + 70;
      PH_CLS.forEach((C, i) => {
        const seen = this.phSeen.has(i); ctx.globalAlpha = alpha * (seen ? 1 : .45);
        ctx.fillStyle = rgb(C.c, 1); ctx.beginPath(); ctx.arc(cx + 4, y0, 4, 0, TAU); ctx.fill();
        ctx.font = '600 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(235,240,250,.95)'; const s = String(this.caught[i]); ctx.fillText(s, cx + 11, y0); cx += 18 + ctx.measureText(s).width;
      });
      ctx.globalAlpha = 1; return;
    }
    PH_CLS.forEach((C, i) => {
      const y = y0 + 16 + i * 15, seen = this.phSeen.has(i), hot = this.caughtFx === i && G.T - this.caughtAt < .6 ? 2.5 * (1 - (G.T - this.caughtAt) / .6) : 0;
      ctx.globalAlpha = alpha * (seen ? 1 : .45);
      ctx.fillStyle = rgb(C.c, 1); ctx.beginPath(); ctx.arc(x + 4, y, 4 + hot, 0, TAU); ctx.fill();
      ctx.font = '600 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(235,240,250,.95)';
      ctx.fillText(seen ? C.n : '?', x + 14, y);
      ctx.textAlign = 'right'; ctx.fillText(String(this.caught[i]), x + 128, y); ctx.textAlign = 'left';
    });
    ctx.globalAlpha = 1;
  },
  // Пустота: строки предыстории проявляются по одной, у детектора — «зажми»
  /** @param {number} alpha */
  drawVoid(alpha) {
    if (!this.inVoid || !G.started) return;
    const t = this.voidT, cx = G.W / 2, y0 = G.H * .2, sz = G.W < 520 ? 15 : 18;
    VOID_TXT.forEach((txt, i) => {
      const a = smooth(.3 + i * VOID_STEP, 1.3 + i * VOID_STEP, t);
      if (a > 0) label(txt, cx, y0 + i * (sz + 12) + (i > 2 ? 14 : 0), sz, i > 2 ? [255, 226, 160] : [215, 222, 240], a * alpha, i > 2 ? 700 : 500);
    });
    if (t > VOID_MIN) {
      const [sx, sy] = W2S(P.x, P.y), r = this.hr() * cam.z, ph = (G.T % 1.4) / 1.4;
      ring(sx, sy, r * (1 + .25 * ph), [255, 255, 255], .5 * (1 - ph) * alpha, 2);
      label(isTouch() ? 'держать ◉: тронуть поле' : 'зажать: тронуть поле', sx, sy + r + 36, 15, [255, 255, 255], (.7 + .25 * Math.sin(G.T * 4)) * smooth(VOID_MIN, VOID_MIN + .6, t) * alpha, 700);
    }
  },
  /** @param {number} alpha */
  overlay(alpha) {
    if (this.stockOut) return;
    // узкий экран: итоги уровня встают под панель задания — туда же, где шкала остывания и трекеры; пока они видны — не рисуем
    const crowd = G.W <= 700 && Tally.t > 0;
    this.drawVoid(alpha); this.drawHeat(alpha); this.drawClock(alpha); if (!crowd) { this.drawGauge(alpha); this.drawCaught(alpha); this.drawMeter(alpha); } this.drawBanner(alpha); ctx.globalAlpha = 1;
  },
  // метрика вида: сколько его сейчас в мире (частица и античастица вместе; гаснущие — уже нет)
  /** @param {string} sp @returns {{ n: number }} */
  metric(sp) {
    let n = 0; for (const o of this.p) if (!o.dead && o.sp === sp && !(o.fade >= 0)) n++;
    return { n };
  },
  caughtOn() { return G.started && this.enOn() && this.ep !== 3 && !this.measured(); },
  // «Во Вселенной»: свет и лептоны трёх поколений — счётчик (Counts): число, перемена вспыхивает; не открытое — «?»
  /** @param {number} alpha */
  drawMeter(alpha) {
    if (!G.started || !this.lit || this.inVoid || this.ep === 3) return;
    if (this.caughtOn()) return; // пока меряешь свет — слева «Поймано γ»; измерил — на её месте «Во Вселенной»
    Counts.draw('ВО ВСЕЛЕННОЙ', METER.map(M => ({ k: M.sp, sym: M.n, c: M.c, n: this.metric(M.sp).n, seen: Codex.has(M.sp) })), 16, 84 + this.leftTop(), alpha, this.narrowHud());
  },
  // узкий экран: трекер γ и «Во Вселенной» — одной строкой, чтобы между панелями и лавкой оставалось поле
  narrowHud() { return G.W < 520 || G.H < 640; },
  // Шкала остывания и трекер γ — слева вверху; если там карточки задания (узкий экран) — под ними
  leftTop() {
    const cx0 = (G.W - Math.min(400, G.W - 24)) / 2;
    return cx0 < 345 && G.T - (G.taskAt ?? -9) < .2 ? Math.max(0, G.taskY - 26) : 0;
  },
  // кодекс появляется с первым открытием (до того его нет); сетка — когда открыто больше, чем свет; до того — фишка «Кодекс»
  showCodex() { return !Codex.run.size ? null : this.ep > 0 || (this.lit && Codex.run.size >= 2); },
  showLadder() { return this.lit || this.ep > 0; }, // путь Вселенной — с первым светом
  viewR() { return 3.5 + this.hr() * 1.9; },
  hud() {
    return { title: '', sub: `T ≈ ${fmtGeV(this.T)}${this.ff > 1 ? ' · ×4' : ''}`, lines: [], goal: '', laws: [] };
  },
};
/** @typedef {IsStage<typeof Particles>} ParticlesIsStage — Particles выполняет договор этапа (Stage в types/game.d.ts) */
