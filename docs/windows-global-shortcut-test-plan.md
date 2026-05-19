# Windows Global Shortcut Test Plan

## Scope

This step adapts the global pet/chat wake shortcut for Windows. Screenshot shortcuts are intentionally out of scope.

## Implementation

- Main process owns native shortcut registration through `electron/globalShortcuts.cjs`.
- Startup registers a safe default: `CommandOrControl+Shift+P`.
- After settings load, the pet renderer calls `register_global_shortcuts` with the persisted `globalShortcut`.
- When settings emit `settings:updated` with `globalShortcut`, the main process re-registers the native shortcut.
- macOS continues to use Electron's `CommandOrControl` accelerator semantics.

## Automated Tests

```powershell
pnpm test:startup
pnpm test
pnpm build
```

Expected:

- `electron/globalShortcuts.test.cjs` passes.
- Common Windows spelling such as `Ctrl + Shift + P` normalizes to Electron accelerators.
- Re-registering the same shortcut is a no-op.
- Changing the shortcut unregisters the old accelerator before registering the new one.
- Registration failure is reported without keeping stale state.

## Manual Test

1. Start DeskCat:

```powershell
pnpm electron:start
```

2. Press the default global shortcut:

```text
Ctrl+Shift+P
```

Expected: the pet opens/focuses the compact chat entry.

3. Open Settings -> Shortcuts and change "global wake" to:

```text
Ctrl+Alt+P
```

4. Press the old shortcut:

```text
Ctrl+Shift+P
```

Expected: no new compact chat focus.

5. Press the new shortcut:

```text
Ctrl+Alt+P
```

Expected: compact chat opens/focuses.

6. Restart DeskCat and press the configured shortcut again.

Expected: persisted shortcut is registered after the pet renderer loads settings.

## Debug Command

From renderer devtools:

```ts
await window.deskCat.invoke('read_global_shortcut_status')
```

Expected:

- `chatAccelerator` is the currently registered accelerator.
- `lastError` is empty unless registration failed.
