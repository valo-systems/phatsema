import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { api, unwrap } from '@/shared/api/client';
import { useSitesReference, useSiteLocations } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Input, Select, NumberField, Textarea } from '@/shared/ui/controls';
import { LineItemEditor } from '@/shared/ui/data/CompactTable';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { decCompare, isPositiveDec, isValidQuantity } from '@/shared/format/dec';
import { formatQuantity, label } from '@/shared/format/format';
import type { ItemSummary, StockBalance } from '@/features/items/api';
import { usePostIssue } from './api';
import { ItemPicker } from './ItemPicker';

interface Line {
  item: ItemSummary;
  quantity: string;
}

const PURPOSES = ['site_consumption', 'project', 'maintenance', 'fabrication_job', 'cost_centre'] as const;

export function IssuePage() {
  const sites = useSitesReference();
  const [siteId, setSiteId] = useState('');
  const locations = useSiteLocations(siteId || undefined);
  const [locationId, setLocationId] = useState('');
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>('site_consumption');
  const [reference, setReference] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const issue = usePostIssue();
  const navigate = useNavigate();

  const activeLocations = (locations.data ?? []).filter((location) => location.status === 'active');

  // Available balance for each selected line at the chosen location.
  const balanceQueries = useQueries({
    queries: lines.map((line) => ({
      queryKey: ['items', 'balances', line.item.id],
      queryFn: async () =>
        unwrap<{ data: StockBalance[] }>(
          await api.GET('/items/{itemId}/balances', { params: { path: { itemId: line.item.id } } }),
        ).data,
      enabled: Boolean(locationId),
    })),
  });

  const availableFor = (index: number): string | null => {
    const balances = balanceQueries[index]?.data;
    if (!balances || !locationId) return null;
    const match = balances.find((balance) => balance.locationId === locationId);
    return match?.available ?? '0';
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!siteId) errors.push('Select the source site.');
    if (!locationId) errors.push('Select the source location.');
    if (!recipient.trim()) errors.push('Enter the recipient.');
    if (lines.length === 0) errors.push('Add at least one item line.');
    lines.forEach((line, index) => {
      if (!isValidQuantity(line.quantity) || !isPositiveDec(line.quantity)) {
        errors.push(`Enter a positive quantity for ${line.item.sku}.`);
        return;
      }
      const available = availableFor(index);
      if (available !== null && decCompare(line.quantity, available) > 0) {
        errors.push(
          `${line.item.sku}: requested ${formatQuantity(line.quantity, line.item.baseUnit)} exceeds the available ${formatQuantity(available, line.item.baseUnit)}.`,
        );
      }
    });
    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, locationId, recipient, lines, balanceQueries.map((query) => query.data).join(',')]);

  const serverErrors = isApiError(issue.error)
    ? [
        ...(issue.error.problem.detail ? [issue.error.problem.detail] : []),
        ...Object.values(issue.error.fieldErrors).flat(),
      ]
    : issue.error
      ? ['The issue could not be posted. Please try again.']
      : [];

  const post = () => {
    issue.mutate(
      {
        siteId,
        locationId,
        purpose,
        recipient: recipient.trim(),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lines: lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
      },
      {
        onSuccess: (movements) => {
          setReviewOpen(false);
          toast('success', 'Issue posted', `${movements.length} movement(s) recorded.`);
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
        title="Issue stock"
        description="Issue stock to a purpose and recipient. Negative stock is blocked, so you can only issue what is available."
      />

      {(attempted && validationErrors.length > 0) || serverErrors.length > 0 ? (
        <div className="mb-4">
          <ErrorSummary errors={attempted && validationErrors.length > 0 ? validationErrors : serverErrors} />
        </div>
      ) : null}

      <Card>
        <CardHeader title="1. Source and purpose" />
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
          <Field label="Issue purpose" required>
            <Select value={purpose} onValueChange={(value) => setPurpose(value as typeof purpose)} options={PURPOSES.map((value) => ({ value, label: label(value) }))} />
          </Field>
          <Field label="Project / job / cost-centre reference" hint="Optional, e.g. DEMO-JOB-118">
            <Input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={60} />
          </Field>
          <Field label="Recipient" required hint="Person or team receiving the stock">
            <Input value={recipient} onChange={(event) => setRecipient(event.target.value)} maxLength={120} />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="2. Items" description="Availability is checked at the selected location." />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <ItemPicker
            {...(siteId ? { siteId } : {})}
            onSelect={(item) => setLines((current) => [...current, { item, quantity: '' }])}
            excludeIds={lines.map((line) => line.item.id)}
          />
          {lines.length > 0 && (
            <LineItemEditor label="Issue line items">
                <caption className="sr-only">Issue lines</caption>
                <thead>
                  <tr className="text-left text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                    <th scope="col" className="border-b border-line px-2 py-2">Item</th>
                    <th scope="col" className="w-36 border-b border-line px-2 py-2 text-right">Available here</th>
                    <th scope="col" className="w-32 border-b border-line px-2 py-2 text-right">Quantity</th>
                    <th scope="col" className="w-12 border-b border-line px-2 py-2">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const available = availableFor(index);
                    const over =
                      available !== null &&
                      isValidQuantity(line.quantity) &&
                      isPositiveDec(line.quantity) &&
                      decCompare(line.quantity, available) > 0;
                    return (
                      <tr key={line.item.id}>
                        <td className="border-b border-line px-2 py-2">
                          <span className="font-medium" data-numeric>{line.item.sku}</span>
                          <span className="block text-xs text-muted">{line.item.name}</span>
                        </td>
                        <td className="border-b border-line px-2 py-2 text-right text-muted" data-numeric>
                          {available === null ? 'Checking' : formatQuantity(available, line.item.baseUnit)}
                        </td>
                        <td className="border-b border-line px-2 py-2">
                          <NumberField
                            aria-label={`Quantity for ${line.item.sku} in ${line.item.baseUnit}`}
                            invalid={over}
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
                          {over && (
                            <p className="mt-1 text-right text-xs font-medium text-danger">Exceeds available</p>
                          )}
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
                    );
                  })}
                </tbody>
            </LineItemEditor>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="3. Notes" />
        <div className="px-4 py-4 sm:px-5">
          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
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
          Review &amp; post issue
        </Button>
      </div>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Post this issue?"
        description={`Stock will be issued from ${siteName} / ${locationName} to ${recipient || 'recipient not specified'} (${label(purpose)}). Posted movements cannot be edited.`}
        confirmLabel="Post issue"
        loading={issue.isPending}
        onConfirm={post}
      >
        <ul className="space-y-1.5 text-sm">
          {lines.map((line) => (
            <li key={line.item.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                <span className="font-medium" data-numeric>{line.item.sku}</span>{' '}
                <span className="text-muted">{line.item.name}</span>
              </span>
              <span className="font-medium whitespace-nowrap text-danger" data-numeric>
                −{formatQuantity(line.quantity || '0', line.item.baseUnit)}
              </span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </div>
  );
}
