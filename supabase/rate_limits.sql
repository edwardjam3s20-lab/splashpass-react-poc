-- Rate limiting for the two public-facing, unauthenticated API routes
-- (api/mpesa-stk.js and api/send-sms.js). Run in the Supabase SQL editor.
--
-- WHY THIS EXISTS: those two routes have no session/auth check at all
-- (this app has no Supabase Auth session — see auth.ts), so anyone who
-- finds the endpoint can trigger unlimited M-Pesa STK pushes to any phone
-- number, or send unlimited SMS on this project's Africa's Talking bill.
-- An in-memory counter inside the Vercel function would NOT actually work
-- as a limiter here: serverless functions are stateless between cold
-- starts and run as multiple concurrent instances, so an in-memory count
-- resets constantly and isn't shared. This table + RPC gives a real,
-- atomic, cross-instance counter instead.

create table if not exists api_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  request_count integer not null default 0
);

create index if not exists api_rate_limits_window_start_idx
  on api_rate_limits (window_start);

-- Atomically increments the counter for a bucket (e.g. "stk:phone:2547...",
-- "stk:ip:1.2.3.4", "sms:phone:...", "sms:ip:..."), resetting it if the
-- window has expired, all in one statement so concurrent requests can't
-- race past the limit. Returns whether this request is still within the
-- limit, and the count after incrementing.
--
-- SECURITY DEFINER + a locked-down search_path so this can be called with
-- the anon key (no direct table grants needed, no injection risk from
-- the search_path itself) while still being the only way to touch the
-- table — anon has no direct INSERT/UPDATE grant on api_rate_limits.
create or replace function check_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into api_rate_limits (bucket_key, window_start, request_count)
  values (p_bucket_key, now(), 1)
  on conflict (bucket_key) do update
    set request_count = case
          when api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else api_rate_limits.request_count + 1
        end,
        window_start = case
          when api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else api_rate_limits.window_start
        end
  returning request_count into v_count;

  return query select (v_count <= p_max_requests), v_count;
end;
$$;

-- Only the service role (used server-side by the API routes) may call
-- this — anon has no need to and shouldn't be able to manipulate its own
-- rate-limit counters.
revoke all on function check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function check_rate_limit(text, integer, integer) to service_role;

revoke all on api_rate_limits from public, anon, authenticated;
