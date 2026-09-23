-- Migration 010 — P9 Organization Expansion (AGENTS.md §26-29, Phase 9)
-- Events, Competitions, Achievements, Certificates, Finance (TREASURER isolated RLS)

-- Events (WORKSHOP/SEMINAR/COMPETITION/MEETING/STUDY_SESSION/OTHER)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) >= 3 and char_length(title) <= 150),
  description text,
  type text not null default 'OTHER' check (type in ('WORKSHOP','SEMINAR','COMPETITION','MEETING','STUDY_SESSION','OTHER')),
  division_id uuid references public.divisions(id) on delete set null,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_participants int check (max_participants is null or max_participants > 0),
  requires_registration boolean not null default true,
  points_reward int not null default 0 check (points_reward >= 0),
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (end_at > start_at)
);
create index if not exists idx_events_division_id on public.events(division_id);
create index if not exists idx_events_start_at on public.events(start_at);
create index if not exists idx_events_type on public.events(type);

create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  attended boolean not null default false,
  attended_at timestamptz,
  primary key (event_id, user_id)
);
create index if not exists idx_event_participants_user_id on public.event_participants(user_id);

-- Competitions (if not using events type COMPETITION, keep separate for points/certificate)
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  description text,
  division_id uuid references public.divisions(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  max_participants int,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);
create table if not exists public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  result text check (result in ('WINNER','PARTICIPANT','DISQUALIFIED')),
  score int,
  registered_at timestamptz not null default now(),
  primary key (competition_id, user_id)
);

-- Achievements / Gamification (§27)
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[A-Z_]+$'),
  name text not null,
  description text,
  icon text,
  points_reward int not null default 0,
  created_at timestamptz not null default now()
);
insert into public.achievements (slug, name, description, points_reward) values
  ('FIRST_ASSIGNMENT', 'First Assignment', 'Complete first assignment', 10),
  ('TEN_ASSIGNMENTS', 'Ten Assignments', 'Complete 10 assignments', 50),
  ('PERFECT_ATTENDANCE', 'Perfect Attendance', '100% attendance in period', 30),
  ('QUIZ_MASTER', 'Quiz Master', 'Score 90+ on 5 quizzes', 50),
  ('ROADMAP_COMPLETED', 'Roadmap Completed', 'Complete all roadmap nodes', 100),
  ('COMPETITION_PARTICIPANT', 'Competition Participant', 'Join a competition', 20),
  ('COMPETITION_WINNER', 'Competition Winner', 'Win a competition', 100)
on conflict (slug) do nothing;

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  source_type text,
  source_id uuid,
  primary key (user_id, achievement_id)
);
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);

-- Achievement rules (event-driven, §27 diagram)
create table if not exists public.achievement_rules (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  event_type text not null, -- e.g., AssignmentSubmitted, QuizGraded
  condition_json jsonb not null default '{}'::jsonb, -- {count:10, score:90}
  created_at timestamptz not null default now()
);

-- Certificates (§28)
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  program_id uuid, -- course or event id
  event_id uuid references public.events(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  issued_at timestamptz not null default now(),
  issuer text not null default 'Study Club',
  verification_token text not null unique,
  pdf_path text,
  created_at timestamptz not null default now()
);
create index if not exists idx_certificates_user_id on public.certificates(user_id);
create index if not exists idx_certificates_verification_token on public.certificates(verification_token);
create index if not exists idx_certificates_certificate_number on public.certificates(certificate_number);

-- Finance (§29) — TREASURER isolated, strict RLS
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  balance numeric not null default 0 check (balance >= -1000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.financial_accounts (name, balance) values ('General', 0) on conflict (name) do nothing;

create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('INCOME','EXPENSE')),
  created_at timestamptz not null default now()
);
insert into public.financial_categories (name, type) values
  ('Member Contribution', 'INCOME'),
  ('Sponsorship', 'INCOME'),
  ('Event Expense', 'EXPENSE'),
  ('Operational', 'EXPENSE')
on conflict (name) do nothing;

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.financial_accounts(id) on delete restrict,
  category_id uuid references public.financial_categories(id) on delete set null,
  amount numeric not null check (amount <> 0),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_fin_transactions_account_id on public.financial_transactions(account_id);
create index if not exists idx_fin_transactions_created_at on public.financial_transactions(created_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED')),
  method text,
  transaction_id uuid references public.financial_transactions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_user_id on public.payments(user_id);

-- Triggers
drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at before update on public.events for each row execute function public.handle_updated_at();
drop trigger if exists trg_fin_accounts_updated_at on public.financial_accounts;
create trigger trg_fin_accounts_updated_at before update on public.financial_accounts for each row execute function public.handle_updated_at();

-- Function to generate certificate number & token
create or replace function public.generate_certificate_number()
returns text
language plpgsql
as $$
declare
  seq int;
begin
  select coalesce(max((regexp_match(certificate_number, 'ISC-(\d+)'))[1]::int), 0) + 1 into seq from public.certificates;
  return 'ISC-' || lpad(seq::text, 6, '0') || '-' || to_char(now(), 'YYYY');
end;
$$;

create or replace function public.generate_verification_token()
returns text
language sql
as $$
  select encode(gen_random_bytes(16), 'hex');
$$;

-- RLS enable
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_participants enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.achievement_rules enable row level security;
alter table public.certificates enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.financial_categories enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.payments enable row level security;

-- Policies: events — authenticated view published, privileged manage
drop policy if exists "authenticated can view events" on public.events;
create policy "authenticated can view events" on public.events for select to authenticated using (is_published = true and deleted_at is null);
drop policy if exists "privileged can manage events" on public.events;
create policy "privileged can manage events" on public.events for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_role(auth.uid(), 'LEADER')
  or public.has_role(auth.uid(), 'SECRETARY')
  or public.has_permission(auth.uid(), 'event.create')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_role(auth.uid(), 'LEADER')
  or public.has_role(auth.uid(), 'SECRETARY')
);
drop policy if exists "service_role can manage events" on public.events;
create policy "service_role can manage events" on public.events for all to service_role using (true);

drop policy if exists "users can view own event_participants" on public.event_participants;
create policy "users can view own event_participants" on public.event_participants for select to authenticated using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_role(auth.uid(), 'SECRETARY')
);
drop policy if exists "users can register for events" on public.event_participants;
create policy "users can register for events" on public.event_participants for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "service_role can manage event_participants" on public.event_participants;
create policy "service_role can manage event_participants" on public.event_participants for all to service_role using (true);

-- achievements: authenticated view, service_role manage
drop policy if exists "authenticated can view achievements" on public.achievements;
create policy "authenticated can view achievements" on public.achievements for select to authenticated using (true);
drop policy if exists "users can view own achievements" on public.user_achievements;
create policy "users can view own achievements" on public.user_achievements for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "service_role can manage user_achievements" on public.user_achievements;
create policy "service_role can manage user_achievements" on public.user_achievements for all to service_role using (true);
drop policy if exists "service_role can manage achievement_rules" on public.achievement_rules;
create policy "service_role can manage achievement_rules" on public.achievement_rules for all to service_role using (true);

-- certificates: user can view own, public can verify via token (anon), service_role manage
drop policy if exists "users can view own certificates" on public.certificates;
create policy "users can view own certificates" on public.certificates for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "anon can verify certificates" on public.certificates;
create policy "anon can verify certificates" on public.certificates for select to anon using (true);
drop policy if exists "service_role can manage certificates" on public.certificates;
create policy "service_role can manage certificates" on public.certificates for all to service_role using (true);

-- finance: strict — only TREASURER/SUPER_ADMIN
drop policy if exists "treasurer can view finance" on public.financial_accounts;
create policy "treasurer can view finance" on public.financial_accounts for select to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
);
drop policy if exists "treasurer can manage finance" on public.financial_accounts;
create policy "treasurer can manage finance" on public.financial_accounts for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
);
drop policy if exists "service_role can manage financial_accounts" on public.financial_accounts;
create policy "service_role can manage financial_accounts" on public.financial_accounts for all to service_role using (true);

drop policy if exists "treasurer can view fin_transactions" on public.financial_transactions;
create policy "treasurer can view fin_transactions" on public.financial_transactions for select to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
);
drop policy if exists "treasurer can manage fin_transactions" on public.financial_transactions;
create policy "treasurer can manage fin_transactions" on public.financial_transactions for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN') or public.has_role(auth.uid(), 'TREASURER')
);
drop policy if exists "service_role can manage fin_transactions" on public.financial_transactions;
create policy "service_role can manage fin_transactions" on public.financial_transactions for all to service_role using (true);

-- Seed events & competition
insert into public.events (title, description, type, start_at, end_at, location, max_participants, points_reward, is_published) values
  ('Workshop Next.js 16', 'Hands-on Next.js 16 + Supabase + Resend', 'WORKSHOP', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 'Lab Web', 30, 20, true),
  ('Seminar ML Basics', 'Intro Machine Learning untuk pemula', 'SEMINAR', now() + interval '14 days', now() + interval '14 days' + interval '2 hours', 'Auditorium', 50, 15, true),
  ('Study Session — HTML/CSS', 'Belajar bersama HTML/CSS', 'STUDY_SESSION', now() + interval '2 days', now() + interval '2 days' + interval '2 hours', 'Ruang Web', null, 5, true)
on conflict do nothing;

-- Certificate trigger: auto-generate number & token if not provided
create or replace function public.handle_certificate_defaults()
returns trigger as $$
begin
  if new.certificate_number is null or new.certificate_number = '' then
    new.certificate_number := public.generate_certificate_number();
  end if;
  if new.verification_token is null or new.verification_token = '' then
    new.verification_token := public.generate_verification_token();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_certificates_defaults on public.certificates;
create trigger trg_certificates_defaults
  before insert on public.certificates
  for each row execute function public.handle_certificate_defaults();
