import { describe, it, expect } from 'vitest';
import {
  dateStamp, nextDateStamp, utcStamp, escapeText, foldLine, eventFor, nextBatchEvent,
  buildIcs, googleCalendarUrl, PRODID,
} from '../../public/app/js/export.js';
import { makeT } from '../../public/app/js/i18n.js';
import { makeRow } from '../../public/app/js/model.js';

const APP_URL = 'https://example.test/app/?d=1990-05-15&t=14%3A30';
const NOW = new Date(Date.UTC(2026, 9, 12, 7, 0, 0));

function ctx(over = {}) {
  return { birth: { d: '1990-05-15', t: '14:30' }, lang: 'en', t: makeT('en'), appUrl: APP_URL, ...over };
}
function row(unit, n, birth = new Date(1990, 4, 15, 14, 30)) {
  return makeRow(unit, n, null, 0, birth, NOW);
}

describe('stamps', () => {
  it('local date and next day', () => {
    const d = new Date(2030, 11, 31, 23, 30);
    expect(dateStamp(d)).toBe('20301231');
    expect(nextDateStamp(d)).toBe('20310101');
  });
  it('UTC stamp', () => {
    expect(utcStamp(new Date(Date.UTC(2030, 0, 2, 3, 4, 5)))).toBe('20300102T030405Z');
  });
});

describe('escapeText', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeText('a\\b;c,d\ne\r\nf')).toBe('a\\\\b\\;c\\,d\\ne\\nf');
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });
  it('folds long ASCII at 75 octets with a leading space', () => {
    const folded = foldLine(`X:${'a'.repeat(200)}`).split('\r\n');
    expect(folded.length).toBeGreaterThan(2);
    expect(folded[0]).toHaveLength(75);
    for (const l of folded.slice(1)) {
      expect(l.startsWith(' ')).toBe(true);
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    }
    expect(folded.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(`X:${'a'.repeat(200)}`);
  });
  it('never splits a multibyte character and counts octets', () => {
    const text = `SUMMARY:${'Юбилей '.repeat(30)}`;
    const folded = foldLine(text).split('\r\n');
    for (const l of folded) {
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
      expect(l).not.toContain('�');
    }
    expect(folded.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(text);
  });
});

describe('eventFor', () => {
  it('timed event when the birth time is known', () => {
    const ev = eventFor(row('days', 10000), ctx());
    expect(ev.allDay).toBe(false);
    expect(ev.end - ev.start).toBe(3600000);
    expect(ev.summary).toBe('10,000 days since birth');
    expect(ev.uid).toBe('ac-19900515T1430-days-10000@anniversary-calendar');
    expect(ev.description).toContain(APP_URL);
  });
  it('all-day event without a birth time, Russian title', () => {
    const c = ctx({ birth: { d: '1990-05-15', t: '' }, lang: 'ru', t: makeT('ru') });
    const ev = eventFor(row('hours', 300000, new Date(1990, 4, 15)), c);
    expect(ev.allDay).toBe(true);
    expect(ev.end).toBeNull();
    expect(ev.summary).toBe('300 000 часов с рождения');
    expect(ev.uid).toBe('ac-19900515-hours-300000@anniversary-calendar');
  });
  it('uid is stable', () => {
    expect(eventFor(row('days', 10000), ctx()).uid).toBe(eventFor(row('days', 10000), ctx()).uid);
  });
});

describe('buildIcs', () => {
  const rows = [row('days', 20000), row('days', 15000), row('hours', 400000)];
  const ics = buildIcs(rows, ctx(), NOW);

  it('returns null for no rows', () => {
    expect(buildIcs([], ctx(), NOW)).toBeNull();
  });
  it('is a CRLF-only VCALENDAR with required properties', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain(`PRODID:${PRODID}\r\n`);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(ics).toContain('DTSTAMP:20261012T070000Z\r\n');
  });
  it('has one event per row plus the trailing next-batch event', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(rows.length + 1);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(rows.length + 1);
    expect(ics.match(/^UID:/gm)).toHaveLength(rows.length + 1);
    expect(new Set(ics.match(/^UID:.*$/gm)).size).toBe(rows.length + 1);
  });
  it('lines are at most 75 octets', () => {
    for (const l of ics.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
  it('timed events use UTC Z stamps', () => {
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z\r\n/);
    expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z\r\n/);
  });
  it('events are chronological and the next-batch event is last', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    const events = unfolded.split('BEGIN:VEVENT').slice(1);
    const starts = events.map((e) => /DTSTART[^:]*:(\d{8})/.exec(e)[1]);
    expect(starts).toEqual([...starts].sort());
    const last = events[events.length - 1];
    expect(last).toContain('SUMMARY:Jubilee calendar: get the next jubilees');
    expect(last).toContain(`URL:${APP_URL}`);
    expect(last).toContain('DTSTART;VALUE=DATE:');
    expect(last).toContain('DTEND;VALUE=DATE:');
    const lastJubilee = [...rows].sort((a, b) => a.date - b.date).at(-1);
    expect(last).toContain(`DTSTART;VALUE=DATE:${dateStamp(lastJubilee.date)}`);
    expect(unfolded.match(/^URL:/gm)).toHaveLength(1);
  });
  it('does not TEXT-escape the URL value but escapes description commas', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`URL:${APP_URL}\r\n`);
    expect(unfolded).toContain('SUMMARY:15\\,000 days since birth');
  });
  it('all-day export without birth time', () => {
    const c = ctx({ birth: { d: '1990-05-15', t: '' }, appUrl: 'https://example.test/app/?d=1990-05-15' });
    const out = buildIcs([row('days', 15000, new Date(1990, 4, 15))], c, NOW);
    expect(out).toMatch(/DTSTART;VALUE=DATE:\d{8}\r\n/);
    expect(out).not.toMatch(/DTSTART:/);
    expect(out).toContain('TRANSP:TRANSPARENT');
  });
  it('nextBatchEvent is dated on the last jubilee', () => {
    const r = row('days', 20000);
    const ev = nextBatchEvent(r, ctx());
    expect(ev.allDay).toBe(true);
    expect(ev.start).toBe(r.date);
    expect(ev.uid).toContain('-next-days-20000@');
  });
  it('adds a calendar name when given', () => {
    expect(buildIcs([row('days', 15000)], ctx({ calName: 'Jubilees, mine' }), NOW)).toContain('X-WR-CALNAME:Jubilees\\, mine\r\n');
  });
});

describe('googleCalendarUrl', () => {
  it('timed event: UTC start/end', () => {
    const ev = eventFor(row('days', 10000), ctx());
    const url = new URL(googleCalendarUrl(ev));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('10,000 days since birth');
    expect(url.searchParams.get('dates')).toBe(`${utcStamp(ev.start)}/${utcStamp(ev.end)}`);
    expect(url.searchParams.get('details')).toContain(APP_URL);
  });
  it('all-day event: YYYYMMDD/YYYYMMDD+1', () => {
    const c = ctx({ birth: { d: '1990-05-15', t: '' } });
    const r = row('days', 15000, new Date(1990, 4, 15));
    const ev = eventFor(r, c);
    const dates = new URL(googleCalendarUrl(ev)).searchParams.get('dates');
    expect(dates).toBe(`${dateStamp(r.date)}/${nextDateStamp(r.date)}`);
    expect(dates).toMatch(/^\d{8}\/\d{8}$/);
  });
  it('encodes special characters', () => {
    const url = googleCalendarUrl({ summary: 'a&b c', description: 'x=y', allDay: true, start: new Date(2030, 0, 1) });
    expect(url).toContain('text=a%26b%20c');
    expect(url).toContain('details=x%3Dy');
  });
});
