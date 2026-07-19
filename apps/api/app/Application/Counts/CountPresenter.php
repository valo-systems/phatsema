<?php

declare(strict_types=1);

namespace App\Application\Counts;

use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Sites\SiteRepository;

final readonly class CountPresenter
{
    public function __construct(
        private SiteRepository $sites,
        private CatalogueRepository $catalogue,
        private ReferenceRepository $reference,
        private IdentityRepository $identities,
    ) {}

    /** @param array<string, mixed> $count
     * @return array<string, mixed>
     */
    public function present(array $count): array
    {
        $site = $this->sites->findSite((string) $count['site_id']);
        $location = $this->sites->findLocation((string) $count['location_id']);
        $creator = $this->identities->findUser((string) ($count['created_by_id'] ?? ''));
        $units = array_column($this->reference->getUnits(), null, 'id');
        $hideExpected = (bool) ($count['blind_count'] ?? false)
            && in_array($count['status'], ['draft', 'in_progress'], true);
        $entries = [];
        $materialVariance = false;

        foreach ($count['entries'] as $entry) {
            $item = $this->catalogue->findItem((string) $entry['item_id']);
            $unit = $item === null ? null : ($units[$item['unit_id']] ?? null);
            $variance = $entry['variance'] ?? null;
            $materialVariance = $materialVariance
                || ($variance !== null && ! Quantity::from($variance)->isZero());
            $entries[] = [
                'id' => $entry['id'],
                'itemId' => $entry['item_id'],
                'itemSku' => $item['code'] ?? null,
                'itemName' => $item['name'] ?? null,
                'expectedQuantity' => $hideExpected ? null : ($entry['system_qty'] ?? null),
                'countedQuantity' => $entry['counted_qty'] ?? null,
                'variance' => $hideExpected ? null : $variance,
                'variancePercent' => null,
                'notes' => $entry['notes'] ?? null,
                'unit' => $unit['code'] ?? null,
                'countedBy' => $entry['counted_by'] ?? null,
                'countedAt' => $entry['counted_at'] ?? null,
                'recountNumber' => $entry['recount_number'] ?? 0,
            ];
        }

        return [
            'id' => $count['id'],
            'countNumber' => $count['ref'],
            'siteId' => $count['site_id'],
            'siteName' => $site['name'] ?? null,
            'locationId' => $count['location_id'],
            'locationName' => $location['name'] ?? null,
            'scope' => $count['scope'],
            'scopeCategoryId' => $count['scope_category_id'] ?? null,
            'scopeItemIds' => $count['scope_item_ids'] ?? [],
            'blindCount' => (bool) $count['blind_count'],
            'status' => $count['status'],
            'notes' => $count['notes'] ?? null,
            'createdBy' => $count['created_by_id'],
            'createdByName' => $creator['name'] ?? null,
            'assignedUserIds' => $count['assigned_user_ids'] ?? [],
            'startedAt' => $count['started_at'],
            'submittedAt' => $count['submitted_at'],
            'reviewedBy' => $count['approved_by_id'],
            'reviewedAt' => $count['approved_at'],
            'reviewNote' => $count['review_note'] ?? null,
            'postedBy' => $count['posted_by_id'],
            'postedAt' => $count['posted_at'],
            'entries' => $entries,
            'materialVariance' => $materialVariance,
            'version' => $count['version'],
        ];
    }

    /** @param list<array<string, mixed>> $counts
     * @return list<array<string, mixed>>
     */
    public function presentMany(array $counts): array
    {
        return array_map($this->present(...), $counts);
    }
}
