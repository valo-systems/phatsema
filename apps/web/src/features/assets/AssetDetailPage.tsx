import { useState } from 'react';
import { useParams } from 'react-router';
import { Pencil, Clock } from 'lucide-react';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { isApiError } from '@/shared/api/problem';
import { useSitesReference } from '@/shared/api/reference';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { ErrorState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { Field } from '@/shared/ui/controls';
import { TextField, Select, NumberField } from '@/shared/ui/controls';
import { Dialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { formatDate, formatDateTime, formatQuantity, label } from '@/shared/format/format';
import {
  useAsset,
  useAssignAsset,
  useChangeAssetStatus,
  useRecordMeterReading,
  type Asset,
  type AssetDetail,
} from './api';

const STATUS_OPTIONS = [
  'available',
  'assigned',
  'on_hire',
  'in_maintenance',
  'out_of_service',
  'retired',
] as const;

type Action = 'assign' | 'status';

export function AssetDetailPage() {
  const { assetId = '' } = useParams();
  const session = useSession();
  const sites = useSitesReference();
  const asset = useAsset(assetId);
  const assign = useAssignAsset(assetId);
  const changeStatus = useChangeAssetStatus(assetId);
  const recordMeter = useRecordMeterReading(assetId);

  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [assignSiteId, setAssignSiteId] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState<Asset['status']>('available');
  const [meterReading, setMeterReading] = useState('');

  if (asset.isPending) return <PageSkeleton />;
  if (asset.isError) return <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />;

  const a: AssetDetail = asset.data;
  const canManage = can(session.data, P.assetManage);

  const openAssign = () => {
    setAssignSiteId(a.siteId);
    setAssignTo(a.assignedTo ?? '');
    setActiveAction('assign');
  };

  const openStatus = () => {
    setNewStatus(a.status);
    setMeterReading('');
    setActiveAction('status');
  };

  const handleSuccess = (msg: string) => {
    toast('success', msg);
    setActiveAction(null);
  };

  const handleError = (err: unknown) => {
    const msg = isApiError(err) ? err.problem.detail ?? 'Action failed.' : 'Action failed.';
    toast('error', 'Action failed', msg);
  };

  const doAssign = () => {
    assign.mutate(
      {
        siteId: assignSiteId,
        ...(assignTo.trim() ? { assignedTo: assignTo.trim() } : {}),
        version: a.version,
      },
      { onSuccess: () => handleSuccess('Asset assignment updated.'), onError: handleError },
    );
  };

  const doChangeStatus = () => {
    changeStatus.mutate(
      {
        status: newStatus,
        version: a.version,
      },
      {
        onSuccess: (updated) => {
          if (!meterReading.trim()) {
            handleSuccess('Asset status updated.');
            return;
          }
          recordMeter.mutate(
            { version: updated.version, reading: meterReading.trim() },
            {
              onSuccess: () => handleSuccess('Asset status and meter reading updated.'),
              onError: handleError,
            },
          );
        },
        onError: handleError,
      },
    );
  };

  const SERVICE_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
    ok: 'success',
    due_soon: 'warning',
    overdue: 'danger',
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Assets', to: '/assets' }, { label: a.assetNumber }]}
        title={a.name}
        meta={
          <>
            <Badge tone="neutral" data-numeric>{a.assetNumber}</Badge>
            <Badge tone="neutral">{label(a.type)}</Badge>
            <StatusPill status={a.status} />
            {a.serviceState && a.serviceState !== 'ok' && SERVICE_TONE[a.serviceState] != null && (
              <Badge tone={SERVICE_TONE[a.serviceState]!}>{label(a.serviceState)}</Badge>
            )}
          </>
        }
        actions={
          canManage && (
            <span className="flex gap-2">
              <Button onClick={openAssign}>Reassign</Button>
              <Button variant="primary" onClick={openStatus}>
                <Pencil aria-hidden className="size-4" /> Update status
              </Button>
            </span>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader title="Asset history" />
          <ul className="divide-y divide-line">
            {a.history.map((event) => (
              <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{event.summary}</p>
                  <p className="text-xs text-muted">
                    {event.byName} · {formatDateTime(event.occurredAt)}
                  </p>
                </div>
              </li>
            ))}
            {a.history.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No history recorded yet.</li>
            )}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Asset details" />
            <div className="px-4 py-4">
              <DescriptionList
                className="sm:grid-cols-1"
                items={[
                  { term: 'Make', detail: a.make },
                  { term: 'Model', detail: a.model },
                  { term: 'Serial', detail: a.serialNumber },
                  ...(a.registrationNumber ? [{ term: 'Registration', detail: a.registrationNumber }] : []),
                  { term: 'Ownership', detail: label(a.ownershipMode) },
                  { term: 'Site', detail: a.siteName },
                  ...(a.locationName ? [{ term: 'Location', detail: a.locationName }] : []),
                  ...(a.assignedTo ? [{ term: 'Assigned to', detail: a.assignedTo }] : []),
                  ...(a.meterType
                    ? [
                        { term: 'Meter type', detail: label(a.meterType) },
                        { term: 'Meter reading', detail: a.meterReading ? formatQuantity(a.meterReading, a.meterType === 'hours' ? 'hrs' : 'km') : 'Not recorded' },
                      ]
                    : []),
                  ...(a.nextServiceAt ? [{ term: 'Next service', detail: formatDate(a.nextServiceAt) }] : []),
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Assign dialog */}
      <Dialog
        open={activeAction === 'assign'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Reassign asset"
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={assign.isPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={assign.isPending} onClick={doAssign}>
              Save assignment
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Site" required>
            <Select value={assignSiteId} onValueChange={setAssignSiteId} options={(sites.data ?? []).filter((site) => site.status === 'active').map((site) => ({ value: site.id, label: site.name }))} placeholder="Select site" />
          </Field>
          <Field label="Assigned to" hint="Operator name or crew identifier">
            <TextField
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              placeholder="Optional"
              maxLength={100}
            />
          </Field>
        </div>
      </Dialog>

      {/* Status dialog */}
      <Dialog
        open={activeAction === 'status'}
        onOpenChange={(open) => !open && setActiveAction(null)}
        title="Update asset status"
        footer={
          <>
            <Button onClick={() => setActiveAction(null)} disabled={changeStatus.isPending || recordMeter.isPending}>
              Cancel
            </Button>
            <Button variant="primary" loading={changeStatus.isPending || recordMeter.isPending} onClick={doChangeStatus}>
              Save status
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Status" required>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as Asset['status'])}
              options={STATUS_OPTIONS.map((value) => ({ value, label: label(value) }))}
            />
          </Field>
          {a.meterType && (
            <Field label={`${label(a.meterType)} reading`} hint="Optional. Records a new meter reading.">
              <NumberField
                aria-label="Meter reading"
                value={meterReading}
                onValueChange={setMeterReading}
                unit={a.meterType === 'hours' ? 'hrs' : 'km'}
                placeholder={`0 ${a.meterType === 'hours' ? 'hrs' : 'km'}`}
              />
            </Field>
          )}
        </div>
      </Dialog>
    </div>
  );
}
