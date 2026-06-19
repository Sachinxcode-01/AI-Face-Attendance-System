import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/shared/widgets/glass_container.dart';
import 'package:smartface_attendance/shared/widgets/attendance_ring.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_skeleton.dart';
import 'package:smartface_attendance/shared/widgets/status_badge.dart';

void main() {
  // Ensure Google Fonts is initialized in a test-friendly way
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('Premium Shared Widgets Tests', () {
    testWidgets('GlassContainer renders child and implements CustomPaint border', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GlassContainer(
              blur: 15.0,
              borderRadius: 20,
              borderWidth: 2.0,
              child: Text('Frosted Card'),
            ),
          ),
        ),
      );

      // Verify child text is rendered
      expect(find.text('Frosted Card'), findsOneWidget);

      // Verify that BackdropFilter and ClipRRect are used
      expect(find.byType(BackdropFilter), findsOneWidget);
      expect(find.byType(ClipRRect), findsOneWidget);
      
      // Verify CustomPaint with GradientBorderPainter is present for the border painting
      expect(
        find.byWidgetPredicate((widget) => widget is CustomPaint && widget.painter is GradientBorderPainter),
        findsOneWidget,
      );
    });

    testWidgets('AttendanceRing animates fill on load rather than snapping', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: AttendanceRing(
                percentage: 0.85,
                duration: Duration(milliseconds: 1000),
              ),
            ),
          ),
        ),
      );

      // Frame 1 (t = 0): Animation is just starting, should read 0%
      expect(find.text('0%'), findsOneWidget);
      expect(find.text('85%'), findsNothing);

      // Advance by 500ms (halfway)
      await tester.pump(const Duration(milliseconds: 500));
      
      // The percentage should be somewhere between 0% and 85% due to CurvedAnimation/Tween
      final textFinder = find.byWidgetPredicate((widget) {
        if (widget is Text) {
          final textData = widget.data ?? '';
          if (textData.endsWith('%')) {
            final val = int.tryParse(textData.replaceAll('%', ''));
            return val != null && val > 0 && val < 85;
          }
        }
        return false;
      });
      expect(textFinder, findsOneWidget);

      // Settle the animation to t = 1000ms
      await tester.pumpAndSettle();

      // Should now settle on 85%
      expect(find.text('85%'), findsOneWidget);
      expect(find.text('0%'), findsNothing);
    });

    testWidgets('GlowButton scale transition triggers on tap gestures', (WidgetTester tester) async {
      bool pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: GlowButton(
                onPressed: () {
                  pressed = true;
                },
                child: const Text('SUBMIT'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('SUBMIT'), findsOneWidget);
      expect(pressed, isFalse);

      // Verify that a ScaleTransition is used to shrink on press, scoped within GlowButton
      final scaleFinder = find.descendant(
        of: find.byType(GlowButton),
        matching: find.byType(ScaleTransition),
      );
      expect(scaleFinder, findsOneWidget);
      
      ScaleTransition scaleWidget = tester.widget<ScaleTransition>(scaleFinder);
      expect(scaleWidget.scale.value, 1.0); // Starts at 1.0

      // Tap and hold (TapDown)
      final gesture = await tester.startGesture(tester.getCenter(find.text('SUBMIT')));
      await tester.pump(); // trigger tap down frame
      await tester.pump(const Duration(milliseconds: 70)); // let scale animate part-way

      // Scale should be shrinking towards 0.97
      scaleWidget = tester.widget<ScaleTransition>(scaleFinder);
      expect(scaleWidget.scale.value, lessThan(1.0));

      // Release (TapUp)
      await gesture.up();
      await tester.pumpAndSettle(); // let spring animation complete

      expect(pressed, isTrue);
      
      // Scale should be back to 1.0
      scaleWidget = tester.widget<ScaleTransition>(scaleFinder);
      expect(scaleWidget.scale.value, 1.0);
    });

    testWidgets('ShimmerSkeleton renders correctly based on shapes', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                ShimmerSkeleton(width: 200, height: 20),
                ShimmerSkeleton.circle(size: 60),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(ShimmerSkeleton), findsNWidgets(2));
      
      // Look for custom shape configurations inside containers
      final containerFinder = find.byType(Container);
      expect(containerFinder, findsNWidgets(2));
    });

    testWidgets('StatusBadge renders active pulsing dot and text label', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(
              label: 'live broadcast',
              color: Colors.green,
              animateDot: true,
            ),
          ),
        ),
      );

      // Verify label string is converted to uppercase
      expect(find.text('LIVE BROADCAST'), findsOneWidget);

      // Verify that the Stack for outer glow and core is present (pulsing dot) within the StatusBadge
      final stackFinder = find.descendant(
        of: find.byType(StatusBadge),
        matching: find.byType(Stack),
      );
      expect(stackFinder, findsOneWidget);
    });
  });
}
