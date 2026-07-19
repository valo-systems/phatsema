import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/*
 * Vitest runs with `globals: false`, so Testing Library cannot register its
 * automatic cleanup hook. Without this, rendered DOM accumulates across tests
 * and role queries match elements left behind by earlier cases.
 */
afterEach(() => {
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

/*
 * jsdom implements no layout engine, so a handful of DOM APIs that real
 * browsers provide are simply absent. Ark UI's state machines call them while
 * positioning menus and managing pointer capture, so without these shims every
 * Ark control throws during tests. These are environment gaps, not behaviour
 * we are stubbing out; assertions still run against real component output.
 */

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => undefined;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => undefined;
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => undefined;
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: class {
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    },
  });
}
