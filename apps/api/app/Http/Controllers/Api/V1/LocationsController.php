<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Sites\SiteCommandService;
use App\Application\Sites\SitePresenter;
use App\Domain\Sites\SiteRepository;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sites\CreateLocationRequest;
use App\Http\Requests\Sites\UpdateLocationRequest;
use App\Policies\PermissionPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LocationsController extends Controller
{
    public function __construct(
        private readonly SiteRepository $sites,
        private readonly SiteCommandService $commands,
        private readonly SitePresenter $presenter,
        private readonly PermissionPolicy $permissions,
    ) {}

    public function index(Request $request, string $siteId): JsonResponse
    {
        if (! $this->permissions->canAccessSite($siteId)) {
            throw new AuthorizationDenied;
        }
        $this->sites->findSite($siteId) ?? throw new ResourceNotFound('Site not found.');

        $locations = $this->sites->getLocationsForSite($siteId);

        if ($request->query('active') !== null) {
            $active = filter_var($request->query('active'), FILTER_VALIDATE_BOOLEAN);
            $locations = array_values(array_filter($locations, fn ($l) => $l['active'] === $active));
        }

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 50)));
        $total = count($locations);
        $locations = array_slice($locations, ($page - 1) * $pageSize, $pageSize);

        return response()->json([
            'data' => array_map($this->presenter->location(...), $locations),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ]);
    }

    public function store(CreateLocationRequest $request, string $siteId): JsonResponse
    {
        $location = $this->commands->createLocation($siteId, $request->validated());

        return response()->json(['data' => $this->presenter->location($location)], 201);
    }

    public function update(UpdateLocationRequest $request, string $locationId): JsonResponse
    {
        $location = $this->commands->updateLocation($locationId, $request->validated());

        return response()->json(['data' => $this->presenter->location($location)]);
    }
}
