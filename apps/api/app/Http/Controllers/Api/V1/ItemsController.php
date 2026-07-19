<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Catalogue\CatalogueCommandService;
use App\Application\Catalogue\ItemPresenter;
use App\Application\Catalogue\ItemQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalogue\CreateItemRequest;
use App\Http\Requests\Catalogue\UpdateItemRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ItemsController extends Controller
{
    public function __construct(
        private readonly ItemQueryService $queries,
        private readonly CatalogueCommandService $commands,
        private readonly ItemPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->queries->list($request->query()));
    }

    public function show(string $itemId): JsonResponse
    {
        return response()->json(['data' => $this->queries->find($itemId)]);
    }

    public function store(CreateItemRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->presenter->summary($this->commands->create($request->validated())),
        ], 201);
    }

    public function update(UpdateItemRequest $request, string $itemId): JsonResponse
    {
        return response()->json([
            'data' => $this->presenter->summary($this->commands->update($itemId, $request->validated())),
        ]);
    }
}
