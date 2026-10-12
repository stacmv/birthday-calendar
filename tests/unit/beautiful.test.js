import { describe, it, expect } from 'vitest';
import {
  beautifulKind, beautifulNumbersBetween, nextBeautiful, BEAUTIFUL_LIMIT, KINDS,
} from '../../public/app/js/beautiful.js';

describe('beautifulKind', () => {
  it('repdigits (>= 4 digits)', () => {
    for (const n of [1111, 22222, 777777]) expect(beautifulKind(n), n).toBe('repdigit');
    expect(beautifulKind(111)).toBeNull();
  });
  it('ascending and descending sequences (>= 4 digits)', () => {
    for (const n of [1234, 12345, 23456, 54321, 123456, 98765, 43210]) expect(beautifulKind(n), n).toBe('sequence');
    expect(beautifulKind(123)).toBeNull();
    expect(beautifulKind(1235)).toBeNull();
  });
  it('palindromes (>= 4 digits)', () => {
    for (const n of [12321, 14541, 1221, 100001]) expect(beautifulKind(n), n).toBe('palindrome');
    expect(beautifulKind(121)).toBeNull();
    expect(beautifulKind(12345)).toBe('sequence');
  });
  it('repeating pairs', () => {
    for (const n of [1212, 121212, 3434]) expect(beautifulKind(n), n).toBe('repeat');
    expect(beautifulKind(1213)).toBeNull();
  });
  it('two significant digits followed by zeros', () => {
    for (const n of [15000, 25000, 350000]) expect(beautifulKind(n), n).toBe('twosig');
    expect(beautifulKind(20000)).toBeNull();
    expect(beautifulKind(1500)).toBeNull();
    expect(beautifulKind(15001)).toBeNull();
  });
  it('overlaps resolve by priority; non-integers are rejected', () => {
    expect(beautifulKind(1111)).toBe('repdigit');
    expect(beautifulKind(-1111)).toBeNull();
    expect(beautifulKind(11.5)).toBeNull();
    expect(beautifulKind(0)).toBeNull();
  });
  it('only returns known kinds', () => {
    for (let n = 0; n < 20000; n++) {
      const k = beautifulKind(n);
      if (k) expect(KINDS).toContain(k);
    }
  });
});

describe('beautifulNumbersBetween', () => {
  it('lists numbers in (from, to] ascending', () => {
    expect(beautifulNumbersBetween(1000, 1300)).toEqual([
      { n: 1001, kind: 'palindrome' }, { n: 1010, kind: 'repeat' }, { n: 1111, kind: 'repdigit' },
      { n: 1212, kind: 'repeat' }, { n: 1221, kind: 'palindrome' }, { n: 1234, kind: 'sequence' },
    ]);
  });
  it('is exclusive of from and inclusive of to', () => {
    expect(beautifulNumbersBetween(1111, 1111)).toEqual([]);
    expect(beautifulNumbersBetween(1110, 1111)).toEqual([{ n: 1111, kind: 'repdigit' }]);
  });
  it('is empty for a reversed range', () => {
    expect(beautifulNumbersBetween(10, 5)).toEqual([]);
  });
});

describe('nextBeautiful', () => {
  it('returns the nearest ones, limited', () => {
    const r = nextBeautiful(12000, 'days');
    expect(r).toHaveLength(BEAUTIFUL_LIMIT);
    expect(r[0].n).toBeGreaterThan(12000);
    const ns = r.map((x) => x.n);
    expect(ns).toEqual([...ns].sort((a, b) => a - b));
  });
  it('honours the limit option', () => {
    expect(nextBeautiful(12000, 'days', { limit: 2 })).toHaveLength(2);
    expect(nextBeautiful(12000, 'days', { limit: 0 })).toEqual([]);
  });
  it('skips excluded (round) numbers', () => {
    const all = nextBeautiful(14000, 'days', { limit: 3 });
    expect(all[0].n).toBe(14041);
    const skipped = nextBeautiful(14000, 'days', { limit: 3, exclude: [14041] });
    expect(skipped.map((x) => x.n)).not.toContain(14041);
  });
  it('twosig kinds appear and round-excluded ones are not repeated', () => {
    const r = nextBeautiful(14000, 'days', { limit: 1000, exclude: [15000] });
    expect(r.some((x) => x.n === 15000)).toBe(false);
    expect(r.some((x) => x.kind === 'twosig' && x.n === 25000)).toBe(true);
  });
  it('respects the horizon', () => {
    expect(nextBeautiful(99999990, 'days', { limit: 1000 }).every((x) => x.n <= 99999990 + 36500)).toBe(true);
  });
  it('works for hours', () => {
    const r = nextBeautiful(319172, 'hours');
    expect(r).toHaveLength(BEAUTIFUL_LIMIT);
    expect(r[0].n).toBeGreaterThan(319172);
  });
});
