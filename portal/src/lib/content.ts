import { Crown, GraduationCap, Presentation, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { PORTAL_LINKS } from "./constants";

export type Role = {
  key: "student" | "teacher" | "admin" | "parent" | "super_admin";
  label: string;
  title: string;
  path: string;
  href: string;
  description: string;
  capabilities: string[];
  icon: LucideIcon;
  accent: "indigo" | "emerald" | "amber" | "sky" | "violet";
};

export const ROLES: Role[] = [
  {
    key: "student",
    label: "Student",
    title: "Student Portal",
    path: "/student",
    href: PORTAL_LINKS.student,
    description:
      "Check in with a face or a rotating QR, watch your streak climb, and ask Nexa where your attendance actually stands.",
    capabilities: ["Live attendance & history", "Gamified streaks & badges", "Nexa AI study assistant"],
    icon: GraduationCap,
    accent: "indigo",
  },
  {
    key: "teacher",
    label: "Teacher",
    title: "Teacher Portal",
    path: "/teacher",
    href: PORTAL_LINKS.teacher,
    description:
      "Open a session, project the rotating code, and let the kiosk handle the room. Manual override stays one tap away.",
    capabilities: ["Rotating QR sessions", "Biometric kiosk & roster", "Leave approvals & analytics"],
    icon: Presentation,
    accent: "emerald",
  },
  {
    key: "admin",
    label: "Admin",
    title: "Admin Sentinel",
    path: "/admin",
    href: PORTAL_LINKS.admin,
    description:
      "One command center for campus telemetry, intruder alerts, ArcFace calibration and the complete audit trail.",
    capabilities: ["Campus telemetry & directory", "Intruder sentinel alerts", "Calibration & audit trail"],
    icon: ShieldCheck,
    accent: "amber",
  },
  {
    key: "parent",
    label: "Parent",
    title: "Parent Portal",
    path: "/parent",
    href: PORTAL_LINKS.parent,
    description:
      "See the moment your child arrives, with timestamp and gate, instead of waiting for end-of-term surprises.",
    capabilities: ["Real-time check-ins", "Instant arrival alerts", "Leave requests in one place"],
    icon: Users,
    accent: "sky",
  },
  {
    key: "super_admin",
    label: "Super Admin",
    title: "Super Admin Governance",
    path: "/admin/super-admin",
    href: PORTAL_LINKS.superAdmin,
    description:
      "Manage multi-campus institutions, threshold and security policies, RBAC permissions, and compliance exports.",
    capabilities: ["Institution & role governance", "Cosine & policy configuration", "Global audit & export tools"],
    icon: Crown,
    accent: "violet",
  },
];

export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Product Tour", href: "#product-tour" },
  { label: "ROI Calculator", href: "#roi-calculator" },
  { label: "Portals", href: "#portals" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;
