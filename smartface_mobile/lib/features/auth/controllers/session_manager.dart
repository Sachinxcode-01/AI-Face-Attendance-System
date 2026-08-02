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

import 'package:smartface_attendance/core/network/api_service.dart';

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
  Map<String, dynamic>? _selectedWard;

  bool _onboardingCompleted = false;
  bool _introImagesCompleted = false;
  bool _introCompleted = false;
  bool _wizardCompleted = false;

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

  /// Gets the currently active selected ward details (Parent scope).
  Map<String, dynamic>? get selectedWard => _selectedWard;

  /// Sets the active selected ward details and notifies UI.
  void setSelectedWard(Map<String, dynamic>? ward) {
    _selectedWard = ward;
    notifyListeners();
  }

  bool get onboardingCompleted => _onboardingCompleted;
  bool get introImagesCompleted => _introImagesCompleted;
  bool get introCompleted => _introCompleted;
  bool get wizardCompleted => _wizardCompleted;

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

      _onboardingCompleted =
          await CacheService.get<bool>('sf_onboarding_completed') ?? false;
      _introImagesCompleted =
          await CacheService.get<bool>('sf_intro_images_completed') ?? false;
      _introCompleted =
          await CacheService.get<bool>('sf_intro_completed') ?? false;
      _wizardCompleted =
          await CacheService.get<bool>('sf_wizard_completed') ?? false;

      notifyListeners();
      if (_isLoggedIn && _token != null && _token!.isNotEmpty) {
        unawaited(refreshUserProfile());
      }
      return _isLoggedIn;
    } catch (e) {
      debugPrint('[SessionManager] init error: $e');
      return false;
    }
  }

  /// Fetches the latest authenticated profile details from the backend
  /// and synchronizes global session state and local secure storage.
  Future<void> refreshUserProfile() async {
    if (_token == null || _token!.isEmpty) return;
    try {
      final profile = await ApiService.getUserProfile(_token!);
      final String? photoUrl =
          (profile['profilePhotoUrl'] ?? profile['avatar_url']) as String?;
      final String? fullName =
          (profile['full_name'] ?? profile['name']) as String?;
      if (fullName != null && fullName.isNotEmpty) {
        _name = fullName;
        await _storage.write(key: _keyName, value: fullName);
      }
      if (photoUrl != null && photoUrl.isNotEmpty) {
        _avatarUrl = photoUrl;
        await _storage.write(key: _keyAvatarUrl, value: photoUrl);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[SessionManager] refreshUserProfile error: $e');
    }
  }

  Future<void> setOnboardingCompleted(bool value) async {
    _onboardingCompleted = value;
    await CacheService.set('sf_onboarding_completed', value, persist: true);
    notifyListeners();
  }

  Future<void> setIntroImagesCompleted(bool value) async {
    _introImagesCompleted = value;
    await CacheService.set('sf_intro_images_completed', value, persist: true);
    notifyListeners();
  }

  Future<void> setIntroCompleted(bool value) async {
    _introCompleted = value;
    await CacheService.set('sf_intro_completed', value, persist: true);
    notifyListeners();
  }

  Future<void> setWizardCompleted(bool value) async {
    _wizardCompleted = value;
    await CacheService.set('sf_wizard_completed', value, persist: true);
    notifyListeners();
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
  /// - [introCompleted]: Option to explicitly set introCompleted state
  /// - [wizardCompleted]: Option to explicitly set wizardCompleted state
  Future<void> saveSession({
    required String token,
    String? refreshToken,
    required String email,
    required String role,
    String? name,
    String? avatarUrl,
    bool biometricRegistered = false,
    bool? introCompleted,
    bool? wizardCompleted,
  }) async {
    _token = token;
    if (refreshToken != null) {
      _refreshToken = refreshToken;
    }
    _email = email;
    _role = role.toLowerCase();
    _name = name;
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      _avatarUrl = avatarUrl;
    } else if (_avatarUrl == null || _avatarUrl!.isEmpty) {
      _avatarUrl = await _storage.read(key: _keyAvatarUrl);
    }
    _biometricRegistered = biometricRegistered;
    _isLoggedIn = true;

    _onboardingCompleted = true; // Logged in implies onboarding is completed
    _introImagesCompleted =
        true; // Logged in implies intro images are completed
    if (introCompleted != null) _introCompleted = introCompleted;
    if (wizardCompleted != null) {
      _wizardCompleted = wizardCompleted;
    } else {
      _wizardCompleted = biometricRegistered;
    }

    await Future.wait([
      _storage.write(key: _keyToken, value: token),
      if (refreshToken != null)
        _storage.write(key: _keyRefreshToken, value: refreshToken),
      _storage.write(key: _keyEmail, value: email),
      _storage.write(key: _keyRole, value: role.toLowerCase()),
      if (name != null) _storage.write(key: _keyName, value: name),
      if (_avatarUrl != null && _avatarUrl!.isNotEmpty)
        _storage.write(key: _keyAvatarUrl, value: _avatarUrl!),
      _storage.write(key: _keyBiometric, value: biometricRegistered.toString()),
      CacheService.set(
        'sf_onboarding_completed',
        _onboardingCompleted,
        persist: true,
      ),
      CacheService.set(
        'sf_intro_images_completed',
        _introImagesCompleted,
        persist: true,
      ),
      CacheService.set('sf_intro_completed', _introCompleted, persist: true),
      CacheService.set('sf_wizard_completed', _wizardCompleted, persist: true),
    ]);

    notifyListeners();

    // Trigger current-user profile sync in background to ensure profilePhotoUrl is updated from backend
    unawaited(refreshUserProfile());
  }

  /// Updates only the in-memory JWT token (used during interceptor-triggered refreshes).
  void updateTokenOnly(String newToken) {
    _token = newToken;
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
    if (_token != null && _token!.isNotEmpty) {
      try {
        await ApiService.logout(_token!).timeout(const Duration(seconds: 4));
      } catch (e) {
        debugPrint('[SessionManager] Backend logout failed or timed out: $e');
      }
    }

    final wasOnboardingCompleted = _onboardingCompleted;
    final wasIntroImagesCompleted = _introImagesCompleted;
    final wasIntroCompleted = _introCompleted;
    _token = null;
    _refreshToken = null;
    _email = null;
    _role = null;
    _name = null;
    _avatarUrl = null;
    _biometricRegistered = false;
    _isLoggedIn = false;
    _introImagesCompleted = false;
    _introCompleted = false;
    _wizardCompleted = false;
    _selectedWard = null;

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

    // Restore device-level onboarding/intro flags (they are one-time tours,
    // not session state) so returning users are not forced through them again.
    if (wasOnboardingCompleted) {
      await setOnboardingCompleted(true);
    }
    if (wasIntroImagesCompleted) {
      await setIntroImagesCompleted(true);
    }
    if (wasIntroCompleted) {
      await setIntroCompleted(true);
    }

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
