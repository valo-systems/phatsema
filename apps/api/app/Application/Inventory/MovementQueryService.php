<?php

declare(strict_types=1);

namespace App\Application\Inventory;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Inventory\InventoryRepository;
use App\Policies\PermissionPolicy;

final readonly class MovementQueryService
{
    public function __construct(
        private InventoryRepository $inventory,
        private CurrentActor $actor,
        private PermissionPolicy $permissions,
    ) {}

    /** @param array<string, mixed> $filters
     * @return array{records: list<array<string, mixed>>, total: int}
     */
    public function search(array $filters): array
    {
        $user = $this->actor->requireUser();
        $records = $this->inventory->getMovements();

        if (! (bool) ($user['all_sites'] ?? false)) {
            $siteIds = $user['assigned_site_ids'] ?? [];
            $records = array_values(array_filter(
                $records,
                static fn (array $movement): bool => in_array($movement['site_id'], $siteIds, true),
            ));
        }

        $fieldFilters = [
            'siteId' => 'site_id',
            'itemId' => 'item_id',
            'locationId' => 'location_id',
            'movementType' => 'type',
        ];
        foreach ($fieldFilters as $input => $field) {
            if (isset($filters[$input]) && $filters[$input] !== '') {
                $value = $filters[$input];
                $records = array_values(array_filter(
                    $records,
                    static fn (array $movement): bool => $movement[$field] === $value,
                ));
            }
        }

        if (array_key_exists('reversed', $filters) && $filters['reversed'] !== null) {
            $reversed = filter_var($filters['reversed'], FILTER_VALIDATE_BOOL);
            $records = array_values(array_filter(
                $records,
                static fn (array $movement): bool => (bool) $movement['reversed'] === $reversed,
            ));
        }
        if (! empty($filters['from'])) {
            $records = array_values(array_filter(
                $records,
                static fn (array $movement): bool => $movement['created_at'] >= $filters['from'],
            ));
        }
        if (! empty($filters['to'])) {
            $records = array_values(array_filter(
                $records,
                static fn (array $movement): bool => $movement['created_at'] <= $filters['to'],
            ));
        }

        usort($records, static fn (array $left, array $right): int => strcmp($right['created_at'], $left['created_at']));
        $total = count($records);
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));

        return [
            'records' => array_slice($records, ($page - 1) * $pageSize, $pageSize),
            'total' => $total,
        ];
    }

    /** @return array<string, mixed> */
    public function get(string $movementId): array
    {
        $movement = $this->inventory->findMovement($movementId)
            ?? throw new ResourceNotFound('Movement not found.');

        if (! $this->permissions->canAccessSite((string) $movement['site_id'])) {
            throw new AuthorizationDenied;
        }

        return $movement;
    }
}
