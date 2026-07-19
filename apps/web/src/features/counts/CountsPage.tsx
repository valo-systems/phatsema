import { useNavigate } from 'react-router';
import { AlertTriangle, ClipboardCheck, ClipboardList, PlayCircle, Plus } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { RecordIdentifier } from '@/shared/ui/data/DataCells';
import { enumOptions, COUNT_STATUS_VALUES } from '@/shared/ui/controls/options';
import { LinkButton } from '@/shared/ui/controls';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { formatDate, label } from '@/shared/format/format';
import { useCounts, type StockCount } from './api';

const FILTER_KEYS = ['status'] as const;

export function CountsPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const { siteId } = useSiteScope();
  const session = useSession();
  const navigate = useNavigate();

  const counts = useCounts({
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['status'] ? { status: state.filters['status'] as StockCount['status'] } : {}),
  });

  const columns: Array<DataTableColumn<StockCount>> = [
    {
      key: 'countNumber',
      header: 'Number',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (c) => <RecordIdentifier icon={ClipboardList} value={c.countNumber} />,
      text: (c) => c.countNumber,
    },
    { key: 'siteName', header: 'Site', cell: (c) => c.siteName, text: (c) => c.siteName },
    {
      key: 'locationName',
      header: 'Location',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (c) => c.locationName,
      text: (c) => c.locationName,
    },
    {
      key: 'scope',
      header: 'Scope',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (c) => label(c.scope),
      text: (c) => label(c.scope),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <span className="flex items-center gap-1.5">
          <StatusPill status={c.status} />
          {c.materialVariance && (
            <Badge tone="warning">
              Variance
            </Badge>
          )}
        </span>
      ),
      text: (c) => label(c.status),
    },
    {
      key: 'createdByName',
      header: 'Created by',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (c) => c.createdByName,
      text: (c) => c.createdByName,
    },
    {
      key: 'startedAt',
      header: 'Started',
      priority: 'tertiary',
      hideBelow: 'lg',
      sortable: true,
      cell: (c) => (c.startedAt ? formatDate(c.startedAt) : <span className="text-faint">Not started</span>),
      text: (c) => c.startedAt ?? '',
    },
  ];

  const canCreate = can(session.data, P.countCreate);
  const visibleCounts = counts.data?.data ?? [];

  return (
    <DataPageShell
        title="Stock counts"
        description="Periodic physical counts with variance review and posting to the ledger."
        actions={
          canCreate && (
            <LinkButton to="/inventory/counts/new" variant="primary">
              <Plus aria-hidden className="size-4" /> New count
            </LinkButton>
          )
        }
    >

      <DataTable
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Total counts',
                value: counts.data?.meta.total ?? 0,
                hint: 'All matching stock counts',
                icon: <ClipboardList aria-hidden className="size-4" />,
              },
              {
                label: 'In progress',
                value: visibleCounts.filter((count) => ['in_progress', 'submitted', 'recount_required'].includes(count.status)).length,
                hint: 'Visible counts still active',
                icon: <PlayCircle aria-hidden className="size-4" />,
              },
              {
                label: 'Posted',
                value: visibleCounts.filter((count) => count.status === 'posted').length,
                hint: 'Visible completed counts',
                tone: 'success',
                icon: <ClipboardCheck aria-hidden className="size-4" />,
              },
              {
                label: 'With variance',
                value: visibleCounts.filter((count) => count.materialVariance).length,
                hint: 'Visible counts requiring attention',
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
            searchLabel="Search counts"
            searchPlaceholder="Search count number…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'status',
                label: 'Status',
                placeholder: 'All statuses',
                options: enumOptions(COUNT_STATUS_VALUES),
              },
            ]}
          />
        }
        caption="Stock counts"
        columns={columns}
        rows={counts.data?.data}
        rowKey={(c) => c.id}
        loading={counts.isPending}
        error={counts.error ?? undefined}
        onRetry={() => void counts.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={counts.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(c) => void navigate(`/inventory/counts/${c.id}`)}
        showRowActions
        csvName="phatsema-counts"
        empty={{
          title: 'No stock counts match these filters',
          description: 'Try a different status filter, or create a new count.',
        }}
      />
    </DataPageShell>
  );
}
