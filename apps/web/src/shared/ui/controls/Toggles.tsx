import { Checkbox as ArkCheckbox, Switch as ArkSwitch } from '@ark-ui/react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/ui/cn';

const box = cn(
  'grid size-4 shrink-0 place-items-center rounded-sm border border-line-strong bg-surface',
  'transition-colors duration-150 ease-standard',
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-sunken',
);

const rowLabel = 'flex cursor-pointer items-center gap-2.5 text-sm text-ink data-[disabled]:cursor-not-allowed data-[disabled]:text-muted';

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  indeterminate = false,
  disabled = false,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string | undefined;
}) {
  return (
    <ArkCheckbox.Root
      checked={indeterminate ? 'indeterminate' : checked}
      onCheckedChange={(details) => onCheckedChange(details.checked === true)}
      disabled={disabled}
      className={cn(rowLabel, className)}
    >
      <ArkCheckbox.Control className={cn(box, 'focus-ring')}>
        <ArkCheckbox.Indicator>
          <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
        </ArkCheckbox.Indicator>
        <ArkCheckbox.Indicator indeterminate>
          <Minus aria-hidden className="size-3 text-white" strokeWidth={3} />
        </ArkCheckbox.Indicator>
      </ArkCheckbox.Control>
      <ArkCheckbox.Label className={cn(hideLabel && 'sr-only')}>{label}</ArkCheckbox.Label>
      <ArkCheckbox.HiddenInput />
    </ArkCheckbox.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string | undefined;
}) {
  return (
    <ArkSwitch.Root
      checked={checked}
      onCheckedChange={(details) => onCheckedChange(details.checked)}
      disabled={disabled}
      className={cn(rowLabel, className)}
    >
      <ArkSwitch.Control
        className={cn(
          'focus-ring inline-flex h-5 w-9 shrink-0 items-center rounded-pill border border-line-strong bg-sunken p-0.5',
          'transition-colors duration-150 ease-standard',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          'data-[disabled]:cursor-not-allowed',
        )}
      >
        <ArkSwitch.Thumb className="size-3.5 rounded-pill bg-surface shadow-low transition-transform duration-150 ease-standard data-[state=checked]:translate-x-4" />
      </ArkSwitch.Control>
      <ArkSwitch.Label className={cn(hideLabel && 'sr-only')}>{label}</ArkSwitch.Label>
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  );
}
