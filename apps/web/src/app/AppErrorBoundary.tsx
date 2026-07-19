import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button } from '@/shared/ui/controls';

/** Route-level error boundary with a friendly recovery path. */
export function AppErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let detail = 'An unexpected error occurred. Your data has not been changed.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      detail = 'The page you are looking for does not exist or has moved.';
    } else {
      title = `Error ${error.status}`;
      detail = error.statusText;
    }
  } else if (error instanceof Error && import.meta.env.DEV) {
    detail = error.message;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">Phatsema Portal</p>
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="max-w-md text-sm text-muted">{detail}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button onClick={() => (window.location.href = '/dashboard')}>
          Go to dashboard
        </Button>
      </div>
      <Link to="/login" className="mt-2 text-xs text-muted underline">
        Sign in again
      </Link>
    </main>
  );
}
