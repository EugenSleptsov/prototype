-- PROTO // TYPE — очки по уровням в общей таблице (матрица рекордов). Выполнить один раз в SQL Editor
-- проекта, где уже выполнен leaderboard.sql. До этого игра шлёт и показывает только сумму забега.
-- lv — очки каждого уровня забега по порядку: Частицы, Адроны, Ядра, Звёзды, Атомы, Молекулы (null — уровня не было).

alter table public.scores add column if not exists lv integer[];
alter table public.scores drop constraint if exists lv_plausible;
alter table public.scores add constraint lv_plausible check (
  lv is null or (board = 'run' and cardinality(lv) between 1 and 6 and 0 <= all(lv) and 200000 >= all(lv))
);
notify pgrst, 'reload schema'; -- чтобы REST сразу увидел новый столбец
