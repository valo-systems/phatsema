<?php

declare(strict_types=1);

namespace App\Application\Identity;

final class UserPresenter
{
    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function present(array $user): array
    {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'preferredName' => $user['preferred_name'] ?? null,
            'workPhone' => $user['work_phone'] ?? null,
            'jobTitle' => $user['job_title'] ?? null,
            'departmentCode' => $user['department_code'] ?? null,
            'bio' => $user['bio'] ?? null,
            'email' => $user['email'],
            'status' => $user['active'] ? 'active' : 'inactive',
            'roles' => [[
                'id' => 'role-'.$user['role'],
                'name' => $user['role_label'],
                'permissions' => $user['permissions'],
                'isSystemRole' => true,
            ]],
            'permissions' => $user['permissions'],
            'allSites' => $user['all_sites'],
            'assignedSiteIds' => $user['assigned_site_ids'],
            'lastLoginAt' => $user['last_login_at'] ?? null,
            'version' => $user['version'] ?? 1,
        ];
    }
}
