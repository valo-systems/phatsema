import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const php = String.raw`
require $argv[1];
require_once $argv[2];
$state = \App\Infrastructure\DemoStore\FixtureFactory::build();
$required = ['users','sites','locations','items','balances','movements','transfers','counts','assets','alerts','audit_events'];
foreach ($required as $key) {
    if (!array_key_exists($key, $state) || !is_array($state[$key])) {
        fwrite(STDERR, "Missing fixture collection: {$key}\n");
        exit(1);
    }
}
if (($state['fixture_version'] ?? null) !== '1.4.0') {
    fwrite(STDERR, "Unexpected fixture version.\n");
    exit(1);
}
$ids = [];
foreach (['users','sites','locations','items','movements','transfers','counts','assets','alerts','audit_events'] as $collection) {
    foreach ($state[$collection] as $record) {
        $id = $record['id'] ?? null;
        if (!is_string($id) || $id === '') {
            fwrite(STDERR, "Record without ID in {$collection}.\n");
            exit(1);
        }
        if (isset($ids[$id])) {
            fwrite(STDERR, "Duplicate fixture ID: {$id}\n");
            exit(1);
        }
        $ids[$id] = true;
    }
}
$cutoff = (new DateTimeImmutable('today', new DateTimeZone('UTC')))->modify('-30 days');
$recentMovements = array_filter(
    $state['movements'],
    fn (array $movement): bool => new DateTimeImmutable($movement['created_at']) >= $cutoff,
);
if (count($recentMovements) < 10) {
    fwrite(STDERR, "Expected at least 10 movements in the latest 30-day demo window.\n");
    exit(1);
}
$movementTypes = array_unique(array_column($recentMovements, 'type'));
foreach (['receipt', 'issue', 'adjustment', 'transfer_dispatch', 'transfer_receipt', 'count_variance'] as $type) {
    if (!in_array($type, $movementTypes, true)) {
        fwrite(STDERR, "Missing recent movement type: {$type}\n");
        exit(1);
    }
}
$transferStatuses = array_unique(array_column($state['transfers'], 'status'));
foreach (['received', 'dispatched', 'submitted', 'approved'] as $status) {
    if (!in_array($status, $transferStatuses, true)) {
        fwrite(STDERR, "Missing demo transfer status: {$status}\n");
        exit(1);
    }
}
$countStatuses = array_unique(array_column($state['counts'], 'status'));
foreach (['posted', 'in_progress', 'submitted'] as $status) {
    if (!in_array($status, $countStatuses, true)) {
        fwrite(STDERR, "Missing demo count status: {$status}\n");
        exit(1);
    }
}
echo json_encode([
    'fixtureVersion' => $state['fixture_version'],
    'collections' => array_map(fn ($key) => count($state[$key]), $required),
], JSON_THROW_ON_ERROR);
`;

const fixture = resolve(root, 'apps/api/resources/demo/v1/FixtureFactory.php');
const autoload = resolve(root, 'apps/api/vendor/autoload.php');
const result = spawnSync('php', ['-r', php, autoload, fixture], { encoding: 'utf8' });
if (result.error?.code === 'ENOENT') {
  process.stderr.write(
    'php was not found on PATH. Fixture validation runs the domain constructors, so it needs PHP 8.5.\n',
  );
  process.exit(1);
}
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'Fixture validation failed with no output.\n');
  process.exit(result.status ?? 1);
}

const summary = JSON.parse(result.stdout);
console.log(`Fixture ${summary.fixtureVersion} is valid (${summary.collections.join(', ')} records by collection).`);
