const DESKCAT_FILE_ORIGIN = 'deskcat-file://local/';

function encodeFilePathPayload(filePath) {
  return Buffer.from(String(filePath || ''), 'utf8').toString('base64url');
}

function decodeFilePathPayload(payload) {
  return Buffer.from(String(payload || ''), 'base64url').toString('utf8');
}

function encodeDeskcatFileUrl(filePath) {
  return `${DESKCAT_FILE_ORIGIN}${encodeFilePathPayload(filePath)}`;
}

function decodeLegacyDeskcatFileUrl(url) {
  const parsed = new URL(url);
  const decodedPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  if (/^[A-Za-z]:\//.test(decodedPath)) return decodedPath.replace(/\//g, '\\');
  return decodedPath;
}

function decodeDeskcatFileUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'deskcat-file:') throw new Error('Invalid DeskCat file URL scheme');
  if (parsed.hostname === 'local') {
    const payload = parsed.pathname.replace(/^\/+/, '');
    if (!payload) throw new Error('Missing DeskCat file URL payload');
    return decodeFilePathPayload(payload);
  }
  return decodeLegacyDeskcatFileUrl(url);
}

module.exports = {
  decodeDeskcatFileUrl,
  decodeFilePathPayload,
  encodeDeskcatFileUrl,
  encodeFilePathPayload,
};
