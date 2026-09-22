-- Migration 003/004 — LMS Core (AGENTS.md §11-13, P3 Full Spec)
-- Division→Course→Module→Material + DAG prerequisites + progress + bookmarks + roadmap

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete restrict,
  slug text not null,
  name text not null,
  description text,
  is_published boolean not null default false,
  scheduled_at timestamptz,
  estimated_duration int, -- minutes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (division_id, slug),
  check (estimated_duration is null or estimated_duration > 0)
);
create index if not exists idx_courses_division_id on public.courses(division_id);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_courses_is_published on public.courses(is_published) where is_published = true and deleted_at is null;
create index if not exists idx_courses_scheduled_at on public.courses(scheduled_at) where scheduled_at is not null;

-- Modules
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  order_index int not null check (order_index >= 1 and order_index <= 100),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (course_id, order_index),
  unique (course_id, title)
);
create index if not exists idx_modules_course_id on public.modules(course_id);

-- Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null check (type in ('DOCUMENT','EXTERNAL_LINK','VIDEO','ASSIGNMENT_REF','QUIZ_REF')),
  content_url text,
  storage_path text,
  assignment_id uuid, -- FK nanti ke assignments (nullable untuk P3 stub)
  quiz_id uuid, -- FK nanti ke quizzes
  is_published boolean not null default false,
  scheduled_at timestamptz,
  estimated_duration int check (estimated_duration is null or estimated_duration > 0),
  version int not null default 1,
  visibility text not null default 'ENROLLED' check (visibility in ('PUBLIC','ENROLLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index if not exists idx_materials_course_id on public.materials(course_id);
create index if not exists idx_materials_module_id on public.materials(module_id);
create index if not exists idx_materials_is_published on public.materials(is_published) where is_published = true and deleted_at is null;
create index if not exists idx_materials_scheduled_at on public.materials(scheduled_at) where scheduled_at is not null;
create index if not exists idx_materials_type on public.materials(type);

-- Material files (untuk DOCUMENT type multiple files)
create table if not exists public.material_files (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size int check (file_size is null or file_size > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_material_files_material_id on public.material_files(material_id);

-- Material links (EXTERNAL_LINK multiple)
create table if not exists public.material_links (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  url text not null check (url ~ '^https?://'),
  label text,
  created_at timestamptz not null default now()
);

-- Material prerequisites DAG (multi-parent) §12
create table if not exists public.material_prerequisites (
  material_id uuid not null references public.materials(id) on delete cascade,
  prerequisite_id uuid not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (material_id, prerequisite_id),
  check (material_id <> prerequisite_id)
);
create index if not exists idx_mat_prereq_material_id on public.material_prerequisites(material_id);
create index if not exists idx_mat_prereq_prereq_id on public.material_prerequisites(prerequisite_id);

-- Tags
create table if not exists public.material_tags (
  material_id uuid not null references public.materials(id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9-]+$'),
  primary key (material_id, tag)
);

-- Progress §13
create table if not exists public.material_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, material_id)
);
create index if not exists idx_mat_progress_user_id on public.material_progress(user_id);
create index if not exists idx_mat_progress_material_id on public.material_progress(material_id);

create table if not exists public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  action text not null check (action in ('VIEW','COMPLETE','BOOKMARK','UNBOOKMARK')),
  created_at timestamptz not null default now()
);
create index if not exists idx_learning_activities_user_id on public.learning_activities(user_id);
create index if not exists idx_learning_activities_material_id on public.learning_activities(material_id);

create table if not exists public.material_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create table if not exists public.course_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  material_completion numeric not null check (material_completion >= 0 and material_completion <= 100),
  assignment_completion numeric not null default 0 check (assignment_completion >= 0 and assignment_completion <= 100),
  quiz_completion numeric not null default 0 check (quiz_completion >= 0 and quiz_completion <= 100),
  total numeric not null check (total >= 0 and total <= 100),
  weights jsonb not null default '{"material":40,"assignment":30,"quiz":30}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_course_progress_user_course on public.course_progress_snapshots(user_id, course_id);

-- Roadmaps §12 (optional, bisa tunda tapi buat stub)
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  node_type text not null check (node_type in ('COURSE','MODULE','MATERIAL','ASSIGNMENT','QUIZ')),
  ref_id uuid not null,
  order_index int not null,
  completion_rule jsonb,
  created_at timestamptz not null default now(),
  unique (roadmap_id, order_index)
);

-- Updated_at triggers
drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at before update on public.courses for each row execute function public.handle_updated_at();
drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at before update on public.modules for each row execute function public.handle_updated_at();
drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at before update on public.materials for each row execute function public.handle_updated_at();
drop trigger if exists trg_mat_progress_updated_at on public.material_progress;
create trigger trg_mat_progress_updated_at before update on public.material_progress for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.materials enable row level security;
alter table public.material_files enable row level security;
alter table public.material_links enable row level security;
alter table public.material_prerequisites enable row level security;
alter table public.material_tags enable row level security;
alter table public.material_progress enable row level security;
alter table public.learning_activities enable row level security;
alter table public.material_bookmarks enable row level security;
alter table public.course_progress_snapshots enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_nodes enable row level security;

-- Policies: published visible to authenticated, unpublished only for privileged
drop policy if exists "authenticated can view published courses" on public.courses;
create policy "authenticated can view published courses" on public.courses for select to authenticated using (
  (is_published = true and deleted_at is null and (scheduled_at is null or scheduled_at <= now()))
  or public.has_permission(auth.uid(), 'course.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "anon can view published courses" on public.courses;
create policy "anon can view published courses" on public.courses for select to anon using (is_published = true and deleted_at is null and (scheduled_at is null or scheduled_at <= now()));
drop policy if exists "privileged can manage courses" on public.courses;
create policy "privileged can manage courses" on public.courses for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_permission(auth.uid(), 'course.create')
) with check (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_permission(auth.uid(), 'course.create'));
drop policy if exists "service_role can manage courses" on public.courses;
create policy "service_role can manage courses" on public.courses for all to service_role using (true);

drop policy if exists "authenticated can view published modules" on public.modules;
create policy "authenticated can view published modules" on public.modules for select to authenticated using (
  is_published = true and deleted_at is null or public.has_permission(auth.uid(), 'material.view')
);
drop policy if exists "service_role can manage modules" on public.modules;
create policy "service_role can manage modules" on public.modules for all to service_role using (true);

drop policy if exists "authenticated can view published materials" on public.materials;
create policy "authenticated can view published materials" on public.materials for select to authenticated using (
  (is_published = true and deleted_at is null and (scheduled_at is null or scheduled_at <= now()))
  or public.has_permission(auth.uid(), 'material.view')
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "service_role can manage materials" on public.materials;
create policy "service_role can manage materials" on public.materials for all to service_role using (true);

-- progress: own only
drop policy if exists "users can manage own progress" on public.material_progress;
create policy "users can manage own progress" on public.material_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users can manage own bookmarks" on public.material_bookmarks;
create policy "users can manage own bookmarks" on public.material_bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users can view own activities" on public.learning_activities;
create policy "users can view own activities" on public.learning_activities for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users can insert own activities" on public.learning_activities;
create policy "users can insert own activities" on public.learning_activities for insert to authenticated with check (auth.uid() = user_id);

-- Seed P3 sample: Web Development → Frontend Development
do $$
declare
  web_div_id uuid;
  course_id uuid;
  mod_html uuid; mod_css uuid; mod_js uuid; mod_react uuid; mod_next uuid;
  mat_html uuid; mat_css uuid; mat_js uuid; mat_react uuid; mat_next uuid;
begin
  select id into web_div_id from public.divisions where slug = 'web' limit 1;
  if web_div_id is null then return; end if;

  insert into public.courses (division_id, slug, name, description, is_published, estimated_duration)
  values (web_div_id, 'frontend-development', 'Frontend Development', 'HTML, CSS, JS, React, Next.js — P3 Full Spec seed', true, 600)
  on conflict (division_id, slug) do nothing
  returning id into course_id;

  if course_id is null then
    select id into course_id from public.courses where division_id = web_div_id and slug = 'frontend-development' limit 1;
  end if;

  -- Modules
  insert into public.modules (course_id, title, order_index, is_published) values
    (course_id, 'HTML', 1, true),
    (course_id, 'CSS', 2, true),
    (course_id, 'JavaScript', 3, true),
    (course_id, 'React', 4, true),
    (course_id, 'Next.js', 5, true)
  on conflict (course_id, title) do nothing;

  select id into mod_html from public.modules where course_id = course_id and title = 'HTML' limit 1;
  select id into mod_css from public.modules where course_id = course_id and title = 'CSS' limit 1;
  select id into mod_js from public.modules where course_id = course_id and title = 'JavaScript' limit 1;
  select id into mod_react from public.modules where course_id = course_id and title = 'React' limit 1;
  select id into mod_next from public.modules where course_id = course_id and title = 'Next.js' limit 1;

  -- Materials (DOCUMENT + EXTERNAL_LINK mix)
  insert into public.materials (module_id, course_id, title, type, content_url, is_published, estimated_duration, visibility) values
    (mod_html, course_id, 'HTML Dasar — Dokumentasi', 'DOCUMENT', null, true, 60, 'ENROLLED'),
    (mod_css, course_id, 'CSS Fundamentals — Video', 'VIDEO', 'https://youtube.com/watch?v=css101', true, 45, 'ENROLLED'),
    (mod_js, course_id, 'JavaScript ES6 — External Link', 'EXTERNAL_LINK', 'https://javascript.info', true, 90, 'ENROLLED'),
    (mod_react, course_id, 'React Intro — Dokumentasi', 'DOCUMENT', null, true, 90, 'ENROLLED'),
    (mod_next, course_id, 'Next.js App Router — Video + Assignment Ref', 'VIDEO', 'https://nextjs.org/docs', true, 120, 'ENROLLED')
  on conflict do nothing;

  -- DAG: CSS requires HTML, JS requires CSS, React requires JS, Next requires React + HTML (multi-parent demo)
  select id into mat_html from public.materials where module_id = mod_html limit 1;
  select id into mat_css from public.materials where module_id = mod_css limit 1;
  select id into mat_js from public.materials where module_id = mod_js limit 1;
  select id into mat_react from public.materials where module_id = mod_react limit 1;
  select id into mat_next from public.materials where module_id = mod_next limit 1;

  if mat_css is not null and mat_html is not null then
    insert into public.material_prerequisites (material_id, prerequisite_id) values (mat_css, mat_html) on conflict do nothing;
  end if;
  if mat_js is not null and mat_css is not null then
    insert into public.material_prerequisites (material_id, prerequisite_id) values (mat_js, mat_css) on conflict do nothing;
  end if;
  if mat_react is not null and mat_js is not null then
    insert into public.material_prerequisites (material_id, prerequisite_id) values (mat_react, mat_js) on conflict do nothing;
  end if;
  if mat_next is not null and mat_react is not null and mat_html is not null then
    insert into public.material_prerequisites (material_id, prerequisite_id) values (mat_next, mat_react) on conflict do nothing;
    insert into public.material_prerequisites (material_id, prerequisite_id) values (mat_next, mat_html) on conflict do nothing;
  end if;

  -- Tags sample
  if mat_html is not null then
    insert into public.material_tags (material_id, tag) values (mat_html, 'html'), (mat_html, 'frontend') on conflict do nothing;
  end if;
end $$;
