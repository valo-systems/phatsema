<?php

declare(strict_types=1);

namespace App\Application\Identity;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Domain\Audit\AuditRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Shared\UnitOfWork;
use App\Policies\PermissionPolicy;

final readonly class UserAdministrationService
{
    public function __construct(
        private IdentityRepository $identities,
        private RoleCatalogue $roles,
        private UserPresenter $presenter,
        private PermissionPolicy $permissions,
        private CurrentActor $actor,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
    ) {}

    /** @return list<array<string, mixed>> */
    public function list(): array
    {
        $this->authorize();

        return array_map($this->presenter->present(...), $this->identities->getUsers());
    }

    /** @return list<array<string, mixed>> */
    public function roles(): array
    {
        $this->authorize();

        return array_map(
            static fn (string $key, array $role): array => [
                'id' => 'role-'.$key,
                'name' => $role['label'],
                'permissions' => $role['permissions'],
                'isSystemRole' => true,
            ],
            array_keys($this->roles->all()),
            array_values($this->roles->all()),
        );
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function create(array $command): array
    {
        $this->authorize();
        if ($this->identities->findUserByEmail(strtolower((string) $command['email'])) !== null) {
            throw new DomainRuleViolation('A user with this email address already exists.');
        }
        $role = $this->role((string) $command['role']);
        $user = $this->identities->createUser([
            'name' => trim((string) $command['name']),
            'preferred_name' => $this->nullableString($command['preferredName'] ?? null),
            'work_phone' => $this->nullableString($command['workPhone'] ?? null),
            'job_title' => $this->nullableString($command['jobTitle'] ?? null),
            'department_code' => $this->nullableString($command['departmentCode'] ?? null),
            'bio' => $this->nullableString($command['bio'] ?? null),
            'email' => strtolower((string) $command['email']),
            'password_hash' => password_hash((string) $command['temporaryPassword'], PASSWORD_BCRYPT),
            'role' => $command['role'],
            'role_label' => $role['label'],
            'permissions' => $role['permissions'],
            'all_sites' => (bool) $command['allSites'],
            'assigned_site_ids' => $command['allSites'] ? [] : $command['assignedSiteIds'],
            'active' => true,
            'last_login_at' => null,
        ]);
        $this->audit($user, 'user.created', 'User created', [
            'name', 'preferredName', 'workPhone', 'jobTitle', 'departmentCode', 'bio',
            'email', 'role', 'allSites', 'assignedSiteIds', 'status',
        ]);
        $this->unitOfWork->commit();

        return $this->presenter->present($user);
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(string $id, array $command): array
    {
        $this->authorize();
        $user = $this->identities->findUser($id) ?? throw new ResourceNotFound('User not found.');
        if ((int) ($user['version'] ?? 1) !== (int) $command['version']) {
            throw new ConcurrencyConflict;
        }
        if ($id === $this->actor->id() && ($command['status'] ?? 'active') === 'inactive') {
            throw new DomainRuleViolation('You cannot deactivate your own account.');
        }
        $update = [];
        $workFields = [
            'name' => 'name',
            'preferredName' => 'preferred_name',
            'workPhone' => 'work_phone',
            'jobTitle' => 'job_title',
            'departmentCode' => 'department_code',
            'bio' => 'bio',
        ];
        foreach ($workFields as $input => $stored) {
            if (! array_key_exists($input, $command)) {
                continue;
            }
            $update[$stored] = $input === 'name'
                ? trim((string) $command[$input])
                : $this->nullableString($command[$input]);
        }
        if (isset($command['role'])) {
            $role = $this->role((string) $command['role']);
            $update += ['role' => $command['role'], 'role_label' => $role['label'], 'permissions' => $role['permissions']];
        }
        if (array_key_exists('allSites', $command)) {
            $update['all_sites'] = (bool) $command['allSites'];
        }
        if (array_key_exists('assignedSiteIds', $command)) {
            $update['assigned_site_ids'] = ($update['all_sites'] ?? $user['all_sites']) ? [] : $command['assignedSiteIds'];
        }
        if (isset($command['status'])) {
            $update['active'] = $command['status'] === 'active';
        }
        if (! empty($command['temporaryPassword'])) {
            $update['password_hash'] = password_hash((string) $command['temporaryPassword'], PASSWORD_BCRYPT);
        }
        $changedFields = $this->changedFields($user, $update);
        if ($changedFields === []) {
            return $this->presenter->present($user);
        }
        $updated = $this->identities->updateUser($id, $update) ?? throw new ResourceNotFound('User not found.');
        $this->audit($updated, 'user.updated', 'User updated', $changedFields);
        $this->unitOfWork->commit();

        return $this->presenter->present($updated);
    }

    private function authorize(): void
    {
        if (! $this->permissions->allows('user.manage')) {
            throw new AuthorizationDenied;
        }
    }

    /** @return array{label: string, permissions: list<string>} */
    private function role(string $key): array
    {
        return $this->roles->all()[$key] ?? throw new DomainRuleViolation('Select a valid role.');
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
            'job_title' => 'jobTitle',
            'department_code' => 'departmentCode',
            'bio' => 'bio',
            'role' => 'role',
            'role_label' => 'role',
            'permissions' => 'role',
            'all_sites' => 'allSites',
            'assigned_site_ids' => 'assignedSiteIds',
            'active' => 'status',
            'password_hash' => 'temporaryPassword',
        ];
        $changed = [];
        foreach ($update as $field => $value) {
            if (($user[$field] ?? null) !== $value && isset($publicNames[$field])) {
                $changed[] = $publicNames[$field];
            }
        }

        return array_values(array_unique($changed));
    }

    /** @param array<string, mixed> $user
     * @param  list<string>  $changedFields
     */
    private function audit(array $user, string $event, string $summary, array $changedFields): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $event,
            'resource_type' => 'user',
            'resource_id' => $user['id'],
            'user_id' => $this->actor->id(),
            'site_id' => null,
            'summary' => "{$summary}: {$user['email']}",
            'payload' => [
                'changed_fields' => $changedFields,
                'role' => $user['role'],
                'active' => $user['active'],
            ],
        ]);
    }
}
