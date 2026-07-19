<?php

declare(strict_types=1);

namespace App\Policies;

use App\Application\Identity\CurrentActor;

final readonly class PermissionPolicy
{
    public function __construct(private CurrentActor $actor) {}

    public function allows(string $permission, ?string $siteId = null): bool
    {
        $user = $this->actor->user();
        if ($user === null || ! in_array($permission, $user['permissions'] ?? [], true)) {
            return false;
        }

        if ($siteId === null || (bool) ($user['all_sites'] ?? false)) {
            return true;
        }

        return in_array($siteId, $user['assigned_site_ids'] ?? [], true);
    }

    public function canAccessSite(?string $siteId): bool
    {
        $user = $this->actor->user();
        if ($user === null || $siteId === null) {
            return false;
        }

        return (bool) ($user['all_sites'] ?? false)
            || in_array($siteId, $user['assigned_site_ids'] ?? [], true);
    }
}
