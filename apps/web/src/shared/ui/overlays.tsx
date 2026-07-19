import { useRef, type ReactNode } from 'react';
import { Dialog as ArkDialog, Popover as ArkPopover, Tabs as ArkTabs, Portal } from '@ark-ui/react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { OverlayPortalContext } from './portal-context';
import { Button, IconButton, type ButtonProps } from './controls';

/*
 * Overlay layer, built on Ark UI so the whole application draws from one
 * primitives library. Ark owns focus trapping, scroll locking, dismissal and
 * ARIA wiring; everything visual comes from design tokens.
 */

const backdrop = 'fixed inset-0 z-40 bg-shell/55 data-[state=open]:motion-safe:animate-fade-in';

/* ---------- Dialog ---------- */

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const portalContainer = useRef<HTMLDivElement>(null);

  return (
    <ArkDialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <ArkDialog.Backdrop className={backdrop} />
        <ArkDialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ArkDialog.Content
            ref={portalContainer}
            className={cn(
              'flex max-h-[85vh] w-full flex-col overflow-hidden rounded-lg bg-surface shadow-overlay',
              'data-[state=open]:motion-safe:animate-slide-up',
              wide ? 'max-w-2xl' : 'max-w-md',
            )}
          >
            <OverlayPortalContext.Provider value={portalContainer}>
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  <ArkDialog.Title className="text-base font-semibold text-ink">{title}</ArkDialog.Title>
                  <ArkDialog.Description className={cn('mt-1 text-sm text-muted', !description && 'sr-only')}>
                    {description ?? title}
                  </ArkDialog.Description>
                </div>
                <ArkDialog.CloseTrigger asChild>
                  <IconButton size="sm" aria-label="Close dialog" icon={<X aria-hidden className="size-4" />} />
                </ArkDialog.CloseTrigger>
              </div>
              {children && <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>}
              {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
            </OverlayPortalContext.Provider>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}

/* ---------- Drawer: side sheet on desktop, bottom sheet on mobile ---------- */

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <ArkDialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <ArkDialog.Backdrop className={backdrop} />
        <ArkDialog.Positioner className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
          <ArkDialog.Content
            className={cn(
              'flex w-full flex-col bg-surface shadow-overlay',
              'max-h-[85vh] rounded-t-lg data-[state=open]:motion-safe:animate-sheet-up',
              'sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-none sm:data-[state=open]:motion-safe:animate-fade-in',
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <ArkDialog.Title className="text-base font-semibold text-ink">{title}</ArkDialog.Title>
              <ArkDialog.Description className="sr-only">{title}</ArkDialog.Description>
              <ArkDialog.CloseTrigger asChild>
                <IconButton size="sm" aria-label="Close panel" icon={<X aria-hidden className="size-4" />} />
              </ArkDialog.CloseTrigger>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}

/* ---------- Confirm dialog: high-impact actions slow down ---------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ButtonProps['variant'];
  onConfirm: () => void;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}

/* ---------- Popover ---------- */

export function Popover({
  trigger,
  children,
  label,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <ArkPopover.Root positioning={{ placement: 'bottom-end', gutter: 6 }}>
      <ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
      <Portal>
        <ArkPopover.Positioner>
          <ArkPopover.Content
            aria-label={label}
            className={cn(
              'z-50 rounded-lg border border-line bg-surface shadow-medium',
              'data-[state=open]:motion-safe:animate-slide-down',
              className,
            )}
          >
            {children}
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Portal>
    </ArkPopover.Root>
  );
}

/* ---------- Tooltip ---------- */

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/* ---------- Tabs ---------- */

export function Tabs({
  value,
  onValueChange,
  tabs,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: ReactNode }>;
  children: ReactNode;
}) {
  return (
    <ArkTabs.Root value={value} onValueChange={(details) => onValueChange(details.value)}>
      <ArkTabs.List className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Sections">
        {tabs.map((tab) => (
          <ArkTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted',
              'hover:text-ink data-[selected]:border-primary data-[selected]:text-ink',
            )}
          >
            {tab.label}
          </ArkTabs.Trigger>
        ))}
      </ArkTabs.List>
      {children}
    </ArkTabs.Root>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return (
    <ArkTabs.Content value={value} className="pt-4 outline-none">
      {children}
    </ArkTabs.Content>
  );
}
