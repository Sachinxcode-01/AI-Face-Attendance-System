/*
|--------------------------------------------------------------------------
| File: attendance_calendar_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the student academic calendar strictly adhering to design.md:
| - StudentScreenShell with ethereal orbs & 28px card shell overlap
| - Brand Indigo palette (#3D4AB8, #4F46E5, #6366F1)
| - Dual-font system: Poppins (headings) + Inter (body/calendar numbers)
| - Interactive day selection with tactile haptics & event badges
| - Full light & dark theme parity
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

class AttendanceCalendarScreen extends StatefulWidget {
  const AttendanceCalendarScreen({super.key});

  @override
  State<AttendanceCalendarScreen> createState() =>
      _AttendanceCalendarScreenState();
}

class _AttendanceCalendarScreenState extends State<AttendanceCalendarScreen> {
  CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  bool _isLoading = true;
  List<dynamic> _leaves = [];
  List<dynamic> _holidays = [];
  List<dynamic> _attendance = [];

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _loadCalendarData();
  }

  Future<void> _loadCalendarData() async {
    final session = context.read<SessionManager>();
    final token = session.token;
    if (token == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final data = await ApiService.getCalendarEvents(token);
      if (mounted) {
        setState(() {
          _leaves = data['leaves'] ?? [];
          _holidays = data['holidays'] ?? [];
          _attendance = data['attendance'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching calendar events: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  bool _isHoliday(DateTime day) {
    return _holidays.any((h) {
      final dateStr = h['start_date'] ?? h['date'];
      if (dateStr == null) return false;
      final hDate = DateTime.tryParse(dateStr.toString());
      return hDate != null && isSameDay(hDate, day);
    });
  }

  bool _isLeave(DateTime day) {
    return _leaves.any((l) {
      final startStr = l['start_date'] ?? l['date'];
      final endStr = l['end_date'] ?? startStr;
      if (startStr == null) return false;
      final start = DateTime.tryParse(startStr.toString());
      final end = DateTime.tryParse(endStr.toString());
      if (start == null || end == null) return false;
      return l['status'].toString().toLowerCase() == 'approved' &&
          (day.isAfter(start.subtract(const Duration(days: 1))) &&
              day.isBefore(end.add(const Duration(days: 1))));
    });
  }

  bool _isPresent(DateTime day) {
    return _attendance.any((a) {
      final dateStr = a['start_date'] ?? a['date'];
      if (dateStr == null) return false;
      final aDate = DateTime.tryParse(dateStr.toString());
      final status = (a['status'] ?? '').toString().toLowerCase();
      return aDate != null && isSameDay(aDate, day) && status == 'present';
    });
  }

  List<dynamic> _getEventsForDay(DateTime day) {
    final events = [];

    // Check leaves
    final dayLeaves = _leaves.where((l) {
      final startStr = l['start_date'] ?? l['date'];
      final endStr = l['end_date'] ?? startStr;
      if (startStr == null) return false;
      final start = DateTime.tryParse(startStr.toString());
      final end = DateTime.tryParse(endStr.toString());
      if (start == null || end == null) return false;
      return day.isAfter(start.subtract(const Duration(days: 1))) &&
          day.isBefore(end.add(const Duration(days: 1)));
    });
    events.addAll(dayLeaves);

    // Check holidays
    final dayHols = _holidays.where((h) {
      final dateStr = h['start_date'] ?? h['date'];
      if (dateStr == null) return false;
      final hDate = DateTime.tryParse(dateStr.toString());
      return hDate != null && isSameDay(hDate, day);
    });
    events.addAll(dayHols);

    // Check attendance
    final dayAtt = _attendance.where((a) {
      final dateStr = a['start_date'] ?? a['date'];
      if (dateStr == null) return false;
      final aDate = DateTime.tryParse(dateStr.toString());
      return aDate != null && isSameDay(aDate, day);
    });
    events.addAll(dayAtt);

    return events;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);

    return StudentScreenShell(
      title: 'Academic Calendar',
      subtitle: 'Official holidays, approved leaves & marked attendance',
      onBackTap: () => Navigator.of(context).maybePop(),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
          tooltip: 'Refresh Calendar',
          onPressed: () {
            HapticFeedback.lightImpact();
            _loadCalendarData();
          },
        ),
      ],
      child: _isLoading
          ? const AttendanceCalendarShimmer()
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── 1. Interactive Calendar Card ─────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: cardBorder, width: 1.0),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
                          blurRadius: 30,
                          offset: const Offset(0, -5),
                        ),
                      ],
                    ),
                    child: TableCalendar(
                      firstDay: DateTime.now().subtract(const Duration(days: 365)),
                      lastDay: DateTime.now().add(const Duration(days: 365)),
                      focusedDay: _focusedDay,
                      calendarFormat: _calendarFormat,
                      startingDayOfWeek: StartingDayOfWeek.monday,
                      selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                      onDaySelected: (selectedDay, focusedDay) {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedDay = selectedDay;
                          _focusedDay = focusedDay;
                        });
                      },
                      onFormatChanged: (format) {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _calendarFormat = format;
                        });
                      },
                      onPageChanged: (focusedDay) {
                        _focusedDay = focusedDay;
                      },
                      eventLoader: _getEventsForDay,
                      headerStyle: HeaderStyle(
                        titleCentered: false,
                        titleTextStyle: GoogleFonts.poppins(
                          color: textHeading,
                          fontSize: 16.5,
                          fontWeight: FontWeight.w700,
                        ),
                        formatButtonTextStyle: GoogleFonts.poppins(
                          color: const Color(0xFF4F46E5),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                        formatButtonDecoration: BoxDecoration(
                          color: (isDark ? const Color(0xFF1A2340) : const Color(0xFFEEF2FF)),
                          border: Border.all(
                            color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        leftChevronIcon: const Icon(
                          Icons.chevron_left_rounded,
                          color: Color(0xFF4F46E5),
                          size: 26,
                        ),
                        rightChevronIcon: const Icon(
                          Icons.chevron_right_rounded,
                          color: Color(0xFF4F46E5),
                          size: 26,
                        ),
                        headerPadding: const EdgeInsets.only(bottom: 14),
                      ),
                      daysOfWeekStyle: DaysOfWeekStyle(
                        weekdayStyle: GoogleFonts.inter(
                          color: textLabel,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                        weekendStyle: GoogleFonts.inter(
                          color: textLabel.withValues(alpha: 0.7),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      calendarStyle: CalendarStyle(
                        defaultTextStyle: GoogleFonts.inter(
                          color: textHeading,
                          fontWeight: FontWeight.w500,
                          fontSize: 13.5,
                        ),
                        weekendTextStyle: GoogleFonts.inter(
                          color: textLabel,
                          fontWeight: FontWeight.w500,
                          fontSize: 13.5,
                        ),
                        outsideTextStyle: GoogleFonts.inter(
                          color: textLabel.withValues(alpha: 0.35),
                          fontSize: 13,
                        ),
                        todayDecoration: BoxDecoration(
                          border: Border.all(
                            color: const Color(0xFF4F46E5),
                            width: 2,
                          ),
                          shape: BoxShape.circle,
                        ),
                        todayTextStyle: GoogleFonts.inter(
                          color: const Color(0xFF4F46E5),
                          fontWeight: FontWeight.w700,
                          fontSize: 13.5,
                        ),
                        selectedDecoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        selectedTextStyle: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                        markersMaxCount: 3,
                      ),
                      calendarBuilders: CalendarBuilders(
                        prioritizedBuilder: (context, day, focusedDay) {
                          final isSel = isSameDay(_selectedDay, day);
                          if (isSel) return null; // let default selectedDecoration render

                          if (_isPresent(day)) {
                            return Container(
                              margin: const EdgeInsets.all(4),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.14),
                                border: Border.all(
                                  color: const Color(0xFF10B981),
                                  width: 1.5,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${day.day}',
                                style: GoogleFonts.inter(
                                  color: textHeading,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            );
                          }
                          if (_isLeave(day)) {
                            return Container(
                              margin: const EdgeInsets.all(4),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B).withValues(alpha: 0.14),
                                border: Border.all(
                                  color: const Color(0xFFF59E0B),
                                  width: 1.5,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${day.day}',
                                style: GoogleFonts.inter(
                                  color: textHeading,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            );
                          }
                          if (_isHoliday(day)) {
                            return Container(
                              margin: const EdgeInsets.all(4),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: const Color(0xFF8B5CF6).withValues(alpha: 0.14),
                                border: Border.all(
                                  color: const Color(0xFF8B5CF6),
                                  width: 1.5,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${day.day}',
                                style: GoogleFonts.inter(
                                  color: textHeading,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            );
                          }
                          return null;
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // ── 2. Legend Card ───────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: cardBorder, width: 1.0),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black26 : const Color(0xFF8B98CE).withValues(alpha: 0.10),
                          blurRadius: 18,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildLegendItem('Present', const Color(0xFF10B981), isDark),
                        _buildLegendItem('Leave', const Color(0xFFF59E0B), isDark),
                        _buildLegendItem('Holiday', const Color(0xFF8B5CF6), isDark),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── 3. Selected Day Events ───────────────────────────────
                  _buildSelectedDayEvents(isDark, cardBg, cardBorder, textHeading),
                ],
              ),
            ),
    );
  }

  Widget _buildLegendItem(String label, Color color, bool isDark) {
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            border: Border.all(color: color, width: 2),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: GoogleFonts.inter(
            color: textBody,
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildSelectedDayEvents(
    bool isDark,
    Color cardBg,
    Color cardBorder,
    Color textHeading,
  ) {
    final events = _getEventsForDay(_selectedDay ?? DateTime.now());
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);

    final selDay = _selectedDay ?? DateTime.now();
    final dayStr = '${selDay.day}/${selDay.month}/${selDay.year}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.event_note_rounded, size: 16, color: Color(0xFF4F46E5)),
            const SizedBox(width: 8),
            Text(
              'EVENTS FOR $dayStr',
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
                color: const Color(0xFF4F46E5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (events.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: cardBorder, width: 1.0),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.event_available_rounded,
                    size: 40,
                    color: textLabel.withValues(alpha: 0.6),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'No special events or leaves for this day.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: textLabel,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...events.asMap().entries.map((entry) {
            final e = entry.value;
            final index = entry.key;
            String title = e['title'] ?? e['subject'] ?? 'Academic Event';
            String subtitle = e['description'] ?? e['status'] ?? '';
            Color badgeColor = const Color(0xFF4F46E5);
            IconData icon = Icons.check_circle_outline_rounded;

            if (e['type'] == 'leave') {
              badgeColor = const Color(0xFFF59E0B);
              icon = Icons.event_busy_rounded;
            } else if (e['type'] == 'holiday') {
              badgeColor = const Color(0xFF8B5CF6);
              icon = Icons.celebration_rounded;
            } else if (e['type'] == 'attendance') {
              badgeColor = const Color(0xFF10B981);
              icon = Icons.verified_rounded;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 10.0),
              child: PressableScale(
                onTap: () => HapticFeedback.lightImpact(),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: cardBorder, width: 1.0),
                    boxShadow: [
                      BoxShadow(
                        color: isDark ? Colors.black26 : const Color(0xFF8B98CE).withValues(alpha: 0.10),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: badgeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(icon, color: badgeColor, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: GoogleFonts.poppins(
                                color: textHeading,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            if (subtitle.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                subtitle,
                                style: GoogleFonts.inter(
                                  color: textBody,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
                .animate()
                .fadeIn(delay: (index * 60).ms, duration: 300.ms, curve: Curves.easeOutCubic)
                .slideY(begin: 0.08, end: 0, delay: (index * 60).ms, duration: 300.ms);
          }),
      ],
    );
  }
}
