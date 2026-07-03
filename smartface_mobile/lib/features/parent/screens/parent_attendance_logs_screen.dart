/*
|--------------------------------------------------------------------------
| File: parent_attendance_logs_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Detailed attendance check-in roster for parents. Shows a chronological
| timeline of present and absent check-ins for the selected ward.
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

class ParentAttendanceLogsScreen extends StatefulWidget {
  final String wardEmail;

  const ParentAttendanceLogsScreen({super.key, required this.wardEmail});

  @override
  State<ParentAttendanceLogsScreen> createState() =>
      _ParentAttendanceLogsScreenState();
}

class _ParentAttendanceLogsScreenState extends State<ParentAttendanceLogsScreen> {
  bool _isLoading = true;
  List<dynamic> _logs = [];
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    setState(() => _isLoading = true);
    try {
      final session = context.read<SessionManager>();
      final token = session.token;
      if (token == null) return;

      final logs = await ApiService.getWardAttendanceLogs(widget.wardEmail, token);
      if (mounted) {
        setState(() {
          _logs = logs;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('ParentAttendanceLogsScreen fetch error: $e');
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

    final filteredLogs = _logs.where((log) {
      if (_selectedFilter == 'All') return true;
      return (log['status'] as String).toLowerCase() == _selectedFilter.toLowerCase();
    }).toList();

    return AuthBlobBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Attendance History',
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFF1B2C56)),
              onPressed: _fetchLogs,
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Filter chips
              Row(
                children: [
                  _buildFilterChip('All'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Present'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Absent'),
                ],
              ),
              const SizedBox(height: 16),

              // Roster timeline
              Expanded(
                child: filteredLogs.isEmpty
                    ? Center(
                        child: Text(
                          'No check-in logs found for this filter.',
                          style: GoogleFonts.inter(color: const Color(0xFF7F8CA4)),
                        ),
                      )
                    : ListView.builder(
                        itemCount: filteredLogs.length,
                        physics: const BouncingScrollPhysics(),
                        itemBuilder: (context, index) {
                          final log = filteredLogs[index];
                          final isPresent = (log['status'] as String).toLowerCase() == 'present';

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10.0),
                            child: GlassContainer(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              child: Row(
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: isPresent
                                          ? AppColors.success.withValues(alpha: 0.12)
                                          : AppColors.error.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isPresent ? Icons.check_circle_outline_rounded : Icons.cancel_outlined,
                                      color: isPresent ? AppColors.success : AppColors.error,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          log['subject'] as String? ?? 'Class Session',
                                          style: GoogleFonts.inter(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: const Color(0xFF1B2C56),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Verified via: ${log['verifiedBy'] ?? 'AI Engine'}',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            color: const Color(0xFF7F8CA4),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    log['date'] as String? ?? '',
                                    style: GoogleFonts.robotoMono(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF1B2C56),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (val) {
        if (val) {
          setState(() => _selectedFilter = label);
        }
      },
      selectedColor: const Color(0xFF0EA5E9).withValues(alpha: 0.2),
      labelStyle: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: isSelected ? const Color(0xFF0EA5E9) : const Color(0xFF7F8CA4),
      ),
    );
  }
}
