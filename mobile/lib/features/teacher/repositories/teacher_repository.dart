/*
|--------------------------------------------------------------------------
| File: teacher_repository.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI - Modern Enterprise Classroom Operations Platform
|
| Purpose:
| Data repository encapsulating remote network calls, local caching,
| and offline fallback operations for the Teacher role.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/features/teacher/models/teacher_models.dart';

class TeacherRepository {
  final http.Client client;

  TeacherRepository({http.Client? client}) : client = client ?? http.Client();

  Map<String, String> _authHeaders(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  /// Fetches comprehensive dashboard data (analytics, schedule, stats)
  Future<Map<String, dynamic>> fetchDashboard(String email, String token) async {
    final cacheKey = 'teacher_dashboard_$email';
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/teacher/dashboard'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        await CacheService.set(cacheKey, data, persist: true);
        return data;
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchDashboard error: $e. Using cache.');
    }

    final cached = await CacheService.get<Map<String, dynamic>>(cacheKey);
    return cached ?? {};
  }

  /// Fetches currently active class sessions
  Future<List<TeacherSessionModel>> fetchActiveSessions(String token) async {
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/sessions/active'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['sessions'] is List)
            ? decoded['sessions'] as List
            : (decoded is List ? decoded : []);
        return list
            .map((item) => TeacherSessionModel.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchActiveSessions error: $e');
    }
    return [];
  }

  /// Starts a new classroom attendance session
  Future<Map<String, dynamic>> startSession(
    String teacherEmail,
    String subject, {
    String? room,
    required String token,
  }) async {
    try {
      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/sessions/start'),
            headers: _authHeaders(token),
            body: jsonEncode({
              'teacher_email': teacherEmail,
              'subject': subject,
              'room': ?room,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[TeacherRepository] startSession error: $e');
    }
    return {'session_id': 'SESS-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}'};
  }

  /// Closes an active attendance session on server
  Future<bool> stopSession(String sessionId, String token) async {
    try {
      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/sessions/stop'),
            headers: _authHeaders(token),
            body: jsonEncode({'session_id': sessionId}),
          )
          .timeout(const Duration(seconds: 8));

      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[TeacherRepository] stopSession error: $e');
      return false;
    }
  }

  /// Fetches roster students with current session attendance status
  Future<List<RosterStudent>> fetchClassRoster(String token, {String? sessionId}) async {
    final cacheKey = 'roster_students_${sessionId ?? "all"}';
    try {
      final res = await client
          .get(
            Uri.parse(sessionId != null
                ? '${ApiService.baseUrl}/teacher/sessions/$sessionId/roster'
                : '${ApiService.baseUrl}/teacher/students'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['students'] is List)
            ? decoded['students'] as List
            : (decoded is List ? decoded : []);

        final students = list
            .map((item) => RosterStudent.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        await CacheService.set(cacheKey, list, persist: true);
        return students;
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchClassRoster error: $e. Checking cache.');
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      return cached
          .map((item) => RosterStudent.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }

  /// Batch updates attendance statuses for manual overrides
  Future<bool> batchUpdateRoster(
    String sessionId,
    List<RosterStudent> updates,
    String token,
  ) async {
    try {
      final payload = {
        'session_id': sessionId,
        'records': updates.map((s) => {
              'student_id': s.id,
              'usn': s.usn,
              'status': s.status.label,
              'verified_by': 'Manual Faculty Override',
            }).toList(),
      };

      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/attendance/mark/batch'),
            headers: _authHeaders(token),
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 10));

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('[TeacherRepository] batchUpdateRoster error: $e');
      return false;
    }
  }

  /// Fetches at-risk students below threshold
  Future<List<AtRiskStudent>> fetchAtRiskStudents(String token) async {
    const cacheKey = 'at_risk_students_cache';
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/attendance/risk-analysis?type=below_75'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['students'] is List)
            ? decoded['students'] as List
            : (decoded is List ? decoded : []);

        final students = list
            .map((item) => AtRiskStudent.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        await CacheService.set(cacheKey, list, persist: true);
        return students;
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchAtRiskStudents error: $e');
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      return cached
          .map((item) => AtRiskStudent.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }

  /// Sends targeted attendance warning alert to student and guardian
  Future<bool> sendAtRiskAlert({
    required String studentId,
    required String parentEmail,
    required String message,
    required String token,
  }) async {
    try {
      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/notifications/send'),
            headers: _authHeaders(token),
            body: jsonEncode({
              'recipient_id': studentId,
              'parent_email': parentEmail,
              'title': 'Official Debarment Risk Warning',
              'message': message,
              'channel': 'all', // Push + Email + SMS
            }),
          )
          .timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('[TeacherRepository] sendAtRiskAlert error: $e');
      return false;
    }
  }

  /// Fetches pending and past attendance disputes
  Future<List<AttendanceDispute>> fetchDisputes(String token) async {
    const cacheKey = 'teacher_disputes_cache';
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/attendance/disputes'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['disputes'] is List)
            ? decoded['disputes'] as List
            : (decoded is List ? decoded : []);

        final disputes = list
            .map((item) => AttendanceDispute.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        await CacheService.set(cacheKey, list, persist: true);
        return disputes;
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchDisputes error: $e');
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      return cached
          .map((item) => AttendanceDispute.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }

  /// Resolves an attendance dispute with decision and remarks
  Future<bool> resolveDispute({
    required String disputeId,
    required String action, // 'approved', 'rejected', 'excused'
    required String remarks,
    required String token,
  }) async {
    try {
      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/attendance/disputes/$disputeId/resolve'),
            headers: _authHeaders(token),
            body: jsonEncode({
              'action': action,
              'remarks': remarks,
            }),
          )
          .timeout(const Duration(seconds: 8));

      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[TeacherRepository] resolveDispute error: $e');
      return false;
    }
  }

  /// Fetches command center metrics, live active sessions, risk rosters, and audit stream
  Future<TeacherTelemetry> fetchTelemetry(String token) async {
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/attendance/command-center'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return TeacherTelemetry.fromJson(data);
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchTelemetry error: $e');
    }
    return const TeacherTelemetry();
  }

  /// Broadcasts urgent classroom notification to enrolled students
  Future<bool> broadcastClassAnnouncement({
    required String subject,
    required String message,
    required String token,
  }) async {
    try {
      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/teacher/notifications/broadcast'),
            headers: _authHeaders(token),
            body: jsonEncode({
              'subject': subject,
              'message': message,
            }),
          )
          .timeout(const Duration(seconds: 8));

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('[TeacherRepository] broadcastClassAnnouncement error: $e');
      return false;
    }
  }
}
