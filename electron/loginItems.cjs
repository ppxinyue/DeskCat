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
  return platform === 'darwin';
}

function readLaunchAtLogin(app) {
  return Boolean(app.getLoginItemSettings().openAtLogin);
}

function setLaunchAtLogin(app, enabled, {
  platform = process.platform,
  isPackaged = app.isPackaged,
  execPath = process.execPath,
  appPath = typeof app.getAppPath === 'function' ? app.getAppPath() : '',
} = {}) {
  app.setLoginItemSettings(createLoginItemOptions({
    enabled,
    platform,
    isPackaged,
    execPath,
    appPath,
  }));
  return readLaunchAtLogin(app);
}

module.exports = {
  createLoginItemOptions,
  readLaunchAtLogin,
  setLaunchAtLogin,
  shouldApplyDefaultLaunchAtLogin,
};
