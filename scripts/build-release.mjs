import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const version = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
const releaseId = `phatsema-portal-${version}`;
const releaseRoot = join(root, 'release');
const stagingParent = await mkdtemp(join(tmpdir(), 'phatsema-release-'));
const staging = join(stagingParent, releaseId);
const application = join(staging, 'apps', 'phatsema-api');
const publicRoot = join(staging, 'public_html', 'portal');
const revisionResult = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
});
const detectedSourceRevision = revisionResult.status === 0 ? revisionResult.stdout.trim() : null;
const sourceRevision = process.env.PHATSEMA_SOURCE_REVISION?.trim() || detectedSourceRevision;
const dirtyResult = spawnSync('git', ['status', '--porcelain'], {
  cwd: root,
  encoding: 'utf8',
});
const detectedSourceTreeDirty = dirtyResult.status === 0 && dirtyResult.stdout.trim().length > 0;
const sourceTreeDirty = process.env.PHATSEMA_SOURCE_TREE_DIRTY === undefined
  ? detectedSourceTreeDirty
  : process.env.PHATSEMA_SOURCE_TREE_DIRTY === 'true';
const packageOnly = process.env.PHATSEMA_RELEASE_PACKAGE_ONLY === '1';

function run(command, args, cwd = root, environment = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...environment },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

try {
  if (!packageOnly) {
    run('pnpm', ['lint']);
    run('pnpm', ['typecheck']);
    run('pnpm', ['test']);
    run('pnpm', ['--filter', '@phatsema/web', 'test:coverage']);
    run('pnpm', ['build']);
    run('pnpm', ['test:e2e']);
    run('pnpm', ['contract:check-drift']);
    run('pnpm', ['fixtures:validate']);
    run('pnpm', ['php:parse']);
    run('pnpm', ['dead-code:check']);
    run('pnpm', ['docs:check']);
    run('composer', ['validate', '--strict'], join(root, 'apps/api'));
    run('php', ['artisan', 'test'], join(root, 'apps/api'));
    run('vendor/bin/pint', ['--test'], join(root, 'apps/api'));
    const phpstan = join(stagingParent, 'phpstan.phar');
    await cp(join(root, 'apps/api/vendor/phpstan/phpstan/phpstan.phar'), phpstan);
    run('php', [phpstan, 'analyse', '--no-progress', '--memory-limit=1G'], join(root, 'apps/api'));
  }

  await mkdir(application, { recursive: true });
  const apiSource = join(root, 'apps/api');
  const excludedApiPaths = new Set([
    '.editorconfig',
    '.env',
    '.env.example',
    '.gitattributes',
    '.gitignore',
    '.npmrc',
    '.phpunit.result.cache',
    'node_modules',
    'phpstan.neon',
    'phpunit.xml',
    'pint.json',
    'public',
    'tests',
  ]);
  await cp(apiSource, application, {
    recursive: true,
    filter: (source) => {
      const sourcePath = relative(apiSource, source);
      if (sourcePath === '') return true;
      const rootSegment = sourcePath.split(/[\\/]/)[0];

      return !excludedApiPaths.has(sourcePath) && !excludedApiPaths.has(rootSegment);
    },
  });
  await cp(join(root, 'apps/api/public'), publicRoot, { recursive: true });
  await cp(join(root, 'apps/web/dist'), publicRoot, { recursive: true });
  await cp(join(root, 'scripts/cpanel/index.php'), join(publicRoot, 'index.php'));
  await cp(join(root, 'apps/api/.env.cpanel.example'), join(staging, '.env.cpanel.example'));
  await cp(join(root, 'docs/deployment-cpanel.md'), join(staging, 'DEPLOYMENT.md'));

  for (const runtimePath of [
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/testing',
    'storage/framework/views',
    'storage/logs',
  ]) {
    const directory = join(application, runtimePath);
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, '.gitignore'), "*\n!.gitignore\n");
  }
  await mkdir(join(application, 'storage/framework/cache/data'), { recursive: true });

  run('composer', [
    'install',
    '--no-dev',
    '--classmap-authoritative',
    '--no-interaction',
    '--no-progress',
    '--no-scripts',
  ], application);
  for (const cacheFile of ['packages.php', 'services.php']) {
    await rm(join(application, 'bootstrap/cache', cacheFile), { force: true });
  }

  await writeFile(join(staging, 'BUILD_INFO.json'), `${JSON.stringify({
    application: 'Phatsema Portal',
    version,
    builtAt: new Date().toISOString(),
    sourceRevision,
    sourceTreeDirty,
    sourceRevisionNote: sourceRevision === null
      ? 'Source workspace did not contain Git metadata.'
      : sourceTreeDirty
        ? 'Archive built from working-tree changes based on this revision.'
        : undefined,
    runtime: {
      frontend: 'static Vite build',
      api: 'Laravel/PHP',
    },
  }, null, 2)}\n`);

  const files = (await walk(staging)).sort();
  const manifest = [];
  for (const file of files) {
    if (basename(file) === 'SHA256SUMS') continue;
    const digest = createHash('sha256').update(await readFile(file)).digest('hex');
    manifest.push(`${digest}  ${relative(staging, file)}`);
  }
  await writeFile(join(staging, 'SHA256SUMS'), `${manifest.join('\n')}\n`);

  await mkdir(releaseRoot, { recursive: true });
  const archive = join(releaseRoot, `${releaseId}.tar.gz`);
  await rm(archive, { force: true });
  run(
    'tar',
    ['-czf', archive, '-C', stagingParent, releaseId],
    root,
    { COPYFILE_DISABLE: '1' },
  );
  const archiveHash = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(`${archive}.sha256`, `${archiveHash}  ${basename(archive)}\n`);
  console.log(`Release created: ${archive}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
