"use strict";
/* Кодекс открытий.
   - known: что игрок видел хоть раз в любом забеге (хранится в браузере).
   - run:   что открыто в ЭТОМ забеге. Только открытое в забеге Вселенная умеет рождать сама.
   Открыть = увидеть своими глазами: событие должно случиться внутри круга детектора. */
// Поколения открываются по порядку: тяжёлое поколение — «та же» частица, только тяжелее, и родиться ей
// можно, лишь когда открыто лёгкое. μ — после e, τ — после μ; c и s — после u и d; t и b — после c и s.
const GEN_PREV = { mu: ['e'], ta: ['mu'], c: ['u', 'd'], s: ['u', 'd'], t: ['c', 's'], b: ['c', 's'] };
const genOpen = sp => (GEN_PREV[sp] || []).every(k => Codex.has(k));
const genNeed = sp => (GEN_PREV[sp] || []).filter(k => !Codex.has(k));
const Codex = {
  known: new Set(), run: new Set(), dirty: true,
  load() {
    try { const s = JSON.parse(localStorage.getItem('protoCodex') || '[]'); this.known = new Set(s); } catch (e) { this.known = new Set(); }
  },
  save() { try { localStorage.setItem('protoCodex', JSON.stringify([...this.known])); } catch (e) { } },
  has(k) { return this.run.has(k); },
  // Возвращает 'new' (впервые вообще), 'run' (впервые в этом забеге) или false.
  see(k) {
    if (this.run.has(k)) return false;
    this.run.add(k); this.dirty = true;
    const first = !this.known.has(k);
    if (first) { this.known.add(k); this.save(); }
    Sfx.play('fresh');
    showCard(k, first);
    // открылось следующее поколение — сказать, кто теперь может родиться
    const nx = Object.keys(GEN_PREV).filter(sp => GEN_PREV[sp].includes(k) && !this.run.has(sp) && genOpen(sp));
    if (nx.length) msg(`Открыто ${SM[nx[0]].gen}-е поколение: теперь в столкновениях могут родиться ${nx.map(sp => SM[sp].sym).join(' и ')}`);
    return first ? 'new' : 'run';
  },
  // Сетка Стандартной модели: три поколения материи + бозоны
  LAYOUT: [['u', 'c', 't', 'g', 'H'], ['d', 's', 'b', 'ph', ''], ['e', 'mu', 'ta', 'Z', ''], ['ne', 'nm', 'nt', 'W', '']],
  render(show) {
    const el = document.getElementById('codex');
    el.style.display = show ? 'block' : 'none';
    if (!show || !this.dirty) return;
    this.dirty = false;
    let n = 0;
    const cells = this.LAYOUT.flat().map(k => {
      if (!k) return '<div></div>';
      const s = SM[k], lock = !this.run.has(k) && !genOpen(k), st = this.run.has(k) ? 'on' : lock ? 'lock' : this.known.has(k) ? 'old' : 'off';
      if (st === 'on') n++;
      const tip = lock ? `откроется после ${genNeed(k).map(x => SM[x].sym).join(' и ')}` : st === 'off' ? '?' : s.name;
      return `<div class="cx ${s.kind} ${st}${st === 'on' && this.auto && this.auto.has(k) ? ' auto' : ''}" title="${tip}">${lock ? '🔒' : st === 'off' ? '?' : s.sym}</div>`;
    }).join('');
    el.innerHTML = `<b>Стандартная модель · ${n}/17</b><div class="cxg">${cells}</div>`;
  },
};
Codex.load();

let cardT = 0;
function showCard(k, first) {
  const s = SM[k], el = document.getElementById('card');
  el.innerHTML = (first ? `<div class="ck">Новое открытие</div>` : '') +
    `<div class="cn"><span class="cs ${s.kind}">${s.sym}</span> ${s.name}${s.m ? ` · ${s.m >= 1 ? s.m.toFixed(1) + ' ГэВ' : s.m >= .001 ? (s.m * 1000).toFixed(1) + ' МэВ' : (s.m * 1e6).toFixed(0) + ' кэВ'}` : ''}</div>` +
    (first ? `<div class="cf">${SM_FACT[k]}</div>` : '');
  el.style.opacity = 1; cardT = first ? 5.5 : 2.5;
}
function tickCard(dt) { if (cardT > 0 && (cardT -= dt) <= 0) document.getElementById('card').style.opacity = 0; }
