import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

export interface Metric {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  icon?: ReactNode;
}

export function MetricStrip({
  metrics,
  className,
}: {
  metrics: Metric[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]',
        className,
      )}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="min-w-0 rounded-xl border border-line bg-surface px-4 py-4 shadow-table"
        >
          <dt className="flex items-start justify-between gap-3 text-xs font-medium text-muted">
            <span className="truncate">{metric.label}</span>
            {metric.icon && (
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted',
                  metric.tone === 'success' && 'bg-success-soft text-success',
                  metric.tone === 'warning' && 'bg-warning-soft text-warning',
                  metric.tone === 'danger' && 'bg-danger-soft text-danger',
                )}
              >
                {metric.icon}
              </span>
            )}
          </dt>
          <dd
            data-numeric
            className={cn(
              'mt-1 text-xl leading-tight font-semibold text-ink',
              metric.tone === 'warning' && 'text-warning',
              metric.tone === 'danger' && 'text-danger',
              metric.tone === 'success' && 'text-success',
            )}
          >
            {metric.value}
          </dd>
          {metric.hint && <p className="mt-1 text-xs text-muted">{metric.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
