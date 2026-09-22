-- Migration 007 — Attendance (AGENTS.md §16-17, P6)
-- Methods QR_CODE/MANUAL, QR model ID_CARD + SESSION + TIME + GEOFENCE, statuses 5, Haversine server

-- Attendance sessions
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  division_id uuid references public.divisions(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  title text not null default 'Attendance Session',
  started_at timestamptz not null,
  ended_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  radius_meters int check (radius_meters is null or (radius_meters >= 10 and radius_meters <= 5000)),
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED','CANCELLED')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ended_at > started_at),
  check ((latitude is null and longitude is null and radius_meters is null) or (latitude is not null and longitude is not null and radius_meters is not null)),
  check (latitude is null or (latitude >= -90 and latitude <= 90)),
  check (longitude is null or (longitude >= -180 and longitude <= 180))
);
create index if not exists idx_attendance_sessions_division_id on public.attendance_sessions(division_id);
create index if not exists idx_attendance_sessions_class_id on public.attendance_sessions(class_id);
create index if not exists idx_attendance_sessions_started_at on public.attendance_sessions(started_at);
create index if not exists idx_attendance_sessions_status on public.attendance_sessions(status);
create index if not exists idx_attendance_sessions_qr_token on public.attendance_sessions(qr_token);

-- Attendance records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('PRESENT','LATE','PERMITTED','SICK','ABSENT')),
  checked_in_at timestamptz,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  is_geofence_valid boolean,
  qr_token_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create index if not exists idx_attendance_records_session_id on public.attendance_records(session_id);
create index if not exists idx_attendance_records_user_id on public.attendance_records(user_id);
create index if not exists idx_attendance_records_status on public.attendance_records(status);

-- Attendance corrections (audit, §30, Critical Business Rules §16)
create table if not exists public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.attendance_records(id) on delete cascade,
  old_status text,
  new_status text not null,
  reason text not null,
  corrected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_attendance_corrections_record_id on public.attendance_corrections(record_id);

-- Audit log for attendance corrections (reuse audit_logs if exists, but ensure table)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- Helpers
create or replace function public.generate_qr_token()
returns text
language sql
as $$
  select encode(gen_random_bytes(16), 'hex');
$$;

-- Trigger to auto-generate qr_token if not provided
create or replace function public.handle_qr_token()
returns trigger as $$
begin
  if new.qr_token is null or new.qr_token = '' then
    new.qr_token := public.generate_qr_token();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_attendance_sessions_qr on public.attendance_sessions;
create trigger trg_attendance_sessions_qr
  before insert on public.attendance_sessions
  for each row execute function public.handle_qr_token();

drop trigger if exists trg_attendance_records_updated_at on public.attendance_records;
create trigger trg_attendance_records_updated_at
  before update on public.attendance_records
  for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.audit_logs enable row level security;

-- Sessions policies
drop policy if exists "authenticated can view attendance_sessions" on public.attendance_sessions;
create policy "authenticated can view attendance_sessions" on public.attendance_sessions for select
  to authenticated using (true);

drop policy if exists "privileged can manage attendance_sessions" on public.attendance_sessions;
create policy "privileged can manage attendance_sessions" on public.attendance_sessions for all
  to authenticated using (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_role(auth.uid(), 'SECRETARY')
    or public.has_permission(auth.uid(), 'attendance.create')
    or public.has_permission(auth.uid(), 'attendance.correct')
  ) with check (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_role(auth.uid(), 'SECRETARY')
    or public.has_permission(auth.uid(), 'attendance.create')
  );
drop policy if exists "service_role can manage attendance_sessions" on public.attendance_sessions;
create policy "service_role can manage attendance_sessions" on public.attendance_sessions for all to service_role using (true);

-- Records policies
drop policy if exists "users can view own attendance_records" on public.attendance_records;
create policy "users can view own attendance_records" on public.attendance_records for select
  to authenticated using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_permission(auth.uid(), 'attendance.view')
    or public.has_role(auth.uid(), 'SECRETARY')
  );

drop policy if exists "users can insert own attendance_records" on public.attendance_records;
create policy "users can insert own attendance_records" on public.attendance_records for insert
  to authenticated with check (
    auth.uid() = user_id
    or public.has_permission(auth.uid(), 'attendance.create')
  );

drop policy if exists "privileged can update attendance_records" on public.attendance_records;
create policy "privileged can update attendance_records" on public.attendance_records for update
  to authenticated using (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_permission(auth.uid(), 'attendance.correct')
    or auth.uid() = user_id
  );

drop policy if exists "service_role can manage attendance_records" on public.attendance_records;
create policy "service_role can manage attendance_records" on public.attendance_records for all to service_role using (true);

-- Corrections: privileged view
drop policy if exists "privileged can view corrections" on public.attendance_corrections;
create policy "privileged can view corrections" on public.attendance_corrections for select
  to authenticated using (
    public.has_role(auth.uid(), 'SUPER_ADMIN')
    or public.has_role(auth.uid(), 'SECRETARY')
    or public.has_permission(auth.uid(), 'attendance.correct')
  );
drop policy if exists "service_role can manage corrections" on public.attendance_corrections;
create policy "service_role can manage corrections" on public.attendance_corrections for all to service_role using (true);

-- Seed P6: One open session for Web Kelas A (today)
do $$
declare
  web_div_id uuid;
  web_class_id uuid;
  admin_id uuid;
  sess_id uuid;
begin
  select id into web_div_id from public.divisions where slug = 'web' limit 1;
  select id into web_class_id from public.classes where slug = 'web-a-2025-ganjil' limit 1;
  -- fallback to any class if not found
  if web_class_id is null then
    select id into web_class_id from public.classes limit 1;
  end if;

  -- Find super_admin or any profile
  select id into admin_id from public.profiles limit 1;

  if web_div_id is not null then
    insert into public.attendance_sessions (division_id, class_id, title, started_at, ended_at, latitude, longitude, radius_meters, status, created_by)
    values (
      web_div_id, web_class_id, 'P6 Seed — Web Kelas A Today',
      date_trunc('day', now()) + interval '08:00', date_trunc('day', now()) + interval '17:00',
      -6.200000, 106.816666, 200, -- Jakarta, 200m
      'OPEN', admin_id
    )
    on conflict do nothing;
  end if;
end $$;
