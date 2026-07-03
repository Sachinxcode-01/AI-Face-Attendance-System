/*
|--------------------------------------------------------------------------
| File: parent_leave_status_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Renders the leave application review log for parents to monitor their
| ward's absences, requests, and HOD status.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/features/leave/models/leave_model.dart';

class ParentLeaveStatusScreen extends StatefulWidget {
  final String wardEmail;

  const ParentLeaveStatusScreen({super.key, required this.wardEmail});

  @override
  State<ParentLeaveStatusScreen> createState() => _ParentLeaveStatusScreenState();
}

class _ParentLeaveStatusScreenState extends State<ParentLeaveStatusScreen> {
  bool _isLoading = true;
  List<LeaveModel> _leaves = [];

  @override
  void initState() {
    super.initState();
    _fetchLeaves();
  }

  Future<void> _fetchLeaves() async {
    setState(() => _isLoading = true);
    try {
      final session = context.read<SessionManager>();
      final token = session.token;
      if (token == null) return;

      final leaves = await ApiService.getWardLeaves(widget.wardEmail, token);
      if (mounted) {
        setState(() {
          _leaves = leaves;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('ParentLeaveStatusScreen fetchLeaves error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: DashboardShimmer());
    }

    return AuthBlobBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Leave Applications',
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFF1B2C56)),
              onPressed: _fetchLeaves,
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: _leaves.isEmpty
              ? Center(
                  child: Text(
                    'No leave applications submitted by this student.',
                    style: GoogleFonts.inter(color: const Color(0xFF7F8CA4)),
                  ),
                )
              : ListView.builder(
                  itemCount: _leaves.length,
                  physics: const BouncingScrollPhysics(),
                  itemBuilder: (context, index) {
                    final leave = _leaves[index];
                    final isApproved = leave.status.toLowerCase() == 'approved';
                    final isPending = leave.status.toLowerCase() == 'pending';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: (leave.leaveType == 'sick')
                                        ? Colors.redAccent.withValues(alpha: 0.1)
                                        : Colors.blueAccent.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    leave.leaveType.toUpperCase(),
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: (leave.leaveType == 'sick')
                                          ? Colors.redAccent
                                          : Colors.blueAccent,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isApproved
                                        ? AppColors.success.withValues(alpha: 0.1)
                                        : (isPending
                                            ? Colors.orangeAccent.withValues(alpha: 0.1)
                                            : AppColors.error.withValues(alpha: 0.1)),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isApproved
                                          ? AppColors.success.withValues(alpha: 0.3)
                                          : (isPending
                                              ? Colors.orangeAccent.withValues(alpha: 0.3)
                                              : AppColors.error.withValues(alpha: 0.3)),
                                    ),
                                  ),
                                  child: Text(
                                    leave.status.toUpperCase(),
                                    style: GoogleFonts.inter(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
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
                            const SizedBox(height: 12),
                            Text(
                              leave.reason,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1B2C56),
                              ),
                            ),
                            const SizedBox(height: 10),
                            const Divider(color: Color(0xFFF1F5FD)),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Duration: ${leave.startDate.split('T')[0]} to ${leave.endDate.split('T')[0]}',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: const Color(0xFF7F8CA4),
                                  ),
                                ),
                                Text(
                                  '${leave.durationDays} Day(s)',
                                  style: GoogleFonts.robotoMono(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1B2C56),
                                  ),
                                ),
                              ],
                            ),
                            if (leave.remarks != null && leave.remarks!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'FACULTY REMARKS',
                                      style: GoogleFonts.inter(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF475569),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      leave.remarks!,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: const Color(0xFF1B2C56),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
