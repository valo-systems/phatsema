# Claude Build Brief

## Mission

Build the complete version-one Phatsema back-office demonstration portal described in this repository.

Claude Fable 5 is expressly authorised to make creative product, visual-design, interaction, microcopy, component-composition, and implementation decisions where the documentation leaves room for judgement. Aim for a premium, modern, calm, intuitive operational tool that feels unusually polished.

Do not wait for minor aesthetic or implementation clarifications. Make the strongest reasonable decision, keep it consistent, and record material decisions in the relevant documentation.

## Start here

Read these documents completely before scaffolding:

1. `docs/08-technology-and-architecture.md`
2. `docs/09-v1-product-and-ux-plan.md`
3. `docs/10-api-contract-and-data-model.md`
4. `docs/11-implementation-and-quality-plan.md`

Use these for business context and terminology:

5. `docs/00-meeting-context.md`
6. `docs/01-company-profile.md`
7. `docs/02-products-and-services.md`
8. `docs/03-operations-and-market.md`
9. `docs/06-back-office-discovery.md`

The documentation index is `docs/README.md`.

## Non-negotiable decisions

- React 19.2 with strict TypeScript.
- Vite 8.1, producing a static `apps/web/dist/` build.
- React Router 7 Data Mode.
- TanStack Query 5 for server state.
- Tailwind CSS 4.3 and accessible Radix primitives.
- PHP 8.5 with Laravel 13.
- REST/JSON API under `/api/v1`.
- OpenAPI 3.1 contract as the API source of truth.
- Session-cookie authentication with CSRF; no authentication token in browser storage.
- Session-backed, per-browser demo repositories with no database.
- Repository interfaces that can later receive a MariaDB implementation.
- Same-origin cPanel deployment with no Node.js production process.
- WCAG 2.2 AA target.
- Deny-by-default backend authorisation and immutable inventory ledger.
- All visible invented records use a `DEMO-` prefix or are clearly marked as fictional.

Do not replace the stack with Next.js, another PHP framework, GraphQL, microservices, Firebase, Supabase, a database, or a Node server.

## Creative authority

Claude may decide:

- Exact layout, spacing, visual hierarchy, and responsive composition.
- The final mineral/industrial colour palette and typography.
- Component anatomy and interaction details.
- Dashboard card and chart composition.
- Microcopy, empty states, onboarding cues, and confirmation language.
- Animation and transition details, provided reduced motion is respected.
- Fictional demo site, item, asset, and transaction details.
- Internal class, function, folder, and component names consistent with the documented boundaries.
- Small dependency additions when they are stable, justified, accessible, and materially reduce complexity.
- Minor improvements to documented workflows that do not expand the product scope or violate a domain invariant.

When exercising creative authority:

1. Prefer clarity over novelty.
2. Prefer operational confidence over decorative effects.
3. Keep interactions fast and forgiving.
4. Do not hide important status or context.
5. Do not weaken security, accessibility, auditability, or type safety.
6. Record material deviations in `docs/`.

## Required version-one modules

- Authentication and five demo personas.
- Responsive application shell.
- Dashboard.
- Sites and storage locations.
- Item catalogue.
- Stock balances and immutable movement ledger.
- Receipts.
- Issues.
- Adjustments and reversals.
- Inter-site transfers with approval, dispatch, receipt, and discrepancies.
- Stock counts with variance review and posting.
- Lightweight controlled-asset register.
- Alerts.
- Reports.
- Audit log.
- Demo reset.

Use the exact inclusion and exclusion boundaries from `docs/09-v1-product-and-ux-plan.md`.

## Required implementation order

Follow the phases in `docs/11-implementation-and-quality-plan.md`:

1. Verify the local toolchain and cPanel assumptions.
2. Scaffold repository, frontend, backend, contract, and quality tools.
3. Build the design system, shell, authentication, and personas.
4. Build sites, catalogue, balances, and ledger.
5. Build receipts, issues, adjustments, and reversals.
6. Build transfers and counts.
7. Build assets, alerts, reports, dashboard, and audit.
8. Harden, build the release artifact, and document deployment.

Work in end-to-end vertical slices. Do not build every backend endpoint before proving the corresponding UI workflow.

## Engineering expectations

### General

- Keep changes cohesive and reviewable.
- Preserve unrelated user changes.
- Never commit secrets or real credentials.
- Use environment examples for configuration.
- Prefer explicit, readable code to abstract frameworks inside frameworks.
- Avoid TODO placeholders in committed version-one workflows.
- Do not claim completion until production builds and acceptance workflows pass.

### Frontend

- Feature-first folders.
- Generated API types; do not duplicate contract interfaces manually.
- No production `any`.
- Server data stays in TanStack Query.
- URL parameters own shareable table state.
- Every screen handles loading, empty, error, forbidden, success, and responsive states.
- Complex controls must be keyboard accessible.
- Use semantic design tokens rather than raw feature-level colours.

### Backend

- `declare(strict_types=1);`.
- Thin controllers, Form Requests, policies, API resources, and application handlers.
- Business rules stay outside controllers.
- Demo session mutation stays inside the demo-store infrastructure adapter.
- Every state mutation creates an audit event.
- Posted inventory movements are immutable.
- Quantities use decimal-safe representations.
- Stale state transitions return `409 Conflict`.

### Contract

- Define or update OpenAPI before implementing an endpoint.
- Generate and commit frontend API types.
- Keep examples current.
- Use Problem Details errors and stable problem types.

## Verification requirements

At minimum, run and pass:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e

vendor/bin/pint --test
vendor/bin/phpstan analyse
php artisan test
```

Also verify:

- OpenAPI lint and generated-client drift.
- Fixture validation.
- Keyboard navigation for core workflows.
- Responsive layouts at 375, 768, 1280, and 1440 px.
- Direct refresh of nested SPA routes.
- Login and role/site isolation.
- Receipt, issue, transfer, count, asset, report, audit, and demo-reset acceptance paths.
- No browser console errors in the production build.
- No PHP errors with `APP_DEBUG=false`.

If the complete browser matrix is expensive during iteration, use Chromium for the inner loop and run Chromium, Firefox, and WebKit before handoff.

## Demo data

- Use fictional but operationally plausible records.
- Do not copy customer-reference personal telephone numbers into fixtures.
- Do not represent website performance claims as verified operational data.
- Seed every major state needed to demonstrate queues, alerts, reports, and exception handling.
- Keep fixture IDs stable so screenshots and tests remain deterministic.
- Show a persistent “Demo data” indicator.

## Known external inputs that are not blockers

The following are not currently available:

- Official high-resolution logo and brand guidelines.
- Confirmed production legal-entity structure.
- Actual site, warehouse, item, asset, user, supplier, or balance data.
- cPanel account, domain, credentials, and verified server extensions.
- Client-approved production workflows and integrations.

Proceed locally using the documented visual direction, text-based Phatsema branding, fictional `DEMO-` records, environment placeholders, and the approved cPanel assumptions. Keep each missing external input behind configuration or replaceable fixtures.

Do not publish, deploy, buy services, or use real personal/client data without explicit user authorisation.

## Local toolchain observed on 18 July 2026

- Node.js `v25.8.0` is installed locally.
- pnpm `10.32.0` is installed locally.
- PHP `8.5.7` is installed locally.
- Composer `2.10.1` is installed locally.
- Git `2.53.0` is installed locally.

The repository target remains Node.js 24 LTS for CI and supported reproducible builds. If local Node 25 exposes dependency incompatibilities, use Node 24 rather than weakening package constraints.

## Handoff expectation

When finished, provide:

- A concise build summary.
- Exact local run commands.
- Demo login/persona instructions.
- Test and build results.
- Known limitations.
- cPanel packaging/deployment instructions.
- A list of material creative or architectural decisions.
- A clean production `dist/` and release artifact ready for our independent testing.

