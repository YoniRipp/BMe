import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom does not implement pointer capture; Radix UI Select (and others) call these
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.setPointerCapture = function () {};
  Element.prototype.releasePointerCapture = function () {};
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
}

// jsdom has limited scrollIntoView; Radix Select calls it
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function () {};
}

// jsdom does not implement ResizeObserver; Radix and charts use it
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// jsdom does not implement Notification; NotificationContext reads Notification.permission
const NotificationStub = { permission: 'denied' as const, requestPermission: () => Promise.resolve('denied') };
if (typeof (globalThis as any).Notification === 'undefined') {
  (globalThis as any).Notification = NotificationStub;
} else if (!(globalThis as any).Notification.permission) {
  (globalThis as any).Notification.permission = 'denied';
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
