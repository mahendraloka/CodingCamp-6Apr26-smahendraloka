/**
 * Feature: todo-life-dashboard
 * Property 1: Format waktu selalu HH:MM
 * Property 2: Format tanggal mengandung nama hari Bahasa Indonesia yang benar
 * Property 3: Sapaan sesuai rentang jam
 * Property 4: Sapaan mengandung nama pengguna
 * Property 5: Round-trip penyimpanan nama pengguna
 * Unit test: Sapaan tanpa nama saat storage kosong (kriteria 1.9)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline GreetingWidget logic (mirrors app.js) — runs in Node without DOM
// ---------------------------------------------------------------------------

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDate(date) {
  const dayName = DAYS_ID[date.getDay()];
  const day = date.getDate();
  const monthName = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Selamat Pagi';
  if (hour >= 12 && hour <= 14) return 'Selamat Siang';
  if (hour >= 15 && hour <= 17) return 'Selamat Sore';
  return 'Selamat Malam';
}

/** Minimal StorageService shim backed by a plain object */
function makeStorageService(initialStore = {}) {
  const _store = { ...initialStore };
  const USERNAME_KEY = 'tld_username';

  function get(key) {
    try {
      const raw = Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null;
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(key, value) {
    try { _store[key] = JSON.stringify(value); } catch { /* ignore */ }
  }

  return { get, set, USERNAME_KEY, _store };
}

/** Build a greeting string the same way render() does */
function buildGreetingText(hour, username) {
  const greeting = getGreeting(hour);
  return username ? `${greeting}, ${username}` : greeting;
}

// ---------------------------------------------------------------------------
// Property 1: formatTime selalu HH:MM
// ---------------------------------------------------------------------------
describe('GreetingWidget — Property 1: Format waktu selalu HH:MM', () => {
  // Feature: todo-life-dashboard, Property 1: Format waktu selalu HH:MM
  it('[PBT] formatTime(date) selalu mengembalikan string HH:MM yang sesuai dengan jam dan menit date', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = formatTime(date);

          // Must match HH:MM pattern
          expect(result).toMatch(/^\d{2}:\d{2}$/);

          // Values must match the date
          const [hh, mm] = result.split(':').map(Number);
          expect(hh).toBe(date.getHours());
          expect(mm).toBe(date.getMinutes());
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: formatDate mengandung nama hari Bahasa Indonesia yang benar
// ---------------------------------------------------------------------------
describe('GreetingWidget — Property 2: Format tanggal mengandung nama hari Bahasa Indonesia', () => {
  // Feature: todo-life-dashboard, Property 2: Format tanggal mengandung nama hari Bahasa Indonesia yang benar
  it('[PBT] formatDate(date) selalu mengandung nama hari Bahasa Indonesia yang sesuai dengan hari date', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = formatDate(date);
          const expectedDay = DAYS_ID[date.getDay()];
          expect(result).toContain(expectedDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] formatDate(date) selalu mengandung nama bulan Bahasa Indonesia yang sesuai', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = formatDate(date);
          const expectedMonth = MONTHS_ID[date.getMonth()];
          expect(result).toContain(expectedMonth);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: getGreeting sesuai rentang jam
// ---------------------------------------------------------------------------
describe('GreetingWidget — Property 3: Sapaan sesuai rentang jam', () => {
  const VALID_GREETINGS = ['Selamat Pagi', 'Selamat Siang', 'Selamat Sore', 'Selamat Malam'];

  // Feature: todo-life-dashboard, Property 3: Sapaan sesuai rentang jam
  it('[PBT] getGreeting(hour) mengembalikan salah satu dari empat sapaan yang valid untuk semua jam 0-23', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const result = getGreeting(hour);
          expect(VALID_GREETINGS).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] jam 5-11 selalu menghasilkan "Selamat Pagi"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 11 }),
        (hour) => {
          expect(getGreeting(hour)).toBe('Selamat Pagi');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] jam 12-14 selalu menghasilkan "Selamat Siang"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 14 }),
        (hour) => {
          expect(getGreeting(hour)).toBe('Selamat Siang');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] jam 15-17 selalu menghasilkan "Selamat Sore"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 15, max: 17 }),
        (hour) => {
          expect(getGreeting(hour)).toBe('Selamat Sore');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] jam 18-23 dan 0-4 selalu menghasilkan "Selamat Malam"', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 18, max: 23 }), fc.integer({ min: 0, max: 4 })),
        (hour) => {
          expect(getGreeting(hour)).toBe('Selamat Malam');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Sapaan mengandung nama pengguna
// ---------------------------------------------------------------------------
describe('GreetingWidget — Property 4: Sapaan mengandung nama pengguna', () => {
  // Feature: todo-life-dashboard, Property 4: Sapaan mengandung nama pengguna
  it('[PBT] string sapaan selalu mengandung nama pengguna yang valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.string().filter(s => s.trim().length > 0),
        (hour, username) => {
          const text = buildGreetingText(hour, username);
          expect(text).toContain(username);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Round-trip penyimpanan nama pengguna
// ---------------------------------------------------------------------------
describe('GreetingWidget — Property 5: Round-trip penyimpanan nama pengguna', () => {
  // Feature: todo-life-dashboard, Property 5: Round-trip penyimpanan nama pengguna
  it('[PBT] saveName(name) kemudian get(USERNAME_KEY) mengembalikan nilai identik', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        (name) => {
          const svc = makeStorageService();
          // Simulate saveName: StorageService.set(KEYS.USERNAME, name)
          svc.set(svc.USERNAME_KEY, name);
          const stored = svc.get(svc.USERNAME_KEY);
          expect(stored).toBe(name);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit test: Sapaan tanpa nama saat storage kosong (kriteria 1.9)
// ---------------------------------------------------------------------------
describe('GreetingWidget — Kriteria 1.9: Sapaan tanpa nama saat storage kosong', () => {
  it('menampilkan sapaan tanpa nama ketika storage tidak mengandung username', () => {
    const svc = makeStorageService(); // empty store
    const username = svc.get(svc.USERNAME_KEY);
    expect(username).toBeNull();

    // Greeting text should not contain a comma (no name appended)
    const text = buildGreetingText(9, username);
    expect(text).toBe('Selamat Pagi');
    expect(text).not.toContain(',');
  });

  it('menampilkan sapaan tanpa nama untuk setiap rentang waktu saat storage kosong', () => {
    const svc = makeStorageService();
    const username = svc.get(svc.USERNAME_KEY);

    expect(buildGreetingText(5, username)).toBe('Selamat Pagi');
    expect(buildGreetingText(12, username)).toBe('Selamat Siang');
    expect(buildGreetingText(15, username)).toBe('Selamat Sore');
    expect(buildGreetingText(20, username)).toBe('Selamat Malam');
  });

  it('menampilkan sapaan dengan nama setelah username disimpan ke storage', () => {
    const svc = makeStorageService();
    svc.set(svc.USERNAME_KEY, 'Budi');
    const username = svc.get(svc.USERNAME_KEY);
    expect(username).toBe('Budi');

    const text = buildGreetingText(9, username);
    expect(text).toBe('Selamat Pagi, Budi');
  });
});
