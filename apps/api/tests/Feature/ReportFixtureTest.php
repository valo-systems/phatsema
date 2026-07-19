<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class ReportFixtureTest extends TestCase
{
    public function test_default_reporting_window_contains_rich_movement_data(): void
    {
        $from = now('UTC')->subDays(30)->toDateString();
        $to = now('UTC')->toDateString();

        $response = $this->actingAsDemo()
            ->getJson("/api/v1/reports/movements?from={$from}&to={$to}")
            ->assertOk();

        $rows = $response->json('data');
        self::assertIsArray($rows);
        self::assertGreaterThanOrEqual(6, count($rows));

        $types = array_column($rows, 'movementType');
        self::assertContains('receipt', $types);
        self::assertContains('issue', $types);
        self::assertContains('adjustment_increase', $types);
        self::assertContains('adjustment_decrease', $types);
        self::assertContains('transfer_dispatch', $types);
        self::assertContains('transfer_receipt', $types);
        self::assertContains('count_variance', $types);
    }

    public function test_stock_on_hand_report_contains_positive_estimated_values(): void
    {
        $response = $this->actingAsDemo()
            ->getJson('/api/v1/reports/stock-on-hand')
            ->assertOk();

        $values = array_map(
            static fn (array $row): float => (float) $row['stockValue'],
            $response->json('data'),
        );

        self::assertNotEmpty($values);
        self::assertGreaterThan(0.0, array_sum($values));
    }
}
