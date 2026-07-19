import { useState } from 'react';
import { useParams } from 'react-router';
import { CheckCircle, Send, Truck, PackageCheck, XCircle, Clock } from 'lucide-react';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { ErrorState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { Field } from '@/shared/ui/controls';
import { NumberField, TextArea, TextField } from '@/shared/ui/controls';
import { CompactTable } from '@/shared/ui/data/CompactTable';
import { ConfirmDialog, Dialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { formatDate, formatDateTime, formatQuantity, label } from '@/shared/format/format';
import {
  useTransfer,
  useSubmitTransfer,
  useApproveTransfer,
  useDispatchTransfer,
  useReceiveTransfer,
  useCancelTransfer,
  type Transfer,
} from './api';

type Action = 'submit' | 'approve' | 'dispatch' | 'receive' | 'cancel';

export function TransferDetailPage() {
  const { transferId = '' } = useParams();
  const session = useSession();
  const transfer = useTransfer(transferId);
  const submit = useSubmitTransfer(transferId);
  const approve = useApproveTransfer(transferId);
  const dispatch = useDispatchTransfer(transferId);
  const receive = useReceiveTransfer(transferId);
  const cancel = useCancelTransfer(transferId);

  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [dispatchLines, setDispatchLines] = useState<Record<string, string>>({});
  const [receiveLines, setReceiveLines] = useState<Record<string, { received: string; rejected: string; reason: string }>>({});

  if (transfer.isPending) return <PageSkeleton />;
  if (transfer.isError) return <ErrorState error={transfer.error} onRetry={() => void transfer.refetch()} />;

  const t: Transfer = transfer.data;
  const canApprove = can(session.data, P.transferApprove) && t.requestedBy !== session.data?.id;
  const canDispatch = can(session.data, P.transferDispatch);
  const canReceive = can(session.data, P.transferReceive);
  const canCreate = can(session.data, P.transferCreate);

  const openAction = (action: Action) => {
    if (action === 'dispatch') {
      const init: Record<string, string> = {};
      t.lines.forEach((l) => { init[l.id] = l.requestedQuantity; });
      setDispatchLines(init);
    }
    if (action === 'receive') {
      const init: Record<string, { received: string; rejected: string; reason: string }> = {};
      t.lines.forEach((l) => {
        init[l.id] = { received: l.dispatchedQuantity ?? l.requestedQuantity, rejected: '0', reason: '' };
      });
      setReceiveLines(init);
    }
    setActionNotes('');
    setCancelReason('');
    setActiveAction(action);
  };

  const handleMutation = <T,>(
    mutate: (args: T, opts: object) => void,
    args: T,
    successMsg: string,
  ) => {
    mutate(args, {
      onSuccess: () => {
        toast('success', successMsg);
        setActiveAction(null);
      },
      onError: (err: unknown) => {
        const msg = isApiError(err) ? err.problem.detail ?? 'Action failed.' : 'Action failed.';
        toast('error', 'Action failed', msg);
      },
    } as never);
  };

  const doSubmit = () =>
    handleMutation(submit.mutate.bind(submit), { version: t.version }, 'Transfer submitted for approval.');

  const doApprove = () =>
    handleMutation(approve.mutate.bind(approve), {
      version: t.version,
      ...(actionNotes ? { notes: actionNotes } : {}),
    }, 'Transfer approved.');

  const doDispatch = () =>
    handleMutation(dispatch.mutate.bind(dispatch), {
      version: t.version,
      ...(actionNotes ? { notes: actionNotes } : {}),
      lines: t.lines.map((l) => ({ lineId: l.id, dispatchedQuantity: dispatchLines[l.id] ?? l.requestedQuantity })),
    }, 'Transfer dispatched.');

  const doReceive = () =>
    handleMutation(receive.mutate.bind(receive), {
      version: t.version,
      ...(actionNotes ? { notes: actionNotes } : {}),
      lines: t.lines.map((line) => {
        const values = receiveLines[line.id] ?? { received: '0', rejected: '0', reason: '' };
        return {
          lineId: line.id,
          receivedQuantity: values.received,
          rejectedQuantity: values.rejected,
          ...(values.reason.trim() ? { discrepancyReason: values.reason.trim() } : {}),
        };
      }),
    }, 'Transfer received.');

  const doCancel = () =>
    handleMutation(cancel.mutate.bind(cancel), { version: t.version, reason: cancelReason }, 'Transfer cancelled.');

  const isActionPending =
    submit.isPending || approve.isPending || dispatch.isPending || receive.isPending || cancel.isPending;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Transfers', to: '/transfers' }, { label: t.transferNumber }]}
        title={`${t.sourceSiteName} → ${t.destinationSiteName}`}
        meta={
          <>
            <Badge tone="neutral" data-numeric>{t.transferNumber}</Badge>
            <StatusPill status={t.status} />
            {t.hasDiscrepancy && <Badge tone="warning">Discrepancy</Badge>}
          </>
        }
        actions={
          <span className="flex flex-wrap gap-2">
            {t.status === 'draft' && canCreate && (
              <Button onClick={() => openAction('submit')} loading={submit.isPending}>
                <Send aria-hidden className="size-4" /> Submit
              </Button>
            )}
            {t.status === 'submitted' && canApprove && (
              <Button variant="primary" onClick={() => openAction('approve')} loading={approve.isPending}>
                <CheckCircle aria-hidden className="size-4" /> Approve
              </Button>
            )}
            {t.status === 'approved' && canDispatch && (
              <Button variant="primary" onClick={() => openAction('dispatch')} loading={dispatch.isPending}>
                <Truck aria-hidden className="size-4" /> Dispatch
              </Button>
            )}
            {t.status === 'dispatched' && canReceive && (
              <Button variant="primary" onClick={() => openAction('receive')} loading={receive.isPending}>
                <PackageCheck aria-hidden className="size-4" /> Receive
              </Button>
            )}
            {['draft', 'submitted', 'approved'].includes(t.status) && canCreate && (
              <Button variant="secondary" onClick={() => openAction('cancel')}>
                <XCircle aria-hidden className="size-4" /> Cancel
              </Button>
            )}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Transfer lines" />
            <CompactTable label="Transfer lines">
                <caption className="sr-only">Transfer lines</caption>
                <thead className="bg-sunken text-left">
                  <tr>
                    {['Item', 'Requested', 'Dispatched', 'Received', 'Rejected'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-ink-secondary uppercase ${i >= 1 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="border-b border-line px-3 py-2">
                        <span className="font-medium" data-numeric>{line.itemSku}</span>
                        <span className="ml-2 text-muted">{line.itemName}</span>
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {formatQuantity(line.requestedQuantity, line.unit)}
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {line.dispatchedQuantity ? formatQuantity(line.dispatchedQuantity, line.unit) : <span className="text-faint">Not dispatched</span>}
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {line.receivedQuantity ? formatQuantity(line.receivedQuantity, line.unit) : <span className="text-faint">Not received</span>}
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {line.rejectedQuantity && Number(line.rejectedQuantity) > 0
                          ? <span className="text-danger">{formatQuantity(line.rejectedQuantity, line.unit)}</span>
                          : <span className="text-faint">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </CompactTable>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <ul className="divide-y divide-line">
              {t.timeline.map((event, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">{label(event.status)}</p>
                    <p className="text-xs text-muted">
                      {event.byName} · {formatDateTime(event.at)}
                    </p>
                    {event.note && <p className="mt-0.5 text-xs text-ink-secondary">{event.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Details" />
          <div className="px-4 py-4">
            <DescriptionList
              className="sm:grid-cols-1"
              items={[
                { term: 'From', detail: `${t.sourceSiteName} / ${t.sourceLocationName}` },
                { term: 'To', detail: `${t.destinationSiteName} / ${t.destinationLocationName}` },
                { term: 'Requested by', detail: t.requestedByName },
                ...(t.submittedAt ? [{ term: 'Submitted', detail: formatDate(t.submittedAt) }] : []),
                ...(t.approvedAt ? [{ term: 'Approved', detail: formatDate(t.approvedAt) }] : []),
                ...(t.dispatchedAt ? [{ term: 'Dispatched', detail: formatDate(t.dispatchedAt) }] : []),
                ...(t.receivedAt ? [{ term: 'Received', detail: formatDate(t.receivedAt) }] : []),
                ...(t.notes ? [{ term: 'Notes', detail: t.notes }] : []),
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Submit */}
      <ConfirmDialog
        open={activeAction === 'submit'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Submit transfer for approval?"
        description="The transfer will be sent to an approver. You will not be able to edit lines after submission."
        confirmLabel="Submit transfer"
        loading={isActionPending}
        onConfirm={doSubmit}
      />

      {/* Approve */}
      <ConfirmDialog
        open={activeAction === 'approve'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Approve this transfer?"
        description="Stock will be reserved from the source location. The dispatcher can then record actual quantities."
        confirmLabel="Approve transfer"
        loading={isActionPending}
        onConfirm={doApprove}
      >
        <Field label="Approval notes">
          <TextField value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Optional" />
        </Field>
      </ConfirmDialog>

      {/* Dispatch */}
      <Dialog
        open={activeAction === 'dispatch'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Record dispatch"
        description="Enter the actual quantity dispatched for each line."
        wide
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={isActionPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={isActionPending} onClick={doDispatch}>
              Confirm dispatch
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {t.lines.map((line) => (
            <Field
              key={line.id}
              label={`${line.itemSku}: ${line.itemName}`}
              hint={`Requested: ${formatQuantity(line.requestedQuantity, line.unit)}`}
            >
              <NumberField
                aria-label={`Dispatched quantity for ${line.itemSku}`}
                value={dispatchLines[line.id] ?? ''}
                onValueChange={(value) =>
                  setDispatchLines((prev) => ({ ...prev, [line.id]: value }))
                }
                unit={line.unit}
                placeholder="0"
              />
            </Field>
          ))}
          <Field label="Dispatch notes">
            <TextArea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </Dialog>

      {/* Receive */}
      <Dialog
        open={activeAction === 'receive'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Record receipt"
        description="Enter the actual quantity received. Any rejected quantity will be flagged as a discrepancy."
        wide
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={isActionPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={isActionPending} onClick={doReceive}>
              Confirm receipt
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {t.lines.map((line) => {
            const values = receiveLines[line.id] ?? { received: '', rejected: '', reason: '' };
            return (
              <div key={line.id} className="rounded-md border border-line p-3">
                <p className="mb-2 text-sm font-medium">{line.itemSku}: {line.itemName}</p>
                <p className="mb-3 text-xs text-muted">Dispatched: {formatQuantity(line.dispatchedQuantity ?? line.requestedQuantity, line.unit)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Received" required>
                    <NumberField aria-label={`Received quantity for ${line.itemSku}`} value={values.received} onValueChange={(value) => setReceiveLines((current) => ({ ...current, [line.id]: { ...values, received: value } }))} unit={line.unit} />
                  </Field>
                  <Field label="Rejected" required>
                    <NumberField aria-label={`Rejected quantity for ${line.itemSku}`} value={values.rejected} onValueChange={(value) => setReceiveLines((current) => ({ ...current, [line.id]: { ...values, rejected: value } }))} unit={line.unit} />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Discrepancy reason" hint="Required when any quantity is rejected">
                    <TextField aria-label={`Discrepancy reason for ${line.itemSku}`} value={values.reason} onChange={(event) => setReceiveLines((current) => ({ ...current, [line.id]: { ...values, reason: event.target.value } }))} />
                  </Field>
                </div>
              </div>
            );
          })}
          <Field label="Receipt notes">
            <TextArea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </Dialog>

      {/* Cancel */}
      <Dialog
        open={activeAction === 'cancel'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Cancel this transfer?"
        description="The transfer will be permanently cancelled and any reservations released."
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={isActionPending}>
              Keep transfer
            </Button>
            <Button
              variant="danger"
              loading={isActionPending}
              onClick={doCancel}
              disabled={!cancelReason.trim()}
            >
              Cancel transfer
            </Button>
          </>
        }
      >
        <Field label="Reason" required hint="Required to cancel a transfer">
          <TextField
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter cancellation reason"
            maxLength={200}
          />
        </Field>
      </Dialog>
    </div>
  );
}
