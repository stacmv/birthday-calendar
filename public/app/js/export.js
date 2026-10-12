// Calendar export: event descriptors, RFC 5545 (.ics) builder and Google Calendar links. Pure.

import { addDays } from './calc.js';
import { formatNumber, pluralWord } from './format.js';

export const PRODID = '-//anniversary-calendar//Jubilee Calendar//EN';
export const UID_DOMAIN = 'anniversary-calendar';
export const EVENT_HOURS = 1;
const MAX_OCTETS = 75;
const encoder = new TextEncoder();

const pad = (n, len = 2) => String(n).padStart(len, '0');

/** Local calendar date as YYYYMMDD. */
export function dateStamp(date) {
  return `${pad(date.getFullYear(), 4)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/** Local calendar date of the following day as YYYYMMDD (DTEND of all-day events is exclusive). */
export function nextDateStamp(date) {
  return dateStamp(addDays(date, 1));
}

/** UTC timestamp as YYYYMMDDTHHMMSSZ. */
export function utcStamp(date) {
  return `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/** Escape a TEXT value (SUMMARY, DESCRIPTION). URL values must not be escaped. */
export function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Fold a content line at 75 octets (UTF-8), never splitting a character. Continuations start with a space. */
export function foldLine(line) {
  let out = '';
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > MAX_OCTETS) {
      out += `${cur}\r\n`;
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += size;
  }
  return out + cur;
}

function birthKey(b) {
  return b.d.replace(/-/g, '') + (b.t ? `T${b.t.replace(':', '')}` : '');
}

/**
 * Event descriptor for one jubilee row.
 * ctx = { birth: {d, t}, lang, t (translator), appUrl }
 * @returns {{uid, summary, description, allDay, start: Date, end: Date|null, url: string}}
 */
export function eventFor(row, ctx) {
  const hasTime = !!ctx.birth.t;
  const num = formatNumber(row.n, ctx.lang);
  const summary = ctx.t('evtTitle', num, pluralWord(ctx.lang, row.unit, row.n));
  return {
    uid: `ac-${birthKey(ctx.birth)}-${row.unit}-${row.n}@${UID_DOMAIN}`,
    summary,
    description: `${ctx.t('evtDesc')} ${ctx.appUrl}`,
    allDay: !hasTime,
    start: row.date,
    end: hasTime ? new Date(row.date.getTime() + EVENT_HOURS * 3600000) : null,
    url: '',
  };
}

/** The trailing "get the next jubilees" event: all-day, on the date of the last exported jubilee. */
export function nextBatchEvent(lastRow, ctx) {
  return {
    uid: `ac-${birthKey(ctx.birth)}-next-${lastRow.unit}-${lastRow.n}@${UID_DOMAIN}`,
    summary: ctx.t('evtNextTitle'),
    description: `${ctx.t('evtNextDesc')} ${ctx.appUrl}`,
    allDay: true,
    start: lastRow.date,
    end: null,
    url: ctx.appUrl,
  };
}

function vevent(ev, stamp) {
  const lines = ['BEGIN:VEVENT', `UID:${ev.uid}`, `DTSTAMP:${stamp}`];
  if (ev.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(ev.start)}`, `DTEND;VALUE=DATE:${nextDateStamp(ev.start)}`);
  } else {
    lines.push(`DTSTART:${utcStamp(ev.start)}`, `DTEND:${utcStamp(ev.end)}`);
  }
  lines.push(`SUMMARY:${escapeText(ev.summary)}`, `DESCRIPTION:${escapeText(ev.description)}`);
  if (ev.url) lines.push(`URL:${ev.url}`);
  if (ev.allDay) lines.push('TRANSP:TRANSPARENT');
  lines.push('END:VEVENT');
  return lines;
}

/**
 * Full .ics text for the given rows. Events are sorted chronologically; the LAST event is the
 * "next batch" link, dated on the last exported jubilee. Empty `rows` -> null.
 * ctx = { birth, lang, t, appUrl, calName? }
 */
export function buildIcs(rows, ctx, now = new Date()) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => a.date - b.date || a.n - b.n);
  const stamp = utcStamp(now);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID}`, 'CALSCALE:GREGORIAN'];
  if (ctx.calName) lines.push(`X-WR-CALNAME:${escapeText(ctx.calName)}`);
  for (const row of sorted) lines.push(...vevent(eventFor(row, ctx), stamp));
  lines.push(...vevent(nextBatchEvent(sorted[sorted.length - 1], ctx), stamp));
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/** "Add to Google Calendar" link for a single event descriptor. */
export function googleCalendarUrl(ev) {
  const dates = ev.allDay
    ? `${dateStamp(ev.start)}/${nextDateStamp(ev.start)}`
    : `${utcStamp(ev.start)}/${utcStamp(ev.end)}`;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(ev.summary)}`
    + `&dates=${dates}`
    + `&details=${encodeURIComponent(ev.description)}`;
}
