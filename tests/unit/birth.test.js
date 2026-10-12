import { describe, it, expect } from 'vitest';
import {
  validateBirth, birthFromSearch, buildPermalink, loadBirth, saveBirth, clearBirth, resolveInitialBirth,
} from '../../public/app/js/birth.js';
import { createStore, KEYS } from '../../public/app/js/storage.js';

const NOW = new Date(2026, 9, 12, 10, 0);

function memStore() {
  const m = new Map();
  return createStore(() => ({
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }));
}

describe('validateBirth', () => {
  it('flags bad date, bad time and future', () => {
    expect(validateBirth({ d: '', t: '' }, NOW)).toBe('errDate');
    expect(validateBirth(null, NOW)).toBe('errDate');
    expect(validateBirth({ d: '1990-05-15', t: '25:00' }, NOW)).toBe('errTime');
    expect(validateBirth({ d: '2030-01-01', t: '' }, NOW)).toBe('errFuture');
    expect(validateBirth({ d: '2026-10-12', t: '11:00' }, NOW)).toBe('errFuture');
  });
  it('accepts valid values', () => {
    expect(validateBirth({ d: '1990-05-15', t: '' }, NOW)).toBeNull();
    expect(validateBirth({ d: '1990-05-15', t: '14:30' }, NOW)).toBeNull();
  });
});

describe('birthFromSearch', () => {
  it('reads d and optional t', () => {
    expect(birthFromSearch('?d=1990-05-15&t=14:30', NOW)).toEqual({ d: '1990-05-15', t: '14:30' });
    expect(birthFromSearch('?d=1990-05-15', NOW)).toEqual({ d: '1990-05-15', t: '' });
  });
  it('ignores missing or invalid params', () => {
    expect(birthFromSearch('', NOW)).toBeNull();
    expect(birthFromSearch('?d=bogus', NOW)).toBeNull();
    expect(birthFromSearch('?d=1990-05-15&t=99:99', NOW)).toBeNull();
  });
});

describe('buildPermalink', () => {
  it('builds an absolute link and drops old params', () => {
    expect(buildPermalink('https://x.test/app/?d=2000-01-01#h', { d: '1990-05-15', t: '14:30' }))
      .toBe('https://x.test/app/?d=1990-05-15&t=14%3A30');
    expect(buildPermalink('https://x.test/app/', { d: '1990-05-15', t: '' }))
      .toBe('https://x.test/app/?d=1990-05-15');
  });
});

describe('persistence', () => {
  it('save, load, clear', () => {
    const s = memStore();
    expect(loadBirth(s, NOW)).toBeNull();
    saveBirth(s, { d: '1990-05-15', t: '' });
    expect(loadBirth(s, NOW)).toEqual({ d: '1990-05-15', t: '' });
    clearBirth(s);
    expect(loadBirth(s, NOW)).toBeNull();
  });
  it('ignores corrupt or invalid stored values', () => {
    const s = memStore();
    s.set(KEYS.birth, 'garbage');
    expect(loadBirth(s, NOW)).toBeNull();
    s.setJSON(KEYS.birth, { d: '1990-13-45' });
    expect(loadBirth(s, NOW)).toBeNull();
    s.setJSON(KEYS.birth, 5);
    expect(loadBirth(s, NOW)).toBeNull();
  });
});

describe('resolveInitialBirth', () => {
  it('URL params win over storage and overwrite it', () => {
    const s = memStore();
    saveBirth(s, { d: '1980-01-01', t: '' });
    const r = resolveInitialBirth(s, '?d=1990-05-15&t=14:30', NOW);
    expect(r).toEqual({ birth: { d: '1990-05-15', t: '14:30' }, fromUrl: true });
    expect(loadBirth(s, NOW)).toEqual({ d: '1990-05-15', t: '14:30' });
  });
  it('falls back to storage, then to nothing', () => {
    const s = memStore();
    expect(resolveInitialBirth(s, '', NOW)).toEqual({ birth: null, fromUrl: false });
    saveBirth(s, { d: '1980-01-01', t: '' });
    expect(resolveInitialBirth(s, '?d=bad', NOW)).toEqual({ birth: { d: '1980-01-01', t: '' }, fromUrl: false });
  });
});
