<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Sites\SiteRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BalancesController extends Controller
{
    public function __construct(
        private readonly InventoryRepository $inventory,
        private readonly CatalogueRepository $catalogue,
        private readonly ReferenceRepository $reference,
        private readonly SiteRepository $sites,
        private readonly CurrentActor $actor,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $this->actor->requireUser();
        $balances = $this->inventory->getAllBalances();

        if (! $user['all_sites']) {
            $balances = array_values(array_filter($balances, fn ($b) => in_array($b['site_id'], $user['assigned_site_ids'], true)));
        }

        if ($request->query('siteId')) {
            $siteId = $request->query('siteId');
            $balances = array_values(array_filter($balances, fn ($b) => $b['site_id'] === $siteId));
        }
        if ($request->query('locationId')) {
            $locId = $request->query('locationId');
            $balances = array_values(array_filter($balances, fn ($b) => $b['location_id'] === $locId));
        }
        if ($request->query('itemId')) {
            $itemId = $request->query('itemId');
            $balances = array_values(array_filter($balances, fn ($b) => $b['item_id'] === $itemId));
        }
        if ($request->query('nonZero') === 'true') {
            $balances = array_values(array_filter($balances, fn ($b) => (float) $b['qty'] !== 0.0));
        }

        $maps = $this->buildMaps();

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($balances);
        $balances = array_slice($balances, ($page - 1) * $pageSize, $pageSize);

        return response()->json([
            'data' => array_map(fn ($b) => $this->formatBalance($b, $maps), $balances),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ]);
    }

    public function forItem(Request $request, string $itemId): JsonResponse
    {
        $this->catalogue->findItem($itemId) ?? throw new ResourceNotFound('Item not found.');

        $balances = $this->inventory->getBalancesForItem($itemId);
        $user = $this->actor->requireUser();
        if (! (bool) ($user['all_sites'] ?? false)) {
            $balances = array_values(array_filter(
                $balances,
                static fn (array $balance): bool => in_array(
                    $balance['site_id'],
                    $user['assigned_site_ids'] ?? [],
                    true,
                ),
            ));
        }
        $maps = $this->buildMaps();

        return response()->json(['data' => array_map(fn ($b) => $this->formatBalance($b, $maps), $balances)]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function buildMaps(): array
    {
        $itemMap = array_column($this->catalogue->getItems(), null, 'id');
        $unitMap = array_column($this->reference->getUnits(), null, 'id');
        $locationMap = [];
        foreach ($this->sites->getSites() as $s) {
            foreach ($this->sites->getLocationsForSite($s['id']) as $l) {
                $locationMap[$l['id']] = $l;
            }
        }
        $siteMap = array_column($this->sites->getSites(), null, 'id');

        return compact('itemMap', 'unitMap', 'locationMap', 'siteMap');
    }

    private function formatBalance(array $b, array $maps): array
    {
        ['itemMap' => $itemMap, 'unitMap' => $unitMap, 'locationMap' => $locationMap, 'siteMap' => $siteMap] = $maps;

        $item = $itemMap[$b['item_id']] ?? null;
        $unit = $item ? ($unitMap[$item['unit_id']] ?? null) : null;
        $location = $locationMap[$b['location_id']] ?? null;
        $site = $siteMap[$b['site_id']] ?? null;

        $onHand = $b['qty'];
        $reserved = $b['reserved'] ?? '0.00';
        $inTransit = $b['in_transit'] ?? '0.00';
        $quarantined = $b['quarantined'] ?? '0.00';
        $availableQuantity = Quantity::from($onHand)
            ->subtract(Quantity::from($reserved))
            ->subtract(Quantity::from($quarantined));
        $available = $availableQuantity->toString();

        $reorder = Quantity::from($item['min_stock'] ?? 0);
        if ($availableQuantity->isNegative() || $availableQuantity->isZero()) {
            $health = 'out_of_stock';
        } elseif (! $reorder->isZero() && ! $availableQuantity->greaterThan($reorder)) {
            $health = 'low';
        } else {
            $health = 'healthy';
        }

        return [
            'itemId' => $b['item_id'],
            'itemSku' => $item['code'] ?? null,
            'itemName' => $item['name'] ?? null,
            'siteId' => $b['site_id'],
            'siteName' => $site['name'] ?? null,
            'locationId' => $b['location_id'],
            'locationName' => $location['name'] ?? null,
            'batchId' => null,
            'onHand' => $onHand,
            'reserved' => $reserved,
            'inTransit' => $inTransit,
            'quarantined' => $quarantined,
            'available' => $available,
            'stockHealth' => $health,
            'unit' => $unit['code'] ?? null,
        ];
    }
}
