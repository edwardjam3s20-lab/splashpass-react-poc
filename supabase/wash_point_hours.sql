-- Per-wash-point operating hours.
-- Run in the Supabase SQL editor.
--
-- Replaces the customer app's previous hardcoded 7AM-5PM SLOTS constant
-- (src/lib/bookingCost.ts) — that was wrong for any wash point with
-- different hours, and is being replaced with real per-point data here.

alter table wash_points add column if not exists opens_at time not null default '07:00';
alter table wash_points add column if not exists closes_at time not null default '21:00';

-- Sanity constraint: closes_at must be after opens_at. (Wash points that
-- operate past midnight aren't supported by this simple same-day model —
-- flagging that as a known limitation rather than silently mishandling it
-- if it ever comes up.)
alter table wash_points drop constraint if exists wash_points_hours_check;
alter table wash_points add constraint wash_points_hours_check
  check (closes_at > opens_at);
