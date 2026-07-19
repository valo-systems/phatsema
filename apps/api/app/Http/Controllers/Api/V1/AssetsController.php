<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Assets\AssetCommandService;
use App\Application\Assets\AssetPresenter;
use App\Application\Assets\AssetQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Assets\AssignAssetRequest;
use App\Http\Requests\Assets\ChangeAssetStatusRequest;
use App\Http\Requests\Assets\CreateAssetRequest;
use App\Http\Requests\Assets\RecordMeterRequest;
use App\Http\Requests\Assets\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AssetsController extends Controller
{
    public function __construct(
        private readonly AssetQueryService $queries,
        private readonly AssetCommandService $commands,
        private readonly AssetPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->integer('page', 1));
        $pageSize = min(100, max(1, $request->integer('pageSize', 25)));
        $result = $this->queries->search([
            'siteId' => $request->query('siteId'),
            'status' => $request->query('status'),
            'assetType' => $request->query('assetType', $request->query('type')),
            'page' => $page,
            'pageSize' => $pageSize,
        ]);

        return response()->json([
            'data' => $this->presenter->presentMany($result['records']),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $result['total'], 'sort' => null],
        ]);
    }

    public function show(string $assetId): AssetResource
    {
        return new AssetResource($this->presenter->present($this->queries->get($assetId), true));
    }

    public function store(CreateAssetRequest $request): JsonResponse
    {
        return $this->resource($this->commands->create($request->validated()))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateAssetRequest $request, string $assetId): AssetResource
    {
        return $this->resource($this->commands->update($assetId, $request->validated()));
    }

    public function assign(AssignAssetRequest $request, string $assetId): AssetResource
    {
        return $this->resource($this->commands->assign($assetId, $request->validated()));
    }

    public function statusChange(ChangeAssetStatusRequest $request, string $assetId): AssetResource
    {
        return $this->resource($this->commands->changeStatus($assetId, $request->validated()));
    }

    public function meterReading(RecordMeterRequest $request, string $assetId): AssetResource
    {
        return $this->resource($this->commands->recordMeter($assetId, $request->validated()));
    }

    /** @param array<string, mixed> $asset */
    private function resource(array $asset): AssetResource
    {
        return new AssetResource($this->presenter->present($asset));
    }
}
