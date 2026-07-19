import { cn } from '@/shared/ui/cn';

/**
 * Single source of control styling.
 *
 * Every control in this folder composes these recipes. No control declares its
 * own height, border or focus treatment. All values resolve to design tokens in
 * styles/app.css, so a token change propagates to every control at once.
 */

export type ControlSize = 'sm' | 'md' | 'lg';

/** Height + type scale per size. `lg` exists to meet 44px touch targets. */
export const controlSize: Record<ControlSize, string> = {
  sm: 'h-control-sm text-[13px] px-2.5 gap-1.5',
  md: 'h-control-md text-sm px-3 gap-2',
  lg: 'h-control-lg text-sm px-3.5 gap-2',
};

/** The shared field shell: trigger, input, and textarea all wear this. */
export const fieldShell = cn(
  'w-full rounded-md border bg-surface text-ink',
  'border-line-strong',
  'transition-[border-color,box-shadow] duration-150 ease-standard',
  'hover:border-faint',
  'focus-ring',
  'data-[state=open]:border-primary-ring',
  'data-[invalid]:border-danger aria-[invalid=true]:border-danger',
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-sunken data-[disabled]:text-muted',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted',
);

/** Floating surfaces: menus, listboxes, popovers, calendars. */
export const popoverSurface = cn(
  'z-50 rounded-md border border-line bg-surface shadow-medium',
  'data-[state=open]:motion-safe:animate-slide-down',
);

/** A selectable row inside a listbox or menu. */
export const optionRow = cn(
  'flex cursor-default items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-sm text-ink',
  'select-none outline-none',
  'data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-soft-ink',
  'data-[state=checked]:font-medium',
  'data-[disabled]:text-faint data-[disabled]:cursor-not-allowed',
);

export const labelText = 'text-[13px] font-medium text-ink-secondary';
export const hintText = 'text-xs text-muted';
export const errorText = 'text-xs font-medium text-danger';
