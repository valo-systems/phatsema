import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/problem';
import { TooltipProvider } from '@/shared/ui/overlays';
import { Toaster } from '@/shared/ui/toast';
import { SiteScopeProvider } from '@/shared/site-scope';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SiteScopeProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </SiteScopeProvider>
    </QueryClientProvider>
  );
}
