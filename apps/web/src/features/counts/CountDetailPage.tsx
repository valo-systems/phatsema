import { useState } from 'react';
import { useParams } from 'react-router';
import { PlayCircle, Send, CheckCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { ErrorState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { Field } from '@/shared/ui/controls';
import { NumberField, Textarea } from '@/shared/ui/controls';
import { CompactTable } from '@/shared/ui/data/CompactTable';
import { ConfirmDialog, Dialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { formatDate, formatDateTime, formatQuantity, label } from '@/shared/format/format';
import {
  useCount,
  useStartCount,
  useSaveCountEntries,
  useSubmitCount,
  useApproveCount,
  usePostCount,
  type StockCount,
  type StockCountEntry,
} from './api';

type Action = 'start' | 'enter' | 'submit' | 'approve' | 'post';

export function CountDetailPage() {
  const { countId = '' } = useParams();
  const session = useSession();
  const count = useCount(countId);
  const start = useStartCount(countId);
  const saveEntries = useSaveCountEntries(countId);
  const submitCount = useSubmitCount(countId);
  const approveCount = useApproveCount(countId);
  const postCount = usePostCount(countId);

  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [entryValues, setEntryValues] = useState<Record<string, string>>({});
  const [entryNotes, setEntryNotes] = useState<Record<string, string>>({});
  const [reviewNote, setReviewNote] = useState('');

  if (count.isPending) return <PageSkeleton />;
  if (count.isError) return <ErrorState error={count.error} onRetry={() => void count.refetch()} />;

  const c: StockCount = count.data;

  const canCreate = can(session.data, P.countCreate);
  const canReview = can(session.data, P.countReview) && c.createdBy !== session.data?.id;
  const canPost = can(session.data, P.countPost);

  const openEnter = () => {
    const init: Record<string, string> = {};
    const notes: Record<string, string> = {};
    c.entries.forEach((e) => {
      init[e.id] = e.countedQuantity ?? '';
      notes[e.id] = e.notes ?? '';
    });
    setEntryValues(init);
    setEntryNotes(notes);
    setActiveAction('enter');
  };

  const handleSuccess = (msg: string) => {
    toast('success', msg);
    setActiveAction(null);
    setReviewNote('');
  };

  const handleError = (err: unknown) => {
    const msg = isApiError(err) ? err.problem.detail ?? 'Action failed.' : 'Action failed.';
    toast('error', 'Action failed', msg);
  };

  const doStart = () => {
    start.mutate(
      { version: c.version },
      { onSuccess: () => handleSuccess('Count started.'), onError: handleError },
    );
  };

  const doSaveEntries = () => {
    saveEntries.mutate(
      {
        version: c.version,
        entries: c.entries.map((e) => ({
          entryId: e.id,
          countedQuantity: entryValues[e.id] ?? '0',
          ...(entryNotes[e.id]?.trim() ? { notes: entryNotes[e.id]!.trim() } : {}),
        })),
      },
      { onSuccess: () => handleSuccess('Entries saved.'), onError: handleError },
    );
  };

  const doSubmit = () => {
    submitCount.mutate(
      { version: c.version },
      { onSuccess: () => handleSuccess('Count submitted for review.'), onError: handleError },
    );
  };

  const doApprove = () => {
    approveCount.mutate(
      { version: c.version, ...(reviewNote.trim() ? { note: reviewNote.trim() } : {}) },
      { onSuccess: () => handleSuccess('Count approved.'), onError: handleError },
    );
  };

  const doPost = () => {
    postCount.mutate(
      { version: c.version },
      { onSuccess: () => handleSuccess('Count posted. Ledger updated.'), onError: handleError },
    );
  };

  const isAnyPending =
    start.isPending ||
    saveEntries.isPending ||
    submitCount.isPending ||
    approveCount.isPending ||
    postCount.isPending;

  const showVariance = !c.blindCount || ['reviewed', 'posted'].includes(c.status);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Stock counts', to: '/inventory/counts' }, { label: c.countNumber }]}
        title={`${c.siteName} / ${c.locationName}`}
        meta={
          <>
            <Badge tone="neutral" data-numeric>{c.countNumber}</Badge>
            <StatusPill status={c.status} />
            {c.blindCount && <Badge tone="info">Blind count</Badge>}
            {c.materialVariance && <Badge tone="warning">Material variance</Badge>}
          </>
        }
        actions={
          <span className="flex flex-wrap gap-2">
            {c.status === 'draft' && canCreate && (
              <Button variant="primary" onClick={() => setActiveAction('start')} loading={start.isPending}>
                <PlayCircle aria-hidden className="size-4" /> Start count
              </Button>
            )}
            {c.status === 'in_progress' && (
              <>
                <Button onClick={openEnter}>Enter quantities</Button>
                <Button variant="primary" onClick={() => setActiveAction('submit')}>
                  <Send aria-hidden className="size-4" /> Submit
                </Button>
              </>
            )}
            {c.status === 'submitted' && canReview && (
              <Button variant="primary" onClick={() => setActiveAction('approve')}>
                <CheckCircle aria-hidden className="size-4" /> Approve count
              </Button>
            )}
            {c.status === 'reviewed' && canPost && (
              <Button variant="primary" onClick={() => setActiveAction('post')}>
                <BookOpen aria-hidden className="size-4" /> Post to ledger
              </Button>
            )}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader title="Count entries" />
          <CompactTable label="Count entries">
              <caption className="sr-only">Count entries</caption>
              <thead className="bg-sunken text-left">
                <tr>
                  {['Item', 'Expected', 'Counted', ...(showVariance ? ['Variance'] : []), 'Counted by'].map((h, i) => (
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
                {c.entries.map((entry: StockCountEntry) => {
                  const hasVariance = entry.variance && Number(entry.variance) !== 0;
                  return (
                    <tr key={entry.id} className={hasVariance ? 'bg-warning-subtle' : undefined}>
                      <td className="border-b border-line px-3 py-2">
                        <span className="font-medium" data-numeric>{entry.itemSku}</span>
                        <span className="ml-2 text-muted">{entry.itemName}</span>
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {entry.expectedQuantity != null
                          ? formatQuantity(entry.expectedQuantity, entry.unit)
                          : <span className="text-faint">Hidden</span>}
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                        {entry.countedQuantity != null
                          ? formatQuantity(entry.countedQuantity, entry.unit)
                          : <span className="text-faint">Not counted</span>}
                      </td>
                      {showVariance && (
                        <td className="border-b border-line px-3 py-2 text-right">
                          {entry.variance != null ? (
                            <span
                              className={
                                Number(entry.variance) < 0
                                  ? 'font-medium text-danger'
                                  : Number(entry.variance) > 0
                                    ? 'font-medium text-success'
                                    : 'text-muted'
                              }
                              data-numeric
                            >
                              {Number(entry.variance) > 0 ? '+' : ''}
                              {formatQuantity(entry.variance, entry.unit)}
                            </span>
                          ) : (
                            <span className="text-faint">Not recorded</span>
                          )}
                        </td>
                      )}
                      <td className="border-b border-line px-3 py-2 text-right text-muted">
                        {entry.countedAt ? formatDateTime(entry.countedAt) : <span className="text-faint">Not counted</span>}
                      </td>
                    </tr>
                  );
                })}
                {c.entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted">
                      No entries yet. Start the count to generate the count sheet.
                    </td>
                  </tr>
                )}
              </tbody>
          </CompactTable>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Count details" />
          <div className="px-4 py-4">
            <DescriptionList
              className="sm:grid-cols-1"
              items={[
                { term: 'Site', detail: c.siteName },
                { term: 'Location', detail: c.locationName },
                { term: 'Scope', detail: label(c.scope) },
                { term: 'Blind count', detail: c.blindCount ? 'Yes' : 'No' },
                { term: 'Created by', detail: c.createdByName },
                ...(c.startedAt ? [{ term: 'Started', detail: formatDate(c.startedAt) }] : []),
                ...(c.submittedAt ? [{ term: 'Submitted', detail: formatDate(c.submittedAt) }] : []),
                ...(c.reviewedAt ? [{ term: 'Reviewed', detail: formatDate(c.reviewedAt) }] : []),
                ...(c.postedAt ? [{ term: 'Posted', detail: formatDate(c.postedAt) }] : []),
                ...(c.reviewNote ? [{ term: 'Review note', detail: c.reviewNote }] : []),
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Start */}
      <ConfirmDialog
        open={activeAction === 'start'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Start this count?"
        description="The system will generate a count sheet based on current stock. Counters can then record physical quantities."
        confirmLabel="Start count"
        loading={isAnyPending}
        onConfirm={doStart}
      />

      {/* Enter quantities */}
      <Dialog
        open={activeAction === 'enter'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Enter counted quantities"
        wide
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={isAnyPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={isAnyPending} onClick={doSaveEntries}>
              Save quantities
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {c.entries.map((entry) => (
            <div key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <Field
                label={`${entry.itemSku}: ${entry.itemName}`}
                hint={
                  !c.blindCount && entry.expectedQuantity != null
                    ? `Expected: ${formatQuantity(entry.expectedQuantity, entry.unit)}`
                    : undefined
                }
              >
                <NumberField
                  aria-label={`Counted quantity for ${entry.itemSku}`}
                  value={entryValues[entry.id] ?? ''}
                  onValueChange={(value) =>
                    setEntryValues((prev) => ({ ...prev, [entry.id]: value }))
                  }
                  unit={entry.unit}
                  placeholder="0"
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  aria-label={`Notes for ${entry.itemSku}`}
                  value={entryNotes[entry.id] ?? ''}
                  onChange={(e) =>
                    setEntryNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))
                  }
                  className="min-h-0 resize-none"
                  placeholder="Optional"
                />
              </Field>
            </div>
          ))}
        </div>
      </Dialog>

      {/* Submit */}
      <ConfirmDialog
        open={activeAction === 'submit'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Submit count for review?"
        description="The count will be sent to a reviewer. You will not be able to change quantities after submission."
        confirmLabel="Submit count"
        loading={isAnyPending}
        onConfirm={doSubmit}
      />

      {/* Approve */}
      {c.materialVariance && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-warning bg-warning-subtle px-4 py-3 text-sm">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>This count has one or more material variances. Review each entry carefully before approving.</p>
        </div>
      )}
      <Dialog
        open={activeAction === 'approve'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Approve this count?"
        description="Approving marks the count as reviewed. A separate post step writes the variances to the ledger."
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={isAnyPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={isAnyPending} onClick={doApprove}>
              Approve count
            </Button>
          </>
        }
      >
        <Field label="Review note">
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Optional observation for the audit trail"
            maxLength={500}
          />
        </Field>
      </Dialog>

      {/* Post */}
      <ConfirmDialog
        open={activeAction === 'post'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Post count to ledger?"
        description="Variance movements will be written as immutable ledger entries. This cannot be undone."
        confirmLabel="Post to ledger"
        confirmVariant="primary"
        loading={isAnyPending}
        onConfirm={doPost}
      />
    </div>
  );
}
