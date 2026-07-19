import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { alertLink, useAlerts, useMarkAlertRead, type Alert } from '@/features/alerts/api';
import { StatusPill } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/controls';
import { Popover } from '@/shared/ui/overlays';
import { formatRelative } from '@/shared/format/format';
import { cn } from '@/shared/ui/cn';

export function AlertsMenu() {
  const alerts = useAlerts();
  const markRead = useMarkAlertRead();
  const navigate = useNavigate();

  const unread = alerts.data?.filter((alert) => !alert.readAt) ?? [];

  const openAlert = (alert: Alert) => {
    if (!alert.readAt) markRead.mutate(alert.id);
    void navigate(alertLink(alert));
  };

  return (
    <Popover
      label="Alerts"
      className="w-96 max-w-[calc(100vw-1.5rem)]"
      trigger={
        <Button
          variant="ghost"
          aria-label={unread.length > 0 ? `Alerts, ${unread.length} unread` : 'Alerts'}
          className="relative px-2"
        >
          <Bell aria-hidden className="size-5" />
          {unread.length > 0 && (
            <span
              aria-hidden
              className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-pill bg-danger px-0.5 text-[10px] leading-4 font-semibold text-white"
            >
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      }
    >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-sm font-semibold text-ink">Alerts</h2>
            <span className="text-xs text-muted">{unread.length} unread</span>
          </div>
          <ul className="max-h-96 overflow-y-auto p-1.5" aria-label="Alerts">
            {alerts.isPending && <li className="px-3 py-6 text-center text-sm text-muted">Loading alerts…</li>}
            {alerts.isError && (
              <li className="px-3 py-6 text-center text-sm text-muted">Alerts could not be loaded.</li>
            )}
            {alerts.data?.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">
                Nothing needs your attention right now.
              </li>
            )}
            {alerts.data?.map((alert) => (
              <li key={alert.id}>
                {/* eslint-disable-next-line no-restricted-syntax -- alert row is a composite clickable region, not a control */}
                <button
                  type="button"
                  onClick={() => openAlert(alert)}
                  className={cn(
                    'w-full rounded-md px-3 py-2.5 text-left hover:bg-sunken',
                    !alert.readAt && 'bg-primary-soft/40',
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink">
                      {!alert.readAt && (
                        <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-pill bg-primary align-middle" />
                      )}
                      {alert.title}
                      {!alert.readAt && <span className="sr-only"> (unread)</span>}
                    </span>
                    <StatusPill status={alert.severity} />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{alert.message}</span>
                  <span className="mt-1 block text-[11px] text-faint">{formatRelative(alert.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
    </Popover>
  );
}
