<?php

declare(strict_types=1);

namespace App\Application\Transfers;

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
use App\Domain\Transfers\TransferRepository;
use App\Domain\Transfers\TransferStatus;
use App\Policies\TransferPolicy;
use Symfony\Component\Uid\Ulid;

final readonly class TransferCommandService
{
    public function __construct(
        private TransferRepository $transfers,
        private InventoryRepository $inventory,
        private CatalogueRepository $catalogue,
        private SiteRepository $sites,
        private SequenceRepository $sequences,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private TransferPolicy $policy,
        private CountRepository $counts,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function create(array $command): array
    {
        $sourceSiteId = (string) $command['sourceSiteId'];
        if (! $this->policy->create($sourceSiteId)) {
            throw new AuthorizationDenied;
        }
        $this->assertSiteAndLocation($sourceSiteId, (string) $command['sourceLocationId'], 'Source');
        $this->assertSiteAndLocation(
            (string) $command['destinationSiteId'],
            (string) $command['destinationLocationId'],
            'Destination',
        );
        if ($sourceSiteId === $command['destinationSiteId']) {
            throw new DomainRuleViolation('An inter-site transfer must use two different sites.');
        }

        $lines = [];
        foreach ($command['lines'] as $line) {
            $this->catalogue->findItem((string) $line['itemId'])
                ?? throw new ResourceNotFound("Item {$line['itemId']} not found.");
            $lines[] = [
                'id' => (string) new Ulid,
                'item_id' => $line['itemId'],
                'from_location_id' => $command['sourceLocationId'],
                'to_location_id' => $command['destinationLocationId'],
                'qty_requested' => Quantity::from($line['requestedQuantity'])->toString(),
                'qty_dispatched' => null,
                'qty_received' => null,
                'qty_rejected' => null,
                'discrepancy' => null,
                'discrepancy_reason' => null,
            ];
        }

        $reference = $this->sequences->nextRef('DEMO-TRF');
        $transfer = $this->transfers->createTransfer([
            'ref' => $reference,
            'from_site_id' => $sourceSiteId,
            'from_location_id' => $command['sourceLocationId'],
            'to_site_id' => $command['destinationSiteId'],
            'to_location_id' => $command['destinationLocationId'],
            'notes' => $command['notes'] ?? null,
            'requested_by_id' => $this->actor->id(),
            'lines' => $lines,
        ]);
        $this->audit('transfer.created', $transfer, 'Transfer created');
        $this->unitOfWork->commit();

        return $transfer;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(string $id, array $command): array
    {
        $transfer = $this->requireTransfer($id, (int) $command['version']);
        $this->authorize('create', $transfer);
        $this->assertStatus($transfer, TransferStatus::Draft);
        unset($command['version']);

        $sourceLocationId = (string) ($command['sourceLocationId'] ?? $transfer['from_location_id']);
        $destinationSiteId = (string) ($command['destinationSiteId'] ?? $transfer['to_site_id']);
        $destinationLocationId = (string) ($command['destinationLocationId'] ?? $transfer['to_location_id']);
        $this->assertSiteAndLocation((string) $transfer['from_site_id'], $sourceLocationId, 'Source');
        $this->assertSiteAndLocation($destinationSiteId, $destinationLocationId, 'Destination');
        if ($destinationSiteId === $transfer['from_site_id']) {
            throw new DomainRuleViolation('An inter-site transfer must use two different sites.');
        }
        $update = [
            'from_location_id' => $sourceLocationId,
            'to_site_id' => $destinationSiteId,
            'to_location_id' => $destinationLocationId,
        ];
        if (array_key_exists('notes', $command)) {
            $update['notes'] = $command['notes'];
        }
        if (isset($command['lines'])) {
            $update['lines'] = array_map(function (array $line) use ($sourceLocationId, $destinationLocationId): array {
                $this->catalogue->findItem((string) $line['itemId'])
                    ?? throw new ResourceNotFound("Item {$line['itemId']} not found.");

                return [
                    'id' => (string) new Ulid,
                    'item_id' => $line['itemId'],
                    'from_location_id' => $sourceLocationId,
                    'to_location_id' => $destinationLocationId,
                    'qty_requested' => Quantity::from($line['requestedQuantity'])->toString(),
                    'qty_dispatched' => null,
                    'qty_received' => null,
                    'qty_rejected' => null,
                    'discrepancy' => null,
                    'discrepancy_reason' => null,
                ];
            }, $command['lines']);
        }

        $updated = $this->transfers->updateTransfer($id, $update)
            ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit('transfer.updated', $updated, 'Transfer updated');
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    public function submit(string $id, int $version): array
    {
        return $this->transition($id, $version, TransferStatus::Draft, TransferStatus::Submitted, 'create', [
            'submitted_at' => now()->toISOString(),
        ]);
    }

    /** @return array<string, mixed> */
    public function approve(string $id, int $version): array
    {
        $transfer = $this->requireTransfer($id, $version);
        $this->authorize('approve', $transfer);
        $this->assertStatus($transfer, TransferStatus::Submitted);
        if (($transfer['requested_by_id'] ?? null) === $this->actor->id()) {
            throw new DomainRuleViolation('The person who requested a transfer cannot approve it.');
        }
        foreach ($transfer['lines'] as $line) {
            $balance = $this->inventory->getBalance($line['item_id'], $line['from_location_id']);
            $onHand = Quantity::from($balance['qty'] ?? '0');
            $reserved = Quantity::from($balance['reserved'] ?? '0');
            $available = $onHand->subtract($reserved);
            $requested = Quantity::from($line['qty_requested']);
            if ($requested->greaterThan($available)) {
                throw new DomainRuleViolation(
                    'The source location does not have enough available stock to approve this transfer.',
                    'insufficient-stock',
                    'Insufficient Stock',
                );
            }
        }
        foreach ($transfer['lines'] as $line) {
            $this->inventory->adjustReserved(
                $line['item_id'],
                $line['from_location_id'],
                $transfer['from_site_id'],
                $line['qty_requested'],
            );
        }
        $updated = $this->transfers->updateTransfer($id, [
            'status' => TransferStatus::Approved->value,
            'approved_by_id' => $this->actor->id(),
            'approved_at' => now()->toISOString(),
        ]) ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit('transfer.status_changed', $updated, 'Transfer approved and stock reserved', [
            'from_status' => TransferStatus::Submitted->value,
            'to_status' => TransferStatus::Approved->value,
        ]);
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function dispatch(string $id, array $command): array
    {
        $transfer = $this->requireTransfer($id, (int) $command['version']);
        $this->authorize('dispatch', $transfer);
        $this->assertStatus($transfer, TransferStatus::Approved);
        $this->assertLocationNotFrozen((string) $transfer['from_location_id']);
        $inputLines = array_column($command['lines'], null, 'lineId');
        $updatedLines = [];

        foreach ($transfer['lines'] as $line) {
            if (! isset($inputLines[$line['id']])) {
                throw new DomainRuleViolation('A dispatched quantity is required for every transfer line.');
            }
            $quantity = Quantity::from($inputLines[$line['id']]['dispatchedQuantity']);
            $requested = Quantity::from($line['qty_requested']);
            if ($quantity->greaterThan($requested)) {
                throw new DomainRuleViolation('A dispatched quantity cannot exceed the requested quantity.');
            }
            $line['qty_dispatched'] = $quantity->toString();
            $updatedLines[] = $line;
        }

        foreach ($updatedLines as $line) {
            $before = Quantity::from(
                $this->inventory->getBalance($line['item_id'], $line['from_location_id'])['qty'] ?? '0',
            );
            $dispatched = Quantity::from($line['qty_dispatched']);
            $this->inventory->adjustReserved(
                $line['item_id'],
                $line['from_location_id'],
                $transfer['from_site_id'],
                Quantity::from($line['qty_requested'])->negate()->toString(),
            );
            $this->inventory->adjustBalance(
                $line['item_id'],
                $line['from_location_id'],
                $transfer['from_site_id'],
                $dispatched->negate()->toString(),
            );
            $this->inventory->adjustInTransit(
                $line['item_id'],
                $line['to_location_id'],
                $transfer['to_site_id'],
                $dispatched->toString(),
            );
            $this->createTransferMovement(
                'transfer_dispatch',
                $transfer,
                $line,
                $dispatched->negate(),
                $before,
                $before->subtract($dispatched),
                $transfer['from_site_id'],
                $line['from_location_id'],
                $command['notes'] ?? null,
            );
        }
        $updated = $this->transfers->updateTransfer($id, [
            'status' => TransferStatus::Dispatched->value,
            'lines' => $updatedLines,
            'notes' => $command['notes'] ?? $transfer['notes'],
            'dispatched_by_id' => $this->actor->id(),
            'dispatched_at' => now()->toISOString(),
        ]) ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit('transfer.status_changed', $updated, 'Transfer dispatched', [
            'from_status' => TransferStatus::Approved->value,
            'to_status' => TransferStatus::Dispatched->value,
        ]);
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function receive(string $id, array $command): array
    {
        $transfer = $this->requireTransfer($id, (int) $command['version']);
        $this->authorize('receive', $transfer);
        $this->assertStatus($transfer, TransferStatus::Dispatched);
        $this->assertLocationNotFrozen((string) $transfer['to_location_id']);
        $inputLines = array_column($command['lines'], null, 'lineId');
        $updatedLines = [];

        foreach ($transfer['lines'] as $line) {
            if (! isset($inputLines[$line['id']])) {
                throw new DomainRuleViolation('A received quantity is required for every transfer line.');
            }
            $received = Quantity::from($inputLines[$line['id']]['receivedQuantity']);
            $rejected = Quantity::from($inputLines[$line['id']]['rejectedQuantity'] ?? '0');
            $dispatched = Quantity::from($line['qty_dispatched'] ?? '0');
            if ($received->add($rejected)->toString() !== $dispatched->toString()) {
                throw new DomainRuleViolation('Every dispatched quantity must be recorded as received or rejected.');
            }
            if ((! $rejected->isZero() || $received->toString() !== $dispatched->toString())
                && empty($inputLines[$line['id']]['discrepancyReason'])) {
                throw new DomainRuleViolation('A discrepancy reason is required when any quantity is rejected.');
            }
            $line['qty_received'] = $received->toString();
            $line['qty_rejected'] = $rejected->toString();
            $line['discrepancy'] = $received->subtract($dispatched)->toString();
            $line['discrepancy_reason'] = $inputLines[$line['id']]['discrepancyReason'] ?? null;
            $updatedLines[] = $line;
        }

        foreach ($updatedLines as $line) {
            $before = Quantity::from(
                $this->inventory->getBalance($line['item_id'], $line['to_location_id'])['qty'] ?? '0',
            );
            $received = Quantity::from($line['qty_received']);
            $dispatched = Quantity::from($line['qty_dispatched']);
            $this->inventory->adjustInTransit(
                $line['item_id'],
                $line['to_location_id'],
                $transfer['to_site_id'],
                $dispatched->negate()->toString(),
            );
            $this->inventory->adjustBalance(
                $line['item_id'],
                $line['to_location_id'],
                $transfer['to_site_id'],
                $received->toString(),
            );
            $this->createTransferMovement(
                'transfer_receipt',
                $transfer,
                $line,
                $received,
                $before,
                $before->add($received),
                $transfer['to_site_id'],
                $line['to_location_id'],
                $command['notes'] ?? $line['discrepancy_reason'],
            );
        }
        $updated = $this->transfers->updateTransfer($id, [
            'status' => TransferStatus::Received->value,
            'lines' => $updatedLines,
            'notes' => $command['notes'] ?? $transfer['notes'],
            'received_by_id' => $this->actor->id(),
            'received_at' => now()->toISOString(),
        ]) ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit('transfer.status_changed', $updated, 'Transfer received', [
            'from_status' => TransferStatus::Dispatched->value,
            'to_status' => TransferStatus::Received->value,
        ]);
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    public function cancel(string $id, int $version, string $reason): array
    {
        $transfer = $this->requireTransfer($id, $version);
        $this->authorize('create', $transfer);
        $status = TransferStatus::from($transfer['status']);
        if (! in_array($status, [TransferStatus::Draft, TransferStatus::Submitted], true)) {
            throw new DomainRuleViolation('Only draft or submitted transfers can be cancelled.', 'invalid-transition', 'Invalid Transition');
        }
        $updated = $this->transfers->updateTransfer($id, [
            'status' => TransferStatus::Cancelled->value,
            'notes' => $reason,
        ]) ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit('transfer.status_changed', $updated, 'Transfer cancelled', [
            'from_status' => $status->value,
            'to_status' => TransferStatus::Cancelled->value,
        ]);
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $extra
     * @return array<string, mixed>
     */
    private function transition(
        string $id,
        int $version,
        TransferStatus $from,
        TransferStatus $to,
        string $ability,
        array $extra,
    ): array {
        $transfer = $this->requireTransfer($id, $version);
        $this->authorize($ability, $transfer);
        $this->assertStatus($transfer, $from);
        $updated = $this->transfers->updateTransfer($id, ['status' => $to->value] + $extra)
            ?? throw new ResourceNotFound('Transfer not found.');
        $this->audit("transfer.{$to->value}", $updated, "Transfer {$to->value}", [
            'from_status' => $from->value,
            'to_status' => $to->value,
        ]);
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    private function requireTransfer(string $id, int $version): array
    {
        $transfer = $this->transfers->findTransfer($id)
            ?? throw new ResourceNotFound('Transfer not found.');
        if ((int) $transfer['version'] !== $version) {
            throw new ConcurrencyConflict;
        }

        return $transfer;
    }

    /** @param array<string, mixed> $transfer */
    private function assertStatus(array $transfer, TransferStatus $expected): void
    {
        if ($transfer['status'] !== $expected->value) {
            throw new DomainRuleViolation(
                "Transfer must be in '{$expected->value}' status.",
                'invalid-transition',
                'Invalid Transition',
            );
        }
    }

    /** @param array<string, mixed> $transfer */
    private function authorize(string $ability, array $transfer): void
    {
        $allowed = match ($ability) {
            'approve' => $this->policy->approve($transfer['from_site_id']),
            'dispatch' => $this->policy->dispatch($transfer['from_site_id']),
            'receive' => $this->policy->receive($transfer['to_site_id']),
            default => $this->policy->create($transfer['from_site_id']),
        };
        if (! $allowed) {
            throw new AuthorizationDenied;
        }
    }

    private function assertSiteAndLocation(string $siteId, string $locationId, string $label): void
    {
        $this->sites->findSite($siteId) ?? throw new ResourceNotFound("{$label} site not found.");
        $location = $this->sites->findLocation($locationId)
            ?? throw new ResourceNotFound("{$label} location not found.");
        if ($location['site_id'] !== $siteId) {
            throw new DomainRuleViolation("{$label} location does not belong to the selected site.");
        }
    }

    private function assertLocationNotFrozen(string $locationId): void
    {
        foreach ($this->counts->getCounts() as $count) {
            if (($count['location_id'] ?? null) === $locationId
                && ($count['status'] ?? null) === 'in_progress') {
                throw new DomainRuleViolation(
                    'This location is frozen while a physical stock count is in progress.',
                    'location-frozen',
                    'Location Frozen',
                );
            }
        }
    }

    /** @param array<string, mixed> $transfer
     * @param  array<string, mixed>  $payload
     */
    private function audit(string $eventType, array $transfer, string $summary, array $payload = []): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $eventType,
            'resource_type' => 'transfer',
            'resource_id' => $transfer['id'],
            'user_id' => $this->actor->id(),
            'site_id' => $transfer['from_site_id'],
            'summary' => "{$summary}: {$transfer['ref']}",
            'payload' => ['ref' => $transfer['ref']] + $payload,
        ]);
    }

    /** @param array<string, mixed> $transfer
     * @param  array<string, mixed>  $line
     */
    private function createTransferMovement(
        string $type,
        array $transfer,
        array $line,
        Quantity $quantity,
        Quantity $before,
        Quantity $after,
        string $siteId,
        string $locationId,
        ?string $notes,
    ): void {
        $this->inventory->createMovement([
            'type' => $type,
            'ref' => $transfer['ref'],
            'item_id' => $line['item_id'],
            'location_id' => $locationId,
            'site_id' => $siteId,
            'qty' => $quantity->toString(),
            'qty_before' => $before->toString(),
            'qty_after' => $after->toString(),
            'reason_id' => null,
            'notes' => $notes,
            'user_id' => $this->actor->id(),
            'reversed' => false,
            'reversal_of' => null,
        ]);
    }
}
