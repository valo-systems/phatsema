# Technology and Architecture

**Decision status:** Approved technical baseline for the version-one demo  
**Decision date:** 18 July 2026  
**Primary constraint:** Deployable to cPanel as static frontend assets plus a standard PHP application

## 1. Architecture decision

Build a **modular monolith** with two applications in one repository:

- A client-rendered React single-page application.
- A versioned Laravel JSON API.

The frontend and API are deployed under the same origin. The frontend builds to `dist/`; the contents of `dist/` are copied into the API's public deployment directory. Requests under `/api/v1/*` are handled by Laravel, static assets are served directly by Apache, and all other non-file routes return the React `index.html`.

This structure:

- Works on ordinary cPanel hosting without Node.js at runtime.
- Avoids cross-origin authentication and CORS complexity.
- Keeps frontend and backend independently testable.
- Allows the demo repository to be replaced with MariaDB without replacing the UI or API.
- Avoids premature microservices, queues, Redis, WebSockets, and container requirements.

## 2. Selected technology stack

### Frontend

| Concern | Selection | Decision |
|---|---|---|
| UI runtime | React 19.2.x | Use the latest stable 19.2 patch, not canary builds |
| Language | TypeScript, strict mode | No implicit `any`; strict null checks; generated API types |
| Build | Vite 8.1 | Produces the required static `dist/` artifact |
| Routing | React Router 7, Data Mode | Client-side routes, nested layouts, route-level lazy loading |
| Server state | TanStack Query 5 | Fetching, caching, mutations, invalidation, and background refresh |
| Forms | React Hook Form + Zod 4 | Accessible forms with runtime and compile-time validation |
| Styling | Tailwind CSS 4.3 | CSS-first design tokens and responsive utility styling |
| Primitives | Radix Primitives | Accessible dialogs, menus, tooltips, selects, tabs, and popovers |
| Icons | Lucide React | Consistent, lightweight SVG icon set |
| Tables | TanStack Table | Typed sorting, filtering, selection, and column configuration |
| Charts | Recharts | Focused operational charts; do not use charts where tables are clearer |
| Dates | date-fns | Formatting and calculation without a heavy global runtime |
| API client | OpenAPI-generated TypeScript types + `openapi-fetch` | Contract-driven requests without handwritten duplicate interfaces |
| Unit/component tests | Vitest + Testing Library | Fast tests for hooks, components, and feature behaviour |
| End-to-end tests | Playwright | Chromium, Firefox, WebKit, and responsive workflows |

React 19.2 is the current stable React line. Vite 8 is stable and uses Rolldown for production builds; Vite 8.1 is the current feature release as of the decision date. TypeScript's documentation recommends enabling strict checks for a new codebase. TanStack Query is used only for server state; local UI state remains in components or narrowly scoped contexts.

**Primary sources:** [React versions](https://react.dev/versions), [Vite 8](https://vite.dev/blog/announcing-vite8), [Vite blog](https://vite.dev/blog), [TypeScript strictness](https://www.typescriptlang.org/docs/handbook/2/basic-types.html), [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview)  
**Accessed:** 18 July 2026

### Backend

| Concern | Selection | Decision |
|---|---|---|
| Runtime | PHP 8.5 | Target the latest stable production branch; reject PHP 8.6 prereleases |
| Framework | Laravel 13 | Current major release with PHP 8.5 support |
| Dependency management | Composer 2 | Lock all production dependencies |
| API style | REST/JSON under `/api/v1` | OpenAPI 3.1 contract; predictable resource URLs |
| Authentication | Laravel session cookie + CSRF | Same-origin browser application; no tokens in local storage |
| Authorisation | Policies and permissions | Deny by default; enforce at resource and action level |
| Validation | Form Request classes | Validate all input server-side; frontend validation is convenience only |
| Demo storage | Session-backed repository implementation | Ephemeral isolated demo dataset; no database |
| Production storage | MariaDB repository/Eloquent implementation | Planned adapter, excluded from demo delivery |
| Identifiers | ULIDs | Sortable, non-sequential public identifiers |
| Tests | Pest/PHPUnit | Unit, feature, policy, validation, and contract tests |
| Static analysis | PHPStan + Larastan | Maximum practical level with a documented baseline policy |
| Formatting | Laravel Pint | Deterministic PHP formatting |
| API documentation | OpenAPI 3.1 | Human-readable reference and generated frontend types |

PHP 8.5 is under active support through 31 December 2027 and security support through 31 December 2029. Laravel 13 was released on 17 March 2026, supports PHP 8.3–8.5, receives bug fixes into Q3 2027, and security fixes through 17 March 2028.

**Primary sources:** [PHP supported versions](https://www.php.net/supported-versions.php), [Laravel 13 release policy](https://laravel.com/docs/13.x/releases), [Laravel 13 deployment requirements](https://laravel.com/docs/13.x/deployment), [Laravel testing](https://laravel.com/docs/13.x/testing)  
**Accessed:** 18 July 2026

### Development runtime

- Node.js 24 LTS for frontend development and CI.
- `pnpm` with the package-manager version pinned in `package.json`.
- PHP 8.5 and Composer 2 for backend development and CI.
- Git with conventional commits and short-lived feature branches.
- EditorConfig for cross-editor whitespace consistency.

Node is a build-time dependency only. The deployed cPanel application does not run Node.

## 3. Repository structure

```text
phatsema/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   ├── shared/
│   │   │   ├── styles/
│   │   │   └── test/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── api/
│       ├── app/
│       │   ├── Domain/
│       │   ├── Application/
│       │   ├── Infrastructure/
│       │   └── Http/
│       ├── bootstrap/
│       ├── config/
│       ├── database/
│       ├── public/
│       ├── resources/
│       ├── routes/
│       ├── storage/
│       ├── tests/
│       └── composer.json
├── packages/
│   └── contracts/
│       ├── openapi.yaml
│       ├── examples/
│       └── generated/
├── docs/
├── scripts/
├── .editorconfig
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 4. Frontend architecture

Use **vertical feature modules**. A feature owns its routes, API hooks, schemas, components, tests, and presentation adapters.

```text
src/features/inventory/
├── api/
├── components/
├── routes/
├── schemas/
├── tests/
└── types/
```

### Layer rules

- `app/` owns providers, router creation, layouts, error boundaries, and application bootstrapping.
- `features/` contains business capabilities and may import from `shared/`.
- `shared/` contains design-system components, generic hooks, API infrastructure, formatting, and utilities.
- One feature must not import another feature's private implementation. Cross-feature behaviour goes through public feature exports or shared domain types.
- Route modules are lazy-loaded by feature.
- API response types are generated from OpenAPI; do not hand-copy backend DTOs.
- TanStack Query owns remote data. Do not mirror query data into a global store.
- URL search parameters own shareable filters, sorting, pagination, and selected site context where appropriate.
- Forms use Zod schemas and React Hook Form; server errors are mapped back to fields and an accessible error summary.

## 5. Backend architecture

Use a pragmatic domain/application/infrastructure split inside Laravel:

```text
app/
├── Domain/
│   ├── Inventory/
│   ├── Transfers/
│   ├── Assets/
│   ├── Sites/
│   └── Identity/
├── Application/
│   ├── Commands/
│   ├── Queries/
│   └── DTOs/
├── Infrastructure/
│   ├── DemoStore/
│   ├── Persistence/
│   └── Clock/
└── Http/
    ├── Controllers/Api/V1/
    ├── Middleware/
    ├── Requests/
    └── Resources/
```

### Layer rules

- Controllers translate HTTP requests and responses; they do not contain business rules.
- Form Requests validate input shape and basic invariants.
- Application command/query handlers orchestrate use cases.
- Domain services and value objects enforce stock, transfer, count, and permission rules.
- Repository interfaces live inside the relevant domain.
- The demo implementation lives under `Infrastructure/DemoStore`.
- Laravel-specific models must not leak into domain interfaces.
- Time and ID generation are injected so workflows remain deterministic in tests.
- Every state-changing use case writes an audit event.
- No endpoint may update arbitrary object properties from request payloads.

## 6. Demo storage strategy

The demo contains **no database**.

At first authenticated use:

1. Laravel loads versioned seed fixtures.
2. Fixtures are validated against the same domain rules used by API commands.
3. A per-session `DemoState` is created.
4. Repository operations read and mutate that state.
5. Laravel serialises the state through its session mechanism between requests.

This is intentionally ephemeral:

- Each browser session receives isolated data.
- “Reset demo” restores the original fixture version.
- Session expiry discards changes.
- Uploaded files and permanent records are out of scope.
- The data volume is capped to keep session payloads small.
- A visible “Demo data” indicator prevents users from believing changes are permanent.

The domain depends on repository interfaces, so the later MariaDB implementation can replace the demo repositories without changing controllers, commands, policies, OpenAPI, or React features.

## 7. API standards

- Base path: `/api/v1`.
- Media type: `application/json`; errors use `application/problem+json`.
- Timestamps: ISO 8601 in UTC.
- Dates without times: `YYYY-MM-DD`.
- Quantities and monetary values: decimal strings, never binary floating-point values.
- IDs: ULID strings.
- Collections: `{ "data": [], "meta": { "page": 1, "pageSize": 25, "total": 120 } }`.
- Single resources: `{ "data": { ... } }`.
- Errors follow Problem Details fields: `type`, `title`, `status`, `detail`, `instance`, `traceId`, and optional field-level `errors`.
- Filtering, sorting, and pagination use documented query parameters.
- State-changing requests require CSRF protection and authorisation.
- Mutating resources expose a numeric `version`; stale writes return `409 Conflict`.
- Deletes are avoided for ledger records. Corrections are explicit reversal or adjustment transactions.
- Each request receives a trace ID returned in the response and server logs.
- The OpenAPI document is the contract of record.

## 8. Security baseline

- Same-origin secure, HTTP-only session cookies.
- `SameSite=Lax`, secure cookies in production, session ID rotation after login.
- CSRF protection on every mutating request.
- Passwords or demo access codes supplied through environment configuration, never committed.
- Policies deny access by default.
- Resource-level and function-level authorisation for every endpoint.
- Request size limits, pagination caps, login throttling, and mutation throttling.
- Explicit allow-list validation; no mass assignment.
- Security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame restrictions, and a minimal permissions policy.
- `APP_DEBUG=false` in hosted environments.
- Secrets remain outside the web root.
- Logs exclude passwords, cookies, tokens, and sensitive request bodies.
- Dependencies are audited in CI with Composer and pnpm audit tooling.

The endpoint and policy review will explicitly cover the OWASP API risks, including broken object-level authorisation, broken authentication, unrestricted resource consumption, broken function-level authorisation, and unsafe business-flow access.

**Primary sources:** [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x10-api-security-risks/), [Laravel validation](https://laravel.com/docs/13.x/validation), [Laravel Sanctum/session guidance](https://laravel.com/docs/13.x/sanctum)  
**Accessed:** 18 July 2026

## 9. cPanel deployment design

### Hosting preflight gate

Before implementation is considered deployable, confirm that the cPanel account provides:

- PHP 8.5 through MultiPHP Manager.
- Required Laravel PHP extensions.
- Apache rewrite support and `.htaccess`.
- Ability to set directory permissions.
- A writable PHP session directory.
- A way to upload release archives and extract them.
- Cron support for future scheduled work, although version one does not require it.
- HTTPS for the final portal domain.

cPanel exposes only the PHP versions installed and allowed by the hosting administrator. If PHP 8.5 is unavailable, PHP 8.4 is the approved compatibility fallback because Laravel 13 supports it; this must be recorded before deployment.

**Primary sources:** [cPanel MultiPHP Manager](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/), [PHP supported versions](https://www.php.net/supported-versions.php), [Laravel server requirements](https://laravel.com/docs/13.x/deployment)  
**Accessed:** 18 July 2026

### Release layout

```text
/home/CPANEL_USER/apps/phatsema-api/       Laravel source, vendor, config
/home/CPANEL_USER/public_html/portal/      Public web root only
├── index.php                              Laravel front controller
├── index.html                             React SPA
├── assets/                                Vite hashed assets
├── api/                                   Rewrite entry to Laravel
└── .htaccess
```

The release package is built outside cPanel:

1. Install locked frontend dependencies.
2. Run type checks and tests.
3. Build `apps/web/dist`.
4. Install locked Composer dependencies with production flags.
5. Run backend analysis and tests.
6. Copy `dist/` into the release's public directory.
7. Package the Laravel application, `vendor/`, public files, and integrity manifest.
8. Upload and extract the release.
9. Create or preserve the server-side `.env`.
10. Set writable permissions for `storage` and `bootstrap/cache`.
11. Run Laravel configuration, route, and view caching if cPanel shell access exists; otherwise ship warmed compatible caches only when environment values are not embedded.
12. Verify `/api/v1/health`, authentication, a read workflow, a write workflow, and SPA route refresh.

No Node.js process, development server, or Composer install is required on cPanel.

## 10. Explicit non-selections

- **No Next.js or server-side React:** cPanel should not need a Node runtime.
- **No microservices:** the domain and team size do not justify distributed deployment.
- **No Redux by default:** TanStack Query and local state cover the selected use cases.
- **No GraphQL:** REST/OpenAPI is simpler to govern and host for the current scope.
- **No database in the demo:** session-backed repositories meet the ephemeral-demo requirement.
- **No local-storage authentication token:** use secure server sessions.
- **No production claims for session storage:** the demo adapter is deliberately replaceable and not a production persistence design.

