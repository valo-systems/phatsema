<?php

declare(strict_types=1);

namespace App\Application\Assets;

use App\Domain\Audit\AuditRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Sites\SiteRepository;
use Carbon\CarbonImmutable;

final readonly class AssetPresenter
{
    public function __construct(
        private SiteRepository $sites,
        private AuditRepository $audit,
        private IdentityRepository $identities,
    ) {}

    /** @param array<string, mixed> $asset
     * @return array<string, mixed>
     */
    public function present(array $asset, bool $includeHistory = false): array
    {
        $site = $this->sites->findSite((string) $asset['site_id']);
        $location = empty($asset['location_id']) ? null : $this->sites->findLocation((string) $asset['location_id']);
        $result = [
            'id' => $asset['id'],
            'assetNumber' => $asset['code'],
            'name' => $asset['name'],
            'type' => $asset['asset_type'],
            'ownershipMode' => $asset['ownership_mode'] ?? 'company_owned',
            'make' => $asset['make'],
            'model' => $asset['model'],
            'year' => $asset['year'] ?? null,
            'serialNumber' => $asset['serial_number'],
            'registrationNumber' => $asset['registration_number'] ?? null,
            'status' => $asset['status'],
            'serviceState' => $asset['service_state'] ?? $this->serviceState($asset['service_due_at'] ?? null),
            'siteId' => $asset['site_id'],
            'siteName' => $site['name'] ?? null,
            'locationId' => $asset['location_id'] ?? null,
            'locationName' => $location['name'] ?? null,
            'assignedTo' => $asset['assigned_to'] ?? null,
            'meterType' => $asset['meter_unit'] ?? null,
            'meterReading' => $asset['meter_reading'] ?? null,
            'nextServiceAt' => $asset['service_due_at'] ?? null,
            'nextServiceMeter' => $asset['next_service_meter'] ?? null,
            'version' => $asset['version'],
        ];

        if ($includeHistory) {
            $result['history'] = $this->history((string) $asset['id']);
        }

        return $result;
    }

    /** @param list<array<string, mixed>> $assets
     * @return list<array<string, mixed>>
     */
    public function presentMany(array $assets): array
    {
        return array_map($this->present(...), $assets);
    }

    private function serviceState(?string $date): string
    {
        if ($date === null) {
            return 'ok';
        }
        $days = now()->startOfDay()->diffInDays(CarbonImmutable::parse($date)->startOfDay(), false);

        return match (true) {
            $days < 0 => 'overdue',
            $days <= 30 => 'due_soon',
            default => 'ok',
        };
    }

    /** @return list<array<string, mixed>> */
    private function history(string $assetId): array
    {
        $events = array_values(array_filter(
            $this->audit->getAuditEvents(),
            static fn (array $event): bool => $event['resource_type'] === 'asset'
                && $event['resource_id'] === $assetId,
        ));
        usort($events, static fn (array $left, array $right): int => strcmp($right['created_at'], $left['created_at']));

        return array_map(function (array $event): array {
            $actor = $this->identities->findUser((string) $event['user_id']);

            return [
                'id' => $event['id'],
                'occurredAt' => $event['created_at'],
                'kind' => str_replace('asset.', '', $event['event_type']),
                'summary' => $event['summary'],
                'byUserId' => $event['user_id'],
                'byName' => $actor['name'] ?? 'Unknown user',
            ];
        }, $events);
    }
}
