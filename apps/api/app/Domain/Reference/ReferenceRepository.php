<?php

declare(strict_types=1);

namespace App\Domain\Reference;

interface ReferenceRepository
{
    /** @return list<array<string, mixed>> */
    public function getCategories(): array;

    /** @return list<array<string, mixed>> */
    public function getUnits(): array;

    /** @return list<array<string, mixed>> */
    public function getReasons(): array;
}
