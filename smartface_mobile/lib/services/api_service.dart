import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://10.15.149.48:8000';


  // ─── Health check ─────────────────────────────────────────────────
  static Future<bool> isServerOnline() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
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

  static Future<Map<String, dynamic>> verifyLoginOtp(String email, String otp) async {
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

  static Future<Map<String, dynamic>> googleLogin(String email, String name, String role) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'name': name,
          'role': role,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password, String role) async {
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
  static Future<List<dynamic>> getSecurityLogs() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/security/logs'));
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

  static Future<Map<String, dynamic>> resetPassword(String email, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'new_password': newPassword}),
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

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data, String token) async {
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

  static Future<Map<String, dynamic>> registerBiometric(String email, String token) async {
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

  static Future<Map<String, dynamic>> uploadStudentFace(String email, File imageFile, String token) async {
    try {
      final uri = Uri.parse('$baseUrl/auth/upload-student-face?student_email=$email');
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

  static Future<Map<String, dynamic>> startSession(String teacherEmail, String subject) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/sessions/start'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'teacher_email': teacherEmail, 'subject': subject}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> markAttendance(String studentEmail, String sessionId, String qrCode) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/mark'),
        headers: {'Content-Type': 'application/json'},
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

  static Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
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

  static Future<List<dynamic>> getStudentLeaves(String email) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/leave/student/$email'));
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getPendingLeaves() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/leave/admin/pending'));
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> actionLeave(String leaveId, String status, String remarks) async {
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
  static Future<Map<String, dynamic>> uploadAvatar(File imageFile, String token) async {
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
  static Future<List<dynamic>> getNotifications(String email) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/notifications/$email'));
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
        headers: {
          'Authorization': 'Bearer $token',
        },
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

  static Future<bool> markNotificationsRead(List<String> ids, String token) async {
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

  static Future<Map<String, dynamic>> getStudentStats(String email, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student/stats/$email'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getStudentStats error: $e');
    }
    return {};
  }

  static Future<Map<String, dynamic>> getAdminStats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/stats'),
        headers: {
          'Authorization': 'Bearer $token',
        },
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
}
