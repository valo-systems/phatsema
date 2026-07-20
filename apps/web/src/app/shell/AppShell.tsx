import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Menu as ArkMenu, Portal } from '@ark-ui/react';
import logoReversed from '@/assets/brand/logo/logo-full-reversed.png';
import {
  ChevronDown,
  CircleHelp,
  Command,
  LogOut,
  Menu as MenuIcon,
  RotateCcw,
  Scale,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { NAV_SECTIONS } from '@/app/nav';
import { can, useLogout, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { useSitesReference } from '@/shared/api/reference';
import { useSiteScope } from '@/shared/site-scope';
import { env } from '@/shared/config/env';
import { displayName, initials } from '@/shared/format/person';
import { cn } from '@/shared/ui/cn';
import { Button, IconButton } from '@/shared/ui/controls';
import { Badge } from '@/shared/ui/Badge';
import { Select } from '@/shared/ui/controls';
import { CommandPalette } from './CommandPalette';
import { AlertsMenu } from './AlertsMenu';
import { AboutDialog } from './AboutDialog';
import { DemoResetDialog } from './DemoResetDialog';

export function AppShell() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { siteId, setSiteId } = useSiteScope();
  const sites = useSitesReference();

  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const user = session.data;
  if (!user) return null;

  const visibleSites = sites.data ?? [];
  const showSiteSelector = visibleSites.length > 1;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => void navigate('/login', { replace: true }),
    });
  };

  const navContent = (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link to="/dashboard" className="flex items-center rounded-sm">
          <img
            src={logoReversed}
            alt="Phatsema Portal"
            height={32}
            className="h-8 w-auto"
          />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 pb-4 scrollbar-thin">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.permission || can(user, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={section.heading ?? 'root'} className="mt-4 first:mt-1">
              {section.heading && (
                <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-widest text-shell-muted/80 uppercase">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'border border-primary-ring/25 bg-primary/20 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
                            : 'border border-transparent text-shell-muted hover:bg-white/[0.055] hover:text-shell-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            aria-hidden
                            className={cn('size-4', isActive ? 'text-primary-ring' : 'text-shell-muted/80')}
                          />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-shell-line px-4 py-3 text-[11px] leading-relaxed text-shell-muted">
        Demonstration portal. All records are fictional and reset with your session.
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-medium"
      >
        Skip to main content
      </a>

      {/* Desktop navigation */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-shell-line bg-shell shadow-[6px_0_24px_rgb(9_17_29/0.08)] lg:block">{navContent}</aside>

      {/* Mobile navigation drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-shell/60" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-shell shadow-overlay">
            <IconButton
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3.5 right-3 rounded-md p-1.5 text-shell-muted hover:text-shell-ink"
              icon={<X aria-hidden className="size-5" />}
            />
            {navContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <span className="lg:hidden">
              <IconButton
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
                className="rounded-md p-2 text-muted hover:bg-sunken hover:text-ink"
                icon={<MenuIcon aria-hidden className="size-5" />}
              />
            </span>

            {env.demoMode && (
              <span className="hidden sm:inline-flex">
                <Badge tone="warning">Demo data</Badge>
              </span>
            )}

            {showSiteSelector && (
              <label className="ml-1 hidden items-center gap-2 md:flex">
                <span className="text-xs font-medium text-muted">Site</span>
                <Select
                  aria-label="Operating site scope"
                  className="w-52"
                  value={siteId ?? ''}
                  onValueChange={(value) => setSiteId(value || null)}
                  options={visibleSites.map((site) => ({ value: site.id, label: site.name }))}
                  placeholder="All sites"
                  clearable
                />
              </label>
            )}

            <div className="flex-1" />

            <span className="hidden sm:block">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="text-muted"
              >
                <Search aria-hidden className="size-3.5" />
                Search
                <kbd className="ml-1 inline-flex items-center gap-0.5 rounded-sm border border-line px-1 text-[10px] text-faint">
                  <Command aria-hidden className="size-2.5" />K
                </kbd>
              </Button>
            </span>
            <span className="sm:hidden">
              <IconButton
                onClick={() => setPaletteOpen(true)}
                aria-label="Search"
                className="rounded-md p-2 text-muted hover:bg-sunken hover:text-ink"
                icon={<Search aria-hidden className="size-5" />}
              />
            </span>

            <AlertsMenu />

            <IconButton
              onClick={() => setAboutOpen(true)}
              aria-label="About this demo"
              className="rounded-md p-2 text-muted hover:bg-sunken hover:text-ink"
              icon={<CircleHelp aria-hidden className="size-5" />}
            />

            <ArkMenu.Root positioning={{ placement: 'bottom-end', gutter: 6 }}>
              <ArkMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2"
                  aria-label={`User menu for ${user.name}`}
                >
                  <span className="grid size-7 place-items-center rounded-pill bg-primary-soft text-xs font-semibold text-primary-soft-ink">
                    {initials(user)}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block max-w-36 truncate text-[13px] leading-tight font-medium text-ink">
                      {displayName(user)}
                    </span>
                    <span className="block text-[11px] leading-tight text-muted">
                      {user.roles[0]?.name ?? 'User'}
                    </span>
                  </span>
                  <ChevronDown aria-hidden className="hidden size-3.5 text-faint md:block" />
                </Button>
              </ArkMenu.Trigger>
              <Portal>
                <ArkMenu.Positioner>
                <ArkMenu.Content
                  className="z-50 min-w-56 rounded-md border border-line bg-surface p-1 shadow-medium"
                >
                  <div className="border-b border-line px-2.5 py-2">
                    <p className="text-sm font-medium text-ink">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                    <p className="mt-1 text-xs text-muted">
                      {user.allSites ? 'All sites' : `${user.assignedSiteIds.length} assigned site(s)`}
                    </p>
                  </div>
                  <ArkMenu.Item
                    value="profile"
                    onSelect={() => void navigate('/profile')}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-ink outline-none select-none data-[highlighted]:bg-sunken"
                  >
                    <UserRound aria-hidden className="size-4 text-muted" /> My profile
                  </ArkMenu.Item>
                  <ArkMenu.Item
                    value="privacy-legal"
                    onSelect={() => void navigate('/legal/privacy')}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-ink outline-none select-none data-[highlighted]:bg-sunken"
                  >
                    <Scale aria-hidden className="size-4 text-muted" /> Privacy and legal
                  </ArkMenu.Item>
                  <ArkMenu.Item
                    value="about"
                    onSelect={() => setAboutOpen(true)}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-ink outline-none select-none data-[highlighted]:bg-sunken"
                  >
                    <CircleHelp aria-hidden className="size-4 text-muted" /> About this demo
                  </ArkMenu.Item>
                  {can(user, P.demoReset) && (
                    <ArkMenu.Item
                      value="reset-demo"
                      onSelect={() => setResetOpen(true)}
                      className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-ink outline-none select-none data-[highlighted]:bg-sunken"
                    >
                      <RotateCcw aria-hidden className="size-4 text-muted" /> Reset demo data
                    </ArkMenu.Item>
                  )}
                  <ArkMenu.Item
                    value="sign-out"
                    onSelect={handleLogout}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-danger outline-none select-none data-[highlighted]:bg-danger-soft"
                  >
                    <LogOut aria-hidden className="size-4" /> Sign out
                  </ArkMenu.Item>
                </ArkMenu.Content>
                </ArkMenu.Positioner>
              </Portal>
            </ArkMenu.Root>
          </div>
          {env.demoMode && (
            <div className="border-t border-warning/20 bg-warning-soft px-3 py-1 text-center text-[11px] text-warning sm:hidden">
              Demo data · fictional records · session-scoped changes
            </div>
          )}
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-5 sm:px-5 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-line px-5 py-3 text-center text-[11px] text-faint">
          <span>Phatsema Portal {env.appVersion} · demonstration build with illustrative data only.</span>
          <span className="ml-2 inline-flex gap-2">
            <Link className="hover:text-muted hover:underline" to="/legal/privacy">Privacy</Link>
            <Link className="hover:text-muted hover:underline" to="/legal/acceptable-use">Acceptable use</Link>
            <Link className="hover:text-muted hover:underline" to="/legal/paia">PAIA</Link>
          </span>
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} user={user} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <DemoResetDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}
