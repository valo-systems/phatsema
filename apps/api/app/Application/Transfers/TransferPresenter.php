<?php

declare(strict_types=1);

namespace App\Application\Transfers;

use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Sites\SiteRepository;

final readonly class TransferPresenter
{
    public function __construct(
        private SiteRepository $sites,
        private CatalogueRepository $catalogue,
        private ReferenceRepository $reference,
        private IdentityRepository $identities,
    ) {}

    /** @param array<string, mixed> $transfer
     * @return array<string, mixed>
     */
    public function present(array $transfer): array
    {
        $sourceSite = $this->sites->findSite((string) $transfer['from_site_id']);
        $destinationSite = $this->sites->findSite((string) $transfer['to_site_id']);
        $sourceLocationId = (string) ($transfer['from_location_id'] ?? $transfer['lines'][0]['from_location_id']);
        $destinationLocationId = (string) ($transfer['to_location_id'] ?? $transfer['lines'][0]['to_location_id']);
        $sourceLocation = $this->sites->findLocation($sourceLocationId);
        $destinationLocation = $this->sites->findLocation($destinationLocationId);
        $requester = $this->identities->findUser((string) $transfer['requested_by_id']);
        $units = array_column($this->reference->getUnits(), null, 'id');
        $hasDiscrepancy = false;
        $lines = [];

        foreach ($transfer['lines'] as $line) {
            $item = $this->catalogue->findItem((string) $line['item_id']);
            $unit = $item === null ? null : ($units[$item['unit_id']] ?? null);
            $discrepancy = $line['discrepancy'] ?? null;
            $hasDiscrepancy = $hasDiscrepancy
                || ($discrepancy !== null && ! Quantity::from($discrepancy)->isZero());
            $lines[] = [
                'id' => $line['id'],
                'itemId' => $line['item_id'],
                'itemName' => $item['name'] ?? null,
                'itemSku' => $item['code'] ?? null,
                'requestedQuantity' => $line['qty_requested'],
                'dispatchedQuantity' => $line['qty_dispatched'],
                'receivedQuantity' => $line['qty_received'],
                'rejectedQuantity' => $line['qty_rejected'] ?? null,
                'discrepancyReason' => $line['discrepancy_reason'] ?? null,
                'unit' => $unit['code'] ?? null,
                'sourceLocationId' => $line['from_location_id'],
                'sourceLocationName' => $this->sites->findLocation((string) $line['from_location_id'])['name'] ?? null,
                'destinationLocationId' => $line['to_location_id'],
                'destinationLocationName' => $this->sites->findLocation((string) $line['to_location_id'])['name'] ?? null,
            ];
        }

        return [
            'id' => $transfer['id'],
            'transferNumber' => $transfer['ref'],
            'sourceSiteId' => $transfer['from_site_id'],
            'sourceSiteName' => $sourceSite['name'] ?? null,
            'sourceLocationId' => $sourceLocationId,
            'sourceLocationName' => $sourceLocation['name'] ?? null,
            'destinationSiteId' => $transfer['to_site_id'],
            'destinationSiteName' => $destinationSite['name'] ?? null,
            'destinationLocationId' => $destinationLocationId,
            'destinationLocationName' => $destinationLocation['name'] ?? null,
            'status' => $transfer['status'],
            'requestedBy' => $transfer['requested_by_id'],
            'requestedByName' => $requester['name'] ?? null,
            'approvedBy' => $transfer['approved_by_id'],
            'dispatchedBy' => $transfer['dispatched_by_id'],
            'receivedBy' => $transfer['received_by_id'],
            'submittedAt' => $transfer['submitted_at'],
            'approvedAt' => $transfer['approved_at'],
            'dispatchedAt' => $transfer['dispatched_at'],
            'receivedAt' => $transfer['received_at'],
            'notes' => $transfer['notes'],
            'hasDiscrepancy' => $hasDiscrepancy,
            'lines' => $lines,
            'timeline' => $this->timeline($transfer),
            'version' => $transfer['version'],
        ];
    }

    /** @param list<array<string, mixed>> $transfers
     * @return list<array<string, mixed>>
     */
    public function presentMany(array $transfers): array
    {
        return array_map($this->present(...), $transfers);
    }

    /** @param array<string, mixed> $transfer
     * @return list<array<string, mixed>>
     */
    private function timeline(array $transfer): array
    {
        $events = [];
        $definitions = [
            ['draft', 'created_at', 'requested_by_id'],
            ['submitted', 'submitted_at', 'requested_by_id'],
            ['approved', 'approved_at', 'approved_by_id'],
            ['dispatched', 'dispatched_at', 'dispatched_by_id'],
            ['received', 'received_at', 'received_by_id'],
        ];
        foreach ($definitions as [$status, $timeKey, $userKey]) {
            if (empty($transfer[$timeKey]) || empty($transfer[$userKey])) {
                continue;
            }
            $user = $this->identities->findUser((string) $transfer[$userKey]);
            $events[] = [
                'status' => $status,
                'at' => $transfer[$timeKey],
                'byUserId' => $transfer[$userKey],
                'byName' => $user['name'] ?? 'Unknown user',
                'note' => null,
            ];
        }

        return $events;
    }
}
