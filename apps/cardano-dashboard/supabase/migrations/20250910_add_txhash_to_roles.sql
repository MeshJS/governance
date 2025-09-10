-- Add txhash to cardano_project_roles for tracking the minting transaction

begin;

alter table if exists public.cardano_project_roles
    add column if not exists txhash text;

-- Helpful index for lookups by txhash
create index if not exists idx_cpr_txhash on public.cardano_project_roles(txhash);

commit;


