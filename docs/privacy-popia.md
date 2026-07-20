# Privacy, POPIA, PAIA, and Portal Notices

This guide describes how privacy and legal information is surfaced in the
Phatsema Portal. It is an implementation record, not legal advice.

## User-facing surfaces

The following routes are public so a person can review them before signing in:

| Route | Purpose |
|---|---|
| `/legal/privacy` | POPIA-aligned privacy notice |
| `/legal/acceptable-use` | Authorised use rules and portal disclaimer |
| `/legal/paia` | PAIA request guidance |
| `/legal/contact` | Privacy, incident, and regulator contacts |

The login card links to the privacy and acceptable-use notices beside a concise
authorised-use statement. The authenticated user menu and footer provide
persistent access to the same legal centre.

No consent checkbox is used. Signing in is not treated as blanket consent to
all employment-related processing. The interface says that the user
acknowledges the notices and that activity may be audited. Phatsema must
document the lawful basis for each processing purpose outside the interface.

## Notice version

The current notice version is defined in
`apps/web/src/features/legal/legal.ts`. It is displayed on the login page and
inside the legal centre.

Changing the notice version does not currently force re-acknowledgement or
record acceptance. Add that workflow only after Phatsema approves:

1. the final notice;
2. when acknowledgement is required;
3. which users are in scope;
4. the evidence and retention period; and
5. how users are handled when they decline.

## Production approval blockers

The legal pages deliberately identify unresolved facts instead of presenting
assumptions as approved company information. Before production reliance,
Phatsema must confirm:

- the responsible legal entity and registered address;
- whether Projects & Supplies and Mining act separately or jointly;
- the Information Officer and any Deputy Information Officer details;
- the dedicated privacy and security contact channels;
- the approved retention schedule;
- hosting locations and any cross-border transfers;
- the operator and sub-operator register;
- the operator agreement with Valo Systems;
- the incident response and data breach notification process; and
- the applicable PAIA Manual, request forms, addresses, and fees.

Legal counsel or the appointed Information Officer should approve the final
wording.

## Product controls supporting accountability

The current portal provides:

- authenticated, session-based access;
- CSRF protection;
- role and site access controls;
- user-linked operational actions;
- audit records for material changes;
- optimistic concurrency for supported records; and
- HTTPS in the deployed environment.

These controls support compliance but do not complete it. Organisational
policies, access reviews, retention enforcement, incident response, operator
management, and staff training remain required.

## Cookies

The current web client uses the Laravel session cookie and an XSRF token for
essential authentication and request protection. No advertising or optional
analytics cookies are implemented. Reassess the login notice and cookie
controls before adding analytics, embedded third-party media, or other
non-essential tracking.

## Authoritative references

- [Protection of Personal Information Act, 2013](https://www.justice.gov.za/legislation/acts/2013-004.pdf)
- [Information Regulator POPIA guidance](https://inforegulator.org.za/popia/)
- [Information Regulator PAIA guidance](https://inforegulator.org.za/paia/)
- [Information Regulator complaints](https://inforegulator.org.za/complaints/)
