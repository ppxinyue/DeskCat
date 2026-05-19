# Windows File Import and Local Resource Test Plan

## Scope

This step covers Windows local file selection and local resource preview paths:

- Pet image import.
- Chat image selection.
- Chat PDF/DOCX selection.
- `deskcat-file://` local resource URLs with Windows paths, Chinese characters, spaces, and backslashes.

## Implementation Notes

- `convertFileSrc(path)` now creates `deskcat-file://local/<base64url payload>`.
- The payload stores the original UTF-8 local path without relying on URL path separators.
- The main process decodes the URL with the same helper before reading the file.
- Legacy `deskcat-file:///${encodeURIComponent(path)}` URLs remain supported.

## Automated Tests

Run:

```powershell
pnpm test:startup
pnpm build
```

The startup suite includes `electron/fileUrls.test.cjs`, which verifies:

- Windows paths round-trip with drive letters, backslashes, Chinese characters, and spaces.
- POSIX paths still round-trip.
- The payload is URL-safe base64.
- Legacy encoded Windows URLs still decode.
- Slash-style Windows URLs normalize back to Windows separators.
- Non-DeskCat schemes are rejected.

## Manual Test Matrix

Create these files:

```powershell
mkdir "$env:TEMP\Desk Cat 测试"
```

Use filenames similar to:

- `$env:TEMP\Desk Cat 测试\小猫 idle 01.png`
- `$env:TEMP\Desk Cat 测试\小猫 动图 01.gif`
- `$env:TEMP\Desk Cat 测试\聊天 图片 01.png`
- `$env:TEMP\Desk Cat 测试\文档 测试 01.pdf`
- `$env:TEMP\Desk Cat 测试\文档 测试 02.docx`

Then run:

```powershell
pnpm electron:dev
```

Expected:

- Pet custom image import succeeds for paths with Chinese characters and spaces.
- Imported pet images preview correctly after import and after app restart.
- Chat image selection returns the selected image and can be sent.
- PDF/DOCX selection extracts text and shows the document attachment.
- No broken `deskcat-file:///C%3A...` or malformed path errors appear in logs.

## Regression Checks

- Existing imported pet images using older stored local paths still preview.
- Existing `deskcat-file:///<encoded-path>` URLs still decode.
- macOS file preview remains unaffected.
