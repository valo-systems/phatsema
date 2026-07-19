import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { useSitesReference, useSiteLocations } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Select, NumberField, TextArea } from '@/shared/ui/controls';
import { LineItemEditor } from '@/shared/ui/data/CompactTable';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { isPositiveDec, isValidQuantity } from '@/shared/format/dec';
import { formatQuantity } from '@/shared/format/format';
import { ItemPicker } from '@/features/inventory/ItemPicker';
import type { ItemSummary } from '@/features/items/api';
import { useCreateTransfer } from './api';

interface Line {
  item: ItemSummary;
  quantity: string;
}

export function TransferNewPage() {
  const sites = useSitesReference();
  const [sourceSiteId, setSourceSiteId] = useState('');
  const sourceLocations = useSiteLocations(sourceSiteId || undefined);
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destSiteId, setDestSiteId] = useState('');
  const destLocations = useSiteLocations(destSiteId || undefined);
  const [destLocationId, setDestLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const create = useCreateTransfer();
  const navigate = useNavigate();

  const activeSites = (sites.data ?? []).filter((s) => s.status === 'active');
  const activeSourceLocations = (sourceLocations.data ?? []).filter((l) => l.status === 'active');
  const activeDestLocations = (destLocations.data ?? []).filter((l) => l.status === 'active');

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!sourceSiteId) errors.push('Select a source site.');
    if (!sourceLocationId) errors.push('Select a source location.');
    if (!destSiteId) errors.push('Select a destination site.');
    if (!destLocationId) errors.push('Select a destination location.');
    if (sourceSiteId && destSiteId && sourceSiteId === destSiteId)
      errors.push('Source and destination sites must be different.');
    if (lines.length === 0) errors.push('Add at least one item line.');
    lines.forEach((line) => {
      if (!isValidQuantity(line.quantity) || !isPositiveDec(line.quantity)) {
        errors.push(`Enter a positive quantity for ${line.item.sku}.`);
      }
    });
    return errors;
  }, [sourceSiteId, sourceLocationId, destSiteId, destLocationId, lines]);

  const serverErrors = isApiError(create.error)
    ? [
        ...(create.error.problem.detail ? [create.error.problem.detail] : []),
        ...Object.values(create.error.fieldErrors).flat(),
      ]
    : create.error
      ? ['The transfer request could not be created. Please try again.']
      : [];

  const post = () => {
    create.mutate(
      {
        sourceSiteId,
        sourceLocationId,
        destinationSiteId: destSiteId,
        destinationLocationId: destLocationId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lines: lines.map((line) => ({
          itemId: line.item.id,
          requestedQuantity: line.quantity,
        })),
      },
      {
        onSuccess: (transfer) => {
          setReviewOpen(false);
          toast('success', 'Transfer created', `${transfer.transferNumber} has been saved as a draft.`);
          void navigate(`/transfers/${transfer.id}`);
        },
        onError: () => setReviewOpen(false),
      },
    );
  };

  const sourceSiteName = activeSites.find((s) => s.id === sourceSiteId)?.name ?? '';
  const destSiteName = activeSites.find((s) => s.id === destSiteId)?.name ?? '';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        breadcrumbs={[{ label: 'Transfers', to: '/transfers' }]}
        title="New transfer request"
        description="Request the movement of stock between sites. The transfer requires approval before dispatch."
      />

      {(attempted && validationErrors.length > 0) || serverErrors.length > 0 ? (
        <div className="mb-4">
          <ErrorSummary errors={attempted && validationErrors.length > 0 ? validationErrors : serverErrors} />
        </div>
      ) : null}

      <Card>
        <CardHeader title="1. Source" description="Where is the stock moving from?" />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
          <Field label="Source site" required>
            <Select
              value={sourceSiteId}
              onValueChange={(value) => {
                setSourceSiteId(value);
                setSourceLocationId('');
              }}
              options={activeSites.map((site) => ({ value: site.id, label: site.name }))}
              placeholder="Select site"
            />
          </Field>
          <Field label="Source location" required hint={sourceSiteId ? undefined : 'Choose a site first'}>
            <Select
              value={sourceLocationId}
              onValueChange={setSourceLocationId}
              disabled={!sourceSiteId}
              options={activeSourceLocations.map((location) => ({ value: location.id, label: location.name }))}
              placeholder="Select location"
            />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="2. Destination" description="Where is the stock moving to?" />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
          <Field label="Destination site" required>
            <Select
              value={destSiteId}
              onValueChange={(value) => {
                setDestSiteId(value);
                setDestLocationId('');
              }}
              options={activeSites.filter((site) => site.id !== sourceSiteId).map((site) => ({ value: site.id, label: site.name }))}
              placeholder="Select site"
            />
          </Field>
          <Field label="Destination location" required hint={destSiteId ? undefined : 'Choose a site first'}>
            <Select
              value={destLocationId}
              onValueChange={setDestLocationId}
              disabled={!destSiteId}
              options={activeDestLocations.map((location) => ({ value: location.id, label: location.name }))}
              placeholder="Select location"
            />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="3. Items" description="Add each item and requested quantity." />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <ItemPicker
            siteId={sourceSiteId || undefined}
            onSelect={(item) => setLines((current) => [...current, { item, quantity: '' }])}
            excludeIds={lines.map((l) => l.item.id)}
          />
          {lines.length > 0 && (
            <LineItemEditor label="Transfer line items">
                <caption className="sr-only">Transfer lines</caption>
                <thead>
                  <tr className="text-left text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                    <th scope="col" className="border-b border-line px-2 py-2">Item</th>
                    <th scope="col" className="w-36 border-b border-line px-2 py-2 text-right">Qty requested</th>
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
                          aria-label={`Quantity for ${line.item.sku}`}
                          value={line.quantity}
                          onValueChange={(value) =>
                            setLines((current) =>
                              current.map((l) =>
                                l.item.id === line.item.id ? { ...l, quantity: value } : l,
                              ),
                            )
                          }
                          unit={line.item.baseUnit}
                          placeholder="0"
                        />
                      </td>
                      <td className="border-b border-line px-2 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${line.item.sku}`}
                          onClick={() =>
                            setLines((current) => current.filter((l) => l.item.id !== line.item.id))
                          }
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
        <CardHeader title="4. Notes" description="Optional context for approvers." />
        <div className="px-4 py-4 sm:px-5">
          <Field label="Notes">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
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
          Review &amp; create transfer
        </Button>
      </div>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Create this transfer?"
        description={`Requests movement of ${lines.length} line(s) from ${sourceSiteName} to ${destSiteName}. The transfer will be saved as a draft pending submission and approval.`}
        confirmLabel="Create transfer"
        loading={create.isPending}
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
                {formatQuantity(line.quantity || '0', line.item.baseUnit)}
              </span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </div>
  );
}
