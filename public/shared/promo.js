// Promo video on the landing: pick one of the concept videos at random.
// Markup ships a working default (first concept) so the page works without JS.
// With prefers-reduced-motion the video never autoplays; controls stay available.

export const PROMO_CONCEPTS = ['odometer', 'holiday', 'invitation', 'numbers', 'newspaper'];

export function pickConcept(random = Math.random) {
  return PROMO_CONCEPTS[Math.min(PROMO_CONCEPTS.length - 1, Math.floor(random() * PROMO_CONCEPTS.length))];
}

export function initPromo(video, { lang, random = Math.random, reducedMotion } = {}) {
  if (!video) return null;
  const concept = pickConcept(random);
  const base = `../video/${lang}/${concept}`;
  video.poster = `${base}.jpg`;
  const source = video.querySelector('source');
  if (source) source.src = `${base}.mp4`;
  else video.src = `${base}.mp4`;
  video.dataset.concept = concept;
  const reduce = reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  video.autoplay = !reduce;
  video.load();
  if (!reduce) {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }
  return concept;
}
