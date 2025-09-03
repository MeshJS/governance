-- Create roles table for per-project access via wallet addresses and NFT policy IDs
-- And add owner_nft_policy_id to projects for owner access via NFT policies

begin;

-- 1) Add owner arrays to projects (keep legacy owner_address for now)
alter table if exists public.cardano_projects
    add column if not exists owner_wallets text[];
alter table if exists public.cardano_projects
    add column if not exists owner_nft_policy_ids text[];

-- Basic index for lookups by policy id
create index if not exists idx_cardano_projects_owner_nft_policy_ids
    on public.cardano_projects using gin (owner_nft_policy_ids);
create index if not exists idx_cardano_projects_owner_wallets
    on public.cardano_projects using gin (owner_wallets);

-- 2) Create roles table
create table if not exists public.cardano_project_roles (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.cardano_projects(id) on delete cascade,
    role text not null check (role in ('admin','editor')),
    principal_type text not null check (principal_type in ('wallet','nft_policy')),

    -- For principal_type = 'wallet'
    wallet_payment_address text,
    stake_address text,

    -- For principal_type = 'nft_policy'
    policy_id text,

    added_by_address text not null,
    created_at timestamptz not null default now(),

    -- Ensure only one of wallet or policy is set
    constraint chk_wallet_or_policy
        check ((principal_type = 'wallet' and wallet_payment_address is not null and policy_id is null)
            or (principal_type = 'nft_policy' and policy_id is not null and wallet_payment_address is null))
);

-- Helpful indexes
create index if not exists idx_cpr_project on public.cardano_project_roles(project_id);
create index if not exists idx_cpr_role on public.cardano_project_roles(role);
create index if not exists idx_cpr_principal_type on public.cardano_project_roles(principal_type);
create index if not exists idx_cpr_wallet_payment_address on public.cardano_project_roles(wallet_payment_address) where principal_type = 'wallet';
create index if not exists idx_cpr_stake_address on public.cardano_project_roles(stake_address) where principal_type = 'wallet';
create index if not exists idx_cpr_policy_id on public.cardano_project_roles(policy_id) where principal_type = 'nft_policy';

-- Prevent duplicates (partial unique indexes)
create unique index if not exists ux_cpr_project_role_wallet
    on public.cardano_project_roles(project_id, role, wallet_payment_address)
    where principal_type = 'wallet';

create unique index if not exists ux_cpr_project_role_policy
    on public.cardano_project_roles(project_id, role, policy_id)
    where principal_type = 'nft_policy';

-- 3) Best-effort migration from legacy editors to roles (if table exists)
do $$
begin
    if exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'cardano_project_editors'
    ) then
        insert into public.cardano_project_roles (project_id, role, principal_type, wallet_payment_address, stake_address, added_by_address)
        select e.project_id, 'editor' as role, 'wallet' as principal_type, e.editor_address as wallet_payment_address, e.stake_address, coalesce(e.added_by_address, e.editor_address)
        from public.cardano_project_editors e
        on conflict do nothing;
    end if;
end $$;

commit;


