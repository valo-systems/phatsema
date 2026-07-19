<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class AuditMutationCoverageTest extends TestCase
{
    public function test_each_mutation_family_writes_an_attributed_audit_event(): void
    {
        $site = $this->actingAsDemo()->postJson('/api/v1/sites', [
            'name' => 'Demo Audit Coverage Site',
            'entityCode' => 'PHATSEMA_PROJECTS',
            'type' => 'warehouse',
            'countryCode' => 'ZA',
            'timezone' => 'Africa/Johannesburg',
        ])->assertCreated()->json('data');

        $location = $this->actingAsDemo()->postJson("/api/v1/sites/{$site['id']}/locations", [
            'name' => 'Audit Store',
            'type' => 'warehouse',
        ])->assertCreated()->json('data');

        $item = $this->actingAsDemo()->postJson('/api/v1/items', [
            'name' => 'Demo Audit Coverage Item',
            'categoryId' => 'CAT-CONS',
            'inventoryType' => 'consumable',
            'baseUnit' => 'EA',
            'trackingMode' => 'quantity',
            'ownershipMode' => 'company_owned',
        ])->assertCreated()->json('data');

        $this->actingAsDemo()->postJson('/api/v1/receipts', [
            'siteId' => $site['id'],
            'locationId' => $location['id'],
            'reference' => 'DEMO-AUDIT-RECEIPT',
            'receivedAt' => now()->toDateString(),
            'lines' => [['itemId' => $item['id'], 'quantity' => '10.00']],
        ])->assertCreated();

        $asset = $this->actingAsDemo()->postJson('/api/v1/assets', [
            'name' => 'Demo Audit Coverage Asset',
            'type' => 'workshop_equipment',
            'ownershipMode' => 'company_owned',
            'make' => 'Demo',
            'model' => 'Audit',
            'serialNumber' => 'DEMO-AUDIT-SERIAL-001',
            'siteId' => $site['id'],
            'locationId' => $location['id'],
        ])->assertCreated()->json('data');

        $count = $this->actingAsDemo()->postJson('/api/v1/counts', [
            'siteId' => $site['id'],
            'locationId' => $location['id'],
            'scope' => 'selected_items',
            'scopeItemIds' => [$item['id']],
            'blindCount' => true,
        ])->assertCreated()->json('data');

        $transfer = $this->actingAsDemo()->postJson('/api/v1/transfers', [
            'sourceSiteId' => self::SITE_A,
            'sourceLocationId' => self::LOCATION_A,
            'destinationSiteId' => self::SITE_B,
            'destinationLocationId' => self::LOCATION_B,
            'lines' => [['itemId' => self::ITEM_A, 'requestedQuantity' => '1.00']],
        ])->assertCreated()->json('data');

        $user = $this->actingAsDemo()->postJson('/api/v1/users', [
            'name' => 'Demo Audit Coverage User',
            'email' => 'audit.coverage@demo.phatsema.example',
            'temporaryPassword' => 'TemporaryPass123!',
            'role' => 'storekeeper',
            'allSites' => false,
            'assignedSiteIds' => [$site['id']],
        ])->assertCreated()->json('data');

        $alert = $this->actingAsDemo()->getJson('/api/v1/alerts')
            ->assertOk()
            ->json('data.0');
        $this->actingAsDemo()->postJson("/api/v1/alerts/{$alert['id']}/read")
            ->assertOk();

        $response = $this->actingAsDemo()->getJson('/api/v1/audit-events?pageSize=200')
            ->assertOk();
        $events = collect($response->json('data'));

        $expectedResources = [
            ['site.created', 'site', $site['id']],
            ['location.created', 'location', $location['id']],
            ['item.created', 'item', $item['id']],
            ['movement.created', 'movement', null],
            ['asset.created', 'asset', $asset['id']],
            ['count.created', 'count', $count['id']],
            ['transfer.created', 'transfer', $transfer['id']],
            ['user.created', 'user', $user['id']],
            ['alert.read', 'alert', $alert['id']],
        ];

        foreach ($expectedResources as [$action, $resourceType, $resourceId]) {
            $matchingEvent = $events->first(
                static fn (array $event): bool => $event['action'] === $action
                    && $event['resourceType'] === $resourceType
                    && ($resourceId === null || $event['resourceId'] === $resourceId),
            );

            $this->assertNotNull($matchingEvent, "Missing {$action} audit event.");
            $this->assertSame(self::ADMIN_ID, $matchingEvent['actorUserId']);
            $this->assertNotEmpty($matchingEvent['occurredAt']);
            $this->assertNotEmpty($matchingEvent['summary']);
        }
    }

    public function test_demo_reset_is_audited_after_the_store_is_reseeded(): void
    {
        $this->actingAsDemo()->postJson('/api/v1/demo/reset')->assertOk();

        $this->actingAsDemo()->getJson('/api/v1/audit-events?action=demo.reset')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'demo.reset')
            ->assertJsonPath('data.0.actorUserId', self::ADMIN_ID);
    }
}
