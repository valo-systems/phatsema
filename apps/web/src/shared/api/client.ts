import createClient from 'openapi-fetch';
import type { paths } from '@phatsema/contracts/api';
import { env } from '@/shared/config/env';
import { ApiError, type Problem } from './problem';

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfReady = false;

/** Laravel double-submit CSRF: fetch cookie once, echo it on mutations. */
export async function ensureCsrf(): Promise<void> {
  if (csrfReady && readCookie('XSRF-TOKEN')) return;
  await fetch(`${env.apiBase}/csrf-cookie`, { credentials: 'same-origin' });
  csrfReady = true;
}

export const api = createClient<paths>({
  baseUrl: env.apiBase,
  credentials: 'same-origin',
});

api.use({
  async onRequest({ request }) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      await ensureCsrf();
      const token = readCookie('XSRF-TOKEN');
      if (token) request.headers.set('X-XSRF-TOKEN', token);
    }
    request.headers.set('Accept', 'application/json');
    return request;
  },
});

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

/**
 * Normalise an openapi-fetch result: return data or throw ApiError.
 * Broadcasts 401s so the app can redirect to sign-in gracefully.
 */
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.error !== undefined || !result.response.ok) {
    const problem: Problem =
      typeof result.error === 'object' && result.error !== null && 'status' in result.error
        ? (result.error as Problem)
        : {
            type: 'about:blank',
            title: result.response.statusText || 'Request failed',
            status: result.response.status,
          };
    if (problem.status === 401) {
      sessionExpiredListeners.forEach((l) => l());
    }
    throw new ApiError(problem);
  }
  return result.data as T;
}
