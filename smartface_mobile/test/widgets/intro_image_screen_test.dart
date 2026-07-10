import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/screens/intro_image_screen.dart';

// Mock SessionManager
class MockSessionManager extends SessionManager {
  bool introImagesCompletedRegistered = false;

  @override
  bool get introImagesCompleted => introImagesCompletedRegistered;

  @override
  Future<void> setIntroImagesCompleted(bool value) async {
    introImagesCompletedRegistered = value;
    notifyListeners();
  }
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  late MockSessionManager mockSessionManager;

  setUp(() {
    mockSessionManager = MockSessionManager();
    final getIt = GetIt.instance;
    getIt.allowReassignment = true;
    getIt.registerSingleton<SessionManager>(mockSessionManager);
  });

  Widget createTestRouterWidget() {
    final router = GoRouter(
      initialLocation: '/intro-images',
      routes: [
        GoRoute(
          path: '/intro-images',
          builder: (context, state) => const IntroImageScreen(),
        ),
        GoRoute(
          path: '/auth/login',
          builder: (context, state) => const Scaffold(
            body: Text('Login Screen'),
          ),
        ),
      ],
    );

    return MaterialApp.router(
      routerConfig: router,
    );
  }

  group('IntroImageScreen Widget Tests', () {
    testWidgets('renders all HUD elements correctly on initial load', (WidgetTester tester) async {
      await tester.pumpWidget(createTestRouterWidget());
      await tester.pumpAndSettle();

      // Verify page 1 features
      expect(find.text('SKIP'), findsOneWidget);
      expect(find.text('BACK'), findsOneWidget);
      expect(find.text('NEXT'), findsOneWidget);

      // Verify BACK button has opacity 0 initially (or isn't interactive)
      final backButtonOpacityFinder = find.ancestor(
        of: find.text('BACK'),
        matching: find.byType(AnimatedOpacity),
      );
      expect(backButtonOpacityFinder, findsOneWidget);
      final AnimatedOpacity animatedOpacity = tester.widget<AnimatedOpacity>(backButtonOpacityFinder);
      expect(animatedOpacity.opacity, 0.0);
    });

    testWidgets('navigation pages work correctly when clicking NEXT and BACK', (WidgetTester tester) async {
      await tester.pumpWidget(createTestRouterWidget());
      await tester.pumpAndSettle();

      // Tap NEXT to go to page 2
      await tester.tap(find.text('NEXT'));
      await tester.pumpAndSettle();

      // Verify BACK is now visible (opacity 1.0)
      final backButtonOpacityFinder = find.ancestor(
        of: find.text('BACK'),
        matching: find.byType(AnimatedOpacity),
      );
      final AnimatedOpacity animatedOpacity = tester.widget<AnimatedOpacity>(backButtonOpacityFinder);
      expect(animatedOpacity.opacity, 1.0);

      // Tap NEXT again to go to page 3
      await tester.tap(find.text('NEXT'));
      await tester.pumpAndSettle();

      // On page 3 (last page), button should show "LET'S START" instead of "NEXT"
      expect(find.text('NEXT'), findsNothing);
      expect(find.text("LET'S START"), findsOneWidget);

      // Tap BACK to go back to page 2
      await tester.tap(find.text('BACK'));
      await tester.pumpAndSettle();
      expect(find.text('NEXT'), findsOneWidget);
      expect(find.text("LET'S START"), findsNothing);
    });

    testWidgets('clicking SKIP completes intro and redirects to login', (WidgetTester tester) async {
      await tester.pumpWidget(createTestRouterWidget());
      await tester.pumpAndSettle();

      expect(mockSessionManager.introImagesCompleted, isFalse);

      await tester.tap(find.text('SKIP'));
      await tester.pumpAndSettle();

      // Verify session state updated
      expect(mockSessionManager.introImagesCompleted, isTrue);

      // Verify redirected to Login Screen
      expect(find.text('Login Screen'), findsOneWidget);
    });

    testWidgets('clicking LETS GET STARTED on the final page completes intro and redirects to login', (WidgetTester tester) async {
      await tester.pumpWidget(createTestRouterWidget());
      await tester.pumpAndSettle();

      // Go to page 2
      await tester.tap(find.text('NEXT'));
      await tester.pumpAndSettle();

      // Go to page 3
      await tester.tap(find.text('NEXT'));
      await tester.pumpAndSettle();

      expect(mockSessionManager.introImagesCompleted, isFalse);

      // Tap "LET'S START"
      await tester.tap(find.text("LET'S START"));
      await tester.pumpAndSettle();

      // Verify session state updated
      expect(mockSessionManager.introImagesCompleted, isTrue);

      // Verify redirected to Login Screen
      expect(find.text('Login Screen'), findsOneWidget);
    });
  });
}
