<?php

declare(strict_types=1);

namespace App\Domain\Audit;

interface AuditRepository
{
    /** @return list<array<string, mixed>> */
    public function getAuditEvents(): array;

    /** @return array<string, mixed>|null */
    public function findAuditEvent(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createAuditEvent(array $data): array;
}
