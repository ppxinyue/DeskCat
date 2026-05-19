# Windows Electron Dev Command Test Plan

## Scope

This check covers the cross-platform `pnpm electron:dev` command. The previous command used POSIX-style inline environment variables, which work in macOS shells but fail in Windows PowerShell and `cmd.exe`.

## Automated Tests

Run:

```powershell
pnpm test:startup
```

The startup suite includes `scripts/start-electron-dev.test.cjs`, which verifies:

- `VITE_DEV_SERVER_URL` is set to `http://127.0.0.1:5173` by the Node launcher.
- An explicit `VITE_DEV_SERVER_URL` override is preserved.
- Electron is launched through `electron/cli.js` instead of a shell-specific environment assignment.

## Manual Test

Run in PowerShell:

```powershell
pnpm electron:dev
```

Expected result:

- Vite starts at `http://127.0.0.1:5173/`.
- Electron starts after the Vite port is reachable.
- The app window/tray appears without the Windows error:

```text
'VITE_DEV_SERVER_URL' is not recognized as an internal or external command
```

## macOS Regression Check

Run on macOS:

```bash
pnpm electron:dev
```

Expected result:

- The command remains unchanged for developers.
- Vite starts first, then Electron starts with `VITE_DEV_SERVER_URL=http://127.0.0.1:5173`.
