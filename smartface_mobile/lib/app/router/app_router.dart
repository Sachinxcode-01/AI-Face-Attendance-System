/*
|--------------------------------------------------------------------------
| File: app_router.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Declares the root GoRouter setup with role-based StatefulShellRoute
| configurations and unauthenticated/authorized route guards.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/ui/ui.dart'
    show SmartBottomNav, BottomNavItemData, TabTransitionWrapper;
import 'package:smartface_attendance/app/router/route_guards.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/student/screens/student_timetable_screen.dart';
import 'package:smartface_attendance/features/admin/screens/admin_users_screen.dart';

// Guest / Unauthenticated Screens
import 'package:smartface_attendance/features/auth/screens/splash_screen.dart';
import 'package:smartface_attendance/features/auth/screens/onboarding_screen.dart';
import 'package:smartface_attendance/features/auth/screens/intro_image_screen.dart';
import 'package:smartface_attendance/features/auth/screens/intro_screen.dart';
import 'package:smartface_attendance/features/auth/screens/login_screen.dart';
import 'package:smartface_attendance/features/auth/screens/register_screen.dart';
import 'package:smartface_attendance/features/auth/screens/forgot_password_screen.dart';
import 'package:smartface_attendance/features/auth/screens/otp_screen.dart';
import 'package:smartface_attendance/features/auth/screens/setup_wizard_screen.dart';

// Student Screens
import 'package:smartface_attendance/features/student/screens/student_home_screen.dart';
import 'package:smartface_attendance/features/student/screens/attendance_hub_screen.dart';
import 'package:smartface_attendance/features/teacher/screens/attendance_command_center.dart';
import 'package:smartface_attendance/features/attendance/screens/qr_scanner_screen.dart';
import 'package:smartface_attendance/features/leave/screens/leave_history_screen.dart';
import 'package:smartface_attendance/features/leave/screens/leave_apply_screen.dart';
import 'package:smartface_attendance/features/leave/screens/student_leave_dashboard_screen.dart';
import 'package:smartface_attendance/features/leave/screens/leave_details_screen.dart';
import 'package:smartface_attendance/features/leave/screens/teacher_leave_dashboard_screen.dart';
import 'package:smartface_attendance/features/leave/screens/admin_leave_analytics_screen.dart';
import 'package:smartface_attendance/features/notifications/screens/notification_nexus_screen.dart';
import 'package:smartface_attendance/features/profile/screens/student_profile_screen.dart';
import 'package:smartface_attendance/features/sync/screens/sync_dashboard_screen.dart';

// Teacher Screens
import 'package:smartface_attendance/features/teacher/screens/teacher_dashboard_screen.dart';
import 'package:smartface_attendance/features/attendance/screens/live_monitor_screen.dart';
import 'package:smartface_attendance/features/attendance/screens/qr_generator_screen.dart';
import 'package:smartface_attendance/features/analytics/screens/teacher_stats_screen.dart';
import 'package:smartface_attendance/features/profile/screens/profile_screen.dart';
import 'package:smartface_attendance/features/teacher/screens/train_faces_screen.dart';
import 'package:smartface_attendance/features/teacher/screens/system_health_screen.dart';

// Parent Screens
import 'package:smartface_attendance/features/parent/screens/parent_dashboard_screen.dart';
// ignore: duplicate_import
import 'package:smartface_attendance/features/parent/screens/parent_attendance_logs_screen.dart';
// ignore: duplicate_import
import 'package:smartface_attendance/features/parent/screens/parent_leave_status_screen.dart';

// Admin Screens
import 'package:smartface_attendance/features/admin/screens/admin_home_screen.dart';
import 'package:smartface_attendance/features/admin/screens/security_logs_screen.dart';
import 'package:smartface_attendance/features/analytics/screens/ai_analytics_screen.dart';
import 'package:smartface_attendance/features/analytics/screens/ai_analyst_screen.dart';
import 'package:smartface_attendance/features/analytics/screens/analytics_dashboard_screen.dart';
import 'package:smartface_attendance/features/settings/screens/server_settings_screen.dart';
import 'package:smartface_attendance/features/settings/screens/component_showcase_screen.dart';

// Session Manager for listening to login state changes
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// Global Key for root navigator
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);

// Shell Navigators
final GlobalKey<NavigatorState> studentShellKey = GlobalKey<NavigatorState>(
  debugLabel: 'studentShell',
);
final GlobalKey<NavigatorState> teacherShellKey = GlobalKey<NavigatorState>(
  debugLabel: 'teacherShell',
);
final GlobalKey<NavigatorState> parentShellKey = GlobalKey<NavigatorState>(
  debugLabel: 'parentShell',
);
final GlobalKey<NavigatorState> adminShellKey = GlobalKey<NavigatorState>(
  debugLabel: 'adminShell',
);

/// Custom horizontal slide + fade transition matching our premium motion specifications (300-350ms, easeOutCubic)
Page<dynamic> buildPageWithTransition<T>({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position:
              Tween<Offset>(
                begin: const Offset(0.04, 0.0),
                end: Offset.zero,
              ).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
              ),
          child: child,
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 320),
  );
}

/// Configures root declarative GoRouter structure
final GoRouter appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: AppRoutes.splashPath,
  refreshListenable: sl<SessionManager>(),
  redirect: RouteGuards.handleRedirect,
  errorBuilder: (context, state) => Scaffold(
    backgroundColor: AppColors.bgDeep,
    body: Center(
      child: Text(
        'Page Not Found: ${state.uri.path}',
        style: AppText.heading(color: AppColors.errorLight),
      ),
    ),
  ),
  routes: [
    // ── ROUTE ALIAS REDIRECTS ──────────────────────────────────────────────
    GoRoute(
      path: '/splash',
      redirect: (context, state) => AppRoutes.splashPath,
    ),
    GoRoute(
      path: '/welcome',
      redirect: (context, state) => AppRoutes.onboardingPath,
    ),
    GoRoute(
      path: '/login',
      redirect: (context, state) => AppRoutes.loginPath,
    ),
    GoRoute(
      path: '/register',
      redirect: (context, state) => AppRoutes.registerPath,
    ),
    GoRoute(
      path: '/otp',
      redirect: (context, state) => AppRoutes.otpPath,
    ),
    GoRoute(
      path: '/forgot-password',
      redirect: (context, state) => AppRoutes.forgotPasswordPath,
    ),
    GoRoute(
      path: '/reset-password',
      redirect: (context, state) => AppRoutes.forgotPasswordPath,
    ),
    GoRoute(
      path: '/setup/student',
      redirect: (context, state) => AppRoutes.setupWizardPath,
    ),
    GoRoute(
      path: '/setup/parent',
      redirect: (context, state) => AppRoutes.setupWizardPath,
    ),
    GoRoute(
      path: '/setup/teacher',
      redirect: (context, state) => AppRoutes.setupWizardPath,
    ),
    GoRoute(
      path: '/setup/admin',
      redirect: (context, state) => AppRoutes.setupWizardPath,
    ),
    GoRoute(
      path: '/student/home',
      redirect: (context, state) => AppRoutes.studentHomePath,
    ),
    GoRoute(
      path: '/teacher/home',
      redirect: (context, state) => AppRoutes.teacherHomePath,
    ),
    GoRoute(
      path: '/admin/home',
      redirect: (context, state) => AppRoutes.adminHomePath,
    ),
    GoRoute(
      path: '/parent/home',
      redirect: (context, state) => AppRoutes.parentHomePath,
    ),
    GoRoute(
      path: '/profile',
      redirect: (context, state) {
        final role = Provider.of<SessionManager>(context, listen: false).userRole;
        if (role == UserRole.student) return AppRoutes.studentProfilePath;
        if (role == UserRole.teacher || role == UserRole.parent) return AppRoutes.teacherProfilePath;
        return AppRoutes.adminProfilePath;
      },
    ),

    // ── GUEST / UNAUTHENTICATED ROUTES ──────────────────────────────────────
    GoRoute(
      path: AppRoutes.splashPath,
      name: AppRoutes.splashName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const SplashScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.onboardingPath,
      name: AppRoutes.onboardingName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const OnboardingScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.introImagesPath,
      name: AppRoutes.introImagesName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const IntroImageScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.introPath,
      name: AppRoutes.introName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const IntroScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.loginPath,
      name: AppRoutes.loginName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const LoginScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.registerPath,
      name: AppRoutes.registerName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const RegisterScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.forgotPasswordPath,
      name: AppRoutes.forgotPasswordName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const ForgotPasswordScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.otpPath,
      name: AppRoutes.otpName,
      pageBuilder: (context, state) {
        final email = state.extra as String?;
        return buildPageWithTransition(
          context: context,
          state: state,
          child: OTPScreen(email: email),
        );
      },
    ),
    GoRoute(
      path: AppRoutes.setupWizardPath,
      name: AppRoutes.setupWizardName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const SetupWizardScreen(),
      ),
    ),

    // â”€â”€ UNAUTHORIZED ROLE RESOLVER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    GoRoute(
      path: AppRoutes.unauthorizedPath,
      name: AppRoutes.unauthorizedName,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const UnauthorizedScreen(),
      ),
    ),

    // ── TEMPORARY COMPONENT SHOWCASE ROUTE ──────────────────────────────────
    GoRoute(
      path: '/showcase',
      name: 'showcase',
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const ComponentShowcaseScreen(),
      ),
    ),

    // ── STUDENT ROLE ROOT STATEFUL SHELL ──────────────────────────────────────
    StatefulShellRoute.indexedStack(
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state, navigationShell) {
        return StudentShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: studentShellKey,
          routes: [
            GoRoute(
              path: AppRoutes.studentHomePath,
              name: AppRoutes.studentHomeName,
              builder: (context, state) => const StudentDashboard(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentTimetablePath,
              name: AppRoutes.studentTimetableName,
              builder: (context, state) => const StudentTimetableScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentScanPath,
              name: AppRoutes.studentScanName,
              builder: (context, state) => const QRScannerScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentAttendanceHubPath,
              name: AppRoutes.studentAttendanceHubName,
              builder: (context, state) => const AttendanceHubScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentProfilePath,
              name: AppRoutes.studentProfileName,
              builder: (context, state) => const StudentProfileScreen(),
            ),
          ],
        ),
      ],
    ),

    // Sibling fullscreen routes for Student (Leave, Alerts)
    GoRoute(
      path: AppRoutes.studentLeavePath,
      name: AppRoutes.studentLeaveName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const StudentLeaveDashboardScreen(),
      ),
      routes: [
        GoRoute(
          path: 'history',
          name: AppRoutes.studentLeaveHistoryName,
          builder: (context, state) => const LeaveHistoryScreen(),
        ),
      ],
    ),
    GoRoute(
      path: AppRoutes.studentAlertsPath,
      name: AppRoutes.studentAlertsName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const NotificationNexusScreen(),
      ),
    ),

    // Sibling fullscreen route for Student (Leave Application)
    GoRoute(
      path: AppRoutes.studentLeaveApplyPath,
      name: AppRoutes.studentLeaveApplyName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const LeaveApplyScreen(),
      ),
    ),

    // Offline sync dashboard route
    GoRoute(
      path: AppRoutes.syncDashboardPath,
      name: AppRoutes.syncDashboardName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const SyncDashboardScreen(),
      ),
    ),

    // Leave Details route
    GoRoute(
      path: AppRoutes.studentLeaveDetailsPath,
      name: AppRoutes.studentLeaveDetailsName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return buildPageWithTransition(
          context: context,
          state: state,
          child: LeaveDetailsScreen(leaveId: id),
        );
      },
    ),

    // Teacher Leave Dashboard route
    GoRoute(
      path: AppRoutes.teacherLeaveDashboardPath,
      name: AppRoutes.teacherLeaveDashboardName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const TeacherLeaveDashboardScreen(),
      ),
    ),

    // Admin Leave Analytics route
    GoRoute(
      path: AppRoutes.adminLeaveAnalyticsPath,
      name: AppRoutes.adminLeaveAnalyticsName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const AdminLeaveAnalyticsScreen(),
      ),
    ),

    // â”€â”€ TEACHER ROLE ROOT STATEFUL SHELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    StatefulShellRoute.indexedStack(
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state, navigationShell) {
        return TeacherShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: teacherShellKey,
          routes: [
            GoRoute(
              path: AppRoutes.teacherHomePath,
              name: AppRoutes.teacherHomeName,
              builder: (context, state) => const TeacherDashboard(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.teacherFeedPath,
              name: AppRoutes.teacherFeedName,
              builder: (context, state) => const LiveMonitorScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.teacherQrPath,
              name: AppRoutes.teacherQrName,
              builder: (context, state) => const QRGeneratorScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.teacherStatsPath,
              name: AppRoutes.teacherStatsName,
              builder: (context, state) => const TeacherStatsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.teacherProfilePath,
              name: AppRoutes.teacherProfileName,
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),

    // ── PARENT ROLE ROOT STATEFUL SHELL ──────────────────────────────────────
    StatefulShellRoute.indexedStack(
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state, navigationShell) {
        return ParentShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: parentShellKey,
          routes: [
            GoRoute(
              path: AppRoutes.parentHomePath,
              name: AppRoutes.parentHomeName,
              builder: (context, state) => const ParentDashboard(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.parentLeaveStatusPath,
              name: AppRoutes.parentLeaveStatusName,
              builder: (context, state) => const ParentLeaveStatusScreen(wardEmail: null),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.parentAttendanceLogsPath,
              name: AppRoutes.parentAttendanceLogsName,
              builder: (context, state) => const ParentAttendanceLogsScreen(wardEmail: null),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.parentAlertsPath,
              name: AppRoutes.parentAlertsName,
              builder: (context, state) => const NotificationNexusScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/parent/profile',
              name: 'parentProfile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),

    // Sibling fullscreen routes for Teacher (Facial Training, System Health)
    GoRoute(
      path: AppRoutes.teacherTrainFacesPath,
      name: AppRoutes.teacherTrainFacesName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const TrainFacesScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.teacherSystemHealthPath,
      name: AppRoutes.teacherSystemHealthName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const SystemHealthScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.teacherAttendanceCommandPath,
      name: AppRoutes.teacherAttendanceCommandName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const AttendanceCommandCenter(),
      ),
    ),

    // â”€â”€ ADMIN ROLE ROOT STATEFUL SHELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    StatefulShellRoute.indexedStack(
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state, navigationShell) {
        return AdminShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: adminShellKey,
          routes: [
            GoRoute(
              path: AppRoutes.adminHomePath,
              name: AppRoutes.adminHomeName,
              builder: (context, state) => const AdminDashboard(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.adminApprovalsPath,
              name: AppRoutes.adminApprovalsName,
              builder: (context, state) => const AdminUsersScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.adminSecurityPath,
              name: AppRoutes.adminSecurityName,
              builder: (context, state) => const SecurityLogsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.adminAnalyticsPath,
              name: AppRoutes.adminAnalyticsName,
              builder: (context, state) => const AIAnalyticsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.adminProfilePath,
              name: AppRoutes.adminProfileName,
              builder: (context, state) => const ServerSettingsScreen(),
            ),
          ],
        ),
      ],
    ),

    // AI Analyst (shared across roles)
    GoRoute(
      path: AppRoutes.aiAnalystPath,
      name: AppRoutes.aiAnalystName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const AIAnalystScreen(),
      ),
    ),
    // Advanced Analytics Dashboard (v1.1 — admin/teacher)
    GoRoute(
      path: AppRoutes.analyticsDashboardPath,
      name: AppRoutes.analyticsDashboardName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const AnalyticsDashboardScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.settingsPath,
      name: AppRoutes.settingsName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const ServerSettingsScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.alertsNexusPath,
      name: AppRoutes.alertsNexusName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const NotificationNexusScreen(),
      ),
    ),

    // Management Command Center (hod / principal / management roles).
    // Guarded by RouteGuards so only elevated roles + admin can reach it.
    GoRoute(
      path: AppRoutes.managementDashboardPath,
      name: AppRoutes.managementDashboardName,
      parentNavigatorKey: rootNavigatorKey,
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const AdminDashboard(),
      ),
    ),
  ],
);

// ============================================================================
// Shell Scaffolds with bottom navigation bars (Preserves IndexedStack state)
// ============================================================================

/// Student Shell
class StudentShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const StudentShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: TabTransitionWrapper(
        index: navigationShell.currentIndex,
        child: navigationShell,
      ),
      bottomNavigationBar: SmartBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: navigationShell.goBranch,
        role: 'student',
        showLabels: true,
        isGlass: true,
        animationEnabled: true,
        items: const [
          BottomNavItemData(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Home',
            route: AppRoutes.studentHomePath,
          ),
          BottomNavItemData(
            icon: Icons.calendar_view_week_rounded,
            activeIcon: Icons.calendar_view_week_rounded,
            label: 'Schedule',
            route: AppRoutes.studentTimetablePath,
          ),
          BottomNavItemData(
            icon: Icons.qr_code_scanner_rounded,
            activeIcon: Icons.qr_code_scanner_rounded,
            label: 'Scan',
            route: AppRoutes.studentScanPath,
          ),
          BottomNavItemData(
            icon: Icons.analytics_outlined,
            activeIcon: Icons.analytics_rounded,
            label: 'Reports',
            route: AppRoutes.studentAttendanceHubPath,
          ),
          BottomNavItemData(
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: 'Profile',
            route: AppRoutes.studentProfilePath,
          ),
        ],
      ),
    );
  }
}

/// Teacher Shell
class TeacherShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const TeacherShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: TabTransitionWrapper(
        index: navigationShell.currentIndex,
        child: navigationShell,
      ),
      bottomNavigationBar: SmartBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: navigationShell.goBranch,
        role: 'teacher',
        showLabels: true,
        isGlass: true,
        animationEnabled: true,
        items: const [
          BottomNavItemData(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Home',
            route: AppRoutes.teacherHomePath,
          ),
          BottomNavItemData(
            icon: Icons.school_outlined,
            activeIcon: Icons.school_rounded,
            label: 'Classes',
            route: AppRoutes.teacherFeedPath,
          ),
          BottomNavItemData(
            icon: Icons.qr_code_rounded,
            activeIcon: Icons.qr_code_rounded,
            label: 'Scan',
            route: AppRoutes.teacherQrPath,
          ),
          BottomNavItemData(
            icon: Icons.analytics_outlined,
            activeIcon: Icons.analytics_rounded,
            label: 'Reports',
            route: AppRoutes.teacherStatsPath,
          ),
          BottomNavItemData(
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: 'Profile',
            route: AppRoutes.teacherProfilePath,
          ),
        ],
      ),
    );
  }
}

/// Parent Shell
class ParentShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const ParentShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: TabTransitionWrapper(
        index: navigationShell.currentIndex,
        child: navigationShell,
      ),
      bottomNavigationBar: SmartBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: navigationShell.goBranch,
        role: 'parent',
        showLabels: true,
        isGlass: true,
        animationEnabled: true,
        items: const [
          BottomNavItemData(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Home',
            route: AppRoutes.parentHomePath,
          ),
          BottomNavItemData(
            icon: Icons.event_busy_outlined,
            activeIcon: Icons.event_busy_rounded,
            label: 'Ward',
            route: AppRoutes.parentLeaveStatusPath,
          ),
          BottomNavItemData(
            icon: Icons.analytics_outlined,
            activeIcon: Icons.analytics_rounded,
            label: 'Reports',
            route: AppRoutes.parentAttendanceLogsPath,
          ),
          BottomNavItemData(
            icon: Icons.notifications_none_rounded,
            activeIcon: Icons.notifications_rounded,
            label: 'Alerts',
            route: AppRoutes.parentAlertsPath,
          ),
          BottomNavItemData(
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: 'Profile',
            route: '/parent/profile',
          ),
        ],
      ),
    );
  }
}

/// Admin Shell
class AdminShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AdminShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: TabTransitionWrapper(
        index: navigationShell.currentIndex,
        child: navigationShell,
      ),
      bottomNavigationBar: SmartBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: navigationShell.goBranch,
        role: 'admin',
        showLabels: true,
        isGlass: true,
        animationEnabled: true,
        items: const [
          BottomNavItemData(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Home',
            route: AppRoutes.adminHomePath,
          ),
          BottomNavItemData(
            icon: Icons.people_alt_outlined,
            activeIcon: Icons.people_alt_rounded,
            label: 'Users',
            route: AppRoutes.adminApprovalsPath,
          ),
          BottomNavItemData(
            icon: Icons.security_outlined,
            activeIcon: Icons.security_rounded,
            label: 'Monitor',
            route: AppRoutes.adminSecurityPath,
          ),
          BottomNavItemData(
            icon: Icons.analytics_outlined,
            activeIcon: Icons.analytics_rounded,
            label: 'Reports',
            route: AppRoutes.adminAnalyticsPath,
          ),
          BottomNavItemData(
            icon: Icons.settings_applications_outlined,
            activeIcon: Icons.settings_applications_rounded,
            label: 'Settings',
            route: AppRoutes.adminProfilePath,
          ),
        ],
      ),
    );
  }
}

/// Unauthorized Access Denial screen
class UnauthorizedScreen extends StatelessWidget {
  const UnauthorizedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDeep,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.gpp_bad_outlined,
                color: AppColors.errorLight,
                size: 80,
              ),
              const SizedBox(height: 24),
              Text(
                'Access Denied',
                style: AppText.display(color: Colors.white),
              ),
              const SizedBox(height: 12),
              Text(
                'You do not have the required permissions to view this screen.',
                textAlign: TextAlign.center,
                style: AppText.body(),
              ),
              const SizedBox(height: 36),
              ElevatedButton.icon(
                onPressed: () {
                  final session = context.read<SessionManager>();
                  if (session.isLoggedIn) {
                    final role = session.userRole;
                    switch (role) {
                      case UserRole.admin:
                        context.go(AppRoutes.adminHomePath);
                        break;
                      case UserRole.teacher:
                        context.go(AppRoutes.teacherHomePath);
                        break;
                      case UserRole.student:
                        context.go(AppRoutes.studentHomePath);
                        break;
                      default:
                        context.go(AppRoutes.loginPath);
                    }
                  } else {
                    context.go(AppRoutes.loginPath);
                  }
                },
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                label: Text('BACK TO DASHBOARD', style: AppText.button()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
