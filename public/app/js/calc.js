// Pure calculation helpers. No DOM, no storage: unit-testable in node.

export const MS_HOUR = 3600000;
export const MS_DAY = 86400000;

/** The nearest STEP_COUNT multiples of each step are shown (reference behaviour: 3 + 3). */
export const SMALL_STEP = 100;
export const BIG_STEP = 1000;
export const STEP_COUNT = 3;

/** "Soon" thresholds. */
export const SOON_DAYS = 200;
export const SOON_HOURS = 24 * 14;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export function isValidDateStr(s) {
  const m = DATE_RE.exec(s || '');
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function isValidTimeStr(s) {
  const m = TIME_RE.exec(s || '');
  return !!m && +m[1] < 24 && +m[2] < 60;
}

/** Local-time Date for "YYYY-MM-DD" and optional "HH:MM" (00:00 when absent). Null if invalid. */
export function parseBirth(d, t) {
  if (!isValidDateStr(d)) return null;
  if (t && !isValidTimeStr(t)) return null;
  const [y, mo, day] = d.split('-').map(Number);
  const [h, mi] = t ? t.split(':').map(Number) : [0, 0];
  return new Date(y, mo - 1, day, h, mi, 0, 0);
}

/** Calendar-aware (DST-safe) addition of whole days in local time. */
export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n,
    date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

/** Whole days lived (calendar days, DST-safe). */
export function daysLived(birth, now) {
  const a = Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let n = Math.round((b - a) / MS_DAY);
  if (addDays(birth, n) > now) n -= 1;
  return n;
}

/** Whole hours elapsed since birth. */
export function hoursLived(birth, now) {
  return Math.floor((now.getTime() - birth.getTime()) / MS_HOUR);
}

/** Next `count` multiples of `step` strictly greater than `current`. */
export function generateAnniversaries(current, step, count) {
  const result = [];
  let milestone = Math.floor(current / step) * step;
  for (let i = 0; i < count; i++) {
    milestone += step;
    if (milestone > current) result.push(milestone);
  }
  return result;
}

/** Nearest 3 multiples of 100 and of 1000, merged, unique, ascending. */
export function roundJubilees(current) {
  const merged = [
    ...generateAnniversaries(current, SMALL_STEP, STEP_COUNT),
    ...generateAnniversaries(current, BIG_STEP, STEP_COUNT),
  ];
  return [...new Set(merged)].sort((a, b) => a - b);
}

/** Moment at which the jubilee is reached. unit: 'days' | 'hours'. */
export function jubileeDate(birth, unit, n) {
  return unit === 'days' ? addDays(birth, n) : new Date(birth.getTime() + n * MS_HOUR);
}

/** "Soon" marker: days < 200 away, hours < 14 days away. */
export function isSoon(unit, n, current) {
  return n - current < (unit === 'days' ? SOON_DAYS : SOON_HOURS);
}

/** Whole days (rounded up) from now until `date`, never negative. */
export function daysUntil(date, now) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / MS_DAY));
}
