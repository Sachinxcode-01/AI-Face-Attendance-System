/*
|--------------------------------------------------------------------------
| File: leave_controller.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| ChangeNotifier controller managing state, filtering, and API orchestration
| for the Leave Management System.
|--------------------------------------------------------------------------
*/

import 'package:flutter/foundation.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/leave/models/leave_balance.dart';
import 'package:smartface_attendance/core/network/api_service.dart';

class LeaveController extends ChangeNotifier {
  LeaveBalance? _balance;
  List<LeaveModel> _leaves = [];
  List<LeaveModel> _pendingLeaves = [];
  Map<String, dynamic> _analytics = {};
  bool _isLoading = false;
  String? _errorMessage;

  // Filters & Sorting state
  String _searchQuery = '';
  String _statusFilter = 'All'; // 'All', 'Pending', 'Approved', 'Rejected', 'Clarification'
  String _sortBy = 'Date (Newest)'; // 'Date (Newest)', 'Date (Oldest)', 'Duration (Ascending)', 'Duration (Descending)'

  // Getters
  LeaveBalance? get balance => _balance;
  List<LeaveModel> get leaves => _leaves;
  List<LeaveModel> get pendingLeaves => _pendingLeaves;
  Map<String, dynamic> get analytics => _analytics;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get statusFilter => _statusFilter;
  String get sortBy => _sortBy;

  void updateSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void updateStatusFilter(String filter) {
    _statusFilter = filter;
    notifyListeners();
  }

  void updateSortBy(String sort) {
    _sortBy = sort;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  /// Filters and sorts student leave requests based on user preferences.
  List<LeaveModel> get filteredLeaves {
    List<LeaveModel> list = List.from(_leaves);

    // Apply status filter
    if (_statusFilter != 'All') {
      list = list.where((leave) {
        final status = leave.status.toLowerCase();
        final filter = _statusFilter.toLowerCase();
        if (filter == 'clarification') {
          return leave.isClarificationRequested || status == 'clarification';
        }
        return status == filter;
      }).toList();
    }

    // Apply search query
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      list = list.where((leave) {
        return (leave.id ?? '').toLowerCase().contains(query) ||
            leave.reason.toLowerCase().contains(query) ||
            leave.leaveType.toLowerCase().contains(query);
      }).toList();
    }

    // Apply sorting
    list.sort((a, b) {
      final dateA = DateTime.tryParse(a.createdAt ?? a.startDate) ?? DateTime(1970);
      final dateB = DateTime.tryParse(b.createdAt ?? b.startDate) ?? DateTime(1970);

      switch (_sortBy) {
        case 'Date (Newest)':
          return dateB.compareTo(dateA);
        case 'Date (Oldest)':
          return dateA.compareTo(dateB);
        case 'Duration (Ascending)':
          return a.durationDays.compareTo(b.durationDays);
        case 'Duration (Descending)':
          return b.durationDays.compareTo(a.durationDays);
        default:
          return dateB.compareTo(dateA);
      }
    });

    return list;
  }

  /// Fetches the leave balances for a specific student.
  Future<void> fetchBalances(String email) async {
    _setLoading(true);
    _setError(null);
    try {
      _balance = await ApiService.getLeaveBalance(email);
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  /// Fetches all leave applications submitted by a specific student.
  Future<void> fetchStudentLeaves(String email) async {
    _setLoading(true);
    _setError(null);
    try {
      _leaves = await ApiService.getStudentLeaves(email);
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  /// Submits a new leave application.
  Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.applyLeave(data);
      final email = data['student_email'] ?? data['user_id'] ?? '';
      if (email.isNotEmpty) {
        await fetchStudentLeaves(email);
        await fetchBalances(email);
      }
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  /// Fetches pending leave applications for review (Teacher/Admin).
  Future<void> fetchPendingLeaves() async {
    _setLoading(true);
    _setError(null);
    try {
      final List<dynamic> list = await ApiService.getPendingLeaves();
      _pendingLeaves = list
          .map((item) => LeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  /// Process approval, rejection, or clarification request on a leave application.
  Future<Map<String, dynamic>> actionLeave(
    String leaveId,
    String status,
    String remarks, {
    bool isClarificationRequested = false,
  }) async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await ApiService.actionLeave(
        leaveId,
        status,
        remarks,
        isClarificationRequested: isClarificationRequested,
      );
      await fetchPendingLeaves();
      return res;
    } catch (e) {
      _setError(e.toString());
      return {'detail': e.toString()};
    } finally {
      _setLoading(false);
    }
  }

  /// Fetches administrative leave analytics.
  Future<void> fetchAnalytics() async {
    _setLoading(true);
    _setError(null);
    try {
      _analytics = await ApiService.getLeaveAnalytics();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }
}
