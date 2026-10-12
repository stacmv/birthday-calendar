// Theme switcher shared by the app and the landing pages.

export const THEMES = ['system', 'light', 'dark', 'contrast'];
const KEY = 'ac.theme';

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (THEMES.includes(t)) return t;
  } catch { /* storage unavailable */ }
  return 'system';
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'system';
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(KEY, theme); } catch { /* storage unavailable */ }
}

/** Wire a <select> whose option values are theme names. */
export function bindThemeSelect(select) {
  select.value = getTheme();
  select.addEventListener('change', () => setTheme(select.value));
}
