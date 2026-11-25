"use strict";
// Значки жестов (SVG строкой): мышь — вести, клик, зажать, отпустить, колесо; клавиша с любой надписью.
// Белая мышь, нажатое — жёлтым (как золото интерфейса). Один источник: заставка, подсказки управления,
// а файлы gestures/*.svg собирает из этих же функций tools/gestures.mjs.
const GEST_Y = '#ffd27a', GEST_INK = '#0b0f1c', GEST_W = '#f4f6fb';
/** мышь: btn — как нарисовать левую кнопку ('' | 'fill' | 'soft'), wheel — колесо жёлтым, ring — жирная обводка «держу» */
function gestMouse(btn, wheel, ring) {
  const L = 'M24 18 H15 V16 A9 9 0 0 1 24 7 Z';
  return (ring ? `<rect x="11" y="3" width="26" height="38" rx="13" fill="none" stroke="${GEST_Y}" stroke-width="1.4" opacity=".35"/>` +
      `<rect x="13" y="5" width="22" height="34" rx="11" fill="none" stroke="${GEST_Y}" stroke-width="1.8" opacity=".6"/>` : '') +
    `<rect x="15" y="7" width="18" height="30" rx="9" fill="${GEST_W}" stroke="${ring ? GEST_Y : GEST_INK}" stroke-width="${ring ? 3 : 1.6}"/>` +
    (btn ? `<path d="${L}" fill="${GEST_Y}" opacity="${btn === 'soft' ? .35 : 1}"/>` : '') +
    `<path d="M24 7 V18 M15 18 H33" stroke="${GEST_INK}" stroke-width="1.3" fill="none"/>` +
    `<rect x="${wheel ? 22 : 22.6}" y="${wheel ? 9 : 10}" width="${wheel ? 4 : 2.8}" height="${wheel ? 8 : 6}" rx="${wheel ? 2 : 1.4}" fill="${wheel ? GEST_Y : '#9aa3b8'}" stroke="${wheel ? GEST_INK : 'none'}" stroke-width=".8"/>`;
}
const gestSvg = (/** @type {string} */ body, w = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 48" width="${w}" height="48" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const GEST = {
  // вести: мышь и стрелки в стороны
  move: () => gestSvg(gestMouse('', false, false) +
    `<path d="M11 22 H3 M3 22 l3.5 -3.5 M3 22 l3.5 3.5 M37 22 H45 M45 22 l-3.5 -3.5 M45 22 l-3.5 3.5" stroke="${GEST_W}" stroke-width="2.2"/>`),
  // клик: левая кнопка жёлтым и искры щелчка
  click: () => gestSvg(gestMouse('fill', false, false) +
    `<path d="M12 7 l-3.5 -3.5 M10.5 12.5 H5.5 M17.5 3.8 l-.8 -3" stroke="${GEST_Y}" stroke-width="2.2"/>`),
  // зажать: кнопка жёлтым, жирная обводка и ореол — «держу, напряжение»
  hold: () => gestSvg(gestMouse('fill', false, true) +
    `<path d="M7 9 l-3 -1.5 M6 15 H2.5 M7 21 l-3 1.5 M41 9 l3 -1.5 M42 15 H45.5 M41 21 l3 1.5" stroke="${GEST_Y}" stroke-width="2"/>`),
  // отпустить: кнопка отжата (бледная) и стрелка вверх — палец поднят
  release: () => gestSvg(gestMouse('soft', false, false) +
    `<path d="M9 20 V4 M9 4 l-3.5 3.5 M9 4 l3.5 3.5" stroke="${GEST_Y}" stroke-width="2.4"/>`),
  // колесо: колесо жёлтым и стрелки вверх-вниз
  wheel: () => gestSvg(gestMouse('', true, false) +
    `<path d="M37.5 11 l3.5 -3.5 l3.5 3.5 M37.5 17 l3.5 3.5 l3.5 -3.5" stroke="${GEST_Y}" stroke-width="2.2"/>`),
  // клавиша: любая надпись (M, Esc, Shift…) — колпачок шире под длинное слово
  key: (/** @type {string} */ t) => {
    const w = Math.max(40, 18 + t.length * 9.5), fs = t.length > 3 ? 13 : 17;
    return gestSvg(`<rect x="3" y="7" width="${w - 6}" height="35" rx="7" fill="#3a4157" stroke="${GEST_INK}" stroke-width="1.4"/>` +
      `<rect x="6" y="9" width="${w - 12}" height="27" rx="5" fill="${GEST_W}"/>` +
      `<text x="${w / 2}" y="${22.5 + fs * .36}" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-weight="800" font-size="${fs}" fill="${GEST_INK}">${t}</text>`, w);
  },
};
// значок + подпись для строки управления
/** @param {string} svg @param {string} label */
const gestItem = (svg, label) => `<span class="gest">${svg}<span>${label}</span></span>`;
