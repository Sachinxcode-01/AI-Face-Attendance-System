/*
|--------------------------------------------------------------------------
| File: analytics_components.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Collection of high-fidelity reusable widgets for Phase 7 AI Analytics.
| Contains AttendanceScoreCard, PredictionCard, InsightCard, TrendChart,
| LeaderboardCard, and HeatmapCard.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart'
    hide AttendanceRing;
import 'package:smartface_attendance/shared/widgets/attendance_ring.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';

// ============================================================================
// 1. AttendanceScoreCard
// ============================================================================

class AttendanceScoreCard extends StatelessWidget {
  final double scoreValue; // 0.0 to 1.0
  final String standing;
  final String departmentRank;
  final int streak;

  const AttendanceScoreCard({
    super.key,
    required this.scoreValue,
    required this.standing,
    required this.departmentRank,
    required this.streak,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final score = AttendanceScore.fromPercentage(scoreValue);

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: score.color.withValues(alpha: 0.15),
      child: Row(
        children: [
          // Circular Progress gauge
          AttendanceRing(
            percentage: scoreValue,
            size: 96,
            strokeWidth: 8,
            subtitle: 'Score',
            duration: const Duration(milliseconds: 1000),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      standing,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.bgDark,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: score.color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: score.color.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        score.label.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: score.color,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  departmentRank,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.redAccent.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.fireplace_rounded,
                            color: Colors.redAccent,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$streak Days Streak',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.redAccent,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. PredictionCard
// ============================================================================

class PredictionCard extends StatelessWidget {
  final AIPredictions predictions;

  const PredictionCard({super.key, required this.predictions});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Trend icon and color setup
    IconData trendIcon = Icons.trending_flat_rounded;
    Color trendColor = Colors.grey;
    if (predictions.trendDirection == 'improving') {
      trendIcon = Icons.trending_up_rounded;
      trendColor = Colors.greenAccent;
    } else if (predictions.trendDirection == 'declining') {
      trendIcon = Icons.trending_down_rounded;
      trendColor = Colors.redAccent;
    }

    // Risk color setup
    Color riskColor = Colors.greenAccent;
    if (predictions.riskLevel == 'medium') {
      riskColor = Colors.amberAccent;
    } else if (predictions.riskLevel == 'high') {
      riskColor = Colors.redAccent;
    }

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.psychology_outlined,
                color: AppColors.gold,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'SMARTFACE AI PREDICTIONS',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppColors.gold,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildPredictionMetric(
                  'Semester Projection',
                  '${predictions.semesterProjection.toStringAsFixed(0)}%',
                  isDark,
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white12),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      'Attendance Trend',
                      style: TextStyle(
                        fontSize: 10,
                        color: isDark ? Colors.white38 : Colors.black38,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(trendIcon, color: trendColor, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          predictions.trendDirection.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: trendColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white12),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      'AI Risk Level',
                      style: TextStyle(
                        fontSize: 10,
                        color: isDark ? Colors.white38 : Colors.black38,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: riskColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: riskColor.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        predictions.riskLevel.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: riskColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(
                Icons.info_outline_rounded,
                color: Colors.white38,
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  predictions.missableClasses > 0
                      ? 'You can safely miss up to ${predictions.missableClasses} classes this month while maintaining 75%+'
                      : 'Attention: You cannot miss any classes to avoid dropping below the 75% limit.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionMetric(String label, String value, bool isDark) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isDark ? Colors.white38 : Colors.black38,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.bgDark,
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// 3. InsightCard
// ============================================================================

class PersonalInsightCard extends StatelessWidget {
  final List<PersonalInsight> insights;

  const PersonalInsightCard({super.key, required this.insights});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PERSONAL SMART INSIGHTS',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white54 : Colors.black54,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(insights.length, (index) {
            final insight = insights[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: insight.color.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: insight.color.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Icon(insight.icon, color: insight.color, size: 16),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      insight.text,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white70 : Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ============================================================================
// 4. TrendChart
// ============================================================================

class TrendChart extends StatefulWidget {
  final List<dynamic> weeklyTrends;
  final List<dynamic> monthlyTrends;

  const TrendChart({
    super.key,
    required this.weeklyTrends,
    required this.monthlyTrends,
  });

  @override
  State<TrendChart> createState() => _TrendChartState();
}

class _TrendChartState extends State<TrendChart> {
  bool _showWeekly = true;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                _showWeekly ? 'Weekly Attendance Trend' : 'Monthly Performance',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.bgDark,
                ),
              ),
              // Segmented controls
              Row(
                children: [
                  _buildToggleTab('Weekly', _showWeekly),
                  _buildToggleTab('Monthly', !_showWeekly),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: _showWeekly ? _buildBarChart() : _buildLineChart(),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleTab(String text, bool active) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _showWeekly = text == 'Weekly';
        });
      },
      child: Container(
        margin: const EdgeInsets.only(left: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: active
              ? AppColors.gold.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: active
                ? AppColors.gold.withValues(alpha: 0.3)
                : Colors.transparent,
          ),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: active ? AppColors.gold : Colors.white38,
          ),
        ),
      ),
    );
  }

  Widget _buildBarChart() {
    final trends = widget.weeklyTrends;
    if (trends.isEmpty) {
      return const Center(child: Text('No trend data available'));
    }

    return BarChart(
      BarChartData(
        maxY: 7,
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          leftTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                final idx = val.toInt();
                if (idx < 0 || idx >= trends.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    trends[idx]['week'] ?? '',
                    style: const TextStyle(color: Colors.white38, fontSize: 10),
                  ),
                );
              },
            ),
          ),
        ),
        barGroups: List.generate(trends.length, (index) {
          final double val = (trends[index]['present'] as num? ?? 0.0)
              .toDouble();
          return BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: val,
                color: AppColors.gold,
                width: 12,
                borderRadius: BorderRadius.circular(4),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildLineChart() {
    final trends = widget.monthlyTrends;
    if (trends.isEmpty) {
      return const Center(child: Text('No trend data available'));
    }

    return LineChart(
      LineChartData(
        minY: 50,
        maxY: 100,
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 10,
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
                style: const TextStyle(color: Colors.white38, fontSize: 10),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                final idx = val.toInt();
                if (idx < 0 || idx >= trends.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    trends[idx]['month'] ?? '',
                    style: const TextStyle(color: Colors.white38, fontSize: 10),
                  ),
                );
              },
            ),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            isCurved: true,
            color: Colors.cyanAccent,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.cyanAccent.withValues(alpha: 0.1),
            ),
            spots: List.generate(trends.length, (index) {
              final double val = (trends[index]['percentage'] as num? ?? 0.0)
                  .toDouble();
              return FlSpot(index.toDouble(), val);
            }),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 5. LeaderboardCard
// ============================================================================

class LeaderboardCard extends StatelessWidget {
  final List<LeaderboardEntry> entries;

  const LeaderboardCard({super.key, required this.entries});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                'LEADERBOARD STANDINGS',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white54 : Colors.black54,
                  letterSpacing: 1.5,
                ),
              ),
              const Icon(
                Icons.emoji_events_outlined,
                color: AppColors.gold,
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(entries.length, (index) {
            final entry = entries[index];
            final Color rankColor = entry.rank == 1
                ? AppColors.gold
                : entry.rank == 2
                ? Colors.grey
                : entry.rank == 3
                ? Colors.deepOrangeAccent
                : Colors.white38;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: entry.isMe
                    ? AppColors.gold.withValues(alpha: 0.06)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: entry.isMe
                      ? AppColors.gold.withValues(alpha: 0.2)
                      : Colors.transparent,
                ),
              ),
              child: Row(
                children: [
                  // Rank number
                  Container(
                    width: 24,
                    alignment: Alignment.center,
                    child: Text(
                      '#${entry.rank}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: rankColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Name and dept
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.name,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: entry.isMe
                                ? FontWeight.bold
                                : FontWeight.w600,
                            color: isDark ? Colors.white : AppColors.bgDark,
                          ),
                        ),
                        Text(
                          entry.department,
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.white38,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Score
                  Text(
                    '${entry.score.toStringAsFixed(0)}%',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: entry.score >= 90.0
                          ? Colors.greenAccent
                          : AppColors.gold,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ============================================================================
// 6. HeatmapCard
// ============================================================================

class HeatmapCard extends StatelessWidget {
  final Map<String, dynamic> heatmapData;

  const HeatmapCard({super.key, required this.heatmapData});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // We render a standard grid representing days of June 2026 (30 days, starts on Monday)
    // 5 rows, 7 columns
    final List<int> days = List.generate(30, (i) => i + 1);

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
                'ATTENDANCE HEATMAP (JUNE)',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white54 : Colors.black54,
                  letterSpacing: 1.5,
                ),
              ),
              const Icon(
                Icons.grid_on_rounded,
                color: Colors.white30,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 30,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemBuilder: (context, index) {
              final dayNum = days[index];
              final dateStr = '2026-06-${dayNum.toString().padLeft(2, '0')}';
              final status = heatmapData[dateStr] as String?;

              Color cellColor = isDark
                  ? Colors.white.withValues(alpha: 0.03)
                  : Colors.black.withValues(alpha: 0.03);
              Border border = Border.all(
                color: Colors.white.withValues(alpha: 0.04),
              );

              if (status == 'present') {
                cellColor = Colors.greenAccent.withValues(alpha: 0.25);
                border = Border.all(
                  color: Colors.greenAccent.withValues(alpha: 0.4),
                );
              } else if (status == 'absent') {
                cellColor = Colors.redAccent.withValues(alpha: 0.2);
                border = Border.all(
                  color: Colors.redAccent.withValues(alpha: 0.3),
                );
              }

              return Container(
                decoration: BoxDecoration(
                  color: cellColor,
                  borderRadius: BorderRadius.circular(8),
                  border: border,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$dayNum',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: status != null
                        ? (status == 'present'
                              ? Colors.greenAccent
                              : Colors.redAccent)
                        : (isDark ? Colors.white38 : Colors.black38),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _buildLegendDot(Colors.greenAccent, 'Present'),
              const SizedBox(width: 16),
              _buildLegendDot(Colors.redAccent, 'Absent'),
              const SizedBox(width: 16),
              _buildLegendDot(Colors.white38, 'No Class'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendDot(Color color, String text) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontSize: 10, color: Colors.white38)),
      ],
    );
  }
}
