// PWA glue: service worker registration, update prompt and the install button.

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || navigator.standalone === true;

/**
 * @param {{
 *   installBanner: HTMLElement, installButton: HTMLButtonElement, iosHint: HTMLElement,
 *   updateBanner: HTMLElement, updateButton: HTMLButtonElement,
 * }} ui
 */
export function initPwa(ui) {
  initInstall(ui);
  if (!('serviceWorker' in navigator)) return;

  // A page that already had a controller is being updated; a first install must not reload.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  const offerUpdate = (worker) => {
    ui.updateBanner.hidden = false;
    ui.updateButton.onclick = () => worker.postMessage({ type: 'SKIP_WAITING' });
  };

  navigator.serviceWorker.register('sw.js', { scope: './' }).then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => { /* insecure origin or blocked: the app works without it */ });
}

function initInstall(ui) {
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    ui.installBanner.hidden = false;
    ui.iosHint.hidden = true;
    ui.installButton.hidden = false;
  });

  ui.installButton.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null;
    ui.installBanner.hidden = true;
  });

  window.addEventListener('appinstalled', () => { ui.installBanner.hidden = true; });

  if (isIos() && !isStandalone()) {
    ui.installBanner.hidden = false;
    ui.installButton.hidden = true;
    ui.iosHint.hidden = false;
  }
}
