/*
|--------------------------------------------------------------------------
| File: attendance_command_center.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the HOD & Administrator Attendance Command Center. Handles
| live monitors, risk analysis rosters, and chronological audit log reviews.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glassmorphic_card.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/student/widgets/attendance_components.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class AttendanceCommandCenter extends StatefulWidget {
  const AttendanceCommandCenter({super.key});

  @override
  State<AttendanceCommandCenter> createState() =>
      _AttendanceCommandCenterState();
}

class _AttendanceCommandCenterState extends State<AttendanceCommandCenter> {
  bool _isLoading = true;
  Map<String, dynamic>? _commandData;
  List<dynamic> _liveSessions = [];
  List<dynamic> _warningStudents = [];
  List<dynamic> _criticalStudents = [];
  List<dynamic> _auditLogs = [];

  @override
  void initState() {
    super.initState();
    _fetchCommandCenterData();
  }

  Future<void> _fetchCommandCenterData() async {
    setState(() => _isLoading = true);
    try {
      final session = Provider.of<SessionManager>(context, listen: false);
      final token = session.token;
      final isAdmin = session.userRole == UserRole.admin;
      if (token == null) return;

      // Parallel API calls
      final requests = [
        http.get(
          Uri.parse('${ApiService.baseUrl}/attendance/command-center'),
          headers: {'Authorization': 'Bearer $token'},
        ),
        http.get(
          Uri.parse('${ApiService.baseUrl}/attendance/live-monitor'),
          headers: {'Authorization': 'Bearer $token'},
        ),
        http.get(
          Uri.parse(
            '${ApiService.baseUrl}/attendance/risk-analysis?type=below_75',
          ),
          headers: {'Authorization': 'Bearer $token'},
        ),
        http.get(
          Uri.parse(
            '${ApiService.baseUrl}/attendance/risk-analysis?type=below_60',
          ),
          headers: {'Authorization': 'Bearer $token'},
        ),
      ];

      // Add audit logs request if admin
      if (isAdmin) {
        requests.add(
          http.get(
            Uri.parse('${ApiService.baseUrl}/attendance/audit-logs'),
            headers: {'Authorization': 'Bearer $token'},
          ),
        );
      }

      final results = await Future.wait(requests);

      if (results[0].statusCode == 200 &&
          results[1].statusCode == 200 &&
          results[2].statusCode == 200 &&
          results[3].statusCode == 200) {
        if (mounted) {
          setState(() {
            _commandData = jsonDecode(results[0].body);
            _liveSessions = jsonDecode(results[1].body);
            _warningStudents = jsonDecode(results[2].body);
            _criticalStudents = jsonDecode(results[3].body);
            if (isAdmin && results.length > 4 && results[4].statusCode == 200) {
              _auditLogs = jsonDecode(results[4].body);
            }
            _isLoading = false;
          });
        }
      } else {
        throw Exception('API failed to resolve command center payloads');
      }
    } catch (e) {
      debugPrint('Error loading command center: $e');
      if (mounted) {
        AppToast.show(
          context,
          message: 'Failed to load command center telemetry',
          type: ToastType.error,
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context, listen: false);
    final isAdmin = session.userRole == UserRole.admin;

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bgDark,
        body: DashboardShimmer(),
      );
    }

    final data = _commandData;
    if (data == null) {
      return Scaffold(
        backgroundColor: AppColors.bgDark,
        body: Center(
          child: Text(
            'No telemetry available.',
            style: AppText.body(color: Colors.white38),
          ),
        ),
      );
    }

    final int avgAttendance = data['average_attendance'] ?? 85;
    final int totalStudents = data['total_students'] ?? 100;
    final int activeSessions = data['active_sessions'] ?? 0;

    return AuroraBackground(
      baseColor: AppColors.bgDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'HOD Command Center',
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: _fetchCommandCenterData,
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _fetchCommandCenterData,
          color: AppColors.gold,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            children: [
              // 1. Department Overview Counters
              _buildDepartmentCounters(
                avgAttendance,
                totalStudents,
                activeSessions,
              ),
              const SizedBox(height: 20),

              // 2. Live Active Sessions Monitor
              LiveMonitorCard(activeSessions: _liveSessions),
              const SizedBox(height: 20),

              // 3. Risk Categories
              Text(
                'COMPLIANCE RISK CHANNELS',
                style: AppText.label(color: AppColors.gold),
              ),
              const SizedBox(height: 10),

              // 3.1 Warning list (60-75)
              RiskAnalysisCard(
                riskStudents: _warningStudents,
                title: 'WARNING ROSTER (60% - 75%)',
                themeColor: AppColors.warning,
              ),
              const SizedBox(height: 12),

              // 3.2 Critical list (<60)
              RiskAnalysisCard(
                riskStudents: _criticalStudents,
                title: 'CRITICAL WARNING ROSTER (<60%)',
                themeColor: AppColors.error,
              ),
              const SizedBox(height: 20),

              // 4. Tamper-Proof Audit logs (Admins only)
              if (isAdmin && _auditLogs.isNotEmpty) ...[
                AuditLogList(logs: _auditLogs),
                const SizedBox(height: 20),
              ],

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDepartmentCounters(
    int avgAttendance,
    int totalStudents,
    int activeSessions,
  ) {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'DEPARTMENT STATUS SUMMARY',
            style: AppText.label(color: AppColors.gold),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildCounterItem(
                'AVG RATE',
                '$avgAttendance%',
                AppColors.success,
              ),
              Container(width: 1, height: 40, color: Colors.white12),
              _buildCounterItem('STUDENTS', '$totalStudents', AppColors.cyan),
              Container(width: 1, height: 40, color: Colors.white12),
              _buildCounterItem(
                'ACTIVE',
                '$activeSessions',
                AppColors.errorLight,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCounterItem(String label, String val, Color color) {
    return Column(
      children: [
        Text(
          val,
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: AppText.caption(color: Colors.white54)),
      ],
    );
  }
}
