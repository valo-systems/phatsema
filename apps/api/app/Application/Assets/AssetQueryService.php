<?php

declare(strict_types=1);

namespace App\Application\Assets;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Assets\AssetRepository;
use App\Policies\PermissionPolicy;

final readonly class AssetQueryService
{
    public function __construct(
        private AssetRepository $assets,
        private CurrentActor $actor,
        private PermissionPolicy $permissions,
    ) {}

    /** @param array<string, mixed> $filters
     * @return array{records: list<array<string, mixed>>, total: int}
     */
    public function search(array $filters): array
    {
        $user = $this->actor->requireUser();
        $records = $this->assets->getAssets();
        if (! (bool) ($user['all_sites'] ?? false)) {
            $siteIds = $user['assigned_site_ids'] ?? [];
            $records = array_values(array_filter(
                $records,
                static fn (array $asset): bool => in_array($asset['site_id'], $siteIds, true),
            ));
        }
        foreach (['siteId' => 'site_id', 'status' => 'status', 'assetType' => 'asset_type'] as $input => $field) {
            if (! empty($filters[$input])) {
                $value = $filters[$input];
                $records = array_values(array_filter(
                    $records,
                    static fn (array $asset): bool => $asset[$field] === $value,
                ));
            }
        }
        $total = count($records);
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));

        return ['records' => array_slice($records, ($page - 1) * $pageSize, $pageSize), 'total' => $total];
    }

    /** @return array<string, mixed> */
    public function get(string $id): array
    {
        $asset = $this->assets->findAsset($id) ?? throw new ResourceNotFound('Asset not found.');
        if (! $this->permissions->canAccessSite((string) $asset['site_id'])) {
            throw new AuthorizationDenied;
        }

        return $asset;
    }
}
