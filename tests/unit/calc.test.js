import { describe, it, expect } from 'vitest';
import {
  isValidDateStr, isValidTimeStr, parseBirth, addDays, daysLived, hoursLived,
  generateAnniversaries, roundJubilees, jubileeDate, isSoon, daysUntil,
} from '../../public/app/js/calc.js';

describe('validation', () => {
  it('accepts real dates only', () => {
    expect(isValidDateStr('1990-05-15')).toBe(true);
    expect(isValidDateStr('1990-02-30')).toBe(false);
    expect(isValidDateStr('2000-02-29')).toBe(true);
    expect(isValidDateStr('1999-02-29')).toBe(false);
    expect(isValidDateStr('15.05.1990')).toBe(false);
    expect(isValidDateStr('')).toBe(false);
    expect(isValidDateStr(undefined)).toBe(false);
  });
  it('accepts HH:MM only', () => {
    expect(isValidTimeStr('00:00')).toBe(true);
    expect(isValidTimeStr('23:59')).toBe(true);
    expect(isValidTimeStr('24:00')).toBe(false);
    expect(isValidTimeStr('12:60')).toBe(false);
    expect(isValidTimeStr('1:30')).toBe(false);
    expect(isValidTimeStr('')).toBe(false);
  });
});

describe('parseBirth', () => {
  it('defaults to local midnight', () => {
    const b = parseBirth('1990-05-15');
    expect([b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes()]).toEqual([1990, 4, 15, 0, 0]);
  });
  it('uses the given time', () => {
    const b = parseBirth('1990-05-15', '14:30');
    expect([b.getHours(), b.getMinutes()]).toEqual([14, 30]);
  });
  it('returns null on invalid input', () => {
    expect(parseBirth('nope')).toBeNull();
    expect(parseBirth('1990-05-15', '99:99')).toBeNull();
  });
});

describe('lived counters', () => {
  const birth = new Date(2000, 0, 1, 12, 0);
  it('counts whole days', () => {
    expect(daysLived(birth, new Date(2000, 0, 1, 12, 0))).toBe(0);
    expect(daysLived(birth, new Date(2000, 0, 2, 11, 59))).toBe(0);
    expect(daysLived(birth, new Date(2000, 0, 2, 12, 0))).toBe(1);
    expect(daysLived(birth, new Date(2001, 0, 1, 12, 0))).toBe(366);
  });
  it('counts whole hours', () => {
    expect(hoursLived(birth, new Date(2000, 0, 1, 12, 59))).toBe(0);
    expect(hoursLived(birth, new Date(2000, 0, 2, 12, 0))).toBe(24);
  });
  it('addDays keeps wall-clock time', () => {
    const d = addDays(new Date(2024, 2, 30, 8, 15), 3);
    expect([d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([3, 2, 8, 15]);
  });
});

describe('generateAnniversaries', () => {
  it('returns the next multiples above current', () => {
    expect(generateAnniversaries(10250, 100, 3)).toEqual([10300, 10400, 10500]);
    expect(generateAnniversaries(10250, 1000, 3)).toEqual([11000, 12000, 13000]);
  });
  it('skips the current value if it is a multiple', () => {
    expect(generateAnniversaries(10000, 1000, 2)).toEqual([11000, 12000]);
  });
  it('count 0 gives nothing', () => {
    expect(generateAnniversaries(5, 100, 0)).toEqual([]);
  });
});

describe('roundJubilees', () => {
  it('merges small and big steps, unique and sorted', () => {
    expect(roundJubilees(10250)).toEqual([10300, 10400, 10500, 11000, 12000, 13000]);
  });
  it('deduplicates overlaps', () => {
    expect(roundJubilees(999)).toEqual([1000, 1100, 1200, 2000, 3000]);
  });
});

describe('jubileeDate / isSoon / daysUntil', () => {
  const birth = new Date(2000, 0, 1, 12, 0);
  it('adds days on the calendar and hours in ms', () => {
    const d = jubileeDate(birth, 'days', 100);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([3, 10, 12]);
    expect(jubileeDate(birth, 'hours', 48).getTime() - birth.getTime()).toBe(48 * 3600000);
  });
  it('soon thresholds: 200 days / 14 days', () => {
    expect(isSoon('days', 10199, 10000)).toBe(true);
    expect(isSoon('days', 10200, 10000)).toBe(false);
    expect(isSoon('hours', 100335, 100000)).toBe(true);
    expect(isSoon('hours', 100336, 100000)).toBe(false);
  });
  it('daysUntil rounds up and clamps at 0', () => {
    const now = new Date(2024, 0, 1, 0, 0);
    expect(daysUntil(new Date(2024, 0, 1, 1, 0), now)).toBe(1);
    expect(daysUntil(new Date(2024, 0, 3, 0, 0), now)).toBe(2);
    expect(daysUntil(new Date(2023, 0, 1), now)).toBe(0);
  });
});
