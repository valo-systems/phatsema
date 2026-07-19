<p align="center">
  <img src="apps/web/src/assets/brand/logo/logo-full-color-transparent.png" alt="Phatsema Projects and Supplies" width="360">
</p>

<h1 align="center">Phatsema Back-Office Portal</h1>

<p align="center">
  Multi-site inventory, asset, transfer, count, reporting, and audit workflows in one focused portal.
</p>

<p align="center">
  <a href="https://github.com/valo-systems/phatsema/actions/workflows/ci.yml"><img alt="Continuous integration" src="https://github.com/valo-systems/phatsema/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react">
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white">
  <img alt="Laravel 13" src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white">
  <img alt="PHP 8.5" src="https://img.shields.io/badge/PHP-8.5-777BB4?logo=php&logoColor=white">
  <img alt="OpenAPI 3.1" src="https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white">
  <img alt="cPanel ready" src="https://img.shields.io/badge/cPanel-ready-FF6C2C?logo=cpanel&logoColor=white">
</p>

<p align="center">
  <a href="https://phatsema.valosystems.co.za">Live demo</a> |
  <a href="docs/README.md">Documentation</a> |
  <a href="packages/contracts/openapi.yaml">API contract</a>
</p>

## What this repository contains

This pnpm workspace keeps the React application, Laravel API, and OpenAPI contract together:

```text
apps/web/            React SPA and reusable interface components
apps/api/            Laravel API, domain rules, and demo repository
packages/contracts/  OpenAPI source and generated TypeScript types
docs/                Product, engineering, deployment, and business context
scripts/             Validation, release, and cPanel deployment tools
```

The current version uses a session-backed in-memory demo store. Repository interfaces keep the domain independent from that storage choice and provide the seam for a future MariaDB adapter.

## Start locally

Prerequisites: Node.js 24, pnpm 10, PHP 8.4 or 8.5, and Composer 2.

```bash
pnpm install --frozen-lockfile
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

In another terminal:

```bash
pnpm --filter @phatsema/web dev
```

Open `http://127.0.0.1:5173`. See [Getting Started](docs/getting-started.md) for demo accounts and troubleshooting.

## Quality commands

```bash
pnpm check             # frontend, contract, fixtures, docs, and dead code
pnpm test:e2e          # production-build browser matrix
pnpm release           # verified cPanel release archive

cd apps/api
composer validate --strict
vendor/bin/pint --test
vendor/bin/phpstan analyse --memory-limit=1G
php artisan test
```

## Important status

This is a high-functioning demonstration build with realistic fixtures. It is not a production system of record. Legal entities, finance rules, valuation, integrations, retention, and final operational approvals still require client confirmation.

Start with the [documentation map](docs/README.md) before changing architecture, workflows, or deployment.
