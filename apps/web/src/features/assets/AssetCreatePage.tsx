import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSitesReference, useSiteLocations } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/surfaces';
import { Button } from '@/shared/ui/controls';
import { ErrorSummary, Field } from '@/shared/ui/controls';
import { TextField, Select, NumberField } from '@/shared/ui/controls';
import { toast } from '@/shared/ui/toast';
import { label } from '@/shared/format/format';
import { useCreateAsset, type AssetInput } from './api';

const ASSET_TYPES: AssetInput['type'][] = ['plant', 'transport', 'tank', 'workshop_equipment', 'attachment'];
const OWNERSHIP: AssetInput['ownershipMode'][] = ['company_owned', 'consignment', 'client_owned'];

export function AssetCreatePage() {
  const navigate = useNavigate();
  const sites = useSitesReference();
  const create = useCreateAsset();
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetInput['type']>('plant');
  const [ownershipMode, setOwnershipMode] = useState<AssetInput['ownershipMode']>('company_owned');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [siteId, setSiteId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [meterType, setMeterType] = useState<'' | 'hours' | 'kilometres'>('');
  const [meterReading, setMeterReading] = useState('');
  const locations = useSiteLocations(siteId);

  const errors = useMemo(() => {
    const result: string[] = [];
    if (!name.trim()) result.push('Enter an asset name.');
    if (!make.trim()) result.push('Enter the manufacturer.');
    if (!model.trim()) result.push('Enter the model.');
    if (!serialNumber.trim()) result.push('Enter the manufacturer serial number.');
    if (!siteId) result.push('Select a site.');
    return result;
  }, [make, model, name, serialNumber, siteId]);

  const submit = () => {
    if (errors.length > 0) return;
    create.mutate(
      {
        name: name.trim(),
        type,
        ownershipMode,
        make: make.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        siteId,
        ...(registrationNumber.trim() ? { registrationNumber: registrationNumber.trim() } : {}),
        ...(locationId ? { locationId } : {}),
        ...(meterType ? { meterType } : {}),
        ...(meterReading.trim() ? { meterReading: meterReading.trim() } : {}),
      },
      {
        onSuccess: (asset) => {
          toast('success', 'Asset registered', `${asset.assetNumber} was generated automatically.`);
          void navigate(`/assets/${asset.id}`);
        },
      },
    );
  };

  const apiErrors = isApiError(create.error)
    ? [create.error.problem.detail ?? 'The asset could not be registered.']
    : create.error
      ? ['The asset could not be registered.']
      : [];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Assets', to: '/assets' }]}
        title="Register asset"
        description="Capture the manufacturer identity and operating assignment. The internal asset number is generated automatically."
      />
      <Card>
        <CardHeader title="Asset details" description="Serial and registration numbers remain user-entered because they come from external records." />
        <div className="space-y-4 p-4">
          {apiErrors.length > 0 && <ErrorSummary errors={apiErrors} />}
          <p className="rounded-md border border-line bg-sunken px-3 py-2 text-xs text-muted">
            The portal assigns the next asset number when this record is saved.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset name" required><TextField value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Type" required>
              <Select value={type} onValueChange={(value) => setType(value as AssetInput['type'])} options={ASSET_TYPES.map((value) => ({ value, label: label(value) }))} />
            </Field>
            <Field label="Ownership" required>
              <Select value={ownershipMode} onValueChange={(value) => setOwnershipMode(value as AssetInput['ownershipMode'])} options={OWNERSHIP.map((value) => ({ value, label: label(value) }))} />
            </Field>
            <Field label="Manufacturer" required><TextField value={make} onChange={(event) => setMake(event.target.value)} /></Field>
            <Field label="Model" required><TextField value={model} onChange={(event) => setModel(event.target.value)} /></Field>
            <Field label="Manufacturer serial number" required><TextField value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} /></Field>
            <Field label="Registration number"><TextField value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} placeholder="Optional" /></Field>
            <Field label="Site" required>
              <Select value={siteId} onValueChange={(value) => { setSiteId(value); setLocationId(''); }} options={(sites.data ?? []).filter((site) => site.status === 'active').map((site) => ({ value: site.id, label: site.name }))} placeholder="Select site" />
            </Field>
            <Field label="Location">
              <Select value={locationId} onValueChange={setLocationId} options={(locations.data ?? []).filter((location) => location.status === 'active').map((location) => ({ value: location.id, label: location.name }))} placeholder="No specific location" clearable disabled={!siteId} />
            </Field>
            <Field label="Meter type">
              <Select value={meterType} onValueChange={(value) => setMeterType(value as typeof meterType)} options={[{ value: 'hours', label: 'Hours' }, { value: 'kilometres', label: 'Kilometres' }]} placeholder="No meter" clearable />
            </Field>
            {meterType && <Field label="Opening meter reading"><NumberField value={meterReading} onValueChange={setMeterReading} unit={meterType === 'hours' ? 'hrs' : 'km'} placeholder="0" /></Field>}
          </div>
          {errors.length > 0 && <ErrorSummary errors={errors} />}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => void navigate('/assets')}>Cancel</Button>
            <Button variant="primary" loading={create.isPending} onClick={submit}>Register asset</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
