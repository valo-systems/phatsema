<?php

declare(strict_types=1);

namespace App\Policies;

final readonly class CountPolicy
{
    public function __construct(private PermissionPolicy $permissions) {}

    public function create(?string $siteId = null): bool
    {
        return $this->permissions->allows('count.create', $siteId);
    }

    public function review(?string $siteId = null): bool
    {
        return $this->permissions->allows('count.review', $siteId);
    }

    public function post(?string $siteId = null): bool
    {
        return $this->permissions->allows('count.post', $siteId);
    }
}
