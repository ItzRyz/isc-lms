-- Migration 006 — Quiz System (AGENTS.md §15, P5)
-- Types: ICE_BREAKING/WEEKLY/ASSESSMENT, questions MULTIPLE_CHOICE/TRUE_FALSE/MULTIPLE_ANSWER, bank, random, timer, auto-grade

-- Quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) >= 3 and char_length(title) <= 150),
  description text,
  type text not null default 'WEEKLY' check (type in ('ICE_BREAKING','WEEKLY','ASSESSMENT')),
  duration_minutes int not null default 30 check (duration_minutes > 0 and duration_minutes <= 180),
  max_attempts int not null default 1 check (max_attempts >= 1 and max_attempts <= 10),
  shuffle_questions boolean not null default false,
  shuffle_choices boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  is_published boolean not null default false,
  pass_score int not null default 60 check (pass_score >= 0 and pass_score <= 100),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (available_until is null or available_from is null or available_until > available_from)
);
create index if not exists idx_quizzes_course_id on public.quizzes(course_id);
create index if not exists idx_quizzes_is_published on public.quizzes(is_published) where is_published = true and deleted_at is null;
create index if not exists idx_quizzes_available on public.quizzes(available_from, available_until) where is_published = true;

-- Questions bank
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  type text not null check (type in ('MULTIPLE_CHOICE','TRUE_FALSE','MULTIPLE_ANSWER')),
  content text not null,
  choices jsonb not null default '[]'::jsonb, -- [{id,text,is_correct}] server shuffles, client never trusts is_correct
  explanation text,
  points int not null default 10 check (points > 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (jsonb_typeof(choices) = 'array')
);
create index if not exists idx_questions_course_id on public.questions(course_id);
create index if not exists idx_questions_type on public.questions(type);

-- Quiz-Questions join (bank selection per quiz)
create table if not exists public.quiz_questions (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  order_index int not null default 0,
  points_override int check (points_override is null or points_override > 0),
  created_at timestamptz not null default now(),
  primary key (quiz_id, question_id),
  unique (quiz_id, question_id)
);
create index if not exists idx_quiz_questions_quiz_id on public.quiz_questions(quiz_id);
create index if not exists idx_quiz_questions_question_id on public.quiz_questions(question_id);

-- Quiz attempts
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number int not null,
  status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS','SUBMITTED','GRADED','EXPIRED')),
  score int, -- 0-100 calculated server-side, do not trust client
  max_score int,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz, -- started_at + duration
  time_spent_seconds int,
  unique (quiz_id, user_id, attempt_number)
);
create index if not exists idx_quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);
create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index if not exists idx_quiz_attempts_status on public.quiz_attempts(status);

-- Quiz answers (per attempt, per question)
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_choice_ids jsonb not null default '[]'::jsonb, -- array of choice ids
  is_correct boolean,
  points_earned int,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create index if not exists idx_quiz_answers_attempt_id on public.quiz_answers(attempt_id);
create index if not exists idx_quiz_answers_question_id on public.quiz_answers(question_id);

-- Updated_at triggers
drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at before update on public.quizzes for each row execute function public.handle_updated_at();
drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at before update on public.questions for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

-- Quizzes policies
drop policy if exists "authenticated can view published quizzes" on public.quizzes;
create policy "authenticated can view published quizzes" on public.quizzes for select to authenticated using (
  (is_published = true and deleted_at is null
   and (available_from is null or available_from <= now())
   and (available_until is null or available_until >= now()))
  or public.has_permission(auth.uid(), 'quiz.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "privileged can manage quizzes" on public.quizzes;
create policy "privileged can manage quizzes" on public.quizzes for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'quiz.create')
  or public.has_permission(auth.uid(), 'quiz.grade')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'quiz.create')
);
drop policy if exists "service_role can manage quizzes" on public.quizzes;
create policy "service_role can manage quizzes" on public.quizzes for all to service_role using (true);

-- Questions: bank view for privileged, but quiz taker sees via join only
drop policy if exists "authenticated can view questions via quiz" on public.questions;
create policy "authenticated can view questions via quiz" on public.questions for select to authenticated using (
  public.has_permission(auth.uid(), 'quiz.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'quiz.create')
);
drop policy if exists "service_role can manage questions" on public.questions;
create policy "service_role can manage questions" on public.questions for all to service_role using (true);

drop policy if exists "authenticated can view quiz_questions" on public.quiz_questions;
create policy "authenticated can view quiz_questions" on public.quiz_questions for select to authenticated using (
  public.has_permission(auth.uid(), 'quiz.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "service_role can manage quiz_questions" on public.quiz_questions;
create policy "service_role can manage quiz_questions" on public.quiz_questions for all to service_role using (true);

-- Attempts: own only + mentor view via quiz course?
drop policy if exists "users can manage own attempts" on public.quiz_attempts;
create policy "users can manage own attempts" on public.quiz_attempts for all to authenticated using (
  auth.uid() = user_id
  or public.has_permission(auth.uid(), 'quiz.grade')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
) with check (
  auth.uid() = user_id
  or public.has_permission(auth.uid(), 'quiz.grade')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "service_role can manage quiz_attempts" on public.quiz_attempts;
create policy "service_role can manage quiz_attempts" on public.quiz_attempts for all to service_role using (true);

drop policy if exists "users can manage own answers" on public.quiz_answers;
create policy "users can manage own answers" on public.quiz_answers for all to authenticated using (
  exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and (qa.user_id = auth.uid() or public.has_permission(auth.uid(), 'quiz.grade')))
) with check (
  exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and (qa.user_id = auth.uid() or public.has_permission(auth.uid(), 'quiz.grade')))
);
drop policy if exists "service_role can manage quiz_answers" on public.quiz_answers;
create policy "service_role can manage quiz_answers" on public.quiz_answers for all to service_role using (true);

-- Seed P5: Frontend Development → Quiz HTML Weekly
do $$
declare
  fe_course_id uuid;
  quiz_id uuid;
  q1 uuid; q2 uuid; q3 uuid;
begin
  select id into fe_course_id from public.courses where slug = 'frontend-development' limit 1;
  if fe_course_id is null then return; end if;

  insert into public.quizzes (course_id, title, description, type, duration_minutes, max_attempts, shuffle_questions, shuffle_choices, is_published, available_from, available_until, pass_score)
  values (
    fe_course_id, 'Quiz HTML — Weekly', 'Uji pemahaman HTML semantik, tags, forms.',
    'WEEKLY', 15, 3, true, true, true, now() - interval '1 day', now() + interval '30 days', 60
  )
  on conflict do nothing
  returning id into quiz_id;

  if quiz_id is null then
    select id into quiz_id from public.quizzes where course_id = fe_course_id and title = 'Quiz HTML — Weekly' limit 1;
  end if;

  if quiz_id is null then return; end if;

  -- Questions bank
  insert into public.questions (course_id, type, content, choices, explanation, points) values
    (fe_course_id, 'MULTIPLE_CHOICE', 'Tag HTML untuk heading terbesar adalah?', '[{"id":"a","text":"<h1>","is_correct":true},{"id":"b","text":"<h6>","is_correct":false},{"id":"c","text":"<header>","is_correct":false},{"id":"d","text":"<title>","is_correct":false}]'::jsonb, 'h1 adalah heading level 1 terbesar.', 10),
    (fe_course_id, 'TRUE_FALSE', 'Atribut alt pada <img> wajib untuk aksesibilitas.', '[{"id":"true","text":"True","is_correct":true},{"id":"false","text":"False","is_correct":false}]'::jsonb, 'alt membantu screen reader.', 10),
    (fe_course_id, 'MULTIPLE_ANSWER', 'Pilih yang termasuk tag semantik HTML5 (multiple):', '[{"id":"a","text":"<article>","is_correct":true},{"id":"b","text":"<section>","is_correct":true},{"id":"c","text":"<div>","is_correct":false},{"id":"d","text":"<nav>","is_correct":true}]'::jsonb, 'article, section, nav adalah semantik; div tidak.', 10)
  on conflict do nothing;

  -- Link to quiz (get inserted ids)
  for q1 in select id from public.questions where course_id = fe_course_id order by created_at limit 3 loop
    insert into public.quiz_questions (quiz_id, question_id, order_index)
    values (quiz_id, q1, (select count(*) from public.quiz_questions where quiz_id = quiz_id))
    on conflict do nothing;
  end loop;

  -- Additional quiz: ICE_BREAKING sample
  insert into public.quizzes (course_id, title, type, duration_minutes, max_attempts, is_published, available_from)
  values (fe_course_id, 'Ice Breaking — Kenalan', 'ICE_BREAKING', 10, 1, true, now() - interval '1 day')
  on conflict do nothing;
end $$;
