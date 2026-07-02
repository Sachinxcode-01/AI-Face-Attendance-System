import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/student/screens/student_timetable_screen.dart';
import 'package:smartface_attendance/features/student/screens/attendance_calendar_screen.dart';
import 'package:smartface_attendance/core/services/calendar_reminder_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  const notifChannel = MethodChannel('dexterous.com/flutter_local_notifications');
  final Map<String, String> mockSecureStorage = {};

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
          switch (methodCall.method) {
            case 'read':
              final key = methodCall.arguments['key'] as String;
              return mockSecureStorage[key];
            case 'write':
              final key = methodCall.arguments['key'] as String;
              final value = methodCall.arguments['value'] as String;
              mockSecureStorage[key] = value;
              return null;
            case 'delete':
              final key = methodCall.arguments['key'] as String;
              mockSecureStorage.remove(key);
              return null;
            case 'deleteAll':
              mockSecureStorage.clear();
              return null;
            case 'readAll':
              return mockSecureStorage;
            default:
              return null;
          }
        });

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(notifChannel, (MethodCall methodCall) async {
          return null;
        });
  });

  group('Academic Calendar and Timetable Tests', () {
    late SessionManager sessionManager;

    setUp(() async {
      mockSecureStorage.clear();
      sessionManager = SessionManager();
      await sessionManager.saveSession(
        token: 'part1.part2.part3',
        email: 'student@example.com',
        role: 'student',
        name: 'John Doe',
      );
    });

    testWidgets('StudentTimetableScreen renders layout and tab bar',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<SessionManager>.value(
            value: sessionManager,
            child: const StudentTimetableScreen(),
          ),
        ),
      );

      // Verify AppBar and TabBar exist
      expect(find.byType(TabBar), findsOneWidget);
      expect(find.text('Class Timetable'), findsOneWidget);
    });

    testWidgets('AttendanceCalendarScreen renders calendar successfully',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<SessionManager>.value(
            value: sessionManager,
            child: const AttendanceCalendarScreen(),
          ),
        ),
      );

      // Verify the screen loads and displays the title
      expect(find.text('Attendance Calendar'), findsOneWidget);
    });

    test('CalendarReminderService schedules reminder successfully without throwing',
        () async {
      expect(
        () => CalendarReminderService.scheduleClassReminder(
          id: 999,
          title: 'Test Lecture',
          body: 'Lecture starts in 10 mins',
          hour: 9,
          minute: 0,
        ),
        returnsNormally,
      );
    });
  });
}
