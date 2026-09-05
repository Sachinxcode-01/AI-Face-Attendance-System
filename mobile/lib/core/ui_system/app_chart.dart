import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_charts/sparkcharts.dart';

/// Data point model for Syncfusion Charts
class AppChartDataPoint {
  final String x;
  final double y;
  final Color? color;

  const AppChartDataPoint(this.x, this.y, [this.color]);
}

/// AppChartWrapper — Syncfusion chart container supporting Loading, Empty, Error, and Real Data states.
class AppChartWrapper extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool isLoading;
  final String? error;
  final bool isEmpty;
  final VoidCallback? onRetry;
  final Widget child;

  const AppChartWrapper({
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13182E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 15,
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
                fontSize: 11,
                color: isDark ? Colors.white54 : const Color(0xFF7F8CA4),
              ),
            ),
          ],
          const SizedBox(height: 14),
          if (isLoading)
            const SizedBox(
              height: 160,
              child: Center(child: CircularProgressIndicator(strokeWidth: 3.0)),
            )
          else if (error != null)
            SizedBox(
              height: 160,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      color: Colors.redAccent,
                      size: 32,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      error!,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Colors.redAccent,
                      ),
                    ),
                    if (onRetry != null) ...[
                      const SizedBox(height: 6),
                      TextButton.icon(
                        onPressed: onRetry,
                        icon: const Icon(Icons.refresh, size: 14),
                        label: const Text('Retry'),
                      ),
                    ],
                  ],
                ),
              ),
            )
          else if (isEmpty)
            const SizedBox(
              height: 160,
              child: Center(
                child: Text(
                  'No attendance data available',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ),
            )
          else
            SizedBox(height: 180, child: child),
        ],
      ),
    );
  }
}

/// AppSparklineChart — Mini sparkline chart for card metrics.
class AppSparklineChart extends StatelessWidget {
  final List<double> data;
  final Color color;

  const AppSparklineChart({
    super.key,
    required this.data,
    this.color = Colors.blue,
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
