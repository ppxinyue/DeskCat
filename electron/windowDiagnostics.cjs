function windowSnapshot(win) {
  if (!win || win.isDestroyed?.()) return { exists: false };
  return {
    exists: true,
    visible: Boolean(win.isVisible?.()),
    focused: Boolean(win.isFocused?.()),
    alwaysOnTop: Boolean(win.isAlwaysOnTop?.()),
    bounds: typeof win.getBounds === 'function' ? win.getBounds() : null,
  };
}

function rectsIntersect(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function isBoundsVisibleOnDisplays(bounds, displays) {
  if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return false;
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  return (displays || []).some((display) => rectsIntersect(bounds, display.workArea || display.bounds));
}

function createPetWindowDebugInfo({ petWindow, compactWindow, displays, visibilityState }) {
  const pet = windowSnapshot(petWindow);
  return {
    pet,
    compactChat: windowSnapshot(compactWindow),
    visibility: visibilityState || null,
    displays: (displays || []).map((display) => ({
      id: display.id,
      scaleFactor: display.scaleFactor,
      bounds: display.bounds,
      workArea: display.workArea,
    })),
    petBoundsVisibleOnDisplay: pet.exists ? isBoundsVisibleOnDisplays(pet.bounds, displays) : false,
  };
}

module.exports = {
  createPetWindowDebugInfo,
  isBoundsVisibleOnDisplays,
  rectsIntersect,
  windowSnapshot,
};
