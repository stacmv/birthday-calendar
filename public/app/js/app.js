import { parseBirth } from './calc.js';
import { buildModel } from './model.js';
import { pluralWord, formatNumber, formatDateTime } from './format.js';
import { detectLang, makeT } from './i18n.js';
import { createStore, KEYS } from './storage.js';
import {
  validateBirth, buildPermalink, saveBirth, clearBirth, resolveInitialBirth,
} from './birth.js';
import { bindThemeSelect } from '../../shared/theme.js';

const store = createStore();
const main = document.getElementById('main');

let lang = detectLang(store.get(KEYS.lang), navigator.language);
let t = makeT(lang);
/** { d: 'YYYY-MM-DD', t: 'HH:MM' | '' } of the saved/entered birth, or null. */
let birthState = null;
/** True while the prefilled form is shown instead of the calendar. */
let editing = false;

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
  return new URL('./', location.href).toString();
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
    saveBirth(store, b);
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

async function copyText(text, input, status) {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = t('copied');
  } catch {
    // Insecure context or denied: select the text so the user can copy it by hand.
    input.focus();
    input.select();
    status.textContent = t('copyFail');
  }
}

function permalinkSection() {
  const link = buildPermalink(appBaseUrl(), birthState);
  const input = h('input', { type: 'text', readonly: true, id: 'permalink', value: link });
  const status = h('p', { class: 'status', role: 'status' });
  return h('section', { class: 'card' },
    h('h2', {}, t('permalink')),
    h('div', { class: 'permalink' },
      h('label', { class: 'sr-only', for: 'permalink' }, t('permalink')),
      input,
      h('button', { class: 'btn secondary', type: 'button', id: 'copy-link', onclick: () => copyText(link, input, status) }, t('copy'))),
    status);
}

function renderCalendar() {
  const birth = parseBirth(birthState.d, birthState.t);
  const now = new Date();
  const model = buildModel(birth, now);
  const hasTime = !!birthState.t;

  const nowLine = (sec) => h('span', {}, `${t('nowDays')} `,
    h('strong', {}, formatNumber(sec.current, lang)), ` ${pluralWord(lang, sec.unit, sec.current)}`);

  const birthLine = h('section', { class: 'card birth-line', 'aria-label': t('birthLine') },
    h('strong', {}, t('birthLine')),
    h('span', { id: 'birth-text' }, formatDateTime(birth, lang, hasTime)),
    h('button', { class: 'btn link', type: 'button', id: 'btn-change', onclick: () => { editing = true; render(); main.focus({ preventScroll: true }); } }, t('change')),
    h('span', { 'aria-hidden': 'true' }, '/'),
    h('button', { class: 'btn link', type: 'button', id: 'btn-forget', onclick: forget }, t('forget')));

  main.replaceChildren(
    birthLine,
    section(t('daysTitle'), nowLine(model.days), model.days.rows, hasTime),
    section(t('hoursTitle'), nowLine(model.hours), model.hours.rows, hasTime),
    permalinkSection());
}

function showCalendar(b) {
  birthState = b;
  editing = false;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function forget() {
  clearBirth(store);
  birthState = null;
  editing = false;
  render();
  main.focus({ preventScroll: true });
}

function render() {
  if (birthState && !editing && !validateBirth(birthState)) renderCalendar();
  else renderForm();
}

// ---------- boot ----------

function boot() {
  const initial = resolveInitialBirth(store, location.search);
  birthState = initial.birth;
  if (initial.fromUrl) {
    // The values are saved now: drop the params so "Forget" is not undone by a reload.
    history.replaceState(null, '', location.pathname + location.hash);
  }

  applyStaticStrings();
  bindThemeSelect(document.getElementById('theme'));
  document.getElementById('lang').addEventListener('change', (e) => setLang(e.target.value));
  render();
}

boot();
