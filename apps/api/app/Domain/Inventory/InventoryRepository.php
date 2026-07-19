<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

interface InventoryRepository
{
    /** @return array<string, mixed>|null */
    public function getBalance(string $itemId, string $locationId): ?array;

    /** @return list<array<string, mixed>> */
    public function getBalancesForItem(string $itemId): array;

    /** @return list<array<string, mixed>> */
    public function getAllBalances(): array;

    public function adjustBalance(string $itemId, string $locationId, string $siteId, string $delta): void;

    public function adjustReserved(string $itemId, string $locationId, string $siteId, string $delta): void;

    public function adjustInTransit(string $itemId, string $locationId, string $siteId, string $delta): void;

    /** @return list<array<string, mixed>> */
    public function getMovements(): array;

    /** @return array<string, mixed>|null */
    public function findMovement(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createMovement(array $data): array;

    public function markMovementReversed(string $id): void;
}
