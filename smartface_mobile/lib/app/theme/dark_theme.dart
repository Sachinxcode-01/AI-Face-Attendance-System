import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Custom Design Tokens Extension for the Premium Dark Mode
@immutable
class DarkAppColors extends ThemeExtension<DarkAppColors> {
  final Color backgroundBase;
  final Color surfaceCard;
  final Color primary;
  final Color primaryGlow;
  final Color success;
  final Color successGlow;
  final Color warning;
  final Color warningGlow;
  final Color error;
  final Color errorGlow;
  final Color glassBorder;

  const DarkAppColors({
    required this.backgroundBase,
    required this.surfaceCard,
    required this.primary,
    required this.primaryGlow,
    required this.success,
    required this.successGlow,
    required this.warning,
    required this.warningGlow,
    required this.error,
    required this.errorGlow,
    required this.glassBorder,
  });

  /// Factory constructors for default configurations

  static const dark = DarkAppColors(
    backgroundBase: Color(0xFF020617),
    surfaceCard: Color(0xD9111827), // ~85% opacity of #111827
    primary: Color(0xFF2563EB),
    primaryGlow: Color(0xFF3B82F6),
    success: Color(0xFF10B981),
    successGlow: Color(
      0x3310B981,
    ), // matching glow box-shadow color (20% opacity)
    warning: Color(0xFFF59E0B),
    warningGlow: Color(
      0x33F59E0B,
    ), // matching glow box-shadow color (20% opacity)
    error: Color(0xFFEF4444),
    errorGlow: Color(
      0x33EF4444,
    ), // matching glow box-shadow color (20% opacity)
    glassBorder: Color(0x14FFFFFF), // Colors.white.withOpacity(0.08)
  );

  static const light = DarkAppColors(
    backgroundBase: Color(0xFFF8FAFC),
    surfaceCard: Color(0xD9FFFFFF), // ~85% opacity of white
    primary: Color(0xFF1E3A8A),
    primaryGlow: Color(0xFF2563EB),
    success: Color(0xFF10B981),
    successGlow: Color(0x1A10B981),
    warning: Color(0xFFF59E0B),
    warningGlow: Color(0x1AF59E0B),
    error: Color(0xFFEF4444),
    errorGlow: Color(0x1AEF4444),
    glassBorder: Color(0x14000000), // Colors.black.withOpacity(0.08)
  );

  @override
  DarkAppColors copyWith({
    Color? backgroundBase,
    Color? surfaceCard,
    Color? primary,
    Color? primaryGlow,
    Color? success,
    Color? successGlow,
    Color? warning,
    Color? warningGlow,
    Color? error,
    Color? errorGlow,
    Color? glassBorder,
  }) {
    return DarkAppColors(
      backgroundBase: backgroundBase ?? this.backgroundBase,
      surfaceCard: surfaceCard ?? this.surfaceCard,
      primary: primary ?? this.primary,
      primaryGlow: primaryGlow ?? this.primaryGlow,
      success: success ?? this.success,
      successGlow: successGlow ?? this.successGlow,
      warning: warning ?? this.warning,
      warningGlow: warningGlow ?? this.warningGlow,
      error: error ?? this.error,
      errorGlow: errorGlow ?? this.errorGlow,
      glassBorder: glassBorder ?? this.glassBorder,
    );
  }

  @override
  DarkAppColors lerp(ThemeExtension<DarkAppColors>? other, double t) {
    if (other is! DarkAppColors) {
      return this;
    }
    return DarkAppColors(
      backgroundBase: Color.lerp(backgroundBase, other.backgroundBase, t)!,
      surfaceCard: Color.lerp(surfaceCard, other.surfaceCard, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryGlow: Color.lerp(primaryGlow, other.primaryGlow, t)!,
      success: Color.lerp(success, other.success, t)!,
      successGlow: Color.lerp(successGlow, other.successGlow, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningGlow: Color.lerp(warningGlow, other.warningGlow, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorGlow: Color.lerp(errorGlow, other.errorGlow, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
    );
  }
}

/// Builds the premium dark theme configuration
ThemeData getDarkTheme() {
  final baseTheme = ThemeData.dark();

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: DarkAppColors.dark.backgroundBase,
    colorScheme: ColorScheme.dark(
      primary: DarkAppColors.dark.primary,
      secondary: DarkAppColors.dark.primaryGlow,
      surface: DarkAppColors.dark.surfaceCard,
      onPrimary: Colors.white,
      onSurface: Colors.white,
      error: DarkAppColors.dark.error,
    ),
    // Setup typography to use Google Fonts Inter text theme mapped to the dark theme hierarchy
    textTheme: GoogleFonts.interTextTheme(baseTheme.textTheme).copyWith(
      displayLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displayLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      displayMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displayMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      displaySmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displaySmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      headlineLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      headlineMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      headlineSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      titleLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      titleMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      titleSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      bodyLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodyLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      bodyMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodyMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      bodySmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodySmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.60), // Secondary text
        ),
      ),
      labelLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.87),
        ),
      ),
      labelMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.60),
        ),
      ),
      labelSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.60),
        ),
      ),
    ),
    extensions: const <ThemeExtension<dynamic>>[DarkAppColors.dark],
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: DarkAppColors.dark.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
        elevation: 8,
        shadowColor: DarkAppColors.dark.primaryGlow.withValues(alpha: 0.4),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.04),
      labelStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.60),
        fontSize: 13,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: DarkAppColors.dark.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: DarkAppColors.dark.error, width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: DarkAppColors.dark.error, width: 1.5),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      iconTheme: IconThemeData(color: Colors.white),
    ),
    cardTheme: CardThemeData(
      color: DarkAppColors.dark.surfaceCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        side: BorderSide(color: DarkAppColors.dark.glassBorder, width: 1),
      ),
    ),
    dividerTheme: DividerThemeData(color: Colors.white.withValues(alpha: 0.08)),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      contentTextStyle: GoogleFonts.inter(color: Colors.white),
    ),
  );
}
