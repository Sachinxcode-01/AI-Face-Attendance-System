/*
|--------------------------------------------------------------------------
| File: sync_state.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Reactive state model representing the current sync engine status.
| Consumed by SyncController and UI widgets to display real-time sync info.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';

/// Connectivity status for the sync system.
enum ConnectivityStatus { online, offline, syncing, syncFailed }

/// Reactive state model for the sync engine.
///
/// Tracks pending/failed/synced counts, connectivity, and performance metrics.
/// This is the single source of truth for all sync-related UI.
class SyncState extends ChangeNotifier {
  ConnectivityStatus _connectivity = ConnectivityStatus.online;
  int _pendingCount = 0;
  int _failedCount = 0;
  int _syncedCount = 0;
  DateTime? _lastSyncTime;
  double? _averageSyncDuration;
  bool _isSyncing = false;
  double _successRate = 100.0;

  // ─── Getters ──────────────────────────────────────────────────────
  ConnectivityStatus get connectivity => _connectivity;
  int get pendingCount => _pendingCount;
  int get failedCount => _failedCount;
  int get syncedCount => _syncedCount;
  DateTime? get lastSyncTime => _lastSyncTime;
  double? get averageSyncDuration => _averageSyncDuration;
  bool get isSyncing => _isSyncing;
  double get successRate => _successRate;

  /// Whether all records have been synced (nothing pending or failed).
  bool get isFullySynced => _pendingCount == 0 && _failedCount == 0;

  /// Total records currently in the queue (all statuses).
  int get totalQueueSize => _pendingCount + _failedCount + _syncedCount;

  // ─── Setters ──────────────────────────────────────────────────────

  set connectivity(ConnectivityStatus value) {
    if (_connectivity != value) {
      _connectivity = value;
      notifyListeners();
    }
  }

  /// Updates all queue counts in a single batch to avoid excessive rebuilds.
  void updateCounts({
    required int pending,
    required int failed,
    required int synced,
  }) {
    _pendingCount = pending;
    _failedCount = failed;
    _syncedCount = synced;
    _updateSuccessRate();
    notifyListeners();
  }

  set isSyncing(bool value) {
    if (_isSyncing != value) {
      _isSyncing = value;
      if (value) {
        _connectivity = ConnectivityStatus.syncing;
      }
      notifyListeners();
    }
  }

  set lastSyncTime(DateTime? value) {
    _lastSyncTime = value;
    notifyListeners();
  }

  set averageSyncDuration(double? value) {
    _averageSyncDuration = value;
    notifyListeners();
  }

  // ─── Internal ─────────────────────────────────────────────────────

  void _updateSuccessRate() {
    final total = _syncedCount + _failedCount;
    if (total > 0) {
      _successRate = (_syncedCount / total) * 100;
    } else {
      _successRate = 100.0;
    }
  }

  /// Resets all state to defaults (e.g., on logout).
  void reset() {
    _connectivity = ConnectivityStatus.online;
    _pendingCount = 0;
    _failedCount = 0;
    _syncedCount = 0;
    _lastSyncTime = null;
    _averageSyncDuration = null;
    _isSyncing = false;
    _successRate = 100.0;
    notifyListeners();
  }
}
