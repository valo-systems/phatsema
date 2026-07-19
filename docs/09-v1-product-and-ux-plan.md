# Version-One Product and UX Plan

**Product type:** Highly functional, in-memory demonstration portal  
**Primary audience:** Phatsema executives, operations managers, site managers, and store personnel  
**Design objective:** Make complex multi-site inventory work feel clear, fast, and trustworthy

## 1. Version-one outcome

The demo must prove that Phatsema can:

- See stock and controlled assets across multiple sites.
- Find an item or asset quickly.
- Understand current availability and risk.
- Receive, issue, transfer, adjust, and count inventory through guided workflows.
- Track a transfer from request to receipt.
- Preserve ownership distinctions between stock and equipment.
- Review alerts, activity, and audit history.
- Experience realistic roles and approvals without a production database.

The demo is successful when a client can complete the core workflows without instruction and understand what happened, where it happened, who performed it, and how the balance changed.

## 2. Included modules

### A. Authentication and demo personas

- Branded sign-in screen.
- Secure session login.
- Demo persona selector available only when `APP_DEMO_MODE=true`.
- Visible current role and operating context.
- Session expiry warning and graceful re-authentication.
- “Reset demo data” available only to the demo administrator.

Demo personas:

| Persona | Primary access |
|---|---|
| System Administrator | All demo configuration, users, reset, and audit |
| Operations Manager | All sites, approvals, dashboards, reports, and stock workflows |
| Site Manager | Assigned site, approvals, counts, reports, and transfers |
| Storekeeper | Assigned locations, receiving, issues, transfers, and counts |
| Executive Viewer | Read-only dashboards, reports, balances, and activity |

### B. Operations dashboard

- Network stock-value summary marked as demo data.
- Total items, assets, sites, low-stock items, transfers in transit, and unresolved variances.
- Stock by site.
- Recent movement trend.
- Inventory health distribution: healthy, low, out of stock, excess, and quarantined.
- Transfers requiring action.
- Recent activity stream.
- Quick actions tailored to the current role.
- Global date range and site filters.

### C. Sites and storage locations

- Site directory with type, country, status, contact, and stock summary.
- Site detail page with locations, balances, assets, open transfers, and activity.
- Hierarchical locations such as warehouse, yard, workshop, cage, tank, vehicle store, and bin.
- Active/inactive status.
- No destructive deletion when transactions exist.

### D. Item catalogue

- Searchable item list with SKU, name, category, type, unit, status, and total available.
- Filters for entity, site, category, type, status, and stock health.
- Item detail page with:
  - Description and classification.
  - Total and per-site balance.
  - Available, reserved, quarantined, and in-transit quantities.
  - Reorder settings.
  - Recent movements.
  - Batch/serial applicability.
  - Related assets or installation components.
- Create and edit item forms for permitted roles.
- CSV export of the current filtered view.

### E. Inventory ledger and balances

- Immutable movement ledger.
- Balance view by item, site, and location.
- Movement types:
  - Opening balance.
  - Receipt.
  - Issue.
  - Transfer dispatch.
  - Transfer receipt.
  - Adjustment increase.
  - Adjustment decrease.
  - Count variance.
  - Reversal.
- Each movement shows reference, reason, actor, timestamp, source, destination, quantity, resulting balance, and audit link.
- Posted transactions are never edited or deleted; corrections use reversals or adjustments.

### F. Guided inventory actions

#### Receive stock

1. Select destination site and location.
2. Add item lines and quantities.
3. Capture supplier/delivery reference, receipt date, notes, and optional batch fields.
4. Review balance impact.
5. Post receipt.
6. Show confirmation, updated balances, and audit reference.

#### Issue stock

1. Select source location and issue purpose.
2. Select site, project, asset, or cost-centre reference where applicable.
3. Add items within available quantity.
4. Capture recipient and notes.
5. Review stock impact.
6. Post issue.

Negative stock is blocked.

#### Adjust stock

1. Select item and location.
2. Enter corrected quantity or adjustment amount.
3. Select a mandatory reason.
4. Add evidence notes.
5. Require approval above the configured demo threshold.
6. Post an immutable adjustment movement.

### G. Inter-site transfers

Transfer state model:

```text
Draft → Submitted → Approved → Dispatched → Received
   └──────────────→ Cancelled
```

Rules:

- Source and destination must differ.
- Only available stock may be requested.
- Submission reserves stock.
- Dispatch moves stock from reserved to in transit.
- Receipt adds the accepted quantity to the destination.
- Short, damaged, or rejected quantities require a reason and create an exception.
- Cancellation releases reservations unless already dispatched.
- Each transition is permission-controlled and audited.

Screens:

- Transfer queue grouped by “Needs my action,” “In transit,” and “Completed.”
- Transfer creation wizard.
- Transfer detail timeline.
- Dispatch confirmation.
- Destination receipt and discrepancy capture.

### H. Stock counts

Count state model:

```text
Draft → In Progress → Submitted → Reviewed → Posted
                                └→ Recount Required
```

- Create a count for a site/location and item scope.
- Freeze the expected quantity shown to counters until submission where blind-count mode is selected.
- Capture counted quantity and note.
- Highlight variances by quantity and percentage.
- Require review for material variances.
- Posting creates count-variance ledger entries.
- Preserve the original count, recounts, reviewer, and decision.

### I. Asset register

The asset module demonstrates controlled equipment without pretending it is ordinary stock.

- Asset list and detail.
- Asset type, ownership, serial/registration number, make/model, status, assigned site, current location, meter reading, and next-service date.
- Statuses: available, assigned, on hire, in maintenance, out of service, and retired.
- Assignment/movement history.
- Upcoming and overdue service alerts.
- No rental billing or workshop job management in version one.

### J. Alerts and notifications

- Low stock.
- Out of stock.
- Transfer awaiting approval.
- Transfer overdue in transit.
- Count variance awaiting review.
- Asset service due or overdue.
- Demo session expiry.

Notifications are stored in the demo session, can be marked read, and link directly to the relevant record.

### K. Reports and audit

Reports:

- Stock on hand by site and category.
- Stock movement by period and movement type.
- Low/out-of-stock list.
- Transfer performance and discrepancies.
- Stock-count variances.
- Asset status and service due.

Audit:

- Who, when, action, resource, site, before/after summary, and trace ID.
- Filters by actor, action, resource, site, and date.
- Read-only export.
- Sensitive fields excluded from audit payloads.

## 3. Explicitly excluded from version one

- Production database and data migration.
- Full purchase requisitions, purchase orders, supplier invoices, and three-way matching.
- Sales orders, customer invoicing, and accounting.
- Full fabrication bills of material, work in progress, and production planning.
- Workshop job cards and detailed machine rebuild workflows.
- Rental contracts, usage billing, and telematics.
- File uploads and permanent document storage.
- Email, SMS, WhatsApp, or push delivery.
- Cross-entity stock transfers and tax handling.
- Agape Water operations.
- Offline synchronisation.
- Multi-currency valuation.

These exclusions may be represented as disabled “Coming later” navigation only if that helps the client understand the roadmap. They must not appear functional.

## 4. Information architecture

```text
Dashboard
Inventory
├── Items
├── Balances
├── Movements
├── Receive
├── Issue
├── Adjust
└── Stock Counts
Transfers
Assets
Sites
Reports
Audit
Administration
├── Demo Users
├── Roles
└── Demo Reset
```

Primary routes:

```text
/login
/dashboard
/inventory/items
/inventory/items/:itemId
/inventory/balances
/inventory/movements
/inventory/receive
/inventory/issue
/inventory/adjust
/inventory/counts
/inventory/counts/:countId
/transfers
/transfers/new
/transfers/:transferId
/assets
/assets/:assetId
/sites
/sites/:siteId
/reports
/audit
/admin/users
/admin/roles
```

## 5. Premium visual direction

### Character

The application should feel:

- Confident and industrial, not heavy or dated.
- Calm under operational pressure.
- Data-rich without looking crowded.
- Precise enough for audit work.
- Modern without decorative gimmicks.

### Design language

- Light main workspace with a deep graphite/navy navigation shell.
- Mineral-inspired neutrals with a restrained teal or emerald primary accent.
- Amber reserved for warnings; red reserved for destructive or critical states.
- Subtle elevation and borders rather than excessive shadows.
- One restrained gradient may be used in the sign-in or dashboard hero, never behind dense data.
- Sans-serif variable font with clear numerals and tabular-number support.
- Rounded corners used consistently at a medium radius.
- Motion is short and functional: state changes, drawers, menus, progress, and confirmation.

### Token system

Define tokens in CSS and expose them through Tailwind:

- Semantic colours: canvas, surface, raised, text, muted, border, primary, success, warning, danger, info.
- Type scale: display, page title, section title, body, label, caption, numeric metric.
- Space scale based on 4 px increments.
- Radius: small, medium, large, pill.
- Elevation: none, low, medium, overlay.
- Motion: instant, fast, standard; honour reduced-motion preferences.
- Density: comfortable default with compact table option.

Do not hardcode brand colours inside feature components.

## 6. Interaction principles

1. **Context stays visible.** The selected entity/site, action, and record state remain obvious.
2. **Common work takes few steps.** Quick actions and sensible defaults reduce navigation.
3. **High-impact actions slow down.** Dispatch, posting, adjustments, resets, and reversals require review.
4. **Errors explain recovery.** Messages say what failed and what the user can do next.
5. **Tables are tools.** Sticky headers, useful columns, keyboard focus, filters, saved URL state, and export.
6. **Details appear in place.** Use drawers for quick inspection and full pages for multi-step work.
7. **Status is never colour alone.** Pair colours with text, icons, and accessible names.
8. **Latency is acknowledged.** Use skeletons for initial loading, subtle progress for refresh, and disabled duplicate submission.
9. **Empty states teach.** Explain why the screen is empty and offer the next permitted action.
10. **The demo is honest.** Persistent banners and reset messaging make ephemeral data clear.

## 7. Global application shell

- Collapsible left navigation with labels and clear active state.
- Top bar containing:
  - Page context.
  - Global site selector.
  - Search/command trigger.
  - Alerts.
  - Help.
  - User menu.
- Breadcrumbs only on nested record and workflow pages.
- Command palette for navigation and permitted quick actions.
- Responsive bottom action bar on narrow workflow screens.
- No horizontal page scrolling; tables may scroll inside a labelled region.

## 8. Responsive behaviour

### Desktop, 1280 px and wider

- Full navigation.
- Multi-column dashboards.
- Data tables with persistent filters.
- Detail panels may open beside list content.

### Tablet, 768–1279 px

- Collapsible navigation.
- Two-column dashboard.
- Filters in a drawer.
- Forms use one or two columns depending on available width.

### Mobile, below 768 px

- Compact header and navigation drawer.
- Priority columns only; rows open a detail sheet.
- Guided workflows remain fully usable.
- Touch targets meet WCAG sizing expectations.
- Stock actions keep a persistent primary action near the thumb zone.

## 9. Accessibility standard

Target **WCAG 2.2 Level AA**:

- Semantic landmarks and heading order.
- Complete keyboard operation.
- Visible, unobscured focus.
- Accessible labels, descriptions, and status announcements.
- Minimum target sizes.
- Sufficient colour contrast.
- Errors identified in text and linked to fields.
- No drag-only interaction.
- Reduced motion support.
- Screen-reader-friendly tables, dialogs, menus, and live regions.
- Authentication that does not depend on inaccessible cognitive tests.

Radix primitives provide accessible behaviour for complex controls, but the project remains responsible for labelling, content, focus order, contrast, and workflow testing.

**Primary sources:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WCAG 2.2 additions](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)  
**Accessed:** 18 July 2026

## 10. Seeded demo story

The fixture set should feel credible without presenting invented data as client truth.

- 5 fictionalised sites based on generic operating patterns.
- 8–12 storage locations.
- 35–50 items across chemicals, installation components, fabrication materials, spares, and consumables.
- 12–20 assets across plant, transport, tanks, and workshop equipment.
- 60–100 ledger movements covering the previous 90 days.
- Transfers in every meaningful state.
- One count with a material variance.
- Low-stock, overdue-transfer, and service-due alerts.
- Five demo users, one per persona.

All fictional records use a `DEMO-` prefix where identifiers are visible. A footer and data banner state that the content is illustrative.

## 11. UX acceptance criteria

- A first-time user can locate an item's quantity at a specific site in under 30 seconds.
- A storekeeper can create and dispatch a transfer without external instruction.
- A destination storekeeper can receive a transfer and record a discrepancy.
- A manager can identify why a balance changed and reach the responsible audit entry.
- All core actions work by keyboard.
- Core screens work at 375 px, 768 px, 1280 px, and 1440 px widths.
- Loading, empty, error, permission-denied, and success states exist for every module.
- No critical status relies only on colour.
- The production bundle has no console errors or warnings during acceptance flows.

