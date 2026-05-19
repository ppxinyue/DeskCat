const DEFAULT_GLOBAL_SHORTCUT = 'CommandOrControl+Shift+P';

function normalizeShortcutAccelerator(value, fallback = DEFAULT_GLOBAL_SHORTCUT) {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const parts = raw
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return fallback;

  const normalized = [];
  for (const part of parts) {
    const lower = part.toLowerCase().replace(/\s+/g, '');
    if (['commandorcontrol', 'cmdorctrl', 'cmdctrl', 'mod'].includes(lower)) normalized.push('CommandOrControl');
    else if (['command', 'cmd', 'meta', 'win', 'super'].includes(lower)) normalized.push('Command');
    else if (['control', 'ctrl', 'ctl'].includes(lower)) normalized.push('Control');
    else if (lower === 'shift') normalized.push('Shift');
    else if (lower === 'alt' || lower === 'option') normalized.push('Alt');
    else if (lower === 'space' || lower === 'spacebar') normalized.push('Space');
    else if (/^f([1-9]|1[0-9]|2[0-4])$/.test(lower)) normalized.push(lower.toUpperCase());
    else if (/^[a-z0-9]$/.test(lower)) normalized.push(lower.toUpperCase());
    else normalized.push(part);
  }

  const hasModifier = normalized.some((part) => ['CommandOrControl', 'Command', 'Control', 'Shift', 'Alt'].includes(part));
  const hasKey = normalized.some((part) => !['CommandOrControl', 'Command', 'Control', 'Shift', 'Alt'].includes(part));
  if (!hasModifier || !hasKey) return fallback;
  return Array.from(new Set(normalized)).join('+');
}

function createGlobalShortcutRegistry({ globalShortcut, onChatFocus, logger = console } = {}) {
  let registeredChatAccelerator = '';
  let lastError = '';

  const unregisterChatShortcut = () => {
    if (!registeredChatAccelerator) return;
    try {
      globalShortcut.unregister(registeredChatAccelerator);
    } catch (error) {
      logger.warn?.('[global-shortcut] unregister failed', error);
    }
    registeredChatAccelerator = '';
  };

  const registerChatShortcut = (accelerator) => {
    const normalized = normalizeShortcutAccelerator(accelerator);
    lastError = '';
    if (registeredChatAccelerator === normalized) {
      return { ok: true, accelerator: normalized, changed: false, error: '' };
    }
    unregisterChatShortcut();
    let ok = false;
    try {
      ok = Boolean(globalShortcut.register(normalized, onChatFocus));
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logger.warn?.('[global-shortcut] register failed', lastError);
      return { ok: false, accelerator: normalized, changed: true, error: lastError };
    }
    if (ok) {
      registeredChatAccelerator = normalized;
      return { ok: true, accelerator: normalized, changed: true, error: '' };
    }
    lastError = 'registration failed';
    logger.warn?.('[global-shortcut] register returned false', normalized);
    return { ok: false, accelerator: normalized, changed: true, error: lastError };
  };

  const unregisterAll = () => {
    unregisterChatShortcut();
  };

  const getState = () => ({
    chatAccelerator: registeredChatAccelerator,
    lastError,
  });

  return {
    getState,
    registerChatShortcut,
    unregisterAll,
  };
}

module.exports = {
  DEFAULT_GLOBAL_SHORTCUT,
  createGlobalShortcutRegistry,
  normalizeShortcutAccelerator,
};
