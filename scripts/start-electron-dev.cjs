const { spawn } = require('node:child_process');
const { cleanupWorkspaceElectronProcesses } = require('./start-electron-prod.cjs');

const DEFAULT_DEV_SERVER_URL = 'http://127.0.0.1:5173';

function createElectronDevEnv(baseEnv = process.env, devServerUrl = DEFAULT_DEV_SERVER_URL) {
  return {
    ...baseEnv,
    VITE_DEV_SERVER_URL: baseEnv.VITE_DEV_SERVER_URL || devServerUrl,
  };
}

function createElectronDevArgs(appPath = '.') {
  return [require.resolve('electron/cli.js'), appPath];
}

async function startElectronDev({
  env = process.env,
  appPath = '.',
  stdio = 'inherit',
  cleanup = cleanupWorkspaceElectronProcesses,
  spawnFn = spawn,
} = {}) {
  await cleanup();
  const child = spawnFn(process.execPath, createElectronDevArgs(appPath), {
    env: createElectronDevEnv(env),
    stdio,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });

  return child;
}

if (require.main === module) {
  startElectronDev();
}

module.exports = {
  DEFAULT_DEV_SERVER_URL,
  createElectronDevArgs,
  createElectronDevEnv,
  startElectronDev,
};
