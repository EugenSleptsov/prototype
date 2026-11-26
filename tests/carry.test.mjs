// Итог уровня решает следующий: доля нейтронов среди барионов «Адронов» — доля нейтронов во Вселенной «Ядер».
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

const stub = (p, n) => `({ key: 'quarks', hr: 1.4, groups: new Map([${[...Array(p).fill('p'), ...Array(n).fill('n')].map((k, i) =>
  `[${i}, { kind: '${k}', m: [0, 1, 2].map(j => ({ x: ${i} * 2 + j * .2, y: 0, vx: 0, vy: 0 })) }]`).join(', ')}]) })`;

test('ядра: нейтронов в «Адронах» больше — их больше и во Вселенной (в пределах N_FRAC), без «Адронов» — 1 на 3', () => {
  const g = loadGame({ seed: 4 });
  g.ev(PREP.start);
  const frac = (p, n) => g.ev(`Nuclei.enter(${stub(p, n)}); Nuclei.nFrac`);
  assert.equal(frac(3, 3), g.ev('N_FRAC[1]'), 'поровну — потолок');
  assert.ok(Math.abs(frac(5, 1) - 1 / 6) < 1e-9, '1 n на 5 p — шестая часть');
  assert.equal(frac(0, 0), g.ev('N_FRAC[0]'), 'не собрал нуклонов — нейтронов мало');
  assert.equal(g.ev('Nuclei.enter(null); Nuclei.nFrac'), .25, 'забег не с «Адронов» — как было');
  // и это видно в мире: приходящие нейтроны — по этой доле
  const share = (p, n) => g.ev(`(() => { Nuclei.enter(${stub(p, n)}); let k = 0; for (let i = 0; i < 4000; i++) { const o = Nuclei.cosmic(0, 0, 0, 0); if (o.N) k++; } return k / 4000; })()`);
  assert.ok(share(3, 3) > share(5, 1) + .15, 'больше нейтронов из «Адронов» — больше и во Вселенной');
  g.ev(`Nuclei.enter(${stub(5, 1)})`);
  assert.match(g.ev('Nuclei.npMsg'), /1 n⁰ на 5 p⁺/);
});
