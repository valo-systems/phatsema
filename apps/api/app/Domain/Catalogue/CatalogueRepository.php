<?php

declare(strict_types=1);

namespace App\Domain\Catalogue;

interface CatalogueRepository
{
    /** @return list<array<string, mixed>> */
    public function getItems(): array;

    /** @return array<string, mixed>|null */
    public function findItem(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createItem(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateItem(string $id, array $data): ?array;
}
