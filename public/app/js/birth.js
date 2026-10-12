// Birth-date state: validation, URL params, permalink and persistence. Pure (store is injected).

import { parseBirth, isValidDateStr, isValidTimeStr } from './calc.js';
import { KEYS } from './storage.js';

/** @typedef {{d: string, t: string}} BirthState  d = YYYY-MM-DD, t = HH:MM or '' */

/** Returns an error string key ('errDate' | 'errTime' | 'errFuture') or null. */
export function validateBirth(b, now = new Date()) {
  if (!b || !isValidDateStr(b.d)) return 'errDate';
  if (b.t && !isValidTimeStr(b.t)) return 'errTime';
  if (parseBirth(b.d, b.t) > now) return 'errFuture';
  return null;
}

/** Valid ?d=…&t=… -> BirthState, otherwise null. */
export function birthFromSearch(search, now = new Date()) {
  const p = new URLSearchParams(search);
  const b = { d: p.get('d') || '', t: p.get('t') || '' };
  return b.d && !validateBirth(b, now) ? b : null;
}

/** Absolute link that reopens the calendar for `b`. `base` is the app URL (directory). */
export function buildPermalink(base, b) {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('d', b.d);
  if (b.t) url.searchParams.set('t', b.t);
  return url.toString();
}

export function loadBirth(store, now = new Date()) {
  const raw = store.getJSON(KEYS.birth);
  if (!raw || typeof raw !== 'object') return null;
  const b = { d: String(raw.d || ''), t: String(raw.t || '') };
  return validateBirth(b, now) ? null : b;
}

export function saveBirth(store, b) {
  store.setJSON(KEYS.birth, { d: b.d, t: b.t || '' });
}

export function clearBirth(store) {
  store.remove(KEYS.birth);
}

/**
 * Initial state at startup. URL params take precedence over storage and are saved
 * (overwrite the stored value). `fromUrl` tells the caller to clean the address bar.
 */
export function resolveInitialBirth(store, search, now = new Date()) {
  const fromUrl = birthFromSearch(search, now);
  if (fromUrl) {
    saveBirth(store, fromUrl);
    return { birth: fromUrl, fromUrl: true };
  }
  return { birth: loadBirth(store, now), fromUrl: false };
}
