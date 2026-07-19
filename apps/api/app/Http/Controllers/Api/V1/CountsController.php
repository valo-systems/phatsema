<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Counts\CountCommandService;
use App\Application\Counts\CountPresenter;
use App\Application\Counts\CountQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Counts\CountTransitionRequest;
use App\Http\Requests\Counts\CreateCountRequest;
use App\Http\Requests\Counts\ReviewCountRequest;
use App\Http\Requests\Counts\SaveCountEntriesRequest;
use App\Http\Requests\Counts\UpdateCountRequest;
use App\Http\Resources\CountResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CountsController extends Controller
{
    public function __construct(
        private readonly CountQueryService $queries,
        private readonly CountCommandService $commands,
        private readonly CountPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->integer('page', 1));
        $pageSize = min(100, max(1, $request->integer('pageSize', 25)));
        $result = $this->queries->search([
            'status' => $request->query('status'),
            'siteId' => $request->query('siteId'),
            'page' => $page,
            'pageSize' => $pageSize,
        ]);

        return response()->json([
            'data' => $this->presenter->presentMany($result['records']),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $result['total'], 'sort' => null],
        ]);
    }

    public function show(string $countId): CountResource
    {
        return $this->resource($this->queries->get($countId));
    }

    public function store(CreateCountRequest $request): JsonResponse
    {
        return $this->resource($this->commands->create($request->validated()))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCountRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->update($countId, $request->validated()));
    }

    public function start(CountTransitionRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->start($countId, $request->integer('version')));
    }

    public function entries(SaveCountEntriesRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->saveEntries($countId, $request->validated()));
    }

    public function submit(CountTransitionRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->submit($countId, $request->integer('version')));
    }

    public function requestRecount(ReviewCountRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->requestRecount(
            $countId,
            $request->integer('version'),
            $request->input('note'),
        ));
    }

    public function approve(ReviewCountRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->approve(
            $countId,
            $request->integer('version'),
            $request->input('note'),
        ));
    }

    public function post(CountTransitionRequest $request, string $countId): CountResource
    {
        return $this->resource($this->commands->post($countId, $request->integer('version')));
    }

    /** @param array<string, mixed> $count */
    private function resource(array $count): CountResource
    {
        return new CountResource($this->presenter->present($count));
    }
}
