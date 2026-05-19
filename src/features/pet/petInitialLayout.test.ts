import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appSource = fs.readFileSync(path.resolve('src', 'App.tsx'), 'utf8');

test('pet window requests initial layout after mounting', () => {
  assert.match(appSource, /requestLayout\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(appSource, /listen\("pet:request-initial-layout"/);
});

test('pet initial layout reports readiness through the main process command', () => {
  assert.match(appSource, /invoke\("pet_window_layout_ready"\)\.catch\(\(\) => \{\}\);/);
});
