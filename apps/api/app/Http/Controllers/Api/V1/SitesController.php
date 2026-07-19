<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\CurrentActor;
use App\Application\Sites\SiteCommandService;
use App\Application\Sites\SitePresenter;
use App\Application\Sites\SiteQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sites\CreateSiteRequest;
use App\Http\Requests\Sites\UpdateSiteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SitesController extends Controller
{
    public function __construct(
        private readonly SiteQueryService $queries,
        private readonly SiteCommandService $commands,
        private readonly SitePresenter $presenter,
        private readonly CurrentActor $actor,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->queries->list(
            $this->actor->requireUser(),
            $request->query(),
        ));
    }

    public function show(string $siteId): JsonResponse
    {
        return response()->json(['data' => $this->queries->find($siteId)]);
    }

    public function store(CreateSiteRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->presenter->site($this->commands->createSite($request->validated())),
        ], 201);
    }

    public function update(UpdateSiteRequest $request, string $siteId): JsonResponse
    {
        return response()->json([
            'data' => $this->presenter->site($this->commands->updateSite($siteId, $request->validated())),
        ]);
    }
}
