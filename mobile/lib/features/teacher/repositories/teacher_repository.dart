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

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/features/teacher/models/teacher_models.dart';

class RepoFetchResult<T> {
  final T data;
  final bool isSuccess;
  final bool isFromCache;
  const RepoFetchResult({
    required this.data,
    required this.isSuccess,
    this.isFromCache = false,
  });
}

class TeacherRepository {
  final http.Client client;
  final Set<String> _warnedStudentIds = {};

  TeacherRepository({http.Client? client})
    : client = client ?? ApiService.client;

  Map<String, String> _authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  String _scopeCacheKey(String token, String baseKey) {
    String identifier = 'teacher';
    try {
      final parts = token.split('.');
      if (parts.length >= 2) {
        final normalized = base64Url.normalize(parts[1]);
        final payload = jsonDecode(utf8.decode(base64Url.decode(normalized)));
        identifier =
            payload['email'] ?? payload['id'] ?? payload['sub'] ?? 'teacher';
      }
    } catch (_) {}
    String origin = ApiService.serverHost;
    try {
      final uri = Uri.parse(ApiService.baseUrl);
      final portSuffix = (uri.hasPort && uri.port != 80 && uri.port != 443) ? ':${uri.port}' : '';
      final pathPart = uri.path.replaceAll(RegExp(r'/+$'), '');
      origin = '${uri.host}$portSuffix$pathPart';
    } catch (_) {}
    return '${origin}_${identifier}_$baseKey';
  }

  /// Fetches comprehensive dashboard data (analytics, schedule, stats)
  Future<RepoFetchResult<Map<String, dynamic>>> fetchDashboardResult(
    String email,
    String token,
  ) async {
    final cacheKey = _scopeCacheKey(token, 'teacher_dashboard_$email');
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
        return RepoFetchResult(data: data, isSuccess: true);
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchDashboard error: $e. Using cache.');
    }

    final cached = await CacheService.get<Map<String, dynamic>>(cacheKey);
    if (cached != null) {
      return RepoFetchResult(data: cached, isSuccess: false, isFromCache: true);
    }
    return const RepoFetchResult(data: {}, isSuccess: false);
  }

  Future<Map<String, dynamic>> fetchDashboard(
    String email,
    String token,
  ) async {
    final result = await fetchDashboardResult(email, token);
    return result.data;
  }

  /// Fetches currently active class sessions with status
  Future<RepoFetchResult<List<TeacherSessionModel>>> fetchActiveSessionsResult(
    String token,
  ) async {
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
        final sessions = list
            .map(
              (item) => TeacherSessionModel.fromJson(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList();
        return RepoFetchResult(data: sessions, isSuccess: true);
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchActiveSessions error: $e');
    }
    return const RepoFetchResult(data: [], isSuccess: false);
  }

  Future<List<TeacherSessionModel>> fetchActiveSessions(String token) async {
    final result = await fetchActiveSessionsResult(token);
    return result.data;
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
      } else {
        return {
          'error':
              'Server rejected session creation (Status ${res.statusCode})',
          'success': false,
        };
      }
    } on TimeoutException {
      debugPrint(
        '[TeacherRepository] startSession timed out. Resolving server session status...',
      );
      final active = await fetchActiveSessions(token);
      final matching = active.where(
        (s) =>
            s.teacherEmail.toLowerCase() == teacherEmail.toLowerCase() &&
            s.subject.toLowerCase() == subject.toLowerCase() &&
            (room == null || s.room.toLowerCase() == room.toLowerCase()) &&
            s.isActive,
      ).toList()
        ..sort((a, b) => b.startTime.compareTo(a.startTime));
      if (matching.isNotEmpty) {
        return {'session_id': matching.first.id, 'recovered': true};
      }
      return {'error': 'Session creation request timed out.', 'success': false};
    } catch (e) {
      debugPrint('[TeacherRepository] startSession error: $e');
      return {'error': e.toString(), 'success': false};
    }
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
  Future<RepoFetchResult<List<RosterStudent>>> fetchClassRosterResult(
    String token, {
    String? sessionId,
  }) async {
    final cacheKey = _scopeCacheKey(
      token,
      'roster_students_${sessionId ?? "all"}',
    );
    try {
      final res = await client
          .get(
            Uri.parse(
              sessionId != null
                  ? '${ApiService.baseUrl}/teacher/sessions/$sessionId/roster'
                  : '${ApiService.baseUrl}/teacher/students',
            ),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['students'] is List)
            ? decoded['students'] as List
            : (decoded is List ? decoded : []);

        final students = list
            .map(
              (item) => RosterStudent.fromJson(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList();

        await CacheService.set(cacheKey, list, persist: true);
        return RepoFetchResult(data: students, isSuccess: true);
      }
    } catch (e) {
      debugPrint(
        '[TeacherRepository] fetchClassRoster error: $e. Checking cache.',
      );
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      final students = cached
          .map(
            (item) =>
                RosterStudent.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList();
      return RepoFetchResult(
        data: students,
        isSuccess: false,
        isFromCache: true,
      );
    }
    return const RepoFetchResult(data: [], isSuccess: false);
  }

  Future<List<RosterStudent>> fetchClassRoster(
    String token, {
    String? sessionId,
  }) async {
    final result = await fetchClassRosterResult(token, sessionId: sessionId);
    return result.data;
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
        'records': updates
            .map(
              (s) => {
                'student_id': s.id,
                'usn': s.usn,
                'status': s
                    .status
                    .label, // Canonical TitleCase ('Present', 'Late', 'Absent', 'Excused')
                'verified_by': 'Manual Faculty Override',
              },
            )
            .toList(),
      };

      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/attendance/mark/batch'),
            headers: _authHeaders(token),
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200 || res.statusCode == 201) {
        try {
          final decoded = jsonDecode(res.body);
          if (decoded is Map<String, dynamic>) {
            if (decoded['success'] == false) return false;
            if (decoded['rejected'] is List &&
                (decoded['rejected'] as List).isNotEmpty) {
              return false;
            }
            if (decoded['errors'] is List &&
                (decoded['errors'] as List).isNotEmpty) {
              return false;
            }
            if (decoded['failed_count'] is num &&
                (decoded['failed_count'] as num) > 0) {
              return false;
            }
          }
        } catch (_) {}
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[TeacherRepository] batchUpdateRoster error: $e');
      return false;
    }
  }

  /// Fetches at-risk students below threshold
  Future<RepoFetchResult<List<AtRiskStudent>>> fetchAtRiskStudentsResult(
    String token,
  ) async {
    final cacheKey = _scopeCacheKey(token, 'at_risk_students_cache');
    try {
      final res = await client
          .get(
            Uri.parse(
              '${ApiService.baseUrl}/attendance/risk-analysis?type=below_75',
            ),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final list = (decoded is Map && decoded['students'] is List)
            ? decoded['students'] as List
            : (decoded is List ? decoded : []);

        final students = list.map((item) {
          final s = AtRiskStudent.fromJson(
            Map<String, dynamic>.from(item as Map),
          );
          final scopedWarningKey = _scopeCacheKey(token, 'warned_${s.id}');
          if (_warnedStudentIds.contains(scopedWarningKey)) {
            s.warningSent = true;
          }
          return s;
        }).toList();

        await CacheService.set(cacheKey, list, persist: true);
        return RepoFetchResult(data: students, isSuccess: true);
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchAtRiskStudents error: $e');
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      final students = cached.map((item) {
        final s = AtRiskStudent.fromJson(
          Map<String, dynamic>.from(item as Map),
        );
        final scopedWarningKey = _scopeCacheKey(token, 'warned_${s.id}');
        if (_warnedStudentIds.contains(scopedWarningKey)) {
          s.warningSent = true;
        }
        return s;
      }).toList();
      return RepoFetchResult(
        data: students,
        isSuccess: false,
        isFromCache: true,
      );
    }
    return const RepoFetchResult(data: [], isSuccess: false);
  }

  Future<List<AtRiskStudent>> fetchAtRiskStudents(String token) async {
    final result = await fetchAtRiskStudentsResult(token);
    return result.data;
  }

  /// Sends targeted attendance warning alert to student and guardian
  Future<bool> sendAtRiskAlert({
    required String studentId,
    String? parentEmail,
    required String message,
    required String token,
  }) async {
    try {
      final body = <String, dynamic>{
        'recipient_id': studentId,
        'title': 'Official Debarment Risk Warning',
        'message': message,
        'channel': parentEmail != null && parentEmail.isNotEmpty
            ? 'all'
            : 'student_push',
      };
      if (parentEmail != null && parentEmail.isNotEmpty) {
        body['parent_email'] = parentEmail;
      }

      final res = await client
          .post(
            Uri.parse('${ApiService.baseUrl}/notifications/send'),
            headers: _authHeaders(token),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 6));

      if (res.statusCode == 200 || res.statusCode == 201) {
        _warnedStudentIds.add(_scopeCacheKey(token, 'warned_$studentId'));
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[TeacherRepository] sendAtRiskAlert error: $e');
      return false;
    }
  }

  /// Fetches pending and past attendance disputes
  Future<RepoFetchResult<List<AttendanceDispute>>> fetchDisputesResult(
    String token,
  ) async {
    final cacheKey = _scopeCacheKey(token, 'teacher_disputes_cache');
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
            .map(
              (item) => AttendanceDispute.fromJson(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList();

        await CacheService.set(cacheKey, list, persist: true);
        return RepoFetchResult(data: disputes, isSuccess: true);
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchDisputes error: $e');
    }

    final cached = await CacheService.get<List<dynamic>>(cacheKey);
    if (cached != null) {
      final disputes = cached
          .map(
            (item) => AttendanceDispute.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
      return RepoFetchResult(
        data: disputes,
        isSuccess: false,
        isFromCache: true,
      );
    }
    return const RepoFetchResult(data: [], isSuccess: false);
  }

  Future<List<AttendanceDispute>> fetchDisputes(String token) async {
    final result = await fetchDisputesResult(token);
    return result.data;
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
            Uri.parse(
              '${ApiService.baseUrl}/attendance/disputes/$disputeId/resolve',
            ),
            headers: _authHeaders(token),
            body: jsonEncode({'action': action, 'remarks': remarks}),
          )
          .timeout(const Duration(seconds: 8));

      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[TeacherRepository] resolveDispute error: $e');
      return false;
    }
  }

  /// Fetches command center metrics, live active sessions, risk rosters, and audit stream
  Future<RepoFetchResult<TeacherTelemetry>> fetchTelemetryResult(
    String token,
  ) async {
    try {
      final res = await client
          .get(
            Uri.parse('${ApiService.baseUrl}/attendance/command-center'),
            headers: _authHeaders(token),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return RepoFetchResult(
          data: TeacherTelemetry.fromJson(data),
          isSuccess: true,
        );
      }
    } catch (e) {
      debugPrint('[TeacherRepository] fetchTelemetry error: $e');
    }
    return const RepoFetchResult(data: TeacherTelemetry(), isSuccess: false);
  }

  Future<TeacherTelemetry> fetchTelemetry(String token) async {
    final result = await fetchTelemetryResult(token);
    return result.data;
  }

  /// Broadcasts urgent classroom notification to enrolled students
  Future<bool> broadcastClassAnnouncement({
    String? sessionId,
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
              'session_id': ?sessionId,
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
