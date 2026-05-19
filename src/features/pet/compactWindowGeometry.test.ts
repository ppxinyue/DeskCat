import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appSource = fs.readFileSync(path.resolve('src', 'App.tsx'), 'utf8');
const mainSource = fs.readFileSync(path.resolve('electron', 'main.cjs'), 'utf8');

test('compact chat BrowserWindow width is fixed to the configured dialog width only on Windows', () => {
  assert.match(appSource, /function isWindowsRuntime/);
  assert.match(appSource, /isWindowsRuntime\(\)\s*\?\s*clamp\(requestedDialogWidth, MIN_DIALOG_WIDTH, safeWidth\)/);
  assert.match(appSource, /:\s*Math\.min\(safeWidth, contentWidth \+ COMPACT_CHAT_SIDE_CHROME \* 2\)/);
});

test('compact chat repositioning keeps the requested width only on Windows', () => {
  assert.match(mainSource, /if \(process\.platform === 'win32'\) \{/);
  assert.match(mainSource, /existing\.setBounds\(\{ x: Math\.round\(x\), y: Math\.round\(y\), width: Math\.round\(w\), height: Math\.round\(h\) \}\);/);
  assert.match(mainSource, /existing\.setPosition\(Math\.round\(x\), Math\.round\(y\)\);/);
});

test('dragging the pet keeps compact chat width fixed on Windows', () => {
  assert.match(mainSource, /move_pet_and_compact_chat/);
  assert.match(mainSource, /process\.platform === 'win32' && Number\.isFinite\(Number\(compact\.w\)\)/);
  assert.match(mainSource, /width: Math\.round\(Number\(compact\.w\)\)/);
  assert.match(mainSource, /height: currentBounds\.height/);
});
