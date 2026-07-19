<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected const ADMIN_ID = '01JZFIX0000000000000000001';

    protected const EXECUTIVE_ID = '01JZFIX0000000000000000005';

    protected const SITE_A = '01JZABC001GABORONE0000001';

    protected const SITE_B = '01JZABC002FRANCIST0000002';

    protected const LOCATION_A = '01JZLOC001GAB0000000000001';

    protected const LOCATION_B = '01JZLOC005FRA0000000000005';

    protected const ITEM_A = '01JZITM0000000000000000001';

    protected function actingAsDemo(string $userId = self::ADMIN_ID): static
    {
        return $this->withSession(['auth_user_id' => $userId]);
    }
}
