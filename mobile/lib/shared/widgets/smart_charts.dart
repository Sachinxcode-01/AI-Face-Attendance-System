import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:syncfusion_flutter_charts/sparkcharts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Standardized Chart Data Point model used across Syncfusion Charts
class ChartDataPoint {
  final String x;
  final double y;
  final Color? color;
  final String? label;

  const ChartDataPoint(this.x, this.y, [this.color, this.label]);
}

/// ── Chart Data States Container Wrapper ──────────────────────────────────────
class SmartChartWrapper extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool isLoading;
  final String? error;
  final bool isEmpty;
  final VoidCallback? onRetry;
  final Widget child;

  const SmartChartWrapper({
    super.key,
    required this.title,
    this.subtitle,
    this.isLoading = false,
    this.error,
    this.isEmpty = false,
    this.onRetry,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13182E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.3)
                : const Color(0xFF9EAFD8).withValues(alpha: 0.12),
            blurRadius: 16,
            spreadRadius: 2,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF1B2C56),
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 11.5,
                        color: isDark
                            ? Colors.white54
                            : const Color(0xFF7F8CA4),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (isLoading)
            const SizedBox(
              height: 180,
              child: Center(child: CircularProgressIndicator(strokeWidth: 3.0)),
            )
          else if (error != null)
            SizedBox(
              height: 180,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      color: AppColors.error,
                      size: 36,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.error,
                      ),
                    ),
                    if (onRetry != null) ...[
                      const SizedBox(height: 8),
                      TextButton.icon(
                        onPressed: onRetry,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Retry'),
                      ),
                    ],
                  ],
                ),
              ),
            )
          else if (isEmpty)
            const SizedBox(
              height: 180,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.bar_chart_outlined,
                      color: Colors.grey,
                      size: 40,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'No attendance data available',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            )
          else
            SizedBox(height: 200, child: child),
        ],
      ),
    );
  }
}

/// ── 1. AttendanceDonutChart (Present vs Absent / Leave) ──────────────────────
class AttendanceDonutChart extends StatelessWidget {
  final double presentPercentage;
  final double absentPercentage;
  final double leavePercentage;
  final String centerLabel;

  const AttendanceDonutChart({
    super.key,
    required this.presentPercentage,
    this.absentPercentage = 0.0,
    this.leavePercentage = 0.0,
    this.centerLabel = 'Present',
  });

  @override
  Widget build(BuildContext context) {
    final effectiveAbsent = absentPercentage > 0
        ? absentPercentage
        : ((1.0 - presentPercentage - leavePercentage).clamp(0.0, 1.0));

    final List<ChartDataPoint> data = [
      ChartDataPoint('Present', presentPercentage * 100, AppColors.success),
      ChartDataPoint('Absent', effectiveAbsent * 100, AppColors.error),
      if (leavePercentage > 0)
        ChartDataPoint('Leave', leavePercentage * 100, AppColors.warning),
    ];

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SfCircularChart(
      tooltipBehavior: TooltipBehavior(enable: true),
      legend: Legend(
        isVisible: true,
        position: LegendPosition.bottom,
        overflowMode: LegendItemOverflowMode.wrap,
        textStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          color: isDark ? Colors.white70 : const Color(0xFF4A5568),
        ),
      ),
      annotations: <CircularChartAnnotation>[
        CircularChartAnnotation(
          widget: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${(presentPercentage * 100).round()}%',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF1B2C56),
                ),
              ),
              Text(
                centerLabel,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 10,
                  color: AppColors.success,
                ),
              ),
            ],
          ),
        ),
      ],
      series: <CircularSeries>[
        DoughnutSeries<ChartDataPoint, String>(
          dataSource: data,
          xValueMapper: (ChartDataPoint d, _) => d.x,
          yValueMapper: (ChartDataPoint d, _) => d.y,
          pointColorMapper: (ChartDataPoint d, _) => d.color,
          innerRadius: '68%',
          radius: '85%',
          dataLabelSettings: const DataLabelSettings(isVisible: false),
        ),
      ],
    );
  }
}

/// ── 2. AttendanceTrendChart (Line / Spline Area Trend) ───────────────────────
class AttendanceTrendChart extends StatelessWidget {
  final List<ChartDataPoint> dataPoints;
  final Color seriesColor;

  const AttendanceTrendChart({
    super.key,
    required this.dataPoints,
    this.seriesColor = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SfCartesianChart(
      tooltipBehavior: TooltipBehavior(enable: true),
      primaryXAxis: CategoryAxis(
        majorGridLines: const MajorGridLines(width: 0),
        labelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 10,
          color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
        ),
      ),
      primaryYAxis: NumericAxis(
        minimum: 0,
        maximum: 100,
        interval: 20,
        axisLine: const AxisLine(width: 0),
        majorTickLines: const MajorTickLines(size: 0),
        labelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 10,
          color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
        ),
      ),
      series: <CartesianSeries>[
        SplineAreaSeries<ChartDataPoint, String>(
          dataSource: dataPoints,
          xValueMapper: (ChartDataPoint d, _) => d.x,
          yValueMapper: (ChartDataPoint d, _) => d.y,
          color: seriesColor.withValues(alpha: 0.25),
          borderColor: seriesColor,
          borderWidth: 2.5,
          splineType: SplineType.natural,
        ),
      ],
    );
  }
}

/// ── 3. SubjectBarChart (Bar / Column chart per subject) ──────────────────────
class SubjectBarChart extends StatelessWidget {
  final List<ChartDataPoint> subjectsData;

  const SubjectBarChart({super.key, required this.subjectsData});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SfCartesianChart(
      tooltipBehavior: TooltipBehavior(enable: true),
      primaryXAxis: CategoryAxis(
        majorGridLines: const MajorGridLines(width: 0),
        labelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 10,
          color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
        ),
      ),
      primaryYAxis: NumericAxis(
        minimum: 0,
        maximum: 100,
        interval: 25,
        axisLine: const AxisLine(width: 0),
        labelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 10,
          color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
        ),
      ),
      series: <CartesianSeries>[
        ColumnSeries<ChartDataPoint, String>(
          dataSource: subjectsData,
          xValueMapper: (ChartDataPoint d, _) => d.x,
          yValueMapper: (ChartDataPoint d, _) => d.y,
          pointColorMapper: (ChartDataPoint d, _) =>
              d.color ?? AppColors.primary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
          width: 0.5,
        ),
      ],
    );
  }
}

/// ── 4. MiniSparklineChart (Compact Trend Line inside cards) ─────────────────
class MiniSparklineChart extends StatelessWidget {
  final List<double> data;
  final Color color;

  const MiniSparklineChart({
    super.key,
    required this.data,
    this.color = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();
    return SfSparkLineChart(
      data: data,
      color: color,
      width: 2.0,
      marker: const SparkChartMarker(
        displayMode: SparkChartMarkerDisplayMode.last,
        size: 5,
      ),
    );
  }
}
