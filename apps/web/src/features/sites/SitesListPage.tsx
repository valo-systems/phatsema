import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, CircleCheckBig, CircleOff, Plus } from 'lucide-react';
import { useTableState } from '@/shared/hooks/useTableState';
import { useDebouncedValue } from '@/shared/hooks/useDebounce';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { RecordIdentifier } from '@/shared/ui/data/DataCells';
import { enumOptions, STATUS_VALUES } from '@/shared/ui/controls/options';
import { Button } from '@/shared/ui/controls';
import { StatusIndicator } from '@/shared/ui/Badge';
import { label } from '@/shared/format/format';
import { useSites, type Site } from './api';
import { SiteFormDialog } from './SiteFormDialog';

const FILTER_KEYS = ['type', 'status'] as const;

export function SitesListPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const debouncedQ = useDebouncedValue(state.q);
  const session = useSession();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const sites = useSites({
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(state.filters['type'] ? { type: state.filters['type'] as Site['type'] } : {}),
    ...(state.filters['status'] ? { status: state.filters['status'] as 'active' | 'inactive' } : {}),
  });

  const columns: Array<DataTableColumn<Site>> = [
    {
      key: 'code',
      header: 'Code',
      priority: 'primary',
      required: true,
      sortable: true,
      cell: (site) => <RecordIdentifier icon={Building2} value={site.code} />,
      text: (site) => site.code,
    },
    { key: 'name', header: 'Name', sortable: true, cell: (site) => site.name, text: (site) => site.name },
    {
      key: 'type',
      header: 'Type',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (site) => label(site.type),
      text: (site) => label(site.type),
    },
    {
      key: 'entityCode',
      header: 'Entity',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (site) => site.entityCode,
      text: (site) => site.entityCode,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (site) => <StatusIndicator status={site.status} />,
      text: (site) => label(site.status),
    },
  ];

  const canManage = can(session.data, P.siteManage);
  const visibleSites = sites.data?.data ?? [];

  return (
    <DataPageShell
        title="Sites"
        description="Operational sites and storage locations across the Phatsema network."
        actions={
          canManage && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden className="size-4" /> New site
            </Button>
          )
        }
    >

      <DataTable
        summary={
          <MetricStrip
            metrics={[
              {
                label: 'Total sites',
                value: sites.data?.meta.total ?? 0,
                hint: 'All matching operational sites',
                icon: <Building2 aria-hidden className="size-4" />,
              },
              {
                label: 'Active',
                value: visibleSites.filter((site) => site.status === 'active').length,
                hint: 'Visible active sites',
                tone: 'success',
                icon: <CircleCheckBig aria-hidden className="size-4" />,
              },
              {
                label: 'Inactive',
                value: visibleSites.filter((site) => site.status === 'inactive').length,
                hint: 'Visible inactive sites',
                tone: 'warning',
                icon: <CircleOff aria-hidden className="size-4" />,
              },
            ]}
          />
        }
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search sites"
            searchPlaceholder="Search code or name…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'type',
                label: 'Site type',
                placeholder: 'All types',
                options: enumOptions([
                  'head_office',
                  'warehouse',
                  'mine_site',
                  'workshop',
                  'fabrication',
                  'depot',
                ]),
              },
              {
                key: 'status',
                label: 'Status',
                placeholder: 'All statuses',
                options: enumOptions(STATUS_VALUES),
                width: 'w-36',
              },
            ]}
          />
        }
        caption="Sites"
        columns={columns}
        rows={sites.data?.data}
        rowKey={(site) => site.id}
        loading={sites.isPending}
        error={sites.error ?? undefined}
        onRetry={() => void sites.refetch()}
        sort={state.sort}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={sites.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(site) => void navigate(`/sites/${site.id}`)}
        showRowActions
        csvName="phatsema-sites"
        empty={{
          title: 'No sites match these filters',
          description: 'Try removing a filter or create a new site.',
        }}
      />

      <SiteFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </DataPageShell>
  );
}
