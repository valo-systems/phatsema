<?php

declare(strict_types=1);

namespace App\Domain\Transfers;

interface TransferRepository
{
    /** @return list<array<string, mixed>> */
    public function getTransfers(): array;

    /** @return array<string, mixed>|null */
    public function findTransfer(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createTransfer(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateTransfer(string $id, array $data): ?array;
}
