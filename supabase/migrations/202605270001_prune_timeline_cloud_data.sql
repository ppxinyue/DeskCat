delete from public.telemetry_events
where feature = 'timeline'
  or event_name like 'timeline.%';

update public.cloud_backups
set snapshot = snapshot - 'timelineEntries' - 'telemetryEvents'
where snapshot ? 'timelineEntries'
   or snapshot ? 'telemetryEvents';
