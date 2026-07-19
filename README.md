# Phatsema Back-Office Portal

A planned multi-site inventory and controlled-asset portal for Phatsema.

## Current status

The version-one demonstration portal is implemented with a production frontend build, Laravel API, automated test suites, and cPanel release tooling.

## Technical direction

- React 19.2 and strict TypeScript.
- Vite 8.1 static build to `dist/`.
- Tailwind CSS 4.3 and Radix Primitives.
- Laravel 13 JSON API on PHP 8.5.
- OpenAPI 3.1 contract.
- Session-backed ephemeral data for the demonstration version.
- cPanel deployment without a Node.js runtime or production database.

## Documentation

Start with the [documentation index](docs/README.md).

## Builder handoff

Implementation agents should read [CLAUDE.md](CLAUDE.md) before changing the project. It grants creative authority for visual and interaction decisions while preserving the agreed architecture, scope, quality gates, and cPanel constraints.

## Run locally

```bash
pnpm install --frozen-lockfile
(cd apps/api && composer install && cp .env.example .env && php artisan key:generate)
(cd apps/api && php artisan serve --host=127.0.0.1 --port=8000)
```

From the repository root, run `pnpm --filter @phatsema/web dev` in another terminal and open `http://127.0.0.1:5173`.

See the [version-one build record](docs/12-build-record.md) for demo credentials, verification, release packaging, cPanel deployment, and known external gates.
