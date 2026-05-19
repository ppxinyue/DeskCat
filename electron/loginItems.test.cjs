const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  applyDefaultLaunchAtLogin,
  createLoginItemOptions,
  loginItemPreferencePath,
  readLaunchAtLogin,
  readLaunchAtLoginPreference,
  setLaunchAtLogin,
  shouldApplyDefaultLaunchAtLogin,
  writeLaunchAtLoginPreference,
} = require('./loginItems.cjs');

function createMockApp({ openAtLogin = false, isPackaged = true, appPath = 'D:\\DeskCat' } = {}) {
  const calls = [];
  let current = Boolean(openAtLogin);
  return {
    app: {
      isPackaged,
      getAppPath: () => appPath,
      getPath: () => appPath,
      getLoginItemSettings: () => ({ openAtLogin: current }),
      setLoginItemSettings: (options) => {
        calls.push(options);
        current = Boolean(options.openAtLogin);
      },
    },
    calls,
  };
}

test('macOS login item options keep the existing Electron shape', () => {
  assert.deepEqual(createLoginItemOptions({ enabled: true, platform: 'darwin' }), {
    openAtLogin: true,
    openAsHidden: false,
  });
});

test('Windows packaged login item options include the executable path', () => {
  assert.deepEqual(createLoginItemOptions({
    enabled: true,
    platform: 'win32',
    isPackaged: true,
    execPath: 'C:\\Program Files\\DeskCat\\DeskCat.exe',
  }), {
    openAtLogin: true,
    openAsHidden: false,
    path: 'C:\\Program Files\\DeskCat\\DeskCat.exe',
  });
});

test('Windows dev login item options include the app path argument', () => {
  assert.deepEqual(createLoginItemOptions({
    enabled: true,
    platform: 'win32',
    isPackaged: false,
    execPath: 'D:\\DeskCat\\node_modules\\electron\\dist\\electron.exe',
    appPath: 'D:\\DeskCat',
  }), {
    openAtLogin: true,
    openAsHidden: false,
    path: 'D:\\DeskCat\\node_modules\\electron\\dist\\electron.exe',
    args: ['D:\\DeskCat'],
  });
});

test('Windows login item options keep the path when disabling startup', () => {
  assert.deepEqual(createLoginItemOptions({
    enabled: false,
    platform: 'win32',
    isPackaged: true,
    execPath: 'C:\\DeskCat\\DeskCat.exe',
  }), {
    openAtLogin: false,
    openAsHidden: false,
    path: 'C:\\DeskCat\\DeskCat.exe',
  });
});

test('default launch at login is applied only on macOS to preserve current mac behavior', () => {
  assert.equal(shouldApplyDefaultLaunchAtLogin('darwin'), true);
  assert.equal(shouldApplyDefaultLaunchAtLogin('win32'), true);
  assert.equal(shouldApplyDefaultLaunchAtLogin('linux'), false);
});

test('setLaunchAtLogin writes platform options and returns the current setting', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskcat-login-'));
  const { app, calls } = createMockApp({ isPackaged: false, appPath: dir });

  const enabled = setLaunchAtLogin(app, true, {
    platform: 'win32',
    execPath: 'D:\\DeskCat\\electron.exe',
    userDataPath: dir,
  });

  assert.equal(enabled, true);
  assert.deepEqual(calls[0], {
    openAtLogin: true,
    openAsHidden: false,
    path: 'D:\\DeskCat\\electron.exe',
    args: [dir],
  });
  assert.equal(readLaunchAtLogin(app), true);
});

test('launch at login preference is persisted and read from userData', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskcat-login-'));

  assert.equal(readLaunchAtLoginPreference(dir), null);
  writeLaunchAtLoginPreference(dir, false);
  assert.equal(readLaunchAtLoginPreference(dir), false);
  assert.equal(fs.existsSync(loginItemPreferencePath(dir)), true);
});

test('Windows applies default launch at login when the user has not opted out', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskcat-login-'));
  const { app, calls } = createMockApp({ openAtLogin: false, appPath: dir });

  const enabled = applyDefaultLaunchAtLogin(app, { platform: 'win32', userDataPath: dir });

  assert.equal(enabled, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].openAtLogin, true);
  assert.equal(readLaunchAtLoginPreference(dir), null);
});

test('Windows default launch at login respects an explicit user opt-out', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskcat-login-'));
  writeLaunchAtLoginPreference(dir, false);
  const { app, calls } = createMockApp({ openAtLogin: false, appPath: dir });

  const enabled = applyDefaultLaunchAtLogin(app, { platform: 'win32', userDataPath: dir });

  assert.equal(enabled, false);
  assert.equal(calls.length, 0);
});

test('setLaunchAtLogin records user changes by default', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskcat-login-'));
  const { app } = createMockApp({ appPath: dir });

  setLaunchAtLogin(app, false, { platform: 'win32', userDataPath: dir });

  assert.equal(readLaunchAtLoginPreference(dir), false);
});
