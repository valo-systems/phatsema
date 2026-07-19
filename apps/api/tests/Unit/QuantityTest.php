<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Inventory\Quantity;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class QuantityTest extends TestCase
{
    #[DataProvider('normalisationCases')]
    public function test_it_normalises_and_rounds_decimal_values(int|float|string $input, string $expected): void
    {
        self::assertSame($expected, Quantity::from($input)->toString());
    }

    /** @return iterable<string, array{int|float|string, string}> */
    public static function normalisationCases(): iterable
    {
        yield 'integer' => [2, '2.00'];
        yield 'one decimal' => ['2.1', '2.10'];
        yield 'three decimals' => ['2.104', '2.104'];
        yield 'round fourth decimal' => ['2.1055', '2.106'];
        yield 'negative' => ['-0.5', '-0.50'];
    }

    public function test_it_performs_arithmetic_without_floating_point_drift(): void
    {
        $result = Quantity::from('0.10')->add(Quantity::from('0.20'))->subtract(Quantity::from('0.05'));

        self::assertSame('0.25', $result->toString());
    }

    public function test_it_rejects_non_numeric_input(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Quantity::from('12 litres');
    }
}
