/*
|--------------------------------------------------------------------------
| File: background_sync_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Background sync manager utilizing the WorkManager package for periodic
| sync tasks on Android, and app lifecycle triggers.
|--------------------------------------------------------------------------
*/

import 'package:flutter/widgets.dart';
import 'package:workmanager/workmanager.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/sync/services/offline_queue_service.dart';
import 'package:smartface_attendance/features/sync/services/sync_engine.dart';

/// Periodic task name for workmanager.
const String syncTaskName = 'com.smartface.attendance.syncTask';
const String uniqueSyncName = 'smartface_attendance_sync';

/// Top-level callback dispatcher for Workmanager background tasks.
/// Must be annotated with @pragma('vm:entry-point') so it isn't tree-shaken.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint('[BackgroundSync] Triggered background task: $task');
    try {
      // Initialize bindings
      WidgetsFlutterBinding.ensureInitialized();

      // Load environment configuration
      await EnvConfig.load();

      // Initialize Hive
      await Hive.initFlutter();

      // Setup service locator
      await initServiceLocator();

      // Get services
      final queueService = sl<OfflineQueueService>();
      final syncEngine = sl<SyncEngine>();

      // Initialize Hive box encryption and signing keys
      await queueService.init();

      // Run sync cycle
      await syncEngine.syncAll();

      debugPrint('[BackgroundSync] Background task finished successfully');
      return true;
    } catch (e, stackTrace) {
      debugPrint('[BackgroundSync] Background task failed: $e\n$stackTrace');
      return false;
    }
  });
}

class BackgroundSyncService {
  /// Initializes and schedules the periodic background sync task.
  static Future<void> initialize() async {
    try {
      await Workmanager().initialize(
        callbackDispatcher,
      );

      // Register periodic task (every 15 minutes - minimum allowed by Android)
      await Workmanager().registerPeriodicTask(
        uniqueSyncName,
        syncTaskName,
        frequency: const Duration(minutes: 15),
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
        existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
      );
      debugPrint('[BackgroundSyncService] WorkManager registered periodic task.');
    } catch (e) {
      debugPrint('[BackgroundSyncService] Failed to initialize WorkManager: $e');
    }
  }

  /// Manually triggers a one-off background sync task using Workmanager.
  static Future<void> triggerOneOffSync() async {
    try {
      await Workmanager().registerOneOffTask(
        '${uniqueSyncName}_oneoff_${DateTime.now().millisecondsSinceEpoch}',
        syncTaskName,
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
      );
      debugPrint('[BackgroundSyncService] Scheduled one-off sync task.');
    } catch (e) {
      debugPrint('[BackgroundSyncService] Failed to trigger one-off sync: $e');
    }
  }

  /// Cancels all background tasks.
  static Future<void> cancelAll() async {
    try {
      await Workmanager().cancelAll();
      debugPrint('[BackgroundSyncService] Cancelled all background tasks.');
    } catch (e) {
      debugPrint('[BackgroundSyncService] Failed to cancel tasks: $e');
    }
  }
}
