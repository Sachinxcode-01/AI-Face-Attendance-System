import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartface_attendance/features/chatbot/controllers/chatbot_controller.dart';
import 'package:smartface_attendance/features/chatbot/models/chat_message.dart';
import 'package:smartface_attendance/features/chatbot/widgets/nexa_chat_sheet.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  group('Nexa Chatbot System Tests', () {
    test('ChatMessage JSON serialization & deserialization', () {
      final msg = ChatMessage(
        id: 'msg_123',
        sender: 'assistant',
        content: 'Hello, how can I help you?',
        timestamp: DateTime.parse('2026-08-02T12:00:00Z'),
        suggestedActions: const [
          {
            'type': 'navigate',
            'label': 'Open Timetable',
            'route': '/student/timetable',
          },
        ],
      );

      final jsonMap = msg.toJson();
      expect(jsonMap['id'], equals('msg_123'));
      expect(jsonMap['sender'], equals('assistant'));

      final restored = ChatMessage.fromJson(jsonMap);
      expect(restored.id, equals('msg_123'));
      expect(restored.content, equals('Hello, how can I help you?'));
      expect(restored.suggestedActions.length, equals(1));
    });

    test(
      'ChatbotController initial state, toggle, and position snapping',
      () async {
        final controller = ChatbotController();
        await controller.init();

        expect(controller.isEnabled, isTrue);
        expect(controller.isOpen, isFalse);
        expect(controller.unreadCount, equals(0));

        await controller.toggleEnabled(false);
        expect(controller.isEnabled, isFalse);

        await controller.toggleEnabled(true);
        expect(controller.isEnabled, isTrue);

        // Position update & snap test
        await controller.updatePosition(50.0, 300.0, 400.0, 800.0, snap: true);
        expect(controller.posX, equals(16.0)); // Snapped to left edge minMargin
        expect(controller.posY, equals(300.0));

        // Reset position
        await controller.resetPosition();
        expect(controller.posX, isNull);
        expect(controller.posY, isNull);
      },
    );

    test('ChatbotController privacy notice & clear messages', () async {
      final controller = ChatbotController();
      await controller.init();

      expect(controller.hasSeenNotice, isFalse);
      await controller.acceptPrivacyNotice();
      expect(controller.hasSeenNotice, isTrue);

      await controller.clearMessages();
      expect(controller.messages, isEmpty);
    });

    testWidgets('NexaChatSheet renders header, role context, and suggestions', (
      WidgetTester tester,
    ) async {
      final sessionManager = SessionManager();
      final themeController = ThemeController();
      final chatbotController = ChatbotController();
      await chatbotController.init();

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<SessionManager>.value(value: sessionManager),
            ChangeNotifierProvider<ThemeController>.value(
              value: themeController,
            ),
            ChangeNotifierProvider<ChatbotController>.value(
              value: chatbotController,
            ),
          ],
          child: const MaterialApp(home: Scaffold(body: NexaChatSheet())),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Nexa AI Assistant'), findsOneWidget);
      expect(find.text('SUGGESTED QUESTIONS'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.byType(ClipOval), findsWidgets);
    });

    testWidgets('NexaChatSheet renders responsively on tablet wide viewport', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(1024, 768);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final sessionManager = SessionManager();
      final themeController = ThemeController();
      final chatbotController = ChatbotController();
      await chatbotController.init();

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<SessionManager>.value(value: sessionManager),
            ChangeNotifierProvider<ThemeController>.value(
              value: themeController,
            ),
            ChangeNotifierProvider<ChatbotController>.value(
              value: chatbotController,
            ),
          ],
          child: const MaterialApp(home: Scaffold(body: NexaChatSheet())),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Nexa AI Assistant'), findsOneWidget);
      // Verify constrained box limits width for large screens
      final constrainedBoxes = tester.widgetList<ConstrainedBox>(
        find.byType(ConstrainedBox),
      );
      final hasResponsiveConstraint = constrainedBoxes.any(
        (cb) => cb.constraints.maxWidth == 680,
      );
      expect(hasResponsiveConstraint, isTrue);
    });
  });
}
