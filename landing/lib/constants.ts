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
  name: "SmartFace AI Attendance System",
  developer: "Sachin K",
  developerRole: "Developer & Creator",
  location: "Gadag, Karnataka, India - 582103",
  address: "Gadag, Karnataka",
  cityStateZip: "India - 582103",
  phone: "+919880762623",
  phoneFormatted: "+91 98807 62623",
  email: "kalinganavarsachin@gmail.com",
  salesEmail: "kalinganavarsachin@gmail.com",
  supportEmail: "kalinganavarsachin@gmail.com",
  privacyEmail: "kalinganavarsachin@gmail.com",
  legalEmail: "kalinganavarsachin@gmail.com",
  github: "https://github.com/Sachinxcode-01/AI-Face-Attendance-System",
  githubRepo: "Sachinxcode-01/AI-Face-Attendance-System",
  hours: "Gadag, Karnataka, India · IST (UTC+5:30)",
} as const;

export const DEMO_MAILTO = `mailto:${COMPANY_CONTACT.salesEmail}?subject=${encodeURIComponent(
  "SmartFace Attendance inquiry / demo request",
)}`;
