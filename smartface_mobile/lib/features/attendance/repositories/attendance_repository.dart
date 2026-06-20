/*
|--------------------------------------------------------------------------
| File: attendance_repository.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Repository for managing class sessions, students attendance logs, leaves
| records, security monitors, and telemetry summaries.
|--------------------------------------------------------------------------
*/

import 'package:smartface_attendance/core/services/attendance_service.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';

class AttendanceRepository {
  final AttendanceService _service;

  AttendanceRepository(this._service);

  Future<bool> isServerOnline() async {
    return await _service.isServerOnline();
  }

  Future<Map<String, dynamic>> startSession(String teacherEmail, String subject) async {
    return await _service.startSession(teacherEmail, subject);
  }

  Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode,
  ) async {
    return await _service.markAttendance(studentEmail, sessionId, qrCode);
  }

  Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
    return await _service.applyLeave(data);
  }

  Future<List<LeaveModel>> getStudentLeaves(String email) async {
    return await _service.getStudentLeaves(email);
  }

  Future<List<dynamic>> getPendingLeaves() async {
    return await _service.getPendingLeaves();
  }

  Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks,
  ) async {
    return await _service.actionLeave(leaveId, status, remarks);
  }

  Future<StudentStatsModel?> getStudentStats(String email, String token) async {
    return await _service.getStudentStats(email, token);
  }

  Future<Map<String, dynamic>> getAdminStats(String token) async {
    return await _service.getAdminStats(token);
  }

  Future<List<dynamic>> getActivityLog(String token) async {
    return await _service.getActivityLog(token);
  }

  Future<Map<String, dynamic>?> getStudentAnalytics(String email, String token) async {
    return await _service.getStudentAnalytics(email, token);
  }

  Future<Map<String, dynamic>?> getVerificationHistory(
    String email,
    String token, {
    int page = 1,
    int limit = 20,
    String? status,
    String? month,
  }) async {
    return await _service.getVerificationHistory(
      email,
      token,
      page: page,
      limit: limit,
      status: status,
      month: month,
    );
  }

  Future<List<dynamic>> getActiveSessions(String token) async {
    return await _service.getActiveSessions(token);
  }

  Future<Map<String, dynamic>> getSystemTelemetry(String token) async {
    return await _service.getSystemTelemetry(token);
  }

  Future<List<dynamic>> getSecurityLogs() async {
    return await _service.getSecurityLogs();
  }

  Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    return await _service.sendIntruderAlert(cameraId);
  }

  Future<Map<String, dynamic>> acknowledgeIntruderAlert(String logId, String token) async {
    return await _service.acknowledgeIntruderAlert(logId, token);
  }
}
