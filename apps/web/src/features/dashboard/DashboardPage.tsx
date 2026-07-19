import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { components } from '@phatsema/contracts/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowLeftRight, ArrowRight, Boxes, MapPin, Tags, Truck } from 'lucide-react';
import { api, unwrap } from '@/shared/api/client';
import { useSiteScope } from '@/shared/site-scope';
import { can, useSession } from '@/shared/auth/session';
import { QUICK_ACTIONS } from '@/app/nav';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, PageSkeleton } from '@/shared/ui/surfaces';
import { MetricStrip } from '@/shared/ui/data/MetricStrip';
import { ErrorState, EmptyState } from '@/shared/ui/states';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { LinkButton } from '@/shared/ui/controls';
import { formatDate, formatMoney, formatRelative, label } from '@/shared/format/format';

type Dashboard = components['schemas']['Dashboard'];

function useDashboard(siteId: string | null) {
  return useQuery({
    queryKey: ['dashboard', siteId],
    queryFn: async () =>
      unwrap<{ data: Dashboard }>(
        await api.GET('/dashboard', {
          params: { query: { days: 30, ...(siteId ? { siteId } : {}) } },
        }),
      ).data,
  });
}

const HEALTH_SEGMENTS = [
  { key: 'healthy' as const, className: 'bg-success' },
  { key: 'low' as const, className: 'bg-warning' },
  { key: 'outOfStock' as const, className: 'bg-danger' },
  { key: 'excess' as const, className: 'bg-info' },
  { key: 'quarantined' as const, className: 'bg-shell' },
];

const healthLabel: Record<string, string> = {
  healthy: 'Healthy',
  low: 'Low',
  outOfStock: 'Out of stock',
  excess: 'Excess',
  quarantined: 'Quarantined',
};

export function DashboardPage() {
  const { siteId } = useSiteScope();
  const session = useSession();
  const dashboard = useDashboard(siteId);
  const user = session.data;

  if (dashboard.isPending) return <PageSkeleton />;
  if (dashboard.isError) return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;

  const data = dashboard.data;
  const { totals } = data;
  const healthTotal = HEALTH_SEGMENTS.reduce((sum, segment) => sum + data.inventoryHealth[segment.key], 0);
  const quickActions = QUICK_ACTIONS.filter((action) => can(user, action.permission));

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description={siteId ? 'Scoped to the selected site.' : 'Network view across all permitted sites.'}
        meta={<Badge tone="warning">Demo data · illustrative values</Badge>}
        actions={
          quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <LinkButton key={action.to} to={action.to} size="sm" variant={index === 0 ? 'primary' : 'secondary'}>
                  {action.label}
                </LinkButton>
              ))}
            </div>
          )
        }
      />

      {/* KPI row */}
      <MetricStrip metrics={[
        { label: 'Stock value', value: formatMoney(totals.stockValue), hint: 'Demo valuation', icon: <Boxes aria-hidden className="size-4" /> },
        { label: 'Items', value: totals.itemCount, icon: <Tags aria-hidden className="size-4" /> },
        { label: 'Assets', value: totals.assetCount, icon: <Truck aria-hidden className="size-4" /> },
        { label: 'Sites', value: totals.siteCount, icon: <MapPin aria-hidden className="size-4" /> },
        { label: 'Low stock', value: totals.lowStockCount, tone: totals.lowStockCount > 0 ? 'warning' : 'default', icon: <AlertTriangle aria-hidden className="size-4" /> },
        { label: 'In transit', value: totals.transfersInTransit, hint: totals.unresolvedVariances > 0 ? `${totals.unresolvedVariances} variance(s) to review` : undefined, icon: <ArrowLeftRight aria-hidden className="size-4" /> },
      ]} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Stock by site */}
        <Card>
          <CardHeader title="Stock by site" description="Demo stock value per site (ZAR)" />
          <div className="h-64 px-3 py-3" aria-hidden={data.stockBySite.length === 0}>
            {data.stockBySite.length === 0 ? (
              <EmptyState title="No sites in scope" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockBySite.map((row) => ({ name: row.siteName.replace(/^DEMO /, ''), value: Number(row.stockValue) }))} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} interval={0} angle={-12} height={44} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `R${Math.round(value / 1000)}k`} width={52} />
                  <ChartTooltip formatter={(value) => formatMoney(String(value))} cursor={{ fill: 'var(--color-sunken)' }} />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="sr-only">
            Stock value by site: {data.stockBySite.map((row) => `${row.siteName}: ${formatMoney(row.stockValue)}`).join('; ')}
          </p>
        </Card>

        {/* Movement trend */}
        <Card>
          <CardHeader title="Movement trend" description="Inbound vs outbound movements, last 30 days" />
          <div className="h-64 px-3 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.movementTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} tickFormatter={(value: string) => formatDate(value).slice(0, 6)} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip labelFormatter={(value) => formatDate(String(value))} />
                <Line type="monotone" dataKey="inbound" name="Inbound" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" name="Outbound" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Inventory health */}
        <Card>
          <CardHeader title="Inventory health" description="Distribution of item stock states" />
          <div className="px-4 py-4">
            {healthTotal === 0 ? (
              <EmptyState title="No stock in scope" />
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-pill" role="img" aria-label={`Inventory health: ${HEALTH_SEGMENTS.map((segment) => `${healthLabel[segment.key]} ${data.inventoryHealth[segment.key]}`).join(', ')}`}>
                  {HEALTH_SEGMENTS.map((segment) =>
                    data.inventoryHealth[segment.key] > 0 ? (
                      <div
                        key={segment.key}
                        className={segment.className}
                        style={{ width: `${(data.inventoryHealth[segment.key] / healthTotal) * 100}%` }}
                      />
                    ) : null,
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {HEALTH_SEGMENTS.map((segment) => (
                    <li key={segment.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-secondary">
                        <span aria-hidden className={`size-2.5 rounded-pill ${segment.className}`} />
                        {healthLabel[segment.key]}
                      </span>
                      <span data-numeric className="font-medium text-ink">
                        {data.inventoryHealth[segment.key]}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>

        {/* Transfers needing action */}
        <Card>
          <CardHeader
            title="Transfers needing action"
            actions={
              <Link to="/transfers" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                All transfers <ArrowRight aria-hidden className="size-3" />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {data.transfersNeedingAction.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No transfers are waiting on you.</li>
            )}
            {data.transfersNeedingAction.slice(0, 5).map((transfer) => (
              <li key={transfer.id}>
                <Link to={`/transfers/${transfer.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-sunken">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink" data-numeric>
                      {transfer.transferNumber}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {transfer.sourceSiteName} → {transfer.destinationSiteName}
                    </span>
                  </span>
                  <StatusPill status={transfer.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader
            title="Recent activity"
            actions={
              can(user, 'audit.view') ? (
                <Link to="/audit" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Audit log <ArrowRight aria-hidden className="size-3" />
                </Link>
              ) : undefined
            }
          />
          <ul className="divide-y divide-line">
            {data.recentActivity.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No recent activity in scope.</li>
            )}
            {data.recentActivity.slice(0, 6).map((event) => (
              <li key={event.id} className="px-4 py-2.5">
                <p className="text-[13px] text-ink">{event.summary}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {event.actorName} · {label(event.action)} · {formatRelative(event.occurredAt)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
