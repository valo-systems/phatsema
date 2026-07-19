import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type Alert = components['schemas']['Alert'];

export const alertKeys = {
  all: ['alerts'] as const,
};

export function useAlerts() {
  return useQuery({
    queryKey: alertKeys.all,
    queryFn: async () => unwrap<{ data: Alert[] }>(await api.GET('/alerts')).data,
    refetchInterval: 60_000,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) =>
      unwrap<{ data: Alert }>(
        await api.POST('/alerts/{alertId}/read', { params: { path: { alertId } } }),
      ).data,
    // Reversible, low-risk optimistic update.
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: alertKeys.all });
      const previous = queryClient.getQueryData<Alert[]>(alertKeys.all);
      queryClient.setQueryData<Alert[]>(alertKeys.all, (alerts) =>
        alerts?.map((alert) =>
          alert.id === alertId ? { ...alert, readAt: new Date().toISOString() } : alert,
        ),
      );
      return { previous };
    },
    onError: (_error, _alertId, context) => {
      if (context?.previous) queryClient.setQueryData(alertKeys.all, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
}

/** Route target for an alert's linked record. */
export function alertLink(alert: Alert): string {
  switch (alert.resourceType) {
    case 'item':
      return `/inventory/items/${alert.resourceId}`;
    case 'transfer':
      return `/transfers/${alert.resourceId}`;
    case 'count':
      return `/inventory/counts/${alert.resourceId}`;
    case 'asset':
      return `/assets/${alert.resourceId}`;
    default:
      return '/dashboard';
  }
}
