"use strict";
/* Общая таблица рекордов (Supabase). Пока url и key пустые — всё выключено, работают только рекорды в браузере.
   Включить: выполни supabase/leaderboard.sql в своём проекте Supabase и впиши сюда
   Project Settings → API → Project URL и ключ anon (public). Ключ anon публичный: таблицу защищают правила в SQL.
   Доски: 'run' — очки всего забега (отправляются в конце игры), 'heat' — температура разогрева, ГэВ.
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
  /** @type {[string, number, number | null][]} результаты, пока имени нет: уйдут, когда его впишут (flush) */
  pending: [],
  flush() { const p = this.pending; this.pending = []; for (const [b, s, t] of p) this.send(b, s, t); },
  // отправить результат; true — принят
  send(board, score, secs = null) {
    if (!this.on()) return Promise.resolve(false);
    if (!LB.named()) { this.pending.push([board, score, secs]); return Promise.resolve(false); } // безымянное в общую таблицу не шлём
    const body = { board, name: this.name(), score: Math.round(score), secs: secs == null ? null : Math.round(secs), v: ONLINE.v };
    return this.req('scores', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(body) }).then(() => true, () => false);
  },
  // лучшие результаты игроков (по одному на имя): [{name, score, secs}] или null, если сети нет
  top(board, n = 10) {
    if (!this.on()) return Promise.resolve(null);
    return this.req(`scores_best?board=eq.${board}&v=eq.${ONLINE.v}&select=name,score,secs&order=score.desc,created_at.asc&limit=${n}`).catch(() => null);
  },
};

// Таблица забега на финальном экране: отправить, показать топ-10 и своё место
async function endBoard(el, score, secs, cheated, local = '') {
  if (!Online.on()) return;
  if (cheated) { el.innerHTML = '<div class="rk">отладка: в общую таблицу не попадает</div>'; return; }
  if (!LB.named()) { // имя не спрашивали на входе — спросим здесь, когда есть что записать
    el.innerHTML = '<div class="rk">общая таблица: впиши имя</div><form id="endname" class="row"><input maxlength="16" placeholder="Имя" autocomplete="nickname"><button type="submit">В таблицу</button></form>' + local;
    const f = /** @type {HTMLFormElement} */ (el.querySelector('#endname')), inp = /** @type {HTMLInputElement} */ (f.querySelector('input'));
    f.onsubmit = e => {
      e.preventDefault(); const v = inp.value.trim(); if (!v) return;
      try { localStorage.setItem('proto.name', v); } catch (err) { /* без хранилища */ }
      LB.rename('Игрок', v); Online.flush(); endBoard(el, score, secs, cheated, local);
    };
    return;
  }
  el.innerHTML = '<div class="rk">общая таблица · отправка…</div>';
  const ok = await Online.send('run', score, secs);
  const list = await Online.top('run', 100);
  if (!list) { el.innerHTML = '<div class="rk">общая таблица недоступна: нет сети</div>' + local; return; }
  const me = Online.name(), esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let place = list.findIndex(x => x.name.toLowerCase() === me.toLowerCase());
  const row = (x, k) => `<tr class="${k === place ? 'me' : ''}"><td>${k + 1}</td><td>${esc(x.name)}</td><td>${fmtScore(x.score)}</td><td>${fmtClock(x.secs)}</td></tr>`;
  const head = !ok ? 'общая таблица · результат не принят' : place === 0 ? '🏆 первое место в мире' : place > 0 ? `общая таблица · место #${place + 1}` : 'общая таблица · место за пределами сотни';
  el.innerHTML = `<div class="rk">${head}</div><table class="lb">${list.slice(0, 10).map(row).join('')}${place >= 10 ? row(list[place], place) : ''}</table>`;
}
