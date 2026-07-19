<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Identity\CurrentActor;
use App\Application\Identity\UserPresenter;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;

final class MeController extends Controller
{
    public function __construct(
        private readonly CurrentActor $actor,
        private readonly UserPresenter $presenter,
    ) {}

    public function __invoke(): UserResource
    {
        $user = $this->actor->user() ?? throw new AuthorizationDenied('Session user not found.');

        return new UserResource($this->presenter->present($user));
    }
}
