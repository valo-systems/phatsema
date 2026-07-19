import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowLeftRight, ClipboardCheck, Plus, Truck } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { RecordIdentifier } from '@/shared/ui/data/DataCells';
import { enumOptions, TRANSFER_STATUS_VALUES } from '@/shared/ui/controls/options';
import { LinkButton } from '@/shared/ui/controls';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { formatDate, label } from '@/shared/format/format';
import { useTransfers, type Transfer } from './api';

const FILTER_KEYS = ['status', 'view'] as const;

const VIEW_OPTIONS = [
  { value: 'action', label: 'Needs action' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All transfers' },
] as const;

export function TransfersPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const { siteId } = useSiteScope();
  const session = useSession();
  const navigate = useNavigate();

  const transfers = useTransfers({
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['status'] ? { status: state.filters['status'] as Transfer['status'] } : {}),
    ...(state.filters['view'] ? { view: state.filters['view'] as 'action' | 'in_transit' | 'completed' | 'all' } : {}),
  });

  const columns: Array<DataTableColumn<Transfer>> = [
    {
      key: 'transferNumber',
      header: 'Number',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (t) => <RecordIdentifier icon={ArrowLeftRight} value={t.transferNumber} />,
      text: (t) => t.transferNumber,
    },
    {
      key: 'sourceSiteName',
      header: 'From',
      priority: 'secondary',
      cell: (t) => t.sourceSiteName,
      text: (t) => t.sourceSiteName,
    },
    {
      key: 'destinationSiteName',
      header: 'To',
      priority: 'secondary',
      cell: (t) => t.destinationSiteName,
      text: (t) => t.destinationSiteName,
    },
    {
      key: 'lineCount',
      header: 'Lines',
      priority: 'tertiary',
      hideBelow: 'lg',
      numeric: true,
      cell: (t) => String(t.lines.length),
      text: (t) => String(t.lines.length),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'secondary',
      cell: (t) => (
        <span className="flex items-center gap-1.5">
          <StatusPill status={t.status} />
          {t.hasDiscrepancy && (
            <Badge tone="warning">
              Discrepancy
            </Badge>
          )}
        </span>
      ),
      text: (t) => label(t.status),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      priority: 'secondary',
      hideBelow: 'lg',
      sortable: true,
      cell: (t) => (t.submittedAt ? formatDate(t.submittedAt) : <span className="text-faint">Not submitted</span>),
      text: (t) => t.submittedAt ?? '',
    },
  ];

  const canCreate = can(session.data, P.transferCreate);
  const visibleTransfers = transfers.data?.data ?? [];

  return (
    <DataPageShell
        title="Transfers"
        description="Inter-site stock movements requiring approval, dispatch, and receipt confirmation."
        actions={
          canCreate && (
            <LinkButton to="/transfers/new" variant="primary">
              <Plus aria-hidden className="size-4" /> New transfer
            </LinkButton>
          )
        }
    >

      <DataTable
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Total transfers',
                value: transfers.data?.meta.total ?? 0,
                hint: 'All matching transfers',
                icon: <ArrowLeftRight aria-hidden className="size-4" />,
              },
              {
                label: 'Needs action',
                value: visibleTransfers.filter((transfer) => ['submitted', 'approved'].includes(transfer.status)).length,
                hint: 'Visible approvals or dispatches',
                tone: 'warning',
                icon: <ClipboardCheck aria-hidden className="size-4" />,
              },
              {
                label: 'In transit',
                value: visibleTransfers.filter((transfer) => transfer.status === 'dispatched').length,
                hint: 'Visible dispatched transfers',
                icon: <Truck aria-hidden className="size-4" />,
              },
              {
                label: 'Discrepancies',
                value: visibleTransfers.filter((transfer) => transfer.hasDiscrepancy).length,
                hint: 'Visible transfers requiring review',
                tone: 'danger',
                icon: <AlertTriangle aria-hidden className="size-4" />,
              },
            ]}
          />
        }
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search transfers"
            searchPlaceholder="Search transfer number…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'view',
                label: 'View',
                placeholder: 'All transfers',
                options: VIEW_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
              },
              {
                key: 'status',
                label: 'Status',
                placeholder: 'All statuses',
                options: enumOptions(TRANSFER_STATUS_VALUES),
              },
            ]}
          />
        }
        caption="Transfers"
        columns={columns}
        rows={transfers.data?.data}
        rowKey={(t) => t.id}
        loading={transfers.isPending}
        error={transfers.error ?? undefined}
        onRetry={() => void transfers.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={transfers.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(t) => void navigate(`/transfers/${t.id}`)}
        showRowActions
        csvName="phatsema-transfers"
        empty={{
          title: 'No transfers match these filters',
          description: 'Try a different view, or create a new transfer request.',
        }}
      />
    </DataPageShell>
  );
}
