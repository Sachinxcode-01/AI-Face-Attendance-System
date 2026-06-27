import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/leave_model.dart';
import '../models/student_stats_model.dart';

class ApiService {
  static String _host = '10.210.101.48';
  static String _port = '8000';

  static String get serverHost => _host;
  static String get serverPort => _port;

  static String get baseUrl => 'http://$_host:$_port';

  static Map<String, String> jsonHeaders([String? token]) => {
    'Content-Type': 'application/json',
    if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
  };

  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _host = prefs.getString('sf_server_host') ?? '10.210.101.48';
      _port = prefs.getString('sf_server_port') ?? '8000';
      debugPrint('[ApiService] Initialized with baseUrl: $baseUrl');
    } catch (e) {
      debugPrint('[ApiService] init failed: $e');
    }
  }

  static Future<void> saveServerSettings(String host, String port) async {
    _host = host;
    _port = port;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('sf_server_host', host);
      await prefs.setString('sf_server_port', port);
      debugPrint('[ApiService] Updated server settings: $baseUrl');
    } catch (e) {
      debugPrint('[ApiService] saveServerSettings failed: $e');
    }
  }

  // ─── Health check ─────────────────────────────────────────────────
  static Future<bool> isServerOnline() async {
    try {
      final apiHealth = await http
          .get(Uri.parse('$baseUrl/api/health'))
          .timeout(const Duration(seconds: 5));
      if (apiHealth.statusCode == 200) return true;

      final health = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      return health.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> sendLoginOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-otp/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> verifyLoginOtp(
    String email,
    String otp,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-otp/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> loginWithPassword(
    String email,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<dynamic>> getParentWards(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/parent/wards'),
        headers: jsonHeaders(token),
      );
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded['wards'] as List<dynamic>? ?? [];
        }
      }
    } catch (e) {
      debugPrint('getParentWards error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'name': name,
          'role': role,
          'avatar_url': avatarUrl,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': name,
          'email': email,
          'password': password,
          'role': role.toLowerCase(),
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<dynamic>> getSecurityLogs([String? token]) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/security/logs'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/security/intruder-alert'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'camera_id': cameraId, 'type': 'intruder'}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'new_password': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/update-profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> registerBiometric(
    String email,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register-biometric'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'email': email}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<dynamic>> getStudents(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/students'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getStudents error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> uploadStudentFace(
    String email,
    File imageFile,
    String token,
  ) async {
    try {
      final uri = Uri.parse(
        '$baseUrl/auth/upload-student-face?student_email=$email',
      );
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> triggerTrainFaces(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/train-faces'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> askAI(String email, String query) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'query': query}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'AI Engine offline'};
    }
  }

  static Future<Map<String, dynamic>> startSession(
    String teacherEmail,
    String subject, [
    String? token,
  ]) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/sessions/start'),
        headers: jsonHeaders(token),
        body: jsonEncode({'teacher_email': teacherEmail, 'subject': subject}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode, [
    String? token,
  ]) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/mark'),
        headers: jsonHeaders(token),
        body: jsonEncode({
          'student_email': studentEmail,
          'session_id': sessionId,
          'qr_code': qrCode,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> applyLeave(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/leave/apply'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<LeaveModel>> getStudentLeaves(String email) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/leave/student/$email'),
      );
      if (response.statusCode == 200) {
        final List<dynamic> list = jsonDecode(response.body) as List<dynamic>;
        return list
            .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('getStudentLeaves error: $e');
      return [];
    }
  }

  static Future<List<dynamic>> getPendingLeaves() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/leave/admin/pending'),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/leave/action'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'leave_id': leaveId,
          'status': status,
          'remarks': remarks,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  /// Uploads a profile avatar image as multipart/form-data.
  /// Uploads a profile avatar image as multipart/form-data.
  /// Returns map with `avatar_url` on success, or `detail` on failure.
  static Future<Map<String, dynamic>> uploadAvatar(
    File imageFile,
    String token,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/auth/upload-avatar');
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  // ─── Notifications Endpoints ─────────────────────────────────────
  static Future<List<dynamic>> getNotifications(
    String email, [
    String? token,
  ]) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/$email'),
        headers: jsonHeaders(token),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getNotifications error: $e');
    }
    return [];
  }

  static Future<int> getUnreadCount(String email, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/unread-count/$email'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['unread_count'] as int? ?? 0;
      }
    } catch (e) {
      debugPrint('getUnreadCount error: $e');
    }
    return 0;
  }

  static Future<bool> markNotificationsRead(
    List<String> ids,
    String token,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/notifications/mark-read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'ids': ids}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('markNotificationsRead error: $e');
      return false;
    }
  }

  static Future<StudentStatsModel?> getStudentStats(
    String email,
    String token,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student/stats/$email'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonMap =
            jsonDecode(response.body) as Map<String, dynamic>;
        return StudentStatsModel.fromJson(jsonMap);
      }
    } catch (e) {
      debugPrint('getStudentStats error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>> getAdminStats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/stats'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getAdminStats error: $e');
    }
    return {};
  }

  static Future<List<dynamic>> getActivityLog(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/activity-log'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getActivityLog error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>?> getStudentAnalytics(
    String email,
    String token,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/student/analytics/$email'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getStudentAnalytics error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getVerificationHistory(
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

      final response = await http.get(
        Uri.parse('$baseUrl/attendance/student/$email?$query'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getVerificationHistory error: $e');
    }
    return null;
  }

  static Future<List<dynamic>> getActiveSessions(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/sessions/active'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getActiveSessions error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> logoutAllSessions(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/sessions/logout-all'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getSystemTelemetry(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/telemetry/system'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getSystemTelemetry error: $e');
    }
    return {};
  }

  static Future<Map<String, dynamic>> acknowledgeIntruderAlert(
    String logId,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/security/acknowledge'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'log_id': logId, 'status': 'Acknowledged'}),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {'detail': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> changePassword(
    String oldPassword,
    String newPassword,
    String token,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/account/password'),
        headers: jsonHeaders(token),
        body: jsonEncode({
          'old_password': oldPassword,
          'new_password': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> deleteAccount(String token) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/account'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getNotificationSettings(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/settings/notifications'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> updateNotificationSettings(
    Map<String, bool> settings,
    String token,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/settings/notifications'),
        headers: jsonHeaders(token),
        body: jsonEncode(settings),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getChildProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/parent/child-profile'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getChildAttendance(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/parent/child-attendance'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> revokeSession(
    String sessionId,
    String token,
  ) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/auth/sessions/$sessionId'),
        headers: jsonHeaders(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<dynamic>> getLoginHistory(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/security/login-history'),
        headers: jsonHeaders(token),
      );
      if (response.statusCode == 200) {
         return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getLoginHistory error: $e');
    }
    return [];
  }
}
