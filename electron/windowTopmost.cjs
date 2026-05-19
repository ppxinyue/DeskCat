function resolveTopmostPolicy({
  platform = process.platform,
  windowRole = 'generic',
  force = false,
  suppressed = false,
  petContextMenuOpen = false,
} = {}) {
  const isCompactChat = windowRole === 'compact-chat';
  const isPet = windowRole === 'pet';

  if (suppressed) {
    return {
      enabled: false,
      level: undefined,
      relativeLevel: undefined,
      skipTaskbar: undefined,
      visibleOnAllWorkspaces: false,
      fullScreenable: undefined,
      showDock: false,
      moveTop: false,
    };
  }

  if (platform === 'darwin') {
    return {
      enabled: true,
      level: isCompactChat ? 'floating' : 'screen-saver',
      relativeLevel: isCompactChat ? 0 : isPet && petContextMenuOpen ? 2 : 1,
      skipTaskbar: false,
      visibleOnAllWorkspaces: true,
      fullScreenable: false,
      showDock: true,
      moveTop: Boolean(force),
    };
  }

  if (platform === 'win32') {
    return {
      enabled: true,
      level: 'screen-saver',
      relativeLevel: isCompactChat ? 1 : 0,
      skipTaskbar: true,
      visibleOnAllWorkspaces: false,
      fullScreenable: false,
      showDock: false,
      moveTop: Boolean(force || isCompactChat),
    };
  }

  return {
    enabled: true,
    level: isCompactChat ? 'screen-saver' : 'normal',
    relativeLevel: undefined,
    skipTaskbar: true,
    visibleOnAllWorkspaces: false,
    fullScreenable: false,
    showDock: false,
    moveTop: Boolean(force && isCompactChat),
  };
}

function shouldSkipTopmostApply({
  platform = process.platform,
  force = false,
  isCompactChat = false,
  alreadyConfigured = false,
  alwaysOnTop = false,
} = {}) {
  if (force) return false;
  if (!alreadyConfigured || !alwaysOnTop) return false;
  if (platform === 'darwin') return true;
  return platform !== 'win32' && !isCompactChat;
}

function applyTopmostPolicy(win, policy, { dock } = {}) {
  if (!win || win.isDestroyed?.()) return;

  if (!policy.enabled) {
    win.setAlwaysOnTop(false);
    return;
  }

  if (policy.showDock) dock?.show?.();
  if (typeof policy.skipTaskbar === 'boolean') win.setSkipTaskbar?.(policy.skipTaskbar);
  if (policy.visibleOnAllWorkspaces) {
    win.setVisibleOnAllWorkspaces?.(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  }
  if (typeof policy.fullScreenable === 'boolean') win.setFullScreenable?.(policy.fullScreenable);
  win.setAlwaysOnTop(true, policy.level, policy.relativeLevel);
  if (policy.moveTop) win.moveTop?.();
}

module.exports = {
  applyTopmostPolicy,
  resolveTopmostPolicy,
  shouldSkipTopmostApply,
};
