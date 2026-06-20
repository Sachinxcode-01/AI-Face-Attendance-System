import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

void main() {
  group('Shimmer Loader Widget Tests', () {
    testWidgets('ShimmerBox renders correctly with specified dimensions', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ShimmerBox(width: 100, height: 50, radius: 10),
          ),
        ),
      );

      final containerFinder = find.byType(Container);
      expect(containerFinder, findsOneWidget);

      final Container container = tester.widget<Container>(containerFinder);
      expect(container.constraints?.maxWidth, 100);
      expect(container.constraints?.maxHeight, 50);
      
      final BoxDecoration decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(10));
    });

    testWidgets('ProfileShimmer renders correctly', (WidgetTester tester) async {
      // Set a standard screen size for the test
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ProfileShimmer(),
          ),
        ),
      );

      // Verify that profile shimmer elements are laid out in a scroll view
      expect(find.byType(SingleChildScrollView), findsOneWidget);
      expect(find.byType(ShimmerBox), findsAtLeast(8)); // 1 avatar, 2 headers, 7 list items

      // Reset test window size
      addTearDown(tester.view.resetPhysicalSize);
    });

    testWidgets('DashboardShimmer renders correctly', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: DashboardShimmer(),
          ),
        ),
      );

      expect(find.byType(SingleChildScrollView), findsOneWidget);
      expect(find.byType(ShimmerBox), findsAtLeast(8));

      addTearDown(tester.view.resetPhysicalSize);
    });

    testWidgets('NotificationShimmer renders correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NotificationShimmer(),
          ),
        ),
      );

      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(ShimmerBox), findsAtLeast(10));
    });
  });
}
