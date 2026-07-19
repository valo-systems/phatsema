<?php

declare(strict_types=1);

namespace App\Application\Sites;

final class SitePresenter
{
    /** @param array<string, mixed> $site
     * @return array<string, mixed>
     */
    public function site(array $site): array
    {
        return [
            'id' => $site['id'],
            'code' => $site['code'],
            'entityCode' => $site['entity_code'] ?? $site['code'],
            'name' => $site['name'],
            'type' => $site['type'] === 'field_site' ? 'mine_site' : $site['type'],
            'status' => ($site['active'] ?? true) ? 'active' : 'inactive',
            'countryCode' => $site['country_code'] ?? 'ZA',
            'timezone' => $site['timezone'] ?? 'Africa/Johannesburg',
            'contactName' => $site['contact_name'] ?? null,
            'contactPhone' => $site['contact_phone'] ?? null,
            'version' => $site['version'],
        ];
    }

    /** @param array<string, mixed> $location
     * @return array<string, mixed>
     */
    public function location(array $location): array
    {
        return [
            'id' => $location['id'],
            'siteId' => $location['site_id'],
            'parentLocationId' => $location['parent_location_id'] ?? null,
            'code' => $location['code'],
            'name' => $location['name'],
            'type' => match ($location['type']) {
                'store' => 'warehouse',
                'quarantine' => 'cage',
                'holding' => 'yard',
                default => $location['type'],
            },
            'status' => ($location['active'] ?? true) ? 'active' : 'inactive',
            'allowsNegativeStock' => false,
            'version' => $location['version'] ?? 1,
        ];
    }
}
