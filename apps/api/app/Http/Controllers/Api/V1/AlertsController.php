<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Alerts\AlertService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AlertsController extends Controller
{
    public function __construct(private readonly AlertService $alerts) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->integer('page', 1));
        $pageSize = min(100, max(1, $request->integer('pageSize', 25)));
        $result = $this->alerts->search([
            'unreadOnly' => $request->boolean('unreadOnly', $request->boolean('unread')),
            'page' => $page,
            'pageSize' => $pageSize,
        ]);

        return response()->json([
            'data' => $this->alerts->present($result['records']),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $result['total'], 'sort' => null],
        ]);
    }

    public function markRead(string $alertId): JsonResponse
    {
        $this->alerts->markRead($alertId);

        return response()->json(['data' => ['message' => 'Alert marked as read.']]);
    }
}
