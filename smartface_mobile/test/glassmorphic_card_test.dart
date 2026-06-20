import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/shared/widgets/glassmorphic_card.dart';

void main() {
  group('GlassmorphicCard Widget Tests', () {
    testWidgets('renders children correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GlassmorphicCard(
              child: Text('Test Child Content'),
            ),
          ),
        ),
      );

      // Verify the child content is rendered correctly
      expect(find.text('Test Child Content'), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped', (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GlassmorphicCard(
              onTap: () {
                tapped = true;
              },
              child: const Text('Tap Me'),
            ),
          ),
        ),
      );

      // Tap the card
      await tester.tap(find.text('Tap Me'));
      await tester.pump();

      // Verify callback was triggered
      expect(tapped, isTrue);
    });

    testWidgets('applies custom background, border and padding correctly', (WidgetTester tester) async {
      const customBg = Colors.purple;
      const customBorderColor = Colors.orange;
      const customPadding = EdgeInsets.all(32.0);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GlassmorphicCard(
              backgroundColor: customBg,
              borderColor: customBorderColor,
              borderWidth: 4.0,
              padding: customPadding,
              child: Text('Custom Stylings'),
            ),
          ),
        ),
      );

      final containerFinder = find.byWidgetPredicate((widget) =>
          widget is Container &&
          widget.decoration is BoxDecoration &&
          (widget.decoration as BoxDecoration).color == customBg);

      expect(containerFinder, findsOneWidget);

      final Container container = tester.widget<Container>(containerFinder);
      expect(container.padding, customPadding);

      final BoxDecoration decoration = container.decoration as BoxDecoration;
      expect(decoration.border, Border.all(color: customBorderColor, width: 4.0));
    });

    testWidgets('dynamically adjusts default colors based on theme brightness', (WidgetTester tester) async {
      // Light mode test
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Theme(
              data: ThemeData.light(),
              child: const GlassmorphicCard(
                child: Text('Light Mode'),
              ),
            ),
          ),
        ),
      );

      final Container lightContainer = tester.widget<Container>(
        find.byWidgetPredicate((widget) =>
            widget is Container && widget.decoration is BoxDecoration),
      );
      final BoxDecoration lightDecoration = lightContainer.decoration as BoxDecoration;
      expect(lightDecoration.color, isNotNull);
      expect(lightDecoration.color!.a, closeTo(0.85, 0.01));

      // Dark mode test
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Theme(
              data: ThemeData.dark(),
              child: const GlassmorphicCard(
                child: Text('Dark Mode'),
              ),
            ),
          ),
        ),
      );

      final Container darkContainer = tester.widget<Container>(
        find.byWidgetPredicate((widget) =>
            widget is Container && widget.decoration is BoxDecoration),
      );
      final BoxDecoration darkDecoration = darkContainer.decoration as BoxDecoration;
      expect(darkDecoration.color, isNotNull);
      expect(darkDecoration.color!.a, closeTo(0.04, 0.01));
    });
  });

  group('MetricCard Widget Tests', () {
    testWidgets('renders all metric elements', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              label: 'Attendance Rate',
              value: '95%',
              icon: Icons.calendar_month,
              subtitle: 'Good standing',
            ),
          ),
        ),
      );

      // Verify label, value, and subtitle are rendered
      expect(find.text('Attendance Rate'), findsOneWidget);
      expect(find.text('95%'), findsOneWidget);
      expect(find.text('Good standing'), findsOneWidget);

      // Verify the calendar icon is present
      expect(find.byIcon(Icons.calendar_month), findsOneWidget);
    });
  });
}
