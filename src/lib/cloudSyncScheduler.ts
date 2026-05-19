import { CLOUD_SYNC_PENDING_EVENT, CLOUD_SYNC_STORE_KEY, hasPendingCloudSync, syncCloudBackup } from '@/lib/db';

const STARTUP_SYNC_DELAY_MS = 12_000;
const PERIODIC_SYNC_INTERVAL_MS = 5 * 60_000;
const MIN_SYNC_GAP_MS = 30_000;
const CHANGE_SYNC_DEBOUNCE_MS = 2_500;

let started = false;
let startupTimer: number | null = null;
let periodicTimer: number | null = null;
let changeTimer: number | null = null;
let inFlight: Promise<void> | null = null;
let lastAttemptAt = 0;

async function runCloudSync(reason: string, force = false) {
  const now = Date.now();
  if (inFlight) return inFlight;
  if (!force && now - lastAttemptAt < MIN_SYNC_GAP_MS) return;

  inFlight = (async () => {
    try {
      if (!(await hasPendingCloudSync())) return;
      lastAttemptAt = Date.now();
      const result = await syncCloudBackup();
      if (!result.ok) {
        console.warn(`Cloud sync skipped (${reason}):`, result.lastSyncError);
      }
    } catch (error) {
      console.warn(`Cloud sync failed (${reason}):`, error);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function startCloudSyncScheduler() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const scheduleChangeSync = (reason: string) => {
    if (changeTimer !== null) window.clearTimeout(changeTimer);
    changeTimer = window.setTimeout(() => {
      changeTimer = null;
      void runCloudSync(reason, true);
    }, CHANGE_SYNC_DEBOUNCE_MS);
  };

  startupTimer = window.setTimeout(() => {
    void runCloudSync('startup', true);
  }, STARTUP_SYNC_DELAY_MS);

  periodicTimer = window.setInterval(() => {
    void runCloudSync('periodic');
  }, PERIODIC_SYNC_INTERVAL_MS);

  const handleOnline = () => {
    void runCloudSync('online', true);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') void runCloudSync('visibility-hidden', true);
  };
  const handleBeforeUnload = () => {
    void runCloudSync('beforeunload', true);
  };
  const handlePendingCloudSync = () => {
    scheduleChangeSync('local-change');
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CLOUD_SYNC_STORE_KEY) scheduleChangeSync('storage-change');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener(CLOUD_SYNC_PENDING_EVENT, handlePendingCloudSync);
  window.addEventListener('storage', handleStorage);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    if (startupTimer !== null) window.clearTimeout(startupTimer);
    if (periodicTimer !== null) window.clearInterval(periodicTimer);
    if (changeTimer !== null) window.clearTimeout(changeTimer);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener(CLOUD_SYNC_PENDING_EVENT, handlePendingCloudSync);
    window.removeEventListener('storage', handleStorage);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    startupTimer = null;
    periodicTimer = null;
    changeTimer = null;
    started = false;
  };
}

export function flushCloudSync(reason = 'manual') {
  return runCloudSync(reason, true);
}
