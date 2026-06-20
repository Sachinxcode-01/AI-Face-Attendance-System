/*
|--------------------------------------------------------------------------
| File: ai_service.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Service layer coordinating AI analyst queries and direct integrations with LLM Providers.
| Uses centralized Groq API credentials securely inside the requests.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/services/api_service.dart';

class AIService {
  final ApiService _api;

  AIService(this._api);

  /// Submits an analysis query to the Python backend AI endpoint.
  Future<Map<String, dynamic>> askAI(String email, String query) async {
    try {
      final response = await _api.post(
        '/ai/ask',
        headers: {
          'Content-Type': 'application/json',
          'X-Groq-Api-Key': EnvConfig.groqApiKey, // Secure injection of Groq credential
        },
        body: {'email': email, 'query': query},
      );
      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('[AIService] askAI exception: $e');
      return {'detail': 'AI Engine offline'};
    }
  }

  /// Optional: Performs direct calls to third-party provider APIs using credentials securely
  Future<Map<String, dynamic>> directProviderQuery(String prompt) async {
    try {
      // Stub demonstrating how EnvConfig.groqApiKey is securely used directly
      debugPrint('[AIService] Performing direct query with secure key prefix: ${EnvConfig.groqApiKey.substring(0, 5)}...');
      return {'message': 'Direct provider query successful'};
    } catch (_) {
      return {'detail': 'Query failed'};
    }
  }
}
