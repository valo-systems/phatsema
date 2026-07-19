import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { useSiteScope } from '@/shared/site-scope';
import { useItemCategories } from '@/shared/api/reference';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { ErrorState } from '@/shared/ui/states';
import { Select, DatePicker } from '@/shared/ui/controls';
import { StatusPill } from '@/shared/ui/Badge';
import { Tabs, TabPanel } from '@/shared/ui/overlays';
import { formatMoney, formatQuantity, label, todayISODate } from '@/shared/format/format';

type StockOnHandRow = components['schemas']['StockOnHandRow'];
type MovementSummaryRow = components['schemas']['MovementSummaryRow'];
type TransferReportRow = components['schemas']['TransferReportRow'];
type CountVarianceRow = components['schemas']['CountVarianceRow'];
type AssetReportRow = components['schemas']['AssetReportRow'];

const THIRTY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
})();

export function ReportsPage() {
  const session = useSession();
  const [tab, setTab] = useState('stock');

  if (!can(session.data, P.reportView)) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted">You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Operational summaries and downloadable data exports for the current demo session."
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'stock', label: 'Stock on hand' },
          { value: 'movements', label: 'Movements' },
          { value: 'transfers', label: 'Transfers' },
          { value: 'variances', label: 'Count variances' },
          { value: 'assets', label: 'Assets' },
        ]}
      >
        <TabPanel value="stock">
          <StockOnHandReport />
        </TabPanel>
        <TabPanel value="movements">
          <MovementsReport />
        </TabPanel>
        <TabPanel value="transfers">
          <TransfersReport />
        </TabPanel>
        <TabPanel value="variances">
          <VariancesReport />
        </TabPanel>
        <TabPanel value="assets">
          <AssetsReport />
        </TabPanel>
      </Tabs>
    </div>
  );
}

function StockOnHandReport() {
  const { siteId } = useSiteScope();
  const categories = useItemCategories();
  const [categoryId, setCategoryId] = useState('');

  const report = useQuery({
    queryKey: ['reports', 'stock-on-hand', siteId, categoryId],
    queryFn: async () =>
      unwrap<{ data: StockOnHandRow[] }>(
        await api.GET('/reports/stock-on-hand', {
          params: { query: { ...(siteId ? { siteId } : {}), ...(categoryId ? { categoryId } : {}) } },
        }),
      ).data,
  });

  const columns: Array<DataTableColumn<StockOnHandRow>> = [
    { key: 'siteName', header: 'Site', cell: (r) => r.siteName, text: (r) => r.siteName },
    { key: 'categoryName', header: 'Category', cell: (r) => r.categoryName, text: (r) => r.categoryName },
    {
      key: 'itemCount',
      header: 'Items',
      numeric: true,
      cell: (r) => String(r.itemCount),
      text: (r) => String(r.itemCount),
    },
    {
      key: 'totalOnHand',
      header: 'Total on hand',
      numeric: true,
      cell: (r) => <span data-numeric>{formatQuantity(r.totalOnHand)}</span>,
      text: (r) => r.totalOnHand,
    },
    {
      key: 'stockValue',
      header: 'Stock value',
      numeric: true,
      cell: (r) => <span data-numeric>{formatMoney(r.stockValue)}</span>,
      text: (r) => r.stockValue,
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Stock on hand by site and category"
        actions={
          <Select
            aria-label="Filter by category"
            className="w-44"
            value={categoryId}
            onValueChange={setCategoryId}
            options={(categories.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
            placeholder="All categories"
            clearable
          />
        }
      />
      {report.isError ? (
        <div className="p-4"><ErrorState error={report.error} onRetry={() => void report.refetch()} /></div>
      ) : (
        <DataTable
          caption="Stock on hand"
          columns={columns}
          rows={report.data}
          rowKey={(r) => `${r.siteId}-${r.categoryId}`}
          loading={report.isPending}
          csvName="phatsema-stock-on-hand"
          empty={{ title: 'No stock data', description: 'No stock records match the current filters.' }}
        />
      )}
    </Card>
  );
}

function MovementsReport() {
  const { siteId } = useSiteScope();
  const [from, setFrom] = useState(THIRTY_DAYS_AGO);
  const [to, setTo] = useState(todayISODate());

  const report = useQuery({
    queryKey: ['reports', 'movements', siteId, from, to],
    queryFn: async () =>
      unwrap<{ data: MovementSummaryRow[] }>(
        await api.GET('/reports/movements', {
          params: { query: { ...(siteId ? { siteId } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) } },
        }),
      ).data,
  });

  const columns: Array<DataTableColumn<MovementSummaryRow>> = [
    {
      key: 'movementType',
      header: 'Type',
      cell: (r) => label(r.movementType),
      text: (r) => label(r.movementType),
    },
    {
      key: 'count',
      header: 'Count',
      numeric: true,
      cell: (r) => String(r.count),
      text: (r) => String(r.count),
    },
    {
      key: 'totalQuantity',
      header: 'Total quantity',
      numeric: true,
      cell: (r) => <span data-numeric>{formatQuantity(r.totalQuantity)}</span>,
      text: (r) => r.totalQuantity,
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Movement summary by type"
        actions={
          <span className="flex gap-2">
            <DatePicker aria-label="From date" value={from} max={to} onValueChange={setFrom} className="w-40" />
            <DatePicker aria-label="To date" value={to} min={from} max={todayISODate()} onValueChange={setTo} className="w-40" />
          </span>
        }
      />
      {report.isError ? (
        <div className="p-4"><ErrorState error={report.error} onRetry={() => void report.refetch()} /></div>
      ) : (
        <DataTable
          caption="Movement summary"
          columns={columns}
          rows={report.data}
          rowKey={(r) => r.movementType}
          loading={report.isPending}
          csvName="phatsema-movements-summary"
          empty={{ title: 'No movement data', description: 'No movements recorded in this period.' }}
        />
      )}
    </Card>
  );
}

function TransfersReport() {
  const { siteId } = useSiteScope();

  const report = useQuery({
    queryKey: ['reports', 'transfers', siteId],
    queryFn: async () =>
      unwrap<{ data: TransferReportRow[] }>(
        await api.GET('/reports/transfers', { params: { query: { ...(siteId ? { siteId } : {}) } } }),
      ).data,
  });

  const columns: Array<DataTableColumn<TransferReportRow>> = [
    {
      key: 'transferNumber',
      header: 'Number',
      cell: (r) => <span data-numeric>{r.transferNumber}</span>,
      text: (r) => r.transferNumber,
    },
    { key: 'sourceSiteName', header: 'From', cell: (r) => r.sourceSiteName, text: (r) => r.sourceSiteName },
    { key: 'destinationSiteName', header: 'To', cell: (r) => r.destinationSiteName, text: (r) => r.destinationSiteName },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusPill status={r.status} />,
      text: (r) => label(r.status),
    },
    {
      key: 'lineCount',
      header: 'Lines',
      numeric: true,
      cell: (r) => String(r.lineCount),
      text: (r) => String(r.lineCount),
    },
    {
      key: 'discrepancyCount',
      header: 'Discrepancies',
      numeric: true,
      cell: (r) => r.discrepancyCount > 0
        ? <span className="font-medium text-danger" data-numeric>{r.discrepancyCount}</span>
        : <span className="text-faint">0</span>,
      text: (r) => String(r.discrepancyCount),
    },
    {
      key: 'cycleDays',
      header: 'Cycle days',
      numeric: true,
      cell: (r) => r.cycleDays != null ? <span data-numeric>{r.cycleDays}d</span> : <span className="text-faint">Not available</span>,
      text: (r) => r.cycleDays != null ? String(r.cycleDays) : '',
    },
  ];

  return (
    <Card>
      <CardHeader title="Transfer performance" />
      {report.isError ? (
        <div className="p-4"><ErrorState error={report.error} onRetry={() => void report.refetch()} /></div>
      ) : (
        <DataTable
          caption="Transfers"
          columns={columns}
          rows={report.data}
          rowKey={(r) => r.transferId}
          loading={report.isPending}
          csvName="phatsema-transfers-report"
          empty={{ title: 'No transfer data', description: 'No completed transfers to report on.' }}
        />
      )}
    </Card>
  );
}

function VariancesReport() {
  const { siteId } = useSiteScope();

  const report = useQuery({
    queryKey: ['reports', 'count-variances', siteId],
    queryFn: async () =>
      unwrap<{ data: CountVarianceRow[] }>(
        await api.GET('/reports/count-variances', { params: { query: { ...(siteId ? { siteId } : {}) } } }),
      ).data,
  });

  const columns: Array<DataTableColumn<CountVarianceRow>> = [
    { key: 'countNumber', header: 'Count', cell: (r) => <span data-numeric>{r.countNumber}</span>, text: (r) => r.countNumber },
    { key: 'siteName', header: 'Site', cell: (r) => r.siteName, text: (r) => r.siteName },
    { key: 'itemSku', header: 'SKU', cell: (r) => <span data-numeric>{r.itemSku}</span>, text: (r) => r.itemSku },
    { key: 'itemName', header: 'Item', priority: 'secondary', hideBelow: 'md', cell: (r) => r.itemName, text: (r) => r.itemName },
    {
      key: 'expectedQuantity',
      header: 'Expected',
      numeric: true,
      cell: (r) => <span data-numeric>{formatQuantity(r.expectedQuantity)}</span>,
      text: (r) => r.expectedQuantity,
    },
    {
      key: 'countedQuantity',
      header: 'Counted',
      numeric: true,
      cell: (r) => <span data-numeric>{formatQuantity(r.countedQuantity)}</span>,
      text: (r) => r.countedQuantity,
    },
    {
      key: 'variance',
      header: 'Variance',
      numeric: true,
      cell: (r) => (
        <span
          className={Number(r.variance) < 0 ? 'font-medium text-danger' : Number(r.variance) > 0 ? 'font-medium text-success' : 'text-muted'}
          data-numeric
        >
          {Number(r.variance) > 0 ? '+' : ''}{formatQuantity(r.variance)}
        </span>
      ),
      text: (r) => r.variance,
    },
    {
      key: 'status',
      header: 'Count status',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (r) => <StatusPill status={r.status} />,
      text: (r) => label(r.status),
    },
  ];

  return (
    <Card>
      <CardHeader title="Count variances" />
      {report.isError ? (
        <div className="p-4"><ErrorState error={report.error} onRetry={() => void report.refetch()} /></div>
      ) : (
        <DataTable
          caption="Count variances"
          columns={columns}
          rows={report.data}
          rowKey={(r) => `${r.countId}-${r.itemSku}`}
          loading={report.isPending}
          csvName="phatsema-count-variances"
          empty={{ title: 'No variance data', description: 'No count variances have been recorded.' }}
        />
      )}
    </Card>
  );
}

function AssetsReport() {
  const { siteId } = useSiteScope();

  const report = useQuery({
    queryKey: ['reports', 'assets', siteId],
    queryFn: async () =>
      unwrap<{ data: AssetReportRow[] }>(
        await api.GET('/reports/assets', { params: { query: { ...(siteId ? { siteId } : {}) } } }),
      ).data,
  });

  const SERVICE_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
    ok: 'success',
    due_soon: 'warning',
    overdue: 'danger',
  };

  const columns: Array<DataTableColumn<AssetReportRow>> = [
    {
      key: 'assetNumber',
      header: 'Asset no.',
      cell: (r) => <span data-numeric>{r.assetNumber}</span>,
      text: (r) => r.assetNumber,
    },
    { key: 'name', header: 'Name', cell: (r) => r.name, text: (r) => r.name },
    { key: 'type', header: 'Type', priority: 'secondary', hideBelow: 'md', cell: (r) => label(r.type), text: (r) => label(r.type) },
    { key: 'siteName', header: 'Site', cell: (r) => r.siteName, text: (r) => r.siteName },
    { key: 'status', header: 'Status', cell: (r) => <StatusPill status={r.status} />, text: (r) => label(r.status) },
    {
      key: 'serviceState',
      header: 'Service',
      cell: (r) => (
        <span className={`text-sm font-medium text-${SERVICE_TONE[r.serviceState] ?? 'muted'}`}>
          {label(r.serviceState)}
        </span>
      ),
      text: (r) => label(r.serviceState),
    },
    {
      key: 'nextServiceAt',
      header: 'Next service',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (r) => r.nextServiceAt ?? <span className="text-faint">Not scheduled</span>,
      text: (r) => r.nextServiceAt ?? '',
    },
  ];

  return (
    <Card>
      <CardHeader title="Asset register" />
      {report.isError ? (
        <div className="p-4"><ErrorState error={report.error} onRetry={() => void report.refetch()} /></div>
      ) : (
        <DataTable
          caption="Assets"
          columns={columns}
          rows={report.data}
          rowKey={(r) => r.assetId}
          loading={report.isPending}
          csvName="phatsema-assets-report"
          empty={{ title: 'No asset data', description: 'No assets registered.' }}
        />
      )}
    </Card>
  );
}
