<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\ProfileService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\ChangePasswordRequest;
use App\Http\Requests\Identity\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;

final class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profiles) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->profiles->update($request->validated())]);
    }

    public function password(ChangePasswordRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->profiles->changePassword(
                $request->string('currentPassword')->toString(),
                $request->string('newPassword')->toString(),
            ),
        ]);
    }
}
