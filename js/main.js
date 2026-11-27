"use strict";
const STAGES = [Particles, Quarks, Nuclei, Stars, Atoms, Mols];
const LADDER = ['Частицы', 'Адроны', 'Ядра', 'Звёзды', 'Атомы', 'Молекулы', 'Органика', 'Протоклетки', 'Клетки', 'Организмы'];
const TRANS_DUR = 3, CTL_T = 15; // CTL_T — сколько секунд в первый визит видна строка управления
// Управление на заставке: значок жеста и что он делает, каждый жест в своей строке
document.getElementById('gdesk').innerHTML = [[GEST.move(), 'Мышь: вести детектор'], [GEST.click(), 'Клик: снимок'], [GEST.hold(), 'Зажать: притянуть кванты'],
  [GEST.release(), 'Отпустить: столкнуть'], [GEST.rclick(), 'Правая кнопка или X: разжать без удара'], [GEST.wheel(), 'Колесо: зум'], [GEST.key('M'), 'M: звук']].map(([s, l]) => gestItem(s, l)).join('');
// Путь Вселенной на заставке: где ты сейчас и куда идёшь (дальше «Молекул» — ещё в разработке)
// путь Вселенной в заставке; готовые уровни можно нажать — забег начнётся с него (проверить уровень, не проходя всё заново)
G.fromI = 0;
function drawPath() {
  document.getElementById('path').innerHTML = LADDER.map((n, i) => (i ? `<i style="animation-delay:${i * .12}s">→</i>` : '') +
    `<span data-i="${i}" class="${i === G.fromI ? 'on ' : ''}${i < STAGES.length ? 'pick' : i === LADDER.length - 1 ? 'goal' : 'soon'}" style="animation-delay:${i * .12}s"${i < STAGES.length ? ` title="начать с уровня «${n}»"` : ''}>${n}</span>`).join('') +
    `<span class="from">${G.fromI ? `начать с уровня «${LADDER[G.fromI]}»: счёт не пойдёт в общую таблицу` : 'уровень можно выбрать: забег начнётся с него'}</span>`;
  document.getElementById('go').textContent = G.fromI ? `Начать: ${LADDER[G.fromI]}` : 'Начать';
}
drawPath();
document.getElementById('path').onclick = e => {
  const el = /** @type {HTMLElement} */ (e.target).closest('span.pick'); if (!el) return;
  G.fromI = +el.dataset.i; drawPath();
  document.getElementById('path').querySelectorAll('span, i').forEach(s => { s.style.animation = 'none'; }); // без повторного въезда
};
// забег не с начала: сразу нужный уровень (каждый умеет начаться и без предыдущего)
function jumpTo(i) {
  if (!(i > 0) || i >= STAGES.length) return;
  G.stageI = i; G.stage = STAGES[i]; G.prev = null; G.trans = 1; G.stage.enter(null); G.stage.scoreAt = G.score;
}

// Переход: старый этап продолжает жить и гаснет, новый проявляется и забирает его частицы.
function advance() {
  if (G.stageI >= STAGES.length - 1) return;
  Tally.show(G.stage);
  const carry = carryOf(G.stage); mouse.clicked = false; // нажатие прошлого уровня — не в новый
  G.zoom = 1; // свой зум у каждого уровня: приближение прошлого не делает следующий невыполнимым
  G.prev = G.stage; G.stageI++; G.stage = STAGES[G.stageI]; G.trans = 0; G.prevU = { s: 1, ox: 0, oy: 0 }; Sfx.hum(0); Sfx.play('segment');
  G.stage.enter(G.prev); G.stage.scoreAt = G.score;
  // остаток ÷ 10 — в копилку нового уровня (траты «в минус»: ✦ уровня, а значит и очки, не растут)
  if (carry > 0) G.stage.carryIn = carry; // в копилку — когда переход кончится (вместе с искрами: счётчик не прыгает вверх-вниз)
}
function endGame(text) {
  if (G.ended) return;
  payMilestones(G.stage); // вехи последнего кадра — тоже в очки
  G.ended = true;
  document.getElementById('endtext').textContent = text;
  // счёт забега: в таблицу браузера и (если включена) в общую
  const cheated = G.fromI > 0 || STAGES.some(s => s.cheated), secs = (Date.now() - (G.runT0 || Date.now())) / 1000, el = document.getElementById('endlb');
  const local = lbTable('total', { n: LB.name(), s: Math.round(G.score), t: Math.floor(secs), d: Date.now() }, cheated);
  const mine = local.replace('class="rk">', 'class="rk">в этом браузере · ');
  el.innerHTML = `<div class="rk big">${fmtScore(G.score)} очков за забег</div><div id="endon">${Online.on() ? '' : mine}</div>`;
  endBoard(document.getElementById('endon'), G.score, secs, cheated, mine);
  setTimeout(() => { document.getElementById('end').style.display = 'flex'; }, 1500);
}

// ---------- ввод ----------
addEventListener('resize', resize); resize();
// Мышь, палец и перо — одни Pointer Events.
// Мышь: ведёт курсором, кнопка — действие (клик — снимок, зажать — поле).
// Сенсор — «два больших пальца»: палец на экране ведёт детектор (как курсор; отпустил — тормозит),
// кнопка ◉ справа внизу — действие, два пальца на экране — щипок-зум. Кнопки сбоку заменяют клавиши.
const ZOOM_MIN = .55, ZOOM_MAX = 2.2;
const ptrs = new Map(); let steerId = null, pinch0 = null, mpan = null; // mpan — карту тянут правой кнопкой (уровни с рогаткой)
const isTouch = () => document.body.classList.contains('touch');
function touchMode() { if (!isTouch()) { document.body.classList.add('touch'); resize(); } }
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') {
    if (mpan) { panBy(e.clientX - mpan.x, e.clientY - mpan.y); mpan = { x: e.clientX, y: e.clientY }; }
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; mouse.idle = false; return;
  }
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch0 && ptrs.size >= 2) {
    const [p, q] = [...ptrs.values()], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    G.zoom = clamp(pinch0.z * Math.hypot(p.x - q.x, p.y - q.y) / pinch0.d, ZOOM_MIN, ZOOM_MAX);
    if (G.stage.sling) panBy(mx - pinch0.mx, my - pinch0.my); // два пальца — ещё и сдвиг карты
    pinch0.mx = mx; pinch0.my = my; return;
  }
  if (e.pointerId === steerId) { mouse.x = e.clientX; mouse.y = e.clientY; }
});
// второй палец: короткое касание (до TAP2_T мс) поверх ведущего — «разжать»
const TAP2_T = 300;
/** @type {{ id: number, t: number, x: number, y: number } | null} */
let tap2 = null;
// двойной клик или касание: второе нажатие рядом с первым в пределах 0,4 с — ловим здесь, а не по кадрам (быстрый дабл-клик короче кадра)
let lastDown = { t: -1e9, x: 0, y: 0 };
/** @param {PointerEvent} e */
function markDbl(e) {
  const t = performance.now();
  mouse.dbl = t - lastDown.t < 400 && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 36;
  lastDown = { t: mouse.dbl ? -1e9 : t, x: e.clientX, y: e.clientY };
}
addEventListener('pointerdown', e => {
  Sfx.unlock(); G.inT = G.T; // звук включается первым жестом игрока (так требует браузер); inT — игрок здесь (законы платят)
  if (Cine.stop) { e.stopPropagation(); Cine.skip(); if (e.pointerType !== 'mouse') touchMode(); return; } // кадр-пауза: касание — дальше, в игру не идёт
  if (Spot.on) { e.stopPropagation(); Spot.skip(); return; } // стоп-кадр со стрелкой: так же
  // открытый список законов (телефон): касание мимо — свернуть; касание поля только сворачивает и в игру не идёт
  { const u = byId('uni'); if (u.classList.contains('open') && !(e.target instanceof Node && u.contains(e.target))) { u.classList.remove('open'); if (e.target === cv) { e.stopPropagation(); return; } } }
  if (e.pointerType === 'mouse') {
    if (e.button !== 0) { if (G.stage.sling && e.target === cv) mpan = { x: e.clientX, y: e.clientY }; return; } // правая/средняя — тянуть карту (где карта своя), иначе — ничего
    if (e.target !== cv) return; // кнопки, лавка, кодекс — не поле
    mouse.down = true; if (G.started) { mouse.clicked = true; mouse.x = e.clientX; mouse.y = e.clientY; markDbl(e); } return;
  }
  touchMode();
  if (e.target !== cv) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) { steerId = e.pointerId; mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; mouse.idle = false; markDbl(e); if (G.stage.sling || G.stage.finger) { mouse.down = true; mouse.clicked = true; } } // рогатка: палец — сам жест
  else if (ptrs.size === 2) { tap2 = { id: e.pointerId, t: performance.now(), x: e.clientX, y: e.clientY }; const [p, q] = [...ptrs.values()]; pinch0 = { d: Math.max(20, Math.hypot(p.x - q.x, p.y - q.y)), z: G.zoom || 1, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2 }; mouse.idle = true; if (G.stage.sling && mouse.down) { mouse.cancel = true; mouse.down = false; } }
}, true);
/** @param {PointerEvent} e @param {boolean} [cancel] система отняла жест (входящий звонок, жест ОС) — отмена, а не бросок */
function ptrUp(e, cancel = false) {
  if (e.pointerType === 'mouse') { if (e.button !== 0) { mpan = null; return; } if (cancel && G.stage.sling && mouse.down) mouse.cancel = true; mouse.down = false; return; }
  const pt = ptrs.get(e.pointerId);
  if (!ptrs.delete(e.pointerId)) return;
  const wasPinch = !!pinch0;
  if (tap2 && tap2.id === e.pointerId && pt && !cancel && performance.now() - tap2.t < TAP2_T && Math.hypot(pt.x - tap2.x, pt.y - tap2.y) < 24 &&
    G.started && !G.paused && G.stage.drop && G.stage.drop() && pinch0) G.zoom = pinch0.z;
  if (tap2 && tap2.id === e.pointerId) tap2 = null;
  if (ptrs.size < 2) pinch0 = null;
  if (e.pointerId === steerId) { steerId = null; mouse.idle = true; if (G.stage.sling || G.stage.finger) { if (cancel && mouse.down) mouse.cancel = true; mouse.down = false; } } // отпустил — детектор тормозит (рогатка — бросок)
  // щипок кончился, один палец остался — он снова ведёт (без нажатия: жест — новым касанием)
  if (wasPinch && ptrs.size === 1) { const [[id, p]] = [...ptrs]; steerId = id; mouse.x = p.x; mouse.y = p.y; mouse.idle = false; }
}
addEventListener('pointerup', e => ptrUp(e)); addEventListener('pointercancel', e => ptrUp(e, true));
// окно потеряло фокус (Alt+Tab, уведомление) — отпустить всё: иначе кнопка и клавиши «залипают» до следующего нажатия;
// тело в рогатке — отмена, а не бросок в никуда
addEventListener('blur', () => {
  if (G.stage.sling && mouse.down) mouse.cancel = true;
  mouse.down = false; keys.clear(); ptrs.clear(); steerId = null; pinch0 = null; mpan = null; mouse.idle = true;
});
cv.addEventListener('contextmenu', e => e.preventDefault());
// правая кнопка — разжать взятое без удара (если этап это умеет и что-то держишь)
cv.addEventListener('mousedown', e => { if (e.button === 2 && G.started && !G.paused && G.stage.drop) G.stage.drop(); });
// Кнопка действия: тап — как клик, удержание — как зажатая кнопка мыши
const actBtn = document.getElementById('act');
actBtn.addEventListener('pointerdown', e => { e.preventDefault(); try { actBtn.setPointerCapture(e.pointerId); } catch (err) { /* без захвата */ } mouse.down = true; if (G.started) mouse.clicked = true; actBtn.classList.add('on'); });
// разжать без удара на сенсоре: провести палец с ◉ на ✕ и отпустить там (разбор дизайна: оторвать палец от ◉,
// чтобы нажать ✕, — это уже «отпустить», то есть удар; третьего пальца нет)
/** @param {PointerEvent} e */
const overDrop = e => { const b = document.getElementById('t-drop'); if (!b || b.style.display === 'none') return false; const r = b.getBoundingClientRect(); return r.width > 0 && e.clientX > r.left - 14 && e.clientX < r.right + 14 && e.clientY > r.top - 14 && e.clientY < r.bottom + 14; };
/** @param {PointerEvent} [e] */
const actUp = e => {
  const s = G.stage, tDrop = document.getElementById('t-drop');
  if (e && e.type === 'pointerup' && mouse.down && overDrop(e) && s.drop && s.canDrop && s.canDrop()) s.drop(); // взятое разжато — отпускание ◉ уже не удар
  mouse.down = false; actBtn.classList.remove('on'); if (tDrop) tDrop.classList.remove('hot');
};
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => actBtn.addEventListener(ev, actUp));
actBtn.addEventListener('pointermove', e => { const b = document.getElementById('t-drop'); if (b && mouse.down) b.classList.toggle('hot', overDrop(e)); });
actBtn.addEventListener('contextmenu', e => e.preventDefault());
// Кнопки вместо клавиш: тап — нажатие; ⟲ ⟳ держатся, пока держишь
const fakeKey = code => dispatchEvent(new KeyboardEvent('keydown', { code }));
document.getElementById('tbar').addEventListener('pointerdown', e => {
  const b = e.target.closest('button'); if (!b) return; e.preventDefault();
  if (b.dataset.hold) { keys.add(b.dataset.hold); const up = () => { keys.delete(b.dataset.hold); b.removeEventListener('pointerup', up); }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); }
  else fakeKey(b.dataset.key);
});
// какие кнопки нужны этому этапу
function touchBar() {
  if (!isTouch()) return;
  const s = G.stage, on = (id, v) => { const el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
  const hold = s.key === 'particles';
  on('act', G.started && hold && !G.paused && !s.finger); // пролог — рогатка шарика пальцем, ◉ не нужна
  actBtn.querySelector('small').textContent = s.key === 'particles' ? (!s.lit && !s.ep ? 'держать' : s.ep === 3 ? 'держать: щит' : 'тап: снимок · держать: поле') : '';
  on('t-ff', G.started && s.enterKey); on('t-dash', G.started && s.dash);
  // «✕ разжать» — пока держишь взятое (частицы): раньше это было касание вторым пальцем поверх ◉ — третий палец
  on('t-drop', G.started && !G.paused && s.canDrop && s.canDrop());
  on('t-cx', G.started && (!s.showCodex || s.showCodex() !== null)); on('t-x', false);
  on('t-help', G.started && !G.ended && !G.tutor && !G.paused);
  // взятое само поворачивается по ходу броска; но у фрагмента из нескольких атомов к цели может встать не тот — ⟲ ⟳ (как Q / E)
  const rot = s.key === 'molecules' && G.started && !G.paused && !!(s.sl && s.sl.held && s.sl.held.atoms && s.sl.held.atoms.length >= 2);
  on('t-rl', rot); on('t-rr', rot);
  document.getElementById('t-mute').textContent = Sfx.muted ? '🔇' : '🔊';
}
// Колесо — зум: вглубь до ×2,2, наружу до ×0,55 от обзора этапа. Shift + колесо — действие этапа (вращение молекулы).
// «Законы Вселенной»: строка — тумблер закона
// строку запоминаем при нажатии: сводка перерисовывается каждые полсекунды, и щелчок мог прийти уже на новый узел
{
  const uni = /** @type {HTMLElement} */ (document.getElementById('uni'));
  /** @param {EventTarget | null} t */
  const rowK = t => { const r = t instanceof Element ? t.closest('.ur') : null; return r instanceof HTMLElement ? r.dataset.k || '' : ''; };
  let downK = '', downT = 0;
  uni.addEventListener('pointerdown', e => { downK = rowK(e.target); downT = performance.now(); });
  uni.addEventListener('click', e => {
    // телефон: шапка сводки — свернуть / развернуть список законов
    if (isTouch() && e.target instanceof Element && e.target.closest('.uh')) { uni.classList.toggle('open'); downK = ''; return; }
    const k = rowK(e.target) || (performance.now() - downT < 800 ? downK : '');
    downK = '';
    if (k) Uni.toggle(G.stage, k);
  });
}
addEventListener('wheel', e => {
  if (e.target !== cv) return;
  G.inT = G.T;
  if (e.shiftKey && G.stage.wheel) { G.stage.wheel(e.deltaY || e.deltaX); return; }
  G.zoom = clamp((G.zoom || 1) * Math.exp(-e.deltaY * .0015), ZOOM_MIN, ZOOM_MAX);
}, { passive: true });
addEventListener('keydown', e => {
  keys.add(e.code); Sfx.unlock(); G.inT = G.T;
  if (e.code === 'KeyM' && document.activeElement !== pname) { const m = Sfx.toggle(); if (G.started) msg(m ? 'звук выкл. · M' : 'звук вкл. · M', 1.2); }
  if (Cine.stop) { if (e.code !== 'KeyM') { e.preventDefault(); Cine.skip(); } return; } // кадр-пауза: любая клавиша — дальше
  if (Spot.on && e.code !== 'KeyM') { e.preventDefault(); Spot.skip(); return; }
  // кодекс: C — открыть / закрыть, Esc — закрыть; пока открыт, игра стоит и клавиши не доходят до этапа
  if (Codex.isOpen) { if (e.code === 'KeyC' || e.code === 'Escape') Codex.close(); return; }
  if (e.code === 'KeyC' && G.started && document.activeElement !== pname) { Codex.open(); return; }
  if (!G.started) return;
  if (e.code === 'Escape' && G.tutor) { endTut(false); return; }
  if (G.stage.sling && /^Arrow/.test(e.code)) e.preventDefault(); // стрелки двигают карту, а не страницу
  if (e.code === 'Space' && !G.paused) { e.preventDefault(); G.stage.dash && G.stage.dash(); }
  if (!G.paused && (e.code === 'Enter' || e.code === 'NumpadEnter')) G.stage.enterKey && G.stage.enterKey();
  if (e.code === 'KeyX') G.stage.detach && G.stage.detach();
  if (e.code === 'KeyH' && !G.paused) helpAgain();
  if (/^Digit[1-9]$/.test(e.code)) { const i = +e.code.slice(5) - 1; if (G.paused) G.stage.pick && G.stage.pick(i); else G.stage.buy && G.stage.buy(i); }
  if (G.paused && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) { e.preventDefault(); G.stage.closeCard && G.stage.closeCard(); return; }
  if (G.paused) return;
  if (e.code === 'BracketRight') G.stage.cheat && G.stage.cheat();
  if (e.code === 'KeyR' && G.ended) location.reload();
});
// «?» (H): подсказки текущего уровня — снова: жесты-подсказки, строка «как» у шага задания, строка управления
function helpAgain() {
  if (!G.started || G.ended || G.tutor) return;
  const S = G.stage;
  Tips.again(S.key);
  Known.forget('ctl:' + S.key); G.ctlT = G.T + CTL_T;
  const cur = S.steps ? S.steps().find(s => !s.d) : null; if (cur) Known.forget('step:' + cur.t.replace(/\d+/g, '#'));
  msg('Подсказки уровня — снова на экране', 2);
}
/** @type {HTMLElement} */ (document.getElementById('help')).onclick = () => { helpAgain(); /** @type {HTMLElement} */ (document.getElementById('help')).blur(); };
// PWA: игра ставится как приложение и работает без сети (только с http/https, не из файла)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* без офлайна */ }));
addEventListener('keyup', e => keys.delete(e.code));
// имя для таблицы рекордов запоминается в браузере
const pname = document.getElementById('pname');
let savedName = ''; try { savedName = localStorage.getItem('proto.name') || ''; } catch (e) { /* без хранилища */ }
pname.value = savedName;
// Заставка по шагам. Новому игроку — по центру крупно вся линия жизни Вселенной, она уезжает вниз; остаются
// управление и кнопки. Имя на входе не спрашиваем (разбор ревью: экран до первого действия): его можно вписать
// фишкой «Игрок ✎» или на финальном экране — до того результаты для общей таблицы ждут (Online.pending).
const intro = document.getElementById('intro');
const tutSeen0 = () => { try { return !!localStorage.getItem('proto.tut'); } catch (e) { return true; } }; // уже играл — заставку не тянуть
/** @param {'name' | 'line' | 'ready'} s */
function introSt(s) {
  intro.classList.remove('st-name', 'st-line', 'st-ready'); intro.classList.add('st-' + s);
  if (s === 'name') { intro.classList.remove('quick'); try { pname.focus(); pname.select(); } catch (e) { /* заглушка */ } }
}
let lineT = 0;
function nameDone() {
  const v = pname.value.trim();
  if (!v) { pname.classList.remove('need'); void pname.offsetWidth; pname.classList.add('need'); return false; }
  try { localStorage.setItem('proto.name', v); } catch (e) { /* без хранилища */ }
  document.getElementById('whon').textContent = v;
  if (!savedName) { LB.rename('Игрок', v); Online.flush(); } // впервые: свои строки в таблице браузера — под именем
  savedName = v; introSt('ready');
  return true;
}
document.getElementById('nameform').onsubmit = e => { e.preventDefault(); nameDone(); };
document.getElementById('who').onclick = () => introSt('name');
intro.onclick = e => { if (intro.classList.contains('st-line') && !/** @type {HTMLElement} */ (e.target).closest('#path')) { clearTimeout(lineT); introSt('ready'); } }; // клик — не ждать
document.getElementById('whon').textContent = savedName || 'Игрок';
if (savedName || tutSeen0()) { intro.classList.add('quick'); introSt('ready'); } // вернулся — всё уже на местах, без полёта
else { introSt('line'); drawPath(); lineT = setTimeout(() => introSt('ready'), 3200); } // впервые: линия жизни, потом она уезжает вниз
function startRun() {
  const v = pname.value.trim(); if (v && v !== savedName) nameDone(); // вписал и не нажал «Дальше» — тоже имя
  document.getElementById('intro').style.display = 'none'; G.started = true; G.runT0 = Date.now(); G.run = (G.run || 0) + 1;
  jumpTo(G.fromI);
}
document.getElementById('go').onclick = startRun;
// Обучение — короткий забег до игры (уровень частиц в режиме tut). Впервые — главная кнопка на старте.
const tutSeen = () => { try { return !!localStorage.getItem('proto.tut'); } catch (e) { return true; } };
if (!tutSeen()) document.getElementById('intro').classList.add('fresh');
document.getElementById('tutgo').onclick = () => { G.fromI = 0; startRun(); G.tutor = true; document.body.classList.add('tut'); G.stage.startTut(); };
document.getElementById('tutskip').onclick = () => endTut(false);
// Кончилось или пропущено — настоящий забег с начала: счёт, часы и кодекс забега обнуляются
function endTut(done) {
  if (!G.tutor) return;
  G.tutor = false; document.body.classList.remove('tut'); Cine.clear(); Spot.end();
  try { localStorage.setItem('proto.tut', '1'); } catch (e) { /* без хранилища */ }
  G.stage.enter(); G.score = 0; G.run = (G.run || 0) + 1; G.runT0 = Date.now(); G.fx = []; mouse.down = false;
  msg(done ? 'Обучение пройдено. Начинается настоящий забег' : 'Обучение пропущено. Забег начинается', 2.5);
}

// ---------- цикл ----------
function update(dt) {
  G.T += dt; P.dashCd -= dt; P.dashT -= dt;
  Tally.tick(dt); Hint.tick(dt); Fly.tick(dt);
  if (G.stage.sling) tickPan(dt);
  G.stage.update(dt, true);
  payMilestones(G.stage); // очки — за вехи (шаг задания, ★), не за ✦; забег кончен — счёт стоит
  if (G.started && !G.ended) Uni.tick(G.stage, dt * (G.stage.ff > 1 ? G.stage.ff : 1)); // чему научил — приносит ✦ само (на ×4 — вчетверо, как и всё время уровня)
  // принесённые с прошлого уровня ✦ — искрами к счётчику, как только он на виду
  if (G.stage.carryIn && !G.prev) {
    const c = G.stage.carryIn; G.stage.carryIn = 0; G.stage.spent = (G.stage.spent || 0) - c; // траты «в минус»: ✦ уровня (и очки) не растут
    if (G.stage.float) G.stage.float(P.x, P.y - 70 / cam.z, `с прошлого уровня +${c} ✦`, GOLD, 16);
  }
  if (G.prev) {
    G.trans += dt / TRANS_DUR;
    G.prev.update(dt, false);
    if (G.trans >= 1) { G.prev = null; G.trans = 1; }
  }
  tickCard(dt);
  for (const f of G.fx) f.t += dt;
  G.fx = G.fx.filter(f => f.t < f.dur);
  const tz = zoomFor(G.stage);
  cam.z = Math.exp(lerp(Math.log(cam.z), Math.log(tz), 1 - Math.exp(-dt * 1.8)));
  cam.x += (P.x - cam.x) * Math.min(1, dt * 4); cam.y += (P.y - cam.y) * Math.min(1, dt * 4);
  if (msgT > 0 && (msgT -= dt) <= 0) document.getElementById('msg').style.opacity = 0;
}

// Сколько пройдено в текущем уровне: свой progress() у уровня или доля выполненных шагов задания
function stageProgress(s) {
  if (s.progress) return clamp(s.progress(), 0, 1);
  if (s.steps && G.started) { const st = s.steps(); return st.length ? st.filter(g => g.d).length / st.length : 0; }
  return 0;
}
// Шкала эволюции внизу — прогресс-бар всей игры: заполнена до места, где ты сейчас
function drawLadder(k) {
  const x0 = 24, x1 = G.W - 24, y = G.H - 22, n = LADDER.length - 1;
  line(x0, y, x1, y, [255, 255, 255], .22, 2);
  const tgt = G.prev ? G.stageI : G.stageI + stageProgress(G.stage);
  const ldt = clamp(G.T - (G.ladT ?? G.T), 0, .05); G.ladT = G.T;
  G.ladP = G.ladP == null || tgt < G.ladP - .5 ? tgt : G.ladP + (tgt - G.ladP) * Math.min(1, ldt * 3);
  const pos = G.ladP, mx = lerp(x0, x1, pos / n);
  ctx.globalAlpha = 1;
  const gr = ctx.createLinearGradient(x0, 0, Math.max(x0 + 1, mx), 0);
  gr.addColorStop(0, 'rgba(90,150,255,.35)'); gr.addColorStop(1, 'rgba(160,230,255,.95)');
  ctx.strokeStyle = gr; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(mx, y); ctx.stroke();
  const narrow = G.W < 700;
  LADDER.forEach((name, i) => {
    const x = lerp(x0, x1, i / n), active = i < STAGES.length, near = 1 - Math.min(1, Math.abs(pos - i) / 2);
    ctx.fillStyle = `rgba(255,255,255,${active ? .3 + .6 * near : .15})`; ctx.fillRect(x - 1, y - 5, 2, 10);
    // на узком экране — только ближайшая ступень (у краёв — прижата к краю)
    if (!narrow || i === Math.min(n, Math.round(pos))) {
      ctx.font = '11px system-ui,sans-serif'; ctx.textAlign = narrow && i === 0 ? 'left' : narrow && i === n ? 'right' : 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = `rgba(255,255,255,${active ? .35 + .55 * near : .2})`;
      ctx.fillText(active ? name : name + ' · скоро', x, y - 8);
    }
  });
  glow(mx, y, 12, [140, 220, 255], .8); ball(mx, y, 4, [200, 240, 255]);
  // доля текущего уровня — над бегунком
  const pct = Math.round(stageProgress(G.stage) * 100);
  if (G.started && !G.prev) { ctx.font = '600 10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(190,235,255,.85)'; ctx.fillText(pct + ' %', mx, y + 6); }
}

function render() {
  ctx.setTransform(G.DPR, 0, 0, G.DPR, 0, 0);
  ctx.globalAlpha = 1;
  const k = G.prev ? smooth(0, 1, G.trans) : 1;
  const bg = G.prev ? mixc(G.prev.bg, G.stage.bg, k) : G.stage.bg;
  const g = ctx.createRadialGradient(G.W / 2, G.H / 2, 0, G.W / 2, G.H / 2, Math.hypot(G.W, G.H) / 2);
  g.addColorStop(0, rgb(mixc(bg, [255, 255, 255], .06))); g.addColorStop(1, rgb(mixc(bg, [0, 0, 0], .6)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
  drawDust(bg);
  const pv = G.prev; // уходящий этап — в своих единицах (переход мог сменить масштаб)
  if (pv) withPrevCam(() => pv.draw(1 - k));
  G.stage.draw(k);
  ctx.globalAlpha = 1;
  if (pv) withPrevCam(() => pv.drawPlayer(1 - k));
  G.stage.drawPlayer(k);
  ctx.globalAlpha = 1;
  drawFx();
  if (pv && pv.overlay) withPrevCam(() => pv.overlay && pv.overlay(1 - k));
  if (G.stage.overlay) G.stage.overlay(k);
  ctx.globalAlpha = 1;
  if (!G.stage.showLadder || G.stage.showLadder()) drawLadder(k); // путь Вселенной — когда он уже что-то значит
  Hint.draw();
  Fly.draw(); // ✦ летят к счётчику — поверх всего на холсте
  Spot.draw();
}

const barsEl = document.getElementById('bars');
let hudN = 0, lawsKey = '';
function hud() {
  if ((hudN++) % 6) return;
  const h = G.stage.hud();
  // пустые поля не показываем: этапы сами решают, сколько текста на экране
  const put = (id, v, html) => { const el = document.getElementById(id); el.style.display = v ? '' : 'none'; if (html) el.innerHTML = v; else el.textContent = v; };
  put('title', h.title); put('sub', h.sub);
  put('lines', h.lines.map(([a, b]) => `<div class="k">${a}</div><div>${b}</div>`).join(''), true);
  put('goal', h.goal, true);
  const S = G.stage, pan = !S.sling ? '' : isTouch() ? 'два пальца: сдвинуть карту' : 'WASD или правая кнопка: сдвинуть карту';
  // словарь жестов — один на всю игру (разбор дизайна: 8 схем на 6 уровней): по предмету · по пустому · карта;
  // уровень меняет только смысл, строки и порядок те же
  const gs = S.gest ? S.gest() : null, mapT = gs && (gs.map ?? (!S.sling ? '' : isTouch() ? 'два пальца' : 'WASD или правая кнопка'));
  const gRow = (/** @type {string} */ k, /** @type {string | undefined} */ v) => v ? `<div><b>${k}</b>${v}</div>` : '';
  const ctlHtml = gs ? gRow('по предмету', gs.obj) + gRow('по пустому', gs.empty) + gRow('карта', mapT || undefined) : [S.controls, pan].filter(Boolean).join(' · ');
  // строка управления внизу — только при первом визите на уровень и первые CTL_T секунд (потом игрок знает сам)
  const ctlOn = !Known.has('ctl:' + S.key) && (S.clock ?? S.t ?? 0) < CTL_T || G.T < (G.ctlT || 0); // ctlT — «?» вернул строку
  const hb = document.getElementById('help'); if (hb) hb.style.display = G.started && !G.ended && !G.tutor && !G.paused ? '' : 'none';
  if (G.started && !ctlOn && (S.clock ?? S.t ?? 0) >= CTL_T) Known.add('ctl:' + S.key);
  put('controls', ctlOn ? ctlHtml : '', true);
  document.getElementById('laws').style.display = h.laws.length ? '' : 'none';
  document.getElementById('codex').style.top = h.laws.length ? '190px' : '12px';
  const key = G.stage.key;
  if (key !== lawsKey) { lawsKey = key; barsEl.innerHTML = h.laws.map(([n], i) => `<div>${n}</div><div class="bar"><i id="law${i}"></i></div>`).join(''); }
  const cxOn = G.stage.showCodex ? G.stage.showCodex() : true;
  Codex.render(cxOn); // null — кодекса пока нет (ничего не открыто)
  const upg = document.getElementById('upg');
  if (G.stage.renderUpg) G.stage.renderUpg(upg); else upg.style.display = 'none';
  touchBar();
  const shop = document.getElementById('shop');
  if (G.stage.renderShop) G.stage.renderShop(shop); else shop.style.display = 'none';
  if (shop.style.display !== 'none' && isTouch()) document.getElementById('controls').style.display = 'none'; // лавка внизу — подсказку управления не накладываем
  Uni.render(byId('uni')); // после лавки: встаёт над ней
  h.laws.forEach(([, w], i) => { const el = document.getElementById('law' + i); if (el) el.style.width = (clamp(w, 0, 1) * 100).toFixed(0) + '%'; });
}

// страховка: ошибка или NaN не должны вешать игру
let errShown = false;
function recover(err) {
  if (err && !errShown) { // первая ошибка — в консоль и на экран: игрок пришлёт скриншот
    errShown = true; console.error(err);
    const at = String(err.stack || '').split('\n').find(l => /\.js/.test(l)) || '';
    try { msg(`Ошибка: ${err.message} ${(at.match(/(\w+\.js)[^:]*:(\d+)/) || []).slice(1).join(':')}. Скриншот поможет исправить`, 12); } catch (e) { /* без экрана */ }
  }
  if (!isFinite(P.x + P.y)) { P.x = P.y = 0; }
  if (!isFinite(P.vx + P.vy)) { P.vx = P.vy = 0; }
  if (!isFinite(cam.z) || cam.z <= 0) cam.z = 40;
  if (!isFinite(cam.x + cam.y)) { cam.x = P.x; cam.y = P.y; }
}

G.stage = STAGES[0]; G.stage.enter(null);
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  // ошибка в расчёте кадра не останавливает отрисовку — иначе игра выглядит зависшей
  // сцена открытия: время на миг замедляется (как в кино — «это с тем столкнулось, и появилось вот это»)
  // кадр-пауза важного знания: время стоит, кадр рисуется
  const hold = Cine.tick(dt) || Spot.tick(dt); // стоп-кадр со стрелкой — тоже время стоит
  const slow = G.slowT > 0 && !G.paused && !hold ? (G.slowT -= dt, .3) : 1;
  try { if (!G.paused && !hold) update(dt * slow); else Sfx.hum(0); } catch (err) { recover(err); }
  try {
    if (!isFinite(P.x + P.y + cam.z)) recover();
    render(); hud();
  } catch (err) { recover(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
