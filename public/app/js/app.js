import { parseBirth, isValidDateStr, isValidTimeStr } from './calc.js';
import { buildModel } from './model.js';
import { pluralWord, formatNumber, formatDateTime } from './format.js';
import { detectLang, makeT } from './i18n.js';
import { createStore, KEYS } from './storage.js';
import { bindThemeSelect } from '../../shared/theme.js';

const store = createStore();
const main = document.getElementById('main');

let lang = detectLang(store.get(KEYS.lang), navigator.language);
let t = makeT(lang);
/** { d: 'YYYY-MM-DD', t: 'HH:MM' | '' } or null when no calendar is shown. */
let birthState = null;

/** Tiny DOM helper: h('div', {class: 'x'}, child, 'text'). */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function applyStaticStrings() {
  document.documentElement.lang = lang;
  document.title = t('appName');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  document.getElementById('lang').value = lang;
}

function setLang(next) {
  lang = next;
  t = makeT(lang);
  store.set(KEYS.lang, lang);
  applyStaticStrings();
  render();
}

function appBaseUrl() {
  return new URL('./', location.href);
}

function permalinkFor(b) {
  const url = new URL(appBaseUrl());
  url.searchParams.set('d', b.d);
  if (b.t) url.searchParams.set('t', b.t);
  return url.toString();
}

// ---------- views ----------

function renderForm() {
  const prefill = birthState || { d: '', t: '' };
  const error = h('p', { class: 'error', role: 'alert', id: 'form-error', hidden: true });
  const dateInput = h('input', { type: 'date', id: 'f-date', name: 'd', required: true, value: prefill.d });
  const timeInput = h('input', { type: 'time', id: 'f-time', name: 't', value: prefill.t });

  const form = h('form', { class: 'card', novalidate: true, onsubmit: (e) => {
    e.preventDefault();
    const b = { d: dateInput.value, t: timeInput.value };
    const problem = validateBirth(b);
    if (problem) {
      error.textContent = t(problem);
      error.hidden = false;
      (problem === 'errTime' ? timeInput : dateInput).focus();
      return;
    }
    showCalendar(b);
  } },
  h('h2', {}, t('formTitle')),
  error,
  h('div', { class: 'field' },
    h('label', { for: 'f-date' }, t('dateLabel'), ' ', h('span', { class: 'hint' }, `(${t('dateRequired')})`)),
    dateInput),
  h('div', { class: 'field' },
    h('label', { for: 'f-time' }, t('timeLabel'), ' ', h('span', { class: 'hint' }, `(${t('timeOptional')})`)),
    timeInput,
    h('p', { class: 'hint' }, t('timeNote'))),
  h('button', { class: 'btn', type: 'submit' }, t('submit')));

  main.replaceChildren(form);
}

function validateBirth(b) {
  if (!isValidDateStr(b.d)) return 'errDate';
  if (b.t && !isValidTimeStr(b.t)) return 'errTime';
  if (parseBirth(b.d, b.t) > new Date()) return 'errFuture';
  return null;
}

function rowEl(row, hasTime) {
  const word = pluralWord(lang, row.unit, row.n);
  const num = `${formatNumber(row.n, lang)} ${word}`;
  const showTime = hasTime && row.unit === 'hours';
  const when = row.daysLeft === 0 ? t('today') : t('inDays', row.daysLeft, pluralWord(lang, 'days', row.daysLeft));
  return h('li', { class: 'item' },
    h('div', { class: 'item-main' },
      h('span', { class: 'num' }, num),
      h('span', { class: row.soon ? 'when soon' : 'when' },
        row.soon ? `${t('soon')} · ` : '',
        `${t('will')} ${formatDateTime(row.date, lang, showTime)}`,
        ` (${when})`)));
}

function section(title, nowLine, rows, hasTime) {
  return h('section', { class: 'card' },
    h('h2', {}, title),
    h('p', { class: 'now' }, nowLine),
    h('ul', { class: 'list' }, rows.map((r) => rowEl(r, hasTime))));
}

function renderCalendar() {
  const birth = parseBirth(birthState.d, birthState.t);
  const now = new Date();
  const model = buildModel(birth, now);
  const hasTime = !!birthState.t;

  const nowLine = (sec) => h('span', {}, `${t('nowDays')} `,
    h('strong', {}, formatNumber(sec.current, lang)), ` ${pluralWord(lang, sec.unit, sec.current)}`);

  const birthLine = h('section', { class: 'card birth-line' },
    h('strong', {}, t('birthLine')),
    h('span', {}, formatDateTime(birth, lang, hasTime)));

  const link = permalinkFor(birthState);
  const perma = h('section', { class: 'card' },
    h('h2', {}, t('permalink')),
    h('a', { href: link }, link));

  main.replaceChildren(
    birthLine,
    section(t('daysTitle'), nowLine(model.days), model.days.rows, hasTime),
    section(t('hoursTitle'), nowLine(model.hours), model.hours.rows, hasTime),
    perma);
}

function showCalendar(b) {
  birthState = b;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function render() {
  if (birthState && !validateBirth(birthState)) renderCalendar();
  else renderForm();
}

// ---------- boot ----------

function boot() {
  const params = new URLSearchParams(location.search);
  const fromUrl = { d: params.get('d') || '', t: params.get('t') || '' };
  if (fromUrl.d && !validateBirth(fromUrl)) birthState = fromUrl;

  applyStaticStrings();
  bindThemeSelect(document.getElementById('theme'));
  document.getElementById('lang').addEventListener('change', (e) => setLang(e.target.value));
  render();
}

boot();
