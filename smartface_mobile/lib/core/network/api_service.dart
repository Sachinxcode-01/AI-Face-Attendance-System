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

class ApiService {
  static http.Client client = http.Client();

  // In-memory mock database for Leave Management System
  static final List<LeaveModel> _mockLeaves = [
    LeaveModel(
      id: 'LV-2026-001',
      studentEmail: 'student@example.com',
      reason: 'Diagnosed with viral fever, advised bed rest for 3 days.',
      startDate: DateTime.now()
          .subtract(const Duration(days: 5))
          .toIso8601String(),
      endDate: DateTime.now()
          .subtract(const Duration(days: 3))
          .toIso8601String(),
      status: 'Approved',
      remarks:
          'Granted. Get well soon and submit medical certificate upon return.',
      createdAt: DateTime.now()
          .subtract(const Duration(days: 6))
          .toIso8601String(),
      leaveType: 'sick',
      hodStatus: 'approved',
      approvalDate: DateTime.now()
          .subtract(const Duration(days: 4))
          .toIso8601String(),
      attachmentName: 'medical_report_signed.pdf',
    ),
    LeaveModel(
      id: 'LV-2026-002',
      studentEmail: 'student@example.com',
      reason: 'Attending sibling\'s wedding ceremony in hometown.',
      startDate: DateTime.now().add(const Duration(days: 2)).toIso8601String(),
      endDate: DateTime.now().add(const Duration(days: 5)).toIso8601String(),
      status: 'Pending',
      remarks: 'Awaiting HOD department head review.',
      createdAt: DateTime.now()
          .subtract(const Duration(days: 1))
          .toIso8601String(),
      leaveType: 'personal',
      hodStatus: 'pending',
    ),
    LeaveModel(
      id: 'LV-2026-003',
      studentEmail: 'student@example.com',
      reason:
          'Attending National AI & Robotics Summit as a college representative.',
      startDate: DateTime.now().add(const Duration(days: 10)).toIso8601String(),
      endDate: DateTime.now().add(const Duration(days: 12)).toIso8601String(),
      status: 'Clarification',
      remarks:
          'Please upload the official invitation letter or event brochure.',
      createdAt: DateTime.now()
          .subtract(const Duration(days: 2))
          .toIso8601String(),
      leaveType: 'academic',
      hodStatus: 'none',
      isClarificationRequested: true,
    ),
    LeaveModel(
      id: 'LV-2026-004',
      studentEmail: 'student2@example.com',
      reason: 'Emergency family emergency requiring urgent travel.',
      startDate: DateTime.now()
          .subtract(const Duration(days: 1))
          .toIso8601String(),
      endDate: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
      status: 'Rejected',
      remarks:
          'Application submitted after the start date without prior notification.',
      createdAt: DateTime.now()
          .subtract(const Duration(days: 1))
          .toIso8601String(),
      leaveType: 'emergency',
      hodStatus: 'rejected',
      approvalDate: DateTime.now().toIso8601String(),
    ),
  ];

  static final Map<String, LeaveBalance> _mockBalances = {
    'student@example.com': const LeaveBalance(
      sick: 8,
      personal: 14,
      emergency: 5,
      academic: 10,
    ),
  };

  static String get baseUrl => EnvConfig.apiUrl;

  static String get serverHost {
    try {
      final uri = Uri.parse(baseUrl);
      return uri.host;
    } catch (_) {
      return '10.210.101.48';
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
    debugPrint('[ApiService] Initialized with EnvConfig.apiUrl: $baseUrl');
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
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/auth/login-otp/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> verifyLoginOtp(
    String email,
    String otp,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/auth/login-otp/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> loginWithPassword(
    String email,
    String password,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/auth/login-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
  }) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'name': name,
          'role': role,
          'avatar_url': avatarUrl,
        }),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
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
      final response = await client.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': name,
          'email': email,
          'password': password,
          'role': role.toLowerCase(),
        }),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await client.post(
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
      final response = await client.get(Uri.parse('$baseUrl/security/logs'));
      return jsonDecode(response.body);
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> sendIntruderAlert(String cameraId) async {
    try {
      final response = await client.post(
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
      final response = await client.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'new_password': newPassword,
        }),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      if (e is TimeoutException || e.toString().contains('TimeoutException')) {
        return {'detail': 'timeout'};
      }
      return {'detail': 'Connection failed'};
    }
  }

  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await client.get(
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
      final response = await client.post(
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
      final response = await client.post(
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
      final response = await client.get(
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

      final streamedResponse = await client.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> triggerTrainFaces(String token) async {
    try {
      final response = await client.post(
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
      final response = await client.post(
        Uri.parse('$baseUrl/ai/ask'),
        headers: {
          'Content-Type': 'application/json',
          'X-Groq-Api-Key': EnvConfig.groqApiKey, // Secure injection
        },
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

  static Future<Map<String, dynamic>> markAttendance(
    String studentEmail,
    String sessionId,
    String qrCode,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/attendance/mark'),
        headers: {
          'Content-Type': 'application/json',
          'X-Face-Scanner-Token':
              EnvConfig.faceScannerToken, // Secure injection
        },
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

  static Future<LeaveBalance> getLeaveBalance(String email) async {
    try {
      final response = await client
          .get(Uri.parse('$baseUrl/leave/balance/$email'))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return LeaveBalance.fromJson(jsonDecode(response.body));
      }
    } catch (_) {}
    return _mockBalances.putIfAbsent(email, () => LeaveBalance.initial());
  }

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
        final resMap = jsonDecode(response.body) as Map<String, dynamic>;
        final newLeave = LeaveModel.fromJson(resMap);
        _mockLeaves.add(newLeave);
        return resMap;
      }
    } catch (_) {}

    final id = 'LV-${DateTime.now().year}-${100 + _mockLeaves.length + 1}';
    final parsed = LeaveModel.fromJson({
      ...data,
      'id': id,
      'status': 'Pending',
    });
    _mockLeaves.add(parsed);

    final email = parsed.studentEmail;
    final currentBal = _mockBalances.putIfAbsent(
      email,
      () => LeaveBalance.initial(),
    );
    final duration = parsed.durationDays;
    LeaveBalance newBal;
    switch (parsed.leaveType.toLowerCase()) {
      case 'sick':
        newBal = currentBal.copyWith(
          sick: (currentBal.sick - duration).clamp(0, 100),
        );
        break;
      case 'personal':
        newBal = currentBal.copyWith(
          personal: (currentBal.personal - duration).clamp(0, 100),
        );
        break;
      case 'emergency':
        newBal = currentBal.copyWith(
          emergency: (currentBal.emergency - duration).clamp(0, 100),
        );
        break;
      case 'academic':
        newBal = currentBal.copyWith(
          academic: (currentBal.academic - duration).clamp(0, 100),
        );
        break;
      default:
        newBal = currentBal;
    }
    _mockBalances[email] = newBal;

    return {
      'id': id,
      'status': 'Pending',
      'message': 'Leave application submitted successfully (Local Mock Store)',
      ...parsed.toJson(),
    };
  }

  static Future<List<LeaveModel>> getStudentLeaves(String email) async {
    try {
      final response = await client
          .get(Uri.parse('$baseUrl/leave/student/$email'))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final List<dynamic> list = jsonDecode(response.body) as List<dynamic>;
        return list
            .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}

    return _mockLeaves.where((l) => l.studentEmail == email).toList();
  }

  static Future<List<dynamic>> getPendingLeaves() async {
    try {
      final response = await client
          .get(Uri.parse('$baseUrl/leave/admin/pending'))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (_) {}

    return _mockLeaves
        .where((l) => l.status.toLowerCase() == 'pending')
        .map((l) => l.toJson())
        .toList();
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
    } catch (_) {}

    final index = _mockLeaves.indexWhere((l) => l.id == leaveId);
    if (index != -1) {
      final old = _mockLeaves[index];
      final updated = old.copyWith(
        status: status,
        remarks: remarks,
        isClarificationRequested: isClarificationRequested,
        approvalDate: DateTime.now().toIso8601String(),
        hodStatus: status.toLowerCase() == 'approved'
            ? 'approved'
            : (status.toLowerCase() == 'rejected' ? 'rejected' : 'pending'),
      );
      _mockLeaves[index] = updated;

      if (status.toLowerCase() == 'rejected') {
        final email = old.studentEmail;
        final currentBal = _mockBalances.putIfAbsent(
          email,
          () => LeaveBalance.initial(),
        );
        final duration = old.durationDays;
        LeaveBalance newBal;
        switch (old.leaveType.toLowerCase()) {
          case 'sick':
            newBal = currentBal.copyWith(
              sick: (currentBal.sick + duration).clamp(0, 100),
            );
            break;
          case 'personal':
            newBal = currentBal.copyWith(
              personal: (currentBal.personal + duration).clamp(0, 100),
            );
            break;
          case 'emergency':
            newBal = currentBal.copyWith(
              emergency: (currentBal.emergency + duration).clamp(0, 100),
            );
            break;
          case 'academic':
            newBal = currentBal.copyWith(
              academic: (currentBal.academic + duration).clamp(0, 100),
            );
            break;
          default:
            newBal = currentBal;
        }
        _mockBalances[email] = newBal;
      }

      return {
        'message': 'Action recorded successfully (Local Mock Store)',
        'leave_id': leaveId,
        'status': status,
      };
    }
    return {'detail': 'Leave request not found'};
  }

  static Future<Map<String, dynamic>> getLeaveAnalytics() async {
    try {
      final response = await client
          .get(Uri.parse('$baseUrl/leave/analytics'))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}

    final total = _mockLeaves.length;
    final approved = _mockLeaves
        .where((l) => l.status.toLowerCase() == 'approved')
        .length;
    final approvalRate = total > 0 ? (approved / total) : 0.85;

    return {
      'total_requests': total,
      'approval_rate': approvalRate,
      'department_statistics': {
        'CSE': 45.0,
        'ECE': 25.0,
        'ME': 15.0,
        'Civil': 15.0,
      },
      'monthly_trends': {
        'Jan': 5,
        'Feb': 8,
        'Mar': 12,
        'Apr': 15,
        'May': 22,
        'Jun': 18,
      },
    };
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
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

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
        body: jsonEncode({
          'email': email,
          'push': push,
          'in_app': inApp,
        }),
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
      final Map<String, dynamic> payload = {
        'title': title,
        'message': message,
      };
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
        body: jsonEncode({
          'message': message,
          'history': history,
        }),
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

  static Future<Map<String, dynamic>> getAdminStats(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/admin/stats'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getAdminStats error: $e');
    }
    return {
      'total_students': '1247',
      'total_teachers': '86',
      'active_sessions': '3',
      'attendance_today': '89%',
      'intruder_alerts': '2',
      'pending_leaves': '4',
      'institution_attendance': 90.5,
      'department_comparison': {
        'CSE': 92.4,
        'ECE': 87.8,
        'ME': 81.2,
        'Civil': 84.5,
      },
      'risk_analysis': {
        'high_risk_count': 48,
        'medium_risk_count': 112,
        'low_risk_count': 1087,
      },
      'monthly_growth_rate': 1.2,
      'monthly_trends': {
        'Jan': 86.0,
        'Feb': 88.5,
        'Mar': 89.2,
        'Apr': 91.0,
        'May': 90.8,
        'Jun': 92.1,
      },
    };
  }

  static Future<List<dynamic>> getActivityLog(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/admin/activity-log'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      debugPrint('getActivityLog error: $e');
    }
    return [
      {
        'type': 'attendance',
        'icon': 'check_circle',
        'title': 'Attendance Marked',
        'detail': 'student@smartface.elite marked present',
        'timestamp': DateTime.now()
            .subtract(const Duration(minutes: 5))
            .toIso8601String(),
        'color': 'success',
      },
      {
        'type': 'session',
        'icon': 'play_circle',
        'title': 'Session Started',
        'detail': 'Cloud Arch by Prof. Alan',
        'timestamp': DateTime.now()
            .subtract(const Duration(hours: 1))
            .toIso8601String(),
        'color': 'info',
      },
      {
        'type': 'security',
        'icon': 'warning',
        'title': 'Security Alert',
        'detail': 'Intruder detected at Main Entrance',
        'timestamp': DateTime.now()
            .subtract(const Duration(hours: 3))
            .toIso8601String(),
        'color': 'error',
      },
    ];
  }

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

    // Fallback fully hydrated analytics payload for student sandbox
    return {
      'overall_percentage': 0.94,
      'predicted_semester_attendance': 96.0,
      'trend_direction': 'improving',
      'risk_level': 'low',
      'missable_classes': 3,
      'personal_insights': [
        {
          'text': 'Your attendance increased by 12% this month.',
          'type': 'improving',
        },
        {'text': 'You are ranked #12 in your department.', 'type': 'champion'},
        {'text': 'You need 3 more classes to reach 95%.', 'type': 'trend'},
        {'text': 'Maintain streak to avoid critical warnings.', 'type': 'risk'},
      ],
      'leaderboard': [
        {
          'name': 'Sachin K',
          'department': 'CSE',
          'rank': 12,
          'score': 94.0,
          'is_me': true,
        },
        {
          'name': 'Aditya S',
          'department': 'CSE',
          'rank': 1,
          'score': 99.0,
          'is_me': false,
        },
        {
          'name': 'Neha R',
          'department': 'ECE',
          'rank': 2,
          'score': 98.0,
          'is_me': false,
        },
        {
          'name': 'Vikram M',
          'department': 'ME',
          'rank': 3,
          'score': 97.0,
          'is_me': false,
        },
      ],
      'weekly_trends': [
        {'week': 'Wk 1', 'present': 4},
        {'week': 'Wk 2', 'present': 5},
        {'week': 'Wk 3', 'present': 3},
        {'week': 'Wk 4', 'present': 6},
        {'week': 'Wk 5', 'present': 5},
        {'week': 'Wk 6', 'present': 4},
        {'week': 'Wk 7', 'present': 5},
      ],
      'monthly_trends': [
        {'month': 'Jan', 'percentage': 88.0},
        {'month': 'Feb', 'percentage': 91.0},
        {'month': 'Mar', 'percentage': 93.0},
        {'month': 'Apr', 'percentage': 95.0},
        {'month': 'May', 'percentage': 94.0},
      ],
      'heatmap_data': {
        '2026-06-01': 'present',
        '2026-06-02': 'present',
        '2026-06-03': 'present',
        '2026-06-04': 'absent',
        '2026-06-05': 'present',
        '2026-06-08': 'present',
        '2026-06-09': 'present',
        '2026-06-10': 'present',
        '2026-06-11': 'absent',
        '2026-06-12': 'present',
        '2026-06-15': 'present',
        '2026-06-16': 'present',
        '2026-06-17': 'present',
      },
      'ai_metrics': {
        'average_confidence': 0.96,
        'lighting_quality': 'Good',
        'face_visibility': 'Excellent',
      },
    };
  }

  static Future<Map<String, dynamic>> getTeacherAnalytics(
    String teacherEmail,
    String token,
  ) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/attendance/teacher/analytics/$teacherEmail'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getTeacherAnalytics error: $e');
    }

    return {
      'class_attendance_rate': 91.2,
      'total_sessions': 42,
      'active_students': [
        {'name': 'Rohan Mehta', 'id': 'BCA22008', 'score': 98.5, 'rank': 1},
        {'name': 'Sneha Verma', 'id': 'MCA21032', 'score': 96.0, 'rank': 2},
        {'name': 'Karan Singh', 'id': 'CS22019', 'score': 95.2, 'rank': 3},
      ],
      'low_attendance_students': [
        {
          'name': 'Arjun Sharma',
          'id': 'CS21001',
          'score': 58.0,
          'subject': 'Neural Networks',
        },
        {
          'name': 'Priya Patel',
          'id': 'IT21045',
          'score': 62.0,
          'subject': 'DBMS',
        },
        {
          'name': 'Rohan J',
          'id': 'CS21098',
          'score': 68.0,
          'subject': 'Automata',
        },
      ],
      'weekly_trends': [88.0, 91.0, 78.0, 95.0, 82.0, 89.0, 93.0],
      'section_performance': {
        'CSE-5A': 94.2,
        'ECE-3B': 88.5,
        'CSE-7A': 91.0,
        'ME-5B': 79.8,
      },
    };
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
  static Future<Map<String, dynamic>> getAnalyticsTrends(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analytics/trends'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getAnalyticsTrends error: $e');
    }
    return {'trends': []};
  }

  /// Students below a given attendance threshold (default 75%).
  static Future<Map<String, dynamic>> getRiskStudents(
    String token, {
    double threshold = 0.75,
    String? department,
  }) async {
    try {
      final params = {'threshold': threshold.toString()};
      if (department != null) params['department'] = department;
      final uri = Uri.parse('$baseUrl/analytics/risk-students')
          .replace(queryParameters: params);
      final response = await client.get(
        uri,
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getRiskStudents error: $e');
    }
    return {'riskStudents': []};
  }

  /// Average attendance rates grouped by department.
  static Future<Map<String, dynamic>> getDepartmentComparison(
    String token,
  ) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analytics/department-comparison'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getDepartmentComparison error: $e');
    }
    return {'departments': []};
  }

  /// Average attendance rates grouped by subject.
  static Future<Map<String, dynamic>> getSubjectWise(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analytics/subject-wise'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getSubjectWise error: $e');
    }
    return {'subjects': []};
  }

  /// Daily check-in heatmap data for the last 30 days.
  static Future<Map<String, dynamic>> getHeatmap(String token) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analytics/heatmap'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('getHeatmap error: $e');
    }
    return {'heatmap': []};
  }
}
