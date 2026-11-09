/*
|--------------------------------------------------------------------------
| File: env_config.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Centralized configuration manager that loads and validates environment
| variables from external .env files using flutter_dotenv.
|
| Responsibilities:
| - Loads correct environment files (development/staging/production).
| - Validates existence of required keys and throws startup errors if missing.
| - Exposes typed config tokens for core services and third-party APIs.
| - Implements test-safe fallbacks to prevent late initialization crashes.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

class EnvConfig {
  static String? _apiUrl;
  static String? _wsUrl;
  static String? _githubClientId;
  static String? _googleClientId;

  static String? _firebaseApiKey;
  static String? _firebaseAppId;
  static String? _firebaseMessagingSenderId;
  static String? _firebaseProjectId;
  static String? _firebaseStorageBucket;

  // Getters with fallbacks for test environments.
  // WARNING: 10.0.2.2 is an emulator-only address and WILL fail on a real phone.
  // Release builds load .env.production which must have a valid HTTPS API_URL.
  static String get apiUrl => _apiUrl ?? '';
  static String get wsUrl => _wsUrl ?? '';
  static String get githubClientId =>
      _githubClientId ?? 'YOUR_GITHUB_CLIENT_ID';
  static String get googleClientId =>
      _googleClientId ?? 'YOUR_GOOGLE_CLIENT_ID';

  /// Dynamically updates the API URL and associated WebSocket URL in memory.
  static void updateApiUrl(String newUrl) {
    _apiUrl = newUrl.trim();
    try {
      final uri = Uri.parse(_apiUrl!);
      final wsScheme = uri.scheme == 'https' ? 'wss' : 'ws';
      final portStr = uri.hasPort ? ':${uri.port}' : '';
      _wsUrl = '$wsScheme://${uri.host}$portStr';
    } catch (_) {}
    debugPrint(
      '[EnvConfig] 🔄 Dynamically updated API URL: $_apiUrl, WS URL: $_wsUrl',
    );
  }

  // Firebase configurations
  static String get firebaseApiKey => _firebaseApiKey ?? 'AIzaSyDevFirebaseKey';
  static String get firebaseAppId => _firebaseAppId ?? '1:123456:web:dev';
  static String get firebaseMessagingSenderId =>
      _firebaseMessagingSenderId ?? '123456';
  static String get firebaseProjectId => _firebaseProjectId ?? 'smartface-dev';
  static String get firebaseStorageBucket =>
      _firebaseStorageBucket ?? 'smartface-dev.appspot.com';

  /// Loads configuration depending on the specified environment name.
  ///
  /// Parameters:
  /// - [environment]: Flavor name ('development', 'staging', 'production')
  static Future<void> load({String environment = 'development'}) async {
    final String fileName = environment == 'production'
        ? '.env.production'
        : environment == 'staging'
        ? '.env.staging'
        : '.env.development';

    debugPrint('[EnvConfig] Starting config load: $fileName');

    try {
      await dotenv.load(fileName: fileName);

      _apiUrl = _getOrThrow('API_URL');
      _wsUrl = _getOrThrow('WS_URL');

      // Check for user-saved local override in SharedPreferences
      try {
        final prefs = await SharedPreferences.getInstance();
        final savedApi =
            prefs.getString('saved_api_url') ??
            prefs.getString('sf_custom_api_url');
        if (savedApi != null && savedApi.trim().isNotEmpty) {
          updateApiUrl(savedApi.trim());
          debugPrint(
            '[EnvConfig] ⚙️ Overridden API_URL from SharedPreferences: $_apiUrl',
          );
        }
      } catch (prefErr) {
        debugPrint('[EnvConfig] Note: Could not read saved_api_url ($prefErr)');
      }

      // GitHub & Google OAuth Client IDs (Optional read to prevent boot crashes if not set)
      _githubClientId = dotenv.env['GITHUB_CLIENT_ID'];
      _googleClientId = dotenv.env['GOOGLE_CLIENT_ID'];

      // Firebase
      _firebaseApiKey = _getOrThrow('FIREBASE_API_KEY');
      _firebaseAppId = _getOrThrow('FIREBASE_APP_ID');
      _firebaseMessagingSenderId = _getOrThrow('FIREBASE_MESSAGING_SENDER_ID');
      _firebaseProjectId = _getOrThrow('FIREBASE_PROJECT_ID');
      _firebaseStorageBucket = _getOrThrow('FIREBASE_STORAGE_BUCKET');

      debugPrint('[EnvConfig] ✅ Config load completed successfully.');
      debugPrint('[EnvConfig] 🌐 Active API URL: ${_apiUrl ?? "(not set)"}');
      debugPrint('[EnvConfig] 🔒 Environment: $environment');
    } catch (e) {
      debugPrint('[EnvConfig] ❌ CRITICAL STARTUP ERROR: $e');
      rethrow;
    }
  }

  static String _getOrThrow(String key) {
    final value = dotenv.env[key];
    if (value == null || value.trim().isEmpty) {
      throw Exception(
        'Environment variable "$key" is required but is missing or empty.',
      );
    }
    return value;
  }
}
