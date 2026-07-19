<?php

declare(strict_types=1);

namespace App\Domain\Identity;

interface IdentityRepository
{
    /** @return list<array<string, mixed>> */
    public function getUsers(): array;

    /** @return array<string, mixed>|null */
    public function findUser(string $id): ?array;

    /** @return array<string, mixed>|null */
    public function findUserByEmail(string $email): ?array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createUser(array $data): array;

    /** @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function updateUser(string $id, array $data): ?array;
}
