<?php

declare(strict_types=1);

namespace App\Application\Analytics;

final readonly class ReportFilters
{
    /** @param array<string, mixed> $values */
    public function __construct(private array $values) {}

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->values[$key] ?? $default;
    }
}
