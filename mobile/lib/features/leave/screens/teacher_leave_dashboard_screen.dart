/*
|--------------------------------------------------------------------------
| File: teacher_leave_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium review dashboard for teachers/faculty to audit,
| search, and action student leave requests.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class TeacherLeaveDashboardScreen extends StatefulWidget {
  const TeacherLeaveDashboardScreen({super.key});

  @override
  State<TeacherLeaveDashboardScreen> createState() =>
      _TeacherLeaveDashboardScreenState();
}

class _TeacherLeaveDashboardScreenState
    extends State<TeacherLeaveDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _remarksController = TextEditingController();
  bool _isInit = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      _refreshData();
      _isInit = false;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _refreshData() async {
    final controller = context.read<LeaveController>();
    // Teachers review all pending leaves
    await controller.fetchPendingLeaves();
    // Also fetch analytics to show overall stats
    await controller.fetchAnalytics();
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

  void _openReviewSheet(BuildContext context, LeaveModel request) {
    _remarksController.clear();
    final isDark = context.read<ThemeController>().isDark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                top: 24,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppColors.bgModal : Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(30),
                ),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.black12,
                  width: 1.0,
                ),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white24 : Colors.black26,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'REVIEW APPLICATION',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        letterSpacing: 1.5,
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Request #${request.id}',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.bgDark,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Student: ${request.studentEmail}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Type: ${request.leaveType.toUpperCase()}',
                      style: const TextStyle(color: Colors.white54),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Reason: ${request.reason}',
                      style: TextStyle(
                        color: isDark ? Colors.white : Colors.black87,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'QUICK REMARKS',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white54 : Colors.black45,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          'Medical Proof Verified',
                          'Academic Duty Approved',
                          'Exceeded Quota Limit',
                          'Requires Official Stamp',
                          'Approved with Exception',
                        ].map((chip) {
                          final isSelected = _remarksController.text == chip;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: InkWell(
                              onTap: () {
                                setModalState(() {
                                  _remarksController.text = chip;
                                });
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.gold.withValues(alpha: 0.2)
                                      : (isDark
                                          ? Colors.white.withValues(alpha: 0.05)
                                          : Colors.black.withValues(alpha: 0.04)),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.gold
                                        : (isDark
                                            ? Colors.white12
                                            : Colors.black12),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                ),
                                child: Text(
                                  chip,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    color: isSelected
                                        ? AppColors.gold
                                        : (isDark
                                            ? Colors.white70
                                            : Colors.black87),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _remarksController,
                      maxLines: 3,
                      style: TextStyle(
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      decoration: InputDecoration(
                        labelText: 'Reviewer Remarks / Feedback',
                        labelStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: isDark
                            ? Colors.white.withValues(alpha: 0.05)
                            : Colors.black.withValues(alpha: 0.03),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(
                            color: AppColors.gold,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () async {
                              final controller = context
                                  .read<LeaveController>();
                              final remarks =
                                  _remarksController.text.trim().isNotEmpty
                                  ? _remarksController.text.trim()
                                  : 'Clarification requested by department head.';
                              await controller.actionLeave(
                                request.id!,
                                'Clarification',
                                remarks,
                                isClarificationRequested: true,
                              );
                              if (context.mounted) {
                                Navigator.pop(context);
                                _refreshData();
                              }
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.cyanAccent,
                              side: const BorderSide(color: Colors.cyanAccent),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'NEED INFO',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () async {
                              final controller = context
                                  .read<LeaveController>();
                              final remarks =
                                  _remarksController.text.trim().isNotEmpty
                                  ? _remarksController.text.trim()
                                  : 'Rejected. Violation of leaves criteria.';
                              await controller.actionLeave(
                                request.id!,
                                'Rejected',
                                remarks,
                              );
                              if (context.mounted) {
                                Navigator.pop(context);
                                _refreshData();
                              }
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.redAccent,
                              side: const BorderSide(color: Colors.redAccent),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'REJECT',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final controller = context
                                  .read<LeaveController>();
                              final remarks =
                                  _remarksController.text.trim().isNotEmpty
                                  ? _remarksController.text.trim()
                                  : 'Approved. Absences excused.';
                              await controller.actionLeave(
                                request.id!,
                                'Approved',
                                remarks,
                              );
                              if (context.mounted) {
                                Navigator.pop(context);
                                _refreshData();
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.greenAccent,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'APPROVE',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeController>().isDark;
    final controller = context.watch<LeaveController>();
    final pendingList = controller.pendingLeaves;
    final analytics = controller.analytics;

    // Filter lists for tabs
    final pending = pendingList
        .where((l) => l.status.toLowerCase() == 'pending')
        .toList();
    final approved = pendingList
        .where((l) => l.status.toLowerCase() == 'approved')
        .toList();
    final rejected = pendingList
        .where(
          (l) =>
              l.status.toLowerCase() == 'rejected' ||
              l.status.toLowerCase() == 'clarification',
        )
        .toList();

    final totalReq = analytics['total_requests'] ?? pendingList.length;
    final approvalRate = analytics['approval_rate'] ?? 0.85;

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Leave Audit Desk',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
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
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              SliverPadding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildOverviewMetrics(
                      pending.length,
                      totalReq,
                      approvalRate,
                      isDark,
                    ),
                    const SizedBox(height: 24),
                    _buildTabBar(isDark),
                    const SizedBox(height: 12),
                  ]),
                ),
              ),
            ];
          },
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildRequestsList(pending, true, isDark),
              _buildRequestsList(approved, false, isDark),
              _buildRequestsList(rejected, false, isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewMetrics(
    int pendingCount,
    int total,
    double rate,
    bool isDark,
  ) {
    final ratePercent = (rate * 100).toStringAsFixed(0);

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      childAspectRatio: 1.15,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        MetricCard(
          label: 'Awaiting Audit',
          value: '$pendingCount',
          icon: Icons.pending_actions_rounded,
          accentColor: Colors.amberAccent,
        ),
        MetricCard(
          label: 'Total Audited',
          value: '$total',
          icon: Icons.analytics_rounded,
          accentColor: Colors.blueAccent,
        ),
        MetricCard(
          label: 'Approval Rate',
          value: '$ratePercent%',
          icon: Icons.verified_user_rounded,
          accentColor: Colors.greenAccent,
        ),
      ],
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildTabBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.gold,
          borderRadius: BorderRadius.circular(12),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: Colors.black,
        unselectedLabelColor: isDark ? Colors.white54 : Colors.black54,
        labelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
        tabs: const [
          Tab(text: 'PENDING'),
          Tab(text: 'APPROVED'),
          Tab(text: 'AUDITED'),
        ],
      ),
    );
  }

  Widget _buildRequestsList(
    List<LeaveModel> list,
    bool isPending,
    bool isDark,
  ) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.rule_folder_outlined,
              color: isDark ? Colors.white24 : Colors.black26,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              'No requests in this category',
              style: GoogleFonts.inter(
                fontSize: 16,
                color: isDark ? Colors.white54 : Colors.black54,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final request = list[index];
        final statusColor = _getStatusColor(request.status);

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassContainer(
            padding: const EdgeInsets.all(20),
            borderColor: Colors.white.withValues(alpha: 0.05),
            onTap: isPending ? () => _openReviewSheet(context, request) : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: AppColors.gold,
                          child: Text(
                            request.studentEmail[0].toUpperCase(),
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          request.studentEmail,
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: isDark ? Colors.white : AppColors.bgDark,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        request.status.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'Reason: ${request.reason}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: isDark ? Colors.white70 : Colors.black87,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Type: ${request.leaveType.toUpperCase()}',
                      style: TextStyle(
                        color: isDark ? Colors.white38 : Colors.black45,
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      'Dates: ${_formatDateString(request.startDate)} to ${_formatDateString(request.endDate)}',
                      style: TextStyle(
                        color: isDark ? Colors.white38 : Colors.black45,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                if (!isPending && request.remarks != null) ...[
                  Divider(
                    color: isDark ? Colors.white10 : Colors.black12,
                    height: 20,
                  ),
                  Text(
                    'Remarks: ${request.remarks}',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ).animate().fadeIn(delay: (index * 80).ms);
      },
    );
  }

  String _formatDateString(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.day}/${date.month}';
    } catch (_) {
      return dateStr;
    }
  }
}
