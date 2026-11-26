// Типы для проверки JS без сборки (tsc --noEmit, см. tsconfig.json). В игру не попадают: браузер грузит только js/*.js.
// Файл глобальный (без import/export) — как и скрипты игры: всё объявленное видно во всех js/*.js.

/** Цвет [r, g, b] (0…255) */
type RGB = number[];

/** Частица Стандартной модели — запись в SM (universe.js) */
interface Species {
  sym: string; name: string;
  kind: 'quark' | 'lepton' | 'nu' | 'boson';
  gen?: number; m: number; q: number;
  /** среднее время жизни, с (нет — стабильна) */
  life?: number;
}

/** Строка таблицы рекордов (localStorage, LB в s_particles.js) */
interface LBEntry { n: string; s: number; t: number | null; d: number; h?: number; p?: number }

/** Испытание ★ (pickStars / tickStars в core.js); st: 0 — идёт, 1 — выполнено, -1 — провалено */
interface Star { t: string; ok?: () => boolean; bad?: () => boolean; atEnd?: boolean; can?: () => boolean; st: number }

// ---------- общее (core.js) ----------

/** Вспышка или кольцо в мире (fxRing / fxFlash) */
interface Fx { x: number; y: number; r0: number; r1: number; t: number; dur: number; c: RGB; kind: 'ring' | 'flash' }
/** Фишка в строке: [текст, [цвет фона, прозрачность], цвет текста, зачёркнуто] */
type Chip = [string, [RGB, number], RGB, boolean?];
/** Состояние панели задания у этапа (hudTask): прошлые галочки шагов и ★, вспышка «✓ …», когда закрыт шаг */
interface TaskPanel { ds?: boolean[]; ss?: number[]; fl?: { txt: string; c: RGB; at: number }; doneAt?: number }
/** Строка сводки «Законы Вселенной»: научено (lv раз), ровный доход rate ✦/мин (acc — накоплено до 1 ✦),
 *  сколько принесла ✦ и ⚡, событий n, когда научено t0, последняя выплата fl, выплаты [время, ✦] за минуту */
interface UniRow { k: string; ic: string; name: string; lv: number; rate: number; acc: number; kn: number; en: number; n: number; t0: number; fl: number; log: [number, number][] }

/** Итоги уровня (tally): строки [подпись, значение, класс], доля Вселенной [сама, всего] */
interface TallyData { name: string; rows: [string, string | number, string?][]; auto?: [number, number] | null; stars?: Star[] }

/** Этап лестницы (STAGES в main.js) — то, что main.js и core.js вызывают у уровня. Необязательное — не у всех. */
interface Stage {
  key: string; name: string;
  /** цвет фона */
  bg: RGB;
  /** подсказка по управлению (HTML) */
  controls?: string;
  /** очки забега на входе в уровень (ставит advance) */
  scoreAt?: number;
  /** ✦ уровня — main.js превращает прирост в очки */
  kn?: number;
  /** «Законы Вселенной» (core.js Uni): строки научённого; работает ли сейчас; где показать «+1 ✦» */
  uni?: UniRow[];
  uniOn?(k: string): boolean;
  uniOff?: Set<string>;
  doneAt?: number | null;
  uniSet?(k: string, on: boolean): void;
  /** открыто впервые в забеге — что дальше (строка на карточке открытия) */
  seeNext?(k: string): string;
  uniPop?(k: string): boolean;
  cheated?: boolean;
  /** копилка уровня: ✦ на руках; потрачено (в минус — принесено с прошлого уровня, carryIn — ещё не показано) */
  bal?(): number; spent?: number; carryIn?: number;
  /** уровень кончился по времени (или тупику), а цель не выполнена — без бонуса уровня */
  failed?: boolean;
  float?(x: number, y: number, txt: string, c?: RGB, sz?: number): void;
  /** время уровня, с (для таблицы рекордов) */
  clock?: number; t?: number;
  /** уровень управляется рогаткой: палец — сам жест */
  sling?: unknown;
  enter(prev?: Stage | null): void;
  update(dt: number, active: boolean): void;
  viewR(): number;
  draw(alpha: number): void;
  drawPlayer(alpha: number): void;
  overlay?(alpha: number): void;
  hud(): unknown;
  tally?(): TallyData;
  /** сетка кодекса (true), фишка «Кодекс» (false) или пока ничего (null) */
  showCodex?(): boolean | null;
  /** показывать ли путь Вселенной внизу (нет — всегда) */
  showLadder?(): boolean;
  renderUpg?(el: HTMLElement): void;
  renderShop?(el: HTMLElement): void;
  startTut?(): void;
  wheel?(d: number): void;
  dash?(): void;
  enterKey?(): void;
  detach?(): void;
  pick?(i: number): void;
  buy?(i: number): void;
  closeCard?(): void;
  cheat?(): void;
}

/** Проверка «этот объект — этап»: @typedef {IsStage<typeof X>} в файле этапа — ошибка, если X не выполняет договор Stage */
type IsStage<T extends Stage> = T;

// ---------- уровень частиц (s_particles.js) ----------

/** Объект мира частиц: квант (γ, g) или частица вещества. Поля после dead — состояние, которое заводят по ходу. */
interface Q {
  sp: string; anti: boolean;
  x: number; y: number; dx: number; dy: number;
  /** импульс (ГэВ) */
  p: number;
  /** цвет кварка (0…2); у глюона — цвет, col2 — антицвет */
  col: number; col2?: number;
  age: number; life: number; born: number; cd: number; dead: boolean;
  /** фаза волны кванта */
  ph: number;
  /** размах волны кванта (у вещества 0); след вещества — только у вещества */
  amp: number; trail?: number[][];
  /** держит поле детектора */
  cap?: boolean;
  /** летит после отпускания/броска: секунды полёта (0 — не летит), своя скорость */
  flung: number; p0?: number; qt?: number; ql?: number; v?: number; thrown?: boolean; sib?: Q | null; mate?: Q | null;
  /** ступень удара при отпускании (действует 3 с с lvAt) */
  lv: number | null; lvAt: number;
  /** гаснет (−1 — нет); «твоё» на виду, секунды; отброшен щитом; втягивается щитом */
  fade: number; mine: number; rep: number; pull: number;
  /** рождена самой Вселенной (исследованное «Рождение X»), а не тобой */
  uni?: boolean;
  /** антикварк волны эпохи 4 */
  wave?: boolean;
  /** как родилась — схема для сцены открытия */
  rx?: Rx;
}
/** Схема реакции: что вошло → что вышло ([символ, вид]), k — сила удара (0 — без удара) */
/** k — ступень удара 1–4, 0 — без удара, −1 — сила не названа (игрок подбирает сам) */
interface Rx { l: [string, string][]; r: [string, string][]; k: number }
/** То, что нужно для цвета и подписи: частица или её описание в следе */
interface Look { sp: string; anti: boolean; col: number; col2?: number }

/** Клетка матрицы рождения: вид (или 'WW') и третья струя-глюон */
interface Cell { c: string; glu?: boolean }
/** Итог выбора клетки: что родит удар на ступени k (c = null — ничего), why — почему ниже запрошенной */
type Hit = (Cell & { k: number; why: string }) | { c: null; glu?: undefined; k: number; why: string };

/** Поле детектора: захваченные, заряд q (0…1), энергия E, ступень lv */
interface Focus { cap: Q[]; q: number; E: number; lv: number; ang: number; t: number; t2?: number; dry?: boolean; cand?: Q | null; candT?: number }

type Prof = typeof PROF[number];
/** Разогрев: зона PROF, температура k (T = k·1 ТэВ), сколько света (heat) */
type Heat = Omit<Prof, 'k'> & { i: number; k: number; heat: number };

/** Пролог: инфлатон в чаше (mkInf) */
interface Inf {
  A: number; th: number; H: number; t: number; idle: number; go: boolean; hold: boolean;
  gain: number; loss: number; flash: number; snapFx: number; snaps: number; good: number; late: number;
  pick: Heat | null; zone: number;
  /** сколько пар создано каждого класса света */
  made: number[];
}

/** След события: вершина с лучами осколков */
interface Track {
  x: number; y: number; t: number; life: number; sps: string[];
  parent: string | undefined; col: RGB | undefined;
  angs: number[]; dsp: [string, boolean, number, number | undefined][];
  rec?: boolean;
  rx?: Rx;
}
interface Float { x: number; y: number; t: number; txt: string; c: RGB; sz: number }
interface Hot { x: number; y: number; t: number; sp: string; done?: boolean }
/** горячая область на карте частиц: центр, радиус, возраст и срок */
interface HotZone { x: number; y: number; r: number; t: number; L: number; em?: number }
interface Ripple { x: number; y: number; t: number }
/** Эпоха 4: волна антивещества (cur — летящая сейчас) */
interface Wave { n: number; cd: number; dir: number | null; cur: { list: Q[]; t: number; eaten0: number } | null }
/** Тройка, сбережённая Вселенной */
interface Safe { a: number; r: number; w: number; t0: number; q: string[] }
interface Stored { fl: string; col: number }
interface Handoff { x: number; y: number; vx: number; vy: number; fl: string; col: number }
interface Tut { i: number; t: number; abs: number; weak: number; lep: number; q: number; end: number }
interface CoachPick { kind: string; o?: Q; o2?: Q; el?: HTMLElement }
interface Coach { idle: number; t: number; kind: string | null; o?: Q | null; o2?: Q | null; el?: HTMLElement | null }
/** Освоенные жесты (подсказки гаснут) */
interface Learn {
  absorb?: boolean; snap?: boolean; snapNew?: boolean; hold?: boolean; smash?: boolean; lv?: boolean; throw?: boolean;
  hit?: boolean; heavy?: boolean; pair2?: boolean; ann?: boolean; buy?: boolean; shield?: boolean; pulse?: boolean; recol?: boolean;
  /** первая покупка в лавке показана сценой обучения */
  taught?: boolean;
}
/** Статистика эпохи для испытаний */
interface EpochStat { pairs: number; thr: number; empty: number; kinds: number; dry: number; eaten: number; recol: number; waves: number; ann?: number }
/** Исследование в лавке ✦ */
interface Research { k: string; ic: string; name: string; cost: number[]; about: (l: number) => string }
/** Строка лавки: исследование (r) или улучшение детектора за ★ (up); c — цена, pri — нужно для задания */
type ShopItem = { r: Research; c: number; pri: boolean };

/** Состояние уровня частиц: всё, что заводят enter() и эпохи. Объявлено здесь, чтобы tsc ловил опечатки в this.поле. */
interface ParticlesState {
  /** все объекты мира */
  p: Q[];
  /** время уровня, с; температура (ГэВ) и стартовая после разогрева */
  t: number; T: number; T0: number; heat: number;
  /** поле Хиггса 0…1 и его таймер (−1 — ещё не застыло), центр решётки */
  hig: number; higT: number; higC: { x: number; y: number };
  ripples: Ripple[]; ripCd: number;
  /** ускорение времени (Enter — ×4) */
  ff: number;
  /** уровень кончился, идут итоги */
  advanced: boolean;
  gOn: boolean; full: boolean; spCd: number;
  /** свет создан (пролог позади) */
  lit: boolean; litT: number;
  /** уровни исследований (ph, g, coll, cp и «X сам» по видам) */
  rs: Record<string, number> & { ph: number; g: number; coll: number; cp: number };
  safe: Safe[]; saveCd: number; autoT: number;
  inf: Inf;
  heatBest: LBEntry | null; heatRes: { T0: number; pts: number; place: number; n: number; rec: boolean } | null;
  heatWorld: { score: number } | null;
  /** поймано фотонов по классам; последний пойманный — для вспышки в трекере */
  caught: number[]; caughtFx: number; caughtAt: number;
  phSeen: Set<number>;
  /** ✦ добыто и потрачено */
  kn: number; spent: number; uni: UniRow[];
  epClock: number; epKn0: number; doneAt: number | null; lvlTotal: number;
  /** была отладка — без рекордов */
  cheated: boolean;
  tut: Tut | null;
  inVoid: boolean; voidT: number;
  focus: Focus | null; holding: boolean; hold: number; shield: number;
  learn: Learn; coach: Coach;
  /** что уже показано стоп-кадром (Spot) в этом забеге; когда жест «зажми у двух» не вышел */
  spotted: Set<string>; missT: number;
  /** энергия детектора ⚡ */
  en: number; enFx: number;
  shotCd: number; shotFx: number;
  tracks: Track[]; floats: Float[];
  seenN: Record<string, number>;
  ejected: number;
  /** эпоха 0…3 */
  ep: number; epDone: boolean; epGap: number; bannerFor: number; banner: number; epT: number;
  pairs: number; decSeen: Set<string>; tries: Record<string, number>;
  hot: Hot[]; hotCd: number; hz: HotZone[]; hzCd: number; hzSeen: boolean; cz: HotZone[]; czCd: number; czSeen: boolean; hzSp: number; uniOff: Set<string>;
  /** эпоха 4: запас кварков в детекторе */
  stock: number; stockQ: Stored[]; soupCd: number;
  /** u и d, что Вселенная накопила к эпохе 4 (фора) */
  udRes: string[]; eRes: number; forgedQ: string[];
  /** таймер запаса u/d; когда t Вселенной последний раз зарядил ⚡ (время уровня) */
  udT: number; tAt: number;
  handoff: Handoff[] | null; stockOut: boolean; finale: number;
  /** цели забега: эпоха 1 — что открыть, эпоха 3 — чьи распады снять */
  need0: string[]; need2: string[];
  st: EpochStat;
  /** состояние карточек задания (hudTask) */
  tk: TaskPanel;
  stars: Star[];
  wave?: Wave;
  annN?: number;
  /** исследование для текущего шага задания (кэш на кадр) */
  _pk: string | null | undefined; starsShown: boolean;
}

/** Шаг задания эпохи (hudTask в core.js): t — заголовок, h — подсказка, d — выполнен, res — нужное исследование,
 *  items — галочки, p — [сколько, из скольких], s — что написать по выполнении */
/** Шаг задания; rx — рецепт значками (что с чем столкнуть и с какой силой) */
interface Step { t: string; h?: string | null; s: string; d: boolean; res?: string | null; items?: [string, boolean][]; p?: [number, number]; rx?: Rx }
