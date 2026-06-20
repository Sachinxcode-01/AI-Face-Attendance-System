import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/leave/models/leave_balance.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;

void main() {
  group('LeaveModel Unit Tests', () {
    test('Constructor and duration calculation works', () {
      const leave = LeaveModel(
        id: 'LV-TEST-001',
        studentEmail: 'student@example.com',
        reason: 'Reason',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        leaveType: 'sick',
        status: 'Pending',
      );

      expect(leave.id, 'LV-TEST-001');
      expect(leave.studentEmail, 'student@example.com');
      expect(leave.reason, 'Reason');
      expect(leave.startDate, '2026-06-01');
      expect(leave.endDate, '2026-06-03');
      expect(leave.leaveType, 'sick');
      expect(leave.status, 'Pending');
      // Duration is 1st, 2nd, 3rd = 3 days
      expect(leave.durationDays, 3);
    });

    test('durationDays fallback when parsing fails', () {
      const leave = LeaveModel(
        studentEmail: 'a@a.com',
        reason: 'Reason',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      );
      expect(leave.durationDays, 1);
    });

    test('fromJson and toJson serialization works', () {
      final json = {
        'id': 'LV-123',
        'student_email': 'test@student.com',
        'reason': 'Medical emergency',
        'start_date': '2026-06-10',
        'end_date': '2026-06-11',
        'status': 'Approved',
        'remarks': 'Take care',
        'leave_type': 'emergency',
        'hod_status': 'approved',
        'is_clarification_requested': false,
      };

      final model = LeaveModel.fromJson(json);
      expect(model.id, 'LV-123');
      expect(model.studentEmail, 'test@student.com');
      expect(model.reason, 'Medical emergency');
      expect(model.startDate, '2026-06-10');
      expect(model.endDate, '2026-06-11');
      expect(model.status, 'Approved');
      expect(model.remarks, 'Take care');
      expect(model.leaveType, 'emergency');
      expect(model.hodStatus, 'approved');
      expect(model.isClarificationRequested, false);

      final serialized = model.toJson();
      expect(serialized['id'], 'LV-123');
      expect(serialized['student_email'], 'test@student.com');
      expect(serialized['reason'], 'Medical emergency');
      expect(serialized['start_date'], '2026-06-10');
      expect(serialized['end_date'], '2026-06-11');
      expect(serialized['status'], 'Approved');
      expect(serialized['remarks'], 'Take care');
      expect(serialized['leave_type'], 'emergency');
      expect(serialized['hod_status'], 'approved');
      expect(serialized['is_clarification_requested'], false);
    });

    test('copyWith updates fields correctly', () {
      const leave = LeaveModel(
        id: 'LV-1',
        studentEmail: 'student@example.com',
        reason: 'Reason',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
      );

      final updated = leave.copyWith(
        status: 'Approved',
        remarks: 'Approved by CSE HOD',
        hodStatus: 'approved',
      );

      expect(updated.id, 'LV-1');
      expect(updated.status, 'Approved');
      expect(updated.remarks, 'Approved by CSE HOD');
      expect(updated.hodStatus, 'approved');
    });
  });

  group('LeaveBalance Unit Tests', () {
    test('initial factory setup is correct', () {
      final balance = LeaveBalance.initial();
      expect(balance.sick, 10);
      expect(balance.personal, 15);
      expect(balance.emergency, 5);
      expect(balance.academic, 12);
      expect(balance.totalAvailable, 42);
    });

    test('fromJson and toJson works', () {
      final json = {
        'sick': 5,
        'personal': 8,
        'emergency': 2,
        'academic': 6,
      };

      final balance = LeaveBalance.fromJson(json);
      expect(balance.sick, 5);
      expect(balance.personal, 8);
      expect(balance.emergency, 2);
      expect(balance.academic, 6);
      expect(balance.totalAvailable, 21);

      final serialized = balance.toJson();
      expect(serialized['sick'], 5);
      expect(serialized['personal'], 8);
      expect(serialized['emergency'], 2);
      expect(serialized['academic'], 6);
    });

    test('copyWith updates values', () {
      final balance = LeaveBalance.initial();
      final updated = balance.copyWith(sick: 4, personal: 12);
      expect(updated.sick, 4);
      expect(updated.personal, 12);
      expect(updated.emergency, 5); // untouched
    });
  });

  group('LeaveController Unit Tests (Mock API integration)', () {
    late LeaveController controller;

    setUp(() {
      controller = LeaveController();
      // Configure mock API client to respond to calls
      ApiService.client = MockClient((request) async {
        final path = request.url.path;

        if (path.contains('/leave/balance/')) {
          return http.Response(
            '{"sick": 8, "personal": 14, "emergency": 5, "academic": 10}',
            200,
          );
        }

        if (path.contains('/leave/student/')) {
          return http.Response(
            '['
            '{"id": "LV-1", "student_email": "student@example.com", "reason": "Sick", "start_date": "2026-06-01", "end_date": "2026-06-02", "status": "Approved", "leave_type": "sick", "hod_status": "approved"},'
            '{"id": "LV-2", "student_email": "student@example.com", "reason": "Personal", "start_date": "2026-06-10", "end_date": "2026-06-11", "status": "Pending", "leave_type": "personal", "hod_status": "pending"}'
            ']',
            200,
          );
        }

        if (path.contains('/leave/apply')) {
          return http.Response(
            '{"id": "LV-3", "student_email": "student@example.com", "reason": "Applied", "start_date": "2026-06-15", "end_date": "2026-06-16", "status": "Pending", "leave_type": "personal", "hod_status": "pending"}',
            200,
          );
        }

        if (path.contains('/leave/admin/pending')) {
          return http.Response(
            '['
            '{"id": "LV-2", "student_email": "student@example.com", "reason": "Personal", "start_date": "2026-06-10", "end_date": "2026-06-11", "status": "Pending", "leave_type": "personal", "hod_status": "pending"}'
            ']',
            200,
          );
        }

        if (path.contains('/leave/action')) {
          return http.Response(
            '{"message": "Action recorded successfully", "leave_id": "LV-2", "status": "Approved"}',
            200,
          );
        }

        if (path.contains('/leave/analytics')) {
          return http.Response(
            '{"total_requests": 10, "approval_rate": 0.8, "department_statistics": {"CSE": 5}, "monthly_trends": {"Jan": 2}}',
            200,
          );
        }

        return http.Response('{"detail": "Not found"}', 404);
      });
    });

    tearDown(() {
      ApiService.client = http.Client();
    });

    test('fetchBalances fetches balance correctly', () async {
      await controller.fetchBalances('student@example.com');
      expect(controller.balance, isNotNull);
      expect(controller.balance!.sick, 8);
      expect(controller.balance!.personal, 14);
      expect(controller.balance!.emergency, 5);
      expect(controller.balance!.academic, 10);
    });

    test('fetchStudentLeaves fetches leaves correctly', () async {
      await controller.fetchStudentLeaves('student@example.com');
      expect(controller.leaves.length, 2);
      expect(controller.leaves[0].id, 'LV-1');
      expect(controller.leaves[1].id, 'LV-2');
    });

    test('applyLeave submits request and refreshes student state', () async {
      final result = await controller.applyLeave({
        'student_email': 'student@example.com',
        'reason': 'Applied',
        'start_date': '2026-06-15',
        'end_date': '2026-06-16',
        'leave_type': 'personal',
      });

      expect(result['id'], 'LV-3');
      expect(controller.leaves.length, 2); // state refreshed via mock fetchStudentLeaves
    });

    test('fetchPendingLeaves fetches reviewable requests', () async {
      await controller.fetchPendingLeaves();
      expect(controller.pendingLeaves.length, 1);
      expect(controller.pendingLeaves[0].id, 'LV-2');
    });

    test('actionLeave performs update and refreshes pending requests', () async {
      final res = await controller.actionLeave('LV-2', 'Approved', 'Remarks');
      expect(res['message'], 'Action recorded successfully');
      expect(controller.pendingLeaves.length, 1);
    });

    test('fetchAnalytics fetches admin statistics', () async {
      await controller.fetchAnalytics();
      expect(controller.analytics['total_requests'], 10);
      expect(controller.analytics['approval_rate'], 0.8);
    });

    test('filteredLeaves correctly applies status filters, searches, and sorts', () async {
      await controller.fetchStudentLeaves('student@example.com');
      
      // Initially 2 leaves
      expect(controller.filteredLeaves.length, 2);

      // Filter: Approved
      controller.updateStatusFilter('Approved');
      expect(controller.filteredLeaves.length, 1);
      expect(controller.filteredLeaves[0].id, 'LV-1');

      // Filter: Pending
      controller.updateStatusFilter('Pending');
      expect(controller.filteredLeaves.length, 1);
      expect(controller.filteredLeaves[0].id, 'LV-2');

      // Reset filter and apply search query
      controller.updateStatusFilter('All');
      controller.updateSearchQuery('sick');
      expect(controller.filteredLeaves.length, 1);
      expect(controller.filteredLeaves[0].id, 'LV-1');

      // Sort Date Oldest
      controller.updateSearchQuery('');
      controller.updateSortBy('Date (Oldest)');
      expect(controller.filteredLeaves[0].id, 'LV-1'); // Jun 1 vs Jun 10

      // Sort Date Newest
      controller.updateSortBy('Date (Newest)');
      expect(controller.filteredLeaves[0].id, 'LV-2'); // Jun 10 vs Jun 1
    });
  });
}
