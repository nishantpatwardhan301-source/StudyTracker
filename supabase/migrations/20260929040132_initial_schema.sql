-- Applied to project cugmfkuiqayuqlqkjham on 2026-09-29.

-- ================= CONTENT =================
create table public.papers (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  shift_code text not null unique,
  shift_date date,
  shift_session text,
  duration_minutes int not null default 180,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('physics','chemistry','maths')),
  standard int not null check (standard in (11,12)),
  name text not null,
  display_order int not null default 0,
  unique (subject, name)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  question_number int not null,
  subject text not null check (subject in ('physics','chemistry','maths')),
  chapter_id uuid references public.chapters(id),
  topic text,
  question_text text not null,
  image_url text,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  marks int not null default 1,
  explanation text,
  created_at timestamptz not null default now(),
  unique (paper_id, question_number)
);
create index questions_chapter_idx on public.questions(chapter_id);
create index questions_paper_idx on public.questions(paper_id);

alter table public.papers enable row level security;
alter table public.chapters enable row level security;
alter table public.questions enable row level security;

create policy "papers readable" on public.papers for select to anon, authenticated using (status = 'published');
create policy "chapters readable" on public.chapters for select to anon, authenticated using (true);
create policy "questions readable" on public.questions for select to anon, authenticated
  using (exists (select 1 from public.papers p where p.id = paper_id and p.status = 'published'));

-- Answers and explanations are NOT directly readable: only via check_answer / submit_test.
revoke select on public.questions from anon, authenticated;
grant select (id, paper_id, question_number, subject, chapter_id, topic, question_text, image_url,
              option_a, option_b, option_c, option_d, marks) on public.questions to anon, authenticated;

-- ================= STUDENT DATA =================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  class_standard text,
  exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracker_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  lecture boolean not null default false,
  notes boolean not null default false,
  pyq boolean not null default false,
  rev1 boolean not null default false,
  rev2 boolean not null default false,
  confidence smallint not null default 0 check (confidence between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

create table public.pyq_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  is_correct boolean not null,
  solved boolean not null default false,
  attempted_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid not null references public.papers(id) on delete cascade,
  scope text not null default 'full' check (scope in ('full','physics','chemistry','maths')),
  score int not null,
  max_score int not null,
  correct int not null,
  attempted int not null,
  total int not null,
  time_taken_seconds int,
  per_subject jsonb,
  answers jsonb,
  created_at timestamptz not null default now()
);
create index test_attempts_user_idx on public.test_attempts(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.tracker_progress enable row level security;
alter table public.pyq_progress enable row level security;
alter table public.test_attempts enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own tracker read" on public.tracker_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own tracker insert" on public.tracker_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own tracker update" on public.tracker_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own tracker delete" on public.tracker_progress for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own pyq read" on public.pyq_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own attempts read" on public.test_attempts for select to authenticated using ((select auth.uid()) = user_id);
-- pyq_progress and test_attempts are written only by the security-definer functions below.

-- Auto-create profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================= FUNCTIONS =================
-- Chapter list with question counts (for PYQ portal + tracker)
create function public.chapter_summary()
returns table (id uuid, subject text, standard int, name text, display_order int, question_count bigint)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.subject, c.standard, c.name, c.display_order, count(q.id)
  from public.chapters c left join public.questions q on q.chapter_id = c.id
  group by c.id order by c.subject, c.standard desc, c.display_order, c.name;
$$;

-- Paper list with counts per subject (for Test Portal)
create function public.paper_summary()
returns table (id uuid, year int, shift_code text, shift_date date, shift_session text, duration_minutes int,
               physics bigint, chemistry bigint, maths bigint, max_score bigint)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.year, p.shift_code, p.shift_date, p.shift_session, p.duration_minutes,
    count(*) filter (where q.subject = 'physics'),
    count(*) filter (where q.subject = 'chemistry'),
    count(*) filter (where q.subject = 'maths'),
    coalesce(sum(q.marks), 0)
  from public.papers p left join public.questions q on q.paper_id = p.id
  group by p.id order by p.shift_date desc nulls last, p.shift_code desc;
$$;

-- Reveal answer for one PYQ; records progress for signed-in students
create function public.check_answer(p_question_id uuid, p_selected text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q record; ok boolean; uid uuid := auth.uid();
begin
  select correct_option, explanation into q from public.questions qq
   join public.papers p on p.id = qq.paper_id and p.status = 'published'
   where qq.id = p_question_id;
  if not found then raise exception 'question not found'; end if;
  ok := upper(coalesce(p_selected, '')) = q.correct_option;
  if uid is not null and p_selected is not null then
    insert into public.pyq_progress (user_id, question_id, is_correct, solved)
    values (uid, p_question_id, ok, ok)
    on conflict (user_id, question_id) do update
      set is_correct = excluded.is_correct,
          solved = public.pyq_progress.solved or excluded.solved,
          attempted_at = now();
  end if;
  return jsonb_build_object('correct_option', q.correct_option, 'explanation', q.explanation, 'is_correct', ok);
end $$;

-- Score a test server-side. p_answers = {"<question_id>": "A", ...}
create function public.submit_test(p_paper_id uuid, p_scope text, p_answers jsonb, p_time_seconds int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); res jsonb; attempt_id uuid;
begin
  if p_scope not in ('full','physics','chemistry','maths') then raise exception 'bad scope'; end if;
  if not exists (select 1 from public.papers where id = p_paper_id and status = 'published') then
    raise exception 'paper not found';
  end if;

  with qs as (
    select q.id, q.subject, q.marks, q.correct_option, q.explanation,
           upper(p_answers ->> q.id::text) as picked
    from public.questions q
    where q.paper_id = p_paper_id and (p_scope = 'full' or q.subject = p_scope)
  ), subj as (
    select subject,
      sum(marks) as max, sum(case when picked = correct_option then marks else 0 end) as score,
      count(*) filter (where picked = correct_option) as correct,
      count(*) filter (where picked is not null and picked <> correct_option) as wrong,
      count(*) filter (where picked is null) as skipped
    from qs group by subject
  )
  select jsonb_build_object(
    'score', (select coalesce(sum(score),0) from subj),
    'max_score', (select coalesce(sum(max),0) from subj),
    'correct', (select coalesce(sum(correct),0) from subj),
    'attempted', (select coalesce(sum(correct + wrong),0) from subj),
    'total', (select count(*) from qs),
    'per_subject', (select coalesce(jsonb_object_agg(subject, jsonb_build_object(
        'score', score, 'max', max, 'correct', correct, 'wrong', wrong, 'skipped', skipped)), '{}'::jsonb) from subj),
    'key', (select coalesce(jsonb_object_agg(id, jsonb_build_object('c', correct_option, 'e', explanation)), '{}'::jsonb) from qs)
  ) into res;

  if uid is not null then
    insert into public.test_attempts (user_id, paper_id, scope, score, max_score, correct, attempted, total,
                                      time_taken_seconds, per_subject, answers)
    values (uid, p_paper_id, p_scope, (res->>'score')::int, (res->>'max_score')::int, (res->>'correct')::int,
            (res->>'attempted')::int, (res->>'total')::int, p_time_seconds, res->'per_subject', p_answers)
    returning id into attempt_id;
    res := res || jsonb_build_object('attempt_id', attempt_id);
  end if;
  return res;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.chapter_summary(), public.paper_summary(),
  public.check_answer(uuid, text), public.submit_test(uuid, text, jsonb, int) to anon, authenticated;
