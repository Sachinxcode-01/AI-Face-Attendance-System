/*
|--------------------------------------------------------------------------
| File: teacher_roster_override_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Live Classroom Student Roster & Manual Override Terminal conforming
| strictly to design.md:
| - StudentScreenShell with ethereal orbs & 28px card shell overlap
| - Brand Indigo palette (#3D4AB8, #4F46E5, #6366F1)
| - Dual-font system: Poppins (headings/names) + Inter (labels/toggles)
| - 1-Click status toggle: Present (Green), Late (Amber), Absent (Red), Excused (Blue)
| - Batch Save & Sync to central database
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/teacher/controllers/teacher_controller.dart';
import 'package:smartface_attendance/features/teacher/models/teacher_models.dart';
import 'package:smartface_attendance/features/teacher/widgets/teacher_components.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

enum StudentStatus { present, late, absent, excused }

class RosterStudentItem {
  final String id;
  final String name;
  final String usn;
  StudentStatus status;
  final String? time;

  RosterStudentItem({
    required this.id,
    required this.name,
    required this.usn,
    this.status = StudentStatus.absent,
    this.time,
  });
}

class TeacherRosterOverrideScreen extends StatefulWidget {
  const TeacherRosterOverrideScreen({super.key});

  @override
  State<TeacherRosterOverrideScreen> createState() =>
      _TeacherRosterOverrideScreenState();
}

class _TeacherRosterOverrideScreenState
    extends State<TeacherRosterOverrideScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _hasLoadedRealRoster = false;
  String? _loadedSessionId;
  String _search = '';
  List<RosterStudentItem> _students = [];

  @override
  void initState() {
    super.initState();
    _fetchRoster();
  }

  Future<void> _fetchRoster() async {
    final session = context.read<SessionManager>();
    final teacherCtrl = context.read<TeacherController>();
    final token = session.token;
    final active = teacherCtrl.currentActiveSession;

    if (token != null && active != null) {
      try {
        final targetSessionId = active.id;
        await teacherCtrl.fetchRoster(token, sessionId: targetSessionId);

        if (mounted &&
            !teacherCtrl.rosterFetchFailed &&
            teacherCtrl.rosterSessionId == targetSessionId) {
          final mapped = teacherCtrl.rosterStudents.map((s) {
            StudentStatus st;
            switch (s.status) {
              case RosterStatus.present:
                st = StudentStatus.present;
                break;
              case RosterStatus.late:
                st = StudentStatus.late;
                break;
              case RosterStatus.excused:
                st = StudentStatus.excused;
                break;
              case RosterStatus.absent:
                st = StudentStatus.absent;
                break;
            }
            return RosterStudentItem(
              id: s.id,
              name: s.name,
              usn: s.usn,
              status: st,
              time: s.verificationTime,
            );
          }).toList();

          setState(() {
            _students = mapped;
            _hasLoadedRealRoster = mapped.isNotEmpty;
            _loadedSessionId = mapped.isNotEmpty ? targetSessionId : null;
            _isLoading = false;
          });
          return;
        }
      } catch (e) {
        debugPrint('[RosterOverride] fetch error: $e');
      }
    }

    if (mounted) {
      setState(() {
        _students = [];
        _hasLoadedRealRoster = false;
        _loadedSessionId = null;
        _isLoading = false;
      });
    }
  }

  void _markAll(StudentStatus status) {
    HapticFeedback.mediumImpact();
    setState(() {
      for (final s in _students) {
        s.status = status;
      }
    });

    final name = status.name.toUpperCase();
    AppToast.show(
      context,
      message: 'All students marked as $name',
      type: ToastType.info,
    );
  }

  Future<void> _saveAndSync() async {
    final session = context.read<SessionManager>();
    if (session.token == null) {
      AppToast.show(
        context,
        message: 'Authentication required. Please sign in.',
        type: ToastType.error,
      );
      return;
    }

    if (!_hasLoadedRealRoster || _loadedSessionId == null || _students.isEmpty) {
      AppToast.show(
        context,
        message: 'No verified session roster loaded. Cannot sync overrides.',
        type: ToastType.warning,
      );
      return;
    }

    HapticFeedback.heavyImpact();
    setState(() => _isSaving = true);

    final records = _students
        .map(
          (s) => {
            'student_id': s.id,
            'usn': s.usn,
            'status': s.status.name.toUpperCase(),
            'verified_by': 'Manual Faculty Override',
          },
        )
        .toList();

    bool ok = false;
    try {
      ok = await ApiService.batchUpdateRoster(
        _loadedSessionId!,
        records,
        session.token,
      );
    } catch (e) {
      debugPrint('[RosterOverride] save error: $e');
      ok = false;
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }

    if (!mounted) return;
    AppToast.show(
      context,
      message: ok
          ? 'Roster overrides committed & synced to server.'
          : 'Failed to sync overrides with server. Please retry.',
      type: ok ? ToastType.success : ToastType.error,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = _students.where((s) {
      return _search.isEmpty ||
          s.name.toLowerCase().contains(_search.toLowerCase()) ||
          s.usn.toLowerCase().contains(_search.toLowerCase());
    }).toList();

    final presentCount = _students
        .where((s) => s.status == StudentStatus.present)
        .length;
    final absentCount = _students
        .where((s) => s.status == StudentStatus.absent)
        .length;
    final lateCount = _students
        .where((s) => s.status == StudentStatus.late)
        .length;

    return TeacherScreenShell(
      title: 'Roster Override',
      subtitle: 'Classroom Manual Attendance Terminal',
      onBackTap: () => Navigator.of(context).maybePop(),
      actions: [
        IconButton(
          tooltip: 'Sync with Server',
          icon: _isSaving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Icon(Icons.cloud_upload_rounded, color: Colors.white),
          onPressed: (_isSaving || !_hasLoadedRealRoster || _loadedSessionId == null || _students.isEmpty) ? null : _saveAndSync,
        ),
      ],
      child: _isLoading
          ? const UserListShimmer()
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: TeacherResponsiveBounds(
                maxWidth: 1100,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── 1. Attendance HUD Summary ────────────────────────────
                    Row(
                      children: [
                        Expanded(
                          child: _buildHudCounter(
                            'Present',
                            '$presentCount',
                            const Color(0xFF10B981),
                            isDark,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildHudCounter(
                            'Late',
                            '$lateCount',
                            const Color(0xFFF59E0B),
                            isDark,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildHudCounter(
                            'Absent',
                            '$absentCount',
                            const Color(0xFFEF4444),
                            isDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // ── 2. Search & Batch Actions Toolbar ────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF131A33) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF252E4A)
                              : const Color(0xFFE5E7F0),
                        ),
                      ),
                      child: TextField(
                        onChanged: (v) => setState(() => _search = v),
                        style: GoogleFonts.inter(
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF1A1A3A),
                          fontSize: 13,
                        ),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          icon: const Icon(
                            Icons.search_rounded,
                            color: Color(0xFF6366F1),
                            size: 18,
                          ),
                          hintText: 'Filter roster by name or USN...',
                          hintStyle: GoogleFonts.inter(
                            color: isDark
                                ? Colors.white38
                                : const Color(0xFF9CA3AF),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Batch toggle row
                    Row(
                      children: [
                        Expanded(
                          child: PressableScale(
                            onTap: () => _markAll(StudentStatus.present),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFF10B981,
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: const Color(0xFF10B981),
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  'Mark All Present',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF10B981),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: PressableScale(
                            onTap: () => _markAll(StudentStatus.absent),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFEF4444,
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: const Color(0xFFEF4444),
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  'Reset to Absent',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFFEF4444),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── 3. Student List ──────────────────────────────────────
                    ...filtered.map((s) => _buildRosterCard(s, isDark)),
                    const SizedBox(height: 36),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHudCounter(
    String label,
    String value,
    Color color,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white60 : const Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRosterCard(RosterStudentItem student, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(
                  0xFF4F46E5,
                ).withValues(alpha: 0.15),
                child: Text(
                  student.name[0],
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF4F46E5),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.name,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF1A1A3A),
                      ),
                    ),
                    Text(
                      '${student.usn} ${student.time != null ? '• ${student.time}' : ''}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: isDark
                            ? Colors.white60
                            : const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 4 Status Pill Buttons
          Row(
            children: [
              _buildStatusPill(
                student,
                StudentStatus.present,
                'Present',
                const Color(0xFF10B981),
              ),
              const SizedBox(width: 6),
              _buildStatusPill(
                student,
                StudentStatus.late,
                'Late',
                const Color(0xFFF59E0B),
              ),
              const SizedBox(width: 6),
              _buildStatusPill(
                student,
                StudentStatus.absent,
                'Absent',
                const Color(0xFFEF4444),
              ),
              const SizedBox(width: 6),
              _buildStatusPill(
                student,
                StudentStatus.excused,
                'Excused',
                const Color(0xFF3B82F6),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(
    RosterStudentItem student,
    StudentStatus status,
    String label,
    Color color,
  ) {
    final isSelected = student.status == status;

    return Expanded(
      child: PressableScale(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => student.status = status);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? color : color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? color : color.withValues(alpha: 0.3),
              width: 1.0,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : color,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
