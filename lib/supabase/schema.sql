-- Craft It Yourself — Supabase schema
-- Run once in the Supabase SQL editor after creating the project.
-- All tables live in the default `public` schema.

-- ══════════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════════
-- PROFILES
-- One row per auth.users.id. Created automatically via trigger below.
-- ══════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  display_name    text,
  stripe_customer text unique,
  plan_id         text not null default 'free',
  plan_started_at timestamptz default now(),
  analytics_opt_out boolean default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_stripe_customer_idx on public.profiles(stripe_customer);

-- ══════════════════════════════════════════════════════════
-- CREDITS
-- Per-tier balance for the current billing period.
-- ══════════════════════════════════════════════════════════
create table if not exists public.credits (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  normal     integer not null default 1,   -- -1 = unlimited
  medium     integer not null default 0,
  advanced   integer not null default 0,
  normal_used   integer not null default 0,
  medium_used   integer not null default 0,
  advanced_used integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- PASSES (one-time packs — never expire)
-- ══════════════════════════════════════════════════════════
create table if not exists public.passes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  pass_id    text not null,
  normal_rem   integer not null default 0,
  medium_rem   integer not null default 0,
  advanced_rem integer not null default 0,
  purchased_at timestamptz not null default now()
);

create index if not exists passes_user_idx on public.passes(user_id);

-- ══════════════════════════════════════════════════════════
-- GENERATIONS (audit log — not the file blobs)
-- ══════════════════════════════════════════════════════════
create table if not exists public.generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  feature    text not null,                -- 'create' | 'debug' | 'update'
  tier       text not null,                -- 'normal' | 'medium' | 'advanced'
  plugin_name text,
  provider   text,
  model      text,
  tokens_in  integer,
  tokens_out integer,
  cost_usd   numeric(10,6),
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx on public.generations(user_id, created_at desc);

-- ══════════════════════════════════════════════════════════
-- STRIPE IDEMPOTENCY — prevents double-claiming a payment
-- ══════════════════════════════════════════════════════════
create table if not exists public.stripe_claims (
  stripe_session_id text primary key,
  user_id           uuid references public.profiles(id) on delete set null,
  kind              text not null,   -- 'plan' | 'pass'
  plan_id           text,
  pass_id           text,
  amount_total      integer,
  claimed_at        timestamptz not null default now()
);

create table if not exists public.stripe_events (
  stripe_event_id text primary key,
  type            text not null,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz
);

-- ══════════════════════════════════════════════════════════
-- AUDIT LOG — every sensitive mutation
-- ══════════════════════════════════════════════════════════
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  action     text not null,   -- 'signup' | 'login' | 'plan_upgrade' | 'password_reset' | 'delete_account' | ...
  resource   text,
  old_value  jsonb,
  new_value  jsonb,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_created_idx on public.audit_logs(user_id, created_at desc);
create index if not exists audit_logs_action_created_idx on public.audit_logs(action, created_at desc);

-- ══════════════════════════════════════════════════════════
-- REVOKED TOKENS — logout-everywhere support
-- Rows auto-expire via a scheduled job (or pg_cron) after 30 days.
-- ══════════════════════════════════════════════════════════
create table if not exists public.revoked_tokens (
  jti         text primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  revoked_at  timestamptz not null default now(),
  reason      text
);

-- ══════════════════════════════════════════════════════════
-- LOGIN ATTEMPTS — brute-force tracking (complements Supabase Auth's own throttle)
-- ══════════════════════════════════════════════════════════
create table if not exists public.login_attempts (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  ip         text,
  success    boolean not null,
  at         timestamptz not null default now()
);

create index if not exists login_attempts_ip_at_idx on public.login_attempts(ip, at desc);
create index if not exists login_attempts_email_at_idx on public.login_attempts(email, at desc);

-- ══════════════════════════════════════════════════════════
-- REFERRALS
-- ══════════════════════════════════════════════════════════
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid references public.profiles(id) on delete set null,
  status        text not null default 'pending',  -- pending | credited | rejected
  credited_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists referrals_owner_idx on public.referrals(owner_id);

-- ══════════════════════════════════════════════════════════
-- SUBSCRIPTIONS (Stripe mirror)
-- ══════════════════════════════════════════════════════════
create table if not exists public.subscriptions (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  stripe_sub_id   text unique not null,
  plan_id         text not null,
  status          text not null,           -- active | trialing | past_due | canceled | unpaid
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at      timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- CONTACT MESSAGES
-- ══════════════════════════════════════════════════════════
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text not null,
  topic      text not null,
  message    text not null,
  ip         text,
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- PUBLISHED PLUGINS (for explore page)
-- ══════════════════════════════════════════════════════════
create table if not exists public.published_plugins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete set null,
  name              text not null,
  slug              text unique not null,
  description       text,
  tier              text,
  prompt            text,
  tags              text[] default '{}',
  downloads         integer not null default 0,
  forks             integer not null default 0,
  is_public         boolean not null default true,
  moderation_status text not null default 'pending', -- pending | approved | flagged | removed
  moderation_notes  text,
  moderated_at      timestamptz,
  moderated_by      uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists published_plugins_public_idx on public.published_plugins(is_public, moderation_status, created_at desc);

-- ══════════════════════════════════════════════════════════
-- ABUSE REPORTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.abuse_reports (
  id           uuid primary key default gen_random_uuid(),
  plugin_id    uuid references public.published_plugins(id) on delete cascade,
  reporter_id  uuid references public.profiles(id) on delete set null,
  reason       text not null,
  details      text,
  status       text not null default 'open',  -- open | resolved | dismissed
  created_at   timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- COUNTERS — homepage stats (plugins crafted, downloads)
-- Write via service role only; read anonymously.
-- ══════════════════════════════════════════════════════════
create table if not exists public.counters (
  id    text primary key,
  value bigint not null default 0
);

insert into public.counters (id, value) values
  ('plugins_crafted', 0),
  ('downloads',       0)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ROW ON SIGNUP
-- ══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.credits (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- Users can read their own profile/credits/passes/generations.
-- Service role bypasses RLS (used by webhooks + server routes).
-- ══════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.credits           enable row level security;
alter table public.passes            enable row level security;
alter table public.generations       enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.published_plugins enable row level security;
alter table public.stripe_claims     enable row level security;
alter table public.stripe_events     enable row level security;
alter table public.audit_logs        enable row level security;
alter table public.revoked_tokens    enable row level security;
alter table public.login_attempts    enable row level security;
alter table public.referrals         enable row level security;
alter table public.abuse_reports     enable row level security;
alter table public.counters          enable row level security;

create policy "own profile read"   on public.profiles      for select using (auth.uid() = id);
create policy "own profile update" on public.profiles      for update using (auth.uid() = id);
create policy "own credits read"   on public.credits       for select using (auth.uid() = user_id);
create policy "own passes read"    on public.passes        for select using (auth.uid() = user_id);
create policy "own generations"    on public.generations   for select using (auth.uid() = user_id);
create policy "own subscription"   on public.subscriptions for select using (auth.uid() = user_id);
create policy "own audit read"     on public.audit_logs    for select using (auth.uid() = user_id);
create policy "own referrals"      on public.referrals     for select using (auth.uid() = owner_id);

-- Only approved and public plugins are visible to other users; owners see their own regardless of moderation.
create policy "public plugins read" on public.published_plugins
  for select using ((is_public = true and moderation_status = 'approved') or auth.uid() = user_id);
create policy "own plugin insert"   on public.published_plugins
  for insert with check (auth.uid() = user_id);
create policy "own plugin update"   on public.published_plugins
  for update using (auth.uid() = user_id);
create policy "own plugin delete"   on public.published_plugins
  for delete using (auth.uid() = user_id);

-- Authenticated users can file abuse reports
create policy "authed can report" on public.abuse_reports
  for insert with check (auth.uid() is not null);

-- Counters are readable by everyone, writable only by service role
create policy "counters public read" on public.counters for select using (true);

-- contact_messages: closed to anon writes. Contact form POSTs through /api/contact
-- using the service role, which bypasses RLS. This prevents DB-level spam.
-- (No insert policy here on purpose.)

-- stripe_claims / stripe_events / revoked_tokens / login_attempts have NO policies,
-- which means service role only. Clients never touch these.
