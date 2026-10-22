import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

describe('version stamp', () => {
  // make release (devtools) rewrites these spans; a working copy before the first release shows "dev".
  it('every page in release.config.json shows the current VERSION', () => {
    const raw = fs.existsSync(path.join(root, 'VERSION')) ? fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim() : '';
    const version = /^\d+\.\d+\.\d+$/.test(raw) ? raw : 'dev';
    const { stamp } = JSON.parse(fs.readFileSync(path.join(root, 'release.config.json'), 'utf8'));
    expect(stamp.length).toBeGreaterThan(0);
    for (const { file } of stamp) {
      expect(fs.readFileSync(path.join(root, file), 'utf8'), file).toContain(`<span data-version>${version}</span>`);
    }
  });
});
