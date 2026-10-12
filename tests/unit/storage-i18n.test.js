import { describe, it, expect } from 'vitest';
import { createStore, KEYS } from '../../public/app/js/storage.js';
import { detectLang, makeT, STRINGS } from '../../public/app/js/i18n.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

describe('store', () => {
  it('round-trips strings and JSON', () => {
    const st = fakeStorage();
    const store = createStore(() => st);
    store.set('a', '1');
    expect(store.get('a')).toBe('1');
    expect(st.getItem('a')).toBe('1');
    store.setJSON('b', { d: 'x' });
    expect(store.getJSON('b')).toEqual({ d: 'x' });
    store.remove('a');
    expect(store.get('a')).toBeNull();
    expect(store.getJSON('missing')).toBeNull();
  });
  it('returns null for corrupt JSON', () => {
    const st = fakeStorage();
    st.setItem('k', '{broken');
    expect(createStore(() => st).getJSON('k')).toBeNull();
  });
  it('falls back to memory when storage throws', () => {
    const boom = () => { throw new Error('denied'); };
    const store = createStore(boom);
    expect(store.get('x')).toBeNull();
    store.set('x', 'v');
    expect(store.get('x')).toBe('v');
    store.remove('x');
    expect(store.get('x')).toBeNull();
  });
  it('exposes the key names', () => {
    expect(KEYS.birth).toBe('ac.birth');
  });
});

describe('i18n', () => {
  it('detectLang prefers saved, then navigator', () => {
    expect(detectLang('en', 'ru-RU')).toBe('en');
    expect(detectLang(null, 'ru-RU')).toBe('ru');
    expect(detectLang(null, 'en-US')).toBe('en');
    expect(detectLang('xx', 'de')).toBe('en');
    expect(detectLang(null, undefined)).toBe('ru');
  });
  it('makeT resolves strings, functions and falls back', () => {
    const t = makeT('en');
    expect(t('submit')).toBe(STRINGS.en.submit);
    expect(t('inDays', 3, 'days')).toBe('in 3 days');
    expect(makeT('ru')('inDays', 3, 'дня')).toBe('через 3 дня');
    expect(t('unknown-key')).toBe('unknown-key');
    expect(makeT('zz')('submit')).toBe(STRINGS.ru.submit);
  });
  it('en and ru dictionaries have the same keys', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.ru).sort());
  });
});
