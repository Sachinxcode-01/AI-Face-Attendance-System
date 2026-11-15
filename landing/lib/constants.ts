const DEFAULT_PORTAL_URL = "https://portal.smartface.pro";

/**
 * Public base URL of Website 2 (the unified portal app).
 * NEXT_PUBLIC_* values are inlined at build time; this is public config, not a secret.
 */
const configuredPortalUrl = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();

export const PORTAL_URL = (configuredPortalUrl || DEFAULT_PORTAL_URL).replace(/\/+$/, "");

/** Every route below lives on Website 2, never on this marketing site. */
export const PORTAL_LINKS = {
  student: `${PORTAL_URL}/student`,
  teacher: `${PORTAL_URL}/teacher`,
  admin: `${PORTAL_URL}/admin`,
  parent: `${PORTAL_URL}/parent`,
} as const;

export const COMPANY_CONTACT = {
  name: "SmartFace Systems Inc.",
  address: "500 Technology Square, Suite 400",
  cityStateZip: "Cambridge, MA 02139, USA",
  phone: "+1 (888) 582-3223",
  phoneFormatted: "+1 (888) 582-FACE",
  salesEmail: "sales@smartface.pro",
  supportEmail: "support@smartface.pro",
  privacyEmail: "privacy@smartface.pro",
  legalEmail: "legal@smartface.pro",
  hours: "Mon–Fri: 8:00 AM – 8:00 PM EST · 24/7 Enterprise SOC",
} as const;

export const DEMO_MAILTO = `mailto:${COMPANY_CONTACT.salesEmail}?subject=${encodeURIComponent(
  "Campus demo request",
)}`;
