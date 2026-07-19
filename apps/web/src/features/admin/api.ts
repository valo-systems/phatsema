import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { sessionKeys } from '@/shared/auth/session';

export type ManagedUser = components['schemas']['User'];
export type Role = components['schemas']['Role'];
export type UserInput = components['schemas']['UserInput'];
export type UserUpdate = components['schemas']['UserUpdate'];

export function useUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => unwrap<{ data: ManagedUser[] }>(await api.GET('/users')).data,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => unwrap<{ data: Role[] }>(await api.GET('/roles')).data,
  });
}

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserInput) => unwrap<{ data: ManagedUser }>(await api.POST('/users', { body: input })).data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin', 'users'] });
      void client.invalidateQueries({ queryKey: sessionKeys.me });
    },
  });
}

export function useUpdateUser(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserUpdate) => unwrap<{ data: ManagedUser }>(
      await api.PATCH('/users/{userId}', { params: { path: { userId } }, body: input }),
    ).data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin', 'users'] });
      void client.invalidateQueries({ queryKey: sessionKeys.me });
    },
  });
}
