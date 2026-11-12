/*
|--------------------------------------------------------------------------
| File: student_bunk_calculator_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Interactive Attendance Goal & Smart Bunk Calculator for students strictly
| conforming to design.md:
| - StudentScreenShell with ethereal orbs & 28px card shell overlap
| - Brand Indigo palette (#3D4AB8, #4F46E5, #6366F1)
| - Dual-font system: Poppins (headings/tabs) + Inter (body/metrics)
| - Dynamic safe absence simulation & catch-up class forecasting
| - Tactile haptics & full light/dark theme responsiveness
|--------------------------------------------------------------------------
*/

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/design_system/ui/app_colors.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

class SubjectBunkModel {
  final String code;
  final String name;
  final int attended;
  final int total;

  SubjectBunkModel({
    required this.code,
    required this.name,
    required this.attended,
    required this.total,
  });

  double get percentage => total > 0 ? (attended / total) * 100 : 0.0;

  int safeBunks(double targetPercent) {
    final t = targetPercent / 100.0;
    if (percentage < targetPercent) return 0;
    final maxMiss = ((attended - t * total) / t).floor();
    return max(0, maxMiss);
  }

  int classesNeeded(double targetPercent) {
    final t = targetPercent / 100.0;
    if (percentage >= targetPercent) return 0;
    final needed = ((t * total - attended) / (1 - t)).ceil();
    return max(0, needed);
  }

  double projectedPercentage(int simMissed, int simAttended) {
    final newAttended = attended + simAttended;
    final newTotal = total + simMissed + simAttended;
    if (newTotal <= 0) return 0.0;
    return (newAttended / newTotal) * 100.0;
  }
}

class StudentBunkCalculatorScreen extends StatefulWidget {
  const StudentBunkCalculatorScreen({super.key});

  @override
  State<StudentBunkCalculatorScreen> createState() =>
      _StudentBunkCalculatorScreenState();
}

class _StudentBunkCalculatorScreenState
    extends State<StudentBunkCalculatorScreen> {
  bool _isLoading = true;
  double _targetGoal = 75.0; // 75%, 80%, 85%
  int _simMissed = 0;
  int _simAttended = 0;

  List<SubjectBunkModel> _subjects = [];

  final List<SubjectBunkModel> _fallbackSubjects = [
    SubjectBunkModel(
      code: 'CSE-302',
      name: 'Software Engineering',
      attended: 28,
      total: 32,
    ),
    SubjectBunkModel(
      code: 'CSE-303',
      name: 'Machine Learning',
      attended: 24,
      total: 30,
    ),
    SubjectBunkModel(
      code: 'CSE-304',
      name: 'Cloud Computing',
      attended: 20,
      total: 28,
    ),
    SubjectBunkModel(
      code: 'CSE-305',
      name: 'Distributed Systems',
      attended: 25,
      total: 31,
    ),
    SubjectBunkModel(
      code: 'CSE-306',
      name: 'Compiler Design',
      attended: 18,
      total: 26,
    ),
    SubjectBunkModel(
      code: 'CSE-307',
      name: 'AI & Neural Networks',
      attended: 27,
      total: 29,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadSubjectData();
  }

  Future<void> _loadSubjectData() async {
    final session = context.read<SessionManager>();
    final token = session.token;
    final email = session.email;

    if (token == null || email == null) {
      if (mounted) {
        setState(() {
          _subjects = _fallbackSubjects;
          _isLoading = false;
        });
      }
      return;
    }

    try {
      final stats = await ApiService.getStudentStats(email, token);
      if (mounted && stats != null && stats.subjects.isNotEmpty) {
        final loaded = stats.subjects.map((s) {
          final attended = s.present;
          final code = s.subject.contains('(')
              ? s.subject.split('(').last.replaceAll(')', '')
              : s.subject.split(' ').first;
          return SubjectBunkModel(
            code: code,
            name: s.subject,
            attended: attended,
            total: s.total,
          );
        }).toList();

        setState(() {
          _subjects = loaded;
          _isLoading = false;
        });
        return;
      }
    } catch (e) {
      debugPrint('[BunkCalculator] error loading stats: $e');
    }

    if (mounted) {
      setState(() {
        _subjects = _fallbackSubjects;
        _isLoading = false;
      });
    }
  }

  int get _totalAttended => _subjects.fold(0, (acc, s) => acc + s.attended);
  int get _totalClasses => _subjects.fold(0, (acc, s) => acc + s.total);
  double get _overallPercentage =>
      _totalClasses > 0 ? (_totalAttended / _totalClasses) * 100 : 0.0;

  double get _projectedOverallPercentage {
    final newAttended = _totalAttended + _simAttended;
    final newTotal = _totalClasses + _simMissed + _simAttended;
    if (newTotal <= 0) return 0.0;
    return (newAttended / newTotal) * 100.0;
  }

  int get _overallSafeBunks {
    final t = _targetGoal / 100.0;
    if (_overallPercentage < _targetGoal) return 0;
    return max(0, ((_totalAttended - t * _totalClasses) / t).floor());
  }

  int get _overallCatchUpNeeded {
    final t = _targetGoal / 100.0;
    if (_overallPercentage >= _targetGoal) return 0;
    return max(0, ((t * _totalClasses - _totalAttended) / (1 - t)).ceil());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return StudentScreenShell(
      title: 'Smart Bunk Calculator',
      subtitle: 'Safe Absence Simulator & Attendance Forecaster',
      onBackTap: () => Navigator.of(context).maybePop(),
      child: _isLoading
          ? const BunkCalculatorShimmer()
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── 1. Target Goal Selector ──────────────────────────────
                  _buildGoalSelector(isDark),
                  const SizedBox(height: 20),

                  // ── 2. Master Status & Simulator Card ────────────────────
                  _buildSimulatorHud(isDark),
                  const SizedBox(height: 20),

                  // ── 3. Interactive Simulation Sliders ────────────────────
                  _buildSimulationSliders(isDark),
                  const SizedBox(height: 24),

                  // ── 4. Subject Breakdown Section ─────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'SUBJECT-WISE SAFE BUNKS',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: isDark
                              ? const Color(0xFFA5B4FC)
                              : const Color(0xFF3D4AB8),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${_subjects.length} Subjects',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? Colors.white70
                                : const Color(0xFF4F46E5),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Subject cards
                  ..._subjects.map((sub) => _buildSubjectCard(sub, isDark)),
                  const SizedBox(height: 36),
                ],
              ),
            ),
    );
  }

  // ── Goal Selector ────────────────────────────────────────────────────────
  Widget _buildGoalSelector(bool isDark) {
    final goals = [75.0, 80.0, 85.0];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : const Color(0xFFF8FAFF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.track_changes_rounded,
                color: Color(0xFF4F46E5),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                'Attendance Compliance Target',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : const Color(0xFF1A1A3A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: goals.map((g) {
              final isSelected = _targetGoal == g;
              final label = g == 75.0
                  ? '75% (Standard)'
                  : (g == 80.0 ? '80% (Safe Target)' : '85% (Honor Roll)');

              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: PressableScale(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _targetGoal = g);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        gradient: isSelected
                            ? const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                              )
                            : null,
                        color: isSelected
                            ? null
                            : (isDark ? const Color(0xFF1E2746) : Colors.white),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF6366F1)
                              : (isDark
                                    ? const Color(0xFF2E3A59)
                                    : const Color(0xFFE2E8F0)),
                          width: isSelected ? 1.5 : 1.0,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFF4F46E5,
                                  ).withValues(alpha: 0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isSelected
                                ? Colors.white
                                : (isDark
                                      ? Colors.white70
                                      : const Color(0xFF3D4260)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ── Simulator HUD Card ───────────────────────────────────────────────────
  Widget _buildSimulatorHud(bool isDark) {
    final projected = _projectedOverallPercentage;
    final isSafe = projected >= _targetGoal;
    final delta = projected - _overallPercentage;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [const Color(0xFF1E284A), const Color(0xFF151D38)]
              : [const Color(0xFFEEF2FF), const Color(0xFFE0E7FF)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSafe ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: (isSafe ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                .withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PROJECTED ATTENDANCE',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                      color: isDark ? Colors.white60 : const Color(0xFF4B5563),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '${projected.toStringAsFixed(1)}%',
                        style: GoogleFonts.poppins(
                          fontSize: 34,
                          fontWeight: FontWeight.w800,
                          color: isSafe
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (delta != 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: delta > 0
                                ? const Color(
                                    0xFF10B981,
                                  ).withValues(alpha: 0.15)
                                : const Color(
                                    0xFFEF4444,
                                  ).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${delta > 0 ? '+' : ''}${delta.toStringAsFixed(1)}%',
                            style: GoogleFonts.robotoMono(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: delta > 0
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: isSafe
                      ? const Color(0xFF10B981).withValues(alpha: 0.15)
                      : const Color(0xFFEF4444).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSafe
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      isSafe
                          ? Icons.check_circle_rounded
                          : Icons.warning_amber_rounded,
                      color: isSafe
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                      size: 24,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isSafe ? 'ELIGIBLE' : 'DEBAR RISK',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: isSafe
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, thickness: 1),
          const SizedBox(height: 14),

          // Key metrics row
          Row(
            children: [
              Expanded(
                child: _buildMetricMini(
                  'Safe Bunks Remaining',
                  '$_overallSafeBunks classes',
                  Icons.airline_seat_recline_normal_rounded,
                  const Color(0xFF10B981),
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricMini(
                  'Catch-up Needed',
                  '$_overallCatchUpNeeded classes',
                  Icons.alarm_on_rounded,
                  _overallCatchUpNeeded > 0
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF6B7280),
                  isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricMini(
    String title,
    String value,
    IconData icon,
    Color accentColor,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF11172A) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF232D48) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: accentColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    color: isDark ? Colors.white60 : const Color(0xFF6B7280),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF1A1A3A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Simulation Sliders ───────────────────────────────────────────────────
  Widget _buildSimulationSliders(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : const Color(0xFFF8FAFF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'LIVE SCENARIO SIMULATOR',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                  color: isDark
                      ? const Color(0xFFA5B4FC)
                      : const Color(0xFF3D4AB8),
                ),
              ),
              if (_simMissed > 0 || _simAttended > 0)
                PressableScale(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    setState(() {
                      _simMissed = 0;
                      _simAttended = 0;
                    });
                  },
                  child: Text(
                    'Reset Sliders',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFEF4444),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Slider 1: Missed classes
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Simulate Missed Lectures (Bunks)',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white70 : const Color(0xFF374151),
                ),
              ),
              Text(
                '$_simMissed classes',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFEF4444),
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: const Color(0xFFEF4444),
              inactiveTrackColor: isDark
                  ? const Color(0xFF1E284A)
                  : const Color(0xFFE2E8F0),
              thumbColor: const Color(0xFFEF4444),
              trackHeight: 4,
            ),
            child: Slider(
              value: _simMissed.toDouble(),
              min: 0,
              max: 12,
              divisions: 12,
              onChanged: (v) {
                HapticFeedback.selectionClick();
                setState(() => _simMissed = v.round());
              },
            ),
          ),
          const SizedBox(height: 8),

          // Slider 2: Attended classes
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Simulate Extra Attended Lectures',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white70 : const Color(0xFF374151),
                ),
              ),
              Text(
                '$_simAttended classes',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: const Color(0xFF10B981),
              inactiveTrackColor: isDark
                  ? const Color(0xFF1E284A)
                  : const Color(0xFFE2E8F0),
              thumbColor: const Color(0xFF10B981),
              trackHeight: 4,
            ),
            child: Slider(
              value: _simAttended.toDouble(),
              min: 0,
              max: 16,
              divisions: 16,
              onChanged: (v) {
                HapticFeedback.selectionClick();
                setState(() => _simAttended = v.round());
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Subject Card ─────────────────────────────────────────────────────────
  Widget _buildSubjectCard(SubjectBunkModel sub, bool isDark) {
    final curPercent = sub.percentage;
    final safe = sub.safeBunks(_targetGoal);
    final needed = sub.classesNeeded(_targetGoal);
    final isCompliant = curPercent >= _targetGoal;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : AppColors.bgLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompliant
              ? (isDark ? AppColors.borderDark : AppColors.borderLight)
              : AppColors.error.withValues(alpha: 0.4),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
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
                      sub.name,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white : AppColors.textBody,
                      ),
                    ),
                    Text(
                      '${sub.code} • ${sub.attended} / ${sub.total} Classes',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: isDark
                            ? Colors.white60
                            : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: isCompliant
                      ? const Color(0xFF10B981).withValues(alpha: 0.15)
                      : const Color(0xFFEF4444).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${curPercent.toStringAsFixed(1)}%',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isCompliant
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (curPercent / 100.0).clamp(0.0, 1.0),
              backgroundColor: isDark
                  ? const Color(0xFF1F2942)
                  : const Color(0xFFE2E8F0),
              color: isCompliant
                  ? const Color(0xFF4F46E5)
                  : const Color(0xFFEF4444),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 10),

          // Guidance pill
          Row(
            children: [
              Icon(
                isCompliant
                    ? Icons.check_circle_outline_rounded
                    : Icons.error_outline_rounded,
                size: 14,
                color: isCompliant
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  isCompliant
                      ? 'You can safely bunk $safe more classes without dropping below ${_targetGoal.toInt()}%.'
                      : 'You must attend $needed consecutive classes to recover to ${_targetGoal.toInt()}%.',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isCompliant
                        ? (isDark
                              ? const Color(0xFF6EE7B7)
                              : const Color(0xFF047857))
                        : (isDark
                              ? const Color(0xFFFCA5A5)
                              : const Color(0xFFB91C1C)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
