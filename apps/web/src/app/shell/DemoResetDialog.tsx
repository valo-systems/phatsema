import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, unwrap } from '@/shared/api/client';
import { sessionKeys } from '@/shared/auth/session';
import { ConfirmDialog } from '@/shared/ui/overlays';
import { toast } from '@/shared/ui/toast';
import { problemFromUnknown } from '@/shared/api/problem';

export function DemoResetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const reset = useMutation({
    mutationFn: async () =>
      unwrap<{ data: { fixtureVersion: string; resetAt: string } }>(await api.POST('/demo/reset')).data,
    onSuccess: (result) => {
      onOpenChange(false);
      const me = queryClient.getQueryData(sessionKeys.me);
      queryClient.clear();
      queryClient.setQueryData(sessionKeys.me, me);
      toast('success', 'Demo data reset', `Fixture set ${result.fixtureVersion} restored.`);
      void navigate('/dashboard');
    },
    onError: (error) => {
      toast('error', 'Reset failed', problemFromUnknown(error).detail);
    },
  });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reset demo data?"
      description="All changes made in this browser session will be discarded and the original demonstration dataset will be restored. This cannot be undone."
      confirmLabel="Reset demo data"
      confirmVariant="danger"
      loading={reset.isPending}
      onConfirm={() => reset.mutate()}
    />
  );
}
