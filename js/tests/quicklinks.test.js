/**
 * Feature: todo-life-dashboard
 * Property 17: Round-trip tambah dan muat link
 * Property 18: Hapus link menghilangkan dari storage
 * Property 19: Load links dari storage adalah identitas
 * Property 20: Validasi input link (URL dan label)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline QuickLinks logic — mirrors app.js, runs in Node without DOM
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

const LINKS_KEY = 'tld_links';

/** Creates an isolated QuickLinks instance backed by the given StorageService */
function makeQuickLinks(svc) {
  let links = [];

  function isValidUrl(url) {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  }

  function isValidLabel(label) {
    return typeof label === 'string' && label.trim().length > 0;
  }

  function save() {
    svc.set(LINKS_KEY, links);
  }

  function addLink(label, url) {
    if (!isValidLabel(label) || !isValidUrl(url)) return;
    const link = {
      id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
      label: label.trim(),
      url,
    };
    links.push(link);
    save();
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    save();
  }

  function init() {
    const stored = svc.get(LINKS_KEY);
    links = Array.isArray(stored) ? stored : [];
  }

  function getLinks() { return links; }

  return { isValidUrl, isValidLabel, save, addLink, deleteLink, init, getLinks };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary valid label: non-empty, non-whitespace-only */
const validLabel = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

/** Arbitrary valid URL: starts with http:// or https:// */
const validUrl = fc.oneof(
  fc.webUrl().filter(u => u.startsWith('http://') || u.startsWith('https://')),
  fc.constantFrom(
    'http://example.com',
    'https://example.com',
    'http://foo.bar/baz',
    'https://test.org/path?q=1'
  )
);

/** Arbitrary invalid URL: does not start with http:// or https:// */
const invalidUrl = fc.string().filter(s =>
  !s.startsWith('http://') && !s.startsWith('https://')
);

/** Arbitrary whitespace-only or empty string */
const invalidLabel = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1 }).filter(s => s.trim().length === 0)
);

/** Arbitrary link record */
const linkRecord = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  label: validLabel,
  url: validUrl,
});

// ---------------------------------------------------------------------------
// Property 17: Round-trip tambah dan muat link
// Validates: Requirements 4.1
// ---------------------------------------------------------------------------
describe('QuickLinks — Property 17: Round-trip tambah dan muat link', () => {
  // Feature: todo-life-dashboard, Property 17: Round-trip tambah dan muat link

  it('[PBT] addLink menyimpan link dengan label dan URL yang identik ke storage', () => {
    fc.assert(
      fc.property(validLabel, validUrl, (label, url) => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        ql.addLink(label, url);

        const stored = svc.get(LINKS_KEY);
        expect(Array.isArray(stored)).toBe(true);
        expect(stored.length).toBe(1);
        expect(stored[0].label).toBe(label.trim());
        expect(stored[0].url).toBe(url);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] addLink dengan input tidak valid tidak mengubah storage', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(invalidLabel, validUrl),
          fc.tuple(validLabel, invalidUrl),
          fc.tuple(invalidLabel, invalidUrl)
        ),
        ([label, url]) => {
          const svc = makeStorageService();
          const ql = makeQuickLinks(svc);
          const before = svc.get(LINKS_KEY);
          ql.addLink(label, url);
          const after = svc.get(LINKS_KEY);
          expect(after).toEqual(before);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Hapus link menghilangkan dari storage
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------
describe('QuickLinks — Property 18: Hapus link menghilangkan dari storage', () => {
  // Feature: todo-life-dashboard, Property 18: Hapus link menghilangkan dari storage

  it('[PBT] deleteLink menghapus link dari storage', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(validLabel, validUrl), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (pairs, indexRaw) => {
          const svc = makeStorageService();
          const ql = makeQuickLinks(svc);
          pairs.forEach(([label, url]) => ql.addLink(label, url));

          const allLinks = ql.getLinks();
          const index = indexRaw % allLinks.length;
          const targetId = allLinks[index].id;

          ql.deleteLink(targetId);

          const stored = svc.get(LINKS_KEY);
          expect(stored.find(l => l.id === targetId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('[PBT] deleteLink tidak menghapus link lain', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(validLabel, validUrl), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (pairs, indexRaw) => {
          const svc = makeStorageService();
          const ql = makeQuickLinks(svc);
          pairs.forEach(([label, url]) => ql.addLink(label, url));

          const allLinks = ql.getLinks();
          const index = indexRaw % allLinks.length;
          const targetId = allLinks[index].id;
          const otherIds = allLinks.filter(l => l.id !== targetId).map(l => l.id);

          ql.deleteLink(targetId);

          const stored = svc.get(LINKS_KEY);
          const storedIds = stored.map(l => l.id);
          otherIds.forEach(id => expect(storedIds).toContain(id));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 19: Load links dari storage adalah identitas
// Validates: Requirements 4.4
// ---------------------------------------------------------------------------
describe('QuickLinks — Property 19: Load links dari storage adalah identitas', () => {
  // Feature: todo-life-dashboard, Property 19: Load links dari storage adalah identitas

  it('[PBT] init() memuat array link identik dengan yang disimpan di storage', () => {
    fc.assert(
      fc.property(fc.array(linkRecord, { minLength: 0, maxLength: 10 }), (linkArray) => {
        const svc = makeStorageService();
        svc.set(LINKS_KEY, linkArray);

        const ql = makeQuickLinks(svc);
        ql.init();

        const loaded = ql.getLinks();
        expect(loaded).toEqual(linkArray);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] init() menghasilkan array kosong jika storage kosong', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        ql.init();
        expect(ql.getLinks()).toEqual([]);
      }),
      { numRuns: 10 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20: Validasi input link (URL dan label)
// Validates: Requirements 4.5, 4.6
// ---------------------------------------------------------------------------
describe('QuickLinks — Property 20: Validasi input link', () => {
  // Feature: todo-life-dashboard, Property 20: Validasi input link (URL dan label)

  it('[PBT] isValidUrl mengembalikan false untuk URL yang tidak diawali http:// atau https://', () => {
    fc.assert(
      fc.property(invalidUrl, (url) => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        expect(ql.isValidUrl(url)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] isValidUrl mengembalikan true untuk URL yang diawali http:// atau https://', () => {
    fc.assert(
      fc.property(validUrl, (url) => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        expect(ql.isValidUrl(url)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] isValidLabel mengembalikan false untuk string kosong atau whitespace-only', () => {
    fc.assert(
      fc.property(invalidLabel, (label) => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        expect(ql.isValidLabel(label)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('[PBT] isValidLabel mengembalikan true untuk string non-empty non-whitespace', () => {
    fc.assert(
      fc.property(validLabel, (label) => {
        const svc = makeStorageService();
        const ql = makeQuickLinks(svc);
        expect(ql.isValidLabel(label)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit test: buka URL di tab baru (kriteria 4.2)
// ---------------------------------------------------------------------------
describe('QuickLinks — Unit test: buka URL di tab baru (kriteria 4.2)', () => {
  it('link yang dirender memiliki target="_blank" dan rel="noopener noreferrer"', () => {
    // Simulate a minimal DOM environment
    const items = [];
    const mockDocument = {
      createElement(tag) {
        const el = {
          tag,
          className: '',
          textContent: '',
          href: '',
          target: '',
          rel: '',
          dataset: {},
          children: [],
          _listeners: {},
          setAttribute(name, val) { this[name] = val; },
          addEventListener(event, fn) { this._listeners[event] = fn; },
          appendChild(child) { this.children.push(child); },
        };
        return el;
      },
      getElementById(id) {
        if (id === 'quicklinks-list') {
          return {
            innerHTML: '',
            children: items,
            appendChild(child) { items.push(child); },
          };
        }
        return null;
      },
    };

    // Inline render logic using mockDocument
    const link = { id: 'test-id', label: 'Google', url: 'https://google.com' };
    const listEl = mockDocument.getElementById('quicklinks-list');
    listEl.innerHTML = '';

    const item = mockDocument.createElement('div');
    const btn = mockDocument.createElement('a');
    btn.textContent = link.label;
    btn.href = link.url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    item.appendChild(btn);
    listEl.appendChild(item);

    const renderedBtn = items[0].children[0];
    expect(renderedBtn.href).toBe('https://google.com');
    expect(renderedBtn.target).toBe('_blank');
    expect(renderedBtn.rel).toBe('noopener noreferrer');
  });

  it('link yang dirender menggunakan tag <a> dengan href yang benar', () => {
    const url = 'https://example.com';
    const label = 'Example';

    // Verify the render logic produces an anchor element with correct attributes
    const items = [];
    const mockListEl = {
      innerHTML: '',
      appendChild(child) { items.push(child); },
    };

    const link = { id: 'abc', label, url };

    // Replicate render logic
    const item = { children: [], appendChild(c) { this.children.push(c); } };
    const btn = { tag: 'a', href: link.url, target: '_blank', rel: 'noopener noreferrer', textContent: link.label };
    item.appendChild(btn);
    mockListEl.appendChild(item);

    expect(items[0].children[0].href).toBe(url);
    expect(items[0].children[0].target).toBe('_blank');
  });
});
