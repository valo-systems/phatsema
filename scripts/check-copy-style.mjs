import { readdir, readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const roots = [
  resolve(root, 'apps/web/src'),
  resolve(root, 'apps/web/e2e'),
  resolve(root, 'apps/web/public'),
  resolve(root, 'apps/api/app'),
  resolve(root, 'apps/api/resources/demo'),
];
const standaloneFiles = [resolve(root, 'apps/web/index.html')];
const supportedExtensions = new Set(['.css', '.html', '.js', '.json', '.php', '.ts', '.tsx']);
const excludedDirectories = new Set(['coverage', 'dist', 'node_modules', 'playwright-report', 'test-results', 'vendor']);
const violations = [];

async function inspect(file) {
  const content = await readFile(file, 'utf8');
  content.split(/\r?\n/u).forEach((line, index) => {
    if (line.includes('—')) {
      violations.push(`${file.slice(root.length + 1)}:${index + 1}`);
    }
  });
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (supportedExtensions.has(extname(entry.name))) {
      await inspect(path);
    }
  }
}

await Promise.all([...roots.map(walk), ...standaloneFiles.map(inspect)]);

if (violations.length > 0) {
  console.error(`Em dash found in maintained portal copy:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('Portal copy style check passed.');
