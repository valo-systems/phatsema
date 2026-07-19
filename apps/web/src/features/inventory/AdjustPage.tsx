import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSitesReference, useSiteLocations, useReasons } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button, DatePicker } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Select, NumberField, TextArea } from '@/shared/ui/controls';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { isPositiveDec, isValidQuantity } from '@/shared/format/dec';
import { formatQuantity, todayISODate } from '@/shared/format/format';
import { usePostAdjustment } from './api';
import { ItemPicker } from './ItemPicker';
import type { ItemSummary } from '@/features/items/api';

export function AdjustPage() {
  const sites = useSitesReference();
  const [siteId, setSiteId] = useState('');
  const locations = useSiteLocations(siteId || undefined);
  const [locationId, setLocationId] = useState('');
  const reasons = useReasons('adjustment');
  const [itemSel, setItemSel] = useState<ItemSummary | null>(null);
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [adjustedAt, setAdjustedAt] = useState(todayISODate());
  const [notes, setNotes] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const adjust = usePostAdjustment();
  const navigate = useNavigate();

  const activeLocations = (locations.data ?? []).filter((l) => l.status === 'active');

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!siteId) errors.push('Select a site.');
    if (!locationId) errors.push('Select a storage location.');
    if (!itemSel) errors.push('Select the item to adjust.');
    if (!isValidQuantity(quantity) || !isPositiveDec(quantity)) errors.push('Enter a positive quantity.');
    if (!reasonCode) errors.push('Select a reason code.');
    return errors;
  }, [siteId, locationId, itemSel, quantity, reasonCode]);

  const serverErrors = isApiError(adjust.error)
    ? [
        ...(adjust.error.problem.detail ? [adjust.error.problem.detail] : []),
        ...Object.values(adjust.error.fieldErrors).flat(),
      ]
    : adjust.error
      ? ['The adjustment could not be posted. Please try again.']
      : [];

  const post = () => {
    if (!itemSel) return;
    adjust.mutate(
      {
        siteId,
        locationId,
        itemId: itemSel.id,
        direction,
        quantity,
        reasonCode,
        adjustedAt,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (movements) => {
          setReviewOpen(false);
          toast('success', 'Adjustment posted', `${movements.length} movement(s) recorded.`);
          void navigate('/inventory/movements');
        },
        onError: () => setReviewOpen(false),
      },
    );
  };

  const siteName = sites.data?.find((s) => s.id === siteId)?.name ?? '';
  const locationName = activeLocations.find((l) => l.id === locationId)?.name ?? '';
  const reasonLabel = reasons.data?.find((r) => r.code === reasonCode)?.name ?? reasonCode;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Adjust stock"
        description="Increase or decrease the quantity of a single item at a specific location. Posting writes an immutable ledger entry."
      />

      {(attempted && validationErrors.length > 0) || serverErrors.length > 0 ? (
        <div className="mb-4">
          <ErrorSummary errors={attempted && validationErrors.length > 0 ? validationErrors : serverErrors} />
        </div>
      ) : null}

      <Card>
        <CardHeader title="1. Location" description="Where is the stock held?" />
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
            <Select
              value={locationId}
              onValueChange={setLocationId}
              disabled={!siteId}
              options={activeLocations.map((location) => ({ value: location.id, label: location.name }))}
              placeholder="Select location"
            />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="2. Item and quantity" />
        <div className="space-y-4 px-4 py-4 sm:px-5">
          {!itemSel ? (
            <Field label="Item" required>
              <ItemPicker onSelect={(item) => setItemSel(item)} />
            </Field>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-sunken px-3 py-2.5">
              <div>
                <span className="text-sm font-medium" data-numeric>
                  {itemSel.sku}
                </span>
                <span className="ml-2 text-sm text-muted">{itemSel.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setItemSel(null)} className="text-danger">
                Change
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Direction" required>
              <Select
                value={direction}
                onValueChange={(value) => setDirection(value as 'increase' | 'decrease')}
                options={[{ value: 'increase', label: 'Increase (+)' }, { value: 'decrease', label: 'Decrease (-)' }]}
              />
            </Field>
            <Field label="Quantity" required>
              <NumberField
                aria-label={`Quantity${itemSel ? ` in ${itemSel.baseUnit}` : ''}`}
                value={quantity}
                onValueChange={setQuantity}
                unit={itemSel?.baseUnit}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reason" required>
              <Select value={reasonCode} onValueChange={setReasonCode} options={(reasons.data ?? []).map((reason) => ({ value: reason.code, label: reason.name }))} placeholder="Select reason" />
            </Field>
            <Field label="Adjustment date" required control="custom">
              <DatePicker
                aria-label="Adjustment date"
                value={adjustedAt}
                max={todayISODate()}
                onValueChange={setAdjustedAt}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="3. Notes" description="Evidence or context for the audit trail." />
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
          Review &amp; post adjustment
        </Button>
      </div>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Post this adjustment?"
        description={`${direction === 'increase' ? 'Increases' : 'Decreases'} stock at ${siteName} / ${locationName}. Posted movements cannot be edited.`}
        confirmLabel="Post adjustment"
        loading={adjust.isPending}
        onConfirm={post}
      >
        {itemSel && (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Item</dt>
              <dd className="font-medium" data-numeric>
                {itemSel.sku}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Quantity</dt>
              <dd className="font-medium" data-numeric>
                {direction === 'increase' ? '+' : '−'}
                {formatQuantity(quantity || '0', itemSel.baseUnit)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Reason</dt>
              <dd>{reasonLabel}</dd>
            </div>
          </dl>
        )}
      </ConfirmDialog>
    </div>
  );
}
