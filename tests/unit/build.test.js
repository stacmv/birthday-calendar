import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { shellFiles, computeVersion, stamp, renderBlock } from '../../scripts/build.mjs';

const swPath = path.resolve(import.meta.dirname, '../../public/app/sw.js');

describe('build stamp', () => {
  const files = shellFiles();

  it('lists shell files relative to the app scope, without sw.js and offline.html', () => {
    const urls = files.map((f) => f.url);
    expect(urls).toContain('index.html');
    expect(urls).toContain('manifest.webmanifest');
    expect(urls).toContain('../shared/themes.css');
    expect(urls).not.toContain('sw.js');
    expect(urls).not.toContain('offline.html');
    expect(urls).toEqual([...urls].sort());
  });
  it('version is a 12-char hex hash', () => {
    expect(computeVersion(files)).toMatch(/^[0-9a-f]{12}$/);
  });
  it('stamp is idempotent and replaces only the marked block', () => {
    const src = fs.readFileSync(swPath, 'utf8');
    const once = stamp(src, files);
    expect(stamp(once, files)).toBe(once);
    expect(once.slice(0, once.indexOf('/* BUILD:BEGIN */'))).toBe(src.slice(0, src.indexOf('/* BUILD:BEGIN */')));
    expect(once).toContain(renderBlock(files, computeVersion(files)));
  });
  it('the committed sw.js is up to date (run `make build` otherwise)', () => {
    const src = fs.readFileSync(swPath, 'utf8');
    expect(stamp(src, files)).toBe(src);
  });
  it('throws without markers', () => {
    expect(() => stamp('nothing', files)).toThrow();
  });
});
