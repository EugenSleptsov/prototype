-- PROTO // TYPE — общая таблица рекордов в Supabase.
-- Как включить:
--   1. supabase.com → New project (бесплатный план).
--   2. SQL Editor → вставь весь этот файл → Run.
--   3. Project Settings → API: скопируй Project URL и ключ anon (public) в js/online.js (ONLINE.url, ONLINE.key).
-- Ключ anon публичный по замыслу Supabase: он виден в коде страницы. Защищают таблицу правила ниже (RLS):
-- читать может любой, добавлять — только правдоподобные строки, менять и удалять — никто.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  board      text        not null check (board in ('run', 'heat')),  -- run — очки забега, heat — температура разогрева, ГэВ
  name       text        not null check (char_length(name) between 1 and 24 and name !~ '[<>]'),
  score      integer     not null,
  secs       integer,                                                 -- длительность забега, с (для run)
  v          integer     not null default 1,                          -- версия правил игры: сменятся правила — новая таблица по v
  created_at timestamptz not null default now(),
  -- грубая защита от явной подделки: разогрев 820…1500 ГэВ; забег — не короче минуты и не больше миллиона очков
  constraint plausible check (
    (board = 'heat' and score between 800 and 1500) or
    (board = 'run'  and score between 0 and 1000000 and secs between 60 and 36000)
  )
);
create index if not exists scores_board_score on public.scores (board, v, score desc);

alter table public.scores enable row level security;
drop policy if exists "read all" on public.scores;
create policy "read all" on public.scores for select to anon using (true);
drop policy if exists "insert plausible" on public.scores;
create policy "insert plausible" on public.scores for insert to anon with check (created_at > now() - interval '1 minute');
-- update / delete: политик нет — значит, запрещено

-- не чаще 6 записей в минуту под одним именем (от случайного спама)
create or replace function public.scores_rate() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.scores where lower(name) = lower(new.name) and created_at > now() - interval '1 minute') >= 6 then
    raise exception 'too many scores';
  end if;
  return new;
end $$;
drop trigger if exists scores_rate on public.scores;
create trigger scores_rate before insert on public.scores for each row execute function public.scores_rate();

-- лучший результат каждого игрока (по имени) — это и показывает игра
create or replace view public.scores_best with (security_invoker = true) as
  select distinct on (board, v, lower(name)) board, v, name, score, secs, created_at
  from public.scores
  order by board, v, lower(name), score desc, created_at;
grant select on public.scores_best to anon;
