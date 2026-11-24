// Дешёвая статическая проверка: каждый вызов this.имя(...) в файле этапа ссылается на метод, который есть
// хотя бы у одного объекта верхнего уровня этого файла. Ловит класс ошибок «this.genFirst is not a function»:
// метод стёрли, а редкий путь его ещё зовёт.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame, scriptList, ROOT } from './harness.mjs';

const g = loadGame();

for (const src of scriptList()) {
  const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
  const objs = [...code.matchAll(/^const (\w+) = \{/gm)].map(m => m[1]);
  if (!objs.length) continue;
  test(`${src}: все this.метод() существуют`, () => {
    const called = [...new Set([...code.matchAll(/this\.([A-Za-z_]\w*)\(/g)].map(m => m[1]))];
    const missing = called.filter(name => !g.ev(`[${objs.join(', ')}].some(o => o && typeof o[${JSON.stringify(name)}] === 'function')`));
    assert.deepEqual(missing, [], `нет методов: ${missing.join(', ')} (объекты файла: ${objs.join(', ')})`);
  });
}
