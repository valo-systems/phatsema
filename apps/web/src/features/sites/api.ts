import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components, operations } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type Site = components['schemas']['Site'];
export type SiteDetail = components['schemas']['SiteDetail'];
export type SiteInput = components['schemas']['SiteInput'];
export type SiteUpdate = components['schemas']['SiteUpdate'];
export type Location = components['schemas']['Location'];
export type LocationInput = components['schemas']['LocationInput'];
export type PageMeta = components['schemas']['PageMeta'];

export type SitesQuery = NonNullable<operations['listSites']['parameters']['query']>;

export const siteKeys = {
  all: ['sites'] as const,
  list: (query: SitesQuery) => ['sites', 'list', query] as const,
  detail: (siteId: string) => ['sites', 'detail', siteId] as const,
  locations: (siteId: string) => ['sites', 'locations', siteId] as const,
};

export function useSites(query: SitesQuery) {
  return useQuery({
    queryKey: siteKeys.list(query),
    queryFn: async () =>
      unwrap<{ data: Site[]; meta: PageMeta }>(await api.GET('/sites', { params: { query } })),
    placeholderData: (previous) => previous,
  });
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: siteKeys.detail(siteId),
    queryFn: async () =>
      unwrap<{ data: SiteDetail }>(
        await api.GET('/sites/{siteId}', { params: { path: { siteId } } }),
      ).data,
    enabled: Boolean(siteId),
  });
}

export function useSiteLocations(siteId: string) {
  return useQuery({
    queryKey: siteKeys.locations(siteId),
    queryFn: async () =>
      unwrap<{ data: Location[] }>(
        await api.GET('/sites/{siteId}/locations', { params: { path: { siteId } } }),
      ).data,
    enabled: Boolean(siteId),
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteInput) =>
      unwrap<{ data: Site }>(await api.POST('/sites', { body: input })).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: siteKeys.all }),
  });
}

export function useUpdateSite(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteUpdate) =>
      unwrap<{ data: Site }>(
        await api.PATCH('/sites/{siteId}', { params: { path: { siteId } }, body: input }),
      ).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: siteKeys.all }),
  });
}

export function useCreateLocation(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LocationInput) =>
      unwrap<{ data: Location }>(
        await api.POST('/sites/{siteId}/locations', { params: { path: { siteId } }, body: input }),
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteKeys.locations(siteId) });
      void queryClient.invalidateQueries({ queryKey: siteKeys.detail(siteId) });
    },
  });
}
