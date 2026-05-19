# Windows Icon and Menu Test Plan

## Scope

This check covers Windows app icon selection, tray icon clarity, window title-bar icon shape, and the default Electron application menu.

## Implementation Notes

- Windows bundled app icon selection now prefers `src-tauri/icons/icon.ico`.
- The tray uses the native `.ico` directly on Windows, so Windows can select the best embedded size for DPI instead of scaling a pet bitmap down to 18 px.
- Window icons use the same square icon source as tray/taskbar.
- The default Electron menu bar (`File`, `Edit`, `View`, `Window`, `Help`) is hidden on Windows with `Menu.setApplicationMenu(null)`.
- macOS keeps the existing pet-art-first icon selection and application menu behavior.

## Automated Tests

Run:

```powershell
pnpm test:startup
pnpm build
```

The startup suite includes `electron/appIcons.test.cjs`, which verifies:

- Windows prefers the multi-size `.ico` before pet artwork.
- macOS/default platforms keep the existing pet artwork preference.
- Windows `.ico` tray icons are treated as native icons instead of resized bitmaps.
- The application menu is hidden only on Windows.

## Manual Test

Run:

```powershell
pnpm electron:dev
```

Expected:

- The system tray icon is crisp at the current Windows DPI.
- The settings window title-bar icon is square and not horizontally stretched.
- The taskbar icon matches the tray/title-bar icon.
- The `File`, `Edit`, `View`, `Window`, `Help` menu bar is not visible.

Also test at 100%, 125%, and 150% display scaling if available.
