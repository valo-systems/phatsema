<?php

declare(strict_types=1);

namespace App\Domain\Transfers;

enum TransferStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Dispatched = 'dispatched';
    case Received = 'received';
    case Cancelled = 'cancelled';

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::Draft => in_array($target, [self::Submitted, self::Cancelled], true),
            self::Submitted => in_array($target, [self::Approved, self::Cancelled], true),
            self::Approved => in_array($target, [self::Dispatched, self::Cancelled], true),
            self::Dispatched => $target === self::Received,
            self::Received, self::Cancelled => false,
        };
    }
}
