import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/core/ui_system/app_ui_package_registry.dart';

void _dummyOnTap(int index) {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('UI System Architecture Tests', () {
    testWidgets('AppAnimationShell renders child correctly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: AppAnimationShell(child: Text('Shell Content'))),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Shell Content'), findsOneWidget);
    });

    testWidgets('AppAnimatedHeading renders title text', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: AppAnimatedHeading(text: 'Smart Attendance AI')),
        ),
      );

      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Smart Attendance AI'), findsOneWidget);
    });

    testWidgets('AppLottieState renders fallback icon when asset missing', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppLottieState(
              assetPath: 'missing.json',
              fallbackIcon: Icons.check_circle_outline,
              message: 'Lottie System Verified',
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('Lottie System Verified'), findsOneWidget);
    });

    testWidgets('AppRiveState renders fallback in reduced motion mode', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(accessibleNavigation: true),
            child: Scaffold(
              body: AppRiveState(
                assetPath: 'missing.riv',
                fallbackIcon: Icons.camera_front_rounded,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.camera_front_rounded), findsOneWidget);
    });

    testWidgets('AppAnimatedIconWrapper renders animated icon widget', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppAnimatedIconWrapper(
              animateIcon: AnimateIcons.home,
              fallbackIcon: Icons.home,
              isActive: true,
              semanticLabel: 'Home Icon',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.bySemanticsLabel('Home Icon'), findsOneWidget);
    });

    testWidgets('AppCarouselSlider renders carousel items', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCarouselSlider<String>(
              items: const ['Item A', 'Item B'],
              itemBuilder: (context, item, index) {
                return Center(child: Text(item));
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Item A'), findsOneWidget);
    });

    testWidgets('AppBottomNavigation renders Salomon bottom bar tabs', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            bottomNavigationBar: AppBottomNavigation(
              currentIndex: 0,
              onTap: _dummyOnTap,
              role: 'student',
              items: [
                AppSalomonNavItemData(
                  icon: Icons.home_outlined,
                  animateIcon: AnimateIcons.home,
                  title: 'Home',
                  route: '/home',
                ),
                AppSalomonNavItemData(
                  icon: Icons.calendar_month_outlined,
                  animateIcon: AnimateIcons.calendar,
                  title: 'Schedule',
                  route: '/schedule',
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Schedule'), findsOneWidget);
    });
  });
}
