// localStorage wrapper: every access is guarded (private windows, blocked storage),
// with an in-memory fallback so the app keeps working for the session.

export const KEYS = {
  birth: 'ac.birth',
  beautiful: 'ac.beautiful',
  theme: 'ac.theme',
  lang: 'ac.lang',
};

export function createStore(getStorage = () => globalThis.localStorage) {
  const memory = new Map();

  function read(key) {
    try {
      const v = getStorage().getItem(key);
      if (v !== null && v !== undefined) return v;
    } catch { /* storage unavailable */ }
    return memory.has(key) ? memory.get(key) : null;
  }

  function write(key, value) {
    memory.set(key, value);
    try { getStorage().setItem(key, value); } catch { /* storage unavailable */ }
  }

  function remove(key) {
    memory.delete(key);
    try { getStorage().removeItem(key); } catch { /* storage unavailable */ }
  }

  return {
    get: read,
    set: write,
    remove,
    getJSON(key) {
      const raw = read(key);
      if (raw === null) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    setJSON(key, value) { write(key, JSON.stringify(value)); },
  };
}
