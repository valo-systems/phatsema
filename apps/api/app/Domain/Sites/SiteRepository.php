<?php

declare(strict_types=1);

namespace App\Domain\Sites;

interface SiteRepository
{
    /** @return list<array<string, mixed>> */
    public function getSites(): array;

    /** @return array<string, mixed>|null */
    public function findSite(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createSite(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateSite(string $id, array $data): ?array;

    /** @return list<array<string, mixed>> */
    public function getLocationsForSite(string $siteId): array;

    /** @return array<string, mixed>|null */
    public function findLocation(string $id): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createLocation(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateLocation(string $id, array $data): ?array;
}
