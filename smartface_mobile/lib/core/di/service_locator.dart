/*
|--------------------------------------------------------------------------
| File: service_locator.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Configures and manages the global dependency injection container.
|
| Responsibilities:
| - Registers services, repositories, and state managers.
| - Synchronizes initializations of managers before app boot.
| - Decouples implementation details using GetIt registry.
|--------------------------------------------------------------------------
*/

import 'package:get_it/get_it.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// Core Services
import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/core/services/auth_service.dart';
import 'package:smartface_attendance/core/services/ai_service.dart';
import 'package:smartface_attendance/core/services/attendance_service.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/core/services/websocket_service.dart';

// Feature Repositories
import 'package:smartface_attendance/features/auth/repositories/auth_repository.dart';
import 'package:smartface_attendance/features/attendance/repositories/attendance_repository.dart';
import 'package:smartface_attendance/features/analytics/repositories/ai_repository.dart';
import 'package:smartface_attendance/features/notifications/repositories/notification_repository.dart';

// Feature Controllers
import 'package:smartface_attendance/features/auth/controllers/auth_controller.dart';
import 'package:smartface_attendance/features/attendance/controllers/attendance_controller.dart';
import 'package:smartface_attendance/features/analytics/controllers/ai_controller.dart';
import 'package:smartface_attendance/features/notifications/controllers/notification_controller.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';

// Sync Feature
import 'package:smartface_attendance/features/sync/models/sync_state.dart';
import 'package:smartface_attendance/features/sync/services/offline_queue_service.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/features/sync/services/sync_engine.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';
import 'package:smartface_attendance/features/sync/controllers/sync_controller.dart';

// ======================================================
// Service Locator Declaration
// ======================================================

final GetIt sl = GetIt.instance;

// ======================================================
// Initialization Setup
// ======================================================

Future<void> initServiceLocator() async {
  // ─── Base Services ────────────────────────────────────────────────
  sl.registerLazySingleton<ApiService>(() => ApiService());
  sl.registerLazySingleton<AuthService>(() => AuthService(sl<ApiService>()));
  sl.registerLazySingleton<AIService>(() => AIService(sl<ApiService>()));
  sl.registerLazySingleton<AttendanceService>(() => AttendanceService(sl<ApiService>()));
  sl.registerLazySingleton<NotificationService>(
    () => NotificationService(sl<ApiService>(), sl<WebSocketService>()),
  );
  sl.registerLazySingleton<WebSocketService>(() => WebSocketService());

  // ─── Repositories ─────────────────────────────────────────────────
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepository(sl<AuthService>(), sl<SessionManager>()),
  );
  sl.registerLazySingleton<AttendanceRepository>(
    () => AttendanceRepository(sl<AttendanceService>()),
  );
  sl.registerLazySingleton<AIRepository>(
    () => AIRepository(sl<AIService>()),
  );
  sl.registerLazySingleton<NotificationRepository>(
    () => NotificationRepository(sl<NotificationService>(), sl<WebSocketService>()),
  );

  // ─── Controllers (Factories) ──────────────────────────────────────
  sl.registerFactory<AuthController>(() => AuthController(sl<AuthRepository>()));
  sl.registerFactory<AttendanceController>(() => AttendanceController(sl<AttendanceRepository>()));
  sl.registerFactory<AIController>(() => AIController(sl<AIRepository>()));
  sl.registerFactory<NotificationController>(() => NotificationController(sl<NotificationRepository>()));
  sl.registerFactory<LeaveController>(() => LeaveController());
  sl.registerFactory<AnalyticsController>(() => AnalyticsController());

  // ─── Sync Feature ────────────────────────────────────────────────
  final syncState = SyncState();
  final offlineQueueService = OfflineQueueService();
  final connectivityService = ConnectivityService();

  sl.registerSingleton<SyncState>(syncState);
  sl.registerSingleton<OfflineQueueService>(offlineQueueService);
  sl.registerSingleton<ConnectivityService>(connectivityService);

  sl.registerLazySingleton<SyncEngine>(() => SyncEngine(
    queueService: sl<OfflineQueueService>(),
    connectivityService: sl<ConnectivityService>(),
    apiService: sl<ApiService>(),
    syncState: sl<SyncState>(),
  ));

  sl.registerLazySingleton<SyncRepository>(() => SyncRepository(
    queueService: sl<OfflineQueueService>(),
    syncEngine: sl<SyncEngine>(),
  ));

  sl.registerFactory<SyncController>(() => SyncController(
    repository: sl<SyncRepository>(),
    syncState: sl<SyncState>(),
  ));

  // ─── Core Singletons ──────────────────────────────────────────────
  final sessionManager = SessionManager();
  final themeController = ThemeController();
  final appState = AppState();

  // Load persistence for the managers synchronously/parallelly before registering.
  await Future.wait([
    sessionManager.init(),
    themeController.init(),
    offlineQueueService.init(),
    connectivityService.init(),
  ]);

  sl.registerSingleton<SessionManager>(sessionManager);
  sl.registerSingleton<ThemeController>(themeController);
  sl.registerSingleton<AppState>(appState);
}
