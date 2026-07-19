import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Pencil, MapPin, Plus } from 'lucide-react';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { CompactTable } from '@/shared/ui/data/CompactTable';
import { ErrorState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { formatMoney, label } from '@/shared/format/format';
import { useSite, useSiteLocations } from './api';
import { SiteFormDialog } from './SiteFormDialog';
import { LocationFormDialog } from './LocationFormDialog';

export function SiteDetailPage() {
  const { siteId = '' } = useParams();
  const session = useSession();
  const site = useSite(siteId);
  const locations = useSiteLocations(siteId);
  const [editOpen, setEditOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  if (site.isPending) return <PageSkeleton />;
  if (site.isError) return <ErrorState error={site.error} onRetry={() => void site.refetch()} />;

  const data = site.data;
  const canManage = can(session.data, P.siteManage);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Sites', to: '/sites' }, { label: data.code }]}
        title={data.name}
        meta={
          <>
            <Badge tone="neutral">{data.code}</Badge>
            <Badge tone="neutral">{label(data.type)}</Badge>
            <StatusPill status={data.status} />
          </>
        }
        actions={
          canManage && (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden className="size-4" /> Edit site
            </Button>
          )
        }
      />

      <MetricStrip metrics={[
        { label: 'Stock value', value: formatMoney(data.stockValue) },
        { label: 'Item types', value: String(data.itemCount) },
        { label: 'Open transfers', value: String(data.openTransferCount), tone: data.openTransferCount > 0 ? 'warning' : 'default' },
        { label: 'Assets', value: String(data.assetCount) },
      ]} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader
            title="Storage locations"
            description={`${data.locationCount} location${data.locationCount !== 1 ? 's' : ''}`}
            actions={canManage ? <Button size="sm" onClick={() => setLocationOpen(true)}><Plus aria-hidden className="size-4" /> Add location</Button> : undefined}
          />
          {locations.isError ? (
            <div className="p-4">
              <ErrorState error={locations.error} onRetry={() => void locations.refetch()} />
            </div>
          ) : (
            <CompactTable label="Site locations">
                <caption className="sr-only">Storage locations</caption>
                <thead className="bg-sunken text-left">
                  <tr>
                    {['Code', 'Name', 'Type', 'Status'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-ink-secondary uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locations.data?.map((loc) => (
                    <tr key={loc.id} className="hover:bg-sunken/50">
                      <td className="border-b border-line px-3 py-2 font-medium" data-numeric>
                        {loc.code}
                      </td>
                      <td className="border-b border-line px-3 py-2">{loc.name}</td>
                      <td className="border-b border-line px-3 py-2 text-muted">{label(loc.type)}</td>
                      <td className="border-b border-line px-3 py-2">
                        <StatusPill status={loc.status} />
                      </td>
                    </tr>
                  ))}
                  {locations.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">
                        <MapPin aria-hidden className="mx-auto mb-2 size-6 text-faint" />
                        No locations have been created for this site.
                      </td>
                    </tr>
                  )}
                </tbody>
            </CompactTable>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Site details" />
            <div className="px-4 py-4">
              <DescriptionList
                className="sm:grid-cols-1"
                items={[
                  { term: 'Code', detail: data.code },
                  { term: 'Entity', detail: data.entityCode },
                  { term: 'Type', detail: label(data.type) },
                  { term: 'Country', detail: data.countryCode },
                  { term: 'Timezone', detail: data.timezone },
                  ...(data.contactName ? [{ term: 'Contact', detail: data.contactName }] : []),
                  ...(data.contactPhone ? [{ term: 'Phone', detail: data.contactPhone }] : []),
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Quick links" />
            <ul className="divide-y divide-line text-sm">
              {[
                { label: 'Stock balances at this site', to: `/inventory/balances?siteId=${siteId}` },
                { label: 'Movements at this site', to: `/inventory/movements?siteId=${siteId}` },
                { label: 'Transfers involving this site', to: `/transfers?siteId=${siteId}` },
                { label: 'Assets at this site', to: `/assets?siteId=${siteId}` },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 px-4 py-2.5 text-primary hover:bg-sunken"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <SiteFormDialog open={editOpen} onOpenChange={setEditOpen} site={data} />
      <LocationFormDialog siteId={siteId} open={locationOpen} onOpenChange={setLocationOpen} />
    </div>
  );
}
