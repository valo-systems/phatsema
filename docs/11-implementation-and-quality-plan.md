# Implementation and Quality Plan

**Delivery target:** Version-one in-memory demonstration portal  
**Delivery approach:** Contract-first vertical slices  
**Deployment target:** cPanel with PHP 8.5 and Apache

## 1. Delivery principles

1. Build one end-to-end capability at a time: contract, domain rule, API, UI, tests, and acceptance.
2. Keep demo storage behind production-shaped repository interfaces.
3. Make invalid states difficult to represent in both code and UI.
4. Treat accessibility, security, observability, and tests as acceptance criteria, not later hardening.
5. Prefer explicit code and predictable conventions over clever abstractions.
6. Add a shared abstraction only after at least two real use cases justify it.
7. Keep the main branch buildable and deployable.
8. Demonstrate with believable fictional data and never imply it is Phatsema's actual operational data.

## 2. Phase plan

### Phase 0 — Hosting and product confirmation

#### Actions

- Confirm the final cPanel portal domain and path.
- Confirm PHP 8.5 availability and required extensions.
- Confirm Apache rewrite support and the session storage path.
- Confirm whether shell/SSH and cron are available.
- Confirm the five demo personas and selected modules.
- Confirm the fictional site names and whether Phatsema branding assets may be used.
- Agree on the version-one acceptance workflows.

#### Outputs

- Hosting capability record.
- Approved demo scope.
- Approved design direction.
- Approved acceptance scenarios.

#### Exit gate

No scaffold is treated as deployment-ready until the target cPanel environment passes the hosting preflight.

### Phase 1 — Repository and quality foundation

#### Frontend

- Create the pnpm workspace.
- Scaffold React 19.2, Vite 8.1, and strict TypeScript.
- Configure aliases, environment validation, linting, formatting, Vitest, Testing Library, and Playwright.
- Create application providers, router, top-level error boundary, and test utilities.

#### Backend

- Scaffold Laravel 13 on PHP 8.5.
- Configure API-only routes, Problem Details rendering, trace IDs, secure session defaults, and health endpoint.
- Install Pest, PHPStan/Larastan, and Pint.
- Define domain/application/infrastructure namespace boundaries.

#### Contract

- Create the OpenAPI 3.1 skeleton.
- Configure linting and TypeScript type generation.
- Add response envelopes, problem schema, pagination, ULIDs, decimal quantities, and version fields.

#### Exit gate

- Frontend builds to `dist/`.
- Backend health endpoint passes.
- Static analysis, linting, unit tests, and contract generation pass locally.
- A release artifact can be assembled without cPanel.

### Phase 2 — Design system and application shell

#### Frontend

- Implement design tokens, typography, colour, spacing, radius, elevation, and motion.
- Build accessible primitives around Radix: button, input, field, select, dialog, drawer, menu, tabs, tooltip, toast, badge, empty state, skeleton, and data table.
- Build the responsive navigation shell, site selector, user menu, alerts menu, breadcrumbs, and command palette.
- Add light theme as the version-one default; prepare token structure for dark theme without delivering a toggle unless requested.
- Create loading, empty, error, forbidden, and not-found patterns.

#### Backend

- Implement seeded demo users, roles, permissions, and session user provider.
- Implement login, logout, current-user, and demo-reset endpoints.
- Add policies and assigned-site scoping.

#### Tests

- Keyboard and focus tests for complex primitives.
- Authentication and policy tests.
- Responsive shell screenshots at acceptance widths.
- Automated accessibility checks for sign-in and shell.

#### Exit gate

All personas can sign in, see only permitted navigation/actions, and use the shell by keyboard.

### Phase 3 — Sites, catalogue, and balances

#### Backend

- Implement Site, Location, Item, StockBalance, and InventoryMovement domain types.
- Implement session-backed repositories and validated seed fixtures.
- Implement site, location, item, balance, and movement endpoints.
- Enforce visibility by role and site.

#### Frontend

- Implement sites list/detail.
- Implement item catalogue, filters, item detail, and forms.
- Implement balance and movement tables.
- Persist filters, sorting, and pagination in URL search parameters.
- Add CSV export for current filtered views.

#### Tests

- Fixture validation.
- Item/category/unit validation.
- Site assignment authorisation.
- Search, filtering, sorting, and pagination.
- Empty, loading, error, and permission states.

#### Exit gate

A user can locate any seeded item, inspect its network/site balance, and trace its movements.

### Phase 4 — Receipts, issues, and adjustments

#### Backend

- Implement atomic movement posting.
- Implement receipt, issue, adjustment, approval-threshold, and reversal commands.
- Enforce non-negative available stock and inactive-record rules.
- Write append-only audit events.

#### Frontend

- Build receive, issue, and adjust guided workflows.
- Add item-line editors, quantity validation, balance-impact review, confirmations, and result summaries.
- Map server validation to fields and an error summary.
- Add safe duplicate-submission prevention.

#### Tests

- Unit tests for ledger calculations and invariants.
- Feature tests for success, insufficient stock, permissions, stale version, and validation.
- End-to-end receipt, issue, and adjustment workflows.
- Audit-event verification.

#### Exit gate

Every inventory action produces correct balances, an immutable ledger entry, and an auditable result.

### Phase 5 — Transfers and counts

#### Backend

- Implement transfer state machine, reservations, dispatch, receipt, discrepancies, and cancellation.
- Implement count state machine, blind count, variance review, recount, approval, and posting.
- Enforce optimistic concurrency on transitions.

#### Frontend

- Build transfer queue, creation wizard, detail timeline, action panels, dispatch, and receipt.
- Build count queue, count sheets, variance review, recount, and posting.
- Make “Needs my action” the default operational view.

#### Tests

- Test every valid and invalid state transition.
- Test simultaneous/stale actions.
- Test reservation release and discrepancy arithmetic.
- Test blind-count information restrictions.
- Test count posting produces the correct ledger movements.
- Run complete Playwright transfer and count journeys.

#### Exit gate

Two different demo personas can complete a transfer across sites, and a manager can review/post a stock-count variance.

### Phase 6 — Assets, alerts, reports, and dashboard

#### Backend

- Implement asset register and permitted status transitions.
- Derive alerts from stock, transfers, counts, and service dates.
- Implement dashboard and report queries.
- Implement audit-event search.

#### Frontend

- Build asset list/detail and controlled status/assignment actions.
- Build notification centre.
- Build dashboard cards, operational tables, and restrained charts.
- Build reports and audit views with export.

#### Tests

- Asset uniqueness, assignment, status, and meter rules.
- Alert-generation rules.
- Report totals reconciled to fixture ledger.
- Role-scoped dashboard and audit access.
- Visual regression of dashboard and primary reports.

#### Exit gate

Dashboard totals reconcile to the demo ledger, alerts link to actionable records, and every report respects site permissions.

### Phase 7 — Hardening and cPanel release

#### Engineering

- Run the complete quality pipeline.
- Review every API endpoint against the authorisation matrix.
- Review the OWASP API risk checklist.
- Audit dependencies and remove unused packages.
- Confirm error logs contain trace IDs but no secrets.
- Measure frontend bundle and route chunks.
- Test production build with cache headers and SPA refresh.

#### UX

- Run keyboard-only and screen-reader smoke testing.
- Run contrast and responsive review.
- Refine content, labels, empty states, and workflow guidance.
- Confirm every destructive/high-impact action has an appropriate review step.
- Confirm all fictional data is visibly marked.

#### Deployment

- Build signed/checksummed release archive.
- Upload application and public assets.
- Configure `.env`, session, permissions, HTTPS, and PHP version.
- Run health and smoke checks.
- Record deployed release ID and rollback package.

#### Exit gate

All acceptance scenarios pass on the actual cPanel domain, not only in local development.

## 3. Frontend engineering standards

### Type safety

- `strict: true`.
- Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- No production `any`; use `unknown` and narrow.
- Do not use non-null assertions to bypass legitimate nullability.
- API types are generated from the contract.
- Zod validates environment variables and form boundaries.

### React

- Functional components and hooks.
- Components remain presentational unless they own a genuine interaction boundary.
- Query hooks live beside their feature.
- Side effects are isolated and have explicit dependencies.
- Avoid premature memoisation; measure before optimising.
- Route-level error boundaries and lazy loading.
- Stable semantic keys; never use array position for mutable lists.

### Styling and UI

- Use semantic tokens, not raw colours.
- Shared primitives own focus, disabled, loading, and invalid states.
- Features compose primitives; they do not restyle native controls ad hoc.
- Icon-only buttons require accessible names and tooltips.
- Table actions remain keyboard accessible.
- Respect `prefers-reduced-motion`.

### Data

- TanStack Query keys are created through typed feature key factories.
- Mutations invalidate the smallest correct query set.
- Optimistic updates are limited to reversible, low-risk UI actions such as marking alerts read.
- Inventory posting waits for server confirmation.
- Abort stale requests when route/filter context changes.

## 4. Backend engineering standards

### PHP

- `declare(strict_types=1);` in project PHP files.
- Typed properties, parameters, and return types.
- Immutable value objects where practical.
- PHP enums for stable state sets.
- No static service locators or hidden global dependencies.
- Constructor injection through Laravel's container.
- Domain exceptions mapped centrally to Problem Details.

### Laravel

- Thin controllers.
- Form Requests for input validation and authorisation entry checks.
- API Resources/DTOs for output; never return internal objects directly.
- Policies for resource/action authorisation.
- Transactions expressed through a transaction-manager port.
- Environment access only through configuration files.
- No business logic in route closures.
- No direct session-array mutation outside the demo-store adapter.

### Audit and errors

- State changes emit one or more explicit audit events.
- Audit entries are append-only.
- Expected domain failures return stable problem types.
- Unexpected failures return generic detail and a trace ID.
- Stack traces never reach production clients.

## 5. Testing strategy

### Test pyramid

| Level | Purpose | Tool |
|---|---|---|
| Domain unit | Invariants, arithmetic, and state transitions | Pest |
| API feature | Validation, policies, HTTP contract, session behaviour | Pest/Laravel |
| Frontend unit | Formatters, schemas, reducers, and hooks | Vitest |
| Frontend component | Form and interaction behaviour | Testing Library/Vitest Browser Mode |
| Contract | OpenAPI lint, generated types, response examples | Contract scripts |
| End-to-end | Complete persona workflows | Playwright |
| Manual | Usability, accessibility, visual polish, cPanel smoke | Acceptance checklist |

### Coverage policy

- Do not chase a single global percentage at the expense of meaningful tests.
- Domain services and state machines: 90% line/branch target.
- API policies, validation, and selected commands: 85% line target.
- Frontend feature logic: 80% line target.
- Every critical acceptance workflow has at least one end-to-end test.
- Any escaped defect receives a regression test where automation is practical.

### Required end-to-end scenarios

1. Sign in as each persona and verify scoped navigation.
2. Find an item and inspect its site balance and ledger.
3. Receive stock and verify the new balance.
4. Attempt an over-issue and receive a clear validation error.
5. Issue available stock and verify the ledger.
6. Create, approve, dispatch, and receive a transfer using appropriate personas.
7. Receive a transfer with a discrepancy.
8. Complete a blind count, review a variance, and post it.
9. View an asset and update its permitted assignment/status.
10. Trace a change from dashboard/activity to its audit event.
11. Reset demo data and verify original fixtures return.
12. Refresh nested SPA routes on the production server without a 404.

Playwright supports Chromium, Firefox, and WebKit with isolation, parallel execution, traces, and reports; those browsers form the end-to-end matrix.

**Primary source:** [Playwright testing](https://playwright.dev/docs/intro)  
**Accessed:** 18 July 2026

## 6. Continuous-integration quality gates

Every change must pass:

### Frontend

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

### Backend

```text
composer validate --strict
composer install --no-interaction --prefer-dist
vendor/bin/pint --test
vendor/bin/phpstan analyse
php artisan test
```

### Contract and repository

```text
OpenAPI lint
Generated-client diff check
Fixture validation
Markdown link/format check
Secret scan
Dependency audit
Release-manifest generation
```

Pull requests cannot merge with failing required checks. Generated files must either be committed and checked for drift or generated during builds; use one policy consistently. For this project, commit generated TypeScript API types so local frontend work does not require PHP or an OpenAPI generator.

## 7. Performance budgets

- Initial compressed JavaScript target: under 250 KB, excluding route-lazy chunks.
- Initial compressed CSS target: under 60 KB.
- No single non-vendor route chunk above 150 KB without review.
- Primary route usable within 3 seconds on a mid-range mobile device over a simulated constrained connection after authentication.
- User input response target: under 100 ms for local interactions.
- API list response target: under 500 ms for demo data at the 95th percentile on the hosted environment.
- Paginate every potentially growing collection.
- Avoid fetching full movement or audit histories for summary screens.

Budgets are verified from production builds and hosted measurements, not development mode.

## 8. Observability

Version one includes:

- `/api/v1/health` with application version and non-sensitive status.
- Request trace ID in every response.
- Structured Laravel logs containing level, timestamp, route, status, duration, user ID, and trace ID.
- Client error boundary with a user-friendly recovery action and trace/report reference.
- A build/release identifier visible in the About/help panel.
- No third-party monitoring service until the client approves cost, data handling, and privacy.

## 9. Release and rollback

Each release contains:

- Application version.
- Git commit identifier.
- Frontend asset manifest.
- Composer lock and package lock.
- Checksums.
- Environment-variable checklist.
- Smoke-test checklist.

Keep the previous known-good package. Rollback means restoring the previous application/public package and clearing Laravel caches. Because the demo has no database, rollback requires no schema reversal; active demo sessions may reset.

## 10. Definition of done

A feature is done only when:

- The OpenAPI contract is current.
- Business rules and permissions are implemented server-side.
- The UI covers loading, empty, error, forbidden, success, and responsive states.
- Keyboard operation and accessible labelling are verified.
- Unit/feature/component tests cover meaningful logic.
- The acceptance path has an end-to-end test where applicable.
- Audit behaviour is present for state changes.
- Documentation and seed examples are current.
- Quality gates pass.
- The production build works under the cPanel routing model.

## 11. Decisions deferred until client discovery

- Production entity and site hierarchy.
- Production database and migration.
- Actual item, supplier, customer, asset, and opening-balance data.
- Purchasing, fabrication, repair, rental, and accounting modules.
- Agape Water system access.
- Integration vendors and API availability.
- Offline operation.
- Notification providers.
- File/document storage.
- Hosting scale, service-level objective, backup, retention, and disaster recovery.

The version-one demo must not hardcode assumptions that prevent these later decisions.

