import { describe, it, expect } from 'vitest';
import {
  ruPlural, enPlural, pluralWord, formatNumber, formatDate, formatTime, formatDateTime,
} from '../../public/app/js/format.js';

describe('plurals', () => {
  const days = ['день', 'дня', 'дней'];
  it('ru', () => {
    const cases = { 0: 'дней', 1: 'день', 2: 'дня', 4: 'дня', 5: 'дней', 11: 'дней', 12: 'дней', 14: 'дней', 21: 'день', 22: 'дня', 101: 'день', 111: 'дней', 1000: 'дней', 10001: 'день' };
    for (const [n, w] of Object.entries(cases)) expect(ruPlural(+n, days), n).toBe(w);
  });
  it('en', () => {
    expect(enPlural(1, ['day', 'days'])).toBe('day');
    expect(enPlural(0, ['day', 'days'])).toBe('days');
    expect(enPlural(2, ['day', 'days'])).toBe('days');
  });
  it('pluralWord by unit and language', () => {
    expect(pluralWord('ru', 'hours', 3)).toBe('часа');
    expect(pluralWord('ru', 'days', 5)).toBe('дней');
    expect(pluralWord('en', 'hours', 1)).toBe('hour');
    expect(pluralWord('en', 'days', 10)).toBe('days');
  });
});

describe('formatNumber', () => {
  it('groups thousands per language', () => {
    expect(formatNumber(10000, 'ru')).toBe('10 000');
    expect(formatNumber(1234567, 'ru')).toBe('1 234 567');
    expect(formatNumber(10000, 'en')).toBe('10,000');
    expect(formatNumber(999, 'en')).toBe('999');
  });
});

describe('dates', () => {
  const d = new Date(2030, 4, 15, 14, 5);
  it('ru: genitive month, no trailing year suffix', () => {
    expect(formatDate(d, 'ru')).toBe('15 мая 2030');
  });
  it('en', () => {
    expect(formatDate(d, 'en')).toBe('May 15, 2030');
  });
  it('time is 24h HH:MM', () => {
    expect(formatTime(d)).toBe('14:05');
    expect(formatTime(new Date(2030, 4, 15, 0, 0))).toBe('00:00');
  });
  it('dateTime appends the time only on request', () => {
    expect(formatDateTime(d, 'ru', false)).toBe('15 мая 2030');
    expect(formatDateTime(d, 'ru', true)).toBe('15 мая 2030, 14:05');
  });
});
