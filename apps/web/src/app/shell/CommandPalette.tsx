import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog as ArkDialog, Portal } from '@ark-ui/react';
import { ArrowRight, Search } from 'lucide-react';
import { NAV_SECTIONS, QUICK_ACTIONS } from '@/app/nav';
import { can, type SessionUser } from '@/shared/auth/session';
import { cn } from '@/shared/ui/cn';

interface Entry {
  id: string;
  label: string;
  group: 'Navigate' | 'Actions';
  to: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const navEntries: Entry[] = NAV_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => !item.permission || can(user, item.permission))
        .map((item) => ({ id: `nav-${item.to}`, label: item.label, group: 'Navigate' as const, to: item.to })),
    );
    const actionEntries: Entry[] = QUICK_ACTIONS.filter((action) => can(user, action.permission)).map((action) => ({
      id: `action-${action.to}`,
      label: action.label,
      group: 'Actions' as const,
      to: action.to,
    }));
    return [...actionEntries, ...navEntries];
  }, [user]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) => entry.label.toLowerCase().includes(term));
  }, [entries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const select = (entry: Entry | undefined) => {
    if (!entry) return;
    onOpenChange(false);
    void navigate(entry.to);
  };

  const activeEntry = filtered[activeIndex];

  return (
    <ArkDialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <ArkDialog.Backdrop className="fixed inset-0 z-40 bg-shell/55 data-[state=open]:motion-safe:animate-fade-in" />
        <ArkDialog.Positioner className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <ArkDialog.Content className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden rounded-lg bg-surface shadow-overlay data-[state=open]:motion-safe:animate-slide-up">
          <ArkDialog.Title className="sr-only">Command palette</ArkDialog.Title>
          <ArkDialog.Description className="sr-only">Search pages and actions</ArkDialog.Description>
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search aria-hidden className="size-4 text-faint" />
            {/* eslint-disable-next-line no-restricted-syntax -- bespoke command input with aria-activedescendant wiring to the results list */}
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={activeEntry?.id}
              aria-label="Search pages and actions"
              placeholder="Search pages and actions…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  select(activeEntry);
                }
              }}
              className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
            <kbd className="rounded-sm border border-line px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
          </div>
          <ul
            id="command-palette-list"
            ref={listRef}
            role="listbox"
            aria-label="Results"
            className="max-h-72 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{query}”.</li>
            )}
            {filtered.map((entry, index) => (
              <li
                key={entry.id}
                id={entry.id}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(entry);
                }}
                className={cn(
                  'flex cursor-default items-center justify-between gap-2 rounded-md px-3 py-2 text-sm',
                  index === activeIndex ? 'bg-primary-soft text-primary-soft-ink' : 'text-ink',
                )}
              >
                <span>{entry.label}</span>
                <span className="flex items-center gap-1 text-[11px] text-faint">
                  {entry.group}
                  <ArrowRight aria-hidden className="size-3" />
                </span>
              </li>
            ))}
          </ul>
        </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}
