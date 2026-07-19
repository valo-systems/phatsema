<?php

declare(strict_types=1);

namespace App\Application\Counts;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Counts\CountRepository;
use App\Policies\PermissionPolicy;

final readonly class CountQueryService
{
    public function __construct(
        private CountRepository $counts,
        private CurrentActor $actor,
        private PermissionPolicy $permissions,
    ) {}

    /** @param array<string, mixed> $filters
     * @return array{records: list<array<string, mixed>>, total: int}
     */
    public function search(array $filters): array
    {
        $user = $this->actor->requireUser();
        $records = $this->counts->getCounts();
        if (! (bool) ($user['all_sites'] ?? false)) {
            $siteIds = $user['assigned_site_ids'] ?? [];
            $records = array_values(array_filter(
                $records,
                static fn (array $count): bool => in_array($count['site_id'], $siteIds, true),
            ));
        }
        foreach (['status' => 'status', 'siteId' => 'site_id'] as $input => $field) {
            if (! empty($filters[$input])) {
                $value = $filters[$input];
                $records = array_values(array_filter(
                    $records,
                    static fn (array $count): bool => $count[$field] === $value,
                ));
            }
        }
        usort($records, static fn (array $left, array $right): int => strcmp($right['created_at'], $left['created_at']));
        $total = count($records);
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));

        return ['records' => array_slice($records, ($page - 1) * $pageSize, $pageSize), 'total' => $total];
    }

    /** @return array<string, mixed> */
    public function get(string $id): array
    {
        $count = $this->counts->findCount($id) ?? throw new ResourceNotFound('Stock count not found.');
        if (! $this->permissions->canAccessSite((string) $count['site_id'])) {
            throw new AuthorizationDenied;
        }

        return $count;
    }
}
