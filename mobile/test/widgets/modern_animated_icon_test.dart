import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/shared/widgets/modern_animated_icon.dart';
import 'package:smartface_attendance/design_system/ui/smart_bottom_nav.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ModernAnimatedIcon Widget Tests', () {
    testWidgets('renders ModernAnimatedIcon cleanly without errors', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: ModernAnimatedIcon(
                animateIcon: AnimateIcons.home,
                fallbackIcon: Icons.home_rounded,
                size: 24.0,
                isActive: true,
                semanticLabel: 'Home Icon',
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(ModernAnimatedIcon), findsOneWidget);
      expect(find.bySemanticsLabel('Home Icon'), findsOneWidget);
    });

    testWidgets('renders fallback icon when reduced motion is enabled', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(accessibleNavigation: true),
            child: Scaffold(
              body: Center(
                child: ModernAnimatedIcon(
                  animateIcon: AnimateIcons.bell,
                  fallbackIcon: Icons.notifications_rounded,
                  size: 24.0,
                  isActive: false,
                  semanticLabel: 'Notifications',
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.notifications_rounded), findsOneWidget);
    });

    testWidgets('triggers onTap callback on user tap', (
      WidgetTester tester,
    ) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: ModernAnimatedIcon(
                animateIcon: AnimateIcons.settings,
                fallbackIcon: Icons.settings_rounded,
                size: 24.0,
                onTap: () {
                  tapped = true;
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byType(ModernAnimatedIcon));
      await tester.pumpAndSettle();

      expect(tapped, isTrue);
    });
  });

  group('SmartBottomNav with Animated Icons Tests', () {
    testWidgets('renders nav bar with animated icon items', (
      WidgetTester tester,
    ) async {
      int selectedIndex = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: SmartBottomNav(
              currentIndex: selectedIndex,
              onTap: (index) {
                selectedIndex = index;
              },
              items: const [
                BottomNavItemData(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  animateIcon: AnimateIcons.home,
                  label: 'Home',
                  route: '/home',
                ),
                BottomNavItemData(
                  icon: Icons.calendar_today_outlined,
                  activeIcon: Icons.calendar_today_rounded,
                  animateIcon: AnimateIcons.calendar,
                  label: 'Schedule',
                  route: '/schedule',
                ),
                BottomNavItemData(
                  icon: Icons.qr_code_scanner_rounded,
                  activeIcon: Icons.qr_code_scanner_rounded,
                  animateIcon: AnimateIcons.qrCode,
                  label: 'Scan',
                  route: '/scan',
                ),
                BottomNavItemData(
                  icon: Icons.analytics_outlined,
                  activeIcon: Icons.analytics_rounded,
                  animateIcon: AnimateIcons.document,
                  label: 'Reports',
                  route: '/reports',
                ),
                BottomNavItemData(
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  label: 'Profile',
                  route: '/profile',
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(SmartBottomNav), findsOneWidget);
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Schedule'), findsOneWidget);
      expect(find.text('Scan'), findsOneWidget);
      expect(find.text('Reports'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);
      expect(find.byIcon(Icons.person_outline_rounded), findsOneWidget);
    });
  });
}
