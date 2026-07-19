import { useNavigate } from 'react-router';
import { CircleCheckBig, Layers3, PackageX, TriangleAlert } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useDebouncedValue } from '@/shared/hooks/useDebounce';
import { useSiteScope } from '@/shared/site-scope';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { QuantityCell, RecordIdentifier } from '@/shared/ui/data/DataCells';
import { enumOptions, STOCK_HEALTH_VALUES } from '@/shared/ui/controls/options';
import { StatusPill } from '@/shared/ui/Badge';
import { formatQuantity, label } from '@/shared/format/format';
import { useBalances, type BalancesQuery, type StockBalance } from './api';

const FILTER_KEYS = ['stockHealth'] as const;

export function BalancesPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const debouncedQ = useDebouncedValue(state.q);
  const { siteId } = useSiteScope();
  const navigate = useNavigate();

  const query: BalancesQuery = {
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['stockHealth']
      ? { stockHealth: state.filters['stockHealth'] as NonNullable<BalancesQuery['stockHealth']> }
      : {}),
  };

  const balances = useBalances(query);

  const columns: Array<DataTableColumn<StockBalance>> = [
    {
      key: 'itemSku',
      header: 'SKU',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (row) => <RecordIdentifier value={row.itemSku} />,
      text: (row) => row.itemSku,
    },
    { key: 'itemName', header: 'Item', cell: (row) => row.itemName, text: (row) => row.itemName },
    { key: 'siteName', header: 'Site', sortable: true, cell: (row) => row.siteName, text: (row) => row.siteName },
    {
      key: 'locationName',
      header: 'Location',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (row) => row.locationName,
      text: (row) => row.locationName,
    },
    {
      key: 'onHand',
      header: 'On hand',
      numeric: true,
      priority: 'secondary',
      hideBelow: 'md',
      cell: (row) => formatQuantity(row.onHand, row.unit),
      text: (row) => row.onHand,
    },
    {
      key: 'reserved',
      header: 'Reserved',
      numeric: true,
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (row) => formatQuantity(row.reserved),
      text: (row) => row.reserved,
    },
    {
      key: 'available',
      header: 'Available',
      numeric: true,
      sortable: true,
      cell: (row) => <QuantityCell emphasized>{formatQuantity(row.available, row.unit)}</QuantityCell>,
      text: (row) => row.available,
    },
    {
      key: 'stockHealth',
      header: 'Health',
      cell: (row) => <StatusPill status={row.stockHealth} />,
      text: (row) => label(row.stockHealth),
    },
  ];
  const visibleBalances = balances.data?.data ?? [];

  return (
    <DataPageShell
        title="Stock balances"
        description="Current on-hand, reserved, in-transit, and available quantities by item, site, and location."
    >

      <DataTable
        caption="Stock balances"
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Balance positions',
                value: balances.data?.meta.total ?? 0,
                hint: 'All matching item locations',
                icon: <Layers3 aria-hidden className="size-4" />,
              },
              {
                label: 'Healthy',
                value: visibleBalances.filter((balance) => balance.stockHealth === 'healthy').length,
                hint: 'Visible healthy balances',
                tone: 'success',
                icon: <CircleCheckBig aria-hidden className="size-4" />,
              },
              {
                label: 'Low stock',
                value: visibleBalances.filter((balance) => balance.stockHealth === 'low').length,
                hint: 'Visible balances below target',
                tone: 'warning',
                icon: <TriangleAlert aria-hidden className="size-4" />,
              },
              {
                label: 'Out of stock',
                value: visibleBalances.filter((balance) => balance.stockHealth === 'out_of_stock').length,
                hint: 'Visible empty balances',
                tone: 'danger',
                icon: <PackageX aria-hidden className="size-4" />,
              },
            ]}
          />
        }
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search balances"
            searchPlaceholder="Search item…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'stockHealth',
                label: 'Health',
                placeholder: 'All health',
                options: enumOptions(STOCK_HEALTH_VALUES),
                width: 'w-40',
              },
            ]}
          />
        }
        columns={columns}
        rows={balances.data?.data}
        rowKey={(row) => `${row.itemId}-${row.siteId}-${row.locationId}-${row.batchId ?? ''}`}
        loading={balances.isPending}
        error={balances.error ?? undefined}
        onRetry={() => void balances.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={balances.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(row) => void navigate(`/inventory/items/${row.itemId}`)}
        showRowActions
        csvName="phatsema-balances"
        empty={{ title: 'No balances in scope', description: 'Adjust the filters or select another site.' }}
      />
    </DataPageShell>
  );
}
