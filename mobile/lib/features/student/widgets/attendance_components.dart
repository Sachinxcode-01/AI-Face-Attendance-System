/*
|--------------------------------------------------------------------------
| File: attendance_components.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Glassmorphic card components for the Student & Teacher Attendance
| Intelligence Dashboards and Command Center.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glassmorphic_card.dart';

// ======================================================
// 1. AttendanceHealthCard
// ======================================================
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
    final int scoreInt = (score * 100).toInt();
    Color statusColor;
    List<BoxShadow> glowShadow;
    String desc;

    if (scoreInt >= 90) {
      statusColor = AppColors.success;
      glowShadow = AppShadows.glow(AppColors.success, intensity: 0.35);
      desc = 'Excellent compliance. Keep up the consistent presence!';
    } else if (scoreInt >= 75) {
      statusColor = AppColors.gold;
      glowShadow = AppShadows.glow(AppColors.gold, intensity: 0.25);
      desc = 'Good compliance. Stay above the 75% threshold.';
    } else if (scoreInt >= 60) {
      statusColor = AppColors.warning;
      glowShadow = AppShadows.glow(AppColors.warning, intensity: 0.3);
      desc = 'Warning status. Attendance approaching critical levels.';
    } else {
      statusColor = AppColors.error;
      glowShadow = AppShadows.glow(AppColors.error, intensity: 0.35);
      desc = 'Critical standing. Academic eligibility is at high risk.';
    }

    return GlassmorphicCard(
      borderColor: statusColor.withValues(alpha: 0.25),
      boxShadow: glowShadow,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ATTENDANCE HEALTH INDEX',
                style: AppText.label(color: AppColors.gold),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  standing.toUpperCase(),
                  style: GoogleFonts.outfit(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  // Soft pulsing glow behind the ring.
                  Container(
                        width: 85,
                        height: 85,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: statusColor.withValues(alpha: 0.45),
                              blurRadius: 20,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .fade(
                        begin: 0.35,
                        end: 0.85,
                        duration: 1600.ms,
                        curve: Curves.easeInOut,
                      ),
                  // Ring fills from 0 to score, with the % counting up in sync.
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: score),
                    duration: const Duration(milliseconds: 1300),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, _) {
                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            width: 85,
                            height: 85,
                            child: CircularProgressIndicator(
                              value: value,
                              strokeWidth: 8,
                              strokeCap: StrokeCap.round,
                              backgroundColor: Colors.white10,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                statusColor,
                              ),
                            ),
                          ),
                          Text(
                            '${(value * 100).toInt()}%',
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Index Rating: $standing',
                      style: AppText.subheading(
                        color: Colors.white,
                        weight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(desc, style: AppText.caption(color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMiniMetric(
                'Total Present',
                percentage,
                AppColors.cyan,
                suffix: '%',
              ),
              _buildMiniMetric(
                'Late Arrivals',
                lates.toDouble(),
                lates > 2 ? AppColors.warning : AppColors.success,
              ),
              _buildMiniMetric(
                'Consecutive Absence',
                consecutiveAbsences.toDouble(),
                consecutiveAbsences > 1 ? AppColors.error : AppColors.success,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(
    String label,
    double value,
    Color color, {
    String suffix = '',
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.caption(color: Colors.white38)),
        const SizedBox(height: 4),
        CountUpText(
          value: value,
          duration: const Duration(milliseconds: 1100),
          formatter: (v) => '${v.toInt()}$suffix',
          style: GoogleFonts.robotoMono(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

// ======================================================
// 2. HeatmapGrid (GitHub Style Grid)
// ======================================================
class HeatmapGrid extends StatelessWidget {
  final Map<String, dynamic> heatmapData;

  const HeatmapGrid({super.key, required this.heatmapData});

  @override
  Widget build(BuildContext context) {
    // Generate a simple mock grid representing past 4 weeks (4 columns, 7 rows)
    final now = DateTime.now();

    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ATTENDANCE FREQUENCY HEATMAP',
            style: AppText.label(color: AppColors.cyan),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(4, (weekIndex) {
              return Column(
                children: List.generate(7, (dayIndex) {
                  // Simulate check-in counts
                  final daysAgo = (3 - weekIndex) * 7 + (6 - dayIndex);
                  final checkDate = now.subtract(Duration(days: daysAgo));
                  final dateKey =
                      '${checkDate.year}-${checkDate.month.toString().padLeft(2, "0")}-${checkDate.day.toString().padLeft(2, "0")}';

                  final int count =
                      heatmapData[dateKey] ?? (daysAgo % 3 == 0 ? 1 : 0);
                  Color boxColor = Colors.white.withValues(alpha: 0.05);
                  if (count > 0) {
                    boxColor = AppColors.success.withValues(
                      alpha: count >= 2 ? 0.8 : 0.4,
                    );
                  }

                  final int flatIndex = weekIndex * 7 + dayIndex;
                  return Container(
                        width: 26,
                        height: 26,
                        margin: const EdgeInsets.symmetric(vertical: 3),
                        decoration: BoxDecoration(
                          color: boxColor,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.white10, width: 0.5),
                        ),
                      )
                      .animate()
                      .fadeIn(delay: (flatIndex * 18).ms, duration: 320.ms)
                      .scaleXY(
                        begin: 0.3,
                        end: 1,
                        delay: (flatIndex * 18).ms,
                        duration: 320.ms,
                        curve: Curves.easeOutBack,
                      );
                }),
              );
            }),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text('Less', style: AppText.caption()),
              const SizedBox(width: 4),
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 4),
              Text('More', style: AppText.caption()),
            ],
          ),
        ],
      ),
    );
  }
}

// ======================================================
// 3. ExportCard
// ======================================================
class ExportCard extends StatelessWidget {
  final Function(String format) onExportPressed;

  const ExportCard({super.key, required this.onExportPressed});

  @override
  Widget build(BuildContext context) {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'EXPORT ATTENDANCE LEDGER',
            style: AppText.label(color: AppColors.gold),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildExportButton(
                  'PDF',
                  Icons.picture_as_pdf,
                  Colors.redAccent,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildExportButton(
                  'EXCEL',
                  Icons.grid_on,
                  Colors.greenAccent,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildExportButton(
                  'CSV',
                  Icons.list_alt,
                  Colors.cyanAccent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExportButton(String format, IconData icon, Color color) {
    return PressableScale(
      onTap: () => onExportPressed(format.toLowerCase()),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.black, size: 16),
            const SizedBox(width: 6),
            Text(
              format,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ======================================================
// 4. LiveMonitorCard
// ======================================================
class LiveMonitorCard extends StatelessWidget {
  final List<dynamic> activeSessions;

  const LiveMonitorCard({super.key, required this.activeSessions});

  @override
  Widget build(BuildContext context) {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.redAccent,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.redAccent.withValues(alpha: 0.6),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .fade(begin: 0.4, end: 1, duration: 800.ms)
                  .scaleXY(
                    begin: 0.85,
                    end: 1.15,
                    duration: 800.ms,
                    curve: Curves.easeInOut,
                  ),
              const SizedBox(width: 8),
              Text(
                'LIVE SESSIONS MONITOR',
                style: AppText.label(color: Colors.redAccent),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (activeSessions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  'No active scanning sessions currently.',
                  style: AppText.body(color: Colors.white38),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeSessions.length,
              separatorBuilder: (context, index) =>
                  const Divider(color: Colors.white12, height: 16),
              itemBuilder: (context, index) {
                final s = activeSessions[index];
                return Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s['subject'] ?? 'Subject',
                            style: AppText.body(
                              color: Colors.white,
                              weight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Lecturer: ${s['teacher_name'] ?? 'Sarah Jenkins'}',
                            style: AppText.caption(color: Colors.white54),
                          ),
                          Text(
                            'Session Timer: ${s['duration'] ?? '1 Hour'}',
                            style: AppText.caption(color: Colors.white38),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${s['students_present'] ?? 0} Present',
                          style: GoogleFonts.robotoMono(
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Biometric Scans: ${s['face_scans'] ?? 0}',
                          style: AppText.caption(color: Colors.white54),
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

// ======================================================
// 5. RiskAnalysisCard
// ======================================================
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
    return GlassmorphicCard(
      borderColor: themeColor.withValues(alpha: 0.15),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: themeColor,
          collapsedIconColor: Colors.white38,
          title: Text(
            title,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontSize: 14,
            ),
          ),
          subtitle: Text(
            '${riskStudents.length} Students detected below requirement',
            style: AppText.caption(color: Colors.white54),
          ),
          children: [
            const Divider(color: Colors.white12, height: 1),
            const SizedBox(height: 10),
            if (riskStudents.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  'No students in this bracket.',
                  style: AppText.caption(),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: riskStudents.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
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
                              style: AppText.body(
                                color: Colors.white,
                                weight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'ID: ${st['usn']} | Dept: ${st['department']}',
                              style: AppText.caption(color: Colors.white38),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${st['health_score']}%',
                        style: GoogleFonts.robotoMono(
                          color: themeColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

// ======================================================
// 6. AuditLogList
// ======================================================
class AuditLogList extends StatelessWidget {
  final List<dynamic> logs;

  const AuditLogList({super.key, required this.logs});

  @override
  Widget build(BuildContext context) {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SECURITY & TRANSACTION AUDIT LOGS',
            style: AppText.label(color: AppColors.cyan),
          ),
          const SizedBox(height: 16),
          if (logs.isEmpty)
            Center(
              child: Text(
                'No audit logs available.',
                style: AppText.body(color: Colors.white38),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: logs.length,
              separatorBuilder: (context, index) =>
                  const Divider(color: Colors.white12, height: 14),
              itemBuilder: (context, index) {
                final log = logs[index];
                final date =
                    DateTime.tryParse(log['timestamp'] ?? '') ?? DateTime.now();
                final dateStr =
                    '${date.hour.toString().padLeft(2, "0")}:${date.minute.toString().padLeft(2, "0")} • ${date.day}/${date.month}';

                IconData actionIcon = Icons.info_outline;
                Color actionColor = Colors.white38;

                if (log['action'] == 'ATTENDANCE_MARKED') {
                  actionIcon = Icons.check_circle_outlined;
                  actionColor = AppColors.success;
                } else if (log['action'] == 'QR_GENERATED') {
                  actionIcon = Icons.qr_code_2_outlined;
                  actionColor = AppColors.gold;
                } else if (log['action'] == 'SESSION_CREATED') {
                  actionIcon = Icons.add_circle_outline_outlined;
                  actionColor = AppColors.cyan;
                } else if (log['action'] == 'LOGIN_EVENT') {
                  actionIcon = Icons.login_outlined;
                  actionColor = Colors.purpleAccent;
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(actionIcon, color: actionColor, size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            log['action'].toString().replaceAll('_', ' '),
                            style: AppText.body(
                              color: Colors.white,
                              weight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'User: ${log['actor_email']} • IP: ${log['ip_address']}',
                            style: AppText.caption(color: Colors.white54),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      dateStr,
                      style: AppText.caption(color: Colors.white38),
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
