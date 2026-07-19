<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

use InvalidArgumentException;

final readonly class Quantity
{
    private const SCALE = 3;

    private function __construct(private int $minorUnits) {}

    public static function from(int|float|string $value): self
    {
        $raw = trim((string) $value);
        if (! preg_match('/^-?\d+(?:\.\d+)?$/', $raw)) {
            throw new InvalidArgumentException('Quantity must be numeric.');
        }

        $negative = str_starts_with($raw, '-');
        $unsigned = ltrim($raw, '+-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $fraction = str_pad(substr($fraction, 0, self::SCALE + 1), self::SCALE + 1, '0');
        $minor = ((int) $whole * 1000) + (int) substr($fraction, 0, self::SCALE);

        if ((int) $fraction[self::SCALE] >= 5) {
            $minor++;
        }

        return new self($negative ? -$minor : $minor);
    }

    public function add(self $other): self
    {
        return new self($this->minorUnits + $other->minorUnits);
    }

    public function subtract(self $other): self
    {
        return new self($this->minorUnits - $other->minorUnits);
    }

    public function negate(): self
    {
        return new self(-$this->minorUnits);
    }

    public function isNegative(): bool
    {
        return $this->minorUnits < 0;
    }

    public function isZero(): bool
    {
        return $this->minorUnits === 0;
    }

    public function greaterThan(self $other): bool
    {
        return $this->minorUnits > $other->minorUnits;
    }

    public function toString(): string
    {
        $absolute = abs($this->minorUnits);
        $whole = intdiv($absolute, 1000);
        $fraction = sprintf('%03d', $absolute % 1000);
        $displayFraction = str_pad(rtrim($fraction, '0'), 2, '0');
        $value = sprintf('%d.%s', $whole, $displayFraction);

        return $this->minorUnits < 0 ? "-{$value}" : $value;
    }
}
