import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Custom Design Tokens Extension for the Premium Dark Mode
@immutable
class DarkAppColors extends ThemeExtension<DarkAppColors> {
  final Color backgroundBase;
  final Color surfaceCard;
  final Color surfaceCardElevated;
  final Color primary;
  final Color primaryGlow;
  final Color success;
  final Color successGlow;
  final Color warning;
  final Color warningGlow;
  final Color error;
  final Color errorGlow;
  final Color glassBorder;
  final Color navBarSurface;
  final Color navBarActivePill;

  const DarkAppColors({
    required this.backgroundBase,
    required this.surfaceCard,
    required this.surfaceCardElevated,
    required this.primary,
    required this.primaryGlow,
    required this.success,
    required this.successGlow,
    required this.warning,
    required this.warningGlow,
    required this.error,
    required this.errorGlow,
    required this.glassBorder,
    required this.navBarSurface,
    required this.navBarActivePill,
  });

  static const dark = DarkAppColors(
    backgroundBase: Color(0xFF070A14),
    surfaceCard: Color(0xE6131A33),
    surfaceCardElevated: Color(0xE61A2340),
    primary: Color(0xFF6366F1),
    primaryGlow: Color(0xFF818CF8),
    success: Color(0xFF10B981),
    successGlow: Color(0x3310B981),
    warning: Color(0xFFF59E0B),
    warningGlow: Color(0x33F59E0B),
    error: Color(0xFFEF4444),
    errorGlow: Color(0x33EF4444),
    glassBorder: Color(0x1AFFFFFF),
    navBarSurface: Color(0xE60D1225),
    navBarActivePill: Color(0x266366F1),
  );

  static const light = DarkAppColors(
    backgroundBase: Color(0xFFF4F6FC),
    surfaceCard: Color(0xE6FFFFFF),
    surfaceCardElevated: Color(0xFFFFFFFF),
    primary: Color(0xFF4F46E5),
    primaryGlow: Color(0xFF6366F1),
    success: Color(0xFF10B981),
    successGlow: Color(0x1A10B981),
    warning: Color(0xFFF59E0B),
    warningGlow: Color(0x1AF59E0B),
    error: Color(0xFFEF4444),
    errorGlow: Color(0x1AEF4444),
    glassBorder: Color(0x1A000000),
    navBarSurface: Color(0xE6FFFFFF),
    navBarActivePill: Color(0x144F46E5),
  );

  @override
  DarkAppColors copyWith({
    Color? backgroundBase,
    Color? surfaceCard,
    Color? surfaceCardElevated,
    Color? primary,
    Color? primaryGlow,
    Color? success,
    Color? successGlow,
    Color? warning,
    Color? warningGlow,
    Color? error,
    Color? errorGlow,
    Color? glassBorder,
    Color? navBarSurface,
    Color? navBarActivePill,
  }) {
    return DarkAppColors(
      backgroundBase: backgroundBase ?? this.backgroundBase,
      surfaceCard: surfaceCard ?? this.surfaceCard,
      surfaceCardElevated: surfaceCardElevated ?? this.surfaceCardElevated,
      primary: primary ?? this.primary,
      primaryGlow: primaryGlow ?? this.primaryGlow,
      success: success ?? this.success,
      successGlow: successGlow ?? this.successGlow,
      warning: warning ?? this.warning,
      warningGlow: warningGlow ?? this.warningGlow,
      error: error ?? this.error,
      errorGlow: errorGlow ?? this.errorGlow,
      glassBorder: glassBorder ?? this.glassBorder,
      navBarSurface: navBarSurface ?? this.navBarSurface,
      navBarActivePill: navBarActivePill ?? this.navBarActivePill,
    );
  }

  @override
  DarkAppColors lerp(ThemeExtension<DarkAppColors>? other, double t) {
    if (other is! DarkAppColors) return this;
    return DarkAppColors(
      backgroundBase: Color.lerp(backgroundBase, other.backgroundBase, t)!,
      surfaceCard: Color.lerp(surfaceCard, other.surfaceCard, t)!,
      surfaceCardElevated: Color.lerp(
        surfaceCardElevated,
        other.surfaceCardElevated,
        t,
      )!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryGlow: Color.lerp(primaryGlow, other.primaryGlow, t)!,
      success: Color.lerp(success, other.success, t)!,
      successGlow: Color.lerp(successGlow, other.successGlow, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningGlow: Color.lerp(warningGlow, other.warningGlow, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorGlow: Color.lerp(errorGlow, other.errorGlow, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      navBarSurface: Color.lerp(navBarSurface, other.navBarSurface, t)!,
      navBarActivePill: Color.lerp(
        navBarActivePill,
        other.navBarActivePill,
        t,
      )!,
    );
  }
}

/// Builds the premium dark theme configuration
ThemeData getDarkTheme() {
  final baseTheme = ThemeData.dark();
  const d = DarkAppColors.dark;

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: d.backgroundBase,
    colorScheme: ColorScheme.dark(
      primary: d.primary,
      secondary: d.primaryGlow,
      surface: d.surfaceCard,
      onPrimary: Colors.white,
      onSurface: Colors.white,
      error: d.error,
    ),

    // ── Typography: Inter font with smooth opacity hierarchy ─────────────────
    textTheme: GoogleFonts.interTextTheme(baseTheme.textTheme).copyWith(
      displayLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displayLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
          letterSpacing: -1.0,
        ),
      ),
      displayMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displayMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
          letterSpacing: -0.5,
        ),
      ),
      displaySmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.displaySmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
        ),
      ),
      headlineLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.90),
          letterSpacing: -0.5,
        ),
      ),
      headlineMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.90),
        ),
      ),
      headlineSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.headlineSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.90),
        ),
      ),
      titleLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.90),
          fontWeight: FontWeight.w600,
        ),
      ),
      titleMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.88),
          fontWeight: FontWeight.w600,
        ),
      ),
      titleSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.titleSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.88),
          fontWeight: FontWeight.w600,
        ),
      ),
      bodyLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodyLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.85),
          height: 1.6,
        ),
      ),
      bodyMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodyMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.82),
          height: 1.55,
        ),
      ),
      bodySmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.bodySmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.60),
          height: 1.4,
        ),
      ),
      labelLarge: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelLarge?.copyWith(
          color: Colors.white.withValues(alpha: 0.85),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
      labelMedium: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.60),
          fontWeight: FontWeight.w500,
          letterSpacing: 0.8,
        ),
      ),
      labelSmall: GoogleFonts.inter(
        textStyle: baseTheme.textTheme.labelSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.55),
          fontWeight: FontWeight.w500,
          letterSpacing: 1.0,
        ),
      ),
    ),

    extensions: const <ThemeExtension<dynamic>>[DarkAppColors.dark],

    // ── Elevated Buttons: gradient with glow shadow ─────────────────────────
    elevatedButtonTheme: ElevatedButtonThemeData(
      style:
          ElevatedButton.styleFrom(
            backgroundColor: d.primary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.white.withValues(alpha: 0.08),
            disabledForegroundColor: Colors.white.withValues(alpha: 0.38),
            elevation: 0,
            shadowColor: Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ).copyWith(
            backgroundColor: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.pressed)) {
                return const Color(0xFF3730A3);
              }
              if (states.contains(WidgetState.disabled)) {
                return Colors.white.withValues(alpha: 0.08);
              }
              return d.primary;
            }),
            elevation: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.pressed)) {
                return 2;
              }
              return 6;
            }),
            shadowColor: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.pressed)) {
                return Colors.transparent;
              }
              return d.primaryGlow.withValues(alpha: 0.25);
            }),
          ),
    ),

    // ── Outlined Buttons ─────────────────────────────────────────────────────
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        disabledForegroundColor: Colors.white.withValues(alpha: 0.38),

        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    ),

    // ── Text Buttons ─────────────────────────────────────────────────────────
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: d.primaryGlow,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // ── Input Fields: modern dark glass style ───────────────────────────────
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.04),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.50),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      hintStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.30),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      floatingLabelStyle: GoogleFonts.inter(
        color: d.primaryGlow,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.3,
      ),
      prefixIconColor: Colors.white.withValues(alpha: 0.35),
      suffixIconColor: Colors.white.withValues(alpha: 0.35),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: Colors.white.withValues(alpha: 0.06),
          width: 1.2,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: d.primary.withValues(alpha: 0.6),
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: d.error.withValues(alpha: 0.5),
          width: 1.2,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: d.error.withValues(alpha: 0.7),
          width: 1.5,
        ),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: Colors.white.withValues(alpha: 0.04),
          width: 1.0,
        ),
      ),
    ),

    // ── App Bar: transparent, clean ─────────────────────────────────────────
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleSpacing: 0,
      iconTheme: const IconThemeData(color: Colors.white, size: 24),
      actionsIconTheme: const IconThemeData(color: Colors.white, size: 24),
      titleTextStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.92),
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),

    // ── Cards: glass-morphic with subtle border ─────────────────────────────
    cardTheme: CardThemeData(
      color: d.surfaceCard,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: d.glassBorder, width: 1),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),

    // ── Bottom Sheet ─────────────────────────────────────────────────────────
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.transparent,
      elevation: 0,
      modalBackgroundColor: Colors.transparent,
      modalElevation: 0,
      shape: RoundedRectangleBorder(),
      clipBehavior: Clip.antiAlias,
    ),

    // ── Dialog ──────────────────────────────────────────────────────────────
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.surfaceElevated,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: d.glassBorder, width: 1),
      ),
    ),

    // ── Divider ─────────────────────────────────────────────────────────────
    dividerTheme: DividerThemeData(
      color: Colors.white.withValues(alpha: 0.06),
      thickness: 1,
      space: 1,
    ),

    // ── Snackbar ────────────────────────────────────────────────────────────
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.surfaceElevated,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: d.glassBorder, width: 1),
      ),
      contentTextStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.87),
        fontSize: 14,
      ),
      actionTextColor: d.primaryGlow,
    ),

    // ── Chip ─────────────────────────────────────────────────────────────────
    chipTheme: ChipThemeData(
      backgroundColor: Colors.white.withValues(alpha: 0.06),
      disabledColor: Colors.white.withValues(alpha: 0.03),
      selectedColor: d.primary.withValues(alpha: 0.2),
      secondarySelectedColor: d.primary.withValues(alpha: 0.15),
      labelStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.80),
        fontSize: 13,
      ),
      secondaryLabelStyle: GoogleFonts.inter(
        color: Colors.white.withValues(alpha: 0.60),
        fontSize: 13,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
      ),
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    ),

    // ── Switch ──────────────────────────────────────────────────────────────
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return d.primary;
        return Colors.white.withValues(alpha: 0.5);
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return d.primary.withValues(alpha: 0.4);
        }
        return Colors.white.withValues(alpha: 0.12);
      }),
    ),

    // ── Progress Indicator ──────────────────────────────────────────────────
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: d.primary,
      linearTrackColor: Colors.white.withValues(alpha: 0.06),
      circularTrackColor: Colors.white.withValues(alpha: 0.06),
    ),

    // ── Slider ──────────────────────────────────────────────────────────────
    sliderTheme: SliderThemeData(
      activeTrackColor: d.primary,
      inactiveTrackColor: Colors.white.withValues(alpha: 0.10),
      thumbColor: d.primary,
      overlayColor: d.primary.withValues(alpha: 0.12),
      valueIndicatorColor: d.primary,
      valueIndicatorTextStyle: GoogleFonts.inter(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
    ),

    // ── Time Picker / Date Picker ──────────────────────────────────────────
    datePickerTheme: DatePickerThemeData(
      backgroundColor: AppColors.surfaceElevated,
      headerBackgroundColor: d.primary.withValues(alpha: 0.3),
      headerForegroundColor: Colors.white,
      dayForegroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return Colors.white;
        return Colors.white.withValues(alpha: 0.80);
      }),
      dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return d.primary;
        return Colors.transparent;
      }),
      todayForegroundColor: WidgetStateProperty.all(d.primaryGlow),
      todayBackgroundColor: WidgetStateProperty.all(
        d.primary.withValues(alpha: 0.15),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    // ── Floating Action Button ─────────────────────────────────────────────
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: d.primary,
      foregroundColor: Colors.white,
      elevation: 4,
      highlightElevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    // ── Tab Bar ─────────────────────────────────────────────────────────────
    tabBarTheme: TabBarThemeData(
      labelColor: d.primaryGlow,
      unselectedLabelColor: Colors.white.withValues(alpha: 0.45),
      indicatorColor: d.primary,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.3,
      ),
      unselectedLabelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.3,
      ),
    ),

    // ── Scrollbar ──────────────────────────────────────────────────────────
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.15)),
      trackColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.04)),
      thickness: WidgetStateProperty.all(4),
      radius: const Radius.circular(8),
    ),

    // ── Page Transitions ───────────────────────────────────────────────────
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: CupertinoPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}
