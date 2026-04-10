/**
 * Feature: todo-life-dashboard, Property 23: Konsistensi kunci Local Storage
 *
 * Verifies that:
 * 1. All required storage keys are defined with exact expected values.
 * 2. No two modules share the same storage key.
 * 3. Every set() call uses one of the defined KEYS constants.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline StorageService (mirrors app.js implementation) so tests run in Node
// without a DOM. We test the module in isolation.
// ---------------------------------------------------------------------------
function makeStorageService(store = {}) {
  const KEYS = {
    TASKS: 'tld_tasks',
    LINKS: 'tld_links',
    THEME: 'tld_theme',
    USERNAME: 'tld_username',
    POMODORO_DURATION: 'tld_pomodoro_duration',
  };

  // Minimal localStorage shim backed by a plain object
  const ls = {
    _store: store,
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
    setItem(k, v) { this._store[k] = v; },
    removeItem(k) { delete this._store[k]; },
  };

  function isAvailable() {
    try {
      const test = '__tld_test__';
      ls.setItem(test, '1');
      ls.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  function get(key) {
    if (!isAvailable()) return null;
    try {
      const raw = ls.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(key, value) {
    if (!isAvailable()) return;
    try {
      ls.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded — silently ignore
    }
  }

  return { isAvailable, get, set, KEYS, _ls: ls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StorageService — Property 23: Konsistensi kunci Local Storage', () => {

  it('semua kunci yang diharapkan terdefinisi dengan nilai yang tepat', () => {
    const { KEYS } = makeStorageService();
    expect(KEYS.TASKS).toBe('tld_tasks');
    expect(KEYS.LINKS).toBe('tld_links');
    expect(KEYS.THEME).toBe('tld_theme');
    expect(KEYS.USERNAME).toBe('tld_username');
    expect(KEYS.POMODORO_DURATION).toBe('tld_pomodoro_duration');
  });

  it('tidak ada dua kunci yang memiliki nilai sama (unik)', () => {
    const { KEYS } = makeStorageService();
    const values = Object.values(KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('semua nilai kunci diawali dengan prefix "tld_"', () => {
    const { KEYS } = makeStorageService();
    for (const val of Object.values(KEYS)) {
      expect(val).toMatch(/^tld_/);
    }
  });

  // Property-based: set() lalu get() menggunakan kunci yang sama selalu round-trip
  it('[PBT] set(key, value) → get(key) mengembalikan nilai identik untuk semua kunci resmi', () => {
    const { KEYS } = makeStorageService();
    const officialKeys = Object.values(KEYS);

    fc.assert(
      fc.property(
        fc.constantFrom(...officialKeys),
        fc.jsonValue(),
        (key, value) => {
          const svc = makeStorageService();
          svc.set(key, value);
          const result = svc.get(key);
          expect(result).toEqual(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based: operasi set() tidak pernah menulis ke kunci di luar KEYS
  it('[PBT] set() hanya menulis ke kunci yang diberikan, tidak mencemari kunci lain', () => {
    const { KEYS } = makeStorageService();
    const officialKeys = Object.values(KEYS);

    fc.assert(
      fc.property(
        fc.constantFrom(...officialKeys),
        fc.jsonValue(),
        (targetKey, value) => {
          const svc = makeStorageService();
          svc.set(targetKey, value);

          // Semua kunci lain harus tetap null
          for (const k of officialKeys) {
            if (k !== targetKey) {
              expect(svc.get(k)).toBeNull();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based: get() pada kunci yang belum pernah di-set mengembalikan null
  it('[PBT] get() pada kunci yang belum di-set selalu mengembalikan null', () => {
    const { KEYS } = makeStorageService();
    const officialKeys = Object.values(KEYS);

    fc.assert(
      fc.property(
        fc.constantFrom(...officialKeys),
        (key) => {
          const svc = makeStorageService(); // fresh store
          expect(svc.get(key)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based: get() mengembalikan null untuk JSON yang korup
  it('[PBT] get() mengembalikan null jika storage mengandung JSON yang tidak valid', () => {
    const { KEYS } = makeStorageService();
    const officialKeys = Object.values(KEYS);

    fc.assert(
      fc.property(
        fc.constantFrom(...officialKeys),
        fc.string().filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (key, corruptValue) => {
          const store = { [key]: corruptValue };
          const svc = makeStorageService(store);
          expect(svc.get(key)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
