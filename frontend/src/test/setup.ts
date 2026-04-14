import '@testing-library/jest-dom/vitest';

class MockFontFaceSet extends EventTarget {
  ready = Promise.resolve(this);
}

Object.defineProperty(document, 'fonts', {
  configurable: true,
  value: new MockFontFaceSet(),
});
