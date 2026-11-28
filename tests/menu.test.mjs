// Главное меню (просьба игрока 28.11): Esc с пустыми руками — меню и пауза; Esc — назад; «На главную» — со второго нажатия.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, PREP } from './harness.mjs';

test('меню: Esc открывает и ставит игру на паузу, Esc закрывает; «На главную» спрашивает, потом уходит на первую страницу', () => {
  const g = loadGame({ seed: 1 });
  g.ev(PREP.start);
  const esc = () => g.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }))`);
  g.ev('stDrop()'); // первый толчок поля держит шарик: Esc с занятыми руками — разжать, а не меню
  assert.equal(g.ev('stDrop()'), false, 'руки пусты');
  esc();
  assert.equal(g.ev('Menu.on && G.paused'), true, 'меню открыто, игра стоит');
  const t0 = g.ev('G.stage.t'); g.play(60); assert.equal(g.ev('G.stage.t'), t0, 'Вселенная стоит');
  esc();
  assert.equal(g.ev('!Menu.on && !G.paused'), true, 'закрыто, игра идёт');
  g.ev(`globalThis.__went = 0; location.reload = () => { __went++; }`);
  g.ev('Menu.open(); Menu.home()');
  assert.equal(g.ev('__went'), 0, 'первое нажатие — только вопрос');
  assert.equal(g.ev('Menu.sure'), true);
  g.ev('Menu.home()');
  assert.equal(g.ev('__went'), 1, 'второе — на первую страницу');
});
