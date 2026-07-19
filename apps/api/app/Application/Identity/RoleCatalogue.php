<?php

declare(strict_types=1);

namespace App\Application\Identity;

final class RoleCatalogue
{
    /** @return array<string, array{label: string, permissions: list<string>}> */
    public function all(): array
    {
        return [
            'system_administrator' => [
                'label' => 'System Administrator',
                'permissions' => [
                    'inventory.view', 'inventory.receive', 'inventory.issue', 'inventory.adjust',
                    'transfer.create', 'transfer.approve', 'transfer.dispatch', 'transfer.receive',
                    'count.create', 'count.review', 'count.post', 'site.manage', 'catalogue.manage',
                    'asset.view', 'asset.manage', 'report.view', 'audit.view', 'user.manage', 'demo.reset',
                ],
            ],
            'operations_manager' => [
                'label' => 'Operations Manager',
                'permissions' => [
                    'inventory.view', 'inventory.receive', 'inventory.issue', 'inventory.adjust',
                    'transfer.create', 'transfer.approve', 'transfer.dispatch', 'transfer.receive',
                    'count.create', 'count.review', 'count.post', 'site.manage', 'catalogue.manage',
                    'asset.view', 'asset.manage', 'report.view', 'audit.view',
                ],
            ],
            'site_manager' => [
                'label' => 'Site Manager',
                'permissions' => [
                    'inventory.view', 'inventory.receive', 'inventory.issue', 'inventory.adjust',
                    'transfer.create', 'transfer.dispatch', 'transfer.receive',
                    'count.create', 'count.review', 'asset.view', 'asset.manage', 'report.view',
                ],
            ],
            'storekeeper' => [
                'label' => 'Storekeeper',
                'permissions' => [
                    'inventory.view', 'inventory.receive', 'inventory.issue',
                    'transfer.create', 'transfer.dispatch', 'transfer.receive',
                    'count.create', 'asset.view', 'report.view',
                ],
            ],
            'executive_viewer' => [
                'label' => 'Executive Viewer',
                'permissions' => ['inventory.view', 'asset.view', 'report.view', 'audit.view'],
            ],
        ];
    }
}
