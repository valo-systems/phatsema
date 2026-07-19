<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class AuthenticationAndAuthorizationTest extends TestCase
{
    public function test_protected_routes_require_a_session(): void
    {
        $this->getJson('/api/v1/dashboard')
            ->assertUnauthorized()
            ->assertHeader('content-type', 'application/problem+json');
    }

    public function test_demo_persona_can_log_in_and_receive_session_identity(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@demo.phatsema.example',
            'password' => 'PhatsemaDemo1',
        ])->assertOk()
            ->assertJsonPath('data.id', self::ADMIN_ID)
            ->assertSessionHas('auth_user_id', self::ADMIN_ID);
    }

    public function test_deny_by_default_permissions_block_an_executive_mutation(): void
    {
        $this->actingAsDemo(self::EXECUTIVE_ID)
            ->postJson('/api/v1/adjustments', [
                'siteId' => self::SITE_A,
                'locationId' => self::LOCATION_A,
                'itemId' => self::ITEM_A,
                'direction' => 'increase',
                'quantity' => '1.00',
                'reasonCode' => 'RSN-CORR',
            ])->assertForbidden();
    }

    public function test_site_scoped_user_cannot_read_another_site_or_its_item_balances(): void
    {
        $siteManagerId = '01JZFIX0000000000000000003';

        $this->actingAsDemo($siteManagerId)
            ->getJson('/api/v1/sites/'.self::SITE_B)
            ->assertForbidden();
        $this->actingAsDemo($siteManagerId)
            ->getJson('/api/v1/sites/'.self::SITE_B.'/locations')
            ->assertForbidden();

        $response = $this->actingAsDemo($siteManagerId)
            ->getJson('/api/v1/items/'.self::ITEM_A.'/balances')
            ->assertOk();

        $siteIds = array_column($response->json('data'), 'siteId');
        $this->assertSame([self::SITE_A], array_values(array_unique($siteIds)));
    }

    public function test_administrator_can_create_and_deactivate_a_site_scoped_user(): void
    {
        $user = $this->actingAsDemo()->postJson('/api/v1/users', [
            'name' => 'Demo Inventory Clerk',
            'email' => 'inventory.clerk@demo.phatsema.example',
            'temporaryPassword' => 'TemporaryPass123!',
            'role' => 'storekeeper',
            'allSites' => false,
            'assignedSiteIds' => [self::SITE_A],
        ])->assertCreated()
            ->assertJsonPath('data.assignedSiteIds.0', self::SITE_A)
            ->json('data');

        $this->actingAsDemo()->patchJson("/api/v1/users/{$user['id']}", [
            'version' => 1,
            'status' => 'inactive',
        ])->assertOk()->assertJsonPath('data.status', 'inactive');
    }
}
