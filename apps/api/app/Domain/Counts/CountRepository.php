<?php

declare(strict_types=1);

namespace App\Domain\Counts;

interface CountRepository
{
    /** @return list<array<string, mixed>> */
    public function getCounts(): array;

    /** @return array<string, mixed>|null */
    public function findCount(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createCount(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateCount(string $id, array $data): ?array;
}
