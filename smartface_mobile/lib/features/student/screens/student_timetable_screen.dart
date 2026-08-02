import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/design_system/components/app_staggered_animations.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

class StudentTimetableScreen extends StatefulWidget {
  const StudentTimetableScreen({super.key});

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
    _tabController = TabController(length: _days.length, vsync: this);
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
      setState(() => _isLoading = false);
      return;
    }

    try {
      final slots = await ApiService.getTimetable(token);
      setState(() {
        _timetableSlots = slots;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching timetable: $e');
      setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getSlotsForDay(String day) {
    return _timetableSlots
        .where((s) => s['day'].toString().toLowerCase() == day.toLowerCase())
        .toList();
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
            'Class Timetable',
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white38,
            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
            tabs: _days.map((day) => Tab(text: day)).toList(),
          ),
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
              )
            : TabBarView(
                controller: _tabController,
                children: _days.map((day) {
                  final slots = _getSlotsForDay(day);
                  if (slots.isEmpty) {
                    return _buildEmptyState(day);
                  }
                  return _buildTimetableList(slots);
                }).toList(),
              ),
      ),
    );
  }

  Widget _buildEmptyState(String day) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.menu_book_outlined, color: Colors.white24, size: 64),
          const SizedBox(height: 16),
          Text(
            'No classes scheduled',
            style: GoogleFonts.inter(fontSize: 18, color: Colors.white54),
          ),
          Text(
            'Enjoy your day off on $day!',
            style: const TextStyle(color: Colors.white24, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildTimetableList(List<dynamic> slots) {
    return AnimationLimiter(
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        itemCount: slots.length,
        itemBuilder: (context, index) {
          final slot = slots[index];
          return StaggeredListItem(
            position: index,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: GlassCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.access_time,
                        color: AppColors.gold,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        slot['time'].toString().split(' ')[0],
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.gold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        slot['subject'] ?? 'Lecture Slot',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.room_outlined,
                            color: Colors.white38,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            slot['room'] ?? 'TBA',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white38,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  ),
);
}
}
