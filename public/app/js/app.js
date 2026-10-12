import { parseBirth } from './calc.js';
import { buildModel } from './model.js';
import { pluralWord, formatNumber, formatDateTime } from './format.js';
import { detectLang, makeT } from './i18n.js';
import { createStore, KEYS } from './storage.js';
import {
  validateBirth, buildPermalink, saveBirth, clearBirth, resolveInitialBirth,
} from './birth.js';
import { buildIcs, eventFor, googleCalendarUrl } from './export.js';
import { initPwa } from './pwa.js';
import { bindThemeSelect } from '../../shared/theme.js';

const store = createStore();
const main = document.getElementById('main');

let lang = detectLang(store.get(KEYS.lang), navigator.language);
let t = makeT(lang);
/** { d: 'YYYY-MM-DD', t: 'HH:MM' | '' } of the saved/entered birth, or null. */
let birthState = null;
/** True while the prefilled form is shown instead of the calendar. */
let editing = false;
/** "Beautiful numbers" toggle (persisted). */
let beautiful = store.get(KEYS.beautiful) === '1';
/** Keys ('days:15000') of the rows ticked for export; survives re-renders. */
const selected = new Set();

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

function exportCtx() {
  return { birth: birthState, lang, t, appUrl: buildPermalink(appBaseUrl(), birthState), calName: t('appName') };
}

function rowEl(row, hasTime, onSelect) {
  const word = pluralWord(lang, row.unit, row.n);
  const num = `${formatNumber(row.n, lang)} ${word}`;
  const showTime = hasTime && row.unit === 'hours';
  const when = row.daysLeft === 0 ? t('today') : t('inDays', row.daysLeft, pluralWord(lang, 'days', row.daysLeft));
  const box = h('input', {
    type: 'checkbox', 'data-key': row.key, checked: selected.has(row.key), 'aria-label': t('selectRow', num),
    onchange: (e) => {
      if (e.target.checked) selected.add(row.key); else selected.delete(row.key);
      onSelect();
    },
  });
  return h('li', { class: 'item' },
    h('label', { class: 'check' }, box),
    h('div', { class: 'item-main' },
      h('span', { class: 'num' }, num),
      row.kind ? h('span', { class: 'badge', 'data-kind': row.kind }, t(`kind_${row.kind}`)) : null,
      h('span', { class: row.soon ? 'when soon' : 'when' },
        row.soon ? `${t('soon')} · ` : '',
        `${t('will')} ${formatDateTime(row.date, lang, showTime)}`,
        ` (${when})`)),
    h('div', { class: 'item-actions' },
      h('a', {
        class: 'gcal', href: googleCalendarUrl(eventFor(row, exportCtx())), target: '_blank', rel: 'noopener noreferrer',
        'aria-label': t('gcalFor', num),
      }, t('gcal'))));
}

function section(title, nowLine, rows, hasTime, onSelect) {
  return h('section', { class: 'card' },
    h('h2', {}, title),
    h('p', { class: 'now' }, nowLine),
    h('ul', { class: 'list' }, rows.map((r) => rowEl(r, hasTime, onSelect))));
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

function downloadIcs(rows) {
  const ics = buildIcs(rows, exportCtx());
  if (!ics) return;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `jubilees-${birthState.d}.ics` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSection(allRows) {
  const status = h('p', { class: 'status', role: 'status' });
  const btnSel = h('button', { class: 'btn', type: 'button', id: 'export-selected', onclick: () => {
    const rows = allRows.filter((r) => selected.has(r.key));
    if (!rows.length) { status.textContent = t('exportNone'); return; }
    downloadIcs(rows);
  } }, t('exportSelected'));
  const btnAll = h('button', { class: 'btn secondary', type: 'button', id: 'export-all', onclick: () => downloadIcs(allRows) }, t('exportAll'));
  return { el: h('section', { class: 'card' },
    h('h2', {}, t('exportTitle')),
    h('p', { class: 'hint' }, t('exportHint')),
    h('div', { class: 'export-actions' }, btnSel, btnAll),
    status), status };
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
  const model = buildModel(birth, now, { beautiful });
  const hasTime = !!birthState.t;

  const nowLine = (sec) => h('span', {}, `${t('nowDays')} `,
    h('strong', {}, formatNumber(sec.current, lang)), ` ${pluralWord(lang, sec.unit, sec.current)}`);

  const birthLine = h('section', { class: 'card birth-line', 'aria-label': t('birthLine') },
    h('strong', {}, t('birthLine')),
    h('span', { id: 'birth-text' }, formatDateTime(birth, lang, hasTime)),
    h('button', { class: 'btn link', type: 'button', id: 'btn-change', onclick: () => { editing = true; render(); main.focus({ preventScroll: true }); } }, t('change')),
    h('span', { 'aria-hidden': 'true' }, '/'),
    h('button', { class: 'btn link', type: 'button', id: 'btn-forget', onclick: forget }, t('forget')));

  const options = h('section', { class: 'card' },
    h('label', { class: 'check', for: 'opt-beautiful' },
      h('input', { type: 'checkbox', id: 'opt-beautiful', checked: beautiful, onchange: (e) => {
        beautiful = e.target.checked;
        store.set(KEYS.beautiful, beautiful ? '1' : '0');
        renderCalendar();
        document.getElementById('opt-beautiful').focus();
      } }),
      h('span', {}, h('strong', {}, t('beautifulToggle')), ' ', h('span', { class: 'hint' }, t('beautifulHint')))));

  const allRows = [...model.days.rows, ...model.hours.rows];
  const exp = exportSection(allRows);
  const onSelect = () => { exp.status.textContent = ''; };

  main.replaceChildren(
    birthLine,
    options,
    section(t('daysTitle'), nowLine(model.days), model.days.rows, hasTime, onSelect),
    section(t('hoursTitle'), nowLine(model.hours), model.hours.rows, hasTime, onSelect),
    exp.el,
    permalinkSection());
}

function showCalendar(b) {
  birthState = b;
  selected.clear();
  editing = false;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function forget() {
  clearBirth(store);
  selected.clear();
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
  initPwa({
    installBanner: document.getElementById('install-banner'),
    installButton: document.getElementById('install-btn'),
    iosHint: document.getElementById('ios-hint'),
    updateBanner: document.getElementById('update-banner'),
    updateButton: document.getElementById('update-btn'),
  });
}

boot();
