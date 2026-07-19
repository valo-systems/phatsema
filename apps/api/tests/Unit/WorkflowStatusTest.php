<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Counts\CountStatus;
use App\Domain\Transfers\TransferStatus;
use PHPUnit\Framework\TestCase;

final class WorkflowStatusTest extends TestCase
{
    public function test_transfer_transitions_are_explicit_and_terminal(): void
    {
        self::assertTrue(TransferStatus::Draft->canTransitionTo(TransferStatus::Submitted));
        self::assertTrue(TransferStatus::Dispatched->canTransitionTo(TransferStatus::Received));
        self::assertFalse(TransferStatus::Received->canTransitionTo(TransferStatus::Draft));
    }

    public function test_count_supports_review_and_recount_branches(): void
    {
        self::assertTrue(CountStatus::Submitted->canTransitionTo(CountStatus::Reviewed));
        self::assertTrue(CountStatus::Submitted->canTransitionTo(CountStatus::RecountRequired));
        self::assertTrue(CountStatus::RecountRequired->canTransitionTo(CountStatus::InProgress));
    }
}
