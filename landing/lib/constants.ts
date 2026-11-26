const DEFAULT_PORTAL_URL = "https://ai-face-attendance-system-portal.vercel.app";

/**
 * Public base URL of the unified SmartFace Portal application.
 * NEXT_PUBLIC_* values are inlined at build time; this is public config, not a secret.
 */
const configuredPortalUrl = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();

export const PORTAL_URL = (configuredPortalUrl || DEFAULT_PORTAL_URL).replace(/\/+$/, "");

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ai-face-attendance-beta.vercel.app"
).replace(/\/+$/, "");

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

/** Every route below lives on the unified SmartFace Portal application. */
export const PORTAL_LINKS = {
  student: `${PORTAL_URL}/student`,
  teacher: `${PORTAL_URL}/teacher`,
  admin: `${PORTAL_URL}/admin`,
  parent: `${PORTAL_URL}/parent`,
  superAdmin: `${PORTAL_URL}/admin/super-admin`,
  login: `${PORTAL_URL}/auth/login`,
  register: `${PORTAL_URL}/auth/register`,
} as const;

export const COMPANY_CONTACT = {
  name: "SmartFace AI Attendance System",
  productName: "SmartFace",
  version: "2.0.0",
  developer: "Sachin K",
  developerRole: "Creator & Lead Maintainer",
  location: "Gadag, Karnataka, India - 582103",
  address: "Gadag, Karnataka",
  cityStateZip: "India - 582103",
  phone: "+919880762623",
  phoneFormatted: "+91 98807 62623",
  email: "kalinganavarsachin@gmail.com",
  salesEmail: "kalinganavarsachin@gmail.com",
  supportEmail: "kalinganavarsachin@gmail.com",
  privacyEmail: "kalinganavarsachin@gmail.com",
  securityEmail: "kalinganavarsachin@gmail.com",
  legalEmail: "kalinganavarsachin@gmail.com",
  github: "https://github.com/Sachinxcode-01/AI-Face-Attendance-System",
  githubReleases: "https://github.com/Sachinxcode-01/AI-Face-Attendance-System/commits/main",
  githubSecurity: "https://github.com/Sachinxcode-01/AI-Face-Attendance-System/blob/main/landing/SECURITY_DESIGN.md",
  githubRepo: "Sachinxcode-01/AI-Face-Attendance-System",
  hours: "Gadag, Karnataka, India · IST (UTC+5:30)",
} as const;

export const DEMO_MAILTO = `mailto:${COMPANY_CONTACT.salesEmail}?subject=${encodeURIComponent(
  "SmartFace Attendance inquiry / demo request",
)}`;
