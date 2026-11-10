import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

void main() {
  group('Screen-Specific Skeleton Loader Tests', () {
    testWidgets('renders StudentHomeShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentHomeShimmer(),
          ),
        ),
      );
      expect(find.byType(StudentHomeShimmer), findsOneWidget);
    });

    testWidgets('renders TimetableShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TimetableShimmer(),
          ),
        ),
      );
      expect(find.byType(TimetableShimmer), findsOneWidget);
    });

    testWidgets('renders AttendanceCalendarShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AttendanceCalendarShimmer(),
          ),
        ),
      );
      expect(find.byType(AttendanceCalendarShimmer), findsOneWidget);
    });

    testWidgets('renders AttendanceHubShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AttendanceHubShimmer(),
          ),
        ),
      );
      expect(find.byType(AttendanceHubShimmer), findsOneWidget);
    });

    testWidgets('renders BunkCalculatorShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: BunkCalculatorShimmer(),
          ),
        ),
      );
      expect(find.byType(BunkCalculatorShimmer), findsOneWidget);
    });

    testWidgets('renders StudentIdCardShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentIdCardShimmer(),
          ),
        ),
      );
      expect(find.byType(StudentIdCardShimmer), findsOneWidget);
    });

    testWidgets('renders TeacherDashboardShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TeacherDashboardShimmer(),
          ),
        ),
      );
      expect(find.byType(TeacherDashboardShimmer), findsOneWidget);
    });

    testWidgets('renders StudentProfileShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentProfileShimmer(),
          ),
        ),
      );
      expect(find.byType(StudentProfileShimmer), findsOneWidget);
    });

    testWidgets('renders LeaveDashboardShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LeaveDashboardShimmer(),
          ),
        ),
      );
      expect(find.byType(LeaveDashboardShimmer), findsOneWidget);
    });

    testWidgets('renders LeaveListShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LeaveListShimmer(),
          ),
        ),
      );
      expect(find.byType(LeaveListShimmer), findsOneWidget);
    });

    testWidgets('renders AtRiskRosterShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AtRiskRosterShimmer(),
          ),
        ),
      );
      expect(find.byType(AtRiskRosterShimmer), findsOneWidget);
    });

    testWidgets('renders SecurityLogsShimmer cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SecurityLogsShimmer(),
          ),
        ),
      );
      expect(find.byType(SecurityLogsShimmer), findsOneWidget);
    });
  });
}

