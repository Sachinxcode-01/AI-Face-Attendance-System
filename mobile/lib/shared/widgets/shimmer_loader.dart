/*
|--------------------------------------------------------------------------
| File: shimmer_loader.dart
|--------------------------------------------------------------------------
| Project: SmartFace Attendance & Nexa AI
|
| Purpose:
| Screen-specific, high-fidelity skeleton loading animations matching
| the exact layout, geometry, and component hierarchy of every application screen.
|
| Responsibilities:
| - Provides reusable animatable ShimmerBox and ShimmerCircle primitives.
| - Implements screen-accurate skeleton layouts matching design.md:
|   * StudentHomeShimmer (Header, Score Ring, Quick Actions, Trends, Activity)
|   * TeacherDashboardShimmer (Active Session, Rosters, Metrics, Actions)
|   * TimetableShimmer (Day Tabs, Time Slots, Class Cards, Faculty Chips)
|   * AttendanceCalendarShimmer (Month Grid, Day Tiles, Stats, Day Agenda)
|   * AttendanceHubShimmer (Health Telemetry, Simulator Banner, Logs)
|   * BunkCalculatorShimmer (Goal Selector, Simulator HUD, Sliders, Subjects)
|   * StudentIdCardShimmer (Holographic Credential Badge, Barcode, Controls)
|   * StudentProfileShimmer (Avatar, Name, Stats Row, ID Tile, Biometrics)
|   * LeaveDashboardShimmer (Leave Quotas, Overview, Apply Button, History)
|   * LeaveListShimmer (Filters, Leave Cards with Status Pills & Dates)
|   * AttendanceLogsShimmer (Filter Chips, Log Cards with Status Pills)
|   * AtRiskRosterShimmer (Thresholds, Radar HUD, Student Risk Cards)
|   * CommandCenterShimmer (Department Counters, Live Monitor, Risk Rosters)
|   * AiAnalyticsShimmer (AI Metric Cards, Predictive Panel, Optimizer, Trends)
|   * TeacherStatsShimmer (Metrics, 7-Day Trend, Section Comparisons)
|   * AdminDashboardShimmer (Server Status, Metrics Grid, Diagnostics, Actions)
|   * SecurityLogsShimmer (CCTV Snapshot Cards, Severity Badges, Timestamps)
|   * UserListShimmer (Role Tabs, Search Bar, User Rows)
|   * ManagementDashboardShimmer (Responsive Metrics Grid, Analytics)
| - Synchronizes light/dark color filters matching the system theme settings.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

// ======================================================
// Base Primitives: ShimmerBox & ShimmerCircle
// ======================================================

/// Generic Shimmer Box Skeleton
///
/// Draws a rounded box with flashing animation colors corresponding to active
/// dark/light mode context following the SmartFace design.md specification.
class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  final BoxShape shape;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.radius = AppRadius.md,
    this.shape = BoxShape.rectangle,
  });

  const ShimmerBox.circle({super.key, required double size})
    : width = size,
      height = size,
      radius = 0,
      shape = BoxShape.circle;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Design.md aligned color hierarchy
    final Color baseColor = isDark
        ? const Color(0xFF141D38) // Deep Card / Surface dark base
        : const Color(0xFFE2E8F0); // Slate 200

    final Color highlightColor = isDark
        ? const Color(0xFF263259) // Lighter glow highlight
        : const Color(0xFFF8FAFF); // Ultra light surface glow

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      period: const Duration(milliseconds: 1300),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: shape,
          borderRadius: shape == BoxShape.circle
              ? null
              : BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

// ======================================================
// 1. Student Home Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentHomeScreen:
/// Header (avatar + name), Attendance Score Card (gauge + rank),
/// Quick Action Buttons row, AI Insights, Trend Chart, and Recent Activity.
class StudentHomeShimmer extends StatelessWidget {
  const StudentHomeShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isTablet = w >= 600;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.symmetric(
        horizontal: isTablet ? 28 : 20,
        vertical: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Welcome Header (Greeting + Avatar + Icon)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ShimmerBox(width: 130, height: 14, radius: 4),
                  const SizedBox(height: 8),
                  ShimmerBox(width: w * 0.45, height: 24, radius: 6),
                ],
              ),
              const Row(
                children: [
                  ShimmerBox(width: 40, height: 40, radius: 12),
                  SizedBox(width: 10),
                  ShimmerBox.circle(size: 48),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 2. Attendance Score Hero Card (Circular gauge + stats)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Row(
              children: [
                const ShimmerBox.circle(size: 96),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const ShimmerBox(width: 90, height: 20, radius: 10),
                      const SizedBox(height: 10),
                      ShimmerBox(width: w * 0.35, height: 16, radius: 4),
                      const SizedBox(height: 8),
                      const ShimmerBox(width: 120, height: 14, radius: 4),
                      const SizedBox(height: 12),
                      const ShimmerBox(width: 80, height: 24, radius: 12),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // 3. Quick Action Buttons Row (5 circular/squircle buttons)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(5, (i) {
              return const Column(
                children: [
                  ShimmerBox(width: 54, height: 54, radius: 18),
                  SizedBox(height: 8),
                  ShimmerBox(width: 46, height: 10, radius: 4),
                ],
              );
            }),
          ),
          const SizedBox(height: 26),

          // 4. AI Insights Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 140, height: 16, radius: 4),
                    ShimmerBox(width: 70, height: 20, radius: 10),
                  ],
                ),
                const SizedBox(height: 14),
                ShimmerBox(width: w * 0.8, height: 12, radius: 4),
                const SizedBox(height: 8),
                ShimmerBox(width: w * 0.6, height: 12, radius: 4),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 5. Weekly Trend Chart Card Placeholder
          const ShimmerBox(width: double.infinity, height: 180, radius: 20),
          const SizedBox(height: 24),

          // 6. Recent Activity List
          const ShimmerBox(width: 130, height: 14, radius: 4),
          const SizedBox(height: 12),
          for (int i = 0; i < 3; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const ShimmerBox(width: 44, height: 44, radius: 12),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerBox(width: w * 0.45, height: 14, radius: 4),
                        const SizedBox(height: 6),
                        ShimmerBox(width: w * 0.3, height: 11, radius: 4),
                      ],
                    ),
                  ),
                  const ShimmerBox(width: 60, height: 22, radius: 11),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 2. Timetable Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentTimetableScreen:
/// Day selector tab bar, followed by timetable lecture/lab slot cards
/// with time column, subject title, teacher info, and room pills.
class TimetableShimmer extends StatelessWidget {
  const TimetableShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Day Selector Tabs (Mon, Tue, Wed, Thu, Fri, Sat)
          Row(
            children: List.generate(
              6,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 5 ? 8 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 38,
                    radius: 12,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 2. Timetable Slot Cards
          for (int i = 0; i < 4; i++) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF141D38).withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF252E4A)
                      : const Color(0xFFE5E7F0),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Time Column
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const ShimmerBox(width: 58, height: 14, radius: 4),
                      const SizedBox(height: 6),
                      Container(width: 2, height: 36, color: Colors.white12),
                      const SizedBox(height: 6),
                      const ShimmerBox(width: 58, height: 14, radius: 4),
                    ],
                  ),
                  const SizedBox(width: 16),

                  // Subject Details & Faculty
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            ShimmerBox(width: w * 0.4, height: 16, radius: 4),
                            const ShimmerBox(width: 50, height: 20, radius: 8),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Row(
                          children: [
                            ShimmerBox.circle(size: 26),
                            SizedBox(width: 8),
                            ShimmerBox(width: 100, height: 12, radius: 4),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            ShimmerBox(width: 65, height: 22, radius: 8),
                            SizedBox(width: 8),
                            ShimmerBox(width: 80, height: 22, radius: 8),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 3. Attendance Calendar Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AttendanceCalendarScreen:
/// Month header & navigation, 7-column calendar monthly grid of date circles,
/// month stats summary chips, and selected day agenda cards.
class AttendanceCalendarShimmer extends StatelessWidget {
  const AttendanceCalendarShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Calendar Container Shell
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Column(
              children: [
                // Month Header (Month name + arrows)
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 32, height: 32, radius: 8),
                    ShimmerBox(width: 140, height: 20, radius: 6),
                    ShimmerBox(width: 32, height: 32, radius: 8),
                  ],
                ),
                const SizedBox(height: 18),

                // Days of week header (M, T, W, T, F, S, S)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(
                    7,
                    (i) => const ShimmerBox(width: 24, height: 12, radius: 4),
                  ),
                ),
                const SizedBox(height: 16),

                // 5 Rows of Calendar Date Circles
                for (int row = 0; row < 5; row++) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: List.generate(
                        7,
                        (col) => const ShimmerBox.circle(size: 36),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Month Overview Stats Row (Present, Absent, Holiday, Leave)
          Row(
            children: List.generate(
              4,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 56,
                    radius: 16,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 3. Selected Day Schedule Cards
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(width: 120, height: 14, radius: 4),
                SizedBox(height: 14),
                Row(
                  children: [
                    ShimmerBox(width: 44, height: 44, radius: 12),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerBox(width: 150, height: 14, radius: 4),
                          SizedBox(height: 6),
                          ShimmerBox(width: 100, height: 11, radius: 4),
                        ],
                      ),
                    ),
                    ShimmerBox(width: 64, height: 22, radius: 10),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ======================================================
// 4. Attendance Hub Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AttendanceHubScreen:
/// Health score card, Smart Bunk Calculator banner, telemetry filters, and logs.
class AttendanceHubShimmer extends StatelessWidget {
  const AttendanceHubShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Health Score Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const ShimmerBox.circle(size: 80),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const ShimmerBox(width: 90, height: 20, radius: 10),
                          const SizedBox(height: 10),
                          ShimmerBox(width: w * 0.4, height: 16, radius: 4),
                          const SizedBox(height: 8),
                          const ShimmerBox(width: 110, height: 12, radius: 4),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: Colors.white12),
                const SizedBox(height: 14),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    ShimmerBox(width: 70, height: 32, radius: 8),
                    ShimmerBox(width: 70, height: 32, radius: 8),
                    ShimmerBox(width: 70, height: 32, radius: 8),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 2. Bunk & Target Calculator Banner
          const ShimmerBox(width: double.infinity, height: 86, radius: 24),
          const SizedBox(height: 22),

          // 3. Filter Chips Row
          const Row(
            children: [
              ShimmerBox(width: 60, height: 32, radius: 16),
              SizedBox(width: 10),
              ShimmerBox(width: 80, height: 32, radius: 16),
              SizedBox(width: 10),
              ShimmerBox(width: 75, height: 32, radius: 16),
            ],
          ),
          const SizedBox(height: 18),

          // 4. Attendance Verification Logs
          for (int i = 0; i < 4; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF141D38).withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    const ShimmerBox(width: 44, height: 44, radius: 12),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerBox(width: w * 0.45, height: 14, radius: 4),
                          const SizedBox(height: 6),
                          ShimmerBox(width: w * 0.3, height: 11, radius: 4),
                        ],
                      ),
                    ),
                    const ShimmerBox(width: 64, height: 22, radius: 11),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 5. Smart Bunk Calculator Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentBunkCalculatorScreen:
/// Target Goal selector pills, Master HUD with circular gauge,
/// interactive simulation slider card, and subject breakdown cards.
class BunkCalculatorShimmer extends StatelessWidget {
  const BunkCalculatorShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Target Goal Selector Chips
          const ShimmerBox(width: 130, height: 12, radius: 4),
          const SizedBox(height: 10),
          Row(
            children: List.generate(
              4,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 3 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 42,
                    radius: 14,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),

          // 2. Master Status & Simulator HUD Card
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: const Column(
              children: [
                Center(child: ShimmerBox.circle(size: 110)),
                SizedBox(height: 18),
                ShimmerBox(width: 160, height: 26, radius: 13),
                SizedBox(height: 12),
                ShimmerBox(width: 200, height: 12, radius: 4),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 3. Interactive Simulation Sliders Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(width: 140, height: 14, radius: 4),
                SizedBox(height: 16),
                ShimmerBox(width: double.infinity, height: 10, radius: 5),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 80, height: 12, radius: 4),
                    ShimmerBox(width: 80, height: 12, radius: 4),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // 4. Subject Breakdown List
          const ShimmerBox(width: 150, height: 14, radius: 4),
          const SizedBox(height: 14),
          for (int i = 0; i < 3; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF141D38).withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        ShimmerBox(width: 130, height: 14, radius: 4),
                        ShimmerBox(width: 50, height: 18, radius: 8),
                      ],
                    ),
                    SizedBox(height: 10),
                    ShimmerBox(
                      width: double.infinity,
                      height: 8,
                      radius: 4,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 6. Student ID Card Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentIdCardScreen:
/// Digital holographic ID credential card (institution banner, photo, roll no,
/// barcode / QR placeholder, and action buttons).
class StudentIdCardShimmer extends StatelessWidget {
  const StudentIdCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        children: [
          // Holographic ID Card Shell
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.6)
                  : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Column(
              children: [
                // Institution Header
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 44, height: 44, radius: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        ShimmerBox(width: 120, height: 14, radius: 4),
                        SizedBox(height: 6),
                        ShimmerBox(width: 80, height: 10, radius: 4),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Student Photo & Chip
                const Center(
                  child: ShimmerBox(width: 110, height: 110, radius: 22),
                ),
                const SizedBox(height: 18),

                // Name & Academic Department
                const Center(
                  child: ShimmerBox(width: 180, height: 22, radius: 6),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: ShimmerBox(width: 130, height: 14, radius: 4),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: ShimmerBox(width: 90, height: 20, radius: 10),
                ),
                const SizedBox(height: 24),

                // Barcode / QR Code Frame
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Column(
                    children: [
                      ShimmerBox(width: double.infinity, height: 42, radius: 4),
                      SizedBox(height: 6),
                      ShimmerBox(width: 120, height: 10, radius: 2),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Flip & Export Action Buttons
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ShimmerBox(width: 130, height: 44, radius: 14),
              SizedBox(width: 16),
              ShimmerBox(width: 130, height: 44, radius: 14),
            ],
          ),
        ],
      ),
    );
  }
}

// ======================================================
// 7. Teacher Dashboard Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching TeacherDashboardScreen:
/// Teacher greeting, Active class hero session card, Quick stats row,
/// and Today's schedule cards.
class TeacherDashboardShimmer extends StatelessWidget {
  const TeacherDashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Teacher Greeting Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ShimmerBox(width: 120, height: 14, radius: 4),
                  const SizedBox(height: 8),
                  ShimmerBox(width: w * 0.45, height: 22, radius: 6),
                ],
              ),
              const Row(
                children: [
                  ShimmerBox(width: 38, height: 38, radius: 10),
                  SizedBox(width: 10),
                  ShimmerBox.circle(size: 46),
                ],
              ),
            ],
          ),
          const SizedBox(height: 22),

          // 2. Active Session Hero Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerBox(width: 90, height: 22, radius: 11),
                    ShimmerBox(width: 70, height: 18, radius: 6),
                  ],
                ),
                const SizedBox(height: 14),
                ShimmerBox(width: w * 0.6, height: 22, radius: 6),
                const SizedBox(height: 8),
                ShimmerBox(width: w * 0.4, height: 14, radius: 4),
                const SizedBox(height: 20),
                const ShimmerBox(
                  width: double.infinity,
                  height: 48,
                  radius: 14,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // 3. Quick Stats Row (3 Metric Cards)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 88,
                    radius: 18,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 26),

          // 4. Today's Teaching Schedule List
          const ShimmerBox(width: 150, height: 14, radius: 4),
          const SizedBox(height: 14),
          for (int i = 0; i < 3; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF141D38).withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    const ShimmerBox(width: 46, height: 46, radius: 14),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerBox(width: w * 0.45, height: 14, radius: 4),
                          const SizedBox(height: 6),
                          ShimmerBox(width: w * 0.3, height: 11, radius: 4),
                        ],
                      ),
                    ),
                    const ShimmerBox(width: 60, height: 24, radius: 12),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 8. Student Profile & Profile Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentProfileScreen & ProfileScreen:
/// Large circular avatar with edit overlay, Student Name & Branch badge,
/// 3-stat metric cards row, Digital ID launcher tile, Biometrics card,
/// and academic information rows.
class StudentProfileShimmer extends StatelessWidget {
  const StudentProfileShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 1. Large Circular Avatar with edit badge
          const Stack(
            alignment: Alignment.bottomRight,
            children: [
              ShimmerBox.circle(size: 110),
              Positioned(
                bottom: 0,
                right: 0,
                child: ShimmerBox.circle(size: 34),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // 2. Name & Role Badge
          const ShimmerBox(width: 190, height: 24, radius: 6),
          const SizedBox(height: 8),
          const ShimmerBox(width: 130, height: 22, radius: 11),
          const SizedBox(height: 24),

          // 3. Quick Stats Row (Attendance Rate, Attended, Leave Days)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 84,
                    radius: 16,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 4. Digital ID Card Launch Tile
          const ShimmerBox(width: double.infinity, height: 74, radius: 18),
          const SizedBox(height: 18),

          // 5. Biometric Face ID Status Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              children: [
                ShimmerBox(width: 44, height: 44, radius: 12),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShimmerBox(width: 140, height: 14, radius: 4),
                      SizedBox(height: 6),
                      ShimmerBox(width: 100, height: 11, radius: 4),
                    ],
                  ),
                ),
                ShimmerBox(width: 70, height: 24, radius: 12),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 6. Academic Profile Information Form / Cards
          for (int i = 0; i < 4; i++) ...[
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: ShimmerBox(
                width: double.infinity,
                height: 56,
                radius: 14,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// Backward-compatible alias
typedef ProfileShimmer = StudentProfileShimmer;

// ======================================================
// 9. Leave Dashboard Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching StudentLeaveDashboardScreen:
/// Welcome header, Leave balances grid (Sick, Casual, Academic),
/// Overview status row (Pending, Approved, Rejected), Apply Leave button,
/// and Recent requests list.
class LeaveDashboardShimmer extends StatelessWidget {
  const LeaveDashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header
          const ShimmerBox(width: 140, height: 14, radius: 4),
          const SizedBox(height: 8),
          const ShimmerBox(width: 220, height: 22, radius: 6),
          const SizedBox(height: 22),

          // 2. Balances Grid (3 cards)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 105,
                    radius: 20,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 3. Overview Section (Pending, Approved, Rejected)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 70,
                    radius: 16,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 26),

          // 4. Action Buttons (Apply Leave)
          const ShimmerBox(width: double.infinity, height: 50, radius: 14),
          const SizedBox(height: 26),

          // 5. Recent Requests List
          const ShimmerBox(width: 150, height: 14, radius: 4),
          const SizedBox(height: 14),
          for (int i = 0; i < 3; i++) ...[
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: ShimmerBox(
                width: double.infinity,
                height: 80,
                radius: 18,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 10. Leave History & Parent Leave Status Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching LeaveHistoryScreen & ParentLeaveStatusScreen:
/// Search & filter tabs bar, followed by leave application cards with
/// status pill badges, date ranges, and reason lines.
class LeaveListShimmer extends StatelessWidget {
  const LeaveListShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search & Filter Tabs
          const ShimmerBox(width: double.infinity, height: 48, radius: 14),
          const SizedBox(height: 14),
          const Row(
            children: [
              ShimmerBox(width: 60, height: 32, radius: 16),
              SizedBox(width: 8),
              ShimmerBox(width: 80, height: 32, radius: 16),
              SizedBox(width: 8),
              ShimmerBox(width: 80, height: 32, radius: 16),
              SizedBox(width: 8),
              ShimmerBox(width: 80, height: 32, radius: 16),
            ],
          ),
          const SizedBox(height: 20),

          // Leave Cards
          for (int i = 0; i < 4; i++) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF141D38).withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF252E4A)
                      : const Color(0xFFE5E7F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShimmerBox(width: 100, height: 22, radius: 11),
                      ShimmerBox(width: 75, height: 22, radius: 11),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Row(
                    children: [
                      ShimmerBox(width: 18, height: 18, radius: 4),
                      SizedBox(width: 8),
                      ShimmerBox(width: 140, height: 12, radius: 4),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ShimmerBox(width: w * 0.7, height: 12, radius: 4),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 11. Parent Attendance Logs Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching ParentAttendanceLogsScreen:
/// Ward selector / filter tabs, and attendance log cards with status pills.
class AttendanceLogsShimmer extends StatelessWidget {
  const AttendanceLogsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter Chips Row
          const Row(
            children: [
              ShimmerBox(width: 55, height: 32, radius: 16),
              SizedBox(width: 10),
              ShimmerBox(width: 75, height: 32, radius: 16),
              SizedBox(width: 10),
              ShimmerBox(width: 75, height: 32, radius: 16),
              SizedBox(width: 10),
              ShimmerBox(width: 65, height: 32, radius: 16),
            ],
          ),
          const SizedBox(height: 18),

          // Attendance Log Cards
          for (int i = 0; i < 5; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF141D38).withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    const ShimmerBox(width: 44, height: 44, radius: 12),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerBox(width: w * 0.45, height: 14, radius: 4),
                          const SizedBox(height: 6),
                          ShimmerBox(width: w * 0.3, height: 11, radius: 4),
                        ],
                      ),
                    ),
                    const ShimmerBox(width: 65, height: 24, radius: 12),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 12. Parent Dashboard Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching ParentDashboardScreen:
/// Parent greeting, Ward selector pill, Ward attendance overview card,
/// Quick action cards, and Today's check-in timeline.
class ParentDashboardShimmer extends StatelessWidget {
  const ParentDashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting & Notifications
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ShimmerBox(width: 120, height: 14, radius: 4),
                  const SizedBox(height: 8),
                  ShimmerBox(width: w * 0.45, height: 22, radius: 6),
                ],
              ),
              const ShimmerBox.circle(size: 46),
            ],
          ),
          const SizedBox(height: 22),

          // Ward Selector Chip / Dropdown
          const ShimmerBox(width: 180, height: 38, radius: 19),
          const SizedBox(height: 18),

          // Ward Attendance Progress Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF141D38).withValues(alpha: 0.5)
                  : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF252E4A)
                    : const Color(0xFFE5E7F0),
              ),
            ),
            child: Row(
              children: [
                const ShimmerBox.circle(size: 90),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const ShimmerBox(width: 100, height: 18, radius: 9),
                      const SizedBox(height: 10),
                      ShimmerBox(width: w * 0.35, height: 14, radius: 4),
                      const SizedBox(height: 8),
                      const ShimmerBox(width: 120, height: 12, radius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Quick Action Cards (Request Leave, View Logs)
          const Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 80,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 80,
                  radius: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 26),

          // Recent Check-in Activity
          const ShimmerBox(width: 150, height: 14, radius: 4),
          const SizedBox(height: 14),
          for (int i = 0; i < 3; i++) ...[
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: ShimmerBox(
                width: double.infinity,
                height: 64,
                radius: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 13. At-Risk Student Roster Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching TeacherAtRiskScreen:
/// Severity threshold filter tabs, search bar, Radar summary HUD,
/// and at-risk student cards with attendance gauges and warning buttons.
class AtRiskRosterShimmer extends StatelessWidget {
  const AtRiskRosterShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Severity Threshold Filter Tabs
          Row(
            children: List.generate(
              4,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 38,
                    radius: 12,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 2. Search Field
          const ShimmerBox(width: double.infinity, height: 48, radius: 14),
          const SizedBox(height: 18),

          // 3. Radar Summary HUD (3 cards)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 84,
                    radius: 16,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),

          // 4. Student Risk Roster List
          const ShimmerBox(width: 160, height: 14, radius: 4),
          const SizedBox(height: 14),
          for (int i = 0; i < 4; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF141D38).withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  children: [
                    ShimmerBox.circle(size: 44),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerBox(width: 140, height: 14, radius: 4),
                          SizedBox(height: 6),
                          ShimmerBox(width: 90, height: 11, radius: 4),
                        ],
                      ),
                    ),
                    ShimmerBox(width: 50, height: 24, radius: 12),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 14. Attendance Command Center Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AttendanceCommandCenter:
/// Department overview counters, live active camera feed monitor,
/// and risk channels student lists.
class CommandCenterShimmer extends StatelessWidget {
  const CommandCenterShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Department Overview Counters (3 large metric cards)
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 96,
                    radius: 20,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),

          // Live Camera / Session Monitor
          const ShimmerBox(width: double.infinity, height: 190, radius: 24),
          const SizedBox(height: 24),

          // Compliance Risk Channels
          const ShimmerBox(width: 180, height: 14, radius: 4),
          const SizedBox(height: 14),
          const ShimmerBox(width: double.infinity, height: 130, radius: 20),
          const SizedBox(height: 16),
          const ShimmerBox(width: double.infinity, height: 130, radius: 20),
        ],
      ),
    );
  }
}

// ======================================================
// 15. AI Analytics Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AiAnalyticsScreen:
/// Metric cards, Predictive Exam Risk panel, Timetable Absenteeism Optimizer,
/// Campus trend chart, and department comparison bars.
class AiAnalyticsShimmer extends StatelessWidget {
  const AiAnalyticsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      physics: NeverScrollableScrollPhysics(),
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Metric Cards (4 cards, 2x2 grid)
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 90,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 90,
                  radius: 18,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 90,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 90,
                  radius: 18,
                ),
              ),
            ],
          ),
          SizedBox(height: 24),

          // Predictive Exam Ineligibility AI Panel
          ShimmerBox(width: 220, height: 12, radius: 4),
          SizedBox(height: 12),
          ShimmerBox(width: double.infinity, height: 140, radius: 20),
          SizedBox(height: 26),

          // Timetable Absenteeism Optimizer
          ShimmerBox(width: 200, height: 12, radius: 4),
          SizedBox(height: 12),
          ShimmerBox(width: double.infinity, height: 130, radius: 20),
          SizedBox(height: 26),

          // Campus Daily Trend Chart
          ShimmerBox(width: 180, height: 12, radius: 4),
          SizedBox(height: 12),
          ShimmerBox(width: double.infinity, height: 200, radius: 20),
          SizedBox(height: 26),

          // Department Comparison
          ShimmerBox(width: 190, height: 12, radius: 4),
          SizedBox(height: 12),
          ShimmerBox(width: double.infinity, height: 170, radius: 20),
        ],
      ),
    );
  }
}

// ======================================================
// 16. Teacher Stats Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching TeacherStatsScreen:
/// Overview metrics, 7-day attendance trend chart, section performance chart,
/// and student rosters list.
class TeacherStatsShimmer extends StatelessWidget {
  const TeacherStatsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overview Metrics Row
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                  child: const ShimmerBox(
                    width: double.infinity,
                    height: 90,
                    radius: 18,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 7-Day Trend Chart
          const ShimmerBox(width: 160, height: 12, radius: 4),
          const SizedBox(height: 12),
          const ShimmerBox(width: double.infinity, height: 190, radius: 20),
          const SizedBox(height: 26),

          // Section Performance Comparisons
          const ShimmerBox(width: 210, height: 12, radius: 4),
          const SizedBox(height: 12),
          const ShimmerBox(width: double.infinity, height: 180, radius: 20),
          const SizedBox(height: 26),

          // Student Rosters
          const ShimmerBox(width: 140, height: 12, radius: 4),
          const SizedBox(height: 12),
          for (int i = 0; i < 3; i++) ...[
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: ShimmerBox(
                width: double.infinity,
                height: 64,
                radius: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 17. Admin Dashboard Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AdminHomeScreen:
/// Institution Command Centre welcome header, 4-stat metrics grid,
/// Server Diagnostics card, and quick admin action tiles.
class AdminDashboardShimmer extends StatelessWidget {
  const AdminDashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      physics: NeverScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Header
          ShimmerBox(width: 160, height: 12, radius: 4),
          SizedBox(height: 8),
          ShimmerBox(width: 230, height: 24, radius: 6),
          SizedBox(height: 24),

          // System Metrics Grid (4 cards, 2x2)
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 100,
                  radius: 20,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 100,
                  radius: 20,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 100,
                  radius: 20,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 100,
                  radius: 20,
                ),
              ),
            ],
          ),
          SizedBox(height: 24),

          // Server Diagnostics & Status Card
          ShimmerBox(width: double.infinity, height: 130, radius: 22),
          SizedBox(height: 24),

          // Quick Action Tiles
          ShimmerBox(width: 130, height: 14, radius: 4),
          SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 86,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 86,
                  radius: 18,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 86,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 86,
                  radius: 18,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Backward-compatible alias
typedef DashboardShimmer = AdminDashboardShimmer;

// ======================================================
// 18. Security Logs & Sentinel Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching SecurityLogsScreen & AdminIntruderSentinelScreen:
/// Security health banner, Intruder CCTV log cards with snapshot thumbnail,
/// location, timestamp, and severity badges.
class SecurityLogsShimmer extends StatelessWidget {
  const SecurityLogsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Security Status Banner
          const ShimmerBox(width: double.infinity, height: 68, radius: 18),
          const SizedBox(height: 20),

          // CCTV Intruder Log Cards
          for (int i = 0; i < 3; i++) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 18),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF141D38).withValues(alpha: 0.5)
                    : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF252E4A)
                      : const Color(0xFFE5E7F0),
                ),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShimmerBox(width: 140, height: 16, radius: 4),
                      ShimmerBox(width: 80, height: 22, radius: 11),
                    ],
                  ),
                  SizedBox(height: 12),
                  // CCTV Image Preview Thumbnail
                  ShimmerBox(
                    width: double.infinity,
                    height: 160,
                    radius: 14,
                  ),
                  SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShimmerBox(width: 110, height: 12, radius: 4),
                      ShimmerBox(width: 90, height: 32, radius: 10),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ======================================================
// 19. Notification Nexus Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching NotificationNexusScreen:
/// Notification filter chips, followed by multi-line notification list cards
/// with avatar, title, body, timestamp, and dismiss swipe cue.
class NotificationShimmer extends StatelessWidget {
  const NotificationShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      itemCount: 6,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF141D38).withValues(alpha: 0.4)
                : Colors.white.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ShimmerBox(width: 44, height: 44, radius: 14),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerBox(width: w * 0.5, height: 14, radius: 4),
                    const SizedBox(height: 8),
                    ShimmerBox(width: w * 0.75, height: 11, radius: 4),
                    const SizedBox(height: 8),
                    const ShimmerBox(width: 75, height: 10, radius: 3),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ======================================================
// 20. User Directory Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching AdminUsersScreen:
/// Role filter tabs, search bar, and user directory list items
/// (avatar, full name, email, role badge, and action options).
class UserListShimmer extends StatelessWidget {
  const UserListShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      itemCount: 7,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF141D38).withValues(alpha: 0.4)
                : Colors.white.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF252E4A)
                  : const Color(0xFFE5E7F0),
            ),
          ),
          child: Row(
            children: [
              const ShimmerBox.circle(size: 46),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerBox(width: w * 0.4, height: 14, radius: 4),
                    const SizedBox(height: 6),
                    ShimmerBox(width: w * 0.55, height: 11, radius: 4),
                  ],
                ),
              ),
              const ShimmerBox(width: 65, height: 22, radius: 10),
            ],
          ),
        ),
      ),
    );
  }
}

// ======================================================
// 21. Management Dashboard Screen Skeleton Loader
// ======================================================

/// Screen-accurate skeleton matching ManagementDashboardScreen:
/// Responsive management telemetry metrics grid and analytics cards.
class ManagementDashboardShimmer extends StatelessWidget {
  const ManagementDashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      physics: NeverScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 12, 16, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 110,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 110,
                  radius: 18,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 110,
                  radius: 18,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(
                  width: double.infinity,
                  height: 110,
                  radius: 18,
                ),
              ),
            ],
          ),
          SizedBox(height: 24),
          ShimmerBox(width: double.infinity, height: 200, radius: 20),
          SizedBox(height: 16),
          ShimmerBox(width: double.infinity, height: 180, radius: 20),
        ],
      ),
    );
  }
}
