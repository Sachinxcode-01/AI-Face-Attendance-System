import 'package:flutter/material.dart';

/// ============================================================================
/// AppColors — Single source of truth for the redesigned "Smart Attendance AI"
/// palette. Modern, rich, depth-driven color system with dark/light tokens.
///
/// Design principles:
/// - Deep navy/indigo foundation for dark mode with subtle blue undertones
/// - Warm gold accent for premium feel and highlights
/// - Layered surface colors for visual depth (elevation-based)
/// - Glow colors for micro-interactions and active states
/// - Full light mode parity with matching luminance hierarchy
/// ============================================================================
class AppColors {
  AppColors._();

  // ── Brand Core ───────────────────────────────────────────────────────────
  /// Hero band & base indigo (canonical from design.md)
  static const Color primaryIndigo = Color(0xFF3D4AB8);

  /// Primary brand — rich royal blue
  static const Color primary = Color(0xFF4F46E5);

  /// Primary brighter — for hover/active glow states
  static const Color primaryBright = Color(0xFF6366F1);

  /// Primary lighter — for soft backgrounds
  static const Color primaryLight = Color(0xFF818CF8);

  /// Primary darkest — for pressed states
  static const Color primaryDark = Color(0xFF3730A3);

  /// Primary subtle — for badges, chips
  static const Color primarySoft = Color(0xFFA5B4FC);

  // ── Hero Orbs (Radial Gradient Spheres) ──────────────────────────────────
  static const Color orbLight = Color(0xFF9AA4EC);
  static const Color orbMid = Color(0xFF6670D0);
  static const Color orbDark = Color(0xFF4D58C0);

  // ── Page Background Canvas ───────────────────────────────────────────────
  static const Color pageBg = Color(0xFFE8EAF6);

  // ── Premium Accent (Gold) ────────────────────────────────────────────────
  static const Color gold = Color(0xFFF59E0B);
  static const Color goldLight = Color(0xFFFBBF24);
  static const Color goldBright = Color(0xFFFCD34D);
  static const Color goldDark = Color(0xFFD97706);
  static const Color goldGlow = Color(0x33F59E0B);
  /// Accent purple for UI highlights and card tints
  static const Color purple = Color(0xFF7B2FF7);

  // ── Secondary Accent (Cyan/Teal) ─────────────────────────────────────────
  static const Color accent = Color(0xFF06B6D4);
  static const Color accentLight = Color(0xFF22D3EE);
  static const Color accentDark = Color(0xFF0891B2);
  static const Color accentGlow = Color(0x3306B6D4);

  // ── Dark Mode Surface Hierarchy (Elevation-based) ───────────────────────
  /// Deepest background — base canvas (#0B0E1A with subtle indigo tint)
  static const Color bgDeep = Color(0xFF070A14);

  /// Default page background
  static const Color bgDark = Color(0xFF0D1225);

  /// Slightly elevated surface (e.g., cards, sheets)
  static const Color surfaceDark = Color(0xFF131A33);

  /// Elevated surface (e.g., dialogs, modals)
  static const Color surfaceElevated = Color(0xFF1A2340);

  /// Card default
  static const Color cardDark = Color(0xFF141D38);

  /// Higher card
  static const Color cardElevated = Color(0xFF1C2648);

  /// Modal bottom sheets, dropdowns
  static const Color bgModal = Color(0xFF0F162E);

  // ── Light Mode Surface Hierarchy ─────────────────────────────────────────
  static const Color bgLight = Color(0xFFF4F6FC);
  static const Color bgLightAlt = Color(0xFFEEF1FA);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF8FAFF);
  static const Color surfaceElevatedLight = Color(0xFFFFFFFF);

  // ── Legacy (backwards compat) ────────────────────────────────────────────
  static const Color bgCard = Color(0xFF141D38);
  static const Color bgSurface = Color(0xFF131A33);
  static const Color indigo = Color(0xFF4F46E5);
  static const Color indigoLight = Color(0xFF6366F1);

  // ── Dark Mode Text ───────────────────────────────────────────────────────
  static const Color textHeadingDark = Color(0xFFF1F3F9);
  static const Color textBodyDark = Color(0xFFC8CCDF);
  static const Color textMutedDark = Color(0xFF7C82A0);
  static const Color textPlaceholderDark = Color(0xFF4B5170);

  // ── Light Mode Text ──────────────────────────────────────────────────────
  static const Color textHeading = Color(0xFF0F1225);
  static const Color textBody = Color(0xFF3D4260);
  static const Color textMuted = Color(0xFF8388A5);
  static const Color textPlaceholder = Color(0xFFB0B5CD);

  // ── Semantic Colors ──────────────────────────────────────────────────────
  // Success
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF34D399);
  static const Color successDark = Color(0xFF059669);
  static const Color successGlow = Color(0x3310B981);
  static const Color successSoft = Color(0xFFECFDF5);

  // Warning
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);
  static const Color warningGlow = Color(0x33F59E0B);
  static const Color warningSoft = Color(0xFFFFFBEB);

  // Error
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFDC2626);
  static const Color errorGlow = Color(0x33EF4444);
  static const Color errorSoft = Color(0xFFFEF2F2);

  // Info
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoGlow = Color(0x333B82F6);

  // Upcoming / Pending
  static const Color upcoming = Color(0xFFF06576);
  static const Color upcomingSoft = Color(0xFFFFF0F3);

  // ── Neutral / Gray Scale ─────────────────────────────────────────────────
  static const Color white = Colors.white;
  static const Color white90 = Color(0xE6FFFFFF);
  static const Color white80 = Color(0xCCFFFFFF);
  static const Color white70 = Color(0xB3FFFFFF);
  static const Color white60 = Color(0x99FFFFFF);
  static const Color white50 = Color(0x80FFFFFF);
  static const Color white38 = Color(0x61FFFFFF);
  static const Color white25 = Color(0x40FFFFFF);
  static const Color white12 = Color(0x1FFFFFFF);
  static const Color white10 = Color(0x1AFFFFFF);
  static const Color white08 = Color(0x14FFFFFF);
  static const Color white06 = Color(0x0FFFFFFF);
  static const Color white04 = Color(0x0AFFFFFF);

  static const Color black = Colors.black;
  static const Color black12 = Color(0x1F000000);
  static const Color black25 = Color(0x40000000);
  static const Color black38 = Color(0x61000000);
  static const Color black50 = Color(0x80000000);

  // ── Misc Legacy ──────────────────────────────────────────────────────────
  static const Color cyan = Color(0xFF06B6D4);
  static const Color cyanGlow = Color(0x3306B6D4);

  // ── Glossy 3D Sphere Gradients ──────────────────────────────────────────
  static const List<Color> sphereLight = [
    Colors.white,
    Color(0xFFE0E7FF),
    Color(0xFFA5B4FC),
  ];
  static const List<Color> sphereDark = [
    Color(0xFF2D3A7A),
    Color(0xFF1C2550),
    Color(0xFF0E1430),
  ];

  // ── Borders ──────────────────────────────────────────────────────────────
  static const Color borderLight = Color(0xFFE5E7F0);
  static const Color borderDark = Color(0xFF252E4A);
  static const Color borderSubtleDark = Color(0xFF1A2240);

  // ── Icon Chips ───────────────────────────────────────────────────────────
  static const Color iconChipLight = Color(0xFFEEF0FF);
  static const Color iconChipDark = Color(0xFF1E2750);

  // ── Overlays ─────────────────────────────────────────────────────────────
  static const Color overlayDark = Color(0x80000000);
  static const Color overlayLight = Color(0x40000000);

  // ── Shadows (colored glow variants) ──────────────────────────────────────
  static Color primaryShadow = primary.withValues(alpha: 0.3);
  static Color goldShadow = gold.withValues(alpha: 0.3);
  static Color successShadow = success.withValues(alpha: 0.3);

  // ═══════════════════════════════════════════════════════════════════════
  // GRADIENTS
  // ═══════════════════════════════════════════════════════════════════════

  // ── Background Gradients ─────────────────────────────────────────────────
  static const LinearGradient darkBgGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF070A14), Color(0xFF0D1225), Color(0xFF0A0F20)],
    stops: [0.0, 0.5, 1.0],
  );

  static const LinearGradient lightBgGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFF4F6FC), Color(0xFFEEF1FA), Color(0xFFF8FAFF)],
    stops: [0.0, 0.5, 1.0],
  );

  // ── Header Gradients ─────────────────────────────────────────────────────
  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4F46E5), Color(0xFF4338CA), Color(0xFF3730A3)],
  );

  static const LinearGradient headerSoftGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
  );

  // ── Button Gradients ─────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
  );

  static const LinearGradient primaryGradientPressed = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF4F46E5), Color(0xFF3730A3)],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFD97706)],
  );

  // ── Card / Glass Gradients ───────────────────────────────────────────────
  static const LinearGradient cardGlassDark = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x18FFFFFF), Color(0x08FFFFFF), Color(0x02FFFFFF)],
  );

  static const LinearGradient cardGlassLight = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x0A000000), Color(0x04000000)],
  );

  // ── Semantic Glow Gradients ──────────────────────────────────────────────
  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient errorGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFF87171)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warningGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ═══════════════════════════════════════════════════════════════════════
  // BRIGHTNESS-RESOLVING HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  static Color heading(Brightness b) =>
      b == Brightness.dark ? textHeadingDark : textHeading;

  static Color body(Brightness b) =>
      b == Brightness.dark ? textBodyDark : textBody;

  static Color muted(Brightness b) =>
      b == Brightness.dark ? textMutedDark : textMuted;

  static Color card(Brightness b) =>
      b == Brightness.dark ? cardDark : cardLight;

  static Color background(Brightness b) =>
      b == Brightness.dark ? bgDark : bgLight;

  static Color border(Brightness b) =>
      b == Brightness.dark ? borderDark : borderLight;

  static Color iconChip(Brightness b) =>
      b == Brightness.dark ? iconChipDark : iconChipLight;

  static Color elevatedSurface(Brightness b) =>
      b == Brightness.dark ? surfaceElevated : surfaceElevatedLight;
}
