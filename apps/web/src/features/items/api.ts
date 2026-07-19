import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type ItemSummary = components['schemas']['ItemSummary'];
export type ItemDetail = components['schemas']['ItemDetail'];
export type ItemCore = components['schemas']['ItemCore'];
export type ItemInput = components['schemas']['ItemInput'];
export type ItemUpdate = components['schemas']['ItemUpdate'];
export type StockBalance = components['schemas']['StockBalance'];
export type PageMeta = components['schemas']['PageMeta'];

export type ItemsQuery = NonNullable<operations['listItems']['parameters']['query']>;

export const itemKeys = {
  all: ['items'] as const,
  list: (query: ItemsQuery) => ['items', 'list', query] as const,
  detail: (itemId: string) => ['items', 'detail', itemId] as const,
  balances: (itemId: string) => ['items', 'balances', itemId] as const,
};

export function useItems(query: ItemsQuery) {
  return useQuery({
    queryKey: itemKeys.list(query),
    queryFn: async () =>
      unwrap<{ data: ItemSummary[]; meta: PageMeta }>(await api.GET('/items', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: async () =>
      unwrap<{ data: ItemDetail }>(await api.GET('/items/{itemId}', { params: { path: { itemId } } })).data,
  });
}

export function useItemBalances(itemId: string) {
  return useQuery({
    queryKey: itemKeys.balances(itemId),
    queryFn: async () =>
      unwrap<{ data: StockBalance[] }>(
        await api.GET('/items/{itemId}/balances', { params: { path: { itemId } } }),
      ).data,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ItemInput) =>
      unwrap<{ data: ItemCore }>(await api.POST('/items', { body: input })).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useUpdateItem(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ItemUpdate) =>
      unwrap<{ data: ItemCore }>(
        await api.PATCH('/items/{itemId}', { params: { path: { itemId } }, body: input }),
      ).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: itemKeys.all }),
  });
}
