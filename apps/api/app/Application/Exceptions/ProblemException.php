<?php

declare(strict_types=1);

namespace App\Application\Exceptions;

use RuntimeException;

class ProblemException extends RuntimeException
{
    /** @param array<string, list<string>> $errors */
    public function __construct(
        public readonly string $problemType,
        public readonly string $problemTitle,
        public readonly int $status,
        string $detail,
        public readonly array $errors = [],
    ) {
        parent::__construct($detail);
    }
}
