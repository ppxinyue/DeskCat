# Windows Topmost and Fullscreen Test Plan

## Scope

This step covers DeskCat pet and compact chat window behavior around Windows fullscreen apps. It does not cover screenshot capture, file import, update, or Timeline URL extraction.

## Implementation Notes

- macOS keeps its existing panel/Space behavior:
  - `setVisibleOnAllWorkspaces(... visibleOnFullScreen ...)`
  - `setAlwaysOnTop(true, 'screen-saver' | 'floating', relativeLevel)`
- Windows now uses an explicit shared topmost policy for pet and compact chat:
  - `setAlwaysOnTop(true, 'screen-saver', relativeLevel)`
  - `setFullScreenable(false)`
  - `setSkipTaskbar(true)`
  - compact chat calls `moveTop()` so input UI can recover ordering after focus changes
- The existing fullscreen-game suppression path remains in the renderer. If a fullscreen game is detected and `alwaysOnTop` is enabled, the pet can be temporarily unpinned.

## Automated Tests

Run:

```powershell
pnpm test:startup
pnpm build
```

The startup suite includes `electron/windowTopmost.test.cjs`, which verifies:

- macOS topmost policy still exposes fullscreen Space behavior.
- macOS pet context menus raise the pet relative level.
- Windows pet and compact chat use explicit fullscreen topmost policy.
- Suppressed topmost mode disables `alwaysOnTop`.
- Windows policy does not call macOS workspace APIs.
- Windows guard remains active instead of being skipped after the first topmost application.

## Manual Test Matrix

Run:

```powershell
pnpm electron:dev
```

In Settings > Appearance, keep Always on top enabled unless a test says otherwise.

| Scenario | Expected |
| --- | --- |
| Normal desktop | Pet is visible, transparent, does not appear in taskbar. |
| Fullscreen Chrome/Edge browser video | Pet remains visible above the fullscreen browser unless fullscreen-game suppression is active. |
| Fullscreen PowerPoint slide show | Pet remains visible; compact chat can be opened and brought above the slide show. |
| Fullscreen local video player | Pet remains visible above the fullscreen player. |
| Borderless/fullscreen game or game keyword match | Pet may be suppressed/unpinned according to Focus/Game detection settings. |
| Compact chat opened from pet | Compact chat appears above desktop/fullscreen app and accepts IME/input focus. |
| Always on top disabled | Pet should not re-pin itself above other apps. |

## Developer Diagnostics

Use the existing window diagnostics command through the renderer/dev console if needed:

```ts
await window.deskCat.invoke('read_pet_window_debug_info')
```

Expected useful fields:

- `pet.alwaysOnTop`
- `pet.visible`
- `compact.alwaysOnTop`
- `displays`
- `visibilityState`

## macOS Regression Check

Run on macOS:

```bash
pnpm test:startup
pnpm electron:dev
```

Expected:

- Pet still uses macOS panel/Space behavior.
- Pet remains visible across fullscreen Spaces.
- Compact chat focus behavior remains unchanged.
