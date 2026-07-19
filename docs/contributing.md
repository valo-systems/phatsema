# Contributing

## Before coding

1. Read the relevant product workflow and architecture guide.
2. Inspect existing code in the same feature.
3. Confirm whether the OpenAPI contract changes.
4. Preserve unrelated user changes in the worktree.

## Change rules

- Keep modules cohesive and dependencies directed inward.
- Prefer small repository interfaces over concrete infrastructure access.
- Keep controllers thin and pages focused on composition.
- Reuse shared controls, tables, overlays, formatters, and error handling.
- Generate system codes automatically unless a business-owned identifier is required.
- Never weaken permissions, validation, audit redaction, or optimistic concurrency.
- Add tests at the lowest useful layer and an end-to-end test for critical workflows.
- Avoid em dashes in maintained copy.

## Definition of done

- Behaviour and acceptance criteria are covered.
- OpenAPI and generated types agree.
- Permissions and audit events are correct.
- Desktop and mobile states are usable.
- Empty, loading, error, success, and conflict states are handled.
- `pnpm check`, backend gates, and relevant Playwright tests pass.
- Documentation changes with the architecture or workflow.
- Deployment files remain valid.

## Review checklist

Reviewers should be able to answer:

- Is the change in the correct layer?
- Can another developer understand the names and flow quickly?
- Is there one source of truth?
- Are failure paths safe and visible?
- Can the operation be audited?
- Could the demo repository be replaced without changing the use case?
