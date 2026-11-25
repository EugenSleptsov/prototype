// Собрать файлы значков жестов gestures/*.svg из js/gestures.js (того же, что рисует игра): node tools/gestures.mjs
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/gestures.js'), 'utf8') + '\n;globalThis.GEST = GEST;', ctx);
const G = ctx.GEST, out = path.join(ROOT, 'gestures');
fs.mkdirSync(out, { recursive: true });
const files = { 'mouse-move': G.move(), 'mouse-click': G.click(), 'mouse-hold': G.hold(), 'mouse-release': G.release(), 'mouse-wheel': G.wheel(),
  'key-M': G.key('M'), 'key-Esc': G.key('Esc'), 'key-Shift': G.key('Shift'), 'key-Enter': G.key('Enter'), 'key-Space': G.key('Пробел') };
for (const [n, svg] of Object.entries(files)) fs.writeFileSync(path.join(out, n + '.svg'), svg + '\n');
console.log(Object.keys(files).map(n => `gestures/${n}.svg`).join('\n'));
