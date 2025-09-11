create table public.wallet_users (
  address text not null,
  wallet_name text not null,
  network_id integer null,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  nonce text null,
  nonce_expires_at timestamp with time zone null,
  verified_at timestamp with time zone null,
  stake_address text null,
  constraint wallet_users_pkey primary key (address)
) TABLESPACE pg_default;

create index IF not exists wallet_users_stake_address_idx on public.wallet_users using btree (stake_address) TABLESPACE pg_default;