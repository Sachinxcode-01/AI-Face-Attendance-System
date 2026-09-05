import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/shared/widgets/premium_carousel.dart';
import 'package:smartface_attendance/shared/widgets/smart_charts.dart';
import 'package:smartface_attendance/shared/widgets/smart_salomon_bottom_bar.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PremiumCarousel Tests', () {
    testWidgets('renders PremiumCarousel items and indicators', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PremiumCarousel<String>(
              items: const ['Slide 1', 'Slide 2', 'Slide 3'],
              itemBuilder: (context, item, index) {
                return Container(
                  color: Colors.blue,
                  child: Center(child: Text(item)),
                );
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(PremiumCarousel<String>), findsOneWidget);
      expect(find.text('Slide 1'), findsOneWidget);
    });
  });

  group('Syncfusion SmartCharts Tests', () {
    testWidgets('renders SmartChartWrapper loading, empty, and data states', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: Column(
                children: [
                  SmartChartWrapper(
                    title: 'Loading Chart',
                    isLoading: true,
                    child: SizedBox(),
                  ),
                  SmartChartWrapper(
                    title: 'Empty Chart',
                    isEmpty: true,
                    child: SizedBox(),
                  ),
                  SmartChartWrapper(
                    title: 'Donut Chart',
                    child: AttendanceDonutChart(presentPercentage: 0.85),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Loading Chart'), findsOneWidget);
      expect(find.text('Empty Chart'), findsOneWidget);
      expect(find.text('No attendance data available'), findsOneWidget);
      expect(find.text('Donut Chart'), findsOneWidget);
    });

    testWidgets(
      'renders AttendanceTrendChart and SubjectBarChart with data points',
      (WidgetTester tester) async {
        const dataPoints = [
          ChartDataPoint('Mon', 85),
          ChartDataPoint('Tue', 90),
          ChartDataPoint('Wed', 88),
        ];

        await tester.pumpWidget(
          const MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  Expanded(child: AttendanceTrendChart(dataPoints: dataPoints)),
                  Expanded(child: SubjectBarChart(subjectsData: dataPoints)),
                ],
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(find.byType(AttendanceTrendChart), findsOneWidget);
        expect(find.byType(SubjectBarChart), findsOneWidget);
      },
    );
  });

  group('SmartSalomonBottomBar Tests', () {
    testWidgets('renders SmartSalomonBottomBar with items for role', (
      WidgetTester tester,
    ) async {
      int selectedIndex = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: SmartSalomonBottomBar(
              currentIndex: selectedIndex,
              onTap: (index) {
                selectedIndex = index;
              },
              role: 'student',
              items: const [
                SmartSalomonNavItemData(
                  icon: Icons.home_outlined,
                  animateIcon: AnimateIcons.home,
                  title: 'Home',
                  route: '/home',
                ),
                SmartSalomonNavItemData(
                  icon: Icons.calendar_today_outlined,
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
      expect(find.byType(SmartSalomonBottomBar), findsOneWidget);
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Schedule'), findsOneWidget);
    });
  });
}
