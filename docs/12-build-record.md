# Version 1 Build Record

**Build:** Phatsema Portal `1.0.0`  
**Recorded:** 19 July 2026  
**Status:** Locally verified demonstration build; client discovery and cPanel hosting preflight remain external gates.

## Delivered

Version one includes five fictional personas, private employee work profiles, secure self-service password changes, user and role administration, dashboard, sites and locations, item catalogue, balances, immutable movements, receipts, issues, adjustments and reversals, transfers, counts, controlled assets, alerts, reports, audit history, and per-browser demo reset. No production customer, employee, supplier, site, inventory, or asset data is included.

## Architecture

- React 19.2, strict TypeScript, React Router Data Mode, TanStack Query, Tailwind CSS, and accessible Ark UI controls.
- Vite static output in `apps/web/dist`; no Node.js production process.
- PHP 8.5 and Laravel 13 REST API under `/api/v1`.
- Same-origin session cookies and CSRF protection.
- Domain repository ports with a session-backed `DemoStore` adapter.
- Application services for inventory, transfers, counts, assets, catalogue, sites, authentication, alerts, and reset.
- Form Requests, deny-by-default policies, API resources/presenters, RFC 9457 Problem Details, optimistic concurrency, and mutation audit events.
- Decimal-safe quantities supporting three decimal places.
- Versioned fixtures in `apps/api/resources/demo/v1`.
- OpenAPI 3.1 with generated frontend types and drift validation.

The dashboard/report projection has its own read port so a future MariaDB adapter can use purpose-built queries without changing HTTP controllers. Production persistence remains out of scope for this demo.

## Material hardening corrections

- Extracted business rules from inventory, transfer, count, and asset controllers.
- Corrected the transfer terminal state from undocumented `completed` to contract-defined `received`.
- Implemented the missing request-recount action.
- Fixed new counts losing entries and receiving unusable entry identifiers.
- Added site/location consistency, site-scope authorization, negative-stock prevention, over-dispatch protection, monotonic asset meters, retired-asset protection, and stale-version conflicts.
- Aligned asset inputs, statuses, types, ownership, meters, and fixtures with OpenAPI.
- Added stable movement labels, adjustment type mapping, reversal linkage, and sequence values.
- Added audit events for catalogue, site/location, alert-read, asset, count, transfer, inventory, and reset mutations.
- Added API-generated SKUs, site codes, location codes, asset numbers, and workflow references.
- Replaced free-text business, country, and timezone codes with controlled selections.
- Removed compatibility form controls and standardised selections, dates, quantities, switches, radio groups, and buttons on the shared Ark UI control layer.
- Added shared data-page, metric, compact-table, line-item, mobile-record, density, column-visibility, selection, and bulk-action patterns.
- Corrected narrow-screen header and data-table overflow and verified the supported 360 to 1440 px viewport set.
- Added transfer reservations, in-transit balances, dispatch and receipt ledger movements, discrepancy reconciliation, maker-checker controls, and count-location freezes.
- Added functional user administration with roles, site scopes, account status, and temporary password reset.
- Added private employee work profiles with preferred names, generated initials, work contact details, biographies, controlled departments, employment metadata, effective-access visibility, and last-successful-sign-in tracking.
- Added current-password-verified self-service password changes that retain the active session.
- Added profile-specific application services and Form Requests, optimistic concurrency, restricted-field rejection, controlled administrator employment updates, and redacted profile audit events.
- Corrected modal select portals so options remain inside the dialog accessibility tree and focus boundary.
- Added SPA fallback routing for direct refreshes outside `/api`.
- Replaced database-dependent demo environment defaults with file sessions/cache and synchronous queues.

## Local operation

Use Node.js 24 LTS or compatible, pnpm 10, PHP 8.4/8.5, and Composer 2.

```bash
pnpm install --frozen-lockfile
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

In a second terminal:

```bash
pnpm --filter @phatsema/web dev
```

Open `http://127.0.0.1:5173`.

## Demo personas

Every persona uses password `PhatsemaDemo1`.

| Persona | Email |
|---|---|
| System Administrator | `admin@demo.phatsema.example` |
| Operations Manager | `operations@demo.phatsema.example` |
| Site Manager | `sitemanager@demo.phatsema.example` |
| Storekeeper | `storekeeper@demo.phatsema.example` |
| Executive Viewer | `executive@demo.phatsema.example` |

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @phatsema/web test:coverage
pnpm build
pnpm test:e2e
pnpm contract:check-drift
pnpm fixtures:validate
pnpm php:parse

cd apps/api
vendor/bin/pint --test
vendor/bin/phpstan analyse --memory-limit=1G
php artisan test
```

The browser suite contains 17 acceptance scenarios and runs 68 checks against the production frontend build in Chromium, Firefox, WebKit, and an iPhone-sized mobile project. It includes all-persona profile access, personal-profile persistence, password changes, administrator employment updates, real Ark Select and DatePicker interaction, mobile record workflows, console checks, and responsive checks at 360, 390, 430, 768, 1024, and 1440 px.

The verified frontend unit suite contains 56 tests across 11 files with 100% statements, functions, and lines plus 85.71% branch coverage in the enforced scope. The verified Laravel suite contains 30 tests and 195 assertions, including profile authorization, validation, concurrency, last-login tracking, password security, session retention, administrator employment updates, and audit redaction. Pint, PHPStan, PHP parsing, fixture validation, generated-contract drift, and a production-mode `APP_DEBUG=false` smoke test pass locally.

## cPanel package

Run `pnpm release`. It creates:

- `release/phatsema-portal-1.0.0.tar.gz`
- `release/phatsema-portal-1.0.0.tar.gz.sha256`

The archive contains:

```text
apps/phatsema-api/     Laravel application and production Composer dependencies
public_html/portal/    React assets and external Laravel front controller
.env.cpanel.example    Production environment checklist
SHA256SUMS             Per-file integrity manifest
```

Deployment:

1. Confirm PHP 8.5 (or approved 8.4 fallback), required extensions, HTTPS, rewrites, and writable sessions.
2. Deploy the public bundle to `/home/valosyst/public_html/phatsema.valosystems.co.za` and the private Laravel application to `/home/valosyst/apps/phatsema-api`.
3. Create `/home/valosyst/apps/phatsema-api/.env` from `.env.cpanel.example`, generate a unique `APP_KEY`, and keep `APP_URL=https://phatsema.valosystems.co.za` and `APP_DEBUG=false`.
4. Make `storage` and `bootstrap/cache` writable by PHP.
5. The front controller resolves `/home/valosyst/apps/phatsema-api` automatically for this document root. Set `PHATSEMA_APP_PATH` only if the private application path changes.
6. Run `php artisan optimize` when shell access exists.
7. Verify health, login, one read, one write, logout, and direct nested-route refresh.

Keep the previous archive for rollback. There is no demo database migration rollback; active demo sessions may reset.

The Git-based deployment is defined in `.cpanel.yml`. In cPanel Git Version Control, pull the required commit and run **Deploy HEAD Commit**. No hostname or domain redirect is configured.

## Demo fixture 1.4

Operational fixture dates are generated relative to the current day so default reporting windows remain useful whenever the demo is presented. Stable record IDs and `DEMO-` references are retained.

The baseline includes:

- complete fictional work-profile details for all five personas, including controlled departments and generated-avatar source names;
- 12 recent inventory movements covering receipts, issues, positive and negative adjustments, transfer dispatch/receipt, and count variance;
- four transfers across received, dispatched, submitted, and approved states;
- three counts across posted, in-progress, and submitted states;
- six assets with company-owned, consignment/hired, and client-owned examples;
- five active alerts and eight recent audit events.

Estimated inventory value is a demo reporting aid based on category-level costs. It is not a finance valuation and must be replaced by client-confirmed costing rules before production use.

## External gates

- Official brand assets and approved production copy.
- Confirmed legal entities, VAT and combined-invoicing treatment for Agape Water and Phatsema.
- Real sites, warehouses, users, roles, items, units, balances, suppliers, assets, and opening stock.
- Client-approved workflows, limits, integrations, and report definitions.
- Actual cPanel domain, path, extensions, credentials, and hosting preflight.
- Security review and user acceptance testing before production-data use.

These are discovery/deployment gates, not hidden implementation placeholders.
