<?php

declare(strict_types=1);

namespace App\Application\Assets;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Assets\AssetRepository;
use App\Domain\Audit\AuditRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Policies\AssetPolicy;

final readonly class AssetCommandService
{
    public function __construct(
        private AssetRepository $assets,
        private SiteRepository $sites,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private AssetPolicy $policy,
        private SequenceRepository $sequences,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function create(array $command): array
    {
        $this->assertSiteAndLocation($command['siteId'], $command['locationId'] ?? null);
        if (! $this->policy->manage($command['siteId'])) {
            throw new AuthorizationDenied;
        }
        foreach ($this->assets->getAssets() as $existing) {
            if (strcasecmp((string) $existing['serial_number'], (string) $command['serialNumber']) === 0) {
                throw new DomainRuleViolation('An asset with this serial number already exists.');
            }
        }
        $asset = $this->assets->createAsset([
            'code' => $this->sequences->nextRef('DEMO-AST'),
            'name' => $command['name'],
            'asset_type' => $command['type'],
            'ownership_mode' => $command['ownershipMode'],
            'make' => $command['make'],
            'model' => $command['model'],
            'year' => null,
            'serial_number' => $command['serialNumber'],
            'registration_number' => $command['registrationNumber'] ?? null,
            'site_id' => $command['siteId'],
            'location_id' => $command['locationId'] ?? null,
            'assigned_to' => null,
            'status' => 'available',
            'meter_unit' => $command['meterType'] ?? null,
            'meter_reading' => isset($command['meterReading'])
                ? Quantity::from($command['meterReading'])->toString()
                : null,
            'service_due_at' => $command['nextServiceAt'] ?? null,
            'next_service_meter' => isset($command['nextServiceMeter'])
                ? Quantity::from($command['nextServiceMeter'])->toString()
                : null,
        ]);
        $this->recordAudit('asset.created', $asset, "Asset registered: {$asset['code']} / {$asset['name']}");
        $this->unitOfWork->commit();

        return $asset;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(string $id, array $command): array
    {
        $asset = $this->requireAsset($id, (int) $command['version']);
        $fields = [
            'name' => 'name',
            'registrationNumber' => 'registration_number',
            'nextServiceAt' => 'service_due_at',
            'nextServiceMeter' => 'next_service_meter',
        ];
        $update = [];
        foreach ($fields as $input => $field) {
            if (array_key_exists($input, $command)) {
                $update[$field] = $input === 'nextServiceMeter' && $command[$input] !== null
                    ? Quantity::from($command[$input])->toString()
                    : $command[$input];
            }
        }
        $updated = $this->assets->updateAsset($id, $update) ?? throw new ResourceNotFound('Asset not found.');
        $this->recordAudit('asset.updated', $updated, "Asset {$updated['code']} updated");
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function assign(string $id, array $command): array
    {
        $asset = $this->requireAsset($id, (int) $command['version']);
        $this->assertSiteAndLocation($command['siteId'], $command['locationId'] ?? null);
        if (! $this->policy->manage($command['siteId'])) {
            throw new AuthorizationDenied;
        }
        $updated = $this->assets->updateAsset($id, [
            'site_id' => $command['siteId'],
            'location_id' => $command['locationId'] ?? null,
            'assigned_to' => $command['assignedTo'] ?? null,
            'status' => empty($command['assignedTo']) ? $asset['status'] : 'assigned',
        ]) ?? throw new ResourceNotFound('Asset not found.');
        $this->recordAudit('asset.assigned', $updated, "Asset {$updated['code']} assignment updated");
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function changeStatus(string $id, array $command): array
    {
        $asset = $this->requireAsset($id, (int) $command['version']);
        if ($asset['status'] === 'retired' && $command['status'] !== 'retired') {
            throw new DomainRuleViolation('A retired asset cannot be returned to service.');
        }
        $updated = $this->assets->updateAsset($id, ['status' => $command['status']])
            ?? throw new ResourceNotFound('Asset not found.');
        $this->recordAudit(
            'asset.status_changed',
            $updated,
            "Asset {$updated['code']} status changed: {$asset['status']} → {$updated['status']}",
        );
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function recordMeter(string $id, array $command): array
    {
        $asset = $this->requireAsset($id, (int) $command['version']);
        if ($asset['meter_unit'] === null) {
            throw new DomainRuleViolation('This asset does not have a meter configured.');
        }
        $reading = Quantity::from($command['reading']);
        $previous = Quantity::from($asset['meter_reading'] ?? '0');
        if ($previous->greaterThan($reading)) {
            throw new DomainRuleViolation('A meter reading cannot be lower than the previous reading.');
        }
        $updated = $this->assets->updateAsset($id, [
            'meter_reading' => $reading->toString(),
            'meter_read_at' => $command['readAt'] ?? now()->toDateString(),
        ]) ?? throw new ResourceNotFound('Asset not found.');
        $this->recordAudit(
            'asset.meter_reading',
            $updated,
            "Asset {$updated['code']} meter updated: {$previous->toString()} → {$reading->toString()}",
        );
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @return array<string, mixed> */
    private function requireAsset(string $id, int $version): array
    {
        $asset = $this->assets->findAsset($id) ?? throw new ResourceNotFound('Asset not found.');
        if (! $this->policy->manage($asset['site_id'])) {
            throw new AuthorizationDenied;
        }
        if ((int) $asset['version'] !== $version) {
            throw new ConcurrencyConflict;
        }

        return $asset;
    }

    private function assertSiteAndLocation(string $siteId, ?string $locationId): void
    {
        $this->sites->findSite($siteId) ?? throw new ResourceNotFound('Site not found.');
        if ($locationId === null) {
            return;
        }
        $location = $this->sites->findLocation($locationId) ?? throw new ResourceNotFound('Location not found.');
        if ($location['site_id'] !== $siteId) {
            throw new DomainRuleViolation('The selected location does not belong to the selected site.');
        }
    }

    /** @param array<string, mixed> $asset */
    private function recordAudit(string $type, array $asset, string $summary): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $type,
            'resource_type' => 'asset',
            'resource_id' => $asset['id'],
            'user_id' => $this->actor->id(),
            'site_id' => $asset['site_id'],
            'summary' => $summary,
            'payload' => ['asset_number' => $asset['code'], 'status' => $asset['status']],
        ]);
    }
}
