import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface SiteScope {
  /** Selected site id, or null for "all permitted sites". */
  siteId: string | null;
  setSiteId: (siteId: string | null) => void;
}

const SiteScopeContext = createContext<SiteScope | null>(null);

export function SiteScopeProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('phatsema.siteScope');
    } catch {
      return null;
    }
  });

  const setSiteId = useCallback((next: string | null) => {
    setSiteIdState(next);
    try {
      if (next) sessionStorage.setItem('phatsema.siteScope', next);
      else sessionStorage.removeItem('phatsema.siteScope');
    } catch {
      // Session storage is a convenience only.
    }
  }, []);

  const value = useMemo(() => ({ siteId, setSiteId }), [siteId, setSiteId]);
  return <SiteScopeContext.Provider value={value}>{children}</SiteScopeContext.Provider>;
}

export function useSiteScope(): SiteScope {
  const context = useContext(SiteScopeContext);
  if (!context) throw new Error('useSiteScope must be used inside SiteScopeProvider');
  return context;
}
