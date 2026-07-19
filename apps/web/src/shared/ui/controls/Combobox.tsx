import { useMemo, type ReactNode } from 'react';
import { Combobox as ArkCombobox, Portal, createListCollection } from '@ark-ui/react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { controlSize, fieldShell, optionRow, popoverSurface, type ControlSize } from './styles';

export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps<T extends ComboboxItem> {
  items: T[];
  /** Current search text. The caller owns it so it can drive a server query. */
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onSelect: (item: T) => void;
  placeholder?: string;
  size?: ControlSize;
  loading?: boolean;
  emptyMessage?: string;
  /** Custom option row; falls back to the label. */
  renderItem?: (item: T) => ReactNode;
  className?: string | undefined;
  autoFocus?: boolean;
  'aria-label'?: string;
}

/**
 * Async-friendly combobox. Filtering happens server-side, so the collection is
 * passed through unfiltered and Ark owns only the interaction behaviour.
 */
export function Combobox<T extends ComboboxItem>({
  items,
  inputValue,
  onInputValueChange,
  onSelect,
  placeholder = 'Search…',
  size = 'md',
  loading = false,
  emptyMessage = 'No matches found.',
  renderItem,
  className,
  autoFocus = false,
  ...rest
}: ComboboxProps<T>) {
  const collection = useMemo(
    () =>
      createListCollection({
        items,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
        isItemDisabled: (item) => item.disabled ?? false,
      }),
    [items],
  );

  return (
    <ArkCombobox.Root
      collection={collection}
      inputValue={inputValue}
      onInputValueChange={(details) => onInputValueChange(details.inputValue)}
      onValueChange={(details) => {
        const picked = details.items[0] as T | undefined;
        if (picked) onSelect(picked);
      }}
      /* Filtering happens server-side, so the collection arrives pre-filtered
       * and Ark is left to own interaction behaviour only. */
      selectionBehavior="clear"
      openOnClick
      positioning={{ sameWidth: true, gutter: 4 }}
      className={cn('w-full', className)}
    >
      <ArkCombobox.Control
        className={cn(
          fieldShell,
          controlSize[size],
          'inline-flex items-center px-0 focus-within:shadow-[var(--focus-ring)]',
        )}
      >
        <span aria-hidden className="grid shrink-0 place-items-center pl-3 text-faint">
          <Search className="size-4" />
        </span>
        <ArkCombobox.Input
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label={rest['aria-label']}
          className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-faint"
        />
      </ArkCombobox.Control>
      <Portal>
        <ArkCombobox.Positioner>
          <ArkCombobox.Content
            className={cn(popoverSurface, 'max-h-72 overflow-y-auto p-1 scrollbar-thin')}
          >
            {loading && <p className="px-2.5 py-2 text-sm text-muted">Searching…</p>}
            {!loading && items.length === 0 && (
              <ArkCombobox.Empty className="px-2.5 py-2 text-sm text-muted">
                {emptyMessage}
              </ArkCombobox.Empty>
            )}
            {items.map((item) => (
              <ArkCombobox.Item key={item.value} item={item} className={optionRow}>
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <ArkCombobox.ItemText>{item.label}</ArkCombobox.ItemText>
                )}
              </ArkCombobox.Item>
            ))}
          </ArkCombobox.Content>
        </ArkCombobox.Positioner>
      </Portal>
    </ArkCombobox.Root>
  );
}
