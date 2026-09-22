-- Migration 002 — Organization (AGENTS.md §25, §32, P2 Divisions)
-- Fokus: divisions + user_divisions + helpers + RLS scoped DIVISION

-- Organizations (optional, for GLOBAL scope)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Divisions (3 divisi §1)
create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index if not exists idx_divisions_slug on public.divisions(slug);
create index if not exists idx_divisions_is_active on public.divisions(is_active) where is_active = true and deleted_at is null;

-- User Divisions (membership per divisi)
create table if not exists public.user_divisions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  division_id uuid not null references public.divisions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, division_id)
);
create index if not exists idx_user_divisions_user_id on public.user_divisions(user_id);
create index if not exists idx_user_divisions_division_id on public.user_divisions(division_id);

-- Academic periods (minimal stub untuk FK, full di P2b)
create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

-- Classes (minimal, scoped DIVISION/CLASS)
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete restrict,
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (division_id, slug)
);
create index if not exists idx_classes_division_id on public.classes(division_id);

-- Class members
create table if not exists public.class_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, class_id)
);
create index if not exists idx_class_members_user_id on public.class_members(user_id);
create index if not exists idx_class_members_class_id on public.class_members(class_id);

-- Helpers scoped (AGENTS.md §35)
create or replace function public.is_division_member(uid uuid, div_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_divisions ud
    where ud.user_id = uid and ud.division_id = div_id
  );
$$;

create or replace function public.is_class_member(uid uuid, cid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_members cm
    where cm.user_id = uid and cm.class_id = cid
  );
$$;

-- Updated_at triggers
drop trigger if exists trg_divisions_updated_at on public.divisions;
create trigger trg_divisions_updated_at before update on public.divisions
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at before update on public.classes
  for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.divisions enable row level security;
alter table public.user_divisions enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.organizations enable row level security;
alter table public.academic_periods enable row level security;

-- Divisions policies
-- SELECT: authenticated can view active (R untuk MEMBER §9)
drop policy if exists "authenticated can view divisions" on public.divisions;
create policy "authenticated can view divisions" on public.divisions for select
  to authenticated using (is_active = true and deleted_at is null);

-- For anon/public? juga allow select active divisions (untuk landing sitemap)
drop policy if exists "anon can view active divisions" on public.divisions;
create policy "anon can view active divisions" on public.divisions for select
  to anon using (is_active = true and deleted_at is null);

-- INSERT/UPDATE/DELETE: SUPER_ADMIN or coordinator own division or LEADER
drop policy if exists "privileged can manage divisions" on public.divisions;
create policy "privileged can manage divisions" on public.divisions for all
  to authenticated using (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_role(auth.uid(), 'LEADER')
    or public.has_role(auth.uid(), 'CO_LEADER')
    or public.has_permission(auth.uid(), 'division.create')
    or public.has_permission(auth.uid(), 'division.update')
  )
  with check (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_role(auth.uid(), 'LEADER')
    or public.has_role(auth.uid(), 'CO_LEADER')
    or public.has_permission(auth.uid(), 'division.create')
  );

-- Coordinator scoped: alternative policy via is_division_member + coordinator role
-- Untuk MVP, coordinator CRUD own division di-enforce di application layer can() + check is_division_member di Server Action,
-- RLS di atas sudah cukup permissive untuk authenticated dengan permission, detail scope di app layer.

drop policy if exists "service_role can manage divisions" on public.divisions;
create policy "service_role can manage divisions" on public.divisions for all
  to service_role using (true);

-- user_divisions policies
drop policy if exists "users can view own division membership" on public.user_divisions;
create policy "users can view own division membership" on public.user_divisions for select
  to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'SUPER_ADMIN'));

drop policy if exists "privileged can manage user_divisions" on public.user_divisions;
create policy "privileged can manage user_divisions" on public.user_divisions for all
  to authenticated using (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER'))
  with check (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER'));

drop policy if exists "service_role can manage user_divisions" on public.user_divisions;
create policy "service_role can manage user_divisions" on public.user_divisions for all
  to service_role using (true);

-- classes policies (minimal: authenticated can view, coordinator can manage own division)
drop policy if exists "authenticated can view classes" on public.classes;
create policy "authenticated can view classes" on public.classes for select
  to authenticated using (is_active = true and deleted_at is null);

drop policy if exists "service_role can manage classes" on public.classes;
create policy "service_role can manage classes" on public.classes for all to service_role using (true);

-- Seed divisions (3 divisi §1) — idempotent
insert into public.divisions (name, slug, description) values
  ('UI/UX Design', 'uiux', 'Division UI/UX Design — Figma, Design System, Prototyping'),
  ('Web Development', 'web', 'Division Web Development — Frontend, Backend, Fullstack'),
  ('Machine Learning', 'ml', 'Division Machine Learning — Python, Model, Deployment')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  deleted_at = null;

-- Seed default organization (optional)
insert into public.organizations (name, slug, description) values
  ('Study Club', 'study-club', 'Study Club Organization')
on conflict (slug) do nothing;

-- Update divisions to link to organization (best effort)
do $$
declare
  org_id uuid;
begin
  select id into org_id from public.organizations where slug = 'study-club' limit 1;
  if org_id is not null then
    update public.divisions set organization_id = org_id where organization_id is null;
  end if;
end $$;
