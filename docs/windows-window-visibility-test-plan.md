# Windows Pet Window Visibility Diagnostics

## Goal

- Keep the macOS deferred-layout behavior unchanged.
- Add a Windows-safe fallback so the pet window cannot remain hidden forever if the first layout event is delayed.
- Add a main-process diagnostic command that reports pet window existence, visibility, bounds, display work areas, and lifecycle state.

## Changed Files

- `electron/windowLifecycle.cjs`
- `electron/windowLifecycle.test.cjs`
- `electron/windowDiagnostics.cjs`
- `electron/windowDiagnostics.test.cjs`
- `electron/main.cjs`
- `src/App.tsx`
- `package.json`

## Automated Tests

```powershell
pnpm test:startup
pnpm test
pnpm build
node scripts\verify-pet-assets.mjs
```

Expected:

- `test:startup` includes `electron/windowDiagnostics.test.cjs`.
- Pet visibility fallback only triggers when explicitly configured.
- Bounds visibility checks pass for normal, offscreen, and negative-coordinate multi-monitor layouts.
- Production build verifies all runtime pet assets.

## Manual Test

1. Exit DeskCat from the system tray.
2. Rebuild production assets:

```powershell
pnpm build
```

3. Start production Electron:

```powershell
pnpm electron:start
```

4. Confirm:

- The pet appears without opening settings or chat first.
- Tray "hide/show pet" toggles the visible state.
- The pet can be dragged and remains inside the monitor work area.
- Right-click menu opens next to the pet and does not push the pet offscreen.
- No `[pet] failed to load` or `[pet] renderer process gone` messages appear in the terminal.

## Debug Command

From the renderer devtools or a temporary debug button, call:

```ts
await window.deskCat.invoke('read_pet_window_debug_info')
```

The returned payload should include:

- `pet.exists`
- `pet.visible`
- `pet.bounds`
- `petBoundsVisibleOnDisplay`
- `visibility.layoutReady`
- `visibility.pendingShow`
- `displays[].workArea`
