import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSitesReference, useSiteLocations, useItemCategories } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button, Checkbox } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Select, TextArea } from '@/shared/ui/controls';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { useCreateCount } from './api';

export function CountNewPage() {
  const sites = useSitesReference();
  const [siteId, setSiteId] = useState('');
  const locations = useSiteLocations(siteId || undefined);
  const [locationId, setLocationId] = useState('');
  const [scope, setScope] = useState<'all_items' | 'category' | 'selected_items'>('all_items');
  const [scopeCategoryId, setScopeCategoryId] = useState('');
  const [blindCount, setBlindCount] = useState(false);
  const [notes, setNotes] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const categories = useItemCategories();
  const create = useCreateCount();
  const navigate = useNavigate();

  const activeSites = (sites.data ?? []).filter((s) => s.status === 'active');
  const activeLocations = (locations.data ?? []).filter((l) => l.status === 'active');

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!siteId) errors.push('Select a site.');
    if (!locationId) errors.push('Select a location.');
    if (scope === 'category' && !scopeCategoryId) errors.push('Select a category for the scope.');
    return errors;
  }, [siteId, locationId, scope, scopeCategoryId]);

  const serverErrors = isApiError(create.error)
    ? [
        ...(create.error.problem.detail ? [create.error.problem.detail] : []),
        ...Object.values(create.error.fieldErrors).flat(),
      ]
    : create.error
      ? ['The count could not be created. Please try again.']
      : [];

  const post = () => {
    create.mutate(
      {
        siteId,
        locationId,
        scope,
        ...(scope === 'category' && scopeCategoryId ? { scopeCategoryId } : {}),
        blindCount,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (count) => {
          setReviewOpen(false);
          toast('success', 'Count created', `${count.countNumber} is ready to start.`);
          void navigate(`/inventory/counts/${count.id}`);
        },
        onError: () => setReviewOpen(false),
      },
    );
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (validationErrors.length > 0) return;
    setReviewOpen(true);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Stock counts', to: '/inventory/counts' }, { label: 'New count' }]}
        title="New stock count"
        description="Create a count sheet for a location. Counters record quantities; variances post to the ledger after review."
      />

      <Card className="max-w-2xl">
        <CardHeader title="Count details" />
        <div className="space-y-4 px-4 py-4">
          {attempted && validationErrors.length > 0 && (
            <ErrorSummary errors={validationErrors} />
          )}
          {serverErrors.length > 0 && (
            <ErrorSummary errors={serverErrors} />
          )}

          <Field label="Site" required>
            <Select
              value={siteId}
              onValueChange={(value) => {
                setSiteId(value);
                setLocationId('');
              }}
              options={activeSites.map((site) => ({ value: site.id, label: site.name }))}
              placeholder="Select a site"
              aria-required="true"
            />
          </Field>

          <Field label="Location" required hint={siteId ? undefined : 'Choose a site first'}>
            <Select
              value={locationId}
              onValueChange={setLocationId}
              options={activeLocations.map((location) => ({ value: location.id, label: location.name }))}
              placeholder="Select a location"
              disabled={!siteId || activeLocations.length === 0}
              aria-required="true"
            />
          </Field>

          <Field label="Scope" hint="Which items to include in this count">
            <Select
              value={scope}
              onValueChange={(value) => setScope(value as typeof scope)}
              options={[
                { value: 'all_items', label: 'All items at this location' },
                { value: 'category', label: 'Items in a specific category' },
              ]}
            />
          </Field>

          {scope === 'category' && (
            <Field label="Category" required>
              <Select
                value={scopeCategoryId}
                onValueChange={setScopeCategoryId}
                options={(categories.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
                placeholder="Select a category"
                aria-required="true"
              />
            </Field>
          )}

          <Field
            label="Blind count"
            hint="Counters do not see expected quantities; reduces anchoring bias"
          >
            <Checkbox
              checked={blindCount}
              onCheckedChange={setBlindCount}
              label="Enable blind count"
            />
          </Field>

          <Field label="Notes">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note for the count sheet"
              maxLength={1000}
            />
          </Field>
        </div>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => void navigate('/inventory/counts')}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create count
        </Button>
      </div>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={(open) => !open && setReviewOpen(false)}
        title="Create this stock count?"
        description={`A count sheet will be generated for ${activeLocations.find((l) => l.id === locationId)?.name ?? 'the selected location'} based on current stock balances.`}
        confirmLabel="Create count"
        loading={create.isPending}
        onConfirm={post}
      />
    </div>
  );
}
