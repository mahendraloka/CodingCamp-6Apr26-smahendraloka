/**
 * Feature: todo-life-dashboard
 * Property 6: Format timer selalu MM:SS
 * Property 7: Setiap tick mengurangi remainingSeconds tepat 1
 * Property 8: Reset mengembalikan timer ke durasi awal
 * Property 9: Round-trip penyimpanan durasi Pomodoro
 * Property 10: Validasi durasi Pomodoro
 * Unit tests: start/stop (kriteria 2.2, 2.3) dan notifikasi saat 00:00 (edge case 2.5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline FocusTimer logic — mirrors app.js, runs in Node without DOM
// ---------------------------------------------------------------------------

/** Minimal StorageService shim */
function makeStorageService(initialStore = {}) {
  const _store = { ...initialStore };
  const POMODORO_KEY = 'tld_pomodoro_duration';

  function get(key) {
    try {
      const raw = Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null;
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(key, value) {
    try { _store[key] = JSON.stringify(value); } catch { /* ignore */ }
  }

  return { get, set, POMODORO_KEY };
}

/** formatTime: seconds → "MM:SS" */
function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** validateDuration: returns true iff min is integer in [1, 120] */
function validateDuration(min) {
  return Number.isInteger(min) && min >= 1 && min <= 120;
}

/** saveDuration: saves to StorageService */
function saveDuration(svc, min) {
  svc.set(svc.POMODORO_KEY, min);
}

/**
 * Creates an isolated FocusTimer state machine for testing tick/reset/start/stop.
 */
function makeFocusTimer(totalSeconds = 25 * 60) {
  const state = {
    totalSeconds,
    remainingSeconds: totalSeconds,
    isRunning: false,
    intervalId: null,
  };

  const completionCalled = { count: 0 };

  function showCompletionNotice() {
    completionCalled.count += 1;
  }

  function tick() {
    if (!state.isRunning) return;
    if (state.remainingSeconds > 0) {
      state.remainingSeconds -= 1;
    }
    if (state.remainingSeconds === 0) {
      state.isRunning = false;
      state.intervalId = null;
      showCompletionNotice();
    }
  }

  function start() {
    if (state.isRunning) return;
    if (state.remainingSeconds === 0) return;
    state.isRunning = true;
    state.intervalId = 1; // simulated interval id
  }

  function stop() {
    if (!state.isRunning) return;
    state.isRunning = false;
    state.intervalId = null;
  }

  function reset() {
    stop();
    state.remainingSeconds = state.totalSeconds;
    state.isRunning = false;
  }

  return { state, tick, start, stop, reset, completionCalled };
}

// ---------------------------------------------------------------------------
// Property 6: formatTime(seconds) selalu mengembalikan string MM:SS
// ---------------------------------------------------------------------------
describe('FocusTimer — Property 6: Format timer selalu MM:SS', () => {
  // Feature: todo-life-dashboard, Property 6: Format timer selalu MM:SS
  it('[PBT] formatTime(seconds) untuk sembarang detik valid (0–7200) selalu mengembalikan pola MM:SS', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7200 }),
        (seconds) => {
          const result = formatTime(seconds);

          // Must match MM:SS pattern — MM is at least 2 digits, SS is exactly 2 digits
          expect(result).toMatch(/^\d{2,}:\d{2}$/);

          // Verify values
          const [mm, ss] = result.split(':').map(Number);
          expect(mm).toBe(Math.floor(seconds / 60));
          expect(ss).toBe(seconds % 60);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] formatTime selalu menghasilkan minimal dua digit untuk menit dan tepat dua digit untuk detik', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7200 }),
        (seconds) => {
          const result = formatTime(seconds);
          const [mm, ss] = result.split(':');
          expect(mm.length).toBeGreaterThanOrEqual(2);
          expect(ss.length).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: tick() mengurangi remainingSeconds tepat 1
// ---------------------------------------------------------------------------
describe('FocusTimer — Property 7: Setiap tick mengurangi remainingSeconds tepat 1', () => {
  // Feature: todo-life-dashboard, Property 7: Setiap tick mengurangi remainingSeconds tepat 1
  it('[PBT] tick() dengan isRunning=true dan remainingSeconds>0 selalu mengurangi remainingSeconds tepat 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7200 }), // remainingSeconds > 0
        fc.integer({ min: 1, max: 7200 }), // totalSeconds
        (remaining, total) => {
          const timer = makeFocusTimer(total);
          timer.state.remainingSeconds = remaining;
          timer.state.isRunning = true;

          const before = timer.state.remainingSeconds;
          timer.tick();
          const after = timer.state.remainingSeconds;

          expect(before - after).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] tick() dengan isRunning=false tidak mengubah remainingSeconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7200 }),
        (remaining) => {
          const timer = makeFocusTimer(7200);
          timer.state.remainingSeconds = remaining;
          timer.state.isRunning = false;

          const before = timer.state.remainingSeconds;
          timer.tick();

          expect(timer.state.remainingSeconds).toBe(before);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: reset() mengembalikan timer ke durasi awal
// ---------------------------------------------------------------------------
describe('FocusTimer — Property 8: Reset mengembalikan timer ke durasi awal', () => {
  // Feature: todo-life-dashboard, Property 8: Reset mengembalikan timer ke durasi awal
  it('[PBT] reset() selalu mengembalikan remainingSeconds ke totalSeconds dan isRunning ke false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),  // valid duration in minutes
        fc.integer({ min: 0, max: 7200 }), // arbitrary remainingSeconds
        fc.boolean(),                       // arbitrary isRunning
        (durationMin, remaining, running) => {
          const total = durationMin * 60;
          const timer = makeFocusTimer(total);
          timer.state.remainingSeconds = remaining;
          timer.state.isRunning = running;
          if (running) timer.state.intervalId = 1;

          timer.reset();

          expect(timer.state.remainingSeconds).toBe(total);
          expect(timer.state.isRunning).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Round-trip penyimpanan durasi Pomodoro
// ---------------------------------------------------------------------------
describe('FocusTimer — Property 9: Round-trip penyimpanan durasi Pomodoro', () => {
  // Feature: todo-life-dashboard, Property 9: Round-trip penyimpanan durasi Pomodoro
  it('[PBT] saveDuration(min) kemudian get(POMODORO_KEY) mengembalikan nilai identik', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),
        (min) => {
          const svc = makeStorageService();
          saveDuration(svc, min);
          const stored = svc.get(svc.POMODORO_KEY);
          expect(stored).toBe(min);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Validasi durasi Pomodoro
// ---------------------------------------------------------------------------
describe('FocusTimer — Property 10: Validasi durasi Pomodoro', () => {
  // Feature: todo-life-dashboard, Property 10: Validasi durasi Pomodoro
  it('[PBT] validateDuration(min) mengembalikan true jika dan hanya jika min dalam [1, 120]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),
        (min) => {
          expect(validateDuration(min)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] validateDuration(min) mengembalikan false untuk nilai di luar [1, 120]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: 0 }),
          fc.integer({ min: 121, max: 10000 })
        ),
        (min) => {
          expect(validateDuration(min)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateDuration mengembalikan false untuk nilai non-integer', () => {
    expect(validateDuration(1.5)).toBe(false);
    expect(validateDuration(NaN)).toBe(false);
    expect(validateDuration(null)).toBe(false);
    expect(validateDuration('25')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: start/stop (kriteria 2.2, 2.3) dan notifikasi saat 00:00 (edge case 2.5)
// ---------------------------------------------------------------------------
describe('FocusTimer — Unit tests: start/stop dan notifikasi 00:00', () => {

  it('kriteria 2.2: start() memulai countdown (isRunning menjadi true)', () => {
    const timer = makeFocusTimer(25 * 60);
    expect(timer.state.isRunning).toBe(false);
    timer.start();
    expect(timer.state.isRunning).toBe(true);
  });

  it('kriteria 2.2: start() tidak melakukan apapun jika timer sudah berjalan', () => {
    const timer = makeFocusTimer(25 * 60);
    timer.start();
    const idBefore = timer.state.intervalId;
    timer.start(); // second call should be no-op
    expect(timer.state.intervalId).toBe(idBefore);
  });

  it('kriteria 2.3: stop() menghentikan countdown dan mempertahankan remainingSeconds', () => {
    const timer = makeFocusTimer(25 * 60);
    timer.start();
    timer.tick();
    timer.tick();
    const remaining = timer.state.remainingSeconds;
    timer.stop();
    expect(timer.state.isRunning).toBe(false);
    expect(timer.state.remainingSeconds).toBe(remaining);
  });

  it('kriteria 2.3: stop() tidak mengubah remainingSeconds', () => {
    const timer = makeFocusTimer(10 * 60);
    timer.start();
    // Simulate some ticks
    for (let i = 0; i < 5; i++) timer.tick();
    const remaining = timer.state.remainingSeconds;
    timer.stop();
    expect(timer.state.remainingSeconds).toBe(remaining);
  });

  it('edge case 2.5: showCompletionNotice dipanggil saat remainingSeconds mencapai 0', () => {
    const timer = makeFocusTimer(2); // 2 seconds total
    timer.start();
    timer.tick(); // remainingSeconds = 1
    expect(timer.completionCalled.count).toBe(0);
    timer.tick(); // remainingSeconds = 0 → completion notice
    expect(timer.completionCalled.count).toBe(1);
    expect(timer.state.isRunning).toBe(false);
  });

  it('edge case 2.5: tick() tidak memanggil showCompletionNotice jika remainingSeconds > 0', () => {
    const timer = makeFocusTimer(60);
    timer.start();
    timer.tick();
    expect(timer.completionCalled.count).toBe(0);
    expect(timer.state.remainingSeconds).toBe(59);
  });

  it('tick() tidak berjalan setelah timer berhenti (stop)', () => {
    const timer = makeFocusTimer(60);
    timer.start();
    timer.tick();
    timer.stop();
    const remaining = timer.state.remainingSeconds;
    timer.tick(); // should be no-op since isRunning = false
    expect(timer.state.remainingSeconds).toBe(remaining);
  });

  it('start() tidak berjalan jika remainingSeconds sudah 0', () => {
    const timer = makeFocusTimer(1);
    timer.start();
    timer.tick(); // reaches 0, stops automatically
    expect(timer.state.isRunning).toBe(false);
    timer.start(); // should not start again
    expect(timer.state.isRunning).toBe(false);
  });
});
