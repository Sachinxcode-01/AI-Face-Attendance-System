/*
|--------------------------------------------------------------------------
| File: sync_engine.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Core synchronization orchestrator that processes pending local attendance
| records sequentially, handling retries, duplicate checking, backoff, and state.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';

import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/sync/models/sync_state.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/features/sync/services/offline_queue_service.dart';

/// Core sync orchestrator processing local offline attendance queue.
class SyncEngine {
  final OfflineQueueService queueService;
  final ConnectivityService connectivityService;
  final ApiService apiService;
  final SyncState syncState;

  bool _isSyncing = false;
  final List<int> _syncDurations = [];

  SyncEngine({
    required this.queueService,
    required this.connectivityService,
    required this.apiService,
    required this.syncState,
  });

  /// Whether a sync process is currently running.
  bool get isSyncing => _isSyncing;

  /// Runs sequentially over all pending/failed records in the queue.
  ///
  /// Concurrency guarded to prevent overlapping runs.
  Future<void> syncAll() async {
    if (_isSyncing) {
      debugPrint('[SyncEngine] Sync already in progress, skipping.');
      return;
    }

    if (!connectivityService.isOnline) {
      debugPrint('[SyncEngine] Device is offline, skipping sync.');
      syncState.connectivity = ConnectivityStatus.offline;
      return;
    }

    _isSyncing = true;
    syncState.isSyncing = true;
    connectivityService.setSyncing();

    try {
      // Refresh state counts initially
      _updateSyncStateCounts();

      while (true) {
        final pending = queueService.getPendingForSync();
        if (pending.isEmpty) {
          debugPrint('[SyncEngine] No pending records to sync.');
          break;
        }

        // Process the oldest record first
        final record = pending.first;

        // Double check online status
        if (!connectivityService.isOnline) {
          debugPrint('[SyncEngine] Connectivity lost during sync loop.');
          syncState.connectivity = ConnectivityStatus.offline;
          break;
        }

        // Validate HMAC integrity to check for tampering
        if (!queueService.validateRecord(record)) {
          debugPrint(
            '[SyncEngine] Security violation: Record ${record.id} has invalid HMAC signature! Rejecting.',
          );
          await queueService.updateStatus(
            record.id,
            SyncStatus.failed,
            serverResponse: 'Security Error: HMAC signature validation failed.',
            retryCount: 99, // Exceeds max retries permanently
          );
          _updateSyncStateCounts();
          continue;
        }

        // Apply exponential backoff delay if record has retried before
        if (record.retryCount > 0) {
          final delay = _calculateBackoffDelay(record.retryCount);
          debugPrint(
            '[SyncEngine] Record ${record.id} has retryCount=${record.retryCount}. Backing off for ${delay.inMilliseconds}ms',
          );
          await Future.delayed(delay);
        }

        // Mark record as syncing in local DB
        await queueService.updateStatus(record.id, SyncStatus.syncing);
        _updateSyncStateCounts();

        final stopwatch = Stopwatch()..start();
        String? responseBody;

        try {
          final response = await apiService.post(
            '/attendance/mark',
            body: {
              'student_email': record.studentEmail,
              'session_id': record.sessionId,
              'qr_code': record.qrToken,
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Face-Scanner-Token': EnvConfig.faceScannerToken,
            },
          );

          stopwatch.stop();
          responseBody = response.body;

          if (response.statusCode == 200 || response.statusCode == 201) {
            await queueService.markSynced(
              record.id,
              serverResponse: responseBody,
            );
            _syncDurations.add(stopwatch.elapsedMilliseconds);
            _updateAverageSyncDuration();
            debugPrint('[SyncEngine] Successfully synced record ${record.id}');
          } else if (response.statusCode == 409 ||
              responseBody.contains('already marked') ||
              responseBody.contains('already verified')) {
            // Server-wins conflict resolution (duplicate)
            await queueService.markSynced(
              record.id,
              serverResponse: 'Duplicate resolved: $responseBody',
            );
            debugPrint(
              '[SyncEngine] Resolved duplicate record ${record.id} as synced.',
            );
          } else {
            // Server error or bad request (4xx / 5xx)
            debugPrint(
              '[SyncEngine] Server rejected record ${record.id} with status ${response.statusCode}',
            );
            await queueService.markFailed(
              record.id,
              serverResponse: responseBody,
            );
          }
        } catch (e) {
          stopwatch.stop();
          debugPrint(
            '[SyncEngine] Network exception syncing record ${record.id}: $e',
          );
          await queueService.markFailed(
            record.id,
            serverResponse: e.toString(),
          );
          // If we hit a network exception, connectivity is likely unstable, so we break the loop
          break;
        }

        _updateSyncStateCounts();
      }
    } finally {
      _isSyncing = false;
      syncState.isSyncing = false;
      syncState.lastSyncTime = DateTime.now();

      final counts = queueService.getCounts();
      final failedCount = counts[SyncStatus.failed] ?? 0;

      if (failedCount > 0) {
        connectivityService.setSyncFailed();
        syncState.connectivity = ConnectivityStatus.syncFailed;
      } else {
        connectivityService.setSynced();
        syncState.connectivity = ConnectivityStatus.online;
      }

      _updateSyncStateCounts();
      // Purge stale records older than 7 days
      await queueService.purgeStale();
    }
  }

  Duration _calculateBackoffDelay(int retryCount) {
    // delay = min(2^retryCount * 1000ms, 60000ms) with +/- 20% jitter
    final baseDelayMs = min(pow(2, retryCount) * 1000, 60000).toInt();
    final random = Random();
    final jitterPercentage =
        (random.nextDouble() * 40 - 20) / 100; // -20% to +20%
    final jitterMs = (baseDelayMs * jitterPercentage).toInt();
    return Duration(milliseconds: baseDelayMs + jitterMs);
  }

  void _updateSyncStateCounts() {
    final counts = queueService.getCounts();
    syncState.updateCounts(
      pending: counts[SyncStatus.pending] ?? 0,
      failed: counts[SyncStatus.failed] ?? 0,
      synced: counts[SyncStatus.synced] ?? 0,
    );
  }

  void _updateAverageSyncDuration() {
    if (_syncDurations.isEmpty) return;
    final total = _syncDurations.reduce((a, b) => a + b);
    syncState.averageSyncDuration = total / _syncDurations.length;
  }
}
