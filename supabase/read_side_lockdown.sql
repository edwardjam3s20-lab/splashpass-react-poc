-- Closes the read-side IDOR flagged in the previous migration
-- (profile_account_security.sql) as a known remaining gap. Run this AFTER
-- deploying the frontend/splashmain code changes that stop reading these
-- tables directly, not before — otherwise you'll break the app for a
-- window between "grants revoked" and "new code deployed".
--
-- profiles: after routing getUserByEmail through
-- app/api/customer/profile/route.js (a session-checked splashmain
-- endpoint), there is no longer ANY legitimate direct client read of this
-- table left in the codebase (confirmed: `grep -rn "from('profiles')" src/`
-- returns nothing once that change is deployed). Revoke SELECT entirely —
-- previously anyone with the anon key could read any profile by
-- guessing/knowing an email.
revoke select on profiles from anon, authenticated;

-- bookings: unlike profiles, getBookingsByDate (used for live queue counts
-- and full-slot detection) genuinely needs to stay world-readable before
-- login — but it never needed the FULL row. Previously
-- `select('*').eq('date', date)` handed every visitor every other
-- customer's name, phone, car plate, and pricing for that date. Column-
-- level grants (a real Postgres feature, not just an RLS policy) let this
-- stay world-readable for exactly the columns the queue feature needs, and
-- nothing else.
--
-- If you add a new field to the queue/full-slot UI later, add it to this
-- GRANT first — selecting an ungranted column errors, it doesn't silently
-- return null.
revoke select on bookings from anon, authenticated;
grant select (id, date, time, location, status) on bookings to anon, authenticated;

-- Getting your own full booking (getBookingById/getBookingsByEmail/
-- getBookingPaymentStatus) now goes through
-- app/api/customer/bookings/route.js in splashmain, which uses the
-- service-role key server-side and isn't affected by these anon/
-- authenticated grants at all.
