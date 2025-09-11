create table public.cardano_project_roles (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  role text not null,
  principal_type text not null,
  wallet_payment_address text null,
  stake_address text null,
  added_by_address text not null,
  created_at timestamp with time zone not null default now(),
  fingerprint text null,
  txhash text null,
  constraint cardano_project_roles_pkey primary key (id),
  constraint cardano_project_roles_project_id_fkey foreign KEY (project_id) references cardano_projects (id) on delete CASCADE,
  constraint cardano_project_roles_role_check check (
    (role = any (array['admin'::text, 'editor'::text]))
  ),
  constraint chk_wallet_or_principal check (
    (
      (
        (principal_type = 'wallet'::text)
        and (wallet_payment_address is not null)
        and (fingerprint is null)
      )
      or (
        (principal_type = 'nft_fingerprint'::text)
        and (fingerprint is not null)
        and (wallet_payment_address is null)
      )
    )
  ),
  constraint cpr_principal_type_check check (
    (
      principal_type = any (array['wallet'::text, 'nft_fingerprint'::text])
    )
  ),
  constraint cpr_txhash_shape_check check (
    (
      (txhash is null)
      or (txhash ~ '^[0-9a-fA-F]{64}$'::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_cpr_project on public.cardano_project_roles using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_cpr_role on public.cardano_project_roles using btree (role) TABLESPACE pg_default;

create index IF not exists idx_cpr_principal_type on public.cardano_project_roles using btree (principal_type) TABLESPACE pg_default;

create index IF not exists idx_cpr_wallet_payment_address on public.cardano_project_roles using btree (wallet_payment_address) TABLESPACE pg_default
where
  (principal_type = 'wallet'::text);

create index IF not exists idx_cpr_stake_address on public.cardano_project_roles using btree (stake_address) TABLESPACE pg_default
where
  (principal_type = 'wallet'::text);

create unique INDEX IF not exists ux_cpr_project_role_wallet on public.cardano_project_roles using btree (project_id, role, wallet_payment_address) TABLESPACE pg_default
where
  (principal_type = 'wallet'::text);

create index IF not exists idx_cpr_fingerprint on public.cardano_project_roles using btree (fingerprint) TABLESPACE pg_default
where
  (principal_type = 'nft_fingerprint'::text);

create unique INDEX IF not exists ux_cpr_project_role_fingerprint on public.cardano_project_roles using btree (project_id, role, fingerprint) TABLESPACE pg_default
where
  (principal_type = 'nft_fingerprint'::text);

create index IF not exists idx_cpr_txhash on public.cardano_project_roles using btree (txhash) TABLESPACE pg_default;