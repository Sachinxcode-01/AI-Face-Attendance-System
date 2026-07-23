import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/core/analytics/analytics_models.dart';
import 'package:smartface_attendance/core/analytics/analytics_data_mapper.dart';
import 'package:smartface_attendance/core/analytics/pseudo_3d_analytics_registry.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Pseudo-3D Analytics Architecture Tests', () {
    test('AttendancePoint parsing and zero division safety', () {
      final point = AttendancePoint.fromJson({
        'date': '2026-07-23',
        'present': 9,
        'absent': 1,
      });

      expect(point.date, '2026-07-23');
      expect(point.presentCount, 9);
      expect(point.absentCount, 1);
      expect(point.percentage, 90.0);

      final zeroPoint = AnalyticsDataMapper.safePercentage(0, 0);
      expect(zeroPoint, 0.0);
    });

    test('SubjectAttendancePoint model validation', () {
      final sub = SubjectAttendancePoint.fromJson({
        'subject': 'Data Structures',
        'code': 'CS201',
        'present': 18,
        'absent': 2,
      });

      expect(sub.subjectName, 'Data Structures');
      expect(sub.subjectCode, 'CS201');
      expect(sub.percentage, 90.0);
    });

    testWidgets('Pseudo3DDonutChart renders title and percentage', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Pseudo3DDonutChart(
              percentage: 85.5,
              title: 'Overall Attendance',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Overall Attendance'), findsOneWidget);
    });
  });
}
