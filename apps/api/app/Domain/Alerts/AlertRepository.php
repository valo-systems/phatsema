<?php

declare(strict_types=1);

namespace App\Domain\Alerts;

interface AlertRepository
{
    /** @return list<array<string, mixed>> */
    public function getAlerts(): array;

    /** @return array<string, mixed>|null */
    public function findAlert(string $id): ?array;

    public function markAlertRead(string $alertId, string $userId): void;
}
