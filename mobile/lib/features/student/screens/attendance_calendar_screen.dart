import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/ui_system/app_ui_package_registry.dart';

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
      setState(() => _isLoading = false);
      return;
    }

    try {
      final data = await ApiService.getCalendarEvents(token);
      setState(() {
        _leaves = data['leaves'] ?? [];
        _holidays = data['holidays'] ?? [];
        _attendance = data['attendance'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching calendar events: $e');
      setState(() => _isLoading = false);
    }
  }

  bool _isHoliday(DateTime day) {
    return _holidays.any((h) {
      final hDate = DateTime.parse(h['start_date']);
      return isSameDay(hDate, day);
    });
  }

  bool _isLeave(DateTime day) {
    return _leaves.any((l) {
      final start = DateTime.parse(l['start_date']);
      final end = DateTime.parse(l['end_date']);
      return l['status'].toString().toLowerCase() == 'approved' &&
          (day.isAfter(start.subtract(const Duration(days: 1))) &&
              day.isBefore(end.add(const Duration(days: 1))));
    });
  }

  bool _isPresent(DateTime day) {
    return _attendance.any((a) {
      final aDate = DateTime.parse(a['start_date']);
      return isSameDay(aDate, day) && a['status'] == 'Present';
    });
  }

  List<dynamic> _getEventsForDay(DateTime day) {
    final events = [];

    // Check leaves
    final dayLeaves = _leaves.where((l) {
      final start = DateTime.parse(l['start_date']);
      final end = DateTime.parse(l['end_date']);
      return day.isAfter(start.subtract(const Duration(days: 1))) &&
          day.isBefore(end.add(const Duration(days: 1)));
    });
    events.addAll(dayLeaves);

    // Check holidays
    final dayHols = _holidays.where((h) {
      final hDate = DateTime.parse(h['start_date']);
      return isSameDay(hDate, day);
    });
    events.addAll(dayHols);

    // Check attendance
    final dayAtt = _attendance.where((a) {
      final aDate = DateTime.parse(a['start_date']);
      return isSameDay(aDate, day);
    });
    events.addAll(dayAtt);

    return events;
  }

  @override
  Widget build(BuildContext context) {
    return PremiumScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(
            'Attendance Calendar',
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
              )
            : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassCard(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 12,
                        ),
                        child: TableCalendar(
                          firstDay: DateTime.now().subtract(
                            const Duration(days: 365),
                          ),
                          lastDay: DateTime.now().add(
                            const Duration(days: 365),
                          ),
                          focusedDay: _focusedDay,
                          calendarFormat: _calendarFormat,
                          selectedDayPredicate: (day) {
                            return isSameDay(_selectedDay, day);
                          },
                          onDaySelected: (selectedDay, focusedDay) {
                            setState(() {
                              _selectedDay = selectedDay;
                              _focusedDay = focusedDay;
                            });
                          },
                          onFormatChanged: (format) {
                            setState(() {
                              _calendarFormat = format;
                            });
                          },
                          onPageChanged: (focusedDay) {
                            _focusedDay = focusedDay;
                          },
                          eventLoader: _getEventsForDay,
                          calendarStyle: CalendarStyle(
                            defaultTextStyle: const TextStyle(
                              color: Colors.white,
                            ),
                            weekendTextStyle: const TextStyle(
                              color: Colors.white60,
                            ),
                            todayDecoration: BoxDecoration(
                              color: AppColors.indigo.withValues(alpha: 0.3),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.indigo,
                                width: 1.5,
                              ),
                            ),
                            selectedDecoration: const BoxDecoration(
                              color: AppColors.gold,
                              shape: BoxShape.circle,
                            ),
                            selectedTextStyle: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                            ),
                            markersMaxCount: 3,
                          ),
                          headerStyle: HeaderStyle(
                            titleTextStyle: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            formatButtonTextStyle: GoogleFonts.inter(
                              color: AppColors.gold,
                              fontWeight: FontWeight.bold,
                            ),
                            formatButtonDecoration: BoxDecoration(
                              border: Border.all(
                                color: AppColors.gold.withValues(alpha: 0.5),
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            leftChevronIcon: const Icon(
                              Icons.chevron_left,
                              color: Colors.white,
                            ),
                            rightChevronIcon: const Icon(
                              Icons.chevron_right,
                              color: Colors.white,
                            ),
                          ),
                          calendarBuilders: CalendarBuilders(
                            prioritizedBuilder: (context, day, focusedDay) {
                              if (_isPresent(day)) {
                                return Container(
                                  margin: const EdgeInsets.all(4),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.greenAccent,
                                      width: 1.5,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Text(
                                    '${day.day}',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                );
                              }
                              if (_isLeave(day)) {
                                return Container(
                                  margin: const EdgeInsets.all(4),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: Colors.amber.withValues(alpha: 0.2),
                                    border: Border.all(
                                      color: Colors.amber,
                                      width: 1.5,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Text(
                                    '${day.day}',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                );
                              }
                              if (_isHoliday(day)) {
                                return Container(
                                  margin: const EdgeInsets.all(4),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: Colors.purple.withValues(
                                      alpha: 0.25,
                                    ),
                                    border: Border.all(
                                      color: Colors.purpleAccent,
                                      width: 1.5,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Text(
                                    '${day.day}',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                );
                              }
                              return null;
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildLegend(),
                      const SizedBox(height: 20),
                      _buildSelectedDayEvents(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildLegend() {
    return GlassCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildLegendItem('Present', Colors.greenAccent),
          _buildLegendItem('Leave', Colors.amber),
          _buildLegendItem('Holiday', Colors.purpleAccent),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            border: Border.all(color: color, width: 1.5),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildSelectedDayEvents() {
    final events = _getEventsForDay(_selectedDay ?? DateTime.now());
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Events for ${_selectedDay?.day}/${_selectedDay?.month}/${_selectedDay?.year}',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 10),
        if (events.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24.0),
            child: Center(
              child: AppLottieState(
                assetPath: 'assets/animations/lottie/empty.json',
                width: 110,
                height: 110,
                fallbackIcon: Icons.calendar_today_outlined,
                message: 'No events scheduled for this day.',
              ),
            ),
          )
        else
          ...events.map((e) {
            String title = e['title'] ?? e['subject'] ?? 'Academic Event';
            String subtitle = e['description'] ?? e['status'] ?? '';
            Color badgeColor = Colors.blueAccent;

            if (e['type'] == 'leave') {
              badgeColor = Colors.amber;
            } else if (e['type'] == 'holiday') {
              badgeColor = Colors.purpleAccent;
            } else if (e['type'] == 'attendance') {
              badgeColor = Colors.greenAccent;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: GlassCard(
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      e['type'] == 'leave'
                          ? Icons.time_to_leave
                          : e['type'] == 'holiday'
                          ? Icons.beach_access
                          : Icons.check,
                      color: badgeColor,
                    ),
                  ),
                  title: Text(
                    title,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    subtitle,
                    style: GoogleFonts.inter(color: Colors.white38),
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }
}
