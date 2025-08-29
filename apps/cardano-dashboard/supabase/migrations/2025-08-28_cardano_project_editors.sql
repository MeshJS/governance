-- Editors/owners authorization for cardano_projects

-- Add owner_address to projects (nullable to avoid breaking existing rows)
alter table if exists public.cardano_projects
  add column if not exists owner_address text;

create index if not exists cardano_projects_owner_address_idx
  on public.cardano_projects (owner_address);

-- Table mapping additional editor wallets to projects
create table if not exists public.cardano_project_editors (
  project_id uuid not null references public.cardano_projects(id) on delete cascade,
  editor_address text not null,
  added_by_address text not null,
  created_at timestamptz not null default now(),
  constraint cardano_project_editors_pk primary key (project_id, editor_address)
);

create index if not exists cardano_project_editors_project_idx
  on public.cardano_project_editors (project_id);

create index if not exists cardano_project_editors_editor_idx
  on public.cardano_project_editors (editor_address);


