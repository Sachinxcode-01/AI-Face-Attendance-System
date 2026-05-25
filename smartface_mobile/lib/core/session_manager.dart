import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class SessionManager extends ChangeNotifier {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyToken = 'sf_auth_token';
  static const _keyEmail = 'sf_auth_email';
  static const _keyRole = 'sf_auth_role';
  static const _keyName = 'sf_auth_name';
  static const _keyAvatarUrl = 'sf_avatar_url';
  static const _keyRememberEmail = 'sf_remember_email';
  static const _keyBiometric = 'sf_biometric_registered';

  String? _token;
  String? _email;
  String? _role;
  String? _name;
  String? _avatarUrl;
  bool _biometricRegistered = false;
  bool _isLoggedIn = false;

  // Getters
  String? get token => _token;
  String? get email => _email;
  String? get role => _role;
  String? get name => _name;
  String? get avatarUrl => _avatarUrl;
  bool get biometricRegistered => _biometricRegistered;
  bool get isLoggedIn => _isLoggedIn;
  UserRole get userRole => UserRoleExt.fromString(_role);
  bool get isAdmin => userRole == UserRole.admin;
  bool get isStudent => userRole == UserRole.student;
  bool get isTeacher => userRole == UserRole.teacher;

  // ─── Initialize: load persisted session ─────────────────────────
  Future<bool> init() async {
    try {
      _token = await _storage.read(key: _keyToken);
      _email = await _storage.read(key: _keyEmail);
      _role = await _storage.read(key: _keyRole);
      _name = await _storage.read(key: _keyName);
      _avatarUrl = await _storage.read(key: _keyAvatarUrl);
      final bio = await _storage.read(key: _keyBiometric);
      _biometricRegistered = bio == 'true';
      _isLoggedIn = _token != null && _token!.isNotEmpty;
      notifyListeners();
      return _isLoggedIn;
    } catch (e) {
      debugPrint('[SessionManager] init error: $e');
      return false;
    }
  }

  // ─── Save after successful login ────────────────────────────────
  Future<void> saveSession({
    required String token,
    required String email,
    required String role,
    String? name,
    String? avatarUrl,
    bool biometricRegistered = false,
  }) async {
    _token = token;
    _email = email;
    _role = role;
    _name = name;
    _avatarUrl = avatarUrl;
    _biometricRegistered = biometricRegistered;
    _isLoggedIn = true;

    await Future.wait([
      _storage.write(key: _keyToken, value: token),
      _storage.write(key: _keyEmail, value: email),
      _storage.write(key: _keyRole, value: role),
      if (name != null) _storage.write(key: _keyName, value: name),
      if (avatarUrl != null)
        _storage.write(key: _keyAvatarUrl, value: avatarUrl),
      _storage.write(key: _keyBiometric, value: biometricRegistered.toString()),
    ]);

    notifyListeners();
  }

  // ─── Update avatar URL after upload ─────────────────────────────
  Future<void> updateAvatarUrl(String url) async {
    _avatarUrl = url;
    await _storage.write(key: _keyAvatarUrl, value: url);
    notifyListeners();
  }

  // ─── Update profile fields ────────────────────────────────────────
  Future<void> updateName(String name) async {
    _name = name;
    await _storage.write(key: _keyName, value: name);
    notifyListeners();
  }

  // ─── Remember email for next login ───────────────────────────────
  Future<void> saveRememberedEmail(String email) async {
    await _storage.write(key: _keyRememberEmail, value: email);
  }

  Future<String?> getRememberedEmail() async {
    return _storage.read(key: _keyRememberEmail);
  }

  Future<void> clearRememberedEmail() async {
    await _storage.delete(key: _keyRememberEmail);
  }

  // ─── Logout: clear all session data ──────────────────────────────
  Future<void> logout() async {
    _token = null;
    _email = null;
    _role = null;
    _name = null;
    _avatarUrl = null;
    _biometricRegistered = false;
    _isLoggedIn = false;

    await _storage.deleteAll();
    notifyListeners();
  }

  // ─── Check if session token looks valid (basic format) ───────────
  bool get hasValidToken {
    if (_token == null || _token!.isEmpty) return false;
    final parts = _token!.split('.');
    return parts.length == 3; // JWT structure: header.payload.signature
  }

  // ─── Build auth headers for API calls ────────────────────────────
  Map<String, String> get authHeaders => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${_token ?? ''}',
  };
}
