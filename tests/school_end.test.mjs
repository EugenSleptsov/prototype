// Школа жестов не засчитывает эпоху 1: её пять шагов — это steps(), пока она идёт, и пройденная школа ставила epDone —
// после вспышки света сразу начиналась эпоха Хиггса (глава 7). Жалоба игрока 28.11.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

test('школа жестов пройдена — дальше раскачка и глава «Свет», а не эпоха Хиггса', () => {
  const g = loadGame({ seed: 1 });
  g.ev(`document.getElementById('go').onclick(); __step(110); mouse.clicked = true; mouse.down = true; __step(1); mouse.down = false;`);
  assert.equal(g.ev('!!G.stage.school'), true, 'новичок — в школе жестов');
  g.ev(`(() => { const S = G.stage; S.school.i = SCHOOL.length - 1; S.schoolSpawn(); S.schoolOk(); })()`); // последняя сцена сдана
  g.play(240);
  assert.equal(g.ev('!!G.stage.school'), false, 'школа кончилась');
  assert.equal(g.ev('G.stage.epDone'), false, 'эпоха 1 не засчитана');
  g.ev(PREP.pump());
  g.play(60 * 30);
  assert.equal(g.ev('G.stage.lit'), true);
  assert.equal(g.ev('G.stage.ep'), 0, 'после вспышки — эпоха 1');
  assert.equal(g.ev('G.stage.epDone'), false);
});
