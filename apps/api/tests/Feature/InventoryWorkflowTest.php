<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class InventoryWorkflowTest extends TestCase
{
    public function test_receipt_and_issue_create_immutable_ledger_entries_with_decimal_balances(): void
    {
        $receipt = $this->actingAsDemo()->postJson('/api/v1/receipts', [
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'reference' => 'DEMO-PO-TEST',
            'receivedAt' => now()->toDateString(),
            'lines' => [['itemId' => self::ITEM_A, 'quantity' => '10.25']],
        ])->assertCreated()
            ->assertJsonPath('data.0.quantity', '10.25')
            ->assertJsonPath('data.0.quantityAfter', '255.25');

        $movementId = $receipt->json('data.0.id');

        $this->actingAsDemo()->postJson('/api/v1/issues', [
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'purpose' => 'maintenance',
            'recipient' => 'DEMO-Crusher Team',
            'lines' => [['itemId' => self::ITEM_A, 'quantity' => '5.10']],
        ])->assertCreated()
            ->assertJsonPath('data.0.quantity', '-5.10')
            ->assertJsonPath('data.0.quantityAfter', '250.15');

        $this->actingAsDemo()->postJson("/api/v1/movements/{$movementId}/reverse", [
            'reasonCode' => 'RSN-REVS',
            'notes' => 'DEMO correction',
        ])->assertCreated()
            ->assertJsonPath('data.0.reversalOfId', $movementId)
            ->assertJsonPath('data.0.quantity', '-10.25');
    }

    public function test_issue_cannot_create_negative_stock(): void
    {
        $this->actingAsDemo()->postJson('/api/v1/issues', [
            'siteId' => self::SITE_A,
            'locationId' => self::LOCATION_A,
            'purpose' => 'maintenance',
            'recipient' => 'DEMO-Crusher Team',
            'lines' => [['itemId' => self::ITEM_A, 'quantity' => '9999.00']],
        ])->assertUnprocessable()
            ->assertJsonPath('type', 'https://portal.phatsema.example/problems/insufficient-stock');
    }
}
