import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';
import { itemKeys } from '@/features/items/api';

export type StockBalance = components['schemas']['StockBalance'];
export type Movement = components['schemas']['Movement'];
export type ReceiptInput = components['schemas']['ReceiptInput'];
export type IssueInput = components['schemas']['IssueInput'];
export type AdjustmentInput = components['schemas']['AdjustmentInput'];
export type ReversalInput = components['schemas']['ReversalInput'];
export type PageMeta = components['schemas']['PageMeta'];

export type BalancesQuery = NonNullable<operations['listBalances']['parameters']['query']>;
export type MovementsQuery = NonNullable<operations['listMovements']['parameters']['query']>;

export const inventoryKeys = {
  balances: (query: BalancesQuery) => ['balances', query] as const,
  movements: (query: MovementsQuery) => ['movements', query] as const,
};

export function useBalances(query: BalancesQuery) {
  return useQuery({
    queryKey: inventoryKeys.balances(query),
    queryFn: async () =>
      unwrap<{ data: StockBalance[]; meta: PageMeta }>(await api.GET('/balances', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useMovements(query: MovementsQuery) {
  return useQuery({
    queryKey: inventoryKeys.movements(query),
    queryFn: async () =>
      unwrap<{ data: Movement[]; meta: PageMeta }>(await api.GET('/movements', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['balances'] });
    void queryClient.invalidateQueries({ queryKey: ['movements'] });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };
}

export function usePostReceipt() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (input: ReceiptInput) =>
      unwrap<{ data: Movement[] }>(await api.POST('/receipts', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function usePostIssue() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (input: IssueInput) =>
      unwrap<{ data: Movement[] }>(await api.POST('/issues', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function usePostAdjustment() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (input: AdjustmentInput) =>
      unwrap<{ data: Movement[] }>(await api.POST('/adjustments', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function useReverseMovement() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async ({ movementId, input }: { movementId: string; input: ReversalInput }) =>
      unwrap<{ data: Movement[] }>(
        await api.POST('/movements/{movementId}/reverse', {
          params: { path: { movementId } },
          body: input,
        }),
      ).data,
    onSuccess: invalidate,
  });
}
