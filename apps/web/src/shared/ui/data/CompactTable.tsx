import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

interface TableFrameProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

/** Read-only detail table with consistent containment and mobile scrolling. */
export function CompactTable({ children, className, label }: TableFrameProps) {
  return (
    <div
      className="compact-table-frame overflow-x-auto border-y border-line bg-surface scrollbar-thin"
      {...(label ? { role: 'region', 'aria-label': label, tabIndex: 0 } : {})}
    >
      <table className={cn('compact-table w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

/** Editable line table with minimum touch spacing and horizontal containment. */
export function LineItemEditor({ children, className, label }: TableFrameProps) {
  return (
    <div
      className="line-item-table-frame overflow-x-auto rounded-lg border border-line bg-surface shadow-low scrollbar-thin"
      {...(label ? { role: 'region', 'aria-label': label, tabIndex: 0 } : {})}
    >
      <table className={cn('line-item-table w-full min-w-[42rem] border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}
