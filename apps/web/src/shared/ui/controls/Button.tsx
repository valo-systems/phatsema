import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { controlSize, type ControlSize } from './styles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'shell';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-strong active:bg-primary-strong shadow-low disabled:bg-primary/50',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-sunken hover:border-faint active:bg-sunken disabled:text-faint',
  ghost: 'text-ink-secondary hover:bg-sunken active:bg-sunken disabled:text-faint',
  danger:
    'bg-danger text-white hover:bg-danger-strong active:bg-danger-strong shadow-low disabled:bg-danger/50',
  shell: 'text-shell-muted hover:bg-shell-raised hover:text-shell-ink',
};

const base = cn(
  'inline-flex items-center justify-center rounded-md font-medium select-none',
  'transition-colors duration-150 ease-standard',
  'focus-ring disabled:cursor-not-allowed',
);

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, className, children, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={cn(base, variants[variant], controlSize[size], className)}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

/** Icon-only button. An accessible name is required, not optional. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children'> & { icon: ReactNode; 'aria-label': string }
>(function IconButton({ icon, variant = 'ghost', size = 'md', className, ...rest }, ref) {
  const square = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9';
  return (
    <button
      ref={ref}
      type="button"
      className={cn(base, variants[variant], square, 'shrink-0 p-0', className)}
      {...rest}
    >
      {icon}
    </button>
  );
});

/** Router link wearing button styling. */
export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  className,
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ControlSize;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={cn(base, variants[variant], controlSize[size], className)}>
      {children}
    </Link>
  );
}
