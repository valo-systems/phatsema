<?php

declare(strict_types=1);

namespace App\Application\Sites;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Policies\AdministrationPolicy;

final readonly class SiteCommandService
{
    public function __construct(
        private SiteRepository $sites,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private AdministrationPolicy $policy,
        private SequenceRepository $sequences,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function createSite(array $command): array
    {
        $this->authorize();
        $this->assertUniqueSiteName((string) $command['name']);
        $site = $this->sites->createSite([
            'code' => $this->sequences->nextRef('DEMO-STE'),
            'name' => $command['name'],
            'entity_code' => $command['entityCode'],
            'type' => $command['type'],
            'country_code' => strtoupper($command['countryCode']),
            'timezone' => $command['timezone'],
            'contact_name' => $command['contactName'] ?? null,
            'contact_phone' => $command['contactPhone'] ?? null,
        ]);
        $this->recordAudit('site.created', 'site', $site, "Site created: {$site['code']} / {$site['name']}");
        $this->unitOfWork->commit();

        return $site;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function updateSite(string $id, array $command): array
    {
        $site = $this->sites->findSite($id) ?? throw new ResourceNotFound('Site not found.');
        $this->authorize($id);
        $this->assertVersion($site, (int) $command['version']);
        $map = [
            'name' => 'name',
            'contactName' => 'contact_name',
            'contactPhone' => 'contact_phone',
        ];
        $update = $this->mapped($command, $map);
        if (isset($command['status'])) {
            $update['active'] = $command['status'] === 'active';
        }
        $updated = $this->sites->updateSite($id, $update) ?? throw new ResourceNotFound('Site not found.');
        $this->recordAudit('site.updated', 'site', $updated, "Site updated: {$updated['code']}");
        $this->unitOfWork->commit();

        return $updated;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function createLocation(string $siteId, array $command): array
    {
        $this->sites->findSite($siteId) ?? throw new ResourceNotFound('Site not found.');
        $this->authorize($siteId);
        $this->assertUniqueLocationName($siteId, (string) $command['name']);
        if (! empty($command['parentLocationId'])) {
            $parent = $this->sites->findLocation($command['parentLocationId'])
                ?? throw new ResourceNotFound('Parent location not found.');
            if ($parent['site_id'] !== $siteId) {
                throw new DomainRuleViolation('Parent location must belong to the same site.');
            }
        }
        $location = $this->sites->createLocation([
            'site_id' => $siteId,
            'parent_location_id' => $command['parentLocationId'] ?? null,
            'code' => $this->sequences->nextRef('DEMO-LOC'),
            'name' => $command['name'],
            'type' => $command['type'],
        ]);
        $this->recordAudit('location.created', 'location', $location, "Location created: {$location['code']}");
        $this->unitOfWork->commit();

        return $location;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function updateLocation(string $id, array $command): array
    {
        $location = $this->sites->findLocation($id) ?? throw new ResourceNotFound('Location not found.');
        $this->authorize($location['site_id']);
        $this->assertVersion($location, (int) $command['version']);
        $update = $this->mapped($command, ['name' => 'name']);
        if (isset($command['status'])) {
            $update['active'] = $command['status'] === 'active';
        }
        $updated = $this->sites->updateLocation($id, $update)
            ?? throw new ResourceNotFound('Location not found.');
        $this->recordAudit('location.updated', 'location', $updated, "Location updated: {$updated['code']}");
        $this->unitOfWork->commit();

        return $updated;
    }

    private function authorize(?string $siteId = null): void
    {
        if (! $this->policy->manageSites($siteId)) {
            throw new AuthorizationDenied;
        }
    }

    private function assertUniqueSiteName(string $name): void
    {
        foreach ($this->sites->getSites() as $site) {
            if (strcasecmp(trim((string) $site['name']), trim($name)) === 0) {
                throw new DomainRuleViolation('A site with this name already exists.');
            }
        }
    }

    private function assertUniqueLocationName(string $siteId, string $name): void
    {
        foreach ($this->sites->getLocationsForSite($siteId) as $location) {
            if (strcasecmp(trim((string) $location['name']), trim($name)) === 0) {
                throw new DomainRuleViolation('A location with this name already exists at this site.');
            }
        }
    }

    /** @param array<string, mixed> $record */
    private function assertVersion(array $record, int $version): void
    {
        if ((int) $record['version'] !== $version) {
            throw new ConcurrencyConflict;
        }
    }

    /** @param array<string, mixed> $command
     * @param  array<string, string>  $map
     * @return array<string, mixed>
     */
    private function mapped(array $command, array $map): array
    {
        $result = [];
        foreach ($map as $input => $field) {
            if (array_key_exists($input, $command)) {
                $result[$field] = $command[$input];
            }
        }

        return $result;
    }

    /** @param array<string, mixed> $resource */
    private function recordAudit(string $event, string $type, array $resource, string $summary): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $event,
            'resource_type' => $type,
            'resource_id' => $resource['id'],
            'user_id' => $this->actor->id(),
            'site_id' => $type === 'site' ? $resource['id'] : $resource['site_id'],
            'summary' => $summary,
            'payload' => ['code' => $resource['code']],
        ]);
    }
}
