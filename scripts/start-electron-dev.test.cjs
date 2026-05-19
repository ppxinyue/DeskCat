const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_DEV_SERVER_URL,
  createElectronDevArgs,
  createElectronDevEnv,
} = require('./start-electron-dev.cjs');

test('Electron dev environment sets the Vite dev server URL cross-platform', () => {
  const env = createElectronDevEnv({ PATH: 'test-path' });

  assert.equal(env.PATH, 'test-path');
  assert.equal(env.VITE_DEV_SERVER_URL, DEFAULT_DEV_SERVER_URL);
});

test('Electron dev environment preserves an explicit dev server URL override', () => {
  const env = createElectronDevEnv({ VITE_DEV_SERVER_URL: 'http://localhost:7777' });

  assert.equal(env.VITE_DEV_SERVER_URL, 'http://localhost:7777');
});

test('Electron dev command uses the Node CLI entry instead of shell env assignment', () => {
  const args = createElectronDevArgs('.');

  assert.equal(args[1], '.');
  assert.match(args[0], /electron[\\/]cli\.js$/);
});
