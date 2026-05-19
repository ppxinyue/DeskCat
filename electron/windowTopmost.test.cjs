const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyTopmostPolicy,
  resolveTopmostPolicy,
  shouldSkipTopmostApply,
} = require('./windowTopmost.cjs');

function fakeWindow() {
  const calls = [];
  return {
    calls,
    isDestroyed: () => false,
    setAlwaysOnTop: (...args) => calls.push(['setAlwaysOnTop', ...args]),
    setSkipTaskbar: (...args) => calls.push(['setSkipTaskbar', ...args]),
    setVisibleOnAllWorkspaces: (...args) => calls.push(['setVisibleOnAllWorkspaces', ...args]),
    setFullScreenable: (...args) => calls.push(['setFullScreenable', ...args]),
    moveTop: () => calls.push(['moveTop']),
  };
}

test('macOS pet policy preserves fullscreen Space behavior', () => {
  assert.deepEqual(resolveTopmostPolicy({
    platform: 'darwin',
    windowRole: 'pet',
    force: true,
  }), {
    enabled: true,
    level: 'screen-saver',
    relativeLevel: 1,
    skipTaskbar: false,
    visibleOnAllWorkspaces: true,
    fullScreenable: false,
    showDock: true,
    moveTop: true,
  });
});

test('macOS pet context menu raises the relative level without changing compact chat policy', () => {
  assert.equal(resolveTopmostPolicy({
    platform: 'darwin',
    windowRole: 'pet',
    petContextMenuOpen: true,
  }).relativeLevel, 2);
  assert.equal(resolveTopmostPolicy({
    platform: 'darwin',
    windowRole: 'compact-chat',
    petContextMenuOpen: true,
  }).relativeLevel, 0);
});

test('Windows pet and compact chat use explicit topmost fullscreen policy', () => {
  assert.deepEqual(resolveTopmostPolicy({ platform: 'win32', windowRole: 'pet' }), {
    enabled: true,
    level: 'screen-saver',
    relativeLevel: 0,
    skipTaskbar: true,
    visibleOnAllWorkspaces: false,
    fullScreenable: false,
    showDock: false,
    moveTop: false,
  });
  assert.equal(resolveTopmostPolicy({ platform: 'win32', windowRole: 'compact-chat' }).moveTop, true);
});

test('suppressed topmost policy disables always on top only', () => {
  const win = fakeWindow();

  applyTopmostPolicy(win, resolveTopmostPolicy({ suppressed: true }));

  assert.deepEqual(win.calls, [['setAlwaysOnTop', false]]);
});

test('applyTopmostPolicy applies Windows ordering without macOS workspace calls', () => {
  const win = fakeWindow();

  applyTopmostPolicy(win, resolveTopmostPolicy({
    platform: 'win32',
    windowRole: 'compact-chat',
    force: true,
  }));

  assert.deepEqual(win.calls, [
    ['setSkipTaskbar', true],
    ['setFullScreenable', false],
    ['setAlwaysOnTop', true, 'screen-saver', 1],
    ['moveTop'],
  ]);
});

test('applyTopmostPolicy applies macOS workspace and dock behavior', () => {
  const win = fakeWindow();
  const dockCalls = [];

  applyTopmostPolicy(
    win,
    resolveTopmostPolicy({ platform: 'darwin', windowRole: 'pet', force: true }),
    { dock: { show: () => dockCalls.push('show') } },
  );

  assert.deepEqual(dockCalls, ['show']);
  assert.deepEqual(win.calls, [
    ['setSkipTaskbar', false],
    ['setVisibleOnAllWorkspaces', true, { visibleOnFullScreen: true, skipTransformProcessType: true }],
    ['setFullScreenable', false],
    ['setAlwaysOnTop', true, 'screen-saver', 1],
    ['moveTop'],
  ]);
});

test('skip logic preserves macOS cached behavior and keeps Windows guard active', () => {
  assert.equal(shouldSkipTopmostApply({
    platform: 'darwin',
    alreadyConfigured: true,
    alwaysOnTop: true,
  }), true);
  assert.equal(shouldSkipTopmostApply({
    platform: 'win32',
    alreadyConfigured: true,
    alwaysOnTop: true,
  }), false);
});
