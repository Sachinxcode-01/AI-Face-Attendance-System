/*
|--------------------------------------------------------------------------
| File: auth_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Service layer coordinating auth endpoints (OTP, login, password reset,
| registration, profile details, sessions, and biometric registrations).
|
| Responsibilities:
| - Converts parameters into JSON requests and routes to ApiService.
| - Performs bearer auth header configuration.
| - Processes responses and parses standard data structures.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:smartface_attendance/core/services/api_service.dart';

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  Future<Map<String, dynamic>> sendLoginOtp(String email) async {
    try {
      final response = await _api.post(
        '/auth/login-otp/send',
        body: {'email': email},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> verifyLoginOtp(String email, String otp) async {
    try {
      final response = await _api.post(
        '/auth/login-otp/verify',
        body: {'email': email, 'otp': otp},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> loginWithPassword(
    String email,
    String password,
  ) async {
    try {
      final response = await _api.post(
        '/auth/login-password',
        body: {'email': email, 'password': password},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
  }) async {
    try {
      final response = await _api.post(
        '/auth/google',
        body: {
          'email': email,
          'name': name,
          'role': role,
          'avatar_url': avatarUrl,
        },
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    try {
      final response = await _api.post(
        '/auth/register',
        body: {
          'full_name': name,
          'email': email,
          'password': password,
          'role': role.toLowerCase(),
        },
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _api.post(
        '/auth/forgot-password',
        body: {'email': email},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await _api.post(
        '/auth/reset-password',
        body: {'email': email, 'otp': otp, 'new_password': newPassword},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await _api.get(
        '/auth/profile',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
    String token,
  ) async {
    try {
      final response = await _api.post(
        '/auth/update-profile',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: data,
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> registerBiometric(
    String email,
    String token,
  ) async {
    try {
      final response = await _api.post(
        '/auth/register-biometric',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: {'email': email},
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<List<dynamic>> getStudents(String token) async {
    try {
      final response = await _api.get(
        '/auth/students',
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

  Future<Map<String, dynamic>> uploadStudentFace(
    String email,
    File imageFile,
    String token,
  ) async {
    try {
      final uri = Uri.parse(
        '${_api.baseUrl}/auth/upload-student-face?student_email=$email',
      );
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await _api.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }

  Future<Map<String, dynamic>> triggerTrainFaces(String token) async {
    try {
      final response = await _api.post(
        '/auth/train-faces',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body);
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> logoutAllSessions(String token) async {
    try {
      final response = await _api.post(
        '/auth/sessions/logout-all',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> logout(String token) async {
    try {
      final response = await _api.post(
        '/auth/logout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return {'detail': 'Connection failed'};
    }
  }

  Future<Map<String, dynamic>> uploadAvatar(
    File imageFile,
    String token,
  ) async {
    try {
      final uri = Uri.parse('${_api.baseUrl}/auth/upload-avatar');
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await _api.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      return jsonDecode(response.body);
    } catch (e) {
      return {'detail': 'Upload failed: $e'};
    }
  }
}
