import type { ReactNode } from 'react';
import { Box, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { Badge } from '@/shared/ui/Badge';

export function RecordIdentifier({
  value,
  icon: Icon = Box,
  className,
}: {
  value: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-medium text-primary', className)} data-numeric>
      <Icon aria-hidden className="size-4 shrink-0 text-primary-ring" />
      <span>{value}</span>
    </span>
  );
}

export function TypeBadge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'info' | 'neutral' }) {
  return <Badge tone={tone}>{children}</Badge>;
}

export function QuantityCell({ children, emphasized = false }: { children: ReactNode; emphasized?: boolean }) {
  return (
    <span className={cn('whitespace-nowrap text-ink-secondary', emphasized && 'font-semibold text-ink')} data-numeric>
      {children}
    </span>
  );
}
