import { describe, it, expect } from 'vitest';
import { buildModel, makeRow } from '../../public/app/js/model.js';

describe('buildModel', () => {
  const birth = new Date(1990, 4, 15, 14, 30);
  const now = new Date(2026, 9, 12, 10, 0);
  const m = buildModel(birth, now);

  it('has days and hours sections with current counters', () => {
    expect(m.days.unit).toBe('days');
    expect(m.days.current).toBe(13298);
    expect(m.hours.current).toBe(Math.floor((now - birth) / 3600000));
  });
  it('lists only future round jubilees in ascending order', () => {
    expect(m.days.rows.map((r) => r.n)).toEqual([13300, 13400, 13500, 14000, 15000, 16000]);
    for (const sec of [m.days, m.hours]) {
      const ns = sec.rows.map((r) => r.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
      expect(ns.every((n) => n > sec.current)).toBe(true);
      expect(sec.rows.every((r) => r.date > now)).toBe(true);
    }
  });
  it('rows carry key, kind and soon flags', () => {
    const r = m.days.rows[0];
    expect(r.key).toBe('days:13300');
    expect(r.kind).toBeNull();
    expect(r.soon).toBe(true);
    expect(m.days.rows.at(-1).soon).toBe(false);
  });
});

describe('buildModel with beautiful numbers', () => {
  const birth = new Date(1990, 4, 15, 14, 30);
  const now = new Date(2026, 9, 12, 10, 0);
  it('is off by default: only round rows', () => {
    expect(buildModel(birth, now).days.rows.every((r) => r.kind === null)).toBe(true);
  });
  it('adds up to 5 labelled rows per unit, sorted, without duplicating round numbers', () => {
    const m = buildModel(birth, now, { beautiful: true });
    for (const sec of [m.days, m.hours]) {
      const ns = sec.rows.map((r) => r.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
      expect(new Set(ns).size).toBe(ns.length);
      const extra = sec.rows.filter((r) => r.kind);
      expect(extra.length).toBe(5);
      expect(extra.every((r) => r.n > sec.current)).toBe(true);
    }
    expect(m.days.rows.filter((r) => !r.kind).map((r) => r.n)).toEqual([13300, 13400, 13500, 14000, 15000, 16000]);
  });
});

describe('makeRow', () => {
  it('computes date and daysLeft', () => {
    const birth = new Date(2000, 0, 1, 0, 0);
    const now = new Date(2000, 0, 2, 0, 0);
    const r = makeRow('days', 10, 'x', 1, birth, now);
    expect(r.kind).toBe('x');
    expect(r.date.getDate()).toBe(11);
    expect(r.daysLeft).toBe(9);
  });
});
