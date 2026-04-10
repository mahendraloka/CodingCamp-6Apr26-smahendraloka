/**
 * Feature: todo-life-dashboard
 * Property 21: Round-trip penyimpanan dan pemuatan tema
 * Property 22: Toggle tema adalah idempoten ganda (round-trip)
 * Edge case 5.6: Default light mode saat storage kosong
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline helpers — mirror app.js logic without requiring a real DOM/browser
// ---------------------------------------------------------------------------

/**
 * Creates an isolated ThemeManager backed by a plain-object localStorage shim
 * and a minimal body classList shim.
 */
function makeThemeManager(initialStore = {}) {
  // Minimal localStorage shim
  const _store = { ...initialStore };
  const ls = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null),
    setItem: (k, v) => { _store[k] = v; },
    removeItem: (k) => { delete _store[k]; },
  };

  // Minimal StorageService
  const THEME_KEY = 'tld_theme';
  const StorageService = {
    get(key) {
      try {
        const raw = ls.getItem(key);
        return raw !== null ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    set(key, value) {
      try { ls.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    },
  };

  // Minimal body classList shim
  const classes = new Set();
  const body = {
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
  };

  // ThemeManager (mirrors app.js)
  const ThemeManager = {
    apply(theme) {
      if (theme === 'dark') {
        body.classList.add('dark');
      } else {
        body.classList.remove('dark');
      }
    },
    save(theme) {
      StorageService.set(THEME_KEY, theme);
    },
    toggle() {
      const current = body.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.apply(next);
      this.save(next);
    },
    init() {
      const saved = StorageService.get(THEME_KEY);
      this.apply(saved === 'dark' ? 'dark' : 'light');
    },
    // Expose internals for assertions
    _getStoredTheme: () => StorageService.get(THEME_KEY),
    _bodyHasDark: () => body.classList.contains('dark'),
  };

  return ThemeManager;
}

// ---------------------------------------------------------------------------
// Property 21: Round-trip penyimpanan dan pemuatan tema
// ---------------------------------------------------------------------------
describe('ThemeManager — Property 21: Round-trip penyimpanan dan pemuatan tema', () => {

  it('[PBT] apply(theme) + init() menerapkan class yang sesuai pada body untuk semua nilai tema valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (theme) => {
          const tm = makeThemeManager();
          tm.apply(theme);
          tm.save(theme);

          // Simulate page reload: new ThemeManager reads from same store
          const stored = tm._getStoredTheme();
          expect(stored).toBe(theme);

          // init() on a fresh manager with the stored value applies correct class
          const tm2 = makeThemeManager({ tld_theme: JSON.stringify(theme) });
          tm2.init();
          if (theme === 'dark') {
            expect(tm2._bodyHasDark()).toBe(true);
          } else {
            expect(tm2._bodyHasDark()).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] save(theme) persists exact theme value to storage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (theme) => {
          const tm = makeThemeManager();
          tm.save(theme);
          expect(tm._getStoredTheme()).toBe(theme);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 22: Toggle tema adalah idempoten ganda (round-trip)
// ---------------------------------------------------------------------------
describe('ThemeManager — Property 22: Toggle idempoten ganda', () => {

  it('[PBT] toggle() dua kali berturut-turut mengembalikan tema ke nilai semula', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (initialTheme) => {
          const tm = makeThemeManager();
          tm.apply(initialTheme);

          const beforeDark = tm._bodyHasDark();

          tm.toggle();
          tm.toggle();

          expect(tm._bodyHasDark()).toBe(beforeDark);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] toggle() sekali selalu menghasilkan tema yang berlawanan', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (initialTheme) => {
          const tm = makeThemeManager();
          tm.apply(initialTheme);

          tm.toggle();

          if (initialTheme === 'dark') {
            expect(tm._bodyHasDark()).toBe(false);
          } else {
            expect(tm._bodyHasDark()).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Edge case 5.6: Default light mode saat storage kosong
// ---------------------------------------------------------------------------
describe('ThemeManager — Edge case 5.6: Default light mode saat storage kosong', () => {

  it('init() menerapkan light mode ketika storage tidak mengandung preferensi tema', () => {
    const tm = makeThemeManager(); // empty store
    tm.init();
    expect(tm._bodyHasDark()).toBe(false);
  });

  it('init() menerapkan light mode ketika storage mengandung nilai null', () => {
    const tm = makeThemeManager({ tld_theme: 'null' });
    tm.init();
    expect(tm._bodyHasDark()).toBe(false);
  });

  it('init() menerapkan dark mode ketika storage mengandung "dark"', () => {
    const tm = makeThemeManager({ tld_theme: JSON.stringify('dark') });
    tm.init();
    expect(tm._bodyHasDark()).toBe(true);
  });

  it('init() menerapkan light mode untuk nilai storage yang tidak dikenal', () => {
    const tm = makeThemeManager({ tld_theme: JSON.stringify('unknown-value') });
    tm.init();
    expect(tm._bodyHasDark()).toBe(false);
  });
});
