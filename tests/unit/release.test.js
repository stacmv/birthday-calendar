import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  STAMPED, nextVersion, checkManual, changelogSection, prependSection, stampVersion, stampPackage, currentVersion,
} from '../../scripts/release-lib.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const c = (subject, body = '') => ({ subject, body });

describe('nextVersion', () => {
  it('first release is 0.1.0 whatever the commits', () => {
    expect(nextVersion(null, [c('feat!: x')])).toBe('0.1.0');
    expect(nextVersion(null, [])).toBe('0.1.0');
  });
  it('in 0.x breaking and feat bump minor, the rest patch', () => {
    expect(nextVersion('v0.1.0', [c('fix(calc): x'), c('docs: y')])).toBe('0.1.1');
    expect(nextVersion('v0.1.0', [c('fix: x'), c('feat(export): y')])).toBe('0.2.0');
    expect(nextVersion('v0.1.3', [c('feat!: drop old URLs')])).toBe('0.2.0');
    expect(nextVersion('v0.1.3', [c('refactor: x', 'text\n\nBREAKING CHANGE: renamed')])).toBe('0.2.0');
    expect(nextVersion('v0.1.0', [c('chore: tidy')])).toBe('0.1.1');
  });
  it('from 1.0.0 on breaking bumps major', () => {
    expect(nextVersion('v1.2.3', [c('fix: x')])).toBe('1.2.4');
    expect(nextVersion('v1.2.3', [c('fix: x'), c('feat: y')])).toBe('1.3.0');
    expect(nextVersion('v1.2.3', [c('feat: y'), c('feat!: z')])).toBe('2.0.0');
    expect(nextVersion('v1.2.3', [c('fix: x', 'BREAKING CHANGE: storage key renamed')])).toBe('2.0.0');
  });
  it('nothing since the last tag is no release', () => {
    expect(nextVersion('v0.1.0', [])).toBeNull();
    expect(nextVersion('v0.1.0', [c('chore(release): v0.1.0')])).toBeNull();
    expect(nextVersion('v0.1.0', [c('Merge branch develop')])).toBeNull();
  });
  it('a malformed last tag is an error', () => {
    expect(() => nextVersion('release-7', [c('fix: x')])).toThrow();
  });
});

describe('checkManual', () => {
  it('accepts a well-formed version above the last tag', () => {
    expect(() => checkManual('1.0.0', 'v0.4.2')).not.toThrow();
    expect(() => checkManual('0.10.0', 'v0.9.9')).not.toThrow();
    expect(() => checkManual('0.1.0', null)).not.toThrow();
  });
  it.each([['0.4.2', 'v0.4.2'], ['0.3.9', 'v0.4.2'], ['1.0', 'v0.4.2'], ['v1.0.0', 'v0.4.2']])('refuses %s after %s', (v, tag) => {
    expect(() => checkManual(v, tag)).toThrow();
  });
});

describe('changelog', () => {
  it('groups by type and drops release and merge commits', () => {
    const s = changelogSection('0.3.0', '2026-10-22', [
      c('feat(export): Google Calendar'), c('fix(calc): leap years'), c('perf: faster list'),
      c('docs: readme'), c('chore(release): v0.2.0'), c('Merge branch develop'),
    ]);
    expect(s.startsWith('## 0.3.0 — 2026-10-22\n')).toBe(true);
    expect(s).toContain('### Новое\n\n- export: Google Calendar\n');
    expect(s).toContain('### Исправления\n\n- calc: leap years\n');
    expect(s).toContain('### Производительность\n\n- faster list\n');
    expect(s).toContain('### Прочее\n\n- readme\n');
    expect(s).not.toContain('v0.2.0');
    expect(s).not.toContain('Merge branch');
  });
  it('the first release says so instead of listing history', () => {
    const s = changelogSection('0.1.0', '2026-10-22', [c('feat: a'), c('fix: b')], true);
    expect(s.startsWith('## 0.1.0 — 2026-10-22\n')).toBe(true);
    expect(s).toContain('Первый релиз');
    expect(s).not.toContain('- a');
  });
  it('prepend keeps the title on top and older sections below', () => {
    const next = prependSection('# Изменения\n\n## 0.1.0 — 2026-10-22\n\nПервый релиз.\n', '## 0.2.0 — 2026-10-30\n\n### Новое\n\n- x\n');
    expect(next.startsWith('# Изменения\n\n## 0.2.0')).toBe(true);
    expect(next.indexOf('## 0.2.0')).toBeLessThan(next.indexOf('## 0.1.0'));
    expect(prependSection('', '## 0.1.0 — d\n')).toBe('# Изменения\n\n## 0.1.0 — d\n');
  });
});

describe('stamping', () => {
  it('rewrites every data-version span and nothing else', () => {
    const html = '<p><span data-i18n="versionLabel">Версия</span> <span data-version>dev</span></p><span>dev</span>';
    expect(stampVersion(html, '0.2.0')).toBe('<p><span data-i18n="versionLabel">Версия</span> <span data-version>0.2.0</span></p><span>dev</span>');
    expect(stampVersion(stampVersion(html, '0.2.0'), '0.3.0')).toContain('<span data-version>0.3.0</span>');
  });
  it('sets package.json and the lockfile root package version', () => {
    const lock = JSON.parse(stampPackage(JSON.stringify({ name: 'a', version: '1.0.0', packages: { '': { version: '1.0.0' }, 'node_modules/x': { version: '9.9.9' } } }), '0.1.0'));
    expect(lock.version).toBe('0.1.0');
    expect(lock.packages[''].version).toBe('0.1.0');
    expect(lock.packages['node_modules/x'].version).toBe('9.9.9');
  });
  it('the shipped pages show the current release (or dev before the first one)', () => {
    const version = currentVersion(root);
    for (const rel of STAMPED) {
      const html = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(html, rel).toContain(`<span data-version>${version}</span>`);
      expect(stampVersion(html, version), rel).toBe(html);
    }
  });
  it('version comes from the VERSION file or is dev', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-ver-'));
    try {
      expect(currentVersion(dir)).toBe('dev');
      fs.writeFileSync(path.join(dir, 'VERSION'), '0.4.2\n');
      expect(currentVersion(dir)).toBe('0.4.2');
      fs.writeFileSync(path.join(dir, 'VERSION'), '<b>\n');
      expect(currentVersion(dir)).toBe('dev');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
