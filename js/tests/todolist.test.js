/**
 * Feature: todo-life-dashboard
 * Property 11: Validasi teks task (valid dan tidak valid)
 * Property 12: Round-trip toggle status task
 * Property 13: Hapus task menghilangkan dari storage
 * Property 14: Edit task memperbarui teks di storage
 * Property 15: Load tasks dari storage adalah identitas
 * Property 16: Invariant jumlah task belum selesai
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline TodoList logic — mirrors app.js, runs in Node without DOM
// ---------------------------------------------------------------------------

/** Minimal StorageService shim backed by a plain object */
function makeStorageService(initialStore = {}) {
  const _store = { ...initialStore };

  function get(key) {
    try {
      const raw = Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null;
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(key, value) {
    try { _store[key] = JSON.stringify(value); } catch { /* ignore */ }
  }

  return { get, set };
}

const TASKS_KEY = 'tld_tasks';

/** Creates an isolated TodoList instance backed by the given StorageService */
function makeTodoList(svc) {
  let tasks = [];

  function isValidText(text) {
    return typeof text === 'string' && text.trim().length > 0;
  }

  function getIncompleteCount() {
    return tasks.filter(t => !t.completed).length;
  }

  function save() {
    svc.set(TASKS_KEY, tasks);
  }

  function addTask(text) {
    if (!isValidText(text)) return;
    const task = {
      id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    save();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
  }

  function editTask(id, newText) {
    if (!isValidText(newText)) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.text = newText.trim();
    save();
  }

  function init() {
    const stored = svc.get(TASKS_KEY);
    tasks = Array.isArray(stored) ? stored : [];
  }

  function getTasks() { return tasks; }

  return { isValidText, getIncompleteCount, save, addTask, toggleTask, deleteTask, editTask, init, getTasks };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary valid task text: non-empty, non-whitespace-only */
const validText = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

/** Arbitrary whitespace-only or empty string */
const invalidText = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1 }).filter(s => s.trim().length === 0)
);

/** Arbitrary task record */
const taskRecord = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  text: validText,
  completed: fc.boolean(),
  createdAt: fc.date().map(d => d.toISOString()),
});

// ---------------------------------------------------------------------------
// Property 11: Validasi teks task
// Validates: Requirements 3.1, 3.6
// ---------------------------------------------------------------------------
describe('TodoList — Property 11: Validasi teks task', () => {
  // Feature: todo-life-dashboard, Property 11: Validasi teks task (valid dan tidak valid)

  it('[PBT] isValidText mengembalikan true untuk sembarang string non-empty non-whitespace', () => {
    fc.assert(
      fc.property(validText, (text) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        expect(todo.isValidText(text)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] isValidText mengembalikan false untuk string kosong atau whitespace-only', () => {
    fc.assert(
      fc.property(invalidText, (text) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        expect(todo.isValidText(text)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] addTask berhasil menambahkan task untuk teks valid', () => {
    fc.assert(
      fc.property(validText, (text) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(text);
        const stored = svc.get(TASKS_KEY);
        expect(Array.isArray(stored)).toBe(true);
        expect(stored.length).toBe(1);
        expect(stored[0].text).toBe(text.trim());
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] addTask menolak teks tidak valid tanpa mengubah storage', () => {
    fc.assert(
      fc.property(invalidText, (text) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        const before = svc.get(TASKS_KEY);
        todo.addTask(text);
        const after = svc.get(TASKS_KEY);
        // Storage should remain unchanged (both null, or same content)
        expect(after).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Round-trip toggle status task
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------
describe('TodoList — Property 12: Round-trip toggle status task', () => {
  // Feature: todo-life-dashboard, Property 12: Round-trip toggle status task

  it('[PBT] toggleTask membalik nilai completed (false → true, true → false)', () => {
    fc.assert(
      fc.property(validText, fc.boolean(), (text, initialCompleted) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(text);

        // Manually set initial completed state
        const stored = svc.get(TASKS_KEY);
        stored[0].completed = initialCompleted;
        svc.set(TASKS_KEY, stored);
        todo.init(); // reload

        const id = todo.getTasks()[0].id;
        todo.toggleTask(id);

        const afterToggle = svc.get(TASKS_KEY);
        expect(afterToggle[0].completed).toBe(!initialCompleted);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] toggleTask dua kali mengembalikan ke nilai semula', () => {
    fc.assert(
      fc.property(validText, fc.boolean(), (text, initialCompleted) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(text);

        const stored = svc.get(TASKS_KEY);
        stored[0].completed = initialCompleted;
        svc.set(TASKS_KEY, stored);
        todo.init();

        const id = todo.getTasks()[0].id;
        todo.toggleTask(id);
        todo.toggleTask(id);

        const afterDouble = svc.get(TASKS_KEY);
        expect(afterDouble[0].completed).toBe(initialCompleted);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] perubahan toggle terpersist di StorageService', () => {
    fc.assert(
      fc.property(validText, (text) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(text);

        const id = todo.getTasks()[0].id;
        const before = svc.get(TASKS_KEY)[0].completed;
        todo.toggleTask(id);
        const after = svc.get(TASKS_KEY)[0].completed;

        expect(after).toBe(!before);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Hapus task menghilangkan dari storage
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------
describe('TodoList — Property 13: Hapus task menghilangkan dari storage', () => {
  // Feature: todo-life-dashboard, Property 13: Hapus task menghilangkan dari storage

  it('[PBT] deleteTask menghapus task dari storage', () => {
    fc.assert(
      fc.property(
        fc.array(validText, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (texts, indexRaw) => {
          const svc = makeStorageService();
          const todo = makeTodoList(svc);
          texts.forEach(t => todo.addTask(t));

          const allTasks = todo.getTasks();
          const index = indexRaw % allTasks.length;
          const targetId = allTasks[index].id;

          todo.deleteTask(targetId);

          const stored = svc.get(TASKS_KEY);
          expect(stored.find(t => t.id === targetId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] deleteTask tidak menghapus task lain', () => {
    fc.assert(
      fc.property(
        fc.array(validText, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (texts, indexRaw) => {
          const svc = makeStorageService();
          const todo = makeTodoList(svc);
          texts.forEach(t => todo.addTask(t));

          const allTasks = todo.getTasks();
          const index = indexRaw % allTasks.length;
          const targetId = allTasks[index].id;
          const otherIds = allTasks.filter(t => t.id !== targetId).map(t => t.id);

          todo.deleteTask(targetId);

          const stored = svc.get(TASKS_KEY);
          const storedIds = stored.map(t => t.id);
          otherIds.forEach(id => expect(storedIds).toContain(id));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Edit task memperbarui teks di storage
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------
describe('TodoList — Property 14: Edit task memperbarui teks di storage', () => {
  // Feature: todo-life-dashboard, Property 14: Edit task memperbarui teks di storage

  it('[PBT] editTask memperbarui teks task di storage', () => {
    fc.assert(
      fc.property(validText, validText, (originalText, newText) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(originalText);

        const id = todo.getTasks()[0].id;
        todo.editTask(id, newText);

        const stored = svc.get(TASKS_KEY);
        const updated = stored.find(t => t.id === id);
        expect(updated).toBeDefined();
        expect(updated.text).toBe(newText.trim());
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] editTask dengan teks tidak valid tidak mengubah task', () => {
    fc.assert(
      fc.property(validText, invalidText, (originalText, badText) => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.addTask(originalText);

        const id = todo.getTasks()[0].id;
        todo.editTask(id, badText);

        const stored = svc.get(TASKS_KEY);
        const task = stored.find(t => t.id === id);
        expect(task.text).toBe(originalText.trim());
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Load tasks dari storage adalah identitas
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------
describe('TodoList — Property 15: Load tasks dari storage adalah identitas', () => {
  // Feature: todo-life-dashboard, Property 15: Load tasks dari storage adalah identitas

  it('[PBT] init() memuat array task identik dengan yang disimpan di storage', () => {
    fc.assert(
      fc.property(fc.array(taskRecord, { minLength: 0, maxLength: 10 }), (taskArray) => {
        const svc = makeStorageService();
        // Pre-populate storage with a known array
        svc.set(TASKS_KEY, taskArray);

        const todo = makeTodoList(svc);
        todo.init();

        const loaded = todo.getTasks();
        expect(loaded).toEqual(taskArray);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] init() menghasilkan array kosong jika storage kosong', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const svc = makeStorageService();
        const todo = makeTodoList(svc);
        todo.init();
        expect(todo.getTasks()).toEqual([]);
      }),
      { numRuns: 10 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Invariant jumlah task belum selesai
// Validates: Requirements 3.7
// ---------------------------------------------------------------------------
describe('TodoList — Property 16: Invariant jumlah task belum selesai', () => {
  // Feature: todo-life-dashboard, Property 16: Invariant jumlah task belum selesai

  it('[PBT] getIncompleteCount() selalu sama dengan jumlah task dengan completed=false', () => {
    fc.assert(
      fc.property(fc.array(taskRecord, { minLength: 0, maxLength: 20 }), (taskArray) => {
        const svc = makeStorageService();
        svc.set(TASKS_KEY, taskArray);

        const todo = makeTodoList(svc);
        todo.init();

        const expected = taskArray.filter(t => !t.completed).length;
        expect(todo.getIncompleteCount()).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] getIncompleteCount() berkurang tepat 1 setelah toggle task yang belum selesai', () => {
    fc.assert(
      fc.property(
        fc.array(taskRecord, { minLength: 1, maxLength: 10 }).filter(arr => arr.some(t => !t.completed)),
        (taskArray) => {
          const svc = makeStorageService();
          svc.set(TASKS_KEY, taskArray);

          const todo = makeTodoList(svc);
          todo.init();

          const incompleteTask = todo.getTasks().find(t => !t.completed);
          const countBefore = todo.getIncompleteCount();
          todo.toggleTask(incompleteTask.id);
          const countAfter = todo.getIncompleteCount();

          expect(countAfter).toBe(countBefore - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
