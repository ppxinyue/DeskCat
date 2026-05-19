const fs = require('node:fs');
const path = require('node:path');

const LOGIN_ITEM_PREFERENCE_FILE = 'login-item-preferences.json';

function createLoginItemOptions({
  enabled,
  platform = process.platform,
  isPackaged = true,
  execPath = process.execPath,
  appPath = '',
} = {}) {
  const openAtLogin = Boolean(enabled);
  const base = { openAtLogin, openAsHidden: false };

  if (platform !== 'win32') return base;

  const options = { ...base, path: execPath };
  if (!isPackaged && appPath) options.args = [appPath];
  return options;
}

function shouldApplyDefaultLaunchAtLogin(platform = process.platform) {
  return platform === 'darwin' || platform === 'win32';
}

function loginItemPreferencePath(userDataPath) {
  return path.join(userDataPath, LOGIN_ITEM_PREFERENCE_FILE);
}

function readLaunchAtLoginPreference(userDataPath) {
  if (!userDataPath) return null;
  try {
    const raw = fs.readFileSync(loginItemPreferencePath(userDataPath), 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed?.launchAtLogin === 'boolean' ? parsed.launchAtLogin : null;
  } catch {
    return null;
  }
}

function writeLaunchAtLoginPreference(userDataPath, enabled) {
  if (!userDataPath) return;
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.writeFileSync(
    loginItemPreferencePath(userDataPath),
    `${JSON.stringify({ launchAtLogin: Boolean(enabled) }, null, 2)}\n`,
    'utf8',
  );
}

function readLaunchAtLogin(app) {
  return Boolean(app.getLoginItemSettings().openAtLogin);
}

function setLaunchAtLogin(app, enabled, {
  platform = process.platform,
  isPackaged = app.isPackaged,
  execPath = process.execPath,
  appPath = typeof app.getAppPath === 'function' ? app.getAppPath() : '',
  userDataPath = typeof app.getPath === 'function' ? app.getPath('userData') : '',
  persistPreference = true,
} = {}) {
  if (persistPreference) writeLaunchAtLoginPreference(userDataPath, enabled);
  app.setLoginItemSettings(createLoginItemOptions({
    enabled,
    platform,
    isPackaged,
    execPath,
    appPath,
  }));
  return readLaunchAtLogin(app);
}

function applyDefaultLaunchAtLogin(app, {
  platform = process.platform,
  userDataPath = typeof app.getPath === 'function' ? app.getPath('userData') : '',
} = {}) {
  if (!shouldApplyDefaultLaunchAtLogin(platform)) return readLaunchAtLogin(app);
  const preference = readLaunchAtLoginPreference(userDataPath);
  if (preference === false) return readLaunchAtLogin(app);
  return setLaunchAtLogin(app, true, { platform, userDataPath, persistPreference: false });
}

module.exports = {
  LOGIN_ITEM_PREFERENCE_FILE,
  applyDefaultLaunchAtLogin,
  createLoginItemOptions,
  loginItemPreferencePath,
  readLaunchAtLogin,
  readLaunchAtLoginPreference,
  setLaunchAtLogin,
  shouldApplyDefaultLaunchAtLogin,
  writeLaunchAtLoginPreference,
};
