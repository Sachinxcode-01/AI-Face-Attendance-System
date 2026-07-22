/*
|--------------------------------------------------------------------------
| File: leave_review_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the leave request review screen for teachers and administrators.
| Allows faculty to approve, reject, or request clarification on pending leave requests.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class LeaveReviewScreen extends StatefulWidget {
  final bool showAppBar;
  const LeaveReviewScreen({super.key, this.showAppBar = true});

  @override
  State<LeaveReviewScreen> createState() => _LeaveReviewScreenState();
}

class _LeaveReviewScreenState extends State<LeaveReviewScreen> {
  final Map<String, TextEditingController> _remarksControllers = {};
  bool _isInit = true;

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
    for (var controller in _remarksControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _refreshData() async {
    await context.read<LeaveController>().fetchPendingLeaves();
  }

  TextEditingController _getControllerFor(String id) {
    return _remarksControllers.putIfAbsent(id, () => TextEditingController());
  }

  Future<void> _handleAction(
    String leaveId,
    String status, {
    bool isClarification = false,
  }) async {
    final controller = context.read<LeaveController>();
    final remarksText = _getControllerFor(leaveId).text.trim();
    final defaultRemarks = isClarification
        ? 'Clarification requested by department head.'
        : status == 'Approved'
        ? 'Approved. Absence excused.'
        : 'Rejected. Request does not meet standard policy guidelines.';
    final remarks = remarksText.isNotEmpty ? remarksText : defaultRemarks;

    final result = await controller.actionLeave(
      leaveId,
      status,
      remarks,
      isClarificationRequested: isClarification,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Action successful'),
          backgroundColor: isClarification
              ? Colors.cyan
              : status == 'Approved'
              ? Colors.green
              : Colors.red,
        ),
      );
      _remarksControllers[leaveId]?.clear();
      _refreshData();
    }
  }

  String _formatDateString(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeController>().isDark;
    final controller = context.watch<LeaveController>();
    final pending = controller.pendingLeaves
        .where((l) => l.status.toLowerCase() == 'pending')
        .toList();

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: widget.showAppBar
            ? PremiumAppBar(
                title: 'Audit Desk',
                leading: IconButton(
                  icon: Icon(
                    Icons.arrow_back_ios,
                    color: isDark ? Colors.white : AppColors.bgDark,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                actions: [
                  IconButton(
                    onPressed: _refreshData,
                    icon: Icon(
                      Icons.refresh,
                      color: isDark ? Colors.white : AppColors.bgDark,
                    ),
                  ),
                ],
              )
            : null,
        body: RefreshIndicator(
          onRefresh: _refreshData,
          color: AppColors.primary,
          child: controller.isLoading && pending.isEmpty
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                )
              : pending.isEmpty
              ? _buildEmptyState(isDark)
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: pending.length,
                  itemBuilder: (context, index) {
                    final request = pending[index];
                    return _buildReviewCard(request, isDark)
                        .animate()
                        .fadeIn(delay: (index * 80).ms)
                        .slideY(begin: 0.05);
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.done_all_rounded,
            color: Colors.greenAccent.withValues(alpha: 0.5),
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            'All caught up!',
            style: GoogleFonts.inter(
              fontSize: 18,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
          Text(
            'No pending leave requests found.',
            style: TextStyle(
              color: isDark ? Colors.white24 : Colors.black38,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(LeaveModel request, bool isDark) {
    final dates =
        '${_formatDateString(request.startDate)} to ${_formatDateString(request.endDate)}';
    final durationStr = request.durationDays == 1
        ? '1 Day'
        : '${request.durationDays} Days';
    final remarksController = _getControllerFor(request.id!);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        borderColor: Colors.white.withValues(alpha: 0.05),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.gold,
                  child: Text(
                    request.studentEmail[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.studentEmail,
                        style: TextStyle(
                          color: isDark ? Colors.white : AppColors.bgDark,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'Category: ${request.leaveType.toUpperCase()}',
                        style: TextStyle(
                          color: isDark ? Colors.white54 : Colors.black54,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  durationStr,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Absence Window: $dates',
              style: TextStyle(
                color: isDark ? Colors.white70 : Colors.black87,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              request.reason,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: remarksController,
              maxLines: 2,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black87,
                fontSize: 13,
              ),
              decoration: InputDecoration(
                labelText: 'Audit Remarks / Clarification Requirements',
                labelStyle: TextStyle(
                  color: isDark ? Colors.white38 : Colors.black45,
                  fontSize: 11,
                ),
                filled: true,
                fillColor: isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : Colors.black.withValues(alpha: 0.02),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppColors.gold,
                    width: 1.0,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleAction(
                      request.id!,
                      'Clarification',
                      isClarification: true,
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isDark
                          ? Colors.cyanAccent
                          : Colors.cyan.shade700,
                      side: BorderSide(
                        color: isDark
                            ? Colors.cyanAccent
                            : Colors.cyan.shade700,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'NEED INFO',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleAction(request.id!, 'Rejected'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isDark
                          ? Colors.redAccent
                          : Colors.red.shade700,
                      side: BorderSide(
                        color: isDark ? Colors.redAccent : Colors.red.shade700,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'REJECT',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleAction(request.id!, 'Approved'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark
                          ? Colors.greenAccent
                          : Colors.green.shade600,
                      foregroundColor: isDark ? Colors.black : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'APPROVE',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
