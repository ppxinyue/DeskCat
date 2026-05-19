const assert = require('node:assert/strict');
const test = require('node:test');

const {
  decodeDeskcatFileUrl,
  decodeFilePathPayload,
  encodeDeskcatFileUrl,
  encodeFilePathPayload,
} = require('./fileUrls.cjs');

test('DeskCat file URL round-trips Windows paths with Chinese characters and spaces', () => {
  const filePath = 'C:\\Users\\小猫\\Desk Cat\\头像 01.png';
  const url = encodeDeskcatFileUrl(filePath);

  assert.match(url, /^deskcat-file:\/\/local\//);
  assert.equal(decodeDeskcatFileUrl(url), filePath);
});

test('DeskCat file URL round-trips POSIX paths without changing slashes', () => {
  const filePath = '/Users/xinyue/Desk Cat/头像 01.png';

  assert.equal(decodeDeskcatFileUrl(encodeDeskcatFileUrl(filePath)), filePath);
});

test('file path payload uses URL-safe base64', () => {
  const payload = encodeFilePathPayload('C:\\tmp\\a b 中文.pdf');

  assert.equal(/[+/=]/.test(payload), false);
  assert.equal(decodeFilePathPayload(payload), 'C:\\tmp\\a b 中文.pdf');
});

test('legacy encoded Windows DeskCat file URLs remain readable', () => {
  const legacy = `deskcat-file:///${encodeURIComponent('C:\\Users\\小猫\\Desk Cat\\头像 01.png')}`;

  assert.equal(decodeDeskcatFileUrl(legacy), 'C:\\Users\\小猫\\Desk Cat\\头像 01.png');
});

test('legacy slash-style Windows URLs normalize back to Windows separators', () => {
  const legacy = 'deskcat-file:///C:/Users/%E5%B0%8F%E7%8C%AB/Desk%20Cat/file.png';

  assert.equal(decodeDeskcatFileUrl(legacy), 'C:\\Users\\小猫\\Desk Cat\\file.png');
});

test('invalid schemes are rejected', () => {
  assert.throws(() => decodeDeskcatFileUrl('file:///C:/Users/test.png'), /Invalid DeskCat file URL scheme/);
});
