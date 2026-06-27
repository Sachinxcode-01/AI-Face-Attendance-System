import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Core
import 'core/app_state.dart';
import 'core/session_manager.dart';
import 'core/theme_controller.dart';
import 'services/api_service.dart';

// Screens
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/admin/admin_dashboard.dart';
import 'screens/main/profile_screen.dart';
import 'screens/admin/security_logs_screen.dart';
import 'screens/main/ai_analytics_screen.dart';
import 'screens/auth/setup_wizard_screen.dart';
import 'screens/main/ai_analyst_screen.dart';
import 'screens/main/qr_generator_screen.dart';
import 'screens/student/qr_scanner_screen.dart';
import 'screens/student/student_profile_screen.dart';
import 'screens/student/student_dashboard.dart';
import 'screens/student/leave_apply_screen.dart';
import 'screens/student/leave_history_screen.dart';
import 'screens/parent/parent_dashboard.dart';
import 'screens/teacher/leave_review_screen.dart';
import 'screens/teacher/live_monitor_screen.dart';
import 'screens/teacher/teacher_dashboard.dart';
import 'screens/teacher/teacher_stats_screen.dart';
import 'screens/main/notification_nexus_screen.dart';
import 'screens/teacher/train_faces_screen.dart';
import 'screens/teacher/system_health_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/route_error_screen.dart';

/// FCM background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM Background] ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Firebase
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Firebase] init failed: $e');
  }

  // Initialize core controllers
  final sessionManager = SessionManager();
  final themeController = ThemeController();
  final appState = AppState();

  await Future.wait([
    ApiService.init(),
    sessionManager.init(),
    themeController.init(),
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionManager>.value(value: sessionManager),
        ChangeNotifierProvider<ThemeController>.value(value: themeController),
        ChangeNotifierProvider<AppState>.value(value: appState),
      ],
      child: const SmartAttendanceApp(),
    ),
  );
}

class SmartAttendanceApp extends StatelessWidget {
  const SmartAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();

    return MaterialApp(
      title: 'SmartAttendance — AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeController.lightTheme,
      darkTheme: ThemeController.darkTheme,
      themeMode: themeCtrl.mode,
      initialRoute: '/splash',
      routes: {
        '/splash': (_) => const SplashScreen(),
        '/welcome': (_) => const WelcomeScreen(),
        '/': (_) => const LoginScreen(),
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/forgot-password': (_) => const ForgotPasswordScreen(),
        '/reset-password': (_) => const ForgotPasswordScreen(),
        '/otp': (_) => const OTPScreen(),
        '/setup': (context) =>
            _protectedRoute(context, const SetupWizardScreen()),
        '/setup-wizard': (context) =>
            _protectedRoute(context, const SetupWizardScreen()),
        '/dashboard': (context) =>
            _protectedRoute(context, const DashboardScreen()),
        '/student/dashboard': (context) => _protectedRoute(
          context,
          const StudentDashboard(),
          allowedRoles: const ['student'],
        ),
        '/parent/dashboard': (context) => _protectedRoute(
          context,
          const ParentDashboard(),
          allowedRoles: const ['parent'],
        ),
        '/teacher/dashboard': (context) => _protectedRoute(
          context,
          const TeacherDashboard(),
          allowedRoles: const ['teacher', 'faculty', 'lecturer'],
        ),
        '/admin/dashboard': (context) => _protectedRoute(
          context,
          const AdminDashboard(),
          allowedRoles: const ['admin'],
        ),
        '/profile': (context) =>
            _protectedRoute(context, const ProfileScreen()),
        '/student-profile': (_) => const StudentProfileScreen(),
        '/security-logs': (context) => _protectedRoute(
          context,
          const SecurityLogsScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/analytics': (context) =>
            _protectedRoute(context, const AIAnalyticsScreen()),
        '/analyst': (context) =>
            _protectedRoute(context, const AIAnalystScreen()),
        '/qr-generator': (context) => _protectedRoute(
          context,
          const QRGeneratorScreen(),
          allowedRoles: const ['teacher', 'admin'],
        ),
        '/qr_scanner': (context) => _protectedRoute(
          context,
          const QRScannerScreen(),
          allowedRoles: const ['student'],
        ),
        '/leave-apply': (context) =>
            _protectedRoute(context, const LeaveApplyScreen()),
        '/leave-history': (context) =>
            _protectedRoute(context, const LeaveHistoryScreen()),
        '/leave-review': (context) => _protectedRoute(
          context,
          const LeaveReviewScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/live-monitor': (context) => _protectedRoute(
          context,
          const LiveMonitorScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/teacher-stats': (context) => _protectedRoute(
          context,
          const TeacherStatsScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/notifications': (context) =>
            _protectedRoute(context, const NotificationNexusScreen()),
        '/train-faces': (context) => _protectedRoute(
          context,
          const TrainFacesScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/system-health': (context) => _protectedRoute(
          context,
          const SystemHealthScreen(),
          allowedRoles: const ['admin', 'teacher'],
        ),
        '/settings': (_) => const SettingsScreen(),
      },
      onUnknownRoute: (_) => MaterialPageRoute<void>(
        builder: (_) => const RouteErrorScreen(
          title: 'Route not found',
          message: 'This SmartFace screen is not available.',
        ),
      ),
    );
  }

  Widget _protectedRoute(
    BuildContext context,
    Widget child, {
    List<String>? allowedRoles,
  }) {
    final session = context.watch<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final role = (args?['role'] ?? session.role ?? '').toString().toLowerCase();

    if (!session.isLoggedIn) {
      return const LoginScreen();
    }

    if (allowedRoles != null && !allowedRoles.contains(role)) {
      return const RouteErrorScreen(
        title: 'Access denied',
        message: 'Your account does not have permission to open this screen.',
      );
    }

    return child;
  }
}
