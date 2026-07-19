<?php

declare(strict_types=1);

namespace App\Infrastructure\DemoStore;

use App\Domain\Alerts\AlertRepository;
use App\Domain\Analytics\AnalyticsReadRepository;
use App\Domain\Assets\AssetRepository;
use App\Domain\Audit\AuditRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Counts\CountRepository;
use App\Domain\Demo\DemoRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Domain\Transfers\TransferRepository;
use Illuminate\Session\Store as Session;
use Symfony\Component\Uid\Ulid;

final class DemoStore implements AlertRepository, AnalyticsReadRepository, AssetRepository, AuditRepository, CatalogueRepository, CountRepository, DemoRepository, IdentityRepository, InventoryRepository, ReferenceRepository, SequenceRepository, SiteRepository, TransferRepository, UnitOfWork
{
    private const SESSION_KEY = 'demo_state';

    private array $state;

    public function __construct(private readonly Session $session)
    {
        $state = $this->session->get(self::SESSION_KEY);
        $this->state = is_array($state) && ($state['fixture_version'] ?? '') === '1.4.0'
            ? $state
            : DemoFixtures::build();
    }

    public function commit(): void
    {
        $this->session->put(self::SESSION_KEY, $this->state);
    }

    public function reset(): void
    {
        $this->state = DemoFixtures::build();
    }

    private static function newId(): string
    {
        return (string) new Ulid;
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    public function getUsers(): array
    {
        return $this->state['users'];
    }

    public function findUserByEmail(string $email): ?array
    {
        foreach ($this->state['users'] as $user) {
            if ($user['email'] === $email) {
                return $user;
            }
        }

        return null;
    }

    public function findUser(string $id): ?array
    {
        foreach ($this->state['users'] as $user) {
            if ($user['id'] === $id) {
                return $user;
            }
        }

        return null;
    }

    public function createUser(array $data): array
    {
        $user = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['users'][] = $user;

        return $user;
    }

    public function updateUser(string $id, array $data): ?array
    {
        foreach ($this->state['users'] as &$user) {
            if ($user['id'] === $id) {
                $user = array_merge($user, $data, [
                    'id' => $id,
                    'version' => ((int) ($user['version'] ?? 1)) + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $user;
            }
        }
        unset($user);

        return null;
    }

    // ─── Sites ────────────────────────────────────────────────────────────────

    public function getSites(): array
    {
        return $this->state['sites'];
    }

    public function findSite(string $id): ?array
    {
        foreach ($this->state['sites'] as $site) {
            if ($site['id'] === $id) {
                return $site;
            }
        }

        return null;
    }

    public function createSite(array $data): array
    {
        $site = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['sites'][] = $site;

        return $site;
    }

    public function updateSite(string $id, array $data): ?array
    {
        foreach ($this->state['sites'] as &$site) {
            if ($site['id'] === $id) {
                $site = array_merge($site, $data, [
                    'id' => $id,
                    'version' => $site['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $site;
            }
        }
        unset($site);

        return null;
    }

    // ─── Locations ────────────────────────────────────────────────────────────

    public function getLocationsForSite(string $siteId): array
    {
        return array_values(array_filter(
            $this->state['locations'],
            static fn (array $l) => $l['site_id'] === $siteId
        ));
    }

    public function findLocation(string $id): ?array
    {
        foreach ($this->state['locations'] as $loc) {
            if ($loc['id'] === $id) {
                return $loc;
            }
        }

        return null;
    }

    public function createLocation(array $data): array
    {
        $location = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['locations'][] = $location;

        return $location;
    }

    public function updateLocation(string $id, array $data): ?array
    {
        foreach ($this->state['locations'] as &$loc) {
            if ($loc['id'] === $id) {
                $loc = array_merge($loc, $data, [
                    'id' => $id,
                    'version' => $loc['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $loc;
            }
        }
        unset($loc);

        return null;
    }

    // ─── Items ────────────────────────────────────────────────────────────────

    public function getItems(): array
    {
        return $this->state['items'];
    }

    public function findItem(string $id): ?array
    {
        foreach ($this->state['items'] as $item) {
            if ($item['id'] === $id) {
                return $item;
            }
        }

        return null;
    }

    public function createItem(array $data): array
    {
        $item = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['items'][] = $item;

        return $item;
    }

    public function updateItem(string $id, array $data): ?array
    {
        foreach ($this->state['items'] as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $data, [
                    'id' => $id,
                    'version' => $item['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $item;
            }
        }
        unset($item);

        return null;
    }

    // ─── Categories / Units / Reasons ─────────────────────────────────────────

    public function getCategories(): array
    {
        return $this->state['categories'];
    }

    public function getUnits(): array
    {
        return $this->state['units'];
    }

    public function getReasons(): array
    {
        return $this->state['reasons'];
    }

    // ─── Balances ─────────────────────────────────────────────────────────────

    public function getBalance(string $itemId, string $locationId): ?array
    {
        $key = "{$itemId}:{$locationId}";

        return $this->state['balances'][$key] ?? null;
    }

    public function getBalancesForItem(string $itemId): array
    {
        $result = [];
        foreach ($this->state['balances'] as $key => $balance) {
            if ($balance['item_id'] === $itemId) {
                $result[] = $balance;
            }
        }

        return $result;
    }

    public function getAllBalances(): array
    {
        return array_values($this->state['balances']);
    }

    public function adjustBalance(string $itemId, string $locationId, string $siteId, string $delta): void
    {
        $this->adjustBalanceBucket($itemId, $locationId, $siteId, 'qty', $delta);
    }

    public function adjustReserved(string $itemId, string $locationId, string $siteId, string $delta): void
    {
        $this->adjustBalanceBucket($itemId, $locationId, $siteId, 'reserved', $delta);
    }

    public function adjustInTransit(string $itemId, string $locationId, string $siteId, string $delta): void
    {
        $this->adjustBalanceBucket($itemId, $locationId, $siteId, 'in_transit', $delta);
    }

    private function adjustBalanceBucket(
        string $itemId,
        string $locationId,
        string $siteId,
        string $bucket,
        string $delta,
    ): void {
        $key = "{$itemId}:{$locationId}";
        $existing = $this->state['balances'][$key] ?? [
            'item_id' => $itemId,
            'location_id' => $locationId,
            'site_id' => $siteId,
            'qty' => '0.00',
            'reserved' => '0.00',
            'in_transit' => '0.00',
            'quarantined' => '0.00',
        ];
        $current = $existing[$bucket] ?? '0.000';
        $newQty = Quantity::from($current)
            ->add(Quantity::from($delta))
            ->toString();
        $this->state['balances'][$key] = array_merge($existing, [
            'item_id' => $itemId,
            'location_id' => $locationId,
            'site_id' => $siteId,
            $bucket => $newQty,
            'updated_at' => now()->toISOString(),
        ]);
    }

    // ─── Movements ────────────────────────────────────────────────────────────

    public function getMovements(): array
    {
        return $this->state['movements'];
    }

    public function findMovement(string $id): ?array
    {
        foreach ($this->state['movements'] as $m) {
            if ($m['id'] === $id) {
                return $m;
            }
        }

        return null;
    }

    public function createMovement(array $data): array
    {
        $movement = array_merge($data, [
            'id' => self::newId(),
            'created_at' => now()->toISOString(),
        ]);
        $this->state['movements'][] = $movement;

        return $movement;
    }

    public function markMovementReversed(string $id): void
    {
        foreach ($this->state['movements'] as &$m) {
            if ($m['id'] === $id) {
                $m['reversed'] = true;
                break;
            }
        }
        unset($m);
    }

    // ─── Transfers ────────────────────────────────────────────────────────────

    public function getTransfers(): array
    {
        return $this->state['transfers'];
    }

    public function findTransfer(string $id): ?array
    {
        foreach ($this->state['transfers'] as $t) {
            if ($t['id'] === $id) {
                return $t;
            }
        }

        return null;
    }

    public function createTransfer(array $data): array
    {
        $transfer = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'status' => 'draft',
            'approved_by_id' => null,
            'dispatched_by_id' => null,
            'received_by_id' => null,
            'submitted_at' => null,
            'approved_at' => null,
            'dispatched_at' => null,
            'received_at' => null,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['transfers'][] = $transfer;

        return $transfer;
    }

    public function updateTransfer(string $id, array $data): ?array
    {
        foreach ($this->state['transfers'] as &$t) {
            if ($t['id'] === $id) {
                $t = array_merge($t, $data, [
                    'id' => $id,
                    'version' => $t['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $t;
            }
        }
        unset($t);

        return null;
    }

    // ─── Counts ───────────────────────────────────────────────────────────────

    public function getCounts(): array
    {
        return $this->state['counts'];
    }

    public function findCount(string $id): ?array
    {
        foreach ($this->state['counts'] as $c) {
            if ($c['id'] === $id) {
                return $c;
            }
        }

        return null;
    }

    public function createCount(array $data): array
    {
        $count = array_merge([
            'id' => self::newId(),
            'version' => 1,
            'status' => 'draft',
            'started_by_id' => null,
            'submitted_by_id' => null,
            'approved_by_id' => null,
            'posted_by_id' => null,
            'entries' => [],
            'started_at' => null,
            'submitted_at' => null,
            'approved_at' => null,
            'posted_at' => null,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ], $data, [
            'id' => self::newId(),
            'version' => 1,
            'status' => 'draft',
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['counts'][] = $count;

        return $count;
    }

    public function updateCount(string $id, array $data): ?array
    {
        foreach ($this->state['counts'] as &$c) {
            if ($c['id'] === $id) {
                $c = array_merge($c, $data, [
                    'id' => $id,
                    'version' => $c['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $c;
            }
        }
        unset($c);

        return null;
    }

    // ─── Assets ───────────────────────────────────────────────────────────────

    public function getAssets(): array
    {
        return $this->state['assets'];
    }

    public function findAsset(string $id): ?array
    {
        foreach ($this->state['assets'] as $a) {
            if ($a['id'] === $id) {
                return $a;
            }
        }

        return null;
    }

    public function createAsset(array $data): array
    {
        $asset = array_merge($data, [
            'id' => self::newId(),
            'version' => 1,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]);
        $this->state['assets'][] = $asset;

        return $asset;
    }

    public function updateAsset(string $id, array $data): ?array
    {
        foreach ($this->state['assets'] as &$a) {
            if ($a['id'] === $id) {
                $a = array_merge($a, $data, [
                    'id' => $id,
                    'version' => $a['version'] + 1,
                    'updated_at' => now()->toISOString(),
                ]);

                return $a;
            }
        }
        unset($a);

        return null;
    }

    // ─── Alerts ───────────────────────────────────────────────────────────────

    public function getAlerts(): array
    {
        return $this->state['alerts'];
    }

    public function findAlert(string $id): ?array
    {
        foreach ($this->state['alerts'] as $alert) {
            if ($alert['id'] === $id) {
                return $alert;
            }
        }

        return null;
    }

    public function markAlertRead(string $alertId, string $userId): void
    {
        foreach ($this->state['alerts'] as &$alert) {
            if ($alert['id'] === $alertId) {
                if (! in_array($userId, $alert['read_by_user_ids'], true)) {
                    $alert['read_by_user_ids'][] = $userId;
                }
                break;
            }
        }
        unset($alert);
    }

    // ─── Audit Events ─────────────────────────────────────────────────────────

    public function getAuditEvents(): array
    {
        return $this->state['audit_events'];
    }

    public function findAuditEvent(string $id): ?array
    {
        foreach ($this->state['audit_events'] as $e) {
            if ($e['id'] === $id) {
                return $e;
            }
        }

        return null;
    }

    public function createAuditEvent(array $data): array
    {
        $event = array_merge($data, [
            'id' => self::newId(),
            'created_at' => now()->toISOString(),
        ]);
        $this->state['audit_events'][] = $event;

        return $event;
    }

    // ─── Next Ref ─────────────────────────────────────────────────────────────

    public function nextRef(string $prefix): string
    {
        $key = 'counters';
        if (! isset($this->state[$key])) {
            $this->state[$key] = [];
        }
        if (! isset($this->state[$key][$prefix])) {
            // Scan existing refs to find the highest sequence number
            $maxSeq = 0;
            $searchIn = array_merge(
                $this->state['movements'] ?? [],
                $this->state['transfers'] ?? [],
                $this->state['counts'] ?? [],
            );
            foreach ($searchIn as $record) {
                $ref = $record['ref'] ?? '';
                if (str_starts_with($ref, $prefix.'-')) {
                    $seq = (int) substr($ref, strlen($prefix) + 1);
                    if ($seq > $maxSeq) {
                        $maxSeq = $seq;
                    }
                }
            }
            $this->state[$key][$prefix] = $maxSeq;
        }
        $this->state[$key][$prefix]++;

        return sprintf('%s-%04d', $prefix, $this->state[$key][$prefix]);
    }
}
