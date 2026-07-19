<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class TransferWorkflowTest extends TestCase
{
    public function test_full_transfer_workflow_enforces_versions_and_reaches_received(): void
    {
        $created = $this->actingAsDemo()->postJson('/api/v1/transfers', [
            'sourceSiteId' => self::SITE_A,
            'sourceLocationId' => self::LOCATION_A,
            'destinationSiteId' => self::SITE_B,
            'destinationLocationId' => self::LOCATION_B,
            'lines' => [['itemId' => self::ITEM_A, 'requestedQuantity' => '4.00']],
        ])->assertCreated()->json('data');

        $id = $created['id'];
        $this->actingAsDemo()->postJson("/api/v1/transfers/{$id}/submit", ['version' => 1])
            ->assertOk()->assertJsonPath('data.status', 'submitted');
        $this->actingAsDemo('01JZFIX0000000000000000002')->postJson("/api/v1/transfers/{$id}/approve", ['version' => 2])
            ->assertOk()->assertJsonPath('data.status', 'approved');
        $this->actingAsDemo()->getJson('/api/v1/balances?itemId='.self::ITEM_A.'&locationId='.self::LOCATION_A)
            ->assertOk()->assertJsonPath('data.0.reserved', '4.00');
        $this->actingAsDemo()->postJson("/api/v1/transfers/{$id}/dispatch", [
            'version' => 3,
            'lines' => [['lineId' => $created['lines'][0]['id'], 'dispatchedQuantity' => '4.00']],
        ])->assertOk()->assertJsonPath('data.status', 'dispatched');
        $this->actingAsDemo()->postJson("/api/v1/transfers/{$id}/receive", [
            'version' => 4,
            'lines' => [[
                'lineId' => $created['lines'][0]['id'],
                'receivedQuantity' => '3.50',
                'rejectedQuantity' => '0.50',
                'discrepancyReason' => 'DEMO damaged in transit',
            ]],
        ])->assertOk()
            ->assertJsonPath('data.status', 'received')
            ->assertJsonPath('data.hasDiscrepancy', true);

        $movementTypes = array_column(
            $this->actingAsDemo()->getJson('/api/v1/movements')->assertOk()->json('data'),
            'movementType',
        );
        $this->assertContains('transfer_dispatch', $movementTypes);
        $this->assertContains('transfer_receipt', $movementTypes);

        $this->actingAsDemo()->postJson("/api/v1/transfers/{$id}/approve", ['version' => 2])
            ->assertConflict();
    }
}
