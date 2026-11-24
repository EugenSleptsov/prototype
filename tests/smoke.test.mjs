// Дымовые прогоны: бот беспорядочно водит, жмёт, держит и отпускает на каждом этапе игры, с отрисовкой и HUD.
// Любое исключение в update/render/hud — падение теста (в браузере такая ошибка замораживала картинку).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

// бот: цель — случайный живой объект этапа; клики, долгие и короткие удержания, иногда покупки
const BOT = `globalThis.__bot = (secs) => {
  let hold = 0, holdFor = 0, ang = 0;
  for (let i = 0; i < 60 * secs; i++) {
    const S = G.stage, list = S.p || S.q || S.nuc || S.m || S.at || [];
    ang += .03;
    mouse.x = G.W / 2 + Math.cos(ang) * 160 + (Math.random() - .5) * 60; mouse.y = G.H / 2 + Math.sin(ang * 1.3) * 120; mouse.has = true;
    if (!mouse.down && Math.random() < .03) { mouse.clicked = true; mouse.down = true; hold = 0; holdFor = Math.random() < .4 ? .1 : Math.random() * 4; if ('en' in S) S.en = Math.max(S.en, 5); }
    if (mouse.down && (hold += 1 / 60) > holdFor) mouse.down = false;
    if (Math.random() < .003 && S.canBuy && S.canBuy()) S.buy(Math.random() * 3 | 0);
    update(1 / 60); render(); hud();
  }
  mouse.down = false;
};`;

function run(opts) {
  const g = loadGame(opts);
  g.ev(BOT);
  g.ev(PREP.start); g.ev(PREP.pump()); g.ev(PREP.light); g.ev(`Codex.see('ph')`);
  return g;
}

for (const touch of [false, true]) {
  test(`частицы, все 4 эпохи, бот${touch ? ' (сенсор)' : ''}`, () => {
    const g = run({ seed: touch ? 7 : 5, touch });
    g.ev('__bot(60)');
    // эпоха 2 (Хиггс) — только первое поколение в кодексе, как у игрока
    g.ev(`['e', 'u', 'd', 'g'].forEach(k => Codex.see(k)); G.stage.rs.g = 1; G.stage.gOn = true;`);
    let maxEp = 0;
    for (let ep = 1; ep <= 3; ep++) {
      g.ev(`(() => { const S = G.stage; S.epDone = true; S.epGap = 99; S.T = Math.min(S.T, EPOCHS[${ep}].startT === Infinity ? S.T : EPOCHS[${ep}].startT); })()`);
      let n = 0;
      while (g.ev('G.stage.ep') < ep && n++ < 120) g.step(60);
      if (g.ev('G.stage.ep') < ep) g.ev(`G.stage.ep = ${ep}; G.stage.newEpochState(${ep}); G.stage.hig = 1; G.stage.T = EPOCHS[${ep}].floor * 2`);
      if (g.ev(`G.stage.key`) !== 'particles') break; // эпоха 4 пройдена — забег ушёл на «Адроны»
      maxEp = Math.max(maxEp, g.ev('G.stage.ep'));
      g.ev('__bot(45)');
    }
    assert.ok(maxEp === 3 || g.ev(`G.stage.key`) !== 'particles', `дошли только до эпохи ${maxEp + 1}`);
  });
}

test('все этапы лестницы грузятся и живут под ботом', () => {
  const g = run({ seed: 11 });
  const keys = [];
  for (let i = 1; i < g.ev('STAGES.length'); i++) {
    g.ev('advance(); G.trans = 99'); keys.push(g.ev('G.stage.key'));
    g.ev('__bot(30)');
  }
  assert.equal(keys.length, g.ev('STAGES.length') - 1);
});
