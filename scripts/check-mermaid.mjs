import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const docsRoot = resolve(root, 'docs');
const markdownFiles = [];
const diagrams = [];
const failures = [];
const dom = new JSDOM('<!doctype html><html><body></body></html>');

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});

const { default: mermaid } = await import('mermaid');

async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.isFile() && extname(entry.name) === '.md') markdownFiles.push(child);
  }
}

await walk(docsRoot);
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  const blocks = content.matchAll(/```mermaid\s*\n([\s\S]*?)```/gu);
  let index = 0;

  for (const block of blocks) {
    index += 1;
    diagrams.push({ file, index });

    try {
      await mermaid.parse(block[1] ?? '');
    } catch (error) {
      failures.push(`${file.slice(root.length + 1)} diagram ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Invalid Mermaid diagrams:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`${diagrams.length} Mermaid diagrams are valid.`);
