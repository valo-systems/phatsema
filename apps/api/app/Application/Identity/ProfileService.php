<?php

declare(strict_types=1);

namespace App\Application\Identity;

use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Domain\Audit\AuditRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Shared\UnitOfWork;

final readonly class ProfileService
{
    public function __construct(
        private IdentityRepository $identities,
        private CurrentActor $actor,
        private UserPresenter $presenter,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(array $command): array
    {
        $user = $this->actor->requireUser();
        if ((int) ($user['version'] ?? 1) !== (int) $command['version']) {
            throw new ConcurrencyConflict;
        }

        $update = [
            'name' => trim((string) $command['name']),
            'preferred_name' => $this->nullableString($command['preferredName'] ?? null),
            'work_phone' => $this->nullableString($command['workPhone'] ?? null),
            'bio' => $this->nullableString($command['bio'] ?? null),
        ];
        $changedFields = $this->changedFields($user, $update);
        if ($changedFields === []) {
            return $this->presenter->present($user);
        }

        $updated = $this->identities->updateUser((string) $user['id'], $update) ?? $user;
        $this->recordAudit($updated, 'profile.updated', 'Profile updated', $changedFields);
        $this->unitOfWork->commit();

        return $this->presenter->present($updated);
    }

    /** @return array<string, mixed> */
    public function changePassword(string $currentPassword, string $newPassword): array
    {
        $user = $this->actor->requireUser();
        if (! password_verify($currentPassword, (string) $user['password_hash'])) {
            throw new DomainRuleViolation('The current password is incorrect.');
        }
        if (password_verify($newPassword, (string) $user['password_hash'])) {
            throw new DomainRuleViolation('The new password must be different from the current password.');
        }

        $updated = $this->identities->updateUser((string) $user['id'], [
            'password_hash' => password_hash($newPassword, PASSWORD_BCRYPT),
        ]) ?? $user;
        $this->recordAudit($updated, 'profile.password_changed', 'Password changed', []);
        $this->unitOfWork->commit();

        return $this->presenter->present($updated);
    }

    private function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /** @param array<string, mixed> $user
     * @param  array<string, mixed>  $update
     * @return list<string>
     */
    private function changedFields(array $user, array $update): array
    {
        $publicNames = [
            'name' => 'name',
            'preferred_name' => 'preferredName',
            'work_phone' => 'workPhone',
            'bio' => 'bio',
        ];

        return array_map(
            static fn (string $field): string => $publicNames[$field],
            array_keys(array_filter(
                $update,
                static fn (mixed $value, string $field): bool => ($user[$field] ?? null) !== $value,
                ARRAY_FILTER_USE_BOTH,
            )),
        );
    }

    /** @param array<string, mixed> $user
     * @param  list<string>  $changedFields
     */
    private function recordAudit(array $user, string $event, string $summary, array $changedFields): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $event,
            'resource_type' => 'user',
            'resource_id' => $user['id'],
            'user_id' => $user['id'],
            'site_id' => null,
            'summary' => $summary,
            'payload' => ['changed_fields' => $changedFields],
        ]);
    }
}
