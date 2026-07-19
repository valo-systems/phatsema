import { useState, type ReactNode } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { Button, IconButton } from '@/shared/ui/controls/Button';
import { Select, type SelectOption } from '@/shared/ui/controls/Select';
import { TextField } from '@/shared/ui/controls/TextField';
import { DatePicker } from '@/shared/ui/controls/DatePicker';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { Drawer } from '@/shared/ui/overlays';

export interface ToolbarFilter {
  key: string;
  label: string;
  /** Omit for a date filter. */
  options?: SelectOption[];
  type?: 'select' | 'date';
  placeholder?: string;
  width?: string;
}

export interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  /** Current filter values keyed by filter key. */
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string | null) => void;
  /** Rendered at the trailing edge, e.g. density or view switches. */
  trailing?: ReactNode;
}

/**
 * Search and filter controls bound to the top of a data surface.
 *
 * Replaces the hand-rolled filter row that was duplicated across every list
 * page. On narrow screens filters collapse into a drawer so the surface never
 * scrolls horizontally.
 */
export function DataToolbar({
  searchValue,
  onSearchChange,
  searchLabel = 'Search',
  searchPlaceholder = 'Search…',
  filters = [],
  values = {},
  onFilterChange,
  trailing,
}: DataToolbarProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = filters.filter((filter) => values[filter.key]).length;

  const renderFilter = (filter: ToolbarFilter, full = false) => {
    const value = values[filter.key] ?? '';
    const onChange = (next: string) => onFilterChange?.(filter.key, next || null);

    if (filter.type === 'date') {
      return (
        <DatePicker
          key={filter.key}
          aria-label={filter.label}
          value={value}
          onValueChange={onChange}
          placeholder={filter.placeholder ?? filter.label}
          className={full ? 'w-full' : (filter.width ?? 'w-40')}
        />
      );
    }

    return (
      <Select
        key={filter.key}
        aria-label={filter.label}
        options={filter.options ?? []}
        value={value}
        onValueChange={onChange}
        placeholder={filter.placeholder ?? filter.label}
        clearable
        className={full ? 'w-full' : (filter.width ?? 'w-44')}
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface px-4 py-3">
      <div className="min-w-0 flex-1 sm:max-w-80">
        <TextField
          type="search"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          leading={<Search className="size-4" />}
        />
      </div>

      {/* Desktop: filters inline. Mobile: a single drawer trigger. */}
      {filters.length > 0 &&
        (isMobile ? (
          <Button onClick={() => setDrawerOpen(true)}>
            <Filter aria-hidden className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-pill bg-primary px-1.5 text-[11px] leading-4 font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => renderFilter(filter))}
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => filters.forEach((filter) => onFilterChange?.(filter.key, null))}
              >
                <X aria-hidden className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        ))}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Filters">
        <div className="flex flex-col gap-4">
          {filters.map((filter) => (
            <label key={filter.key} className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-ink-secondary">{filter.label}</span>
              {renderFilter(filter, true)}
            </label>
          ))}
          <div className="mt-2 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => filters.forEach((filter) => onFilterChange?.(filter.key, null))}
            >
              Clear all
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/** Active filters rendered as removable chips, shown under the toolbar. */
export function FilterChips({
  chips,
  onRemove,
}: {
  chips: Array<{ key: string; label: string; value: string }>;
  onRemove: (key: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2')}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-pill border border-line-strong bg-sunken py-0.5 pr-0.5 pl-2.5 text-xs text-ink-secondary"
        >
          <span className="text-muted">{chip.label}:</span> {chip.value}
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onRemove(chip.key)}
            icon={<X aria-hidden className="size-3" />}
            className="size-5 rounded-pill"
          />
        </span>
      ))}
    </div>
  );
}
