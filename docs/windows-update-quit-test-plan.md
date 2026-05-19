# Windows Notification, Update, and Quit Test Plan

## Scope

This step covers Windows behavior for:

- Tray quit cleanup.
- Child process cleanup for coding integrations.
- Electron updater automatic/manual checks.
- Avoiding unexpected update notifications from unsigned/dev builds.

## Implementation Notes

- Automatic update checks use `autoUpdater.checkForUpdates()` so they do not create OS notifications by themselves.
- Manual update checks keep `autoUpdater.checkForUpdatesAndNotify()`.
- Development and unpackaged runtime returns `status: skipped` with reason `development`.
- `before-quit` now performs centralized cleanup:
  - clears the topmost guard timer
  - unregisters global shortcuts
  - destroys DeskCat windows
  - destroys tray
  - terminates Codex app-server child process
  - terminates Claude child process if active

## Automated Tests

Run:

```powershell
pnpm test:startup
pnpm build
```

The startup suite includes `electron/appRuntime.test.cjs`, which verifies:

- Update checks are skipped for development/unpackaged runtime.
- Automatic update checks avoid OS notifications.
- Manual update checks may use Electron updater notifications.
- Runtime cleanup destroys live windows and tray.
- Runtime cleanup kills live Codex/Claude child processes.

## Manual Test

Run:

```powershell
pnpm electron:dev
```

### Tray Quit

1. Confirm DeskCat appears in the system tray.
2. Open Settings and Chat once.
3. Use tray menu > Quit.
4. Check processes:

```powershell
Get-Process | Where-Object { $_.ProcessName -match 'DeskCat|electron|codex|claude' }
```

Expected:

- DeskCat/Electron processes for this app are gone.
- If Coding Mode started Codex/Claude children from DeskCat, those child processes are gone.

### Update Check

In development:

1. Trigger manual update check from Settings if the UI exposes it.
2. Expected status is skipped/development or a handled error, not a surprise OS notification.

In packaged unsigned Windows build:

1. Launch the app.
2. Wait at least 10 seconds.
3. Confirm no unexpected update notification appears.
4. Trigger manual update check.
5. Confirm errors are reported in-app and do not crash the app.

## Release Follow-up

Before enabling public Windows auto-update, verify:

- Code signing certificate and publisher identity.
- GitHub Releases contains Windows artifacts and `latest.yml`.
- NSIS installer can update over an installed previous version.
