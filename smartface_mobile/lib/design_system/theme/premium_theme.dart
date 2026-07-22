import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// PremiumTheme provides the refined light/dark ThemeData for the premium UI.
class PremiumTheme {
  static ThemeData get lightTheme => _buildLightTheme();
  static ThemeData get darkTheme => getDarkTheme();

  static ThemeData _buildLightTheme() {
    final base = ThemeData.light();

    final inter = GoogleFonts.interTextTheme(base.textTheme);
    final playfair = GoogleFonts.playfairDisplayTextTheme(base.textTheme);

    final textTheme = inter.copyWith(
      displayLarge: playfair.displayLarge?.copyWith(
        color: AppColors.textHeading,
        letterSpacing: -1.0,
      ),
      headlineLarge: playfair.headlineLarge?.copyWith(
        color: AppColors.textHeading,
        letterSpacing: -0.5,
      ),
      titleLarge: playfair.titleLarge?.copyWith(color: AppColors.textHeading),
      bodyLarge: inter.bodyLarge?.copyWith(
        color: AppColors.textBody,
        height: 1.6,
      ),
      bodyMedium: inter.bodyMedium?.copyWith(
        color: AppColors.textBody,
        height: 1.55,
      ),
      bodySmall: inter.bodySmall?.copyWith(color: AppColors.textMuted),
      labelLarge: inter.labelLarge?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.bgLight,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.gold,
        surface: AppColors.cardLight,
        onPrimary: Colors.white,
        onSurface: AppColors.textHeading,
        error: AppColors.error,
      ),

      textTheme: textTheme,

      // ── Elevated Buttons ────────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style:
            ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppColors.black12,
              disabledForegroundColor: AppColors.textMuted,
              elevation: 0,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              textStyle: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ).copyWith(
              backgroundColor: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.pressed)) {
                  return AppColors.primaryDark;
                }
                return AppColors.primary;
              }),
              shadowColor: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.pressed)) {
                  return Colors.transparent;
                }
                return AppColors.primary.withValues(alpha: 0.2);
              }),
              elevation: WidgetStateProperty.resolveWith((states) {
                return 4;
              }),
            ),
      ),

      // ── Outlined Buttons ────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.borderLight),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),

      // ── Text Buttons ────────────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── AppBar ──────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 0,
        iconTheme: const IconThemeData(color: AppColors.textHeading, size: 24),
        titleTextStyle: GoogleFonts.inter(
          color: AppColors.textHeading,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),

      // ── Cards ───────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppColors.cardLight,
        elevation: 1,
        shadowColor: AppColors.black12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),

      // ── Input Fields ────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgLightAlt,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        labelStyle: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 14),
        hintStyle: GoogleFonts.inter(
          color: AppColors.textPlaceholder,
          fontSize: 14,
        ),
        floatingLabelStyle: GoogleFonts.inter(
          color: AppColors.primary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        prefixIconColor: AppColors.textMuted,
        suffixIconColor: AppColors.textMuted,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(
            color: AppColors.borderLight,
            width: 1.2,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.error, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.errorDark, width: 1.5),
        ),
      ),

      // ── Bottom Sheet ────────────────────────────────────────────────
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        elevation: 0,
        modalBackgroundColor: Colors.transparent,
        modalElevation: 0,
        clipBehavior: Clip.antiAlias,
      ),

      // ── Dialog ──────────────────────────────────────────────────────
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        elevation: 4,
        shadowColor: AppColors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),

      // ── Divider ─────────────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: AppColors.borderLight,
        thickness: 1,
        space: 1,
      ),

      // ── Snackbar ────────────────────────────────────────────────────
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.surfaceElevatedLight,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        contentTextStyle: GoogleFonts.inter(
          color: AppColors.textHeading,
          fontSize: 14,
        ),
        actionTextColor: AppColors.primary,
      ),

      // ── Chip ────────────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.iconChipLight,
        selectedColor: AppColors.primary.withValues(alpha: 0.15),
        labelStyle: GoogleFonts.inter(color: AppColors.textBody, fontSize: 13),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),

      // ── Switch ──────────────────────────────────────────────────────
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.primary;
          return Colors.grey.shade300;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary.withValues(alpha: 0.4);
          }
          return Colors.grey.shade200;
        }),
      ),

      // ── Progress Indicator ──────────────────────────────────────────
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
        linearTrackColor: AppColors.borderLight,
      ),
    );
  }
}
