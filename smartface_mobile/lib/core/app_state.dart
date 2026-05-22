import 'package:flutter/foundation.dart';

/// Global reactive state shared across the app via Provider.
class AppState extends ChangeNotifier {
  // ─── Profile ─────────────────────────────────────────────────────
  Map<String, dynamic> _profile = {};
  bool _profileLoading = false;
  String? _profileError;

  Map<String, dynamic> get profile => _profile;
  bool get profileLoading => _profileLoading;
  String? get profileError => _profileError;

  void setProfile(Map<String, dynamic> data) {
    _profile = data;
    _profileError = null;
    notifyListeners();
  }

  void setProfileLoading(bool v) {
    _profileLoading = v;
    notifyListeners();
  }

  void setProfileError(String? e) {
    _profileError = e;
    _profileLoading = false;
    notifyListeners();
  }

  // ─── Notifications ────────────────────────────────────────────────
  int _unreadCount = 0;
  List<Map<String, dynamic>> _notifications = [];

  int get unreadCount => _unreadCount;
  List<Map<String, dynamic>> get notifications => _notifications;

  void setUnreadCount(int count) {
    _unreadCount = count;
    notifyListeners();
  }

  void setNotifications(List<Map<String, dynamic>> list) {
    _notifications = list;
    _unreadCount = list.where((n) => !(n['is_read'] == true)).length;
    notifyListeners();
  }

  void markNotificationRead(String id) {
    for (final n in _notifications) {
      if (n['id'] == id) n['is_read'] = true;
    }
    _unreadCount = _notifications.where((n) => !(n['is_read'] == true)).length;
    notifyListeners();
  }

  void addNotification(Map<String, dynamic> notification) {
    _notifications.insert(0, notification);
    _unreadCount++;
    notifyListeners();
  }

  // ─── Activity / Analytics ─────────────────────────────────────────
  final List<Map<String, dynamic>> _activityLog = [];
  List<Map<String, dynamic>> get activityLog => _activityLog;

  void logActivity(String type, String message) {
    _activityLog.insert(0, {
      'type': type,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    });
    if (_activityLog.length > 100) _activityLog.removeLast();
    notifyListeners();
  }

  // ─── Attendance Summary ───────────────────────────────────────────
  Map<String, dynamic> _attendanceSummary = {};
  bool _attendanceLoading = false;

  Map<String, dynamic> get attendanceSummary => _attendanceSummary;
  bool get attendanceLoading => _attendanceLoading;

  void setAttendanceSummary(Map<String, dynamic> data) {
    _attendanceSummary = data;
    _attendanceLoading = false;
    notifyListeners();
  }

  void setAttendanceLoading(bool v) {
    _attendanceLoading = v;
    notifyListeners();
  }

  // ─── Global loading overlay (for full-screen ops) ─────────────────
  bool _globalLoading = false;
  String _globalLoadingMsg = 'Loading...';

  bool get globalLoading => _globalLoading;
  String get globalLoadingMsg => _globalLoadingMsg;

  void showGlobalLoader(String msg) {
    _globalLoading = true;
    _globalLoadingMsg = msg;
    notifyListeners();
  }

  void hideGlobalLoader() {
    _globalLoading = false;
    notifyListeners();
  }

  // ─── Reset on logout ─────────────────────────────────────────────
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
