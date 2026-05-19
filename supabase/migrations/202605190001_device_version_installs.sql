create table if not exists public.device_version_installs (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices(device_id) on delete cascade,
  app_version text not null,
  platform text null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (device_id, app_version)
);

create index if not exists device_version_installs_last_seen_at_idx
  on public.device_version_installs (last_seen_at desc);

create index if not exists device_version_installs_app_version_idx
  on public.device_version_installs (app_version, last_seen_at desc);

insert into public.device_version_installs (
  device_id,
  app_version,
  platform,
  first_seen_at,
  last_seen_at,
  metadata
)
select
  device_id,
  app_version,
  platform,
  first_seen_at,
  last_seen_at,
  jsonb_build_object('source', 'migration-backfill')
from public.devices
where app_version is not null and btrim(app_version) <> ''
on conflict (device_id, app_version) do nothing;

alter table public.device_version_installs enable row level security;
