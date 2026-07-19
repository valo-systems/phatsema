import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const inputs = [resolve(root, 'README.md'), resolve(root, 'docs')];
const markdownFiles = [];
const failures = [];

async function walk(path) {
  if (extname(path) === '.md') {
    markdownFiles.push(path);
    return;
  }

  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.isFile() && extname(entry.name) === '.md') markdownFiles.push(child);
  }
}

for (const input of inputs) await walk(input);

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu);

  for (const match of links) {
    const rawTarget = match[1]?.trim().replace(/^<|>$/gu, '');
    if (!rawTarget || /^(?:https?:|mailto:|tel:|#)/u.test(rawTarget)) continue;

    const target = decodeURIComponent(rawTarget.split('#')[0] ?? '');
    if (!target) continue;

    try {
      await access(resolve(dirname(file), target));
    } catch {
      failures.push(`${file.slice(root.length + 1)} -> ${rawTarget}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken local documentation links:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Documentation links are valid across ${markdownFiles.length} Markdown files.`);
