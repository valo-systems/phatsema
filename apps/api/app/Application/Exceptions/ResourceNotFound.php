<?php

declare(strict_types=1);

namespace App\Application\Exceptions;

final class ResourceNotFound extends ProblemException
{
    public function __construct(string $detail = 'The requested resource does not exist.')
    {
        parent::__construct('not-found', 'Not Found', 404, $detail);
    }
}
