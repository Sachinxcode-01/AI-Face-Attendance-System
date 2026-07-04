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

class EnvConfig {
  static String? _apiUrl;
  static String? _wsUrl;
  static String? _groqApiKey;
  static String? _googleApiKey;
  static String? _faceScannerToken;
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
  static String get groqApiKey => _groqApiKey ?? 'gsk_dev_dummykey12345';
  static String get googleApiKey => _googleApiKey ?? 'AIzaSyDevDummyKey54321';
  static String get faceScannerToken =>
      _faceScannerToken ?? 'dev_scanner_secret_token_abc';
  static String get githubClientId => _githubClientId ?? 'YOUR_GITHUB_CLIENT_ID';
  static String get googleClientId => _googleClientId ?? 'YOUR_GOOGLE_CLIENT_ID';

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
      _groqApiKey = _getOrThrow('GROQ_API_KEY');
      _googleApiKey = _getOrThrow('GOOGLE_API_KEY');
      _faceScannerToken = _getOrThrow('FACE_SCANNER_TOKEN');

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
