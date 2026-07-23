/*
|--------------------------------------------------------------------------
| File: attendance_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Service layer coordinating QR codes, active sessions, biometric verifications,
| student leaves, and system telemetry stats endpoints.
|
| Responsibilities:
| - Converts arguments to API payload requests.
| - Implements bearer auth mappings.
| - Parses results into strongly-typed models or structured Maps.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/services/api_service.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';

class AttendanceService {
  final ApiService _api;

  AttendanceService(this._api);

  Future<bool> isServerOnline() async {
    try {
      final res = await _api.get('/health');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> startSession(
    String teacherEmail,
    String subject,
  ) async {
    try {
      final response = await _api.post(
        '/sessions/start',
        body: {'teacher_email': teacherEmail, 'subject': subject},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode,
  ) async {
    try {
      final response = await _api.post(
        '/attendance/mark',
        headers: {
          'Content-Type': 'application/json',
          'X-Face-Scanner-Token': EnvConfig
              .faceScannerToken, // Secure injection of face scanner token
        },
        body: {
          'student_email': studentEmail,
          'session_id': sessionId,
          'qr_code': qrCode,
        },
      );
      if (response.statusCode == 409) {
        return {
          'status': 'conflict',
          'detail': 'Attendance already marked for this session',
          'message': 'Attendance already marked for this session',
        };
      }
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> markAttendanceWithFace({
    required String token,
    required String sessionId,
    required List<int> imageBytes,
    required String fileName,
    http.Client? client,
  }) async {
    try {
      final uri = Uri.parse('${EnvConfig.apiUrl}/attendance/mark/face');
      final request = http.MultipartRequest('POST', uri);

      request.headers['Authorization'] = 'Bearer $token';
      request.fields['session_id'] = sessionId;

      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          imageBytes,
          filename: fileName.isNotEmpty ? fileName : 'face_scan.jpg',
        ),
      );

      final httpClient = client ?? http.Client();
      final streamedResponse = await httpClient
          .send(request)
          .timeout(const Duration(seconds: 20));

      final response = await http.Response.fromStream(streamedResponse);
      if (client == null) {
        httpClient.close();
      }

      if (response.statusCode == 400) {
        return {
          'status': 'invalid_image',
          'matched': false,
          'detail': 'Invalid image payload',
          'message': 'Invalid image payload',
        };
      }

      if (response.statusCode == 401) {
        return {
          'status': 'unauthorized',
          'matched': false,
          'detail': 'Authentication required for face attendance',
          'message': 'Authentication required',
        };
      }

      if (response.statusCode == 403) {
        return {
          'status': 'forbidden',
          'matched': false,
          'detail': 'Only students can mark face attendance',
          'message': 'Access denied',
        };
      }

      if (response.statusCode == 409) {
        return {
          'status': 'conflict',
          'matched': false,
          'detail': 'Attendance already marked for this session',
          'message': 'Attendance already marked for this session',
        };
      }

      if (response.statusCode == 413) {
        return {
          'status': 'payload_too_large',
          'matched': false,
          'detail': 'Uploaded image is too large (max 5MB)',
          'message': 'Uploaded image is too large (max 5MB)',
        };
      }

      if (response.statusCode == 415) {
        return {
          'status': 'unsupported_type',
          'matched': false,
          'detail': 'Unsupported image format',
          'message': 'Unsupported image format',
        };
      }

      if (response.statusCode == 422) {
        return {
          'status': 'mismatch',
          'matched': false,
          'detail': 'Face verification failed',
          'message': 'Face verification failed',
        };
      }

      if (response.statusCode == 429) {
        return {
          'status': 'rate_limited',
          'matched': false,
          'detail':
              'Too many verification attempts. Please wait a few minutes.',
          'message': 'Too many verification attempts',
        };
      }

      if (response.statusCode == 503) {
        return {
          'status': 'unavailable',
          'matched': false,
          'detail': 'AI face recognition service is currently unavailable',
          'message': 'AI face recognition service is currently unavailable',
        };
      }

      if (response.statusCode == 504) {
        return {
          'status': 'timeout',
          'matched': false,
          'detail': 'AI face recognition request timed out',
          'message': 'AI face recognition request timed out',
        };
      }

      final Map<String, dynamic> jsonMap =
          jsonDecode(response.body) as Map<String, dynamic>;
      return jsonMap;
    } on TimeoutException {
      return {
        'status': 'timeout',
        'matched': false,
        'detail': 'Face verification request timed out',
        'message': 'Face verification request timed out',
      };
    } catch (e) {
      return {
        'status': 'error',
        'matched': false,
        'detail': 'Connection failed: $e',
        'message': 'Connection failed',
      };
    }
  }

  Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
    try {
      final response = await _api.post('/leave/apply', body: data);
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<List<LeaveModel>> getStudentLeaves(String email) async {
    try {
      final response = await _api.get('/leave/student/$email');
      if (response.statusCode == 200) {
        final List<dynamic> list = jsonDecode(response.body) as List<dynamic>;
        return list
            .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[AttendanceService] getStudentLeaves error: $e');
    }
    return [];
  }

  Future<List<dynamic>> getPendingLeaves() async {
    try {
      final response = await _api.get('/leave/admin/pending');
      return jsonDecode(response.body);
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks,
  ) async {
    try {
      final response = await _api.patch(
        '/leave/action',
        body: {'leave_id': leaveId, 'status': status, 'remarks': remarks},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<StudentStatsModel?> getStudentStats(String email, String token) async {
    try {
      final response = await _api.get(
        '/student/stats/$email',
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonMap =
            jsonDecode(response.body) as Map<String, dynamic>;
        return StudentStatsModel.fromJson(jsonMap);
      }
    } catch (e) {
      debugPrint('[AttendanceService] getStudentStats error: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>> getAdminStats(String token) async {
    try {
      final response = await _api.get(
        '/admin/stats',
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return {};
  }

  Future<List<dynamic>> getActivityLog(String token) async {
    try {
      final response = await _api.get(
        '/admin/activity-log',
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>?> getStudentAnalytics(
    String email,
    String token,
  ) async {
    try {
      final response = await _api.get(
        '/attendance/student/analytics/$email',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> getVerificationHistory(
    String email,
    String token, {
    int page = 1,
    int limit = 20,
    String? status,
    String? month,
  }) async {
    try {
      String query = 'page=$page&limit=$limit';
      if (status != null) query += '&status=$status';
      if (month != null) query += '&month=$month';

      final response = await _api.get(
        '/attendance/student/$email?$query',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<List<dynamic>> getActiveSessions(String token) async {
    try {
      final response = await _api.get(
        '/auth/sessions/active',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>> getSystemTelemetry(String token) async {
    try {
      final response = await _api.get(
        '/telemetry/system',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return {};
  }

  Future<List<dynamic>> getSecurityLogs() async {
    try {
      final response = await _api.get('/security/logs');
      return jsonDecode(response.body);
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    try {
      final response = await _api.post(
        '/security/intruder-alert',
        body: {'camera_id': cameraId, 'type': 'intruder'},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> acknowledgeIntruderAlert(
    String logId,
    String token,
  ) async {
    try {
      final response = await _api.post(
        '/security/acknowledge',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: {'log_id': logId, 'status': 'Acknowledged'},
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {'detail': 'Connection failed: $e'};
    }
  }
}
