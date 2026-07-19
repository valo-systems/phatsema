<?php

declare(strict_types=1);

namespace App\Application\Catalogue;

use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Sites\SiteRepository;

final readonly class ItemPresenter
{
    public function __construct(
        private ReferenceRepository $reference,
        private SiteRepository $sites,
    ) {}

    /**
     * @param  array<string, mixed>  $item
     * @param  array{onHand: Quantity, reserved: Quantity}|null  $totals
     * @return array<string, mixed>
     */
    public function summary(array $item, ?array $totals = null): array
    {
        $units = array_column($this->reference->getUnits(), null, 'id');
        $categories = array_column($this->reference->getCategories(), null, 'id');
        $unitCode = $units[$item['unit_id']]['code'] ?? ($item['unit_id'] ?? 'ea');
        $onHand = $totals['onHand'] ?? Quantity::from(0);
        $reserved = $totals['reserved'] ?? Quantity::from(0);
        $available = $onHand->subtract($reserved);
        $reorderPoint = Quantity::from($item['min_stock'] ?? $item['reorder_point'] ?? 0);

        return [
            'id' => $item['id'],
            'sku' => $item['code'],
            'name' => $item['name'],
            'description' => $item['description'] ?? null,
            'categoryId' => $item['category_id'],
            'categoryName' => $categories[$item['category_id']]['name'] ?? null,
            'baseUnit' => $unitCode,
            'inventoryType' => $item['item_type'] ?? 'consumable',
            'trackingMode' => $item['tracking_mode'] ?? 'quantity',
            'ownershipMode' => $item['ownership_mode'] ?? 'company_owned',
            'reorderPoint' => isset($item['min_stock']) ? Quantity::from($item['min_stock'])->toString() : null,
            'targetLevel' => $item['target_level'] ?? null,
            'status' => ($item['active'] ?? true) ? 'active' : 'inactive',
            'version' => $item['version'],
            'totalOnHand' => $onHand->toString(),
            'totalAvailable' => $available->toString(),
            'stockHealth' => $this->stockHealth($available, $reorderPoint),
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @param  list<array<string, mixed>>  $balances
     * @return array<string, mixed>
     */
    public function detail(array $item, array $balances): array
    {
        $onHand = Quantity::from(0);
        $reserved = Quantity::from(0);
        $inTransit = Quantity::from(0);
        $quarantined = Quantity::from(0);
        foreach ($balances as $balance) {
            $onHand = $onHand->add(Quantity::from($balance['qty'] ?? 0));
            $reserved = $reserved->add(Quantity::from($balance['reserved'] ?? 0));
            $inTransit = $inTransit->add(Quantity::from($balance['in_transit'] ?? 0));
            $quarantined = $quarantined->add(Quantity::from($balance['quarantined'] ?? 0));
        }

        $locations = [];
        foreach ($this->sites->getSites() as $site) {
            foreach ($this->sites->getLocationsForSite((string) $site['id']) as $location) {
                $locations[$location['id']] = $location;
            }
        }
        $sites = array_column($this->sites->getSites(), null, 'id');
        $units = array_column($this->reference->getUnits(), null, 'id');
        $unitCode = $units[$item['unit_id']]['code'] ?? ($item['unit_id'] ?? 'ea');

        return array_merge($this->summary($item, ['onHand' => $onHand, 'reserved' => $reserved]), [
            'totalReserved' => $reserved->toString(),
            'totalInTransit' => $inTransit->toString(),
            'totalQuarantined' => $quarantined->toString(),
            'balances' => array_map(
                fn (array $balance): array => $this->balance($balance, $unitCode, $sites, $locations),
                $balances,
            ),
        ]);
    }

    /**
     * @param  array<string, mixed>  $balance
     * @param  array<string, array<string, mixed>>  $sites
     * @param  array<string, array<string, mixed>>  $locations
     * @return array<string, mixed>
     */
    private function balance(array $balance, string $unit, array $sites, array $locations): array
    {
        $onHand = Quantity::from($balance['qty'] ?? 0);
        $reserved = Quantity::from($balance['reserved'] ?? 0);

        return [
            'itemId' => $balance['item_id'],
            'siteId' => $balance['site_id'],
            'siteName' => $sites[$balance['site_id']]['name'] ?? null,
            'locationId' => $balance['location_id'],
            'locationName' => $locations[$balance['location_id']]['name'] ?? null,
            'onHand' => $onHand->toString(),
            'reserved' => $reserved->toString(),
            'inTransit' => Quantity::from($balance['in_transit'] ?? 0)->toString(),
            'quarantined' => Quantity::from($balance['quarantined'] ?? 0)->toString(),
            'available' => $onHand->subtract($reserved)->toString(),
            'unit' => $unit,
            'batchId' => null,
            'version' => $balance['version'] ?? 1,
        ];
    }

    private function stockHealth(Quantity $available, Quantity $reorderPoint): string
    {
        if ($available->isNegative() || $available->isZero()) {
            return 'out_of_stock';
        }
        if (! $reorderPoint->isNegative() && ! $reorderPoint->isZero() && ! $available->greaterThan($reorderPoint)) {
            return 'low';
        }

        return 'healthy';
    }
}
