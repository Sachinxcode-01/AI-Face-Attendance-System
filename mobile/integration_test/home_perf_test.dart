// Profile-mode frame timing for the three home dashboards.
//
// Run against a real device/emulator:
//   flutter drive --profile -d <device> \
//     --driver=test_driver/integration_test.dart \
//     --target=integration_test/home_perf_test.dart
//
// Every line starting with "PERF " holds measured frame timings (ms) taken
// from SchedulerBinding.addTimingsCallback, i.e. real profile-mode frames.
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:integration_test/integration_test.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/admin/screens/admin_home_screen.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/student/screens/student_home_screen.dart';
import 'package:smartface_attendance/features/teacher/screens/teacher_dashboard_screen.dart';

class _FrameStats {
  final List<double> build = <double>[];
  final List<double> raster = <double>[];

  void clear() {
    build.clear();
    raster.clear();
  }

  void record(List<FrameTiming> timings) {
    for (final t in timings) {
      build.add(t.buildDuration.inMicroseconds / 1000);
      raster.add(t.rasterDuration.inMicroseconds / 1000);
    }
  }

  static double _avg(List<double> xs) =>
      xs.isEmpty ? 0 : xs.reduce((a, b) => a + b) / xs.length;

  static double _pct(List<double> xs, double p) {
    if (xs.isEmpty) return 0;
    final sorted = [...xs]..sort();
    return sorted[((sorted.length - 1) * p).round()];
  }

  static double _max(List<double> xs) => xs.isEmpty ? 0 : xs.reduce(math.max);

  String report(String label) {
    final janky = build.where((v) => v > 16.7).length;
    final jankyRaster = raster.where((v) => v > 16.7).length;
    return 'PERF $label frames=${build.length} '
        'build_avg=${_avg(build).toStringAsFixed(2)} '
        'build_p95=${_pct(build, 0.95).toStringAsFixed(2)} '
        'build_max=${_max(build).toStringAsFixed(2)} '
        'janky_build=$janky/${build.length} '
        'raster_avg=${_avg(raster).toStringAsFixed(2)} '
        'raster_p95=${_pct(raster, 0.95).toStringAsFixed(2)} '
        'raster_max=${_max(raster).toStringAsFixed(2)} '
        'janky_raster=$jankyRaster/${raster.length}';
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('profile frame timings: student / admin / teacher home', (
    WidgetTester tester,
  ) async {
    await EnvConfig.load(environment: 'development');
    await Hive.initFlutter();
    await initServiceLocator();

    final stats = _FrameStats();
    SchedulerBinding.instance.addTimingsCallback(stats.record);

    Widget wrap(Widget screen) => MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionManager>.value(
          value: sl<SessionManager>(),
        ),
        ChangeNotifierProvider<ThemeController>.value(
          value: sl<ThemeController>(),
        ),
        ChangeNotifierProvider<AppState>.value(value: sl<AppState>()),
        ChangeNotifierProvider<AnalyticsController>(
          create: (_) => sl<AnalyticsController>(),
        ),
      ],
      child: MaterialApp(debugShowCheckedModeBanner: false, home: screen),
    );

    Future<void> measure(String label, Widget screen) async {
      stats.clear();
      await tester.pumpWidget(wrap(screen));
      // ~2s of scrolling-free frames: enough for the staggered entry
      // animations (<= 480ms) plus steady-state repaints.
      for (var i = 0; i < 120; i++) {
        await tester.pump(const Duration(milliseconds: 16));
      }
      // ignore: avoid_print
      print(stats.report(label));
    }

    await measure('student', const StudentDashboard());
    await measure('admin', const AdminDashboard());
    await measure('teacher', const TeacherDashboard());

    expect(stats.build, isNotEmpty);
  });
}
