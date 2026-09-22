-- Migration 001 — Identity / RBAC (AGENTS.md §32, §33, §34, §35)
-- NOTE: jalankan via `npx supabase db reset` untuk test lokal, lalu `npx supabase db push`

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_is_active on public.profiles(is_active) where is_active = true;

-- Roles
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Permissions (resource.action per §7)
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- User Roles (multi-role, §5)
create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  scope text not null default 'OWN' check (scope in ('GLOBAL','ORGANIZATION','DIVISION','CLASS','COURSE','OWN')),
  division_id uuid,
  class_id uuid,
  course_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role_id on public.user_roles(role_id);

-- Role Permissions
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Seed roles (10 roles §5)
insert into public.roles (name, description) values
  ('SUPER_ADMIN', 'Full platform/system administration'),
  ('LEADER', 'Organization leadership'),
  ('CO_LEADER', 'Assists Leader'),
  ('SECRETARY', 'Administration, documentation, attendance, calendar'),
  ('TREASURER', 'Finance and financial reports'),
  ('WEB_COORDINATOR', 'Web Development division management'),
  ('ML_COORDINATOR', 'Machine Learning division management'),
  ('UIUX_COORDINATOR', 'UI/UX division management'),
  ('MENTOR', 'Teaching, materials, assignments, quizzes, grading'),
  ('MEMBER', 'Learning and normal participation')
on conflict (name) do nothing;

-- Seed permissions (subset §7, stabil)
insert into public.permissions (name) values
  ('user.view'), ('user.create'), ('user.update'), ('user.delete'),
  ('role.view'), ('role.create'), ('role.update'), ('role.delete'),
  ('permission.view'),
  ('course.view'), ('course.create'), ('course.update'), ('course.delete'),
  ('material.view'), ('material.create'), ('material.update'), ('material.delete'),
  ('assignment.view'), ('assignment.create'), ('assignment.update'), ('assignment.delete'), ('assignment.grade'),
  ('quiz.view'), ('quiz.create'), ('quiz.update'), ('quiz.delete'), ('quiz.grade'),
  ('attendance.view'), ('attendance.create'), ('attendance.correct'),
  ('grade.view'), ('grade.create'), ('grade.update'),
  ('notification.view'), ('notification.manage'),
  ('division.view'), ('division.create'), ('division.update'), ('division.delete'),
  ('class.view'), ('class.create'), ('class.update'), ('class.delete')
on conflict (name) do nothing;

-- Helper functions for RLS (AGENTS.md §35) — stable
create or replace function public.has_role(uid uuid, role_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = uid and r.name = role_name
  );
$$;

create or replace function public.has_permission(uid uuid, perm_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = uid and p.name = perm_name
  ) or public.has_role(uid, 'SUPER_ADMIN');
$$;

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- RLS enable (AGENTS.md §35)
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

-- Profiles policies
drop policy if exists "authenticated can view profiles" on public.profiles;
create policy "authenticated can view profiles" on public.profiles for select
  to authenticated using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update
  to authenticated using (auth.uid() = id);

drop policy if exists "service_role can manage profiles" on public.profiles;
create policy "service_role can manage profiles" on public.profiles for all
  to service_role using (true);

-- Roles/permissions: authenticated can view, admin can manage
drop policy if exists "authenticated can view roles" on public.roles;
create policy "authenticated can view roles" on public.roles for select to authenticated using (true);
drop policy if exists "authenticated can view permissions" on public.permissions;
create policy "authenticated can view permissions" on public.permissions for select to authenticated using (true);

-- user_roles: user can view own, admin can manage
drop policy if exists "users can view own roles" on public.user_roles;
create policy "users can view own roles" on public.user_roles for select
  to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Trigger: auto-create profile on signup + assign MEMBER
create or replace function public.handle_new_user()
returns trigger as $$
declare
  member_role_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  select id into member_role_id from public.roles where name = 'MEMBER' limit 1;
  if member_role_id is not null then
    insert into public.user_roles (user_id, role_id, scope)
    values (new.id, member_role_id, 'OWN')
    on conflict (user_id, role_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
