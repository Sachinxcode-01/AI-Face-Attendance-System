import 'package:flutter/material.dart';

/// ============================================================================
/// AppColors — Single source of truth for the "Smart Attendance AI" palette.
///
/// Derived from the premium reference images: soft blue/navy liquid background,
/// royal-blue header, white glass cards, blue accents, soft shadows.
/// Provides light + dark tokens so both modes stay perfectly legible.
/// ============================================================================
class AppColors {
  AppColors._();

  // ── Brand / Primary ──────────────────────────────────────────────────────
  /// Royal indigo-blue used for headers, primary buttons, active icons.
  static const Color primary = Color(0xFF3D4AB8);
  static const Color primaryBright = Color(0xFF4A5AE8);
  static const Color primaryDark = Color(0xFF2A3596);
  static const Color primarySoft = Color(0xFF6670D0);

  /// Header gradient (matches the rounded blue dashboard header).
  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4A56C9), Color(0xFF3A46B0), Color(0xFF313D9C)],
  );

  /// Primary button gradient.
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4A5AE8), Color(0xFF3D4AB8)],
  );

  // ── Glossy 3D sphere gradients (floating circles) ─────────────────────────
  static const List<Color> sphereLight = [
    Colors.white,
    Color(0xFFE2EBFE),
    Color(0xFFB0C3EF),
  ];
  static const List<Color> sphereDark = [
    Color(0xFF2C3E75),
    Color(0xFF1D2952),
    Color(0xFF0C132E),
  ];

  // ── Light mode surfaces ───────────────────────────────────────────────────
  static const Color bgLight = Color(0xFFEEF1FA); // page background
  static const Color bgLightAlt = Color(0xFFE8EAF6);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF4F6FD);

  // ── Dark mode surfaces ────────────────────────────────────────────────────
  static const Color bgDark = Color(0xFF0B1020);
  static const Color bgDarkAlt = Color(0xFF121834);
  static const Color cardDark = Color(0xFF1A2142);
  static const Color surfaceDark = Color(0xFF232B52);

  // ── Text (light mode) ─────────────────────────────────────────────────────
  static const Color textHeading = Color(0xFF1A1A3A);
  static const Color textBody = Color(0xFF44496A);
  static const Color textMuted = Color(0xFF8A90AE);
  static const Color textPlaceholder = Color(0xFFB8BDD4);

  // ── Text (dark mode) ──────────────────────────────────────────────────────
  static const Color textHeadingDark = Color(0xFFF4F6FF);
  static const Color textBodyDark = Color(0xFFC3C8E4);
  static const Color textMutedDark = Color(0xFF8B91B4);

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF16A34A);
  static const Color successSoft = Color(0xFFE6F6EC);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningSoft = Color(0xFFFDF0DA);
  static const Color error = Color(0xFFEF4444);
  static const Color errorSoft = Color(0xFFFDE7E7);
  static const Color upcoming = Color(0xFFF06576);
  static const Color upcomingSoft = Color(0xFFFDE6E9);
  static const Color info = Color(0xFF3B82F6);

  // ── Borders / dividers ────────────────────────────────────────────────────
  static const Color borderLight = Color(0xFFE6E8F2);
  static const Color borderDark = Color(0xFF2C3560);

  // ── Icon chip backgrounds ─────────────────────────────────────────────────
  static const Color iconChipLight = Color(0xFFEDF0FC);
  static const Color iconChipDark = Color(0xFF262E58);

  /// Resolve heading text color for the active brightness.
  static Color heading(Brightness b) =>
      b == Brightness.dark ? textHeadingDark : textHeading;

  /// Resolve body text color for the active brightness.
  static Color body(Brightness b) =>
      b == Brightness.dark ? textBodyDark : textBody;

  /// Resolve muted text color for the active brightness.
  static Color muted(Brightness b) =>
      b == Brightness.dark ? textMutedDark : textMuted;

  /// Resolve card color for the active brightness.
  static Color card(Brightness b) => b == Brightness.dark ? cardDark : cardLight;

  /// Resolve page background for the active brightness.
  static Color background(Brightness b) =>
      b == Brightness.dark ? bgDark : bgLight;

  /// Resolve border color for the active brightness.
  static Color border(Brightness b) =>
      b == Brightness.dark ? borderDark : borderLight;

  /// Resolve icon-chip background for the active brightness.
  static Color iconChip(Brightness b) =>
      b == Brightness.dark ? iconChipDark : iconChipLight;
}
