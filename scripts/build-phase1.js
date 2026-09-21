const fs = require('fs');
const path = require('path');
const { canonicalCoverageId, validateDocument } = require(path.resolve('.agents/skills/security-audit/validate-coverage-ledger.cjs'));

const outputDir = 'C:/Users/kalin/security-audit-skill/SmartFace-attendance/run-1';

// 1. Run Metadata
const runMetadata = {
  run_id: "run-1",
  repo: "SmartFace-attendance",
  target: "c:/Users/kalin/OneDrive/Documents/Projects/SmartFace-attendance",
  source_ref: "6eaaa79bc135f8ca8a0fa0a4aa410e16a019b657",
  profile: "standard",
  scope_paths: [],
  budget: null,
  execution_policy: "sandboxed-source-and-local-only",
  selected_companion_files: [
    "WEB-PROTOCOL-AND-AUTH.md",
    "CLIENT-SIDE.md",
    "AI-AND-LLM.md",
    "DESKTOP-MOBILE-AND-LOCAL-IPC.md",
    "RESOURCE-EXHAUSTION-AND-AVAILABILITY.md",
    "DATA-ISOLATION-AND-LIFECYCLE.md",
    "CLOUD-AND-DEPLOYMENT.md"
  ],
  prior_run_paths: [],
  shared_file_owners: {
    "run-metadata.json": "parent",
    "architecture.md": "parent",
    "coverage-ledger.json": "parent",
    "findings.json": "parent",
    "REPORT.md": "parent",
    "FINDINGS-DETAIL.md": "parent",
    "NEEDS-VALIDATION.md": "parent"
  },
  run_status: "in_progress"
};

fs.writeFileSync(path.join(outputDir, 'run-metadata.json'), JSON.stringify(runMetadata, null, 2), 'utf8');

// 2. Coverage Ledger Units
const rawUnits = [
  {
    surface_ref: "backend/api/src/routes/auth.js#POST /auth/login-password",
    boundary_ref: "backend/api/src/services/authService.js#verifyPassword",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Access control",
    surface: "Password authentication endpoint",
    boundary: "Bcrypt credential verification",
    subsystem: "Node API Gateway",
    attack_class: "Access control",
    starting_paths: ["backend/api/src/routes/auth.js", "backend/api/src/services/authService.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Access control",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/auth.js#POST /auth/login-otp/verify",
    boundary_ref: "backend/api/src/routes/auth.js#verifyOTP",
    subsystem_ref: "backend/api",
    attack_class_ref: "WEB-PROTOCOL-AND-AUTH.md#Core discipline",
    surface: "One-time password verification",
    boundary: "OTP state and expiration lifecycle",
    subsystem: "Node API Gateway",
    attack_class: "Web Protocol and Auth",
    starting_paths: ["backend/api/src/routes/auth.js"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/middleware/auth.js#authenticate",
    boundary_ref: "backend/api/src/middleware/auth.js#UserSession.findOne",
    subsystem_ref: "backend/api",
    attack_class_ref: "WEB-PROTOCOL-AND-AUTH.md#Core discipline",
    surface: "JWT Bearer authentication middleware",
    boundary: "Session token revocation and development bypass",
    subsystem: "Node API Gateway",
    attack_class: "Web Protocol and Auth",
    starting_paths: ["backend/api/src/middleware/auth.js", "backend/api/src/models/UserSession.js"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/auth.js#POST /auth/upload-avatar",
    boundary_ref: "backend/api/src/routes/auth.js#avatarUpload",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Resource and file handling",
    surface: "Avatar image upload",
    boundary: "Multer disk storage and MIME validation",
    subsystem: "Node API Gateway",
    attack_class: "Resource and file handling",
    starting_paths: ["backend/api/src/routes/auth.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Resource and file handling",
    selected_companion_blocks: ["RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/auth.js#POST /auth/upload-dataset",
    boundary_ref: "backend/api/src/routes/auth.js#datasetUpload",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Resource and file handling",
    surface: "Face dataset batch upload",
    boundary: "Multer filename path traversal and filesystem confinement",
    subsystem: "Node API Gateway",
    attack_class: "Resource and file handling",
    starting_paths: ["backend/api/src/routes/auth.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Resource and file handling",
    selected_companion_blocks: ["RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/security.js#POST /security/intruder-alert",
    boundary_ref: "backend/api/src/routes/security.js#FACE_SCANNER_TOKEN",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Cryptography and secrets",
    surface: "Hardware camera intruder alert notification",
    boundary: "Shared scanner secret comparison and timing side-channels",
    subsystem: "Node API Gateway",
    attack_class: "Cryptography and secrets",
    starting_paths: ["backend/api/src/routes/security.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Cryptography and secrets",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/attendance.js#POST /attendance/mark",
    boundary_ref: "backend/api/src/routes/attendance.js#sessionValidation",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Business logic",
    surface: "Dynamic QR attendance marker",
    boundary: "Anti-proxy rotating session token validation",
    subsystem: "Node API Gateway",
    attack_class: "Business logic",
    starting_paths: ["backend/api/src/routes/attendance.js", "backend/api/src/routes/sessions.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Business logic",
    selected_companion_blocks: [],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/attendance.js#POST /attendance/mark/face",
    boundary_ref: "backend/api/src/services/faceAiService.js#verifyFace",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Access control",
    surface: "Biometric face scan check-in",
    boundary: "Student identity matching and threshold confidence gating",
    subsystem: "Node API Gateway",
    attack_class: "Access control",
    starting_paths: ["backend/api/src/routes/attendance.js", "backend/api/src/services/faceAiService.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Access control",
    selected_companion_blocks: ["DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/ai/app/routes/face.py#POST /v1/face/verify",
    boundary_ref: "backend/ai/app/security/internal_auth.py#verify_internal_token",
    subsystem_ref: "backend/ai",
    attack_class_ref: "ATTACK-CLASSES.md#Access control",
    surface: "FastAPI ArcFace inference route",
    boundary: "Internal microservice header token verification",
    subsystem: "Python AI Service",
    attack_class: "Access control",
    starting_paths: ["backend/ai/app/routes/face.py", "backend/ai/app/security/internal_auth.py"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Access control",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/ai/app/adapters/legacy_attendance_adapter.py#verify_face",
    boundary_ref: "backend/ai/app/adapters/legacy_attendance_adapter.py#concurrency_and_timeout",
    subsystem_ref: "backend/ai",
    attack_class_ref: "RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline",
    surface: "Neural model inference execution",
    boundary: "Semaphore concurrency gating and timeout resource protection",
    subsystem: "Python AI Service",
    attack_class: "Resource Exhaustion and Availability",
    starting_paths: ["backend/ai/app/adapters/legacy_attendance_adapter.py", "core/attendance_system.py"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/ai.js#GET /student/stats/:email",
    boundary_ref: "backend/api/src/routes/ai.js#promptAssembly",
    subsystem_ref: "backend/api",
    attack_class_ref: "AI-AND-LLM.md#Core discipline",
    surface: "Groq LLM academic insights generator",
    boundary: "Prompt string construction and model context isolation",
    subsystem: "Node API Gateway",
    attack_class: "AI and LLM",
    starting_paths: ["backend/api/src/routes/ai.js"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["AI-AND-LLM.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/app.js#WebSocket /ws/live-logs",
    boundary_ref: "backend/api/src/app.js#server.on(upgrade)",
    subsystem_ref: "backend/api",
    attack_class_ref: "CLIENT-SIDE.md#Core discipline",
    surface: "Real-time administrative log WebSocket",
    boundary: "Connection upgrade handshake and role authorization check",
    subsystem: "Node API Gateway",
    attack_class: "Client Side",
    starting_paths: ["backend/api/src/app.js", "backend/api/src/services/notificationService.js"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["CLIENT-SIDE.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/leave.js#PATCH /leave/action",
    boundary_ref: "backend/api/src/routes/leave.js#requireRole",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Access control",
    surface: "Leave request status mutation",
    boundary: "Teacher/Admin role verification and status transition enforcement",
    subsystem: "Node API Gateway",
    attack_class: "Access control",
    starting_paths: ["backend/api/src/routes/leave.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Access control",
    selected_companion_blocks: [],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/routes/reports.js#GET /reports/export",
    boundary_ref: "backend/api/src/routes/reports.js#exportFormatValidation",
    subsystem_ref: "backend/api",
    attack_class_ref: "ATTACK-CLASSES.md#Injection",
    surface: "Attendance data export endpoint",
    boundary: "CSV/Excel cell sanitization and formula injection defense",
    subsystem: "Node API Gateway",
    attack_class: "Injection",
    starting_paths: ["backend/api/src/routes/reports.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Injection",
    selected_companion_blocks: [],
    excluded_blocks: []
  },
  {
    surface_ref: "mobile/lib/main.dart#AppInitialization",
    boundary_ref: "mobile/lib/core/services/storage_service.dart#SecureStorage",
    subsystem_ref: "mobile",
    attack_class_ref: "DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline",
    surface: "Flutter mobile application client",
    boundary: "Encrypted device keystore and session persistence",
    subsystem: "Mobile Client",
    attack_class: "Desktop Mobile and Local IPC",
    starting_paths: ["mobile/lib/main.dart"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "frontend/admin/web_dashboard.py#StreamlitApp",
    boundary_ref: "frontend/admin/web_dashboard.py#credentialAuthentication",
    subsystem_ref: "frontend/admin",
    attack_class_ref: "DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline",
    surface: "Streamlit administrative dashboard",
    boundary: "Session state and direct database access boundaries",
    subsystem: "Admin Dashboard",
    attack_class: "Data Isolation and Lifecycle",
    starting_paths: ["frontend/admin/web_dashboard.py"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "backend/api/src/config/database.js#connectDB",
    boundary_ref: "backend/api/src/models/BiometricProfile.js#BiometricEmbedding",
    subsystem_ref: "backend/api",
    attack_class_ref: "DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline",
    surface: "MongoDB persistent data store",
    boundary: "Raw facial embeddings and biometric template isolation",
    subsystem: "Node API Gateway",
    attack_class: "Data Isolation and Lifecycle",
    starting_paths: ["backend/api/src/config/database.js", "backend/api/src/models/BiometricProfile.js"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline"],
    excluded_blocks: []
  },
  {
    surface_ref: "railway.json#MultiServiceDeployment",
    boundary_ref: "backend/api/.env.example#EnvironmentSecrets",
    subsystem_ref: "deployment",
    attack_class_ref: "CLOUD-AND-DEPLOYMENT.md#Core discipline",
    surface: "Railway multi-service deployment descriptors",
    boundary: "Service-to-service network perimeter and secret propagation",
    subsystem: "Cloud Deployment",
    attack_class: "Cloud and Deployment",
    starting_paths: ["railway.json", "backend/api/railway.json", "backend/ai/railway.json"],
    ordinary_attack_class_block: null,
    selected_companion_blocks: ["CLOUD-AND-DEPLOYMENT.md#Core discipline"],
    excluded_blocks: []
  }
];

const ledger = rawUnits.map(u => {
  const canonical_refs = {
    surface: u.surface_ref,
    boundary: u.boundary_ref,
    subsystem: u.subsystem_ref,
    attack_class: u.attack_class_ref
  };
  return {
    coverage_id: canonicalCoverageId(canonical_refs),
    canonical_refs,
    surface: u.surface,
    boundary: u.boundary,
    subsystem: u.subsystem,
    attack_class: u.attack_class,
    starting_paths: u.starting_paths,
    ordinary_attack_class_block: u.ordinary_attack_class_block,
    selected_companion_blocks: u.selected_companion_blocks,
    excluded_blocks: u.excluded_blocks,
    prior_status: "new",
    attempts: [],
    wave: 1,
    status: "planned",
    agent_id: null,
    reviewed_paths: [],
    local_checks: [],
    result_fingerprints: [],
    unresolved: []
  };
});

// Sort lexicographically by code-point order matching JavaScript > operator
ledger.sort((a, b) => (a.coverage_id < b.coverage_id ? -1 : a.coverage_id > b.coverage_id ? 1 : 0));

const ledgerPath = path.join(outputDir, 'coverage-ledger.json');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
console.log(`Generated ${ledger.length} units in ${ledgerPath}`);

// Self-validate
const errors = validateDocument(ledger);
if (errors.length > 0) {
  console.error("Validation Errors:", errors);
  process.exit(1);
} else {
  console.log("SUCCESS: coverage-ledger.json passes all validations!");
}
