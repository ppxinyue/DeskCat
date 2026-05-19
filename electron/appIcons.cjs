const path = require('node:path');

function bundledIconCandidates(appPath, { platform = process.platform, fallbackIconPath = '' } = {}) {
  const windowsCandidates = [
    path.join(appPath, 'src-tauri', 'icons', 'icon.ico'),
    path.join(appPath, 'src-tauri', 'icons', 'Square44x44Logo.png'),
    path.join(appPath, 'src-tauri', 'icons', '32x32.png'),
    path.join(appPath, 'src-tauri', 'icons', 'icon.png'),
    fallbackIconPath,
  ].filter(Boolean);

  const defaultCandidates = [
    path.join(appPath, 'public', 'assets', 'idle', 'png', 'idle.png'),
    path.join(appPath, 'src-tauri', 'icons', '32x32.png'),
    path.join(appPath, 'src-tauri', 'icons', 'icon.png'),
    fallbackIconPath,
    path.join(appPath, 'dist', 'favicon.svg'),
    path.join(appPath, 'public', 'favicon.svg'),
  ].filter(Boolean);

  return platform === 'win32' ? windowsCandidates : defaultCandidates;
}

function shouldUseNativeWindowsIcon(iconPath, platform = process.platform) {
  return platform === 'win32' && String(iconPath || '').toLowerCase().endsWith('.ico');
}

function shouldHideApplicationMenu(platform = process.platform) {
  return platform === 'win32';
}

module.exports = {
  bundledIconCandidates,
  shouldHideApplicationMenu,
  shouldUseNativeWindowsIcon,
};
