<?php

declare(strict_types=1);

namespace App\Policies;

final readonly class AssetPolicy
{
    public function __construct(private PermissionPolicy $permissions) {}

    public function manage(?string $siteId = null): bool
    {
        return $this->permissions->allows('asset.manage', $siteId);
    }
}
