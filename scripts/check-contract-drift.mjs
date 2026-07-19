import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'phatsema-contract-'));
const generated = join(temporaryDirectory, 'api.d.ts');

try {
  const result = spawnSync(
    'pnpm',
    ['--filter', '@phatsema/contracts', 'exec', 'openapi-typescript', 'openapi.yaml', '-o', generated],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);

  const [expected, actual] = await Promise.all([
    readFile(join(root, 'packages/contracts/generated/api.d.ts'), 'utf8'),
    readFile(generated, 'utf8'),
  ]);
  if (expected !== actual) {
    console.error('Generated API types have drifted. Run: pnpm contract:generate');
    process.exitCode = 1;
  } else {
    console.log('OpenAPI generated types are current.');
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
