import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface TableState {
  page: number;
  pageSize: number;
  sort: string | undefined;
  q: string;
  filters: Record<string, string>;
}

/**
 * Shareable table state owned by URL search parameters:
 * ?page=2&size=25&sort=-updatedAt&q=grdc&status=active
 */
export function useTableState(filterKeys: readonly string[] = []) {
  const [params, setParams] = useSearchParams();

  const state: TableState = useMemo(() => {
    const filters: Record<string, string> = {};
    for (const key of filterKeys) {
      const value = params.get(key);
      if (value) filters[key] = value;
    }
    return {
      page: Math.max(1, Number(params.get('page')) || 1),
      pageSize: Math.min(100, Math.max(1, Number(params.get('size')) || 25)),
      sort: params.get('sort') ?? undefined,
      q: params.get('q') ?? '',
      filters,
    };
  }, [params, filterKeys]);

  const update = useCallback(
    (changes: Partial<{ page: number; pageSize: number; sort: string | null; q: string }> & { filters?: Record<string, string | null> }) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const apply = (key: string, value: string | null) => {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          };
          if (changes.page !== undefined) apply('page', changes.page <= 1 ? null : String(changes.page));
          if (changes.pageSize !== undefined) apply('size', changes.pageSize === 25 ? null : String(changes.pageSize));
          if (changes.sort !== undefined) apply('sort', changes.sort);
          if (changes.q !== undefined) {
            apply('q', changes.q);
            next.delete('page');
          }
          if (changes.filters) {
            for (const [key, value] of Object.entries(changes.filters)) {
              apply(key, value);
            }
            next.delete('page');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const toggleSort = useCallback(
    (key: string) => {
      const current = state.sort;
      const next = current === key ? `-${key}` : current === `-${key}` ? null : key;
      update({ sort: next });
    },
    [state.sort, update],
  );

  return { state, update, toggleSort };
}
