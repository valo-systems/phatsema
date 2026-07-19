<?php

declare(strict_types=1);

namespace App\Application\Demo;

use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Demo\DemoRepository;
use App\Domain\Shared\UnitOfWork;

final readonly class ResetDemoService
{
    public function __construct(
        private DemoRepository $demo,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
    ) {}

    public function reset(): void
    {
        $this->demo->reset();
        $this->audit->createAuditEvent([
            'event_type' => 'demo.reset',
            'resource_type' => 'demo',
            'resource_id' => 'fixture-v1',
            'user_id' => $this->actor->id(),
            'site_id' => null,
            'summary' => 'Demo data reset to factory defaults',
            'payload' => ['fixture_version' => '1.4.0'],
        ]);
        $this->unitOfWork->commit();
    }
}
