# Phatsema Documentation

Use the shortest reading path that matches the work.

## Build and maintain

1. [Getting Started](getting-started.md)
2. [Architecture](architecture.md)
3. [Frontend](frontend.md) or [Backend](backend.md)
4. [API and Contracts](api-and-contracts.md)
5. [Testing and Quality](testing-and-quality.md)
6. [Contributing](contributing.md)

## Understand the product

- [Inventory Workflows](inventory-workflows.md)
- [Demo Data](demo-data.md)
- [Audit Readiness](audit-readiness.md)
- [Branding](branding.md)

## Operate and deploy

- [cPanel Deployment](deployment-cpanel.md)
- [OpenAPI contract](../packages/contracts/openapi.yaml)
- [Business research](business/00-meeting-context.md)

## Source of truth

| Question | Source |
|---|---|
| What does the public API accept? | `packages/contracts/openapi.yaml` |
| What business rules apply? | `apps/api/app/Domain` and application services |
| How does the UI behave? | Feature code and tests in `apps/web` |
| What demo records exist? | `apps/api/resources/demo/v1/FixtureFactory.php` |
| How is production deployed? | `.cpanel.yml`, deployment scripts, and the cPanel guide |
| What did the client or website confirm? | `docs/business` |

Historical build briefs and stale task lists are intentionally not retained. Git history remains the record of previous implementation plans.
