import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type Asset = components['schemas']['Asset'];
export type AssetDetail = components['schemas']['AssetDetail'];
export type AssetInput = components['schemas']['AssetInput'];
export type AssetAssignInput = components['schemas']['AssetAssignInput'];
export type AssetStatusInput = components['schemas']['AssetStatusInput'];
export type MeterReadingInput = components['schemas']['MeterReadingInput'];
export type PageMeta = components['schemas']['PageMeta'];

export type AssetsQuery = NonNullable<operations['listAssets']['parameters']['query']>;

export const assetKeys = {
  all: ['assets'] as const,
  list: (query: AssetsQuery) => ['assets', 'list', query] as const,
  detail: (assetId: string) => ['assets', 'detail', assetId] as const,
};

export function useAssets(query: AssetsQuery) {
  return useQuery({
    queryKey: assetKeys.list(query),
    queryFn: async () =>
      unwrap<{ data: Asset[]; meta: PageMeta }>(await api.GET('/assets', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useAsset(assetId: string) {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: async () =>
      unwrap<{ data: AssetDetail }>(
        await api.GET('/assets/{assetId}', { params: { path: { assetId } } }),
      ).data,
    enabled: Boolean(assetId),
  });
}

function useInvalidateAssets() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateAsset() {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: async (input: AssetInput) =>
      unwrap<{ data: Asset }>(await api.POST('/assets', { body: input })).data,
    onSuccess: invalidate,
  });
}

export function useAssignAsset(assetId: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: async (input: AssetAssignInput) =>
      unwrap<{ data: Asset }>(
        await api.POST('/assets/{assetId}/assign', { params: { path: { assetId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useChangeAssetStatus(assetId: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: async (input: AssetStatusInput) =>
      unwrap<{ data: Asset }>(
        await api.POST('/assets/{assetId}/status', { params: { path: { assetId } }, body: input }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useRecordMeterReading(assetId: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: async (input: MeterReadingInput) =>
      unwrap<{ data: Asset }>(
        await api.POST('/assets/{assetId}/meter-reading', {
          params: { path: { assetId } },
          body: input,
        }),
      ).data,
    onSuccess: invalidate,
  });
}
