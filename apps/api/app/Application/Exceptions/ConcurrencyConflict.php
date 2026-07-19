<?php

declare(strict_types=1);

namespace App\Application\Exceptions;

final class ConcurrencyConflict extends ProblemException
{
    public function __construct()
    {
        parent::__construct(
            'conflict',
            'Version Conflict',
            409,
            'The resource has been modified by another request. Refresh and try again.',
        );
    }
}
