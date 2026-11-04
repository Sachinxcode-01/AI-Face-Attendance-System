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
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/features/leave/models/leave_balance.dart';
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
        return const Color(0xFF10B981);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'clarification':
        return const Color(0xFF6366F1);
      case 'pending':
      default:
        return const Color(0xFFF59E0B);
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
      baseColor: isDark ? const Color(0xFF070A14) : const Color(0xFFE8EAF6),
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
          color: const Color(0xFF4F46E5),
          backgroundColor: isDark ? AppColors.bgCard : Colors.white,
          child: controller.isLoading && balance == null
              ? const Center(
                  child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
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
            color: const Color(0xFF4F46E5),
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Manage your absences, $name',
          style: GoogleFonts.poppins(
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
        AnimationLimiter(
          child: GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 1.35,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            children: [
              StaggeredGridItem(
                position: 0,
                columnCount: 2,
                child: MetricCard(
                  label: 'Sick Leave',
                  value: '$sick Days',
                  icon: Icons.healing_rounded,
                  accentColor: Colors.tealAccent,
                ),
              ),
              StaggeredGridItem(
                position: 1,
                columnCount: 2,
                child: MetricCard(
                  label: 'Personal Leave',
                  value: '$personal Days',
                  icon: Icons.person_rounded,
                  accentColor: Colors.orangeAccent,
                ),
              ),
              StaggeredGridItem(
                position: 2,
                columnCount: 2,
                child: MetricCard(
                  label: 'Emergency Leave',
                  value: '$emergency Days',
                  icon: Icons.warning_amber_rounded,
                  accentColor: const Color(0xFFEF4444),
                ),
              ),
              StaggeredGridItem(
                position: 3,
                columnCount: 2,
                child: MetricCard(
                  label: 'Academic Leave',
                  value: '$academic Days',
                  icon: Icons.school_rounded,
                  accentColor: Colors.blueAccent,
                ),
              ),
            ],
          ),
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
      borderColor: const Color(0xFF4F46E5).withValues(alpha: 0.1),
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
              _buildOverviewItem(
                'Pending',
                '$pending',
                const Color(0xFFF59E0B),
                isDark,
              ),
              _buildOverviewItem(
                'Approved',
                '$approved',
                const Color(0xFF10B981),
                isDark,
              ),
              _buildOverviewItem(
                'Rejected',
                '$rejected',
                const Color(0xFFEF4444),
                isDark,
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 350.ms, duration: 500.ms);
  }

  Widget _buildOverviewItem(
    String label,
    String count,
    Color color,
    bool isDark,
  ) {
    return Column(
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            count,
            style: GoogleFonts.poppins(
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        Expanded(
          child: PressableScale(
            onTap: () async {
              HapticFeedback.mediumImpact();
              final result = await context.push('/student/leave/apply');
              if (result == true) {
                _refreshData();
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 15),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_circle_outline_rounded, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'APPLY LEAVE',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      letterSpacing: 0.8,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: PressableScale(
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('/student/leave/history');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141D38) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? Colors.black26 : const Color(0xFF8B98CE).withValues(alpha: 0.10),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history_rounded,
                    color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'VIEW HISTORY',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      letterSpacing: 0.8,
                      color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                    ),
                  ),
                ],
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
                    color: Color(0xFF4F46E5),
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
                                  color: isDark
                                      ? Colors.white70
                                      : Colors.black87,
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
