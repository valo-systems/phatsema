<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ProblemException;
use App\Application\Identity\AuthenticationService;
use App\Application\Identity\UserPresenter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\RateLimiter;

final class LoginController extends Controller
{
    public function __construct(
        private readonly AuthenticationService $authentication,
        private readonly UserPresenter $presenter,
    ) {}

    public function __invoke(LoginRequest $request): UserResource
    {
        $email = $request->string('email')->lower()->toString();
        $attemptKey = hash('sha256', $email.'|'.($request->ip() ?? 'unknown'));

        if (RateLimiter::tooManyAttempts($attemptKey, 5)) {
            throw new ProblemException(
                'too-many-attempts',
                'Too Many Attempts',
                429,
                'Too many failed sign-in attempts. Wait a minute and try again.',
            );
        }

        try {
            $user = $this->authentication->login(
                $email,
                $request->string('password')->toString(),
            );
        } catch (DomainRuleViolation $exception) {
            RateLimiter::hit($attemptKey, 60);

            throw $exception;
        }

        RateLimiter::clear($attemptKey);

        return new UserResource($this->presenter->present($user));
    }
}
