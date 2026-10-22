// Cut a release: the next SemVer from Conventional Commits since the last tag (scripts/release-lib.mjs),
// VERSION, a CHANGELOG.md section, the version stamped into the pages and package.json, sw.js rebuilt,
// a "chore(release): vX.Y.Z" commit on develop, the vX.Y.Z tag, master moved to it, all pushed.
//
//   node scripts/release.mjs                  show the version and the changelog section, change nothing
//   node scripts/release.mjs --apply          do it
//   node scripts/release.mjs --version=1.0.0  a version by hand instead of the computed one (e.g. leaving 0.x)
//
// Refuses unless on develop with a clean tree, level with origin/develop, and master is behind develop
// (a release never rewrites master). Production deploys the tag, not the working copy: make deploy-prod.
//
// Make targets: make release-check / make release [V=1.0.0]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STAMPED, nextVersion, checkManual, changelogSection, prependSection, stampVersion, stampPackage,
} from './release-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_BRANCH = 'master';

/** Runs git in the project, returns trimmed stdout; exits on failure unless mayFail (then null). */
function git(args, mayFail = false) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    if (mayFail) return null;
    console.error(`git ${args.join(' ')} failed:\n${e.stderr || e.message}`);
    process.exit(1);
  }
}

function refuse(why) {
  console.error(`Release refused: ${why}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const manual = args.find((a) => a.startsWith('--version='))?.slice('--version='.length) || null;

const lastTag = git(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'], true);
const raw = git(['log', lastTag ? `${lastTag}..HEAD` : 'HEAD', '--format=%s%x1f%b%x1e']);
const commits = raw.split('\x1e').map((r) => r.trim()).filter(Boolean).map((r) => {
  const [subject, body = ''] = r.split('\x1f');
  return { subject: subject.trim(), body: body.trim() };
});

let version;
try {
  if (manual) {
    checkManual(manual, lastTag);
    version = manual;
  } else {
    version = nextVersion(lastTag, commits);
  }
} catch (e) {
  refuse(e.message);
}
if (version === null) {
  console.log(`Nothing to release since ${lastTag}.`);
  process.exit(0);
}

// Moscow day, not UTC: a release cut after midnight in Moscow is dated that day.
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date());
const section = changelogSection(version, today, commits, lastTag === null);

console.log(`Last release: ${lastTag ?? 'none'}\nNext release: v${version} (${commits.length} commits)\n\n${section}`);
if (!apply) {
  console.log('Dry run. make release to cut it.');
  process.exit(0);
}

if (git(['rev-parse', '--abbrev-ref', 'HEAD']) !== 'develop') refuse('releases are cut from develop.');
if (git(['status', '--porcelain']) !== '') refuse('the working tree is not clean.');
git(['fetch', '-q', 'origin']);
if (git(['rev-list', '--count', 'HEAD..origin/develop']) !== '0') refuse('origin/develop has commits you do not; pull first.');
for (const ref of [RELEASE_BRANCH, `origin/${RELEASE_BRANCH}`]) {
  if (git(['rev-parse', '--verify', '-q', ref], true) !== null && git(['merge-base', '--is-ancestor', ref, 'HEAD'], true) === null) {
    refuse(`${ref} has commits develop does not; a release never rewrites ${RELEASE_BRANCH}.`);
  }
}

const rw = (rel, fn) => {
  const file = path.join(ROOT, rel);
  fs.writeFileSync(file, fn(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''));
};
rw('VERSION', () => `${version}\n`);
rw('CHANGELOG.md', (s) => prependSection(s, section));
for (const rel of STAMPED) rw(rel, (s) => stampVersion(s, version));
for (const rel of ['package.json', 'package-lock.json']) rw(rel, (s) => stampPackage(s, version));
// The pages changed, so the service worker's shell hash changes: installed PWAs pick up the release.
execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit' });

git(['add', 'VERSION', 'CHANGELOG.md', 'package.json', 'package-lock.json', 'public/app/sw.js', ...STAMPED]);
git(['commit', '-q', '-m', `chore(release): v${version}`]);
git(['tag', '-a', `v${version}`, '-m', `Release v${version}`]);
git(['branch', '-f', RELEASE_BRANCH, 'HEAD']);
git(['push', '-q', 'origin', 'develop', RELEASE_BRANCH, `v${version}`]);

console.log(`Released v${version}: develop, ${RELEASE_BRANCH} and tag v${version} pushed.\nNext: make deploy-check, then make deploy-prod.`);
