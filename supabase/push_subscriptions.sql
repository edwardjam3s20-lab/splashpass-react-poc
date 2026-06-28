-- Push notification subscriptions for operators.
-- Run this in the Supabase SQL editor.
--
-- ASSUMPTION FLAGGED: this references operators(id) as a uuid primary key,
-- inferred from result.operator.id / result.operator.wash_point appearing
-- in the existing bookings/[id]/route.js — I have not actually seen the
-- operators table's schema. If its primary key is a different type (e.g.
-- a plain integer, or named differently), adjust the `operator_id`
-- column's type and the foreign key reference below before running this.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  endpoint text not null unique,
  -- PushSubscriptionJSON's keys object, stored as-is — web-push (the
  -- backend library that sends pushes) wants exactly this shape:
  -- { p256dh: string, auth: string }
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- One operator can have multiple subscriptions (e.g. phone + desktop
-- browser both enabled) — that's intentional, not a bug to dedupe away.
create index if not exists push_subscriptions_operator_id_idx
  on push_subscriptions (operator_id);
