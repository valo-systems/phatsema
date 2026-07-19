# Testing and Quality

Quality gates protect behaviour, contracts, architecture, documentation, and deployment.

## Main commands

```bash
pnpm check
pnpm test:e2e

cd apps/api
composer validate --strict
vendor/bin/pint --test
vendor/bin/phpstan analyse --memory-limit=1G
php artisan test
```

## Test layers

| Layer | Purpose |
|---|---|
| TypeScript and PHP static analysis | Invalid types, imports, and unsafe backend paths |
| Frontend unit tests | Controls, validation, formatting, and client-side behaviour |
| Laravel unit tests | Domain values and state transitions |
| Laravel feature tests | Authentication, permissions, workflows, audit, and errors |
| Contract checks | OpenAPI validity and generated-type drift |
| Fixture checks | Demo references, balances, dates, and identifiers |
| Playwright | Complete persona workflows, responsive views, and console safety |
| Release checks | Archive checksum, required files, and cPanel layout |

The frontend coverage command enforces the thresholds configured in Vite. Backend tests must cover success, validation, permission denial, concurrency, and audit behaviour for each mutation.

## Repository hygiene

- `pnpm dead-code:check` rejects unused frontend files, exports, and dependencies.
- `pnpm docs:check` validates Markdown, local links, and Mermaid syntax.
- `pnpm copy:lint` rejects em dashes in maintained user-facing and project copy.
- Pint runs in check mode during CI.
- Generated OpenAPI types must match the committed contract.

GitHub Actions runs these gates on pushes and pull requests. Playwright reports and traces are retained when browser tests fail.
