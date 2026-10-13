import { describe, it, expect, vi } from 'vitest';
import { PROMO_CONCEPTS, pickConcept, initPromo } from '../../public/shared/promo.js';

function fakeVideo() {
  const source = { src: '' };
  return {
    poster: '', dataset: {}, autoplay: false, source,
    querySelector: (sel) => (sel === 'source' ? source : null),
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
  };
}

describe('pickConcept', () => {
  it('maps the random range onto every concept', () => {
    expect(pickConcept(() => 0)).toBe(PROMO_CONCEPTS[0]);
    expect(pickConcept(() => 0.999999)).toBe(PROMO_CONCEPTS.at(-1));
    const seen = new Set(PROMO_CONCEPTS.map((_, i) => pickConcept(() => (i + 0.5) / PROMO_CONCEPTS.length)));
    expect(seen.size).toBe(PROMO_CONCEPTS.length);
  });

  it('never goes out of range even if random returns 1', () => {
    expect(pickConcept(() => 1)).toBe(PROMO_CONCEPTS.at(-1));
  });
});

describe('initPromo', () => {
  it('sets language-specific source and poster and autoplays', () => {
    const v = fakeVideo();
    const c = initPromo(v, { lang: 'en', random: () => 0.5, reducedMotion: false });
    expect(c).toBe(pickConcept(() => 0.5));
    expect(v.source.src).toBe(`../video/en/${c}.mp4`);
    expect(v.poster).toBe(`../video/en/${c}.jpg`);
    expect(v.dataset.concept).toBe(c);
    expect(v.autoplay).toBe(true);
    expect(v.load).toHaveBeenCalled();
    expect(v.play).toHaveBeenCalled();
  });

  it('does not autoplay with reduced motion', () => {
    const v = fakeVideo();
    initPromo(v, { lang: 'ru', random: () => 0, reducedMotion: true });
    expect(v.autoplay).toBe(false);
    expect(v.play).not.toHaveBeenCalled();
    expect(v.source.src).toBe('../video/ru/odometer.mp4');
  });

  it('swallows a rejected play() (autoplay blocked)', async () => {
    const v = fakeVideo();
    v.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    expect(() => initPromo(v, { lang: 'ru', reducedMotion: false })).not.toThrow();
    await Promise.resolve();
  });

  it('returns null without a video element', () => {
    expect(initPromo(null, { lang: 'ru' })).toBeNull();
  });
});
