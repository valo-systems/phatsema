import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Select, type SelectOption } from './Select';
import type { ControlSize } from './styles';

export interface FormSelectProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  options: SelectOption[];
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  className?: string | undefined;
  'aria-label'?: string;
}

/**
 * React Hook Form binding for Select.
 *
 * `register()` returns an uncontrolled input contract (onChange, onBlur, ref)
 * which a controlled Ark component cannot consume, so form selects go through
 * Controller instead. Validation state flows from the field so the control
 * shows its invalid styling without the caller wiring it up.
 */
export function FormSelect<TValues extends FieldValues>({
  control,
  name,
  options,
  placeholder,
  size = 'md',
  disabled = false,
  className,
  ...rest
}: FormSelectProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select
          options={options}
          value={(field.value as string | undefined) ?? ''}
          onValueChange={field.onChange}
          {...(placeholder ? { placeholder } : {})}
          size={size}
          disabled={disabled || field.disabled === true}
          invalid={fieldState.invalid}
          className={className}
          {...(rest['aria-label'] ? { 'aria-label': rest['aria-label'] } : {})}
        />
      )}
    />
  );
}
