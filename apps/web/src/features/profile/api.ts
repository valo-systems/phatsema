import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { sessionKeys, type SessionUser } from '@/shared/auth/session';

export type ProfileUpdate = components['schemas']['ProfileUpdate'];
export type PasswordChange = components['schemas']['PasswordChange'];

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpdate) =>
      unwrap<{ data: SessionUser }>(await api.PATCH('/profile', { body: input })).data,
    onSuccess: (user) => {
      client.setQueryData(sessionKeys.me, user);
      void client.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useChangePassword() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: PasswordChange) =>
      unwrap<{ data: SessionUser }>(await api.POST('/profile/password', { body: input })).data,
    onSuccess: (user) => client.setQueryData(sessionKeys.me, user),
  });
}
