<?php

declare(strict_types=1);

namespace App\Application\Sites;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Domain\Assets\AssetRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Inventory\EstimatedInventoryValuation;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Sites\SiteRepository;
use App\Domain\Transfers\TransferRepository;
use App\Policies\PermissionPolicy;

final readonly class SiteQueryService
{
    public function __construct(
        private SiteRepository $sites,
        private InventoryRepository $inventory,
        private CatalogueRepository $catalogue,
        private AssetRepository $assets,
        private TransferRepository $transfers,
        private SitePresenter $presenter,
        private EstimatedInventoryValuation $valuation,
        private PermissionPolicy $permissions,
    ) {}

    /**
     * @param  array<string, mixed>  $user
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function list(array $user, array $filters): array
    {
        $sites = array_values(array_filter(
            $this->sites->getSites(),
            static function (array $site) use ($user, $filters): bool {
                if (! $user['all_sites'] && ! in_array($site['id'], $user['assigned_site_ids'], true)) {
                    return false;
                }
                if (array_key_exists('active', $filters)) {
                    return $site['active'] === filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN);
                }

                return true;
            },
        ));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));
        $total = count($sites);

        return [
            'data' => array_map(
                $this->presenter->site(...),
                array_slice($sites, ($page - 1) * $pageSize, $pageSize),
            ),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }

    /** @return array<string, mixed> */
    public function find(string $siteId): array
    {
        if (! $this->permissions->canAccessSite($siteId)) {
            throw new AuthorizationDenied;
        }
        $site = $this->sites->findSite($siteId)
            ?? throw new ResourceNotFound('Site not found.');
        $locations = $this->sites->getLocationsForSite($siteId);
        $balances = array_values(array_filter(
            $this->inventory->getAllBalances(),
            static fn (array $balance): bool => $balance['site_id'] === $siteId,
        ));
        $assets = array_values(array_filter(
            $this->assets->getAssets(),
            static fn (array $asset): bool => $asset['site_id'] === $siteId,
        ));
        $transfers = array_values(array_filter(
            $this->transfers->getTransfers(),
            static fn (array $transfer): bool => in_array($transfer['status'], ['submitted', 'approved', 'dispatched'], true)
                && ($transfer['from_site_id'] === $siteId || $transfer['to_site_id'] === $siteId),
        ));

        return array_merge($this->presenter->site($site), [
            'stockValue' => $this->stockValue($balances),
            'locationCount' => count($locations),
            'itemCount' => count(array_unique(array_column($balances, 'item_id'))),
            'openTransferCount' => count($transfers),
            'assetCount' => count($assets),
            'locations' => array_map($this->presenter->location(...), $locations),
        ]);
    }

    /** @param list<array<string, mixed>> $balances */
    private function stockValue(array $balances): string
    {
        $items = array_column($this->catalogue->getItems(), null, 'id');
        $value = 0.0;
        foreach ($balances as $balance) {
            $value += $this->valuation->value(
                $items[$balance['item_id']] ?? [],
                (float) $balance['qty'],
            );
        }

        return number_format($value, 2, '.', '');
    }
}
