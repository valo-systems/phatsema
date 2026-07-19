<?php

declare(strict_types=1);

namespace App\Policies;

final readonly class TransferPolicy
{
    public function __construct(private PermissionPolicy $permissions) {}

    public function create(?string $sourceSiteId = null): bool
    {
        return $this->permissions->allows('transfer.create', $sourceSiteId);
    }

    public function approve(?string $sourceSiteId = null): bool
    {
        return $this->permissions->allows('transfer.approve', $sourceSiteId);
    }

    public function dispatch(?string $sourceSiteId = null): bool
    {
        return $this->permissions->allows('transfer.dispatch', $sourceSiteId);
    }

    public function receive(?string $destinationSiteId = null): bool
    {
        return $this->permissions->allows('transfer.receive', $destinationSiteId);
    }
}
