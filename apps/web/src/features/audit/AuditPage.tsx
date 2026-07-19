import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { useTableState } from '@/shared/hooks/useTableState';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { enumOptions } from '@/shared/ui/controls/options';
import { Drawer } from '@/shared/ui/overlays';
import { Card, CardHeader, DescriptionList } from '@/shared/ui/surfaces';
import { ErrorState } from '@/shared/ui/states';
import { formatDateTime } from '@/shared/format/format';

type AuditEvent = components['schemas']['AuditEvent'];
type PageMeta = components['schemas']['PageMeta'];
type AuditQuery = NonNullable<operations['listAuditEvents']['parameters']['query']>;

const FILTER_KEYS = ['resourceType', 'action'] as const;

export function AuditPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const { siteId } = useSiteScope();
  const session = useSession();
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const query: AuditQuery = {
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(siteId ? { siteId } : {}),
    ...(state.filters['resourceType'] ? { resourceType: state.filters['resourceType'] } : {}),
    ...(state.filters['action'] ? { action: state.filters['action'] } : {}),
  };

  const events = useQuery({
    queryKey: ['audit', query],
    queryFn: async () =>
      unwrap<{ data: AuditEvent[]; meta: PageMeta }>(await api.GET('/audit-events', { params: { query } })),
    placeholderData: (prev) => prev,
    enabled: can(session.data, P.auditView),
  });

  if (!can(session.data, P.auditView)) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted">You do not have permission to view the audit log.</p>
      </div>
    );
  }

  const columns: Array<DataTableColumn<AuditEvent>> = [
    {
      key: 'occurredAt',
      header: 'Time',
      sortable: true,
      cell: (e) => (
        <span className="tabular-nums text-sm" data-numeric>
          {formatDateTime(e.occurredAt)}
        </span>
      ),
      text: (e) => e.occurredAt,
    },
    {
      key: 'actorName',
      header: 'User',
      cell: (e) => e.actorName,
      text: (e) => e.actorName,
    },
    {
      key: 'action',
      header: 'Action',
      cell: (e) => <span className="font-mono text-xs text-ink-secondary">{e.action}</span>,
      text: (e) => e.action,
    },
    {
      key: 'resourceType',
      header: 'Resource',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (e) => e.resourceType,
      text: (e) => e.resourceType,
    },
    {
      key: 'summary',
      header: 'Summary',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (e) => <span className="max-w-xs truncate">{e.summary}</span>,
      text: (e) => e.summary,
    },
  ];

  return (
    <DataPageShell
        title="Audit log"
        description="Immutable record of all state-changing actions performed in this portal session."
    >

      {events.isError ? (
        <ErrorState error={events.error} onRetry={() => void events.refetch()} />
      ) : (
        <DataTable
          caption="Audit events"
          toolbar={
            <DataToolbar
              searchValue={state.filters['action'] ?? ''}
              onSearchChange={(value) => update({ filters: { action: value || null } })}
              searchLabel="Filter by action"
              searchPlaceholder="Action keyword…"
              values={state.filters}
              onFilterChange={(key, value) => update({ filters: { [key]: value } })}
              filters={[
                {
                  key: 'resourceType',
                  label: 'Resource',
                  placeholder: 'All resources',
                  options: enumOptions([
                    'receipt',
                    'issue',
                    'adjustment',
                    'reversal',
                    'transfer',
                    'count',
                    'asset',
                    'site',
                    'item',
                    'user',
                  ]),
                },
              ]}
            />
          }
          columns={columns}
          rows={events.data?.data}
          rowKey={(e) => e.id}
          loading={events.isPending}
          sort={state.sort}
          onToggleSort={toggleSort}
          page={state.page}
          pageSize={state.pageSize}
          total={events.data?.meta.total ?? 0}
          onPageChange={(page) => update({ page })}
          onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
          onRowClick={(e) => setSelected(e)}
          showRowActions
          csvName="phatsema-audit"
          empty={{
            title: 'No audit events match these filters',
            description: 'Try removing a filter to see all events.',
          }}
        />
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Audit event detail"
      >
        {selected && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Event" />
              <div className="px-4 py-4">
                <DescriptionList
                  className="sm:grid-cols-1"
                  items={[
                    { term: 'Time', detail: formatDateTime(selected.occurredAt) },
                    { term: 'User', detail: selected.actorName },
                    { term: 'Action', detail: selected.action },
                    { term: 'Resource', detail: selected.resourceType },
                    { term: 'Resource ID', detail: selected.resourceId },
                    { term: 'Summary', detail: selected.summary },
                    { term: 'Trace ID', detail: selected.traceId },
                  ]}
                />
              </div>
            </Card>
            {selected.changes && Object.keys(selected.changes).length > 0 && (
              <Card>
                <CardHeader title="Changes" />
                <div className="overflow-x-auto px-4 py-4">
                  <pre className="text-xs text-ink">{JSON.stringify(selected.changes, null, 2)}</pre>
                </div>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </DataPageShell>
  );
}
