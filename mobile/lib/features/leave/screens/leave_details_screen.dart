/*
|--------------------------------------------------------------------------
| File: leave_details_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium details screen for a single leave application.
| Includes request metadata, teacher remarks, and a vertical approval timeline.
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

class LeaveDetailsScreen extends StatelessWidget {
  final String leaveId;

  const LeaveDetailsScreen({super.key, required this.leaveId});

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

  String _formatDateString(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Pending';
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

    LeaveModel? leave;
    try {
      leave = controller.leaves.firstWhere((l) => l.id == leaveId);
    } catch (_) {
      try {
        leave = controller.pendingLeaves.firstWhere((l) => l.id == leaveId);
      } catch (_) {}
    }

    if (leave == null) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        appBar: const PremiumAppBar(title: 'Leave Details'),
        body: const Center(
          child: Text(
            'Leave application not found',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    final statusColor = _getStatusColor(leave.status);
    final durationStr = leave.durationDays == 1
        ? '1 Day'
        : '${leave.durationDays} Days';

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Request #${leave.id}',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusHeader(leave, statusColor, durationStr, isDark),
              const SizedBox(height: 24),
              _buildMetaDetails(leave, isDark),
              const SizedBox(height: 24),
              if (leave.remarks != null && leave.remarks!.isNotEmpty) ...[
                _buildRemarksCard(leave, statusColor, isDark),
                const SizedBox(height: 24),
              ],
              _buildTimelineSection(leave, isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusHeader(
    LeaveModel leave,
    Color statusColor,
    String durationStr,
    bool isDark,
  ) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: statusColor.withValues(alpha: 0.2),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  leave.leaveType.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  leave.reason,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.bgDark,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Duration: $durationStr (${_formatDateString(leave.startDate)} - ${_formatDateString(leave.endDate)})',
                  style: TextStyle(
                    color: isDark ? Colors.white70 : Colors.black87,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
            ),
            child: Text(
              leave.status.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: statusColor,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.05);
  }

  Widget _buildMetaDetails(LeaveModel leave, bool isDark) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'METADATA & ATTACHMENTS',
            style: GoogleFonts.inter(
              fontSize: 10,
              letterSpacing: 1.5,
              color: isDark ? Colors.white54 : Colors.black54,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildMetaRow('Student Identity', leave.studentEmail, isDark),
          const Divider(color: Colors.white10),
          _buildMetaRow(
            'Submission Date',
            _formatDateString(leave.createdAt),
            isDark,
          ),
          const Divider(color: Colors.white10),
          _buildMetaRow(
            'HOD Review Stage',
            leave.hodStatus.toUpperCase(),
            isDark,
          ),
          const Divider(color: Colors.white10),
          _buildAttachmentRow(leave, isDark),
        ],
      ),
    ).animate().fadeIn(delay: 150.ms, duration: 500.ms);
  }

  Widget _buildMetaRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isDark ? Colors.white54 : Colors.black54,
              fontSize: 13,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: isDark ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentRow(LeaveModel leave, bool isDark) {
    final hasAttachment =
        leave.attachmentName != null && leave.attachmentName!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Attachment',
            style: TextStyle(
              color: isDark ? Colors.white54 : Colors.black54,
              fontSize: 13,
            ),
          ),
          hasAttachment
              ? Row(
                  children: [
                    const Icon(
                      Icons.picture_as_pdf_rounded,
                      color: Colors.redAccent,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      leave.attachmentName!,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ],
                )
              : Text(
                  'None Uploaded',
                  style: TextStyle(
                    color: isDark ? Colors.white30 : Colors.black38,
                    fontSize: 13,
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildRemarksCard(LeaveModel leave, Color statusColor, bool isDark) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: statusColor.withValues(alpha: 0.15),
      backgroundColor: statusColor.withValues(alpha: 0.03),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.rate_review_outlined, color: statusColor, size: 20),
              const SizedBox(width: 8),
              Text(
                'OFFICIAL REMARKS',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  letterSpacing: 1.5,
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            leave.remarks ?? '',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: isDark ? Colors.white70 : Colors.black87,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Processed on: ${_formatDateString(leave.approvalDate)}',
            style: TextStyle(
              color: isDark ? Colors.white38 : Colors.black45,
              fontSize: 11,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 250.ms, duration: 500.ms);
  }

  Widget _buildTimelineSection(LeaveModel leave, bool isDark) {
    final status = leave.status.toLowerCase();
    final isApproved = status == 'approved';
    final isRejected = status == 'rejected';
    final isClarification =
        status == 'clarification' || leave.isClarificationRequested;

    final timelineItems = [
      TimelineItem(
        title: 'Application Submitted',
        description: 'Leave request registered and logged into Nexa AI server.',
        timestamp: _formatDateString(leave.createdAt),
        icon: Icons.assignment_turned_in_outlined,
        iconColor: Colors.tealAccent,
      ),
      TimelineItem(
        title: 'Department Head Reviewing',
        description: 'Assigned to faculty reviewer for syllabus impact check.',
        timestamp: _formatDateString(leave.createdAt),
        icon: Icons.hourglass_top_rounded,
        iconColor: status == 'pending' ? Colors.amberAccent : Colors.tealAccent,
      ),
      if (leave.leaveType.toLowerCase() == 'academic' ||
          leave.durationDays >= 3)
        TimelineItem(
          title: 'HOD Approval Routing',
          description: leave.hodStatus == 'none'
              ? 'Verification skipped (short duration).'
              : leave.hodStatus == 'pending'
              ? 'High priority routing to Head of Department.'
              : 'Verified by Head of Department (${leave.hodStatus.toUpperCase()}).',
          timestamp: leave.hodStatus != 'none' && leave.hodStatus != 'pending'
              ? _formatDateString(leave.approvalDate)
              : 'Pending',
          icon: Icons.supervisor_account_rounded,
          iconColor: leave.hodStatus == 'none'
              ? Colors.white24
              : leave.hodStatus == 'pending'
              ? Colors.amberAccent
              : leave.hodStatus == 'approved'
              ? Colors.tealAccent
              : Colors.redAccent,
        ),
      TimelineItem(
        title: isClarification
            ? 'Clarification Required'
            : isRejected
            ? 'Request Rejected'
            : isApproved
            ? 'Request Approved'
            : 'Decision Pending',
        description: isClarification
            ? 'Remarks request additional documents to clear verification.'
            : isRejected
            ? 'Application denied due to policy violation.'
            : isApproved
            ? 'Request approved. Absence marked in SmartFace calendar.'
            : 'Review in progress. Check notifications for decisions.',
        timestamp: _formatDateString(leave.approvalDate),
        icon: isClarification
            ? Icons.help_outline_rounded
            : isRejected
            ? Icons.cancel_outlined
            : isApproved
            ? Icons.verified_user_outlined
            : Icons.check_circle_outline_rounded,
        iconColor: isClarification
            ? Colors.cyanAccent
            : isRejected
            ? Colors.redAccent
            : isApproved
            ? Colors.greenAccent
            : Colors.white24,
      ),
    ];

    return ActivityTimeline(
      title: 'APPROVAL TIMELINE',
      items: timelineItems,
    ).animate().fadeIn(delay: 350.ms, duration: 500.ms);
  }
}
