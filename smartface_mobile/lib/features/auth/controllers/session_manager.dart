/*
|--------------------------------------------------------------------------
| File: session_manager.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Manages user authentication state, session persistence, and secure token storage.
|
| Responsibilities:
| - Persists authentication JWT token, name, email, avatar, and user role.
| - Reads session state from secure storage during application bootstrap.
| - Configures authorization headers for network requests.
| - Manages login/logout flows and local session clearance.
|
| Dependencies:
| - package:flutter_secure_storage/flutter_secure_storage.dart
| - package:smartface_attendance/core/constants.dart
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';

// ======================================================
// State Management: Session Manager
// ======================================================

/// Session Manager Service
///
/// Handles:
/// - Persisted user login sessions
/// - JWT secure token storage and verification
/// - App-wide user profile caching
/// - Secure credential auto-fill/remember logic
class SessionManager extends ChangeNotifier {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyToken = 'sf_auth_token';
  static const _keyRefreshToken = 'sf_refresh_token';
  static const _keyEmail = 'sf_auth_email';
  static const _keyRole = 'sf_auth_role';
  static const _keyName = 'sf_auth_name';
  static const _keyAvatarUrl = 'sf_avatar_url';
  static const _keyRememberEmail = 'sf_remember_email';
  static const _keyBiometric = 'sf_biometric_registered';

  String? _token;
  String? _refreshToken;
  String? _email;
  String? _role;
  String? _name;
  String? _avatarUrl;
  bool _biometricRegistered = false;
  bool _isLoggedIn = false;

  // ======================================================
  // Getters
  // ======================================================

  /// Gets the currently active JWT token.
  String? get token => _token;

  /// Gets the active refresh token.
  String? get refreshToken => _refreshToken;

  /// Gets the currently authenticated user's email address.
  String? get email => _email;

  /// Gets the active user's role string.
  String? get role => _role;

  /// Gets the active user's full name.
  String? get name => _name;

  /// Gets the active user's profile picture URL.
  String? get avatarUrl => _avatarUrl;

  /// Indicates if biometric authentication registration is complete.
  bool get biometricRegistered => _biometricRegistered;

  /// Indicates whether a user is currently logged in.
  bool get isLoggedIn => _isLoggedIn;

  /// Converts the string role to the typed [UserRole] enum.
  UserRole get userRole => UserRoleExt.fromString(_role);

  /// Helper indicating if the user has an Admin role.
  bool get isAdmin => userRole == UserRole.admin;

  /// Helper indicating if the user has a Student role.
  bool get isStudent => userRole == UserRole.student;

  /// Helper indicating if the user has a Teacher role.
  bool get isTeacher => userRole == UserRole.teacher;

  /// Helper indicating if the user has a Parent role.
  bool get isParent => userRole == UserRole.parent;

  /// Helper indicating if the user has an HOD role.
  bool get isHOD => userRole == UserRole.hod;

  /// Helper indicating if the user has a Principal role.
  bool get isPrincipal => userRole == UserRole.principal;

  /// Helper indicating if the user has a Management role.
  bool get isManagement => userRole == UserRole.management;

  // ======================================================
  // Session Lifecycle Methods
  // ======================================================

  /// Initializes the session manager by reading credentials from secure storage.
  ///
  /// Returns:
  /// A boolean indicating whether a valid active session is recovered.
  Future<bool> init() async {
    try {
      _token = await _storage.read(key: _keyToken);
      _refreshToken = await _storage.read(key: _keyRefreshToken);
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

  /// Saves session credentials to local secure storage upon successful login.
  ///
  /// Parameters:
  /// - [token]: Active JWT token from backend
  /// - [refreshToken]: Active rotatable refresh token from backend
  /// - [email]: Authenticated user email
  /// - [role]: User security role (admin, teacher, student)
  /// - [name]: Optional user display name
  /// - [avatarUrl]: Optional link to avatar profile image
  /// - [biometricRegistered]: Biometric status flag
  Future<void> saveSession({
    required String token,
    String? refreshToken,
    required String email,
    required String role,
    String? name,
    String? avatarUrl,
    bool biometricRegistered = false,
  }) async {
    _token = token;
    if (refreshToken != null) {
      _refreshToken = refreshToken;
    }
    _email = email;
    _role = role;
    _name = name;
    _avatarUrl = avatarUrl;
    _biometricRegistered = biometricRegistered;
    _isLoggedIn = true;

    await Future.wait([
      _storage.write(key: _keyToken, value: token),
      if (refreshToken != null)
        _storage.write(key: _keyRefreshToken, value: refreshToken),
      _storage.write(key: _keyEmail, value: email),
      _storage.write(key: _keyRole, value: role),
      if (name != null) _storage.write(key: _keyName, value: name),
      if (avatarUrl != null)
        _storage.write(key: _keyAvatarUrl, value: avatarUrl),
      _storage.write(key: _keyBiometric, value: biometricRegistered.toString()),
    ]);

    notifyListeners();
  }

  /// Updates the user's avatar image URL locally and in secure storage.
  ///
  /// Parameters:
  /// - [url]: New avatar URL
  Future<void> updateAvatarUrl(String url) async {
    _avatarUrl = url;
    await _storage.write(key: _keyAvatarUrl, value: url);
    notifyListeners();
  }

  /// Updates the user's full name locally and in secure storage.
  ///
  /// Parameters:
  /// - [name]: New display name
  Future<void> updateName(String name) async {
    _name = name;
    await _storage.write(key: _keyName, value: name);
    notifyListeners();
  }

  // ======================================================
  // Remember Credentials Management
  // ======================================================

  /// Caches the user's email for auto-fill in future login screens.
  ///
  /// Parameters:
  /// - [email]: Email to remember
  Future<void> saveRememberedEmail(String email) async {
    await _storage.write(key: _keyRememberEmail, value: email);
  }

  /// Retrieves the saved email if user selected "Remember Me" previously.
  ///
  /// Returns:
  /// The saved email string, or null if none.
  Future<String?> getRememberedEmail() async {
    return _storage.read(key: _keyRememberEmail);
  }

  /// Deletes the remembered email from secure storage.
  Future<void> clearRememberedEmail() async {
    await _storage.delete(key: _keyRememberEmail);
  }

  // ======================================================
  // Session Clear & Headers
  // ======================================================

  /// Resets the user's session cache and wipes all secure storage variables.
  ///
  /// Used during user logout or session expiration timeouts.
  Future<void> logout() async {
    _token = null;
    _refreshToken = null;
    _email = null;
    _role = null;
    _name = null;
    _avatarUrl = null;
    _biometricRegistered = false;
    _isLoggedIn = false;

    // Clear offline chat caching and all other local caches
    await CacheService.clearAll();
    
    // Clear only session keys, preserving sf_remember_email
    await Future.wait([
      _storage.delete(key: _keyToken),
      _storage.delete(key: _keyRefreshToken),
      _storage.delete(key: _keyEmail),
      _storage.delete(key: _keyRole),
      _storage.delete(key: _keyName),
      _storage.delete(key: _keyAvatarUrl),
      _storage.delete(key: _keyBiometric),
    ]);
    
    notifyListeners();
  }

  /// Performs a basic signature check on JWT structure format.
  bool get hasValidToken {
    if (_token == null || _token!.isEmpty) return false;
    final parts = _token!.split('.');
    return parts.length == 3; // JWT structure: header.payload.signature
  }

  /// Generates the authorization header map required for authenticated API integrations.
  Map<String, String> get authHeaders => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${_token ?? ''}',
  };

  /// Sets the biometric registration status locally and persists it.
  Future<void> setBiometricRegistered(bool value) async {
    _biometricRegistered = value;
    await _storage.write(key: _keyBiometric, value: value.toString());
    notifyListeners();
  }
}
