const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  readDeskcatAppFile,
  resolveDeskcatAppPath,
  runtimePetAssetFallbackCandidates,
} = require('./appAssets.cjs');

const appPath = path.resolve('D:/DeskCat');

test('resolves deskcat-app URLs into dist files', () => {
  assert.equal(
    resolveDeskcatAppPath({ appPath, requestUrl: 'deskcat-app://localhost/assets/rest/gif/idle_raw_1.webp' }),
    path.join(appPath, 'dist', 'assets', 'rest', 'gif', 'idle_raw_1.webp'),
  );
  assert.equal(
    resolveDeskcatAppPath({ appPath, requestUrl: 'deskcat-app://localhost/' }),
    path.join(appPath, 'dist', 'index.html'),
  );
});

test('runtime pet WebP assets can fall back to source GIFs in development', () => {
  const filePath = path.join(appPath, 'dist', 'assets', 'rest', 'gif', 'idle_raw_1.webp');

  assert.deepEqual(runtimePetAssetFallbackCandidates({ appPath, filePath }), [
    filePath,
    path.join(appPath, 'dist', 'assets', 'rest', 'gif', 'idle_raw_1.GIF'),
    path.join(appPath, 'public', 'assets', 'rest', 'gif', 'idle_raw_1.GIF'),
  ]);
});

test('readDeskcatAppFile falls back when optimized WebP is missing', async () => {
  const calls = [];
  const result = await readDeskcatAppFile({
    appPath,
    requestUrl: 'deskcat-app://localhost/assets/rest/gif/idle_raw_1.webp',
    readFile: async (filePath) => {
      calls.push(filePath);
      if (/\.webp$/i.test(filePath)) {
        const error = new Error('missing');
        error.code = 'ENOENT';
        throw error;
      }
      return Buffer.from('gif-bytes');
    },
  });

  assert.equal(result.bytes.toString(), 'gif-bytes');
  assert.equal(result.filePath, path.join(appPath, 'dist', 'assets', 'rest', 'gif', 'idle_raw_1.GIF'));
  assert.equal(calls.length, 2);
});
