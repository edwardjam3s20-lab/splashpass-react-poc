-- Wallet feature migration.
-- Run in the Supabase SQL editor.

-- 1. Wallet balance lives directly on profiles (one row per customer,
-- same place loyalty_points already lives — no need for a separate
-- 1:1 table for a single number).
alter table profiles add column if not exists wallet_balance numeric(10,2) not null default 0;

-- 2. Transaction history — every top-up, spend, and points-conversion.
-- Kept as an append-only ledger (never updated/deleted) so the balance
-- can always be reconciled against its history if something looks wrong.
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('topup', 'booking_payment', 'points_conversion', 'refund')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  booking_id uuid references bookings(id) on delete set null,
  points_spent integer,
  mpesa_receipt text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_email_idx
  on wallet_transactions (user_email);

-- 3. Atomic balance increment. Used by both the M-Pesa top-up callback
-- and the points-conversion redemption path. A plain
-- `update profiles set wallet_balance = wallet_balance + x` from application
-- code is NOT safe against two requests landing concurrently (e.g. a
-- top-up callback and a booking payment in the same instant) — the read
-- and write aren't atomic from the client's perspective. This function
-- performs the increment as a single atomic statement inside Postgres,
-- removing that race entirely. Returns the new balance so the caller
-- doesn't need a second round-trip to read it back.
create or replace function increment_wallet_balance(p_email text, p_amount numeric)
returns numeric
language plpgsql
as $$
declare
  new_balance numeric;
begin
  update profiles
  set wallet_balance = wallet_balance + p_amount
  where email = p_email
  returning wallet_balance into new_balance;

  if new_balance is null then
    raise exception 'No profile found for email %', p_email;
  end if;

  return new_balance;
end;
$$;

-- 4. Atomic, guarded decrement for spending the wallet on a booking —
-- separate from the increment function above because a spend additionally
-- needs a sufficient-balance check inside the same atomic statement (an
-- application-level "check balance, then deduct" has a race window between
-- the two steps; this closes it). Raises if the balance is insufficient,
-- so the caller's error handling stays a single try/catch rather than two
-- separate checks that could disagree with each other under concurrency.
create or replace function decrement_wallet_balance(p_email text, p_amount numeric)
returns numeric
language plpgsql
as $$
declare
  new_balance numeric;
begin
  update profiles
  set wallet_balance = wallet_balance - p_amount
  where email = p_email and wallet_balance >= p_amount
  returning wallet_balance into new_balance;

  if new_balance is null then
    raise exception 'Insufficient wallet balance or profile not found for %', p_email;
  end if;

  return new_balance;
end;
$$;
