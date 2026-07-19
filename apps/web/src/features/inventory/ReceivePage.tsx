import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { useSitesReference, useSiteLocations } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button, DatePicker } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { TextField, Select, NumberField, TextArea } from '@/shared/ui/controls';
import { LineItemEditor } from '@/shared/ui/data/CompactTable';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { decAdd, isPositiveDec, isValidQuantity } from '@/shared/format/dec';
import { formatQuantity, todayISODate } from '@/shared/format/format';
import type { ItemSummary } from '@/features/items/api';
import { usePostReceipt } from './api';
import { ItemPicker } from './ItemPicker';

interface Line {
  item: ItemSummary;
  quantity: string;
  batchCode: string;
}

export function ReceivePage() {
  const sites = useSitesReference();
  const [siteId, setSiteId] = useState('');
  const locations = useSiteLocations(siteId || undefined);
  const [locationId, setLocationId] = useState('');
  const [reference, setReference] = useState('');
  const [receivedAt, setReceivedAt] = useState(todayISODate());
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const receipt = usePostReceipt();
  const navigate = useNavigate();

  const activeLocations = (locations.data ?? []).filter((location) => location.status === 'active');

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!siteId) errors.push('Select a destination site.');
    if (!locationId) errors.push('Select a destination location.');
    if (!reference.trim()) errors.push('Enter a supplier or delivery reference.');
    if (!receivedAt) errors.push('Enter the receipt date.');
    if (lines.length === 0) errors.push('Add at least one item line.');
    lines.forEach((line) => {
      if (!isValidQuantity(line.quantity) || !isPositiveDec(line.quantity)) {
        errors.push(`Enter a positive quantity for ${line.item.sku}.`);
      }
      if (line.item.trackingMode === 'batch' && !line.batchCode.trim()) {
        errors.push(`${line.item.sku} is batch tracked. Enter a batch code.`);
      }
    });
    return errors;
  }, [siteId, locationId, reference, receivedAt, lines]);

  const serverErrors = isApiError(receipt.error)
    ? [
        ...(receipt.error.problem.detail ? [receipt.error.problem.detail] : []),
        ...Object.values(receipt.error.fieldErrors).flat(),
      ]
    : receipt.error
      ? ['The receipt could not be posted. Please try again.']
      : [];

  const updateLine = (itemId: string, changes: Partial<Pick<Line, 'quantity' | 'batchCode'>>) => {
    setLines((current) =>
      current.map((line) => (line.item.id === itemId ? { ...line, ...changes } : line)),
    );
  };

  const post = () => {
    receipt.mutate(
      {
        siteId,
        locationId,
        reference: reference.trim(),
        receivedAt,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lines: lines.map((line) => ({
          itemId: line.item.id,
          quantity: line.quantity,
          ...(line.batchCode.trim() ? { batchCode: line.batchCode.trim() } : {}),
        })),
      },
      {
        onSuccess: (movements) => {
          setReviewOpen(false);
          toast(
            'success',
            'Receipt posted',
            `${movements.length} movement(s) recorded under ${movements[0]?.referenceLabel ?? 'the new receipt'}.`,
          );
          void navigate('/inventory/movements');
        },
        onError: () => setReviewOpen(false),
      },
    );
  };

  const siteName = sites.data?.find((site) => site.id === siteId)?.name ?? '';
  const locationName = activeLocations.find((location) => location.id === locationId)?.name ?? '';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Receive stock"
        description="Record incoming stock against a supplier or delivery reference. Posting writes immutable ledger entries."
      />

      {(attempted && validationErrors.length > 0) || serverErrors.length > 0 ? (
        <div className="mb-4">
          <ErrorSummary errors={attempted && validationErrors.length > 0 ? validationErrors : serverErrors} />
        </div>
      ) : null}

      <Card>
        <CardHeader title="1. Destination" description="Where is the stock arriving?" />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
          <Field label="Site" required>
            <Select
              value={siteId}
              onValueChange={(value) => {
                setSiteId(value);
                setLocationId('');
              }}
              options={(sites.data ?? []).filter((site) => site.status === 'active').map((site) => ({ value: site.id, label: site.name }))}
              placeholder="Select site"
            />
          </Field>
          <Field label="Location" required hint={siteId ? undefined : 'Choose a site first'}>
            <Select value={locationId} onValueChange={setLocationId} disabled={!siteId} options={activeLocations.map((location) => ({ value: location.id, label: location.name }))} placeholder="Select location" />
          </Field>
          <Field label="Supplier / delivery reference" required hint="For example DEMO-DN-4482">
            <TextField value={reference} onChange={(event) => setReference(event.target.value)} maxLength={60} />
          </Field>
          <Field label="Receipt date" required>
            <DatePicker aria-label="Receipt date" value={receivedAt} max={todayISODate()} onValueChange={setReceivedAt} />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="2. Items" description="Add each received item and quantity." />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <ItemPicker
            onSelect={(item) =>
              setLines((current) => [...current, { item, quantity: '', batchCode: '' }])
            }
            excludeIds={lines.map((line) => line.item.id)}
          />
          {lines.length > 0 && (
            <LineItemEditor label="Receipt line items">
                <caption className="sr-only">Receipt lines</caption>
                <thead>
                  <tr className="text-left text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                    <th scope="col" className="border-b border-line px-2 py-2">Item</th>
                    <th scope="col" className="w-32 border-b border-line px-2 py-2 text-right">Quantity</th>
                    <th scope="col" className="w-36 border-b border-line px-2 py-2">Batch</th>
                    <th scope="col" className="w-12 border-b border-line px-2 py-2">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.item.id}>
                      <td className="border-b border-line px-2 py-2">
                        <span className="font-medium" data-numeric>{line.item.sku}</span>
                        <span className="block text-xs text-muted">{line.item.name}</span>
                      </td>
                      <td className="border-b border-line px-2 py-2">
                        <NumberField
                          aria-label={`Quantity for ${line.item.sku} in ${line.item.baseUnit}`}
                          value={line.quantity}
                          onValueChange={(value) => updateLine(line.item.id, { quantity: value })}
                          unit={line.item.baseUnit}
                          placeholder="0"
                        />
                      </td>
                      <td className="border-b border-line px-2 py-2">
                        {line.item.trackingMode === 'batch' ? (
                          <TextField
                            aria-label={`Batch code for ${line.item.sku}`}
                            value={line.batchCode}
                            onChange={(event) => updateLine(line.item.id, { batchCode: event.target.value })}
                            placeholder="Required"
                          />
                        ) : <span className="text-xs text-faint">Not applicable</span>}
                      </td>
                      <td className="border-b border-line px-2 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${line.item.sku}`}
                          onClick={() => setLines((current) => current.filter((l) => l.item.id !== line.item.id))}
                        >
                          <Trash2 aria-hidden className="size-4 text-danger" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </LineItemEditor>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="3. Notes" description="Optional context for the audit trail." />
        <div className="px-4 py-4 sm:px-5">
          <Field label="Notes">
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-line bg-canvas/95 py-3 backdrop-blur">
        <Button onClick={() => void navigate(-1)}>Cancel</Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setAttempted(true);
            if (validationErrors.length === 0) setReviewOpen(true);
          }}
        >
          Review &amp; post receipt
        </Button>
      </div>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Post this receipt?"
        description={`Stock will be added at ${siteName} / ${locationName}. Posted movements cannot be edited.`}
        confirmLabel="Post receipt"
        loading={receipt.isPending}
        onConfirm={post}
      >
        <ul className="space-y-1.5 text-sm">
          {lines.map((line) => (
            <li key={line.item.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                <span className="font-medium" data-numeric>{line.item.sku}</span>{' '}
                <span className="text-muted">{line.item.name}</span>
              </span>
              <span className="font-medium whitespace-nowrap" data-numeric>
                +{formatQuantity(line.quantity || '0', line.item.baseUnit)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-line pt-2 text-xs text-muted" data-numeric>
          Reference {reference || 'Not provided'} · {receivedAt} · Total lines {lines.length} · Total quantity{' '}
          {formatQuantity(lines.reduce((sum, line) => decAdd(sum, line.quantity || '0'), '0'))}
        </p>
      </ConfirmDialog>
    </div>
  );
}
