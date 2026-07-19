<?php

declare(strict_types=1);

namespace App\Application\Inventory;

use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Sites\SiteRepository;

final readonly class MovementPresenter
{
    public function __construct(
        private CatalogueRepository $catalogue,
        private ReferenceRepository $reference,
        private SiteRepository $sites,
        private IdentityRepository $identities,
        private InventoryRepository $inventory,
    ) {}

    /** @param array<string, mixed> $movement
     * @return array<string, mixed>
     */
    public function present(array $movement): array
    {
        $item = $this->catalogue->findItem((string) $movement['item_id']);
        $units = array_column($this->reference->getUnits(), null, 'id');
        $unit = $item === null ? null : ($units[$item['unit_id']] ?? null);
        $location = $this->sites->findLocation((string) $movement['location_id']);
        $site = $this->sites->findSite((string) $movement['site_id']);
        $actor = $this->identities->findUser((string) ($movement['user_id'] ?? ''));

        return [
            'id' => $movement['id'],
            'sequence' => abs(crc32((string) $movement['id'])),
            'occurredAt' => $movement['occurred_at'] ?? $movement['created_at'],
            'postedAt' => $movement['created_at'],
            'movementType' => $this->movementType($movement),
            'referenceNumber' => $movement['ref'],
            'itemId' => $movement['item_id'],
            'itemSku' => $item['code'] ?? null,
            'itemName' => $item['name'] ?? null,
            'quantity' => $movement['qty'],
            'quantityBefore' => $movement['qty_before'] ?? null,
            'quantityAfter' => $movement['qty_after'] ?? null,
            'unit' => $unit['code'] ?? null,
            'sourceSiteId' => $movement['site_id'],
            'sourceSiteName' => $site['name'] ?? null,
            'sourceLocationId' => $movement['location_id'],
            'sourceLocationName' => $location['name'] ?? null,
            'destinationSiteId' => null,
            'destinationSiteName' => null,
            'destinationLocationId' => null,
            'destinationLocationName' => null,
            'batchId' => null,
            'referenceType' => $movement['type'],
            'referenceId' => $movement['ref'],
            'referenceLabel' => $movement['ref'],
            'reasonCode' => $movement['reason_id'],
            'notes' => $this->traceNotes($movement),
            'actorUserId' => $movement['user_id'],
            'actorName' => $actor['name'] ?? null,
            'reversalOfId' => $movement['reversal_of'] ?? null,
            'reversedById' => $this->reversedById((string) $movement['id']),
            'reversed' => (bool) ($movement['reversed'] ?? false),
            'resultingBalance' => $movement['qty_after'] ?? null,
            'auditEventId' => null,
        ];
    }

    /** @param list<array<string, mixed>> $movements
     * @return list<array<string, mixed>>
     */
    public function presentMany(array $movements): array
    {
        return array_map($this->present(...), $movements);
    }

    /** @param array<string, mixed> $movement */
    private function movementType(array $movement): string
    {
        if ($movement['type'] !== 'adjustment') {
            return (string) $movement['type'];
        }

        return Quantity::from($movement['qty'])->isNegative()
            ? 'adjustment_decrease'
            : 'adjustment_increase';
    }

    private function reversedById(string $movementId): ?string
    {
        foreach ($this->inventory->getMovements() as $movement) {
            if (($movement['reversal_of'] ?? null) === $movementId) {
                return (string) $movement['id'];
            }
        }

        return null;
    }

    /** @param array<string, mixed> $movement */
    private function traceNotes(array $movement): ?string
    {
        $parts = array_values(array_filter([
            $movement['notes'] ?? null,
            isset($movement['external_reference']) ? "External reference: {$movement['external_reference']}" : null,
            isset($movement['purpose']) ? "Purpose: {$movement['purpose']}" : null,
            isset($movement['batch_code']) ? "Batch: {$movement['batch_code']}" : null,
        ]));

        return $parts === [] ? null : implode(' | ', $parts);
    }
}
