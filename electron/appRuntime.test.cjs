const assert = require('node:assert/strict');
const test = require('node:test');

const {
  cleanupRuntime,
  destroyTray,
  destroyWindows,
  shouldSkipUpdateCheck,
  terminateChildProcess,
  updateCheckMethod,
} = require('./appRuntime.cjs');

test('update checks are skipped only in development or unpackaged runtime', () => {
  assert.deepEqual(shouldSkipUpdateCheck({ isDev: true, isPackaged: true }), {
    skip: true,
    reason: 'development',
  });
  assert.deepEqual(shouldSkipUpdateCheck({ isDev: false, isPackaged: false }), {
    skip: true,
    reason: 'development',
  });
  assert.deepEqual(shouldSkipUpdateCheck({ isDev: false, isPackaged: true }), {
    skip: false,
    reason: '',
  });
});

test('automatic update checks avoid OS notifications while manual checks may notify', () => {
  assert.equal(updateCheckMethod({ manual: false }), 'checkForUpdates');
  assert.equal(updateCheckMethod({ manual: true }), 'checkForUpdatesAndNotify');
});

test('destroyWindows destroys only live windows', () => {
  const calls = [];
  const windows = new Map([
    ['pet', { isDestroyed: () => false, destroy: () => calls.push('pet') }],
    ['settings', { isDestroyed: () => true, destroy: () => calls.push('settings') }],
  ]);

  assert.equal(destroyWindows(windows), 1);
  assert.deepEqual(calls, ['pet']);
});

test('destroyTray is best effort', () => {
  const calls = [];

  assert.equal(destroyTray({ destroy: () => calls.push('tray') }), true);
  assert.equal(destroyTray({ destroy: () => { throw new Error('busy'); } }), false);
  assert.deepEqual(calls, ['tray']);
});

test('terminateChildProcess kills only live children', () => {
  const calls = [];

  assert.equal(terminateChildProcess({ killed: false, kill: () => calls.push('kill') }), true);
  assert.equal(terminateChildProcess({ killed: true, kill: () => calls.push('skip') }), false);
  assert.deepEqual(calls, ['kill']);
});

test('cleanupRuntime unregisters shortcuts, closes UI, and terminates child processes', () => {
  const calls = [];
  const codexAppServer = {
    child: { killed: false, kill: () => calls.push('codex') },
    ready: Promise.resolve(),
    pending: new Map([[1, {}]]),
  };
  const summary = cleanupRuntime({
    clearTopmostGuard: () => calls.push('timer'),
    shortcutRegistry: { unregisterAll: () => calls.push('shortcuts') },
    windows: new Map([['pet', { isDestroyed: () => false, destroy: () => calls.push('window') }]]),
    tray: { destroy: () => calls.push('tray') },
    codexAppServer,
    claudeChild: { killed: false, kill: () => calls.push('claude') },
  });

  assert.deepEqual(summary, {
    destroyedTray: true,
    destroyedWindows: 1,
    killedClaude: true,
    killedCodex: true,
  });
  assert.deepEqual(calls, ['timer', 'shortcuts', 'window', 'tray', 'codex', 'claude']);
  assert.equal(codexAppServer.child, null);
  assert.equal(codexAppServer.ready, null);
  assert.equal(codexAppServer.pending.size, 0);
});
