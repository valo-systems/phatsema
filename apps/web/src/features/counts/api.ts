import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type StockCount = components['schemas']['StockCount'];
export type StockCountEntry = components['schemas']['StockCountEntry'];
export type CountInput = components['schemas']['CountInput'];
export type CountEntriesInput = components['schemas']['CountEntriesInput'];
export type CountReviewInput = components['schemas']['CountReviewInput'];
export type PageMeta = components['schemas']['PageMeta'];

export type CountsQuery = NonNullable<operations['listCounts']['parameters']['query']>;

export const countKeys = {
  all: ['counts'] as const,
  list: (query: CountsQuery) => ['counts', 'list', query] as const,
  detail: (countId: string) => ['counts', 'detail', countId] as const,
};

export function useCounts(query: CountsQuery) {
  return useQuery({
    queryKey: countKeys.list(query),
    queryFn: async () =>
      unwrap<{ data: StockCount[]; meta: PageMeta }>(await api.GET('/counts', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useCount(countId: string) {
  return useQuery({
    queryKey: countKeys.detail(countId),
    queryFn: async () =>
      unwrap<{ data: StockCount }>(
        await api.GET('/counts/{countId}', { params: { path: { countId } } }),
      ).data,
    enabled: Boolean(countId),
  });
}

function useInvalidateCounts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: countKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['balances'] });
    void queryClient.invalidateQueries({ queryKey: ['movements'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateCount() {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (input: CountInput) =>
      unwrap<{ data: StockCount }>(await api.POST('/counts', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function useStartCount(countId: string) {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (body: { version: number }) =>
      unwrap<{ data: StockCount }>(
        await api.POST('/counts/{countId}/start', { params: { path: { countId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useSaveCountEntries(countId: string) {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (input: CountEntriesInput) =>
      unwrap<{ data: StockCount }>(
        await api.POST('/counts/{countId}/entries', { params: { path: { countId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useSubmitCount(countId: string) {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (body: { version: number }) =>
      unwrap<{ data: StockCount }>(
        await api.POST('/counts/{countId}/submit', { params: { path: { countId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useApproveCount(countId: string) {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (input: CountReviewInput) =>
      unwrap<{ data: StockCount }>(
        await api.POST('/counts/{countId}/approve', { params: { path: { countId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function usePostCount(countId: string) {
  const invalidate = useInvalidateCounts();
  return useMutation({
    mutationFn: async (body: { version: number }) =>
      unwrap<{ data: StockCount }>(
        await api.POST('/counts/{countId}/post', { params: { path: { countId } }, body }),
      ).data,
    onSuccess: invalidate,
  });
}
