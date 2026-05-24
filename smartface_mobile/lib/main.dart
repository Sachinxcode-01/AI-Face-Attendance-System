import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Core
import 'core/app_state.dart';
import 'core/session_manager.dart';
import 'core/theme_controller.dart';

// Screens
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/main/profile_screen.dart';
import 'screens/admin/security_logs_screen.dart';
import 'screens/main/ai_analytics_screen.dart';
import 'screens/auth/setup_wizard_screen.dart';
import 'screens/main/ai_analyst_screen.dart';
import 'screens/main/qr_generator_screen.dart';
import 'screens/student/qr_scanner_screen.dart';
import 'screens/student/leave_apply_screen.dart';
import 'screens/student/leave_history_screen.dart';
import 'screens/teacher/leave_review_screen.dart';
import 'screens/teacher/live_monitor_screen.dart';
import 'screens/teacher/teacher_stats_screen.dart';
import 'screens/main/notification_nexus_screen.dart';
import 'screens/teacher/train_faces_screen.dart';

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
        '/': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/forgot-password': (_) => const ForgotPasswordScreen(),
        '/otp': (_) => const OTPScreen(),
        '/dashboard': (_) => const DashboardScreen(),
        '/profile': (_) => const ProfileScreen(),
        '/security-logs': (_) => const SecurityLogsScreen(),
        '/analytics': (_) => const AIAnalyticsScreen(),
        '/setup': (_) => const SetupWizardScreen(),
        '/analyst': (_) => const AIAnalystScreen(),
        '/qr-generator': (_) => const QRGeneratorScreen(),
        '/qr_scanner': (_) => const QRScannerScreen(),
        '/leave-apply': (_) => const LeaveApplyScreen(),
        '/leave-history': (_) => const LeaveHistoryScreen(),
        '/leave-review': (_) => const LeaveReviewScreen(),
        '/live-monitor': (_) => const LiveMonitorScreen(),
        '/teacher-stats': (_) => const TeacherStatsScreen(),
        '/notifications': (_) => const NotificationNexusScreen(),
        '/train-faces': (_) => const TrainFacesScreen(),
      },
    );
  }
}
