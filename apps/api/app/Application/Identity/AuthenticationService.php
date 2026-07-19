<?php

declare(strict_types=1);

namespace App\Application\Identity;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\DomainRuleViolation;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Shared\UnitOfWork;
use Carbon\CarbonImmutable;
use Illuminate\Session\Store as Session;

final readonly class AuthenticationService
{
    public function __construct(
        private IdentityRepository $identities,
        private Session $session,
        private UnitOfWork $unitOfWork,
    ) {}

    /** @return array<string, mixed> */
    public function login(string $email, string $password): array
    {
        $user = $this->identities->findUserByEmail($email);
        if ($user === null || ! password_verify($password, $user['password_hash'])) {
            throw new DomainRuleViolation(
                'The email address or password is incorrect.',
                'invalid-credentials',
                'Invalid Credentials',
            );
        }
        if (! (bool) $user['active']) {
            throw new AuthorizationDenied('Your account has been deactivated.');
        }
        $user = $this->identities->updateUser((string) $user['id'], [
            'last_login_at' => CarbonImmutable::now('UTC')->toIso8601String(),
        ]) ?? $user;
        $this->unitOfWork->commit();
        $this->session->regenerate();
        $this->session->put('auth_user_id', $user['id']);

        return $user;
    }
}
