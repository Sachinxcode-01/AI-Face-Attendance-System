/*
|--------------------------------------------------------------------------
| File: auth_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Presentation controller that manages authentication UI forms states, loading
| indicators, and captures API operation exception logs to show clean errors.
|--------------------------------------------------------------------------
*/

import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/auth/repositories/auth_repository.dart';

class AuthController extends ChangeNotifier {
  final AuthRepository _repository;
  bool _isLoading = false;
  String? _errorMessage;

  AuthController(this._repository);

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  Future<Map<String, dynamic>> loginWithPassword(
    String email,
    String password,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.loginWithPassword(email, password);
      final token = res['access_token'] ?? res['token'];
      if (token == null || token.toString().isEmpty) {
        final err = res['detail'] ?? res['message'] ?? 'Login failed. Please check your credentials.';
        _setError(err.toString());
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> sendLoginOtp(String email) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.sendLoginOtp(email);
      if (res.containsKey('detail') &&
          res['detail'].toString().contains('failed')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> verifyLoginOtp(String email, String otp) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.verifyLoginOtp(email, otp);
      if (res.containsKey('detail') && !res.containsKey('token')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> googleLogin(
    String email,
    String name,
    String role, {
    String? avatarUrl,
    String? idToken,
  }) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.googleLogin(
        email,
        name,
        role,
        avatarUrl: avatarUrl,
        idToken: idToken,
      );
      if (res.containsKey('detail') &&
          !res.containsKey('token') &&
          !res.containsKey('access_token')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> githubLogin(String code, String role) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.githubLogin(code, role);
      if (res.containsKey('detail') &&
          !res.containsKey('token') &&
          !res.containsKey('access_token')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.register(name, email, password, role);
      if (res.containsKey('detail') &&
          !res.containsKey('token') &&
          !res.containsKey('email')) {
        _setError(res['detail'] as String);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    _setLoading(true);
    _setError(null);
    try {
      return await _repository.forgotPassword(email);
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      return await _repository.resetPassword(email, otp, newPassword);
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
    String token,
  ) async {
    _setLoading(true);
    _setError(null);
    try {
      return await _repository.updateProfile(data, token);
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> uploadAvatar(File file, String token) async {
    _setLoading(true);
    _setError(null);
    try {
      return await _repository.uploadAvatar(file, token);
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> registerBiometric(
    String email,
    String token,
  ) async {
    _setLoading(true);
    try {
      return await _repository.registerBiometric(email, token);
    } finally {
      _setLoading(false);
    }
  }
}
