import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/shared/api/client';
import { env } from '@/shared/config/env';
import { Dialog } from '@/shared/ui/overlays';
import { DescriptionList } from '@/shared/ui/surfaces';

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () =>
      unwrap<{ data: { status: string; version: string; fixtureVersion: string; time: string } }>(
        await api.GET('/health'),
      ).data,
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="About this demo"
      description="Phatsema back-office demonstration portal"
    >
      <div className="space-y-4 text-sm text-ink-secondary">
        <p>
          This portal demonstrates multi-site inventory, transfers, stock counts, controlled assets, alerts,
          reports, and audit for Phatsema. Every record is fictional and carries a{' '}
          <code className="rounded-sm bg-sunken px-1 text-xs">DEMO-</code> prefix.
        </p>
        <p>
          Changes are stored only in your browser session. Signing out, resetting, or session expiry restores
          the original dataset.
        </p>
        <DescriptionList
          items={[
            { term: 'Frontend release', detail: env.appVersion },
            { term: 'API version', detail: health.data?.version ?? 'Unavailable' },
            { term: 'Fixture set', detail: health.data?.fixtureVersion ?? 'Unavailable' },
            { term: 'API status', detail: health.data?.status ?? (health.isError ? 'unreachable' : 'Checking') },
          ]}
        />
      </div>
    </Dialog>
  );
}
