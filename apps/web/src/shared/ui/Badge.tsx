import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  PackageX,
  PauseCircle,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { cn } from './cn';
import { label } from '@/shared/format/format';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-secondary border-line-strong',
  primary: 'bg-primary-soft text-primary-soft-ink border-primary/25',
  success: 'bg-success-soft text-success border-success/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-info-soft text-info border-info/25',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'primary',
  dispatched: 'warning',
  received: 'success',
  cancelled: 'neutral',
  in_progress: 'info',
  recount_required: 'warning',
  reviewed: 'primary',
  posted: 'success',
  healthy: 'success',
  low: 'warning',
  out_of_stock: 'danger',
  excess: 'info',
  quarantined: 'danger',
  available: 'success',
  assigned: 'info',
  on_hire: 'primary',
  in_maintenance: 'warning',
  out_of_service: 'danger',
  retired: 'neutral',
  active: 'success',
  inactive: 'neutral',
  ok: 'success',
  due_soon: 'warning',
  overdue: 'danger',
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

const statusIcon: Record<string, ReactNode> = {
  draft: <CircleDashed aria-hidden className="size-3" />,
  submitted: <Clock aria-hidden className="size-3" />,
  approved: <CheckCircle2 aria-hidden className="size-3" />,
  dispatched: <ArrowLeftRight aria-hidden className="size-3" />,
  received: <CheckCircle2 aria-hidden className="size-3" />,
  cancelled: <Ban aria-hidden className="size-3" />,
  out_of_stock: <PackageX aria-hidden className="size-3" />,
  low: <AlertTriangle aria-hidden className="size-3" />,
  quarantined: <ShieldAlert aria-hidden className="size-3" />,
  in_maintenance: <Wrench aria-hidden className="size-3" />,
  out_of_service: <PauseCircle aria-hidden className="size-3" />,
};

/** Status rendered as colour, icon, and text, never colour alone. */
export function StatusPill({ status, className }: { status: string | null | undefined; className?: string | undefined }) {
  const s = status ?? '';
  return (
    <Badge tone={statusTone[s] ?? 'neutral'} className={className}>
      {statusIcon[s]}
      {label(s || 'unknown')}
    </Badge>
  );
}

/** Compact record state for active/inactive fields, visually distinct from health and workflow badges. */
export function StatusIndicator({
  status,
  label: labelText,
  className,
}: {
  status: 'active' | 'inactive' | string;
  label?: string;
  className?: string;
}) {
  const active = status === 'active';
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-medium text-ink-secondary', className)}>
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-pill',
          active ? 'bg-success shadow-[0_0_0_3px_var(--color-success-soft)]' : 'bg-faint',
        )}
      />
      {labelText ?? label(status)}
    </span>
  );
}
