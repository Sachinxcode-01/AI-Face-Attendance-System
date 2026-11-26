import { Crown, GraduationCap, Presentation, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { COMPANY_CONTACT, PORTAL_LINKS } from "./constants";

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
    "Check in via face verification or rotating session QR, track attendance percentages and streaks, submit correction disputes, and consult Nexa AI.",
    capabilities: [
      "Face & 20s rotating QR check-in",
      "Attendance heatmap & leave requests",
      "Nexa AI attendance insights",
    ],
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
    "Start lecture sessions, project HMAC-SHA256 rotating QR codes with optional geofencing, review live rosters, and resolve leave or correction requests.",
    capabilities: [
      "Rotating QR & kiosk sessions",
      "Manual override & dispute resolution",
      "Leave approvals & CSV/Excel exports",
    ],
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
    "Manage institutional users, face enrollment pipelines, security and audit logs, department analytics, and accuracy monitoring.",
    capabilities: [
      "Directory & face dataset management",
      "Security alerts & audit logs",
      "Department analytics & reports",
    ],
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
    "Monitor linked student attendance percentages, review recent check-in logs, submit absence notices, and track leave approvals.",
    capabilities: [
      "Linked ward attendance summary",
      "Absence notice & leave tracking",
      "Verified student-parent linking",
    ],
    icon: Users,
    accent: "sky",
  },
  {
    key: "super_admin",
    label: "Super Admin",
    title: "Super Admin",
    path: "/admin/super-admin",
    href: PORTAL_LINKS.superAdmin,
    description:
      "Govern multi-college tenants, provision institutional admins, monitor cross-campus telemetry, and review platform-wide biometric accuracy metrics.",
    capabilities: [
      "Multi-college tenant management",
      "Admin provisioning & global analytics",
      "Platform health & accuracy overview",
    ],
    icon: Crown,
    accent: "violet",
  },
];

export const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Product Tour", href: "/#product-tour" },
  { label: "ROI Calculator", href: "/#roi-calculator" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "FAQ", href: "/#faq" },
] as const;

/**
 * Single Source of Truth for verified SmartFace technical specifications.
 * All values are derived directly from the repository implementation.
 */
export const PRODUCT_SPECS = {
  productName: COMPANY_CONTACT.productName,
  suiteName: COMPANY_CONTACT.name,
  version: "v2.0.0",
  mobileVersion: "1.1.0",
  aiEngine: "InsightFace ArcFace (buffalo_l)",
  modelBackbone: "ResNet-50 (w600k_r50 ONNX) + RetinaFace detection",
  embeddingDimensions: 512,
  embeddingFormat: "512-dimensional L2-normalized float vector",
  defaultCosineThreshold: "0.60",
  configurableThresholdRange: "0.60–0.85 (policy-configurable)",
  verificationLatency: "Hardware-dependent (GPU CUDA accelerated or CPU fallback; 15s AI / 18s gateway timeout)",
  qrRotationWindowSeconds: 20,
  qrClockSkewSeconds: 5,
  qrSigningAlgorithm: "HMAC-SHA256 (timing-safe verification)",
  geofenceDefaultMeters: "100–150m (configurable per session)",
  primaryDatabase: "MongoDB (Mongoose ODM)",
  optionalVectorSync: "Supabase PostgreSQL + pgvector HNSW (optional sync)",
  mobileOfflineStorage: "AES-256 encrypted Hive queue + HMAC-SHA256 integrity (up to 500 records)",
  rateLimits: {
    authAndOtp: "5 requests / 15 min per IP",
    generalApi: "60 requests / min per IP",
    aiVerify: "15 requests / min per IP (plus 3-failure 2-min face cooldown)",
  },
  authControls: "JWT access tokens (15m default) + httpOnly refresh cookies (7d/30d), bcrypt (cost 12)",
  aiAssistant: "Nexa AI (Groq LLM with deterministic MongoDB attendance stats; PII-minimized prompts)",
  license: "MIT (open-source codebase)",
} as const;

export type FeatureAvailabilityStatus = "Operational" | "Pilot-Configured" | "Beta" | "Planned";

export interface FeatureAvailabilityItem {
  module: string;
  capability: string;
  status: FeatureAvailabilityStatus;
  notes: string;
}

export const FEATURE_AVAILABILITY_MATRIX: FeatureAvailabilityItem[] = [
  {
    module: "Biometric Recognition",
    capability: "InsightFace ArcFace (buffalo_l, ResNet-50) 512-D enrollment & verification",
    status: "Operational",
    notes: "Runs via FastAPI ONNX Runtime (/v1/face/enroll & /v1/face/verify) and local OpenCV core.",
  },
  {
    module: "Anti-Proxy QR",
    capability: "20s rotating HMAC-SHA256 tokens, duplicate check-in lock & optional geofencing",
    status: "Operational",
    notes: "100–150m configurable Haversine perimeter when session coordinates are set.",
  },
  {
    module: "Role Portals & Mobile",
    capability: "Web (Student, Teacher, Admin, Parent, Super Admin) & Flutter Android/iOS app",
    status: "Operational",
    notes: "Shared Express API & WebSocket bus; AES-256 Hive offline queue on Flutter mobile.",
  },
  {
    module: "Governance & Disputes",
    capability: "Consent tracking, template deletion, data export, disputes & audit logs",
    status: "Operational",
    notes: "Self-service /auth/biometric DELETE, /auth/privacy/export, and /attendance/disputes.",
  },
  {
    module: "Nexa AI Assistant",
    capability: "Conversational attendance summaries backed by deterministic calculations",
    status: "Operational",
    notes: "Uses Groq API key when configured; falls back to built-in deterministic responses.",
  },
  {
    module: "Alerts & Cloud Sync",
    capability: "Transactional Email/OTP, SMS alerts, Google Sheets sync & Supabase pgvector",
    status: "Pilot-Configured",
    notes: "Requires institutional Resend/Brevo, Twilio/MSG91, Google, or Supabase credentials.",
  },
  {
    module: "Camera & GPU Nodes",
    capability: "CUDA GPU acceleration, RTSP CCTV streams & local kiosk edge execution",
    status: "Pilot-Configured",
    notes: "Requires campus GPU/workstation setup and verified RTSP camera streams.",
  },
  {
    module: "ERP / LMS Connectors",
    capability: "OneRoster 1.2 CSV validation & Canvas/Moodle/Blackboard connectors",
    status: "Beta",
    notes: "OneRoster CSV parser is live; external LMS REST sync currently runs in connector simulation mode.",
  },
  {
    module: "Hardware PAD & WhatsApp",
    capability: "Dedicated IR/3D depth liveness & native WhatsApp Business API alerts",
    status: "Planned",
    notes: "Current release uses passive lighting/single-face checks and Email/SMS/Push channels.",
  },
];

export const ONBOARDING_WORKFLOW = [
  { step: "01", title: "Institutional Consultation", detail: "Review attendance policies, minimum thresholds, and privacy requirements." },
  { step: "02", title: "Campus Infrastructure Assessment", detail: "Audit existing webcams, RTSP cameras, Wi-Fi/LAN coverage, and compute hardware." },
  { step: "03", title: "Deployment Mode Selection", detail: "Choose self-hosted open-source, managed cloud, or hybrid campus LAN deployment." },
  { step: "04", title: "Institutional Configuration", detail: "Set up college tenant, departments, courses, RBAC roles, and email/SMS providers." },
  { step: "05", title: "User & Roster Import", detail: "Import student, faculty, and parent accounts via CSV, OneRoster 1.2 CSV, or API." },
  { step: "06", title: "Consent & Biometric Enrolment", detail: "Collect explicit opt-in consent (and guardian alignment for minors) and extract 512-D vectors." },
  { step: "07", title: "Faculty & Admin Training", detail: "Walk faculty through QR session projection, manual overrides, and dispute resolution." },
  { step: "08", title: "Controlled Pilot", detail: "Run SmartFace in one department or lecture hall alongside existing workflows." },
  { step: "09", title: "Performance Validation", detail: "Review cosine thresholds, lighting failure logs, and QR/geofence accuracy with admins." },
  { step: "10", title: "Production Rollout", detail: "Expand across additional departments, gates, and parent notification channels." },
  { step: "11", title: "Ongoing Monitoring & Support", detail: "Monitor health probes, backup metadata, accuracy telemetry, and audit trails." },
] as const;
