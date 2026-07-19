import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';
import { controlSize, fieldShell, type ControlSize } from './styles';

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface TextFieldProps extends BaseInputProps {
  size?: ControlSize;
  /** Leading adornment, typically an icon. Decorative only. */
  leading?: ReactNode;
  /** Trailing adornment, e.g. a unit suffix or clear button. */
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { size = 'md', leading, trailing, className, ...rest },
  ref,
) {
  if (!leading && !trailing) {
    return <input ref={ref} className={cn(fieldShell, controlSize[size], className)} {...rest} />;
  }

  return (
    <span
      className={cn(
        fieldShell,
        controlSize[size],
        'inline-flex items-center px-0',
        'focus-within:shadow-[var(--focus-ring)]',
        className,
      )}
    >
      {leading && (
        <span aria-hidden className="grid shrink-0 place-items-center pl-3 text-faint">
          {leading}
        </span>
      )}
      <input
        ref={ref}
        className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-faint"
        {...rest}
      />
      {trailing && <span className="shrink-0 pr-3 text-muted">{trailing}</span>}
    </span>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(fieldShell, 'px-3 py-2 text-sm leading-relaxed', className)}
        {...rest}
      />
    );
  },
);

/*
 * Aliases retained so pages written against the previous control names keep
 * compiling during the migration. Prefer TextField and TextArea in new code.
 */
export const Input = TextField;
export const Textarea = TextArea;
