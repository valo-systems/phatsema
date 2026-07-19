<?php

declare(strict_types=1);

namespace App\Infrastructure\DemoStore;

final class DemoFixtures
{
    /** @return array<string, mixed> */
    public static function build(): array
    {
        return FixtureFactory::build();
    }
}
