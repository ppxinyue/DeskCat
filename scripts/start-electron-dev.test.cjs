const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_DEV_SERVER_URL,
  createElectronDevArgs,
  createElectronDevEnv,
} = require('./start-electron-dev.cjs');
const {
  cleanupWorkspaceElectronProcesses,
  createElectronProdArgs,
  createWorkspaceElectronCleanupScript,
} = require('./start-electron-prod.cjs');

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

test('Electron prod command uses the Node CLI entry', () => {
  const args = createElectronProdArgs('.');

  assert.equal(args[1], '.');
  assert.match(args[0], /electron[\\/]cli\.js$/);
});

test('Windows prod launcher cleanup is scoped to the current workspace', () => {
  const script = createWorkspaceElectronCleanupScript('D:\\ppXinyue\\Intern\\happy_learning\\DeskCat');

  assert.match(script, /Get-Process -Name electron/);
  assert.match(script, /StartsWith\(\$workspace/);
  assert.match(script, /Stop-Process -Id/);
  assert.doesNotMatch(script, /taskkill/);
});

test('prod launcher skips stale Electron cleanup off Windows', async () => {
  const calls = [];
  const cleaned = await cleanupWorkspaceElectronProcesses({
    platform: 'darwin',
    execFileFn: () => calls.push('exec'),
  });

  assert.equal(cleaned, false);
  assert.deepEqual(calls, []);
});

test('prod launcher invokes PowerShell without profiles for Windows cleanup', async () => {
  const calls = [];
  const cleaned = await cleanupWorkspaceElectronProcesses({
    platform: 'win32',
    workspacePath: 'D:\\DeskCat',
    execFileFn: (command, args, options, callback) => {
      calls.push({ command, args, options });
      callback(null, '', '');
    },
  });

  assert.equal(cleaned, true);
  assert.equal(calls[0].command, 'powershell.exe');
  assert.deepEqual(calls[0].args.slice(0, 3), ['-NoProfile', '-ExecutionPolicy', 'Bypass']);
  assert.equal(calls[0].options.timeout, 5000);
});
