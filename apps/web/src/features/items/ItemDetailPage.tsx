import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { CompactTable } from '@/shared/ui/data/CompactTable';
import { ErrorState, EmptyState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { formatDateTime, formatQuantity, label } from '@/shared/format/format';
import { useItem, useItemBalances } from './api';
import { ItemFormDialog } from './ItemFormDialog';

type Movement = components['schemas']['Movement'];
type PageMeta = components['schemas']['PageMeta'];

export function ItemDetailPage() {
  const { itemId = '' } = useParams();
  const session = useSession();
  const item = useItem(itemId);
  const balances = useItemBalances(itemId);
  const [editOpen, setEditOpen] = useState(false);

  const movements = useQuery({
    queryKey: ['movements', 'item', itemId],
    queryFn: async () =>
      unwrap<{ data: Movement[]; meta: PageMeta }>(
        await api.GET('/movements', { params: { query: { itemId, page: 1, pageSize: 10, sort: '-occurredAt' } } }),
      ).data,
    enabled: Boolean(itemId),
  });

  if (item.isPending) return <PageSkeleton />;
  if (item.isError) return <ErrorState error={item.error} onRetry={() => void item.refetch()} />;

  const data = item.data;
  const canManage = can(session.data, P.catalogueManage);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Items', to: '/inventory/items' }, { label: data.sku }]}
        title={data.name}
        description={data.description}
        meta={
          <>
            <Badge tone="neutral">{data.sku}</Badge>
            <StatusPill status={data.stockHealth} />
            <StatusPill status={data.status} />
            <Badge tone="neutral">{label(data.inventoryType)}</Badge>
            {data.ownershipMode !== 'company_owned' && <Badge tone="info">{label(data.ownershipMode)}</Badge>}
          </>
        }
        actions={
          canManage && (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden className="size-4" /> Edit item
            </Button>
          )
        }
      />

      <MetricStrip metrics={[
        { label: 'On hand', value: formatQuantity(data.totalOnHand), hint: data.baseUnit },
        { label: 'Available', value: formatQuantity(data.totalAvailable), hint: data.baseUnit },
        { label: 'Reserved', value: formatQuantity(data.totalReserved), hint: data.baseUnit },
        { label: 'In transit', value: formatQuantity(data.totalInTransit), hint: data.baseUnit },
        { label: 'Quarantined', value: formatQuantity(data.totalQuarantined), hint: data.baseUnit, tone: Number(data.totalQuarantined) > 0 ? 'warning' : 'default' },
      ]} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Balance by site and location" />
            {balances.isError ? (
              <div className="p-4">
                <ErrorState error={balances.error} onRetry={() => void balances.refetch()} />
              </div>
            ) : (
              <CompactTable label="Item balances">
                  <caption className="sr-only">Balances by site and location</caption>
                  <thead className="bg-sunken text-left">
                    <tr>
                      {['Site', 'Location', 'On hand', 'Reserved', 'In transit', 'Available'].map((heading, index) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-ink-secondary uppercase ${index >= 2 ? 'text-right' : ''}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balances.data?.map((balance) => (
                      <tr key={`${balance.siteId}-${balance.locationId}-${balance.batchId ?? ''}`}>
                        <td className="border-b border-line px-3 py-2">
                          <Link to={`/sites/${balance.siteId}`} className="text-primary hover:underline">
                            {balance.siteName}
                          </Link>
                        </td>
                        <td className="border-b border-line px-3 py-2">{balance.locationName}</td>
                        <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                          {formatQuantity(balance.onHand)}
                        </td>
                        <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                          {formatQuantity(balance.reserved)}
                        </td>
                        <td className="border-b border-line px-3 py-2 text-right" data-numeric>
                          {formatQuantity(balance.inTransit)}
                        </td>
                        <td className="border-b border-line px-3 py-2 text-right font-medium" data-numeric>
                          {formatQuantity(balance.available)}
                        </td>
                      </tr>
                    ))}
                    {balances.data?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">
                          No stock is currently held for this item.
                        </td>
                      </tr>
                    )}
                  </tbody>
              </CompactTable>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Recent movements"
              actions={
                <Link
                  to={`/inventory/movements?itemId=${itemId}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Full ledger
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {movements.data?.length === 0 && (
                <li className="px-4 py-6">
                  <EmptyState title="No movements recorded" />
                </li>
              )}
              {movements.data?.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">
                      {label(movement.movementType)}{' '}
                      <span className="text-muted">· {movement.referenceLabel}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {movement.actorName} · {formatDateTime(movement.occurredAt)}
                    </p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap" data-numeric>
                    {formatQuantity(movement.quantity, movement.unit)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Item settings" />
          <div className="px-4 py-4">
            <DescriptionList
              className="sm:grid-cols-1"
              items={[
                { term: 'Category', detail: data.categoryName },
                { term: 'Base unit', detail: data.baseUnit },
                { term: 'Tracking', detail: label(data.trackingMode) },
                { term: 'Ownership', detail: label(data.ownershipMode) },
                {
                  term: 'Reorder point',
                  detail: data.reorderPoint ? formatQuantity(data.reorderPoint, data.baseUnit) : 'Not set',
                },
                {
                  term: 'Target level',
                  detail: data.targetLevel ? formatQuantity(data.targetLevel, data.baseUnit) : 'Not set',
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <ItemFormDialog open={editOpen} onOpenChange={setEditOpen} item={data} />
    </div>
  );
}
