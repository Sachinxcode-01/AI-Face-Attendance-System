/*
|--------------------------------------------------------------------------
| File: connectivity_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Network state monitor using connectivity_plus. Provides a reactive stream
| of connectivity changes with debouncing and immediate sync triggers.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import 'package:smartface_attendance/features/sync/models/sync_state.dart';

/// Monitors device network connectivity and emits status changes.
///
/// Features:
/// - Reactive [Stream<ConnectivityStatus>] for UI consumption
/// - 300ms debounce to avoid rapid state oscillation
/// - Synchronous [isOnline] getter from last-known state
/// - Reconnection callback for triggering immediate sync
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  final _statusController = StreamController<ConnectivityStatus>.broadcast();
  ConnectivityStatus _lastStatus = ConnectivityStatus.online;
  Timer? _debounceTimer;

  /// Callback invoked when connectivity transitions from offline → online.
  VoidCallback? onReconnected;

  /// Stream of connectivity status changes (debounced).
  Stream<ConnectivityStatus> get statusStream => _statusController.stream;

  /// Last-known connectivity status (synchronous).
  ConnectivityStatus get currentStatus => _lastStatus;

  /// Whether the device is currently online (synchronous).
  bool get isOnline => _lastStatus == ConnectivityStatus.online ||
                       _lastStatus == ConnectivityStatus.syncing;

  /// Starts monitoring connectivity. Call once at app startup.
  Future<void> init() async {
    // Check initial state
    final results = await _connectivity.checkConnectivity();
    _processResults(results, isInitial: true);

    // Listen for changes
    _subscription = _connectivity.onConnectivityChanged.listen(
      (results) => _processResults(results),
    );

    debugPrint('[Connectivity] Initialized: ${_lastStatus.name}');
  }

  void _processResults(List<ConnectivityResult> results, {bool isInitial = false}) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      final wasOffline = _lastStatus == ConnectivityStatus.offline ||
                         _lastStatus == ConnectivityStatus.syncFailed;

      final newStatus = _mapResults(results);

      if (newStatus != _lastStatus || isInitial) {
        _lastStatus = newStatus;
        _statusController.add(newStatus);
        debugPrint('[Connectivity] Status changed: ${newStatus.name}');

        // Trigger reconnection callback if we just came back online
        if (wasOffline && newStatus == ConnectivityStatus.online) {
          debugPrint('[Connectivity] Reconnected — triggering sync');
          onReconnected?.call();
        }
      }
    });
  }

  ConnectivityStatus _mapResults(List<ConnectivityResult> results) {
    if (results.contains(ConnectivityResult.none) || results.isEmpty) {
      return ConnectivityStatus.offline;
    }
    return ConnectivityStatus.online;
  }

  /// Manually sets status to syncing (called by SyncEngine).
  void setSyncing() {
    _lastStatus = ConnectivityStatus.syncing;
    _statusController.add(ConnectivityStatus.syncing);
  }

  /// Manually sets status to syncFailed (called by SyncEngine).
  void setSyncFailed() {
    _lastStatus = ConnectivityStatus.syncFailed;
    _statusController.add(ConnectivityStatus.syncFailed);
  }

  /// Manually resets to online after sync completes.
  void setSynced() {
    _lastStatus = ConnectivityStatus.online;
    _statusController.add(ConnectivityStatus.online);
  }

  /// Stops monitoring and cleans up resources.
  void dispose() {
    _debounceTimer?.cancel();
    _subscription?.cancel();
    _statusController.close();
  }
}
