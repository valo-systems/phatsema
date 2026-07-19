import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type Transfer = components['schemas']['Transfer'];
export type TransferLine = components['schemas']['TransferLine'];
export type TransferInput = components['schemas']['TransferInput'];
export type TransferUpdate = components['schemas']['TransferUpdate'];
export type TransferDispatchInput = components['schemas']['TransferDispatchInput'];
export type TransferReceiveInput = components['schemas']['TransferReceiveInput'];
export type PageMeta = components['schemas']['PageMeta'];

export type TransfersQuery = NonNullable<operations['listTransfers']['parameters']['query']>;

export const transferKeys = {
  all: ['transfers'] as const,
  list: (query: TransfersQuery) => ['transfers', 'list', query] as const,
  detail: (transferId: string) => ['transfers', 'detail', transferId] as const,
};

export function useTransfers(query: TransfersQuery) {
  return useQuery({
    queryKey: transferKeys.list(query),
    queryFn: async () =>
      unwrap<{ data: Transfer[]; meta: PageMeta }>(await api.GET('/transfers', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useTransfer(transferId: string) {
  return useQuery({
    queryKey: transferKeys.detail(transferId),
    queryFn: async () =>
      unwrap<{ data: Transfer }>(
        await api.GET('/transfers/{transferId}', { params: { path: { transferId } } }),
      ).data,
    enabled: Boolean(transferId),
  });
}

function useInvalidateTransfers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: transferKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['balances'] });
    void queryClient.invalidateQueries({ queryKey: ['movements'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };
}

export function useCreateTransfer() {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (input: TransferInput) =>
      unwrap<{ data: Transfer }>(await api.POST('/transfers', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function useUpdateTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (input: TransferUpdate) =>
      unwrap<{ data: Transfer }>(
        await api.PATCH('/transfers/{transferId}', { params: { path: { transferId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useSubmitTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (body: { version: number }) =>
      unwrap<{ data: Transfer }>(
        await api.POST('/transfers/{transferId}/submit', { params: { path: { transferId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useApproveTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (body: { version: number; notes?: string }) =>
      unwrap<{ data: Transfer }>(
        await api.POST('/transfers/{transferId}/approve', { params: { path: { transferId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useDispatchTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (input: TransferDispatchInput) =>
      unwrap<{ data: Transfer }>(
        await api.POST('/transfers/{transferId}/dispatch', { params: { path: { transferId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useReceiveTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (input: TransferReceiveInput) =>
      unwrap<{ data: Transfer }>(
        await api.POST('/transfers/{transferId}/receive', { params: { path: { transferId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useCancelTransfer(transferId: string) {
  const invalidate = useInvalidateTransfers();
  return useMutation({
    mutationFn: async (body: { version: number; reason: string }) =>
      unwrap<{ data: Transfer }>(
        await api.POST('/transfers/{transferId}/cancel', { params: { path: { transferId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}
