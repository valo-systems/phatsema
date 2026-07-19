<?php

declare(strict_types=1);

namespace App\Application\Catalogue;

use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;

final readonly class ItemQueryService
{
    public function __construct(
        private CatalogueRepository $catalogue,
        private InventoryRepository $inventory,
        private ItemPresenter $presenter,
        private CurrentActor $actor,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function list(array $filters): array
    {
        $totals = $this->balanceTotals();
        $items = array_values(array_filter(
            $this->catalogue->getItems(),
            fn (array $item): bool => $this->matches($item, $filters, $totals[$item['id']] ?? null),
        ));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));
        $total = count($items);
        $pageItems = array_slice($items, ($page - 1) * $pageSize, $pageSize);

        return [
            'data' => array_map(
                fn (array $item): array => $this->presenter->summary($item, $totals[$item['id']] ?? null),
                $pageItems,
            ),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }

    /** @return array<string, mixed> */
    public function find(string $itemId): array
    {
        $item = $this->catalogue->findItem($itemId)
            ?? throw new ResourceNotFound('Item not found.');

        return $this->presenter->detail(
            $item,
            $this->accessibleBalances($this->inventory->getBalancesForItem($itemId)),
        );
    }

    /**
     * @return array<string, array{onHand: Quantity, reserved: Quantity}>
     */
    private function balanceTotals(): array
    {
        $totals = [];
        foreach ($this->accessibleBalances($this->inventory->getAllBalances()) as $balance) {
            $itemId = (string) $balance['item_id'];
            $current = $totals[$itemId] ?? ['onHand' => Quantity::from(0), 'reserved' => Quantity::from(0)];
            $totals[$itemId] = [
                'onHand' => $current['onHand']->add(Quantity::from($balance['qty'] ?? 0)),
                'reserved' => $current['reserved']->add(Quantity::from($balance['reserved'] ?? 0)),
            ];
        }

        return $totals;
    }

    /** @param list<array<string, mixed>> $balances
     * @return list<array<string, mixed>>
     */
    private function accessibleBalances(array $balances): array
    {
        $user = $this->actor->requireUser();
        if ((bool) ($user['all_sites'] ?? false)) {
            return $balances;
        }

        return array_values(array_filter(
            $balances,
            static fn (array $balance): bool => in_array(
                $balance['site_id'],
                $user['assigned_site_ids'] ?? [],
                true,
            ),
        ));
    }

    /**
     * @param  array<string, mixed>  $item
     * @param  array<string, mixed>  $filters
     * @param  array{onHand: Quantity, reserved: Quantity}|null  $totals
     */
    private function matches(array $item, array $filters, ?array $totals): bool
    {
        if (isset($filters['status']) && (($item['active'] ?? true) !== ($filters['status'] === 'active'))) {
            return false;
        }
        if (isset($filters['categoryId']) && $item['category_id'] !== $filters['categoryId']) {
            return false;
        }
        if (isset($filters['inventoryType']) && ($item['item_type'] ?? null) !== $filters['inventoryType']) {
            return false;
        }
        if (isset($filters['q']) && ! str_contains(
            strtolower(($item['name'] ?? '').' '.($item['code'] ?? '')),
            strtolower((string) $filters['q']),
        )) {
            return false;
        }
        if (isset($filters['stockHealth'])) {
            return $this->presenter->summary($item, $totals)['stockHealth'] === $filters['stockHealth'];
        }

        return true;
    }
}
