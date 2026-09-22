-- Migration 003_optional — Organization Batches & Positions (AGENTS.md §25, §32 P2 opsional)
-- Batches = angkatan / cohort (mis: 2023, 2024), Positions = jabatan organisasi

-- Batches
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  year int not null check (year >= 2000 and year <= 2100),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_batches_year on public.batches(year);
create index if not exists idx_batches_is_active on public.batches(is_active) where is_active = true and deleted_at is null;

-- Positions (jabatan)
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_positions_slug on public.positions(slug);

-- Optional: user_positions (jika member pegang jabatan)
create table if not exists public.user_positions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete set null,
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (user_id, position_id)
);
create index if not exists idx_user_positions_user_id on public.user_positions(user_id);
create index if not exists idx_user_positions_position_id on public.user_positions(position_id);

-- Updated_at triggers
drop trigger if exists trg_batches_updated_at on public.batches;
create trigger trg_batches_updated_at before update on public.batches
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_positions_updated_at on public.positions;
create trigger trg_positions_updated_at before update on public.positions
  for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.batches enable row level security;
alter table public.positions enable row level security;
alter table public.user_positions enable row level security;

-- Policies: authenticated can view active; privileged can manage
drop policy if exists "authenticated can view batches" on public.batches;
create policy "authenticated can view batches" on public.batches for select
  to authenticated using (is_active = true and deleted_at is null);
drop policy if exists "anon can view batches" on public.batches;
create policy "anon can view batches" on public.batches for select
  to anon using (is_active = true and deleted_at is null);
drop policy if exists "privileged can manage batches" on public.batches;
create policy "privileged can manage batches" on public.batches for all
  to authenticated using (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER') or public.has_role(auth.uid(), 'SECRETARY'))
  with check (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER') or public.has_role(auth.uid(), 'SECRETARY'));
drop policy if exists "service_role can manage batches" on public.batches;
create policy "service_role can manage batches" on public.batches for all to service_role using (true);

drop policy if exists "authenticated can view positions" on public.positions;
create policy "authenticated can view positions" on public.positions for select to authenticated using (is_active = true and deleted_at is null);
drop policy if exists "anon can view positions" on public.positions;
create policy "anon can view positions" on public.positions for select to anon using (is_active = true and deleted_at is null);
drop policy if exists "privileged can manage positions" on public.positions;
create policy "privileged can manage positions" on public.positions for all
  to authenticated using (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER') or public.has_role(auth.uid(), 'SECRETARY'))
  with check (public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'LEADER') or public.has_role(auth.uid(), 'SECRETARY'));
drop policy if exists "service_role can manage positions" on public.positions;
create policy "service_role can manage positions" on public.positions for all to service_role using (true);

-- user_positions: view own or privileged
drop policy if exists "users can view own positions" on public.user_positions;
create policy "users can view own positions" on public.user_positions for select
  to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "service_role can manage user_positions" on public.user_positions;
create policy "service_role can manage user_positions" on public.user_positions for all to service_role using (true);

-- Seed batches (3 angkatan)
insert into public.batches (name, slug, year, description) values
  ('Angkatan 2023', 'angkatan-2023', 2023, 'Cohort 2023'),
  ('Angkatan 2024', 'angkatan-2024', 2024, 'Cohort 2024'),
  ('Angkatan 2025', 'angkatan-2025', 2025, 'Cohort 2025')
on conflict (slug) do nothing;

-- Seed positions (jabatan inti §8 Role Responsibility Matrix)
insert into public.positions (name, slug, description) values
  ('Leader', 'leader', 'Organization leadership'),
  ('Co-Leader', 'co-leader', 'Assists Leader'),
  ('Secretary', 'secretary', 'Administration & documentation'),
  ('Treasurer', 'treasurer', 'Finance'),
  ('Web Coordinator', 'web-coordinator', 'Web Development division management'),
  ('ML Coordinator', 'ml-coordinator', 'Machine Learning division management'),
  ('UIUX Coordinator', 'uiux-coordinator', 'UI/UX division management'),
  ('Mentor', 'mentor', 'Teaching & grading'),
  ('Member', 'member', 'Learning participant')
on conflict (slug) do nothing;
on conflict (name) do nothing;
