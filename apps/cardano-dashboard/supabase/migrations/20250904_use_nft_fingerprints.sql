-- Switch NFT-based access from policy IDs to asset fingerprints
-- Adds owner_nft_fingerprints on projects and fingerprint-based roles support

begin;

-- 1) Projects: add owner_nft_fingerprints array + index (keep legacy owner_nft_policy_ids)
alter table if exists public.cardano_projects
    add column if not exists owner_nft_fingerprints text[];
create index if not exists idx_cardano_projects_owner_nft_fingerprints
    on public.cardano_projects using gin (owner_nft_fingerprints);

-- 2) Roles: add fingerprint column and allow principal_type 'nft_fingerprint'
alter table if exists public.cardano_project_roles
    add column if not exists fingerprint text;

-- Expand principal_type check to include 'nft_fingerprint'
do $$
begin
    -- Drop auto-generated or previously named check if it exists
    if exists (
        select 1 from pg_constraint
        where conrelid = 'public.cardano_project_roles'::regclass
          and contype = 'c'
          and conname in ('cardano_project_roles_principal_type_check', 'cpr_principal_type_check')
    ) then
        execute 'alter table public.cardano_project_roles drop constraint if exists cardano_project_roles_principal_type_check';
        execute 'alter table public.cardano_project_roles drop constraint if exists cpr_principal_type_check';
    end if;
    -- Recreate with the expanded set to preserve legacy values
    alter table public.cardano_project_roles
        add constraint cpr_principal_type_check
        check (principal_type in ('wallet','nft_policy','nft_fingerprint'));
end $$;

-- Replace wallet/policy consistency check with wallet/policy/fingerprint consistency
do $$
begin
    if exists (
        select 1 from pg_constraint
        where conrelid = 'public.cardano_project_roles'::regclass
          and contype = 'c'
          and conname = 'chk_wallet_or_policy'
    ) then
        alter table public.cardano_project_roles drop constraint chk_wallet_or_policy;
    end if;
    alter table public.cardano_project_roles
        add constraint chk_wallet_or_principal
        check (
            (principal_type = 'wallet' and wallet_payment_address is not null and policy_id is null and fingerprint is null)
            or (principal_type = 'nft_policy' and policy_id is not null and wallet_payment_address is null and fingerprint is null)
            or (principal_type = 'nft_fingerprint' and fingerprint is not null and wallet_payment_address is null and policy_id is null)
        );
end $$;

-- Helpful indexes for fingerprint-based lookups
create index if not exists idx_cpr_fingerprint on public.cardano_project_roles(fingerprint) where principal_type = 'nft_fingerprint';

-- Prevent duplicates for fingerprint-based roles
create unique index if not exists ux_cpr_project_role_fingerprint
    on public.cardano_project_roles(project_id, role, fingerprint)
    where principal_type = 'nft_fingerprint';

commit;


