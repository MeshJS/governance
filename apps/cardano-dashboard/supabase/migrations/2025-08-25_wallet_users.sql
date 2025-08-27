-- Wallet-based login bootstrap
-- Creates a minimal table to record wallet connections.

create table if not exists public.wallet_users (
  address text primary key,
  wallet_name text not null,
  network_id integer,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  nonce text,
  nonce_expires_at timestamptz,
  verified_at timestamptz
);

alter table public.wallet_users enable row level security;

-- NOTE: These permissive policies are for initial development only.
-- Replace with signature-verified RPC or OIDC-backed auth before production.
create policy "wallet_users_select_public"
  on public.wallet_users for select
  using (true);

create policy "wallet_users_insert_public"
  on public.wallet_users for insert
  with check (true);

create policy "wallet_users_update_public"
  on public.wallet_users for update
  using (true)
  with check (true);


