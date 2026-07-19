<?php

declare(strict_types=1);

namespace App\Application\Alerts;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Alerts\AlertRepository;
use App\Domain\Audit\AuditRepository;
use App\Domain\Shared\UnitOfWork;
use App\Policies\PermissionPolicy;

final readonly class AlertService
{
    public function __construct(
        private AlertRepository $alerts,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private PermissionPolicy $permissions,
    ) {}

    /** @param array<string, mixed> $filters
     * @return array{records: list<array<string, mixed>>, total: int}
     */
    public function search(array $filters): array
    {
        $user = $this->actor->requireUser();
        $records = $this->alerts->getAlerts();
        if (! (bool) $user['all_sites']) {
            $siteIds = $user['assigned_site_ids'];
            $records = array_values(array_filter(
                $records,
                static fn (array $alert): bool => $alert['site_id'] === null
                    || in_array($alert['site_id'], $siteIds, true),
            ));
        }
        if (($filters['unreadOnly'] ?? false) === true) {
            $userId = $this->actor->id();
            $records = array_values(array_filter(
                $records,
                static fn (array $alert): bool => ! in_array($userId, $alert['read_by_user_ids'], true),
            ));
        }
        usort($records, static fn (array $left, array $right): int => strcmp($right['created_at'], $left['created_at']));
        $total = count($records);
        $page = max(1, (int) ($filters['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 25)));

        return ['records' => array_slice($records, ($page - 1) * $pageSize, $pageSize), 'total' => $total];
    }

    public function markRead(string $id): void
    {
        $alert = $this->alerts->findAlert($id) ?? throw new ResourceNotFound('Alert not found.');
        if ($alert['site_id'] !== null && ! $this->permissions->canAccessSite($alert['site_id'])) {
            throw new AuthorizationDenied;
        }
        $userId = $this->actor->id() ?? throw new AuthorizationDenied;
        $this->alerts->markAlertRead($id, $userId);
        $this->audit->createAuditEvent([
            'event_type' => 'alert.read',
            'resource_type' => 'alert',
            'resource_id' => $id,
            'user_id' => $userId,
            'site_id' => $alert['site_id'],
            'summary' => "Alert read: {$alert['title']}",
            'payload' => ['alert_id' => $id],
        ]);
        $this->unitOfWork->commit();
    }

    /** @param list<array<string, mixed>> $records
     * @return list<array<string, mixed>>
     */
    public function present(array $records): array
    {
        $userId = $this->actor->id();

        return array_map(static function (array $alert) use ($userId): array {
            $read = in_array($userId, $alert['read_by_user_ids'], true);

            return [
                'id' => $alert['id'],
                'type' => $alert['type'],
                'severity' => $alert['severity'],
                'title' => $alert['title'],
                'message' => $alert['body'],
                'resourceType' => $alert['resource_type'],
                'resourceId' => $alert['resource_id'],
                'siteId' => $alert['site_id'],
                'createdAt' => $alert['created_at'],
                'readAt' => $read ? ($alert['read_at'] ?? $alert['created_at']) : null,
            ];
        }, $records);
    }
}
