import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { onSessionExpired } from '@/shared/api/client';
import { useSession } from '@/shared/auth/session';
import { isApiError } from '@/shared/api/problem';
import { PageSkeleton } from '@/shared/ui/surfaces';
import { toast } from '@/shared/ui/toast';

/** Redirects unauthenticated visitors to /login, preserving the destination. */
export function RequireAuth() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onSessionExpired(() => {
      toast('warning', 'Session ended', 'Your demo session has expired. Please sign in again.');
      void navigate('/login', { state: { from: location.pathname }, replace: true });
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (session.isError && isApiError(session.error) && session.error.status === 401) {
      void navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [session.isError, session.error, navigate, location.pathname]);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (session.isError) return null;

  return <Outlet />;
}
