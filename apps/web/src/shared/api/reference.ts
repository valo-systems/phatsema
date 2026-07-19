import { useQuery } from '@tanstack/react-query';
import type { components } from '@phatsema/contracts/api';
import { api, unwrap } from '@/shared/api/client';

export type Site = components['schemas']['Site'];
export type Location = components['schemas']['Location'];
export type ItemCategory = components['schemas']['ItemCategory'];
export type Unit = components['schemas']['Unit'];
export type ReasonCode = components['schemas']['ReasonCode'];
export type Department = components['schemas']['Department'];
export type PageMeta = components['schemas']['PageMeta'];

const STALE = 5 * 60 * 1000;

/** All sites the current user may see, used by selectors and scoping. */
export function useSitesReference() {
  return useQuery({
    queryKey: ['reference', 'sites'],
    queryFn: async () =>
      unwrap<{ data: Site[]; meta: PageMeta }>(
        await api.GET('/sites', { params: { query: { page: 1, pageSize: 100, sort: 'name' } } }),
      ).data,
    staleTime: STALE,
  });
}

export function useSiteLocations(siteId: string | undefined) {
  return useQuery({
    queryKey: ['reference', 'locations', siteId],
    queryFn: async () =>
      unwrap<{ data: Location[] }>(
        await api.GET('/sites/{siteId}/locations', { params: { path: { siteId: siteId as string } } }),
      ).data,
    enabled: Boolean(siteId),
    staleTime: STALE,
  });
}

export function useItemCategories() {
  return useQuery({
    queryKey: ['reference', 'item-categories'],
    queryFn: async () => unwrap<{ data: ItemCategory[] }>(await api.GET('/reference/item-categories')).data,
    staleTime: STALE,
  });
}

export function useUnits() {
  return useQuery({
    queryKey: ['reference', 'units'],
    queryFn: async () => unwrap<{ data: Unit[] }>(await api.GET('/reference/units')).data,
    staleTime: STALE,
  });
}

export function useReasons(appliesTo?: 'adjustment' | 'discrepancy' | 'reversal' | 'count') {
  const query = useQuery({
    queryKey: ['reference', 'reasons'],
    queryFn: async () => unwrap<{ data: ReasonCode[] }>(await api.GET('/reference/reasons')).data,
    staleTime: STALE,
  });
  const data = appliesTo ? query.data?.filter((reason) => reason.appliesTo.includes(appliesTo)) : query.data;
  return { ...query, data };
}

export function useDepartments() {
  return useQuery({
    queryKey: ['reference', 'departments'],
    queryFn: async () => unwrap<{ data: Department[] }>(await api.GET('/reference/departments')).data,
    staleTime: STALE,
  });
}
