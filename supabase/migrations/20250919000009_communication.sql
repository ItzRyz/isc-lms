-- Migration 009 — Communication (AGENTS.md §23-24, §46-48, P8)
-- Announcements, Forum, Material Comments, Messages, Notifications + Realtime + Email selective

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) >= 3 and char_length(title) <= 150),
  content text not null,
  division_id uuid references public.divisions(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_announcements_division_id on public.announcements(division_id);
create index if not exists idx_announcements_created_at on public.announcements(created_at desc);
create index if not exists idx_announcements_is_pinned on public.announcements(is_pinned) where is_pinned = true;

-- Forum categories
create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  division_id uuid references public.divisions(id) on delete set null,
  created_at timestamptz not null default now()
);
insert into public.forum_categories (name, slug, description) values
  ('General', 'general', 'General discussion'),
  ('Q&A', 'qa', 'Mentor/Member Q&A'),
  ('Web Development', 'web-dev', 'Web division forum'),
  ('Machine Learning', 'ml', 'ML division forum'),
  ('UI/UX', 'uiux', 'UI/UX division forum')
on conflict (slug) do nothing;

-- Forum threads
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  title text not null check (char_length(title) >= 3 and char_length(title) <= 150),
  content text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_forum_threads_category_id on public.forum_threads(category_id);
create index if not exists idx_forum_threads_created_by on public.forum_threads(created_by);

-- Forum posts (replies)
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  content text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_forum_posts_thread_id on public.forum_posts(thread_id);

-- Material comments (Q&A per material)
create table if not exists public.material_comments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  content text not null,
  parent_id uuid references public.material_comments(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_material_comments_material_id on public.material_comments(material_id);
create index if not exists idx_material_comments_parent_id on public.material_comments(parent_id);

-- Conversations (private messaging)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists idx_conversation_members_user_id on public.conversation_members(user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 5000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Notifications (IN_APP, REALTIME, EMAIL) §24
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('ASSIGNMENT_CREATED','ASSIGNMENT_DEADLINE_SOON','ASSIGNMENT_GRADED','ASSIGNMENT_REVISION_REQUIRED','QUIZ_AVAILABLE','QUIZ_DEADLINE_SOON','QUIZ_GRADED','ATTENDANCE_OPENED','ATTENDANCE_RECORDED','ATTENDANCE_CORRECTED','GRADE_PUBLISHED','ANNOUNCEMENT_CREATED','EVENT_CREATED','EVENT_REMINDER','CERTIFICATE_ISSUED','ACHIEVEMENT_UNLOCKED')),
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  channel text not null default 'IN_APP' check (channel in ('IN_APP','REALTIME','EMAIL')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_recipient_id on public.notifications(recipient_id);
create index if not exists idx_notifications_read_at on public.notifications(read_at) where read_at is null;
create index if not exists idx_notifications_type on public.notifications(type);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- Notification preferences per user per event type
create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('ASSIGNMENT_CREATED','ASSIGNMENT_DEADLINE_SOON','ASSIGNMENT_GRADED','ASSIGNMENT_REVISION_REQUIRED','QUIZ_AVAILABLE','QUIZ_DEADLINE_SOON','QUIZ_GRADED','ATTENDANCE_OPENED','ATTENDANCE_RECORDED','ATTENDANCE_CORRECTED','GRADE_PUBLISHED','ANNOUNCEMENT_CREATED','EVENT_CREATED','EVENT_REMINDER','CERTIFICATE_ISSUED','ACHIEVEMENT_UNLOCKED')),
  in_app boolean not null default true,
  realtime boolean not null default true,
  email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_type)
);
create index if not exists idx_notification_prefs_user_id on public.notification_preferences(user_id);

-- Triggers updated_at
drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at before update on public.announcements for each row execute function public.handle_updated_at();
drop trigger if exists trg_forum_threads_updated_at on public.forum_threads;
create trigger trg_forum_threads_updated_at before update on public.forum_threads for each row execute function public.handle_updated_at();
drop trigger if exists trg_forum_posts_updated_at on public.forum_posts;
create trigger trg_forum_posts_updated_at before update on public.forum_posts for each row execute function public.handle_updated_at();
drop trigger if exists trg_notification_prefs_updated_at on public.notification_preferences;
create trigger trg_notification_prefs_updated_at before update on public.notification_preferences for each row execute function public.handle_updated_at();

-- RLS enable
alter table public.announcements enable row level security;
alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.material_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Policies: announcements — LEADER/SECRETARY CRUD, coordinator scoped DIVISION, member R
drop policy if exists "authenticated can view announcements" on public.announcements;
create policy "authenticated can view announcements" on public.announcements for select to authenticated using (
  is_published = true and deleted_at is null
  and (division_id is null or public.is_division_member(auth.uid(), division_id) or public.has_role(auth.uid(), 'SUPER_ADMIN'))
);
drop policy if exists "privileged can manage announcements" on public.announcements;
create policy "privileged can manage announcements" on public.announcements for all to authenticated using (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_role(auth.uid(), 'LEADER')
  or public.has_role(auth.uid(), 'SECRETARY')
  or public.has_role(auth.uid(), 'CO_LEADER')
  or public.has_permission(auth.uid(), 'announcement.create')
) with check (
  public.has_role(auth.uid(), 'SUPER_ADMIN')
  or public.has_role(auth.uid(), 'LEADER')
  or public.has_role(auth.uid(), 'SECRETARY')
);
drop policy if exists "service_role can manage announcements" on public.announcements;
create policy "service_role can manage announcements" on public.announcements for all to service_role using (true);

-- forum_categories: authenticated view
drop policy if exists "authenticated can view forum_categories" on public.forum_categories;
create policy "authenticated can view forum_categories" on public.forum_categories for select to authenticated using (true);
drop policy if exists "service_role can manage forum_categories" on public.forum_categories;
create policy "service_role can manage forum_categories" on public.forum_categories for all to service_role using (true);

-- forum_threads: authenticated RW, MENTOR can moderate
drop policy if exists "authenticated can view threads" on public.forum_threads;
create policy "authenticated can view threads" on public.forum_threads for select to authenticated using (deleted_at is null);
drop policy if exists "authenticated can create threads" on public.forum_threads;
create policy "authenticated can create threads" on public.forum_threads for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "authors can update own threads" on public.forum_threads;
create policy "authors can update own threads" on public.forum_threads for update to authenticated using (auth.uid() = created_by or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "service_role can manage threads" on public.forum_threads;
create policy "service_role can manage threads" on public.forum_threads for all to service_role using (true);

-- forum_posts: similar
drop policy if exists "authenticated can view posts" on public.forum_posts;
create policy "authenticated can view posts" on public.forum_posts for select to authenticated using (deleted_at is null);
drop policy if exists "authenticated can create posts" on public.forum_posts;
create policy "authenticated can create posts" on public.forum_posts for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "service_role can manage posts" on public.forum_posts;
create policy "service_role can manage posts" on public.forum_posts for all to service_role using (true);

-- material_comments: enrolled can view/create (via course RLS)
drop policy if exists "authenticated can view material_comments" on public.material_comments;
create policy "authenticated can view material_comments" on public.material_comments for select to authenticated using (deleted_at is null);
drop policy if exists "authenticated can create material_comments" on public.material_comments;
create policy "authenticated can create material_comments" on public.material_comments for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "service_role can manage material_comments" on public.material_comments;
create policy "service_role can manage material_comments" on public.material_comments for all to service_role using (true);

-- conversations: members only
drop policy if exists "members can view own conversations" on public.conversations;
create policy "members can view own conversations" on public.conversations for select to authenticated using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid())
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "authenticated can create conversations" on public.conversations;
create policy "authenticated can create conversations" on public.conversations for insert to authenticated with check (true);
drop policy if exists "service_role can manage conversations" on public.conversations;
create policy "service_role can manage conversations" on public.conversations for all to service_role using (true);

drop policy if exists "members can view own conversation_members" on public.conversation_members;
create policy "members can view own conversation_members" on public.conversation_members for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "service_role can manage conversation_members" on public.conversation_members;
create policy "service_role can manage conversation_members" on public.conversation_members for all to service_role using (true);

-- messages: members of conversation
drop policy if exists "members can view messages" on public.messages;
create policy "members can view messages" on public.messages for select to authenticated using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid())
  or public.has_role(auth.uid(), 'SUPER_ADMIN')
);
drop policy if exists "members can create messages" on public.messages;
create policy "members can create messages" on public.messages for insert to authenticated with check (
  auth.uid() = sender_id
  and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid())
);
drop policy if exists "service_role can manage messages" on public.messages;
create policy "service_role can manage messages" on public.messages for all to service_role using (true);

-- notifications: recipient only + service_role
drop policy if exists "users can view own notifications" on public.notifications;
create policy "users can view own notifications" on public.notifications for select to authenticated using (recipient_id = auth.uid() or public.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications" on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
drop policy if exists "service_role can manage notifications" on public.notifications;
create policy "service_role can manage notifications" on public.notifications for all to service_role using (true);

drop policy if exists "users can manage own notification_prefs" on public.notification_preferences;
create policy "users can manage own notification_prefs" on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "service_role can manage notification_prefs" on public.notification_preferences;
create policy "service_role can manage notification_prefs" on public.notification_preferences for all to service_role using (true);

-- Seed announcements
insert into public.announcements (title, content, is_pinned, is_published) values
  ('Welcome to ISC LMS — P8 Communication', 'Forum, announcements, messages, notifications realtime + Resend selective per §47. In-app for high-freq, email untuk GRADE/CERTIFICATE/DEADLINE.', true, true),
  ('Web Dev Workshop — Next.js 16', 'Workshop Web Development division scheduled next week. Register via Events.', false, true)
on conflict do nothing;

-- Enable Realtime for key tables (supabase realtime publication)
do $$
begin
  -- Add tables to supabase_realtime publication if not already
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.forum_threads;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.announcements;
  exception when duplicate_object then null;
  end;
end $$;
