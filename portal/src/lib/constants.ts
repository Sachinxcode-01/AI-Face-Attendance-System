const DEFAULT_PORTAL_URL = "";

/**
 * Portal & API Configuration
 */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || DEFAULT_PORTAL_URL).replace(/\/+$/, "");
export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "https://ai-face-attendance-beta.vercel.app";
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

/**
 * Internal portal routes for seamless single-app portal navigation
 */
export const PORTAL_LINKS = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  superAdmin: "/admin/super-admin",
  parent: "/parent",
  login: "/auth/login",
  register: "/auth/register",
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
