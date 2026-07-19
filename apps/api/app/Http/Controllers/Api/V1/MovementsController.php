<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Inventory\MovementPresenter;
use App\Application\Inventory\MovementQueryService;
use App\Application\Inventory\StockCommandService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ReverseMovementRequest;
use App\Http\Resources\MovementResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class MovementsController extends Controller
{
    public function __construct(
        private readonly MovementQueryService $queries,
        private readonly StockCommandService $commands,
        private readonly MovementPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->integer('page', 1));
        $pageSize = min(100, max(1, $request->integer('pageSize', 25)));
        $filters = $request->only([
            'siteId',
            'itemId',
            'locationId',
            'movementType',
            'reversed',
            'from',
            'to',
        ]) + [
            'movementType' => $request->query('movementType', $request->query('type')),
            'page' => $page,
            'pageSize' => $pageSize,
        ];
        $result = $this->queries->search($filters);

        return response()->json([
            'data' => $this->presenter->presentMany($result['records']),
            'meta' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $result['total'],
                'sort' => null,
            ],
        ]);
    }

    public function show(string $movementId): MovementResource
    {
        return new MovementResource($this->presenter->present($this->queries->get($movementId)));
    }

    public function reverse(ReverseMovementRequest $request, string $movementId): JsonResponse
    {
        $movement = $this->commands->reverse($movementId, $request->validated());
        $data = [$this->presenter->present($movement)];

        return MovementResource::collection($data)->response()->setStatusCode(201);
    }
}
