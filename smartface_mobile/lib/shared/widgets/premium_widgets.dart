/*
|--------------------------------------------------------------------------
| File: premium_widgets.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Collection of high-fidelity reusable UI components for the premium redesign.
| Inspired by Apple, Stripe, Linear, Notion, and Uber Driver designs.
|--------------------------------------------------------------------------
*/

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'glassmorphic_card.dart';

// ============================================================================
// 1. GlassContainer
// ============================================================================

/// Premium solid white rounded card container with soft drop shadow.
class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double blurRadius;
  final double borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;
  final Gradient? gradient;
  final double borderWidth;
  final VoidCallback? onTap;

  const GlassContainer({
    super.key,
    required this.child,
    this.padding,
    this.blurRadius = 16,
    this.borderRadius = 24.0, // Standardize on border radius 24
    this.borderColor,
    this.backgroundColor,
    this.boxShadow,
    this.gradient,
    this.borderWidth = 1.0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardBgColor = backgroundColor ?? Colors.white;
    final List<BoxShadow> effectiveBoxShadow = boxShadow ?? [
      BoxShadow(
        color: const Color(0xFF9EAFD8).withValues(alpha: 0.16),
        blurRadius: 16,
        spreadRadius: 2,
        offset: const Offset(0, 8),
      ),
    ];

    final card = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cardBgColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: borderColor ?? const Color(0xFFE2E8F0),
          width: borderWidth,
        ),
        boxShadow: effectiveBoxShadow,
      ),
      child: child,
    );

    if (onTap == null) return card;
    return PressableScale(onTap: onTap, child: card);
  }
}

// ============================================================================
// 2. MetricCard
// ============================================================================

/// A premium display card for key statistics, trends, and icon badges.
class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accentColor;
  final String? subtitle;
  final String? trend;
  final bool isTrendPositive;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accentColor,
    this.subtitle,
    this.trend,
    this.isTrendPositive = true,
  });

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? const Color(0xFF3559E0);

    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: color.withValues(alpha: 0.2),
      borderRadius: 24.0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              if (trend != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isTrendPositive
                        ? AppColors.success.withValues(alpha: 0.1)
                        : AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isTrendPositive
                            ? Icons.arrow_upward
                            : Icons.arrow_downward,
                        color: isTrendPositive
                            ? AppColors.success
                            : AppColors.error,
                        size: 10,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        trend!,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isTrendPositive
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1B2C56),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: const Color(0xFF7F8CA4),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: color,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ============================================================================
// 3. InsightCard (and AIInsightPanel wrapper)
// ============================================================================

/// Notion/Linear-style collapsible AI suggestion/prediction card.
class InsightCard extends StatefulWidget {
  final String title;
  final String insight;
  final String recommendation;
  final IconData icon;
  final Color? color;
  final bool initiallyExpanded;

  const InsightCard({
    super.key,
    required this.title,
    required this.insight,
    required this.recommendation,
    this.icon = Icons.auto_awesome_rounded,
    this.color,
    this.initiallyExpanded = true,
  });

  @override
  State<InsightCard> createState() => _InsightCardState();
}

class _InsightCardState extends State<InsightCard> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = widget.color ?? Colors.cyanAccent;

    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: themeColor.withValues(alpha: 0.3),
      backgroundColor: Colors.white,
      borderRadius: 24.0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: Row(
              children: [
                Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: themeColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        boxShadow: AppShadows.glow(themeColor, intensity: 0.2),
                      ),
                      child: Icon(widget.icon, color: themeColor, size: 16),
                    )
                    .animate(onPlay: (controller) => controller.repeat())
                    .shimmer(
                      delay: 1000.ms,
                      duration: 1500.ms,
                      color: Colors.white24,
                    ),
                const SizedBox(width: 8),
                Text(
                  widget.title.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    color: themeColor,
                  ),
                ),
                const Spacer(),
                Icon(
                  _isExpanded
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: const Color(0xFF7F8CA4),
                  size: 20,
                ),
              ],
            ),
          ),
          if (_isExpanded) ...[
            const SizedBox(height: 12),
            Text(
              widget.insight,
              style: GoogleFonts.inter(
                color: const Color(0xFF1B2C56),
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.recommendation,
              style: GoogleFonts.inter(
                color: const Color(0xFF7F8CA4),
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Backward compatibility wrapper for AIInsightPanel.
class AIInsightPanel extends StatelessWidget {
  final String title;
  final String insight;
  final String recommendation;
  final VoidCallback? onTap;

  const AIInsightPanel({
    super.key,
    this.title = 'SmartFace AI',
    required this.insight,
    required this.recommendation,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InsightCard(
      title: title,
      insight: insight,
      recommendation: recommendation,
      initiallyExpanded: true,
    );
  }
}

// ============================================================================
// 4. StatusCard
// ============================================================================

/// Renders status metrics with blinking status indicators and visual icons.
class StatusCard extends StatelessWidget {
  final String title;
  final String status;
  final String subtitle;
  final Color statusColor;
  final IconData icon;

  const StatusCard({
    super.key,
    required this.title,
    required this.status,
    required this.subtitle,
    required this.statusColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: statusColor.withValues(alpha: 0.2),
      borderRadius: 24.0,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: statusColor, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF1B2C56),
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF7F8CA4),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate(
                      onPlay: (controller) => controller.repeat(reverse: true),
                    )
                    .scale(end: const Offset(1.5, 1.5), duration: 800.ms)
                    .boxShadow(
                      end: BoxShadow(
                        color: statusColor.withValues(alpha: 0.6),
                        blurRadius: 6,
                      ),
                    ),
                const SizedBox(width: 6),
                Text(
                  status.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
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
// 5. AnalyticsCard
// ============================================================================

/// Analytics Card container built specifically for housing charts with tab/segment controllers.
class AnalyticsCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget chart;
  final List<String> segments;
  final int selectedSegmentIndex;
  final ValueChanged<int>? onSegmentChanged;
  final Widget? trailing;

  const AnalyticsCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.chart,
    this.segments = const ['1W', '1M', '3M', 'ALL'],
    this.selectedSegmentIndex = 0,
    this.onSegmentChanged,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final trailingWidget = trailing;
    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderRadius: 24.0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF1B2C56),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF7F8CA4),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              ?trailingWidget,
            ],
          ),
          const SizedBox(height: 12),
          if (segments.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(segments.length, (index) {
                  final isSelected = index == selectedSegmentIndex;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: onSegmentChanged != null
                          ? () => onSegmentChanged!(index)
                          : null,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF3559E0).withValues(alpha: 0.15)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF3559E0).withValues(alpha: 0.4)
                                : Colors.transparent,
                            width: 1.0,
                          ),
                        ),
                        child: Text(
                          segments[index],
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? const Color(0xFF3559E0)
                                : const Color(0xFF7F8CA4),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          const SizedBox(height: 16),
          SizedBox(height: 180, child: chart),
        ],
      ),
    );
  }
}

// ============================================================================
// 6. ActivityTimeline
// ============================================================================

/// Timeline event item representation.
class TimelineItem {
  final String title;
  final String description;
  final String timestamp;
  final IconData icon;
  final Color iconColor;

  const TimelineItem({
    required this.title,
    required this.description,
    required this.timestamp,
    required this.icon,
    this.iconColor = AppColors.accent,
  });
}

/// Renders a vertical list of activities/events with connecting line bars.
class ActivityTimeline extends StatelessWidget {
  final String title;
  final List<TimelineItem> items;

  const ActivityTimeline({super.key, required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderRadius: 24.0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: const Color(0xFF1B2C56),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (items.isEmpty)
            Center(
              child: Text(
                'No recent activity',
                style: GoogleFonts.inter(
                  color: const Color(0xFF7F8CA4),
                  fontSize: 13,
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final isLast = index == items.length - 1;

                return IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Timeline Indicator Column
                      Column(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: item.iconColor.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: item.iconColor.withValues(alpha: 0.3),
                                width: 1.0,
                              ),
                            ),
                            child: Icon(
                              item.icon,
                              color: item.iconColor,
                              size: 16,
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 14),
                      // Content Column
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.title,
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF1B2C56),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    item.timestamp,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: const Color(0xFF7F8CA4),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.description,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: const Color(0xFF7F8CA4),
                                ),
                              ),
                            ],
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
// 7. ActionTile
// ============================================================================

/// Stripe-style interactive grid tiles for quick actions.
class ActionTile extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const ActionTile({
    super.key,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: GlassContainer(
        padding: const EdgeInsets.all(AppSpacing.md),
        borderColor: color.withValues(alpha: 0.15),
        backgroundColor: Colors.white,
        borderRadius: 24.0,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1B2C56),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF7F8CA4),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().scale(duration: 200.ms, curve: Curves.easeInOut);
  }
}

// ============================================================================
// 8. HeatmapWidget
// ============================================================================

/// A GitHub-style calendar matrix displaying attendance health.
class HeatmapWidget extends StatelessWidget {
  final Map<int, AttendanceState> attendanceData;
  final int daysCount;

  const HeatmapWidget({
    super.key,
    required this.attendanceData,
    this.daysCount = 35, // 5 weeks x 7 days grid
  });

  @override
  Widget build(BuildContext context) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Attendance History',
                style: AppText.subheading(color: Colors.white),
              ),
              Text(
                'Last 5 Weeks',
                style: AppText.caption(color: Colors.white38),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Heatmap Grid
          Center(
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: List.generate(daysCount, (index) {
                final dayNum = index + 1;
                final state = attendanceData[dayNum] ?? AttendanceState.none;
                Color cellColor;
                String tooltipText = 'Day $dayNum: No Class';

                switch (state) {
                  case AttendanceState.present:
                    cellColor = AppColors.success;
                    tooltipText = 'Day $dayNum: Present';
                    break;
                  case AttendanceState.late:
                    cellColor = AppColors.warning;
                    tooltipText = 'Day $dayNum: Late';
                    break;
                  case AttendanceState.absent:
                    cellColor = AppColors.error;
                    tooltipText = 'Day $dayNum: Absent';
                    break;
                  case AttendanceState.none:
                    cellColor = AppColors.bgSurface;
                    tooltipText = 'Day $dayNum: No Record';
                    break;
                }

                return Tooltip(
                  message: tooltipText,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: cellColor,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.05),
                        width: 0.5,
                      ),
                      boxShadow: state == AttendanceState.present
                          ? [
                              BoxShadow(
                                color: AppColors.success.withValues(
                                  alpha: 0.15,
                                ),
                                blurRadius: 4,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                  ),
                ).animate().scale(
                  delay: (index * 15).ms,
                  duration: 250.ms,
                  curve: Curves.easeOut,
                );
              }),
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _buildLegendItem('Present', AppColors.success),
              const SizedBox(width: 12),
              _buildLegendItem('Late', AppColors.warning),
              const SizedBox(width: 12),
              _buildLegendItem('Absent', AppColors.error),
              const SizedBox(width: 12),
              _buildLegendItem('No Class', AppColors.bgSurface),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: AppText.caption(color: Colors.white54)),
      ],
    );
  }
}

enum AttendanceState { present, late, absent, none }

// ============================================================================
// 9. AttendanceRing
// ============================================================================

/// Circular progress indicator displaying attendance percentage.
class AttendanceRing extends StatelessWidget {
  final double percentage;
  final double size;
  final double strokeWidth;
  final String label;

  const AttendanceRing({
    super.key,
    required this.percentage,
    this.size = 140,
    this.strokeWidth = 14,
    this.label = 'Score',
  });

  @override
  Widget build(BuildContext context) {
    final cleanPercent = percentage.clamp(0.0, 100.0);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Ring Drawing
          CustomPaint(
            size: Size(size, size),
            painter: _RingPainter(
              percentage: cleanPercent,
              strokeWidth: strokeWidth,
              backgroundColor: AppColors.bgSurface,
              progressColors: [
                Colors.indigoAccent,
                AppColors.indigoLight,
                Colors.cyanAccent,
              ],
            ),
          ),
          // Ring Central Text
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${cleanPercent.toInt()}%',
                style: GoogleFonts.outfit(
                  fontSize: size * 0.22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: size * 0.08,
                  fontWeight: FontWeight.bold,
                  color: Colors.white38,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double percentage;
  final double strokeWidth;
  final Color backgroundColor;
  final List<Color> progressColors;

  _RingPainter({
    required this.percentage,
    required this.strokeWidth,
    required this.backgroundColor,
    required this.progressColors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background track
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, bgPaint);

    // Active progress arc
    final rect = Rect.fromCircle(center: center, radius: radius);
    final sweepAngle = (percentage / 100.0) * 2 * pi;

    final progressPaint = Paint()
      ..shader = SweepGradient(
        colors: progressColors,
        startAngle: -pi / 2,
        endAngle: 3 * pi / 2,
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    // Rotate canvas slightly to make sweep start exactly at the top
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-pi / 2);
    canvas.translate(-center.dx, -center.dy);
    canvas.drawArc(rect, 0, sweepAngle, false, progressPaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.percentage != percentage ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.backgroundColor != backgroundColor;
  }
}

// ============================================================================
// 10. SessionBanner
// ============================================================================

/// Neon active session notification widget.
class SessionBanner extends StatelessWidget {
  final String subject;
  final String teacher;
  final int minutesRemaining;
  final VoidCallback onVerifyTap;
  final bool isLoading;

  const SessionBanner({
    super.key,
    required this.subject,
    required this.teacher,
    required this.minutesRemaining,
    required this.onVerifyTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: Colors.redAccent.withValues(alpha: 0.3),
          width: 1.0,
        ),
        boxShadow: AppShadows.glow(Colors.redAccent, intensity: 0.12),
      ),
      child: GlassmorphicCard(
        padding: const EdgeInsets.all(AppSpacing.md),
        backgroundColor: const Color(0x11EF4444), // Translucent red
        borderColor:
            Colors.transparent, // Border already handled by wrapping container
        child: Column(
          children: [
            Row(
              children: [
                // Pulsing indicator
                Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate(
                      onPlay: (controller) => controller.repeat(reverse: true),
                    )
                    .scale(end: const Offset(1.5, 1.5), duration: 750.ms)
                    .boxShadow(
                      end: BoxShadow(
                        color: Colors.redAccent.withValues(alpha: 0.8),
                        blurRadius: 8,
                      ),
                    ),
                const SizedBox(width: 8),
                Text(
                  'ACTIVE SESSION DETECTED',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: Colors.redAccent,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    const Icon(
                      Icons.timer_outlined,
                      color: Colors.white54,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$minutesRemaining Mins Left',
                      style: AppText.caption(color: Colors.white70),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(subject, style: AppText.heading(color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(
                      'Instructor: $teacher',
                      style: AppText.body(color: Colors.white54),
                    ),
                  ],
                ),
                ElevatedButton(
                      onPressed: isLoading ? null : onVerifyTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        shadowColor: AppColors.accent.withValues(alpha: 0.5),
                        elevation: 8,
                      ),
                      child: isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              'VERIFY NOW',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                              ),
                            ),
                    )
                    .animate(
                      onPlay: (controller) => controller.repeat(reverse: true),
                    )
                    .shimmer(
                      delay: 2000.ms,
                      duration: 1500.ms,
                      color: Colors.white24,
                    ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
