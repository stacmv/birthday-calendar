// Releases: the next SemVer from Conventional Commits since the last tag, the CHANGELOG.md section made
// of the same commits, and the version stamped into the static pages and package.json.
// Pure — no git here: scripts/release.mjs reads the tag and the commits, commits, tags and pushes.
//
//   The first release is 0.1.0.
//   0.x: feat or breaking -> minor, anything else -> patch; 1.0.0 only on purpose (make release V=1.0.0).
//   1.x and later: "type!:" or a "BREAKING CHANGE:" footer -> major, feat -> minor, anything else -> patch.
import fs from 'node:fs';
import path from 'node:path';

export const FIRST = '0.1.0';

const SUBJECT = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<bang>!)?:\s*(?<text>.+)$/i;
const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;
/** Section titles in CHANGELOG order; other types go to OTHER. */
const GROUPS = { feat: 'Новое', fix: 'Исправления', perf: 'Производительность' };
const OTHER = 'Прочее';
const TITLE = '# Изменения';

/** Static pages that show the version: `<span data-version>…</span>` is rewritten on release. */
export const STAMPED = ['public/app/index.html', 'public/ru/index.html', 'public/en/index.html'];

function parseVersion(version, shown = version) {
  const m = VERSION_RE.exec(version);
  if (!m) throw new Error(`"${shown}" is not a MAJOR.MINOR.PATCH version`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parse(subject) {
  const m = SUBJECT.exec(subject.trim());
  if (!m) return null;
  const { type, scope = '', bang, text } = m.groups;
  return { type: type.toLowerCase(), scope, bang: bang === '!', text: text.trim() };
}

/** Commits that tell something: no merges, no earlier release commits. */
function relevant(commits) {
  return commits.filter((c) => !c.subject.startsWith('Merge ') && !c.subject.startsWith('chore(release):'));
}

/**
 * @param {string|null} lastTag 'v1.2.3', or null before the first release
 * @param {{subject: string, body: string}[]} commits since that tag
 * @returns {string|null} the next version without "v"; null — nothing to release
 */
export function nextVersion(lastTag, commits) {
  if (lastTag === null) return FIRST;
  const [major, minor, patch] = parseVersion(lastTag.startsWith('v') ? lastTag.slice(1) : '', lastTag);

  let bump = 0; // 1 patch, 2 minor, 3 major
  for (const c of relevant(commits)) {
    const p = parse(c.subject);
    if (p?.bang || c.body.includes('BREAKING CHANGE')) bump = Math.max(bump, major === 0 ? 2 : 3);
    else if (p?.type === 'feat') bump = Math.max(bump, 2);
    else bump = Math.max(bump, 1);
  }
  if (bump === 0) return null;
  if (bump === 3) return `${major + 1}.0.0`;
  if (bump === 2) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** A version asked for by hand (make release V=1.0.0) must be well-formed and above the last tag. */
export function checkManual(version, lastTag) {
  const next = parseVersion(version);
  if (lastTag === null) return;
  const last = parseVersion(lastTag.replace(/^v/, ''), lastTag);
  const cmp = next.findIndex((n, i) => n !== last[i]);
  if (cmp < 0 || next[cmp] < last[cmp]) throw new Error(`Version ${version} is not above the last release ${lastTag}`);
}

/**
 * "## 1.3.0 — 2026-10-13" and the commits grouped by type. The first release does not list the whole
 * history — it says it is the first.
 */
export function changelogSection(version, date, commits, first = false) {
  let out = `## ${version} — ${date}\n\n`;
  if (first) return `${out}Первый релиз: всё, что было сделано до него, — в истории git.\n`;

  const groups = {};
  for (const c of relevant(commits)) {
    const p = parse(c.subject);
    const title = GROUPS[p?.type] ?? OTHER;
    const line = p ? (p.scope ? `${p.scope}: ` : '') + p.text : c.subject;
    (groups[title] ??= []).push(`- ${line}`);
  }
  for (const title of [...Object.values(GROUPS), OTHER]) {
    if (groups[title]) out += `### ${title}\n\n${groups[title].join('\n')}\n\n`;
  }
  return `${out.trimEnd()}\n`;
}

/** The new section goes right under the file's title, above older ones. */
export function prependSection(changelog, section) {
  const rest = changelog.startsWith('# ')
    ? changelog.slice(changelog.includes('\n') ? changelog.indexOf('\n') : changelog.length).trimStart()
    : changelog.trimStart();
  return `${TITLE}\n\n${section.trimEnd()}\n${rest ? `\n${rest}` : ''}`;
}

/** Rewrites every `<span data-version>…</span>` to the version. */
export function stampVersion(content, version) {
  return content.replace(/(<span data-version>)[^<]*(<\/span>)/g, `$1${version}$2`);
}

/** package.json and package-lock.json carry the release too (top-level and the root package entry). */
export function stampPackage(json, version) {
  const data = JSON.parse(json);
  data.version = version;
  if (data.packages?.['']) data.packages[''].version = version;
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** The release in the VERSION file that make release writes; a working copy without one is "dev". */
export function currentVersion(rootDir) {
  const file = path.join(rootDir, 'VERSION');
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
  return VERSION_RE.test(raw) ? raw : 'dev';
}
