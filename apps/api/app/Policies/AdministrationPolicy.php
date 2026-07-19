<?php

declare(strict_types=1);

namespace App\Policies;

final readonly class AdministrationPolicy
{
    public function __construct(private PermissionPolicy $permissions) {}

    public function manageSites(?string $siteId = null): bool
    {
        return $this->permissions->allows('site.manage', $siteId);
    }

    public function manageCatalogue(): bool
    {
        return $this->permissions->allows('catalogue.manage');
    }

    public function viewAudit(?string $siteId = null): bool
    {
        return $this->permissions->allows('audit.view', $siteId);
    }

    public function resetDemo(): bool
    {
        return $this->permissions->allows('demo.reset');
    }
}
