<?php

declare(strict_types=1);

namespace App\Domain\Counts;

enum CountStatus: string
{
    case Draft = 'draft';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case RecountRequired = 'recount_required';
    case Reviewed = 'reviewed';
    case Posted = 'posted';

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::Draft => $target === self::InProgress,
            self::InProgress => $target === self::Submitted,
            self::Submitted => in_array($target, [self::RecountRequired, self::Reviewed], true),
            self::RecountRequired => $target === self::InProgress,
            self::Reviewed => $target === self::Posted,
            self::Posted => false,
        };
    }
}
