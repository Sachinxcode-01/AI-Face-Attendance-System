/*
|--------------------------------------------------------------------------
| File: analytics_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| ChangeNotifier controller managing state, API coordination, and actions
| for student, teacher, and admin analytics dashboards.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/core/network/api_service.dart';

class AnalyticsController extends ChangeNotifier {
  Map<String, dynamic> _studentAnalytics = {};
  Map<String, dynamic> _teacherAnalytics = {};
  Map<String, dynamic> _adminAnalytics = {};
  Map<String, dynamic> _predictiveRisk = {};
  Map<String, dynamic> _timetableInsights = {};
  Map<String, dynamic> _studentVelocity = {};
  bool _isLoading = false;
  String? _errorMessage;
  String _selectedPeriod = '30 Days'; // '7 Days' | '30 Days' | 'Semester'

  // Getters
  Map<String, dynamic> get studentAnalytics => _studentAnalytics;
  Map<String, dynamic> get teacherAnalytics => _teacherAnalytics;
  Map<String, dynamic> get adminAnalytics => _adminAnalytics;
  Map<String, dynamic> get predictiveRisk => _predictiveRisk;
  Map<String, dynamic> get timetableInsights => _timetableInsights;
  Map<String, dynamic> get studentVelocity => _studentVelocity;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get selectedPeriod => _selectedPeriod;

  void updatePeriod(String period) {
    _selectedPeriod = period;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  Future<void> fetchStudentAnalytics(String email, String token) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getStudentAnalytics(email, token);
      if (res != null) {
        _studentAnalytics = res;
      } else {
        _setError('Failed to fetch student analytics');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchTeacherAnalytics(String email, String token) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getTeacherAnalytics(email, token);
      _teacherAnalytics = res;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchAdminAnalytics(String token) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getAdminStats(token);
      _adminAnalytics = res;

      final logs = await ApiService.getActivityLog(token);
      _adminAnalytics['activity_log'] = logs;

      final predRes = await ApiService.getPredictiveRisk(token);
      _predictiveRisk = predRes;

      final ttRes = await ApiService.getTimetableInsights(token);
      _timetableInsights = ttRes;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchPredictiveRisk(String token, {double threshold = 0.75}) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getPredictiveRisk(token, threshold: threshold);
      _predictiveRisk = res;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchTimetableInsights(String token) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getTimetableInsights(token);
      _timetableInsights = res;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchStudentVelocity(String email, String token) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.getStudentVelocity(email, token);
      _studentVelocity = res;
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }
}
