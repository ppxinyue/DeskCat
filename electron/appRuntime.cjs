function shouldSkipUpdateCheck({
  isDev = false,
  isPackaged = false,
} = {}) {
  if (isDev) return { skip: true, reason: 'development' };
  if (!isPackaged) return { skip: true, reason: 'development' };
  return { skip: false, reason: '' };
}

function updateCheckMethod({ manual = false } = {}) {
  return manual ? 'checkForUpdatesAndNotify' : 'checkForUpdates';
}

function destroyTray(tray) {
  if (!tray) return false;
  try {
    tray.destroy?.();
    return true;
  } catch {
    return false;
  }
}

function destroyWindows(windows) {
  let count = 0;
  for (const win of windows?.values?.() || []) {
    if (!win || win.isDestroyed?.()) continue;
    try {
      win.destroy?.();
      count += 1;
    } catch {
      // best effort during app shutdown
    }
  }
  return count;
}

function terminateChildProcess(child) {
  if (!child || child.killed) return false;
  try {
    child.kill?.();
    return true;
  } catch {
    return false;
  }
}

function cleanupRuntime({
  clearTopmostGuard,
  shortcutRegistry,
  windows,
  tray,
  codexAppServer,
  claudeChild,
} = {}) {
  clearTopmostGuard?.();
  shortcutRegistry?.unregisterAll?.();
  const destroyedWindows = destroyWindows(windows);
  const destroyedTray = destroyTray(tray);
  const killedCodex = terminateChildProcess(codexAppServer?.child);
  if (codexAppServer) {
    codexAppServer.child = null;
    codexAppServer.ready = null;
    codexAppServer.pending?.clear?.();
  }
  const killedClaude = terminateChildProcess(claudeChild);
  return {
    destroyedTray,
    destroyedWindows,
    killedClaude,
    killedCodex,
  };
}

module.exports = {
  cleanupRuntime,
  destroyTray,
  destroyWindows,
  shouldSkipUpdateCheck,
  terminateChildProcess,
  updateCheckMethod,
};
