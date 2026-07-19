import { useState } from 'react';
import { isApiError } from '@/shared/api/problem';
import { Dialog } from '@/shared/ui/overlays';
import { Button } from '@/shared/ui/controls';
import { ErrorSummary, Field } from '@/shared/ui/controls';
import { TextField, Select } from '@/shared/ui/controls';
import { toast } from '@/shared/ui/toast';
import { label } from '@/shared/format/format';
import { useCreateLocation, type LocationInput } from './api';

const TYPES: LocationInput['type'][] = ['warehouse', 'yard', 'workshop', 'cage', 'tank', 'vehicle_store', 'bin'];

export function LocationFormDialog({ siteId, open, onOpenChange }: { siteId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateLocation(siteId);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationInput['type']>('warehouse');
  const errors = !name.trim() ? ['Enter a location name.'] : [];
  const apiErrors = isApiError(create.error) ? [create.error.problem.detail ?? 'Could not create the location.'] : [];
  const submit = () => {
    if (errors.length > 0) return;
    create.mutate(
      { name: name.trim(), type },
      {
        onSuccess: (location) => {
          toast('success', 'Location created', `${location.code} was generated automatically.`);
          setName('');
          onOpenChange(false);
        },
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New storage location" description="The portal generates the location code when you save." footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" loading={create.isPending} onClick={submit}>Create location</Button></>}>
      <div className="space-y-3">
        {apiErrors.length > 0 && <ErrorSummary errors={apiErrors} />}
        <p className="rounded-md border border-line bg-sunken px-3 py-2 text-xs text-muted">No code entry is required. Location codes are sequential and immutable.</p>
        <Field label="Name" required><TextField value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Type" required><Select value={type} onValueChange={(value) => setType(value as LocationInput['type'])} options={TYPES.map((value) => ({ value, label: label(value) }))} /></Field>
        {errors.length > 0 && <ErrorSummary errors={errors} />}
      </div>
    </Dialog>
  );
}
