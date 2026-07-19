<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

final class EstimatedInventoryValuation
{
    /** @var array<string, float> */
    private const UNIT_COST_BY_CATEGORY = [
        'CAT-FUEL' => 45.0,
        'CAT-CHEM' => 120.0,
        'CAT-SPARE' => 280.0,
        'CAT-PPE' => 85.0,
        'CAT-TOOLS' => 350.0,
        'CAT-CONS' => 25.0,
    ];

    /** @param array<string, mixed> $item */
    public function value(array $item, float $quantity): float
    {
        $categoryId = (string) ($item['category_id'] ?? 'CAT-CONS');

        return $quantity * (self::UNIT_COST_BY_CATEGORY[$categoryId] ?? 50.0);
    }
}
