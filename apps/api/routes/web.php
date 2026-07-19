<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AlertsController;
use App\Http\Controllers\Api\V1\AssetsController;
use App\Http\Controllers\Api\V1\AuditController;
use App\Http\Controllers\Api\V1\Auth\CsrfCookieController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\BalancesController;
use App\Http\Controllers\Api\V1\CountsController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DemoController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\ItemsController;
use App\Http\Controllers\Api\V1\LocationsController;
use App\Http\Controllers\Api\V1\MovementsController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReferenceController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\SitesController;
use App\Http\Controllers\Api\V1\StockActionsController;
use App\Http\Controllers\Api\V1\TransfersController;
use App\Http\Controllers\Api\V1\UsersController;
use Illuminate\Support\Facades\Route;

// All routes are under the `web` middleware group (session + cookies).
// CSRF exceptions for public/unauthenticated endpoints are declared in bootstrap/app.php.

Route::prefix('api/v1')->group(function (): void {

    // ─── Public ────────────────────────────────────────────────────────────────
    Route::get('/health', HealthController::class);
    Route::get('/csrf-cookie', CsrfCookieController::class);
    Route::post('/auth/login', LoginController::class);

    // ─── Authenticated ─────────────────────────────────────────────────────────
    Route::middleware('auth.demo')->group(function (): void {

        Route::post('/auth/logout', LogoutController::class);
        Route::get('/auth/me', MeController::class);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/password', [ProfileController::class, 'password']);

        Route::get('/users', [UsersController::class, 'index'])->middleware('perm:user.manage');
        Route::post('/users', [UsersController::class, 'store'])->middleware('perm:user.manage');
        Route::patch('/users/{userId}', [UsersController::class, 'update'])->middleware('perm:user.manage');
        Route::get('/roles', [UsersController::class, 'roles'])->middleware('perm:user.manage');

        // Demo reset (admin only)
        Route::post('/demo/reset', [DemoController::class, 'reset'])->middleware('perm:demo.reset');

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Reference data
        Route::get('/reference/item-categories', [ReferenceController::class, 'categories']);
        Route::get('/reference/units', [ReferenceController::class, 'units']);
        Route::get('/reference/reasons', [ReferenceController::class, 'reasons']);
        Route::get('/reference/departments', [ReferenceController::class, 'departments']);

        // Sites & Locations
        Route::get('/sites', [SitesController::class, 'index'])->middleware('perm:inventory.view');
        Route::post('/sites', [SitesController::class, 'store'])->middleware('perm:site.manage');
        Route::get('/sites/{siteId}', [SitesController::class, 'show'])->middleware('perm:inventory.view');
        Route::patch('/sites/{siteId}', [SitesController::class, 'update'])->middleware('perm:site.manage');
        Route::get('/sites/{siteId}/locations', [LocationsController::class, 'index']);
        Route::post('/sites/{siteId}/locations', [LocationsController::class, 'store'])->middleware('perm:site.manage');
        Route::patch('/locations/{locationId}', [LocationsController::class, 'update'])->middleware('perm:site.manage');

        // Items
        Route::get('/items', [ItemsController::class, 'index'])->middleware('perm:inventory.view');
        Route::post('/items', [ItemsController::class, 'store'])->middleware('perm:catalogue.manage');
        Route::get('/items/{itemId}', [ItemsController::class, 'show'])->middleware('perm:inventory.view');
        Route::patch('/items/{itemId}', [ItemsController::class, 'update'])->middleware('perm:catalogue.manage');
        Route::get('/items/{itemId}/balances', [BalancesController::class, 'forItem'])->middleware('perm:inventory.view');

        // Balances & Movements
        Route::get('/balances', [BalancesController::class, 'index'])->middleware('perm:inventory.view');
        Route::get('/movements', [MovementsController::class, 'index'])->middleware('perm:inventory.view');
        Route::get('/movements/{movementId}', [MovementsController::class, 'show'])->middleware('perm:inventory.view');
        Route::post('/movements/{movementId}/reverse', [MovementsController::class, 'reverse'])->middleware('perm:inventory.adjust');

        // Stock actions
        Route::post('/receipts', [StockActionsController::class, 'receipt'])->middleware('perm:inventory.receive');
        Route::post('/issues', [StockActionsController::class, 'issue'])->middleware('perm:inventory.issue');
        Route::post('/adjustments', [StockActionsController::class, 'adjustment'])->middleware('perm:inventory.adjust');

        // Transfers
        Route::get('/transfers', [TransfersController::class, 'index'])->middleware('perm:inventory.view');
        Route::post('/transfers', [TransfersController::class, 'store'])->middleware('perm:transfer.create');
        Route::get('/transfers/{transferId}', [TransfersController::class, 'show'])->middleware('perm:inventory.view');
        Route::patch('/transfers/{transferId}', [TransfersController::class, 'update'])->middleware('perm:transfer.create');
        Route::post('/transfers/{transferId}/submit', [TransfersController::class, 'submit'])->middleware('perm:transfer.create');
        Route::post('/transfers/{transferId}/approve', [TransfersController::class, 'approve'])->middleware('perm:transfer.approve');
        Route::post('/transfers/{transferId}/dispatch', [TransfersController::class, 'dispatch'])->middleware('perm:transfer.dispatch');
        Route::post('/transfers/{transferId}/receive', [TransfersController::class, 'receive'])->middleware('perm:transfer.receive');
        Route::post('/transfers/{transferId}/cancel', [TransfersController::class, 'cancel'])->middleware('perm:transfer.create');

        // Counts
        Route::get('/counts', [CountsController::class, 'index'])->middleware('perm:inventory.view');
        Route::post('/counts', [CountsController::class, 'store'])->middleware('perm:count.create');
        Route::get('/counts/{countId}', [CountsController::class, 'show'])->middleware('perm:inventory.view');
        Route::patch('/counts/{countId}', [CountsController::class, 'update'])->middleware('perm:count.create');
        Route::post('/counts/{countId}/start', [CountsController::class, 'start'])->middleware('perm:count.create');
        Route::post('/counts/{countId}/entries', [CountsController::class, 'entries'])->middleware('perm:count.create');
        Route::post('/counts/{countId}/submit', [CountsController::class, 'submit'])->middleware('perm:count.create');
        Route::post('/counts/{countId}/request-recount', [CountsController::class, 'requestRecount'])->middleware('perm:count.review');
        Route::post('/counts/{countId}/approve', [CountsController::class, 'approve'])->middleware('perm:count.review');
        Route::post('/counts/{countId}/post', [CountsController::class, 'post'])->middleware('perm:count.post');

        // Assets
        Route::get('/assets', [AssetsController::class, 'index'])->middleware('perm:asset.view');
        Route::post('/assets', [AssetsController::class, 'store'])->middleware('perm:asset.manage');
        Route::get('/assets/{assetId}', [AssetsController::class, 'show'])->middleware('perm:asset.view');
        Route::patch('/assets/{assetId}', [AssetsController::class, 'update'])->middleware('perm:asset.manage');
        Route::post('/assets/{assetId}/assign', [AssetsController::class, 'assign'])->middleware('perm:asset.manage');
        Route::post('/assets/{assetId}/status', [AssetsController::class, 'statusChange'])->middleware('perm:asset.manage');
        Route::post('/assets/{assetId}/meter-reading', [AssetsController::class, 'meterReading'])->middleware('perm:asset.manage');

        // Alerts
        Route::get('/alerts', [AlertsController::class, 'index']);
        Route::post('/alerts/{alertId}/read', [AlertsController::class, 'markRead']);

        // Reports
        Route::get('/reports/stock-on-hand', [ReportsController::class, 'stockOnHand'])->middleware('perm:report.view');
        Route::get('/reports/movements', [ReportsController::class, 'movements'])->middleware('perm:report.view');
        Route::get('/reports/transfers', [ReportsController::class, 'transfers'])->middleware('perm:report.view');
        Route::get('/reports/count-variances', [ReportsController::class, 'countVariances'])->middleware('perm:report.view');
        Route::get('/reports/assets', [ReportsController::class, 'assets'])->middleware('perm:report.view');

        // Audit
        Route::get('/audit-events', [AuditController::class, 'index'])->middleware('perm:audit.view');
        Route::get('/audit-events/{eventId}', [AuditController::class, 'show'])->middleware('perm:audit.view');
    });
});

// cPanel serves the React build from this same public directory. API misses must
// remain JSON 404s, while browser routes return the SPA entry point.
Route::fallback(function () {
    if (request()->is('api/*')) {
        abort(404);
    }

    $index = public_path('index.html');
    abort_unless(is_file($index), 404);

    return response()->file($index);
});
