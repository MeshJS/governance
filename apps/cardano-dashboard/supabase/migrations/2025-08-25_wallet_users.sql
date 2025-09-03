-- Wallet-based login bootstrap
-- Creates a minimal table to record wallet connections.

create table if not exists public.wallet_users (
  address text primary key,
  stake_address text,
  wallet_name text not null,
  network_id integer,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  nonce text,
  nonce_expires_at timestamptz,
  verified_at timestamptz
);

alter table public.wallet_users enable row level security;



create index if not exists wallet_users_stake_address_idx
  on public.wallet_users (stake_address);


