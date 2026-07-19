<?php

declare(strict_types=1);

namespace App\Application\Exceptions;

final class DomainRuleViolation extends ProblemException
{
    public function __construct(
        string $detail,
        string $type = 'business-rule',
        string $title = 'Business Rule Violation',
    ) {
        parent::__construct($type, $title, 422, $detail);
    }
}
