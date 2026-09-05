import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

void main() {
  testWidgets('GlassCard builds and shows child', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: GlassCard(child: Text('Glass'))),
        ),
      ),
    );

    expect(find.text('Glass'), findsOneWidget);
    expect(find.byType(GlassCard), findsOneWidget);
  });
}
