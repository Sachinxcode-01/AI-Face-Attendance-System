import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// ============================================================================
/// AppTextStyles — Premium typography tokens for "Smart Attendance AI".
///
/// Combines Poppins (for elegant displays, titles, and headings) with Inter
/// (for high-legibility body, labels, and status indicators).
/// Exposes static styles and context-aware responsive builders.
/// ============================================================================
class AppTextStyles {
  AppTextStyles._();

  /// Poppins Display Title (Large, bold)
  static TextStyle display(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    final width = MediaQuery.of(context).size.width;
    final double size = (width * 0.08).clamp(26.0, 36.0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GoogleFonts.poppins(
      fontSize: size,
      fontWeight: weight ?? FontWeight.w800,
      color:
          color ?? (isDark ? AppColors.textHeadingDark : AppColors.textHeading),
      letterSpacing: -0.5,
    );
  }

  /// Poppins Screen Headings (Readable, bold)
  static TextStyle heading(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    final width = MediaQuery.of(context).size.width;
    final double size = (width * 0.055).clamp(20.0, 24.0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GoogleFonts.poppins(
      fontSize: size,
      fontWeight: weight ?? FontWeight.w700,
      color:
          color ?? (isDark ? AppColors.textHeadingDark : AppColors.textHeading),
      letterSpacing: -0.2,
    );
  }

  /// Poppins Subheadings (Medium emphasis)
  static TextStyle subheading(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    final width = MediaQuery.of(context).size.width;
    final double size = (width * 0.042).clamp(15.0, 17.0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GoogleFonts.poppins(
      fontSize: size,
      fontWeight: weight ?? FontWeight.w600,
      color: color ?? (isDark ? AppColors.textMutedDark : AppColors.textMuted),
    );
  }

  /// Inter Body Text (Regular readability)
  static TextStyle body(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    final width = MediaQuery.of(context).size.width;
    final double size = (width * 0.036).clamp(13.0, 14.5);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: weight ?? FontWeight.normal,
      color: color ?? (isDark ? AppColors.textBodyDark : AppColors.textBody),
      height: 1.45,
    );
  }

  /// Inter Small Captions (Muted/helper details)
  static TextStyle caption(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GoogleFonts.inter(
      fontSize: 11.5,
      fontWeight: weight ?? FontWeight.w400,
      color: color ?? (isDark ? AppColors.textMutedDark : AppColors.textMuted),
      letterSpacing: 0.2,
    );
  }

  /// Inter Clean Labels (Soft, uppercase tracker)
  static TextStyle label(
    BuildContext context, {
    Color? color,
    FontWeight? weight,
  }) {
    return GoogleFonts.inter(
      fontSize: 10.0,
      fontWeight: weight ?? FontWeight.w600,
      letterSpacing: 1.2,
      color: color ?? AppColors.primarySoft,
    );
  }

  /// Poppins Button Text (Bold and centered actions)
  static TextStyle button(BuildContext context, {Color? color}) {
    return GoogleFonts.poppins(
      fontSize: 15.0,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.8,
      color: color ?? Colors.white,
    );
  }
}
