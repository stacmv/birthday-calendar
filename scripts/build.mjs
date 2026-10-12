// Build step: stamps public/app/sw.js with the shell file list and a content-hash VERSION.
//   node scripts/build.mjs [--check]
// Idempotent: the hash covers the shell files only (never sw.js itself), so a second run
// produces no diff. --check exits 1 when sw.js is stale instead of rewriting it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const appDir = path.join(publicDir, 'app');
const BEGIN = '/* BUILD:BEGIN */';
const END = '/* BUILD:END */';
const EXCLUDED = new Set(['sw.js', 'offline.html']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Shell URLs relative to the app scope, sorted: './', 'index.html', 'js/app.js', '../shared/theme.js'... */
export function shellFiles() {
  const files = [];
  for (const base of [appDir, path.join(publicDir, 'shared')]) {
    for (const file of walk(base)) {
      const rel = path.relative(appDir, file).split(path.sep).join('/');
      if (base === appDir && EXCLUDED.has(rel)) continue;
      files.push({ url: rel, file });
    }
  }
  return files.sort((a, b) => (a.url < b.url ? -1 : 1));
}

export function computeVersion(files) {
  const hash = crypto.createHash('sha256');
  for (const { url, file } of files) {
    hash.update(url);
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

export function renderBlock(files, version) {
  const urls = ['./', ...files.map((f) => f.url)];
  const list = urls.map((u) => `  '${u}',`).join('\n');
  return `${BEGIN}\nconst VERSION = '${version}';\nconst SHELL = [\n${list}\n];\n${END}`;
}

export function stamp(source, files) {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start < 0 || end < 0) throw new Error('BUILD markers not found in sw.js');
  return source.slice(0, start) + renderBlock(files, computeVersion(files)) + source.slice(end + END.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const swPath = path.join(appDir, 'sw.js');
  const files = shellFiles();
  const current = fs.readFileSync(swPath, 'utf8');
  const next = stamp(current, files);
  if (process.argv.includes('--check')) {
    if (next !== current) { console.error('sw.js is stale: run `make build`'); process.exit(1); }
    console.log('sw.js is up to date');
  } else {
    if (next !== current) fs.writeFileSync(swPath, next);
    console.log(`sw.js ${next !== current ? 'stamped' : 'unchanged'}: version ${computeVersion(files)}, ${files.length + 1} shell entries`);
  }
}
