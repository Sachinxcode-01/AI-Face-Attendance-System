/*
|--------------------------------------------------------------------------
| File: ai_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Presentation controller that manages chatbot state, processing indicators,
| and handles conversation inputs.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/analytics/repositories/ai_repository.dart';

class AIController extends ChangeNotifier {
  final AIRepository _repository;
  bool _isLoading = false;
  String? _errorMessage;

  AIController(this._repository);

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

  Future<Map<String, dynamic>> askAI(String email, String query) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await _repository.askAI(email, query);
      if (res.containsKey('detail') &&
          res['detail'].toString().contains('offline')) {
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

  Future<Map<String, dynamic>> directProviderQuery(String prompt) async {
    _setLoading(true);
    _setError(null);
    try {
      return await _repository.directProviderQuery(prompt);
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }
}
