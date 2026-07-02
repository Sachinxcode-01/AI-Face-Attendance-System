import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/analytics/screens/ai_analyst_screen.dart';
import 'mocks/mock_api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ── Mock secure-storage channel ──────────────────────────────────────────
  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
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
  });

  // ── Helper: build the screen under test ──────────────────────────────────
  Widget buildTestApp(SessionManager session) {
    return MaterialApp(
      home: ChangeNotifierProvider<SessionManager>.value(
        value: session,
        child: const AIAnalystScreen(),
      ),
    );
  }

  // ── Helper: pump widget + drain pending animation timers ─────────────────
  Future<void> pumpScreen(WidgetTester tester, Widget app) async {
    await tester.pumpWidget(app);
    // Drain the first frame so flutter_animate initialises its timers.
    await tester.pump();
    // Advance time past any one-shot intro animation (300 ms covers most).
    await tester.pump(const Duration(milliseconds: 300));
  }

  group('AI Analyst Chat Tests', () {
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

      // Wire up mock HTTP client so ApiService.postAIChat returns a canned reply.
      MockApiService.setupCustom(MockClient((request) async {
        if (request.url.path.endsWith('/ai/chat')) {
          return http.Response(
            jsonEncode({'reply': 'This is a mock AI response.'}),
            200,
          );
        }
        return http.Response(jsonEncode({'detail': 'Not found'}), 404);
      }));
    });

    tearDown(() {
      MockApiService.reset();
    });

    // ── Test 1: screen renders correctly ─────────────────────────────────
    testWidgets('AIAnalystScreen renders chat area and input',
        (WidgetTester tester) async {
      await pumpScreen(tester, buildTestApp(sessionManager));

      // Header text is present (may appear more than once in the AppBar widget tree).
      expect(find.text('AI Analyst'), findsWidgets);

      // Input area components are present.
      expect(find.byType(TextField), findsOneWidget);
      expect(find.byIcon(Icons.send), findsOneWidget);
    });

    // ── Test 2: sending a message shows user text and AI reply ────────────
    testWidgets('Sending a message displays the user query in the chat list',
        (WidgetTester tester) async {
      await pumpScreen(tester, buildTestApp(sessionManager));

      // Type a query and hit send.
      await tester.enterText(find.byType(TextField), 'Summarize my stats');
      await tester.tap(find.byIcon(Icons.send));

      // Pump one frame so setState fires and the user message bubble appears.
      await tester.pump();
      // Drain any animate timers created by the new chat bubble widget.
      await tester.pump(const Duration(milliseconds: 500));

      // The user's message must appear in the list immediately.
      expect(find.text('Summarize my stats'), findsOneWidget);
    });

    // ── Test 3: AI response is appended after the HTTP call completes ─────
    testWidgets('AI response is appended after network call',
        (WidgetTester tester) async {
      await pumpScreen(tester, buildTestApp(sessionManager));

      await tester.enterText(find.byType(TextField), 'What is my GPA?');
      await tester.tap(find.byIcon(Icons.send));
      await tester.pump(); // user message appears
      await tester.pump(const Duration(milliseconds: 500)); // drain animate

      // Advance enough time for the async http call to resolve.
      // Use a fixed duration instead of pumpAndSettle to avoid hanging on
      // flutter_animate's continuous shimmer timers.
      await tester.pump(const Duration(seconds: 2));
      // Drain any new animate timers from the AI reply bubble.
      await tester.pump(const Duration(milliseconds: 500));

      // The mock returns 'This is a mock AI response.'
      // Use findsWidgets as the rich-text renderer may produce multiple Text nodes.
      expect(find.text('This is a mock AI response.'), findsWidgets);
    });
  });
}
