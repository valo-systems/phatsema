import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleCheckBig, Package, PackageX, Plus, TriangleAlert } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useDebouncedValue } from '@/shared/hooks/useDebounce';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { useItemCategories } from '@/shared/api/reference';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/controls';
import { DataToolbar, type ToolbarFilter } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { QuantityCell, RecordIdentifier, TypeBadge } from '@/shared/ui/data/DataCells';
import {
  enumOptions,
  recordOptions,
  INVENTORY_TYPE_VALUES,
  STATUS_VALUES,
  STOCK_HEALTH_VALUES,
} from '@/shared/ui/controls/options';
import { StatusIndicator, StatusPill } from '@/shared/ui/Badge';
import { formatQuantity, label } from '@/shared/format/format';
import { useItems, type ItemSummary, type ItemsQuery } from './api';
import { ItemFormDialog } from './ItemFormDialog';

const FILTER_KEYS = ['categoryId', 'inventoryType', 'status', 'stockHealth'] as const;

export function ItemsListPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const debouncedQ = useDebouncedValue(state.q);
  const { siteId } = useSiteScope();
  const session = useSession();
  const categories = useItemCategories();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const query: ItemsQuery = {
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['categoryId'] ? { categoryId: state.filters['categoryId'] } : {}),
    ...(state.filters['inventoryType']
      ? { inventoryType: state.filters['inventoryType'] as NonNullable<ItemsQuery['inventoryType']> }
      : {}),
    ...(state.filters['status'] ? { status: state.filters['status'] as NonNullable<ItemsQuery['status']> } : {}),
    ...(state.filters['stockHealth']
      ? { stockHealth: state.filters['stockHealth'] as NonNullable<ItemsQuery['stockHealth']> }
      : {}),
  };

  const items = useItems(query);

  const FILTERS: ToolbarFilter[] = [
    {
      key: 'categoryId',
      label: 'Category',
      placeholder: 'All categories',
      options: recordOptions(categories.data, (category) => category.name),
    },
    {
      key: 'inventoryType',
      label: 'Type',
      placeholder: 'All types',
      options: enumOptions(INVENTORY_TYPE_VALUES),
    },
    {
      key: 'stockHealth',
      label: 'Health',
      placeholder: 'All health',
      options: enumOptions(STOCK_HEALTH_VALUES),
      width: 'w-40',
    },
    {
      key: 'status',
      label: 'Status',
      placeholder: 'All statuses',
      options: enumOptions(STATUS_VALUES),
      width: 'w-36',
    },
  ];

  const columns: Array<DataTableColumn<ItemSummary>> = [
    {
      key: 'sku',
      header: 'SKU',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (item) => <RecordIdentifier icon={Package} value={item.sku} />,
      text: (item) => item.sku,
    },
    { key: 'name', header: 'Name', sortable: true, cell: (item) => item.name, text: (item) => item.name },
    {
      key: 'category',
      header: 'Category',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (item) => item.categoryName,
      text: (item) => item.categoryName,
    },
    {
      key: 'inventoryType',
      header: 'Type',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (item) => <TypeBadge>{label(item.inventoryType)}</TypeBadge>,
      text: (item) => label(item.inventoryType),
    },
    {
      key: 'available',
      header: 'Available',
      numeric: true,
      sortable: true,
      cell: (item) => <QuantityCell emphasized>{formatQuantity(item.totalAvailable, item.baseUnit)}</QuantityCell>,
      text: (item) => item.totalAvailable,
    },
    {
      key: 'stockHealth',
      header: 'Health',
      cell: (item) => <StatusPill status={item.stockHealth} />,
      text: (item) => label(item.stockHealth),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (item) => <StatusIndicator status={item.status} />,
      text: (item) => label(item.status),
    },
  ];

  const canManage = can(session.data, P.catalogueManage);
  const visibleItems = items.data?.data ?? [];
  const healthCount = (health: ItemSummary['stockHealth']) =>
    visibleItems.filter((item) => item.stockHealth === health).length;

  return (
    <DataPageShell
        title="Item catalogue"
        description="Search chemicals, components, materials, spares, and consumables across the network."
        actions={
          canManage && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden className="size-4" /> New item
            </Button>
          )
        }
    >

      <DataTable
        caption="Item catalogue"
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Total items',
                value: items.data?.meta.total ?? 0,
                hint: 'All matching catalogue items',
                icon: <Package aria-hidden className="size-4" />,
              },
              {
                label: 'Healthy',
                value: healthCount('healthy'),
                hint: 'Visible items in good standing',
                tone: 'success',
                icon: <CircleCheckBig aria-hidden className="size-4" />,
              },
              {
                label: 'Out of stock',
                value: healthCount('out_of_stock'),
                hint: 'Visible items needing attention',
                tone: 'danger',
                icon: <PackageX aria-hidden className="size-4" />,
              },
              {
                label: 'Low stock',
                value: healthCount('low'),
                hint: 'Visible items below reorder level',
                tone: 'warning',
                icon: <TriangleAlert aria-hidden className="size-4" />,
              },
            ]}
          />
        }
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search items"
            searchPlaceholder="Search SKU or name…"
            filters={FILTERS}
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
          />
        }
        columns={columns}
        rows={items.data?.data}
        rowKey={(item) => item.id}
        loading={items.isPending}
        error={items.error ?? undefined}
        onRetry={() => void items.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={items.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(item) => void navigate(`/inventory/items/${item.id}`)}
        selectable
        showRowActions
        csvName="phatsema-items"
        empty={{
          title: 'No items match these filters',
          description: 'Try removing a filter, or create a new item if your role allows it.',
        }}
      />

      <ItemFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </DataPageShell>
  );
}
