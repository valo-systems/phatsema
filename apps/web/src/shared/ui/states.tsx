import type { ReactNode } from 'react';
import { FileQuestion, Inbox, Lock, ServerCrash } from 'lucide-react';
import { Button } from './controls';
import { problemFromUnknown } from '@/shared/api/problem';

function StateShell({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="text-faint">{icon}</span>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return <StateShell icon={<Inbox aria-hidden className="size-8" />} title={title} description={description} action={action} />;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const problem = problemFromUnknown(error);
  if (problem.status === 403) {
    return (
      <StateShell
        icon={<Lock aria-hidden className="size-8" />}
        title="You do not have access to this"
        description="Your current role does not include this information. Switch persona or contact the demo administrator."
      />
    );
  }
  if (problem.status === 404) {
    return (
      <StateShell
        icon={<FileQuestion aria-hidden className="size-8" />}
        title="Not found"
        description="This record does not exist or is not visible to your role."
      />
    );
  }
  return (
    <StateShell
      icon={<ServerCrash aria-hidden className="size-8" />}
      title={problem.title || 'Something went wrong'}
      description={
        <>
          {problem.detail ?? 'The request could not be completed. Your data has not been changed.'}
          {problem.traceId && <span className="mt-1 block text-xs text-faint">Reference: {problem.traceId}</span>}
        </>
      }
      action={onRetry && <Button onClick={onRetry}>Try again</Button>}
    />
  );
}
