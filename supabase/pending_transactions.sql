-- Pending M-Pesa transaction tracking, so the callback can tell what an
-- STK push was actually for. Run in the Supabase SQL editor.
--
-- Today, mpesa-callback.js only ever does one thing (activate a
-- subscription by matching on phone number) regardless of why the STK
-- push was sent. That's fine as long as subscriptions are the only thing
-- using STK push — but wallet top-up now also needs it, and the callback
-- has no way to know "this particular push was a top-up, credit this
-- person's wallet" vs "this was a subscription payment, set sub_status".
--
-- This table is written right after the STK push call succeeds (we have
-- CheckoutRequestID at that point), and read back by the callback when
-- the result arrives, to route to the correct effect.

create table if not exists pending_transactions (
  checkout_request_id text primary key,
  purpose text not null check (purpose in ('subscription', 'booking_payment', 'wallet_topup')),
  user_email text not null,
  amount numeric(10,2) not null,
  booking_id bigint references bookings(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- Old pending rows that never got a callback (STK push abandoned, phone
-- off, etc.) are harmless clutter but worth being able to clean up.
create index if not exists pending_transactions_created_at_idx
  on pending_transactions (created_at);
