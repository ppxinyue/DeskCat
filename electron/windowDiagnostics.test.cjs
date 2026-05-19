const assert = require('node:assert/strict');
const test = require('node:test');
const {
  clampBoundsToWorkArea,
  createPetWindowDebugInfo,
  isBoundsVisibleOnDisplays,
  rectsIntersect,
  windowSnapshot,
} = require('./windowDiagnostics.cjs');

function fakeWindow({ visible = false, focused = false, alwaysOnTop = false, bounds = { x: 0, y: 0, width: 100, height: 100 }, destroyed = false } = {}) {
  return {
    isDestroyed: () => destroyed,
    isVisible: () => visible,
    isFocused: () => focused,
    isAlwaysOnTop: () => alwaysOnTop,
    getBounds: () => bounds,
  };
}

test('window snapshot fails closed for missing or destroyed windows', () => {
  assert.deepEqual(windowSnapshot(null), { exists: false });
  assert.deepEqual(windowSnapshot(fakeWindow({ destroyed: true })), { exists: false });
});

test('window snapshot reports common visibility fields', () => {
  assert.deepEqual(windowSnapshot(fakeWindow({
    visible: true,
    focused: true,
    alwaysOnTop: true,
    bounds: { x: 10, y: 20, width: 120, height: 150 },
  })), {
    exists: true,
    visible: true,
    focused: true,
    alwaysOnTop: true,
    bounds: { x: 10, y: 20, width: 120, height: 150 },
  });
});

test('rectangle intersection treats touching edges as outside', () => {
  assert.equal(rectsIntersect(
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 99, y: 99, width: 20, height: 20 },
  ), true);
  assert.equal(rectsIntersect(
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 100, y: 100, width: 20, height: 20 },
  ), false);
});

test('bounds visibility supports multi-monitor and negative coordinates', () => {
  const displays = [
    { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1040 } },
    { id: 2, bounds: { x: -1280, y: 0, width: 1280, height: 1024 }, workArea: { x: -1280, y: 0, width: 1280, height: 984 } },
  ];

  assert.equal(isBoundsVisibleOnDisplays({ x: -100, y: 20, width: 80, height: 80 }, displays), true);
  assert.equal(isBoundsVisibleOnDisplays({ x: 4000, y: 20, width: 80, height: 80 }, displays), false);
  assert.equal(isBoundsVisibleOnDisplays({ x: 0, y: 0, width: 0, height: 80 }, displays), false);
});

test('clamps hidden pet bounds back inside the primary work area', () => {
  assert.deepEqual(
    clampBoundsToWorkArea(
      { x: 4000, y: -100, width: 220, height: 300 },
      { x: 0, y: 0, width: 1920, height: 1040 },
    ),
    { x: 1684, y: 16, width: 220, height: 300 },
  );
});

test('pet debug info combines window snapshots with display visibility', () => {
  const displays = [
    { id: 1, scaleFactor: 1.25, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1040 } },
  ];
  const info = createPetWindowDebugInfo({
    petWindow: fakeWindow({ visible: true, bounds: { x: 1800, y: 900, width: 220, height: 300 } }),
    compactWindow: fakeWindow({ visible: false }),
    displays,
    visibilityState: { layoutReady: true, pendingShow: false },
  });

  assert.equal(info.pet.exists, true);
  assert.equal(info.pet.visible, true);
  assert.equal(info.compactChat.exists, true);
  assert.equal(info.petBoundsVisibleOnDisplay, true);
  assert.deepEqual(info.visibility, { layoutReady: true, pendingShow: false });
  assert.equal(info.displays[0].scaleFactor, 1.25);
});
