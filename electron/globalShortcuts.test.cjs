const assert = require('node:assert/strict');
const test = require('node:test');
const {
  DEFAULT_GLOBAL_SHORTCUT,
  createGlobalShortcutRegistry,
  normalizeShortcutAccelerator,
} = require('./globalShortcuts.cjs');

function fakeGlobalShortcut({ failRegister = false } = {}) {
  const registered = [];
  const unregistered = [];
  return {
    registered,
    unregistered,
    register: (accelerator, callback) => {
      if (failRegister) return false;
      registered.push({ accelerator, callback });
      return true;
    },
    unregister: (accelerator) => {
      unregistered.push(accelerator);
    },
  };
}

test('normalizes common Windows-style shortcut spelling', () => {
  assert.equal(normalizeShortcutAccelerator('Ctrl + Shift + p'), 'Control+Shift+P');
  assert.equal(normalizeShortcutAccelerator('cmdorctrl+shift+spacebar'), 'CommandOrControl+Shift+Space');
  assert.equal(normalizeShortcutAccelerator('mod + alt + f12'), 'CommandOrControl+Alt+F12');
});

test('falls back when shortcut is empty or lacks a key/modifier', () => {
  assert.equal(normalizeShortcutAccelerator(''), DEFAULT_GLOBAL_SHORTCUT);
  assert.equal(normalizeShortcutAccelerator('Shift'), DEFAULT_GLOBAL_SHORTCUT);
  assert.equal(normalizeShortcutAccelerator('P'), DEFAULT_GLOBAL_SHORTCUT);
});

test('registers the chat focus shortcut and invokes callback', () => {
  let focused = false;
  const nativeShortcut = fakeGlobalShortcut();
  const registry = createGlobalShortcutRegistry({
    globalShortcut: nativeShortcut,
    onChatFocus: () => { focused = true; },
  });

  const result = registry.registerChatShortcut('CommandOrControl+Shift+P');

  assert.deepEqual(result, {
    ok: true,
    accelerator: 'CommandOrControl+Shift+P',
    changed: true,
    error: '',
  });
  assert.equal(registry.getState().chatAccelerator, 'CommandOrControl+Shift+P');
  nativeShortcut.registered[0].callback();
  assert.equal(focused, true);
});

test('re-registers only when the accelerator changes', () => {
  const nativeShortcut = fakeGlobalShortcut();
  const registry = createGlobalShortcutRegistry({
    globalShortcut: nativeShortcut,
    onChatFocus: () => {},
  });

  registry.registerChatShortcut('CommandOrControl+Shift+P');
  const second = registry.registerChatShortcut('CommandOrControl+Shift+P');
  registry.registerChatShortcut('CommandOrControl+Alt+P');

  assert.equal(second.changed, false);
  assert.deepEqual(nativeShortcut.registered.map((item) => item.accelerator), [
    'CommandOrControl+Shift+P',
    'CommandOrControl+Alt+P',
  ]);
  assert.deepEqual(nativeShortcut.unregistered, ['CommandOrControl+Shift+P']);
});

test('reports registration failures without keeping stale state', () => {
  const nativeShortcut = fakeGlobalShortcut({ failRegister: true });
  const registry = createGlobalShortcutRegistry({
    globalShortcut: nativeShortcut,
    onChatFocus: () => {},
    logger: { warn: () => {} },
  });

  const result = registry.registerChatShortcut('CommandOrControl+Shift+P');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'registration failed');
  assert.equal(registry.getState().chatAccelerator, '');
});

test('unregisters the current shortcut on shutdown', () => {
  const nativeShortcut = fakeGlobalShortcut();
  const registry = createGlobalShortcutRegistry({
    globalShortcut: nativeShortcut,
    onChatFocus: () => {},
  });

  registry.registerChatShortcut('CommandOrControl+Shift+P');
  registry.unregisterAll();

  assert.deepEqual(nativeShortcut.unregistered, ['CommandOrControl+Shift+P']);
  assert.equal(registry.getState().chatAccelerator, '');
});
