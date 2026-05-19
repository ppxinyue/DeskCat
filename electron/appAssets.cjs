const fs = require('node:fs/promises');
const path = require('node:path');

function resolveDeskcatAppPath({ appPath, requestUrl }) {
  const url = new URL(requestUrl);
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  return path.join(appPath, 'dist', pathname.replace(/^\/+/, ''));
}

function runtimePetAssetFallbackCandidates({ appPath, filePath }) {
  const candidates = [filePath];
  const distDir = path.join(appPath, 'dist');
  const relative = path.relative(distDir, filePath);
  const normalized = relative.replace(/\\/g, '/');
  if (!/^(?:assets)\/(?:idle|rest|work)\/.+\.webp$/i.test(normalized)) return candidates;

  const gifRelative = relative.replace(/\.webp$/i, '.GIF');
  candidates.push(path.join(distDir, gifRelative));
  candidates.push(path.join(appPath, 'public', gifRelative));
  return Array.from(new Set(candidates));
}

async function readDeskcatAppFile({ appPath, requestUrl, readFile = fs.readFile }) {
  const filePath = resolveDeskcatAppPath({ appPath, requestUrl });
  const candidates = runtimePetAssetFallbackCandidates({ appPath, filePath });
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return {
        filePath: candidate,
        bytes: await readFile(candidate),
      };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error(`Unable to read DeskCat app asset: ${filePath}`);
}

module.exports = {
  readDeskcatAppFile,
  resolveDeskcatAppPath,
  runtimePetAssetFallbackCandidates,
};
