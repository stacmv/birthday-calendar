/* Applies the saved theme before first paint (no flash). Classic script, loaded in <head>. */
(function () {
  try {
    var t = localStorage.getItem('ac.theme');
    if (t === 'light' || t === 'dark' || t === 'contrast' || t === 'system') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch { /* storage unavailable: stay on system */ }
})();
