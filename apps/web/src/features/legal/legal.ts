export const LEGAL_NOTICE_VERSION = '2026.07-draft';

export const LEGAL_NOTICE_STATUS = 'Draft for Phatsema confirmation';

export const LEGAL_ROUTES = [
  { slug: 'privacy', label: 'Privacy notice' },
  { slug: 'acceptable-use', label: 'Acceptable use' },
  { slug: 'paia', label: 'PAIA access' },
  { slug: 'contact', label: 'Privacy contact' },
] as const;

export type LegalDocumentSlug = (typeof LEGAL_ROUTES)[number]['slug'];

export function isLegalDocumentSlug(value: string | undefined): value is LegalDocumentSlug {
  return LEGAL_ROUTES.some((route) => route.slug === value);
}
