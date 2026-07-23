import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/core/animation/app_motion.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppMotion Animation System Tests', () {
    testWidgets('renders AppFadeIn, AppSlideUp, AppScaleIn cleanly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                AppFadeIn(child: Text('Fade In Text')),
                AppSlideUp(child: Text('Slide Up Text')),
                AppScaleIn(child: Text('Scale In Text')),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Fade In Text'), findsOneWidget);
      expect(find.text('Slide Up Text'), findsOneWidget);
      expect(find.text('Scale In Text'), findsOneWidget);
    });

    testWidgets('renders AppStaggeredItem items cleanly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: List.generate(
                3,
                (index) =>
                    AppStaggeredItem(index: index, child: Text('Item $index')),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Item 0'), findsOneWidget);
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
    });

    testWidgets('respects reduced-motion accessibleNavigation mode', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(accessibleNavigation: true),
            child: Scaffold(
              body: Column(
                children: [
                  AppFadeIn(child: Text('Reduced Fade')),
                  AppSlideUp(child: Text('Reduced Slide')),
                  AppSuccessAnimation(child: Text('Reduced Success')),
                  AppErrorAnimation(
                    trigger: true,
                    child: Text('Reduced Error'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Reduced Fade'), findsOneWidget);
      expect(find.text('Reduced Slide'), findsOneWidget);
      expect(find.text('Reduced Success'), findsOneWidget);
      expect(find.text('Reduced Error'), findsOneWidget);
    });

    testWidgets(
      'renders AppSuccessAnimation and AppErrorAnimation without exceptions',
      (WidgetTester tester) async {
        await tester.pumpWidget(
          const MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  AppSuccessAnimation(child: Icon(Icons.check_circle)),
                  AppErrorAnimation(trigger: true, child: Icon(Icons.error)),
                ],
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(find.byIcon(Icons.check_circle), findsOneWidget);
        expect(find.byIcon(Icons.error), findsOneWidget);
      },
    );
  });
}
