const DEFAULT_PORTAL_URL = "https://portal.smartface.pro";

/**
 * Public base URL of Website 2 (the unified portal app).
 * NEXT_PUBLIC_* values are inlined at build time; this is public config, not a secret.
 */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || DEFAULT_PORTAL_URL)
  .trim()
  .replace(/\/+$/, "");

/** Every route below lives on Website 2, never on this marketing site. */
export const PORTAL_LINKS = {
  student: `${PORTAL_URL}/student`,
  teacher: `${PORTAL_URL}/teacher`,
  admin: `${PORTAL_URL}/admin`,
  parent: `${PORTAL_URL}/parent`,
} as const;

export const DEMO_MAILTO = `mailto:sales@smartface.pro?subject=${encodeURIComponent(
  "Campus demo request",
)}`;
