-- Customer booking reminders: push subscriptions + reminder tracking.
-- Run in the Supabase SQL editor.
--
-- Keyed on user_email (text), not a foreign key to profiles.id — this
-- project's bookings.id turned out to be bigint, not uuid, when I'd
-- assumed uuid earlier (see wallet.sql/pending_transactions.sql fixes).
-- email is the identity key actually used everywhere else in this app
-- (getBookingsByEmail, session payloads, etc.), so matching that pattern
-- here avoids repeating the same unverified-type mistake.

create table if not exists customer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_push_subscriptions_user_email_idx
  on customer_push_subscriptions (user_email);

-- Reminder tracking — prevents the same booking being reminded twice if
-- a cron run overlaps the next one, or the external 5-min scheduler fires
-- slightly early/late and catches the same booking in two windows.
alter table bookings add column if not exists day_before_reminder_sent boolean not null default false;
alter table bookings add column if not exists imminent_reminder_sent boolean not null default false;

-- RLS: enabled with no policies, same reasoning as push_subscriptions.sql
-- (operator table) — this is exclusively read/written by backend routes
-- using the Supabase admin client, which bypasses RLS regardless. Enabling
-- it with zero policies means the anon key embedded in the customer app's
-- own bundle has zero access to this table, which is the correct default.
alter table customer_push_subscriptions enable row level security;
