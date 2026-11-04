/*
|--------------------------------------------------------------------------
| File: student_widgets.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Modern, responsive student component suite designed strictly according to
| design.md: rich indigo brand identity (#3D4AB8, #4F46E5, #6366F1),
| ethereal radial gradient orbs, 28px card shells, Poppins & Inter typography,
| tactile micro-interactions and smooth entrance animations.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animated_icon/animated_icon.dart';
import 'package:smartface_attendance/core/ui_system/app_ui_package_registry.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

/// ---------------------------------------------------------------------------
/// StudentScreenShell
/// Canonical screen shell providing the rich indigo hero banner with ethereal
/// orbs and an upward 28px overlapping white/dark content card shell.
/// ---------------------------------------------------------------------------
class StudentScreenShell extends StatelessWidget {
  final Widget child;
  final String title;
  final String? subtitle;
  final VoidCallback? onBackTap;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showOrbs;

  const StudentScreenShell({
    super.key,
    required this.child,
    required this.title,
    this.subtitle,
    this.onBackTap,
    this.actions,
    this.floatingActionButton,
    this.showOrbs = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final topPad = MediaQuery.of(context).padding.top;
    final double heroHeight = topPad + 115.0;

    // Palette tokens from design.md
    final pageBg = isDark ? const Color(0xFF070A14) : const Color(0xFFE8EAF6);
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);

    return Scaffold(
      backgroundColor: pageBg,
      floatingActionButton: floatingActionButton,
      body: Stack(
        children: [
          // ── 1. Hero Band with Ethereal Orbs ──────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: heroHeight + 32, // extra height for smooth 28px overlap
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF3D4AB8), // primaryIndigo
                    Color(0xFF4F46E5), // primary
                    Color(0xFF3730A3), // primaryDark
                  ],
                ),
              ),
              child: Stack(
                children: [
                  if (showOrbs) ...[
                    // Ethereal Orb 1: Top-Right
                    Positioned(
                      top: -30,
                      right: -30,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFF9AA4EC).withValues(alpha: 0.55),
                              const Color(0xFF4D58C0).withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Ethereal Orb 2: Mid-Right
                    Positioned(
                      top: 40,
                      right: 70,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFF6670D0).withValues(alpha: 0.40),
                              const Color(0xFF3D4AB8).withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Ethereal Orb 3: Left subtle highlight
                    Positioned(
                      top: 10,
                      left: -20,
                      child: Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFF9AA4EC).withValues(alpha: 0.35),
                              const Color(0xFF4D58C0).withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  // Header content
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          if (onBackTap != null)
                            PressableScale(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                onBackTap!();
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.25),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 14),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Back',
                                      style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  title,
                                  style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontSize: 19,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.3,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (subtitle != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    subtitle!,
                                    style: GoogleFonts.inter(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (actions != null) ...actions!,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── 2. Content Card with 28px Overlap ────────────────────────────
          Positioned.fill(
            top: heroHeight,
            child: Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
                border: Border(
                  top: BorderSide(color: cardBorder, width: 1.0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
                    blurRadius: 30,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
                child: child,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// ---------------------------------------------------------------------------
/// StudentCardShell
/// Universal 28px rounded surface card following design.md specs.
/// ---------------------------------------------------------------------------
class StudentCardShell extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? backgroundColor;
  final Color? borderColor;
  final VoidCallback? onTap;
  final List<BoxShadow>? customShadow;

  const StudentCardShell({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.backgroundColor,
    this.borderColor,
    this.onTap,
    this.customShadow,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = backgroundColor ?? (isDark ? const Color(0xFF141D38) : Colors.white);
    final border = borderColor ?? (isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0));

    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: border, width: 1.0),
        boxShadow: customShadow ??
            [
              BoxShadow(
                color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
                blurRadius: 24,
                offset: const Offset(0, 6),
              ),
            ],
      ),
      child: child,
    );

    if (onTap != null) {
      return PressableScale(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap!();
        },
        child: card,
      );
    }

    return card;
  }
}

/// ---------------------------------------------------------------------------
/// StudentSectionHeader
/// Poppins display title with an uppercase tracking Inter label.
/// ---------------------------------------------------------------------------
class StudentSectionHeader extends StatelessWidget {
  final String label;
  final String? title;
  final Widget? trailing;

  const StudentSectionHeader({
    super.key,
    required this.label,
    this.title,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final headingColor = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5), // primary
                ),
              ),
              if (title != null) ...[
                const SizedBox(height: 3),
                Text(
                  title!,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: headingColor,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}

/// ---------------------------------------------------------------------------
/// StudentMetricPill
/// Compact status pill for student performance, streak, or rating.
/// ---------------------------------------------------------------------------
class StudentMetricPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color accentColor;

  const StudentMetricPill({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.accentColor = const Color(0xFF4F46E5),
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF1A2340) : const Color(0xFFEEF2FF);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withValues(alpha: 0.2), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: accentColor, size: 16),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: textHeading,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// ---------------------------------------------------------------------------
/// StudentActionTile
/// Modern interactive card for quick actions with smooth 0.96 micro-bounce.
/// ---------------------------------------------------------------------------
class StudentActionTile extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const StudentActionTile({
    super.key,
    required this.label,
    required this.description,
    required this.icon,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: cardBorder, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black26 : const Color(0xFF8B98CE).withValues(alpha: 0.10),
              blurRadius: 18,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: gradientColors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: gradientColors.first.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: textHeading,
                    height: 1.25,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: textBody,
                    height: 1.35,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// ---------------------------------------------------------------------------
/// StudentSalomonBottomBar
/// Standard bottom navigation bar for student role adhering to design.md.
/// ---------------------------------------------------------------------------
class StudentSalomonBottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const StudentSalomonBottomBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppBottomNavigation(
      currentIndex: currentIndex,
      onTap: onTap,
      role: 'student',
      items: const [
        AppSalomonNavItemData(
          icon: Icons.home_outlined,
          activeIcon: Icons.home_rounded,
          animateIcon: AnimateIcons.home,
          title: 'Home',
          route: '/student/home',
        ),
        AppSalomonNavItemData(
          icon: Icons.calendar_month_outlined,
          activeIcon: Icons.calendar_month_rounded,
          animateIcon: AnimateIcons.calendar,
          title: 'Schedule',
          route: '/student/timetable',
        ),
        AppSalomonNavItemData(
          icon: Icons.qr_code_scanner_outlined,
          activeIcon: Icons.qr_code_scanner_rounded,
          animateIcon: AnimateIcons.qrCode,
          title: 'Scan',
          route: '/student/scan',
        ),
        AppSalomonNavItemData(
          icon: Icons.bar_chart_outlined,
          activeIcon: Icons.bar_chart_rounded,
          animateIcon: AnimateIcons.activity,
          title: 'Reports',
          route: '/student/attendance-hub',
        ),
        AppSalomonNavItemData(
          icon: Icons.person_outline_rounded,
          activeIcon: Icons.person_rounded,
          animateIcon: AnimateIcons.settings,
          title: 'Profile',
          route: '/student/profile',
        ),
      ],
    );
  }
}
