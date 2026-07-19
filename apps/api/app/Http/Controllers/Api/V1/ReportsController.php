<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Analytics\ReportFilters;
use App\Application\Analytics\ReportQueryService;
use App\Application\Identity\CurrentActor;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReportsController extends Controller
{
    public function __construct(
        private readonly ReportQueryService $queries,
        private readonly CurrentActor $actor,
    ) {}

    public function stockOnHand(Request $request): JsonResponse
    {
        return $this->respond($request, 'stockOnHand');
    }

    public function movements(Request $request): JsonResponse
    {
        return $this->respond($request, 'movements');
    }

    public function transfers(Request $request): JsonResponse
    {
        return $this->respond($request, 'transfers');
    }

    public function countVariances(Request $request): JsonResponse
    {
        return $this->respond($request, 'countVariances');
    }

    public function assets(Request $request): JsonResponse
    {
        return $this->respond($request, 'assets');
    }

    private function respond(Request $request, string $report): JsonResponse
    {
        $filters = new ReportFilters($request->query());
        $user = $this->actor->requireUser();

        $payload = match ($report) {
            'stockOnHand' => $this->queries->stockOnHand($user, $filters),
            'movements' => $this->queries->movements($user, $filters),
            'transfers' => $this->queries->transfers($user, $filters),
            'countVariances' => $this->queries->countVariances($user, $filters),
            'assets' => $this->queries->assets($user, $filters),
            default => throw new \LogicException("Unknown report: {$report}"),
        };

        return response()->json($payload);
    }
}
