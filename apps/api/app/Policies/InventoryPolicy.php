<?php

declare(strict_types=1);

namespace App\Policies;

final readonly class InventoryPolicy
{
    public function __construct(private PermissionPolicy $permissions) {}

    public function view(?string $siteId = null): bool
    {
        return $this->permissions->allows('inventory.view', $siteId);
    }

    public function receive(?string $siteId = null): bool
    {
        return $this->permissions->allows('inventory.receive', $siteId);
    }

    public function issue(?string $siteId = null): bool
    {
        return $this->permissions->allows('inventory.issue', $siteId);
    }

    public function adjust(?string $siteId = null): bool
    {
        return $this->permissions->allows('inventory.adjust', $siteId);
    }
}
