<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\UserAdministrationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\CreateUserRequest;
use App\Http\Requests\Identity\UpdateUserRequest;
use Illuminate\Http\JsonResponse;

final class UsersController extends Controller
{
    public function __construct(private readonly UserAdministrationService $users) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->users->list()]);
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->users->create($request->validated())], 201);
    }

    public function update(UpdateUserRequest $request, string $userId): JsonResponse
    {
        return response()->json(['data' => $this->users->update($userId, $request->validated())]);
    }

    public function roles(): JsonResponse
    {
        return response()->json(['data' => $this->users->roles()]);
    }
}
