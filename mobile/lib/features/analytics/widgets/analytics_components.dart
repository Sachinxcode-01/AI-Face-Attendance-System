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
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/shared/widgets/smart_charts.dart';
import 'package:smartface_attendance/shared/widgets/premium_carousel.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart'
    hide AttendanceRing;
import 'package:smartface_attendance/shared/widgets/attendance_ring.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';
import 'package:smartface_attendance/shared/widgets/dashboard_widgets.dart';

// ============================================================================
// 1. AttendanceScoreCard
// ============================================================================

class AttendanceScoreCard extends StatelessWidget {
  final double scoreValue; // 0.0 to 1.0
  final String standing;
  final String departmentRank;
  final int? streak;

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
    final streakValue = streak;

    return ModernDashboardCard(
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
                        color: isDark ? Colors.white : const Color(0xFF1B2C56),
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
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : const Color(0xFF7F8CA4),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (streakValue == null)
                      Text(
                        'Streak unavailable',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: isDark
                              ? Colors.white54
                              : const Color(0xFF7F8CA4),
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.heavyImpact();
                          showSnapchatStreakCelebration(context, streakValue);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.deepOrangeAccent.withValues(
                              alpha: 0.12,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.deepOrangeAccent.withValues(
                                alpha: 0.35,
                              ),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.local_fire_department_rounded,
                                color: Colors.deepOrangeAccent,
                                size: 15,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '$streakValue Days Streak',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.deepOrangeAccent,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                streakValue >= 30
                                    ? '👑'
                                    : streakValue >= 14
                                    ? '🔥'
                                    : streakValue >= 7
                                    ? '⚡'
                                    : '🥉',
                                style: const TextStyle(fontSize: 10),
                              ),
                            ],
                          ),
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

    final dividerColor = isDark
        ? Colors.white.withValues(alpha: 0.1)
        : const Color(0xFFE2E8F0);

    return ModernDashboardCard(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.psychology_outlined,
                color: Color(0xFF3559E0),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'SMARTFACE AI PREDICTIONS',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF3559E0),
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _buildPredictionMetric(
                    'Semester\nProjection',
                    '${predictions.semesterProjection.toStringAsFixed(0)}%',
                    isDark,
                  ),
                ),
              ),
              Container(width: 1, height: 44, color: dividerColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        'Attendance\nTrend',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? Colors.white60
                              : const Color(0xFF7F8CA4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(trendIcon, color: trendColor, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              predictions.trendDirection.toUpperCase(),
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: trendColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Container(width: 1, height: 44, color: dividerColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        'AI Risk\nLevel',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? Colors.white60
                              : const Color(0xFF7F8CA4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: riskColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: riskColor.withValues(alpha: 0.35),
                          ),
                        ),
                        child: Text(
                          predictions.riskLevel.toUpperCase(),
                          textAlign: TextAlign.center,
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
              ),
            ],
          ),
          const SizedBox(height: 18),
          Divider(color: dividerColor, height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(
                Icons.info_outline_rounded,
                color: Color(0xFF7F8CA4),
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  predictions.missableClasses > 0
                      ? 'You can safely miss up to ${predictions.missableClasses} classes without dropping below the target threshold.'
                      : 'Attention: You cannot miss any classes to avoid dropping below the 75% limit.',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isDark ? Colors.white70 : const Color(0xFF1B2C56),
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
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : const Color(0xFF1B2C56),
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
    if (insights.isEmpty) return const SizedBox.shrink();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ModernDashboardCard(
      padding: const EdgeInsets.all(16),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PERSONAL SMART INSIGHTS',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF7F8CA4),
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          PremiumCarousel<PersonalInsight>(
            items: insights,
            height: 72.0,
            viewportFraction: 0.95,
            autoPlay: true,
            showIndicators: true,
            semanticLabel: 'Personal Insights Carousel',
            itemBuilder: (context, insight, index) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF19213D)
                      : const Color(0xFFF4F6FC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: insight.color.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(insight.icon, color: insight.color, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        insight.text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: isDark
                              ? Colors.white70
                              : const Color(0xFF1B2C56),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
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
            children: [
              Expanded(
                child: Text(
                  _showWeekly ? 'Weekly Trend' : 'Monthly Performance',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF1B2C56),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : const Color(0xFFEFF2F8),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildToggleTab('Weekly', _showWeekly),
                    _buildToggleTab('Monthly', !_showWeekly),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
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
        HapticFeedback.selectionClick();
        setState(() {
          _showWeekly = text == 'Weekly';
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF3559E0) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: active ? Colors.white : const Color(0xFF7F8CA4),
          ),
        ),
      ),
    );
  }

  Widget _buildBarChart() {
    final trends = widget.weeklyTrends;
    if (trends.isEmpty) {
      return const Center(child: Text('No weekly trend data available'));
    }

    final subjectsData = trends.map((t) {
      final String label = t['week']?.toString() ?? t['day']?.toString() ?? '';
      final double val =
          ((t['present'] ?? t['rate'] ?? t['percentage'] ?? 0) as num)
              .toDouble();
      return ChartDataPoint(label, val);
    }).toList();

    return SubjectBarChart(subjectsData: subjectsData);
  }

  Widget _buildLineChart() {
    final trends = widget.monthlyTrends;
    if (trends.isEmpty) {
      return const Center(child: Text('No monthly trend data available'));
    }

    final dataPoints = trends.map((t) {
      final String month = t['month']?.toString() ?? '';
      final double val =
          ((t['rate'] ?? t['percentage'] ?? t['present'] ?? 80) as num)
              .toDouble();
      return ChartDataPoint(month, val);
    }).toList();

    return AttendanceTrendChart(dataPoints: dataPoints);
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
    return ModernDashboardCard(
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
                  color: const Color(0xFF7F8CA4),
                  letterSpacing: 1.5,
                ),
              ),
              const Icon(
                Icons.emoji_events_outlined,
                color: Color(0xFF3559E0),
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (entries.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  'Standings are calculating in real-time.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF7F8CA4),
                  ),
                ),
              ),
            )
          else
            ...List.generate(entries.length, (index) {
              final entry = entries[index];
              final Color rankColor = entry.rank == 1
                  ? const Color(0xFFFFB800) // Gold
                  : entry.rank == 2
                  ? const Color(0xFF94A3B8) // Silver
                  : entry.rank == 3
                  ? const Color(0xFFCD7F32) // Bronze
                  : const Color(0xFF7F8CA4);

              final String medalIcon = entry.rank == 1
                  ? '🥇'
                  : entry.rank == 2
                  ? '🥈'
                  : entry.rank == 3
                  ? '🥉'
                  : '#${entry.rank}';

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: entry.isMe
                      ? const Color(0xFF3559E0).withValues(alpha: 0.12)
                      : (isDark
                            ? Colors.white.withValues(alpha: 0.02)
                            : const Color(0xFFF8FAFC)),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: entry.isMe
                        ? const Color(0xFF3559E0).withValues(alpha: 0.4)
                        : Colors.transparent,
                    width: entry.isMe ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      alignment: Alignment.center,
                      child: Text(
                        medalIcon,
                        style: GoogleFonts.inter(
                          fontSize: entry.rank <= 3 ? 16 : 13,
                          fontWeight: FontWeight.bold,
                          color: rankColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  entry.name,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: entry.isMe
                                        ? FontWeight.bold
                                        : FontWeight.w600,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF1B2C56),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (entry.isMe) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 1,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3559E0),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'YOU',
                                    style: GoogleFonts.inter(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            entry.department,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF7F8CA4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${entry.score.toStringAsFixed(0)}%',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: entry.score >= 90.0
                            ? const Color(0xFF10B981)
                            : const Color(0xFF3559E0),
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
// 6. Real Interactive Calendar & Attendance Heatmap with Snapchat Streaks
// ============================================================================

class HeatmapCard extends StatefulWidget {
  final Map<String, dynamic> heatmapData;
  final int? streak;

  const HeatmapCard({super.key, required this.heatmapData, this.streak});

  @override
  State<HeatmapCard> createState() => _HeatmapCardState();
}

class _HeatmapCardState extends State<HeatmapCard> {
  late DateTime _selectedMonth;

  static const List<String> _monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  static const List<String> _weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedMonth = DateTime(now.year, now.month, 1);
  }

  void _previousMonth() {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedMonth = DateTime(
        _selectedMonth.year,
        _selectedMonth.month - 1,
        1,
      );
    });
  }

  void _nextMonth() {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedMonth = DateTime(
        _selectedMonth.year,
        _selectedMonth.month + 1,
        1,
      );
    });
  }

  int _calculateActiveStreak() {
    if (widget.streak != null) {
      return widget.streak!;
    }
    // Calculate from heatmapData
    final now = DateTime.now();
    int count = 0;
    for (int i = 0; i < 45; i++) {
      final d = now.subtract(Duration(days: i));
      if (d.weekday == DateTime.saturday || d.weekday == DateTime.sunday) {
        continue;
      }
      final ds =
          '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      final status = (widget.heatmapData[ds] ?? '').toString().toLowerCase();
      if (status == 'present') {
        count++;
      } else if (i == 0) {
        // Not marked today yet, continue checking yesterday
        continue;
      } else {
        break;
      }
    }
    return count;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();
    final streak = _calculateActiveStreak();

    final daysInMonth = DateUtils.getDaysInMonth(
      _selectedMonth.year,
      _selectedMonth.month,
    );
    final firstDayWeekday = DateTime(
      _selectedMonth.year,
      _selectedMonth.month,
      1,
    ).weekday; // 1 = Mon, 7 = Sun
    final offset = firstDayWeekday - 1; // 0 to 6

    // Tally current month statistics
    int presentCount = 0;
    int absentCount = 0;
    for (int day = 1; day <= daysInMonth; day++) {
      final dateStr =
          '${_selectedMonth.year}-${_selectedMonth.month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
      final status = widget.heatmapData[dateStr]?.toString().toLowerCase();
      if (status == 'present') {
        presentCount++;
      }
      if (status == 'absent') {
        absentCount++;
      }
    }

    final monthTitle =
        '${_monthNames[_selectedMonth.month - 1].toUpperCase()} ${_selectedMonth.year}';

    return ModernDashboardCard(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Month Navigation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.calendar_month_rounded,
                    color: Color(0xFF6366F1),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'ATTENDANCE CALENDAR',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF7F8CA4),
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    color: const Color(0xFF7F8CA4),
                    onPressed: _previousMonth,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    monthTitle,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF1B2C56),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    color: const Color(0xFF7F8CA4),
                    onPressed: _nextMonth,
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Snapchat-Style Attendance Streak Banner
          GestureDetector(
            onTap: streak > 0
                ? () {
                    HapticFeedback.heavyImpact();
                    showSnapchatStreakCelebration(context, streak);
                  }
                : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                gradient: streak > 0
                    ? const LinearGradient(
                        colors: [Color(0xFF2E1A11), Color(0xFF1F182F)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF1E2230), const Color(0xFF141724)]
                            : [
                                const Color(0xFFF1F5F9),
                                const Color(0xFFE2E8F0),
                              ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: streak > 0
                      ? Colors.deepOrangeAccent.withValues(alpha: 0.35)
                      : (isDark
                            ? Colors.white.withValues(alpha: 0.1)
                            : const Color(0xFFCBD5E1)),
                  width: 1.2,
                ),
                boxShadow: streak > 0
                    ? [
                        BoxShadow(
                          color: Colors.deepOrangeAccent.withValues(
                            alpha: 0.15,
                          ),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: streak > 0
                          ? Colors.deepOrange.withValues(alpha: 0.2)
                          : (isDark
                                ? Colors.white.withValues(alpha: 0.05)
                                : const Color(0xFFE2E8F0)),
                      shape: BoxShape.circle,
                    ),
                    child: streak > 0
                        ? const Icon(
                                Icons.local_fire_department_rounded,
                                color: Colors.deepOrangeAccent,
                                size: 26,
                              )
                              .animate(onPlay: (c) => c.repeat(reverse: true))
                              .scale(
                                begin: const Offset(0.9, 0.9),
                                end: const Offset(1.12, 1.12),
                                duration: 800.ms,
                                curve: Curves.easeInOut,
                              )
                        : Icon(
                            Icons.local_fire_department_outlined,
                            color: isDark
                                ? const Color(0xFF7F8CA4)
                                : const Color(0xFF64748B),
                            size: 26,
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              streak > 0
                                  ? '🔥 $streak DAY STREAK'
                                  : 'NO ACTIVE STREAK',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: streak > 0
                                    ? Colors.orangeAccent
                                    : (isDark
                                          ? const Color(0xFF94A3B8)
                                          : const Color(0xFF475569)),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: streak > 0
                                    ? Colors.deepOrangeAccent
                                    : (isDark
                                          ? Colors.white12
                                          : const Color(0xFFCBD5E1)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                streak >= 14
                                    ? 'ELITE'
                                    : streak > 0
                                    ? 'ACTIVE'
                                    : 'INACTIVE',
                                style: GoogleFonts.inter(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: streak > 0
                                      ? Colors.black
                                      : (isDark
                                            ? Colors.white70
                                            : const Color(0xFF475569)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          streak > 0
                              ? 'Streak on fire! Tap to inspect Snapchat streak milestone.'
                              : 'Check into your scheduled lectures to build a streak.',
                          style: GoogleFonts.inter(
                            fontSize: 10.5,
                            color: isDark
                                ? Colors.white70
                                : const Color(0xFF64748B),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 13,
                    color: streak > 0
                        ? Colors.orangeAccent
                        : const Color(0xFF7F8CA4),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Attendance Summary Counters (Attended / Absent)
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 12,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFF10B981).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF10B981),
                        size: 15,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$presentCount Attended',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 12,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.cancel_rounded,
                        color: Color(0xFFEF4444),
                        size: 15,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$absentCount Absent',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFEF4444),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Weekday Labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _weekdays
                .map(
                  (day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF7F8CA4),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),

          const SizedBox(height: 10),

          // Real Calendar Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: offset + daysInMonth,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 6,
              mainAxisSpacing: 6,
              childAspectRatio: 1.0,
            ),
            itemBuilder: (context, index) {
              if (index < offset) {
                return const SizedBox.shrink();
              }

              final dayNum = index - offset + 1;
              final dateStr =
                  '${_selectedMonth.year}-${_selectedMonth.month.toString().padLeft(2, '0')}-${dayNum.toString().padLeft(2, '0')}';
              final status = widget.heatmapData[dateStr]
                  ?.toString()
                  .toLowerCase();

              final isToday =
                  now.year == _selectedMonth.year &&
                  now.month == _selectedMonth.month &&
                  now.day == dayNum;

              final dayDate = DateTime(
                _selectedMonth.year,
                _selectedMonth.month,
                dayNum,
              );
              final isWeekend =
                  dayDate.weekday == DateTime.saturday ||
                  dayDate.weekday == DateTime.sunday;

              Color cellColor;
              Border border;
              Color textColor;

              if (status == 'present') {
                cellColor = const Color(
                  0xFF10B981,
                ).withValues(alpha: isDark ? 0.28 : 0.2);
                border = Border.all(
                  color: isToday
                      ? Colors.amberAccent
                      : const Color(0xFF10B981).withValues(alpha: 0.6),
                  width: isToday ? 2.0 : 1.0,
                );
                textColor = const Color(0xFF10B981);
              } else if (status == 'absent') {
                cellColor = const Color(
                  0xFFEF4444,
                ).withValues(alpha: isDark ? 0.24 : 0.15);
                border = Border.all(
                  color: isToday
                      ? Colors.amberAccent
                      : const Color(0xFFEF4444).withValues(alpha: 0.5),
                  width: isToday ? 2.0 : 1.0,
                );
                textColor = const Color(0xFFEF4444);
              } else if (isToday) {
                cellColor = const Color(0xFF6366F1).withValues(alpha: 0.18);
                border = Border.all(color: const Color(0xFF6366F1), width: 1.8);
                textColor = const Color(0xFF6366F1);
              } else if (isWeekend) {
                cellColor = isDark
                    ? Colors.white.withValues(alpha: 0.02)
                    : const Color(0xFFF1F5F9);
                border = Border.all(color: Colors.transparent);
                textColor = const Color(0xFF475569);
              } else {
                cellColor = isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : const Color(0xFFF8FAFC);
                border = Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : const Color(0xFFE2E8F0),
                );
                textColor = const Color(0xFF7F8CA4);
              }

              return GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showDayAttendanceSheet(context, dayDate, status);
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: cellColor,
                    borderRadius: BorderRadius.circular(8),
                    border: border,
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$dayNum',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: (status != null || isToday)
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: textColor,
                        ),
                      ),
                      if (status == 'present')
                        Container(
                          width: 4,
                          height: 4,
                          margin: const EdgeInsets.only(top: 2),
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 14),

          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _buildLegendDot(context, const Color(0xFF10B981), 'Present'),
              const SizedBox(width: 14),
              _buildLegendDot(context, const Color(0xFFEF4444), 'Absent'),
              const SizedBox(width: 14),
              _buildLegendDot(context, const Color(0xFF6366F1), 'Today'),
              const SizedBox(width: 14),
              _buildLegendDot(context, const Color(0xFF475569), 'No Class'),
            ],
          ),
        ],
      ),
    );
  }

  void _showDayAttendanceSheet(
    BuildContext context,
    DateTime date,
    String? status,
  ) {
    final dateFormatted =
        '${date.day} ${_monthNames[date.month - 1]} ${date.year}';
    final isPresent = (status ?? '').toLowerCase() == 'present';
    final isAbsent = (status ?? '').toLowerCase() == 'absent';
    final isFuture = date.isAfter(DateTime.now());

    final statusLabel = isPresent
        ? 'VERIFIED PRESENT'
        : isAbsent
        ? 'ABSENT'
        : isFuture
        ? 'UPCOMING'
        : 'NO RECORD';

    final statusDesc = isPresent
        ? 'Attendance was verified and recorded for this date.'
        : isAbsent
        ? 'Student recorded as absent for scheduled lectures on this calendar date.'
        : isFuture
        ? 'Session scheduled for an upcoming date.'
        : 'No attendance record found for this date.';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141D38) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(
              color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dateFormatted,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF1B2C56),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isPresent
                          ? const Color(0xFF10B981).withValues(alpha: 0.15)
                          : isAbsent
                          ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                          : Colors.grey.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isPresent
                            ? const Color(0xFF10B981).withValues(alpha: 0.4)
                            : isAbsent
                            ? const Color(0xFFEF4444).withValues(alpha: 0.4)
                            : Colors.grey.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      statusLabel,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isPresent
                            ? const Color(0xFF10B981)
                            : isAbsent
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF7F8CA4),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                statusDesc,
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  color: isDark ? Colors.white70 : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3559E0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Close',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLegendDot(BuildContext context, Color color, String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.1)
                  : const Color(0xFFE2E8F0),
            ),
          ),
        ),
        const SizedBox(width: 5),
        Text(
          text,
          style: const TextStyle(fontSize: 10, color: Color(0xFF7F8CA4)),
        ),
      ],
    );
  }
}

// ============================================================================
// 7. Snapchat Streak Celebration Dialog
// ============================================================================

void showSnapchatStreakCelebration(BuildContext context, int streak) {
  final tier = streak >= 30
      ? '👑 Diamond Inferno • Legend Tier'
      : streak >= 14
      ? '🔥 Golden Blaze • Master Tier'
      : streak >= 7
      ? '⚡ Silver Spark • Consistency Champ'
      : '🥉 Bronze Flame • Streak Starter';

  showDialog(
    context: context,
    builder: (ctx) {
      return Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          padding: const EdgeInsets.all(26),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E112A), Color(0xFF2C130B), Color(0xFF140D1D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: Colors.deepOrangeAccent.withValues(alpha: 0.4),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.deepOrangeAccent.withValues(alpha: 0.25),
                blurRadius: 32,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pulsing Fire Icon
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.deepOrange.withValues(alpha: 0.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.orange.withValues(alpha: 0.35),
                      blurRadius: 24,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: const Text('🔥', style: TextStyle(fontSize: 48))
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scale(
                      begin: const Offset(0.88, 0.88),
                      end: const Offset(1.15, 1.15),
                      duration: 700.ms,
                      curve: Curves.easeInOut,
                    ),
              ),
              const SizedBox(height: 18),
              Text(
                'STREAK ON FIRE!',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: Colors.orangeAccent,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '🔥 $streak DAYS ATTENDANCE',
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.orange.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  tier,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.orangeAccent,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'You have checked in $streak class days in a row! Like Snapchat streaks, keep checking in every morning to maintain your flame and prevent academic eligibility drops.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  color: Colors.white70,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: Colors.deepOrangeAccent,
                    elevation: 6,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'Keep It Burning! 🔥',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
