import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

interface DataPageShellProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  meta?: ReactNode;
  children: ReactNode;
}

/**
 * Consistent composition for data-heavy pages.
 *
 * Keeps breadcrumbs, title, supporting copy, actions and the data surface in
 * one predictable reading order without hiding feature-specific behaviour.
 */
export function DataPageShell({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  children,
}: DataPageShellProps) {
  return (
    <>
      <PageHeader
        title={title}
        {...(description ? { description } : {})}
        {...(actions ? { actions } : {})}
        {...(breadcrumbs ? { breadcrumbs } : {})}
        {...(meta ? { meta } : {})}
      />
      {children}
    </>
  );
}
