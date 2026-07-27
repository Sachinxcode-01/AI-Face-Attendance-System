export interface AppReleaseConfig {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  apkFileName: string;
  apkDownloadUrl: string;
  apiDownloadUrl: string;
  fileSize: string;
  fileSizeBytes: number;
  sha256: string;
  minimumAndroidVersion: string;
  recommendedAndroidVersion: string;
  targetArchitecture: string;
  releaseNotes: string[];
  isAvailable: boolean;
  officialPageUrl: string;
  permissionsRequired: string[];
}

export const APP_RELEASE: AppReleaseConfig = {
  appName: 'Smart Attendance AI',
  packageName: 'pro.smartface.attendance',
  versionName: '1.1.0',
  versionCode: 2,
  releaseDate: 'July 27, 2026',
  apkFileName: 'Smart-Attendance-AI-v1.1.0.apk',
  apkDownloadUrl: '/downloads/Smart-Attendance-AI-v1.1.0.apk',
  apiDownloadUrl: '/api/download/android',
  fileSize: '113.68 MB',
  fileSizeBytes: 119198462,
  sha256: '8E0899DCBAFA6BB8BEA842E441EB0B63E180CFFD181E17AC7AF433E4816E654E',
  minimumAndroidVersion: 'Android 7.0 (API Level 24)',
  recommendedAndroidVersion: 'Android 10.0+ (API Level 29+)',
  targetArchitecture: 'arm64-v8a, armeabi-v7a, x86_64',
  releaseNotes: [
    'Enhanced role-based dashboards for Students, Teachers, Parents, and Admins',
    'Interactive Student Timetable and real-time attendance analytics charts',
    'Teacher Attendance Command Center with rolling dynamic 15-second QR codes',
    'High-precision biometrics powered by InsightFace & ArcFace embeddings',
    'Parent Ward Portal with restricted RBAC access for linked child attendance logs',
    'Admin Security Control Panel with live threat telemetry and audit security ledger',
    'Refactored responsive bottom navigation grid layout across mobile screens',
    'Offline sync repository with encrypted local storage queue'
  ],
  isAvailable: true,
  officialPageUrl: 'https://smartface.pro/download',
  permissionsRequired: [
    'Camera (for face biometrics and QR scanning)',
    'Internet (for API telemetry & WebSocket updates)',
    'Notifications (for instant session alerts & reminders)',
    'Vibration & Haptics (for touch & scan feedback)'
  ]
};
