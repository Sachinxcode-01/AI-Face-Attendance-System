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

  static String? _firebaseApiKey;
  static String? _firebaseAppId;
  static String? _firebaseMessagingSenderId;
  static String? _firebaseProjectId;
  static String? _firebaseStorageBucket;

  // Getters with fallbacks for test environments
  static String get apiUrl => _apiUrl ?? 'http://10.210.101.48:8000';
  static String get wsUrl => _wsUrl ?? 'ws://10.210.101.48:8000';
  static String get groqApiKey => _groqApiKey ?? 'gsk_dev_dummykey12345';
  static String get googleApiKey => _googleApiKey ?? 'AIzaSyDevDummyKey54321';
  static String get faceScannerToken =>
      _faceScannerToken ?? 'dev_scanner_secret_token_abc';

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

      // Firebase
      _firebaseApiKey = _getOrThrow('FIREBASE_API_KEY');
      _firebaseAppId = _getOrThrow('FIREBASE_APP_ID');
      _firebaseMessagingSenderId = _getOrThrow('FIREBASE_MESSAGING_SENDER_ID');
      _firebaseProjectId = _getOrThrow('FIREBASE_PROJECT_ID');
      _firebaseStorageBucket = _getOrThrow('FIREBASE_STORAGE_BUCKET');

      debugPrint('[EnvConfig] Config load completed successfully.');
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
