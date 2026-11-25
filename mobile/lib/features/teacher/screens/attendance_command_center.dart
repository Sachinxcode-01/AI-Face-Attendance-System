/*
|--------------------------------------------------------------------------
| File: attendance_command_center.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI - Modern Enterprise Classroom Operations
|
| Purpose:
| Executive Faculty & Department Attendance Mission Control.
| Conforms strictly to enterprise SaaS benchmarks (Stripe, Linear, Teams Admin):
| - Real-time WebSocket attendance feed (ArcFace AI & Rolling QR scans)
| - Active Session Telemetry & Quick Session Controls (Close Session, Broadcast Alert)
| - 1-Click Rapid Manual Marking Modal for impromptu physical roll-calls
| - Biometric Verification Mix Analytics (Face AI vs Dynamic QR vs Manual)
| - Two-Tier Compliance Risk Channels (<60% Critical, <75% Warning)
| - Immutable Faculty Audit Log Stream
| - Zero-compromise responsiveness (320px handheld to 1440px+ 4K Smartboards)
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/features/teacher/widgets/teacher_components.dart';
import 'package:smartface_attendance/features/teacher/controllers/teacher_controller.dart';
import 'package:smartface_attendance/features/teacher/models/teacher_models.dart';
import 'package:smartface_attendance/features/teacher/repositories/teacher_repository.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';

class AttendanceCommandCenter extends StatefulWidget {
  const AttendanceCommandCenter({super.key});

  @override
  State<AttendanceCommandCenter> createState() =>
      _AttendanceCommandCenterState();
}

class _AttendanceCommandCenterState extends State<AttendanceCommandCenter> {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _notifSubscription;

  bool _isInit = true;
  final TextEditingController _manualSearchCtrl = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      _isInit = false;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _initMissionControl();
        }
      });
    }
  }

  void _initMissionControl() {
    final session = context.read<SessionManager>();
    final teacherCtrl = context.read<TeacherController>();
    final token = session.token;
    final email = session.email;

    if (token != null && email != null) {
      teacherCtrl.loadDashboard(email, token);

      // Connect real-time WebSocket stream
      _notificationService.connect(token: token);
      _notifSubscription = _notificationService.stream.listen((data) {
        if (data['type'] == 'attendance_update' || data['type'] == 'checkin') {
          final activeSession = teacherCtrl.currentActiveSession;
          final eventSessionId = data['session_id']?.toString();
          if (activeSession != null &&
              eventSessionId != null &&
              eventSessionId != activeSession.id) {
            // Ignore events scoped to a different active session
            return;
          }
          HapticFeedback.lightImpact();
          teacherCtrl.onWebSocketCheckin(data);
        }
      });
    }
  }

  @override
  void dispose() {
    _manualSearchCtrl.dispose();
    _notifSubscription?.cancel();
    super.dispose();
  }

  Future<void> _refreshData() async {
    final session = context.read<SessionManager>();
    final teacherCtrl = context.read<TeacherController>();
    if (session.token != null && session.email != null) {
      await teacherCtrl.loadDashboard(session.email!, session.token!);
    }
  }

  void _openManualMarkingModal() {
    HapticFeedback.lightImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final teacherCtrl = context.read<TeacherController>();
    final session = context.read<SessionManager>();

    final activeSession = teacherCtrl.currentActiveSession;
    if (activeSession == null || !activeSession.isActive) {
      AppToast.show(
        context,
        message: 'No active session found for manual roll-call.',
        type: ToastType.warning,
      );
      return;
    }

    final capturedSessionId = activeSession.id;

    if (teacherCtrl.rosterStudents.isEmpty && session.token != null) {
      teacherCtrl.fetchRoster(session.token!, sessionId: capturedSessionId);
    }

    final Map<String, RosterStatus> localDraft = {};
    for (final s in teacherCtrl.rosterStudents) {
      localDraft[s.id] = s.status;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final query = _manualSearchCtrl.text.toLowerCase();
          final filtered = teacherCtrl.rosterStudents.where((s) {
            return query.isEmpty ||
                s.name.toLowerCase().contains(query) ||
                s.usn.toLowerCase().contains(query);
          }).toList();

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            padding: EdgeInsets.only(
              top: 20,
              left: 20,
              right: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              border: Border.all(
                color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Rapid Manual Verification',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.textHeading,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  'Make draft adjustments. Click commit to sync overrides to server.',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _manualSearchCtrl,
                  onChanged: (_) => setModalState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search by student name or USN...',
                    prefixIcon: const Icon(Icons.search_rounded, size: 18),
                    filled: true,
                    fillColor: isDark
                        ? const Color(0xFF1E293B)
                        : const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Expanded(
                  child: teacherCtrl.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : filtered.isEmpty
                      ? Center(
                          child: Text(
                            teacherCtrl.rosterStudents.isEmpty
                                ? 'No enrolled students found for session.'
                                : 'No matching students found.',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey,
                            ),
                          ),
                        )
                      : ListView.separated(
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (context, idx) {
                            final s = filtered[idx];
                            final effectiveStatus =
                                localDraft[s.id] ?? s.status;
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                s.name,
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              subtitle: Text(
                                '${s.usn} · Draft: ${effectiveStatus.label}',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.grey,
                                ),
                              ),
                              trailing: Wrap(
                                spacing: 6,
                                children: [
                                  _statusActionChip(
                                    'Present',
                                    AppColors.success,
                                    effectiveStatus == RosterStatus.present,
                                    () {
                                      setModalState(() {
                                        localDraft[s.id] = RosterStatus.present;
                                      });
                                    },
                                  ),
                                  _statusActionChip(
                                    'Late',
                                    AppColors.warning,
                                    effectiveStatus == RosterStatus.late,
                                    () {
                                      setModalState(() {
                                        localDraft[s.id] = RosterStatus.late;
                                      });
                                    },
                                  ),
                                  _statusActionChip(
                                    'Absent',
                                    AppColors.error,
                                    effectiveStatus == RosterStatus.absent,
                                    () {
                                      setModalState(() {
                                        localDraft[s.id] = RosterStatus.absent;
                                      });
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () async {
                      if (session.token != null) {
                        if (teacherCtrl.currentActiveSession?.id !=
                            capturedSessionId) {
                          AppToast.show(
                            context,
                            message:
                                'Session is no longer active. Commit rejected.',
                            type: ToastType.error,
                          );
                          return;
                        }

                        // Apply draft edits to controller
                        for (final entry in localDraft.entries) {
                          teacherCtrl.updateStudentStatus(
                            entry.key,
                            entry.value,
                          );
                        }

                        if (ctx.mounted &&
                            ModalRoute.of(ctx)?.isCurrent == true) {
                          Navigator.pop(ctx);
                        }

                        final ok = await teacherCtrl.saveRosterOverrides(
                          capturedSessionId,
                          session.token!,
                        );
                        if (!mounted || !context.mounted) return;
                        AppToast.show(
                          context,
                          message: ok
                              ? 'Attendance overrides synced with server.'
                              : 'Failed to sync with server. Check network.',
                          type: ok ? ToastType.success : ToastType.error,
                        );
                      }
                    },
                    child: Text(
                      'COMMIT OVERRIDES TO SERVER',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statusActionChip(
    String label,
    Color color,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : color,
          ),
        ),
      ),
    );
  }

  void _showBroadcastDialog() {
    final msgCtrl = TextEditingController();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final session = context.read<SessionManager>();
    final teacherCtrl = context.read<TeacherController>();

    final activeSession = teacherCtrl.currentActiveSession;
    if (activeSession == null || !activeSession.isActive) {
      AppToast.show(
        context,
        message: 'Broadcast requires an active classroom session.',
        type: ToastType.warning,
      );
      return;
    }
    final capturedSessionId = activeSession.id;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.campaign_rounded, color: AppColors.gold, size: 22),
            const SizedBox(width: 8),
            Text(
              'Broadcast Class Notice',
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.bold,
                fontSize: 17,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sends an urgent push alert to all students enrolled in the active session.',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: msgCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText:
                    'e.g., Pop quiz starts in 10 minutes. Please take your seats.',
                filled: true,
                fillColor: isDark
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () async {
              final text = msgCtrl.text.trim();
              if (text.isNotEmpty && session.token != null) {
                final repo = sl<TeacherRepository>();
                final ok = await repo.broadcastClassAnnouncement(
                  sessionId: capturedSessionId,
                  subject: 'Classroom Notice',
                  message: text,
                  token: session.token!,
                );
                if (ctx.mounted && ModalRoute.of(ctx)?.isCurrent == true) {
                  if (ok) {
                    Navigator.pop(ctx);
                  }
                }
                if (!mounted || !context.mounted) return;
                AppToast.show(
                  context,
                  message: ok
                      ? 'Class broadcast dispatched successfully.'
                      : 'Failed to dispatch broadcast. Please retry.',
                  type: ok ? ToastType.success : ToastType.error,
                );
              }
            },
            child: const Text(
              'DISPATCH',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isWide = screenWidth >= 850;
    final teacherCtrl = context.watch<TeacherController>();
    final session = context.read<SessionManager>();

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF070A14)
          : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
        title: Row(
          children: [
            const TeacherLivePulse(color: AppColors.cyan, size: 9),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Operations Mission Control',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    fontSize: 17,
                    color: isDark ? Colors.white : AppColors.textHeading,
                  ),
                ),
                Text(
                  'Live Attendance Telemetry & Session Controller',
                  style: GoogleFonts.inter(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.campaign_outlined, color: AppColors.gold),
            onPressed: _showBroadcastDialog,
            tooltip: 'Broadcast Announcement',
          ),
          IconButton(
            icon: const Icon(Icons.touch_app_outlined, color: AppColors.cyan),
            onPressed: _openManualMarkingModal,
            tooltip: 'Rapid Manual Roll Call',
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              HapticFeedback.lightImpact();
              _refreshData();
            },
            tooltip: 'Refresh Telemetry',
          ),
        ],
      ),
      body: teacherCtrl.isLoading && teacherCtrl.dashboardData.isEmpty
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : RefreshIndicator(
              onRefresh: _refreshData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: TeacherResponsiveBounds(
                  maxWidth: 1320,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Active Session Operations Bar
                      _buildActiveSessionController(
                        teacherCtrl,
                        session,
                        isDark,
                      ),

                      const SizedBox(height: 20),

                      // Top Telemetry Metrics
                      isWide
                          ? _buildWideMetricsRow(teacherCtrl, isDark)
                          : _buildMobileMetricsGrid(teacherCtrl, isDark),

                      const SizedBox(height: 24),

                      // Biometric Verification Mix Bar
                      _buildVerificationMixSection(teacherCtrl, isDark),

                      const SizedBox(height: 24),

                      // Live Check-in Stream Feed
                      _buildLiveCheckinFeed(teacherCtrl, isDark),

                      const SizedBox(height: 24),

                      // Two-Tier Compliance Risk Channels
                      isWide
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: _buildRiskCard(
                                    'CRITICAL ROSTER (<60%)',
                                    teacherCtrl.atRiskStudents
                                        .where((s) => s.attendance < 60)
                                        .toList(),
                                    AppColors.error,
                                    isDark,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildRiskCard(
                                    'WARNING ROSTER (60%-75%)',
                                    teacherCtrl.atRiskStudents
                                        .where(
                                          (s) =>
                                              s.attendance >= 60 &&
                                              s.attendance < 75,
                                        )
                                        .toList(),
                                    AppColors.warning,
                                    isDark,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                _buildRiskCard(
                                  'CRITICAL ROSTER (<60%)',
                                  teacherCtrl.atRiskStudents
                                      .where((s) => s.attendance < 60)
                                      .toList(),
                                  AppColors.error,
                                  isDark,
                                ),
                                const SizedBox(height: 16),
                                _buildRiskCard(
                                  'WARNING ROSTER (60%-75%)',
                                  teacherCtrl.atRiskStudents
                                      .where(
                                        (s) =>
                                            s.attendance >= 60 &&
                                            s.attendance < 75,
                                      )
                                      .toList(),
                                  AppColors.warning,
                                  isDark,
                                ),
                              ],
                            ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  // ── Active Session Operations Banner ───────────────────────────────────────
  Widget _buildActiveSessionController(
    TeacherController ctrl,
    SessionManager session,
    bool isDark,
  ) {
    final active = ctrl.currentActiveSession;
    final hasActive = active != null;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasActive
              ? AppColors.success.withValues(alpha: 0.4)
              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: hasActive ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    TeacherLivePulse(
                      color: hasActive ? AppColors.success : Colors.grey,
                      size: 8,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      hasActive
                          ? 'ACTIVE CLASSROOM SESSION'
                          : 'CLASSROOM SESSION IDLE',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                        color: hasActive ? AppColors.success : Colors.grey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  hasActive
                      ? active.subject
                      : 'No active lecture currently running',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textHeading,
                  ),
                ),
                Text(
                  hasActive
                      ? 'Room: ${active.room} · Session ID: ${active.id}'
                      : 'Launch Smartboard Projector or start session from timetable.',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isDark ? Colors.white60 : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Wrap(
            spacing: 8,
            children: [
              if (hasActive)
                ElevatedButton.icon(
                  onPressed: () async {
                    if (session.token != null) {
                      final ok = await ctrl.stopCurrentSession(session.token!);
                      if (mounted) {
                        AppToast.show(
                          context,
                          message: ok
                              ? 'Session concluded and locked on server.'
                              : 'Failed to end session on server. Please retry.',
                          type: ok ? ToastType.info : ToastType.error,
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.stop_rounded, size: 16),
                  label: const Text(
                    'END SESSION',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ElevatedButton.icon(
                onPressed: () => context.push(AppRoutes.teacherQrProjectorPath),
                icon: const Icon(Icons.cast_for_education_rounded, size: 16),
                label: Text(
                  hasActive ? 'VIEW PROJECTOR' : 'START PROJECTOR',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Metrics Strip ──────────────────────────────────────────────────────────
  Widget _buildWideMetricsRow(TeacherController ctrl, bool isDark) {
    final t = ctrl.telemetry;
    final totalAtRisk = ctrl.atRiskStudents.length;

    return Row(
      children: [
        Expanded(
          child: TeacherMetricCard(
            title: 'Attendance Rate',
            value: t.averageAttendance != null
                ? '${t.averageAttendance!.toStringAsFixed(1)}%'
                : 'N/A',
            trendText: t.averageAttendance != null
                ? (t.averageAttendance! >= 75 ? 'COMPLIANT' : 'SUB-OPTIMAL')
                : null,
            isTrendPositive:
                t.averageAttendance != null && t.averageAttendance! >= 75,
            subtitle: t.averageAttendance == null ? 'Awaiting telemetry' : null,
            icon: Icons.pie_chart_outline_rounded,
            accentColor: AppColors.success,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: TeacherMetricCard(
            title: 'Active Sessions',
            value: '${ctrl.activeSessions.length}',
            subtitle: 'Live faculty halls',
            icon: Icons.sensors_rounded,
            accentColor: AppColors.gold,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: TeacherMetricCard(
            title: 'Monitored Cohort',
            value: t.totalStudents != null ? '${t.totalStudents}' : 'N/A',
            subtitle: 'Across courses',
            icon: Icons.people_outline_rounded,
            accentColor: AppColors.cyan,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: TeacherMetricCard(
            title: 'Compliance Triage',
            value: '$totalAtRisk',
            subtitle: '$totalAtRisk Debarment Risks',
            icon: Icons.warning_amber_rounded,
            accentColor: AppColors.error,
            onTap: () => context.push(AppRoutes.teacherAtRiskRadarPath),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileMetricsGrid(TeacherController ctrl, bool isDark) {
    final t = ctrl.telemetry;
    final totalAtRisk = ctrl.atRiskStudents.length;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TeacherMetricCard(
                title: 'Attendance Rate',
                value: t.averageAttendance != null
                    ? '${t.averageAttendance!.toStringAsFixed(1)}%'
                    : 'N/A',
                trendText: t.averageAttendance != null
                    ? (t.averageAttendance! >= 75 ? 'COMPLIANT' : 'SUB-OPTIMAL')
                    : null,
                isTrendPositive:
                    t.averageAttendance != null && t.averageAttendance! >= 75,
                subtitle: t.averageAttendance == null
                    ? 'Awaiting telemetry'
                    : null,
                icon: Icons.pie_chart_outline_rounded,
                accentColor: AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TeacherMetricCard(
                title: 'Active Sessions',
                value: '${ctrl.activeSessions.length}',
                subtitle: 'Live classrooms',
                icon: Icons.sensors_rounded,
                accentColor: AppColors.gold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TeacherMetricCard(
                title: 'Monitored Cohort',
                value: t.totalStudents != null ? '${t.totalStudents}' : 'N/A',
                subtitle: 'Active students',
                icon: Icons.people_outline_rounded,
                accentColor: AppColors.cyan,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TeacherMetricCard(
                title: 'Compliance Triage',
                value: '$totalAtRisk',
                subtitle: 'Debarment risks',
                icon: Icons.warning_amber_rounded,
                accentColor: AppColors.error,
                onTap: () => context.push(AppRoutes.teacherAtRiskRadarPath),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Biometric Mix Section ──────────────────────────────────────────────────
  Widget _buildVerificationMixSection(TeacherController ctrl, bool isDark) {
    final t = ctrl.telemetry;
    final facePct = t.faceScansPct?.round();
    final qrPct = t.qrScansPct?.round();
    final manualPct = t.manualScansPct?.round();

    final hasData =
        (facePct != null && facePct > 0) ||
        (qrPct != null && qrPct > 0) ||
        (manualPct != null && manualPct > 0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'BIOMETRIC VERIFICATION CHANNEL MIX',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: isDark ? Colors.white70 : AppColors.textMuted,
                ),
              ),
              const TeacherStatusBadge(
                label: 'ArcFace ONNX Active',
                color: AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Stacked Progress Bar or Empty State
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              height: 12,
              child: hasData
                  ? Row(
                      children: [
                        if (facePct != null && facePct > 0)
                          Expanded(
                            flex: facePct,
                            child: Container(color: AppColors.primary),
                          ),
                        if (qrPct != null && qrPct > 0)
                          Expanded(
                            flex: qrPct,
                            child: Container(color: AppColors.gold),
                          ),
                        if (manualPct != null && manualPct > 0)
                          Expanded(
                            flex: manualPct,
                            child: Container(color: AppColors.cyan),
                          ),
                      ],
                    )
                  : Container(
                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                    ),
            ),
          ),
          const SizedBox(height: 14),

          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMixLegend(
                'ArcFace AI',
                facePct != null ? '$facePct%' : 'N/A',
                AppColors.primary,
              ),
              _buildMixLegend(
                'Dynamic QR',
                qrPct != null ? '$qrPct%' : 'N/A',
                AppColors.gold,
              ),
              _buildMixLegend(
                'Manual Override',
                manualPct != null ? '$manualPct%' : 'N/A',
                AppColors.cyan,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMixLegend(String label, String pct, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          '$label: ',
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
        ),
        Text(
          pct,
          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  // ── Live Checkin Feed ──────────────────────────────────────────────────────
  Widget _buildLiveCheckinFeed(TeacherController ctrl, bool isDark) {
    final list = ctrl.liveAttendees;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const TeacherLivePulse(color: AppColors.success, size: 8),
                  const SizedBox(width: 8),
                  Text(
                    'REAL-TIME ATTENDANCE FEED (WEBSOCKET)',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      color: isDark ? Colors.white70 : AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              Text(
                '${list.length} Recent Check-ins',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          if (list.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'Waiting for live student check-ins via QR or Face AI...',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: list.take(5).length,
              separatorBuilder: (_, _) => const Divider(height: 14),
              itemBuilder: (context, idx) {
                final item = list[idx];
                final isFace =
                    (item['method']?.toString().toLowerCase().contains(
                      'face',
                    ) ??
                    false);

                return Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: isFace
                          ? AppColors.primary.withValues(alpha: 0.15)
                          : AppColors.gold.withValues(alpha: 0.15),
                      child: Icon(
                        isFace ? Icons.face_rounded : Icons.qr_code_2_rounded,
                        size: 16,
                        color: isFace ? AppColors.primary : AppColors.gold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['name'] ?? 'Student',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            '${item['usn']} · ${item['method']}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          item['confidence'] ?? '100%',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                        Text(
                          item['time'] ?? 'Just now',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  // ── Risk Roster Card ───────────────────────────────────────────────────────
  Widget _buildRiskCard(
    String title,
    List<AtRiskStudent> students,
    Color color,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.1,
                  color: color,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${students.length} Students',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (students.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No students currently in this risk tier. Great compliance!',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
              ),
            )
          else
            ...students.take(4).map((st) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          st.name,
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '${st.usn} · Needs ${st.classesNeededFor75} classes',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${st.attendance.toStringAsFixed(1)}%',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: color,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
