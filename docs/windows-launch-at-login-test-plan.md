# Windows Launch At Login Test Plan

## Scope

This step covers the Windows launch-at-login integration behind the General settings switch. Screenshot capture and fullscreen/topmost behavior are intentionally out of scope.

## Implementation Notes

- macOS keeps the existing default startup registration path.
- Windows also enables startup registration by default.
- Windows respects an explicit user opt-out after the user turns the setting off.
- Windows `set_launch_at_login` registers the explicit executable path with Electron:
  - packaged app: `process.execPath`
  - development app: `process.execPath` plus the current app path argument

## Automated Tests

Run:

```powershell
pnpm test:startup
```

The startup suite includes `electron/loginItems.test.cjs`, which verifies:

- macOS login item options keep the previous Electron option shape.
- Windows packaged login items include the executable path.
- Windows development login items include the app path argument.
- Disabling Windows startup keeps the executable path so Electron can remove the right entry.
- The app applies default startup registration on macOS and Windows.
- Windows default startup registration does not override a persisted user opt-out.

## Manual Test

Run in PowerShell:

```powershell
pnpm electron:dev
```

Then:

1. Open Settings > General.
2. On a fresh user profile, the Launch at login switch should read on after the app starts.
3. Toggle Launch at login off.
4. Close and reopen Settings; the switch should remain off.
5. Quit and restart DeskCat; the switch should still remain off.
6. Toggle Launch at login on.
7. Close and reopen Settings; the switch should remain on if Windows accepted the login item.

Optional Windows check:

```powershell
Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Run | Select-Object DeskCat
```

Expected:

- When enabled, Windows has a DeskCat launch entry.
- When disabled, the DeskCat launch entry is absent or no longer points to the app.
- After the user disables the setting, restarting DeskCat does not recreate the launch entry.

## macOS Regression Check

Run on macOS:

```bash
pnpm electron:dev
```

Expected:

- The General settings launch-at-login switch still reads the system state.
- The macOS login item option shape remains `{ openAtLogin, openAsHidden }`.
