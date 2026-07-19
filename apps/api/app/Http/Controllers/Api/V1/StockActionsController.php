<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Inventory\MovementPresenter;
use App\Application\Inventory\StockCommandService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustmentRequest;
use App\Http\Requests\Inventory\IssueRequest;
use App\Http\Requests\Inventory\ReceiptRequest;
use App\Http\Resources\MovementResource;
use Illuminate\Http\JsonResponse;

final class StockActionsController extends Controller
{
    public function __construct(
        private readonly StockCommandService $commands,
        private readonly MovementPresenter $presenter,
    ) {}

    public function receipt(ReceiptRequest $request): JsonResponse
    {
        $data = $this->presenter->presentMany($this->commands->receive($request->validated()));

        return MovementResource::collection($data)->response()->setStatusCode(201);
    }

    public function issue(IssueRequest $request): JsonResponse
    {
        $data = $this->presenter->presentMany($this->commands->issue($request->validated()));

        return MovementResource::collection($data)->response()->setStatusCode(201);
    }

    public function adjustment(AdjustmentRequest $request): JsonResponse
    {
        $data = [$this->presenter->present($this->commands->adjust($request->validated()))];

        return MovementResource::collection($data)->response()->setStatusCode(201);
    }
}
