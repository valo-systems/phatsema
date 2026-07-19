import { useSyncExternalStore } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from './cn';
import { IconButton } from '@/shared/ui/controls';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string | undefined;
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  toasts = [...toasts];
  listeners.forEach((listener) => listener());
}

export function toast(kind: ToastKind, title: string, message?: string): void {
  const id = nextId++;
  toasts.push({ id, kind, title, message });
  emit();
  setTimeout(() => dismissToast(id), kind === 'error' ? 8000 : 5000);
}

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id);
  if (index >= 0) {
    toasts.splice(index, 1);
    emit();
  }
}

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

const accents: Record<ToastKind, string> = {
  success: 'border-l-success text-success',
  error: 'border-l-danger text-danger',
  info: 'border-l-info text-info',
  warning: 'border-l-warning text-warning',
};

export function Toaster() {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => toasts,
  );

  return (
    <div aria-live="polite" aria-label="Notifications" className="fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2">
      {current.map(({ id, kind, title, message }) => {
        const Icon = icons[kind];
        return (
          <div
            key={id}
            role="status"
            className={cn(
              'flex items-start gap-2.5 rounded-md border border-line border-l-4 bg-surface px-3.5 py-3 shadow-medium motion-safe:animate-slide-up',
              accents[kind],
            )}
          >
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1 text-ink">
              <p className="text-sm font-semibold">{title}</p>
              {message && <p className="mt-0.5 text-xs break-words text-muted">{message}</p>}
            </div>
            <IconButton
              size="sm"
              onClick={() => dismissToast(id)}
              aria-label="Dismiss notification"
              className="size-6 text-faint hover:text-ink"
              icon={<X aria-hidden className="size-3.5" />}
            />
          </div>
        );
      })}
    </div>
  );
}
