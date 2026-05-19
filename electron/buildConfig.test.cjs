const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const packageJson = require('../package.json');

function script(name) {
  return packageJson.scripts?.[name] || '';
}

test('Windows packaging scripts build explicit x64 and ia32 NSIS installers without publishing', () => {
  assert.match(script('electron:build:win'), /electron-builder --win nsis --x64 --ia32 --publish never/);
  assert.match(script('electron:build:win:x64'), /electron-builder --win nsis --x64 --publish never/);
  assert.match(script('electron:build:win:ia32'), /electron-builder --win nsis --ia32 --publish never/);
});

test('Windows packaging runs native build and production asset verification before electron-builder', () => {
  for (const name of ['electron:build:win', 'electron:build:win:x64', 'electron:build:win:ia32']) {
    const command = script(name);
    assert.match(command, /^pnpm native:build && pnpm build && electron-builder/);
  }
});

test('electron:start rebuilds production assets before launching Electron', () => {
  assert.equal(script('electron:start'), 'pnpm native:build && pnpm build && electron .');
});

test('macOS packaging script remains scoped to mac targets', () => {
  assert.match(script('electron:build:mac'), /electron-builder --mac dmg --x64 --arm64 --publish never/);
  assert.doesNotMatch(script('electron:build:mac'), /--win|--ia32/);
});

test('electron-builder Windows config uses NSIS and an existing ico icon', () => {
  const build = packageJson.build || {};
  assert.equal(build.productName, 'DeskCat');
  assert.equal(build.artifactName, '${productName}-${version}-${arch}.${ext}');
  assert.equal(build.win?.target, 'nsis');
  assert.equal(build.win?.icon, 'src-tauri/icons/icon.ico');
  assert.equal(fs.existsSync(path.join(rootDir, build.win.icon)), true);
});

test('packaged files include runtime dist, Electron main process, icons, and exclude tests', () => {
  const files = packageJson.build?.files || [];
  assert.equal(files.includes('dist/**'), true);
  assert.equal(files.includes('electron/**'), true);
  assert.equal(files.includes('src-tauri/icons/icon.png'), true);
  assert.equal(files.includes('src-tauri/icons/32x32.png'), true);
  assert.equal(files.includes('package.json'), true);
  assert.equal(files.includes('!electron/**/*.test.cjs'), true);
  assert.equal(files.includes('!electron/**/*.test.js'), true);
});
