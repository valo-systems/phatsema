import { useNavigate } from 'react-router';
import { AlertTriangle, CircleCheckBig, Plus, UserRoundCheck, Wrench } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useDebouncedValue } from '@/shared/hooks/useDebounce';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { RecordIdentifier } from '@/shared/ui/data/DataCells';
import { enumOptions, ASSET_STATUS_VALUES } from '@/shared/ui/controls/options';
import { Button } from '@/shared/ui/controls';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { label } from '@/shared/format/format';
import { useAssets, type Asset } from './api';

const FILTER_KEYS = ['status', 'type'] as const;

const TYPE_OPTIONS = ['plant', 'transport', 'tank', 'workshop_equipment', 'attachment'] as const;

const SERVICE_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  due_soon: 'warning',
  overdue: 'danger',
};

export function AssetsPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const debouncedQ = useDebouncedValue(state.q);
  const { siteId } = useSiteScope();
  const session = useSession();
  const navigate = useNavigate();

  const assets = useAssets({
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['status'] ? { status: state.filters['status'] as Asset['status'] } : {}),
    ...(state.filters['type'] ? { type: state.filters['type'] } : {}),
  });

  const columns: Array<DataTableColumn<Asset>> = [
    {
      key: 'assetNumber',
      header: 'Asset no.',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (a) => <RecordIdentifier icon={Wrench} value={a.assetNumber} />,
      text: (a) => a.assetNumber,
    },
    { key: 'name', header: 'Name', sortable: true, cell: (a) => a.name, text: (a) => a.name },
    {
      key: 'type',
      header: 'Type',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (a) => label(a.type),
      text: (a) => label(a.type),
    },
    { key: 'siteName', header: 'Site', cell: (a) => a.siteName, text: (a) => a.siteName },
    {
      key: 'assignedTo',
      header: 'Assigned to',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (a) => a.assignedTo ?? <span className="text-faint">Unassigned</span>,
      text: (a) => a.assignedTo ?? '',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => (
        <span className="flex items-center gap-1.5">
          <StatusPill status={a.status} />
          {a.serviceState && a.serviceState !== 'ok' && SERVICE_TONE[a.serviceState] != null && (
            <Badge tone={SERVICE_TONE[a.serviceState]!}>
              {label(a.serviceState)}
            </Badge>
          )}
        </span>
      ),
      text: (a) => label(a.status),
    },
  ];

  const canManage = can(session.data, P.assetManage);
  const visibleAssets = assets.data?.data ?? [];

  return (
    <DataPageShell
        title="Assets"
        description="Controlled asset register for plant, transport, tanks, and workshop equipment."
        actions={
          canManage && (
            <Button variant="primary" onClick={() => void navigate('/assets/new')}>
              <Plus aria-hidden className="size-4" /> New asset
            </Button>
          )
        }
    >

      <DataTable
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Total assets',
                value: assets.data?.meta.total ?? 0,
                hint: 'All matching controlled assets',
                icon: <Wrench aria-hidden className="size-4" />,
              },
              {
                label: 'Available',
                value: visibleAssets.filter((asset) => asset.status === 'available').length,
                hint: 'Visible assets ready for use',
                tone: 'success',
                icon: <CircleCheckBig aria-hidden className="size-4" />,
              },
              {
                label: 'Assigned',
                value: visibleAssets.filter((asset) => ['assigned', 'on_hire'].includes(asset.status)).length,
                hint: 'Visible assets allocated',
                icon: <UserRoundCheck aria-hidden className="size-4" />,
              },
              {
                label: 'Service attention',
                value: visibleAssets.filter((asset) => asset.serviceState && asset.serviceState !== 'ok').length,
                hint: 'Visible assets due or overdue',
                tone: 'warning',
                icon: <AlertTriangle aria-hidden className="size-4" />,
              },
            ]}
          />
        }
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search assets"
            searchPlaceholder="Search asset number or name…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'type',
                label: 'Type',
                placeholder: 'All types',
                options: enumOptions(TYPE_OPTIONS),
              },
              {
                key: 'status',
                label: 'Status',
                placeholder: 'All statuses',
                options: enumOptions(ASSET_STATUS_VALUES),
              },
            ]}
          />
        }
        caption="Assets"
        columns={columns}
        rows={assets.data?.data}
        rowKey={(a) => a.id}
        loading={assets.isPending}
        error={assets.error ?? undefined}
        onRetry={() => void assets.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={assets.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(a) => void navigate(`/assets/${a.id}`)}
        showRowActions
        csvName="phatsema-assets"
        empty={{
          title: 'No assets match these filters',
          description: 'Try removing a filter, or register a new asset.',
        }}
      />
    </DataPageShell>
  );
}
