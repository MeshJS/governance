create table public.cardano_projects (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  name text not null,
  description text null,
  url text not null,
  icon_url text null,
  category text null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  owner_wallets text[] null,
  owner_nft_fingerprints text[] null,
  constraint cardano_projects_pkey primary key (id),
  constraint cardano_projects_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists cardano_projects_is_active_idx on public.cardano_projects using btree (is_active) TABLESPACE pg_default;

create index IF not exists cardano_projects_config_gin on public.cardano_projects using gin (config) TABLESPACE pg_default;

create index IF not exists idx_cardano_projects_owner_wallets on public.cardano_projects using gin (owner_wallets) TABLESPACE pg_default;

create index IF not exists idx_cardano_projects_owner_nft_fingerprints on public.cardano_projects using gin (owner_nft_fingerprints) TABLESPACE pg_default;