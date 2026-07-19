<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class CountAndAssetWorkflowTest extends TestCase
{
    public function test_count_entries_have_stable_ids_and_can_be_posted(): void
    {
        $count = $this->actingAsDemo()->postJson('/api/v1/counts', [
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'scope' => 'selected_items',
            'scopeItemIds' => [self::ITEM_A],
            'blindCount' => true,
        ])->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.entries.0.expectedQuantity', null)
            ->json('data');

        $id = $count['id'];
        $entryId = $count['entries'][0]['id'];
        $this->actingAsDemo()->postJson("/api/v1/counts/{$id}/start", ['version' => 1])
            ->assertOk()->assertJsonPath('data.status', 'in_progress');
        $this->actingAsDemo()->postJson("/api/v1/counts/{$id}/entries", [
            'version' => 2,
            'entries' => [['entryId' => $entryId, 'countedQuantity' => '244.00']],
        ])->assertOk()->assertJsonPath('data.entries.0.countedQuantity', '244.00');
        $this->actingAsDemo()->postJson("/api/v1/counts/{$id}/submit", ['version' => 3])
            ->assertOk()->assertJsonPath('data.entries.0.expectedQuantity', '245.00');
        $this->actingAsDemo('01JZFIX0000000000000000002')->postJson("/api/v1/counts/{$id}/approve", [
            'version' => 4,
            'note' => 'Verified one-unit variance against the count sheet.',
        ])
            ->assertOk()->assertJsonPath('data.status', 'reviewed');
        $this->actingAsDemo()->postJson("/api/v1/counts/{$id}/post", ['version' => 5])
            ->assertOk()->assertJsonPath('data.status', 'posted');
    }

    public function test_asset_commands_follow_contract_and_optimistic_concurrency(): void
    {
        $asset = $this->actingAsDemo()->postJson('/api/v1/assets', [
            'assetNumber' => 'DEMO-AST-TEST',
            'name' => 'DEMO Workshop Compressor',
            'type' => 'workshop_equipment',
            'ownershipMode' => 'company_owned',
            'make' => 'DEMO-Make',
            'model' => 'DEMO-Model',
            'serialNumber' => 'DEMO-SERIAL',
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'meterType' => 'hours',
            'meterReading' => '100.00',
        ])->assertCreated()->assertJsonPath('data.status', 'available')->json('data');

        $id = $asset['id'];
        $this->actingAsDemo()->postJson("/api/v1/assets/{$id}/assign", [
            'version' => 1,
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'assignedTo' => 'DEMO Workshop Lead',
        ])->assertOk()->assertJsonPath('data.status', 'assigned');
        $this->actingAsDemo()->postJson("/api/v1/assets/{$id}/meter-reading", [
            'version' => 2,
            'reading' => '102.50',
            'readAt' => now()->toDateString(),
        ])->assertOk()->assertJsonPath('data.meterReading', '102.50');
        $this->actingAsDemo()->postJson("/api/v1/assets/{$id}/status", [
            'version' => 2,
            'status' => 'in_maintenance',
        ])->assertConflict();
    }
}
