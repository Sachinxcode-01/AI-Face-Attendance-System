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

  int _accountGeneration = 0;
  String? _currentAccountEmail;
  int _mutationEpoch = 0;

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

  // Track explicit manual edits to roster rows that have not yet been committed
  final Map<String, RosterStatus> _pendingRosterEdits = {};
  bool get hasPendingRosterEdits => _pendingRosterEdits.isNotEmpty;

  List<AtRiskStudent> _atRiskStudents = [];
  List<AtRiskStudent> get atRiskStudents => _atRiskStudents;

  // In-flight guard to prevent duplicate alerts for at-risk students
  final Set<String> _inFlightWarnings = {};

  List<AttendanceDispute> _disputes = [];
  List<AttendanceDispute> get disputes => _disputes;

  TeacherTelemetry _telemetry = const TeacherTelemetry();
  TeacherTelemetry get telemetry => _telemetry;

  final List<Map<String, dynamic>> _liveAttendees = [];
  List<Map<String, dynamic>> get liveAttendees =>
      List.unmodifiable(_liveAttendees);

  int get pendingDisputesCount =>
      _disputes.where((d) => d.reviewStatus == 'pending').length;

  int _pendingLeavesCount = 0;
  int get pendingLeavesCount => _pendingLeavesCount;

  /// Handles account switching / logout: resets all controller state
  /// and invalidates in-flight asynchronous operations
  void onAccountChanged(String? email) {
    if (_currentAccountEmail != email) {
      _currentAccountEmail = email;
      _accountGeneration++;
      _mutationEpoch++;
      _clearAllState();
      notifyListeners();
    }
  }

  void _clearAllState() {
    _isLoading = false;
    _isOffline = false;
    _errorMessage = null;
    _dashboardData = {};
    _activeSessions = [];
    _currentActiveSession = null;
    _rosterStudents = [];
    _pendingRosterEdits.clear();
    _atRiskStudents = [];
    _inFlightWarnings.clear();
    _disputes = [];
    _telemetry = const TeacherTelemetry();
    _liveAttendees.clear();
    _pendingLeavesCount = 0;
  }

  /// Loads core faculty operations dashboard data in parallel
  Future<void> loadDashboard(
    String email,
    String token, {
    bool silent = false,
  }) async {
    final gen = _accountGeneration;
    final epochAtStart = _mutationEpoch;

    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final results = await Future.wait([
        _repository.fetchDashboardResult(email, token),
        _repository.fetchActiveSessionsResult(token),
        _repository.fetchAtRiskStudentsResult(token),
        _repository.fetchDisputesResult(token),
        _repository.fetchTelemetryResult(token),
      ]);

      if (gen != _accountGeneration) return;

      final dashRes = results[0] as RepoFetchResult<Map<String, dynamic>>;
      final activeRes =
          results[1] as RepoFetchResult<List<TeacherSessionModel>>;
      final atRiskRes = results[2] as RepoFetchResult<List<AtRiskStudent>>;
      final disputesRes =
          results[3] as RepoFetchResult<List<AttendanceDispute>>;
      final telemetryRes = results[4] as RepoFetchResult<TeacherTelemetry>;

      bool hasFailureOrCache =
          !dashRes.isSuccess ||
          !activeRes.isSuccess ||
          !atRiskRes.isSuccess ||
          !disputesRes.isSuccess ||
          !telemetryRes.isSuccess;

      // Update dashboard payload: preserve verified data as stale if failed
      if (dashRes.isSuccess || _dashboardData.isEmpty) {
        _dashboardData = dashRes.data;
        if (_dashboardData.containsKey('pending_leaves')) {
          _pendingLeavesCount =
              (_dashboardData['pending_leaves'] as num?)?.toInt() ?? 0;
        }
      }

      // Update active sessions if no session mutation occurred while in flight
      if (epochAtStart == _mutationEpoch) {
        if (activeRes.isSuccess || _activeSessions.isEmpty) {
          _activeSessions = activeRes.data;
          final matching = _activeSessions.where(
            (s) => s.teacherEmail.toLowerCase() == email.toLowerCase(),
          );
          _currentActiveSession = matching.isNotEmpty ? matching.first : null;
        }
      }

      // Update at-risk roster: preserve verified data if failed
      if (atRiskRes.isSuccess || _atRiskStudents.isEmpty) {
        _atRiskStudents = atRiskRes.data;
      }

      // Update disputes list
      if (disputesRes.isSuccess || _disputes.isEmpty) {
        _disputes = disputesRes.data;
      }

      // Update telemetry
      if (telemetryRes.isSuccess || _telemetry.averageAttendance == null) {
        _telemetry = telemetryRes.data;
      }

      if (hasFailureOrCache) {
        _isOffline = true;
        _errorMessage = 'Operating in cached offline mode. Tap to retry.';
      } else {
        _isOffline = false;
        _errorMessage = null;
      }
    } catch (e) {
      debugPrint('[TeacherController] loadDashboard error: $e');
      if (gen != _accountGeneration) return;
      _isOffline = true;
      _errorMessage = 'Operating in cached offline mode. Tap to retry.';
    } finally {
      if (gen == _accountGeneration) {
        _isLoading = false;
        notifyListeners();
      }
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
    _mutationEpoch++;
    notifyListeners();

    final res = await _repository.startSession(
      teacherEmail,
      subject,
      room: room,
      token: token,
    );

    final rawSessionId = res['session_id']?.toString();
    if (rawSessionId != null &&
        rawSessionId.isNotEmpty &&
        res['error'] == null) {
      _currentActiveSession = TeacherSessionModel(
        id: rawSessionId,
        subject: subject,
        room: room ?? 'Lecture Hall',
        teacherEmail: teacherEmail,
        startTime: DateTime.now(),
        isActive: true,
      );
      // Ensure it appears in active sessions list
      _activeSessions.removeWhere((s) => s.id == rawSessionId);
      _activeSessions.insert(0, _currentActiveSession!);
    } else {
      _errorMessage =
          res['error']?.toString() ?? 'Failed to start session on server.';
    }

    _isLoading = false;
    notifyListeners();
    return res;
  }

  /// Terminates the current active attendance session cleanly
  Future<bool> stopCurrentSession(String token) async {
    if (_currentActiveSession == null) return false;
    final sessionId = _currentActiveSession!.id;
    _mutationEpoch++;

    final success = await _repository.stopSession(sessionId, token);
    if (success) {
      // Clear current session only if its ID still matches the stopped sessionId
      if (_currentActiveSession?.id == sessionId) {
        _currentActiveSession = null;
      }
      // Always remove the stopped session from active list
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

    // Update roster entry if matching USN is loaded and NOT locally edited
    final usn = entry['usn']?.toString().toUpperCase();
    if (usn != null) {
      for (final s in _rosterStudents) {
        if (s.usn.toUpperCase() == usn) {
          // Keep live check-in separate from uncommitted manual draft edits
          if (!_pendingRosterEdits.containsKey(s.id)) {
            s.status = RosterStatus.present;
          }
          break;
        }
      }
    }

    notifyListeners();
  }

  /// Fetches roster students for current session or class
  Future<void> fetchRoster(String token, {String? sessionId}) async {
    final gen = _accountGeneration;
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _repository.fetchClassRosterResult(
        token,
        sessionId: sessionId,
      );
      if (gen != _accountGeneration) return;

      if (res.isSuccess || _rosterStudents.isEmpty) {
        _rosterStudents = res.data;
        _pendingRosterEdits.clear();
      }
    } catch (e) {
      debugPrint('[TeacherController] fetchRoster error: $e');
    } finally {
      if (gen == _accountGeneration) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Toggles individual student status on roster (registers manual draft edit)
  void updateStudentStatus(String studentId, RosterStatus status) {
    final index = _rosterStudents.indexWhere((s) => s.id == studentId);
    if (index != -1) {
      _rosterStudents[index].status = status;
      _pendingRosterEdits[studentId] = status;
      notifyListeners();
    }
  }

  /// Batch marks all roster students to a single status
  void markAllRoster(RosterStatus status) {
    for (final s in _rosterStudents) {
      s.status = status;
      _pendingRosterEdits[s.id] = status;
    }
    notifyListeners();
  }

  /// Saves manual overrides to the central backend ledger (only submits explicit edits)
  Future<bool> saveRosterOverrides(String sessionId, String token) async {
    if (_pendingRosterEdits.isEmpty) {
      return true;
    }

    _isLoading = true;
    notifyListeners();

    // Submit only students with explicit teacher edits
    final editedStudents = _rosterStudents
        .where((s) => _pendingRosterEdits.containsKey(s.id))
        .toList();

    final success = await _repository.batchUpdateRoster(
      sessionId,
      editedStudents,
      token,
    );

    if (success) {
      // Advance baseline for saved edits
      for (final s in editedStudents) {
        _pendingRosterEdits.remove(s.id);
      }
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  /// Fetches at-risk student radar
  Future<void> fetchAtRisk(String token) async {
    final gen = _accountGeneration;
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _repository.fetchAtRiskStudentsResult(token);
      if (gen != _accountGeneration) return;
      if (res.isSuccess || _atRiskStudents.isEmpty) {
        _atRiskStudents = res.data;
      }
    } catch (e) {
      debugPrint('[TeacherController] fetchAtRisk error: $e');
    } finally {
      if (gen == _accountGeneration) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Dispatches warning to student and guardian with per-student in-flight deduplication
  Future<bool> sendWarning(AtRiskStudent student, String token) async {
    if (student.warningSent || _inFlightWarnings.contains(student.id)) {
      return false;
    }

    _inFlightWarnings.add(student.id);

    final message =
        'Your current attendance is ${student.attendance.toStringAsFixed(1)}%, which is below the mandatory 75% university requirement. You require ${student.classesNeededFor75} consecutive attended lectures to restore compliant standing.';

    try {
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
    } finally {
      _inFlightWarnings.remove(student.id);
    }
  }

  /// Dispatches warnings to all unalerted at-risk students
  Future<int> dispatchAllWarnings(String token) async {
    int dispatched = 0;
    for (final student in _atRiskStudents) {
      if (!student.warningSent && !_inFlightWarnings.contains(student.id)) {
        final success = await sendWarning(student, token);
        if (success) dispatched++;
      }
    }
    return dispatched;
  }

  /// Resolves an attendance dispute with explicit decision mapping
  Future<bool> resolveDispute({
    required String disputeId,
    required String action,
    required String remarks,
    required String token,
  }) async {
    final norm = action.toLowerCase().trim();
    String apiAction;
    String finalReviewStatus;

    if (norm == 'reject' || norm == 'rejected') {
      apiAction = 'rejected';
      finalReviewStatus = 'rejected';
    } else if (norm == 'excused' || norm == 'excuse') {
      apiAction = 'excused';
      finalReviewStatus = 'excused';
    } else if (norm == 'approve' || norm == 'approved' || norm == 'present') {
      apiAction = 'approved';
      finalReviewStatus = 'approved';
    } else {
      debugPrint(
        '[TeacherController] Unsupported dispute resolution action: $action',
      );
      return false;
    }

    final success = await _repository.resolveDispute(
      disputeId: disputeId,
      action: apiAction,
      remarks: remarks,
      token: token,
    );

    if (success) {
      final index = _disputes.indexWhere((d) => d.id == disputeId);
      if (index != -1) {
        _disputes[index].reviewStatus = finalReviewStatus;
        _disputes[index].teacherRemarks = remarks;
        notifyListeners();
      }
    }
    return success;
  }
}
