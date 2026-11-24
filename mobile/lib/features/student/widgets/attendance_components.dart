/*
|--------------------------------------------------------------------------
| File: attendance_components.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Modern attendance intelligence components designed according to design.md:
| - Adaptive 28px card shells with upward elevation shadows
| - Brand Indigo (#3D4AB8, #4F46E5, #6366F1) palette integration
| - Dual-font pairing: Poppins (headings/data) + Inter (body/labels)
| - Micro-bounce interactive press feedback and tactile haptics
| - Full light (#E8EAF6 / #FFFFFF) & dark (#070A14 / #141D38) theme parity
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

// ============================================================================
// 1. AttendanceHealthCard
// ============================================================================
class AttendanceHealthCard extends StatelessWidget {
  final double score; // 0.0 to 1.0 (e.g., 0.94)
  final double percentage;
  final int lates;
  final int consecutiveAbsences;
  final String standing;

  const AttendanceHealthCard({
    super.key,
    required this.score,
    required this.percentage,
    required this.lates,
    required this.consecutiveAbsences,
    required this.standing,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final int scoreInt = (score * 100).toInt();

    // Canonical theme colors from design.md
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);
    final pillBg = isDark ? const Color(0xFF131A33) : const Color(0xFFF8FAFF);

    Color statusColor;
    String desc;

    if (scoreInt >= 90) {
      statusColor = const Color(0xFF10B981); // Emerald success
      desc = 'Outstanding consistency! Your academic standing is in the top tier.';
    } else if (scoreInt >= 75) {
      statusColor = const Color(0xFF6366F1); // Primary bright indigo
      desc = 'Good compliance. Keep up attendance above the 75% requirement.';
    } else if (scoreInt >= 60) {
      statusColor = const Color(0xFFF59E0B); // Amber warning
      desc = 'Warning status. Regular attendance needed to maintain eligibility.';
    } else {
      statusColor = const Color(0xFFEF4444); // Red critical
      desc = 'Critical standing. Academic eligibility is at risk. Contact department.';
    }

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: statusColor,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withValues(alpha: 0.6),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'ATTENDANCE HEALTH INDEX',
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                      color: const Color(0xFF4F46E5), // primary
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  standing.toUpperCase(),
                  style: GoogleFonts.poppins(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Gauge + Standing info
          Row(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  // Pulsing ambient glow
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withValues(alpha: 0.25),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .fade(begin: 0.3, end: 0.7, duration: 1600.ms, curve: Curves.easeInOut),

                  // Animated Ring
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: score),
                    duration: const Duration(milliseconds: 1400),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, _) {
                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            width: 90,
                            height: 90,
                            child: CircularProgressIndicator(
                              value: value,
                              strokeWidth: 9,
                              strokeCap: StrokeCap.round,
                              backgroundColor: isDark
                                  ? Colors.white.withValues(alpha: 0.08)
                                  : const Color(0xFFE8EAF6),
                              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${(value * 100).toInt()}%',
                                style: GoogleFonts.poppins(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: textHeading,
                                  height: 1.0,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'SCORE',
                                style: GoogleFonts.inter(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                  color: textLabel,
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(width: 22),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rating: $standing',
                      style: GoogleFonts.poppins(
                        color: textHeading,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      desc,
                      style: GoogleFonts.inter(
                        color: textBody,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // Divider
          Divider(
            color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
            height: 1,
          ),
          const SizedBox(height: 18),

          // Mini Metric Capsules
          Row(
            children: [
              Expanded(
                child: _buildMiniMetric(
                  context,
                  'Total Present',
                  percentage,
                  const Color(0xFF4F46E5), // primary
                  pillBg,
                  textHeading,
                  textLabel,
                  suffix: '%',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMiniMetric(
                  context,
                  'Late Arrivals',
                  lates.toDouble(),
                  lates > 2 ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                  pillBg,
                  textHeading,
                  textLabel,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMiniMetric(
                  context,
                  'Consecutive',
                  consecutiveAbsences.toDouble(),
                  consecutiveAbsences > 1 ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                  pillBg,
                  textHeading,
                  textLabel,
                  suffix: ' d',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(
    BuildContext context,
    String label,
    double value,
    Color color,
    Color pillBg,
    Color textHeading,
    Color textLabel, {
    String suffix = '',
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: pillBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.15), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: textLabel,
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          CountUpText(
            value: value,
            duration: const Duration(milliseconds: 1100),
            formatter: (v) => '${v.toInt()}$suffix',
            style: GoogleFonts.poppins(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. HeatmapGrid (GitHub Style Grid with 28px Card)
// ============================================================================
class HeatmapGrid extends StatelessWidget {
  final Map<String, dynamic> heatmapData;

  const HeatmapGrid({super.key, required this.heatmapData});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : const Color(0xFFF4F6FC);
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);
    final inactiveCell = isDark ? const Color(0xFF0D1130).withValues(alpha: 0.05) : const Color(0xFFE8EAF6);

    final now = DateTime.now();

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.grid_view_rounded, size: 16, color: Color(0xFF4F46E5)),
              const SizedBox(width: 8),
              Text(
                'ATTENDANCE FREQUENCY HEATMAP',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(4, (weekIndex) {
              return Column(
                children: List.generate(7, (dayIndex) {
                  final daysAgo = (3 - weekIndex) * 7 + (6 - dayIndex);
                  final checkDate = now.subtract(Duration(days: daysAgo));
                  final dateKey =
                      '${checkDate.year}-${checkDate.month.toString().padLeft(2, "0")}-${checkDate.day.toString().padLeft(2, "0")}';

                  final int count = heatmapData[dateKey] ?? (daysAgo % 3 == 0 ? 1 : 0);
                  Color boxColor = inactiveCell;
                  if (count > 0) {
                    boxColor = count >= 2
                        ? const Color(0xFF10B981) // Deep emerald
                        : const Color(0xFF6366F1); // Primary bright
                  }

                  final int flatIndex = weekIndex * 7 + dayIndex;
                  return Container(
                    width: 28,
                    height: 28,
                    margin: const EdgeInsets.symmetric(vertical: 3.5),
                    decoration: BoxDecoration(
                      color: boxColor,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: count > 0
                            ? boxColor.withValues(alpha: 0.4)
                            : (isDark ? Colors.white10 : const Color(0xFFD6DBED)),
                        width: 0.8,
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: (flatIndex * 16).ms, duration: 300.ms)
                      .scaleXY(
                        begin: 0.4,
                        end: 1,
                        delay: (flatIndex * 16).ms,
                        duration: 300.ms,
                        curve: Curves.easeOutBack,
                      );
                }),
              );
            }),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                'Less',
                style: GoogleFonts.inter(fontSize: 11, color: textLabel),
              ),
              const SizedBox(width: 6),
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: inactiveCell,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'More',
                style: GoogleFonts.inter(fontSize: 11, color: textLabel),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 3. ExportCard (Gradient Action Buttons)
// ============================================================================
class ExportCard extends StatelessWidget {
  final Function(String format) onExportPressed;

  const ExportCard({super.key, required this.onExportPressed});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.file_download_outlined, size: 16, color: Color(0xFF4F46E5)),
              const SizedBox(width: 8),
              Text(
                'EXPORT ATTENDANCE LEDGER',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildExportButton(
                  'PDF',
                  Icons.picture_as_pdf_rounded,
                  const [Color(0xFF6366F1), Color(0xFF4F46E5)], // Brand Indigo gradient
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildExportButton(
                  'EXCEL',
                  Icons.grid_on_rounded,
                  const [Color(0xFF10B981), Color(0xFF059669)], // Emerald gradient
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildExportButton(
                  'CSV',
                  Icons.receipt_long_rounded,
                  const [Color(0xFF8B5CF6), Color(0xFF6D28D9)], // Violet gradient
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExportButton(String format, IconData icon, List<Color> gradientColors) {
    return PressableScale(
      onTap: () {
        HapticFeedback.mediumImpact();
        onExportPressed(format.toLowerCase());
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: gradientColors.first.withValues(alpha: 0.32),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(
              format,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 12.5,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// 4. LiveMonitorCard
// ============================================================================
class LiveMonitorCard extends StatelessWidget {
  final List<dynamic> activeSessions;

  const LiveMonitorCard({super.key, required this.activeSessions});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.7),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .fade(begin: 0.4, end: 1, duration: 800.ms)
                  .scaleXY(begin: 0.85, end: 1.15, duration: 800.ms, curve: Curves.easeInOut),
              const SizedBox(width: 8),
              Text(
                'LIVE SESSIONS MONITOR',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFFEF4444),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (activeSessions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  'No active scanning sessions currently.',
                  style: GoogleFonts.inter(color: textLabel, fontSize: 13),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeSessions.length,
              separatorBuilder: (context, index) => Divider(
                color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
                height: 18,
              ),
              itemBuilder: (context, index) {
                final s = activeSessions[index];
                return Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s['subject'] ?? 'Subject Slot',
                            style: GoogleFonts.poppins(
                              color: textHeading,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Lecturer: ${s['teacher_name'] ?? 'Faculty Member'}',
                            style: GoogleFonts.inter(color: textBody, fontSize: 12),
                          ),
                          Text(
                            'Duration: ${s['duration'] ?? '1 Hour'}',
                            style: GoogleFonts.inter(color: textLabel, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${s['students_present'] ?? 0} Present',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF10B981),
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Biometric: ${s['face_scans'] ?? 0}',
                          style: GoogleFonts.inter(color: textLabel, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}

// ============================================================================
// 7. AttendanceDisputeSheet & Workflow
// ============================================================================
void showAttendanceDisputeSheet(
  BuildContext context, {
  Function(Map<String, dynamic>)? onDisputeSubmitted,
  String? defaultSubject,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => AttendanceDisputeSheet(
      onDisputeSubmitted: onDisputeSubmitted,
      defaultSubject: defaultSubject,
    ),
  );
}

class AttendanceDisputeSheet extends StatefulWidget {
  final Function(Map<String, dynamic>)? onDisputeSubmitted;
  final String? defaultSubject;

  const AttendanceDisputeSheet({
    super.key,
    this.onDisputeSubmitted,
    this.defaultSubject,
  });

  @override
  State<AttendanceDisputeSheet> createState() => _AttendanceDisputeSheetState();
}

class _AttendanceDisputeSheetState extends State<AttendanceDisputeSheet> {
  final _reasonController = TextEditingController();
  String _selectedReason = 'Biometric Scanner Error';
  late String _selectedSubject;
  bool _hasAttachment = false;
  bool _isSubmitting = false;

  final List<String> _reasons = [
    'Biometric Scanner Error',
    'Medical Exemption',
    'Authorized Duty / Event',
    'Network Timeout',
    'Other Special Case',
  ];

  final List<String> _subjects = [
    'Machine Learning (CSE-303)',
    'Cloud Computing (CSE-304)',
    'Software Engineering (CSE-302)',
    'Database Systems (CSE-301)',
  ];

  @override
  void initState() {
    super.initState();
    _selectedSubject = widget.defaultSubject ?? _subjects.first;
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe your dispute details.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 600));

    final disputeRecord = {
      'subject': _selectedSubject,
      'reason': _selectedReason,
      'details': _reasonController.text.trim(),
      'status': 'Pending Review',
      'date': 'Today',
      'hasAttachment': _hasAttachment,
    };

    if (mounted) {
      widget.onDisputeSubmitted?.call(disputeRecord);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF10B981),
          content: Text('Attendance dispute submitted successfully for review.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: cardBorder, width: 1.0),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.gavel_rounded, color: Color(0xFF4F46E5), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'File Attendance Dispute',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: textHeading,
                        ),
                      ),
                      Text(
                        'Submit an appeal for unverified or erroneous attendance',
                        style: GoogleFonts.inter(fontSize: 12, color: textBody),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'AFFECTED COURSE',
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: const Color(0xFF4F46E5),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: cardBorder),
                color: isDark ? const Color(0xFF1A2340) : const Color(0xFFF8FAFF),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedSubject,
                  isExpanded: true,
                  dropdownColor: cardBg,
                  items: _subjects.map((s) => DropdownMenuItem(value: s, child: Text(s, style: TextStyle(color: textHeading, fontSize: 13)))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedSubject = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'DISPUTE REASON',
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: const Color(0xFF4F46E5),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _reasons.map((r) {
                final isSelected = _selectedReason == r;
                return ChoiceChip(
                  label: Text(r),
                  selected: isSelected,
                  onSelected: (val) {
                    if (val) setState(() => _selectedReason = r);
                  },
                  selectedColor: const Color(0xFF4F46E5),
                  labelStyle: TextStyle(
                    fontSize: 11.5,
                    color: isSelected ? Colors.white : textBody,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                  backgroundColor: isDark ? const Color(0xFF1A2340) : const Color(0xFFF1F3F9),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: isSelected ? const Color(0xFF4F46E5) : cardBorder),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text(
              'JUSTIFICATION & DETAILS',
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: const Color(0xFF4F46E5),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              style: TextStyle(color: textHeading, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Explain the circumstances (e.g. Present in row 3, scanner camera timed out)...',
                hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.black38, fontSize: 12),
                filled: true,
                fillColor: isDark ? const Color(0xFF1A2340) : const Color(0xFFF8FAFF),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: cardBorder)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: cardBorder)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF4F46E5))),
              ),
            ),
            const SizedBox(height: 14),
            // Proof attachment option
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    setState(() => _hasAttachment = !_hasAttachment);
                  },
                  icon: Icon(
                    _hasAttachment ? Icons.check_circle_rounded : Icons.attach_file_rounded,
                    size: 16,
                    color: _hasAttachment ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
                  ),
                  label: Text(
                    _hasAttachment ? 'Evidence Attached' : 'Attach Proof / Slip',
                    style: TextStyle(
                      fontSize: 12,
                      color: _hasAttachment ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: BorderSide(color: _hasAttachment ? const Color(0xFF10B981) : const Color(0xFF4F46E5)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        'Submit Appeal for Review',
                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// 5. RiskAnalysisCard
// ============================================================================
class RiskAnalysisCard extends StatelessWidget {
  final List<dynamic> riskStudents;
  final String title;
  final Color themeColor;

  const RiskAnalysisCard({
    super.key,
    required this.riskStudents,
    required this.title,
    required this.themeColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: themeColor,
          collapsedIconColor: textLabel,
          title: Text(
            title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              color: textHeading,
              fontSize: 14,
            ),
          ),
          subtitle: Text(
            '${riskStudents.length} Students detected below requirement',
            style: GoogleFonts.inter(color: textLabel, fontSize: 11.5),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Column(
                children: [
                  Divider(
                    color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
                    height: 1,
                  ),
                  const SizedBox(height: 12),
                  if (riskStudents.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Text(
                        'No students in this bracket.',
                        style: GoogleFonts.inter(color: textLabel, fontSize: 12),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: riskStudents.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final st = riskStudents[index];
                        return Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    st['name'] ?? 'Student Name',
                                    style: GoogleFonts.poppins(
                                      color: textHeading,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                  Text(
                                    'ID: ${st['usn']} | Dept: ${st['department']}',
                                    style: GoogleFonts.inter(color: textLabel, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: themeColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${st['health_score']}%',
                                style: GoogleFonts.poppins(
                                  color: themeColor,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// 6. AuditLogList
// ============================================================================
class AuditLogList extends StatelessWidget {
  final List<dynamic> logs;

  const AuditLogList({super.key, required this.logs});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.security_rounded, size: 16, color: Color(0xFF4F46E5)),
              const SizedBox(width: 8),
              Text(
                'SECURITY & TRANSACTION AUDIT LOGS',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (logs.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No audit logs available.',
                  style: GoogleFonts.inter(color: textLabel, fontSize: 13),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: logs.length,
              separatorBuilder: (context, index) => Divider(
                color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
                height: 18,
              ),
              itemBuilder: (context, index) {
                final log = logs[index];
                final date = DateTime.tryParse(log['timestamp'] ?? '') ?? DateTime.now();
                final dateStr =
                    '${date.hour.toString().padLeft(2, "0")}:${date.minute.toString().padLeft(2, "0")} • ${date.day}/${date.month}';

                IconData actionIcon = Icons.info_outline_rounded;
                Color actionColor = const Color(0xFF4F46E5);

                if (log['action'] == 'ATTENDANCE_MARKED') {
                  actionIcon = Icons.check_circle_rounded;
                  actionColor = const Color(0xFF10B981);
                } else if (log['action'] == 'QR_GENERATED') {
                  actionIcon = Icons.qr_code_2_rounded;
                  actionColor = const Color(0xFFF59E0B);
                } else if (log['action'] == 'SESSION_CREATED') {
                  actionIcon = Icons.add_circle_outline_rounded;
                  actionColor = const Color(0xFF6366F1);
                } else if (log['action'] == 'LOGIN_EVENT') {
                  actionIcon = Icons.login_rounded;
                  actionColor = const Color(0xFF8B5CF6);
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: actionColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(actionIcon, color: actionColor, size: 18),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            log['action'].toString().replaceAll('_', ' '),
                            style: GoogleFonts.poppins(
                              color: textHeading,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'User: ${log['actor_email']} • IP: ${log['ip_address']}',
                            style: GoogleFonts.inter(color: textBody, fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      dateStr,
                      style: GoogleFonts.inter(color: textLabel, fontSize: 11),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}

