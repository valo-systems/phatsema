<?php

declare(strict_types=1);

namespace App\Domain\Assets;

interface AssetRepository
{
    /** @return list<array<string, mixed>> */
    public function getAssets(): array;

    /** @return array<string, mixed>|null */
    public function findAsset(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createAsset(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateAsset(string $id, array $data): ?array;
}
