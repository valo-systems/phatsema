<?php

declare(strict_types=1);

namespace App\Application\Counts;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Counts\CountRepository;
use App\Domain\Counts\CountStatus;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Policies\CountPolicy;
use Symfony\Component\Uid\Ulid;

final readonly class CountCommandService
{
    public function __construct(
        private CountRepository $counts,
        private InventoryRepository $inventory,
        private CatalogueRepository $catalogue,
        private SiteRepository $sites,
        private SequenceRepository $sequences,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private CountPolicy $policy,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function create(array $command): array
    {
        $siteId = (string) $command['siteId'];
        if (! $this->policy->create($siteId)) {
            throw new AuthorizationDenied;
        }
        $this->sites->findSite($siteId) ?? throw new ResourceNotFound('Site not found.');
        $location = $this->sites->findLocation((string) $command['locationId'])
            ?? throw new ResourceNotFound('Location not found.');
        if ($location['site_id'] !== $siteId) {
            throw new DomainRuleViolation('The selected location does not belong to the selected site.');
        }

        $itemIds = $this->resolveItemIds($command);
        if ($itemIds === []) {
            throw new DomainRuleViolation('The selected count scope contains no items.');
        }
        $entries = [];
        foreach ($itemIds as $itemId) {
            $this->catalogue->findItem($itemId) ?? throw new ResourceNotFound("Item {$itemId} not found.");
            $entries[] = [
                'id' => (string) new Ulid,
                'item_id' => $itemId,
                'system_qty' => $this->inventory->getBalance($itemId, $command['locationId'])['qty'] ?? '0.00',
                'counted_qty' => null,
                'variance' => null,
                'notes' => null,
                'counted_by' => null,
                'counted_at' => null,
                'recount_number' => 0,
            ];
        }

        $count = $this->counts->createCount([
            'ref' => $this->sequences->nextRef('DEMO-CNT'),
            'site_id' => $siteId,
            'location_id' => $command['locationId'],
            'scope' => $command['scope'],
            'scope_category_id' => $command['scopeCategoryId'] ?? null,
            'scope_item_ids' => $itemIds,
            'blind_count' => (bool) $command['blindCount'],
            'assigned_user_ids' => $command['assignedUserIds'] ?? [],
            'notes' => $command['notes'] ?? null,
            'created_by_id' => $this->actor->id(),
            'entries' => $entries,
        ]);
        $this->audit('count.created', $count, 'Stock count created');
        $this->unitOfWork->commit();

        return $count;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(string $id, array $command): array
    {
        $count = $this->requireCount($id, (int) $command['version'], 'create');
        $this->assertStatus($count, CountStatus::Draft);
        $update = [];
        foreach (['blindCount' => 'blind_count', 'assignedUserIds' => 'assigned_user_ids'] as $input => $field) {
            if (array_key_exists($input, $command)) {
                $update[$field] = $command[$input];
            }
        }
        $updated = $this->counts->updateCount($id, $update) ?? throw new ResourceNotFound('Stock count not found.');
        $this->audit('count.updated', $updated, 'Stock count updated');
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    public function start(string $id, int $version): array
    {
        $count = $this->requireCount($id, $version, 'create');
        $status = CountStatus::from($count['status']);
        if (! in_array($status, [CountStatus::Draft, CountStatus::RecountRequired], true)) {
            throw $this->invalidTransition('Count must be in draft or recount-required status to start.');
        }
        $entries = array_map(function (array $entry) use ($count): array {
            $entry['system_qty'] = $this->inventory->getBalance(
                $entry['item_id'],
                $count['location_id'],
            )['qty'] ?? '0.00';
            $entry['counted_qty'] = null;
            $entry['variance'] = null;

            return $entry;
        }, $count['entries']);
        $updated = $this->counts->updateCount($id, [
            'status' => CountStatus::InProgress->value,
            'entries' => $entries,
            'started_by_id' => $this->actor->id(),
            'started_at' => now()->toISOString(),
        ]) ?? throw new ResourceNotFound('Stock count not found.');
        $this->audit('count.started', $updated, 'Stock count started');
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function saveEntries(string $id, array $command): array
    {
        $count = $this->requireCount($id, (int) $command['version'], 'create');
        $this->assertStatus($count, CountStatus::InProgress);
        $incoming = array_column($command['entries'], null, 'entryId');
        $knownIds = array_column($count['entries'], 'id');
        foreach (array_keys($incoming) as $entryId) {
            if (! in_array($entryId, $knownIds, true)) {
                throw new ResourceNotFound("Count entry {$entryId} not found.");
            }
        }
        $entries = array_map(function (array $entry) use ($incoming): array {
            if (! isset($incoming[$entry['id']])) {
                return $entry;
            }
            $input = $incoming[$entry['id']];
            $counted = Quantity::from($input['countedQuantity']);
            $entry['counted_qty'] = $counted->toString();
            $entry['variance'] = $counted->subtract(Quantity::from($entry['system_qty']))->toString();
            $entry['notes'] = $input['notes'] ?? null;
            $entry['counted_by'] = $this->actor->id();
            $entry['counted_at'] = now()->toISOString();

            return $entry;
        }, $count['entries']);
        $updated = $this->counts->updateCount($id, ['entries' => $entries])
            ?? throw new ResourceNotFound('Stock count not found.');
        $this->audit('count.entries_saved', $updated, 'Count entries saved');
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    public function submit(string $id, int $version): array
    {
        $count = $this->requireCount($id, $version, 'create');
        $this->assertStatus($count, CountStatus::InProgress);
        foreach ($count['entries'] as $entry) {
            if ($entry['counted_qty'] === null) {
                throw new DomainRuleViolation('Every count entry must be completed before submission.');
            }
        }

        return $this->transition($count, CountStatus::Submitted, [
            'submitted_by_id' => $this->actor->id(),
            'submitted_at' => now()->toISOString(),
        ]);
    }

    /** @return array<string, mixed> */
    public function requestRecount(string $id, int $version, ?string $note): array
    {
        $count = $this->requireCount($id, $version, 'review');
        $this->assertStatus($count, CountStatus::Submitted);
        $entries = array_map(static function (array $entry): array {
            $entry['counted_qty'] = null;
            $entry['variance'] = null;
            $entry['counted_by'] = null;
            $entry['counted_at'] = null;
            $entry['recount_number'] = ((int) ($entry['recount_number'] ?? 0)) + 1;

            return $entry;
        }, $count['entries']);

        return $this->transition($count, CountStatus::RecountRequired, [
            'entries' => $entries,
            'review_note' => $note,
        ]);
    }

    /** @return array<string, mixed> */
    public function approve(string $id, int $version, ?string $note): array
    {
        $count = $this->requireCount($id, $version, 'review');
        $this->assertStatus($count, CountStatus::Submitted);
        if (($count['created_by_id'] ?? null) === $this->actor->id()
            || ($count['submitted_by_id'] ?? null) === $this->actor->id()) {
            throw new DomainRuleViolation('The person who performed a count cannot approve it.');
        }
        $hasVariance = false;
        foreach ($count['entries'] as $entry) {
            if (! Quantity::from($entry['variance'] ?? '0')->isZero()) {
                $hasVariance = true;
                break;
            }
        }
        if ($hasVariance && empty(trim((string) $note))) {
            throw new DomainRuleViolation('A review note is required when the count contains a variance.');
        }

        return $this->transition($count, CountStatus::Reviewed, [
            'approved_by_id' => $this->actor->id(),
            'approved_at' => now()->toISOString(),
            'review_note' => $note,
        ]);
    }

    /** @return array<string, mixed> */
    public function post(string $id, int $version): array
    {
        $count = $this->requireCount($id, $version, 'post');
        $this->assertStatus($count, CountStatus::Reviewed);

        foreach ($count['entries'] as $entry) {
            $variance = Quantity::from($entry['variance'] ?? '0');
            if ($variance->isZero()) {
                continue;
            }
            $before = Quantity::from(
                $this->inventory->getBalance($entry['item_id'], $count['location_id'])['qty'] ?? '0.00',
            );
            $after = $before->add($variance);
            if ($after->isNegative()) {
                throw new DomainRuleViolation('Posting this count would create a negative balance.');
            }
            $this->inventory->createMovement([
                'type' => 'count_variance',
                'ref' => $this->sequences->nextRef('DEMO-CTV'),
                'item_id' => $entry['item_id'],
                'location_id' => $count['location_id'],
                'site_id' => $count['site_id'],
                'qty' => $variance->toString(),
                'qty_before' => $before->toString(),
                'qty_after' => $after->toString(),
                'reason_id' => 'RSN-CORR',
                'notes' => "Count variance from {$count['ref']}",
                'user_id' => $this->actor->id(),
                'reversed' => false,
                'reversal_of' => null,
            ]);
            $this->inventory->adjustBalance(
                $entry['item_id'],
                $count['location_id'],
                $count['site_id'],
                $variance->toString(),
            );
        }

        return $this->transition($count, CountStatus::Posted, [
            'posted_by_id' => $this->actor->id(),
            'posted_at' => now()->toISOString(),
        ]);
    }

    /** @param array<string, mixed> $command
     * @return list<string>
     */
    private function resolveItemIds(array $command): array
    {
        if ($command['scope'] === 'selected_items') {
            return array_values(array_unique($command['scopeItemIds'] ?? []));
        }
        $balances = array_filter(
            $this->inventory->getAllBalances(),
            static fn (array $balance): bool => $balance['location_id'] === $command['locationId'],
        );
        if ($command['scope'] === 'category') {
            $categoryId = $command['scopeCategoryId'] ?? null;
            $balances = array_filter($balances, function (array $balance) use ($categoryId): bool {
                return ($this->catalogue->findItem($balance['item_id'])['category_id'] ?? null) === $categoryId;
            });
        }

        return array_values(array_unique(array_column($balances, 'item_id')));
    }

    /** @return array<string, mixed> */
    private function requireCount(string $id, int $version, string $ability): array
    {
        $count = $this->counts->findCount($id) ?? throw new ResourceNotFound('Stock count not found.');
        $allowed = match ($ability) {
            'review' => $this->policy->review($count['site_id']),
            'post' => $this->policy->post($count['site_id']),
            default => $this->policy->create($count['site_id']),
        };
        if (! $allowed) {
            throw new AuthorizationDenied;
        }
        if ((int) $count['version'] !== $version) {
            throw new ConcurrencyConflict;
        }

        return $count;
    }

    /** @param array<string, mixed> $count */
    private function assertStatus(array $count, CountStatus $status): void
    {
        if ($count['status'] !== $status->value) {
            throw $this->invalidTransition("Count must be in '{$status->value}' status.");
        }
    }

    private function invalidTransition(string $detail): DomainRuleViolation
    {
        return new DomainRuleViolation($detail, 'invalid-transition', 'Invalid Transition');
    }

    /** @param array<string, mixed> $count
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function transition(array $count, CountStatus $to, array $extra): array
    {
        $updated = $this->counts->updateCount($count['id'], ['status' => $to->value] + $extra)
            ?? throw new ResourceNotFound('Stock count not found.');
        $this->audit("count.{$to->value}", $updated, "Stock count {$to->value}");
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $count */
    private function audit(string $type, array $count, string $summary): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $type,
            'resource_type' => 'count',
            'resource_id' => $count['id'],
            'user_id' => $this->actor->id(),
            'site_id' => $count['site_id'],
            'summary' => "{$summary}: {$count['ref']}",
            'payload' => ['ref' => $count['ref'], 'status' => $count['status']],
        ]);
    }
}
