import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';

void main() {
  group('LeaveModel Serialization Tests', () {
    test('fromJson deserializes standard fields correctly', () {
      final json = {
        'id': 'leave_123',
        'student_email': 'student@example.com',
        'reason': 'Medical checkup',
        'start_date': '2026-05-25T10:00:00Z',
        'end_date': '2026-05-26T10:00:00Z',
        'status': 'Approved',
        'remarks': 'Approved by dean.',
        'document_url': 'http://example.com/doc.pdf',
        'created_at': '2026-05-25T08:00:00Z',
      };

      final leave = LeaveModel.fromJson(json);

      expect(leave.id, 'leave_123');
      expect(leave.studentEmail, 'student@example.com');
      expect(leave.reason, 'Medical checkup');
      expect(leave.startDate, '2026-05-25T10:00:00Z');
      expect(leave.endDate, '2026-05-26T10:00:00Z');
      expect(leave.status, 'Approved');
      expect(leave.remarks, 'Approved by dean.');
      expect(leave.documentUrl, 'http://example.com/doc.pdf');
      expect(leave.createdAt, '2026-05-25T08:00:00Z');
    });

    test('fromJson handles missing fields with default values', () {
      final json = <String, dynamic>{};

      final leave = LeaveModel.fromJson(json);

      expect(leave.id, isNull);
      expect(leave.studentEmail, '');
      expect(leave.reason, 'No reason provided');
      expect(leave.startDate, '');
      expect(leave.endDate, '');
      expect(leave.status, 'Pending');
      expect(leave.remarks, isNull);
      expect(leave.documentUrl, isNull);
      expect(leave.createdAt, isNull);
    });

    test('toJson serializes fields correctly', () {
      const leave = LeaveModel(
        id: 'leave_456',
        studentEmail: 'student@example.com',
        reason: 'Family event',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
        status: 'Pending',
        remarks: 'Waiting review',
        documentUrl: 'http://example.com/file',
        createdAt: '2026-05-25',
      );

      final json = leave.toJson();

      expect(json['id'], 'leave_456');
      expect(json['student_email'], 'student@example.com');
      expect(json['reason'], 'Family event');
      expect(json['start_date'], '2026-06-01');
      expect(json['end_date'], '2026-06-02');
      expect(json['status'], 'Pending');
      expect(json['remarks'], 'Waiting review');
      expect(json['document_url'], 'http://example.com/file');
      expect(json['created_at'], '2026-05-25');
    });
  });

  group('StudentStatsModel & SubjectProgressModel Serialization Tests', () {
    test('fromJson deserializes nested stats correctly', () {
      final json = {
        'overall_percentage': 0.88,
        'standing': 'Elite Performer',
        'rank': '#3 in Department',
        'streak': 15,
        'subjects': [
          {
            'subject': 'Machine Learning',
            'percentage': 0.90,
            'present': 18,
            'total': 20,
          },
          {
            'subject': 'Data Ethics',
            'percentage': 0.85,
            'present': 17,
            'total': 20,
          },
        ],
      };

      final stats = StudentStatsModel.fromJson(json);

      expect(stats.overallPercentage, 0.88);
      expect(stats.standing, 'Elite Performer');
      expect(stats.rank, '#3 in Department');
      expect(stats.streak, 15);
      expect(stats.subjects.length, 2);

      final mlSubject = stats.subjects.first;
      expect(mlSubject.subject, 'Machine Learning');
      expect(mlSubject.percentage, 0.90);
      expect(mlSubject.present, 18);
      expect(mlSubject.total, 20);
    });

    test('fromJson handles missing stats fields with defaults', () {
      final json = <String, dynamic>{};

      final stats = StudentStatsModel.fromJson(json);

      expect(stats.hasData, isFalse);
      expect(stats.overallPercentage, isNull);
      expect(stats.standing, isNull);
      expect(stats.rank, isNull);
      expect(stats.streak, isNull);
      expect(stats.subjects, isEmpty);
    });

    test('toJson serializes nested stats correctly', () {
      const stats = StudentStatsModel(
        hasData: true,
        overallPercentage: 0.95,
        standing: 'Top Scholar',
        rank: '#1 in class',
        streak: 20,
        subjects: [
          SubjectProgressModel(
            subject: 'Cloud Arch',
            percentage: 0.95,
            present: 19,
            total: 20,
          ),
        ],
      );

      final json = stats.toJson();

      expect(json['overall_percentage'], 0.95);
      expect(json['standing'], 'Top Scholar');
      expect(json['rank'], '#1 in class');
      expect(json['streak'], 20);

      final subjectsJson = json['subjects'] as List<dynamic>;
      expect(subjectsJson.length, 1);
      expect(subjectsJson.first['subject'], 'Cloud Arch');
      expect(subjectsJson.first['percentage'], 0.95);
      expect(subjectsJson.first['present'], 19);
      expect(subjectsJson.first['total'], 20);
    });
  });
}
