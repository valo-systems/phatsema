<?php

declare(strict_types=1);

namespace App\Application\Identity;

final class DepartmentCatalogue
{
    /** @return list<array{code: string, name: string}> */
    public function all(): array
    {
        return [
            ['code' => 'executive', 'name' => 'Executive'],
            ['code' => 'operations', 'name' => 'Operations'],
            ['code' => 'inventory_warehousing', 'name' => 'Inventory & Warehousing'],
            ['code' => 'projects_supplies', 'name' => 'Projects & Supplies'],
            ['code' => 'mining_operations', 'name' => 'Mining Operations'],
            ['code' => 'procurement', 'name' => 'Procurement'],
            ['code' => 'logistics', 'name' => 'Logistics'],
            ['code' => 'maintenance', 'name' => 'Maintenance'],
            ['code' => 'finance', 'name' => 'Finance'],
            ['code' => 'administration', 'name' => 'Administration'],
            ['code' => 'health_safety_environment', 'name' => 'Health, Safety & Environment'],
            ['code' => 'information_technology', 'name' => 'Information Technology'],
        ];
    }

    /** @return list<string> */
    public function codes(): array
    {
        return array_column($this->all(), 'code');
    }
}
