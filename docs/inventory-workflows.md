# Inventory Workflows

Inventory is trustworthy when every quantity change has a reason, actor, time, site, location, item, and audit trail.

```mermaid
flowchart LR
    Receipt["Receive stock"] --> Ledger["Inventory movement ledger"]
    Issue["Issue stock"] --> Ledger
    Adjustment["Approved adjustment"] --> Ledger
    Transfer["Receive transfer"] --> Ledger
    Count["Post stock count"] --> Ledger
    Reversal["Reverse movement"] --> Ledger
    Ledger --> Balance["Derived on-hand balance"]
    Ledger --> Audit["Audit event"]
    Balance --> Reports["Dashboard and reports"]
```

## Direct stock actions

- A receipt increases stock at one site and location.
- An issue decreases available stock and records its recipient or purpose.
- An adjustment corrects a known variance with a controlled reason.
- A reversal creates compensating history rather than deleting the original movement.
- Negative stock and invalid units are rejected.

## Transfers

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted
    Submitted --> Approved
    Submitted --> Draft: Rejected for correction
    Approved --> Dispatched
    Dispatched --> Received
    Draft --> Cancelled
    Submitted --> Cancelled
    Approved --> Cancelled
    Received --> [*]
    Cancelled --> [*]
```

Dispatch moves responsibility into transit. Receipt posts the destination quantities and records discrepancies. Users cannot skip required states.

## Stock counts

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> InProgress
    InProgress --> Submitted
    Submitted --> RecountRequired
    RecountRequired --> InProgress
    Submitted --> Approved
    Approved --> Posted
    Posted --> [*]
```

Posting creates the approved correcting movements. A count does not silently overwrite balances.

## Assets

Assets are serialised operational records, not stock quantities. Assignment, status, site, location, meter readings, maintenance state, and ownership must remain distinct from consumable inventory.
