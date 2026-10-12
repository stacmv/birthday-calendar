// Renders the PNG icons from public/app/icons/icon.svg (sharp; no browser involved).
//   node scripts/icons.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'app', 'icons');
const svg = fs.readFileSync(path.join(dir, 'icon.svg'));

// The artwork is full-bleed with the motif inside the 80% safe zone, so one source serves
// both the "any" and the "maskable" purposes.
const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-512-maskable.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(dir, name));
  console.log(`wrote ${name} (${size}x${size})`);
}
