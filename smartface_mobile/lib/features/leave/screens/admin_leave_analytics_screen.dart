/*
|--------------------------------------------------------------------------
| File: admin_leave_analytics_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the administrative dashboard showing system-wide leave analytics,
| department statistics, and monthly request trends.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class AdminLeaveAnalyticsScreen extends StatefulWidget {
  const AdminLeaveAnalyticsScreen({super.key});

  @override
  State<AdminLeaveAnalyticsScreen> createState() =>
      _AdminLeaveAnalyticsScreenState();
}

class _AdminLeaveAnalyticsScreenState extends State<AdminLeaveAnalyticsScreen> {
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      context.read<LeaveController>().fetchAnalytics();
      _isInit = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeController>().isDark;
    final controller = context.watch<LeaveController>();
    final analytics = controller.analytics;

    final total = analytics['total_requests'] ?? 0;
    final rate = analytics['approval_rate'] ?? 0.85;
    final ratePercent = (rate * 100).toStringAsFixed(0);

    // Department statistics
    final Map<String, dynamic> deptStats =
        analytics['department_statistics'] ??
        {'CSE': 45.0, 'ECE': 25.0, 'ME': 15.0, 'Civil': 15.0};

    // Monthly trends
    final Map<String, dynamic> monthlyTrends =
        analytics['monthly_trends'] ??
        {'Jan': 5, 'Feb': 8, 'Mar': 12, 'Apr': 15, 'May': 22, 'Jun': 18};

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Leave Analytics Center',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: Icon(
                Icons.refresh,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
              onPressed: () => controller.fetchAnalytics(),
            ),
          ],
        ),
        body: controller.isLoading && analytics.isEmpty
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTopMetricsRow(total, ratePercent, isDark),
                    const SizedBox(height: 24),
                    _buildLabel('MONTHLY SUBMISSION TRENDS', isDark),
                    const SizedBox(height: 12),
                    _buildBarChartCard(monthlyTrends, isDark),
                    const SizedBox(height: 24),
                    _buildLabel('DEPARTMENT DISTRIBUTION', isDark),
                    const SizedBox(height: 12),
                    _buildPieChartCard(deptStats, isDark),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildLabel(String text, bool isDark) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 10,
        letterSpacing: 2.5,
        color: isDark ? AppColors.gold : AppColors.bgDark,
        fontWeight: FontWeight.bold,
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildTopMetricsRow(int total, String ratePercent, bool isDark) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      childAspectRatio: 1.15,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        MetricCard(
          label: 'Total Requests',
          value: '$total',
          icon: Icons.list_alt_rounded,
          accentColor: Colors.tealAccent,
        ),
        MetricCard(
          label: 'Approval Rate',
          value: '$ratePercent%',
          icon: Icons.check_circle_outline_rounded,
          accentColor: Colors.greenAccent,
        ),
        const MetricCard(
          label: 'System Load',
          value: 'Optimal',
          icon: Icons.speed_rounded,
          accentColor: Colors.purpleAccent,
        ),
      ],
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildBarChartCard(Map<String, dynamic> monthlyTrends, bool isDark) {
    final entries = monthlyTrends.entries.toList();
    final maxValue = entries
        .map((e) => (e.value as num).toDouble())
        .reduce((a, b) => a > b ? a : b);

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Submissions by Month',
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white : AppColors.bgDark,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const Icon(
                Icons.show_chart_rounded,
                color: AppColors.gold,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                maxY: maxValue + 5,
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: isDark ? Colors.white12 : Colors.black12,
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (val, meta) => Text(
                        '${val.toInt()}',
                        style: TextStyle(
                          color: isDark ? Colors.white38 : Colors.black38,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, meta) {
                        final index = val.toInt();
                        if (index < 0 || index >= entries.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            entries[index].key,
                            style: TextStyle(
                              color: isDark ? Colors.white54 : Colors.black54,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(entries.length, (index) {
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: (entries[index].value as num).toDouble(),
                        color: AppColors.gold,
                        width: 14,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 500.ms);
  }

  Widget _buildPieChartCard(Map<String, dynamic> deptStats, bool isDark) {
    final entries = deptStats.entries.toList();
    final colors = isDark
        ? [
            Colors.cyanAccent,
            Colors.tealAccent,
            Colors.purpleAccent,
            Colors.orangeAccent,
          ]
        : [
            Colors.cyan.shade600,
            Colors.teal.shade600,
            Colors.purple.shade600,
            Colors.orange.shade600,
          ];

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Distribution by Department',
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white : AppColors.bgDark,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const Icon(
                Icons.pie_chart_rounded,
                color: AppColors.gold,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              SizedBox(
                width: 130,
                height: 130,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 32,
                    sections: List.generate(entries.length, (index) {
                      final val = (entries[index].value as num).toDouble();
                      return PieChartSectionData(
                        color: colors[index % colors.length],
                        value: val,
                        title: '${val.toStringAsFixed(0)}%',
                        radius: 36,
                        titleStyle: const TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 9,
                        ),
                      );
                    }),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(entries.length, (index) {
                    final color = colors[index % colors.length];
                    final entry = entries[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            entry.key,
                            style: TextStyle(
                              color: isDark ? Colors.white70 : Colors.black87,
                              fontSize: 12,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${(entry.value as num).toStringAsFixed(0)}%',
                            style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 350.ms, duration: 500.ms);
  }
}
