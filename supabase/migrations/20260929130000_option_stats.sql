-- Per-option answer statistics ("% of students who chose each option")
-- and remembering each student's chosen option in the PYQ portal.

create table public.question_option_stats (
  question_id uuid primary key references public.questions(id) on delete cascade,
  a int not null default 0,
  b int not null default 0,
  c int not null default 0,
  d int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.question_option_stats enable row level security;
-- No policies: only read/written through the security-definer functions below.

alter table public.pyq_progress
  add column selected_option text check (selected_option in ('A','B','C','D'));

-- Adds one vote for an option.
create function public.bump_option_stat(p_question_id uuid, p_option text)
returns void language sql security definer set search_path = '' as $$
  insert into public.question_option_stats (question_id, a, b, c, d)
  values (p_question_id,
          (p_option = 'A')::int, (p_option = 'B')::int, (p_option = 'C')::int, (p_option = 'D')::int)
  on conflict (question_id) do update set
    a = public.question_option_stats.a + excluded.a,
    b = public.question_option_stats.b + excluded.b,
    c = public.question_option_stats.c + excluded.c,
    d = public.question_option_stats.d + excluded.d,
    updated_at = now();
$$;
revoke execute on function public.bump_option_stat(uuid, text) from public, anon, authenticated;

-- Option percentages for one question: {"A": 12, "B": 60, "C": 20, "D": 8, "total": 25}
create function public.option_stats_json(p_question_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'A', case when t = 0 then 0 else round(100.0 * a / t) end,
    'B', case when t = 0 then 0 else round(100.0 * b / t) end,
    'C', case when t = 0 then 0 else round(100.0 * c / t) end,
    'D', case when t = 0 then 0 else round(100.0 * d / t) end,
    'total', t)
  from (
    select coalesce(s.a, 0) a, coalesce(s.b, 0) b, coalesce(s.c, 0) c, coalesce(s.d, 0) d,
           coalesce(s.a + s.b + s.c + s.d, 0) t
    from (select 1) one left join public.question_option_stats s on s.question_id = p_question_id
  ) x;
$$;
revoke execute on function public.option_stats_json(uuid) from public, anon, authenticated;

-- Reveal answer for one PYQ. When an option is picked it is counted in the
-- statistics (once per signed-in student) and stored in their progress.
create or replace function public.check_answer(p_question_id uuid, p_selected text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q record; ok boolean; uid uuid := auth.uid(); pick text := upper(nullif(p_selected, '')); first_try boolean := true;
begin
  select correct_option, explanation into q from public.questions qq
   join public.papers p on p.id = qq.paper_id and p.status = 'published'
   where qq.id = p_question_id;
  if not found then raise exception 'question not found'; end if;
  if pick is not null and pick not in ('A','B','C','D') then raise exception 'bad option'; end if;
  ok := coalesce(pick = q.correct_option, false);

  if pick is not null then
    if uid is not null then
      first_try := not exists (select 1 from public.pyq_progress where user_id = uid and question_id = p_question_id);
      insert into public.pyq_progress (user_id, question_id, is_correct, solved, selected_option)
      values (uid, p_question_id, ok, ok, pick)
      on conflict (user_id, question_id) do update
        set is_correct = excluded.is_correct,
            solved = public.pyq_progress.solved or excluded.solved,
            selected_option = excluded.selected_option,
            attempted_at = now();
    end if;
    if first_try then perform public.bump_option_stat(p_question_id, pick); end if;
  end if;

  return jsonb_build_object('correct_option', q.correct_option, 'explanation', q.explanation,
                            'is_correct', ok, 'stats', public.option_stats_json(p_question_id));
end $$;

-- The signed-in student's attempts in one chapter (to restore their answers).
create function public.my_pyq_attempts(p_chapter_id uuid)
returns table (question_id uuid, selected_option text, is_correct boolean)
language sql stable security invoker set search_path = '' as $$
  select pp.question_id, pp.selected_option, pp.is_correct
  from public.pyq_progress pp join public.questions q on q.id = pp.question_id
  where pp.user_id = auth.uid() and q.chapter_id = p_chapter_id;
$$;

-- The signed-in student's attempted / correct counts per chapter.
create function public.my_chapter_progress()
returns table (chapter_id uuid, attempted bigint, correct bigint)
language sql stable security invoker set search_path = '' as $$
  select q.chapter_id, count(*), count(*) filter (where pp.is_correct)
  from public.pyq_progress pp join public.questions q on q.id = pp.question_id
  where pp.user_id = auth.uid()
  group by q.chapter_id;
$$;

grant execute on function public.my_pyq_attempts(uuid), public.my_chapter_progress() to authenticated;
