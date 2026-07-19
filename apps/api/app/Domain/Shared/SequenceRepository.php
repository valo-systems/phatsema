<?php

declare(strict_types=1);

namespace App\Domain\Shared;

interface SequenceRepository
{
    public function nextRef(string $prefix): string;
}
