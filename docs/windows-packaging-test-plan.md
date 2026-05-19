# Windows Packaging Test Plan

## Goal

Build Windows production installers without changing macOS packaging behavior.

This project uses Electron. In Node/Electron, `process.platform === "win32"` means the Windows OS family, including 32-bit Windows, 64-bit Windows, and Windows on ARM. Installer architecture is controlled by electron-builder arch flags:

- `--x64`: 64-bit Intel/AMD Windows
- `--ia32`: 32-bit Windows

## Commands

Build both Windows x64 and ia32 NSIS installers:

```powershell
pnpm electron:build:win
```

Build only x64:

```powershell
pnpm electron:build:win:x64
```

Build only ia32:

```powershell
pnpm electron:build:win:ia32
```

The existing macOS command remains unchanged:

```bash
pnpm electron:build:mac
```

## Automated Tests

```powershell
pnpm test:startup
pnpm test
pnpm build
```

Expected:

- `electron/buildConfig.test.cjs` validates the Windows build scripts.
- Windows scripts run `pnpm native:build && pnpm build` before electron-builder.
- `pnpm build` verifies optimized runtime pet assets before packaging.
- macOS packaging script still uses only `--mac dmg --x64 --arm64`.
- Windows icon path exists at `src-tauri/icons/icon.ico`.

## Manual Installer Test

1. Clear old packaged output if desired:

```powershell
Remove-Item .\release -Recurse -Force
```

2. Build the installer:

```powershell
pnpm electron:build:win:x64
```

3. Confirm `release` contains an x64 NSIS installer named like:

```text
DeskCat-2.0.0-x64.exe
```

4. Install and launch DeskCat.

5. Confirm:

- App launches from installer shortcut.
- System tray icon appears.
- Pet appears without opening settings first.
- Tray "hide/show pet" works.
- Settings and chat windows open.
- Pet assets render as animated WebP/GIF.
- Quit from tray exits all DeskCat processes.

6. Uninstall from Windows Apps or the NSIS uninstaller and confirm shortcuts are removed.

## Notes

- GitHub warns for tracked files over 50 MB. Current large media assets are unrelated to Windows packaging but may slow clone and CI.
- Windows installers are not code-signed yet. SmartScreen warnings are expected until signing is configured.
