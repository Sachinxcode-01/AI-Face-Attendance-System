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
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/router/route_guards.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';

// Guest / Unauthenticated Screens
import 'package:smartface_attendance/features/auth/screens/splash_screen.dart';
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

// Admin Screens
import 'package:smartface_attendance/features/admin/screens/admin_home_screen.dart';
import 'package:smartface_attendance/features/leave/screens/leave_review_screen.dart';
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
      redirect: (context, state) => AppRoutes.splashPath,
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
      path: '/auth/intro',
      redirect: (context, state) => AppRoutes.setupWizardPath,
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
      path: '/student/dashboard',
      redirect: (context, state) => AppRoutes.studentHomePath,
    ),
    GoRoute(
      path: '/teacher/dashboard',
      redirect: (context, state) => AppRoutes.teacherHomePath,
    ),
    GoRoute(
      path: '/admin/dashboard',
      redirect: (context, state) => AppRoutes.adminHomePath,
    ),
    GoRoute(
      path: '/parent/dashboard',
      redirect: (context, state) => AppRoutes.managementDashboardPath,
    ),
    GoRoute(
      path: '/profile',
      redirect: (context, state) {
        final role = Provider.of<SessionManager>(context, listen: false).userRole;
        if (role == UserRole.student) return AppRoutes.studentProfilePath;
        if (role == UserRole.teacher) return AppRoutes.teacherProfilePath;
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
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const OTPScreen(),
      ),
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

    // â”€â”€ TEMPORARY COMPONENT SHOWCASE ROUTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    GoRoute(
      path: '/showcase',
      name: 'showcase',
      pageBuilder: (context, state) => buildPageWithTransition(
        context: context,
        state: state,
        child: const ComponentShowcaseScreen(),
      ),
    ),

    // â”€â”€ STUDENT ROLE ROOT STATEFUL SHELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              path: AppRoutes.studentScanPath,
              name: AppRoutes.studentScanName,
              builder: (context, state) => const QRScannerScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentLeavePath,
              name: AppRoutes.studentLeaveName,
              builder: (context, state) => const StudentLeaveDashboardScreen(),
              routes: [
                GoRoute(
                  path: 'history',
                  name: AppRoutes.studentLeaveHistoryName,
                  builder: (context, state) => const LeaveHistoryScreen(),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.studentAlertsPath,
              name: AppRoutes.studentAlertsName,
              builder: (context, state) => const NotificationNexusScreen(),
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
              builder: (context, state) => const LeaveReviewScreen(),
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
              builder: (context, state) => const ProfileScreen(),
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
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          HapticFeedback.selectionClick();
          navigationShell.goBranch(index);
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.bgDeep,
        selectedItemColor: AppColors.gold,
        unselectedItemColor: Colors.white38,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            label: 'Scan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event_busy_outlined),
            label: 'Leave',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_none_outlined),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_circle_outlined),
            label: 'Profile',
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
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          HapticFeedback.selectionClick();
          navigationShell.goBranch(index);
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.bgDeep,
        selectedItemColor: AppColors.gold,
        unselectedItemColor: Colors.white38,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.videocam_outlined),
            label: 'Feed',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_rounded),
            label: 'QR',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            label: 'Stats',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_circle_outlined),
            label: 'Profile',
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
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          HapticFeedback.selectionClick();
          navigationShell.goBranch(index);
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.bgDeep,
        selectedItemColor: AppColors.gold,
        unselectedItemColor: Colors.white38,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.approval_outlined),
            label: 'Approvals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.security_outlined),
            label: 'Security',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            label: 'Analytics',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_circle_outlined),
            label: 'Profile',
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
