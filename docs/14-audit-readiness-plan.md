# Phatsema Audit-Ready Operations and Evidence Plan

## Summary

The portal should become the trusted operational record for inventory, controlled assets and supporting evidence. It should assist annual financial audits, SARS verification, mining and customer audits, and B-BBEE verification without replacing the accounting, payroll or specialist safety systems.

Auditors normally test:

- **Existence:** Does the stock or asset physically exist?
- **Completeness:** Are all transactions recorded?
- **Ownership:** Is it company-owned, hired, consignment or client-owned?
- **Valuation:** Is inventory correctly costed and impaired where necessary?
- **Cut-off:** Was each transaction recorded in the correct period?
- **Accuracy and authorisation:** Who performed, approved and changed each action?
- **Evidence:** Can every sampled transaction be traced to reliable supporting documents?

The current portal already provides movements, approvals, counts, reversals, role controls and audit events. The audit-ready release must add durable production storage, supporting documents, valuation, reconciliations, period controls, evidence packaging and external-auditor access.

This improves audit readiness but cannot guarantee a clean audit opinion. Final policies must be approved by Phatsema's accountant, external auditor and relevant compliance specialists.

## 1. Production-Grade Audit Foundation

- Replace session-only persistence with MariaDB repositories while retaining the in-memory adapter for demonstrations.
- Treat Agape Water, Phatsema Projects & Supplies and Phatsema Mining as separate legal-entity workspaces.
- Require `legalEntityId` on every site, transaction, document, user grant, report and audit event.
- Use separate references, fiscal periods, access permissions and audit packs for each entity.
- Permit consolidated reporting only through an explicit group-level permission.
- Make movements and audit events append-only using database restrictions and chained hashes.
- Record actor, role, entity, site, server timestamp, request identifier, reason, approval and source record.
- Use corrections and reversals instead of editing posted records.
- Add soft-close and hard-close fiscal periods. Reopening requires two authorised users, a reason and an audit event.
- Preserve demo-persona switching only in demo mode.
- Production authentication must use named users, MFA, password policy, session expiry and account lockout.

## 2. Evidence Vault and Compliance Register

- Store uploaded files in encrypted private storage outside `public_html`.
- Allow controlled external links, but retain a portal snapshot or verified hash where evidence must remain reproducible.
- Version every document and record its SHA-256 hash, uploader, upload date, source date, entity, retention category and linked records.
- Serve files only through authorised application downloads.
- Record document views, downloads, exports and auditor access.
- Support legal holds so evidence cannot expire while an audit, dispute or investigation is active.
- Default accounting and operational evidence retention to seven years, subject to a client-approved retention matrix.
- Apply longer retention where an audit, investigation, dispute or legal requirement demands it.

### Transaction evidence templates

- **Receipts:** Purchase-order reference, delivery note, supplier invoice, inspection and goods-received evidence.
- **Issues:** Job, project, cost centre, recipient and supporting job card.
- **Transfers:** Dispatch note, transporter, receipt confirmation and discrepancy evidence.
- **Adjustments:** Reason, supporting evidence, before and after quantity, and independent approval.
- **Counts:** Frozen stock snapshot, count sheets, counters, reviewers, photographs and variance sign-off.
- **Assets:** Purchase or hire agreement, ownership evidence, registration, inspection, service and condition reports.
- **Chemicals:** Safety data sheet, batch, certificate of analysis, expiry and storage controls.
- **Fabricated goods:** Job reference, bill of materials, quality inspection and client acceptance.

### Compliance register

The register should cover:

- CIPC records;
- SARS and VAT records;
- B-BBEE certificates, affidavits and supporting evidence;
- COIDA and letters of good standing;
- insurance;
- supplier and customer registrations;
- safety files;
- employee and contractor competencies;
- licences and permits;
- equipment inspections;
- calibration certificates;
- chemical safety data sheets.

Each compliance record must have an owner, issuing authority, effective date, expiry date, reminder schedule, status and evidence history.

B-BBEE evidence must support reconciliation to invoices, payments and approved contributions rather than only storing a certificate.

## 3. Inventory, Valuation and Close Controls

- Preserve separate treatment of sale stock, consumables, fabricated-to-order goods, hired assets, company assets, consignment stock and client-owned equipment.
- Add lot, batch, serial, expiry and condition tracking where configured by item.
- Introduce inventory costing strategies for weighted average, FIFO and specific identification.
- Require each entity to select and lock its approved accounting policy before production opening balances are imported.
- Calculate cost layers independently of quantities so operational users cannot alter valuation accidentally.
- Add lower-of-cost-and-net-realisable-value review, write-down and reversal workflows.

### Month-end controls

- Create a stock-ledger closing snapshot.
- Reconcile signed physical counts to the ledger.
- Review negative stock and unusual movements.
- Reconcile open transfers and in-transit inventory.
- Confirm consignment and client-owned stock.
- Review obsolete, damaged and slow-moving stock.
- Reconcile inventory valuation to the finance-system general ledger.
- Capture reviewer sign-off.
- Maintain an unresolved-exception register.

### Finance exchange

- Use controlled CSV or XLSX imports for approved costs and general-ledger totals.
- Export inventory journals and reconciliation schedules with entity, period, account mapping, totals and file hash.
- Reject duplicate imports.
- Retain the original import file, validation result, approver and posting result.
- Defer direct accounting integration until the accounting product and chart of accounts are confirmed.

### Production opening

- Perform a signed opening physical count per entity, site and location.
- Import the approved count once as an opening event.
- Attach management sign-off and source evidence.
- Prohibit silent changes to opening quantities.
- Correct opening records through controlled adjustment and approval workflows.

## 4. Auditor Workspace and Evidence Packs

- Add a time-limited, read-only External Auditor role.
- Restrict auditor access to selected entities, periods, sites and audit engagements.
- Add audit engagements containing prepared-by-client requests, owners, due dates, evidence links, status, auditor comments, findings and management responses.
- Provide sampling-ready searches across movements, counts, transfers, adjustments, users, documents and values.
- Show an evidence-completeness indicator for every transaction.
- Provide a dashboard of missing, expired or unapproved evidence.

### Audit exception reports

- After-hours or backdated transactions.
- Sequence gaps.
- Duplicate external references.
- Manual and high-value adjustments.
- Self-approval attempts.
- Reopened periods.
- Inactive-user activity.
- Overdue transfers.
- Stock-count variances.
- Missing supporting documents.
- Expired compliance records.
- Access-control conflicts.

### Signed audit packs

Generate audit packs by legal entity and period containing:

- control summary and management sign-offs;
- stock ledger and valuation extracts;
- physical count records and variances;
- transfer and adjustment schedules;
- ownership and third-party stock schedules;
- user access and approval history;
- compliance and evidence indexes;
- requested source documents;
- CSV and PDF indexes;
- JSON manifest with file sizes and SHA-256 hashes;
- detached digital signature for tamper verification.

Add an independent `Verify audit pack` command that validates the manifest without requiring portal access.

Record each pack's scope, creator, approver, generated time, downloads and verification results.

## 5. Public Interfaces and Data Contracts

- Add APIs for legal entities, fiscal periods, period closing and controlled reopening.
- Add document upload, external-link registration, document versioning, bindings, retention and legal holds.
- Add inventory cost layers, valuation snapshots, write-downs and finance-reconciliation imports.
- Add audit engagements, evidence requests, findings, management responses and signed-pack generation.
- Add compliance obligations, document expiry and reminder endpoints.
- Add access-review and segregation-of-duties reports.
- Extend transactions with `legalEntityId`, `fiscalPeriodId`, evidence status, external-document references and valuation data.
- Include filter scope, entity, period, generated timestamp, application version and integrity hash in every export.
- Store timestamps in UTC and display them using the relevant site timezone.
- Continue using server-generated identifiers and immutable posted dates.

## 6. Test and Acceptance Plan

- Prove one entity cannot access or export another entity's records.
- Trace samples from receipt to evidence, balance, valuation, approval, audit event and finance reconciliation.
- Verify sale stock, company assets, hired assets, consignment and client-owned stock never merge incorrectly.
- Verify posted records cannot be edited or deleted directly.
- Verify period close blocks postings.
- Verify reopening requires independent approval.
- Verify maker-checker separation for transfers, counts, adjustments, write-downs and reconciliations.
- Verify opening counts and finance imports are idempotent and fully evidenced.
- Verify weighted-average, FIFO and specific-identification calculations against accountant-approved examples.
- Verify count freeze, cut-off, in-transit, discrepancy and reversal scenarios.
- Tamper with a copied audit-pack file and confirm verification fails.
- Verify document version history, expiry, retention deletion and legal-hold protection.
- Test malicious file names, oversized uploads, unsupported types and unauthorised downloads.
- Verify auditor accounts expire automatically and cannot mutate records.
- Reconcile dashboard, reports, closing snapshot, audit pack and finance export to the same ledger totals.
- Test encrypted daily backups, quarterly restoration and recovery of MariaDB and evidence files.
- Obtain written acceptance from operations, finance, compliance and the external auditor using a full year-end rehearsal.

## 7. Assumptions and Defaults

- The portal remains the operational inventory and evidence system, not the general ledger or VAT submission system.
- First finance integration uses controlled imports and exports.
- Auditor access and signed offline packs are both required.
- Production launch requires MariaDB, private document storage, HTTPS, MFA, cron jobs, encrypted off-site backups and a tested restore procedure.
- Default recovery objectives are a maximum 24-hour data-loss window and eight-hour service restoration unless the client approves stricter targets.
- Retention is policy-driven. Seven years is the initial accounting default, while legal holds and longer regulatory requirements override deletion.
- The exact statutory audit or independent-review requirement must be confirmed separately for each legal entity using its Public Interest Score, Memorandum of Incorporation and financial-statement preparation arrangements.
- Statutory and accounting decisions must be confirmed by qualified professionals before production configuration.

## Reference Sources

- [CIPC: Financial Statements and Independent Reviews](https://www.cipc.co.za/?page_id=10547)
- [CIPC: Company record-keeping guidance](https://www.cipc.co.za/?page_id=4160)
- [SARS: Record keeping](https://www.sars.gov.za/client-segments/record-keeping/)
- [SARS: Obligations of a VAT vendor](https://www.sars.gov.za/types-of-tax/value-added-tax/obligations-of-a-vat-vendor/)
- [SARS: Tax invoices](https://www.sars.gov.za/businesses-and-employers/government/tax-invoices/)
- [IFRS Foundation: IAS 2 Inventories](https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)
- [DMRE: Mine Health and Safety overview](https://www.dmre.gov.za/mineral-resources/mine-health-and-safety/overview/about)
- [dtic: B-BBEE Verification Manual](https://www.thedtic.gov.za/the-b-bbee-verification-manual/)

