<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Analytics\DashboardQueryService;
use App\Application\Identity\CurrentActor;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardQueryService $queries,
        private readonly CurrentActor $actor,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $siteId = $request->query('siteId');

        return response()->json([
            'data' => $this->queries->execute(
                $this->actor->requireUser(),
                is_string($siteId) && $siteId !== '' ? $siteId : null,
            ),
        ]);
    }
}
