const { execFile, spawn } = require('node:child_process');

function createWorkspaceElectronCleanupScript(workspacePath = process.cwd()) {
  const escapedWorkspace = String(workspacePath).replace(/'/g, "''");
  return `
$workspace = '${escapedWorkspace}'
Get-Process -Name electron -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    if ($_.Path -and $_.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
      Stop-Process -Id $_.Id -Force
    }
  } catch {}
}
`;
}

function cleanupWorkspaceElectronProcesses({
  platform = process.platform,
  workspacePath = process.cwd(),
  execFileFn = execFile,
  log = console.warn,
} = {}) {
  if (platform !== 'win32') return Promise.resolve(false);
  return new Promise((resolve) => {
    execFileFn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', createWorkspaceElectronCleanupScript(workspacePath)],
      { timeout: 5000 },
      (error, _stdout, stderr) => {
        if (error) {
          log?.(`[start-electron-prod] unable to clean stale Electron processes: ${stderr || error.message}`);
          resolve(false);
          return;
        }
        resolve(true);
      },
    );
  });
}

function createElectronProdArgs(appPath = '.') {
  return [require.resolve('electron/cli.js'), appPath];
}

async function startElectronProd({ env = process.env, appPath = '.', stdio = 'inherit' } = {}) {
  await cleanupWorkspaceElectronProcesses();
  const child = spawn(process.execPath, createElectronProdArgs(appPath), {
    env,
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
  startElectronProd();
}

module.exports = {
  cleanupWorkspaceElectronProcesses,
  createElectronProdArgs,
  createWorkspaceElectronCleanupScript,
  startElectronProd,
};
