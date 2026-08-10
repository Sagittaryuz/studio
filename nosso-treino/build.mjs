import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const files = [
  ['index.html', 'index.html'],
  ['styles.css', 'styles.css'],
  ['app.js', 'app.js'],
  ['firebase-auth.js', 'firebase-auth.js'],
  ['manifest.webmanifest', 'manifest.webmanifest'],
  ['sw.js', 'sw.js'],
  ['icon.svg', 'icon.svg'],
  ['vercel.static.json', 'vercel.json']
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map(([source, destination]) => cp(join(root, source), join(output, destination))));

console.log(`Nosso Treino pronto: ${files.length} arquivos em dist.`);
