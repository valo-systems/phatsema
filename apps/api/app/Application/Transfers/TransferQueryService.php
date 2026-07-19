<?php

declare(strict_types=1);

namespace App\Application\Transfers;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Transfers\TransferRepository;
use App\Policies\PermissionPolicy;

final readonly class TransferQueryService
{
    public function __construct(
        private TransferRepository $transfers,
        private CurrentActor $actor,
        private PermissionPolicy $permissions,
    ) {}

    /** @param array<string, mixed> $filters
     * @return array{records: list<array<string, mixed>>, total: int}
     */
    public function search(array $filters): array
    {
        $user = $this->actor->requireUser();
        $records = $this->transfers->getTransfers();
        if (! (bool) ($user['all_sites'] ?? false)) {
            $siteIds = $user['assigned_site_ids'] ?? [];
            $records = array_values(array_filter(
                $records,
                static fn (array $transfer): bool => in_array($transfer['from_site_id'], $siteIds, true)
                    || in_array($transfer['to_site_id'], $siteIds, true),
            ));
        }
        if (! empty($filters['status'])) {
            $records = array_values(array_filter(
                $records,
                static fn (array $transfer): bool => $transfer['status'] === $filters['status'],
            ));
        }
        if (! empty($filters['siteId'])) {
            $siteId = $filters['siteId'];
            $records = array_values(array_filter(
                $records,
                static fn (array $transfer): bool => $transfer['from_site_id'] === $siteId
                    || $transfer['to_site_id'] === $siteId,
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
    public function get(string $id): array
    {
        $transfer = $this->transfers->findTransfer($id)
            ?? throw new ResourceNotFound('Transfer not found.');
        if (! $this->permissions->canAccessSite((string) $transfer['from_site_id'])
            && ! $this->permissions->canAccessSite((string) $transfer['to_site_id'])) {
            throw new AuthorizationDenied;
        }

        return $transfer;
    }
}
