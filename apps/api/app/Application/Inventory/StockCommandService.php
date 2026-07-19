<?php

declare(strict_types=1);

namespace App\Application\Inventory;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Counts\CountRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Policies\InventoryPolicy;

final readonly class StockCommandService
{
    public function __construct(
        private InventoryRepository $inventory,
        private CatalogueRepository $catalogue,
        private SiteRepository $sites,
        private SequenceRepository $sequences,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private InventoryPolicy $policy,
        private CountRepository $counts,
    ) {}

    /** @param array<string, mixed> $command
     * @return list<array<string, mixed>>
     */
    public function receive(array $command): array
    {
        $this->assertSiteContext($command, 'receive');
        $reference = $this->sequences->nextRef('DEMO-RCT');
        $movements = [];

        foreach ($command['lines'] as $line) {
            $movements[] = $this->post(
                type: 'receipt',
                reference: $reference,
                siteId: (string) $command['siteId'],
                locationId: (string) $command['locationId'],
                itemId: (string) $line['itemId'],
                delta: Quantity::from($line['quantity']),
                reasonCode: null,
                notes: $command['notes'] ?? null,
                summaryContext: " supplier reference: {$command['reference']}",
                occurredAt: (string) $command['receivedAt'],
                externalReference: (string) $command['reference'],
                purpose: null,
                batchCode: $line['batchCode'] ?? null,
            );
        }

        $this->unitOfWork->commit();

        return $movements;
    }

    /** @param array<string, mixed> $command
     * @return list<array<string, mixed>>
     */
    public function issue(array $command): array
    {
        $this->assertSiteContext($command, 'issue');
        $reference = $this->sequences->nextRef('DEMO-ISS');
        $movements = [];

        foreach ($command['lines'] as $line) {
            $movements[] = $this->post(
                type: 'issue',
                reference: $reference,
                siteId: (string) $command['siteId'],
                locationId: (string) $command['locationId'],
                itemId: (string) $line['itemId'],
                delta: Quantity::from($line['quantity'])->negate(),
                reasonCode: null,
                notes: $command['notes'] ?? null,
                summaryContext: " to {$command['recipient']} for {$command['purpose']}"
                    .(! empty($command['reference']) ? " ({$command['reference']})" : ''),
                occurredAt: now()->toDateString(),
                externalReference: $command['reference'] ?? null,
                purpose: (string) $command['purpose'],
                batchCode: null,
            );
        }

        $this->unitOfWork->commit();

        return $movements;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function adjust(array $command): array
    {
        $this->assertSiteContext($command, 'adjust');
        $quantity = Quantity::from($command['quantity']);
        $delta = $command['direction'] === 'decrease' ? $quantity->negate() : $quantity;
        $reference = $this->sequences->nextRef('DEMO-ADJ');

        $movement = $this->post(
            type: 'adjustment',
            reference: $reference,
            siteId: (string) $command['siteId'],
            locationId: (string) $command['locationId'],
            itemId: (string) $command['itemId'],
            delta: $delta,
            reasonCode: (string) $command['reasonCode'],
            notes: $command['notes'] ?? null,
            summaryContext: " reason: {$command['reasonCode']}",
            occurredAt: (string) $command['adjustedAt'],
            externalReference: null,
            purpose: null,
            batchCode: null,
        );

        $this->unitOfWork->commit();

        return $movement;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function reverse(string $movementId, array $command): array
    {
        $original = $this->inventory->findMovement($movementId)
            ?? throw new ResourceNotFound('Movement not found.');
        if (in_array($original['type'] ?? null, ['transfer_dispatch', 'transfer_receipt'], true)) {
            throw new DomainRuleViolation('Transfer movements must be corrected through the transfer discrepancy workflow.');
        }

        $siteId = (string) $original['site_id'];
        if (! $this->policy->adjust($siteId)) {
            throw new AuthorizationDenied;
        }
        if ((bool) ($original['reversed'] ?? false)) {
            throw new ConcurrencyConflict;
        }

        $delta = Quantity::from($original['qty'])->negate();
        $before = $this->currentBalance((string) $original['item_id'], (string) $original['location_id']);
        $after = $before->add($delta);
        if ($after->isNegative()) {
            throw new DomainRuleViolation(
                'This reversal would create a negative stock balance.',
                'insufficient-stock',
                'Insufficient Stock',
            );
        }

        $reference = $this->sequences->nextRef('DEMO-REV');
        $movement = $this->inventory->createMovement([
            'type' => 'reversal',
            'ref' => $reference,
            'item_id' => $original['item_id'],
            'location_id' => $original['location_id'],
            'site_id' => $siteId,
            'qty' => $delta->toString(),
            'qty_before' => $before->toString(),
            'qty_after' => $after->toString(),
            'reason_id' => $command['reasonCode'],
            'notes' => $command['notes'] ?? null,
            'user_id' => $this->actor->id(),
            'reversed' => false,
            'reversal_of' => $movementId,
        ]);

        $this->inventory->adjustBalance(
            (string) $original['item_id'],
            (string) $original['location_id'],
            $siteId,
            $delta->toString(),
        );
        $this->inventory->markMovementReversed($movementId);
        $this->recordAudit(
            eventType: 'movement.reversed',
            movement: $movement,
            itemName: (string) ($this->catalogue->findItem((string) $original['item_id'])['name'] ?? 'item'),
            summary: "Movement {$original['ref']} reversed by {$reference}",
        );
        $this->unitOfWork->commit();

        return $movement;
    }

    /** @param array<string, mixed> $command */
    private function assertSiteContext(array $command, string $ability): void
    {
        $siteId = (string) $command['siteId'];
        $allowed = match ($ability) {
            'receive' => $this->policy->receive($siteId),
            'issue' => $this->policy->issue($siteId),
            default => $this->policy->adjust($siteId),
        };
        if (! $allowed) {
            throw new AuthorizationDenied;
        }

        $this->sites->findSite($siteId) ?? throw new ResourceNotFound('Site not found.');
        $location = $this->sites->findLocation((string) $command['locationId'])
            ?? throw new ResourceNotFound('Location not found.');
        if (($location['site_id'] ?? null) !== $siteId) {
            throw new DomainRuleViolation('The selected location does not belong to the selected site.');
        }
        foreach ($this->counts->getCounts() as $count) {
            if (($count['location_id'] ?? null) === $command['locationId']
                && ($count['status'] ?? null) === 'in_progress') {
                throw new DomainRuleViolation(
                    'Stock movements are paused at this location while a physical count is in progress.',
                    'location-frozen',
                    'Location Frozen',
                );
            }
        }
    }

    /** @return array<string, mixed> */
    private function post(
        string $type,
        string $reference,
        string $siteId,
        string $locationId,
        string $itemId,
        Quantity $delta,
        ?string $reasonCode,
        mixed $notes,
        ?string $summaryContext,
        string $occurredAt,
        ?string $externalReference,
        ?string $purpose,
        ?string $batchCode,
    ): array {
        $item = $this->catalogue->findItem($itemId)
            ?? throw new ResourceNotFound("Item {$itemId} not found.");
        $before = $this->currentBalance($itemId, $locationId);
        $after = $before->add($delta);
        if ($after->isNegative()) {
            throw new DomainRuleViolation(
                "Cannot post {$delta->negate()->toString()} of {$item['name']}. Only {$before->toString()} available.",
                'insufficient-stock',
                'Insufficient Stock',
            );
        }

        $movement = $this->inventory->createMovement([
            'type' => $type,
            'ref' => $reference,
            'item_id' => $itemId,
            'location_id' => $locationId,
            'site_id' => $siteId,
            'qty' => $delta->toString(),
            'qty_before' => $before->toString(),
            'qty_after' => $after->toString(),
            'reason_id' => $reasonCode,
            'notes' => $notes,
            'occurred_at' => $occurredAt,
            'external_reference' => $externalReference,
            'purpose' => $purpose,
            'batch_code' => $batchCode,
            'user_id' => $this->actor->id(),
            'reversed' => false,
            'reversal_of' => null,
        ]);
        $this->inventory->adjustBalance($itemId, $locationId, $siteId, $delta->toString());
        $label = ucfirst($type);
        $this->recordAudit(
            eventType: 'movement.created',
            movement: $movement,
            itemName: (string) $item['name'],
            summary: "{$label} posted: {$reference} ({$delta->toString()} {$item['name']})".($summaryContext ?? ''),
        );

        return $movement;
    }

    private function currentBalance(string $itemId, string $locationId): Quantity
    {
        return Quantity::from($this->inventory->getBalance($itemId, $locationId)['qty'] ?? '0.00');
    }

    /** @param array<string, mixed> $movement */
    private function recordAudit(string $eventType, array $movement, string $itemName, string $summary): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $eventType,
            'resource_type' => 'movement',
            'resource_id' => $movement['id'],
            'user_id' => $this->actor->id(),
            'site_id' => $movement['site_id'],
            'summary' => $summary,
            'payload' => [
                'ref' => $movement['ref'],
                'item_name' => $itemName,
                'quantity' => $movement['qty'],
            ],
        ]);
    }
}
