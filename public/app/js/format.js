// Localisation helpers: plurals, numbers, dates. Pure, language passed explicitly.

const NBSP = String.fromCharCode(0xa0);

export const LANGS = ['ru', 'en'];

const UNIT_FORMS = {
  ru: {
    days: ['день', 'дня', 'дней'],
    hours: ['час', 'часа', 'часов'],
  },
  en: {
    days: ['day', 'days'],
    hours: ['hour', 'hours'],
  },
};

/** Russian plural: forms = [one, few, many]. */
export function ruPlural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** English plural: forms = [singular, plural]. */
export function enPlural(n, forms) {
  return Math.abs(n) === 1 ? forms[0] : forms[1];
}

export function pluralWord(lang, unit, n) {
  const forms = UNIT_FORMS[lang][unit];
  return lang === 'ru' ? ruPlural(n, forms) : enPlural(n, forms);
}

/** 12345 -> "12 345" (ru, non-breaking space) / "12,345" (en). */
export function formatNumber(n, lang) {
  const s = String(Math.trunc(n));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'ru' ? NBSP : ',');
}

/** "15 мая 2030" (ru, no trailing "г.") / "May 15, 2030" (en). Uses the browser time zone. */
export function formatDate(date, lang) {
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (lang !== 'ru') return new Intl.DateTimeFormat('en-US', opts).format(date);
  const parts = new Intl.DateTimeFormat('ru-RU', opts).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('day')} ${get('month')} ${get('year')}`;
}

/** "14:30" in both languages. */
export function formatTime(date) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

/** Date plus optional time, e.g. "15 мая 2030, 14:30". */
export function formatDateTime(date, lang, withTime) {
  const d = formatDate(date, lang);
  return withTime ? `${d}, ${formatTime(date)}` : d;
}
