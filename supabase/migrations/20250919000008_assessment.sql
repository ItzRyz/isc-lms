-- Migration 008 — Assessment (AGENTS.md §18-22, P7)
-- Points ledger immutable, Grades + weights + KKM, Ranking monthly/semester, Report Card

-- Points ledger (§19) — immutable, compensating transactions
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount <> 0),
  type text not null check (type in ('EARN','PENALTY','CORRECTION')),
  source_type text not null check (source_type in ('QUIZ','ASSIGNMENT','ATTENDANCE','COMPETITION','PRACTICE','MANUAL')),
  source_id uuid,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_point_transactions_user_id on public.point_transactions(user_id);
create index if not exists idx_point_transactions_source on public.point_transactions(source_type, source_id);
create index if not exists idx_point_transactions_created_at on public.point_transactions(created_at);

-- Grade components (§18) QUIZ/ASSIGNMENT/PRACTICE/ATTENDANCE/COMPETITION
create table if not exists public.grade_components (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('QUIZ','ASSIGNMENT','PRACTICE','ATTENDANCE','COMPETITION')),
  description text,
  created_at timestamptz not null default now()
);
insert into public.grade_components (name, description) values
  ('QUIZ','Quiz scores'), ('ASSIGNMENT','Assignment scores'), ('PRACTICE','Practice scores'), ('ATTENDANCE','Attendance scores'), ('COMPETITION','Competition scores')
on conflict (name) do nothing;

-- Grade weights (§18) configurable per academic_period / course / division
create table if not exists public.grade_weights (
  id uuid primary key default gen_random_uuid(),
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete cascade,
  component_id uuid not null references public.grade_components(id) on delete cascade,
  weight numeric not null check (weight >= 0 and weight <= 100),
  created_at timestamptz not null default now(),
  unique (coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(course_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(division_id, '00000000-0000-0000-0000-000000000000'::uuid), component_id)
);
create index if not exists idx_grade_weights_academic on public.grade_weights(academic_period_id);
create index if not exists idx_grade_weights_course on public.grade_weights(course_id);

-- Grade scales (configurable A-E, §20)
create table if not exists public.grade_scales (
  id uuid primary key default gen_random_uuid(),
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  grade text not null check (grade in ('A','B','C','D','E')),
  min_score numeric not null check (min_score >= 0 and min_score <= 100),
  max_score numeric not null check (max_score >= 0 and max_score <= 100),
  created_at timestamptz not null default now(),
  check (min_score <= max_score),
  unique (coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid), grade)
);
insert into public.grade_scales (grade, min_score, max_score) values
  ('A', 90, 100), ('B', 80, 89.99), ('C', 70, 79.99), ('D', 60, 69.99), ('E', 0, 59.99)
on conflict do nothing;

-- Grades (§20) — per user per academic_period per component
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  component_id uuid not null references public.grade_components(id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 1000),
  max_score numeric not null default 100,
  weight numeric, -- snapshot weight at time
  final_score numeric, -- weighted
  grade text check (grade in ('A','B','C','D','E')),
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid), component_id)
);
create index if not exists idx_grades_user_id on public.grades(user_id);
create index if not exists idx_grades_academic_period_id on public.grades(academic_period_id);
create index if not exists idx_grades_component_id on public.grades(component_id);
create index if not exists idx_grades_user_academic on public.grades(user_id, academic_period_id);

-- KKM/KKTP per course / period (configurable, §20)
create table if not exists public.kkm_settings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  kkm_score numeric not null check (kkm_score >= 0 and kkm_score <= 100),
  created_at timestamptz not null default now(),
  unique (coalesce(course_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Ranking periods (§21) MONTHLY/SEMESTER
create table if not exists public.ranking_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('MONTHLY','SEMESTER')),
  start_date date not null,
  end_date date not null,
  division_id uuid references public.divisions(id) on delete set null,
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CLOSED','ARCHIVED')),
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);
create index if not exists idx_ranking_periods_type on public.ranking_periods(type);
create index if not exists idx_ranking_periods_status on public.ranking_periods(status);

create table if not exists public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  ranking_period_id uuid not null references public.ranking_periods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank int not null check (rank > 0),
  score numeric not null, -- total points (MONTHLY) or final academic score (SEMESTER) — reproducible
  division_id uuid references public.divisions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (ranking_period_id, user_id),
  unique (ranking_period_id, rank)
);
create index if not exists idx_ranking_entries_period_id on public.ranking_entries(ranking_period_id);
create index if not exists idx_ranking_entries_user_id on public.ranking_entries(user_id);

-- Report cards (§22)
create table if not exists public.report_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  final_score numeric not null,
  grade text not null,
  remarks text,
  mentor_id uuid references public.profiles(id) on delete set null,
  coordinator_id uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  unique (user_id, academic_period_id)
);
create table if not exists public.report_card_items (
  id uuid primary key default gen_random_uuid(),
  report_card_id uuid not null references public.report_cards(id) on delete cascade,
  component_id uuid not null references public.grade_components(id) on delete cascade,
  score numeric not null,
  weight numeric not null,
  weighted_score numeric not null
);
create index if not exists idx_report_card_items_report_id on public.report_card_items(report_card_id);

-- Triggers
drop trigger if exists trg_grades_updated_at on public.grades;
create trigger trg_grades_updated_at before update on public.grades for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.point_transactions enable row level security;
alter table public.grade_components enable row level security;
alter table public.grade_weights enable row level security;
alter table public.grade_scales enable row level security;
alter table public.grades enable row level security;
alter table public.kkm_settings enable row level security;
alter table public.ranking_periods enable row level security;
alter table public.ranking_entries enable row level security;
alter table public.report_cards enable row level security;
alter table public.report_card_items enable row level security;

-- Policies: points — user can view own, mentor/coordinator can view scoped, admin all; immutable (no update/delete)
drop policy if exists "users can view own points" on public.point_transactions;
create policy "users can view own points" on public.point_transactions for select to authenticated using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'grade.view')
);
drop policy if exists "privileged can insert points" on public.point_transactions;
create policy "privileged can insert points" on public.point_transactions for insert to authenticated with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'grade.create')
  or auth.uid() = user_id -- allow system via service_role for quiz/attendance auto
);
drop policy if exists "service_role can manage points" on public.point_transactions;
create policy "service_role can manage points" on public.point_transactions for all to service_role using (true);

-- Grades: own + mentor scoped via has_permission
drop policy if exists "users can view own grades" on public.grades;
create policy "users can view own grades" on public.grades for select to authenticated using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'grade.view')
);
drop policy if exists "privileged can manage grades" on public.grades;
create policy "privileged can manage grades" on public.grades for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'grade.create')
  or public.has_permission(auth.uid(), 'grade.update')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'grade.create')
);
drop policy if exists "service_role can manage grades" on public.grades;
create policy "service_role can manage grades" on public.grades for all to service_role using (true);

-- Components/weights/scales: authenticated can view, admin can manage
drop policy if exists "authenticated can view grade_components" on public.grade_components;
create policy "authenticated can view grade_components" on public.grade_components for select to authenticated using (true);
drop policy if exists "authenticated can view grade_weights" on public.grade_weights;
create policy "authenticated can view grade_weights" on public.grade_weights for select to authenticated using (true);
drop policy if exists "authenticated can view grade_scales" on public.grade_scales;
create policy "authenticated can view grade_scales" on public.grade_scales for select to authenticated using (true);

-- Ranking: all can view active, privileged can manage
drop policy if exists "authenticated can view ranking_periods" on public.ranking_periods;
create policy "authenticated can view ranking_periods" on public.ranking_periods for select to authenticated using (true);
drop policy if exists "authenticated can view ranking_entries" on public.ranking_entries;
create policy "authenticated can view ranking_entries" on public.ranking_entries for select to authenticated using (true);
drop policy if exists "service_role can manage ranking" on public.ranking_periods;
create policy "service_role can manage ranking" on public.ranking_periods for all to service_role using (true);
drop policy if exists "service_role can manage ranking_entries" on public.ranking_entries;
create policy "service_role can manage ranking_entries" on public.ranking_entries for all to service_role using (true);

-- Report cards: own + mentor
drop policy if exists "users can view own report_cards" on public.report_cards;
create policy "users can view own report_cards" on public.report_cards for select to authenticated using (
  auth.uid() = user_id or public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'MENTOR')
);
drop policy if exists "service_role can manage report_cards" on public.report_cards;
create policy "service_role can manage report_cards" on public.report_cards for all to service_role using (true);

-- Seed P7: default weights 20/30/25/15/10 (§18), KKM 70, ranking periods
insert into public.grade_weights (component_id, weight)
select id, case name when 'QUIZ' then 20 when 'ASSIGNMENT' then 30 when 'PRACTICE' then 25 when 'ATTENDANCE' then 15 when 'COMPETITION' then 10 end
from public.grade_components
on conflict do nothing;

insert into public.kkm_settings (kkm_score) values (70) on conflict do nothing;

insert into public.ranking_periods (name, type, start_date, end_date, status) values
  ('Monthly — ' || to_char(now(), 'YYYY-MM'), 'MONTHLY', date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date, 'ACTIVE'),
  ('Semester Ganjil 2025/2026', 'SEMESTER', '2025-08-01', '2026-01-31', 'ACTIVE')
on conflict do nothing;

-- Seed sample points & grades untuk demo (3 members)
do $$
declare
  web_div_id uuid;
  ap_id uuid;
  u1 uuid; u2 uuid; u3 uuid;
begin
  select id into web_div_id from public.divisions where slug = 'web' limit 1;
  select id into ap_id from public.academic_periods limit 1;
  if ap_id is null then
    insert into public.academic_periods (name, start_date, end_date) values ('2025/2026 Ganjil', '2025-08-01', '2026-01-31') returning id into ap_id;
  end if;

  -- Find any 3 profiles for demo points
  select id into u1 from public.profiles limit 1 offset 0;
  select id into u2 from public.profiles limit 1 offset 1;
  select id into u3 from public.profiles limit 1 offset 2;

  if u1 is not null then
    insert into public.point_transactions (user_id, amount, type, source_type, description) values
      (u1, 100, 'EARN', 'QUIZ', 'Quiz HTML Weekly'),
      (u1, 200, 'EARN', 'ASSIGNMENT', 'Tugas HTML'),
      (u1, 50, 'EARN', 'ATTENDANCE', 'Present')
    on conflict do nothing;
    insert into public.grades (user_id, academic_period_id, component_id, score, max_score) 
    select u1, ap_id, id, 85, 100 from public.grade_components where name = 'QUIZ'
    on conflict do nothing;
  end if;

  if u2 is not null then
    insert into public.point_transactions (user_id, amount, type, source_type, description) values
      (u2, 80, 'EARN', 'QUIZ', 'Quiz HTML Weekly'),
      (u2, 150, 'EARN', 'ASSIGNMENT', 'Tugas HTML')
    on conflict do nothing;
  end if;
end $$;
