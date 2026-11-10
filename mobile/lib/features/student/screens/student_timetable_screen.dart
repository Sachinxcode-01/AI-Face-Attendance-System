/*
|--------------------------------------------------------------------------
| File: student_timetable_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the student academic lecture timetable strictly according to design.md:
| - StudentScreenShell with ethereal orbs & 28px card shell overlap
| - Brand Indigo palette (#3D4AB8, #4F46E5, #6366F1)
| - Dual-font system: Poppins (headings/tabs) + Inter (body/metadata)
| - Smooth tab switching with tactile haptics
| - Full light & dark theme parity
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/services/timetable_reminder_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';
import 'package:smartface_attendance/shared/widgets/smart_empty_state.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

class StudentTimetableScreen extends StatefulWidget {
  final String? initialDay;
  const StudentTimetableScreen({super.key, this.initialDay});

  @override
  State<StudentTimetableScreen> createState() => _StudentTimetableScreenState();
}

class _StudentTimetableScreenState extends State<StudentTimetableScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _timetableSlots = [];
  late TabController _tabController;

  final List<String> _days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  @override
  void initState() {
    super.initState();
    int initialIndex = 0;
    if (widget.initialDay != null && widget.initialDay!.isNotEmpty) {
      final idx = _days.indexWhere(
        (d) => d.toLowerCase() == widget.initialDay!.toLowerCase(),
      );
      if (idx != -1) initialIndex = idx;
    } else {
      final weekday = DateTime.now().weekday; // 1 = Mon, 5 = Fri
      if (weekday >= 1 && weekday <= 5) {
        initialIndex = weekday - 1;
      }
    }

    _tabController = TabController(
      length: _days.length,
      vsync: this,
      initialIndex: initialIndex,
    );
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        HapticFeedback.selectionClick();
      }
    });
    _loadTimetable();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTimetable() async {
    final session = context.read<SessionManager>();
    final token = session.token;
    if (token == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final slots = await ApiService.getTimetable(token);
      if (mounted) {
        setState(() {
          _timetableSlots = slots;
          _isLoading = false;
        });
        // Automatically schedule 10-minute pre-lecture reminders for today's classes
        TimetableReminderService.syncTodayReminders(slots);
      }
    } catch (e) {
      debugPrint('Error fetching timetable: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<dynamic> _getSlotsForDay(String day) {
    return _timetableSlots
        .where((s) => s['day'].toString().toLowerCase() == day.toLowerCase())
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final textHeading = isDark
        ? const Color(0xFFF1F3F9)
        : const Color(0xFF1A1A3A);

    return StudentScreenShell(
      title: 'Class Timetable',
      subtitle: 'Weekly lecture schedule & designated lecture rooms',
      onBackTap: () => Navigator.of(context).maybePop(),
      actions: [
        IconButton(
          icon: const Icon(
            Icons.notifications_active_outlined,
            color: Colors.white,
            size: 21,
          ),
          tooltip: 'Toggle 10-Min Class Reminders',
          onPressed: () async {
            HapticFeedback.mediumImpact();
            final current = await TimetableReminderService.isEnabled();
            await TimetableReminderService.setEnabled(!current);
            if (!current && _timetableSlots.isNotEmpty) {
              await TimetableReminderService.syncTodayReminders(
                _timetableSlots,
              );
            }
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  !current
                      ? '✓ 10-Minute Pre-Lecture Reminders Active'
                      : 'Class Reminders Muted',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                ),
                backgroundColor: !current
                    ? const Color(0xFF10B981)
                    : const Color(0xFF6B7280),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          },
        ),
        IconButton(
          icon: const Icon(
            Icons.info_outline_rounded,
            color: Colors.white,
            size: 22,
          ),
          tooltip: 'Schedule Info',
          onPressed: () {
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Displaying active semester lecture slots & rooms.',
                  style: GoogleFonts.inter(),
                ),
                backgroundColor: const Color(0xFF3D4AB8),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          },
        ),
      ],
      child: Column(
        children: [
          // ── Day Tab Selector ─────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: cardBg,
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF252E4A)
                      : const Color(0xFFE5E7F0),
                  width: 1.0,
                ),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              physics: const BouncingScrollPhysics(),
              tabAlignment: TabAlignment.start,
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              indicator: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.28),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              labelColor: Colors.white,
              unselectedLabelColor: isDark
                  ? const Color(0xFF7C82A0)
                  : const Color(0xFFA0A0B8),
              labelStyle: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              unselectedLabelStyle: GoogleFonts.poppins(
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
              padding: EdgeInsets.zero,
              labelPadding: const EdgeInsets.symmetric(horizontal: 14),
              tabs: _days.map((day) => Tab(text: day)).toList(),
            ),
          ),

          // ── Tab View Content ─────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const TimetableShimmer()
                : RefreshIndicator(
                    onRefresh: _loadTimetable,
                    color: const Color(0xFF6366F1),
                    child: TabBarView(
                      controller: _tabController,
                      children: _days.map((day) {
                        final slots = _getSlotsForDay(day);
                        if (slots.isEmpty) {
                          return _buildEmptyState(day, isDark);
                        }
                        return _buildTimetableList(slots, isDark, textHeading);
                      }).toList(),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String day, bool isDark) {
    return SmartEmptyState(
      title: 'No Classes Scheduled',
      subtitle:
          'Enjoy your open study day on $day! Review past notes or plan ahead.',
      lottieAsset: 'assets/lottie/empty.json',
      fallbackIcon: Icons.menu_book_rounded,
      animationSize: 170,
    );
  }

  Widget _buildTimetableList(
    List<dynamic> slots,
    bool isDark,
    Color textHeading,
  ) {
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark
        ? const Color(0xFF252E4A)
        : const Color(0xFFE5E7F0);
    final textLabel = isDark
        ? const Color(0xFF7C82A0)
        : const Color(0xFFA0A0B8);

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 120),
      itemCount: slots.length,
      itemBuilder: (context, index) {
        final slot = slots[index];
        final timeStr = (slot['time'] ?? '09:00 AM').toString();

        return Padding(
              padding: const EdgeInsets.only(bottom: 14.0),
              child: PressableScale(
                onTap: () => HapticFeedback.lightImpact(),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: cardBorder, width: 1.0),
                    boxShadow: [
                      BoxShadow(
                        color: isDark
                            ? Colors.black26
                            : const Color(0xFF8B98CE).withValues(alpha: 0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Time Pill
                      Container(
                        width: 72,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF4F46E5,
                              ).withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.access_time_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              timeStr.split(' ')[0],
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                height: 1.1,
                              ),
                            ),
                            if (timeStr.contains(' ')) ...[
                              Text(
                                timeStr.split(' ').length > 1
                                    ? timeStr.split(' ')[1]
                                    : '',
                                style: GoogleFonts.inter(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Slot Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              slot['subject'] ?? 'Lecture Slot',
                              style: GoogleFonts.poppins(
                                fontSize: 15.5,
                                fontWeight: FontWeight.w700,
                                color: textHeading,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: (isDark
                                        ? const Color(0xFF1A2340)
                                        : const Color(0xFFEEF2FF)),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.room_rounded,
                                        color: Color(0xFF4F46E5),
                                        size: 13,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        slot['room'] ?? 'Hall A',
                                        style: GoogleFonts.inter(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF4F46E5),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (slot['faculty'] != null ||
                                    slot['teacher'] != null) ...[
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Prof: ${slot['faculty'] ?? slot['teacher']}',
                                      style: GoogleFonts.inter(
                                        fontSize: 11.5,
                                        color: textLabel,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Status indicator
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF4F46E5),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
            )
            .animate()
            .fadeIn(
              delay: (index * 60).ms,
              duration: 320.ms,
              curve: Curves.easeOutCubic,
            )
            .slideY(
              begin: 0.1,
              end: 0,
              delay: (index * 60).ms,
              duration: 320.ms,
              curve: Curves.easeOutCubic,
            );
      },
    );
  }
}
