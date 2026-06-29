-- Booking lifecycle migration
-- Adds support for the pending -> accepted/rejected -> confirmed flow.
-- Run this in the Supabase SQL editor against the `bookings` table.
--
-- Confirmed against this project: `status` is a plain text column with no
-- CHECK constraint and no enum type restricting it (verified via
-- information_schema.columns and pg_constraint — both came back empty).
-- That means nothing needs widening before the new status values
-- ('pending', 'accepted', 'rejected') can be written — section 1 from the
-- original draft of this file is gone; there was nothing to alter.

-- 1. New columns: accept/reject timestamps + reason, and the customer's
-- phone number captured at booking time (needed so the accept/reject SMS
-- in bookings/[id]/route.js has somewhere to send to — the bookings table
-- previously had no phone column at all).
alter table bookings add column if not exists accepted_at timestamptz;
alter table bookings add column if not exists rejected_at timestamptz;
alter table bookings add column if not exists rejection_reason text;
alter table bookings add column if not exists user_phone text;

-- 2. Existing rows are untouched — they're already 'confirmed' or beyond,
-- which remains a valid value (status was never restricted). No backfill
-- needed.

-- 3. NOTE on cancellation security: there is deliberately no RLS policy
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

-- 4. Enable Realtime on bookings so both the customer app (watching one
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
