import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const avatarSource = fs.readFileSync(path.resolve('src', 'features', 'pet', 'PetAvatar.tsx'), 'utf8');
const appSource = fs.readFileSync(path.resolve('src', 'App.tsx'), 'utf8');
const mainSource = fs.readFileSync(path.resolve('electron', 'main.cjs'), 'utf8');

test('Windows pet context menu waits for the resized layout before rendering', () => {
  assert.match(avatarSource, /function isWindowsRuntime/);
  assert.match(avatarSource, /const layoutReady = Promise\.resolve\(onMenuOpenChange\?\.\(true,/);
  assert.match(avatarSource, /if \(isWindowsRuntime\(\)\) \{/);
  assert.match(avatarSource, /requestAnimationFrame\(\(\) => window\.requestAnimationFrame/);
});

test('pet context menu open callback returns the layout promise', () => {
  assert.match(appSource, /return requestLayout\(\{ contextMenuOpen: true, contextMenuLayout: nextLayout \}\);/);
});

test('Windows context menu open avoids extra topmost reshuffling', () => {
  assert.match(mainSource, /if \(process\.platform !== 'win32'\) \{\s*applyFloatingFullscreenBehavior\(pet, \{ force: true \}\);/);
  assert.match(mainSource, /if \(process\.platform !== 'win32'\) applyFloatingFullscreenBehavior\(compact, \{ force: true \}\);/);
});
