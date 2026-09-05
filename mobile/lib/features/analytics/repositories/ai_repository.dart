/*
|--------------------------------------------------------------------------
| File: ai_repository.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Repository for coordinating chatbot assistance requests and AI-driven statistics summaries.
|--------------------------------------------------------------------------
*/

import 'package:smartface_attendance/core/services/ai_service.dart';

class AIRepository {
  final AIService _service;

  AIRepository(this._service);

  Future<Map<String, dynamic>> askAI(String email, String query) async {
    return await _service.askAI(email, query);
  }

  Future<Map<String, dynamic>> directProviderQuery(String prompt) async {
    return await _service.directProviderQuery(prompt);
  }
}
