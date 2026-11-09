/*
|--------------------------------------------------------------------------
| File: api_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Backwards-compatible central API client utilizing environment variables
| dynamically for all REST requests.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/leave/models/leave_balance.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';
import 'package:smartface_attendance/core/network/secure_token_storage.dart';

class ApiService {
  static http.Client client = InterceptingClient(http.Client());
  static VoidCallback? onSessionExpired;
  static ValueChanged<String>? onTokenRefreshed;

  static String get baseUrl => EnvConfig.apiUrl;

  static String get serverHost {
    try {
      final uri = Uri.parse(baseUrl);
      return uri.host;
    } catch (_) {
      return '10.40.28.48';
    }
  }

  static String get serverPort {
    try {
      final uri = Uri.parse(baseUrl);
      return uri.port == 0 ? '80' : uri.port.toString();
    } catch (_) {
      return '8000';
    }
  }

  static Future<void> init() async {
    if (baseUrl.isEmpty) {
      debugPrint(
        '[ApiService] ❌ FATAL: API_URL is empty. Check .env file is loaded and ENV dart-define is correct.',
      );
    } else {
      debugPrint('[ApiService] ✅ Initialized. Base URL: $baseUrl');
    }
  }

  /// Intercepts and parses the HTTP response safely.
  /// Handles non-JSON contents (like HTML proxy error pages) and formats errors gracefully.
  static dynamic _processResponse(http.Response response) {
    final body = response.body;
    final statusCode = response.statusCode;

    // Inspect Content-Type headers for JSON content
    final contentType = response.headers['content-type'] ?? '';
    final isJson = contentType.contains('application/json');

    if (statusCode >= 200 && statusCode < 300) {
      if (body.isEmpty) return {'success': true};
      try {
        return jsonDecode(body);
      } catch (e) {
        return {
          'error_type': 'invalid_json',
          'detail': 'Invalid response format from server.',
        };
      }
    }

    // Check if error is returned as valid JSON
    if (isJson && body.isNotEmpty) {
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) {
          final Map<String, dynamic> mapDecoded = Map<String, dynamic>.from(
            decoded,
          );
          if (mapDecoded.containsKey('detail')) {
            final detailStr = mapDecoded['detail']?.toString() ?? '';
            // Translate server proxy timeout/down strings to friendly message
            if (detailStr.toLowerCase().contains('failed to respond') ||
                detailStr.toLowerCase().contains('bad gateway') ||
                detailStr.toLowerCase().contains('service unavailable')) {
              mapDecoded['detail'] =
                  'The server is temporarily unavailable. Please try again later.';
            }
          }
          return mapDecoded;
        }
      } catch (_) {
        // Fallback to generic parsing below
      }
    }

    // Gateway timeout, down, or bad proxy responses (commonly HTML)
    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
      return {
        'error_type': 'backend_down',
        'detail':
            'The server is temporarily unavailable. Please check your connection or try again later.',
      };
    }

    // Extract HTML body snippet if plain text or html error
    if (body.toLowerCase().contains('failed to respond') ||
        body.toLowerCase().contains('application failed')) {
      return {
        'error_type': 'backend_down',
        'detail':
            'The server is temporarily unavailable. Please try again later.',
      };
    }

    return {
      'error_type': 'server_error',
      'detail': 'Server error ($statusCode). Please try again.',
    };
  }

  static Future<T> _getDashboardJson<T>(
    String route, {
    String? token,
    Duration timeout = const Duration(seconds: 5),
    required String failureMessage,
    required T Function(dynamic) parse,
  }) async {
    try {
      final response = await client
          .get(
            Uri.parse('$baseUrl$route'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null && token.isNotEmpty)
                'Authorization': 'Bearer $token',
            },
          )
          .timeout(timeout);
      if (response.statusCode != 200) throw const FormatException();
      return parse(jsonDecode(response.body));
    } catch (_) {
      throw Exception(failureMessage);
    }
  }

  /// Converts a raw network exception into a structured error map.
  ///
  /// Returns keys:
  ///   `error_type`: one of 'no_internet' | 'backend_down' | 'timeout' | 'unknown'
  ///   `detail`: human-readable message for the UI
  static Map<String, dynamic> _classifyNetworkError(Object e) {
    final msg = e.toString().toLowerCase();
    debugPrint('[ApiService] 🔴 Network error: $e');
    if (e is FormatException ||
        msg.contains('format') ||
        msg.contains('json')) {
      return {
        'error_type': 'invalid_json',
        'detail': 'Invalid response format from server.',
      };
    }
    if (e is TimeoutException ||
        msg.contains('timeoutexception') ||
        msg.contains('timed out')) {
      return {
        'error_type': 'timeout',
        'detail': 'Request timed out. Please try again.',
      };
    }
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('no address associated') ||
        msg.contains('network is unreachable') ||
        msg.contains('connection refused') ||
        baseUrl.isEmpty) {
      // Distinguish: if URL itself is valid-looking, it is backend down;
      // if it's empty or clearly wrong it is misconfiguration.
      if (baseUrl.isEmpty) {
        return {
          'error_type': 'misconfigured',
          'detail':
              'App is misconfigured (missing API URL). Please reinstall or contact support.',
        };
      }
      return {
        'error_type': 'backend_down',
        'detail':
            'Server not reachable. Check your internet connection or try again later.',
      };
    }
    if (msg.contains('handshakeexception') ||
        msg.contains('certificate') ||
        msg.contains('tlsexception')) {
      return {
        'error_type': 'ssl_error',
        'detail': 'Secure connection failed. Please try again.',
      };
    }
    return {
      'error_type': 'unknown',
      'detail': 'An unexpected error occurred. Please try again.',
    };
  }

  static Future<void> saveServerSettings(String host, String port) async {
    debugPrint(
      '[ApiService] saveServerSettings called with $host:$port. EnvConfig is locked to $baseUrl',
    );
  }

  static Future<bool> isServerOnline() async {
    try {
      final res = await client
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> testConnection(String url) async {
    try {
      final res = await client
          .get(Uri.parse('$url/health'))
          .timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>> requestLoginOtp(String email) =>
      sendLoginOtp(email);

  static Future<Map<String, dynamic>> sendLoginOtp(String email) async {
    debugPrint('[ApiService] → POST $baseUrl/auth/login-otp/send');
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/login-otp/send'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email}),
          )
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] ← Status ${response.statusCode}');
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> verifyLoginOtp(
    String email,
    String otp,
  ) async {
    debugPrint('[ApiService] → POST $baseUrl/auth/login-otp/verify');
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/login-otp/verify'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'otp': otp}),
          )
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] ← Status ${response.statusCode}');
      return normalizeAuthResponse(_processResponse(response));
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> loginWithPassword(
    String email,
    String password,
  ) async {
    debugPrint('[ApiService] → POST $baseUrl/auth/login');
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));
      debugPrint('[ApiService] ← Status ${response.statusCode}');
      return normalizeAuthResponse(_processResponse(response));
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> logout(String token) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/logout'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 4));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await client
          .get(
            Uri.parse('$baseUrl/auth/me'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
    String? idToken,
  }) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/google'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email,
              'name': name,
              'role': role,
              'avatar_url': avatarUrl,
              'idToken': idToken,
            }),
          )
          .timeout(const Duration(seconds: 15));
      return normalizeAuthResponse(_processResponse(response));
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> githubLogin(
    String code,
    String role,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/github'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'code': code, 'role': role}),
          )
          .timeout(const Duration(seconds: 15));
      return normalizeAuthResponse(_processResponse(response));
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'full_name': name,
              'email': email,
              'password': password,
              'role': role.toLowerCase(),
            }),
          )
          .timeout(const Duration(seconds: 15));
      return normalizeAuthResponse(_processResponse(response));
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/forgot-password'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email}),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<List<dynamic>> getSecurityLogs() async {
    try {
      final response = await client
          .get(Uri.parse('$baseUrl/security/logs'))
          .timeout(const Duration(seconds: 15));
      final result = _processResponse(response);
      if (result is List) {
        return result;
      }
      if (result is Map &&
          result.containsKey('data') &&
          result['data'] is List) {
        return result['data'];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/security/intruder-alert'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'camera_id': cameraId, 'type': 'intruder'}),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/reset-password'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email,
              'otp': otp,
              'new_password': newPassword,
            }),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
    String token,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/update-profile'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(data),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> uploadAvatar(
    File imageFile,
    String token,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/auth/upload-avatar');
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await client.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      final Map<String, dynamic> result =
          jsonDecode(response.body) as Map<String, dynamic>;
      final String? photoUrl =
          (result['profilePhotoUrl'] ?? result['avatar_url']) as String?;
      if (photoUrl != null) {
        result['profilePhotoUrl'] = photoUrl;
        result['avatar_url'] = photoUrl;
      }
      return result;
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteProfilePhoto(String token) async {
    try {
      final response = await client
          .delete(
            Uri.parse('$baseUrl/auth/users/me/profile-photo'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> sendChatMessage({
    required String message,
    List<Map<String, String>>? history,
    String? currentRoute,
    String? screenContext,
    String? conversationId,
    String? language,
    required String token,
  }) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/api/assistant/chat'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'message': message,
              'history': history ?? [],
              'currentRoute': currentRoute ?? '',
              'screenContext': screenContext ?? currentRoute ?? '',
              'conversationId': conversationId,
              'language': language ?? 'en',
            }),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> sendChatFeedback({
    required String responseId,
    required String rating, // 'helpful' or 'not_helpful'
    String? category,
    String? feedback,
    String? currentRoute,
    required String token,
  }) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/api/assistant/feedback'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'responseId': responseId,
              'rating': rating,
              'category': category ?? 'general',
              'feedback': feedback ?? '',
              'currentRoute': currentRoute ?? '',
            }),
          )
          .timeout(const Duration(seconds: 10));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> registerBiometric(
    String email,
    String token,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/register-biometric'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({'email': email}),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<List<dynamic>> getStudents(String token) async {
    try {
      final response = await client
          .get(
            Uri.parse('$baseUrl/auth/students'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is List) {
          return decoded;
        }
        if (decoded is Map && decoded['data'] is List) {
          return decoded['data'] as List;
        }
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

      final streamedResponse = await client.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> triggerTrainFaces(String token) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/auth/train-faces'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 30));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> askAI(String email, String query) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/ai/ask'),
            headers: {
              'Content-Type': 'application/json',
              // NOTE: The Groq API key is injected server-side by the backend.
              // It MUST NOT be sent from the Flutter client for security reasons.
              'Authorization':
                  'Bearer ${await SecureTokenStorage.getAccessToken() ?? ""}',
            },
            body: jsonEncode({'email': email, 'query': query}),
          )
          .timeout(const Duration(seconds: 30));
      return _processResponse(response);
    } catch (e) {
      return _classifyNetworkError(e);
    }
  }

  static Future<Map<String, dynamic>> startSession(
    String teacherEmail,
    String subject, [
    String? token,
  ]) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/sessions/start'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty)
            'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'teacher_email': teacherEmail, 'subject': subject}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getSessionQrToken(
    String sessionId, [
    String? token,
  ]) => _getDashboardJson(
    '/sessions/${Uri.encodeComponent(sessionId)}/qr-token',
    token: token,
    failureMessage: 'Unable to generate a secure attendance QR code.',
    parse: (data) => Map<String, dynamic>.from(data as Map),
  );

  static Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode, {
    double? latitude,
    double? longitude,
  }) async {
    try {
      final Map<String, dynamic> payload = {
        'student_email': studentEmail,
        'session_id': sessionId,
        'qr_code': qrCode,
      };
      if (latitude != null) payload['latitude'] = latitude;
      if (longitude != null) payload['longitude'] = longitude;

      final response = await client.post(
        Uri.parse('$baseUrl/attendance/mark'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Connection failed'};
    }
  }

  static Future<LeaveBalance> getLeaveBalance(String email) =>
      _getDashboardJson(
        '/leave/balance/${Uri.encodeComponent(email)}',
        timeout: const Duration(seconds: 3),
        failureMessage: 'Unable to load leave balances.',
        parse: (data) => LeaveBalance.fromJson(data as Map<String, dynamic>),
      );

  static Future<Map<String, dynamic>> applyLeave(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/leave/apply'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(data),
          )
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {
      throw Exception('Unable to submit leave application.');
    }
    throw Exception('Unable to submit leave application.');
  }

  static Future<List<LeaveModel>> getStudentLeaves(String email) =>
      _getDashboardJson(
        '/leave/student/${Uri.encodeComponent(email)}',
        timeout: const Duration(seconds: 3),
        failureMessage: 'Unable to load leave applications.',
        parse: (data) => (data as List<dynamic>)
            .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
            .toList(),
      );

  static Future<List<dynamic>> getPendingLeaves() async {
    return _getDashboardJson(
      '/leave/admin/pending',
      timeout: const Duration(seconds: 3),
      failureMessage: 'Unable to load pending leave requests.',
      parse: (data) => data as List<dynamic>,
    );
  }

  static Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks, {
    bool isClarificationRequested = false,
  }) async {
    try {
      final response = await client
          .patch(
            Uri.parse('$baseUrl/leave/action'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'leave_id': leaveId,
              'status': status,
              'remarks': remarks,
              'is_clarification_requested': isClarificationRequested,
            }),
          )
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {
      throw Exception('Unable to update leave request.');
    }
    throw Exception('Unable to update leave request.');
  }

  static Future<Map<String, dynamic>> getLeaveAnalytics() => _getDashboardJson(
    '/leave/analytics',
    timeout: const Duration(seconds: 3),
    failureMessage: 'Unable to load leave analytics.',
    parse: (data) => data as Map<String, dynamic>,
  );

  static Future<List<dynamic>> getNotifications(
    String email, [
    String? token,
  ]) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/notifications/$email'),
        headers: {
          if (token != null && token.isNotEmpty)
            'Authorization': 'Bearer $token',
        },
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
      final response = await client.get(
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
      final response = await client.patch(
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

  static Future<bool> updateNotificationPreferences({
    required bool email,
    required bool push,
    required bool inApp,
    required String token,
  }) async {
    try {
      final response = await client.patch(
        Uri.parse('$baseUrl/auth/notification-preferences'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'email': email, 'push': push, 'in_app': inApp}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('updateNotificationPreferences error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>> postAnnouncement({
    required String title,
    required String message,
    String? role,
    String? department,
    String? priority,
    String? type,
    required String token,
  }) async {
    try {
      final Map<String, dynamic> payload = {'title': title, 'message': message};
      if (role != null) payload['role'] = role;
      if (department != null) payload['department'] = department;
      if (priority != null) payload['priority'] = priority;
      if (type != null) payload['type'] = type;

      final response = await client.post(
        Uri.parse('$baseUrl/notifications/announcement'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('postAnnouncement error: $e');
      return {'detail': 'Connection failed'};
    }
  }

  static Future<List<dynamic>> getTimetable(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/academic/timetable'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getTimetable error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> getCalendarEvents(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/academic/calendar'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getCalendarEvents error: $e');
    }
    return {};
  }

  static Future<Map<String, dynamic>> postAIChat(
    String message,
    List<dynamic> history,
    String token,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'message': message, 'history': history}),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('postAIChat error: $e');
      return {'detail': 'Connection failed'};
    }
  }

  static Future<StudentStatsModel?> getStudentStats(
    String email,
    String token,
  ) async {
    try {
      final response = await client.get(
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

  // ── Parent Section API Endpoints ──────────────────────────────────────────
  static Future<List<dynamic>> getParentWards(String token) async {
    return _getDashboardJson(
      '/parent/children',
      token: token,
      failureMessage: 'Unable to load linked students.',
      parse: (data) => data as List<dynamic>,
    );
  }

  static Future<Map<String, dynamic>> getWardStats(
    String wardEmail,
    String token,
  ) async {
    return _getDashboardJson(
      '/parent/child/stats/${Uri.encodeComponent(wardEmail)}',
      token: token,
      failureMessage: 'Unable to load student attendance summary.',
      parse: (data) => data as Map<String, dynamic>,
    );
  }

  static Future<List<dynamic>> getWardAttendanceLogs(
    String wardEmail,
    String token,
  ) async {
    return _getDashboardJson(
      '/parent/child/attendance-logs/${Uri.encodeComponent(wardEmail)}',
      token: token,
      failureMessage: 'Unable to load student attendance history.',
      parse: (data) => data as List<dynamic>,
    );
  }

  static Future<List<LeaveModel>> getWardLeaves(
    String wardEmail,
    String token,
  ) async {
    return _getDashboardJson(
      '/parent/child/leaves/${Uri.encodeComponent(wardEmail)}',
      token: token,
      failureMessage: 'Unable to load student leave requests.',
      parse: (data) => (data as List<dynamic>)
          .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  static Future<Map<String, dynamic>> getAdminStats(String token) async {
    return _getDashboardJson(
      '/admin/stats',
      token: token,
      failureMessage: 'Unable to load admin dashboard metrics.',
      parse: (data) => data as Map<String, dynamic>,
    );
  }

  static Future<Map<String, dynamic>> getManagementSummary(
    String token, {
    required bool isDepartment,
  }) => _getDashboardJson(
    isDepartment ? '/management/hod/summary' : '/management/principal/summary',
    token: token,
    failureMessage: isDepartment
        ? 'Unable to load department summary.'
        : 'Unable to load institution summary.',
    parse: (data) => data as Map<String, dynamic>,
  );

  static Future<Map<String, dynamic>> getManagementHealthScore(String token) =>
      _getDashboardJson(
        '/management/health-score',
        token: token,
        failureMessage: 'Unable to load institution health score.',
        parse: (data) => data as Map<String, dynamic>,
      );

  static Future<Map<String, dynamic>> getManagementCriticalRisk(String token) =>
      _getDashboardJson(
        '/management/risk/critical',
        token: token,
        failureMessage: 'Unable to load critical student risks.',
        parse: (data) => data as Map<String, dynamic>,
      );

  static Future<Map<String, dynamic>> getManagementUsers(
    String token, {
    int page = 1,
    int limit = 100,
  }) => _getDashboardJson(
    '/management/users?page=$page&limit=$limit',
    token: token,
    failureMessage: 'Unable to load users.',
    parse: (data) => data as Map<String, dynamic>,
  );

  static Future<Map<String, dynamic>> getPredictiveRisk(
    String token, {
    double threshold = 0.75,
  }) => _getDashboardJson(
    '/analytics/predictive-risk?threshold=$threshold',
    token: token,
    failureMessage: 'Unable to load predictive risk analytics.',
    parse: (data) => data as Map<String, dynamic>,
  );

  static Future<Map<String, dynamic>> getTimetableInsights(String token) =>
      _getDashboardJson(
        '/analytics/timetable-insights',
        token: token,
        failureMessage: 'Unable to load timetable insights.',
        parse: (data) => data as Map<String, dynamic>,
      );

  static Future<Map<String, dynamic>> getStudentVelocity(
    String email,
    String token,
  ) => _getDashboardJson(
    '/analytics/student-velocity/${Uri.encodeComponent(email)}',
    token: token,
    failureMessage: 'Unable to load student attendance trend.',
    parse: (data) => data as Map<String, dynamic>,
  );

  static Future<List<dynamic>> getActivityLog(String token) =>
      _getDashboardJson(
        '/admin/activity-log',
        token: token,
        failureMessage: 'Unable to load recent activity.',
        parse: (data) => data as List<dynamic>,
      );

  static Future<Map<String, dynamic>?> getStudentAnalytics(
    String email,
    String token,
  ) async {
    try {
      final response = await client.get(
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

  static Future<Map<String, dynamic>> getTeacherAnalytics(
    String teacherEmail,
    String token,
  ) => _getDashboardJson(
    '/attendance/teacher/analytics/${Uri.encodeComponent(teacherEmail)}',
    token: token,
    failureMessage: 'Unable to load teacher analytics.',
    parse: (data) => data as Map<String, dynamic>,
  );

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

      final response = await client.get(
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
      final response = await client.get(
        Uri.parse('$baseUrl/sessions/active'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
        if (data is Map && data['is_active'] == true) {
          return [Map<String, dynamic>.from(data)];
        }
        if (data is Map && data['is_active'] == false) return [];
      }
    } catch (e) {
      debugPrint('getActiveSessions error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> logoutAllSessions(String token) async {
    try {
      final response = await client.post(
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
      final response = await client.get(
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
      final response = await client.post(
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

  // ── Phase 4: Advanced Analytics ─────────────────────────────────────────

  /// Monthly attendance trends for the last 6 months.
  static Future<Map<String, dynamic>> getAnalyticsTrends(String token) =>
      _getDashboardJson(
        '/analytics/trends',
        token: token,
        failureMessage: 'Unable to load attendance trends.',
        parse: (data) => data as Map<String, dynamic>,
      );

  /// Students below a given attendance threshold (default 75%).
  static Future<Map<String, dynamic>> getRiskStudents(
    String token, {
    double threshold = 0.75,
    String? department,
  }) {
    final params = {'threshold': threshold.toString()};
    if (department != null) params['department'] = department;
    final query = Uri(queryParameters: params).query;
    return _getDashboardJson(
      '/analytics/risk-students?$query',
      token: token,
      failureMessage: 'Unable to load at-risk students.',
      parse: (data) => data as Map<String, dynamic>,
    );
  }

  /// Average attendance rates grouped by department.
  static Future<Map<String, dynamic>> getDepartmentComparison(String token) =>
      _getDashboardJson(
        '/analytics/department-comparison',
        token: token,
        failureMessage: 'Unable to load department comparison.',
        parse: (data) => data as Map<String, dynamic>,
      );

  /// Average attendance rates grouped by subject.
  static Future<Map<String, dynamic>> getSubjectWise(String token) =>
      _getDashboardJson(
        '/analytics/subject-wise',
        token: token,
        failureMessage: 'Unable to load subject attendance.',
        parse: (data) => data as Map<String, dynamic>,
      );

  /// Daily check-in heatmap data for the last 30 days.
  static Future<Map<String, dynamic>> getHeatmap(String token) =>
      _getDashboardJson(
        '/analytics/heatmap',
        token: token,
        failureMessage: 'Unable to load attendance heatmap.',
        parse: (data) => data as Map<String, dynamic>,
      );

  // ── College DB Methods ───────────────────────────────────────────────────
  /// Search verified colleges, universities, and institutions via College DB
  static Future<List<Map<String, dynamic>>> searchColleges(String query) async {
    final cleanQuery = query.trim();
    if (cleanQuery.length < 2) return [];
    try {
      final response = await client
          .get(
            Uri.parse(
              '$baseUrl/colleges/search?q=${Uri.encodeQueryComponent(cleanQuery)}',
            ),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map && decoded['results'] is List) {
          return List<Map<String, dynamic>>.from(
            (decoded['results'] as List).whereType<Map>().map(
              (e) => Map<String, dynamic>.from(e),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('[ApiService] searchColleges error: $e');
    }
    return [];
  }

  /// Retrieve full institution details for a given college ID
  static Future<Map<String, dynamic>?> getCollegeDetails(String id) async {
    if (id.trim().isEmpty) return null;
    try {
      final response = await client
          .get(
            Uri.parse('$baseUrl/colleges/${Uri.encodeComponent(id.trim())}'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map && decoded['college'] is Map) {
          return Map<String, dynamic>.from(decoded['college']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] getCollegeDetails error: $e');
    }
    return null;
  }
}

class InterceptingClient extends http.BaseClient {
  final http.Client _inner;
  bool _isRefreshing = false;

  InterceptingClient(this._inner);

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // Intercept and inject Authorization header if access token exists
    final token = await SecureTokenStorage.getAccessToken();
    if (token != null &&
        token.isNotEmpty &&
        !request.headers.containsKey('Authorization')) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    var response = await _inner.send(request);

    if (response.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await SecureTokenStorage.getRefreshToken();
        if (refreshToken != null && refreshToken.isNotEmpty) {
          final refreshUri = Uri.parse(
            '${ApiService.baseUrl}/auth/token/refresh',
          );
          final refreshRes = await _inner.post(
            refreshUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refresh_token': refreshToken}),
          );

          if (refreshRes.statusCode == 200) {
            final data = jsonDecode(refreshRes.body);
            final newAccessToken = data['access_token'] as String;
            final newRefreshToken = data['refresh_token'] as String;

            await SecureTokenStorage.saveTokens(
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            );

            ApiService.onTokenRefreshed?.call(newAccessToken);

            final newRequest = _cloneRequest(request, newAccessToken);
            _isRefreshing = false;
            return await _inner.send(newRequest);
          }
        }
      } catch (e) {
        debugPrint('[InterceptingClient] Error refreshing token: $e');
      }

      _isRefreshing = false;
      await SecureTokenStorage.clearTokens();
      ApiService.onSessionExpired?.call();
    }

    return response;
  }

  http.BaseRequest _cloneRequest(
    http.BaseRequest request,
    String newAccessToken,
  ) {
    http.BaseRequest newRequest;
    if (request is http.Request) {
      newRequest = http.Request(request.method, request.url)
        ..bodyBytes = request.bodyBytes;
    } else if (request is http.MultipartRequest) {
      final multipartRequest =
          http.MultipartRequest(request.method, request.url)
            ..fields.addAll(request.fields)
            ..files.addAll(request.files);
      newRequest = multipartRequest;
    } else {
      newRequest = request; // Fallback
    }
    newRequest.headers.addAll(request.headers);
    newRequest.headers['Authorization'] = 'Bearer $newAccessToken';
    return newRequest;
  }
}

Map<String, dynamic> normalizeAuthResponse(Map<String, dynamic> json) {
  final normalized = Map<String, dynamic>.from(json);

  Map<String, dynamic>? userData;
  if (json['data'] is Map<String, dynamic> &&
      (json['data'] as Map<String, dynamic>)['user'] is Map<String, dynamic>) {
    userData =
        (json['data'] as Map<String, dynamic>)['user'] as Map<String, dynamic>;
  }

  final String? photoUrl =
      (json['profilePhotoUrl'] ??
              json['avatar_url'] ??
              userData?['profilePhotoUrl'] ??
              userData?['avatar_url'])
          as String?;

  if (photoUrl != null && photoUrl.isNotEmpty) {
    normalized['profilePhotoUrl'] = photoUrl;
    normalized['avatar_url'] = photoUrl;
  }

  if (json.containsKey('data') && json['data'] is Map<String, dynamic>) {
    final data = json['data'] as Map<String, dynamic>;

    if (data.containsKey('accessToken') && data['accessToken'] != null) {
      normalized['access_token'] = data['accessToken'];
      normalized['token'] = data['accessToken'];
    }
    if (data.containsKey('refreshToken') && data['refreshToken'] != null) {
      normalized['refresh_token'] = data['refreshToken'];
    }

    if (data.containsKey('user') && data['user'] is Map<String, dynamic>) {
      final user = data['user'] as Map<String, dynamic>;
      if (user.containsKey('id')) normalized['id'] = user['id'];
      if (user.containsKey('email')) normalized['email'] = user['email'];
      if (user.containsKey('name')) {
        normalized['name'] = user['name'];
        normalized['full_name'] = user['name'];
      }
      if (user.containsKey('role')) normalized['role'] = user['role'];

      if (photoUrl != null && photoUrl.isNotEmpty) {
        user['profilePhotoUrl'] = photoUrl;
        user['avatar_url'] = photoUrl;
      }

      final intro = user['introCompleted'] ?? false;
      final wizard =
          user['wizardCompleted'] ??
          user['setup_completed'] ??
          user['biometric_registered'] ??
          false;
      normalized['introCompleted'] = intro;
      normalized['wizardCompleted'] = wizard;
      normalized['biometric_registered'] = wizard;
      normalized['setup_completed'] = wizard;
    }
  } else {
    final userMap = <String, dynamic>{};
    if (json.containsKey('id')) userMap['id'] = json['id'];
    if (json.containsKey('email')) userMap['email'] = json['email'];
    if (json.containsKey('full_name') || json.containsKey('name')) {
      userMap['name'] = json['full_name'] ?? json['name'];
    }
    if (json.containsKey('role')) userMap['role'] = json['role'];
    if (photoUrl != null && photoUrl.isNotEmpty) {
      userMap['profilePhotoUrl'] = photoUrl;
      userMap['avatar_url'] = photoUrl;
    }

    final wizard =
        json['biometric_registered'] ?? json['setup_completed'] ?? false;
    userMap['introCompleted'] = json['introCompleted'] ?? false;
    userMap['wizardCompleted'] = wizard;

    normalized['success'] = json['success'] ?? !json.containsKey('detail');
    normalized['message'] = json['message'] ?? json['detail'] ?? '';
    normalized['data'] = {
      'accessToken': json['access_token'] ?? json['token'],
      'refreshToken': json['refresh_token'],
      'user': userMap,
    };

    normalized['access_token'] = json['access_token'] ?? json['token'];
    normalized['token'] = json['access_token'] ?? json['token'];
    normalized['biometric_registered'] = wizard;
    normalized['setup_completed'] = wizard;
    if (json.containsKey('full_name') || json.containsKey('name')) {
      normalized['full_name'] = json['full_name'] ?? json['name'];
      normalized['name'] = json['full_name'] ?? json['name'];
    }
  }

  return normalized;
}
