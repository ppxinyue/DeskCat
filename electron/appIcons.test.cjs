const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  bundledIconCandidates,
  shouldHideApplicationMenu,
  shouldUseNativeWindowsIcon,
} = require('./appIcons.cjs');

test('Windows bundled icon candidates prefer the multi-size ico before pet art', () => {
  const appPath = 'D:\\DeskCat';
  const candidates = bundledIconCandidates(appPath, {
    platform: 'win32',
    fallbackIconPath: path.join(appPath, 'public', 'assets', 'idle', 'png', 'idle.png'),
  });

  assert.equal(candidates[0], path.join(appPath, 'src-tauri', 'icons', 'icon.ico'));
  assert.equal(candidates.includes(path.join(appPath, 'public', 'assets', 'idle', 'png', 'idle.png')), true);
});

test('macOS/default bundled icon order preserves existing pet art preference', () => {
  const appPath = '/Applications/DeskCat.app';
  const candidates = bundledIconCandidates(appPath, {
    platform: 'darwin',
    fallbackIconPath: path.join(appPath, 'public', 'assets', 'idle', 'png', 'idle.png'),
  });

  assert.equal(candidates[0], path.join(appPath, 'public', 'assets', 'idle', 'png', 'idle.png'));
});

test('Windows native tray icon path uses ico files without bitmap resizing', () => {
  assert.equal(shouldUseNativeWindowsIcon('C:\\DeskCat\\icon.ico', 'win32'), true);
  assert.equal(shouldUseNativeWindowsIcon('C:\\DeskCat\\icon.png', 'win32'), false);
  assert.equal(shouldUseNativeWindowsIcon('/DeskCat/icon.ico', 'darwin'), false);
});

test('application menu is hidden only on Windows', () => {
  assert.equal(shouldHideApplicationMenu('win32'), true);
  assert.equal(shouldHideApplicationMenu('darwin'), false);
  assert.equal(shouldHideApplicationMenu('linux'), false);
});
