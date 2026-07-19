# API Contract and Demo Data Model

**API version:** `v1`  
**Base URL:** `/api/v1`  
**Contract format:** OpenAPI 3.1  
**Persistence:** Ephemeral per-session demo repository

## 1. Contract-first workflow

The OpenAPI document is written before feature implementation and is the single source of truth for:

- Endpoint paths and operations.
- Request and response schemas.
- Pagination, filtering, and sorting.
- Error responses.
- Authentication requirements.
- Examples used in documentation and tests.
- Generated frontend TypeScript types.

Contract changes require:

1. Update `packages/contracts/openapi.yaml`.
2. Run schema linting.
3. Regenerate TypeScript types.
4. Update backend and frontend tests.
5. Record a breaking change if an existing field or behaviour is removed or changed incompatibly.

## 2. Response conventions

### Single resource

```json
{
  "data": {
    "id": "01K...",
    "name": "DEMO GRDC S10 1,000 L",
    "version": 3
  }
}
```

### Collection

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "sort": "-updatedAt"
  }
}
```

### Validation/problem response

```json
{
  "type": "https://portal.example/problems/validation",
  "title": "The request could not be validated",
  "status": 422,
  "detail": "Correct the highlighted fields and try again.",
  "instance": "/api/v1/transfers",
  "traceId": "01K...",
  "errors": {
    "lines.0.quantity": [
      "The requested quantity exceeds the available balance."
    ]
  }
}
```

### HTTP status use

| Status | Use |
|---|---|
| `200` | Successful read or action returning a resource |
| `201` | Resource created |
| `204` | Successful action with no response body |
| `400` | Malformed request |
| `401` | No valid authenticated session |
| `403` | Authenticated but not authorised |
| `404` | Resource does not exist or is not visible to the user |
| `409` | State transition or optimistic-concurrency conflict |
| `422` | Validation or business-rule failure |
| `429` | Rate limit exceeded |
| `500` | Unexpected server failure with trace ID |

## 3. Core API resources

### Authentication and session

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/csrf-cookie` | Establish CSRF cookie/session |
| `POST` | `/auth/login` | Authenticate a demo user |
| `POST` | `/auth/logout` | End the current session |
| `GET` | `/auth/me` | Current user, roles, permissions, and assigned sites |
| `POST` | `/demo/reset` | Reset current demo state; administrator only |

### Dashboard and reference data

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/dashboard` | Role- and filter-aware dashboard summary |
| `GET` | `/reference/item-categories` | Item-category options |
| `GET` | `/reference/units` | Unit-of-measure options |
| `GET` | `/reference/reasons` | Adjustment, discrepancy, and reversal reasons |

### Sites and locations

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/sites` | Filtered site list |
| `POST` | `/sites` | Create site |
| `GET` | `/sites/{siteId}` | Site detail and summary |
| `PATCH` | `/sites/{siteId}` | Update permitted site fields |
| `GET` | `/sites/{siteId}/locations` | Site storage locations |
| `POST` | `/sites/{siteId}/locations` | Create location |
| `PATCH` | `/locations/{locationId}` | Update location |

### Items and balances

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/items` | Search/filter item catalogue |
| `POST` | `/items` | Create an item |
| `GET` | `/items/{itemId}` | Item detail |
| `PATCH` | `/items/{itemId}` | Update mutable item fields |
| `GET` | `/items/{itemId}/balances` | Item balance by site/location |
| `GET` | `/balances` | Network balance search |
| `GET` | `/movements` | Immutable ledger search |
| `GET` | `/movements/{movementId}` | Movement detail |

### Direct stock actions

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/receipts` | Post a stock receipt |
| `POST` | `/issues` | Post a stock issue |
| `POST` | `/adjustments` | Post or submit a stock adjustment |
| `POST` | `/movements/{movementId}/reverse` | Create a reversing movement |

### Transfers

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/transfers` | Search transfer queue |
| `POST` | `/transfers` | Create draft transfer |
| `GET` | `/transfers/{transferId}` | Transfer detail and timeline |
| `PATCH` | `/transfers/{transferId}` | Edit draft transfer |
| `POST` | `/transfers/{transferId}/submit` | Submit and reserve stock |
| `POST` | `/transfers/{transferId}/approve` | Approve transfer |
| `POST` | `/transfers/{transferId}/dispatch` | Dispatch and create in-transit movements |
| `POST` | `/transfers/{transferId}/receive` | Receive accepted quantities and discrepancies |
| `POST` | `/transfers/{transferId}/cancel` | Cancel where state allows |

### Stock counts

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/counts` | Search stock counts |
| `POST` | `/counts` | Create draft count |
| `GET` | `/counts/{countId}` | Count detail and progress |
| `PATCH` | `/counts/{countId}` | Edit permitted count fields |
| `POST` | `/counts/{countId}/start` | Snapshot scope and begin |
| `POST` | `/counts/{countId}/entries` | Save counted quantities |
| `POST` | `/counts/{countId}/submit` | Submit for review |
| `POST` | `/counts/{countId}/request-recount` | Request recount |
| `POST` | `/counts/{countId}/approve` | Approve variances |
| `POST` | `/counts/{countId}/post` | Post variance movements |

### Assets

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/assets` | Search asset register |
| `POST` | `/assets` | Create demo asset |
| `GET` | `/assets/{assetId}` | Asset detail and history |
| `PATCH` | `/assets/{assetId}` | Update mutable asset fields |
| `POST` | `/assets/{assetId}/assign` | Assign or move asset |
| `POST` | `/assets/{assetId}/status` | Controlled status transition |
| `POST` | `/assets/{assetId}/meter-reading` | Record meter reading |

### Alerts, reports, and audit

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/alerts` | Current user's alerts |
| `POST` | `/alerts/{alertId}/read` | Mark alert read |
| `GET` | `/reports/stock-on-hand` | Stock summary |
| `GET` | `/reports/movements` | Movement summary |
| `GET` | `/reports/transfers` | Transfer performance |
| `GET` | `/reports/count-variances` | Variance report |
| `GET` | `/reports/assets` | Asset status/service report |
| `GET` | `/audit-events` | Filtered audit search |
| `GET` | `/audit-events/{eventId}` | Audit-event detail |
| `GET` | `/health` | Version and application health |

## 4. Data model

### Identity and access

#### User

- `id`
- `name`
- `email`
- `status`
- `roleIds`
- `assignedSiteIds`
- `lastLoginAt`
- `version`

#### Role

- `id`
- `name`
- `permissions`
- `isSystemRole`

Permissions use explicit action names such as:

```text
inventory.view
inventory.receive
inventory.issue
inventory.adjust
transfer.create
transfer.approve
transfer.dispatch
transfer.receive
count.create
count.review
count.post
asset.manage
report.view
audit.view
demo.reset
```

### Organisation and location

#### Site

- `id`
- `code`
- `name`
- `entityCode`
- `type`
- `countryCode`
- `timezone`
- `status`
- `contactName`
- `contactPhone`
- `version`

#### Location

- `id`
- `siteId`
- `parentLocationId`
- `code`
- `name`
- `type`
- `status`
- `allowsNegativeStock` fixed to `false` in version one
- `version`

### Catalogue

#### Item

- `id`
- `sku`
- `name`
- `description`
- `categoryId`
- `inventoryType`
- `baseUnit`
- `trackingMode`
- `ownershipMode`
- `reorderPoint`
- `targetLevel`
- `status`
- `version`

Enumerations:

```text
inventoryType:
  saleable | consumable | raw_material | spare_part | installation_component

trackingMode:
  quantity | batch | serial

ownershipMode:
  company_owned | consignment | client_owned
```

Client-owned items are included only to demonstrate classification. Version one does not implement repair custody workflows.

### Inventory

#### StockBalance

- `itemId`
- `siteId`
- `locationId`
- `batchId` nullable
- `onHand`
- `reserved`
- `inTransit`
- `quarantined`
- `available` derived as `onHand - reserved - quarantined`
- `version`

Balances are projections of posted movements, not independently editable records.

#### InventoryMovement

- `id`
- `sequence`
- `occurredAt`
- `postedAt`
- `movementType`
- `itemId`
- `quantity`
- `unit`
- `sourceSiteId` nullable
- `sourceLocationId` nullable
- `destinationSiteId` nullable
- `destinationLocationId` nullable
- `batchId` nullable
- `referenceType`
- `referenceId`
- `reasonCode` nullable
- `notes` nullable
- `actorUserId`
- `reversalOfId` nullable
- `resultingBalance`

Movement quantity is positive. Direction is defined by the movement type and source/destination.

### Transfers

#### Transfer

- `id`
- `transferNumber`
- `sourceSiteId`
- `sourceLocationId`
- `destinationSiteId`
- `destinationLocationId`
- `status`
- `requestedBy`
- `approvedBy` nullable
- `dispatchedBy` nullable
- `receivedBy` nullable
- `submittedAt` nullable
- `approvedAt` nullable
- `dispatchedAt` nullable
- `receivedAt` nullable
- `notes`
- `version`
- `lines`

#### TransferLine

- `id`
- `itemId`
- `requestedQuantity`
- `dispatchedQuantity`
- `receivedQuantity`
- `rejectedQuantity`
- `discrepancyReason` nullable
- `unit`

### Stock counts

#### StockCount

- `id`
- `countNumber`
- `siteId`
- `locationId`
- `scope`
- `blindCount`
- `status`
- `createdBy`
- `assignedUserIds`
- `startedAt`
- `submittedAt`
- `reviewedBy`
- `reviewedAt`
- `postedBy`
- `postedAt`
- `version`
- `entries`

#### StockCountEntry

- `id`
- `itemId`
- `batchId` nullable
- `expectedQuantity`
- `countedQuantity`
- `variance`
- `notes`
- `countedBy`
- `countedAt`
- `recountNumber`

### Assets

#### Asset

- `id`
- `assetNumber`
- `name`
- `type`
- `ownershipMode`
- `make`
- `model`
- `serialNumber`
- `registrationNumber` nullable
- `status`
- `siteId`
- `locationId`
- `assignedTo` nullable
- `meterType` nullable
- `meterReading` nullable
- `nextServiceAt` nullable
- `nextServiceMeter` nullable
- `version`

### Audit and notification

#### AuditEvent

- `id`
- `occurredAt`
- `actorUserId`
- `action`
- `resourceType`
- `resourceId`
- `siteId` nullable
- `summary`
- `changes`
- `traceId`

#### Alert

- `id`
- `type`
- `severity`
- `title`
- `message`
- `resourceType`
- `resourceId`
- `siteId` nullable
- `createdAt`
- `readAt` nullable

## 5. Domain invariants

### Inventory

- Posted movements are immutable.
- A movement must balance its source/destination effect.
- Available stock cannot fall below zero.
- Quantity must be positive and conform to the item's unit precision.
- A location must belong to the selected site.
- Inactive sites, locations, and items cannot receive new transactions.
- Reversals must reference an eligible movement and cannot exceed its unreversed quantity.
- Balance changes and ledger creation occur atomically inside one repository transaction boundary.

### Transfers

- Source and destination differ.
- Drafts may be edited only by permitted users.
- Submission reserves the requested quantity.
- Approval cannot be performed by an unauthorised role.
- Dispatch cannot exceed reserved or approved quantity.
- Receipt cannot exceed dispatched quantity.
- Received plus rejected quantities cannot exceed dispatched quantity.
- A received or cancelled transfer is terminal.
- Every transition checks the submitted `version`.

### Counts

- A location cannot have overlapping active counts for the same item scope.
- Expected quantity is captured when the count starts.
- Blind-count users cannot receive expected quantities before submission.
- Posting requires approval when any variance exceeds the configured threshold.
- Posting creates ledger movements and cannot be repeated.

### Assets

- Asset number and available serial/registration identifiers are unique.
- Retired assets cannot be assigned.
- Meter readings cannot decrease without an explicit correction workflow.
- Status transitions follow an allow-listed state map.

## 6. Demo repository interfaces

Representative contracts:

```php
interface InventoryRepository
{
    public function balance(BalanceKey $key): StockBalance;

    public function searchBalances(BalanceCriteria $criteria): Page;

    public function appendMovements(MovementBatch $batch): void;

    public function searchMovements(MovementCriteria $criteria): Page;
}

interface TransferRepository
{
    public function get(TransferId $id): Transfer;

    public function save(Transfer $transfer, Version $expectedVersion): void;

    public function search(TransferCriteria $criteria): Page;
}

interface TransactionManager
{
    public function run(Closure $operation): mixed;
}
```

The session-backed adapter implements these interfaces. The future MariaDB adapter will implement the same contracts.

## 7. Seed-fixture policy

- Fixtures are versioned under `apps/api/resources/demo/v1/`.
- Human-readable JSON or PHP arrays are allowed; use one canonical format consistently.
- Fixture identifiers remain stable for repeatable screenshots and tests.
- Fixtures are loaded through domain constructors, not assigned directly to internal state.
- Every visible invented identifier begins with `DEMO-`.
- Quantities, names, and site labels are plausible but explicitly fictional.
- A fixture-validation test fails the build if any invariant is violated.

## 8. Authorisation matrix

| Action | Admin | Operations Manager | Site Manager | Storekeeper | Viewer |
|---|---:|---:|---:|---:|---:|
| View assigned data | Yes | Yes | Yes | Yes | Yes |
| View all sites | Yes | Yes | No | No | Yes |
| Manage catalogue | Yes | Yes | No | No | No |
| Receive/issue stock | Yes | Yes | Assigned site | Assigned site | No |
| Create transfer | Yes | Yes | Assigned site | Assigned site | No |
| Approve transfer | Yes | Yes | Assigned site | No | No |
| Dispatch/receive | Yes | Yes | Assigned site | Assigned site | No |
| Create/count stock | Yes | Yes | Assigned site | Assigned site | No |
| Review/post count | Yes | Yes | Assigned site | No | No |
| Manage assets | Yes | Yes | Assigned site | No | No |
| View reports | Yes | Yes | Assigned site | Assigned site | Yes |
| View audit | Yes | Yes | Assigned site | No | Yes |
| Reset demo | Yes | No | No | No | No |

Policies must additionally restrict records by assigned site. The UI may hide unavailable actions, but the API remains the enforcement point.

## 9. Contract acceptance tests

- Every OpenAPI operation has at least one successful example.
- Every mutation documents `401`, `403`, `409`, and `422` where applicable.
- Generated TypeScript types are current and produce no uncommitted diff.
- Backend responses validate against the documented schema for representative success and error cases.
- Decimal quantities remain strings across PHP, JSON, and TypeScript boundaries.
- Unauthorised users cannot access a resource by changing its ID.
- Pagination caps are enforced server-side.
- Unknown filter and sort fields are rejected or explicitly ignored according to the contract; use one rule consistently.

