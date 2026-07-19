import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/shared/api/client';
import { useDebouncedValue } from '@/shared/hooks/useDebounce';
import { Combobox } from '@/shared/ui/controls';
import { formatQuantity } from '@/shared/format/format';
import type { ItemSummary, PageMeta } from '@/features/items/api';

interface ItemOption {
  value: string;
  label: string;
  item: ItemSummary;
}

/**
 * Catalogue type-ahead used by the receive, issue and transfer line editors.
 *
 * Search runs server-side; the shared Combobox owns keyboard navigation and
 * ARIA so this component only maps results onto option rows.
 */
export function ItemPicker({
  onSelect,
  siteId,
  excludeIds = [],
  autoFocus = false,
}: {
  onSelect: (item: ItemSummary) => void;
  siteId?: string | undefined;
  excludeIds?: string[];
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 250);

  const results = useQuery({
    queryKey: ['item-picker', debounced, siteId],
    queryFn: async () =>
      unwrap<{ data: ItemSummary[]; meta: PageMeta }>(
        await api.GET('/items', {
          params: {
            query: {
              page: 1,
              pageSize: 8,
              status: 'active',
              ...(debounced ? { q: debounced } : {}),
              ...(siteId ? { siteId } : {}),
            },
          },
        }),
      ).data,
    placeholderData: (previous) => previous,
  });

  const options: ItemOption[] = (results.data ?? [])
    .filter((item) => !excludeIds.includes(item.id))
    .map((item) => ({ value: item.id, label: `${item.sku} ${item.name}`, item }));

  return (
    <Combobox
      items={options}
      inputValue={term}
      onInputValueChange={setTerm}
      onSelect={(option) => {
        onSelect(option.item);
        setTerm('');
      }}
      loading={results.isPending}
      emptyMessage="No matching active items."
      autoFocus={autoFocus}
      aria-label="Add item by SKU or name"
      placeholder="Add item: search SKU or name…"
      renderItem={(option) => (
        <>
          <span className="min-w-0">
            <span className="numeric block truncate font-medium">{option.item.sku}</span>
            <span className="block truncate text-xs text-muted">{option.item.name}</span>
          </span>
          <span className="numeric text-xs whitespace-nowrap text-muted">
            {formatQuantity(option.item.totalAvailable, option.item.baseUnit)} avail
          </span>
        </>
      )}
    />
  );
}
