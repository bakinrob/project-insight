create extension if not exists pgcrypto;

create table if not exists public.dealer_migration_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('manual_urls', 'seed_discovery')),
  brand_key text not null,
  seed_url text,
  site_domain text,
  site_title text,
  status text not null default 'created',
  input_urls jsonb not null default '[]'::jsonb,
  approved_urls jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealer_migration_pages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.dealer_migration_runs(id) on delete cascade,
  url text not null,
  normalized_url text not null,
  source text,
  title text,
  h1 text,
  summary text,
  page_type text not null default 'unknown',
  confidence numeric(4,3) not null default 0,
  recommended boolean not null default false,
  recommendation_reason text,
  selected boolean not null default false,
  status text not null default 'discovered',
  error text,
  scraped_meta jsonb not null default '{}'::jsonb,
  structured_data jsonb,
  generated_code text,
  generated_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, normalized_url)
);

create index if not exists dealer_migration_pages_run_id_idx
  on public.dealer_migration_pages (run_id);

create index if not exists dealer_migration_pages_status_idx
  on public.dealer_migration_pages (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dealer_migration_runs_set_updated_at on public.dealer_migration_runs;
create trigger dealer_migration_runs_set_updated_at
before update on public.dealer_migration_runs
for each row
execute function public.set_updated_at();

drop trigger if exists dealer_migration_pages_set_updated_at on public.dealer_migration_pages;
create trigger dealer_migration_pages_set_updated_at
before update on public.dealer_migration_pages
for each row
execute function public.set_updated_at();
