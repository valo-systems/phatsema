<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Alerts\AlertRepository;
use App\Domain\Analytics\AnalyticsReadRepository;
use App\Domain\Assets\AssetRepository;
use App\Domain\Audit\AuditRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Counts\CountRepository;
use App\Domain\Demo\DemoRepository;
use App\Domain\Identity\IdentityRepository;
use App\Domain\Inventory\InventoryRepository;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Domain\Sites\SiteRepository;
use App\Domain\Transfers\TransferRepository;
use App\Infrastructure\DemoStore\DemoStore;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(DemoStore::class);

        foreach ([
            AlertRepository::class,
            AnalyticsReadRepository::class,
            AssetRepository::class,
            AuditRepository::class,
            CatalogueRepository::class,
            CountRepository::class,
            DemoRepository::class,
            IdentityRepository::class,
            InventoryRepository::class,
            ReferenceRepository::class,
            SequenceRepository::class,
            SiteRepository::class,
            TransferRepository::class,
            UnitOfWork::class,
        ] as $contract) {
            $this->app->alias(DemoStore::class, $contract);
        }
    }

    public function boot(): void
    {
        //
    }
}
