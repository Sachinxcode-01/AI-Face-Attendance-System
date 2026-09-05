import 'package:flutter/material.dart';
import 'package:graphic/graphic.dart' as g;
import 'package:syncfusion_flutter_charts/charts.dart';
import 'analytics_models.dart';
import 'pseudo_3d_effects.dart';
import 'analytics_theme.dart';

/// Pseudo3DBarChart — Custom layered bar chart leveraging Graphic 2.7.0.
class Pseudo3DBarChart extends StatelessWidget {
  final List<SubjectAttendancePoint> data;
  final double height;

  const Pseudo3DBarChart({super.key, required this.data, this.height = 200});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const SizedBox(
        height: 180,
        child: Center(
          child: Text(
            'No subject attendance data',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    final chartData = data
        .map((e) => {'subject': e.subjectCode, 'percentage': e.percentage})
        .toList();

    return Pseudo3DEffects.wrapWithDepth(
      child: SizedBox(
        height: height,
        child: g.Chart(
          data: chartData,
          variables: {
            'subject': g.Variable(
              accessor: (Map map) => map['subject'] as String,
            ),
            'percentage': g.Variable(
              accessor: (Map map) => map['percentage'] as num,
            ),
          },
          marks: [
            g.IntervalMark(
              color: g.ColorEncode(value: AnalyticsTheme.primaryBlue),
            ),
          ],
          axes: [g.Defaults.horizontalAxis, g.Defaults.verticalAxis],
        ),
      ),
    );
  }
}

/// Pseudo3DDonutChart — Syncfusion donut chart with pseudo-3D styling.
class Pseudo3DDonutChart extends StatelessWidget {
  final double percentage;
  final String title;

  const Pseudo3DDonutChart({
    super.key,
    required this.percentage,
    this.title = 'Overall Attendance',
  });

  @override
  Widget build(BuildContext context) {
    final present = percentage;
    final absent = (100.0 - percentage).clamp(0.0, 100.0);

    final chartData = [
      _DonutSegment('Present', present, const Color(0xFF10B981)),
      _DonutSegment('Absent', absent, const Color(0xFFEF4444)),
    ];

    return Pseudo3DEffects.wrapWithDepth(
      child: SizedBox(
        height: 200,
        child: SfCircularChart(
          title: ChartTitle(
            text: title,
            textStyle: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 14,
              color: Colors.white,
            ),
          ),
          series: <CircularSeries>[
            DoughnutSeries<_DonutSegment, String>(
              dataSource: chartData,
              xValueMapper: (_DonutSegment data, _) => data.label,
              yValueMapper: (_DonutSegment data, _) => data.value,
              pointColorMapper: (_DonutSegment data, _) => data.color,
              innerRadius: '65%',
              dataLabelSettings: const DataLabelSettings(isVisible: true),
            ),
          ],
        ),
      ),
    );
  }
}

class _DonutSegment {
  final String label;
  final double value;
  final Color color;

  _DonutSegment(this.label, this.value, this.color);
}
