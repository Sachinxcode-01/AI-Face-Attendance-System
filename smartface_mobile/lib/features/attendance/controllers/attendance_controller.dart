/*
|--------------------------------------------------------------------------
| File: attendance_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Presentation controller that manages active session creations, leaves applications,
| and status indicators for tracking attendance requests.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/attendance/repositories/attendance_repository.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';

class AttendanceController extends ChangeNotifier {
  final AttendanceRepository _repository;
  bool _isLoading = false;
  String? _errorMessage;

  AttendanceController(this._repository);

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  Future<bool> isServerOnline() async {
    try {
      return await _repository.isServerOnline();
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> startSession(String teacherEmail, String subject) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.startSession(teacherEmail, subject);
      if (res.containsKey('detail')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.markAttendance(studentEmail, sessionId, qrCode);
      if (res.containsKey('detail') && res['detail'].toString().toLowerCase().contains('failed')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.applyLeave(data);
      if (res.containsKey('detail')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<List<LeaveModel>> getStudentLeaves(String email) async {
    _setLoading(true);
    try {
      return await _repository.getStudentLeaves(email);
    } finally {
      _setLoading(false);
    }
  }

  Future<List<dynamic>> getPendingLeaves() async {
    _setLoading(true);
    try {
      return await _repository.getPendingLeaves();
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.actionLeave(leaveId, status, remarks);
      if (res.containsKey('detail')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<StudentStatsModel?> getStudentStats(String email, String token) async {
    return await _repository.getStudentStats(email, token);
  }

  Future<Map<String, dynamic>> getAdminStats(String token) async {
    return await _repository.getAdminStats(token);
  }

  Future<List<dynamic>> getActivityLog(String token) async {
    return await _repository.getActivityLog(token);
  }

  Future<Map<String, dynamic>?> getStudentAnalytics(String email, String token) async {
    return await _repository.getStudentAnalytics(email, token);
  }

  Future<Map<String, dynamic>?> getVerificationHistory(
    String email,
    String token, {
    int page = 1,
    int limit = 20,
    String? status,
    String? month,
  }) async {
    return await _repository.getVerificationHistory(
      email,
      token,
      page: page,
      limit: limit,
      status: status,
      month: month,
    );
  }

  Future<List<dynamic>> getActiveSessions(String token) async {
    return await _repository.getActiveSessions(token);
  }

  Future<Map<String, dynamic>> getSystemTelemetry(String token) async {
    return await _repository.getSystemTelemetry(token);
  }

  Future<List<dynamic>> getSecurityLogs() async {
    return await _repository.getSecurityLogs();
  }

  Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    return await _repository.sendIntruderAlert(cameraId);
  }

  Future<Map<String, dynamic>> acknowledgeIntruderAlert(String logId, String token) async {
    return await _repository.acknowledgeIntruderAlert(logId, token);
  }
}
