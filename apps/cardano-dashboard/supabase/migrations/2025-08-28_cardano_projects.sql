-- Create cardano_projects table to store project metadata used on the Cardano Projects page
-- Fields mirror typical config: slug, name, description, url, icon_url, category, flags and timestamps

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

create table if not exists public.cardano_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  url text not null,
  icon_url text,
  category text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cardano_projects_is_active_idx on public.cardano_projects (is_active);
create index if not exists cardano_projects_config_gin on public.cardano_projects using gin (config);


