import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// ============================================================================
/// AppTheme — Premium light/dark ThemeData for "Smart Attendance AI".
///
/// Clean typography (Poppins headings + Inter body), rounded cards, soft
/// shadows and blue accents to match the reference images. Both modes keep
/// text fully legible (no invisible text).
/// ============================================================================
class AppTheme {
  AppTheme._();

  static const double radiusSm = 12;
  static const double radiusMd = 18;
  static const double radiusLg = 26;
  static const double radiusXl = 32;

  static TextTheme _textTheme(Brightness b) {
    final heading = AppColors.heading(b);
    final body = AppColors.body(b);
    final base = b == Brightness.dark
        ? ThemeData.dark().textTheme
        : ThemeData.light().textTheme;

    final poppins = GoogleFonts.poppinsTextTheme(base);
    final inter = GoogleFonts.interTextTheme(base);

    return inter.copyWith(
      displayLarge: poppins.displayLarge?.copyWith(
        color: heading,
        fontWeight: FontWeight.w800,
      ),
      headlineLarge: poppins.headlineLarge?.copyWith(
        color: heading,
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: poppins.headlineMedium?.copyWith(
        color: heading,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: poppins.titleLarge?.copyWith(
        color: heading,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: poppins.titleMedium?.copyWith(
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: inter.bodyLarge?.copyWith(color: body),
      bodyMedium: inter.bodyMedium?.copyWith(color: body),
      labelLarge: inter.labelLarge?.copyWith(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.primaryBright,
      onSecondary: Colors.white,
      surface: AppColors.card(brightness),
      onSurface: AppColors.heading(brightness),
      error: AppColors.error,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: AppColors.background(brightness),
      colorScheme: scheme,
      textTheme: _textTheme(brightness),
      splashFactory: InkRipple.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.heading(brightness)),
        titleTextStyle: GoogleFonts.poppins(
          color: AppColors.heading(brightness),
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: AppColors.card(brightness),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusSm),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        hintStyle: GoogleFonts.inter(color: AppColors.textPlaceholder),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide(color: AppColors.border(brightness)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.border(brightness),
        thickness: 1,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: AppColors.card(brightness),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(radiusXl)),
        ),
      ),
    );
  }
}
