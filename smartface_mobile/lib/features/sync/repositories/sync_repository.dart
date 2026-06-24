/*
|--------------------------------------------------------------------------
| File: sync_repository.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Repository class mediating access to the offline queue and triggering
| synchronization runs. Acts as the primary API for other features.
|--------------------------------------------------------------------------
*/

import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/sync/services/offline_queue_service.dart';
import 'package:smartface_attendance/features/sync/services/sync_engine.dart';

class SyncRepository {
  final OfflineQueueService _queueService;
  final SyncEngine _syncEngine;

  SyncRepository({
    required OfflineQueueService queueService,
    required SyncEngine syncEngine,
  }) : _queueService = queueService,
       _syncEngine = syncEngine;

  /// Enqueues a new attendance marking and schedules an immediate sync run.
  ///
  /// Returns the created queue record.
  Future<AttendanceQueueRecord> recordAttendance({
    required String studentEmail,
    required String sessionId,
    required String qrToken,
    String verificationMethod = 'qr',
  }) async {
    final record = await _queueService.enqueue(
      studentEmail: studentEmail,
      sessionId: sessionId,
      qrToken: qrToken,
      verificationMethod: verificationMethod,
    );

    // Trigger non-blocking sync in background
    _syncEngine.syncAll().catchError((e) {
      // Log error silently
    });

    return record;
  }

  /// Triggers a manual sync run.
  Future<void> forceSyncNow() async {
    await _syncEngine.syncAll();
  }

  /// Retries all failed records in the queue by resetting their status to pending.
  Future<void> retryFailedRecords() async {
    final failed = _queueService.getAll().where(
      (r) => r.syncStatus == SyncStatus.failed,
    );
    for (final record in failed) {
      await _queueService.updateStatus(
        record.id,
        SyncStatus.pending,
        retryCount: 0,
      );
    }
    // Trigger sync
    await forceSyncNow();
  }

  /// Clears all permanently failed records from the queue.
  Future<void> clearFailedRecords() async {
    final failed = _queueService.getAll().where(
      (r) => r.syncStatus == SyncStatus.failed,
    );
    for (final record in failed) {
      await _queueService.delete(record.id);
    }
  }

  /// Returns all records in the queue, sorted by creation time descending.
  List<AttendanceQueueRecord> getQueueHistory() {
    final all = _queueService.getAll();
    all.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return all;
  }

  /// Returns aggregate counts and stats for the sync dashboard.
  Map<String, dynamic> getSyncDashboard() {
    final counts = _queueService.getCounts();
    return {
      'pending': counts[SyncStatus.pending] ?? 0,
      'syncing': counts[SyncStatus.syncing] ?? 0,
      'synced': counts[SyncStatus.synced] ?? 0,
      'failed': counts[SyncStatus.failed] ?? 0,
      'successRate': _syncEngine.syncState.successRate,
      'averageDuration': _syncEngine.syncState.averageSyncDuration,
      'lastSyncTime': _syncEngine.syncState.lastSyncTime,
      'isOnline': _syncEngine.connectivityService.isOnline,
    };
  }
}
