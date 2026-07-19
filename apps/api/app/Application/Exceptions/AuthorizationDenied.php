<?php

declare(strict_types=1);

namespace App\Application\Exceptions;

final class AuthorizationDenied extends ProblemException
{
    public function __construct(string $detail = 'You do not have permission to perform this action.')
    {
        parent::__construct('forbidden', 'Forbidden', 403, $detail);
    }
}
