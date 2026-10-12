// "Beautiful" numbers: not round, but memorable. Pure functions.

/** At most this many beautiful numbers are shown per unit (days / hours). */
export const BEAUTIFUL_LIMIT = 5;
/** How far ahead (in units) we look for them. */
export const BEAUTIFUL_HORIZON = { days: 36500, hours: 876000 };
/** Minimum number of digits for repdigits, sequences, palindromes and repeats. */
export const MIN_DIGITS = 4;

export const KINDS = ['repdigit', 'sequence', 'palindrome', 'repeat', 'twosig'];

function isRepdigit(s) {
  return s.length >= MIN_DIGITS && /^(\d)\1+$/.test(s);
}

/** Consecutive digits, ascending (1234, 23456) or descending (54321, 98765). */
function isSequence(s) {
  if (s.length < MIN_DIGITS) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < s.length; i++) {
    const diff = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (diff !== 1) asc = false;
    if (diff !== -1) desc = false;
  }
  return asc || desc;
}

function isPalindrome(s) {
  return s.length >= MIN_DIGITS && s === [...s].reverse().join('');
}

/** A pair of different digits repeated: 1212, 121212. */
function isRepeatingPair(s) {
  return s.length >= MIN_DIGITS && /^(\d\d)\1+$/.test(s);
}

/** Two non-zero significant digits followed by at least three zeros: 15000, 250000. */
function isTwoSig(s) {
  return /^[1-9][1-9]0{3,}$/.test(s);
}

/** Kind of beautiful number, or null. The check order resolves overlaps. */
export function beautifulKind(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  const s = String(n);
  if (isRepdigit(s)) return 'repdigit';
  if (isSequence(s)) return 'sequence';
  if (isPalindrome(s)) return 'palindrome';
  if (isRepeatingPair(s)) return 'repeat';
  if (isTwoSig(s)) return 'twosig';
  return null;
}

/** All beautiful numbers in (from, to], ascending: [{n, kind}]. */
export function beautifulNumbersBetween(from, to) {
  const out = [];
  for (let n = Math.max(0, Math.floor(from) + 1); n <= to; n++) {
    const kind = beautifulKind(n);
    if (kind) out.push({ n, kind });
  }
  return out;
}

/**
 * Nearest upcoming beautiful numbers after `current`: at most `limit`, within the horizon of `unit`.
 * Numbers in `exclude` (the round jubilees) are skipped: a number is shown once, as round.
 */
export function nextBeautiful(current, unit, { limit = BEAUTIFUL_LIMIT, exclude = [] } = {}) {
  const skip = new Set(exclude);
  const end = current + BEAUTIFUL_HORIZON[unit];
  const out = [];
  for (let n = current + 1; n <= end && out.length < limit; n++) {
    if (skip.has(n)) continue;
    const kind = beautifulKind(n);
    if (kind) out.push({ n, kind });
  }
  return out;
}
