/*
|--------------------------------------------------------------------------
| File: student_leave_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium dashboard for student leave balances, quotas, and recent activity.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/leave/models/leave_balance.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class StudentLeaveDashboardScreen extends StatefulWidget {
  const StudentLeaveDashboardScreen({super.key});

  @override
  State<StudentLeaveDashboardScreen> createState() =>
      _StudentLeaveDashboardScreenState();
}

class _StudentLeaveDashboardScreenState
    extends State<StudentLeaveDashboardScreen> {
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      final session = context.read<SessionManager>();
      final email = session.email ?? 'student@example.com';
      final controller = context.read<LeaveController>();
      controller.fetchBalances(email);
      controller.fetchStudentLeaves(email);
      _isInit = false;
    }
  }

  Future<void> _refreshData() async {
    final session = context.read<SessionManager>();
    final email = session.email ?? 'student@example.com';
    final controller = context.read<LeaveController>();
    await Future.wait([
      controller.fetchBalances(email),
      controller.fetchStudentLeaves(email),
    ]);
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.greenAccent;
      case 'rejected':
        return Colors.redAccent;
      case 'clarification':
        return Colors.cyanAccent;
      case 'pending':
      default:
        return Colors.amberAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeController>().isDark;
    final controller = context.watch<LeaveController>();

    final balance = controller.balance;
    final leaves = controller.leaves;
    final pendingCount = leaves
        .where((l) => l.status.toLowerCase() == 'pending')
        .length;
    final approvedCount = leaves
        .where((l) => l.status.toLowerCase() == 'approved')
        .length;
    final rejectedCount = leaves
        .where((l) => l.status.toLowerCase() == 'rejected')
        .length;

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Leave Portal',
          actions: [
            IconButton(
              icon: Icon(
                Icons.refresh,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
              onPressed: _refreshData,
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _refreshData,
          color: AppColors.gold,
          backgroundColor: isDark ? AppColors.bgCard : Colors.white,
          child: controller.isLoading && balance == null
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                )
              : SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildWelcomeHeader(isDark),
                      const SizedBox(height: 24),
                      _buildBalancesGrid(balance, isDark),
                      const SizedBox(height: 24),
                      _buildOverviewSection(
                        pendingCount,
                        approvedCount,
                        rejectedCount,
                        isDark,
                      ),
                      const SizedBox(height: 32),
                      _buildActionButtons(context),
                      const SizedBox(height: 32),
                      _buildRecentRequestsSection(leaves, isDark),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(bool isDark) {
    final session = context.read<SessionManager>();
    final name = session.name ?? 'Student';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WELCOME TO LEAVE HUB',
          style: GoogleFonts.inter(
            fontSize: 11,
            letterSpacing: 2.0,
            color: AppColors.gold,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Manage your absences, $name',
          style: GoogleFonts.outfit(
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.bgDark,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'View your remaining leave balance quotas and track active approvals.',
          style: TextStyle(
            color: isDark ? Colors.white70 : Colors.black54,
            fontSize: 14,
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms).slideX(begin: -0.05);
  }

  Widget _buildBalancesGrid(LeaveBalance? balance, bool isDark) {
    final sick = balance?.sick ?? 0;
    final personal = balance?.personal ?? 0;
    final emergency = balance?.emergency ?? 0;
    final academic = balance?.academic ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'AVAILABLE LEAVE BALANCES',
          style: GoogleFonts.inter(
            fontSize: 11,
            letterSpacing: 1.5,
            color: isDark ? Colors.white54 : Colors.black54,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.35,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            MetricCard(
              label: 'Sick Leave',
              value: '$sick Days',
              icon: Icons.healing_rounded,
              accentColor: Colors.tealAccent,
            ),
            MetricCard(
              label: 'Personal Leave',
              value: '$personal Days',
              icon: Icons.person_rounded,
              accentColor: Colors.orangeAccent,
            ),
            MetricCard(
              label: 'Emergency Leave',
              value: '$emergency Days',
              icon: Icons.warning_amber_rounded,
              accentColor: Colors.redAccent,
            ),
            MetricCard(
              label: 'Academic Leave',
              value: '$academic Days',
              icon: Icons.school_rounded,
              accentColor: Colors.blueAccent,
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 200.ms, duration: 500.ms);
  }

  Widget _buildOverviewSection(
    int pending,
    int approved,
    int rejected,
    bool isDark,
  ) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: AppColors.gold.withValues(alpha: 0.1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'APPLICATION LIFETIME SUMMARY',
            style: GoogleFonts.inter(
              fontSize: 10,
              letterSpacing: 1.5,
              color: isDark ? Colors.white54 : Colors.black54,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOverviewItem('Pending', '$pending', Colors.amberAccent, isDark),
              _buildOverviewItem('Approved', '$approved', Colors.greenAccent, isDark),
              _buildOverviewItem('Rejected', '$rejected', Colors.redAccent, isDark),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 350.ms, duration: 500.ms);
  }

  Widget _buildOverviewItem(String label, String count, Color color, bool isDark) {
    return Column(
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            count,
            style: GoogleFonts.outfit(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: isDark ? Colors.white54 : Colors.black54,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () async {
              final result = await context.push('/student/leave/apply');
              if (result == true) {
                _refreshData();
              }
            },
            icon: const Icon(Icons.add_box_rounded, color: Colors.black),
            label: const Text(
              'APPLY LEAVE',
              style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => context.push('/student/leave/history'),
            icon: const Icon(Icons.history_rounded, color: AppColors.gold),
            label: const Text(
              'VIEW HISTORY',
              style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.gold,
              side: const BorderSide(color: AppColors.gold, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ],
    ).animate().fadeIn(delay: 450.ms, duration: 500.ms);
  }

  Widget _buildRecentRequestsSection(List<LeaveModel> leaves, bool isDark) {
    final recentLeaves = leaves.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'RECENT REQUESTS',
              style: GoogleFonts.inter(
                fontSize: 11,
                letterSpacing: 1.5,
                color: isDark ? Colors.white54 : Colors.black54,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (leaves.isNotEmpty)
              TextButton(
                onPressed: () => context.push('/student/leave/history'),
                child: const Text(
                  'See All',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (recentLeaves.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Center(
              child: Text(
                'No recent leave applications.',
                style: TextStyle(
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
              ),
            ),
          )
        else
          ...List.generate(recentLeaves.length, (index) {
            final leave = recentLeaves[index];
            final statusColor = _getStatusColor(leave.status);
            final durationStr = leave.durationDays == 1
                ? '1 Day'
                : '${leave.durationDays} Days';

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                borderColor: Colors.white.withValues(alpha: 0.05),
                onTap: () {
                  context.push('/student/leave/details/${leave.id}');
                },
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        leave.status.toLowerCase() == 'approved'
                            ? Icons.check_circle_outline_rounded
                            : leave.status.toLowerCase() == 'rejected'
                            ? Icons.cancel_outlined
                            : Icons.hourglass_empty_rounded,
                        color: statusColor,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  leave.leaveType.toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: statusColor,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                durationStr,
                                style: TextStyle(
                                  color: isDark ? Colors.white70 : Colors.black87,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            leave.reason,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : AppColors.bgDark,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Request ID: ${leave.id}',
                            style: TextStyle(
                              color: isDark ? Colors.white38 : Colors.black45,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: isDark ? Colors.white30 : Colors.black38,
                      size: 16,
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    ).animate().fadeIn(delay: 550.ms, duration: 500.ms);
  }
}
