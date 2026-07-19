<?php

declare(strict_types=1);

namespace App\Application\Analytics;

use App\Domain\Analytics\AnalyticsReadRepository;
use App\Domain\Inventory\EstimatedInventoryValuation;

final readonly class ReportQueryService
{
    public function __construct(
        private AnalyticsReadRepository $analytics,
        private EstimatedInventoryValuation $valuation,
    ) {}

    // ── GET /reports/stock-on-hand ─────────────────────────────────────────────
    // Returns StockOnHandRow[], aggregated by (site, category)

    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function stockOnHand(array $user, ReportFilters $request): array
    {
        $store = $this->analytics;
        $balances = $store->getAllBalances();
        $items = array_column($store->getItems(), null, 'id');
        $cats = array_column($store->getCategories(), null, 'id');
        $sites = array_column($store->getSites(), null, 'id');

        if (! $user['all_sites']) {
            $balances = array_values(array_filter($balances, fn ($b) => in_array($b['site_id'], $user['assigned_site_ids'], true)));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $balances = array_values(array_filter($balances, fn ($b) => $b['site_id'] === $sId));
        }
        if ($request->query('categoryId')) {
            $catId = $request->query('categoryId');
            $balances = array_values(array_filter($balances, fn ($b) => ($items[$b['item_id']]['category_id'] ?? null) === $catId));
        }

        // Aggregate by (site_id, category_id)
        $groups = [];
        foreach ($balances as $b) {
            $item = $items[$b['item_id']] ?? [];
            $siteId = $b['site_id'];
            $catId = $item['category_id'] ?? 'UNCATEGORISED';
            $key = $siteId.'|'.$catId;
            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'siteId' => $siteId,
                    'siteName' => $sites[$siteId]['name'] ?? null,
                    'categoryId' => $catId,
                    'categoryName' => $cats[$catId]['name'] ?? 'Uncategorised',
                    'itemIds' => [],
                    'totalOnHand' => 0.0,
                    'stockValue' => 0.0,
                ];
            }
            $groups[$key]['itemIds'][] = $b['item_id'];
            $groups[$key]['totalOnHand'] += (float) ($b['qty'] ?? 0);
            $groups[$key]['stockValue'] += $this->valuation->value($item, (float) ($b['qty'] ?? 0));
        }

        $rows = array_values(array_map(function ($g) {
            $uniqueItems = count(array_unique($g['itemIds']));

            return [
                'siteId' => $g['siteId'],
                'siteName' => $g['siteName'],
                'categoryId' => $g['categoryId'],
                'categoryName' => $g['categoryName'],
                'itemCount' => $uniqueItems,
                'totalOnHand' => number_format($g['totalOnHand'], 2, '.', ''),
                'stockValue' => number_format($g['stockValue'], 2, '.', ''),
            ];
        }, $groups));

        // Sort by site, then category
        usort($rows, fn ($a, $b) => strcmp($a['siteName'].$a['categoryName'], $b['siteName'].$b['categoryName']));

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($rows);
        $rows = array_slice($rows, ($page - 1) * $pageSize, $pageSize);

        return [
            'data' => $rows,
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }

    // ── GET /reports/movements ─────────────────────────────────────────────────
    // Returns MovementSummaryRow[], aggregated by movementType

    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function movements(array $user, ReportFilters $request): array
    {
        $store = $this->analytics;
        $movements = $store->getMovements();

        if (! $user['all_sites']) {
            $movements = array_values(array_filter($movements, fn ($m) => in_array($m['site_id'], $user['assigned_site_ids'], true)));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $movements = array_values(array_filter($movements, fn ($m) => $m['site_id'] === $sId));
        }
        if ($request->query('from')) {
            $from = $request->query('from');
            $movements = array_values(array_filter($movements, fn ($m) => substr($m['created_at'], 0, 10) >= $from));
        }
        if ($request->query('to')) {
            $to = $request->query('to');
            $movements = array_values(array_filter($movements, fn ($m) => substr($m['created_at'], 0, 10) <= $to));
        }

        // Aggregate by movement type
        $groups = [];
        foreach ($movements as $m) {
            $type = $this->normaliseMovementType($m);
            if (! isset($groups[$type])) {
                $groups[$type] = ['movementType' => $type, 'count' => 0, 'totalQuantity' => 0.0];
            }
            $groups[$type]['count']++;
            $groups[$type]['totalQuantity'] += abs((float) ($m['qty'] ?? 0));
        }

        $rows = array_values(array_map(fn ($g) => [
            'movementType' => $g['movementType'],
            'count' => $g['count'],
            'totalQuantity' => number_format($g['totalQuantity'], 2, '.', ''),
        ], $groups));

        usort($rows, fn ($a, $b) => strcmp($a['movementType'], $b['movementType']));

        return [
            'data' => $rows,
            'meta' => ['page' => 1, 'pageSize' => count($rows), 'total' => count($rows), 'sort' => null],
        ];
    }

    /** @param array<string, mixed> $movement */
    private function normaliseMovementType(array $movement): string
    {
        if (($movement['type'] ?? null) !== 'adjustment') {
            return (string) ($movement['type'] ?? 'adjustment_increase');
        }

        return (float) ($movement['qty'] ?? 0) < 0
            ? 'adjustment_decrease'
            : 'adjustment_increase';
    }

    // ── GET /reports/transfers ─────────────────────────────────────────────────
    // Returns TransferReportRow[]

    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function transfers(array $user, ReportFilters $request): array
    {
        $store = $this->analytics;
        $transfers = $store->getTransfers();

        if (! $user['all_sites']) {
            $transfers = array_values(array_filter($transfers, fn ($t) => in_array($t['source_site_id'] ?? $t['from_site_id'] ?? null, $user['assigned_site_ids'], true) ||
                in_array($t['destination_site_id'] ?? $t['to_site_id'] ?? null, $user['assigned_site_ids'], true)
            ));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $transfers = array_values(array_filter($transfers, fn ($t) => ($t['source_site_id'] ?? $t['from_site_id'] ?? null) === $sId ||
                ($t['destination_site_id'] ?? $t['to_site_id'] ?? null) === $sId
            ));
        }

        $sites = array_column($store->getSites(), null, 'id');

        $rows = array_map(function ($t) use ($sites) {
            $srcSiteId = $t['source_site_id'] ?? $t['from_site_id'] ?? null;
            $dstSiteId = $t['destination_site_id'] ?? $t['to_site_id'] ?? null;
            $lines = $t['lines'] ?? [];
            $discrepancies = array_filter($lines, fn ($l) => ($l['discrepancyReason'] ?? $l['discrepancy_reason'] ?? null) !== null);

            // Compute cycle days (submitted → received)
            $cycleDays = null;
            $submitted = $t['submitted_at'] ?? null;
            $received = $t['received_at'] ?? null;
            if ($submitted && $received) {
                $diff = (strtotime($received) - strtotime($submitted)) / 86400;
                $cycleDays = round($diff, 1);
            }

            return [
                'transferId' => $t['id'],
                'transferNumber' => $t['transfer_number'] ?? $t['ref'] ?? $t['id'],
                'sourceSiteName' => $sites[$srcSiteId]['name'] ?? null,
                'destinationSiteName' => $sites[$dstSiteId]['name'] ?? null,
                'status' => $t['status'],
                'lineCount' => count($lines),
                'discrepancyCount' => count($discrepancies),
                'cycleDays' => $cycleDays,
            ];
        }, $transfers);

        usort($rows, fn ($a, $b) => strcmp($b['transferId'], $a['transferId']));

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($rows);
        $rows = array_slice($rows, ($page - 1) * $pageSize, $pageSize);

        return [
            'data' => $rows,
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }

    // ── GET /reports/count-variances ───────────────────────────────────────────
    // Returns CountVarianceRow[]

    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function countVariances(array $user, ReportFilters $request): array
    {
        $store = $this->analytics;
        $counts = $store->getCounts();
        $items = array_column($store->getItems(), null, 'id');
        $sites = array_column($store->getSites(), null, 'id');

        $locationMap = [];
        foreach ($store->getSites() as $s) {
            foreach ($store->getLocationsForSite($s['id']) as $l) {
                $locationMap[$l['id']] = $l;
            }
        }

        if (! $user['all_sites']) {
            $counts = array_values(array_filter($counts, fn ($c) => in_array($c['site_id'], $user['assigned_site_ids'], true)));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $counts = array_values(array_filter($counts, fn ($c) => $c['site_id'] === $sId));
        }

        $rows = [];
        foreach ($counts as $count) {
            foreach (($count['entries'] ?? []) as $entry) {
                $systemQty = $entry['system_qty'] ?? $entry['expected_qty'] ?? null;
                $countedQty = $entry['counted_qty'] ?? null;
                if ($systemQty === null || $countedQty === null) {
                    continue;
                }

                $variance = number_format((float) $countedQty - (float) $systemQty, 2, '.', '');
                $variancePct = (float) $systemQty !== 0.0
                    ? number_format(((float) $countedQty - (float) $systemQty) / abs((float) $systemQty) * 100, 2, '.', '')
                    : '0.00';

                $item = $items[$entry['item_id']] ?? [];
                $rows[] = [
                    'countId' => $count['id'],
                    'countNumber' => $count['count_number'] ?? $count['ref'] ?? $count['id'],
                    'siteName' => $sites[$count['site_id']]['name'] ?? null,
                    'locationName' => $locationMap[$count['location_id'] ?? '']['name'] ?? null,
                    'itemSku' => $item['code'] ?? null,
                    'itemName' => $item['name'] ?? null,
                    'expectedQuantity' => number_format((float) $systemQty, 2, '.', ''),
                    'countedQuantity' => number_format((float) $countedQty, 2, '.', ''),
                    'variance' => $variance,
                    'variancePercent' => $variancePct,
                    'status' => $count['status'],
                ];
            }
        }

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($rows);
        $rows = array_slice($rows, ($page - 1) * $pageSize, $pageSize);

        return [
            'data' => $rows,
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }

    // ── GET /reports/assets ────────────────────────────────────────────────────
    // Returns AssetReportRow[]

    /** @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function assets(array $user, ReportFilters $request): array
    {
        $store = $this->analytics;
        $assets = $store->getAssets();
        $sites = array_column($store->getSites(), null, 'id');

        if (! $user['all_sites']) {
            $assets = array_values(array_filter($assets, fn ($a) => in_array($a['site_id'], $user['assigned_site_ids'], true)));
        }
        if ($request->query('siteId')) {
            $sId = $request->query('siteId');
            $assets = array_values(array_filter($assets, fn ($a) => $a['site_id'] === $sId));
        }
        if ($request->query('status')) {
            $status = $request->query('status');
            $assets = array_values(array_filter($assets, fn ($a) => $a['status'] === $status));
        }

        $rows = array_map(function ($a) use ($sites) {
            // Compute service state
            $serviceState = 'ok';
            $nextServiceAt = $a['next_service_at'] ?? $a['service_due_at'] ?? null;
            if ($nextServiceAt) {
                $daysUntil = (strtotime($nextServiceAt) - time()) / 86400;
                if ($daysUntil < 0) {
                    $serviceState = 'overdue';
                } elseif ($daysUntil <= 30) {
                    $serviceState = 'due_soon';
                }
            }

            return [
                'assetId' => $a['id'],
                'assetNumber' => $a['asset_number'] ?? $a['code'] ?? $a['id'],
                'name' => $a['name'],
                'type' => $a['asset_type'] ?? $a['type'] ?? 'equipment',
                'status' => $a['status'],
                'siteName' => $sites[$a['site_id']]['name'] ?? null,
                'serviceState' => $serviceState,
                'nextServiceAt' => $nextServiceAt,
            ];
        }, $assets);

        usort($rows, fn ($a, $b) => strcmp($a['assetNumber'], $b['assetNumber']));

        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(200, max(1, (int) $request->query('pageSize', 50)));
        $total = count($rows);
        $rows = array_slice($rows, ($page - 1) * $pageSize, $pageSize);

        return [
            'data' => $rows,
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'sort' => null],
        ];
    }
}
