<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Identity\IdentityRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuditController extends Controller
{
    public function __construct(
        private readonly AuditRepository $audit,
        private readonly IdentityRepository $identities,
        private readonly CurrentActor $actor,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $this->actor->requireUser();
        $events = $this->audit->getAuditEvents();

        // Site restriction
        if (! $user['all_sites']) {
            $events = array_values(array_filter($events, fn ($e) => $e['site_id'] === null || in_array($e['site_id'], $user['assigned_site_ids'], true)
            ));
        }

        // Filters accept both snake_case and camelCase query params for flexibility
        $eventType = $request->query('action') ?? $request->query('eventType');
        if ($eventType) {
            $events = array_values(array_filter($events, fn ($e) => $e['event_type'] === $eventType));
        }
        if ($request->query('resourceType')) {
            $rt = $request->query('resourceType');
            $events = array_values(array_filter($events, fn ($e) => $e['resource_type'] === $rt));
        }
        if ($request->query('resourceId')) {
            $rid = $request->query('resourceId');
            $events = array_values(array_filter($events, fn ($e) => $e['resource_id'] === $rid));
        }
        $actorParam = $request->query('actorUserId') ?? $request->query('userId');
        if ($actorParam) {
            $events = array_values(array_filter($events, fn ($e) => $e['user_id'] === $actorParam));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $events = array_values(array_filter($events, fn ($e) => $e['site_id'] === $sId));
        }
        if ($request->query('from')) {
            $from = $request->query('from');
            $events = array_values(array_filter($events, fn ($e) => $e['created_at'] >= $from));
        }
        if ($request->query('to')) {
            $to = $request->query('to');
            $events = array_values(array_filter($events, fn ($e) => $e['created_at'] <= $to));
        }

        usort($events, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        // Build user cache
        $userCache = [];
        foreach ($events as $e) {
            $uid = $e['user_id'];
            if ($uid && ! isset($userCache[$uid])) {
                $u = $this->identities->findUser($uid);
                if ($u) {
                    $userCache[$uid] = $u;
                }
            }
        }

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($events);
        $events = array_slice($events, ($page - 1) * $pageSize, $pageSize);

        return response()->json([
            'data' => array_map(fn ($e) => $this->formatAuditEvent($e, $userCache), $events),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ]);
    }

    public function show(string $eventId): JsonResponse
    {
        $event = $this->audit->findAuditEvent($eventId)
            ?? throw new ResourceNotFound('Audit event not found.');

        $user = $this->identities->findUser($event['user_id']);
        $userCache = [];
        if ($user) {
            $userCache[$event['user_id']] = $user;
        }

        return response()->json(['data' => $this->formatAuditEvent($event, $userCache)]);
    }

    private function formatAuditEvent(array $e, array $userCache): array
    {
        return [
            'id' => $e['id'],
            'action' => $e['event_type'],
            'actorUserId' => $e['user_id'],
            'actorName' => $userCache[$e['user_id']]['name'] ?? null,
            'occurredAt' => $e['created_at'],
            'resourceType' => $e['resource_type'],
            'resourceId' => $e['resource_id'],
            'siteId' => $e['site_id'],
            'summary' => $e['summary'],
            'changes' => $e['payload'],
            'traceId' => null,
        ];
    }
}
