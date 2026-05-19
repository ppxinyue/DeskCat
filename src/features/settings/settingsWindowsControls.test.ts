import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const settingsSource = fs.readFileSync(path.resolve('src', 'features', 'settings', 'SettingsPanel.tsx'), 'utf8');
const cssSource = fs.readFileSync(path.resolve('src', 'index.css'), 'utf8');

test('custom avatar scheme controls prefer image before GIF and use Windows pointer-down switching', () => {
  const imageOptionIndex = settingsSource.indexOf("{ id: 'image' as const");
  const gifOptionIndex = settingsSource.indexOf("{ id: 'gif' as const");

  assert.ok(imageOptionIndex >= 0);
  assert.ok(gifOptionIndex >= 0);
  assert.ok(imageOptionIndex < gifOptionIndex);
  assert.match(settingsSource, /handleWindowsSchemePointerDown/);
  assert.match(settingsSource, /onPointerDown=\{\(event\) => handleWindowsSchemePointerDown\(event, option\.id\)\}/);
});

test('custom avatar state controls use Windows pointer-down switching and stronger active styling', () => {
  assert.match(settingsSource, /handleWindowsStatePointerDown/);
  assert.match(settingsSource, /onPointerDown=\{\(event\) => handleWindowsStatePointerDown\(event, state\)\}/);
  assert.match(settingsSource, /bg-\[#1f8fff\] text-white/);
});

test('Windows timeline has a larger range control for horizontal scrolling', () => {
  assert.match(settingsSource, /isWindowsTimeline && timelineMaxScrollLeft > 2/);
  assert.match(settingsSource, /className="timeline-scroll-range"/);
  assert.match(cssSource, /\.timeline-scroll-range/);
});

test('pet name input uses deferred commit to avoid interrupting IME composition', () => {
  assert.match(settingsSource, /deferCommit\?: boolean/);
  assert.match(settingsSource, /onCompositionStart/);
  assert.match(settingsSource, /onCompositionEnd/);
  assert.match(settingsSource, /if \(!composingRef\.current\) onChange\(nextValue\)/);
  assert.match(settingsSource, /value=\{settings\.petName\}[\s\S]*?deferCommit/);
});

test('general settings no longer render disabled destructive cleanup actions', () => {
  assert.doesNotMatch(settingsSource, /<Button variant="destructive" size="sm" disabled>/);
  assert.doesNotMatch(settingsSource, /清除所有对话历史/);
  assert.doesNotMatch(settingsSource, /删除所有 API 配置/);
  assert.doesNotMatch(settingsSource, /导出对话资料 \(JSON\)/);
});
