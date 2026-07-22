import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/shared/widgets/status_badge.dart';
import 'package:smartface_attendance/features/leave/screens/leave_review_screen.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _studentSearchController =
      TextEditingController();
  final TextEditingController _facultySearchController =
      TextEditingController();

  String _selectedStudentDept = 'All';
  String _studentSearchQuery = '';
  String _facultySearchQuery = '';

  final List<Map<String, dynamic>> _students = [
    {
      'name': 'Aarav Sharma',
      'email': 'aarav.sharma@institution.edu',
      'dept': 'CSE',
      'attendance': '94.2%',
      'status': 'Active',
      'isRisk': false,
    },
    {
      'name': 'Diya Patel',
      'email': 'diya.patel@institution.edu',
      'dept': 'CSE',
      'attendance': '68.5%',
      'status': 'Risk',
      'isRisk': true,
    },
    {
      'name': 'Ishaan Gupta',
      'email': 'ishaan.gupta@institution.edu',
      'dept': 'ECE',
      'attendance': '88.1%',
      'status': 'Active',
      'isRisk': false,
    },
    {
      'name': 'Meera Nair',
      'email': 'meera.nair@institution.edu',
      'dept': 'ME',
      'attendance': '71.0%',
      'status': 'Risk',
      'isRisk': true,
    },
    {
      'name': 'Rohan Verma',
      'email': 'rohan.verma@institution.edu',
      'dept': 'Civil',
      'attendance': '85.4%',
      'status': 'Active',
      'isRisk': false,
    },
    {
      'name': 'Ananya Sen',
      'email': 'ananya.sen@institution.edu',
      'dept': 'CSE',
      'attendance': '97.0%',
      'status': 'Active',
      'isRisk': false,
    },
  ];

  final List<Map<String, dynamic>> _faculty = [
    {
      'name': 'Dr. Ramesh Babu',
      'email': 'ramesh.babu@faculty.edu',
      'dept': 'CSE',
      'role': 'Professor',
      'status': 'Active',
      'isOnLeave': false,
    },
    {
      'name': 'Prof. Sneha Kulkarni',
      'email': 'sneha.kulkarni@faculty.edu',
      'dept': 'ECE',
      'role': 'HOD / Professor',
      'status': 'Active',
      'isOnLeave': false,
    },
    {
      'name': 'Dr. Anil Kumar',
      'email': 'anil.kumar@faculty.edu',
      'dept': 'ME',
      'role': 'Assistant Professor',
      'status': 'On Leave',
      'isOnLeave': true,
    },
    {
      'name': 'Prof. Priya Rao',
      'email': 'priya.rao@faculty.edu',
      'dept': 'Civil',
      'role': 'Associate Professor',
      'status': 'Active',
      'isOnLeave': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _studentSearchController.dispose();
    _facultySearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumBackground(
      immersive: false,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(
            'Users Console',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: 20,
              color: isDark ? Colors.white : AppColors.textHeading,
            ),
          ),
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: isDark ? Colors.white38 : AppColors.textMuted,
            labelStyle: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
            tabs: const [
              Tab(text: 'Students'),
              Tab(text: 'Faculty'),
              Tab(text: 'Approvals'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildStudentsTab(isDark),
            _buildFacultyTab(isDark),
            const LeaveReviewScreen(showAppBar: false),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentsTab(bool isDark) {
    final filtered = _students.where((s) {
      final matchesSearch =
          s['name'].toString().toLowerCase().contains(
            _studentSearchQuery.toLowerCase(),
          ) ||
          s['email'].toString().toLowerCase().contains(
            _studentSearchQuery.toLowerCase(),
          );
      final matchesDept =
          _selectedStudentDept == 'All' || s['dept'] == _selectedStudentDept;
      return matchesSearch && matchesDept;
    }).toList();

    return Column(
      children: [
        // Search & Filter Row
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            children: [
              PremiumTextField(
                controller: _studentSearchController,
                label: 'Search Students',
                hint: 'Search by name or email...',
                prefixIcon: Icons.search_rounded,
                onChanged: (val) {
                  setState(() {
                    _studentSearchQuery = val;
                  });
                },
              ),
              const SizedBox(height: 10),
              // Department Filters ChoiceChips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: ['All', 'CSE', 'ECE', 'ME', 'Civil'].map((dept) {
                    final isSelected = _selectedStudentDept == dept;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(dept),
                        selected: isSelected,
                        selectedColor: AppColors.primary.withValues(
                          alpha: 0.15,
                        ),
                        labelStyle: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? Colors.white54 : AppColors.textMuted),
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedStudentDept = dept;
                            });
                          }
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
        // Student List
        Expanded(
          child: filtered.isEmpty
              ? _buildEmptyState(
                  'No students found matching your search query.',
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final s = filtered[index];
                    return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: GlassCard(
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary.withValues(
                                    alpha: 0.1,
                                  ),
                                  child: Text(
                                    s['name'][0],
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        s['name'],
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: isDark
                                              ? Colors.white
                                              : AppColors.textHeading,
                                        ),
                                      ),
                                      Text(
                                        s['email'],
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: isDark
                                              ? Colors.white54
                                              : AppColors.textMuted,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: isDark
                                                  ? Colors.white10
                                                  : AppColors.surfaceLight,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              s['dept'],
                                              style: GoogleFonts.robotoMono(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Text(
                                            'Attendance: ${s['attendance']}',
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: s['isRisk']
                                                  ? AppColors.error
                                                  : AppColors.success,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                StatusBadge(
                                  label: s['status'],
                                  color: s['isRisk']
                                      ? AppColors.error
                                      : AppColors.success,
                                ),
                              ],
                            ),
                          ),
                        )
                        .animate(delay: (index * 60).ms)
                        .fadeIn()
                        .slideY(begin: 0.1, end: 0);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFacultyTab(bool isDark) {
    final filtered = _faculty.where((f) {
      return f['name'].toString().toLowerCase().contains(
            _facultySearchQuery.toLowerCase(),
          ) ||
          f['email'].toString().toLowerCase().contains(
            _facultySearchQuery.toLowerCase(),
          ) ||
          f['role'].toString().toLowerCase().contains(
            _facultySearchQuery.toLowerCase(),
          );
    }).toList();

    return Column(
      children: [
        // Search Row
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: PremiumTextField(
            controller: _facultySearchController,
            label: 'Search Faculty',
            hint: 'Search by name, department, or role...',
            prefixIcon: Icons.search_rounded,
            onChanged: (val) {
              setState(() {
                _facultySearchQuery = val;
              });
            },
          ),
        ),
        // Faculty List
        Expanded(
          child: filtered.isEmpty
              ? _buildEmptyState('No faculty members found.')
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final f = filtered[index];
                    return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: GlassCard(
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.gold.withValues(
                                    alpha: 0.1,
                                  ),
                                  child: Text(
                                    f['name'][0],
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.gold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        f['name'],
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: isDark
                                              ? Colors.white
                                              : AppColors.textHeading,
                                        ),
                                      ),
                                      Text(
                                        f['email'],
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: isDark
                                              ? Colors.white54
                                              : AppColors.textMuted,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: isDark
                                                  ? Colors.white10
                                                  : AppColors.surfaceLight,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              f['dept'],
                                              style: GoogleFonts.robotoMono(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Text(
                                            f['role'],
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              color: isDark
                                                  ? Colors.white38
                                                  : AppColors.textMuted,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                StatusBadge(
                                  label: f['status'],
                                  color: f['isOnLeave']
                                      ? AppColors.warning
                                      : AppColors.success,
                                ),
                              ],
                            ),
                          ),
                        )
                        .animate(delay: (index * 60).ms)
                        .fadeIn()
                        .slideY(begin: 0.1, end: 0);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String text) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.people_outline_rounded,
              color: Colors.white24,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              text,
              style: GoogleFonts.inter(color: Colors.white38, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
