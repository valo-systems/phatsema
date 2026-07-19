<?php

declare(strict_types=1);

namespace App\Domain\Shared;

interface UnitOfWork
{
    public function commit(): void;

    public function reset(): void;
}
