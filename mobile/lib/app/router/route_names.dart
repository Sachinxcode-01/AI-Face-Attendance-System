/*
|--------------------------------------------------------------------------
| File: route_names.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Declares Route paths and Route name constants for GoRouter.
|--------------------------------------------------------------------------
*/

class AppRoutes {
  // Guest / Unauthenticated routes
  static const String splashName = 'splash';
  static const String splashPath = '/auth/splash';

  static const String onboardingName = 'onboarding';
  static const String onboardingPath = '/auth/onboarding';

  static const String introImagesName = 'introImages';
  static const String introImagesPath = '/intro-images';

  static const String loginName = 'login';
  static const String loginPath = '/auth/login';

  static const String registerName = 'register';
  static const String registerPath = '/auth/register';

  static const String forgotPasswordName = 'forgotPassword';
  static const String forgotPasswordPath = '/auth/forgot-password';

  static const String otpName = 'otp';
  static const String otpPath = '/auth/otp';

  static const String introName = 'intro';
  static const String introPath = '/auth/intro';

  static const String setupWizardName = 'setupWizard';
  static const String setupWizardPath = '/auth/setup';

  static const String unauthorizedName = 'unauthorized';
  static const String unauthorizedPath = '/unauthorized';

  // Student Shell Tab routes
  static const String studentHomeName = 'studentHome';
  static const String studentHomePath = '/student/dashboard';

  static const String studentScanName = 'studentScan';
  static const String studentScanPath = '/student/scan';

  static const String studentLeaveName = 'studentLeave';
  static const String studentLeavePath = '/student/leave';

  static const String studentLeaveHistoryName = 'studentLeaveHistory';
  static const String studentLeaveHistoryPath = '/student/leave/history';

  static const String studentLeaveApplyName = 'studentLeaveApply';
  static const String studentLeaveApplyPath = '/student/leave/apply';

  static const String studentLeaveDetailsName = 'studentLeaveDetails';
  static const String studentLeaveDetailsPath = '/student/leave/details/:id';

  static const String teacherLeaveDashboardName = 'teacherLeaveDashboard';
  static const String teacherLeaveDashboardPath = '/teacher/leave/dashboard';

  static const String studentAlertsName = 'studentAlerts';
  static const String studentAlertsPath = '/student/alerts';

  static const String studentProfileName = 'studentProfile';
  static const String studentProfilePath = '/student/profile';

  // Student Attendance Hub & Command Center routes
  static const String studentAttendanceHubName = 'studentAttendanceHub';
  static const String studentAttendanceHubPath = '/student/attendance/hub';

  static const String studentTimetableName = 'studentTimetable';
  static const String studentTimetablePath = '/student/timetable';

  static const String studentBunkCalculatorName = 'studentBunkCalculator';
  static const String studentBunkCalculatorPath = '/student/bunk-calculator';

  static const String studentIdCardName = 'studentIdCard';
  static const String studentIdCardPath = '/student/id-card';

  static const String studentFaceCheckinName = 'studentFaceCheckin';
  static const String studentFaceCheckinPath = '/student/face-checkin';

  static const String teacherAttendanceCommandName = 'teacherAttendanceCommand';
  static const String teacherAttendanceCommandPath =
      '/teacher/attendance/command';

  // Teacher Shell Tab routes
  static const String teacherHomeName = 'teacherHome';
  static const String teacherHomePath = '/teacher/dashboard';

  static const String teacherFeedName = 'teacherFeed';
  static const String teacherFeedPath = '/teacher/feed';

  static const String teacherQrName = 'teacherQr';
  static const String teacherQrPath = '/teacher/qr';

  static const String teacherStatsName = 'teacherStats';
  static const String teacherStatsPath = '/teacher/stats';

  static const String teacherProfileName = 'teacherProfile';
  static const String teacherProfilePath = '/teacher/profile';

  static const String teacherTrainFacesName = 'teacherTrainFaces';
  static const String teacherTrainFacesPath = '/teacher/train-faces';

  static const String teacherSystemHealthName = 'teacherSystemHealth';
  static const String teacherSystemHealthPath = '/teacher/system-health';

  static const String teacherAtRiskRadarName = 'teacherAtRiskRadar';
  static const String teacherAtRiskRadarPath = '/teacher/at-risk';

  static const String teacherRosterOverrideName = 'teacherRosterOverride';
  static const String teacherRosterOverridePath = '/teacher/roster-override';

  // Parent Section routes
  static const String parentHomeName = 'parentHome';
  static const String parentHomePath = '/parent/dashboard';

  static const String parentAttendanceLogsName = 'parentAttendanceLogs';
  static const String parentAttendanceLogsPath = '/parent/attendance-logs';

  static const String parentLeaveStatusName = 'parentLeaveStatus';
  static const String parentLeaveStatusPath = '/parent/leave-status';

  static const String parentAlertsName = 'parentAlerts';
  static const String parentAlertsPath = '/parent/alerts';

  static const String parentLinkWardName = 'parentLinkWard';
  static const String parentLinkWardPath = '/parent/link-ward';

  // Admin Shell Tab routes
  static const String adminHomeName = 'adminHome';
  static const String adminHomePath = '/admin/dashboard';

  static const String adminApprovalsName = 'adminApprovals';
  static const String adminApprovalsPath = '/admin/approvals';

  static const String adminSecurityName = 'adminSecurity';
  static const String adminSecurityPath = '/admin/security';

  static const String adminIntruderSentinelName = 'adminIntruderSentinel';
  static const String adminIntruderSentinelPath = '/admin/intruder-sentinel';

  static const String adminAnalyticsName = 'adminAnalytics';
  static const String adminAnalyticsPath = '/admin/analytics';

  static const String adminLeaveAnalyticsName = 'adminLeaveAnalytics';
  static const String adminLeaveAnalyticsPath = '/admin/leave/analytics';

  static const String adminProfileName = 'adminProfile';
  static const String adminProfilePath = '/admin/profile';

  static const String aiAnalystName = 'aiAnalyst';
  static const String aiAnalystPath = '/analytics/analyst';

  static const String settingsName = 'settings';
  static const String settingsPath = '/settings';

  static const String alertsNexusName = 'alertsNexus';
  static const String alertsNexusPath = '/notifications/nexus';

  static const String syncDashboardName = 'syncDashboard';
  static const String syncDashboardPath = '/settings/sync';

  // Management Command Center
  static const String managementDashboardName = 'managementDashboard';
  static const String managementDashboardPath = '/management/dashboard';

  // Advanced Analytics Dashboard (v1.1)
  static const String analyticsDashboardName = 'analyticsDashboard';
  static const String analyticsDashboardPath = '/analytics/dashboard';
}
