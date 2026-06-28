-- Booking lifecycle migration
-- Adds support for the pending -> accepted/rejected -> confirmed flow.
-- Run this in the Supabase SQL editor against the `bookings` table.

-- 1. Widen whatever currently restricts `status` to include the new values.
--
-- IMPORTANT: run this query FIRST to find out which of the two mechanisms
-- below actually applies to your schema — guessing wrong and running both
-- blocks is harmless (the wrong one just no-ops or errors harmlessly), but
-- knowing which one applies avoids confusion:
--
--   select data_type, udt_name from information_schema.columns
--   where table_name = 'bookings' and column_name = 'status';
--
-- If udt_name is something like "bookings_status_enum" (not "varchar"/"text"),
-- you have an ENUM TYPE — use Option A. Otherwise you likely have a CHECK
-- CONSTRAINT — use Option B (this is the more common case for a
-- hand-rolled schema like this one, and is left uncommented below).

-- Option A — only if `status` is a real Postgres enum type:
-- alter type bookings_status_enum add value if not exists 'pending';
-- alter type bookings_status_enum add value if not exists 'accepted';
-- alter type bookings_status_enum add value if not exists 'rejected';

-- Option B — if `status` is backed by a CHECK constraint (the more likely
-- case here). Find the real constraint name first if this errors:
--   select conname from pg_constraint where conrelid = 'bookings'::regclass and contype = 'c';
-- then replace `bookings_status_check` below with the actual name.
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'));

-- 2. New columns: accept/reject timestamps + reason, and the customer's
-- phone number captured at booking time (needed so the accept/reject SMS
-- in bookings/[id]/route.js has somewhere to send to — the bookings table
-- previously had no phone column at all).
alter table bookings add column if not exists accepted_at timestamptz;
alter table bookings add column if not exists rejected_at timestamptz;
alter table bookings add column if not exists rejection_reason text;
alter table bookings add column if not exists user_phone text;

-- 3. Existing rows are untouched — they're already 'confirmed' or beyond,
-- which remains valid under the widened constraint above. No backfill needed.

-- 5. NOTE on cancellation security: there is deliberately no RLS policy
-- here for customer-initiated cancellation. The customer app has no
-- Supabase Auth session (it uses its own RPC-based login — see
-- src/lib/auth.ts's loginWithEmail/verify_password) and no server-issued
-- session token at all, so auth.email() and similar RLS helpers have
-- nothing to check against. Cancellation is instead handled via a new
-- backend endpoint (see api/booking-cancel route) that verifies
-- booking.user_email matches the email the request claims, then writes
-- with the Supabase admin client — the same trust model already used by
-- getBookingsByEmail() and everywhere else in this app. This isn't full
-- session security, but it matches the existing security posture rather
-- than inventing a new (weaker) one via an open client-side RLS policy.
-- booking) and the operator app (watching new pending rows for their wash
-- point) can subscribe to live changes. Guarded so it's safe to re-run --
-- ALTER PUBLICATION ... ADD TABLE errors if the table is already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table bookings;
  end if;
end $$;
