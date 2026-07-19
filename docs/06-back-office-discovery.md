# Back-Office Discovery

**Document status:** Pre-discovery working document  
**Research date:** 18 July 2026  
**Purpose:** Prepare the requirements workshop; this is not a technical specification.

## Confirmed requirement

> **Confirmed by meeting**

Phatsema requires a back-office system that provides central visibility of inventory across all its sites.

No other feature, workflow, integration, technology, or reporting requirement is treated as approved at this stage.

## Business domains suggested by the public offering

> **Inference**

| Domain | Examples | Important distinction |
|---|---|---|
| Saleable chemicals | GRDC S10, S20, S30, S40, and S10+B | Batch, packaging, quantity, and possibly expiry or quality status |
| Installation stock | Tanks, PLCs, goosenecks, pipes, and fittings | Stock may become part of a client or site installation |
| Fabrication materials | Steel, HDPE, welding consumables, components | Raw material consumed against jobs |
| Fabricated goods | Bins, chutes, trailers, hoses, and piping | Made to order, held as work in progress, or sold as finished goods |
| Spare parts | Machinery, bucket, plant, and workshop parts | Consumed in maintenance, repairs, or rebuilds |
| Site consumables | PPE, tools, lubricants, fuel-related items, and general supplies | Examples require client validation |
| Company-owned assets | Machinery, lowbeds, tanks, tools, and attachments | Capital or controlled assets, not ordinary stock |
| Rental assets | Excavators, loaders, bulldozers, trenchers, forklifts, and related plant | Allocated under rental agreements and returned |
| Client-owned equipment | Buckets and machinery accepted for repair or rebuild | Must never be valued or counted as Phatsema-owned inventory |
| CSI or donation stock | School shoes, winter clothing, gifts, or event goods | May require separate budgets and reporting |

## Proposed capability areas

> **Inference**

These capabilities are reasonable discovery candidates, not committed scope:

1. Multi-entity, multi-site, warehouse, yard, workshop, vehicle-store, and bin-location structure.
2. Central item and asset masters with categories, units of measure, ownership, and status.
3. Purchase requisition, approval, purchase order, receiving, inspection, and supplier return.
4. Stock issue, reservation, transfer, receipt, return, adjustment, write-off, and cycle count.
5. Job-linked material consumption for fabrication, repairs, rebuilds, and site installations.
6. Serial, batch, lot, packaging, registration, meter, warranty, and service tracking where applicable.
7. Rental allocation, dispatch, inspection, on-hire status, off-hire status, maintenance, and return.
8. Client-owned equipment intake and custody tracking.
9. Low-stock alerts, replenishment, ageing, usage, variance, and valuation reporting.
10. Role-based access, approval thresholds, audit trails, attachments, and transaction history.
11. Mobile-friendly operation for remote sites, potentially with offline capture.
12. Interfaces to finance, payroll, procurement, telematics, or other existing systems if required.

## Discovery questions

### A. Organisation and scope

> **Requires confirmation**

1. Which legal entities, divisions, or brands must the system represent?
2. Is Agape Water in the initial system scope or only in the commercial invoice?
3. Which countries and operating companies are in the first release?
4. Who owns the product, budget, processes, data, and final acceptance?
5. What problem is most urgent: stock availability, losses, transfers, purchasing, asset location, reporting, or another issue?
6. What measurable result would make the first release successful?

### B. Sites and locations

> **Requires confirmation**

1. List every office, mine site, client site, store, warehouse, workshop, fabrication facility, yard, and vehicle store.
2. Which locations hold Phatsema stock?
3. Are any locations temporary, mobile, client-controlled, or cross-border?
4. Can a site contain multiple stores, bins, tanks, lay-down areas, or restricted cages?
5. Who may issue, receive, count, approve, or transfer stock at each site?
6. What connectivity, devices, scanners, printers, or scales are available?

### C. Item and ownership model

> **Requires confirmation**

1. What inventory categories exist today?
2. Which items are stocked, made to order, hired, capitalised, consigned, or client-owned?
3. Are chemicals purchased or produced in bulk and then repacked?
4. Which units of measure are used: litres, kilograms, drums, tanks, metres, sheets, each, hours, or tonnes?
5. Are unit conversions required between purchasing, storage, issue, and sale?
6. Which products require batch, lot, expiry, quality, hazardous-material, or certificate tracking?
7. Which assets require serial numbers, registration numbers, engine/chassis numbers, meter readings, or GPS identifiers?
8. Can ownership change when equipment or installation stock reaches a client site?

### D. Procurement and receiving

> **Requires confirmation**

1. Who requests, approves, orders, receives, and inspects goods?
2. Are purchase orders mandatory?
3. Are approval thresholds based on value, site, project, item category, or entity?
4. How are partial deliveries, back orders, price differences, damaged goods, and supplier returns handled?
5. What documents accompany receipt: delivery note, invoice, certificate, safety data sheet, or inspection record?
6. Is three-way matching required between purchase order, receipt, and supplier invoice?

### E. Issues, transfers, and returns

> **Requires confirmation**

1. Who requests and approves stock issues?
2. Must issues be charged to a site, project, job, asset, customer, employee, or cost centre?
3. How are inter-site transfers initiated, dispatched, tracked in transit, and received?
4. Can stock move between legal entities?
5. How are unused stock, damaged stock, scrap, and empty containers returned?
6. How are emergency or after-hours issues captured?
7. Are signatures, photographs, GPS, or proof of delivery required?

### F. Fabrication, repairs, and projects

> **Requires confirmation**

1. Are bills of material, routings, drawings, estimates, and job cards used?
2. Must the system reserve and issue raw material against a fabrication job?
3. How are offcuts, scrap, rework, and substitutions recorded?
4. How is work in progress valued?
5. How are client-owned buckets or machines received, inspected, quoted, repaired, and returned?
6. Are warranties or post-repair inspections tracked?

### G. Rentals and machinery

> **Requires confirmation**

1. Which equipment is company-owned, financed, leased in, or sub-hired?
2. Are rentals billed by day, month, shift, hour, tonne, or another measure?
3. Is the published 12-month minimum universal or limited to Mining's yellow machinery?
4. What pre-hire, dispatch, on-site, off-hire, and return inspections are required?
5. Are operators supplied with machinery?
6. What service intervals, meter readings, certificates, licences, and breakdown records are required?
7. Is telematics or GPS data available for integration?
8. How are damage, downtime, replacement machines, and customer liability handled?

### H. Counts, valuation, and controls

> **Requires confirmation**

1. How often are full counts and cycle counts performed?
2. Who may approve adjustments and write-offs?
3. Is negative stock allowed?
4. Which costing method is used?
5. Must the system support multiple currencies or tax jurisdictions?
6. What constitutes obsolete, expired, slow-moving, quarantined, or damaged stock?
7. Are stocktake freezes, recounts, and variance investigations required?
8. What audit evidence must be retained and for how long?

### I. Users and approvals

> **Requires confirmation**

1. Identify administrators, buyers, storekeepers, site managers, project managers, mechanics, operators, finance users, executives, and auditors.
2. Which users may operate across sites or entities?
3. What approval hierarchy and delegation rules exist?
4. Is single sign-on or multifactor authentication required?
5. Are external suppliers, clients, or auditors expected to access the system?
6. What employee changes should automatically remove or adjust access?

### J. Reporting and alerts

> **Requires confirmation**

1. Which daily, weekly, and monthly reports are currently produced?
2. Which measures matter most: stock on hand, availability, usage, loss, ageing, transfer time, downtime, cost, or margin?
3. Which reports must separate entities, sites, projects, assets, customers, or cost centres?
4. Who receives low-stock, expiry, overdue-transfer, overdue-return, maintenance, or variance alerts?
5. Are dashboards required for executives, operations, stores, procurement, and finance?
6. What export formats and scheduled deliveries are required?

### K. Existing systems and migration

> **Requires confirmation**

1. Which accounting, ERP, payroll, CRM, fleet, telematics, document, or procurement systems are currently used?
2. Where is inventory data currently stored?
3. Are there item codes, asset registers, supplier masters, customer masters, and opening balances to migrate?
4. How clean, complete, and consistent is the existing data?
5. Which system should remain the financial source of truth?
6. Are APIs available, or will imports and exports be required?

## Suggested workshop outputs

The requirements workshop should produce:

- Confirmed entity and site hierarchy.
- Current-state process maps.
- Agreed inventory and asset classifications.
- Prioritised user journeys for the first release.
- Role and approval matrix.
- Required reports and integrations.
- Data-migration inventory.
- Explicit exclusions and later-phase items.
- Acceptance measures and nominated sign-off owners.

## Known, inferred, and unknown

### Known

- Multi-site inventory visibility is required.
- The business publicly offers products, fabrication, services, machinery hire, maintenance, and site operations.

### Inferred

- A simple single-warehouse stock ledger is unlikely to cover the full operating model.
- Ownership, custody, asset status, site, project, and legal entity will probably be important dimensions.
- Mobile or offline use may be important for remote sites.

### Unknown

- All workflows, volumes, integrations, roles, controls, reports, and technical constraints.
- Whether the first release includes assets, rentals, manufacturing, maintenance, finance, or Agape Water.
- Budget, deadline, implementation approach, hosting requirements, and support expectations.
