/*
|--------------------------------------------------------------------------
| File: main.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Application entry point. Configures Flutter initializations, registers providers,
| handles Firebase/FCM boot options, and runs the application shell.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// App Configuration & State
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/app/app.dart';

// Controllers
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/controllers/auth_controller.dart';
import 'package:smartface_attendance/features/attendance/controllers/attendance_controller.dart';
import 'package:smartface_attendance/features/analytics/controllers/ai_controller.dart';
import 'package:smartface_attendance/features/notifications/controllers/notification_controller.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';

// Offline Sync Feature
import 'package:hive_flutter/hive_flutter.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';
import 'package:smartface_attendance/features/sync/services/background_sync_service.dart';

/// FCM background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM Background] ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment configurations from env files on startup
  await EnvConfig.load();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Firebase Initialization with EnvConfig values
  try {
    await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: EnvConfig.firebaseApiKey,
        appId: EnvConfig.firebaseAppId,
        messagingSenderId: EnvConfig.firebaseMessagingSenderId,
        projectId: EnvConfig.firebaseProjectId,
        storageBucket: EnvConfig.firebaseStorageBucket,
      ),
    );
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Firebase] init failed: $e');
  }

  // Initialize Hive before service locator starts setting up local boxes
  await Hive.initFlutter();

  // Initialize service locator and all core controllers
  await initServiceLocator();

  // Initialize Background Sync Engine for offline queue processing
  await BackgroundSyncService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionManager>.value(value: sl<SessionManager>()),
        ChangeNotifierProvider<ThemeController>.value(value: sl<ThemeController>()),
        ChangeNotifierProvider<AppState>.value(value: sl<AppState>()),
        ChangeNotifierProvider<AuthController>(create: (_) => sl<AuthController>()),
        ChangeNotifierProvider<AttendanceController>(create: (_) => sl<AttendanceController>()),
        ChangeNotifierProvider<AIController>(create: (_) => sl<AIController>()),
        ChangeNotifierProvider<NotificationController>(create: (_) => sl<NotificationController>()),
        ChangeNotifierProvider<SyncController>(create: (_) => sl<SyncController>()),
        ChangeNotifierProvider<LeaveController>(create: (_) => sl<LeaveController>()),
        ChangeNotifierProvider<AnalyticsController>(create: (_) => sl<AnalyticsController>()),
      ],
      child: const SmartAttendanceApp(),
    ),
  );
}
