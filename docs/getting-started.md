# Getting Started

## Requirements

- Node.js 24 or another version satisfying the root `engines` field
- pnpm 10
- PHP 8.4 or 8.5
- Composer 2

## Install

```bash
pnpm install --frozen-lockfile
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
```

## Run

Start the API:

```bash
cd apps/api
php artisan serve --host=127.0.0.1 --port=8000
```

Start the web application in another terminal:

```bash
pnpm --filter @phatsema/web dev
```

The Vite server at `http://127.0.0.1:5173` proxies `/api` to Laravel on port `8000`.

## Demo accounts

All accounts use `PhatsemaDemo1`.

| Persona | Email | Typical access |
|---|---|---|
| System Administrator | `admin@demo.phatsema.example` | All modules and user management |
| Operations Manager | `operations@demo.phatsema.example` | Cross-site operations and approvals |
| Site Manager | `sitemanager@demo.phatsema.example` | Assigned-site supervision |
| Storekeeper | `storekeeper@demo.phatsema.example` | Daily stock operations |
| Executive Viewer | `executive@demo.phatsema.example` | Read-only dashboards and reports |

Use **Reset demo data** from the administrator menu when a scenario must return to its original fixture state.

## First checks

```bash
pnpm check
cd apps/api
php artisan test
```

If login fails, confirm the API health endpoint responds at `http://127.0.0.1:8000/api/v1/health`, the frontend is using port `5173`, and the Laravel `.env` contains a generated `APP_KEY`.
