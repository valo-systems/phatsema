# Phatsema Portal - Verified Work Status

**Last verified:** 19 July 2026  
**Verification method:** direct inspection and local execution on Node.js 24, pnpm 10.32, PHP 8.5.7, and Composer 2.

## Current gate status

| Gate | Status |
|---|---|
| `pnpm install --frozen-lockfile` | Pass |
| `composer install --no-interaction --prefer-dist --optimize-autoloader` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, including portal copy and OpenAPI lint |
| `pnpm test` | Pass, 49 tests across 8 files |
| `pnpm --filter @phatsema/web test:coverage` | Pass, 100% statements/lines and 84.21% branches in the enforced scope |
| `pnpm build` | Pass |
| `pnpm test:e2e` | Pass after targeted repair: 15 scenarios across Chromium, Firefox, WebKit, and mobile |
| `pnpm contract:check-drift` | Pass |
| `pnpm fixtures:validate` | Pass, fixture version 1.3.0 |
| `pnpm php:parse` | Pass, 147 PHP files |
| `vendor/bin/pint --test` | Pass |
| `vendor/bin/phpstan analyse --memory-limit=1G` | Pass, zero errors |
| `php artisan test` | Pass, 24 tests and 149 assertions |
| `APP_ENV=production APP_DEBUG=false` health and error smoke test | Pass |

## Completed implementation

- [x] Removed the `NativeSelect` compatibility shim and migrated forms to `options` and `onValueChange`.
- [x] Removed `QuantityInput` and standardised quantities on `NumberField`.
- [x] Added shared `MetricStrip` and `DataPageShell` composition.
- [x] Added `CompactTable` and `LineItemEditor`; raw tables now exist only inside shared table components.
- [x] Added table priority metadata, mobile record rendering, density controls, column visibility, row accents, selection, and bulk-action support.
- [x] Removed every legacy `secondary: true` column flag.
- [x] Fixed transfer column priorities and narrow-screen overflow.
- [x] Fixed responsive header controls whose base display styles overrode breakpoint visibility.
- [x] Verified 360, 390, 430, 768, 1024, and 1440 px layouts.
- [x] Added DataTable component coverage for search, filtering, pagination, density, column controls, and mobile rendering.
- [x] Added real-browser Ark Select and DatePicker interaction coverage.
- [x] Updated mobile acceptance journeys to operate on the mobile record presentation.
- [x] Added explicit audit-event tests for site, location, catalogue, stock, asset, count, transfer, user, alert, and demo-reset mutations.
- [x] Refreshed `pnpm-lock.yaml` after Radix removal and proved a frozen reinstall succeeds.
- [x] Split `AppShell` from the entry route so initial JavaScript remains within budget.

## Release and deployment

- [x] Rebuilt `release/phatsema-portal-1.0.0.tar.gz` from this verified source state with all release gates passing.
- [ ] Run the hosting preflight in `docs/08-technology-and-architecture.md` against the real cPanel account.
- [ ] Verify HTTPS, rewrite support, PHP extensions, writable paths, document root, and the live nested-route refresh.
- [ ] Run final production-domain smoke tests for login, read, write, logout, direct refresh, browser console, and PHP logs.

The first item is completed by the local release command during this handoff. The remaining deployment checks need the real cPanel account and domain.

## Performance

- Initial application JavaScript: approximately **230.1 kB gzipped**, below the 250 kB budget.
- CSS: approximately **9.1 kB gzipped**, below the 60 kB budget.
- Dashboard chart route: approximately **107.7 kB gzipped** and lazy-loaded.

Keep measuring before adding dependencies. The dashboard chart library remains the first optimisation candidate if its lazy chunk grows.

## External client inputs still required

- [ ] Official logo, brand rules, and approved production wording.
- [ ] Confirmed legal-entity, VAT, and combined-invoicing structure.
- [ ] Production sites, warehouses, users, roles, items, units, balances, suppliers, assets, and opening stock.
- [ ] Client-approved workflows, approval limits, integrations, reports, and audit-retention rules.
- [ ] cPanel account, final domain, deployment path, and credentials.
- [ ] Security review and user acceptance before production-data use.

These are external discovery and deployment gates. They are not hidden implementation placeholders.
