import { NumberInput } from '@ark-ui/react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { controlSize, fieldShell, type ControlSize } from './styles';

export interface NumberFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Unit rendered inside the control so digits and unit never drift apart. */
  unit?: string | undefined;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places permitted. Quantities are 3 per the API contract. */
  precision?: number;
  size?: ControlSize;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string | undefined;
  'aria-label'?: string;
}

/**
 * Quantity control: number input, unit suffix and steppers as one unit.
 *
 * Values are kept as strings end to end to match the API's decimal-string
 * contract with no float round-tripping.
 */
export function NumberField({
  value,
  onValueChange,
  unit,
  min = 0,
  max,
  step = 1,
  precision = 3,
  size = 'md',
  disabled = false,
  invalid = false,
  placeholder,
  className,
  ...rest
}: NumberFieldProps) {
  return (
    <NumberInput.Root
      value={value}
      onValueChange={(details) => onValueChange(details.value)}
      min={min}
      {...(max !== undefined ? { max } : {})}
      step={step}
      formatOptions={{ maximumFractionDigits: precision, useGrouping: false }}
      disabled={disabled}
      invalid={invalid}
      allowMouseWheel={false}
      className={cn('w-full', className)}
    >
      <NumberInput.Control
        className={cn(
          fieldShell,
          controlSize[size],
          'inline-flex items-center px-0 focus-within:shadow-[var(--focus-ring)]',
        )}
      >
        <NumberInput.Input
          placeholder={placeholder}
          aria-label={rest['aria-label']}
          className="numeric h-full min-w-0 flex-1 bg-transparent px-3 text-right outline-none placeholder:text-faint"
        />
        {unit && (
          <span aria-hidden className="shrink-0 pr-2 text-xs text-muted">
            {unit}
          </span>
        )}
        <span className="flex h-full shrink-0 flex-col border-l border-line">
          <NumberInput.IncrementTrigger
            className="grid flex-1 place-items-center px-1.5 text-muted hover:bg-sunken hover:text-ink disabled:text-faint"
            aria-label="Increase"
          >
            <Plus aria-hidden className="size-3" />
          </NumberInput.IncrementTrigger>
          <NumberInput.DecrementTrigger
            className="grid flex-1 place-items-center border-t border-line px-1.5 text-muted hover:bg-sunken hover:text-ink disabled:text-faint"
            aria-label="Decrease"
          >
            <Minus aria-hidden className="size-3" />
          </NumberInput.DecrementTrigger>
        </span>
      </NumberInput.Control>
    </NumberInput.Root>
  );
}
