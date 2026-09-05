/*
 * analytics_dashboard_test.dart
 * ─────────────────────────────
 * Widget tests for the Phase 4 AnalyticsDashboardScreen.
 *
 * Tests:
 *  1. Screen renders without error and shows TabBar
 *  2. Shows loading skeleton initially
 *  3. After data load, shows "Trends" tab content
 *  4. Switching to "Risk" tab shows empty state when no data
 */

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/analytics/screens/analytics_dashboard_screen.dart';
import 'mocks/mock_api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ── Mock secure storage ───────────────────────────────────────────────────
  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final Map<String, String> mockSecureStorage = {};

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall call) async {
          switch (call.method) {
            case 'read':
              return mockSecureStorage[call.arguments['key'] as String];
            case 'write':
              mockSecureStorage[call.arguments['key'] as String] =
                  call.arguments['value'] as String;
              return null;
            case 'delete':
              mockSecureStorage.remove(call.arguments['key'] as String);
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
  });

  // ── Mock HTTP that returns empty-but-valid analytics responses ────────────
  void setupEmptyMocks() {
    MockApiService.setupCustom(
      MockClient((request) async {
        final path = request.url.path;
        if (path.endsWith('/analytics/trends')) {
          return http.Response(jsonEncode({'trends': []}), 200);
        }
        if (path.endsWith('/analytics/department-comparison')) {
          return http.Response(jsonEncode({'departments': []}), 200);
        }
        if (path.endsWith('/analytics/subject-wise')) {
          return http.Response(jsonEncode({'subjects': []}), 200);
        }
        if (path.endsWith('/analytics/risk-students')) {
          return http.Response(jsonEncode({'riskStudents': []}), 200);
        }
        if (path.endsWith('/analytics/heatmap')) {
          return http.Response(jsonEncode({'heatmap': []}), 200);
        }
        return http.Response(jsonEncode({'detail': 'Not found'}), 404);
      }),
    );
  }

  // ── Mock HTTP that returns rich analytics data ────────────────────────────
  void setupRichMocks() {
    MockApiService.setupCustom(
      MockClient((request) async {
        final path = request.url.path;
        if (path.endsWith('/analytics/trends')) {
          return http.Response(
            jsonEncode({
              'trends': [
                {
                  'month': '2025-01',
                  'rate': 0.82,
                  'total': 200,
                  'present': 164,
                },
                {
                  'month': '2025-02',
                  'rate': 0.87,
                  'total': 180,
                  'present': 157,
                },
              ],
            }),
            200,
          );
        }
        if (path.endsWith('/analytics/department-comparison')) {
          return http.Response(
            jsonEncode({
              'departments': [
                {'department': 'CSE', 'averageRate': 0.85, 'studentCount': 40},
                {'department': 'ECE', 'averageRate': 0.78, 'studentCount': 30},
              ],
            }),
            200,
          );
        }
        if (path.endsWith('/analytics/subject-wise')) {
          return http.Response(
            jsonEncode({
              'subjects': [
                {
                  'subject': 'Math',
                  'averageRate': 0.9,
                  'totalSessions': 30,
                  'totalPresent': 27,
                },
              ],
            }),
            200,
          );
        }
        if (path.endsWith('/analytics/risk-students')) {
          return http.Response(
            jsonEncode({
              'riskStudents': [
                {
                  'email': 'risk@example.com',
                  'name': 'At Risk Student',
                  'department': 'CSE',
                  'attendanceRate': 0.65,
                },
              ],
            }),
            200,
          );
        }
        if (path.endsWith('/analytics/heatmap')) {
          return http.Response(
            jsonEncode({
              'heatmap': [
                {'date': '2025-01-15', 'count': 34},
                {'date': '2025-01-16', 'count': 28},
              ],
            }),
            200,
          );
        }
        return http.Response(jsonEncode({'detail': 'Not found'}), 404);
      }),
    );
  }

  Widget buildApp(SessionManager session) {
    return MaterialApp(
      home: ChangeNotifierProvider<SessionManager>.value(
        value: session,
        child: const AnalyticsDashboardScreen(),
      ),
    );
  }

  // ── Helper: pump and drain animate timers ─────────────────────────────────
  Future<void> pumpScreen(WidgetTester tester, Widget app) async {
    await tester.pumpWidget(app);
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
  }

  late SessionManager sessionManager;

  setUp(() async {
    mockSecureStorage.clear();
    sessionManager = SessionManager();
    await sessionManager.saveSession(
      token: 'part1.part2.part3',
      email: 'admin@example.com',
      role: 'admin',
      name: 'Admin User',
    );
  });

  tearDown(() => MockApiService.reset());

  // ── Test 1: TabBar renders ────────────────────────────────────────────────
  testWidgets('AnalyticsDashboardScreen renders TabBar with all tab labels', (
    WidgetTester tester,
  ) async {
    setupEmptyMocks();
    await pumpScreen(tester, buildApp(sessionManager));
    await tester.pump(const Duration(seconds: 1));

    expect(find.text('Trends'), findsWidgets);
    expect(find.text('Departments'), findsWidgets);
    expect(find.text('Subjects'), findsWidgets);
    expect(find.text('Risk'), findsWidgets);
    expect(find.text('Heatmap'), findsWidgets);
  });

  // ── Test 2: Empty state on Trends tab ─────────────────────────────────────
  testWidgets('Trends tab shows empty state when no data', (
    WidgetTester tester,
  ) async {
    setupEmptyMocks();
    await pumpScreen(tester, buildApp(sessionManager));

    // Wait for async data load and animations
    await tester.pump(const Duration(seconds: 2));

    expect(find.text('No trend data available yet.'), findsOneWidget);
  });

  // ── Test 3: Risk tab empty state ──────────────────────────────────────────
  testWidgets(
    'Risk tab shows celebration empty state when no at-risk students',
    (WidgetTester tester) async {
      setupEmptyMocks();
      await pumpScreen(tester, buildApp(sessionManager));

      await tester.pump(const Duration(seconds: 2));

      // Switch to Risk tab
      await tester.tap(find.text('Risk'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 2));

      expect(find.textContaining('No at-risk students'), findsOneWidget);
    },
  );

  // ── Test 4: Rich data — risk list appears ────────────────────────────────
  testWidgets('Risk tab shows at-risk student when data present', (
    WidgetTester tester,
  ) async {
    setupRichMocks();
    await tester.runAsync(() async {
      await tester.pumpWidget(buildApp(sessionManager));
      await tester.pump();

      // Wait for async load to complete (real time)
      await Future.delayed(const Duration(seconds: 2));
      await tester.pump();

      // Switch to Risk tab
      await tester.tap(find.text('Risk'));
      await tester.pump();
      // Advance virtual animation frames to complete the TabBarView transition
      await tester.pump(const Duration(seconds: 1));
    });

    expect(find.text('At Risk Student'), findsOneWidget);
  });
}
