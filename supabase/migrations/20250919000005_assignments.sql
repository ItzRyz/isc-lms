-- Migration 005 — Assignment System (AGENTS.md §14, P4)
-- Types: INDIVIDUAL/GROUP, submission FILE/TEXT/FILE_AND_TEXT, statuses 8 state, rubric, revision, grading history

-- Assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  title text not null check (char_length(title) >= 3 and char_length(title) <= 150),
  description text,
  type text not null default 'INDIVIDUAL' check (type in ('INDIVIDUAL','GROUP')),
  submission_type text not null default 'FILE_AND_TEXT' check (submission_type in ('FILE','TEXT','FILE_AND_TEXT')),
  due_at timestamptz,
  allow_late boolean not null default true,
  max_score int not null default 100 check (max_score > 0 and max_score <= 1000),
  max_attempts int not null default 1 check (max_attempts >= 1 and max_attempts <= 10),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index if not exists idx_assignments_course_id on public.assignments(course_id);
create index if not exists idx_assignments_due_at on public.assignments(due_at) where due_at is not null;
create index if not exists idx_assignments_is_published on public.assignments(is_published) where is_published = true and deleted_at is null;

-- Assignment groups (for GROUP type)
create table if not exists public.assignment_groups (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (assignment_id, name)
);
create index if not exists idx_assignment_groups_assignment_id on public.assignment_groups(assignment_id);

create table if not exists public.assignment_group_members (
  assignment_group_id uuid not null references public.assignment_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_group_id, user_id)
);

-- Rubrics
create table if not exists public.rubrics (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.rubric_items (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references public.rubrics(id) on delete cascade,
  criterion text not null,
  max_points int not null check (max_points > 0),
  order_index int not null default 0
);
create index if not exists idx_rubric_items_rubric_id on public.rubric_items(rubric_id);

-- Submissions (server-authoritative status §14, deadline validation server-side)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  assignment_group_id uuid references public.assignment_groups(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','DRAFT','SUBMITTED','LATE','GRADED','REVISION_REQUIRED','RESUBMITTED')),
  content_text text,
  score int check (score is null or (score >= 0 and score <= 1000)),
  feedback text,
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  attempt_number int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id, attempt_number)
);
create index if not exists idx_submissions_assignment_id on public.submissions(assignment_id);
create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_submissions_status on public.submissions(status);
-- Partial unique for latest per user (for quick lookup) — via view nanti
create index if not exists idx_submissions_assignment_user_latest on public.submissions(assignment_id, user_id, created_at desc);

-- Submission files (private bucket assignment-submissions §37)
create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size int check (file_size is null or file_size > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_submission_files_submission_id on public.submission_files(submission_id);

-- Submission revisions / grading history (preserve per §34)
create table if not exists public.submission_revisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  old_status text,
  new_status text,
  old_score int,
  new_score int,
  feedback text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_submission_revisions_submission_id on public.submission_revisions(submission_id);

-- Grading history via submission_revisions + rubric scoring
create table if not exists public.submission_rubric_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  rubric_item_id uuid not null references public.rubric_items(id) on delete cascade,
  points int not null check (points >= 0),
  created_at timestamptz not null default now(),
  unique (submission_id, rubric_item_id)
);

-- Updated_at triggers
drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at before update on public.assignments for each row execute function public.handle_updated_at();
drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at before update on public.submissions for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.assignments enable row level security;
alter table public.assignment_groups enable row level security;
alter table public.assignment_group_members enable row level security;
alter table public.rubrics enable row level security;
alter table public.rubric_items enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;
alter table public.submission_revisions enable row level security;
alter table public.submission_rubric_scores enable row level security;

-- Assignments policies
drop policy if exists "authenticated can view published assignments" on public.assignments;
create policy "authenticated can view published assignments" on public.assignments for select to authenticated using (
  (is_published = true and deleted_at is null)
  or public.has_permission(auth.uid(), 'assignment.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "privileged can manage assignments" on public.assignments;
create policy "privileged can manage assignments" on public.assignments for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'assignment.create')
  or public.has_permission(auth.uid(), 'assignment.grade')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_permission(auth.uid(), 'assignment.create')
);
drop policy if exists "service_role can manage assignments" on public.assignments;
create policy "service_role can manage assignments" on public.assignments for all to service_role using (true);

-- Submissions: owncan manage, mentor can grade via has_permission
drop policy if exists "users can manage own submissions" on public.submissions;
create policy "users can manage own submissions" on public.submissions for all to authenticated using (
  auth.uid() = user_id
  or public.has_permission(auth.uid(), 'assignment.grade')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
) with check (
  auth.uid() = user_id
  or public.has_permission(auth.uid(), 'assignment.grade')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "service_role can manage submissions" on public.submissions;
create policy "service_role can manage submissions" on public.submissions for all to service_role using (true);

drop policy if exists "users can manage own submission_files" on public.submission_files;
create policy "users can manage own submission_files" on public.submission_files for all to authenticated using (
  exists (select 1 from public.submissions s where s.id = submission_id and (s.user_id = auth.uid() or public.has_permission(auth.uid(), 'assignment.grade')))
) with check (
  exists (select 1 from public.submissions s where s.id = submission_id and (s.user_id = auth.uid() or public.has_permission(auth.uid(), 'assignment.grade')))
);
drop policy if exists "service_role can manage submission_files" on public.submission_files;
create policy "service_role can manage submission_files" on public.submission_files for all to service_role using (true);

-- Seed P4 sample: Frontend Development → Tugas HTML
do $$
declare
  fe_course_id uuid;
  html_mod_id uuid;
  assign_id uuid;
  rubric_id uuid;
begin
  select id into fe_course_id from public.courses where slug = 'frontend-development' limit 1;
  if fe_course_id is null then return; end if;
  select id into html_mod_id from public.modules where course_id = fe_course_id and title = 'HTML' limit 1;

  insert into public.assignments (course_id, module_id, title, description, type, submission_type, due_at, allow_late, max_score, is_published, created_by)
  values (
    fe_course_id, html_mod_id,
    'Tugas HTML — Buat Landing Page',
    'Buat landing page responsif dengan HTML semantik. Upload file zip + deskripsi.',
    'INDIVIDUAL', 'FILE_AND_TEXT',
    now() + interval '7 days', true, 100, true, null
  )
  on conflict do nothing
  returning id into assign_id;

  if assign_id is null then
    select id into assign_id from public.assignments where course_id = fe_course_id and title = 'Tugas HTML — Buat Landing Page' limit 1;
  end if;

  if assign_id is not null then
    insert into public.rubrics (assignment_id, title, description)
    values (assign_id, 'Rubrik HTML', 'Kriteria penilaian HTML')
    on conflict do nothing
    returning id into rubric_id;

    if rubric_id is null then
      select id into rubric_id from public.rubrics where assignment_id = assign_id limit 1;
    end if;

    if rubric_id is not null then
      insert into public.rubric_items (rubric_id, criterion, max_points, order_index) values
        (rubric_id, 'Struktur Semantik', 30, 1),
        (rubric_id, 'Responsif', 30, 2),
        (rubric_id, 'Validasi HTML', 20, 3),
        (rubric_id, 'Kreativitas', 20, 4)
      on conflict do nothing;
    end if;

    -- Sample group assignment untuk Web (GROUP)
    insert into public.assignments (course_id, title, description, type, submission_type, due_at, max_score, is_published)
    values (
      fe_course_id, 'Tugas Kelompok — Clone Website', 'Kelompok 3 orang, clone homepage study club.',
      'GROUP', 'FILE', now() + interval '14 days', 100, true
    )
    on conflict do nothing;
  end if;
end $$;

-- Storage bucket assignment-submissions (private) - via storage.buckets insert (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assignment-submissions', 'assignment-submissions', false, 52428800, null)
on conflict (id) do nothing;
