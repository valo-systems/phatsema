<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class ProfileWorkflowTest extends TestCase
{
    public function test_user_can_update_only_personal_profile_fields_with_version_control(): void
    {
        $current = $this->actingAsDemo()->getJson('/api/v1/auth/me')->assertOk()->json('data');

        $updated = $this->actingAsDemo()->patchJson('/api/v1/profile', [
            'version' => $current['version'],
            'name' => 'Demo System Administrator',
            'preferredName' => 'Demo Admin',
            'workPhone' => '+27 12 555 0199',
            'bio' => 'Coordinates access and inventory support.',
        ])->assertOk()
            ->assertJsonPath('data.preferredName', 'Demo Admin')
            ->assertJsonPath('data.jobTitle', 'Portal Administrator')
            ->json('data');

        $this->assertGreaterThan($current['version'], $updated['version']);

        $this->actingAsDemo()->patchJson('/api/v1/profile', [
            'version' => $updated['version'],
            'name' => 'Demo System Administrator',
            'jobTitle' => 'Self-appointed Director',
        ])->assertUnprocessable()->assertJsonValidationErrors('jobTitle');

        $this->actingAsDemo()->patchJson('/api/v1/profile', [
            'version' => $current['version'],
            'name' => 'Stale Update',
        ])->assertConflict();
    }

    public function test_profile_rejects_invalid_phone_numbers(): void
    {
        $version = $this->actingAsDemo()->getJson('/api/v1/auth/me')->json('data.version');

        $this->actingAsDemo()->patchJson('/api/v1/profile', [
            'version' => $version,
            'name' => 'System Administrator',
            'workPhone' => 'call me',
        ])->assertUnprocessable()->assertJsonValidationErrors('workPhone');
    }

    public function test_password_change_validates_credentials_confirmation_and_reuse_then_keeps_session(): void
    {
        $this->actingAsDemo()->postJson('/api/v1/profile/password', [
            'currentPassword' => 'incorrect-password',
            'newPassword' => 'A-new-password-123',
            'newPasswordConfirmation' => 'A-new-password-123',
        ])->assertUnprocessable();

        $this->actingAsDemo()->postJson('/api/v1/profile/password', [
            'currentPassword' => 'PhatsemaDemo1',
            'newPassword' => 'A-new-password-123',
            'newPasswordConfirmation' => 'does-not-match',
        ])->assertUnprocessable()->assertJsonValidationErrors('newPasswordConfirmation');

        $this->actingAsDemo()->postJson('/api/v1/profile/password', [
            'currentPassword' => 'PhatsemaDemo1',
            'newPassword' => 'PhatsemaDemo1',
            'newPasswordConfirmation' => 'PhatsemaDemo1',
        ])->assertUnprocessable();

        $this->actingAsDemo()->postJson('/api/v1/profile/password', [
            'currentPassword' => 'PhatsemaDemo1',
            'newPassword' => 'A-new-password-123',
            'newPasswordConfirmation' => 'A-new-password-123',
        ])->assertOk();

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', self::ADMIN_ID);
    }

    public function test_administrator_can_update_controlled_work_profile_without_changing_email(): void
    {
        $userId = '01JZFIX0000000000000000004';
        $user = collect($this->actingAsDemo()->getJson('/api/v1/users')->assertOk()->json('data'))
            ->firstWhere('id', $userId);

        $this->actingAsDemo()->patchJson("/api/v1/users/{$userId}", [
            'version' => $user['version'],
            'name' => 'Demo Store Controller',
            'preferredName' => 'Store Control',
            'workPhone' => '+27 12 555 0188',
            'jobTitle' => 'Senior Store Controller',
            'departmentCode' => 'inventory_warehousing',
            'bio' => 'Maintains controlled inventory records.',
        ])->assertOk()
            ->assertJsonPath('data.jobTitle', 'Senior Store Controller')
            ->assertJsonPath('data.departmentCode', 'inventory_warehousing')
            ->assertJsonPath('data.email', 'storekeeper@demo.phatsema.example');

        $audit = $this->actingAsDemo()->getJson('/api/v1/audit-events?action=user.updated')
            ->assertOk()
            ->assertJsonPath('data.0.changes.changed_fields', [
                'name', 'preferredName', 'workPhone', 'jobTitle', 'bio',
            ])
            ->json('data.0');
        $encodedAudit = json_encode($audit, JSON_THROW_ON_ERROR);
        $this->assertStringNotContainsString('+27 12 555 0188', $encodedAudit);
        $this->assertStringNotContainsString('Maintains controlled inventory records.', $encodedAudit);

        $this->actingAsDemo()->patchJson("/api/v1/users/{$userId}", [
            'version' => $user['version'] + 1,
            'email' => 'changed@demo.phatsema.example',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_successful_login_tracks_last_login_and_profile_audits_are_redacted(): void
    {
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@demo.phatsema.example',
            'password' => 'PhatsemaDemo1',
        ])->assertOk()->json('data');

        $this->assertNotEmpty($login['lastLoginAt']);

        $this->patchJson('/api/v1/profile', [
            'version' => $login['version'],
            'name' => 'Audit Safe Administrator',
            'preferredName' => 'Audit Safe',
            'workPhone' => '+27 12 555 0177',
            'bio' => 'This content must never appear in the audit event.',
        ])->assertOk();

        $this->postJson('/api/v1/profile/password', [
            'currentPassword' => 'PhatsemaDemo1',
            'newPassword' => 'Audit-safe-password-123',
            'newPasswordConfirmation' => 'Audit-safe-password-123',
        ])->assertOk();

        $events = $this->getJson('/api/v1/audit-events?action=profile.updated')
            ->assertOk()
            ->assertJsonPath('data.0.changes.changed_fields', ['name', 'preferredName', 'workPhone', 'bio'])
            ->json('data');
        $passwordEvents = $this->getJson('/api/v1/audit-events?action=profile.password_changed')
            ->assertOk()
            ->json('data');

        $encoded = json_encode([$events, $passwordEvents], JSON_THROW_ON_ERROR);
        $this->assertStringNotContainsString('+27 12 555 0177', $encoded);
        $this->assertStringNotContainsString('This content must never appear', $encoded);
        $this->assertStringNotContainsString('Audit-safe-password-123', $encoded);
        $this->assertStringNotContainsString('password_hash', $encoded);
    }

    public function test_departments_are_available_to_every_authenticated_persona(): void
    {
        $this->actingAsDemo(self::EXECUTIVE_ID)
            ->getJson('/api/v1/reference/departments')
            ->assertOk()
            ->assertJsonCount(12, 'data')
            ->assertJsonPath('data.2.name', 'Inventory & Warehousing');
    }
}
