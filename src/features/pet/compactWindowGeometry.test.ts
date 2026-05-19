import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appSource = fs.readFileSync(path.resolve('src', 'App.tsx'), 'utf8');
const mainSource = fs.readFileSync(path.resolve('electron', 'main.cjs'), 'utf8');

test('compact chat BrowserWindow width is fixed to the configured dialog width', () => {
  assert.match(appSource, /const outerWidth = clamp\(\s*requestedDialogWidth,\s*MIN_DIALOG_WIDTH,\s*safeWidth,\s*\);/);
  assert.doesNotMatch(appSource, /contentWidth \+ COMPACT_CHAT_SIDE_CHROME \* 2/);
});

test('compact chat repositioning keeps the requested width instead of moving only', () => {
  assert.match(mainSource, /existing\.setBounds\(\{ x: Math\.round\(x\), y: Math\.round\(y\), width: Math\.round\(w\), height: Math\.round\(h\) \}\);/);
  assert.doesNotMatch(mainSource, /existing\.setPosition\(Math\.round\(x\), Math\.round\(y\)\);/);
});
