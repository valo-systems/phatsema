import { useContext, useMemo } from 'react';
import { Select as ArkSelect, Portal, createListCollection } from '@ark-ui/react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { OverlayPortalContext } from '@/shared/ui/portal-context';
import { controlSize, fieldShell, optionRow, popoverSurface, type ControlSize } from './styles';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line shown under the label inside the listbox. */
  description?: string;
  disabled?: boolean;
}

interface CommonProps {
  options: SelectOption[];
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  invalid?: boolean;
  className?: string | undefined;
  /** Accessible name when the control is not wrapped in a Field. */
  'aria-label'?: string;
  /** Shows a clear affordance once a value is chosen. */
  clearable?: boolean;
}

export interface SelectProps extends CommonProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface MultiSelectProps extends CommonProps {
  value: string[];
  onValueChange: (value: string[]) => void;
}

function useCollection(options: SelectOption[]) {
  return useMemo(
    () =>
      createListCollection({
        items: options,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
        isItemDisabled: (item) => item.disabled ?? false,
      }),
    [options],
  );
}

function Listbox({ options }: { options: SelectOption[] }) {
  const overlayContainer = useContext(OverlayPortalContext);

  return (
    <Portal container={overlayContainer}>
      <ArkSelect.Positioner>
        <ArkSelect.Content
          className={cn(popoverSurface, 'max-h-72 min-w-[var(--reference-width)] overflow-y-auto p-1 scrollbar-thin')}
        >
          {options.map((option) => (
            <ArkSelect.Item key={option.value} item={option} className={optionRow}>
              <span className="min-w-0">
                <ArkSelect.ItemText className="block truncate">{option.label}</ArkSelect.ItemText>
                {option.description && (
                  <span className="block truncate text-xs text-muted">{option.description}</span>
                )}
              </span>
              <ArkSelect.ItemIndicator>
                <Check aria-hidden className="size-4 text-primary" />
              </ArkSelect.ItemIndicator>
            </ArkSelect.Item>
          ))}
          {options.length === 0 && <p className="px-2.5 py-2 text-sm text-muted">No options available.</p>}
        </ArkSelect.Content>
      </ArkSelect.Positioner>
    </Portal>
  );
}

function trigger(size: ControlSize, className: string | undefined) {
  return cn(fieldShell, controlSize[size], 'inline-flex items-center justify-between text-left', className);
}

/** Single-value select. Replaces every native `<select>` in the application. */
export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  size = 'md',
  disabled = false,
  invalid = false,
  clearable = false,
  className,
  ...rest
}: SelectProps) {
  const collection = useCollection(options);
  const selected = options.find((option) => option.value === value);

  return (
    <ArkSelect.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => onValueChange(details.value[0] ?? '')}
      disabled={disabled}
      invalid={invalid}
      positioning={{ sameWidth: true, gutter: 4 }}
    >
      <ArkSelect.Control>
        <ArkSelect.Trigger className={trigger(size, className)} aria-label={rest['aria-label']}>
          <ArkSelect.ValueText
            placeholder={placeholder}
            className={cn('truncate', !selected && 'text-faint')}
          />
          <span className="flex shrink-0 items-center gap-1">
            {clearable && selected && (
              <ArkSelect.ClearTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  className="rounded-sm p-0.5 text-faint hover:text-ink"
                >
                  <X aria-hidden className="size-3.5" />
                </span>
              </ArkSelect.ClearTrigger>
            )}
            <ArkSelect.Indicator>
              <ChevronDown aria-hidden className="size-4 text-muted transition-transform duration-150" />
            </ArkSelect.Indicator>
          </span>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <ArkSelect.HiddenSelect />
      <Listbox options={options} />
    </ArkSelect.Root>
  );
}

/** Multi-value select used by filter bars. Summarises selection in the trigger. */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Any',
  size = 'md',
  disabled = false,
  invalid = false,
  className,
  ...rest
}: MultiSelectProps) {
  const collection = useCollection(options);

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((option) => option.value === value[0])?.label ?? placeholder)
        : `${value.length} selected`;

  return (
    <ArkSelect.Root
      multiple
      collection={collection}
      value={value}
      onValueChange={(details) => onValueChange(details.value)}
      disabled={disabled}
      invalid={invalid}
      closeOnSelect={false}
      positioning={{ sameWidth: true, gutter: 4 }}
    >
      <ArkSelect.Control>
        <ArkSelect.Trigger className={trigger(size, className)} aria-label={rest['aria-label']}>
          <span className={cn('truncate', value.length === 0 && 'text-faint')}>{summary}</span>
          <ArkSelect.Indicator>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted" />
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <ArkSelect.HiddenSelect />
      <Listbox options={options} />
    </ArkSelect.Root>
  );
}
