/*
|--------------------------------------------------------------------------
| File: parent_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Premium Ward Portal Dashboard for parents/guardians. Shows linked
| ward selector, overall attendance metrics, subject breakdown, leave status,
| warnings, and quick action panels.
|
| Security:
| - Restricted exclusively to parent-linked ward data.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/dashboard_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';

String _greeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

class ParentDashboard extends StatefulWidget {
  const ParentDashboard({super.key});

  @override
  State<ParentDashboard> createState() => _ParentDashboardState();
}

class _ParentDashboardState extends State<ParentDashboard> {
  bool _isLoading = true;
  String? _error;

  // Wards list
  List<dynamic> _wards = [];
  Map<String, dynamic>? _selectedWard;

  // Ward detailed data
  Map<String, dynamic> _wardStats = {};
  List<dynamic> _attendanceLogs = [];
  List<LeaveModel> _leaveRequests = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadWards();
      }
    });
  }

  // Load parent's linked wards
  Future<void> _loadWards() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final session = context.read<SessionManager>();
      final token = session.token;
      if (token == null) return;

      final wards = await ApiService.getParentWards(token);
      if (mounted) {
        setState(() {
          _wards = wards;
          if (wards.isNotEmpty) {
            _selectedWard = session.selectedWard ?? wards.first;
          }
        });
        if (_selectedWard != null) {
          session.setSelectedWard(_selectedWard);
          await _loadWardData(_selectedWard!['email']);
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      debugPrint('ParentDashboard loadWards error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load wards. Please pull to try again.';
        });
      }
    }
  }

  // Load statistics, logs, and leaves for the selected ward
  Future<void> _loadWardData(String email, {bool silent = false}) async {
    if (!mounted) return;
    if (!silent) {
      setState(() => _isLoading = true);
    }

    try {
      final session = context.read<SessionManager>();
      final token = session.token;
      if (token == null) return;

      final results = await Future.wait([
        ApiService.getWardStats(email, token),
        ApiService.getWardAttendanceLogs(email, token),
        ApiService.getWardLeaves(email, token),
      ]);

      if (mounted) {
        setState(() {
          _wardStats = results[0] as Map<String, dynamic>;
          _attendanceLogs = results[1] as List<dynamic>;
          _leaveRequests = results[2] as List<LeaveModel>;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('ParentDashboard loadWardData error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to retrieve ward data. Pull to retry.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final session = context.read<SessionManager>();
    final double screenWidth = MediaQuery.of(context).size.width;

    if (_isLoading && _wards.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    return PremiumBackground(
      immersive: false,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: _buildAppBar(session, isDark),
        body: GlowRefreshIndicator(
          onRefresh: () async {
            if (_selectedWard != null) {
              await _loadWardData(_selectedWard!['email']);
            } else {
              await _loadWards();
            }
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.symmetric(
              horizontal: screenWidth * 0.05,
              vertical: 12,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_error != null) _buildErrorBanner(_error!),

                // ── Greeting Header ──────────────────────────────────────────
                _buildGreetingHeader(
                  session,
                ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1),

                const SizedBox(height: 20),

                // ── Ward Selector (Only if multiple wards exist) ──────────────
                if (_wards.length > 1) ...[
                  _buildWardSelector().animate().fadeIn(
                    delay: 50.ms,
                    duration: 400.ms,
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Overall Attendance card ──────────────────────────────────
                _buildOverallAttendanceCard()
                    .animate()
                    .fadeIn(delay: 100.ms, duration: 400.ms)
                    .slideY(begin: 0.05),

                const SizedBox(height: 20),

                // ── Subject-Wise Attendance ──────────────────────────────────
                _buildSubjectAttendanceSection().animate().fadeIn(
                  delay: 150.ms,
                  duration: 400.ms,
                ),

                const SizedBox(height: 20),

                // ── Quick Actions ────────────────────────────────────────────
                _buildQuickActions(
                  context,
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                const SizedBox(height: 20),

                // ── Leave Status Section ─────────────────────────────────────
                _buildLeaveRequestsSection().animate().fadeIn(
                  delay: 250.ms,
                  duration: 400.ms,
                ),

                const SizedBox(height: 20),

                // ── Recent Activity Logs ─────────────────────────────────────
                _buildRecentActivitySection().animate().fadeIn(
                  delay: 300.ms,
                  duration: 400.ms,
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Error Banner ───────────────────────────────────────────────────────────
  Widget _buildErrorBanner(String msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.error_outline_rounded,
              color: AppColors.error,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                msg,
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.error),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── AppBar ─────────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar(SessionManager session, bool isDark) {
    return PremiumAppBar(
      leadingWidth: 0,
      leading: const SizedBox.shrink(),
      title: 'Parent Portal',
      titleWidget: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [AppColors.cyan, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: AppColors.cyan.withValues(alpha: 0.4),
                width: 1.5,
              ),
              boxShadow: AppShadows.glow(AppColors.cyan, intensity: 0.15),
            ),
            child: const Center(
              child: Icon(
                Icons.family_restroom_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                session.name ?? 'Parent Guardian',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: AppColors.textHeading,
                ),
              ),
              Text(
                'Guardian Access Portal',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          onPressed: () => context.push(AppRoutes.alertsNexusPath),
          icon: const Icon(
            Icons.notifications_none_rounded,
            color: AppColors.textHeading,
          ),
          tooltip: 'Notifications',
        ),
        IconButton(
          onPressed: () => context.push(AppRoutes.settingsPath),
          icon: const Icon(
            Icons.settings_outlined,
            color: AppColors.textHeading,
          ),
          tooltip: 'Settings',
        ),
      ],
    );
  }

  // ── Greeting Header ────────────────────────────────────────────────────────
  Widget _buildGreetingHeader(SessionManager session) {
    final firstName = (session.name ?? 'Guardian').split(' ').first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_greeting()}, $firstName 👋',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textHeading,
          ),
        ),
        const SizedBox(height: 4),
        if (_selectedWard != null)
          Text(
            'Monitoring attendance for: ${_selectedWard!['full_name']}',
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
          ),
      ],
    );
  }

  // ── Ward Selector ──────────────────────────────────────────────────────────
  Widget _buildWardSelector() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ModernDashboardCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Map<String, dynamic>>(
          value: _selectedWard,
          dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
          items: _wards.map((ward) {
            return DropdownMenuItem<Map<String, dynamic>>(
              value: ward as Map<String, dynamic>,
              child: Text(
                ward['full_name'] as String,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : AppColors.textHeading,
                ),
              ),
            );
          }).toList(),
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _selectedWard = val;
              });
              context.read<SessionManager>().setSelectedWard(val);
              _loadWardData(val['email']);
            }
          },
        ),
      ),
    );
  }

  // ── Overall Attendance Card ────────────────────────────────────────────────
  Widget _buildOverallAttendanceCard() {
    final double overall =
        (_wardStats['overall_percentage'] as num?)?.toDouble() ?? 0.0;
    final String standing = _wardStats['standing'] as String? ?? 'Unknown';
    final isGood = overall >= 0.75;

    return ProgressCard(
      title: _selectedWard?['full_name'] ?? 'Ward Status',
      subtitle:
          'Rate: ${(overall * 100).toStringAsFixed(0)}% • ${standing.toUpperCase()}',
      percentage: overall,
      progressColor: isGood ? AppColors.cyan : AppColors.error,
      leadingIcon: Icons.family_restroom_rounded,
    );
  }

  // ── Subject-Wise Attendance ────────────────────────────────────────────────
  Widget _buildSubjectAttendanceSection() {
    final List<dynamic> subjects = _wardStats['subjects'] as List? ?? [];
    // Filter out "Overall"
    final filtered = subjects.where((s) => s['subject'] != 'Overall').toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SUBJECT-WISE ATTENDANCE',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        if (filtered.isEmpty)
          ModernDashboardCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              'No class subjects statistics recorded.',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: isDark ? Colors.white60 : AppColors.textMuted,
              ),
            ),
          )
        else
          ...filtered.map((s) {
            final double rate = s['total'] > 0
                ? (s['present'] / s['total'])
                : 0.0;
            final isGood = rate >= 0.75;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ModernDashboardCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            s['subject'] as String? ?? 'Subject',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: isDark
                                  ? Colors.white
                                  : AppColors.textHeading,
                            ),
                          ),
                        ),
                        Text(
                          '${s['present']}/${s['total']} days',
                          style: GoogleFonts.robotoMono(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white54
                                : AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: rate,
                        color: isGood ? AppColors.cyan : AppColors.error,
                        backgroundColor: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : AppColors.surfaceLight,
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${(rate * 100).toStringAsFixed(0)}% attendance rate',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: isGood ? AppColors.cyan : AppColors.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (!isGood)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.warning_amber_rounded,
                                color: AppColors.error,
                                size: 12,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Attendance Warning',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  color: AppColors.error,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  // ── Quick Actions ──────────────────────────────────────────────────────────
  Widget _buildQuickActions(BuildContext context) {
    final wardEmail = _selectedWard?['email'] ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'GUARDIAN ACTION CONTROLS',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        DashboardGrid(
          crossAxisCount: 2,
          spacing: 14,
          runSpacing: 14,
          children: [
            QuickActionCard(
              label: 'Attendance logs',
              description: 'Chronological check-in histories',
              icon: Icons.assignment_turned_in_outlined,
              color: AppColors.cyan,
              onTap: () =>
                  context.push('/parent/attendance-logs', extra: wardEmail),
            ),
            QuickActionCard(
              label: 'Leave status',
              description: 'Monitor requests & approvals',
              icon: Icons.event_busy_outlined,
              color: Colors.orangeAccent,
              onTap: () =>
                  context.push('/parent/leave-status', extra: wardEmail),
            ),
            QuickActionCard(
              label: 'Alerts & warnings',
              description: 'Notifications & warnings',
              icon: Icons.warning_amber_outlined,
              color: AppColors.error,
              onTap: () => context.push('/notifications/nexus'),
            ),
            QuickActionCard(
              label: 'Download reports',
              description: 'Export check-in sheets',
              icon: Icons.download_for_offline_outlined,
              color: AppColors.success,
              onTap: () {
                // PDF export simulation dialog
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(
                      'Export Report',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                    ),
                    content: Text(
                      'Do you want to export the attendance check-in report for ${_selectedWard?['full_name']}?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Report generated & downloaded to device successfully.',
                              ),
                            ),
                          );
                        },
                        child: const Text('Export PDF'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  // ── Leave Requests ─────────────────────────────────────────────────────────
  Widget _buildLeaveRequestsSection() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WARD LEAVE APPLICATIONS',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        if (_leaveRequests.isEmpty)
          ModernDashboardCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              'No leave requests recorded for this ward.',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: isDark ? Colors.white60 : AppColors.textMuted,
              ),
            ),
          )
        else
          ..._leaveRequests.take(3).map((leave) {
            final isApproved = leave.status.toLowerCase() == 'approved';
            final isPending = leave.status.toLowerCase() == 'pending';

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ModernDashboardCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: isApproved
                            ? AppColors.success.withValues(alpha: 0.15)
                            : (isPending
                                  ? Colors.orangeAccent.withValues(alpha: 0.15)
                                  : AppColors.error.withValues(alpha: 0.15)),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isApproved
                            ? Icons.check_circle_rounded
                            : (isPending
                                  ? Icons.pending_rounded
                                  : Icons.cancel_rounded),
                        color: isApproved
                            ? AppColors.success
                            : (isPending
                                  ? Colors.orangeAccent
                                  : AppColors.error),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            leave.reason,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : AppColors.textHeading,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Duration: ${leave.startDate.split('T')[0]} to ${leave.endDate.split('T')[0]}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
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
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isApproved
                            ? AppColors.success.withValues(alpha: 0.1)
                            : (isPending
                                  ? Colors.orangeAccent.withValues(alpha: 0.1)
                                  : AppColors.error.withValues(alpha: 0.1)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        leave.status.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isApproved
                              ? AppColors.success
                              : (isPending
                                    ? Colors.orangeAccent
                                    : AppColors.error),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  // ── Recent Activity Logs ───────────────────────────────────────────────────
  Widget _buildRecentActivitySection() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'RECENT CLASS CHECK-INS',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        if (_attendanceLogs.isEmpty)
          ModernDashboardCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              'No recent check-in activities.',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: isDark ? Colors.white60 : AppColors.textMuted,
              ),
            ),
          )
        else
          ..._attendanceLogs.take(3).map((log) {
            final isPresent = log['status']?.toLowerCase() == 'present';

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ModernDashboardCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: isPresent ? AppColors.success : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            log['subject'] as String? ?? 'Class Check-in',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : AppColors.textHeading,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Verified by: ${log['verifiedBy'] ?? 'System'}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
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
                    Text(
                      log['date'] as String? ?? '',
                      style: GoogleFonts.robotoMono(
                        fontSize: 11,
                        color: isDark ? Colors.white60 : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}
