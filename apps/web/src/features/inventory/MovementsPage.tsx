import { useState } from 'react';
import { Link } from 'react-router';
import { useTableState } from '@/shared/hooks/useTableState';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { useReasons } from '@/shared/api/reference';
import { DataPageShell } from '@/shared/ui/DataPageShell';
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable';
import { DataToolbar } from '@/shared/ui/data/DataToolbar';
import { enumOptions, MOVEMENT_TYPE_VALUES } from '@/shared/ui/controls/options';
import { Drawer, ConfirmDialog } from '@/shared/ui/overlays';
import { Badge } from '@/shared/ui/Badge';
import { Button, Field, Select, TextArea } from '@/shared/ui/controls';
import { DescriptionList } from '@/shared/ui/surfaces';
import { toast } from '@/shared/ui/toast';
import { problemFromUnknown } from '@/shared/api/problem';
import { formatDateTime, formatQuantity, label } from '@/shared/format/format';
import { useMovements, useReverseMovement, type Movement, type MovementsQuery } from './api';

const FILTER_KEYS = ['movementType', 'itemId', 'from', 'to'] as const;

export function MovementsPage() {
  const { state, update, toggleSort } = useTableState(FILTER_KEYS);
  const { siteId } = useSiteScope();
  const session = useSession();
  const reasons = useReasons('reversal');
  const [selected, setSelected] = useState<Movement | null>(null);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseNotes, setReverseNotes] = useState('');
  const reverse = useReverseMovement();

  const query: MovementsQuery = {
    page: state.page,
    pageSize: state.pageSize,
    sort: state.sort ?? '-occurredAt',
    ...(siteId ? { siteId } : {}),
    ...(state.filters['itemId'] ? { itemId: state.filters['itemId'] } : {}),
    ...(state.filters['movementType']
      ? { movementType: state.filters['movementType'] as NonNullable<MovementsQuery['movementType']> }
      : {}),
    ...(state.filters['from'] ? { from: state.filters['from'] } : {}),
    ...(state.filters['to'] ? { to: state.filters['to'] } : {}),
  };

  const movements = useMovements(query);

  const columns: Array<DataTableColumn<Movement>> = [
    {
      key: 'occurredAt',
      header: 'When',
      sortable: true,
      cell: (row) => <span data-numeric>{formatDateTime(row.occurredAt)}</span>,
      text: (row) => row.occurredAt,
    },
    {
      key: 'movementType',
      header: 'Type',
      cell: (row) => <Badge tone={row.reversalOfId ? 'warning' : 'neutral'}>{label(row.movementType)}</Badge>,
      text: (row) => label(row.movementType),
    },
    { key: 'itemSku', header: 'SKU', priority: 'secondary', hideBelow: 'md', cell: (row) => row.itemSku, text: (row) => row.itemSku },
    { key: 'itemName', header: 'Item', cell: (row) => row.itemName, text: (row) => row.itemName },
    {
      key: 'quantity',
      header: 'Quantity',
      numeric: true,
      cell: (row) => formatQuantity(row.quantity, row.unit),
      text: (row) => row.quantity,
    },
    {
      key: 'route',
      header: 'From → To',
      priority: 'secondary',
      hideBelow: 'md',
      cell: (row) => (
        <span className="text-xs text-muted">
          {row.sourceSiteName ?? 'Not set'} → {row.destinationSiteName ?? 'Not set'}
        </span>
      ),
      text: (row) => `${row.sourceSiteName ?? ''} -> ${row.destinationSiteName ?? ''}`,
    },
    {
      key: 'reference',
      header: 'Reference',
      priority: 'tertiary',
      hideBelow: 'lg',
      cell: (row) => <span data-numeric>{row.referenceLabel}</span>,
      text: (row) => row.referenceLabel,
    },
    { key: 'actorName', header: 'By', priority: 'tertiary', hideBelow: 'lg', cell: (row) => row.actorName, text: (row) => row.actorName },
  ];

  const canReverse =
    selected !== null &&
    can(session.data, P.inventoryAdjust) &&
    selected.movementType !== 'reversal' &&
    selected.movementType !== 'transfer_dispatch' &&
    selected.movementType !== 'transfer_receipt' &&
    !selected.reversedById;

  const submitReversal = () => {
    if (!selected || !reverseReason) return;
    reverse.mutate(
      {
        movementId: selected.id,
        input: { reasonCode: reverseReason, ...(reverseNotes ? { notes: reverseNotes } : {}) },
      },
      {
        onSuccess: () => {
          toast('success', 'Reversal posted', `A reversing movement was created for ${selected.referenceLabel}.`);
          setReverseOpen(false);
          setSelected(null);
          setReverseReason('');
          setReverseNotes('');
        },
        onError: (error) => {
          const problem = problemFromUnknown(error);
          toast('error', 'Reversal failed', problem.detail ?? problem.title);
        },
      },
    );
  };

  return (
    <DataPageShell
        title="Movement ledger"
        description="Immutable record of every stock movement. Corrections use explicit reversals or adjustments, never edits."
    >

      <DataTable
        caption="Inventory movement ledger"
        toolbar={
          <DataToolbar
            searchValue={state.q}
            onSearchChange={(value) => update({ q: value })}
            searchLabel="Search movements"
            searchPlaceholder="Search item or reference…"
            values={state.filters}
            onFilterChange={(key, value) => update({ filters: { [key]: value } })}
            filters={[
              {
                key: 'movementType',
                label: 'Movement type',
                placeholder: 'All movement types',
                options: enumOptions(MOVEMENT_TYPE_VALUES),
                width: 'w-48',
              },
              { key: 'from', label: 'From date', type: 'date', placeholder: 'From' },
              { key: 'to', label: 'To date', type: 'date', placeholder: 'To' },
            ]}
          />
        }
        columns={columns}
        rows={movements.data?.data}
        rowKey={(row) => row.id}
        loading={movements.isPending}
        error={movements.error ?? undefined}
        onRetry={() => void movements.refetch()}
        sort={state.sort ?? '-occurredAt'}
        onToggleSort={toggleSort}
        page={state.page}
        pageSize={state.pageSize}
        total={movements.data?.meta.total ?? 0}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ page: 1, pageSize })}
        onRowClick={(row) => setSelected(row)}
        showRowActions
        csvName="phatsema-movements"
        empty={{ title: 'No movements in scope', description: 'Adjust the date range or filters.' }}
      />

      <Drawer open={selected !== null} onOpenChange={(open) => !open && setSelected(null)} title="Movement detail">
        {selected && (
          <div className="space-y-5">
            <DescriptionList
              items={[
                { term: 'Type', detail: label(selected.movementType) },
                { term: 'Occurred', detail: formatDateTime(selected.occurredAt) },
                {
                  term: 'Item',
                  detail: (
                    <Link to={`/inventory/items/${selected.itemId}`} className="text-primary hover:underline">
                      {selected.itemSku}: {selected.itemName}
                    </Link>
                  ),
                },
                { term: 'Quantity', detail: formatQuantity(selected.quantity, selected.unit) },
                { term: 'Source', detail: selected.sourceSiteName ? `${selected.sourceSiteName} / ${selected.sourceLocationName ?? ''}` : 'Not applicable' },
                { term: 'Destination', detail: selected.destinationSiteName ? `${selected.destinationSiteName} / ${selected.destinationLocationName ?? ''}` : 'Not applicable' },
                { term: 'Reference', detail: selected.referenceLabel },
                { term: 'Reason', detail: selected.reasonCode ? label(selected.reasonCode) : 'Not provided' },
                { term: 'Actor', detail: selected.actorName },
                { term: 'Resulting balance', detail: formatQuantity(selected.resultingBalance, selected.unit) },
                { term: 'Notes', detail: selected.notes ?? 'No notes' },
              ]}
            />
            {selected.reversalOfId && (
              <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
                This movement reverses an earlier ledger entry.
              </p>
            )}
            {selected.reversedById && (
              <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
                This movement has already been reversed.
              </p>
            )}
            {selected.auditEventId && can(session.data, P.auditView) && (
              <Link
                to={`/audit?resourceId=${selected.referenceId}`}
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                View audit trail
              </Link>
            )}
            {canReverse && (
              <div className="border-t border-line pt-4">
                <Button variant="danger" onClick={() => setReverseOpen(true)}>
                  Reverse this movement
                </Button>
                <p className="mt-2 text-xs text-muted">
                  Posts an opposite movement with a mandatory reason. The original entry is preserved.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={reverseOpen}
        onOpenChange={setReverseOpen}
        title="Reverse movement?"
        description="A reversing ledger entry will be posted. This is recorded in the audit log and cannot itself be edited."
        confirmLabel="Post reversal"
        confirmVariant="danger"
        loading={reverse.isPending}
        onConfirm={submitReversal}
      >
        <div className="space-y-3">
          <Field label="Reason" required control="custom">
            <Select
              aria-label="Reversal reason"
              value={reverseReason}
              onValueChange={setReverseReason}
              placeholder="Select a reason…"
              options={(reasons.data ?? []).map((reason) => ({
                value: reason.code,
                label: reason.name,
              }))}
            />
          </Field>
          <Field label="Evidence notes" control="textarea">
            <TextArea value={reverseNotes} onChange={(event) => setReverseNotes(event.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>
    </DataPageShell>
  );
}
