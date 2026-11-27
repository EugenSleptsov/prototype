"use strict";
/* Общая таблица рекордов (Supabase). Пока url и key пустые — всё выключено, работают только рекорды в браузере.
   Включить: выполни supabase/leaderboard.sql в своём проекте Supabase и впиши сюда
   Project Settings → API → Project URL и ключ anon (public). Ключ anon публичный: таблицу защищают правила в SQL.
   Доски: 'run' — очки всего забега и по уровням (lv, отправляются в конце игры), 'heat' — температура разогрева, ГэВ.
   Столбец lv добавляет supabase/leaderboard_lv.sql; пока его нет — уходит и показывается только сумма.
   v — версия правил: поменялся подсчёт очков — подними v, и таблица начнётся заново (старые строки остаются в базе). */
const ONLINE = { url: 'https://yisephxhvbxufceveaza.supabase.co', key: 'sb_publishable_THyZn9xV012fKZE7Sentlw_3v87Ck7s', v: 1 };

const Online = {
  on() { return !!(ONLINE.url && ONLINE.key) && typeof fetch === 'function'; },
  async req(path, opt = {}) {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 7000);
    try {
      const r = await fetch(ONLINE.url.replace(/\/+$/, '') + '/rest/v1/' + path, {
        ...opt, signal: ac.signal,
        // старый ключ anon — JWT, его шлём и в Authorization; новый sb_publishable_… — только в apikey
        headers: { apikey: ONLINE.key, ...(ONLINE.key.startsWith('eyJ') ? { Authorization: 'Bearer ' + ONLINE.key } : {}), 'Content-Type': 'application/json', ...(opt.headers || {}) },
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      return t ? JSON.parse(t) : null;
    } finally { clearTimeout(tm); }
  },
  name() { return (LB.name() || 'Игрок').replace(/[<>]/g, '').trim().slice(0, 24) || 'Игрок'; },
  /** @type {[string, number, number | null, (number | null)[] | null][]} результаты, пока имени нет: уйдут, когда его впишут (flush) */
  pending: [],
  flush() { const p = this.pending; this.pending = []; for (const [b, s, t, lv] of p) this.send(b, s, t, lv); },
  /** есть ли в базе столбец lv (очки по уровням): спрашиваем один раз @type {Promise<boolean> | null} */
  lvQ: null,
  hasLv() { return this.lvQ || (this.lvQ = this.req('scores?select=lv&limit=1').then(() => true, () => false)); },
  // отправить результат; true — принят
  /** @param {string} board @param {number} score @param {number | null} [secs] @param {(number | null)[] | null} [lv] */
  async send(board, score, secs = null, lv = null) {
    if (!this.on()) return false;
    if (!LB.named()) { this.pending.push([board, score, secs, lv]); return false; } // безымянное в общую таблицу не шлём
    /** @type {Record<string, unknown>} */
    const body = { board, name: this.name(), score: Math.round(score), secs: secs == null ? null : Math.round(secs), v: ONLINE.v };
    if (lv && await this.hasLv()) body.lv = lv;
    return this.req('scores', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(body) }).then(() => true, () => false);
  },
  // лучшие результаты игроков (по одному на имя): [{name, score, secs}] или null, если сети нет
  top(board, n = 10) {
    if (!this.on()) return Promise.resolve(null);
    return this.req(`scores_best?board=eq.${board}&v=eq.${ONLINE.v}&select=name,score,secs&order=score.desc,created_at.asc&limit=${n}`).catch(() => null);
  },
  /** забеги для матрицы (все строки, лучшие по сумме сверху) или null, если сети нет @returns {Promise<RunRow[] | null>} */
  async runs(n = 1000) {
    if (!this.on()) return null;
    const lv = await this.hasLv();
    /** @type {{ name: string, score: number, secs: number | null, lv?: (number | null)[] | null }[] | null} */
    const l = await this.req(`scores?board=eq.run&v=eq.${ONLINE.v}&select=name,score,secs${lv ? ',lv' : ''}&order=score.desc,created_at.asc&limit=${n}`).catch(() => null);
    return l && l.map(x => ({ n: x.name, lv: x.lv || null, s: x.score, t: x.secs, d: 0 }));
  },
};

// ---------- Матрица рекордов ----------
// Строка — забег, столбцы — уровни 1–6 и Σ. «По уровням» — очки уровня; «накопительный» — сумма с первого уровня
// по этот (кто впереди к концу «Ядер»). Сортировка — по выбранному столбцу; золото — лучший в столбце.
// В браузере — все свои забеги; в общей таблице — лучший забег каждого игрока по выбранному столбцу.
/** @typedef {{ n: string, lv: (number | null)[] | null, s: number, t: number | null, d: number }} RunRow */
const MX_LV = ['Частицы', 'Адроны', 'Ядра', 'Звёзды', 'Атомы', 'Молекулы'], MX_AB = ['Част', 'Адр', 'Ядра', 'Звёзд', 'Атом', 'Мол'];
const MX_SUM = MX_LV.length, MX_TOP = 10, MX_KEEP = 10;
const Runs = {
  /** свои забеги и старые суммы (до матрицы — без уровней) @returns {RunRow[]} */
  load() { const a = LB.load(); return [...(a.runs || []), ...(a.total || []).map((/** @type {LBEntry} */ e) => ({ ...e, lv: null }))]; },
  // свой забег — в таблицу браузера; хранится всё, что входит в первую десятку хоть одного столбца в любом режиме
  /** @param {RunRow} r */
  add(r) {
    /** @type {Record<string, any>} */
    const all = LB.load(), l = [...(all.runs || []), r], keep = new Set();
    for (const cum of [false, true]) for (let c = 0; c <= MX_SUM; c++) mxSort(l, c, cum).slice(0, MX_KEEP).forEach(x => keep.add(x));
    all.runs = l.filter(x => keep.has(x));
    try { localStorage.setItem(LB_KEY, JSON.stringify(all)); } catch (err) { /* без хранилища — до перезагрузки */ }
  },
};
/** значение забега в столбце c (уровень 0…5 или MX_SUM — сумма); null — уровня в забеге нет @param {RunRow} r @param {number} c @param {boolean} cum */
function mxCell(r, c, cum) {
  if (c >= MX_SUM) return r.s;
  if (!r.lv) return null;
  if (!cum) return r.lv[c] ?? null;
  let s = 0;
  for (let i = 0; i <= c; i++) { const v = r.lv[i]; if (v == null) return null; s += v; }
  return s;
}
/** по столбцу: больше — выше, пустые — в конец, при равенстве — быстрее, потом раньше @param {RunRow[]} l @param {number} c @param {boolean} cum */
function mxSort(l, c, cum) {
  const v = (/** @type {RunRow} */ r) => mxCell(r, c, cum) ?? -Infinity;
  return [...l].sort((a, b) => (v(b) - v(a)) || ((a.t ?? 1e9) - (b.t ?? 1e9)) || (a.d - b.d));
}
/** общая таблица: у каждого имени — лучший забег по столбцу @param {RunRow[]} l @param {number} c @param {boolean} cum */
function mxBest(l, c, cum) {
  /** @type {Map<string, RunRow>} */
  const m = new Map();
  for (const r of mxSort(l, c, cum)) { const k = r.n.toLowerCase(); if (!m.has(k)) m.set(k, r); }
  return [...m.values()];
}
/** HTML матрицы: переключатель режима, шапка-сортировка, первая десятка и своя строка (в накопительном Σ нет: это столбец «Молекул»)
 * @param {RunRow[]} rows отсортированные @param {number} c столбец @param {boolean} cum @param {(r: RunRow) => boolean} isMe @param {string} src */
function mxHtml(rows, c, cum, isMe, src) {
  /** @type {Record<string, string>} */
  const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  const esc = (/** @type {unknown} */ x) => String(x).replace(/[&<>"]/g, ch => ENT[ch]);
  const cols = cum ? [...MX_LV.keys()] : [...MX_LV.keys(), MX_SUM], best = cols.map(k => Math.max(-Infinity, ...rows.map(r => mxCell(r, k, cum) ?? -Infinity)));
  const me = rows.findIndex(isMe), by = c < MX_SUM ? `столбцу «${MX_LV[c]}»${cum ? ' (с начала)' : ''}` : 'сумме';
  const cell = (/** @type {RunRow} */ r, /** @type {number} */ k) => {
    const v = mxCell(r, k, cum);
    return `<td class="${k === c ? 'sc ' : ''}${v != null && v === best[k] && v > 0 ? 'top' : ''}">${v == null ? '—' : fmtScore(v)}</td>`;
  };
  const row = (/** @type {RunRow} */ r, /** @type {number} */ i) => `<tr class="${i === me ? 'me' : ''}"><td>${i + 1}</td><td class="nm">${esc(r.n)}</td>${cols.map(k => cell(r, k)).join('')}<td class="tm">${fmtClock(r.t)}</td></tr>`;
  const th = (/** @type {number} */ k) => `<th data-c="${k}" class="${k === c ? 'sc' : ''}" title="${k < MX_SUM ? (cum ? `сумма с «Частиц» по «${MX_LV[k]}»` : MX_LV[k]) : 'весь забег'}">` +
    (k < MX_SUM ? `<b>${k + 1}</b>${MX_AB[k]}` : '<b>Σ</b>всего') + '</th>';
  const place = me < 0 ? '' : me === 0 ? ` · 🏆 первое место по ${by}` : ` · твоё место #${me + 1} по ${by}`;
  return `<div class="mxbar"><span class="rk">${src}${place}</span><span class="mxm" role="group" aria-label="режим таблицы">` +
    `<button type="button" data-m="0" class="${cum ? '' : 'on'}" aria-pressed="${!cum}">по уровням</button>` +
    `<button type="button" data-m="1" class="${cum ? 'on' : ''}" aria-pressed="${cum}">накопительный</button></span></div>` +
    `<div class="mxw"><table class="lb mx"><thead><tr><th>#</th><th class="nm">имя</th>${cols.map(th).join('')}<th class="tm">время</th></tr></thead>` +
    `<tbody>${rows.slice(0, MX_TOP).map(row).join('')}${me >= MX_TOP ? row(rows[me], me) : ''}</tbody></table></div>` +
    `<div class="mxh">${cum ? 'в столбце — сумма очков с «Частиц» по этот уровень' : 'в столбце — очки одного уровня'} · нажми на столбец — сортировка · золото — лучший в столбце</div>`;
}
/** живая матрица в элементе: клики по режиму и столбцам перерисовывают
 * @param {HTMLElement} el @param {RunRow[]} all @param {boolean} online @param {(r: RunRow) => boolean} isMe @param {string} src */
function mxMount(el, all, online, isMe, src) {
  let c = MX_SUM, cum = false;
  const draw = () => {
    const k = cum && c === MX_SUM ? MX_SUM - 1 : c; // Σ в накопительном — столбец «Молекул»
    el.innerHTML = mxHtml(online ? mxBest(all, k, cum) : mxSort(all, k, cum), k, cum, isMe, src);
  };
  el.onclick = e => {
    const t = /** @type {HTMLElement} */ (e.target), m = /** @type {HTMLElement | null} */ (t.closest('[data-m]')), h = /** @type {HTMLElement | null} */ (t.closest('[data-c]'));
    if (m) cum = m.dataset.m === '1'; else if (h) c = Number(h.dataset.c); else return;
    draw();
  };
  draw();
}

// Таблица забега на финальном экране: в браузере — сразу; общая (если включена) — отправить и показать
/** @param {HTMLElement} el @param {RunRow} run @param {boolean} cheated */
async function endBoard(el, run, cheated) {
  const mine = (/** @type {RunRow} */ r) => r.d === run.d && r.s === run.s;
  const local = (/** @type {HTMLElement} */ to) => mxMount(to, Runs.load(), false, mine, 'в этом браузере');
  if (cheated) { el.innerHTML = '<div class="rk">отладка или забег не с начала: без таблицы рекордов</div>'; return; }
  if (!Online.on()) { local(el); return; }
  if (!LB.named()) { // имя не спрашивали на входе — спросим здесь, когда есть что записать
    el.innerHTML = '<div class="rk">общая таблица: впиши имя</div><form id="endname" class="row"><input maxlength="16" placeholder="Имя" autocomplete="nickname"><button type="submit">В таблицу</button></form><div id="endloc"></div>';
    local(/** @type {HTMLElement} */ (el.querySelector('#endloc')));
    const f = /** @type {HTMLFormElement} */ (el.querySelector('#endname')), inp = /** @type {HTMLInputElement} */ (f.querySelector('input'));
    f.onsubmit = e => {
      e.preventDefault(); const v = inp.value.trim(); if (!v) return;
      try { localStorage.setItem('proto.name', v); } catch (err) { /* без хранилища */ }
      LB.rename('Игрок', v); run.n = v; Online.flush(); endBoard(el, run, cheated);
    };
    return;
  }
  el.innerHTML = '<div class="rk">общая таблица · отправка…</div>';
  const ok = await Online.send('run', run.s, run.t, run.lv);
  const list = await Online.runs();
  if (!list) { el.innerHTML = '<div class="rk">общая таблица недоступна: нет сети</div><div id="endloc"></div>'; local(/** @type {HTMLElement} */ (el.querySelector('#endloc'))); return; }
  const me = Online.name().toLowerCase();
  mxMount(el, list, true, r => r.n.toLowerCase() === me, ok ? 'общая таблица' : 'общая таблица · результат не принят');
}
