import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, ensureCsrf, unwrap } from '@/shared/api/client';
import { isApiError } from '@/shared/api/problem';

export type SessionUser = components['schemas']['User'];

export const sessionKeys = {
  me: ['auth', 'me'] as const,
};

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: async () => unwrap<{ data: SessionUser }>(await api.GET('/auth/me')).data,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status < 500) && failureCount < 2,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      await ensureCsrf();
      return unwrap<{ data: SessionUser }>(await api.POST('/auth/login', { body: input })).data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(sessionKeys.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST('/auth/logout');
    },
    onSettled: () => {
      queryClient.clear();
    },
  });
}

/** Permission check helper. The API remains the enforcement point. */
export function can(user: SessionUser | undefined, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

export function canAnywhere(user: SessionUser | undefined, ...permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}
