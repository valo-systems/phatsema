<?php

declare(strict_types=1);

namespace App\Domain\Analytics;

/**
 * Read-optimised projection used by dashboards and reports.
 *
 * A future MariaDB adapter can implement this port with purpose-built queries
 * without exposing persistence details to HTTP controllers.
 */
interface AnalyticsReadRepository
{
    /** @return list<array<string, mixed>> */
    public function getSites(): array;

    /** @return list<array<string, mixed>> */
    public function getLocationsForSite(string $siteId): array;

    /** @return list<array<string, mixed>> */
    public function getItems(): array;

    /** @return list<array<string, mixed>> */
    public function getCategories(): array;

    /** @return list<array<string, mixed>> */
    public function getUnits(): array;

    /** @return list<array<string, mixed>> */
    public function getAllBalances(): array;

    /** @return list<array<string, mixed>> */
    public function getMovements(): array;

    /** @return list<array<string, mixed>> */
    public function getTransfers(): array;

    /** @return list<array<string, mixed>> */
    public function getCounts(): array;

    /** @return list<array<string, mixed>> */
    public function getAssets(): array;

    /** @return list<array<string, mixed>> */
    public function getAuditEvents(): array;

    /** @return array<string, mixed>|null */
    public function findUser(string $id): ?array;
}
