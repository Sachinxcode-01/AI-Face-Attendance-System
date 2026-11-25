/*
|--------------------------------------------------------------------------
| File: student_widgets.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Modern, responsive, SaaS-grade student component suite designed strictly according to
| design.md: rich indigo brand identity (#3D4AB8, #4F46E5, #6366F1),
| ethereal radial gradient orbs, 28px card shells, Poppins & Inter typography,
| tactile micro-interactions, accessibility compliance, and enterprise responsiveness.
|--------------------------------------------------------------------------
*/

import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

// ============================================================================
// 0. Responsive Breakpoints & Utilities
// ============================================================================
class StudentBreakpoints {
  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 600;

  static bool isTablet(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return w >= 600 && w < 1024;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1024;

  static double horizontalPadding(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    if (w >= 1024) return 32.0;
    if (w >= 600) return 24.0;
    return 16.0;
  }
}

/// Bounds container ensuring desktop screens don't overstretch content.
class ResponsiveContentBounds extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;

  const ResponsiveContentBounds({
    super.key,
    required this.child,
    this.maxWidth = 1240.0,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: padding != null
            ? Padding(padding: padding!, child: child)
            : child,
      ),
    );
  }
}

/// ---------------------------------------------------------------------------
/// StudentScreenShell
/// Canonical screen shell providing the rich indigo hero banner with ethereal
/// orbs and an upward 28px overlapping white/dark content card shell.
/// Enhanced with desktop/tablet responsive bounds and accessibility semantics.
/// ---------------------------------------------------------------------------
class StudentScreenShell extends StatelessWidget {
  final Widget child;
  final String title;
  final String? subtitle;
  final VoidCallback? onBackTap;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showOrbs;
  final double maxWidth;

  const StudentScreenShell({
    super.key,
    required this.child,
    required this.title,
    this.subtitle,
    this.onBackTap,
    this.actions,
    this.floatingActionButton,
    this.showOrbs = true,
    this.maxWidth = 1240.0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final topPad = MediaQuery.of(context).padding.top;
    final double heroHeight = topPad + 115.0;

    // Palette tokens from design.md
    final pageBg = isDark ? const Color(0xFF070A14) : const Color(0xFFE8EAF6);
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder =
        isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);

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
            height: heroHeight + 36, // extra height for smooth 28px overlap
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
                  if (showOrbs)
                    RepaintBoundary(
                      child: Stack(
                        children: [
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
                      ),
                    ),
                  // Header content with responsive centering
                  SafeArea(
                    bottom: false,
                    child: Center(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: maxWidth),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 8,
                          ),
                          child: Row(
                            children: [
                              if (onBackTap != null)
                                Semantics(
                                  label: 'Go back',
                                  button: true,
                                  child: PressableScale(
                                    onTap: () {
                                      HapticFeedback.lightImpact();
                                      onBackTap!();
                                    },
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: BackdropFilter(
                                        filter: ImageFilter.blur(
                                          sigmaX: 10,
                                          sigmaY: 10,
                                        ),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withValues(
                                              alpha: 0.16,
                                            ),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: Colors.white.withValues(
                                                alpha: 0.25,
                                              ),
                                              width: 1,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(
                                                LucideIcons.chevronLeft,
                                                color: Colors.white,
                                                size: 16,
                                              ),
                                              const SizedBox(width: 4),
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
                                        fontSize: 20,
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
                                          color: Colors.white.withValues(
                                            alpha: 0.85,
                                          ),
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
                border: Border(top: BorderSide(color: cardBorder, width: 1.0)),
                boxShadow: [
                  BoxShadow(
                    color: isDark
                        ? Colors.black38
                        : const Color(0xFF8B98CE).withValues(alpha: 0.15),
                    blurRadius: 30,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
                child: ResponsiveContentBounds(
                  maxWidth: maxWidth,
                  child: child,
                ),
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
  final String? semanticsLabel;

  const StudentCardShell({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.backgroundColor,
    this.borderColor,
    this.onTap,
    this.customShadow,
    this.semanticsLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg =
        backgroundColor ?? (isDark ? const Color(0xFF141D38) : Colors.white);
    final border =
        borderColor ??
        (isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0));

    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: border, width: 1.0),
        boxShadow:
            customShadow ??
            [
              BoxShadow(
                color: isDark
                    ? Colors.black38
                    : const Color(0xFF8B98CE).withValues(alpha: 0.12),
                blurRadius: 24,
                offset: const Offset(0, 6),
              ),
            ],
      ),
      child: child,
    );

    if (onTap != null) {
      return Semantics(
        label: semanticsLabel ?? 'Interactive Card',
        button: true,
        child: PressableScale(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap!();
          },
          child: card,
        ),
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
    final headingColor = isDark
        ? const Color(0xFFF1F3F9)
        : const Color(0xFF1A1A3A);

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
    final textHeading = isDark
        ? const Color(0xFFF1F3F9)
        : const Color(0xFF1A1A3A);

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
                  color: isDark
                      ? const Color(0xFF7C82A0)
                      : const Color(0xFFA0A0B8),
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
    final cardBorder =
        isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark
        ? const Color(0xFFF1F3F9)
        : const Color(0xFF1A1A3A);
    final textBody = isDark
        ? const Color(0xFFC8CCDF)
        : const Color(0xFF3D4260);

    return Semantics(
      label: '$label action: $description',
      button: true,
      child: PressableScale(
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
                color: isDark
                    ? Colors.black26
                    : const Color(0xFF8B98CE).withValues(alpha: 0.10),
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
      ),
    );
  }
}

// ============================================================================
// 1. OfflineStatusBanner
// ============================================================================
class OfflineStatusBanner extends StatelessWidget {
  final bool isOffline;
  final String? lastSyncedTime;
  final VoidCallback? onSyncTap;

  const OfflineStatusBanner({
    super.key,
    required this.isOffline,
    this.lastSyncedTime,
    this.onSyncTap,
  });

  @override
  Widget build(BuildContext context) {
    if (!isOffline) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, color: Color(0xFFF59E0B), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Working Offline',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
                Text(
                  lastSyncedTime != null
                      ? 'Displaying local cache (Synced: $lastSyncedTime)'
                      : 'Displaying cached attendance and schedule data.',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: Colors.white70,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (onSyncTap != null)
            TextButton(
              onPressed: onSyncTap,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                foregroundColor: const Color(0xFFF59E0B),
              ),
              child: const Text('Sync Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. AiAttendanceInsightsCard
// ============================================================================
class AiAttendanceInsightsCard extends StatelessWidget {
  final double currentPercentage;
  final int streakDays;
  final String? criticalSubject;
  final VoidCallback? onActionTap;

  const AiAttendanceInsightsCard({
    super.key,
    required this.currentPercentage,
    required this.streakDays,
    this.criticalSubject,
    this.onActionTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    // Formulate AI recommendation
    String insightTitle;
    String insightBody;
    Color accentColor;
    IconData badgeIcon;

    if (currentPercentage < 75.0) {
      insightTitle = 'Attendance Shortfall Alert';
      final deficit = ((75.0 - currentPercentage) * 0.4).ceil();
      insightBody = criticalSubject != null
          ? 'You are below the 75% threshold in $criticalSubject. Attend the next $deficit scheduled lectures to restore eligibility.'
          : 'Overall attendance is at ${(currentPercentage).toStringAsFixed(1)}%. Priority recovery is recommended to avoid semester condonation.';
      accentColor = const Color(0xFFEF4444);
      badgeIcon = Icons.warning_amber_rounded;
    } else if (currentPercentage >= 85.0) {
      insightTitle = 'Dean\'s Honors Trajectory';
      insightBody =
          'Outstanding consistency! Your streak is $streakDays days. Maintaining this pace secures top-tier eligibility and exemption privileges.';
      accentColor = const Color(0xFF10B981);
      badgeIcon = Icons.stars_rounded;
    } else {
      insightTitle = 'Safe Compliance Standing';
      insightBody =
          'You are comfortably above mandatory limits. You can safely miss up to 2 future elective sessions without breaching the 75% threshold.';
      accentColor = const Color(0xFF6366F1);
      badgeIcon = Icons.auto_awesome_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(badgeIcon, color: accentColor, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI ATTENDANCE COPILOT',
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                      Text(
                        insightTitle,
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: textHeading,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: accentColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  'CONFIDENCE 96%',
                  style: GoogleFonts.inter(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: accentColor,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            insightBody,
            style: GoogleFonts.inter(
              fontSize: 13,
              height: 1.45,
              color: isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260),
            ),
          ),
          if (onActionTap != null) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: PressableScale(
                onTap: onActionTap!,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Open Recovery Planner',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded, size: 14, color: Color(0xFF4F46E5)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ============================================================================
// 3. AttendanceForecastCard
// ============================================================================
class AttendanceForecastCard extends StatelessWidget {
  final double currentPercentage;
  final double projectedPercentage;
  final int totalClassesRemaining;

  const AttendanceForecastCard({
    super.key,
    required this.currentPercentage,
    required this.projectedPercentage,
    this.totalClassesRemaining = 42,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);

    final double worstCase = max(50.0, projectedPercentage - 8.5);
    final double bestCase = min(100.0, projectedPercentage + 6.0);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ATTENDANCE FORECASTING',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'SEMESTER PROJECTION',
                  style: GoogleFonts.inter(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF6366F1),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${projectedPercentage.toStringAsFixed(1)}%',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: projectedPercentage >= 75.0
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'projected end of semester ($totalClassesRemaining classes left)',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Simulation scenarios
          _buildScenarioBar(
            label: 'Worst-case (50% future attendance)',
            value: worstCase,
            barColor: const Color(0xFFEF4444),
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildScenarioBar(
            label: 'Expected pace (current rate)',
            value: projectedPercentage,
            barColor: const Color(0xFF4F46E5),
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildScenarioBar(
            label: 'Best-case (100% future attendance)',
            value: bestCase,
            barColor: const Color(0xFF10B981),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildScenarioBar({
    required String label,
    required double value,
    required Color barColor,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260),
              ),
            ),
            Text(
              '${value.toStringAsFixed(1)}%',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: barColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: (value / 100.0).clamp(0.0, 1.0),
            backgroundColor: isDark ? const Color(0xFF1E284A) : const Color(0xFFE5E7F0),
            valueColor: AlwaysStoppedAnimation<Color>(barColor),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// 4. StudentSuccessDashboardCard
// ============================================================================
class StudentSuccessDashboardCard extends StatelessWidget {
  final double score; // 0 to 100
  final String standing;
  final String rank;
  final int streak;
  final VoidCallback? onDetailsTap;

  const StudentSuccessDashboardCard({
    super.key,
    required this.score,
    required this.standing,
    required this.rank,
    required this.streak,
    this.onDetailsTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'STUDENT SUCCESS SCORECARD',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  standing.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              // Score Radial
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 74,
                    height: 74,
                    child: CircularProgressIndicator(
                      value: (score / 100).clamp(0.0, 1.0),
                      strokeWidth: 7,
                      backgroundColor: isDark ? const Color(0xFF1E284A) : const Color(0xFFE5E7F0),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4F46E5)),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        score.toInt().toString(),
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: textHeading,
                        ),
                      ),
                      Text(
                        '/100',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Department Standing: $rank',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: textHeading,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Active Streak: $streak Consecutive Days. Punctuality and facial biometric verification rates are exemplary.',
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 5. DeviceSecurityCenterCard
// ============================================================================
class DeviceSecurityCenterCard extends StatelessWidget {
  final int activeSessionsCount;
  final String primaryDeviceName;
  final VoidCallback onRevokeOthers;

  const DeviceSecurityCenterCard({
    super.key,
    required this.activeSessionsCount,
    required this.primaryDeviceName,
    required this.onRevokeOthers,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'DEVICE SECURITY CENTER',
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                      color: const Color(0xFF4F46E5),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'TRUST SCORE: HIGH',
                  style: GoogleFonts.inter(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    primaryDeviceName,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: textHeading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$activeSessionsCount Active Device Session${activeSessionsCount > 1 ? 's' : ''} • Biometric Enclave Active',
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                    ),
                  ),
                ],
              ),
              if (activeSessionsCount > 1)
                PressableScale(
                  onTap: onRevokeOthers,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'Revoke Others',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFEF4444),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 6. AttendanceDisputeTimelineWidget
// ============================================================================
class AttendanceDisputeTimelineWidget extends StatelessWidget {
  final List<Map<String, dynamic>> disputes;
  final VoidCallback onNewDispute;

  const AttendanceDisputeTimelineWidget({
    super.key,
    required this.disputes,
    required this.onNewDispute,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ATTENDANCE DISPUTES & APPEALS',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: const Color(0xFF4F46E5),
                ),
              ),
              PressableScale(
                onTap: onNewDispute,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add_rounded, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        'File Dispute',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (disputes.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No active attendance disputes. All recorded sessions are verified.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                  ),
                ),
              ),
            )
          else
            ...disputes.take(3).map((d) {
              final status = d['status'] ?? 'Pending Review';
              final color = status == 'Approved'
                  ? const Color(0xFF10B981)
                  : (status == 'Rejected'
                      ? const Color(0xFFEF4444)
                      : const Color(0xFFF59E0B));

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1A2340) : const Color(0xFFF8FAFF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: cardBorder),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            d['subject'] ?? 'Lecture Session',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: textHeading,
                            ),
                          ),
                          Text(
                            '${d['date'] ?? 'Recent'} • ${d['reason'] ?? 'Scanner Error'}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
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
