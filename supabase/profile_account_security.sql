-- Closes the write-side IDOR on `profiles` and `bookings`.
--
-- THE PROBLEM: this app has no Supabase Auth session (see the comment in
-- booking_lifecycle.sql — "the customer app has no Supabase Auth session
-- at all"), so there is no auth.uid() for a normal RLS policy to check.
-- Meanwhile auth.ts calls supabase.from('profiles').update(...) and
-- .delete(...) directly from the browser with the public anon key, using
-- whatever `email` the client passes in, and the .update() accepted ANY
-- column in the payload. With just the anon key (visible in the bundle
-- to anyone), nothing stopped a request like:
--
--   fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.someone-else@x.com`, {
--     method: 'PATCH', headers: { apikey: ANON_KEY, ... },
--     body: JSON.stringify({ sub_status: 'active', wallet_balance: 99999 })
--   })
--
-- THE FIX: revoke anon's direct UPDATE/DELETE grant on both tables, and
-- replace the two operations with SECURITY DEFINER RPCs that are the only
-- door left. Two different RPCs because the two operations have very
-- different risk profiles and existing UX:
--
--   * update_profile_secure — no password check. OnboardingScreen.tsx and
--     ProfileSetupScreen.tsx call this right after signup with no
--     password on hand and no UI for one; requiring one here would break
--     that flow rather than just tighten it. Instead this is a hard
--     column whitelist: the jsonb payload can only ever touch name/phone/
--     sub_plan/sub_plan_name/sub_car_limit, and sub_status can only be
--     set to 'trial' (the one self-service value the onboarding flow
--     needs) — never 'active' (must come from the M-Pesa callback/payment
--     webhook) or 'pending' (must come from operator approval). This is
--     what actually matters: it turns "attacker can set wallet_balance/
--     loyalty_points/role/sub_status to anything" into "attacker can, at
--     worst, rename someone or relabel their plan" — annoying, not a
--     money or access-control bypass.
--
--   * delete_account_secure — DOES require the password, re-verified via
--     verify_password_only (see assumption flag below), because deleting
--     an account is destructive and irreversible and currently has zero
--     authentication at all — literally any POST with a stranger's email
--     deletes their account today. This one small addition (collecting
--     the password on the delete-account screen) is a fully justified UX
--     change for an action this dangerous.
--
-- REMAINING GAP, FLAGGED RATHER THAN HIDDEN: neither RPC can verify the
-- caller actually *owns* the email they're passing in for the
-- non-destructive update case, because there's still no session tied to
-- that email at the Postgres layer. Fully closing that requires moving
-- profile reads/writes behind splashmain's authenticated session check,
-- the same way booking creation already was — that's outside this repo.
-- Reads (SELECT on profiles/bookings) are left untouched here for the
-- same reason: getUserByEmail/getBookingsByEmail can still be read by
-- anyone who knows/guesses an email. Don't treat this migration as
-- closing that read-side issue.
--
-- ASSUMPTION FLAGGED: this assumes verify_password_only(p_email, p_password)
-- already exists in this database (auth.ts already calls it) and returns
-- true/false after checking the password against whatever hashing scheme
-- profiles.password actually uses. That function isn't tracked in this
-- repo's migrations, so confirm its real signature/behavior in the
-- Supabase dashboard before running this — if the name or argument order
-- differs, update the call below to match.

create or replace function update_profile_secure(
  p_email text,
  p_updates jsonb
)
returns setof profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set
    name          = coalesce(p_updates->>'name', name),
    phone         = coalesce(p_updates->>'phone', phone),
    sub_plan      = coalesce(p_updates->>'sub_plan', sub_plan),
    sub_plan_name = coalesce(p_updates->>'sub_plan_name', sub_plan_name),
    sub_car_limit = coalesce((p_updates->>'sub_car_limit')::integer, sub_car_limit),
    -- Only 'trial' may be self-assigned. Any other requested value
    -- (including 'active'/'pending') is silently ignored rather than
    -- erroring, so existing call sites that don't touch sub_status at
    -- all keep working exactly as before.
    sub_status    = case
                      when p_updates->>'sub_status' = 'trial' then 'trial'
                      else sub_status
                    end
  where email = p_email;

  return query select * from profiles where email = p_email;
end;
$$;

create or replace function delete_account_secure(
  p_email text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(verify_password_only(p_email, p_password), false) then
    raise exception 'Invalid credentials' using errcode = '28000';
  end if;

  update bookings
  set user_email = 'deleted@splashpass.site', user_name = 'Deleted User'
  where user_email = p_email;

  delete from profiles where email = p_email;
end;
$$;

revoke all on function update_profile_secure(text, jsonb) from public;
revoke all on function delete_account_secure(text, text) from public;
grant execute on function update_profile_secure(text, jsonb) to anon, authenticated;
grant execute on function delete_account_secure(text, text) to anon, authenticated;

-- Remove the direct door these RPCs replace.
revoke update, delete on profiles from anon, authenticated;
revoke update, delete, insert on bookings from anon, authenticated;
