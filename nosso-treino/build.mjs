import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const files = ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'sw.js', 'icon.svg'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map((file) => cp(join(root, file), join(output, file))));

console.log(`Nosso Treino pronto: ${files.length} arquivos em dist.`);
