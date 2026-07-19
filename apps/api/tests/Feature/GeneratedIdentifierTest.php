<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class GeneratedIdentifierTest extends TestCase
{
    public function test_internal_identifiers_are_generated_by_the_server(): void
    {
        $item = $this->actingAsDemo()->postJson('/api/v1/items', [
            'name' => 'Demo Generated Identifier Item',
            'categoryId' => 'CAT-CONS',
            'inventoryType' => 'consumable',
            'baseUnit' => 'EA',
            'trackingMode' => 'quantity',
            'ownershipMode' => 'company_owned',
        ])->assertCreated()->json('data');
        $this->assertStringStartsWith('DEMO-ITM-', $item['sku']);

        $site = $this->actingAsDemo()->postJson('/api/v1/sites', [
            'name' => 'Demo Generated Code Site',
            'entityCode' => 'PHATSEMA_PROJECTS',
            'type' => 'warehouse',
            'countryCode' => 'ZA',
            'timezone' => 'Africa/Johannesburg',
        ])->assertCreated()->json('data');
        $this->assertStringStartsWith('DEMO-STE-', $site['code']);

        $location = $this->actingAsDemo()->postJson("/api/v1/sites/{$site['id']}/locations", [
            'name' => 'Main Store',
            'type' => 'warehouse',
        ])->assertCreated()->json('data');
        $this->assertStringStartsWith('DEMO-LOC-', $location['code']);

        $asset = $this->actingAsDemo()->postJson('/api/v1/assets', [
            'name' => 'Demo Generated Number Asset',
            'type' => 'workshop_equipment',
            'ownershipMode' => 'company_owned',
            'make' => 'Demo',
            'model' => 'Generator',
            'serialNumber' => 'GEN-ID-UNIQUE-001',
            'siteId' => self::SITE_A,
        ])->assertCreated()->json('data');
        $this->assertStringStartsWith('DEMO-AST-', $asset['assetNumber']);
    }
}
