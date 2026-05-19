drop view if exists public.daily_metrics;
drop view if exists public.daily_device_usage_metrics;
drop view if exists public.daily_device_feature_metrics;
drop view if exists public.daily_feature_user_metrics;

create or replace view public.daily_device_usage_metrics as
select
  (te.client_created_at at time zone 'utc')::date as metric_date,
  te.device_id,
  coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version') as app_version,
  count(*) as event_count,
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
group by 1, 2, 3;

create or replace view public.daily_metrics as
with event_metrics as (
  select
    (te.client_created_at at time zone 'utc')::date as metric_date,
    count(distinct te.device_id || ':' || coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version')) as dau,
    count(*) as event_count,
    coalesce(sum(te.count), 0)::bigint as feature_use_count
  from public.telemetry_events te
  left join public.devices d on d.device_id = te.device_id
  group by 1
),
usage_metrics as (
  select
    metric_date,
    coalesce(sum(duration_ms), 0)::bigint as total_duration_ms
  from public.daily_device_usage_metrics
  group by 1
)
select
  event_metrics.metric_date,
  event_metrics.dau,
  event_metrics.event_count,
  event_metrics.feature_use_count,
  coalesce(usage_metrics.total_duration_ms, 0)::bigint as total_duration_ms
from event_metrics
left join usage_metrics using (metric_date);

create or replace view public.daily_device_feature_metrics as
select
  (te.client_created_at at time zone 'utc')::date as metric_date,
  te.device_id,
  coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version') as app_version,
  te.feature,
  te.event_name,
  count(*) as event_count,
  coalesce(sum(te.count), 0)::bigint as use_count,
  least(
    coalesce(sum(te.duration_ms) filter (where te.event_name <> 'timeline.entry'), 0)::bigint,
    86400000::bigint
  ) as duration_ms,
  coalesce(sum(te.duration_ms), 0)::bigint as raw_duration_ms
from public.telemetry_events te
left join public.devices d on d.device_id = te.device_id
group by 1, 2, 3, 4, 5;

create or replace view public.daily_feature_user_metrics as
select
  (te.client_created_at at time zone 'utc')::date as metric_date,
  te.feature,
  count(distinct te.device_id || ':' || coalesce(te.metadata->>'appVersion', d.app_version, 'unknown-version')) as active_devices,
  count(*) as event_count,
  coalesce(sum(te.count), 0)::bigint as use_count,
  coalesce(sum(te.duration_ms), 0)::bigint as duration_ms
from public.telemetry_events te
left join public.devices d on d.device_id = te.device_id
group by 1, 2;
