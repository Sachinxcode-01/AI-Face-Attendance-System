import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/design_system/components/app_staggered_animations.dart';

void main() {
  group('AppStaggeredAnimations Unit & Widget Tests', () {
    testWidgets('StaggeredColumn renders children cleanly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StaggeredColumn(
              children: [Text('Item 1'), Text('Item 2'), Text('Item 3')],
            ),
          ),
        ),
      );

      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
      expect(find.text('Item 3'), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.text('Item 1'), findsOneWidget);
    });

    testWidgets('StaggeredListItem renders child cleanly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AnimationLimiter(
              child: ListView(
                children: const [
                  StaggeredListItem(
                    position: 0,
                    child: Text('Staggered List Element'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Staggered List Element'), findsOneWidget);
      await tester.pumpAndSettle();
      expect(find.text('Staggered List Element'), findsOneWidget);
    });

    testWidgets('StaggeredGridItem renders child cleanly in GridView', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AnimationLimiter(
              child: GridView.count(
                crossAxisCount: 2,
                children: const [
                  StaggeredGridItem(
                    position: 0,
                    columnCount: 2,
                    child: Text('Grid Card 1'),
                  ),
                  StaggeredGridItem(
                    position: 1,
                    columnCount: 2,
                    child: Text('Grid Card 2'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Grid Card 1'), findsOneWidget);
      expect(find.text('Grid Card 2'), findsOneWidget);
      await tester.pumpAndSettle();
      expect(find.text('Grid Card 1'), findsOneWidget);
    });

    testWidgets('StaggeredRow renders children cleanly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StaggeredRow(children: [Text('Chip 1'), Text('Chip 2')]),
          ),
        ),
      );

      expect(find.text('Chip 1'), findsOneWidget);
      expect(find.text('Chip 2'), findsOneWidget);
      await tester.pumpAndSettle();
      expect(find.text('Chip 1'), findsOneWidget);
    });
  });
}
