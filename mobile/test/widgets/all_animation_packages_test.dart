import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/core/animation/app_motion.dart';
import 'package:smartface_attendance/core/animation/app_motion_preferences.dart';
import 'package:smartface_attendance/core/animation/app_animated_page.dart';
import 'package:smartface_attendance/core/animation/app_staggered_list.dart';
import 'package:smartface_attendance/core/animation/app_lottie_state.dart';
import 'package:smartface_attendance/core/animation/app_rive_animation.dart';
import 'package:smartface_attendance/core/animation/app_animated_heading.dart';
import 'package:smartface_attendance/core/animation/app_press_animation.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Central Motion System & Animation Package Tests', () {
    test('AppMotion durations and constants', () {
      expect(AppMotion.instantDuration, const Duration(milliseconds: 120));
      expect(AppMotion.fastDuration, const Duration(milliseconds: 180));
      expect(AppMotion.normalDuration, const Duration(milliseconds: 320));
      expect(AppMotion.mediumDuration, const Duration(milliseconds: 450));
      expect(AppMotion.slowDuration, const Duration(milliseconds: 650));
    });

    test('AppMotionPreferences state toggles', () {
      final prefs = AppMotionPreferences();
      expect(prefs.animationsEnabled, true);
      expect(prefs.isReducedMotionOverride, false);

      prefs.setAnimationsEnabled(false);
      expect(prefs.animationsEnabled, false);

      prefs.setReducedMotionOverride(true);
      expect(prefs.isReducedMotionOverride, true);
    });

    testWidgets('AppAnimatedPageWrapper renders child', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppAnimatedPageWrapper(child: Text('Animated Page Child')),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Animated Page Child'), findsOneWidget);
    });

    testWidgets('AppStaggeredList renders items', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppStaggeredList(
              itemCount: 3,
              itemBuilder: (context, index) {
                return ListTile(title: Text('Item $index'));
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Item 0'), findsOneWidget);
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
    });

    testWidgets('AppLottieState renders fallback gracefully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppLottieState(
              assetPath: 'non_existent.json',
              fallbackIcon: Icons.star,
              message: 'Lottie Fallback Test',
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 200));
      expect(find.text('Lottie Fallback Test'), findsOneWidget);
    });

    testWidgets(
      'AppRiveAnimation renders fallback icon in reduced motion mode',
      (WidgetTester tester) async {
        await tester.pumpWidget(
          const MaterialApp(
            home: MediaQuery(
              data: MediaQueryData(accessibleNavigation: true),
              child: Scaffold(
                body: AppRiveAnimation(
                  assetPath: 'non_existent.riv',
                  fallbackIcon: Icons.camera_alt,
                ),
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(find.byIcon(Icons.camera_alt), findsOneWidget);
      },
    );

    testWidgets('AppAnimatedHeading renders animated title', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: AppAnimatedHeading(text: 'Smart Attendance AI')),
        ),
      );

      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Smart Attendance AI'), findsOneWidget);
    });

    testWidgets('AppPressAnimation responds to tap press gesture', (
      WidgetTester tester,
    ) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppPressAnimation(
              onTap: () {
                tapped = true;
              },
              child: Container(
                color: Colors.blue,
                width: 100,
                height: 100,
                child: const Text('Press Me'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Press Me'));
      await tester.pumpAndSettle();
      expect(tapped, true);
    });
  });
}
