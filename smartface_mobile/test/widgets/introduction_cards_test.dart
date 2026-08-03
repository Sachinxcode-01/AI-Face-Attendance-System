import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/screens/onboarding_screen.dart';
import 'package:smartface_attendance/features/auth/widgets/introduction_cards.dart';

class MockSessionManager extends SessionManager {
  bool onboardingCompletedValue = false;

  @override
  bool get onboardingCompleted => onboardingCompletedValue;

  @override
  Future<void> setOnboardingCompleted(bool value) async {
    onboardingCompletedValue = value;
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

  Widget createTestWidget() {
    final router = GoRouter(
      initialLocation: '/auth/onboarding',
      routes: [
        GoRoute(
          path: '/auth/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/auth/login',
          builder: (context, state) =>
              const Scaffold(body: Text('Login Screen Landmark')),
        ),
      ],
    );

    return MaterialApp.router(
      routerConfig: router,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: child!,
      ),
    );
  }

  group('Introduction Cards Widget Tests', () {
    testWidgets('Renders Card 1 (Smart Attendance) initially', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('SMART ATTENDANCE'), findsOneWidget);
      expect(find.text('Smart Attendance'), findsWidgets);
      expect(
        find.textContaining(
          'Mark and manage attendance quickly using intelligent QR',
        ),
        findsOneWidget,
      );
      expect(find.text('SKIP'), findsOneWidget);
      expect(find.text('NEXT'), findsOneWidget);
    });

    testWidgets('Swiping navigates from Card 1 to Card 2 and Card 3', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Tap NEXT to go to Card 2
      await tester.tap(find.text('NEXT'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('SECURE VERIFICATION'), findsOneWidget);
      expect(find.text('Secure Verification'), findsWidgets);
      expect(
        find.textContaining('Prevent proxy and duplicate attendance'),
        findsOneWidget,
      );
      expect(find.text('PREV'), findsOneWidget);

      // Tap NEXT to go to Card 3
      await tester.tap(find.text('NEXT'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('INSIGHTS FOR EVERYONE'), findsOneWidget);
      expect(find.text('Insights for Everyone'), findsWidgets);
      expect(find.text('GET STARTED'), findsOneWidget);
    });

    testWidgets('Tapping Skip navigates directly to Card 3', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      await tester.tap(find.text('SKIP'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('INSIGHTS FOR EVERYONE'), findsOneWidget);
      expect(find.text('GET STARTED'), findsOneWidget);
    });

    testWidgets('Tapping GET STARTED completes onboarding and redirects', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Go to Card 3
      await tester.tap(find.text('SKIP'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(mockSessionManager.onboardingCompleted, isFalse);

      await tester.tap(find.text('GET STARTED'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(mockSessionManager.onboardingCompleted, isTrue);
      expect(find.text('Login Screen Landmark'), findsOneWidget);
    });

    testWidgets('Individual IntroductionCardView renders without overflow', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: IntroductionCardView(
                data: kIntroCardsData[0],
                isActive: true,
                isReducedMotion: true,
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('SMART ATTENDANCE'), findsOneWidget);
    });
  });
}
