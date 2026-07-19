<?php

declare(strict_types=1);

namespace App\Application\Identity;

use App\Domain\Identity\IdentityRepository;
use Illuminate\Session\Store as Session;

final readonly class CurrentActor
{
    public function __construct(
        private Session $session,
        private IdentityRepository $identities,
    ) {}

    public function id(): ?string
    {
        $id = $this->session->get('auth_user_id');

        return is_string($id) && $id !== '' ? $id : null;
    }

    /** @return array<string, mixed>|null */
    public function user(): ?array
    {
        $id = $this->id();

        return $id === null ? null : $this->identities->findUser($id);
    }

    /** @return array<string, mixed> */
    public function requireUser(): array
    {
        return $this->user() ?? [];
    }
}
