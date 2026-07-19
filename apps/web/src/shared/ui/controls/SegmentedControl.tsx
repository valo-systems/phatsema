import { SegmentGroup } from '@ark-ui/react';
import { cn } from '@/shared/ui/cn';

/**
 * Compact exclusive choice, used for table density, transfer queue views and
 * other small mode switches where a dropdown would be heavier than the choice.
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string | undefined;
  'aria-label'?: string;
}) {
  return (
    <SegmentGroup.Root
      value={value}
      onValueChange={(details) => onValueChange(details.value ?? '')}
      orientation="horizontal"
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-md border border-line-strong bg-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <SegmentGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled ?? false}
          className={cn(
            'focus-ring relative cursor-pointer rounded-sm px-2.5 py-1 text-[13px] font-medium whitespace-nowrap',
            'text-muted transition-colors duration-150 ease-standard',
            'hover:text-ink',
            'data-[state=checked]:bg-surface data-[state=checked]:text-ink data-[state=checked]:shadow-low',
            'data-[disabled]:cursor-not-allowed data-[disabled]:text-faint',
          )}
        >
          <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
