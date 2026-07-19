import { Field as ArkField } from '@ark-ui/react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';
import { errorText, hintText, labelText } from './styles';

export interface FieldProps {
  label: string;
  /** Visually hides the label but keeps it for assistive technology. */
  hideLabel?: boolean;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  className?: string | undefined;
  /**
   * How the child control binds to the label.
   *
   * `input` / `textarea` wrap the child in Ark's field slot so ids and aria
   * attributes are injected. `custom` is for Ark-native controls (Select,
   * DatePicker, NumberField) which read Field context themselves.
   */
  control?: 'input' | 'textarea' | 'custom';
  children: ReactNode;
}

/**
 * Ark Field owns the label, description and error wiring, so controls no
 * longer need cloneElement to inject ids and aria attributes.
 */
export function Field({
  label,
  hideLabel = false,
  error,
  hint,
  required = false,
  className,
  control = 'input',
  children,
}: FieldProps) {
  const bound =
    control === 'input' ? (
      <ArkField.Input asChild>{children}</ArkField.Input>
    ) : control === 'textarea' ? (
      <ArkField.Textarea asChild>{children}</ArkField.Textarea>
    ) : (
      children
    );

  return (
    <ArkField.Root
      invalid={Boolean(error)}
      required={required}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <ArkField.Label className={cn(labelText, hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            {' '}
            *
          </span>
        )}
      </ArkField.Label>
      {bound}
      {hint && !error && <ArkField.HelperText className={hintText}>{hint}</ArkField.HelperText>}
      {error && <ArkField.ErrorText className={errorText}>{error}</ArkField.ErrorText>}
    </ArkField.Root>
  );
}

/** Form-level error summary, focusable so it can be announced on submit. */
export function ErrorSummary({
  title = 'The form could not be submitted',
  errors,
  children,
}: {
  title?: string;
  errors: string[];
  children?: ReactNode;
}) {
  if (errors.length === 0 && !children) return null;
  return (
    <div
      role="alert"
      tabIndex={-1}
      className="rounded-md border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger-strong"
    >
      <p className="font-semibold">{title}</p>
      {errors.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
