import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const targets = ['apps/api/app', 'apps/api/bootstrap', 'apps/api/config', 'apps/api/resources/demo', 'apps/api/routes', 'apps/api/tests'];
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name.endsWith('.php')) files.push(path);
  }
}

for (const target of targets) await collect(join(root, target));

for (const file of files) {
  const result = spawnSync('php', ['-l', file], { encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') {
    process.stderr.write('php was not found on PATH. Syntax checking requires PHP 8.5.\n');
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax check failed for ${file}.\n`);
    process.exit(result.status ?? 1);
  }
}

console.log(`PHP syntax is valid in ${files.length} files.`);
