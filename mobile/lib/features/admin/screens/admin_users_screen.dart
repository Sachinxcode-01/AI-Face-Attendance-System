import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/status_badge.dart';
import 'package:smartface_attendance/features/leave/screens/leave_review_screen.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';

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
  bool _usersLoading = true;
  String? _usersError;
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _faculty = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    if (!mounted) return;
    setState(() {
      _usersLoading = true;
      _usersError = null;
    });
    try {
      final token = context.read<SessionManager>().token;
      if (token == null || token.isEmpty) throw StateError('Missing session');

      final users = <Map<String, dynamic>>[];
      var page = 1;
      var total = 0;
      do {
        final response = await ApiService.getManagementUsers(token, page: page);
        final pageUsers = response['users'];
        if (pageUsers is! List) throw const FormatException();
        total =
            int.tryParse(response['total']?.toString() ?? '') ??
            pageUsers.length;
        users.addAll(
          pageUsers.whereType<Map>().map(
            (user) => Map<String, dynamic>.from(user),
          ),
        );
        if (pageUsers.isEmpty || users.length >= total) break;
        page++;
      } while (true);

      final students = <Map<String, dynamic>>[];
      final faculty = <Map<String, dynamic>>[];
      const facultyRoles = {
        'teacher',
        'faculty',
        'lecturer',
        'hod',
        'principal',
      };
      for (final user in users) {
        final role = (user['role'] ?? '').toString().toLowerCase();
        final email = (user['email'] ?? '').toString();
        final name = (user['full_name'] ?? user['name'] ?? email)
            .toString()
            .trim();
        final department = (user['department'] ?? '').toString().trim();
        final common = {
          'name': name.isEmpty ? 'Unknown user' : name,
          'email': email.isEmpty ? 'Email unavailable' : email,
          'dept': department.isEmpty ? '—' : department,
          'status': 'Registered',
        };
        if (role == 'student') {
          students.add({
            ...common,
            'attendance': 'Not available',
            'isRisk': false,
          });
        } else if (facultyRoles.contains(role)) {
          faculty.add({
            ...common,
            'role': (user['designation'] ?? role).toString(),
            'isOnLeave': false,
          });
        }
      }

      if (!mounted) return;
      setState(() {
        _students = students;
        _faculty = faculty;
        _usersLoading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _usersError = 'Unable to load users. Try again.';
          _usersLoading = false;
        });
      }
    }
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
    if (_usersLoading || _usersError != null) return _buildUsersState(isDark);

    final departments =
        _students
            .map((student) => student['dept'] as String)
            .where((department) => department != '—')
            .toSet()
            .toList()
          ..sort();
    departments.insert(0, 'All');
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
                  children: departments.map((dept) {
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
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 6,
                                        crossAxisAlignment:
                                            WrapCrossAlignment.center,
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
                                          Text(
                                            'Attendance: ${s['attendance']}',
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: s['isRisk']
                                                  ? AppColors.error
                                                  : AppColors.textMuted,
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
    if (_usersLoading || _usersError != null) return _buildUsersState(isDark);

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
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 6,
                                        crossAxisAlignment:
                                            WrapCrossAlignment.center,
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

  Widget _buildUsersState(bool isDark) {
    if (_usersLoading) {
      return const UserListShimmer();
    }
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _usersError!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white70 : AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loadUsers,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
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
