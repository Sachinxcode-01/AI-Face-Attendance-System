/*
|--------------------------------------------------------------------------
| File: app_state.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Manages the global reactive UI state shared across all presentation layers.
|
| Responsibilities:
| - Stores profile details, notification updates, and unread counts reactively.
| - Manages institutional activity logs and attendance summary structures.
| - Holds global loading state and display messages for full-screen operations.
| - Exposes state modification helpers and handles state reset on logout.
|
| Dependencies:
| - package:flutter/foundation.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';

// ======================================================
// State Management: App State
// ======================================================

/// Global App State Manager
///
/// Holds and broadcasts changes for transient UI states including:
/// - User profile details and load diagnostics
/// - Real-time system notifications
/// - Transient loading spinner messages
/// - Local session activity logging
class AppState extends ChangeNotifier {
  
  // ======================================================
  // State: Profile Details
  // ======================================================
  Map<String, dynamic> _profile = {};
  bool _profileLoading = false;
  String? _profileError;

  /// Retrieves cached profile data map.
  Map<String, dynamic> get profile => _profile;

  /// Returns true if profile details are currently being fetched.
  bool get profileLoading => _profileLoading;

  /// Holds error message string if profile load failed.
  String? get profileError => _profileError;

  /// Sets profile details map and resets error states.
  void setProfile(Map<String, dynamic> data) {
    _profile = data;
    _profileError = null;
    notifyListeners();
  }

  /// Toggles profile loading spinner.
  void setProfileLoading(bool v) {
    _profileLoading = v;
    notifyListeners();
  }

  /// Sets profile loading error message.
  void setProfileError(String? e) {
    _profileError = e;
    _profileLoading = false;
    notifyListeners();
  }

  // ======================================================
  // State: Notifications System
  // ======================================================
  int _unreadCount = 0;
  List<Map<String, dynamic>> _notifications = [];

  /// Retrieves unread notifications counter.
  int get unreadCount => _unreadCount;

  /// Retrieves the list of active notification payloads.
  List<Map<String, dynamic>> get notifications => _notifications;

  /// Sets the unread notifications count directly.
  void setUnreadCount(int count) {
    _unreadCount = count;
    notifyListeners();
  }

  /// Sets the notifications list and computes the unread percentage.
  void setNotifications(List<Map<String, dynamic>> list) {
    _notifications = list;
    _unreadCount = list.where((n) => !(n['is_read'] == true)).length;
    notifyListeners();
  }

  /// Marks a specific notification as read by its unique identifier.
  void markNotificationRead(String id) {
    for (final n in _notifications) {
      if (n['id'] == id) n['is_read'] = true;
    }
    _unreadCount = _notifications.where((n) => !(n['is_read'] == true)).length;
    notifyListeners();
  }

  /// Injects a new notification into the state collection.
  void addNotification(Map<String, dynamic> notification) {
    _notifications.insert(0, notification);
    _unreadCount++;
    notifyListeners();
  }

  // ======================================================
  // State: Activity & Analytics Logging
  // ======================================================
  final List<Map<String, dynamic>> _activityLog = [];

  /// Exposes the session's internal action telemetry log.
  List<Map<String, dynamic>> get activityLog => _activityLog;

  /// Inserts a telemetry action block into the session cache log.
  ///
  /// Limit is enforced at 100 historical logs.
  void logActivity(String type, String message) {
    _activityLog.insert(0, {
      'type': type,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    });
    if (_activityLog.length > 100) _activityLog.removeLast();
    notifyListeners();
  }

  // ======================================================
  // State: Attendance Insights Summary
  // ======================================================
  Map<String, dynamic> _attendanceSummary = {};
  bool _attendanceLoading = false;

  /// Gets the currently resolved attendance metrics.
  Map<String, dynamic> get attendanceSummary => _attendanceSummary;

  /// Returns true if attendance statistics are actively reloading.
  bool get attendanceLoading => _attendanceLoading;

  /// Sets the attendance stats data map.
  void setAttendanceSummary(Map<String, dynamic> data) {
    _attendanceSummary = data;
    _attendanceLoading = false;
    notifyListeners();
  }

  /// Sets the attendance statistics loading state flag.
  void setAttendanceLoading(bool v) {
    _attendanceLoading = v;
    notifyListeners();
  }

  // ======================================================
  // State: Global Loader Control
  // ======================================================
  bool _globalLoading = false;
  String _globalLoadingMsg = 'Loading...';

  /// Indicates if a blocking full-screen operation is active.
  bool get globalLoading => _globalLoading;

  /// Display text representing current blocking work (e.g. "Registering Face...").
  String get globalLoadingMsg => _globalLoadingMsg;

  /// Activates the full-screen loader layout.
  void showGlobalLoader(String msg) {
    _globalLoading = true;
    _globalLoadingMsg = msg;
    notifyListeners();
  }

  /// Deactivates the full-screen loader layout.
  void hideGlobalLoader() {
    _globalLoading = false;
    notifyListeners();
  }

  // ======================================================
  // State: Lifetime Reset
  // ======================================================

  /// Resets all global state collections when user signs out.
  void reset() {
    _profile = {};
    _profileLoading = false;
    _profileError = null;
    _unreadCount = 0;
    _notifications = [];
    _activityLog.clear();
    _attendanceSummary = {};
    _attendanceLoading = false;
    _globalLoading = false;
    notifyListeners();
  }
}

