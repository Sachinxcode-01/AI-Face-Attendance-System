import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

void main() {
  testWidgets('PremiumButton renders and responds to tap', (
    WidgetTester tester,
  ) async {
    var pressed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: PremiumButton(
              onPressed: () => pressed = true,
              child: const Text('TapMe'),
            ),
          ),
        ),
      ),
    );

    expect(find.text('TapMe'), findsOneWidget);
    await tester.tap(find.byType(PremiumButton));
    await tester.pumpAndSettle();
    expect(pressed, isTrue);
  });
}
