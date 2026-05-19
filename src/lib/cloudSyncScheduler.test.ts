import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOUD_SYNC_PENDING_EVENT, hasPendingCloudSync, recordTelemetryEvent, setSetting, syncCloudBackup } from './db.ts';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  clear() {
    this.store.clear();
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
});
Object.defineProperty(globalThis, 'navigator', {
  value: {
    userAgent: 'DeskCatTest/1.0',
    language: 'en-US',
    languages: ['en-US'],
    platform: 'TestOS',
    hardwareConcurrency: 4,
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: Object.assign(new EventTarget(), {
    screen: { width: 1440, height: 900 },
    devicePixelRatio: 1,
  }),
  configurable: true,
});

test('pending cloud sync requires an endpoint and includes device registration', async () => {
  storage.clear();

  assert.equal(await hasPendingCloudSync(), true);
});

test('pending cloud sync includes queued telemetry', async () => {
  storage.clear();

  await recordTelemetryEvent({ eventName: 'app.open', feature: 'app' });
  assert.equal(await hasPendingCloudSync(), true);
});

test('pending cloud sync can be disabled by clearing the endpoint', async () => {
  storage.clear();

  await setSetting('cloudSyncEndpoint', '');
  await recordTelemetryEvent({ eventName: 'app.open', feature: 'app' });

  assert.equal(await hasPendingCloudSync(), false);
});

test('cloud sync sends the default ingest token', async () => {
  storage.clear();

  await recordTelemetryEvent({ eventName: 'app.open', feature: 'app' });

  let headers: Record<string, string> = {};
  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'fetch', {
    value: async (_url: string, init?: RequestInit) => {
      headers = init?.headers as Record<string, string>;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
    configurable: true,
  });

  try {
    const result = await syncCloudBackup();
    assert.equal(result.ok, true);
    assert.match(headers['x-deskcat-ingest-token'], /^[a-f0-9]{64}$/);
  } finally {
    Object.defineProperty(globalThis, 'fetch', {
      value: originalFetch,
      configurable: true,
    });
  }
});

test('local mutations notify the cloud sync scheduler', async () => {
  storage.clear();

  let notifications = 0;
  const listener = () => {
    notifications += 1;
  };
  window.addEventListener(CLOUD_SYNC_PENDING_EVENT, listener);
  try {
    await recordTelemetryEvent({ eventName: 'app.open', feature: 'app' });
  } finally {
    window.removeEventListener(CLOUD_SYNC_PENDING_EVENT, listener);
  }

  assert.equal(notifications, 1);
});
