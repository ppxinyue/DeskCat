# Windows Voice Input/Output Test Plan

## Scope

This step covers Windows voice input/output behavior in the Electron runtime.

The intended behavior is:

- Voice input defaults to cloud STT when `voiceInputProvider` is `cloud-auto`.
- If cloud STT fails, the app attempts system Web Speech recognition as a fallback.
- If Electron/Windows does not expose `SpeechRecognition` or `webkitSpeechRecognition`, the app reports that system speech recognition is unavailable instead of pretending recording started.
- Voice output defaults to cloud TTS when configured for cloud output.
- If cloud TTS fails, the app falls back to `speechSynthesis` system speech output when available.

## Automated Tests

Run:

```powershell
pnpm test:chat
pnpm build
```

`test:chat` includes `src/features/voice/voiceRuntime.test.ts`, which verifies:

- Recording MIME type selection prefers Chromium WebM/Opus and falls back through Windows-friendly formats.
- STT upload file names match the selected MIME type.
- System speech input reports missing microphone and missing Web Speech recognition separately.
- Both `SpeechRecognition` and `webkitSpeechRecognition` are accepted when present.
- System TTS requires both `speechSynthesis` and `SpeechSynthesisUtterance`.
- Explicit voice language settings override the OS/browser language.

## Manual Test

Run:

```powershell
pnpm electron:dev
```

Then:

1. Open Settings > Voice Model.
2. Set voice input provider to `cloud-auto`.
3. Start voice input from chat.
4. Speak a short sentence.
5. Confirm the transcript appears in the input box.
6. Temporarily break cloud STT configuration or exhaust built-in quota if available.
7. Start voice input again.

Expected:

- Cloud STT is used first.
- If cloud STT fails and Web Speech recognition exists, system STT fallback is attempted.
- If Web Speech recognition is unavailable in Electron, the app shows a clear unavailable message.

For voice output:

1. Keep voice output enabled.
2. Ask a question that produces a short response.
3. Confirm cloud TTS plays when available.
4. Temporarily break cloud TTS configuration.
5. Ask again.

Expected:

- The app falls back to Windows system speech output when `speechSynthesis` is available.

## macOS Regression Check

Run:

```bash
pnpm test:chat
pnpm electron:dev
```

Expected:

- Existing cloud-first voice behavior remains unchanged.
- System Web Speech fallback still works when the runtime exposes it.
