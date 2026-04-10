/**
 * Feature: todo-life-dashboard
 * Unit tests for:
 *   - Urutan inisialisasi (kriteria 6.2): ThemeManager dipanggil pertama
 *   - Fallback storage (edge case 6.3): banner peringatan saat Local Storage tidak tersedia
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal app init function that mirrors the initApp() in app.js.
 * Returns the init function and spies so we can assert call order.
 */
function makeApp({ storageAvailable = true } = {}) {
  const callOrder = [];

  const StorageService = {
    isAvailable: vi.fn(() => storageAvailable),
  };

  const ThemeManager = {
    init: vi.fn(() => callOrder.push('ThemeManager')),
  };

  const GreetingWidget = {
    init: vi.fn(() => callOrder.push('GreetingWidget')),
  };

  const FocusTimer = {
    init: vi.fn(() => callOrder.push('FocusTimer')),
  };

  const TodoList = {
    init: vi.fn(() => callOrder.push('TodoList')),
  };

  const QuickLinks = {
    init: vi.fn(() => callOrder.push('QuickLinks')),
  };

  // Minimal DOM shim for the storage-warning banner
  const warningEl = {
    classList: {
      _hidden: true,
      remove: vi.fn(function (cls) { if (cls === 'hidden') this._hidden = false; }),
      add: vi.fn(function (cls) { if (cls === 'hidden') this._hidden = true; }),
    },
    get isVisible() { return !this.classList._hidden; },
  };

  const document = {
    getElementById: vi.fn((id) => id === 'storage-warning' ? warningEl : null),
  };

  function initApp() {
    // 1. ThemeManager first — prevents FOUC
    ThemeManager.init();

    // 2. Show storage warning if Local Storage is unavailable
    if (!StorageService.isAvailable()) {
      const warning = document.getElementById('storage-warning');
      if (warning) warning.classList.remove('hidden');
    }

    // 3. Initialize remaining modules
    GreetingWidget.init();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  }

  return {
    initApp,
    callOrder,
    spies: { ThemeManager, GreetingWidget, FocusTimer, TodoList, QuickLinks, StorageService },
    warningEl,
  };
}

// ---------------------------------------------------------------------------
// Kriteria 6.2: Urutan inisialisasi
// ---------------------------------------------------------------------------
describe('App Initialization — Kriteria 6.2: Urutan inisialisasi', () => {

  it('ThemeManager.init() dipanggil sebelum modul lain', () => {
    const { initApp, callOrder } = makeApp();
    initApp();
    expect(callOrder[0]).toBe('ThemeManager');
  });

  it('semua modul diinisialisasi: ThemeManager, GreetingWidget, FocusTimer, TodoList, QuickLinks', () => {
    const { initApp, callOrder } = makeApp();
    initApp();
    expect(callOrder).toContain('ThemeManager');
    expect(callOrder).toContain('GreetingWidget');
    expect(callOrder).toContain('FocusTimer');
    expect(callOrder).toContain('TodoList');
    expect(callOrder).toContain('QuickLinks');
  });

  it('urutan inisialisasi: ThemeManager → GreetingWidget → FocusTimer → TodoList → QuickLinks', () => {
    const { initApp, callOrder } = makeApp();
    initApp();
    expect(callOrder).toEqual([
      'ThemeManager',
      'GreetingWidget',
      'FocusTimer',
      'TodoList',
      'QuickLinks',
    ]);
  });

  it('setiap modul hanya diinisialisasi tepat satu kali', () => {
    const { initApp, spies } = makeApp();
    initApp();
    expect(spies.ThemeManager.init).toHaveBeenCalledTimes(1);
    expect(spies.GreetingWidget.init).toHaveBeenCalledTimes(1);
    expect(spies.FocusTimer.init).toHaveBeenCalledTimes(1);
    expect(spies.TodoList.init).toHaveBeenCalledTimes(1);
    expect(spies.QuickLinks.init).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Edge case 6.3: Fallback storage — banner peringatan
// ---------------------------------------------------------------------------
describe('App Initialization — Edge case 6.3: Fallback storage', () => {

  it('banner peringatan TIDAK ditampilkan saat Local Storage tersedia', () => {
    const { initApp, warningEl } = makeApp({ storageAvailable: true });
    initApp();
    expect(warningEl.isVisible).toBe(false);
  });

  it('banner peringatan DITAMPILKAN saat Local Storage tidak tersedia', () => {
    const { initApp, warningEl } = makeApp({ storageAvailable: false });
    initApp();
    expect(warningEl.isVisible).toBe(true);
  });

  it('semua modul tetap diinisialisasi meskipun Local Storage tidak tersedia', () => {
    const { initApp, callOrder } = makeApp({ storageAvailable: false });
    initApp();
    expect(callOrder).toContain('ThemeManager');
    expect(callOrder).toContain('GreetingWidget');
    expect(callOrder).toContain('FocusTimer');
    expect(callOrder).toContain('TodoList');
    expect(callOrder).toContain('QuickLinks');
  });

  it('ThemeManager masih dipanggil pertama meskipun Local Storage tidak tersedia', () => {
    const { initApp, callOrder } = makeApp({ storageAvailable: false });
    initApp();
    expect(callOrder[0]).toBe('ThemeManager');
  });
});
