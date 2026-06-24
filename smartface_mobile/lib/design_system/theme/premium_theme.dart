import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// PremiumTheme provides the light/dark ThemeData for the premium UI.
class PremiumTheme {
  static ThemeData get lightTheme => _buildLightTheme();
  static ThemeData get darkTheme =>
      getDarkTheme(); // reuse existing rich dark theme

  static ThemeData _buildLightTheme() {
    final base = ThemeData.light();

    final inter = GoogleFonts.interTextTheme(base.textTheme);
    final playfair = GoogleFonts.playfairDisplayTextTheme(base.textTheme);

    final textTheme = inter.copyWith(
      displayLarge: playfair.displayLarge?.copyWith(color: AppColors.indigo),
      headlineLarge: playfair.headlineLarge?.copyWith(color: AppColors.indigo),
      titleLarge: playfair.titleLarge?.copyWith(color: AppColors.indigo),
      bodyLarge: inter.bodyLarge?.copyWith(color: const Color(0xFF111827)),
      bodyMedium: inter.bodyMedium?.copyWith(color: const Color(0xFF1A1F38)),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.bgLight,
      colorScheme: const ColorScheme.light(
        primary: AppColors.indigo,
        secondary: AppColors.gold,
        surface: AppColors.bgCardLight,
        onPrimary: Colors.white,
        onSurface: Color(0xFF1A1F38),
        error: AppColors.error,
      ),
      textTheme: textTheme,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.indigo,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14),
          elevation: 6,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF1A1F38)),
      ),
      cardTheme: CardThemeData(
        color: AppColors.bgCardLight,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
    );
  }
}
