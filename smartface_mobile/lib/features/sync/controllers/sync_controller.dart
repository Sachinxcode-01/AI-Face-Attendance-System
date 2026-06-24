/*
|--------------------------------------------------------------------------
| File: sync_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| ChangeNotifier controller exposing the SyncState to the UI and routing
| manual user sync actions to the SyncRepository.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/sync/models/attendance_queue_record.dart';
import 'package:smartface_attendance/features/sync/models/sync_state.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';

class SyncController extends ChangeNotifier {
  final SyncRepository _repository;
  final SyncState _syncState;

  SyncController({
    required SyncRepository repository,
    required SyncState syncState,
  }) : _repository = repository,
       _syncState = syncState {
    _syncState.addListener(_onSyncStateChanged);
  }

  void _onSyncStateChanged() {
    notifyListeners();
  }

  @override
  void dispose() {
    _syncState.removeListener(_onSyncStateChanged);
    super.dispose();
  }

  // ─── Getters ──────────────────────────────────────────────────────
  ConnectivityStatus get connectivity => _syncState.connectivity;
  int get pendingCount => _syncState.pendingCount;
  int get failedCount => _syncState.failedCount;
  int get syncedCount => _syncState.syncedCount;
  bool get isSyncing => _syncState.isSyncing;
  DateTime? get lastSyncTime => _syncState.lastSyncTime;
  double? get averageSyncDuration => _syncState.averageSyncDuration;
  double get successRate => _syncState.successRate;
  bool get isFullySynced => _syncState.isFullySynced;

  /// Returns all queue history records.
  List<AttendanceQueueRecord> get queueHistory => _repository.getQueueHistory();

  // ─── Actions ──────────────────────────────────────────────────────

  /// Manually forces a sync run.
  Future<void> syncNow() async {
    await _repository.forceSyncNow();
  }

  /// Resets failed records back to pending and syncs again.
  Future<void> retryFailed() async {
    await _repository.retryFailedRecords();
  }

  /// Clears failed records from the queue.
  Future<void> clearFailed() async {
    await _repository.clearFailedRecords();
  }
}
