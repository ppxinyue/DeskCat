create or replace function public.get_dashboard_daily_metrics(
  p_start_date date,
  p_end_date date
)
returns table (
  metric_date date,
  dau bigint,
  event_count bigint,
  feature_use_count bigint,
  total_duration_ms bigint
)
language sql
stable
as $$
  with per_device as (
    select
      (te.client_created_at at time zone 'utc')::date as metric_date,
      te.device_id,
      coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version') as app_version,
      count(*)::bigint as event_count,
      coalesce(sum(te.count), 0)::bigint as feature_use_count,
      least(
        coalesce(sum(te.duration_ms) filter (where te.event_name <> 'timeline.entry'), 0)::bigint,
        86400000::bigint
      ) as duration_ms
    from public.telemetry_events te
    left join public.devices d on d.device_id = te.device_id
    where te.client_created_at >= p_start_date::timestamptz
      and te.client_created_at < p_end_date::timestamptz
    group by 1, 2, 3
  )
  select
    per_device.metric_date,
    count(*)::bigint as dau,
    coalesce(sum(per_device.event_count), 0)::bigint as event_count,
    coalesce(sum(per_device.feature_use_count), 0)::bigint as feature_use_count,
    coalesce(sum(per_device.duration_ms), 0)::bigint as total_duration_ms
  from per_device
  group by per_device.metric_date
  order by per_device.metric_date asc;
$$;

create or replace function public.get_dashboard_device_usage_metrics(
  p_start_date date,
  p_end_date date
)
returns table (
  metric_date date,
  device_id text,
  app_version text,
  event_count bigint,
  use_count bigint,
  duration_ms bigint,
  first_event_at timestamptz,
  last_event_at timestamptz,
  raw_duration_ms bigint
)
language sql
stable
as $$
  select
    (te.client_created_at at time zone 'utc')::date as metric_date,
    te.device_id,
    coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version') as app_version,
    count(*)::bigint as event_count,
    coalesce(sum(te.count), 0)::bigint as use_count,
    least(
      coalesce(sum(te.duration_ms) filter (where te.event_name <> 'timeline.entry'), 0)::bigint,
      86400000::bigint
    ) as duration_ms,
    min(te.client_created_at) as first_event_at,
    max(te.client_created_at) as last_event_at,
    coalesce(sum(te.duration_ms), 0)::bigint as raw_duration_ms
  from public.telemetry_events te
  left join public.devices d on d.device_id = te.device_id
  where te.client_created_at >= p_start_date::timestamptz
    and te.client_created_at < p_end_date::timestamptz
  group by 1, 2, 3
  order by metric_date desc, duration_ms desc;
$$;

create or replace function public.get_dashboard_device_feature_metrics(
  p_start_date date,
  p_end_date date
)
returns table (
  metric_date date,
  device_id text,
  app_version text,
  feature text,
  event_name text,
  event_count bigint,
  use_count bigint,
  duration_ms bigint,
  raw_duration_ms bigint
)
language sql
stable
as $$
  select
    (te.client_created_at at time zone 'utc')::date as metric_date,
    te.device_id,
    coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version') as app_version,
    te.feature,
    te.event_name,
    count(*)::bigint as event_count,
    coalesce(sum(te.count), 0)::bigint as use_count,
    least(
      coalesce(sum(te.duration_ms) filter (where te.event_name <> 'timeline.entry'), 0)::bigint,
      86400000::bigint
    ) as duration_ms,
    coalesce(sum(te.duration_ms), 0)::bigint as raw_duration_ms
  from public.telemetry_events te
  left join public.devices d on d.device_id = te.device_id
  where te.client_created_at >= p_start_date::timestamptz
    and te.client_created_at < p_end_date::timestamptz
  group by 1, 2, 3, 4, 5
  order by metric_date desc, duration_ms desc;
$$;
