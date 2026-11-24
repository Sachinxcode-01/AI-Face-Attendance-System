/*
|--------------------------------------------------------------------------
| File: teacher_controller.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI - Modern Enterprise Classroom Operations Platform
|
| Purpose:
| Centralized enterprise controller managing faculty operations, live telemetry,
| active class sessions, real-time WebSocket check-ins, at-risk triage,
| dispute management, and roster overrides with offline resilience.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/teacher/models/teacher_models.dart';
import 'package:smartface_attendance/features/teacher/repositories/teacher_repository.dart';

class TeacherController extends ChangeNotifier {
  final TeacherRepository _repository;

  TeacherController({TeacherRepository? repository})
      : _repository = repository ?? TeacherRepository();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isOffline = false;
  bool get isOffline => _isOffline;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Map<String, dynamic> _dashboardData = {};
  Map<String, dynamic> get dashboardData => _dashboardData;

  List<TeacherSessionModel> _activeSessions = [];
  List<TeacherSessionModel> get activeSessions => _activeSessions;

  TeacherSessionModel? _currentActiveSession;
  TeacherSessionModel? get currentActiveSession => _currentActiveSession;

  List<RosterStudent> _rosterStudents = [];
  List<RosterStudent> get rosterStudents => _rosterStudents;

  List<AtRiskStudent> _atRiskStudents = [];
  List<AtRiskStudent> get atRiskStudents => _atRiskStudents;

  List<AttendanceDispute> _disputes = [];
  List<AttendanceDispute> get disputes => _disputes;

  TeacherTelemetry _telemetry = const TeacherTelemetry();
  TeacherTelemetry get telemetry => _telemetry;

  final List<Map<String, dynamic>> _liveAttendees = [];
  List<Map<String, dynamic>> get liveAttendees => List.unmodifiable(_liveAttendees);

  int get pendingDisputesCount =>
      _disputes.where((d) => d.reviewStatus == 'pending').length;

  int _pendingLeavesCount = 0;
  int get pendingLeavesCount => _pendingLeavesCount;

  /// Loads core faculty operations dashboard data in parallel
  Future<void> loadDashboard(String email, String token, {bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final results = await Future.wait([
        _repository.fetchDashboard(email, token),
        _repository.fetchActiveSessions(token),
        _repository.fetchAtRiskStudents(token),
        _repository.fetchDisputes(token),
        _repository.fetchTelemetry(token),
      ]);

      _dashboardData = results[0] as Map<String, dynamic>;
      _activeSessions = results[1] as List<TeacherSessionModel>;
      _atRiskStudents = results[2] as List<AtRiskStudent>;
      _disputes = results[3] as List<AttendanceDispute>;
      _telemetry = results[4] as TeacherTelemetry;

      // Extract pending leaves if present in dashboard payload
      if (_dashboardData.containsKey('pending_leaves')) {
        _pendingLeavesCount = (_dashboardData['pending_leaves'] as num?)?.toInt() ?? 0;
      }

      // Check if user has an active session
      final matching = _activeSessions.where((s) => s.teacherEmail.toLowerCase() == email.toLowerCase());
      _currentActiveSession = matching.isNotEmpty ? matching.first : null;

      _isOffline = false;
      _errorMessage = null;
    } catch (e) {
      debugPrint('[TeacherController] loadDashboard error: $e');
      _isOffline = true;
      _errorMessage = 'Operating in cached offline mode. Tap to retry.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Starts a new classroom session
  Future<Map<String, dynamic>> startSession({
    required String teacherEmail,
    required String subject,
    String? room,
    required String token,
  }) async {
    _isLoading = true;
    notifyListeners();

    final res = await _repository.startSession(
      teacherEmail,
      subject,
      room: room,
      token: token,
    );

    final sessionId = res['session_id']?.toString() ?? 'SESS-${DateTime.now().millisecondsSinceEpoch}';
    _currentActiveSession = TeacherSessionModel(
      id: sessionId,
      subject: subject,
      room: room ?? 'Lecture Hall',
      teacherEmail: teacherEmail,
      startTime: DateTime.now(),
      isActive: true,
    );

    _isLoading = false;
    notifyListeners();
    return res;
  }

  /// Terminates the current active attendance session cleanly
  Future<bool> stopCurrentSession(String token) async {
    if (_currentActiveSession == null) return false;
    final sessionId = _currentActiveSession!.id;

    final success = await _repository.stopSession(sessionId, token);
    if (success) {
      _currentActiveSession = null;
      _activeSessions.removeWhere((s) => s.id == sessionId);
      notifyListeners();
    }
    return success;
  }

  /// Ingests real-time WebSocket check-in event (ArcFace AI or Dynamic QR)
  void onWebSocketCheckin(Map<String, dynamic> data) {
    final entry = {
      'name': data['name'] ?? data['student_name'] ?? 'Verified Student',
      'usn': data['usn'] ?? data['roll'] ?? '1SF23CS---',
      'time': 'Just now',
      'method': data['verified_by'] ?? 'QR Scan',
      'confidence': data['confidence'] != null
          ? '${(data['confidence'] * 100).toStringAsFixed(1)}%'
          : '100%',
    };

    _liveAttendees.insert(0, entry);
    if (_liveAttendees.length > 50) {
      _liveAttendees.removeLast();
    }

    // Update roster entry if matching USN is loaded
    final usn = entry['usn']?.toString().toUpperCase();
    if (usn != null) {
      for (final s in _rosterStudents) {
        if (s.usn.toUpperCase() == usn) {
          s.status = RosterStatus.present;
          break;
        }
      }
    }

    notifyListeners();
  }

  /// Fetches roster students for current session or class
  Future<void> fetchRoster(String token, {String? sessionId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _rosterStudents = await _repository.fetchClassRoster(token, sessionId: sessionId);
    } catch (e) {
      debugPrint('[TeacherController] fetchRoster error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Toggles individual student status on roster
  void updateStudentStatus(String studentId, RosterStatus status) {
    final index = _rosterStudents.indexWhere((s) => s.id == studentId);
    if (index != -1) {
      _rosterStudents[index].status = status;
      notifyListeners();
    }
  }

  /// Batch marks all roster students to a single status
  void markAllRoster(RosterStatus status) {
    for (final s in _rosterStudents) {
      s.status = status;
    }
    notifyListeners();
  }

  /// Saves manual overrides to the central backend ledger
  Future<bool> saveRosterOverrides(String sessionId, String token) async {
    _isLoading = true;
    notifyListeners();

    final success = await _repository.batchUpdateRoster(sessionId, _rosterStudents, token);
    _isLoading = false;
    notifyListeners();
    return success;
  }

  /// Fetches at-risk student radar
  Future<void> fetchAtRisk(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      _atRiskStudents = await _repository.fetchAtRiskStudents(token);
    } catch (e) {
      debugPrint('[TeacherController] fetchAtRisk error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Dispatches warning to student and guardian
  Future<bool> sendWarning(AtRiskStudent student, String token) async {
    final message =
        'Your current attendance is ${student.attendance.toStringAsFixed(1)}%, which is below the mandatory 75% university requirement. You require ${student.classesNeededFor75} consecutive attended lectures to restore compliant standing.';

    final success = await _repository.sendAtRiskAlert(
      studentId: student.id,
      parentEmail: student.parentEmail,
      message: message,
      token: token,
    );

    if (success) {
      student.warningSent = true;
      notifyListeners();
    }
    return success;
  }

  /// Dispatches warnings to all unalerted at-risk students
  Future<int> dispatchAllWarnings(String token) async {
    int dispatched = 0;
    for (final student in _atRiskStudents) {
      if (!student.warningSent) {
        final success = await sendWarning(student, token);
        if (success) dispatched++;
      }
    }
    return dispatched;
  }

  /// Resolves an attendance dispute
  Future<bool> resolveDispute({
    required String disputeId,
    required String action,
    required String remarks,
    required String token,
  }) async {
    final success = await _repository.resolveDispute(
      disputeId: disputeId,
      action: action,
      remarks: remarks,
      token: token,
    );

    if (success) {
      final index = _disputes.indexWhere((d) => d.id == disputeId);
      if (index != -1) {
        _disputes[index].reviewStatus = action == 'reject' ? 'rejected' : 'approved';
        _disputes[index].teacherRemarks = remarks;
        notifyListeners();
      }
    }
    return success;
  }
}
