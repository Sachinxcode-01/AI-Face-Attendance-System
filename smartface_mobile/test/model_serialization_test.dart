import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/models/leave_model.dart';
import 'package:smartface_attendance/models/student_stats_model.dart';

void main() {
  test('LeaveModel parses API-shaped JSON', () {
    final leave = LeaveModel.fromJson({
      '_id': 'leave-1',
      'reason': 'Medical',
      'start_date': '2026-06-20',
      'end_date': '2026-06-21',
      'status': 'approved',
    });

    expect(leave.id, 'leave-1');
    expect(leave.reason, 'Medical');
    expect(leave.status, 'approved');
  });

  test('StudentStatsModel normalizes percentage values', () {
    final stats = StudentStatsModel.fromJson({
      'overall_percentage': 82,
      'standing': 'Good',
      'rank': 'Ranked #4',
      'streak': '12',
      'subjects': [
        {'subject': 'AI', 'present': 8, 'total': 10},
      ],
    });

    expect(stats.overallPercentage, 0.82);
    expect(stats.streak, 12);
    expect(stats.subjects.single.percentage, 0.8);
  });
}
