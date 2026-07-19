import { createBrowserRouter, Navigate } from 'react-router';
import { AppErrorBoundary } from './AppErrorBoundary';
import { RequireAuth } from './guards';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }),
    ErrorBoundary: AppErrorBoundary,
    HydrateFallback: RouterHydrateFallback,
  },
  {
    ErrorBoundary: AppErrorBoundary,
    Component: RequireAuth,
    HydrateFallback: RouterHydrateFallback,
    children: [
      {
        lazy: async () => ({ Component: (await import('./shell/AppShell')).AppShell }),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            lazy: async () => ({ Component: (await import('@/features/dashboard/DashboardPage')).DashboardPage }),
          },
          {
            path: 'profile',
            lazy: async () => ({ Component: (await import('@/features/profile/ProfilePage')).ProfilePage }),
          },
          {
            path: 'inventory/items',
            lazy: async () => ({ Component: (await import('@/features/items/ItemsListPage')).ItemsListPage }),
          },
          {
            path: 'inventory/items/:itemId',
            lazy: async () => ({ Component: (await import('@/features/items/ItemDetailPage')).ItemDetailPage }),
          },
          {
            path: 'inventory/balances',
            lazy: async () => ({ Component: (await import('@/features/inventory/BalancesPage')).BalancesPage }),
          },
          {
            path: 'inventory/movements',
            lazy: async () => ({ Component: (await import('@/features/inventory/MovementsPage')).MovementsPage }),
          },
          {
            path: 'inventory/receive',
            lazy: async () => ({ Component: (await import('@/features/inventory/ReceivePage')).ReceivePage }),
          },
          {
            path: 'inventory/issue',
            lazy: async () => ({ Component: (await import('@/features/inventory/IssuePage')).IssuePage }),
          },
          {
            path: 'inventory/adjust',
            lazy: async () => ({ Component: (await import('@/features/inventory/AdjustPage')).AdjustPage }),
          },
          {
            path: 'inventory/counts',
            lazy: async () => ({ Component: (await import('@/features/counts/CountsPage')).CountsPage }),
          },
          {
            path: 'inventory/counts/new',
            lazy: async () => ({ Component: (await import('@/features/counts/CountNewPage')).CountNewPage }),
          },
          {
            path: 'inventory/counts/:countId',
            lazy: async () => ({ Component: (await import('@/features/counts/CountDetailPage')).CountDetailPage }),
          },
          {
            path: 'transfers',
            lazy: async () => ({ Component: (await import('@/features/transfers/TransfersPage')).TransfersPage }),
          },
          {
            path: 'transfers/new',
            lazy: async () => ({ Component: (await import('@/features/transfers/TransferNewPage')).TransferNewPage }),
          },
          {
            path: 'transfers/:transferId',
            lazy: async () => ({ Component: (await import('@/features/transfers/TransferDetailPage')).TransferDetailPage }),
          },
          {
            path: 'assets',
            lazy: async () => ({ Component: (await import('@/features/assets/AssetsPage')).AssetsPage }),
          },
          {
            path: 'assets/new',
            lazy: async () => ({ Component: (await import('@/features/assets/AssetCreatePage')).AssetCreatePage }),
          },
          {
            path: 'assets/:assetId',
            lazy: async () => ({ Component: (await import('@/features/assets/AssetDetailPage')).AssetDetailPage }),
          },
          {
            path: 'sites',
            lazy: async () => ({ Component: (await import('@/features/sites/SitesListPage')).SitesListPage }),
          },
          {
            path: 'sites/:siteId',
            lazy: async () => ({ Component: (await import('@/features/sites/SiteDetailPage')).SiteDetailPage }),
          },
          {
            path: 'reports',
            lazy: async () => ({ Component: (await import('@/features/reports/ReportsPage')).ReportsPage }),
          },
          {
            path: 'audit',
            lazy: async () => ({ Component: (await import('@/features/audit/AuditPage')).AuditPage }),
          },
          {
            path: 'admin/users',
            lazy: async () => ({ Component: (await import('@/features/admin/AdminPage')).AdminPage }),
          },
          {
            path: 'admin/roles',
            lazy: async () => ({ Component: (await import('@/features/admin/AdminPage')).AdminPage }),
          },
          { path: '*', element: <NotFoundRoute /> },
        ],
      },
    ],
  },
]);

function RouterHydrateFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas" aria-busy="true">
      <p className="text-sm text-muted">Loading Phatsema Portal…</p>
    </main>
  );
}

function NotFoundRoute() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you are looking for does not exist.</p>
    </div>
  );
}
