/*
|--------------------------------------------------------------------------
| File: auth_repository.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Data repository handling user session credentials matching, registration requests,
| password recovery pipelines, and biometric configurations.
|--------------------------------------------------------------------------
*/

import 'dart:io';
import 'package:smartface_attendance/core/services/auth_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

class AuthRepository {
  final AuthService _authService;
  final SessionManager _sessionManager;

  AuthRepository(this._authService, this._sessionManager);

  Future<Map<String, dynamic>> loginWithPassword(String email, String password) async {
    final result = await _authService.loginWithPassword(email, password);
    if (result.containsKey('token')) {
      final String token = result['token'] as String;
      final String name = result['name'] as String? ?? 'User';
      final String role = result['role'] as String? ?? 'student';
      final String? avatarUrl = result['avatar_url'] as String?;
      await _sessionManager.saveSession(
        token: token,
        email: email,
        name: name,
        role: role,
        avatarUrl: avatarUrl,
      );
    }
    return result;
  }

  Future<Map<String, dynamic>> verifyLoginOtp(String email, String otp) async {
    final result = await _authService.verifyLoginOtp(email, otp);
    if (result.containsKey('token')) {
      final String token = result['token'] as String;
      final String name = result['name'] as String? ?? 'User';
      final String role = result['role'] as String? ?? 'student';
      final String? avatarUrl = result['avatar_url'] as String?;
      await _sessionManager.saveSession(
        token: token,
        email: email,
        name: name,
        role: role,
        avatarUrl: avatarUrl,
      );
    }
    return result;
  }

  Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
  }) async {
    final result = await _authService.googleLogin(email, name, role, avatarUrl: avatarUrl);
    if (result.containsKey('token')) {
      final String token = result['token'] as String;
      final String userRole = result['role'] as String? ?? role;
      await _sessionManager.saveSession(
        token: token,
        email: email,
        name: name,
        role: userRole,
        avatarUrl: avatarUrl,
      );
    }
    return result;
  }

  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    return await _authService.register(name, email, password, role);
  }

  Future<Map<String, dynamic>> sendLoginOtp(String email) async {
    return await _authService.sendLoginOtp(email);
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    return await _authService.forgotPassword(email);
  }

  Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    return await _authService.resetPassword(email, otp, newPassword);
  }

  Future<Map<String, dynamic>> getUserProfile(String token) async {
    return await _authService.getUserProfile(token);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data, String token) async {
    final result = await _authService.updateProfile(data, token);
    if (result.containsKey('name')) {
      await _sessionManager.saveSession(
        token: token,
        email: _sessionManager.email ?? '',
        name: result['name'] as String? ?? _sessionManager.name ?? 'User',
        role: result['role'] as String? ?? _sessionManager.role ?? 'student',
        avatarUrl: result['avatar_url'] as String? ?? _sessionManager.avatarUrl,
      );
    }
    return result;
  }

  Future<Map<String, dynamic>> registerBiometric(String email, String token) async {
    return await _authService.registerBiometric(email, token);
  }

  Future<List<dynamic>> getStudents(String token) async {
    return await _authService.getStudents(token);
  }

  Future<Map<String, dynamic>> uploadStudentFace(
    String email,
    File imageFile,
    String token,
  ) async {
    return await _authService.uploadStudentFace(email, imageFile, token);
  }

  Future<Map<String, dynamic>> triggerTrainFaces(String token) async {
    return await _authService.triggerTrainFaces(token);
  }

  Future<Map<String, dynamic>> logoutAllSessions(String token) async {
    final result = await _authService.logoutAllSessions(token);
    await _sessionManager.logout();
    return result;
  }

  Future<Map<String, dynamic>> uploadAvatar(File imageFile, String token) async {
    final result = await _authService.uploadAvatar(imageFile, token);
    if (result.containsKey('avatar_url')) {
      await _sessionManager.saveSession(
        token: token,
        email: _sessionManager.email ?? '',
        name: _sessionManager.name ?? 'User',
        role: _sessionManager.role ?? 'student',
        avatarUrl: result['avatar_url'] as String?,
      );
    }
    return result;
  }
}
